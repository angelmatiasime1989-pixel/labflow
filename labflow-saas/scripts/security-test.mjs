import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {fixture,password} from './helpers/saas-fixture.mjs';

test('headers and test operator never authenticate; legacy owner and records stay intact',async()=>{
 const f=fixture();f.env.SAAS_TEST_OPERATOR='bypass';
 const platform={revision:5,ownerUserId:'legacy-sites-owner',customers:[],catalog:[],audit:[{action:'legacy'}]};await f.env.BUCKET.put('saas/platform-v1.json',JSON.stringify(platform));
 assert.equal((await f.request('/api/saas/state',{headers:{'oai-authenticated-user-id':'legacy-sites-owner','oai-authenticated-user-full-name':'forged'}})).status,401);
 assert.deepEqual(await(await f.env.BUCKET.get('saas/platform-v1.json')).json(),platform);
 const cookie=await f.login();const r=await f.request('/api/saas/state',{cookie,headers:{'oai-authenticated-user-id':'attacker'}});assert.equal(r.status,200);assert.equal((await r.json()).operator.name,'operator');
 const after=await(await f.env.BUCKET.get('saas/platform-v1.json')).json();assert.equal(after.ownerUserId,platform.ownerUserId);assert.deepEqual(after.audit,platform.audit);
});
test('missing or malformed credentials fail closed even with development bypass',async()=>{
 for(const value of [undefined,'{}','bad']){const f=fixture();f.env.SAAS_ADMIN_AUTH=value;f.env.SAAS_TEST_OPERATOR='test';assert.equal((await f.request('/api/saas/state')).status,503);assert.equal((await f.request('/api/saas/login',{body:{username:'operator',password}})).status,503);}
});
test('secure cookie, session isolation, expiration, logout and credential rotation',async()=>{
 const f=fixture();const r=await f.request('/api/saas/login',{body:{username:'operator',password}});assert.equal(r.status,200);const full=r.headers.get('set-cookie');for(const flag of ['__Host-labflow_admin=','HttpOnly','Secure','SameSite=Strict','Path=/'])assert.ok(full.includes(flag));assert.ok(!full.includes('Domain='));const cookie=full.split(';')[0];assert.equal((await f.request('/api/saas/state',{cookie})).status,200);
 assert.equal((await f.request('/api/saas/state',{cookie:'labflow_session=tenant-token'})).status,401);
 assert.equal((await f.request('/api/saas/state',{cookie:cookie+'; '+cookie})).status,401);
 const sessionKey=[...f.env.BUCKET.data.keys()].find(k=>k.startsWith('saas/auth/sessions/'));assert.ok(!sessionKey.includes(cookie.split('=')[1]));let session=await(await f.env.BUCKET.get(sessionKey)).json();await f.env.BUCKET.put(sessionKey,JSON.stringify({...session,expires:0}));assert.equal((await f.request('/api/saas/state',{cookie})).status,401);
 const fresh=await f.login();assert.equal((await f.request('/api/saas/logout',{cookie:fresh,body:{}})).status,200);assert.equal((await f.request('/api/saas/state',{cookie:fresh})).status,401);
 const rotated=await f.login();f.env.SAAS_ADMIN_AUTH=JSON.stringify({...JSON.parse(f.env.SAAS_ADMIN_AUTH),salt:'b'.repeat(64)});assert.equal((await f.request('/api/saas/state',{cookie:rotated})).status,401);
});
test('CSRF, method, HTTPS and login body limits',async()=>{
 const f=fixture();const body={username:'operator',password};
 assert.equal((await f.request('/api/saas/login',{body,headers:{origin:'https://evil.example'}})).status,403);
 assert.equal((await f.request('/api/saas/login',{body,headers:{origin:''}})).status,403);
 assert.equal((await f.request('/api/saas/login')).status,405);
 assert.equal((await f.request('/api/saas/login',{body,base:'http://public.example'})).status,403);
 assert.equal((await f.request('/api/saas/login',{body:{...body,padding:'x'.repeat(3000)}})).status,413);
 const cookie=await f.login();assert.equal((await f.request('/api/saas/logout',{body:{},cookie,headers:{origin:'https://evil.example'}})).status,403);assert.equal((await f.request('/api/saas/state',{cookie})).status,200);
});
test('persistent concurrent limiter cannot be bypassed by forged IP headers',async()=>{
 const f=fixture();const requests=await Promise.all(Array.from({length:12},(_,i)=>f.request('/api/saas/login',{body:{username:'operator',password:'wrong'},headers:{'cf-connecting-ip':String(i)}})));assert.ok(requests.every(r=>[401,429].includes(r.status)));assert.ok(requests.some(r=>r.status===429));for(let i=0;i<8;i++)await f.request('/api/saas/login',{body:{username:'operator',password:'wrong'}});assert.equal((await f.request('/api/saas/login',{body:{username:'operator',password}})).status,429);
});
test('anonymous profiles and tenant authentication stay isolated from operator sessions',async()=>{
 const f=fixture(),cookie=await f.login();let s=await(await f.request('/api/saas/state',{cookie})).json();const created=await f.request('/api/saas/customer',{cookie,body:{revision:s.revision,name:'Audit',slug:'audit-tenant',membership:'advanced',status:'Activo',adminUsername:'admin',password:'TenantPassword-123!'}});assert.equal(created.status,200);
 const path='/laboratorio/audit-tenant/api/';assert.equal((await f.request(path+'profiles')).status,401);assert.equal((await f.request(path+'profiles',{cookie})).status,401);
 const login=await f.request(path+'login',{body:{username:'admin',password:'TenantPassword-123!'}});assert.equal(login.status,200);const tenantCookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await f.request(path+'profiles',{cookie:tenantCookie})).status,200);assert.equal((await f.request('/api/saas/state',{cookie:tenantCookie})).status,401);
});
test('contracted module controls file URLs after downgrade and preserves original bytes',async()=>{
 const f=fixture(),cookie=await f.login();let s=await(await f.request('/api/saas/state',{cookie})).json();let r=await f.request('/api/saas/customer',{cookie,body:{revision:s.revision,name:'Downloads',slug:'download-tenant',membership:'advanced',status:'Activo',adminUsername:'admin',password:'TenantPassword-123!'}});const {id}=await r.json();const key='saas/tenants/'+id+'/public-demo/state-v1.json';let t=await(await f.env.BUCKET.get(key)).json();t.inventory=[{id:1,status:'Activo'}];t.files=[{id:'protected',module:'inventory',recordId:1,name:'evidence.pdf'}];await f.env.BUCKET.put(key,JSON.stringify(t));const blob='saas/tenants/'+id+'/attachments/protected';await f.env.BUCKET.put(blob,'%PDF-original-audit');
 const base='/laboratorio/download-tenant/api/';r=await f.request(base+'login',{body:{username:'admin',password:'TenantPassword-123!'}});const tenantCookie=r.headers.get('set-cookie').split(';')[0];assert.equal((await f.request(base+'file/protected',{cookie:tenantCookie})).status,200);
 s=await(await f.request('/api/saas/state',{cookie})).json();r=await f.request('/api/saas/customer',{cookie,body:{...s.customers[0],modules:undefined,revision:s.revision,membership:'basic'}});assert.equal(r.status,200);assert.equal((await f.request(base+'file/protected',{cookie:tenantCookie})).status,404);assert.equal((await f.request(base+'preview?module=inventory&id=1',{cookie:tenantCookie})).status,403);
 assert.equal((await f.request(base+'file/protected')).status,401);assert.equal((await(await f.env.BUCKET.get(blob)).arrayBuffer()).byteLength,'%PDF-original-audit'.length);assert.equal((await(await f.env.BUCKET.get(key)).json()).inventory.length,1);
 s=await(await f.request('/api/saas/state',{cookie})).json();await f.request('/api/saas/customer',{cookie,body:{...s.customers[0],modules:undefined,revision:s.revision,membership:'medium'}});assert.equal((await f.request(base+'file/protected',{cookie:tenantCookie})).status,200);
});
test('login UI renders without public user discovery and retains admin screens',async()=>{
 const source=await readFile('worker/saas-admin.html','utf8');const nodes=new Map();const context=vm.createContext({document:{querySelector(k){if(!nodes.has(k))nodes.set(k,{});return nodes.get(k);},addEventListener(){}},console,setTimeout(){},fetch(){},FormData:class{}});vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace('start();',''),context);vm.runInContext('adminLoginScreen()',context);assert.match(nodes.get('#root').innerHTML,/autocomplete="current-password"/);assert.ok(!source.includes('cuenta autorizada de ChatGPT'));const ui=await readFile('worker/ui.html','utf8');assert.ok(!ui.includes("api('profiles')"));
});
