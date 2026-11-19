import {stripeRoutes,stripeAccessGate} from './stripe.mjs';
import {offlineAssets,offlineRoutes} from './offline/routes.mjs';
import {PublicTrialStore,validateTrialLocation} from './public-trial/store.mjs';
import {publicTrialRoutes} from './public-trial/routes.mjs';
import {fileURLToPath} from 'node:url';
import {finalizeSeo} from './seo.mjs';
import {pwaResponse,pwaHead,pwaRegistration} from './pwa.mjs';
import {tenantSlugForHost} from './tenant-hosts.mjs';
import worker,{membershipSaas} from '../worker/index.js';
import {readFileSync} from 'node:fs';
import {storageBucket} from './storage.mjs';
import {providerAuth,providerSession} from './auth.mjs';
const changePassword=readFileSync(new URL('./change-password.html',import.meta.url),'utf8');
const login=readFileSync(new URL('./login.html',import.meta.url),'utf8');
export function createApp({db,publicUrl,env={},stripeTransport}){
 const origin=new URL(publicUrl).origin,secure=origin.startsWith('https:'),bucket=storageBucket(db);
 let trialStore=null;
 if(env.PUBLIC_TRIAL_ENABLED==='true')try{trialStore=new PublicTrialStore({file:validateTrialLocation(env.PUBLIC_TRIAL_DB,{dataDir:env.DATA_DIR,backupDir:env.BACKUP_DIR,root:fileURLToPath(new URL('../',import.meta.url))})});}catch{console.error('Prueba pública desactivada: revisa su base dedicada, rutas, permisos y política de respaldos. El sistema principal sigue disponible.');}
 const trialRoutes=publicTrialRoutes(trialStore,{origin});
 const stripeHandler=stripeRoutes({env,origin,bucket,resolveContract:membershipSaas,transport:stripeTransport});
 const bindings={BUCKET:bucket,PUBLIC_TRIAL_AVAILABLE:String(!!trialStore),...Object.fromEntries(['SALES_ENABLED','SALES_CHANNEL','SALES_TO','RESEND_API_KEY','EMAIL_FROM','OPENAI_API_KEY','OPENAI_MODEL','QUBITO_TENANT_HOURLY_LIMIT','QUBITO_TENANT_MONTHLY_LIMIT','TENANT_SUBDOMAINS_ENABLED'].filter(k=>env[k]).map(k=>[k,env[k]]))};
 let offlineEnabled=env.OFFLINE_DOCUMENTS_ENABLED==='true',offlineHandler;
 try{offlineHandler=offlineRoutes({db,origin,worker,bindings,enabled:offlineEnabled});}catch{offlineEnabled=false;offlineHandler=async req=>/^\/laboratorio\/[a-z0-9-]+\/api\/offline\//.test(new URL(req.url).pathname)?new Response(JSON.stringify({error:'La consulta offline está temporalmente indisponible; conserva las copias existentes.',code:'OFFLINE_TEMPORARILY_UNAVAILABLE'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}):null;console.error('Consulta offline desactivada: revisa permisos de las tablas de dispositivos. El sistema principal sigue disponible.');}
 async function handle(req,{ip='local',waitUntil=p=>p.catch(()=>{})}={}){
  let url=new URL(req.url);const physicalPath=url.pathname+url.search;const externalOrigin=url.origin,slug=tenantSlugForHost(url,origin);
  if(externalOrigin!==origin&&!slug)return new Response('Origen no autorizado',{status:400});
  if((slug&&(/^\/api\/trial(?:\/|$)|^\/prueba-documental(?:\/|$)/.test(url.pathname)))||/^\/laboratorio\/[a-z0-9-]+\/(?:api\/trial|prueba-documental)(?:\/|$)/.test(url.pathname))return new Response('Prueba pública no disponible en este espacio',{status:404,headers:{'Cache-Control':'no-store'}});
  if(!slug){const trial=await trialRoutes(req,{ip});if(trial)return trial;}
  if(slug&&['GET','HEAD'].includes(req.method)&&/^\/(?:preguntas-frecuentes|privacidad|terminos|blog)(?:\/|$)/.test(url.pathname))return Response.redirect(origin+url.pathname+url.search+url.hash,302);
  if(slug&&url.pathname.startsWith('/assets/')&&['GET','HEAD'].includes(req.method))return worker.fetch(new Request(origin+url.pathname,{method:req.method}),bindings,{});
  const offlineAsset=offlineAssets(url.pathname,req.method);if(offlineAsset)return offlineAsset;
  const publicPwa=pwaResponse(url.pathname,{tenant:!!slug,method:req.method});if(publicPwa)return publicPwa;
  if(slug&&(url.pathname.startsWith('/api/billing/stripe')||url.pathname==='/suscripcion'))return new Response('Gestiona la suscripción desde el dominio principal y la ruta de tu laboratorio.',{status:404});
  if(slug){
   if(/^\/(?:admin(?:istrador)?|api\/(?:saas|provider)|laboratorio)(?:\/|$)/.test(url.pathname))return new Response('Ruta no disponible',{status:404});
   const incomingHeaders=new Headers(req.headers);const requestOrigin=incomingHeaders.get('origin');
   if(!['GET','HEAD','OPTIONS'].includes(req.method)&&requestOrigin!==externalOrigin)return new Response('Origen no autorizado',{status:403});
   if(requestOrigin===externalOrigin)incomingHeaders.set('origin',origin);
   url=new URL(origin+'/laboratorio/'+slug+url.pathname+url.search);req=new Request(url, new Request(req,{headers:incomingHeaders}));
  }
  const stripeResponse=await stripeHandler(req);if(stripeResponse)return stripeResponse;
  const billingAccess=await stripeAccessGate(bucket,req);if(billingAccess)return billingAccess;
  // Path links work on the main domain until the operator explicitly enables verified subdomains.
  const entryPath=!slug&&url.pathname.match(/^\/laboratorio\/([a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9]))\/?$/);
  if(entryPath&&env.TENANT_SUBDOMAINS_ENABLED==='true'&&['GET','HEAD'].includes(req.method)){
   const object=await bucket.get('saas/platform-v1.json'),platform=object?await object.json():null;
   if(platform?.customers.some(c=>c.slug===entryPath[1]&&c.status==='Activo')){const target=new URL(origin);target.hostname=entryPath[1]+'.'+target.hostname;target.pathname='/';if(tenantSlugForHost(target.origin,origin))return new Response(null,{status:302,headers:{location:target.origin+'/'+url.search,'cache-control':'no-store'}});}
  }
  const offlineResponse=await offlineHandler(req,{physicalPath});if(offlineResponse)return offlineResponse;
  const auth=await providerAuth(req,db,{origin,ip,secure});if(auth)return auth;
  const user=slug?null:await providerSession(db,req.headers.get('cookie')||'');
  if(url.pathname==='/administrador/cambiar-contrasena'){if(!user)return Response.redirect(origin+'/administrador/ingresar',303);if(!['GET','HEAD'].includes(req.method))return new Response('Método no permitido',{status:405});return new Response(changePassword,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
  if(user?.mustChangePassword){if(url.pathname.startsWith('/api/saas/'))return new Response(JSON.stringify({error:'Cambia la contraseña temporal antes de acceder al panel.',code:'PASSWORD_CHANGE_REQUIRED',redirect:'/administrador/cambiar-contrasena'}),{status:403,headers:{'content-type':'application/json','cache-control':'no-store'}});if(['/admin','/admin/','/administrador/ingresar'].includes(url.pathname))return Response.redirect(origin+'/administrador/cambiar-contrasena',303);}
  if(url.pathname==='/admin/'&&!user)return Response.redirect(origin+'/admin',303);
  if(url.pathname==='/administrador/ingresar'||(url.pathname==='/admin'&&!user))return user?Response.redirect(origin+'/admin/',303):new Response(login,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
  if(['/admin','/admin/'].includes(url.pathname)&&!user)return Response.redirect(origin+'/administrador/ingresar',303);
  if(url.pathname.startsWith('/api/saas/')&&!user)return new Response(JSON.stringify({error:'Inicia sesión como administrador del servicio.'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  const headers=new Headers(req.headers);for(const key of [...headers.keys()])if(/^(oai-|x-forwarded-|x-authenticated-)/i.test(key))headers.delete(key);
  headers.set('cf-connecting-ip',String(ip));
  if(user&&!user.mustChangePassword){headers.set('oai-authenticated-user-id',user.id);headers.set('oai-authenticated-user-full-name',encodeURIComponent(user.name));headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');}
  const tenantPrefix=!slug?url.pathname.match(/^(\/laboratorio\/[a-z0-9-]+)/)?.[1]||'':'';const responsePwaHead=pwaHead.replace('/manifest.webmanifest',tenantPrefix+'/manifest.webmanifest');
  const response=await worker.fetch(new Request(req,{headers}),bindings,{waitUntil});const outputHeaders=new Headers(response.headers);
  if(!secure&&outputHeaders.has('set-cookie'))outputHeaders.set('set-cookie',outputHeaders.get('set-cookie').replace(/;\s*Secure/gi,''));
  outputHeaders.set('x-content-type-options','nosniff');outputHeaders.set('referrer-policy','same-origin');outputHeaders.set('x-frame-options','SAMEORIGIN');
  if(secure)outputHeaders.set('strict-transport-security','max-age=31536000');
  if(slug){
   const prefix='/laboratorio/'+slug;
   if(outputHeaders.has('set-cookie'))outputHeaders.set('set-cookie',outputHeaders.get('set-cookie').replace('Path='+prefix+'/','Path=/'));
   if(outputHeaders.has('location')){const target=new URL(outputHeaders.get('location'),origin);if(target.origin===origin&&target.pathname.startsWith(prefix+'/')){target.pathname=target.pathname.slice(prefix.length);outputHeaders.set('location',externalOrigin+target.pathname+target.search+target.hash);}}
   if((outputHeaders.get('content-type')||'').includes('text/html'))return new Response((await response.text()).replaceAll(prefix+'/', '/').replace('</head>',responsePwaHead+'<script>window.QUBO_OFFLINE_ENABLED='+String(offlineEnabled)+';</script></head>').replace(/<\/body>(?=\s*<\/html>\s*$)/,pwaRegistration+'</body>'),{status:response.status,headers:outputHeaders});
  }
  if((outputHeaders.get('content-type')||'').includes('text/html'))return new Response((await response.text()).replace('</head>',responsePwaHead+'<script>window.QUBO_OFFLINE_ENABLED='+String(offlineEnabled)+';</script></head>').replace(/<\/body>(?=\s*<\/html>\s*$)/,pwaRegistration+'</body>'),{status:response.status,headers:outputHeaders});
  return new Response(response.body,{status:response.status,headers:outputHeaders});
 };
 const application=async function(req,context){const response=await handle(req,context);return finalizeSeo(response,req,{origin,bucket,verification:env.GOOGLE_SITE_VERIFICATION||''});};
 application.close=()=>trialStore?.close();application.featureStatus={publicTrial:!!trialStore,offlineDocuments:offlineEnabled};return application;
}
