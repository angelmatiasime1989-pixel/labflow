import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {openDatabase} from './database.mjs';
import {createApp} from './app.mjs';
import {setProvider} from './auth.mjs';
process.umask(0o077);
const port=Number(process.env.PORT||3000),publicUrl=process.env.PUBLIC_URL||'http://localhost:'+port;
if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT no válido.');
const parsed=new URL(publicUrl);if(!['http:','https:'].includes(parsed.protocol)||parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.username||parsed.password)throw Error('PUBLIC_URL debe ser el origen del sistema, sin ruta ni credenciales.');
if(process.env.NODE_ENV==='production'&&parsed.protocol!=='https:')throw Error('En producción PUBLIC_URL debe usar HTTPS.');
const db=openDatabase(resolve(process.env.DATA_DIR||'data','cubolabs.sqlite'));
if(!db.prepare('SELECT id FROM provider WHERE slot=1').get()){
 if(!process.env.CUBOLABS_ADMIN_PASSWORD)throw Error('Falta administrador. Ejecuta npm run setup o configura CUBOLABS_ADMIN_PASSWORD en el .env privado.');
 setProvider(db,{username:process.env.CUBOLABS_ADMIN_USERNAME||'admin',name:process.env.CUBOLABS_ADMIN_NAME||'Administrador del servicio',password:process.env.CUBOLABS_ADMIN_PASSWORD,mustChangePassword:process.env.CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE==='true'});
}
const handle=createApp({db,publicUrl,env:process.env}),pending=new Set();
const server=createServer(async(req,res)=>{try{
 const requestPath=(req.url||'').split('?')[0],bodyLimit=requestPath.startsWith('/api/trial/')?12000:requestPath==='/api/public/lead'?16000:requestPath.includes('/api/offline/')?4000:50*1024*1024;
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>bodyLimit){res.writeHead(413);res.end('Solicitud demasiado grande');return;}chunks.push(chunk);}
 const host=req.headers.host||parsed.host;let requestOrigin;try{const incoming=new URL(parsed.protocol+'//'+host);if(incoming.host!==host||incoming.username||incoming.password)throw Error();requestOrigin=incoming.origin;}catch{res.writeHead(400);res.end();return;}
 const url=new URL(req.url,requestOrigin);if(url.origin!==requestOrigin){res.writeHead(400);res.end();return;}
 const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);
 let ip=req.socket.remoteAddress||'unknown';if(process.env.TRUST_PROXY==='true'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip))ip=headers.get('x-forwarded-for')?.split(',')[0].trim()||ip;
 const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 const response=await handle(request,{ip,waitUntil(p){pending.add(p);p.catch(()=>{}).finally(()=>pending.delete(p));}});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error('Solicitud fallida:',error.message);if(!res.headersSent)res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:'No se pudo completar la solicitud.'}));}});
server.requestTimeout=120000;server.headersTimeout=30000;
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log('cubolabs iniciado en '+publicUrl));
let closing=false;async function shutdown(){if(closing)return;closing=true;server.close(async()=>{await Promise.allSettled([...pending]);handle.close?.();db.close();process.exit(0);});setTimeout(()=>process.exit(1),15000).unref();}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
