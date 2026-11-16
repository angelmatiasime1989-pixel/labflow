import {openDatabase,backupDatabase} from '../server/database.mjs';
import {createCipheriv,randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const key=process.env.BACKUP_ENCRYPTION_KEY||'';if(!/^[a-f0-9]{64}$/i.test(key))throw Error('Configura BACKUP_ENCRYPTION_KEY con 64 caracteres hexadecimales en el .env privado.');
const directory=resolve(process.env.BACKUP_DIR||'backups');await mkdir(directory,{recursive:true,mode:0o700});const stamp=new Date().toISOString().replace(/[:.]/g,'-'),temp=resolve(directory,'.snapshot-'+stamp+'.sqlite'),target=resolve(directory,'cubolabs-'+stamp+'.clbackup');
const db=openDatabase(resolve(process.env.DATA_DIR||'data','cubolabs.sqlite'));
try{await backupDatabase(db,temp);const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv),bytes=await readFile(temp),encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);await writeFile(target,Buffer.concat([Buffer.from('CUBOLABS1'),iv,cipher.getAuthTag(),encrypted]),{mode:0o600,flag:'wx'});console.log('Respaldo cifrado creado: '+target);}finally{db.close();await rm(temp,{force:true});}
