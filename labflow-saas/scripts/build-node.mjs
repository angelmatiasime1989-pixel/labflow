import {mkdirSync,copyFileSync,rmSync,writeFileSync} from 'node:fs';
import './assemble.mjs';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
rmSync(dist,{recursive:true,force:true});
mkdirSync(new URL('server/',dist),{recursive:true});
mkdirSync(new URL('.openai/',dist),{recursive:true});
copyFileSync(new URL('worker/index.js',root),new URL('server/index.js',dist));
// Node hosting does not require the optional Sites manifest. Some build systems
// omit dot-directories, so generate a valid empty manifest when it is absent.
try{
 copyFileSync(new URL('.openai/hosting.json',root),new URL('.openai/hosting.json',dist));
}catch(error){
 if(error.code!=='ENOENT')throw error;
 writeFileSync(new URL('.openai/hosting.json',dist),'{}\n');
 console.log('Optional hosting manifest absent; generated an empty manifest.');
}
await import('./validate-artifact.mjs');
console.log('LabFlow build complete using Node.js only');
