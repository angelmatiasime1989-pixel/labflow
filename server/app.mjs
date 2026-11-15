import worker from '../worker/index.js';
import {readFileSync} from 'node:fs';
import {SqliteBucket} from './database.mjs';
import {providerAuth,providerSession} from './auth.mjs';
const changePassword=readFileSync(new URL('./change-password.html',import.meta.url),'utf8');
const login=readFileSync(new URL('./login.html',import.meta.url),'utf8');
export function createApp({db,publicUrl,env={}}){
 const origin=new URL(publicUrl).origin,secure=origin.startsWith('https:'),bucket=new SqliteBucket(db);
 const bindings={BUCKET:bucket,...Object.fromEntries(['RESEND_API_KEY','EMAIL_FROM'].filter(k=>env[k]).map(k=>[k,env[k]]))};
 return async function handle(req,{ip='local',waitUntil=p=>p.catch(()=>{})}={}){
  const url=new URL(req.url);if(url.origin!==origin)return new Response('Origen no autorizado',{status:400});
  const auth=await providerAuth(req,db,{origin,ip,secure});if(auth)return auth;
  const user=providerSession(db,req.headers.get('cookie')||'');
  if(url.pathname==='/administrador/cambiar-contrasena'){if(!user)return Response.redirect(origin+'/administrador/ingresar',303);if(!['GET','HEAD'].includes(req.method))return new Response('Método no permitido',{status:405});return new Response(changePassword,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});}
  if(user?.mustChangePassword){if(url.pathname.startsWith('/api/saas/'))return new Response(JSON.stringify({error:'Cambia la contraseña temporal antes de acceder al panel.',code:'PASSWORD_CHANGE_REQUIRED',redirect:'/administrador/cambiar-contrasena'}),{status:403,headers:{'content-type':'application/json','cache-control':'no-store'}});if(['/admin','/admin/','/administrador/ingresar','/entrar','/entrar/'].includes(url.pathname))return Response.redirect(origin+'/administrador/cambiar-contrasena',303);}
  if(url.pathname==='/administrador/ingresar')return user?Response.redirect(origin+'/admin/',303):new Response(login,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
  if(['/admin','/admin/'].includes(url.pathname)&&!user)return Response.redirect(origin+'/administrador/ingresar',303);
  if(url.pathname.startsWith('/api/saas/')&&!user)return new Response(JSON.stringify({error:'Inicia sesión como administrador del servicio.'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
  const headers=new Headers(req.headers);for(const key of [...headers.keys()])if(/^(oai-|x-forwarded-|x-authenticated-)/i.test(key))headers.delete(key);
  if(user&&!user.mustChangePassword){headers.set('oai-authenticated-user-id',user.id);headers.set('oai-authenticated-user-full-name',encodeURIComponent(user.name));headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');}
  const response=await worker.fetch(new Request(req,{headers}),bindings,{waitUntil});const outputHeaders=new Headers(response.headers);
  if(!secure&&outputHeaders.has('set-cookie'))outputHeaders.set('set-cookie',outputHeaders.get('set-cookie').replace(/;\s*Secure/gi,''));
  outputHeaders.set('x-content-type-options','nosniff');outputHeaders.set('referrer-policy','same-origin');outputHeaders.set('x-frame-options','SAMEORIGIN');
  if(secure)outputHeaders.set('strict-transport-security','max-age=31536000');
  return new Response(response.body,{status:response.status,headers:outputHeaders});
 };
}
