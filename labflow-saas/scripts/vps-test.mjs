import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir,chmod,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import http from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
import {SqliteBucket} from '../vps/bucket.mjs';
import {createAppServer} from '../vps/server.mjs';
import {backupDatabase,restoreDatabase,exportObjects,importObjects} from '../vps/storage.mjs';
import {credentials} from './admin-credentials.mjs';
async function temp(t){const dir=await mkdtemp(join(tmpdir(),'labflow-vps-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
test('R2-compatible persistence: conditional writes, cross-connection conflict, pagination and binary',async t=>{
 const dir=await temp(t),a=new SqliteBucket(join(dir,'db')),b=new SqliteBucket(join(dir,'db'));t.after(()=>{a.close();b.close();});
 const x=await a.put('a/file',Buffer.from([0,255]),{onlyIf:{etagDoesNotMatch:'*'}});assert.equal(await b.put('a/file','bad',{onlyIf:{etagDoesNotMatch:'*'}}),null);
 const results=await Promise.all([a.put('a/file','winner',{onlyIf:{etagMatches:x.etag}}),b.put('a/file','loser',{onlyIf:{etagMatches:x.etag}})]);assert.equal(results.filter(Boolean).length,1);assert.equal(await(await b.get('a/file')).text(),'winner');
 await a.put('a/other',new Uint8Array([0,255]));await a.put('b/hidden','hidden');const page=await a.list({prefix:'a/',limit:1});assert.equal(page.truncated,true);const next=await b.list({prefix:'a/',limit:1,cursor:page.cursor});assert.equal(next.objects.length,1);assert.equal(next.truncated,false);assert.notEqual(next.objects[0].key,page.objects[0].key);
 assert.deepEqual([...new Uint8Array(await(await a.get('a/other')).arrayBuffer())],[0,255]);assert.equal((await a.head('a/other')).size,2);await a.delete(['a/other']);assert.equal(await b.get('a/other'),null);
});
test('consistent backup, restore and portable object transfer; reject corruption and overwrite',async t=>{
 const dir=await temp(t),source=join(dir,'source'),b=new SqliteBucket(source);t.after(()=>b.close());await b.put('saas/platform-v1.json','{"customers":[]}');await b.put('saas/tenants/id/attachments/file',Buffer.from([0,255,0]));const snapshot=join(dir,'backup');await backupDatabase(source,snapshot);await b.put('later','excluded');await restoreDatabase(snapshot,join(dir,'restore'));
 let r=new SqliteBucket(join(dir,'restore'));assert.equal(await r.get('later'),null);assert.deepEqual([...new Uint8Array(await(await r.get('saas/tenants/id/attachments/file')).arrayBuffer())],[0,255,0]);r.close();await assert.rejects(()=>restoreDatabase(snapshot,join(dir,'restore')));
 const objects=join(dir,'objects');await exportObjects(source,objects);await importObjects(objects,join(dir,'import'));r=new SqliteBucket(join(dir,'import'));assert.equal(await(await r.get('later')).text(),'excluded');r.close();await writeFile(join(objects,'0.bin'),'tampered');await assert.rejects(()=>importObjects(objects,join(dir,'bad')),/checksum/);await writeFile(snapshot+'.json','{}');await assert.rejects(()=>restoreDatabase(snapshot,join(dir,'bad-restore')),/checksum/);
});
test('real HTTP + SQLite: login, tenant isolation, licensed downloads, restart, health and redacted logs',async t=>{
 const dir=await temp(t),path=join(dir,'db'),password='VpsAdmin-Unique-Test-123!',auth=JSON.stringify(await credentials('operator',password)),logs=[];let bucket,app,port;
 async function start(){bucket=new SqliteBucket(path);app=createAppServer({publicOrigin:'https://labflow.test',bucket,adminAuth:auth,logger:event=>logs.push(event)});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));port=app.server.address().port;}
 t.after(async()=>{await app.stop();bucket.close();});await start();
 const request=(path,{body,cookie='',headers={},method=body?'POST':'GET'}={})=>new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path,method,headers:{host:'labflow.test',origin:'https://labflow.test','content-type':'application/json',cookie,...headers}},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text:Buffer.concat(chunks).toString(),json(){return JSON.parse(this.text);}}));});req.on('error',reject);req.end(body?JSON.stringify(body):undefined);});
 assert.equal((await request('/_health')).status,200);assert.equal((await bucket.list()).objects.length,0);assert.equal((await request('/api/saas/state',{headers:{'oai-authenticated-user-id':'forged','x-forwarded-host':'evil'}})).status,401);assert.equal((await request('/admin/',{headers:{host:'evil'}})).status,421);
 assert.equal((await request('/api/saas/login',{body:{username:'operator',password},headers:{origin:'https://evil.test'}})).status,403);
 let r=await request('/api/saas/login',{body:{username:'operator',password}});assert.equal(r.status,200,r.text);const cookie=r.headers['set-cookie'][0].split(';')[0];let state=(await request('/api/saas/state',{cookie})).json();
 async function create(slug,membership){const r=await request('/api/saas/customer',{cookie,body:{revision:state.revision,name:slug,slug,membership,status:'Activo',adminUsername:'admin',password:'TenantVps-Unique-123!'}});assert.equal(r.status,200,r.text);state=(await request('/api/saas/state',{cookie})).json();return r.json();}
 const a=await create('tenant-one','advanced');await create('tenant-two','basic');assert.equal((await request('/laboratorio/tenant-one/api/profiles')).status,401);r=await request('/laboratorio/tenant-one/api/login',{body:{username:'admin',password:'TenantVps-Unique-123!'}});assert.equal(r.status,200,r.text);const tenantCookie=r.headers['set-cookie'][0].split(';')[0];assert.equal((await request('/laboratorio/tenant-two/api/state',{cookie:tenantCookie})).status,401);
 const key='saas/tenants/'+a.id+'/public-demo/state-v1.json',tenant=await(await bucket.get(key)).json();tenant.inventory=[{id:1,status:'Activo'}];tenant.files=[{id:'file',module:'inventory',recordId:1,name:'evidence.pdf'}];await bucket.put(key,JSON.stringify(tenant));await bucket.put('saas/tenants/'+a.id+'/attachments/file','%PDF-original');assert.equal((await request('/laboratorio/tenant-one/api/file/file',{cookie:tenantCookie})).status,200);
 r=await request('/api/saas/customer',{cookie,body:{...state.customers.find(c=>c.id===a.id),modules:undefined,revision:state.revision,membership:'basic'}});assert.equal(r.status,200,r.text);assert.equal((await request('/laboratorio/tenant-one/api/file/file',{cookie:tenantCookie})).status,404);
 await app.stop();bucket.close();await start();assert.equal((await request('/api/saas/state',{cookie})).json().customers.length,2);assert.equal((await request('/laboratorio/tenant-one/api/state',{cookie:tenantCookie})).status,200);assert.equal((await request('/api/saas/logout',{cookie,body:{}})).status,200);assert.equal((await request('/api/saas/state',{cookie})).status,401);assert.ok(!JSON.stringify(logs).includes(password));assert.ok(!JSON.stringify(logs).includes(cookie));
});
test('public HTTP and missing administrator credentials fail closed',()=>{assert.throws(()=>createAppServer({publicOrigin:'http://public.example',adminAuth:'{}'}));assert.throws(()=>createAppServer({publicOrigin:'https://public.example',adminAuth:'{}'}));});

