// Legacy domain suites target labflowApp. Run in a disposable copy with portable
// fixture/output paths; SaaS gateway tests run separately against the actual bundle.
import {mkdtemp,cp,readFile,writeFile,readdir,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const stage=await mkdtemp(join(tmpdir(),'labflow-regression-'));
const suites=['test.mjs','v7-test.mjs','v10-test.mjs','v13-test.mjs','v14-test.mjs','v17-test.mjs','v27-test.mjs','v30-test.mjs','v35-test.mjs','v37-test.mjs','v42-test.mjs'];
let failures=0;
try{
 await cp(root,join(stage,'project'),{recursive:true,filter:path=>!['node_modules','.wrangler','dist'].includes(path.split('/').pop())});
 const project=join(stage,'project'),bundle=join(project,'worker/index.js');
 await writeFile(bundle,(await readFile(bundle,'utf8')).replace('export default saasGateway;','export default labflowApp;'));
 const pdf=join(stage,'pdf-lib.cjs');await cp(join(root,'vendor/pdf-lib.min.js'),pdf);
 for(const name of await readdir(join(project,'scripts'))){if(!name.endsWith('.mjs'))continue;const path=join(project,'scripts',name);let source=await readFile(path,'utf8');for(const match of source.matchAll(/['"](\/workspace\/scratch\/[^'"]+)['"]/g)){const relative=match[1].slice('/workspace/scratch/'.length);await mkdir(join(stage,'scratch',relative.endsWith('.pdf')||relative.endsWith('.zip')||relative.endsWith('.xml')?relative.split('/').slice(0,-1).join('/'):relative),{recursive:true});}source=source.replaceAll('/workspace/scratch/',join(stage,'scratch')+'/').replaceAll('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/pdf-lib',pdf).replaceAll('/tmp/labflow-state.json',join(stage,'state.json')).replaceAll('/tmp/labflow42',join(stage,'qa42'));await writeFile(path,source);}
 for(const suite of suites){const result=await new Promise(resolveRun=>{let output='';const child=spawn(process.execPath,['scripts/'+suite],{cwd:project,stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>child.kill('SIGTERM'),120000);child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);child.on('error',error=>{clearTimeout(timer);resolveRun({code:1,output:error.message});});child.on('close',code=>{clearTimeout(timer);resolveRun({code,output});});});if(result.code!==0){failures++;console.error('FAIL '+suite+'\n'+result.output.slice(-3500));}else console.log('PASS '+suite);}
 console.log(`${suites.length-failures}/${suites.length} legacy domain suites passed; isolated copy, no real tenant data.`);
 process.exitCode=failures?1:0;
}finally{await rm(stage,{recursive:true,force:true});}
