import vm from 'node:vm';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
class Bucket{constructor(){this.map=new Map();this.n=0}async get(k){const v=this.map.get(k);return v?{etag:v.etag,json:async()=>JSON.parse(v.body)}:null}async put(k,v,opt={}){const old=this.map.get(k);if(opt.onlyIf?.etagMatches&&old?.etag!==opt.onlyIf.etagMatches)return null;this.map.set(k,{body:String(v),etag:String(++this.n)});return{etag:String(this.n)}}}
const env={BUCKET:new Bucket()};let cookie='',fail=false;
async function request(path,options={}){return worker.fetch(new Request('https://test.example'+path,{...options,headers:{origin:'https://test.example',cookie,'content-type':'application/json',...options.headers}}),env)}
const login=await request('/api/login',{method:'POST',body:JSON.stringify({username:'admin',password:'DemoLab2026!'})});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
let state=await(await request('/api/state')).json();const key='public-demo/state-v1.json',raw=await(await env.BUCKET.get(key)).json();
const purchase={...raw.purchases[0],id:999,folio:'COM-QA34',status:'Recibida solicitud',selectedBidId:null,purchaseOrderId:null,requesterId:1};raw.purchases.push(purchase);await env.BUCKET.put(key,JSON.stringify(raw));state=await(await request('/api/state')).json();
const dom=new Map();function node(){return{innerHTML:'',textContent:'',value:'',dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return node()},querySelectorAll(){return[]},insertAdjacentHTML(p,h){this.innerHTML=p==='afterbegin'?h+this.innerHTML:this.innerHTML+h},appendChild(){},remove(){},setAttribute(){}}}const el=k=>{if(!dom.has(k))dom.set(k,node());return dom.get(k)};
const context=vm.createContext({document:{querySelector:el,querySelectorAll:()=>[],createElement:node,addEventListener(){},body:node()},location:{origin:'https://test.example'},window:{scrollY:0,scrollTo(){},open(){}},console,Intl,Date,JSON,Number,String,Math,Set,Blob,URL,URLSearchParams,AbortController,FormData:class{},setTimeout(){},clearTimeout(){},setInterval(){},confirm:()=>true,prompt:()=>'',fetch:async(path,options)=>{if(fail&&options?.method==='POST')return new Response(JSON.stringify({error:'Fallo simulado'}),{status:503});return request(path,options)}});
const html=await(await request('/')).text();vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/boot\(\);\s*$/,''),context);vm.runInContext('S='+JSON.stringify(state)+';nav("alerts");detail("purchases",999)',context);
assert.ok(el('#overlay').innerHTML.includes('Atender y empezar cotización'));
await vm.runInContext('action("purchases",999,"advance")',context);
assert.equal(vm.runInContext('current',context),'purchases');assert.equal(vm.runInContext('ref("purchases",999).status',context),'Cotizando');assert.ok(el('#overlay').innerHTML.includes('requestId'));assert.ok(el('#overlay').innerHTML.includes('value="999"'));assert.ok(el('#overlay').innerHTML.includes('Proveedor'));assert.ok(el('#toast').textContent.includes('Registra la cotización'));
console.log('PASS full production UI + real API: notification → purchase detail → attend → linked supplier quote form; stays in Purchases.');
vm.runInContext('detail("purchases",999)',context);const before=el('#overlay').innerHTML;fail=true;await vm.runInContext('action("purchases",999,"advance")',context);assert.equal(el('#overlay').innerHTML,before);assert.ok(el('#modalerror').innerHTML.includes('Fallo simulado'));fail=false;
vm.runInContext('toast("Error de conexión")',context);assert.equal(el('#toast').textContent,'Error de conexión');console.log('PASS failed transition retains detail and explicit error; receipt never masks errors.');
// Sent form still closes only after a confirmed server write and names the destination.
vm.runInContext('nav("alerts");modal("Captura","Prueba","<form>Contenido</form>")',context);
await vm.runInContext('mutate("purchases",null,"create",{name:"Solicitud QA34",kind:"Servicio",serviceType:"Capacitación",description:"Prueba funcional",quantity:1,unit:"servicio",costCenterId:1,due:S.today},{send:true})',context);
assert.equal(el('#overlay').innerHTML,'');assert.equal(vm.runInContext('current',context),'purchases');assert.ok(el('#toast').textContent.includes('Envío exitoso'));
console.log('PASS confirmed send closes capture and leaves notification context for the corresponding module.');
// New-position return ignores pre-existing descriptions, then selects only the new record.
vm.runInContext('current="employees";pendingEmployee28={data:{name:"Persona QA"},id:null,positionIds:S.jobDescriptions.map(p=>p.id)}',context);await vm.runInContext('refresh()',context);assert.ok(vm.runInContext('pendingEmployee28!==null',context));
console.log('PASS personnel nested workflow: refreshing cannot select an old position as the newly created one.');

vm.runInContext('modal("Documento","Prueba","<form>Documento</form>")',context);
await vm.runInContext('mutate("meetings",null,"create",{name:"Reunión QA34",meetingDate:S.today,meetingTime:"10:00",location:"Sala",ownerId:3,attendeeIds:[1,3],objective:"Revisar",agenda:"Procesos",discussion:"Acuerdos"},{send:true})',context);
assert.equal(el('#overlay').innerHTML,'');assert.match(el('#toast').textContent,/Enviado a:.*Calidad/);assert.equal(vm.runInContext('receipt33.message',context),el('#toast').textContent);
console.log('PASS real controlled-document send returns the actual Quality recipient in the confirmation.');

const rawBid=await(await env.BUCKET.get(key)).json();rawBid.purchaseBids.push({id:999,requestId:999,supplierId:1,folio:"BID-QA34",unitPrice:100,taxRate:16,deliveryDays:1,due:state.today,terms:"Contado"});rawBid.purchases.find(p=>p.id===999).quantity=1;await env.BUCKET.put(key,JSON.stringify(rawBid));
await vm.runInContext('refresh();',context);vm.runInContext('detail("purchases",999)',context);assert.ok(el('#overlay').innerHTML.includes('Seleccionar compra menor'));assert.ok(!el('#overlay').innerHTML.includes('Enviar propuestas a autorización'));
rawBid.purchaseBids[rawBid.purchaseBids.length-1].unitPrice=2000;await env.BUCKET.put(key,JSON.stringify(rawBid));await vm.runInContext('refresh()',context);vm.runInContext('detail("purchases",999)',context);assert.ok(!el('#overlay').innerHTML.includes('Seleccionar compra menor'));console.log('PASS small-purchase selection is reachable from the UI; exact 2000 boundary cannot bypass three-proposal authorization.');
