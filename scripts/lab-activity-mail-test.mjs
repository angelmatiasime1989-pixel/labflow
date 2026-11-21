import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/saas-fixture.mjs';

const to='quality@lab.test', foreign='other@lab.test', limited='limited@lab.test';
const settings={TRANSACTIONAL_EMAIL_ENABLED:'true',RESEND_DOMAIN_VERIFIED:'true',RESEND_API_VERIFIED:'true',RESEND_API_KEY:'re_SyntheticOnly',EMAIL_FROM:'sender@lab.test',RESEND_ALLOWED_RECIPIENTS:[to,foreign,limited].join(',')};
test('tenant activity: newly committed only, respects access, never sends record content or historical queues',async t=>{
 const sent=[];let failSend=false;
 const f=await fixture(t,{...settings,LAB_ACTIVITY_EMAIL_ENABLED:'true'},undefined,{
  mailTransport:async (url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(JSON.parse(options.body));if(failSend)return Response.json({error:'simulated'},{status:503});return Response.json({id:'activity-'+sent.length});}
 });
 async function lab(slug,email){
  const c=await f.customer(slug),cookie=await f.tenantLogin(slug);
  let state=await(await f.bucket.get(c.key)).json();
  state.users.push({...state.users[0],id:3,role:'Calidad',username:'lab-quality',email,name:'Calidad sintética'});
  state.users.push({...state.users[0],id:4,role:'Técnico',username:'lab-limited',email:limited,name:'Sin acceso'});
  state.mailQueue35.push({id:'old',key:'old',at:new Date().toISOString(),to:email,userId:3,subject:'Historical title'});
  await f.bucket.put(c.key,JSON.stringify(state));
  async function post(path,body){
   const pending=[];
   const r=await f.app(new Request(f.origin+'/laboratorio/'+slug+'/api/'+path,{method:'POST',headers:{origin:f.origin,cookie,'content-type':'application/json'},body:JSON.stringify(body)}),{waitUntil:p=>pending.push(p)});
   await Promise.all(pending);return r;
  }
  const read=async()=>(await f.bucket.get(c.key)).json();
  return {post,read,key:c.key,id:c.id};
 }
 const a=await lab('mail-activity',to),b=await lab('other-activity',foreign);
 const activity={module:'meetings',action:'create',send:true,data:{name:'Contenido sensible sintético excluido',meetingDate:'2026-11-22',meetingTime:'10:00',location:'Sala',ownerId:3,attendeeIds:[1,3,4],objective:'Prueba',agenda:'Prueba',discussion:'Prueba'}};
 let rev=(await a.read()).revision;
 assert.equal((await a.post('mutate',{...activity,revision:rev})).status,200);
 assert.deepEqual(sent,[],'per-lab opt-in is required');
 rev=(await a.read()).revision;
 assert.equal((await a.post('email35/config',{enabled:true,revision:rev})).status,200);
 assert.deepEqual(sent,[],'enabling did not backfill or flush old items');
 rev=(await a.read()).revision;
 const response=await a.post('mutate',{...activity,revision:rev});
 assert.equal(response.status,200,await response.text());
 assert.equal(sent.length,1);assert.deepEqual(sent[0].to,[to]);
 assert.match(sent[0].text,/\/laboratorio\/mail-activity\//);
 assert.doesNotMatch(JSON.stringify(sent),/Contenido sensible|Historical title|limited@|other@/);
 assert.equal((await a.post('mutate',{...activity,revision:rev})).status,409);
 assert.equal(sent.length,1);
 assert.equal((await a.post('email35/retry',{revision:(await a.read()).revision})).status,200);
 assert.equal(sent.length,1,'retry did not duplicate');
 assert.equal((await b.read()).mailQueue35.length,1,'other tenant untouched');
 failSend=true;
 assert.equal((await a.post('mutate',{...activity,revision:(await a.read()).revision})).status,200);
 assert.equal(sent.length,2,'provider failure does not fail the mutation');
 const current=await a.read(),item=current.mailQueue35.at(-1),statusKey='saas/tenants/'+a.id+'/public-demo/mail35/'+item.id+'.json';
 current.users.find(u=>u.id===3).active=false;
 await f.bucket.put(a.key,JSON.stringify(current));
 const failed=await(await f.bucket.get(statusKey)).json();
 failed.lastAttempt=new Date(Date.now()-61000).toISOString();
 await f.bucket.put(statusKey,JSON.stringify(failed));
 failSend=false;
 assert.equal((await a.post('email35/retry',{revision:current.revision})).status,200);
 assert.equal(sent.length,2,'a revoked account never receives delayed retry');
 assert.equal((await(await f.bucket.get(statusKey)).json()).status,'Omitido por seguridad');

});
