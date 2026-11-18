import {setMysqlProvider,mysqlProviderSession,mysqlProviderAuth} from './mysql-auth.mjs';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
export function setProvider(db,{username,name='Administrador del servicio',password,mustChangePassword=false},reset=false){
 if(db.dialect==='mysql')return setMysqlProvider(db,{username,name,password,mustChangePassword},reset);
 username=String(username||'').trim().toLowerCase();if(!/^[a-z0-9_.@-]{3,80}$/.test(username))throw Error('Usuario: 3 a 80 letras, números, puntos, @ o guiones.');if(typeof password!=='string'||password.length<12||password.length>128)throw Error('La contraseña debe tener entre 12 y 128 caracteres.');
 const old=db.prepare('SELECT * FROM provider WHERE slot=1').get();if(old&&!reset)throw Error('El administrador ya existe. Usa npm run setup -- --reset para restablecerlo.');const salt=randomBytes(32).toString('hex'),hash=passwordHash(password,salt);
 db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO provider(slot,id,username,name,salt,password_hash,version,must_change_password) VALUES(1,?,?,?,?,?,?,?) ON CONFLICT(slot) DO UPDATE SET username=excluded.username,name=excluded.name,salt=excluded.salt,password_hash=excluded.password_hash,version=excluded.version,must_change_password=excluded.must_change_password').run(old?.id||randomUUID(),username,String(name).slice(0,160),salt,hash,(old?.version||0)+1,mustChangePassword?1:0);db.exec('DELETE FROM provider_sessions');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
export function providerSession(db,cookie=''){
 if(db.dialect==='mysql')return mysqlProviderSession(db,cookie);
 const token=cookie.match(/(?:^|;\s*)cubolabs_provider=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;
 const r=db.prepare('SELECT p.id,p.username,p.name,p.must_change_password AS mustChangePassword FROM provider p JOIN provider_sessions s ON s.provider_id=p.id AND s.version=p.version WHERE s.token_hash=? AND s.expires>?').get(digest(token),Date.now());return r||null;
}
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
export async function providerAuth(req,db,{origin,ip,secure}){
 const path=new URL(req.url).pathname;if(!path.startsWith('/api/provider/'))return null;
 if(db.dialect==='mysql')return mysqlProviderAuth(req,db,{origin,ip,secure});
 if(path==='/api/provider/session'&&req.method==='GET'){const user=providerSession(db,req.headers.get('cookie')||'');return user?json({username:user.username,name:user.name,mustChangePassword:!!user.mustChangePassword}):json({error:'Inicia sesión'},401);}
 if(req.method!=='POST')return json({error:'Método no permitido'},405);
 if(req.headers.get('origin')!==origin)return json({error:'Origen no autorizado'},403);
 const cookie=token=>'cubolabs_provider='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(token?'43200':'0')+(secure?'; Secure':'');
 if(path==='/api/provider/logout'){const token=(req.headers.get('cookie')||'').match(/cubolabs_provider=([a-f0-9]{64})/)?.[1];if(token)db.prepare('DELETE FROM provider_sessions WHERE token_hash=?').run(digest(token));return json({ok:true},200,{'set-cookie':cookie('')});}
 if(!['/api/provider/login','/api/provider/change-password'].includes(path))return json({error:'Ruta no disponible'},404);
 const raw=await req.text();if(raw.length>16000)return json({error:'Solicitud demasiado grande'},413);let data;try{data=JSON.parse(raw);}catch{return json({error:'Solicitud inválida'},400);}if(!data||typeof data!=='object'||Array.isArray(data))return json({error:'Solicitud inválida'},400);
 const client=digest(String(ip)),now=Date.now();db.prepare('DELETE FROM login_attempts WHERE expires<?').run(now);db.prepare('DELETE FROM provider_sessions WHERE expires<?').run(now);
 const attempts=db.prepare('SELECT * FROM login_attempts WHERE client=?').get(client);if(attempts?.attempts>=5)return json({error:'Demasiados intentos. Intenta de nuevo en 15 minutos.'},429);
 const p=db.prepare('SELECT * FROM provider WHERE slot=1').get();if(!p)return json({error:'Configura primero el administrador en el servidor.'},503);
 const changing=path==='/api/provider/change-password',session=changing?providerSession(db,req.headers.get('cookie')||''):null;
 if(changing&&!session)return json({error:'Inicia sesión antes de cambiar la contraseña.'},401);
 const password=typeof(changing?data.currentPassword:data.password)==='string'&&(changing?data.currentPassword:data.password).length<=128?(changing?data.currentPassword:data.password):'';
 const valid=timingSafeEqual(Buffer.from(passwordHash(password,p.salt),'hex'),Buffer.from(p.password_hash,'hex'))&&(changing?session.id===p.id:String(data.username||'').trim().toLowerCase()===p.username);
 if(!valid){db.prepare('INSERT INTO login_attempts(client,attempts,expires) VALUES(?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1').run(client,now+900000);return json({error:changing?'La contraseña actual no es correcta.':'Usuario o contraseña incorrectos'},401);}
 if(changing){
  if(typeof data.newPassword!=='string'||data.newPassword.length<12||data.newPassword.length>128||!data.newPassword.trim())return json({error:'La nueva contraseña debe tener entre 12 y 128 caracteres.'},400);
  if(data.newPassword!==data.confirmPassword)return json({error:'Las contraseñas nuevas no coinciden.'},400);
  if(timingSafeEqual(Buffer.from(passwordHash(data.newPassword,p.salt),'hex'),Buffer.from(p.password_hash,'hex')))return json({error:'Elige una contraseña diferente de la actual o temporal.'},400);
  const salt=randomBytes(32).toString('hex'),hash=passwordHash(data.newPassword,salt),token=randomBytes(32).toString('hex');
  db.exec('BEGIN IMMEDIATE');try{const updated=db.prepare('UPDATE provider SET salt=?,password_hash=?,version=version+1,must_change_password=0 WHERE id=? AND version=?').run(salt,hash,p.id,p.version);if(updated.changes!==1){db.exec('ROLLBACK');return json({error:'La cuenta cambió. Inicia sesión nuevamente.'},409);}db.exec('DELETE FROM provider_sessions');db.prepare('INSERT INTO provider_sessions(token_hash,provider_id,version,expires) VALUES(?,?,?,?)').run(digest(token),p.id,p.version+1,now+43200000);db.prepare('DELETE FROM login_attempts WHERE client=?').run(client);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  return json({ok:true,mustChangePassword:false,redirect:'/admin/'},200,{'set-cookie':cookie(token)});
 }
 db.prepare('DELETE FROM login_attempts WHERE client=?').run(client);const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO provider_sessions(token_hash,provider_id,version,expires) VALUES(?,?,?,?)').run(digest(token),p.id,p.version,now+43200000);return json({ok:true,mustChangePassword:!!p.must_change_password,redirect:p.must_change_password?'/administrador/cambiar-contrasena':'/admin/'},200,{'set-cookie':cookie(token)});
}

// Startup is idempotent, while the setup CLI still reports an existing account.
export async function ensureProvider(db,options){
 const existing=await db.prepare('SELECT id FROM provider WHERE slot=1').get();
 if(existing)return existing;
 if(!options.password)throw Error('Falta administrador. Ejecuta npm run setup o configura CUBOLABS_ADMIN_PASSWORD en el .env privado.');
 try{await setProvider(db,options);}catch(error){
  if(error.code!=='PROVIDER_EXISTS')throw error;
  const winner=await db.prepare('SELECT id FROM provider WHERE slot=1').get();
  if(!winner)throw error;
  return winner;
 }
 return db.prepare('SELECT id FROM provider WHERE slot=1').get();
}
