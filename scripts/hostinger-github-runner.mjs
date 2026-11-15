import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const env=process.env,request=env.GITHUB_EVENT_NAME==='push'?JSON.parse(await readFile('.github/hostinger-maintenance-request.json','utf8')):{},mode=request.mode||env.MAINTENANCE_MODE||'inspect',source=request.source||env.SQLITE_SOURCE,writesPaused=request.writesPaused===true||env.WRITES_PAUSED==='true',host=env.HOSTINGER_SSH_HOST||'201.58.99.66',user=env.HOSTINGER_SSH_USER||'u187670937',port=env.HOSTINGER_SSH_PORT||'65002',node=env.HOSTINGER_NODE_BIN||'node',run=env.GITHUB_RUN_ID+'-'+env.GITHUB_RUN_ATTEMPT;
if(!['inspect','migrate'].includes(mode)||!/^[-a-zA-Z0-9.]+$/.test(host)||!/^[-a-zA-Z0-9_]+$/.test(user)||!/^\d{1,5}$/.test(port)||Number(port)>65535||!/^\d+-\d+$/.test(run)||!(node==='node'||/^\/[a-zA-Z0-9_./-]+$/.test(node)))throw Error('Configuración SSH inválida.');
if(mode==='migrate'&&(!writesPaused||!source))throw Error('La migración exige origen explícito y escrituras detenidas.');
const options=['-p',port,'-i',env.SSH_KEY_FILE,'-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+env.SSH_KNOWN_HOSTS_FILE,'-o','ConnectTimeout=20',user+'@'+host];
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
const stage='"$HOME/.qubolabs-maintenance/'+run+'"';
async function ssh(command,input){await new Promise((resolve,reject)=>{const child=spawn('ssh',[...options,command],{stdio:['pipe','inherit','inherit']});child.on('error',reject);child.stdin.on('error',()=>{});child.once('close',code=>code===0?resolve():reject(Error('La operación SSH no se completó. No se publicará ni reinicializará la aplicación.')));if(input?.pipe)input.pipe(child.stdin);else child.stdin.end(input);});}
const archive=spawn('git',['archive','HEAD','package.json','package-lock.json','scripts','server','worker','vendor'],{stdio:['ignore','pipe','inherit']});
const archived=new Promise((resolve,reject)=>{archive.once('error',reject);archive.once('close',code=>code===0?resolve():reject(Error('No se pudo preparar el código de mantenimiento.')));});
await Promise.all([archived,ssh('umask 077; mkdir -p "$HOME/.qubolabs-maintenance" && mkdir '+stage+' && tar -xf - -C '+stage,archive.stdout)]);
const payload={mode,source,writesPaused,backupKey:env.MYSQL_BACKUP_KEY,database:{DB_HOST:env.MYSQL_HOST,DB_PORT:env.MYSQL_PORT||'3306',DB_NAME:env.MYSQL_DATABASE,DB_USER:env.MYSQL_USER,DB_PASSWORD:env.MYSQL_PASSWORD,DB_SSL:env.MYSQL_SSL||'true',DB_SSL_CA:env.MYSQL_SSL_CA}};
await ssh('cd '+stage+' && '+quote(node)+' scripts/hostinger-maintenance.mjs',JSON.stringify(payload));
