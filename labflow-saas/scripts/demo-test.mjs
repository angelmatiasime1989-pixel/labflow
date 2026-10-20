import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createDemoServer} from '../vps/demo.mjs';

async function running(t){const app=await createDemoServer();await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));t.after(()=>app.stop());const port=app.server.address().port;
 const request=(path,body,cookie='',origin='https://demo.example')=>new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port,path,method:body!==undefined?'POST':'GET',headers:{host:'demo.example',origin,'content-type':'application/json',cookie}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,text,headers:res.headers,json:()=>JSON.parse(text)}));});r.on('error',reject);r.end(body!==undefined?JSON.stringify(body):undefined);});return {request};}
test('temporary demo: landing, public demo access, three memberships and working tenant login',async t=>{
 const {request}=await running(t);let r=await request('/');assert.equal(r.status,200);assert.match(r.text,/Solo datos ficticios|No introduzcas datos/);assert.match(r.text,/demo-basico/);
 assert.equal((await request('/api/saas/state')).status,401);assert.equal((await request('/_demo/login',{} ,'','https://evil.example')).status,403);assert.equal((await request('/_demo/login')).status,403);
 r=await request('/_demo/login',{});assert.equal(r.status,200);const cookie=r.headers['set-cookie'][0].split(';')[0];assert.ok(r.headers['set-cookie'][0].includes('Secure'));
 let state=(await request('/api/saas/state',undefined,cookie)).json();assert.equal(state.customers.length,3);assert.deepEqual(state.customers.map(c=>c.membership),['basic','medium','advanced']);
 assert.equal((await request('/api/saas/login',{username:'demo-admin',password:'DemoTemporal-2026!'})).status,401);
 const a=await request('/laboratorio/demo-basico/api/login',{username:'demo',password:'DemoTemporal-2026!'});assert.equal(a.status,200);const tenantCookie=a.headers['set-cookie'][0].split(';')[0];r=await request('/laboratorio/demo-basico/api/state',undefined,tenantCookie);assert.equal(r.status,200);assert.equal(r.json().saasTenant.membership,'basic');assert.equal((await request('/laboratorio/demo-medio/api/state',undefined,tenantCookie)).status,401);assert.equal((await request('/laboratorio/demo-basico/api/email35/test',{},tenantCookie)).status,403);
});
test('demo writes do not survive a fresh demo instance',async t=>{
 const first=await running(t);let r=await first.request('/_demo/login',{}),cookie=r.headers['set-cookie'][0].split(';')[0];let state=(await first.request('/api/saas/state',undefined,cookie)).json();r=await first.request('/api/saas/customer',{revision:state.revision,name:'Temporal ficticio',slug:'temporal-ficticio',membership:'basic',status:'Activo',adminUsername:'demo',password:'DemoTemporal-2026!'},cookie);assert.equal(r.status,200);assert.equal((await first.request('/api/saas/state',undefined,cookie)).json().customers.length,4);
 const second=await running(t);r=await second.request('/_demo/login',{});cookie=r.headers['set-cookie'][0].split(';')[0];assert.equal((await second.request('/api/saas/state',undefined,cookie)).json().customers.length,3);
});
