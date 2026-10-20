// Optional integration smoke test. Creates and removes only its own container/volume.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {credentials} from './admin-credentials.mjs';
const exec=promisify(execFile),name='labflow-vps-test-'+process.pid,volume=name+'-data';
const env={...process.env,SAAS_ADMIN_AUTH:JSON.stringify(await credentials('operator','DockerFixture-Unique-123!'))};
const docker=(...args)=>exec('docker',args,{env,maxBuffer:1024*1024});
async function ready(){for(let i=0;i<40;i++){try{await docker('exec',name,'node','vps/healthcheck.mjs');return;}catch{await new Promise(resolve=>setTimeout(resolve,250));}}throw Error('Container failed readiness');}
try{
 await docker('volume','create',volume);
 await docker('run','-d','--name',name,'--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--mount','type=volume,source='+volume+',target=/data','--tmpfs','/tmp:mode=1777','-e','PUBLIC_ORIGIN=https://labflow.test','-e','DATA_DIR=/data','-e','SAAS_ADMIN_AUTH','labflow-vps:validation');await ready();
 const script=`import http from 'node:http';import assert from 'node:assert/strict';const request=(path,body,cookie='')=>new Promise((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port:8787,path,method:body?'POST':'GET',headers:{host:'labflow.test',origin:'https://labflow.test','content-type':'application/json',cookie}},res=>{let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});r.on('error',reject);r.end(body?JSON.stringify(body):undefined);});assert.equal((await request('/_health')).status,200);assert.equal((await request('/api/saas/state')).status,401);const r=await request('/api/saas/login',{username:'operator',password:'DockerFixture-Unique-123!'});assert.equal(r.status,200,r.text);assert.equal((await request('/api/saas/state',null,r.headers['set-cookie'][0].split(';')[0])).status,200);console.log('PASS container login and state');`;
 const result=await docker('exec',name,'node','--input-type=module','-e',script);console.log(result.stdout.trim());await docker('restart',name);await ready();
 const check=await docker('exec',name,'node','--input-type=module','-e',"import {SqliteBucket} from './vps/bucket.mjs';const b=new SqliteBucket('/data/labflow.sqlite');if(!await b.get('saas/platform-v1.json'))throw Error('State lost');b.close();console.log('PASS container restart persisted state');");console.log(check.stdout.trim());
 await docker('exec',name,'node','vps/storage.mjs','backup','/data/labflow.sqlite','/data/verified-backup.sqlite');
 await docker('exec',name,'node','vps/storage.mjs','restore','/data/verified-backup.sqlite','/data/recovered.sqlite');
 console.log('PASS container backup and verified restore');
}catch{console.error('Docker smoke failed; inspect local Docker readiness and image labflow-vps:validation');process.exitCode=1;}finally{await docker('rm','-f',name).catch(()=>{});await docker('volume','rm',volume).catch(()=>{});}
