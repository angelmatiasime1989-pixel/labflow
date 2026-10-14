// Independent operator credentials are provisioned out of band, never by HTTP headers.
const ADMIN_ITERATIONS=600000,ADMIN_TTL=8*3600000;
async function adminDigest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
async function adminPasswordHash(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:ADMIN_ITERATIONS},key,256)),b=>b.toString(16).padStart(2,'0')).join('');}
function adminConfig(env){let c;try{c=JSON.parse(env.SAAS_ADMIN_AUTH);}catch{fail('Acceso administrativo no configurado',503);}if(!c||c.version!==1||!/^[a-z0-9_.-]{3,40}$/.test(c.username)||!/^[a-f0-9]{64}$/.test(c.passwordHash)||!/^[a-f0-9]{64}$/.test(c.salt))fail('Acceso administrativo no configurado',503);return c;}
function adminCookie(req){const matches=[...(req.headers.get('cookie')||'').matchAll(/(?:^|;\s*)__Host-labflow_admin=([^;]*)/g)];return matches.length===1&&/^[a-f0-9]{64}$/.test(matches[0][1])?matches[0][1]:null;}
function adminSetCookie(token,age=28800){return `__Host-labflow_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;}
function adminTransport(req){const url=new URL(req.url);if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))fail('El acceso administrativo requiere HTTPS',403);}
async function operatorSaas(req,env){adminTransport(req);const c=adminConfig(env),token=adminCookie(req);if(!token)fail('Ingresa con tu usuario y contraseña de administrador',401);const o=await env.BUCKET.get('saas/auth/sessions/'+await adminDigest(token));const s=o?await o.json():null;if(!s||s.expires<=Date.now()||s.credentials!==await adminDigest(JSON.stringify(c)))fail('Sesión administrativa vencida',401);return {id:c.username,name:c.username};}
async function adminAuthRoute(req,env,path){
 if(req.method!=='POST')fail('Método no permitido',405);
 adminTransport(req);const url=new URL(req.url);
 if(req.headers.get('origin')!==url.origin)fail('Origen no autorizado',403);
 if(!env.BUCKET)fail('Almacenamiento no disponible',503);
 if(path==='/api/saas/logout'){await operatorSaas(req,env);const token=adminCookie(req);await env.BUCKET.delete('saas/auth/sessions/'+await adminDigest(token));return json({ok:true},200,{'Set-Cookie':adminSetCookie('',0)});}
 const c=adminConfig(env);const raw=await req.text();if(raw.length>2048)fail('Solicitud demasiado grande',413);let b;try{b=JSON.parse(raw);}catch{fail('Solicitud inválida');}
 if(!b||typeof b.username!=='string'||typeof b.password!=='string'||b.username.length>100||b.password.length>128)fail('Usuario o contraseña incorrectos',401);
 // Global credential limiter: spoofed IP headers cannot bypass it. CAS reserves attempts before hashing.
 const key='saas/auth/login-limit';let reserved=false,reservationEtag;
 for(let i=0;i<5;i++){const o=await env.BUCKET.get(key);let limit=o?await o.json():null;if(!limit||limit.until<=Date.now())limit={count:0,until:Date.now()+15*60000};if(limit.count>=8)fail('Demasiados intentos. Intenta en 15 minutos.',429);limit.count++;const saved=await env.BUCKET.put(key,JSON.stringify(limit),{onlyIf:o?{etagMatches:o.etag}:{etagDoesNotMatch:'*'}});if(saved){reserved=true;reservationEtag=saved.etag;break;}}
 if(!reserved)fail('Demasiados intentos simultáneos. Reintenta.',429);
 const hash=await adminPasswordHash(b.password,c.salt);if(b.username!==c.username||!equalHash(hash,c.passwordHash))fail('Usuario o contraseña incorrectos',401);
 await env.BUCKET.put(key,JSON.stringify({count:0,until:0}),{onlyIf:{etagMatches:reservationEtag}});
 const old=adminCookie(req);if(old)await env.BUCKET.delete('saas/auth/sessions/'+await adminDigest(old));
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');await env.BUCKET.put('saas/auth/sessions/'+await adminDigest(token),JSON.stringify({expires:Date.now()+ADMIN_TTL,credentials:await adminDigest(JSON.stringify(c))}));
 return json({ok:true},200,{'Set-Cookie':adminSetCookie(token)});
}
