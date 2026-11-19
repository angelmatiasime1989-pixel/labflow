import {createHmac,timingSafeEqual} from 'node:crypto';
export const API_VERSION='2026-10-28.endive';
export const billingError=(status,code,message)=>Object.assign(Error(message),{status,code});
export function verifyEvent(raw,signature,secret,now=Date.now()){
 const parts=String(signature||'').split(',').map(v=>v.split('=')),times=parts.filter(([k])=>k==='t');
 if(times.length!==1||!/^\d+$/.test(times[0][1])||Math.abs(now/1000-Number(times[0][1]))>300)throw billingError(400,'INVALID_SIGNATURE','Firma inválida.');
 const expected=createHmac('sha256',secret).update(times[0][1]+'.').update(raw).digest();
 if(!parts.some(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/i.test(v)&&timingSafeEqual(expected,Buffer.from(v,'hex'))))throw billingError(400,'INVALID_SIGNATURE','Firma inválida.');
 let event;try{event=JSON.parse(raw.toString('utf8'));}catch{throw billingError(400,'INVALID_EVENT','Evento inválido.');}
 if(!/^evt_[a-zA-Z0-9_]+$/.test(event.id)||event.livemode!==false||event.account||event.api_version!==API_VERSION||typeof event.type!=='string'||!event.data?.object)throw billingError(400,'INVALID_EVENT','Se requiere un evento snapshot de pruebas y la versión configurada.');
 return event;
}
function form(value,params=new URLSearchParams(),prefix=''){
 for(const [key,item] of Object.entries(value)){if(item===undefined||item===null)continue;const name=prefix?`${prefix}[${key}]`:key;if(typeof item==='object')form(item,params,name);else params.append(name,String(item));}return params;
}
export function stripeClient(secret,transport=fetch){
 return async(method,path,body,key)=>{
  if(!/^\/(?:customers|prices|subscriptions|invoices|checkout\/sessions|billing_portal\/sessions)(?:\/[A-Za-z0-9_]+)?$/.test(path))throw billingError(500,'STRIPE_PATH','Operación no disponible.');
  let response;try{response=await transport('https://api.stripe.com/v1'+path,{method,redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+secret,'Stripe-Version':API_VERSION,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:form(body).toString()}:{})});}catch{throw billingError(502,'STRIPE_UNAVAILABLE','Stripe no respondió; reintenta la misma operación.');}
  if(!response.ok)throw billingError(502,'STRIPE_REJECTED','Stripe rechazó la operación; revisa la configuración de pruebas.');
  let data;try{data=await response.json();}catch{throw billingError(502,'STRIPE_RESPONSE','Respuesta de Stripe inválida.');}
  if(data.livemode===true)throw billingError(502,'LIVE_MODE_REJECTED','No se admiten datos de producción.');return data;
 };
}
export function hostedUrl(value,hostname){try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname===hostname&&!url.username&&!url.password&&(!url.port||url.port==='443'))return url.href;}catch{}throw billingError(502,'STRIPE_URL','URL de Stripe inválida.');}
