import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
const passwordHash=(password,salt)=>scryptSync(password,salt,64).toString('hex');
export function setProvider(db,{username,name='Administrador del servicio',password},reset=false){
 username=String(username||'').trim().toLowerCase();if(!/^[a-z0-9_.@-]{3,80}$/.test(username))throw Error('Usuario: 3 a 80 letras, números, puntos, @ o guiones.');if(typeof password!=='string'||password.length<12||password.length>128)throw Error('La contraseña debe tener entre 12 y 128 caracteres.');
 const old=db.prepare('SELECT * FROM provider WHERE slot=1').get();if(old&&!reset)throw Error('El administrador ya existe. Usa npm run setup -- --reset para restablecerlo.');const salt=randomBytes(32).toString('hex'),hash=passwordHash(password,salt);
 db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO provider(slot,id,username,name,salt,password_hash,version) VALUES(1,?,?,?,?,?,?) ON CONFLICT(slot) DO UPDATE SET username=excluded.username,name=excluded.name,salt=excluded.salt,password_hash=excluded.password_hash,version=excluded.version').run(old?.id||randomUUID(),username,String(name).slice(0,160),salt,hash,(old?.version||0)+1);db.exec('DELETE FROM provider_sessions');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
export function providerSession(db,cookie=''){
 const token=cookie.match(/(?:^|;\s*)cubolabs_provider=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;
 const r=db.prepare('SELECT p.id,p.username,p.name FROM provider p JOIN provider_sessions s ON s.provider_id=p.id AND s.version=p.version WHERE s.token_hash=? AND s.expires>?').get(digest(token),Date.now());return r||null;
}
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
export async function providerAuth(req,db,{origin,ip,secure}){
 const path=new URL(req.url).pathname;if(!path.startsWith('/api/provider/'))return null;
 if(path==='/api/provider/session'&&req.method==='GET'){const user=providerSession(db,req.headers.get('cookie')||'');return user?json({username:user.username,name:user.name}):json({error:'Inicia sesión'},401);}
 if(req.method!=='POST')return json({error:'Método no permitido'},405);
 if(req.headers.get('origin')!==origin)return json({error:'Origen no autorizado'},403);
 const cookie=token=>'cubolabs_provider='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(token?'43200':'0')+(secure?'; Secure':'');
 if(path==='/api/provider/logout'){const token=(req.headers.get('cookie')||'').match(/cubolabs_provider=([a-f0-9]{64})/)?.[1];if(token)db.prepare('DELETE FROM provider_sessions WHERE token_hash=?').run(digest(token));return json({ok:true},200,{'set-cookie':cookie('')});}
 if(path!=='/api/provider/login')return json({error:'Ruta no disponible'},404);
 const raw=await req.text();if(raw.length>16000)return json({error:'Solicitud demasiado grande'},413);let data;try{data=JSON.parse(raw);}catch{return json({error:'Solicitud inválida'},400);}
 const client=digest(String(ip)),now=Date.now();db.prepare('DELETE FROM login_attempts WHERE expires<?').run(now);db.prepare('DELETE FROM provider_sessions WHERE expires<?').run(now);
 const attempts=db.prepare('SELECT * FROM login_attempts WHERE client=?').get(client);if(attempts?.attempts>=5)return json({error:'Demasiados intentos. Intenta de nuevo en 15 minutos.'},429);
 const p=db.prepare('SELECT * FROM provider WHERE slot=1').get();if(!p)return json({error:'Configura primero el administrador en el servidor.'},503);
 const password=typeof data.password==='string'&&data.password.length<=128?data.password:'',valid=timingSafeEqual(Buffer.from(passwordHash(password,p.salt),'hex'),Buffer.from(p.password_hash,'hex'))&&String(data.username||'').trim().toLowerCase()===p.username;
 if(!valid){db.prepare('INSERT INTO login_attempts(client,attempts,expires) VALUES(?,1,?) ON CONFLICT(client) DO UPDATE SET attempts=attempts+1').run(client,now+900000);return json({error:'Usuario o contraseña incorrectos'},401);}
 db.prepare('DELETE FROM login_attempts WHERE client=?').run(client);const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO provider_sessions(token_hash,provider_id,version,expires) VALUES(?,?,?,?)').run(digest(token),p.id,p.version,now+43200000);return json({ok:true},200,{'set-cookie':cookie(token)});
}
