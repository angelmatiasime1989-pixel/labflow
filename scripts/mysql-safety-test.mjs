import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {openTestMysql} from './helpers/test-mysql.mjs';
import {MysqlDatabase} from '../server/mysql.mjs';
import {openStorage} from '../server/storage.mjs';
import {setProvider,ensureProvider} from '../server/auth.mjs';
const credentials=i=>({username:'synthetic-'+i,password:'Synthetic-Password-'+i+'-2026!'});
async function isolatedPool(env,isolation){const pool=mysql.createPool({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,connectionLimit:1});await pool.query('SET SESSION TRANSACTION ISOLATION LEVEL '+isolation);return new MysqlDatabase(pool);}
async function marker(db){const row=await db.prepare('SELECT * FROM provider').get();await db.prepare('INSERT INTO provider_sessions VALUES(?,?,?,?)').run('a'.repeat(64),row.id,row.version,Date.now()+60000);return {row,sessions:await db.prepare('SELECT * FROM provider_sessions').all()};}
async function unchanged(db,before){assert.deepEqual(await db.prepare('SELECT * FROM provider').all(),[before.row]);assert.deepEqual(await db.prepare('SELECT * FROM provider_sessions').all(),before.sessions);}
function gateInsert(db){const original=db.transaction.bind(db);let release,ready;const reached=new Promise(r=>ready=r),gate=new Promise(r=>release=r);db.transaction=fn=>original(async tx=>{const prepare=tx.prepare.bind(tx);tx.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('INSERT INTO provider(')){const run=statement.run;statement.run=async(...args)=>{ready();await gate;return run(...args);};}return statement;};return fn(tx);});return {reached,release};}
for(const isolation of ['READ COMMITTED','REPEATABLE READ']){
 test('exclusive provisioning preserves winner hash/session with two pools under '+isolation,async t=>{
  const db=await openTestMysql(),other=await isolatedPool(db.testEnv,isolation),first=await isolatedPool(db.testEnv,isolation);t.after(async()=>{await Promise.all([db.close(),other.close(),first.close()]);});
  const gate=gateInsert(other),loser=setProvider(other,credentials(2));const rejected=assert.rejects(loser,e=>e.code==='PROVIDER_EXISTS');await gate.reached;
  await setProvider(first,credentials(1));const before=await marker(first);gate.release();await rejected;await unchanged(db,before);
  await assert.rejects(setProvider(other,credentials(2)),e=>e.code==='PROVIDER_EXISTS');await unchanged(db,before);
  const recovered=await ensureProvider(other,credentials(2));assert.equal(recovered.id,before.row.id);await unchanged(db,before);
  await setProvider(first,credentials(3),true);const reset=await db.prepare('SELECT * FROM provider').get();assert.equal(reset.id,before.row.id);assert.notEqual(reset.password_hash,before.row.password_hash);assert.equal(reset.version,before.row.version+1);assert.equal((await db.prepare('SELECT * FROM provider_sessions').all()).length,0);
 });
 test('two HTTP processes recover a competing first startup under '+isolation,async t=>{
  const db=await openTestMysql();t.after(()=>db.close());
  async function start(i){const reservation=createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));const origin='http://localhost:'+port;
   const child=spawn(process.execPath,['scripts/helpers/mysql-bootstrap-child.mjs'],{env:{PATH:process.env.PATH,...db.testEnv,QA_ISOLATION:isolation,PORT:String(port),HOST:'127.0.0.1',PUBLIC_URL:origin,CUBOLABS_ADMIN_USERNAME:credentials(i).username,CUBOLABS_ADMIN_PASSWORD:credentials(i).password},stdio:['ignore','pipe','pipe','ipc']});let log='';const exited=new Promise(resolve=>child.once('exit',resolve));t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await exited;}});
   const started=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout '+log)),15000);child.stdout.on('data',data=>{log+=data;if(log.includes('cubolabs iniciado')){clearTimeout(timer);resolve();}});child.stderr.on('data',data=>log+=data);child.once('exit',code=>{clearTimeout(timer);reject(Error('Early exit '+code+' '+log));});});started.catch(()=>{});
   const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Gate timeout '+log)),15000);child.once('message',()=>{clearTimeout(timer);resolve();});child.once('exit',()=>{clearTimeout(timer);reject(Error('Exited before insert'));});});
   return {child,ready,started,origin};
  }
  const a=await start(1),b=await start(2);await Promise.all([a.ready,b.ready]);a.child.send('go');await a.started;const before=await marker(db);b.child.send('go');await b.started;await unchanged(db,before);
  for(const process of [a,b]){const response=await fetch(process.origin+'/api/provider/login',{method:'POST',headers:{origin:process.origin,'content-type':'application/json'},body:JSON.stringify(credentials(1))});assert.equal(response.status,200);}
 });
}
const incompatibleCases=[
 ['non-transactional engine','ALTER TABLE provider ENGINE=MyISAM'],
 ['short binary storage','ALTER TABLE objects MODIFY value BLOB NOT NULL'],
 ['wrong primary key','ALTER TABLE objects DROP PRIMARY KEY, ADD PRIMARY KEY(etag)'],
 ['missing essential column','ALTER TABLE provider DROP COLUMN must_change_password'],
 ['nonbinary key','ALTER TABLE objects MODIFY `key` VARCHAR(255) NOT NULL'],
 ['nullable session expiry','ALTER TABLE provider_sessions MODIFY expires BIGINT NULL'],
 ['extra unique constraint','ALTER TABLE provider ADD UNIQUE KEY extra_username(username)']
];
for(const [description,alter] of incompatibleCases)test('rejects '+description+' before any schema/data mutation',async t=>{
 const db=await openTestMysql(),env=db.testEnv;t.after(()=>db.close());await db.prepare('INSERT INTO objects(`key`,value,etag,uploaded,metadata) VALUES(?,?,?,?,?)').run(Buffer.from('sentinel'),Buffer.from('keep bytes'),'fixed-etag',1,'{}');
 await db.connection.query(alter);
 // Deliberately missing table demonstrates that preflight rejects before recreating it.
 await db.connection.query('DROP TABLE offline_nonce');
 const before=await db.prepare('SELECT * FROM objects').all(),ddl=(await db.connection.query('SHOW CREATE TABLE objects'))[0];
 await assert.rejects(openStorage(env),/Esquema MySQL incompatible/);
 assert.deepEqual(await db.prepare('SELECT * FROM objects').all(),before);assert.deepEqual((await db.connection.query('SHOW CREATE TABLE objects'))[0],ddl);
 assert.equal((await db.prepare("SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='offline_nonce'").get()).n,0);
});
test('valid existing schema reopens without changing rows',async t=>{const db=await openTestMysql();t.after(()=>db.close());await setProvider(db,credentials(1));const before=await marker(db);const reopened=await openStorage(db.testEnv);try{await unchanged(reopened,before);}finally{await reopened.close();}});
