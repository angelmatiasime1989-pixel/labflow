import http from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import worker from '../worker/index.js';
import {SqliteBucket} from './bucket.mjs';

export function createAppServer({publicOrigin,bucket,adminAuth,emailFrom,resendKey,logger=event=>console.log(JSON.stringify(event))}){
 const canonical=new URL(publicOrigin);
 if(canonical.username||canonical.password||canonical.pathname!=='/'||canonical.search||canonical.hash||(!['https:'].includes(canonical.protocol)&&!(canonical.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(canonical.hostname))))throw Error('PUBLIC_ORIGIN must be an HTTPS origin (HTTP only on loopback)');
 const auth=JSON.parse(adminAuth||'null');
 if(auth?.version!==1||!/^[a-z0-9_.-]{3,40}$/.test(auth.username)||!/^[a-f0-9]{64}$/.test(auth.salt)||!/^[a-f0-9]{64}$/.test(auth.passwordHash))throw Error('Valid independent SAAS_ADMIN_AUTH credentials required');
 const env={BUCKET:bucket,SAAS_ADMIN_AUTH:adminAuth,SITE_URL:canonical.origin,EMAIL_FROM:emailFrom,RESEND_API_KEY:resendKey};
 const pending=new Set();let active=0;
 const server=http.createServer(async(req,res)=>{
  if(active>=16){res.writeHead(503,{'Retry-After':'1','Connection':'close'}).end();req.resume();return;}
  active++;const requestId=randomUUID(),started=Date.now();let status=500;
  res.setHeader('X-Request-ID',requestId);
  res.once('finish',()=>logger({event:'request',requestId,method:req.method,status:res.statusCode,durationMs:Date.now()-started}));
  try{
   if(req.headers.host?.toLowerCase()!==canonical.host.toLowerCase()){status=421;res.writeHead(status).end();return;}
   if(!req.url.startsWith('/')||req.url.startsWith('//')||/[\\\r\n]/.test(req.url)){status=400;res.writeHead(status).end();return;}
   if(req.url==='/_health'&&req.method==='GET'){status=bucket.check()?200:503;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({ok:status===200}));return;}
   const limit=32*1024*1024;
   if(Number(req.headers['content-length'])>limit){status=413;res.writeHead(status,{'Connection':'close'}).end();req.resume();return;}
   let size=0;const chunks=[];
   for await(const chunk of req){size+=chunk.length;if(size>limit){status=413;res.writeHead(status,{'Connection':'close'}).end();return;}chunks.push(chunk);}
   const headers=new Headers();
   for(const [key,value] of Object.entries(req.headers)){if(['host','connection','transfer-encoding','content-length','forwarded','cf-connecting-ip','x-real-ip'].includes(key)||key.startsWith('x-forwarded-')||key.startsWith('oai-')||value===undefined)continue;headers.set(key,Array.isArray(value)?value.join(', '):value);}
   // Do not trust client IP headers. Proxy-level rate limits complement the tenant limiter.
   headers.set('cf-connecting-ip',req.socket.remoteAddress||'unknown');
   const request=new Request(canonical.origin+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const context={waitUntil(promise){const task=Promise.resolve(promise).catch(()=>logger({event:'background_error',requestId})).finally(()=>pending.delete(task));pending.add(task);}};
   const response=await worker.fetch(request,env,context);status=response.status;
   for(const [key,value] of response.headers)if(!['set-cookie','transfer-encoding','connection'].includes(key))res.setHeader(key,value);
   const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
   res.writeHead(status);
   if(req.method==='HEAD'||!response.body)res.end();else await pipeline(Readable.fromWeb(response.body),res);
  }catch{logger({event:'request_error',requestId});if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'}).end('{"error":"Error interno"}');else res.destroy();}finally{active--;}
 });
 server.requestTimeout=60000;server.headersTimeout=15000;server.keepAliveTimeout=5000;
 return {server,async stop(){await new Promise(resolveStop=>{server.close(resolveStop);server.closeIdleConnections();});await Promise.allSettled([...pending]);}};
}

if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href){
 process.umask(0o077);
 const secret=name=>process.env[name+'_FILE']?readFileSync(process.env[name+'_FILE'],'utf8').trim():process.env[name];
 let bucket,app;
 try{
  if(!process.env.PUBLIC_ORIGIN||!process.env.DATA_DIR)throw Error('PUBLIC_ORIGIN and DATA_DIR are required');
  bucket=new SqliteBucket(resolve(process.env.DATA_DIR,'labflow.sqlite'));
  app=createAppServer({publicOrigin:process.env.PUBLIC_ORIGIN,bucket,adminAuth:secret('SAAS_ADMIN_AUTH'),emailFrom:process.env.EMAIL_FROM,resendKey:secret('RESEND_API_KEY')});
  app.server.listen(Number(process.env.PORT||8787),process.env.BIND_ADDRESS||'127.0.0.1',()=>console.log(JSON.stringify({event:'listening',port:app.server.address().port})));
  let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;const deadline=setTimeout(()=>process.exit(1),30000);deadline.unref();await app.stop();bucket.close();clearTimeout(deadline);};process.on('SIGTERM',stop);process.on('SIGINT',stop);
  app.server.on('error',()=>{console.error('VPS listener failed');bucket.close();process.exitCode=1;});
 }catch{bucket?.close();console.error('VPS startup failed: verify origin, data directory and credential configuration');process.exitCode=1;}
}
