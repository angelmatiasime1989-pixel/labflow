import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {pwaResponse} from '../server/pwa.mjs';
async function navigation(path,{tenant=false,status=503,networkError=false,cached=true}={}){
 const handlers={},origin=tenant?'https://lab.qubolabs.test':'https://qubolabs.test';
 const source=await pwaResponse('/sw.js',{tenant}).text();
 vm.runInNewContext(source,{URL,Response,self:{location:{origin},addEventListener:(type,fn)=>handlers[type]=fn},caches:{open:async()=>({match:async()=>cached?new Response('PRIVATE OFFLINE DOCUMENT MANAGER'):undefined})},fetch:async()=>{if(networkError)throw Error('synthetic unreachable');return new Response('ORIGIN '+status,{status});}});
 let promise;handlers.fetch({request:{url:origin+path,method:'GET',mode:'navigate'},respondWith:p=>promise=p});
 return promise?{handled:true,response:await promise}:{handled:false};
}
for(const path of ['/','/entrar','/administrador/ingresar','/admin/','/blog','/preguntas-frecuentes']){
 test('public navigation preserves origin 503 at '+path,async()=>{const {response}=await navigation(path);assert.equal(response.status,503);assert.equal(await response.text(),'ORIGIN 503');});
 test('public network failure never substitutes document manager at '+path,async()=>{const {response}=await navigation(path,{networkError:true});assert.equal(response.status,503);assert.ok(!(await response.text()).includes('PRIVATE OFFLINE DOCUMENT MANAGER'));assert.equal(response.headers.get('cache-control'),'no-store');});
}
test('healthy landing stays the origin response',async()=>{const {response}=await navigation('/',{status:200});assert.equal(response.status,200);assert.equal(await response.text(),'ORIGIN 200');});
for(const networkError of [false,true])test('laboratory paths and tenant root keep offline document access: networkError='+networkError,async()=>{for(const [path,tenant] of [['/laboratorio/qa-lab/',false],['/',true]]){const {response}=await navigation(path,{tenant,networkError});assert.equal(response.status,200);assert.equal(await response.text(),'PRIVATE OFFLINE DOCUMENT MANAGER');}});
test('missing offline cache preserves origin error',async()=>{const {response}=await navigation('/laboratorio/qa-lab/',{cached:false});assert.equal(response.status,503);assert.equal(await response.text(),'ORIGIN 503');});
test('API and public trial remain outside navigation fallback',async()=>{for(const path of ['/api/provider/session','/laboratorio/qa-lab/api/state','/prueba-documental'])assert.equal((await navigation(path)).handled,false);});
