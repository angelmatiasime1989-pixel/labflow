import {categories,zone,localDate,monthStart,ledger,saveEntry,monthly,fail} from './model.mjs';
import {readStripe} from './stripe-read.mjs';
import {financeAdminPage} from './shell.mjs';
const page=financeAdminPage();
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export function financeRoutes({bucket,env,origin,transport,clock=()=>Date.now()}){return async(req,user)=>{
 const url=new URL(req.url),isPage=/^\/admin\/finanzas\/?$/.test(url.pathname),isApi=url.pathname==='/api/provider/finance';if(!isPage&&!isApi)return null;
 if(!user)return isPage?Response.redirect(origin+'/administrador/ingresar',303):json({error:'Solo el administrador global puede consultar Finanzas.'},401);
 if(user.mustChangePassword)return json({error:'Cambia la contraseña temporal antes de consultar Finanzas.'},403);
 try{const timezone=zone(env),today=localDate(clock(),timezone);
 if(isPage){if(req.method!=='GET')return json({error:'Método no permitido.'},405);return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});}
 if(req.method==='POST'){if(req.headers.get('origin')!==origin||!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Origen no autorizado.'},403);const raw=await req.text();if(Buffer.byteLength(raw)>8192)fail('Solicitud demasiado grande.',413);let body;try{body=JSON.parse(raw);}catch{fail('JSON inválido.');}return json(await saveEntry(bucket,body,user.id,today));}
 if(req.method!=='GET')return json({error:'Método no permitido.'},405);
 const years=(url.searchParams.get('years')||today.slice(0,4)).split(',').map(Number);if(!years.length||years.length>3||new Set(years).size!==years.length||years.some(y=>!Number.isInteger(y)||y<2000||y>Number(today.slice(0,4))))fail('Selecciona de uno a tres años, hasta el año actual.');
 const category=url.searchParams.get('category')||'',project=url.searchParams.get('project')||'';if(category.length>100||project.length>100)fail('Filtro inválido.');
 const {state}=await ledger(bucket),platformObject=await bucket.get('saas/platform-v1.json'),platform=platformObject?await platformObject.json():{};
 const stripe=await readStripe({env,start:monthStart(Math.min(...years)+'-01',timezone),end:monthStart((Math.max(...years)+1)+'-01',timezone),timezone,customers:platform.customers,transport});
 const months=years.flatMap(y=>Array.from({length:12},(_,i)=>monthly({month:`${y}-${String(i+1).padStart(2,'0')}`,entries:state.entries,transactions:stripe.transactions,stripe,timezone,today,category,project})));
 return json({today,timezone,years,categories,months,entries:state.entries.filter(e=>years.includes(Number(e.date.slice(0,4)))&&(!category||e.category===category)&&(!project||e.project===project)),stripe:{...stripe,transactions:stripe.transactions.filter(e=>years.includes(Number(e.date.slice(0,4)))&&(!category||e.category===category)&&(!project||e.project===project)),payouts:stripe.payouts.filter(e=>years.includes(Number(e.date.slice(0,4))))}});
 }catch(e){return json({error:e.status?e.message:'No se pudo consultar Finanzas.'},e.status||503);}
};}
