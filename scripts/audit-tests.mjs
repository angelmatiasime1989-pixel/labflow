import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
const tests=['startup31-test','ui-test','v38-test','test','v6-test','v7-test','v8-test','v9-test','v11-test','v12-test','v13-test','v14-test','v15-test','v16-test','v17-test','v18-test','v19-test','v24-test','v27-test','v28-test','v29-test','v30-test','v32-test','v33-test','v34-test','v35-test','v37-test','v40-test','v42-test','cubolabs-test','module-tabs-test','saas-test','sales-profile-test','workflow-audit-test'];
const modern=new Set(['cubolabs-test','module-tabs-test','saas-test','sales-profile-test','workflow-audit-test','v33-test','v40-test']);
const root='/tmp/cubolabs-audit';await mkdir(root,{recursive:true});
// Historical artifact paths are portable and temporary; prepare their parent folders.
for(const test of tests){const s=await readFile('scripts/'+test+'.mjs','utf8');for(const m of s.matchAll(/['"](\/tmp\/cubolabs-audit\/legacy\/[^'"+]+)['"]/g))await mkdir(dirname(m[1]),{recursive:true});}
let cursor=0;const results=[];
async function run(){while(cursor<tests.length){const name=tests[cursor++],start=Date.now();const args=['--disable-warning=ExperimentalWarning',...(!modern.has(name)?['--import','./scripts/test-clock.mjs','--loader','./scripts/core-test-loader.mjs']:[]),'scripts/'+name+'.mjs'];const log=await new Promise(resolve=>{const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('close',code=>resolve({code,output}));});await writeFile(root+'/'+name+'.log',log.output);const result={name,code:log.code,seconds:Math.round((Date.now()-start)/100)/10};results.push(result);console.log(JSON.stringify(result));}}
await Promise.all([run(),run(),run()]);results.sort((a,b)=>a.name.localeCompare(b.name));await writeFile(root+'/results.json',JSON.stringify(results,null,2));if(results.some(r=>r.code!==0))process.exitCode=1;
