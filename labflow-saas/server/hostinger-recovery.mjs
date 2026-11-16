import {backup} from 'node:sqlite';
import {existsSync} from 'node:fs';
import {readdir,realpath,mkdir,readFile,writeFile,mkdtemp,link,rm,chmod,lstat} from 'node:fs/promises';
import {resolve,join,basename,isAbsolute,relative} from 'node:path';
import {storagePaths} from './storage-paths.mjs';
import {readExistingDatabase,createEncryptedBackup} from './backup-service.mjs';

function inside(path,parent){const rest=relative(parent,path);return rest===''||!rest.startsWith('../')&&rest!=='..'&&!isAbsolute(rest);}
function verifyDatabase(file){const db=readExistingDatabase(file);try{const provider=db.prepare('SELECT id FROM provider WHERE slot=1').get();if(!provider)throw Error('La base no tiene administrador; no se inicializará automáticamente.');if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('La base no superó la comprobación de integridad.');return provider.id;}finally{db.close();}}

// Only the verified Hostinger layout and the legacy default are eligible.
// Generic hosts and explicitly configured absolute database paths keep strict validation.
export async function recoverHostingerStorage({env,root,onRecovered=()=>{}}){
 if(![undefined,'','data','./data'].includes(env.DATA_DIR)||env.DB_DRIVER&&env.DB_DRIVER!=='sqlite'||env.HOSTINGER_STORAGE_RECOVERY==='false')return env;
 const physicalRoot=await realpath(root),layout=physicalRoot.match(/^(.*\/domains\/[^/]+)\/hbuilds\/versions\/[^/]+\/nodejs(?:\/labflow-saas)?$/);
 if(!layout)return env;
 const domain=layout[1];let hostname;try{hostname=new URL(env.PUBLIC_URL).hostname;}catch{return env;}
 if(hostname!==basename(domain))return env;
 const effective={...env,DATA_DIR:join(domain,'qubolabs-data'),BACKUP_DIR:join(domain,'qubolabs-backups')};
 const paths=storagePaths({...effective,NODE_ENV:'production'},physicalRoot),versions=await realpath(join(domain,'hbuilds/versions'));
 if(inside(paths.data,versions)||inside(paths.backups,versions))throw Error('Los destinos de recuperación no pueden estar dentro de las versiones.');
 await mkdir(paths.data,{recursive:true,mode:0o700});
 const marker=join(paths.data,'.hostinger-recovery.json'),lock=join(paths.data,'.recovery-lock');
 try{await mkdir(lock,{mode:0o700});}catch{throw Error('Otra recuperación está en curso o dejó un bloqueo. No se sobrescribirá la base.');}
 let temporary;
 try{
  let previous=null;try{previous=JSON.parse(await readFile(marker,'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Registro de recuperación ilegible. Se requiere revisión antes de continuar.');}
  if(existsSync(paths.file)){
   const id=verifyDatabase(paths.file);if(previous&&previous.providerId!==id)throw Error('La identidad de la base persistente no coincide con su registro de recuperación.');
   if(!previous)await writeFile(marker,JSON.stringify({providerId:id,at:new Date().toISOString(),existing:true}),{flag:'wx',mode:0o600});
   onRecovered({reused:true,data:paths.data,backups:paths.backups});return effective;
  }
  if(previous)throw Error('Falta la base persistente recuperada anteriormente. No se sustituirá por una copia antigua.');
  const sources=[];
  for(const version of await readdir(versions,{withFileTypes:true})){
   if(!version.isDirectory()||version.isSymbolicLink())continue;
   for(const suffix of ['nodejs/data/cubolabs.sqlite','nodejs/labflow-saas/data/cubolabs.sqlite']){
    const file=join(versions,version.name,suffix);if(!existsSync(file))continue;
    if((await lstat(file)).isSymbolicLink()||!inside(await realpath(file),versions))throw Error('Origen de recuperación fuera de las versiones esperadas.');
    sources.push(file);
   }
  }
  if(sources.length!==1)throw Error('Recuperación Hostinger detenida: se requiere exactamente una base anterior; se encontraron '+sources.length+'. No se elegirá ni creará una base automáticamente.');
  const source=sources[0],id=verifyDatabase(source),db=readExistingDatabase(source);
  try{
   await createEncryptedBackup(db,{directory:paths.backups,env:effective});
   temporary=await mkdtemp(join(paths.data,'.snapshot-'));const snapshot=join(temporary,'cubolabs.sqlite');
   await backup(db,snapshot);await chmod(snapshot,0o600);if(verifyDatabase(snapshot)!==id)throw Error('La copia no conserva la identidad original.');
   await link(snapshot,paths.file); // Atomic and refuses overwrite.
  }finally{db.close();}
  await writeFile(marker,JSON.stringify({providerId:id,source,at:new Date().toISOString()}),{flag:'wx',mode:0o600});
  onRecovered({reused:false,data:paths.data,backups:paths.backups});return effective;
 }finally{if(temporary)await rm(temporary,{recursive:true,force:true});await rm(lock,{recursive:true,force:true});}
}
