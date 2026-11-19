import test from 'node:test';import assert from 'node:assert/strict';import {fixture} from './helpers/saas-fixture.mjs';
test('accounting is restricted by server to Diamond and Enterprise, including old contract scopes',async t=>{
 const f=await fixture(t);
 for(const plan of ['silver','gold','platinum','diamond','enterprise-custom']){
  const slug='accounts-'+plan,a=await f.customer(slug,plan),cookie=await f.tenantLogin(slug),base='/laboratorio/'+slug+'/api/';
  if(['silver','gold','platinum'].includes(plan)){const old=await(await f.bucket.get('saas/platform-v1.json')).json();const customer=old.customers.find(c=>c.id===a.id);customer.modules.push('accounting');customer.tools=[...(customer.tools||[]),'accounts','accounting','fiscal30'];await f.bucket.put('saas/platform-v1.json',JSON.stringify(old));}
  const s=await(await f.request(base+'state',null,{cookie})).json(),allowed=['diamond','enterprise-custom'].includes(plan);
  assert.equal(s.me.permissions.view.includes('accounts'),allowed,plan);
  if(!allowed){assert.equal(s.accounts?.length||0,0);assert.equal(s.financialSummary,undefined);assert.equal((await f.request(base+'fiscal30/summary',null,{cookie})).status,403);assert.equal((await f.request(base+'mutate',{module:'accounts',action:'create',revision:s.revision,data:{code:'X',name:'Synthetic',type:'Activo'}},{cookie})).status,403);}
 }
});
test('catalog deletion preserves references, automatic roles, isolation and revision checks',async t=>{
 const f=await fixture(t),a=await f.customer('catalog'),other=await f.customer('other-catalog'),cookie=await f.tenantLogin('catalog'),base='/laboratorio/catalog/api/';
 let raw=await(await f.bucket.get(a.key)).json();const template=raw.accounts.find(a=>a.systemKey==='bank');
 raw.accounts.push({...template,id:900,code:'SYN900',name:'Cuenta sintética',systemKey:undefined},{...template,id:901,code:'SYN901',name:'Cuenta usada',systemKey:undefined});raw.accounting.push({id:900,debitId:901,creditId:template.id,status:'Borrador',amount:10,due:'2026-01-01'});await f.bucket.put(a.key,JSON.stringify(raw));
 const state=async()=> (await f.request(base+'state',null,{cookie})).json();
 const mutate=async(id,extra={})=>f.request(base+'mutate',{module:'accounts',id,action:'deleteAccount',reason:'Prueba sintética',revision:(await state()).revision,...extra},{cookie});
 assert.equal((await mutate(901)).status,400);assert.equal((await mutate(900,{reason:''})).status,400);
 let revision=(await state()).revision;assert.equal((await mutate(900)).status,200);assert.equal((await mutate(901,{revision})).status,409);
 raw=await(await f.bucket.get(a.key)).json();assert.ok(!raw.accounts.some(a=>a.id===900));assert.equal(raw.accounting.length,1);assert.ok(raw.audit.some(a=>a.action==='Eliminación de cuenta sin movimientos'));
 // Replace an unused automatic role with a custom account, without touching journals.
 const source=raw.accounts.find(a=>a.systemKey==='revenue');raw.accounts.push({...source,id:902,code:'SYN902',systemKey:undefined});await f.bucket.put(a.key,JSON.stringify(raw));
 assert.equal((await mutate(source.id)).status,400);assert.equal((await mutate(source.id,{replacementId:902})).status,200);
 raw=await(await f.bucket.get(a.key)).json();assert.equal(raw.accounts.find(a=>a.id===902).systemKey,'revenue');assert.ok(!raw.accounts.some(a=>a.id===source.id));
 const untouched=await(await f.bucket.get(other.key)).json();assert.ok(untouched.accounts.some(a=>a.systemKey==='revenue'));assert.ok(!untouched.accounts.some(a=>a.id===902));
 const again=await f.tenantLogin('catalog');assert.ok(!(await(await f.request(base+'state',null,{cookie:again})).json()).accounts.some(a=>a.id===900));
});
test('account codes are configurable, children follow renames, protected periods and role restrictions persist',async t=>{
 const f=await fixture(t),a=await f.customer('catalog-edit'),cookie=await f.tenantLogin('catalog-edit'),base='/laboratorio/catalog-edit/api/';
 let raw=await(await f.bucket.get(a.key)).json(),parent=raw.accounts.find(a=>a.systemKey==='revenue');raw.accounts.push({...parent,id:910,code:'CHILD',parent:parent.code,level:parent.level+1,systemKey:undefined});await f.bucket.put(a.key,JSON.stringify(raw));
 const state=async()=> (await f.request(base+'state',null,{cookie})).json();
 async function change(action,id,data={},extra={}){return f.request(base+'mutate',{module:'accounts',action,id,data,reason:'Prueba de configuración',revision:(await state()).revision,...extra},{cookie});}
 assert.equal((await change('deleteAccount',parent.id)).status,400);
 let response=await change('edit',parent.id,{...parent,code:'REVENUE-CUSTOM',name:'Ingresos configurados'});assert.equal(response.status,200,await response.clone().text());
 raw=await(await f.bucket.get(a.key)).json();assert.equal(raw.accounts.find(a=>a.id===910).parent,'REVENUE-CUSTOM');assert.equal(raw.accounts.find(a=>a.id===parent.id).systemKey,'revenue');
 assert.equal((await change('deleteAccount',910)).status,200);
 response=await change('create',null,{...parent,code:'NEW-CUSTOM',name:'Cuenta nueva'});assert.equal(response.status,200,await response.clone().text());assert.ok((await response.json()).id>910,'deleted IDs cannot be reused');
 raw=await(await f.bucket.get(a.key)).json();raw.closedPeriods30=[{period:'2025-01',status:'Cerrado'}];await f.bucket.put(a.key,JSON.stringify(raw));assert.equal((await change('deleteAccount',raw.accounts.find(a=>a.code==='NEW-CUSTOM').id)).status,400);
 raw.closedPeriods30=[];raw.users.find(u=>u.username==='lab-admin').role='Técnico';await f.bucket.put(a.key,JSON.stringify(raw));assert.equal((await change('deleteAccount',parent.id)).status,403);
});
