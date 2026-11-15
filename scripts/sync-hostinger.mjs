// Generated deployment copy for hosts that only allow a subdirectory as app root.
// Edit the sources in the repository root, then run npm run sync:hostinger.
import {readFile,readdir,mkdir,writeFile,lstat} from 'node:fs/promises';
import {dirname,join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(basename(root.replace(/\/$/,''))==='labflow-saas')throw Error('Run sync:hostinger from the repository root, not the generated deployment copy.');
const destination=join(root,'labflow-saas'),check=process.argv.includes('--check');
const files=['package.json','package-lock.json','.env.example','.gitignore','README.md','DEPLOYMENT.md','EXPORTACION.md','SOURCE-MANIFEST.json'];
const folders=['.openai','server','worker','vendor','scripts','deploy','docs'];
async function walk(relative){for(const name of(await readdir(join(root,relative))).sort()){if(['node_modules','dist','data','backups','.git','.wrangler','.sites-runtime'].includes(name)||name.startsWith('.qa-')||name.startsWith('.env')&&name!=='.env.example'||/\.(sqlite(?:[-.].*)?|db|clbackup|pem|key|p12|pfx|log|zip)$/i.test(name))continue;const path=join(relative,name),info=await lstat(join(root,path));if(info.isSymbolicLink())throw Error('Symlink excluded: '+path);if(info.isDirectory())await walk(path);else if(info.isFile())files.push(path);}}
for(const folder of folders)await walk(folder);
const differences=[];for(const file of files){const content=await readFile(join(root,file));let previous;try{previous=await readFile(join(destination,file));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(!previous?.equals(content)){differences.push(file);if(!check){await mkdir(dirname(join(destination,file)),{recursive:true});await writeFile(join(destination,file),content);}}}
if(check&&differences.length){console.error('Hostinger deployment copy is stale. Run npm run sync:hostinger.\n'+differences.join('\n'));process.exitCode=1;}else console.log((check?'Verified':'Synchronized')+' '+files.length+' public application files in labflow-saas; private data and configuration excluded.');
