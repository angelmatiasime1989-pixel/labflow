// Configuration preflight; does not deploy, migrate, open SQLite or alter tenant data.
import {readFileSync} from 'node:fs';
import {access,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readHostingConfig,createAppServer} from '../vps/server.mjs';
function externalUrl(value,contact=false){try{const u=new URL(value);if(u.username||u.password)return false;if(contact&&u.protocol==='mailto:')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.pathname)&&!u.search;return u.protocol==='https:'&&!/(^|\.)(localhost|example|test|invalid)$/.test(u.hostname)&&!['127.0.0.1','[::1]'].includes(u.hostname);}catch{return false;}}
export async function launchChecks(environment=process.env){
 const checks=[],add=(id,ok,message)=>checks.push({id,ok:!!ok,message});let config;
 try{config=readHostingConfig(environment);const app=createAppServer(config);app.server.close();add('runtime',true,'Origen, secretos administrativos y puerto válidos.');}catch(error){add('runtime',false,error.message);}
 add('origin',externalUrl(config?.publicOrigin),'PUBLIC_ORIGIN debe ser el dominio HTTPS definitivo.');
 add('mode',environment.LABFLOW_ENV==='production','LABFLOW_ENV=production bloquea el lanzador público de pruebas.');
 const root=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
 add('entrypoint',root.scripts.start==='node labflow-saas/vps/server.mjs'&&root.scripts.dev===root.scripts.start,'start/dev deben usar el servidor privado.');
 let writable=false;try{if(config){await access(config.dataDir,constants.R_OK|constants.W_OK);writable=(await stat(config.dataDir)).isDirectory();}}catch{}
 add('storage',writable&&isAbsolute(environment.DATA_DIR||'')&&!/^\/(tmp|var\/tmp)(\/|$)/.test(config?.dataDir||'')&&environment.DATA_PERSISTENCE_CONFIRMED==='true','DATA_DIR debe existir, ser escribible y persistente; confirmar con DATA_PERSISTENCE_CONFIRMED=true.');
 add('contact',externalUrl(environment.SALES_CONTACT_URL,true),'Configurar SALES_CONTACT_URL con correo, WhatsApp HTTPS o canal comercial real.');
 add('privacy',externalUrl(environment.PRIVACY_POLICY_URL),'Configurar PRIVACY_POLICY_URL con el aviso de privacidad aprobado.');
 const verified=Date.parse(environment.BACKUP_VERIFIED_AT||'');
 add('recovery',Number.isFinite(verified)&&verified<=Date.now()&&Date.now()-verified<=30*86400000&&environment.BACKUP_OFFSITE_CONFIRMED==='true','BACKUP_VERIFIED_AT: simulacro de recuperación de los últimos 30 días; BACKUP_OFFSITE_CONFIRMED=true.');
 add('monitoring',environment.MONITORING_CONFIRMED==='true','MONITORING_CONFIRMED=true solo después de verificar alertas externas de salud, errores y espacio.');
 add('legal',environment.LEGAL_REVIEW_CONFIRMED==='true','LEGAL_REVIEW_CONFIRMED=true después de aprobar términos, alcance, precios y tratamiento de datos.');
 add('security',environment.SECURITY_REVIEW_CONFIRMED==='true','SECURITY_REVIEW_CONFIRMED=true requiere revisar acceso privilegiado/MFA, perímetro y riesgos pendientes.');
 return checks;
}
if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href){const checks=await launchChecks();for(const check of checks)console.log((check.ok?'OK':'PENDIENTE')+' ['+check.id+'] '+check.message);const ok=checks.every(c=>c.ok);console.log(ok?'Configuración lista para la revisión final de lanzamiento. Verifica dominio, persistencia y recuperación en el hosting real.':'No abrir a clientes reales: hay requisitos de lanzamiento pendientes.');console.log('Las confirmaciones son declaraciones operativas; este comando no comprueba por sí solo servicios externos.');process.exitCode=ok?0:1;}
