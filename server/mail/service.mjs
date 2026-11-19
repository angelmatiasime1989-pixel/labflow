// Private server-only delivery. Operator verification and an explicit recipient allowlist
// are required even when a key is present. No provider responses or secrets are logged.
import {createHash,randomUUID} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export function mailConfig(env={},origin){
 const recipients=String(env.RESEND_ALLOWED_RECIPIENTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),address=String(env.EMAIL_FROM||'').trim();
 return {enabled:env.TRANSACTIONAL_EMAIL_ENABLED==='true'&&env.RESEND_DOMAIN_VERIFIED==='true'&&env.RESEND_API_VERIFIED==='true'&&origin.startsWith('https://')&&/^re_\S+$/.test(env.RESEND_API_KEY||'')&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address)&&recipients.length>0&&recipients.every(x=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)),key:env.RESEND_API_KEY,from:address,recipients};
}
export function mailService({bucket,env={},origin,transport=fetch,clock=Date.now}){
 const config=mailConfig(env,origin);
 async function send(message,eventKey){
  const to=String(message.to||'').trim().toLowerCase();if(!config.enabled||!config.recipients.includes(to))return {sent:false,reason:'disabled-or-recipient-not-authorized'};
  if(typeof eventKey!=='string'||!eventKey||eventKey.length>300)throw Error('Invalid mail event');
  const body=JSON.stringify({from:config.from,to:[to],subject:String(message.subject).slice(0,180),text:String(message.text).slice(0,16000),...(/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(message.reply_to||'')?{reply_to:message.reply_to}:{})}),hash=digest(body),key='private/mail/deliveries/'+digest(eventKey),now=clock();
  const previous=await bucket.get(key),receipt=previous?await previous.json():null;
  if(receipt?.hash!==undefined&&receipt.hash!==hash)return {sent:false,reason:'event-conflict'};
  if(receipt?.status==='sent')return {sent:true,duplicate:true};
  // Resend keeps idempotency for 24h. Ambiguous sends are never retried past 23h.
  if(receipt&&(now-receipt.firstAt>=23*3600000||receipt.leaseUntil>now))return {sent:false,reason:'pending-or-manual-review'};
  const attempt={hash,firstAt:receipt?.firstAt??now,leaseUntil:now+30000,status:'sending',attempt:randomUUID()};
  const lock=await bucket.put(key,JSON.stringify(attempt),{onlyIf:previous?{etagMatches:previous.etag}:{etagDoesNotMatch:'*'}});if(!lock)return {sent:false,reason:'concurrent'};
  let result={...attempt,status:'failed',leaseUntil:0};
  try{const r=await transport('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/json','Idempotency-Key':'qubo-'+digest(eventKey)},body,signal:AbortSignal.timeout(10000)});const response=await r.json();if(r.ok&&typeof response.id==='string')result={...attempt,status:'sent',leaseUntil:0,providerId:response.id};}catch{}
  await bucket.put(key,JSON.stringify(result),{onlyIf:{etagMatches:lock.etag}});
  return {sent:result.status==='sent',...(result.providerId?{id:result.providerId}:{reason:'provider-unavailable'})};
 }
 async function welcome(customerId){if(!config.enabled)return;const object=await bucket.get('saas/platform-v1.json');if(!object)return;const customers=(await object.json()).customers;
  for(const customer of customers.filter(c=>c.status==='Activo'&&(!customerId||c.id===customerId))){if(customer.selfService&&!(customer.stripeBilling?.managed&&customer.stripeBilling.access&&customer.stripeBilling.accessUntil>clock()))continue;if(!customerId&&!customer.selfService)continue;await send({to:customer.email,subject:'Qubo Labs · Tu espacio está confirmado',text:'Tu espacio de laboratorio está confirmado. Ingresa con tus credenciales en '+origin+'/laboratorio/'+encodeURIComponent(customer.slug)+'/\nEste correo no incluye contraseñas ni modifica tu membresía.'},'welcome:'+customer.id);}
 }
 const workerSend=async(message,eventKey)=>{const result=await send({...message,to:Array.isArray(message.to)?message.to[0]:message.to},eventKey);return new Response(JSON.stringify(result.sent?{id:result.id||'already-accepted'}:{error:'Correo no enviado'}),{status:result.sent?200:503,headers:{'Content-Type':'application/json'}});};
 return {enabled:config.enabled,from:config.from,send,welcome,workerSend};
}
