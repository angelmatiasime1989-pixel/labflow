import {randomUUID,createHash} from 'node:crypto';
import {readStripeConfig,priceCatalog} from './stripe/config.mjs';
import {mutatePlatform,laboratoryAdmin} from './stripe/store.mjs';
import {billingError} from './stripe/client.mjs';
import {onboardingPage,welcomePage,billingUnavailablePage} from './onboarding-page.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const html=value=>new Response(value,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
export function onboardingConfig(env={}){const days=15;return {enabled:env.SELF_SERVICE_TEST_ENABLED==='true'&&env.NODE_ENV!=='production'&&env.STRIPE_TEST_MODE==='true'&&Number.isInteger(days)&&days>=1&&days<=30,days,stripeAvailable:readStripeConfig(env).enabled};}
export function onboardingRoutes({env,origin,bucket,resolveContract,seedTenant,initialize}){
 const config=onboardingConfig(env);
 return async req=>{
  const url=new URL(req.url),path=url.pathname,unavailable=config.enabled&&!config.stripeAvailable&&path.match(/^\/laboratorio\/([a-z0-9-]+)\/suscripcion$/),match=path.match(/^\/laboratorio\/([a-z0-9-]+)\/prueba$/);
  if(!['/registro-prueba','/registrarse','/contratar','/api/onboarding/config','/api/onboarding/register'].includes(path)&&!match&&!unavailable)return null;
  try{
   if(url.origin!==origin)throw billingError(404,'NOT_FOUND','Ruta no disponible.');
   if(path==='/registro-prueba'&&req.method==='GET')return Response.redirect(origin+'/contratar?intent=trial',303);
   if(path==='/api/onboarding/config'&&req.method==='GET')return json(config.enabled?config:{enabled:false});
   if(!config.enabled){if(req.method==='GET'&&!path.startsWith('/api/'))return html(onboardingPage({enabled:false}));throw billingError(503,'ONBOARDING_DISABLED','El registro de pruebas no está habilitado.');}
   if(unavailable){if(req.method!=='GET')throw billingError(405,'METHOD_NOT_ALLOWED','Método no permitido.');const {customer}=await laboratoryAdmin(bucket,req,unavailable[1]);return html(billingUnavailablePage(customer,priceCatalog.find(p=>p.plan===url.searchParams.get('plan')&&p.cycle===url.searchParams.get('cycle'))));}
   if(match){if(req.method!=='GET')throw billingError(405,'METHOD_NOT_ALLOWED','Método no permitido.');const {customer}=await laboratoryAdmin(bucket,req,match[1]);if(!customer.selfService)throw billingError(404,'NOT_FOUND','Este espacio no procede del registro de pruebas.');return html(welcomePage(customer));}
   if(['/registro-prueba','/registrarse','/contratar'].includes(path)&&req.method==='GET')return html(onboardingPage({...config,trial:url.searchParams.get('intent')==='trial',registration:path==='/registrarse',prices:priceCatalog}));
   if(path!=='/api/onboarding/register'||req.method!=='POST')throw billingError(405,'METHOD_NOT_ALLOWED','Método no permitido.');
   if(req.headers.get('origin')!==origin||!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))throw billingError(403,'CSRF','Origen no autorizado.');
   const chunks=[];let length=0;for await(const chunk of req.body||[]){length+=chunk.length;if(length>8192)throw billingError(413,'BODY_TOO_LARGE','Solicitud demasiado grande.');chunks.push(Buffer.from(chunk));}
   let b;try{b=JSON.parse(Buffer.concat(chunks).toString());}catch{throw billingError(400,'INVALID_BODY','Solicitud inválida.');}
   if(!b||Array.isArray(b)||Object.keys(b).some(k=>!['mode','name','email','slug','username','password','plan','cycle','consent'].includes(k))||!['account','paid','stripe-trial'].includes(b.mode)||b.consent!==true)throw billingError(400,'INVALID_BODY','Confirma las condiciones del entorno de pruebas.');
   const name=String(b.name||'').trim(),slug=String(b.slug||'').trim().toLowerCase(),email=String(b.email||'').trim().toLowerCase(),username=String(b.username||'').trim().toLowerCase();
   if(name.length<3||name.length>160||!/^test-[a-z0-9][a-z0-9-]{1,42}[a-z0-9]$/.test(slug)||email.length>200||!/^\S+@\S+\.\S+$/.test(email)||!/^\w[\w.-]{2,39}$/.test(username)||typeof b.password!=='string'||b.password.length<12||b.password.length>128||b.password==='DemoLab2026!')throw billingError(400,'INVALID_REGISTRATION','Usa nombre, correo válido, identificador test-… y contraseña nueva de 12 a 128 caracteres.');
   if(!priceCatalog.some(p=>p.plan===b.plan&&p.cycle===b.cycle))throw billingError(400,'INVALID_PLAN','Selecciona un plan y periodicidad; Enterprise requiere cotización.');
   await initialize();
   const emailDigest=createHash('sha256').update(email).digest('hex'),id=randomUUID(),createdAt=new Date().toISOString();
   // Hard sandbox capacity and a durable one-registration-per-email limit. Verification
   // and public signup anti-abuse policies remain prerequisites for production.
   const check=state=>{if(state.customers.some(c=>c.slug===slug||c.selfService?.emailDigest===emailDigest))throw billingError(409,'REGISTRATION_EXISTS','Ya existe ese espacio o registro. Ingresa con tus credenciales.');if(state.customers.filter(c=>c.selfService).length>=50)throw billingError(503,'SANDBOX_CAPACITY','El entorno alcanzó su capacidad de pruebas.');};
   const current=await(await bucket.get('saas/platform-v1.json')).json();check(current);
   const contract=resolveContract('silver',current.catalog,current.membershipPlans),customer={id,name,slug,email,legalName:name,membership:'silver',modules:contract.modules,tools:contract.tools,status:'Activo',adminUsername:username,createdAt,updatedAt:createdAt,selfService:{mode:b.mode,emailDigest,createdAt,expiresAt:null,selection:{plan:b.plan,cycle:b.cycle}}};
   const tenant=await seedTenant(customer,b.password,username),key='saas/tenants/'+id+'/public-demo/state-v1.json';
   const saved=await bucket.put(key,JSON.stringify(tenant),{onlyIf:{etagDoesNotMatch:'*'}});if(!saved)throw billingError(409,'REGISTRATION_CONFLICT','Reintenta el registro.');
   try{await mutatePlatform(bucket,state=>{check(state);const latest=resolveContract('silver',state.catalog,state.membershipPlans);customer.modules=latest.modules;customer.tools=latest.tools;state.customers.push(customer);return {};});}catch(error){await bucket.delete(key);throw error;}
   return json({slug,expiresAt:customer.selfService.expiresAt,next:'/laboratorio/'+slug+'/suscripcion?plan='+b.plan+'&cycle='+b.cycle+'&intent='+(b.mode==='stripe-trial'?'trial':'paid')+'&registered=1'},201);
  }catch(error){return json({error:error.status?error.message:'No se pudo completar el registro.',code:error.status?error.code:'ONBOARDING_UNAVAILABLE'},error.status||503);}
 };
}
export async function onboardingGate(bucket,req){const match=new URL(req.url).pathname.match(/^\/laboratorio\/([a-z0-9-]+)(\/.*)?$/);if(!match||!match[2]||['/','/api/login','/api/logout'].includes(match[2]))return null;const object=await bucket.get('saas/platform-v1.json');if(!object)return null;const customer=(await object.json()).customers.find(c=>c.slug===match[1]),s=customer?.selfService,b=customer?.stripeBilling;if(!s)return null;if(b?.managed&&b.access&&b.accessUntil>Date.now())return null;if(s.mode==='trial'&&s.expiresAt>Date.now()&&!b?.managed)return null;return json({error:s.mode==='trial'?'El periodo de prueba terminó. No hay cobro ni renovación automática.':'El espacio está pendiente de una suscripción pagada y verificada.',code:'SUBSCRIPTION_ACCESS_REQUIRED'},402);}
