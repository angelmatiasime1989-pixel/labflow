import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile('worker/index.js','utf8');
const {compactState38}=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {compactState38};').toString('base64'));
// Synthetic heavy document state; independent of local databases or previous runs.
const logo={base64:'A'.repeat(40000)};const state={revision:5,labProfile:{logo},labSettings:[{logo}],reports:Array.from({length:20},(_,id)=>({id,institutionSnapshot:{name:'Fictional lab',logo},base64:'B'.repeat(20000)}))},before=JSON.stringify(state),compact=compactState38(state);
assert.equal(JSON.stringify(state),before);assert.ok(JSON.stringify(compact).length<before.length/4);assert.equal(compact.revision,state.revision);assert.equal(compact.reports.length,state.reports.length);assert.ok(compact.labProfile.logo.base64);assert.equal(compact.reports.find(r=>r.institutionSnapshot)?.institutionSnapshot.logo,undefined);
const ui=await readFile('worker/v38-ui.js','utf8'),c=vm.createContext({render(){},loginScreen(){},document:{},console});vm.runInContext(ui,c);
for(const [q,m] of [['Muéstrame las ventas del mes','sales'],['ventas acumuladas del año','sales'],['compras pendientes','purchases'],['resultados del mes','reports'],['estado de resultados','fiscal30'],['procedimiento de compras','documents']])assert.equal(vm.runInContext('intent38('+JSON.stringify(q)+').module',c),m);
assert.equal(vm.runInContext("intent38('ventas del año').kind",c),'annual');
console.log('PASS compact startup payload '+before.length+' → '+JSON.stringify(compact).length+' bytes, unchanged persisted data, natural-language intents');
