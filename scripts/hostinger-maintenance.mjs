import {readdir,realpath,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,dirname,isAbsolute} from 'node:path';
import {homedir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export async function inspectDatabases(home=homedir()){
 const root=await realpath(home),files=[];let visited=0;
 async function walk(folder,depth){if(depth>12)return;let entries;try{entries=await readdir(folder,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw Error('No se pudo revisar un directorio de la cuenta SSH.');}
  for(const entry of entries){if(++visited>100000)throw Error('La búsqueda excedió su límite; solicita una inspección dirigida.');const path=join(folder,entry.name);
   if(entry.isDirectory()&&!['node_modules','.git','.cache','.npm','.qubolabs-maintenance','.qubolabs-preserved'].includes(entry.name))await walk(path,depth+1);
   else if(entry.isFile()&&entry.name==='cubolabs.sqlite'){const info=await stat(path);let db;try{db=new DatabaseSync(path,{readOnly:true});files.push({path,bytes:info.size,modified:info.mtime.toISOString(),readable:true,objects:Number(db.prepare('SELECT COUNT(*) count FROM objects').get().count),administrator:!!db.prepare('SELECT id FROM provider WHERE slot=1').get()});}catch{files.push({path,bytes:info.size,readable:false});}finally{db?.close();}}
  }
 }
 await walk(root,0);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function validateSource(source,home=homedir()){
 if(!isAbsolute(source||''))throw Error('Selecciona la ruta absoluta de la base que se migrará.');const root=await realpath(home),path=await realpath(source),rest=relative(root,path);
 if(rest.startsWith('..')||isAbsolute(rest)||!path.endsWith('/cubolabs.sqlite')||!(await stat(path)).isFile())throw Error('La base debe estar dentro de la cuenta SSH y llamarse cubolabs.sqlite.');return path;
}
export async function maintain(config){
 if(Number(process.versions.node.split('.')[0])<24)throw Error('Se requiere Node.js 24 o superior en la sesión SSH.');
 if(!['inspect','migrate'].includes(config.mode))throw Error('Acción inválida.');
 const home=homedir(),inventory=await inspectDatabases(home);
 if(config.mode==='inspect'){console.log(JSON.stringify({mode:'inspect',databases:inventory,notice:'No se han modificado ni descargado las bases. La fecha o cantidad de registros no identifican por sí solas la base activa.'},null,2));return;}
 if(config.writesPaused!==true)throw Error('Detén las escrituras de la aplicación antes de migrar.');
 const source=await validateSource(config.source,home),env={...process.env,...config.database,NODE_ENV:'production',DB_DRIVER:'mysql',BACKUP_ENCRYPTION_KEY:config.backupKey,BACKUP_REMOTE_REQUIRED:'false',R2_ACCOUNT_ID:'',R2_BUCKET:'',R2_ACCESS_KEY_ID:'',R2_SECRET_ACCESS_KEY:''};
 if(!/^[a-f0-9]{64}$/i.test(config.backupKey||''))throw Error('Falta la clave original de respaldo de 64 caracteres hexadecimales.');
 if(inventory.some(db=>!db.readable))throw Error('Hay bases que no se pudieron revisar; no se migrará una selección incompleta.');
 const root=fileURLToPath(new URL('../',import.meta.url)),pathEnv=dirname(process.execPath)+':'+(process.env.PATH||'');
 const install=spawnSync('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,env:{...process.env,PATH:pathEnv},encoding:'utf8',timeout:180000});
 if(install.status!==0)throw Error('No se pudieron instalar las dependencias en la carpeta de mantenimiento. No se modificó la aplicación.');
 const directory=join(home,'.qubolabs-preserved',new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(directory,{recursive:true,mode:0o700});env.BACKUP_DIR=directory;
 const {readExistingDatabase,createEncryptedBackup}=await import('../server/backup-service.mjs');
 const preserved=[];for(const candidate of inventory){const db=readExistingDatabase(candidate.path);try{const backup=await createEncryptedBackup(db,{directory,env});preserved.push({source:candidate.path,file:backup.file});}finally{db.close();}}
 await writeFile(join(directory,'manifest.json'),JSON.stringify(preserved,null,2),{flag:'wx',mode:0o600});console.log('Copias cifradas conservadas en '+directory);
 const result=spawnSync(process.execPath,['scripts/mysql-migrate.mjs','--from',source],{cwd:root,env,encoding:'utf8',timeout:180000});
 if(result.status!==0)throw Error('La migración no se completó. Las bases originales y las copias cifradas se conservan en '+directory+'. Revisa conectividad, TLS, permisos y que MySQL esté vacío.');
 console.log(JSON.stringify({mode:'migrate',verified:true,preservedDatabases:inventory.length,backupDirectory:directory,notice:'Origen conservado. No se cambió DB_DRIVER en Hostinger ni se publicó código. Antes de reanudar escrituras configura el backend MySQL y despliega la versión corregida.'},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let input='';for await(const chunk of process.stdin)input+=chunk;
 try{await maintain(JSON.parse(input));}catch{console.error('No se completó el mantenimiento. No se eliminó ninguna base. Comprueba la configuración SSH/Node 24, origen, clave de respaldo, pausa de escrituras y acceso MySQL/TLS.');process.exitCode=1;}
}
