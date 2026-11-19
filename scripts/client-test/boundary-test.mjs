import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {fixture} from '../helpers/saas-fixture.mjs';import {mailService} from '../../server/mail/service.mjs';import {readStripe} from '../../server/finance/stripe-read.mjs';import {fakeStripe} from '../helpers/stripe-fake.mjs';import {laboratoryAdmin} from '../../server/stripe/store.mjs';
const enabledMail={TRANSACTIONAL_EMAIL_ENABLED:'true',RESEND_DOMAIN_VERIFIED:'true',RESEND_API_VERIFIED:'true',RESEND_API_KEY:'re_SyntheticOnly',EMAIL_FROM:'sender@example.test',RESEND_ALLOWED_RECIPIENTS:'recipient@example.test',OPENAI_API_KEY:'SyntheticOnly'};
test('global-only immutable internal test flag excludes metrics and prevents outbound actions without changing real tenants',async t=>{
 let calls=0;const f=await fixture(t,{...fakeStripe().env,...enabledMail},undefined,{mailTransport:async()=>{calls++;return Response.json({id:'mock'});},stripeTransport:async()=>{calls++;throw Error('Unexpected external call');}});
 const real=await f.customer('real-control'),before=await(await f.bucket.get(real.key)).text();const baseline=f.platform.customerMetrics;
 const created=await f.post('/api/saas/customer',{name:'Cliente Prueba FICTICIO',slug:'internal-test',membership:'diamond',internalTest:true,status:'Activo',adminUsername:'lab-admin',password:'Synthetic-Lab-2026!',email:'recipient@example.test'});
 assert.deepEqual(f.platform.customerMetrics,{...baseline,internalTests:1});const marked=f.platform.customers.find(c=>c.id===created.id);assert.equal(marked.internalTest,true);assert.ok(marked.internalTestCreatedAt);assert.ok(marked.internalTestCreatedBy);assert.ok(f.platform.audit.some(a=>a.customerId===marked.id&&a.details.internalTest===true));
 const cookie=await f.tenantLogin('internal-test'),base='/laboratorio/internal-test';const state=await(await f.request(base+'/api/state',null,{cookie})).json();assert.equal(state.saasTenant.internalTest,true);assert.equal(state.saasTenant.membership,'diamond');assert.match(await(await f.request(base+'/',null,{cookie})).text(),/LABORATORIO INTERNO DE PRUEBAS/);
 assert.equal((await f.request('/api/saas/customer',{revision:f.platform.revision,...marked,internalTest:false},{cookie})).status,401);
 for(const [c,value] of [[marked,false],[f.platform.customers.find(c=>c.id===real.id),true]])assert.equal((await f.request('/api/saas/customer',{...c,revision:f.platform.revision,internalTest:value})).status,409);
 assert.equal((await f.request('/api/saas/customer',{...marked,revision:f.platform.revision,internalTest:'true'})).status,400);
 for(const path of ['config','test','retry'])assert.equal((await f.request(base+'/api/email35/'+path,{revision:state.revision,enabled:true,to:'recipient@example.test'},{cookie})).status,403);
 assert.equal((await f.request(base+'/api/fiscal30/import',{revision:state.revision,xml:'synthetic'},{cookie})).status,403);
 assert.equal((await f.request('/api/saas/payment',{revision:f.platform.revision,customerId:marked.id,action:'register',requestId:randomUUID(),amount:'100.00'})).status,403);
 for(const action of ['checkout','portal','reconcile'])assert.equal((await f.request(base+'/api/billing/stripe/'+action,{requestId:randomUUID(),plan:'diamond',cycle:'monthly'},{cookie})).status,403);
 await assert.rejects(()=>laboratoryAdmin(f.bucket,new Request(f.origin+base+'/api/billing/stripe/checkout',{headers:{cookie}}),'internal-test'),e=>e.code==='INTERNAL_TEST');
 assert.equal((await f.request('/api/account/recovery/request',{slug:'internal-test',username:'lab-admin'},{cookie:''})).status,202);
 const mail=mailService({bucket:f.bucket,origin:f.origin,env:enabledMail,transport:async()=>{calls++;return Response.json({id:'mock'});}});await mail.welcome(marked.id);assert.equal(calls,0);
 assert.equal(await(await f.bucket.get(real.key)).text(),before);assert.equal(await f.bucket.get('saas/finance-v1.json'),null);
 // Missing flag in a stored pre-existing customer remains ordinary; reads do not migrate it.
 const raw=await(await f.bucket.get('saas/platform-v1.json')).json();delete raw.customers.find(c=>c.id===real.id).internalTest;await f.bucket.put('saas/platform-v1.json',JSON.stringify(raw));await f.state();assert.equal(f.platform.customerMetrics.registered,1);assert.equal(f.platform.customers.find(c=>c.id===real.id).internalTest,undefined);
});
test('global Stripe finance fails visibly closed for an invalid test linkage and leaves unlinked real reporting unchanged',async()=>{
 let calls=0;const input={env:{STRIPE_FINANCE_ENABLED:'true',STRIPE_FINANCE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_SyntheticOnly'},start:0,end:9999999999,timezone:'America/Monterrey',transport:async()=>{calls++;return Response.json({data:[],has_more:false});}};
 const ordinary=await readStripe({...input,customers:[{id:'real'},{id:'test',internalTest:true}]});assert.equal(ordinary.available,true);assert.equal(calls,2);
 const blocked=await readStripe({...input,customers:[{id:'real'},{id:'test',internalTest:true,stripeBilling:{customerId:'cus_synthetic'}}]});assert.equal(blocked.available,false);assert.match(blocked.reason,/pruebas.*Stripe/);assert.equal(calls,2);
});
test('saving through global admin suppresses test welcome and preserves commercial and finance totals on repeated edits',async t=>{
 let mailCalls=0,financeCalls=0;
 const row={id:'txn_control',created:Date.parse('2026-01-10T12:00:00Z')/1000,amount:200000,fee:10000,net:190000,currency:'mxn',type:'charge',status:'available',source:{livemode:true}};
 const f=await fixture(t,{...enabledMail,STRIPE_FINANCE_ENABLED:'true',STRIPE_FINANCE_MODE:'live',STRIPE_SECRET_KEY:'rk_live_SyntheticNeverReal'},undefined,{mailTransport:async()=>{mailCalls++;return Response.json({id:'simulated-welcome'});},financeClock:()=>Date.parse('2026-11-19T12:00:00Z'),financeTransport:async url=>{financeCalls++;return Response.json({data:new URL(url).pathname.endsWith('balance_transactions')?[row,row]:[],has_more:false});}});
 async function save(body){const jobs=[];const r=await f.app(new Request(f.origin+'/api/saas/customer',{method:'POST',headers:{origin:f.origin,cookie:f.cookie,'content-type':'application/json'},body:JSON.stringify({revision:f.platform.revision,...body})}),{waitUntil:p=>jobs.push(p)});assert.equal(r.status,200,await r.clone().text());await Promise.all(jobs);await f.state();return r.json();}
 const ordinary={name:'Control sintético',slug:'control-mail',membership:'diamond',status:'Activo',adminUsername:'lab-admin',password:'Synthetic-Lab-2026!',email:'recipient@example.test'};
 const control=await save(ordinary);assert.equal(mailCalls,1);await save({...ordinary,id:control.id});assert.equal(mailCalls,1,'ordinary welcome is idempotent');
 const before=await(await f.request('/api/provider/finance?years=2026')).json(),metrics={...f.platform.customerMetrics};assert.equal(before.months[0].charges,200000);assert.equal(before.stripe.transactions.length,1);
 const marked={...ordinary,name:'Cliente Prueba FICTICIO',slug:'test-mail',internalTest:true};const created=await save(marked);await save({...marked,id:created.id});await save({...marked,id:created.id});assert.equal(mailCalls,1,'test creation and repeated saves never dispatch welcome');
 assert.equal(f.platform.customers.filter(c=>c.id===created.id).length,1);assert.deepEqual(f.platform.customerMetrics,{...metrics,internalTests:1});
 const after=await(await f.request('/api/provider/finance?years=2026')).json();assert.deepEqual(after,before);assert.equal(financeCalls,4);assert.equal(mailCalls,1);
});
