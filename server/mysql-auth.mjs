// MySQL authentication keeps each request/reset on one reserved transactional connection.
// SQLite retains its synchronous implementation in auth.mjs; test both when changing policy.
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
async function setProvider(db,{username,name='Administrador del servicio',password,mustChangePassword=false},reset=false){
 username=String(username||'').trim().toLowerCase();if(!/^[a-z0-9_.@-]{3,80}$/.test(username))throw Error('Usuario: 3 a 80 letras, números, puntos, @ o guiones.');if(typeof password!=='string'||password.length<12||password.length>128)throw Error('La contraseña debe tener entre 12 y 128 caracteres.');
 const old=await db.prepare('SELECT * FROM provider WHERE slot=1 FOR UPDATE').get();if(old&&!reset)throw Error('El administrador ya existe. Usa npm run setup -- --reset para restablecerlo.');const salt=randomBytes(32).toString('hex'),hash=passwordHash(password,salt);
 await db.prepare('INSERT INTO provider(slot,id,username,name,salt,password_hash,version,must_change_password) VALUES(1,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE username=VALUES(username),name=VALUES(name),salt=VALUES(salt),password_hash=VALUES(password_hash),version=VALUES(version),must_change_password=VALUES(must_change_password)').run(old?.id||randomUUID(),username,String(name).slice(0,160),salt,hash,(old?.version||0)+1,mustChangePassword?1:0);await db.prepare('DELETE FROM provider_sessions').run();
}
async function providerSession(db,cookie=''){
 const token=cookie.match(/(?:^|;\s*)cubolabs_provider=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;
 const r=await db.prepare('SELECT p.id,p.username,p.name,p.must_change_password AS mustChangePassword FROM provider p JOIN provider_sessions s ON s.provider_id=p.id AND s.version=p.version WHERE s.token_hash=? AND s.expires>?').get(digest(token),Date.now());return r||null;
}
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
async function providerAuth(req,db,{origin,ip,secure}){
 const path=new URL(req.url).pathname;if(!path.startsWith('/api/provider/'))return null;
 if(path==='/api/provider/session'&&req.method==='GET'){const user=await providerSession(db,req.headers.get('cookie')||'');return user?json({username:user.username,name:user.name,mustChangePassword:!!user.mustChangePassword}):json({error:'Inicia sesión'},401);}
 if(req.method!=='POST')return json({error:'Método no permitido'},405);
 if(req.headers.get('origin')!==origin)return json({error:'Origen no autorizado'},403);
 const cookie=token=>'cubolabs_provider='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(token?'43200':'0')+(secure?'; Secure':'');
 if(path==='/api/provider/logout'){const token=(req.headers.get('cookie')||'').match(/cubolabs_provider=([a-f0-9]{64})/)?.[1];if(token)await db.prepare('DELETE FROM provider_sessions WHERE token_hash=?').run(digest(token));return json({ok:true},200,{'set-cookie':cookie('')});}
 if(!['/api/provider/login','/api/provider/change-password'].includes(path))return json({error:'Ruta no disponible'},404);
 const raw=await req.text();if(raw.length>16000)return json({error:'Solicitud demasiado grande'},413);let data;try{data=JSON.parse(raw);}catch{return json({error:'Solicitud inválida'},400);}if(!data||typeof data!=='object'||Array.isArray(data))return json({error:'Solicitud inválida'},400);
 const client=digest(String(ip)),now=Date.now();await db.prepare('DELETE FROM login_attempts WHERE expires<?').run(now);await db.prepare('DELETE FROM provider_sessions WHERE expires<?').run(now);
 const attempts=await db.prepare('SELECT * FROM login_attempts WHERE client=?').get(client);if(attempts?.attempts>=5)return json({error:'Demasiados intentos. Intenta de nuevo en 15 minutos.'},429);
 const p=await db.prepare('SELECT * FROM provider WHERE slot=1 FOR UPDATE').get();if(!p)return json({error:'Configura primero el administrador en el servidor.'},503);
 const changing=path==='/api/provider/change-password',session=changing?await providerSession(db,req.headers.get('cookie')||''):null;
 if(changing&&!session)return json({error:'Inicia sesión antes de cambiar la contraseña.'},401);
 const password=typeof(changing?data.currentPassword:data.password)==='string'&&(changing?data.currentPassword:data.password).length<=128?(changing?data.currentPassword:data.password):'';
 const valid=timingSafeEqual(Buffer.from(passwordHash(password,p.salt),'hex'),Buffer.from(p.password_hash,'hex'))&&(changing?session.id===p.id:String(data.username||'').trim().toLowerCase()===p.username);
 if(!valid){await db.prepare('INSERT INTO login_attempts(client,attempts,expires) VALUES(?,1,?) ON DUPLICATE KEY UPDATE attempts=attempts+1').run(client,now+900000);return json({error:changing?'La contraseña actual no es correcta.':'Usuario o contraseña incorrectos'},401);}
 if(changing){
  if(typeof data.newPassword!=='string'||data.newPassword.length<12||data.newPassword.length>128||!data.newPassword.trim())return json({error:'La nueva contraseña debe tener entre 12 y 128 caracteres.'},400);
  if(data.newPassword!==data.confirmPassword)return json({error:'Las contraseñas nuevas no coinciden.'},400);
  if(timingSafeEqual(Buffer.from(passwordHash(data.newPassword,p.salt),'hex'),Buffer.from(p.password_hash,'hex')))return json({error:'Elige una contraseña diferente de la actual o temporal.'},400);
  const salt=randomBytes(32).toString('hex'),hash=passwordHash(data.newPassword,salt),token=randomBytes(32).toString('hex');
  const updated=await db.prepare('UPDATE provider SET salt=?,password_hash=?,version=version+1,must_change_password=0 WHERE id=? AND version=?').run(salt,hash,p.id,p.version);if(updated.changes!==1){return json({error:'La cuenta cambió. Inicia sesión nuevamente.'},409);}await db.prepare('DELETE FROM provider_sessions').run();await db.prepare('INSERT INTO provider_sessions(token_hash,provider_id,version,expires) VALUES(?,?,?,?)').run(digest(token),p.id,p.version+1,now+43200000);await db.prepare('DELETE FROM login_attempts WHERE client=?').run(client);
  return json({ok:true,mustChangePassword:false,redirect:'/admin/'},200,{'set-cookie':cookie(token)});
 }
 await db.prepare('DELETE FROM login_attempts WHERE client=?').run(client);const token=randomBytes(32).toString('hex');await db.prepare('INSERT INTO provider_sessions(token_hash,provider_id,version,expires) VALUES(?,?,?,?)').run(digest(token),p.id,p.version,now+43200000);return json({ok:true,mustChangePassword:!!p.must_change_password,redirect:p.must_change_password?'/administrador/cambiar-contrasena':'/admin/'},200,{'set-cookie':cookie(token)});
}

export const setMysqlProvider=(db,options,reset=false)=>db.transaction(tx=>setProvider(tx,options,reset));
export const mysqlProviderSession=providerSession;
export const mysqlProviderAuth=(req,db,options)=>db.transaction(async tx=>{await tx.prepare('SELECT slot FROM provider WHERE slot=1 FOR UPDATE').get();return providerAuth(req,tx,options);});
