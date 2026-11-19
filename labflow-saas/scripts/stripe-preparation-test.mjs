import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/saas-fixture.mjs';
import {readStripeConfig,stripeRoutes} from '../server/stripe.mjs';
const routes=['checkout','portal','webhook'].map(name=>'/api/billing/stripe/'+name);
const secrets={STRIPE_SECRET_KEY:'synthetic-secret-never-public',STRIPE_WEBHOOK_SECRET:'synthetic-webhook-never-public',STRIPE_PRICE_SILVER_MONTHLY:'synthetic-price-never-public'};
for(const requested of [false,true])test(`reserved Stripe routes cannot grant access or write billing data (requested=${requested})`,async t=>{
 const f=await fixture(t,requested?{...secrets,STRIPE_ENABLED:'true'}:{});
 await f.customer('stripe-qa','silver');const labCookie=await f.tenantLogin('stripe-qa');
 const before=await f.bucket.list();const state=await f.state();
 for(const path of routes)for(const cookie of ['',f.cookie,labCookie]){
  const r=await f.request(path,{type:'checkout.session.completed',membership:'diamond',paid:true,trialDays:7},{cookie,headers:{'stripe-signature':'unverified','oai-authenticated-user-id':'forged'}});
  assert.equal(r.status,503);assert.equal((await r.json()).code,requested?'STRIPE_TEST_CONFIGURATION_REQUIRED':'STRIPE_DISABLED');
  assert.equal(r.headers.get('cache-control'),'no-store, private');assert.equal(r.headers.get('location'),null);assert.equal(r.headers.get('set-cookie'),null);
 }
 for(const path of routes){
  for(const method of ['GET','HEAD','PUT','OPTIONS']){const r=await f.request(path,null,{method});assert.equal(r.status,503);if(method==='HEAD')assert.equal(await r.text(),'');}
  const scoped=await f.request('/laboratorio/stripe-qa'+path,{paid:true},{cookie:labCookie});assert.equal(scoped.status,503);
  const subdomain=await f.app(new Request('https://stripe-qa.review.test'+path,{method:'POST',body:'not-json'}));assert.equal(subdomain.status,404);
 }
 assert.equal((await f.request('/api/billing/stripe/unknown',{})).status,503);
 assert.deepEqual(await f.state(),state);assert.deepEqual(await f.bucket.list(),before);
 assert.equal((await f.request('/laboratorio/stripe-qa/api/state',null,{cookie:labCookie})).status,200);
 assert.equal((await f.request('/api/saas/state',null,{cookie:''})).status,401);
 for(const path of ['/','/entrar','/admin','/api/saas/state','/prueba-documental']){const r=await f.request(path);assert.equal(r.status,200,path);const body=await r.text();for(const value of Object.values(secrets))assert.ok(!body.includes(value),path+' leaked configuration');}
});
test('configuration is server-only, supports both cycles and cannot enable Stripe',()=>{
 const defaults=readStripeConfig();assert.equal(defaults.enabled,false);assert.equal(defaults.requested,false);assert.equal(defaults.secretKey,'');
 const env={...secrets,STRIPE_ENABLED:'true'};
 for(const plan of ['SILVER','GOLD','PLATINUM','DIAMOND'])for(const cycle of ['MONTHLY','ANNUAL'])env[`STRIPE_PRICE_${plan}_${cycle}`]=`synthetic-${plan}-${cycle}`;
 const config=readStripeConfig(env);assert.equal(config.enabled,false);assert.equal(config.requested,true);assert.equal(config.secretKey,secrets.STRIPE_SECRET_KEY);assert.equal(config.webhookSecret,secrets.STRIPE_WEBHOOK_SECRET);
 assert.equal(config.prices.length,8);for(const p of config.prices)assert.equal(p.id,`synthetic-${p.plan.toUpperCase()}-${p.cycle.toUpperCase()}`);
});
test('disabled webhook never consumes or acknowledges even malformed event bodies',async()=>{
 const handler=stripeRoutes({env:{STRIPE_ENABLED:'true'},origin:'https://review.test'});
 const req=new Request('https://review.test/api/billing/stripe/webhook',{method:'POST',body:'invalid JSON',headers:{'stripe-signature':'forged'}});
 assert.equal((await handler(req)).status,503);assert.equal(req.bodyUsed,false);
 assert.equal(await handler(new Request('https://review.test/api/other')),null);
});
