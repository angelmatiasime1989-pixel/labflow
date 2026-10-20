import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,access,link,rm,copyFile,stat} from 'node:fs/promises';
import {createReadStream,constants} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {SqliteBucket} from './bucket.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function digestFile(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}
async function absent(path){try{await access(path);}catch(e){if(e.code==='ENOENT')return;throw e;}throw Error('Destination already exists; refusing to overwrite');}
function integrity(path){const db=new DatabaseSync(path,{readOnly:true});try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('SQLite integrity check failed');db.prepare('SELECT key,bytes,etag,uploaded FROM objects LIMIT 1').all();}finally{db.close();}}
export async function backupDatabase(source,destination){
 await access(source);integrity(source);await absent(destination);await absent(destination+'.json');await mkdir(dirname(destination),{recursive:true,mode:0o700});
 const bucket=new SqliteBucket(source);try{await bucket.snapshot(destination);}finally{bucket.close();}
 integrity(destination);await writeFile(destination+'.json',JSON.stringify({format:'labflow-sqlite-backup',version:1,sha256:await digestFile(destination),size:(await stat(destination)).size,createdAt:new Date().toISOString()},null,2),{flag:'wx',mode:0o600});
}
export async function restoreDatabase(source,destination){
 const manifest=JSON.parse(await readFile(source+'.json','utf8'));
 if(manifest.format!=='labflow-sqlite-backup'||manifest.version!==1||manifest.size!==(await stat(source)).size||manifest.sha256!==await digestFile(source))throw Error('Backup checksum mismatch');
 integrity(source);await absent(destination);await absent(destination+'-wal');await absent(destination+'-shm');await mkdir(dirname(destination),{recursive:true,mode:0o700});await copyFile(source,destination,constants.COPYFILE_EXCL);
}
export async function exportObjects(source,directory){
 await absent(directory);await mkdir(directory,{recursive:true,mode:0o700});const snapshot=resolve(directory,'snapshot.sqlite');let bucket;
 try{await backupDatabase(source,snapshot);bucket=new SqliteBucket(snapshot);const manifest={format:'labflow-objects',version:1,objects:[]};let cursor;
 do{const page=await bucket.list({cursor});for(const row of page.objects){const object=await bucket.get(row.key),bytes=Buffer.from(await object.arrayBuffer()),file=String(manifest.objects.length)+'.bin';await writeFile(resolve(directory,file),bytes,{flag:'wx',mode:0o600});manifest.objects.push({key:row.key,file,size:bytes.length,sha256:digest(bytes)});}cursor=page.truncated?page.cursor:undefined;}while(cursor);
 await writeFile(resolve(directory,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
 }finally{bucket?.close();await rm(snapshot,{force:true});await rm(snapshot+'.json',{force:true});}
}
export async function importObjects(directory,destination){
 const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
 if(manifest.format!=='labflow-objects'||manifest.version!==1||!Array.isArray(manifest.objects))throw Error('Unsupported object manifest');
 const keys=new Set();for(const object of manifest.objects){if(typeof object.key!=='string'||!object.key||keys.has(object.key)||!/^\d+\.bin$/.test(object.file))throw Error('Invalid or duplicate object');keys.add(object.key);const bytes=await readFile(resolve(directory,object.file));if(bytes.length!==object.size||digest(bytes)!==object.sha256)throw Error('Object checksum mismatch');}
 await absent(destination);await absent(destination+'-wal');await absent(destination+'-shm');await mkdir(dirname(destination),{recursive:true,mode:0o700});const temporary=destination+'.importing';await absent(temporary);const bucket=new SqliteBucket(temporary);
 try{for(const object of manifest.objects){const bytes=await readFile(resolve(directory,object.file));if(bytes.length!==object.size||digest(bytes)!==object.sha256)throw Error('Object changed during import');await bucket.put(object.key,bytes);}bucket.close();integrity(temporary);await link(temporary,destination);await rm(temporary);}catch(e){try{bucket.close();}catch{}await rm(temporary,{force:true});throw e;}
}
if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href){process.umask(0o077);try{const [command,source,destination]=process.argv.slice(2);if(!source||!destination)throw Error('Usage: node vps/storage.mjs backup|restore|export|import SOURCE DESTINATION');const action={backup:backupDatabase,restore:restoreDatabase,export:exportObjects,import:importObjects}[command];if(!action)throw Error('Unknown command');await action(resolve(source),resolve(destination));console.log('Storage operation verified successfully');}catch(e){console.error(e.message);process.exitCode=1;}}
