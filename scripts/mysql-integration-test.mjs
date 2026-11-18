import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {openTestMysql} from './helpers/test-mysql.mjs';
import {openStorage,storageBucket} from '../server/storage.mjs';
import {setProvider} from '../server/auth.mjs';
const directory=await mkdtemp(join(tmpdir(),'qubo-mysql-integration-'));
let db=await openTestMysql(),env=db.testEnv,bucket=storageBucket(db),child;
const reserve=createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
const origin='http://localhost:'+port,password='Synthetic-Temporary-Only!',nextPassword='Synthetic-Changed-Only!';
let providerCookie='',tenantCookie='';
async function start(){child=spawn(process.execPath,['server/index.mjs'],{env:{PATH:process.env.PATH,...env,PORT:String(port),HOST:'127.0.0.1',PUBLIC_URL:origin,DATA_DIR:directory,CUBOLABS_ADMIN_PASSWORD:password,CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE:'true'},stdio:['ignore','pipe','pipe']});let log='';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout: '+log)),15000);child.stdout.on('data',d=>{log+=d;if(log.includes('cubolabs iniciado')){clearTimeout(timer);resolve();}});child.stderr.on('data',d=>log+=d);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code+': '+log));});});}
async function stop(){if(!child||child.exitCode!==null)return;const stopped=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await stopped;child=null;}
async function request(path,body,cookie=providerCookie,headers={}){return fetch(origin+path,{method:body?'POST':'GET',headers:{origin,cookie,'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});}
async function okJson(response){assert.equal(response.status,200,await response.clone().text());return response.json();}
const cookie=response=>response.headers.get('set-cookie').split(';')[0];
try{
 await assert.rejects(openStorage({DB_NAME:'incomplete',DATA_DIR:directory}),/incompleta/);
 await assert.rejects(openStorage({...env,DB_PORT:'1'}),/inicializar MySQL/);
 assert.deepEqual(await readdir(directory),[]);
 await start();assert.equal((await request('/api/saas/state',null,'',{'oai-authenticated-user-id':'forged'})).status,401);
 assert.equal((await request('/api/provider/login',{username:'admin',password},'',{origin:'https://foreign.test'})).status,403);
 let r=await request('/api/provider/login',{username:'admin',password});assert.equal((await okJson(r)).mustChangePassword,true);providerCookie=cookie(r);
 assert.equal((await request('/api/saas/state')).status,403);await stop();await start();assert.equal((await request('/api/saas/state')).status,403);
 const oldCookie=providerCookie;r=await request('/api/provider/change-password',{currentPassword:password,newPassword:nextPassword,confirmPassword:nextPassword});await okJson(r);providerCookie=cookie(r);assert.equal((await request('/api/provider/session',null,oldCookie)).status,401);
 console.log('PASS MySQL clean HTTP startup, partial/broken config fails closed, CSRF, forced password and session rotation.');
 let platform=await okJson(await request('/api/saas/state'));
 const tenant=await okJson(await request('/api/saas/customer',{revision:platform.revision,name:'Synthetic MySQL Lab',slug:'mysql-north',membership:'advanced',status:'Activo',adminUsername:'admin',password:nextPassword}));
 platform=await okJson(await request('/api/saas/state'));await okJson(await request('/api/saas/customer',{revision:platform.revision,name:'Other MySQL Lab',slug:'mysql-south',membership:'advanced',status:'Activo',adminUsername:'admin',password:nextPassword}));
 r=await request('/laboratorio/mysql-north/api/login',{username:'admin',password:nextPassword},'');await okJson(r);tenantCookie=cookie(r);
 let state=await okJson(await request('/laboratorio/mysql-north/api/state',null,tenantCookie));
 await okJson(await request('/laboratorio/mysql-north/api/mutate',{revision:state.revision,module:'clients',action:'create',data:{name:'MySQL durable client',contact:'Synthetic',email:'test@example.com'}},tenantCookie));
 assert.equal((await request('/laboratorio/mysql-south/api/state',null,tenantCookie)).status,401);
 const key='saas/tenants/'+tenant.id+'/public-demo/state-v1.json',raw=await(await bucket.get(key)).json();
 raw.documents=[{id:1,name:'Synthetic persisted document',folio:'DOC-001',type:'Procedimiento',objective:'Test',scope:'Test',responsibilities:'Test',content:'Synthetic',status:'Vigente',version:1,sections28:[]}];
 const pdf=await PDFDocument.create();pdf.addPage().drawText('Synthetic MySQL attachment');const bytes=Buffer.from(await pdf.save()),attachment=crypto.randomUUID();raw.files.push({id:attachment,module:'documents',recordId:1,name:'attachment.pdf',size:bytes.length,mime:'application/pdf'});
 await bucket.put('saas/tenants/'+tenant.id+'/attachments/'+attachment,bytes,{httpMetadata:{contentType:'application/pdf'}});await bucket.put(key,JSON.stringify(raw));
 r=await request('/laboratorio/mysql-north/api/preview?module=documents&id=1',null,tenantCookie);assert.equal(r.status,200);assert.ok((await PDFDocument.load(await r.arrayBuffer())).getPageCount()>0);
 r=await request('/laboratorio/mysql-north/api/file/'+attachment,null,tenantCookie);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
 console.log('PASS MySQL tenant creation/isolation, record mutation, PDF generation and binary attachment retrieval.');
 const db2=await openStorage(env),bucket2=storageBucket(db2);
 try{
  const created=await Promise.all(Array.from({length:20},(_,i)=>(i%2?bucket:bucket2).put('qa/race','first',{onlyIf:{etagDoesNotMatch:'*'}})));assert.equal(created.filter(Boolean).length,1);
  const first=created.find(Boolean);const changed=await Promise.all(Array.from({length:20},(_,i)=>(i%2?bucket:bucket2).put('qa/race','writer-'+i,{onlyIf:{etagMatches:first.etag}})));assert.equal(changed.filter(Boolean).length,1);
  const before=await bucket.get('qa/race');await assert.rejects(db.transaction(async tx=>{await tx.prepare('UPDATE objects SET value=? WHERE `key`=?').run(Buffer.from('rollback'),Buffer.from('qa/race'));assert.equal(await(await bucket2.get('qa/race')).text(),await before.text());throw Error('synthetic rollback');}),/synthetic rollback/);assert.equal(await(await bucket.get('qa/race')).text(),await before.text());
  for(const k of ['qa/a','qa/A','qa/ñ','qa/%_'])await bucket.put(k,k);let cursor,keys=[];do{const page=await bucket.list({prefix:'qa/',limit:2,cursor});keys.push(...page.objects.map(x=>x.key));cursor=page.cursor;}while(cursor);assert.equal(new Set(keys).size,5);assert.equal((await bucket.list({prefix:'qa/%_'})).objects.length,1);
  const large=Buffer.alloc(50*1024*1024,37);await bucket.put('qa/large',large);assert.deepEqual(Buffer.from(await(await bucket2.get('qa/large')).arrayBuffer()),large);
  await bucket.delete(['qa/a','qa/A']);assert.equal(await bucket.get('qa/a'),null);assert.equal(await bucket.get('qa/A'),null);
 }finally{await db2.close();}
 console.log('PASS MySQL two-pool concurrent create/CAS (one winner), rollback isolation, binary key pagination, 50 MiB LONGBLOB and batch delete.');
 await stop();await db.close();db=await openStorage(env);bucket=storageBucket(db);await start();
 assert.equal((await request('/api/saas/state')).status,200);state=await okJson(await request('/laboratorio/mysql-north/api/state',null,tenantCookie));assert.equal(state.clients[0].name,'MySQL durable client');assert.deepEqual(Buffer.from(await(await bucket.get('saas/tenants/'+tenant.id+'/attachments/'+attachment)).arrayBuffer()),bytes);assert.equal((await bucket.head('qa/large')).size,50*1024*1024);
 await assert.rejects(setProvider(db,{username:'overwrite',password}),/ya existe/);
 const failures=await Promise.all(Array.from({length:8},()=>request('/api/provider/login',{username:'admin',password:'wrong'},'')));assert.equal(failures.filter(x=>x.status===401).length,5);assert.equal(failures.filter(x=>x.status===429).length,3);
 await setProvider(db,{username:'admin',password:nextPassword},true);assert.equal((await request('/api/provider/session')).status,401);
 assert.deepEqual(await readdir(directory),[]);
 console.log('PASS MySQL HTTP/pool restart preserves sessions, records, attachments and provider password; concurrent rate limit and admin reset revoke sessions. No SQLite operational file.');
}finally{await stop();await db.close();}
