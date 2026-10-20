// Read-only R2 export via AWS CLI. Run only after stopping ALL source writers.
// Credentials are supplied through AWS_PROFILE or the standard AWS environment.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const run=promisify(execFile);
process.umask(0o077);
try{
 const [bucket,directory]=process.argv.slice(2),endpoint=new URL(process.env.R2_ENDPOINT||'');
 if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket||'')||!directory||endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.r2.cloudflarestorage.com')||endpoint.username||endpoint.password||endpoint.pathname!=='/'||endpoint.search||endpoint.hash||endpoint.port)throw Error('Set R2_ENDPOINT to the account HTTPS endpoint; arguments: BUCKET NEW_EXPORT_DIRECTORY');
 const base=['s3api','--endpoint-url',endpoint.origin,'--region','auto','--no-cli-pager','--output','json'];
 async function aws(args){try{const result=await run('aws',[...base,...args],{maxBuffer:8*1024*1024,env:{...process.env,AWS_PAGER:'',AWS_CLI_AUTO_PROMPT:'off'}});return JSON.parse(result.stdout);}catch{throw Error('AWS CLI read failed; verify read-only credentials, source access and source stability');}}
 async function inventory(){let token;const objects=[];do{const page=await aws(['list-objects-v2','--bucket',bucket,'--max-keys','1000','--no-paginate',...(token?['--continuation-token',token]:[]),'--output','json']);objects.push(...(page.Contents||[]).map(x=>({key:x.Key,etag:x.ETag,size:x.Size})));token=page.IsTruncated?page.NextContinuationToken:undefined;if(page.IsTruncated&&!token)throw Error('Incomplete source listing');}while(token);return objects.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);}
 const source=await inventory();await mkdir(resolve(directory),{mode:0o700});const manifest={format:'labflow-objects',version:1,objects:[]};
 for(const object of source){const file=manifest.objects.length+'.bin',path=resolve(directory,file);await aws(['get-object','--bucket',bucket,'--key',object.key,'--if-match',object.etag,path]);const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);const size=(await stat(path)).size;if(size!==object.size)throw Error('Source object size mismatch');manifest.objects.push({key:object.key,file,size,sha256:hash.digest('hex')});}
 if(JSON.stringify(source)!==JSON.stringify(await inventory()))throw Error('Source changed during export; keep source frozen and restart with a new directory');
 await writeFile(resolve(directory,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});console.log('Verified read-only R2 export completed: '+manifest.objects.length+' objects');
}catch(e){console.error(e.message);process.exitCode=1;}
