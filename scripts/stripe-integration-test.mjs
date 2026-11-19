import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {fixture} from './helpers/saas-fixture.mjs';import {fakeStripe,eventFor,signedRequest} from './helpers/stripe-fake.mjs';
import {createApp} from '../server/app.mjs';import {storageBucket} from '../server/storage.mjs';import {openDatabase} from '../server/database.mjs';import {openMysql} from '../server/mysql.mjs';
import {readStripeConfig,priceCatalog} from '../server/stripe/config.mjs';
const base=slug=>'/laboratorio/'+slug+'/api/billing/stripe/';
async function setup(t){const stripe=fakeStripe(),f=await fixture(t,stripe.env,'https://review.test',{stripeTransport:stripe.transport});await f.customer('billing-alpha','silver');await f.customer('billing-beta','silver');const cookie=await f.tenantLogin('billing-alpha');return {f,stripe,cookie};}
async function checkout(f,cookie,body={}){return f.request(base('billing-alpha')+'checkout',{requestId:randomUUID(),plan:'gold',cycle:'monthly',...body},{cookie});}
async function state(f){return (await f.state()).customers.find(c=>c.slug==='billing-alpha');}
async function complete(f,stripe){const c=await state(f);return stripe.complete(c.stripeBilling.pending.sessionId);}
async function webhook(f,event,opts){return f.app(signedRequest(event,opts));}
test('test-only configuration and exact prices; missing/live/production configurations cannot call Stripe',async t=>{
 assert.deepEqual(priceCatalog.map(p=>p.amount),[79000,853200,149000,1609200,249000,2689200,449000,4849200]);
 for(const override of [{STRIPE_ENABLED:'false'},{STRIPE_TEST_MODE:'false'},{STRIPE_SECRET_KEY:'sk_live_forbidden'},{STRIPE_SECRET_KEY:'rk_live_forbidden'},{NODE_ENV:'production'},{STRIPE_PRICE_GOLD_MONTHLY:''}]){const stripe=fakeStripe(),f=await fixture(t,{...stripe.env,...override},'https://review.test',{stripeTransport:stripe.transport});assert.equal(readStripeConfig({...stripe.env,...override}).enabled,false);assert.equal((await f.request('/api/billing/stripe/webhook',{})).status,503);assert.equal(stripe.calls.length,0);assert.equal((await f.request('/')).status,200);}
});
test('only current lab administrator; no provider/cross-tenant/forged identity, CSRF, arbitrary prices or trials',async t=>{
 const {f,stripe,cookie}=await setup(t);
 for(const invalidCookie of ['',f.cookie,await f.tenantLogin('billing-beta')])assert.equal((await checkout(f,invalidCookie)).status,401);
 assert.equal((await f.request(base('billing-alpha')+'checkout',{requestId:randomUUID(),plan:'gold',cycle:'monthly'},{cookie,origin:'https://evil.test'})).status,403);
 for(const extra of [{customer:'cus_foreign'},{price:'price_wrong'},{trialDays:7},{success_url:'https://evil.test'}])assert.equal((await checkout(f,cookie,extra)).status,400);
 assert.equal((await checkout(f,cookie,{plan:'enterprise-custom'})).status,400);
 const c=await state(f),key='saas/tenants/'+c.id+'/public-demo/state-v1.json',lab=await(await f.bucket.get(key)).json();lab.users[0].role='Calidad';await f.bucket.put(key,JSON.stringify(lab));assert.equal((await checkout(f,cookie)).status,403);lab.users[0].role='Administrador';lab.users[0].authVersion++;await f.bucket.put(key,JSON.stringify(lab));assert.equal((await checkout(f,cookie)).status,401);assert.equal(stripe.calls.length,0);
});
test('hosted checkout and portal bind server customer/price, retry concurrently without duplicate session; redirects never grant',async t=>{
 const {f,stripe,cookie}=await setup(t),requestId=randomUUID();
 const responses=await Promise.all([checkout(f,cookie,{requestId}),checkout(f,cookie,{requestId})]);for(const r of responses)assert.equal(r.status,200,await r.clone().text());assert.equal((await responses[0].json()).url,(await responses[1].json()).url);
 assert.equal([...stripe.objects.keys()].filter(p=>p.startsWith('/checkout/')).length,1);assert.equal([...stripe.objects.keys()].filter(p=>p.startsWith('/customers/')).length,1);
 const c=await state(f);assert.equal(c.membership,'silver');assert.equal(c.stripeBilling.managed,undefined);
 const call=stripe.calls.find(c=>c.path==='/checkout/sessions');assert.equal(call.params['line_items[0][price]'],'price_gold_monthly');assert.equal(call.params['line_items[0][quantity]'],'1');assert.equal(call.params['automatic_tax[enabled]'],'true');assert.equal(call.params['subscription_data[trial_period_days]'],undefined);assert.equal(call.params.success_url,'https://review.test/laboratorio/billing-alpha/suscripcion?checkout=returned');
 assert.equal((await checkout(f,cookie)).status,409);assert.equal((await checkout(f,cookie,{requestId,plan:'diamond'})).status,409);
 assert.equal((await f.request('/laboratorio/billing-alpha/suscripcion?checkout=returned&paid=true',null,{cookie})).status,200);assert.equal((await state(f)).membership,'silver');
 const portal=await f.request(base('billing-alpha')+'portal',{}, {cookie});assert.equal(portal.status,200);assert.ok((await portal.json()).url.startsWith('https://billing.stripe.com/'));assert.equal(stripe.calls.at(-1).params.customer,c.stripeBilling.customerId);
});
test('raw-body signatures, timestamps, mode and API version reject invalid events without mutations',async t=>{
 const {f,stripe}=await setup(t),before=await f.bucket.list(),event=eventFor('customer.subscription.updated',{id:'sub_test'});
 for(const opts of [{secret:'wrong'},{time:Math.floor(Date.now()/1000)-301}])assert.equal((await webhook(f,event,opts)).status,400);
 for(const extra of [{livemode:true},{api_version:'old'},{account:'acct_foreign'}])assert.equal((await webhook(f,{...event,...extra})).status,400);
 const original=signedRequest(event),tampered=new Request(original.url,{method:'POST',headers:original.headers,body:JSON.stringify({...event,type:'invoice.paid'})});assert.equal((await f.app(tampered)).status,400);
 assert.deepEqual(await f.bucket.list(),before);assert.equal(stripe.calls.length,0);
});
test('verified paid subscriptions update exactly own contract; duplicate and out-of-order events use authoritative state',async t=>{
 const {f,stripe,cookie}=await setup(t);assert.equal((await checkout(f,cookie)).status,200);const sub=await complete(f,stripe),event=eventFor('customer.subscription.updated',{id:sub.id,status:'canceled'});
 assert.equal((await webhook(f,event)).status,200);let c=await state(f);assert.equal(c.membership,'gold');assert.equal(c.stripeBilling.access,true);assert.equal((await f.state()).customers.find(c=>c.slug==='billing-beta').membership,'silver');
 const before=await f.bucket.list();assert.equal((await webhook(f,event)).status,200);assert.deepEqual(await f.bucket.list(),before);
 assert.equal((await webhook(f,{...event,type:'customer.subscription.deleted'})).status,400);
 sub.status='past_due';assert.equal((await webhook(f,eventFor('customer.subscription.updated',{id:sub.id,status:'active'}))).status,200);assert.equal((await state(f)).stripeBilling.access,false);assert.equal((await f.request('/laboratorio/billing-alpha/api/state',null,{cookie})).status,402);assert.equal((await f.request(base('billing-alpha')+'portal',{}, {cookie})).status,200);
 sub.status='active';assert.equal((await f.request(base('billing-alpha')+'reconcile',{}, {cookie})).status,200);assert.equal((await f.request('/laboratorio/billing-alpha/api/state',null,{cookie})).status,200);
 sub.cancel_at_period_end=true;assert.equal((await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}))).status,200);assert.equal((await state(f)).stripeBilling.access,true);
 sub.status='canceled';assert.equal((await webhook(f,eventFor('customer.subscription.deleted',{id:sub.id}))).status,200);assert.equal((await state(f)).stripeBilling.access,false);
});
test('unpaid/incomplete subscription cannot upgrade manual contract; wrong price, tenant, trials and quantity fail closed',async t=>{
 const {f,stripe,cookie}=await setup(t);await checkout(f,cookie);const sub=await complete(f,stripe);stripe.objects.get('/invoices/'+sub.latest_invoice).status='open';
 assert.equal((await webhook(f,eventFor('customer.subscription.created',{id:sub.id}))).status,200);assert.equal((await state(f)).membership,'silver');assert.equal((await state(f)).stripeBilling.managed,false);
 const good=structuredClone(sub);
 for(const change of [s=>s.metadata.qubo_tenant='other',s=>s.items.data[0].quantity=2,s=>s.trial_end=123,s=>s.items.data[0].price='price_unknown']){Object.assign(sub,structuredClone(good));change(sub);assert.ok((await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}))).status>=400);assert.equal((await state(f)).membership,'silver');}
});
test('failed persistence is not acknowledged, retry succeeds; network errors remain retryable',async t=>{
 const {f,stripe,cookie}=await setup(t);await checkout(f,cookie);const sub=await complete(f,stripe),event=eventFor('invoice.paid',{id:sub.latest_invoice});
 const app=createApp({db:f.db,publicUrl:f.origin,env:f.env,stripeTransport:stripe.transport});t.after(()=>app.close());
 stripe.setHook(({path})=>{if(path.startsWith('/subscriptions/'))throw Error('synthetic network failure');});assert.equal((await webhook(f,event)).status,502);assert.equal((await state(f)).membership,'silver');stripe.setHook(null);
 // Force all platform compare-and-swap writes to lose; no event receipt may be stored.
 const bucket=storageBucket(f.db);const {billingService}=await import('../server/stripe/service.mjs');const {stripeClient}=await import('../server/stripe/client.mjs');const {membershipSaas}=await import('../worker/index.js');
 const service=billingService({bucket:{get:key=>bucket.get(key),put:async()=>null},config:readStripeConfig(f.env),api:stripeClient(f.env.STRIPE_SECRET_KEY,stripe.transport),origin:f.origin,resolveContract:membershipSaas});await assert.rejects(()=>service.webhook(event,Buffer.from(JSON.stringify(event))),e=>e.code==='BILLING_CONFLICT');
 assert.equal((await state(f)).membership,'silver');assert.equal((await app(signedRequest(event))).status,200);assert.equal((await state(f)).membership,'gold');
});
test('separate app instances race safely and persisted receipts/contracts survive a fresh database handle',async t=>{
 const {f,stripe,cookie}=await setup(t);await checkout(f,cookie);const sub=await complete(f,stripe),event=eventFor('checkout.session.completed',{id:(await state(f)).stripeBilling.pending.sessionId});
 const secondDb=f.db.dialect==='mysql'?await openMysql(f.db.testEnv):openDatabase(f.data+'/cubolabs.sqlite');t.after(()=>secondDb.close());
 const app=createApp({db:secondDb,publicUrl:f.origin,env:f.env,stripeTransport:stripe.transport});t.after(()=>app.close());
 const results=await Promise.all([webhook(f,event),app(signedRequest(event))]);assert.ok(results.every(r=>r.status===200));assert.equal((await state(f)).membership,'gold');
 // Close every existing handle/pool, then reopen the persisted database with a new app.
 for(const db of [f.db,secondDb]){await db.close();db.close=async()=>{};}
 const reopened=f.db.dialect==='mysql'?await openMysql(f.db.testEnv):openDatabase(f.data+'/cubolabs.sqlite');
 try{const fresh=createApp({db:reopened,publicUrl:f.origin,env:f.env,stripeTransport:stripe.transport});const duplicate=await fresh(signedRequest(event));assert.equal((await duplicate.json()).duplicate,true);
 const obj=await(await storageBucket(reopened).get('saas/platform-v1.json')).json();assert.equal(Object.keys(obj.stripeEvents).length,1);assert.equal(obj.customers.find(c=>c.slug==='billing-alpha').stripeBilling.subscriptionId,sub.id);
 const status=await fresh(new Request(f.origin+base('billing-alpha')+'status',{headers:{cookie}}));assert.equal(status.status,200);assert.equal((await status.json()).access,true);fresh.close();}finally{await reopened.close();}
});
test('older network response cannot overwrite newer persisted subscription state across handlers',async t=>{
 const {f,stripe,cookie}=await setup(t);await checkout(f,cookie);const sub=await complete(f,stripe);
 let release,entered;const blocked=new Promise(r=>entered=r),hold=new Promise(r=>release=r);let first=true;
 stripe.setHook(async({path})=>{if(path==='/subscriptions/'+sub.id&&first){first=false;const stale=structuredClone(sub);entered();await hold;return new Response(JSON.stringify(stale));}});
 const older=webhook(f,eventFor('customer.subscription.updated',{id:sub.id}));await blocked;sub.status='past_due';const newer=await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}));assert.equal(newer.status,200);release();assert.equal((await older).status,200);const c=await state(f);assert.equal(c.stripeBilling.status,'past_due');assert.equal(c.stripeBilling.access,false);assert.equal(c.membership,'silver');
});
test('invalid catalog prices block checkout; expiration blocks access; manual suspension is never lifted',async t=>{
 const {f,stripe,cookie}=await setup(t),price=stripe.objects.get('/prices/price_gold_monthly'),original=structuredClone(price);
 for(const change of [p=>p.unit_amount++,p=>p.currency='usd',p=>p.tax_behavior='exclusive',p=>p.tax_behavior='unspecified',p=>p.recurring.interval='year',p=>p.livemode=true]){Object.assign(price,structuredClone(original));change(price);assert.ok((await checkout(f,cookie)).status>=400);assert.equal((await state(f)).stripeBilling,undefined);}Object.assign(price,original);
 await checkout(f,cookie);const sub=await complete(f,stripe);await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}));
 const platform=await(await f.bucket.get('saas/platform-v1.json')).json(),customer=platform.customers.find(c=>c.slug==='billing-alpha');customer.stripeBilling.accessUntil=Date.now()-1;await f.bucket.put('saas/platform-v1.json',JSON.stringify(platform));assert.equal((await f.request('/laboratorio/billing-alpha/api/state',null,{cookie})).status,402);
 customer.status='Suspendido';await f.bucket.put('saas/platform-v1.json',JSON.stringify(platform));assert.equal((await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}))).status,200);assert.equal((await state(f)).status,'Suspendido');assert.equal((await f.request('/laboratorio/billing-alpha/api/state',null,{cookie})).status,403);
});
test('checkout retries after response loss use stable idempotency; no new operation after subscription binding',async t=>{
 const {f,stripe,cookie}=await setup(t);let fail=true;const original=stripe.transport;const unreliable=async(url,options)=>{const r=await original(url,options);if(url.endsWith('/checkout/sessions')&&fail){fail=false;throw Error('response lost');}return r;};
 const app=createApp({db:f.db,publicUrl:f.origin,env:f.env,stripeTransport:unreliable});t.after(()=>app.close());const requestId=randomUUID(),request=()=>new Request(f.origin+base('billing-alpha')+'checkout',{method:'POST',headers:{cookie,origin:f.origin,'content-type':'application/json'},body:JSON.stringify({requestId,plan:'gold',cycle:'monthly'})});
 assert.equal((await app(request())).status,502);assert.equal((await app(request())).status,200);assert.equal([...stripe.objects.keys()].filter(p=>p.startsWith('/checkout/')).length,1);const sub=await complete(f,stripe);assert.equal((await webhook(f,eventFor('customer.subscription.created',{id:sub.id}))).status,200);assert.equal((await checkout(f,cookie)).status,409);
});
test('paid old invoice cannot authorize an unpaid upgrade or extend access beyond its paid period',async t=>{
 const {f,stripe,cookie}=await setup(t);await checkout(f,cookie);const sub=await complete(f,stripe);await webhook(f,eventFor('customer.subscription.created',{id:sub.id}));assert.equal((await state(f)).membership,'gold');
 sub.items.data[0].price='price_diamond_monthly';await webhook(f,eventFor('customer.subscription.updated',{id:sub.id}));assert.equal((await state(f)).membership,'gold');assert.equal((await state(f)).stripeBilling.access,false);
 const invoice=stripe.objects.get('/invoices/'+sub.latest_invoice);invoice.lines.data[0].pricing.price_details.price='price_diamond_monthly';invoice.lines.data[0].period.end=Math.floor(Date.now()/1000)+120;await webhook(f,eventFor('invoice.paid',{id:invoice.id}));const c=await state(f);assert.equal(c.membership,'diamond');assert.ok(c.stripeBilling.accessUntil<=invoice.lines.data[0].period.end*1000);
});
