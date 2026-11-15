import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {storagePaths,assertExistingDatabase,applicationRoot} from './storage-paths.mjs';
import {backupBeforeRelease,releaseFingerprint} from './release-backup.mjs';
import {startBackupSchedule,validateBackupConfiguration,readExistingDatabase,createEncryptedBackup} from './backup-service.mjs';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {openDatabase} from './database.mjs';
import {createApp} from './app.mjs';
process.umask(0o077);
const port=Number(process.env.PORT||3000),publicUrl=process.env.PUBLIC_URL||'http://localhost:'+port;
if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT no válido.');
const parsed=new URL(publicUrl);if(!['http:','https:'].includes(parsed.protocol)||parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.username||parsed.password)throw Error('PUBLIC_URL debe ser el origen del sistema, sin ruta ni credenciales.');
if(process.env.NODE_ENV==='production'&&parsed.protocol!=='https:')throw Error('En producción PUBLIC_URL debe usar HTTPS.');
const driver=process.env.DB_DRIVER||'sqlite';if(!['sqlite','mysql'].includes(driver))throw Error('DB_DRIVER debe ser sqlite o mysql.');
const production=process.env.NODE_ENV==='production'||!process.env.NODE_ENV&&parsed.protocol==='https:',automatic=process.env.BACKUP_AUTO_ENABLED==='true'||production&&process.env.BACKUP_AUTO_ENABLED!=='false';
let db,mysql,authentication,bucket,paths,backupOptions=async()=>({}),backupEnv=process.env;
if(driver==='mysql'){
 const {openMySqlStorage}=await import('./mysql-storage.mjs'),{MySqlProviderAuth}=await import('./mysql-auth.mjs'),{mysqlBackupOptions}=await import('./mysql-snapshots.mjs');mysql=await openMySqlStorage(process.env);try{await mysql.ensureSchema();const [providers]=await mysql.pool.query('SELECT id FROM qubolabs_provider WHERE slot=1');if(!providers[0])throw Error('MySQL está vacío: migra SQLite o inicializa expresamente una instalación nueva antes de arrancar.');authentication=new MySqlProviderAuth(mysql.pool);bucket=mysql.bucket;paths={backups:resolve(process.env.BACKUP_DIR||join(tmpdir(),'qubolabs-mysql-backups'))};backupOptions=()=>mysqlBackupOptions(mysql);backupEnv={...process.env,...(production&&process.env.BACKUP_REMOTE_REQUIRED!=='false'?{BACKUP_REMOTE_REQUIRED:'true'}:{})};if(automatic){validateBackupConfiguration(backupEnv);const release=await releaseFingerprint(applicationRoot),[markers]=await mysql.pool.execute('SELECT value FROM qubolabs_storage_meta WHERE meta_key=?',['last-release']);if(!markers[0]||JSON.parse(markers[0].value).release!==release){await createEncryptedBackup(null,{directory:paths.backups,env:backupEnv,...await backupOptions()});await mysql.pool.execute('INSERT INTO qubolabs_storage_meta(meta_key,value) VALUES(?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)',['last-release',JSON.stringify({release,at:new Date().toISOString()})]);}}}catch(e){await mysql.close();throw Error(e.code?'No se pudo preparar el almacenamiento MySQL; revisa sus permisos y límites.':e.message);}
}else{
 paths=storagePaths(process.env);
 // Starting a server never creates an installation, even if NODE_ENV was misconfigured.
 assertExistingDatabase(paths.file);
 const existing=readExistingDatabase(paths.file);
 try{
  if(!existing.prepare('SELECT id FROM provider WHERE slot=1').get())throw Error('La instalación no está inicializada. El arranque no crea administradores automáticamente; recupera la base existente o usa setup expresamente para una instalación nueva.');
 }finally{existing.close();}
 if(automatic){validateBackupConfiguration(process.env);if(paths.production)await backupBeforeRelease({...paths,root:applicationRoot,env:process.env});}
 db=openDatabase(paths.file);
}
const handle=createApp({db,publicUrl,env:process.env,bucket,authentication}),pending=new Set();
const backups=automatic?startBackupSchedule(db,{directory:paths.backups,env:backupEnv,backupOptions,onError:()=>console.error('Error de respaldo automático: revisa almacenamiento y configuración privada.'),onSuccess:()=>console.log('Respaldo automático cifrado completado.')}):null;
const server=createServer(async(req,res)=>{try{
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>50*1024*1024){res.writeHead(413);res.end('Solicitud demasiado grande');return;}chunks.push(chunk);}
 const host=req.headers.host||parsed.host;let requestOrigin;try{const incoming=new URL(parsed.protocol+'//'+host);if(incoming.host!==host||incoming.username||incoming.password)throw Error();requestOrigin=incoming.origin;}catch{res.writeHead(400);res.end();return;}
 const url=new URL(req.url,requestOrigin);if(url.origin!==requestOrigin){res.writeHead(400);res.end();return;}
 const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);
 let ip=req.socket.remoteAddress||'unknown';if(process.env.TRUST_PROXY==='true'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip))ip=headers.get('x-forwarded-for')?.split(',')[0].trim()||ip;
 const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 const response=await handle(request,{ip,waitUntil(p){pending.add(p);p.catch(()=>{}).finally(()=>pending.delete(p));}});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error('Solicitud fallida:',error.message);if(!res.headersSent)res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:'No se pudo completar la solicitud.'}));}});
server.requestTimeout=120000;server.headersTimeout=30000;
server.listen(port,process.env.HOST||'127.0.0.1',()=>{console.log('cubolabs iniciado en '+publicUrl);if(backups){const task=backups.run();pending.add(task);task.finally(()=>pending.delete(task));}});
let closing=false;async function shutdown(){if(closing)return;closing=true;server.close(async()=>{await backups?.stop();await Promise.allSettled([...pending]);if(mysql)await mysql.close();else db.close();process.exit(0);});setTimeout(()=>process.exit(1),15000).unref();}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
