import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
// Public ED25519 fingerprint supplied through the Hostinger panel and confirmed by the owner.
export const HOSTINGER_ED25519='SHA256:bna/32NpR1N96VXX5P3E319moFq3CMF4TxgGREHkBM8';
export function verifiedHostEntry(scan,{host,port,fingerprint}){
 if(!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host)||!/^\d{1,5}$/.test(String(port))||Number(port)<1||Number(port)>65535||!/^SHA256:[A-Za-z0-9+/]{43}$/.test(fingerprint))throw Error('Configuración de identidad SSH inválida.');
 const name=Number(port)===22?host:'['+host+']:'+port;
 for(const line of scan.split(/\r?\n/)){const fields=line.trim().split(/\s+/);if(fields.length!==3||fields[0]!==name||fields[1]!=='ssh-ed25519')continue;
  const wire=Buffer.from(fields[2],'base64');if(wire.length!==51||wire.readUInt32BE(0)!==11||wire.subarray(4,15).toString()!=='ssh-ed25519'||wire.readUInt32BE(15)!==32)continue;
  const actual='SHA256:'+createHash('sha256').update(wire).digest('base64').replace(/=+$/,'');if(actual===fingerprint)return fields.join(' ')+'\n';
 }
 throw Error('La huella del servidor no coincide con la confirmada en Hostinger. Se detuvo la conexión; no se aceptará otra identidad automáticamente.');
}
export async function prepareSsh(env=process.env){
 const key=String(env.PRIVATE_KEY||'').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim();
 if(!/^-----BEGIN (OPENSSH |RSA |EC )?PRIVATE KEY-----\n/.test(key))throw Error('HOSTINGER_SSH_PRIVATE_KEY no contiene una clave privada válida. No pegues su nombre ni el archivo público .pub.');
 const host=env.HOSTINGER_SSH_HOST||'201.58.99.66',port=env.HOSTINGER_SSH_PORT||'65002',fingerprint=env.HOSTINGER_SSH_FINGERPRINT||HOSTINGER_ED25519;
 // Validate all destination fields before passing them to the external command.
 try{verifiedHostEntry('',{host,port,fingerprint});}catch(e){if(e.message==='Configuración de identidad SSH inválida.')throw e;}
 await writeFile(env.SSH_KEY_FILE,key+'\n',{mode:0o600,flag:'wx'});
 const check=spawnSync('ssh-keygen',['-y','-P','','-f',env.SSH_KEY_FILE],{encoding:'utf8',timeout:10000});
 if(check.status!==0)throw Error('La clave privada no se pudo abrir. Debe estar completa y sin frase de paso para este flujo. No se imprimió su contenido.');
 const scan=spawnSync('ssh-keyscan',['-T','15','-t','ed25519','-p',port,host],{encoding:'utf8',timeout:20000,maxBuffer:65536});
 if(scan.status!==0)throw Error('No se pudo obtener la identidad SSH del servidor. Revisa host, puerto y disponibilidad SSH; no se desactivó la verificación.');
 const entry=verifiedHostEntry(scan.stdout,{host,port,fingerprint});await writeFile(env.SSH_KNOWN_HOSTS_FILE,entry,{mode:0o600,flag:'wx'});
 console.log('Clave privada validada e identidad ED25519 del servidor verificada contra la huella confirmada.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))try{await prepareSsh();}catch(e){console.error(e.message);process.exitCode=1;}
