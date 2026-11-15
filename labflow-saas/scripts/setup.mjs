import {storagePaths,assertExistingDatabase} from '../server/storage-paths.mjs';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {openDatabase} from '../server/database.mjs';
import {setProvider} from '../server/auth.mjs';
import {resolve} from 'node:path';
async function hidden(prompt){if(!stdin.isTTY)throw Error('Para ejecución no interactiva configura CUBOLABS_ADMIN_PASSWORD en el entorno privado.');stdout.write(prompt);stdin.setRawMode(true);stdin.resume();let value='';return new Promise((resolve,reject)=>{function finish(){stdin.off('data',onData);stdin.setRawMode(false);stdin.pause();stdout.write('\n');}function onData(buffer){for(const ch of buffer.toString()){if(ch==='\u0003'){finish();reject(Error('Cancelado'));return;}if(ch==='\r'||ch==='\n'){finish();resolve(value);return;}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else if(ch>=' ')value+=ch;}}stdin.on('data',onData);});}
const paths=storagePaths(process.env);if(paths.production&&!process.argv.includes('--initialize-new-installation'))assertExistingDatabase(paths.file);
if(process.env.DB_DRIVER==='mysql')throw Error('Para MySQL utiliza npm run mysql:setup. No se modificó SQLite ni MySQL.');
const db=openDatabase(paths.file);
try{let username=process.env.CUBOLABS_ADMIN_USERNAME,name=process.env.CUBOLABS_ADMIN_NAME,password=process.env.CUBOLABS_ADMIN_PASSWORD;
 if(!password){const rl=createInterface({input:stdin,output:stdout});username=(await rl.question('Usuario administrador [admin]: ')).trim()||'admin';name=(await rl.question('Nombre [Administrador del servicio]: ')).trim()||'Administrador del servicio';rl.close();password=await hidden('Contraseña nueva (mínimo 12 caracteres, no se muestra): ');if(password!==await hidden('Repite la contraseña: '))throw Error('Las contraseñas no coinciden.');}
 setProvider(db,{username:username||'admin',name:name||'Administrador del servicio',password,mustChangePassword:process.env.CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE==='true'},process.argv.includes('--reset'));console.log('Administrador configurado. Las sesiones anteriores fueron revocadas.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
