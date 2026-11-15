import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import worker from '../worker/index.js';
const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const {META,FLOW,labflowApp}=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {META,FLOW,labflowApp};').toString('base64'));
class Bucket{
 constructor(){this.map=new Map();this.n=0;}
 async get(k){const x=this.map.get(k);return x?{etag:x.etag,json:async()=>JSON.parse(x.bytes.toString()),arrayBuffer:async()=>x.bytes.buffer.slice(x.bytes.byteOffset,x.bytes.byteOffset+x.bytes.byteLength),body:x.bytes}:null;}
 async put(k,v,o={}){const old=this.map.get(k);if(o.onlyIf?.etagMatches&&old?.etag!==o.onlyIf.etagMatches||o.onlyIf?.etagDoesNotMatch==='*'&&old)return null;const x={bytes:Buffer.from(v),etag:String(++this.n)};this.map.set(k,x);return x;}
 async delete(k){this.map.delete(k);}
}
const env={BUCKET:new Bucket()},seedEnv={BUCKET:new Bucket()};
const origin='https://test.example';
async function request(path,body,cookie='',owner=false){return worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{origin,cookie,'content-type':'application/json',...(owner?{'oai-authenticated-user-id':'audit-owner'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);}
let platform=await(await request('/api/saas/state',null,'',true)).json();
const created=await request('/api/saas/customer',{revision:platform.revision,name:'Laboratorio QA',slug:'laboratorio-qa',membership:'advanced',status:'Activo',password:'Audit-Lab-2026!!',adminUsername:'admin'},'',true);
assert.equal(created.status,200);const tenant=await created.json();
// Load fictitious demonstration records into this test-only tenant. No live requests occur.
await labflowApp.fetch(new Request(origin+'/api/health'),seedEnv);
const fixture=await(await seedEnv.BUCKET.get('public-demo/state-v1.json')).json();
const key='saas/tenants/'+tenant.id+'/public-demo/state-v1.json';await env.BUCKET.put(key,JSON.stringify(fixture));
let cookie='',state;
async function refresh(){const r=await request('/laboratorio/laboratorio-qa/api/state',null,cookie);assert.equal(r.status,200);state=await r.json();}
async function login(username){const r=await request('/laboratorio/laboratorio-qa/api/login',{username,password:'DemoLab2026!'});assert.equal(r.status,200,await r.clone().text());cookie=r.headers.get('set-cookie').split(';')[0];await refresh();}
async function post(path,data,expected=200){const r=await request('/laboratorio/laboratorio-qa/api/'+path,{revision:state.revision,...data},cookie);assert.equal(r.status,expected,await r.clone().text());const result=await r.json();await refresh();return result;}
const inventory=[];let denied=0,previews=0;
for(const username of ['admin','responsable','calidad','comercial','rh','tecnico','contabilidad','tecnico2','signatario','auditor']){
 await login(username);const p=state.me.permissions;
 console.log('Checking '+username);inventory.push({username,role:state.me.role,view:p.view,edit:p.edit,approve:p.approve});
 for(const module of Object.keys(META)){
  assert.ok(Array.isArray(state[module]),username+': '+module);
  if(!p.edit.includes(module)){
   const r=await request('/laboratorio/laboratorio-qa/api/mutate',{revision:state.revision,module,action:'create',data:{}},cookie);
   assert.ok([400,403].includes(r.status),username+' unauthorized create '+module+': '+r.status);
   // View-only modules must never create a row, even if legacy validation returns 400 first.
   const persisted=await(await env.BUCKET.get(key)).json();assert.equal(persisted.revision,state.revision,username+' denied write changed revision');denied++;
  }
  if(!p.view.includes(module)&&module!=='users')assert.equal(state[module].length,0,username+' data leakage '+module);if(module==='users'&&!p.edit.includes('users'))assert.ok(state.users.every(x=>Object.keys(x).every(k=>['id','name','role','active'].includes(k))),username+' sanitized directory');
  else if(state[module][0]&&!['users','roles','labSettings','surveyResponses','personnel','sales','kanban','fiscal30','readiness30','demo30'].includes(module)){
   const r=await request('/laboratorio/laboratorio-qa/api/preview?module='+module+'&id='+state[module][0].id,null,cookie);
   assert.ok([200,400,403].includes(r.status),username+' preview '+module+' '+r.status+' '+(r.status===500?await r.clone().text():''));if(r.status===200){assert.match(r.headers.get('content-type'),/pdf/);previews++;}
  }
 }
}
await login('admin');const actor=state.me.id,tech=state.users.find(x=>x.username==='tecnico');
const actionData={type:'Acción correctiva',name:'Control de permisos por línea',description:'Caso de auditoría funcional',rootCause:'Faltó un control',...Object.fromEntries([1,2,3,4,5].map(i=>['why'+i,'Causa comprobada '+i])),planLines42:[{id:'owner',action:'Supervisar',ownerId:actor,due:'2026-12-01',resources:'Tiempo del coordinador'},{id:'tech',action:'Verificar',ownerId:tech.id,due:'2026-12-02',resources:'Lista y tiempo del técnico'}]};
const action=await post('mutate',{module:'quality',action:'create',data:actionData});await login('tecnico');
let lines=state.quality.find(x=>x.id===action.id).planLines42;
await post('action42/followup',{id:action.id,note:'Intento de alterar otra asignación',lines:lines.map(x=>({...x,status:'Completada'}))},403);
await post('action42/followup',{id:action.id,note:'Intento de cambiar responsable',lines:lines.map(x=>({...x,ownerId:tech.id}))},400);
await post('mutate',{module:'quality',id:action.id,action:'edit',data:{...actionData,name:'Cambio no autorizado'}},403);
await post('mutate',{module:'quality',action:'create',data:actionData},403);
await post('action42/followup',{id:action.id,note:'El técnico completó su actividad',lines:lines.map(x=>({...x,status:x.ownerId===tech.id?'Completada':x.status}))});
lines=state.quality.find(x=>x.id===action.id).planLines42;
assert.equal(lines[0].status,'Pendiente');assert.equal(lines[0].followupDate,'');assert.equal(lines[1].status,'Completada');assert.equal(lines[1].followupDate,state.today);
// Follow-up cannot replace the agreed plan and bypass the invalidation of closure evidence.
await login('admin');await post('action42/followup',{id:action.id,note:'Cambio de alcance',lines:lines.map(x=>({...x,action:x.action+' modificado'}))},400);
const riskData={process42:'Operación',name:'Riesgo de agenda',type:'Técnico',ownerId:actor,description:'Puede faltar un recurso',due:'2028-10-13',probability:3,impact:4,actionResources42:'Patrón de respaldo',actionPlan:'Reservar patrón alterno',actionOwnerId:actor,actionDue:'2026-12-01'};
const risk=await post('mutate',{module:'risks',action:'create',data:riskData});const original=state.risks.find(x=>x.id===risk.id),oldAction=original.qualityId;
await post('action42/followup',{id:oldAction,note:'En proceso',lines:state.quality.find(x=>x.id===oldAction).planLines42.map(x=>({...x,status:'En proceso'}))});
await post('mutate',{module:'risks',id:risk.id,action:'edit',data:{...riskData,actionResources42:'Dos patrones de respaldo'}});
let revised=state.risks.find(x=>x.id===risk.id);assert.notEqual(revised.qualityId,oldAction);assert.ok(revised.previousActionIds42.includes(oldAction));assert.equal(state.quality.find(x=>x.id===oldAction).planLines42[0].resources,'Patrón de respaldo');assert.equal(state.quality.find(x=>x.id===revised.qualityId).planLines42[0].resources,'Dos patrones de respaldo');
await post('mutate',{module:'risks',id:risk.id,action:'advance'});await login('calidad');await post('mutate',{module:'risks',id:risk.id,action:'advance'});await login('admin');await post('work28',{module:'risks',id:risk.id,action:'amend'});
await post('work28',{module:'risks',id:risk.id,action:'advance'},400);
await post('work28',{module:'risks',id:risk.id,action:'edit',data:{changeReason:'Ampliar recursos de tratamiento'}});
await post('work28',{module:'risks',id:risk.id,action:'advance'});
// State writes require same-origin and a current revision.
const stale=await request('/laboratorio/laboratorio-qa/api/mutate',{module:'clients',action:'create',revision:0,data:{name:'No guardar'}},cookie);assert.equal(stale.status,409);
const csrf=await worker.fetch(new Request(origin+'/laboratorio/laboratorio-qa/api/mutate',{method:'POST',headers:{origin:'https://other.example',cookie,'content-type':'application/json'},body:JSON.stringify({revision:state.revision,module:'clients',action:'create',data:{name:'No guardar'}})}),env);assert.equal(csrf.status,403);
await mkdir('/tmp/cubolabs-audit',{recursive:true});await writeFile('/tmp/cubolabs-audit/permissions.json',JSON.stringify({tools:Object.keys(META).length,flows:FLOW,inventory,denied,previews},null,2));
console.log(`PASS real SaaS routes: ${Object.keys(META).length} tools, 10 users, ${denied} denied writes, ${previews} PDF previews; assigned-line isolation, plan immutability during follow-up, revision reasons, action history, stale revisions and cross-origin protection`);