test('read-only R2 export with paginated mocked AWS CLI produces an importable verified manifest',async t=>{
 const dir=await temp(t),bin=join(dir,'bin');await mkdir(bin);const aws=join(bin,'aws');
 await writeFile(aws,`#!/usr/bin/env node
const fs=require('node:fs'),a=process.argv.slice(2),second=a.includes('--continuation-token');
if(a.includes('list-objects-v2'))console.log(JSON.stringify({Contents:[second?{Key:'saas/tenants/id/attachments/file',ETag:'"two"',Size:3}:{Key:'saas/platform-v1.json',ETag:'"one"',Size:2}],IsTruncated:!second,...(!second?{NextContinuationToken:'page-two'}:{})}));
else if(a.includes('get-object')){if(!a.includes('--if-match'))process.exit(1);fs.writeFileSync(a.at(-1),a[a.indexOf('--key')+1]==='saas/platform-v1.json'?'{}':Buffer.from([0,255,0]));console.log('{}');}else process.exit(1);
`);await chmod(aws,0o700);const directory=join(dir,'r2');
 const result=await exec(process.execPath,['vps/r2-export.mjs','fixture-bucket',directory],{cwd:new URL('..',import.meta.url),env:{...process.env,PATH:bin+':'+process.env.PATH,R2_ENDPOINT:'https://'+ 'a'.repeat(32)+'.r2.cloudflarestorage.com'}});assert.match(result.stdout,/2 objects/);
 const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));assert.equal(manifest.objects.length,2);await importObjects(directory,join(dir,'imported'));const b=new SqliteBucket(join(dir,'imported'));assert.deepEqual([...new Uint8Array(await(await b.get('saas/tenants/id/attachments/file')).arrayBuffer())],[0,255,0]);b.close();
});
