import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './helpers/saas-fixture.mjs';import {mailService,mailConfig} from '../server/mail/service.mjs';
const env={TRANSACTIONAL_EMAIL_ENABLED:'true',RESEND_DOMAIN_VERIFIED:'true',RESEND_API_VERIFIED:'true',RESEND_API_KEY:'re_SyntheticOnly',EMAIL_FROM:'sender@example.test',RESEND_ALLOWED_RECIPIENTS:'recipient@example.test'};
const msg={to:'recipient@example.test',subject:'Synthetic',text:'No real delivery'};
test('mail defaults to disabled, requires verified settings HTTPS and an allowed recipient',async t=>{
 assert.equal(mailConfig({},'https://review.test').enabled,false);for(const k of Object.keys(env))assert.equal(mailConfig({...env,[k]:''},'https://review.test').enabled,false);assert.equal(mailConfig(env,'http://review.test').enabled,false);
 const f=await fixture(t);let calls=0;const transport=async()=>{calls++;return Response.json({id:'synthetic'});};
 assert.equal((await mailService({bucket:f.bucket,origin:f.origin,transport}).send(msg,'off')).sent,false);
 const service=mailService({bucket:f.bucket,origin:f.origin,env,transport});assert.equal((await service.send({...msg,to:'other@example.test'},'denied')).sent,false);assert.equal(calls,0);
 const results=await Promise.all([service.send(msg,'one'),service.send(msg,'one')]);assert.equal(calls,1);assert.ok(results.some(r=>r.sent));assert.equal((await service.send(msg,'one')).duplicate,true);assert.equal(calls,1);assert.equal((await service.send({...msg,text:'changed'},'one')).reason,'event-conflict');
});
test('ambiguous mail retries preserve idempotency and stop before provider retention expires',async t=>{
 const f=await fixture(t);let now=Date.now(),calls=[];const transport=async(url,options)=>{calls.push(options.headers['Idempotency-Key']);throw Error('Synthetic outage');};
 const service=mailService({bucket:f.bucket,origin:f.origin,env,transport,clock:()=>now});await service.send(msg,'retry');now+=60000;await service.send(msg,'retry');assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);now+=24*3600000;assert.equal((await service.send(msg,'retry')).reason,'pending-or-manual-review');assert.equal(calls.length,2);
});
async function recoveryFixture(t){let now=Date.now();const sent=[];const f=await fixture(t,env,undefined,{mailClock:()=>now,mailTransport:async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(JSON.parse(options.body));return Response.json({id:'synthetic-'+sent.length});}});const customer=await f.customer('mail-lab');const s=await(await f.bucket.get(customer.key)).json();s.users.find(u=>u.username==='lab-admin').email='recipient@example.test';await f.bucket.put(customer.key,JSON.stringify(s));
 async function call(action,body,origin=f.origin){const pending=[];const r=await f.app(new Request(f.origin+'/api/account/recovery/'+action,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),{ip:'synthetic-mail-ip',waitUntil:p=>pending.push(p)});await Promise.all(pending);return r;}
 return {f,customer,sent,call,advance:ms=>now+=ms,token:()=>sent.at(-1).text.match(/#token=([a-f0-9]{64})/)[1]};}
test('recovery does not enumerate accounts; one-use token replaces password and revokes prior sessions',async t=>{
 const {f,customer,sent,call,token}=await recoveryFixture(t);const cookie=await f.tenantLogin('mail-lab');const other=await f.customer('other-mail-lab'),beforeOther=await(await f.bucket.get(other.key)).text();
 const unknown=await call('request',{slug:'unknown-lab',username:'missing'});const known=await call('request',{slug:'mail-lab',username:'lab-admin'});assert.equal(unknown.status,202);assert.deepEqual(await known.json(),await unknown.json());assert.equal(sent.length,1);const secret=token();
 const replies=await Promise.all([call('reset',{token:secret,password:'Synthetic-New-2026!'}),call('reset',{token:secret,password:'Synthetic-Other-2026!'})]);assert.deepEqual(replies.map(r=>r.status).sort(),[200,400]);assert.equal((await call('reset',{token:secret,password:'Synthetic-New-2026!'})).status,400);const password=replies[0].status===200?'Synthetic-New-2026!':'Synthetic-Other-2026!';assert.equal((await f.request('/laboratorio/mail-lab/api/login',{username:'lab-admin',password},{cookie:''})).status,200);
 assert.equal((await f.request('/laboratorio/mail-lab/api/state',null,{cookie})).status,401);const state=await(await f.bucket.get(customer.key)).json();assert.equal(state.users.find(u=>u.username==='lab-admin').authVersion,2);assert.equal(await(await f.bucket.get(other.key)).text(),beforeOther);
 assert.equal((await call('request',{slug:'mail-lab',username:'lab-admin'},'https://evil.test')).status,403);
});
test('expired recovery tokens and rate-limited requests cannot update credentials or send extra mail',async t=>{
 const {f,customer,sent,call,token,advance}=await recoveryFixture(t);await call('request',{slug:'mail-lab',username:'lab-admin'});const old=token(),before=await(await f.bucket.get(customer.key)).text();advance(16*60000);assert.equal((await call('reset',{token:old,password:'Synthetic-New-2026!'})).status,400);assert.equal(await(await f.bucket.get(customer.key)).text(),before);
 for(let i=0;i<9;i++)assert.equal((await call('request',{slug:'mail-lab',username:'lab-admin'})).status,202);assert.equal(sent.length,3);
});

test('welcome requires a confirmed eligible space and never duplicates delivery',async t=>{
 const f=await fixture(t),c=await f.customer('welcome-mail');let sends=0;const service=mailService({bucket:f.bucket,origin:f.origin,env,transport:async()=>{sends++;return Response.json({id:'welcome-synthetic'});}});const p=await(await f.bucket.get('saas/platform-v1.json')).json(),customer=p.customers.find(x=>x.id===c.id);customer.email='recipient@example.test';customer.selfService={mode:'stripe'};await f.bucket.put('saas/platform-v1.json',JSON.stringify(p));await service.welcome();assert.equal(sends,0);
 customer.stripeBilling={managed:true,access:true,accessUntil:Date.now()+60000};await f.bucket.put('saas/platform-v1.json',JSON.stringify(p));await service.welcome();await service.welcome();assert.equal(sends,1);
});
test('recovery never embeds the secret in public HTML and enforces small bodies',async t=>{
 const {f}=await recoveryFixture(t);const html=await(await f.request('/laboratorio/mail-lab/',null,{cookie:''})).text();assert.ok(html.includes('QUBO_RECOVERY_URL="https://review.test/recuperar"'));assert.ok(!html.includes(env.RESEND_API_KEY));
 const tooBig=await f.request('/api/account/recovery/request',{slug:'mail-lab',username:'x'.repeat(5000)},{cookie:''});assert.equal(tooBig.status,413);
 const response=await f.request('/recuperar',null,{cookie:''});assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
});

test('changed email or suspended tenant invalidates outstanding recovery links',async t=>{
 for(const change of ['email','suspended']){const {f,customer,call,token}=await recoveryFixture(t);await call('request',{slug:'mail-lab',username:'lab-admin'});const secret=token();
 if(change==='email'){const s=await(await f.bucket.get(customer.key)).json();s.users.find(u=>u.username==='lab-admin').email='changed@example.test';await f.bucket.put(customer.key,JSON.stringify(s));}
 else{const p=await(await f.bucket.get('saas/platform-v1.json')).json();p.customers.find(c=>c.id===customer.id).status='Suspendido';await f.bucket.put('saas/platform-v1.json',JSON.stringify(p));}
 const before=await(await f.bucket.get(customer.key)).text();assert.equal((await call('reset',{token:secret,password:'Synthetic-New-2026!'})).status,400);assert.equal(await(await f.bucket.get(customer.key)).text(),before);
 }
});

test('laboratory recovery remains reachable without mail and explains administrator assistance',async t=>{const f=await fixture(t);await f.customer('recovery-help');const login=await(await f.request('/laboratorio/recovery-help/',null,{cookie:''})).text();assert.ok(login.includes('QUBO_RECOVERY_URL="'+f.origin+'/recuperar"'));assert.ok(login.includes('¿Olvidaste tu contraseña?'));const page=await(await f.request('/recuperar?laboratorio=recovery-help',null,{cookie:''})).text();assert.ok(page.includes('const recoveryEnabled=false'));assert.ok(page.includes('Pide al administrador de tu laboratorio'));assert.ok(!page.includes('/*RECOVERY_ENABLED*/'));});
