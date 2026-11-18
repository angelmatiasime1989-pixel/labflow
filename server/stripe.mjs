// Server-only preparation. No Stripe SDK, network calls or billing mutations exist here.
export function readStripeConfig(env={}) {
 return {
  requested:env.STRIPE_ENABLED==='true',
  enabled:false, // Implementation and verification are required; configuration cannot unlock billing.
  secretKey:env.STRIPE_SECRET_KEY||'',
  webhookSecret:env.STRIPE_WEBHOOK_SECRET||'',
  prices:Object.fromEntries(['silver','gold','platinum','diamond'].map(plan=>[plan,
   Object.fromEntries(['monthly','annual'].map(cycle=>[cycle,env[`STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`]||'']))]))
 };
}
const prefix='/api/billing/stripe';
const reserved=new Set(['checkout','portal','webhook'].map(action=>prefix+'/'+action));
export function stripeRoutes({env={},origin}) {
 const requested=env.STRIPE_ENABLED==='true';
 return req=>{
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,'');
  const scoped=path.replace(/^\/laboratorio\/[a-z0-9-]+/,'');
  if(scoped!==prefix&&!scoped.startsWith(prefix+'/'))return null;
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const reply=(status,code,error,extra={})=>new Response(req.method==='HEAD'?null:JSON.stringify({error,code}),{status,headers:{...headers,...extra}});
  if(url.origin!==origin||scoped!==path||!reserved.has(path))return reply(404,'NOT_FOUND','Ruta no disponible.');
  if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED','Método no permitido.',{Allow:'POST'});
  // Never consume a webhook body, acknowledge an event, trust a redirect or grant access.
  return requested
   ?reply(501,'STRIPE_NOT_IMPLEMENTED','La integración de pagos todavía no está implementada.')
   :reply(503,'STRIPE_DISABLED','La integración de pagos está desactivada.');
 };
}
