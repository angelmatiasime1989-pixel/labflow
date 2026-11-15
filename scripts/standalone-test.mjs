import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase,SqliteBucket} from '../server/database.mjs';
import {setProvider} from '../server/auth.mjs';
import {createApp} from '../server/app.mjs';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
const temp=await mkdtemp(join(tmpdir(),'cubolabs-standalone-')),file=join(temp,'cubolabs.sqlite'),origin='https://cubolabs.test';let db=openDatabase(file),app;
const ownerPassword='Standalone-QA-Only-2026!!',tenantPassword='Tenant-QA-Only-2026!!';
setProvider(db,{username:'admin',password:ownerPassword});app=createApp({db,publicUrl:origin});
let providerCookie='',tenantCookie='',platform,state;
async function req(path,body,cookie=providerCookie,headers={},ip='qa'){return app(new Request(origin+path,{method:body?'POST':'GET',headers:{origin,cookie,'content-type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})}),{ip});}
async function platformState(){const r=await req('/api/saas/state');assert.equal(r.status,200);platform=await r.json();}
async function labState(slug='laboratorio-norte',cookie=tenantCookie){const r=await req('/laboratorio/'+slug+'/api/state',null,cookie);assert.equal(r.status,200);return r.json();}
try{
 assert.equal((await req('/admin/')).status,303);assert.equal((await req('/api/saas/state',null,'',{'oai-authenticated-user-id':'attacker','oai-authenticated-user-full-name':'Spoof'})).status,401);
 assert.equal((await req('/api/provider/login',{username:'admin',password:ownerPassword},'',{origin:'https://other.test'})).status,403);
 for(let i=0;i<5;i++)assert.equal((await req('/api/provider/login',{username:'admin',password:'wrong'},'',{},'limited')).status,401);
 assert.equal((await req('/api/provider/login',{username:'admin',password:ownerPassword},'',{},'limited')).status,429);
 let r=await req('/api/provider/login',{username:'admin',password:ownerPassword});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly.*SameSite=Strict.*Secure/);providerCookie=r.headers.get('set-cookie').split(';')[0];await platformState();
 const createTenant=async slug=>{const r=await req('/api/saas/customer',{revision:platform.revision,name:slug,slug,membership:'advanced',status:'Activo',adminUsername:'admin',password:tenantPassword});assert.equal(r.status,200,await r.clone().text());await platformState();return r.json();};
 const north=await createTenant('laboratorio-norte');await createTenant('laboratorio-sur');
 r=await req('/laboratorio/laboratorio-norte/api/login',{username:'admin',password:tenantPassword});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Path=\/laboratorio\/laboratorio-norte\//);tenantCookie=r.headers.get('set-cookie').split(';')[0];state=await labState();
 r=await req('/laboratorio/laboratorio-norte/api/mutate',{revision:state.revision,module:'clients',action:'create',data:{name:'Cliente persistente',contact:'Contacto QA',email:'qa@example.com'}},tenantCookie);assert.equal(r.status,200,await r.clone().text());state=await labState();assert.equal(state.clients.length,1);
 assert.equal((await req('/laboratorio/laboratorio-sur/api/state',null,tenantCookie)).status,401);assert.equal((await req('/api/saas/state',null,tenantCookie,{'oai-authenticated-user-id':'attacker'})).status,401);
 const bucket=new SqliteBucket(db);const first=await bucket.put('qa/atomic','uno',{onlyIf:{etagDoesNotMatch:'*'}});assert.ok(first);assert.equal(await bucket.put('qa/atomic','dos',{onlyIf:{etagDoesNotMatch:'*'}}),null);assert.equal(await bucket.put('qa/atomic','dos',{onlyIf:{etagMatches:'invalid'}}),null);assert.ok(await bucket.put('qa/atomic','dos',{onlyIf:{etagMatches:first.etag}}));
 await bucket.put('qa/file',new Uint8Array([0,1,255]));assert.deepEqual([...new Uint8Array(await(await bucket.get('qa/file')).arrayBuffer())],[0,1,255]);assert.equal((await bucket.list({prefix:'qa/',limit:1})).truncated,true);
 db.close();db=openDatabase(file);app=createApp({db,publicUrl:origin});await platformState();assert.equal(platform.customers.length,2);state=await labState();assert.equal(state.clients[0].name,'Cliente persistente');assert.equal(await(await new SqliteBucket(db).get('qa/atomic')).text(),'dos');
 r=await req('/api/provider/logout',{});assert.equal(r.status,200);assert.equal((await req('/api/saas/state')).status,401);
 r=await req('/api/provider/login',{username:'admin',password:ownerPassword});providerCookie=r.headers.get('set-cookie').split(';')[0];setProvider(db,{username:'admin',password:ownerPassword+'changed'},true);assert.equal((await req('/api/saas/state')).status,401);
 console.log('PASS standalone: autenticación propia, anti-suplantación, CSRF, límite de intentos, cookies seguras, dos clientes aislados, persistencia de sesiones/archivos/registros, escrituras condicionales y revocación.');
 db.close();db=null;
 const reserve=createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));const httpOrigin='http://localhost:'+port;
 const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:String(port),PUBLIC_URL:httpOrigin,DATA_DIR:temp,BACKUP_AUTO_ENABLED:'false',R2_ACCOUNT_ID:'',R2_BUCKET:'',R2_ACCESS_KEY_ID:'',R2_SECRET_ACCESS_KEY:'',NODE_ENV:'development',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});let output='';child.stderr.on('data',d=>output+=d);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Servidor no inició: '+output)),10000);child.stdout.on('data',d=>{output+=d;if(output.includes('cubolabs iniciado')){clearTimeout(timer);resolve();}});child.once('exit',code=>{clearTimeout(timer);reject(Error('Servidor terminó: '+code+' '+output));});});
 try{r=await fetch(httpOrigin+'/');assert.equal(r.status,200);assert.match(await r.text(),/cubolabs/);r=await fetch(httpOrigin+'/api/provider/login',{method:'POST',headers:{origin:httpOrigin,'content-type':'application/json'},body:JSON.stringify({username:'admin',password:ownerPassword+'changed'})});assert.equal(r.status,200);assert.ok(!r.headers.get('set-cookie').includes('; Secure'));}finally{child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
 console.log('PASS HTTP Node real: arranque sin Sites, landing y login del administrador desde la base persistente.');
 const key='a'.repeat(64),environment={...process.env,R2_ACCOUNT_ID:'',R2_BUCKET:'',R2_ACCESS_KEY_ID:'',R2_SECRET_ACCESS_KEY:'',BACKUP_REMOTE_REQUIRED:'false',DATA_DIR:temp,BACKUP_DIR:join(temp,'backups'),BACKUP_ENCRYPTION_KEY:key};
 async function command(args,env=environment){const p=spawn(process.execPath,args,{env,stdio:['ignore','pipe','pipe']});let log='';p.stdout.on('data',d=>log+=d);p.stderr.on('data',d=>log+=d);const code=await new Promise(resolve=>p.once('close',resolve));return{code,log};}
 const saved=await command(['scripts/backup.mjs']);assert.equal(saved.code,0,saved.log);const backupPath=saved.log.trim().split('Respaldo cifrado creado: ')[1];const encrypted=await readFile(backupPath);assert.equal(encrypted.subarray(0,9).toString(),'CUBOLABS1');assert.ok(!encrypted.includes(Buffer.from('Cliente persistente')));
 assert.notEqual((await command(['scripts/restore.mjs',backupPath,'--confirm'],{...environment,BACKUP_ENCRYPTION_KEY:'b'.repeat(64)})).code,0);const restored=await command(['scripts/restore.mjs',backupPath,'--confirm']);assert.equal(restored.code,0,restored.log);db=openDatabase(file);assert.ok(await new SqliteBucket(db).get('saas/tenants/'+north.id+'/public-demo/state-v1.json'));console.log('PASS respaldo cifrado y restauración íntegra; clave errónea rechazada.');
}finally{db?.close();await rm(temp,{recursive:true,force:true});}
