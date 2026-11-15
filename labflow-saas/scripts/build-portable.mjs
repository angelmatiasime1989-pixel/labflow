import {fileURLToPath} from 'node:url';
import {mkdir,rm,copyFile,writeFile} from 'node:fs/promises';
import './assemble.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await copyFile('worker/index.js','dist/server/index.js');
try{await copyFile('.openai/hosting.json','dist/.openai/hosting.json');}catch(error){if(error.code!=='ENOENT')throw error;await writeFile('dist/.openai/hosting.json','{}\n');}
console.log('Build Node completo: dist/server/index.js. Sin dependencia de Python.');
