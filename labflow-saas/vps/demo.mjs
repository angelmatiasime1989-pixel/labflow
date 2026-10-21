// Explicitly public, disposable demo. Never uses DATA_DIR, production auth or mail.
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import worker from '../worker/index.js';
import {credentials} from '../scripts/admin-credentials.mjs';
import {SqliteBucket} from './bucket.mjs';
import {createAppServer} from './server.mjs';

class DemoBucket extends SqliteBucket {
 queue=Promise.resolve();
 async put(key,value,options){
  const bytes=Buffer.from(await new Response(value).arrayBuffer());
  const operation=this.queue.then(async()=>{
   const total=this.db.prepare('SELECT coalesce(sum(length(bytes)),0) AS size FROM objects').get().size;
   const old=await this.head(key);
   if(total-(old?.size||0)+bytes.length>32*1024*1024)throw Object.assign(Error('La demo alcanzó su límite temporal de almacenamiento'),{status:507});
   return super.put(key,bytes,options);
  });
  this.queue=operation.catch(()=>{});return operation;
 }
}
const tenantPassword='DemoTemporal-2026!';
const landing=`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LabFlow · Demo temporal</title><style>body{font:16px/1.6 system-ui;max-width:760px;margin:50px auto;padding:24px;color:#17314e}button{padding:14px;background:#2569aa;color:white;border:0;border-radius:8px;cursor:pointer}li{margin:14px 0}</style><h1>LabFlow · Demo temporal</h1><p><strong>Demo pública compartida. No introduzcas datos personales ni de clientes reales.</strong> Los datos se eliminan al reiniciar. Demo temporal con límite de 32 MB de datos.</p><button id="enter">Entrar a Administración SaaS</button><p id="error" role="alert"></p><h2>Laboratorios ficticios</h2><p>Usuario: <strong>demo</strong> · Contraseña de demostración: <strong>${tenantPassword}</strong></p><ul><li><a href="/laboratorio/demo-basico/">Básico</a></li><li><a href="/laboratorio/demo-medio/">Medio</a></li><li><a href="/laboratorio/demo-avanzado/">Avanzado · Protección civil</a></li></ul><script>document.getElementById('enter').onclick=async()=>{try{const r=await fetch('/_demo/login',{method:'POST'});if(!r.ok)throw Error('No se pudo iniciar la demo');location.href='/admin/';}catch(e){document.getElementById('error').textContent=e.message;}};</script></html>`;
export async function createDemoServer(){
 if(process.env.LABFLOW_ENV==='production')throw Error('Public demo is forbidden when LABFLOW_ENV=production; use start:production');
 process.umask(0o077);
 const directory=await mkdtemp(join(tmpdir(),'labflow-public-demo-')),bucket=new DemoBucket(join(directory,'demo.sqlite'));
 const password=randomBytes(32).toString('hex'),adminAuth=JSON.stringify(await credentials('demo-admin',password));
 const demoEnv={BUCKET:bucket,SAAS_ADMIN_AUTH:adminAuth};
 const origin='https://seed.invalid';
 async function internal(path,body,cookie=''){
  return worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json',cookie},...(body?{body:JSON.stringify(body)}:{})}),demoEnv);
 }
 try{
  const login=await internal('/api/saas/login',{username:'demo-admin',password});
  if(login.status!==200)throw Error('Demo initialization failed');
  const cookie=login.headers.get('set-cookie').split(';')[0];
  for(const [membership,slug] of [['basic','basico'],['medium','medio'],['advanced','avanzado']]){
   const state=await(await internal('/api/saas/state',null,cookie)).json();
   const created=await internal('/api/saas/customer',{revision:state.revision,name:'Laboratorio ficticio · '+slug,slug:'demo-'+slug,membership,status:'Activo',adminUsername:'demo',password:tenantPassword},cookie);
   if(created.status!==200)throw Error('Demo tenant initialization failed');
  }
  // Fictional Civil Protection example belongs only to the Advanced demo tenant.
  const tenantLogin=await internal('/laboratorio/demo-avanzado/api/login',{username:'demo',password:tenantPassword});
  const tenantCookie=tenantLogin.headers.get('set-cookie').split(';')[0],prefix='/laboratorio/demo-avanzado/api/';
  async function tenantSave(path,data){const state=await(await internal(prefix+'state',null,tenantCookie)).json();const result=await internal(prefix+path,{revision:state.revision,...data},tenantCookie);if(result.status!==200)throw Error('Civil Protection demo initialization failed');return result.json();}
  const client=await tenantSave('mutate',{module:'clients',action:'create',data:{name:'Establecimiento ficticio PC',email:'pc-demo@example.com',contact:'Contacto ficticio'}});
  const future=new Date(Date.now()+365*86400000).toISOString().slice(0,10);
  const pcQuote={name:'PIPC · Establecimiento ficticio',clientId:client.id,address:'Domicilio ficticio, sin ubicación real',jurisdiction:'Jurisdicción de demostración',buildingArea:500,landArea:800,baseFee:2000,buildingRate:8,landRate:2,discount:0,taxRate:16,due:future,notes:'Ejemplo ficticio. Tarifas no oficiales.',substances:[{name:'Sustancia ficticia',category:'Inflamable',quantity:10,unit:'L',unitPrice:20}],lineItems:[{kind:'Capacitación',description:'Brigadas (ejemplo)',quantity:1,unitPrice:1500},{kind:'Simulacro',description:'Evacuación (ejemplo)',quantity:1,unitPrice:1200}]};
  const pc=await tenantSave('pc/save?module=pcQuotes',{data:pcQuote});
  await tenantSave('pc/save?module=pcQuotes',{id:pc.id,data:{...pcQuote,status:'Enviada'},reason:'Envío ficticio'});
  await tenantSave('pc/save?module=pcQuotes',{id:pc.id,data:{...pcQuote,status:'Aceptada'},reason:'Aceptación ficticia'});
  await tenantSave('pc/save?module=pcQuotes',{id:pc.id,action:'program',data:{ownerId:1,accreditedName:'Tercero ficticio (no acreditado real)',accreditation:'REGISTRO-FICTICIO',accreditationAuthority:'Autoridad ficticia',accreditationDue:future,due:future}});
  await internal('/api/saas/logout',{},cookie);
 }catch(error){bucket.close();await rm(directory,{recursive:true,force:true});throw error;}
 const applications=new Map();
 const handler=async(request,env,context)=>{
  const url=new URL(request.url);
  if(url.pathname==='/'||url.pathname==='/_demo')return new Response(landing,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  if(url.pathname==='/_demo/login'){
   if(request.method!=='POST'||request.headers.get('origin')!==url.origin)return new Response('Origen no autorizado',{status:403});
   return worker.fetch(new Request(url.origin+'/api/saas/login',{method:'POST',headers:{origin:url.origin,'content-type':'application/json'},body:JSON.stringify({username:'demo-admin',password})}),env,context);
  }
  if(url.pathname.startsWith('/api/email35/')||url.pathname.includes('/api/email35/'))return new Response('Correo deshabilitado en demo',{status:403});
  if(url.pathname==='/api/saas/customer'&&request.method==='POST'){
   const body=await request.clone().json();
   const record=await bucket.get('saas/platform-v1.json'),platform=await record.json();
   if(!body.id&&platform.customers.length>=8)return new Response('{"error":"Máximo ocho clientes ficticios en esta demo"}',{status:429,headers:{'Content-Type':'application/json'}});
  }
  const response=await worker.fetch(request,env,context);
  if((response.headers.get('content-type')||'').includes('text/html')){
   const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');
   return new Response((await response.text()).replace('<body>','<body><div style="background:#fff0c2;color:#493900;padding:10px;text-align:center">DEMO PÚBLICA TEMPORAL · Solo datos ficticios · <a href="/">Accesos de prueba</a></div>'),{status:response.status,headers});
  }
  return response;
 };
 const server=http.createServer((req,res)=>{
  let publicOrigin;
  try{
   const host=req.headers.host;if(!host||!/^([a-z0-9.-]+|\[::1\])(:\d+)?$/i.test(host))throw Error('Invalid host');
   const parsed=new URL('https://'+host),loopback=['localhost','127.0.0.1','[::1]'].includes(parsed.hostname);
   publicOrigin=(loopback?'http://':'https://')+host;
   if(!applications.has(publicOrigin)){
    if(applications.size>=8)throw Error('Too many hosts');
    applications.set(publicOrigin,createAppServer({publicOrigin,bucket,adminAuth,mode:'demo',fetchHandler:handler,logger:()=>{}}));
   }
   applications.get(publicOrigin).server.emit('request',req,res);
  }catch{res.writeHead(400).end('Invalid demo request');}
 });
 return {server,async stop(){await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();});for(const app of applications.values())await app.stop();bucket.close();await rm(directory,{recursive:true,force:true});}};
}
if(import.meta.url===pathToFileURL(resolve(process.argv[1]||'')).href){
 try{const port=Number(process.env.PORT||8787);if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid demo port');const app=await createDemoServer();app.server.on('error',()=>{console.error('Demo listener failed');app.stop().finally(()=>{process.exitCode=1;});});app.server.listen(port,'0.0.0.0',()=>console.log(JSON.stringify({event:'demo_ready',port:app.server.address().port,warning:'Public temporary demo. Fictitious data only.'})));let stopping=false;async function stop(){if(stopping)return;stopping=true;await app.stop();}process.on('SIGTERM',stop);process.on('SIGINT',stop);}catch{console.error('Temporary demo failed to initialize');process.exitCode=1;}
}
