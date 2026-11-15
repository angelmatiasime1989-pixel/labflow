import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {mkdir,rm,copyFile} from 'node:fs/promises';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const candidates=process.platform==='win32'?[['py',['-3']],['python',[]],['python3',[]]]:[['python3',[]],['python',[]]];
let built=false;for(const [cmd,args] of candidates){const probe=spawnSync(cmd,[...args,'--version'],{stdio:'ignore'});if(probe.status!==0)continue;const run=spawnSync(cmd,[...args,'scripts/assemble.py'],{stdio:'inherit'});if(run.status!==0)process.exit(run.status||1);built=true;break;}
if(!built)throw Error('Instala Python 3 y agrégalo a PATH.');
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await copyFile('worker/index.js','dist/server/index.js');await copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Build completo: dist/server/index.js');
