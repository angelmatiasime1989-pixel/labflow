import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {inspectDatabases,validateSource,maintain} from './hostinger-maintenance.mjs';
test('SSH inventory reads live WAL records without exporting records, following symlinks or creating missing databases',async t=>{
 const root=await mkdtemp(join(tmpdir(),'qubolabs-inventory-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const folder=join(root,'hbuilds/versions/synthetic/nodejs/data');await mkdir(folder,{recursive:true});const source=join(folder,'cubolabs.sqlite'),db=new DatabaseSync(source);t.after(()=>db.close());
 db.exec("PRAGMA journal_mode=WAL; CREATE TABLE objects(key TEXT PRIMARY KEY,value BLOB); CREATE TABLE provider(slot INTEGER,id TEXT); INSERT INTO provider VALUES(1,'private-admin-identity'); INSERT INTO objects VALUES('private-client-name',x'00ff');");
 const broken=join(root,'old/data');await mkdir(broken,{recursive:true});await writeFile(join(broken,'cubolabs.sqlite'),'not-a-database');
 const skipped=join(root,'node_modules/example');await mkdir(skipped,{recursive:true});await writeFile(join(skipped,'cubolabs.sqlite'),'ignored');
 const outside=await mkdtemp(join(tmpdir(),'qubolabs-outside-'));t.after(()=>rm(outside,{recursive:true,force:true}));await writeFile(join(outside,'cubolabs.sqlite'),'outside');await symlink(outside,join(root,'linked-folder'));
 const before=await readFile(source),inventory=await inspectDatabases(root);assert.equal(inventory.length,2);const valid=inventory.find(row=>row.path===source);assert.equal(valid.objects,1);assert.equal(valid.administrator,true);assert.equal(valid.readable,true);assert.equal(inventory.find(row=>row.path!==source).readable,false);
 assert.ok(!JSON.stringify(inventory).includes('private-client-name'));assert.ok(!JSON.stringify(inventory).includes('private-admin-identity'));assert.deepEqual(await readFile(source),before);assert.equal(await validateSource(source,root),source);
 await assert.rejects(validateSource(join(outside,'cubolabs.sqlite'),root),/dentro/);await assert.rejects(validateSource('data/cubolabs.sqlite',root),/absoluta/);await assert.rejects(validateSource(join(root,'missing/cubolabs.sqlite'),root));
});
test('maintenance refuses unsupported operations before connecting or modifying data',async()=>{await assert.rejects(maintain({mode:'reset'}),/inválida/);});

test('GitHub runner pins SSH identity and sends MySQL secrets only through stdin, never command arguments',async t=>{
 const {spawnSync}=await import('node:child_process'),{chmod}=await import('node:fs/promises'),{fileURLToPath}=await import('node:url');
 const folder=await mkdtemp(join(tmpdir(),'qubolabs-ssh-runner-'));t.after(()=>rm(folder,{recursive:true,force:true}));
 for(const [name,body]of Object.entries({ssh:"const fs=require('node:fs');fs.appendFileSync(process.env.QA_TRACE,JSON.stringify(process.argv.slice(2))+'\\n');let input='';process.stdin.on('data',d=>input+=d);process.stdin.on('end',()=>fs.appendFileSync(process.env.QA_INPUT,input+'\\n'));",git:"process.stdout.write('synthetic archive');"})){const path=join(folder,name);await writeFile(path,'#!'+process.execPath+'\n'+body);await chmod(path,0o700);}
 const script=fileURLToPath(new URL('./hostinger-github-runner.mjs',import.meta.url)),secret='Synthetic-Private-Database-Password-2026',env={...process.env,PATH:folder+':'+process.env.PATH,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',MAINTENANCE_MODE:'migrate',WRITES_PAUSED:'true',SQLITE_SOURCE:'/home/synthetic/data/cubolabs.sqlite',MYSQL_PASSWORD:secret,MYSQL_BACKUP_KEY:'d'.repeat(64),SSH_KEY_FILE:'/synthetic/private-key',SSH_KNOWN_HOSTS_FILE:'/synthetic/known-hosts',QA_TRACE:join(folder,'args'),QA_INPUT:join(folder,'input')};
 const result=spawnSync(process.execPath,[script],{env,encoding:'utf8',timeout:15000});assert.equal(result.status,0,result.stderr);const trace=await readFile(env.QA_TRACE,'utf8');assert.ok(trace.includes('StrictHostKeyChecking=yes'));assert.ok(trace.includes('UserKnownHostsFile=/synthetic/known-hosts'));assert.ok(!trace.includes(secret));assert.ok(!trace.includes('d'.repeat(64)));assert.ok((await readFile(env.QA_INPUT,'utf8')).includes(secret));assert.ok(!result.stdout.includes(secret));
 const before=trace,bad=spawnSync(process.execPath,[script],{env:{...env,HOSTINGER_SSH_HOST:'bad;command'},encoding:'utf8'});assert.notEqual(bad.status,0);assert.equal(await readFile(env.QA_TRACE,'utf8'),before);
 const unpaused=spawnSync(process.execPath,[script],{env:{...env,WRITES_PAUSED:'false'},encoding:'utf8'});assert.notEqual(unpaused.status,0);assert.equal(await readFile(env.QA_TRACE,'utf8'),before);
});
