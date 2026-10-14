// Offline credential provisioning. Password arrives via stdin, never argv or output.
import {webcrypto} from 'node:crypto';
export async function credentials(username,password){
 if(!/^[a-z0-9_.-]{3,40}$/.test(username)||password.length<16||password.length>128)throw Error('Usuario: 3–40 caracteres; contraseña: 16–128 caracteres.');
 const salt=Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('hex');
 const key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const passwordHash=Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:600000},key,256)).toString('hex');
 return {version:1,username,salt,passwordHash};
}
if(import.meta.url===new URL(process.argv[1], 'file:').href){
 try{let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>1024)throw Error('Entrada demasiado grande');}console.log(JSON.stringify(await credentials(process.argv[2]||'',input.replace(/\r?\n$/,''))));}catch(e){console.error(e.message);process.exitCode=1;}
}
