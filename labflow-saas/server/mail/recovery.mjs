import {randomBytes,createHash,randomUUID,pbkdf2Sync} from 'node:crypto';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('./recovery.html',import.meta.url),'utf8'),hash=value=>createHash('sha256').update(String(value)).digest('hex');
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers}),generic=()=>json({message:'Si la cuenta permite recuperación, recibirás instrucciones en su correo registrado.'},202);
export function recoveryRoutes({bucket,mail,origin,clock=Date.now}){
 async function limit(id,max){const key='private/mail/limits/'+hash(id);for(let i=0;i<6;i++){const o=await bucket.get(key),old=o?await o.json():null;const value=old&&old.until>clock()?old:{count:0,until:clock()+3600000};if(value.count>=max)return false;value.count++;if(await bucket.put(key,JSON.stringify(value),{onlyIf:o?{etagMatches:o.etag}:{etagDoesNotMatch:'*'}}))return true;}return false;}
 async function requestReset(slug,username){if(!mail.enabled||!await limit('account:'+slug+':'+username,3))return;const p=await bucket.get('saas/platform-v1.json');if(!p)return;const c=(await p.json()).customers.find(c=>c.slug===slug&&c.status==='Activo'&&c.internalTest!==true);if(!c)return;const key='saas/tenants/'+c.id+'/public-demo/state-v1.json',o=await bucket.get(key);if(!o)return;const user=(await o.json()).users.find(u=>u.active&&u.username===username);if(!user?.email)return;
  const token=randomBytes(32).toString('hex'),record={tenantId:c.id,userId:user.id,emailHash:hash(user.email.toLowerCase()),authVersion:user.authVersion||1,passwordHash:user.passwordHash,expires:clock()+15*60000,used:false};
  await bucket.put('private/mail/recovery/'+hash(token),JSON.stringify(record),{onlyIf:{etagDoesNotMatch:'*'}});
  await mail.send({to:user.email,subject:'Qubo Labs · Recuperar contraseña',text:'Solicitaste recuperar tu contraseña. Este enlace vence en 15 minutos y se usa una sola vez:\n'+origin+'/recuperar#token='+token+'\nSi no lo solicitaste, ignora este correo.'},'recovery:'+hash(token));
 }
 async function reset(token,password){if(!/^[a-f0-9]{64}$/.test(token||'')||typeof password!=='string'||password.length<12||password.length>128||!password.trim())return false;
  const key='private/mail/recovery/'+hash(token),o=await bucket.get(key);if(!o)return false;const record=await o.json();if(record.used||record.expires<=clock())return false;
  // Claim before changing credentials. A crash fails closed: request a new link.
  const claimed=await bucket.put(key,JSON.stringify({...record,used:true}),{onlyIf:{etagMatches:o.etag}});if(!claimed)return false;
  const platform=await bucket.get('saas/platform-v1.json');if(!platform||(await platform.json()).customers.find(c=>c.id===record.tenantId)?.status!=='Activo')return false;
  const labKey='saas/tenants/'+record.tenantId+'/public-demo/state-v1.json';
  for(let i=0;i<6;i++){const obj=await bucket.get(labKey);if(!obj)return false;const s=await obj.json(),user=s.users.find(u=>u.id===record.userId);if(!user?.active||hash(String(user.email).toLowerCase())!==record.emailHash||(user.authVersion||1)!==record.authVersion||user.passwordHash!==record.passwordHash)return false;const salt=randomUUID();user.passwordHash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');user.passwordSalt=salt;user.authVersion=(user.authVersion||1)+1;user.updatedAt=new Date(clock()).toISOString();s.revision++;s.audit??=[];s.audit.push({id:randomUUID(),at:user.updatedAt,userId:user.id,user:user.name,module:'users',recordId:user.id,action:'Recuperación de contraseña',before:null,after:null});if(await bucket.put(labKey,JSON.stringify(s),{onlyIf:{etagMatches:obj.etag}}))return true;}return false;
 }
 return async(req,{ip,waitUntil})=>{const url=new URL(req.url);if(!['/recuperar','/api/account/recovery/request','/api/account/recovery/reset'].includes(url.pathname))return null;
  if(url.pathname==='/recuperar'&&req.method==='GET')return new Response(page.replace('/*RECOVERY_ENABLED*/',String(mail.enabled)),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
  if(req.method!=='POST')return json({error:'Método no permitido.'},405);if(req.headers.get('origin')!==origin||!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return json({error:'Origen no autorizado.'},403);
  let body;try{const chunks=[];let size=0;for await(const part of req.body||[]){size+=part.length;if(size>4096)return json({error:'Solicitud demasiado grande.'},413);chunks.push(Buffer.from(part));}body=JSON.parse(Buffer.concat(chunks));}catch{return json({error:'Solicitud inválida.'},400);}
  if(url.pathname.endsWith('/request')){if(await limit('ip:'+ip,5)){const slug=String(body?.slug||'').trim().toLowerCase(),username=String(body?.username||'').trim().toLowerCase();if(/^[a-z0-9-]{3,50}$/.test(slug)&&/^[a-z0-9_.-]{3,40}$/.test(username))waitUntil(requestReset(slug,username).catch(()=>{}));}return generic();}
  if(!mail.enabled||!await limit('reset-ip:'+ip,20))return json({error:'El enlace no es válido o venció.'},400);
  const ok=await reset(body?.token,body?.password);return ok?json({ok:true,message:'Contraseña actualizada. Ingresa de nuevo en tu laboratorio.'}):json({error:'El enlace no es válido o venció.'},400);
 };
}
