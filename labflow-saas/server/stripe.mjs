import {readStripeConfig} from './stripe/config.mjs';
import {stripeClient,verifyEvent,billingError} from './stripe/client.mjs';
import {billingService} from './stripe/service.mjs';
import {laboratoryAdmin,readPlatform} from './stripe/store.mjs';
import {billingPage} from './stripe/page.mjs';
export {readStripeConfig} from './stripe/config.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
async function bodyBytes(req,limit){const chunks=[];let length=0;for await(const chunk of req.body||[]){length+=chunk.length;if(length>limit)throw billingError(413,'BODY_TOO_LARGE','Solicitud demasiado grande.');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);}
export function stripeRoutes({env={},origin,bucket,resolveContract,transport}){
 const config=readStripeConfig(env),service=config.enabled?billingService({bucket,config,origin,resolveContract,api:stripeClient(config.secretKey,transport)}):null;
 return async req=>{
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'');
  const scoped=path.match(/^\/laboratorio\/([a-z0-9-]+)\/(?:api\/billing\/stripe(?:\/([^/]+))?|suscripcion)$/);
  const root=path.startsWith('/api/billing/stripe');if(!scoped&&!root)return null;
  const reply=(data,status,extra)=>req.method==='HEAD'?new Response(null,{status,headers:{...headers,...extra}}):json(data,status,extra);
  try{
   if(url.origin!==origin)throw billingError(404,'NOT_FOUND','Ruta no disponible.');
   if(!config.enabled)throw billingError(503,config.requested?'STRIPE_TEST_CONFIGURATION_REQUIRED':'STRIPE_DISABLED','Stripe de pruebas no está configurado o está desactivado.');
   if(path==='/api/billing/stripe/webhook'){
    if(req.method!=='POST')return reply({error:'Método no permitido.'},405,{Allow:'POST'});
    const raw=await bodyBytes(req,262144),event=verifyEvent(raw,req.headers.get('stripe-signature'),config.webhookSecret);return json(await service.webhook(event,raw));
   }
   if(!scoped)throw billingError(404,'NOT_FOUND','Usa la ruta de tu laboratorio.');
   const page=path.endsWith('/suscripcion'),action=page?'page':scoped[2];if(!['page','status','checkout','portal','reconcile'].includes(action))throw billingError(404,'NOT_FOUND','Ruta no disponible.');
   const method=['page','status'].includes(action)?'GET':'POST';if(req.method!==method)return reply({error:'Método no permitido.'},405,{Allow:method});
   if(method==='POST'&&(req.headers.get('origin')!==origin||!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||'')))throw billingError(403,'CSRF','Origen o formato no autorizado.');
   const {customer}=await laboratoryAdmin(bucket,req,scoped[1]);
   if(page)return new Response(billingPage('/laboratorio/'+customer.slug,config.prices),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
   if(action==='status'){const b=customer.stripeBilling||{};return json({status:b.status||'sin suscripción Stripe',canCheckout:!b.subscriptionId||['canceled','incomplete_expired'].includes(b.status),hasCustomer:!!b.customerId,managed:!!b.managed,access:!!b.access&&b.accessUntil>Date.now(),accessUntil:b.accessUntil||null,plan:b.plan||null,cycle:b.cycle||null,pending:b.pending?{requestId:b.pending.requestId,plan:b.pending.plan,cycle:b.pending.cycle}:null});}
   let body;try{body=JSON.parse((await bodyBytes(req,4096)).toString());}catch(e){if(e.status)throw e;throw billingError(400,'INVALID_BODY','Solicitud inválida.');}
   const allowed=action==='checkout'?['requestId','plan','cycle']:[];if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!allowed.includes(k)))throw billingError(400,'INVALID_BODY','Solo se admiten los campos de esta operación.');
   if(action==='checkout'&&!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId||''))throw billingError(400,'INVALID_REQUEST_ID','Identificador de operación inválido.');
   return json(await service[action](customer,body));
  }catch(error){return reply({error:error.status?error.message:'No se pudo completar la operación de suscripción.',code:error.code||'BILLING_UNAVAILABLE'},error.status||503);}
 };
}
// Keep manual contracts untouched until a verified subscription takes ownership. A disabled
// integration must not silently bypass restrictions already persisted for managed contracts.
export async function stripeAccessGate(bucket,req){
 const match=new URL(req.url).pathname.match(/^\/laboratorio\/([a-z0-9-]+)(\/.*)?$/);if(!match||!match[2]||['/','/api/login','/api/logout'].includes(match[2]))return null;
 const object=await bucket.get('saas/platform-v1.json');if(!object)return null;const state=await object.json(),c=state.customers.find(c=>c.slug===match[1]),b=c?.stripeBilling;
 if(b?.managed&&(!b.access||!(b.accessUntil>Date.now())))return json({error:'La suscripción requiere pago o verificación. El administrador puede consultar /laboratorio/'+c.slug+'/suscripcion.',code:'SUBSCRIPTION_ACCESS_REQUIRED'},402);
 return null;
}
