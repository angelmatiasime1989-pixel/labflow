import {randomUUID,createHash} from 'node:crypto';
import {billingError,hostedUrl} from './client.mjs';
import {mutatePlatform,readPlatform} from './store.mjs';
const idOf=value=>typeof value==='string'?value:value?.id;
const reject=(code,message,status=409)=>{throw billingError(status,code,message);};
export function validatePrice(price,expected,{checkout=false}={}){
 if(!expected||price?.id!==expected.id||price.livemode!==false||price.currency!==expected.currency||price.unit_amount!==expected.amount||price.type!=='recurring'||price.recurring?.interval!==expected.interval||price.recurring.interval_count!==1||price.recurring.usage_type!=='licensed'||price.billing_scheme!=='per_unit'||price.tax_behavior!=='inclusive'||price.transform_quantity||price.tiers_mode||(checkout&&!price.active))reject('PRICE_MISMATCH','El precio de Stripe no coincide con el catálogo de Qubo Labs.',422);
}
export function billingService({bucket,config,api,origin,resolveContract}){
 async function ensureCustomer(tenant){
  const key=await mutatePlatform(bucket,state=>{const c=state.customers.find(c=>c.id===tenant);if(!c)reject('LAB_NOT_FOUND','Laboratorio no encontrado.',404);c.stripeBilling??={};if(c.stripeBilling.customerId)return {unchanged:true,value:c.stripeBilling};c.stripeBilling.customerCreateKey??=randomUUID();return {value:{...c.stripeBilling}};});
  if(key.customerId)return key.customerId;
  const remote=await api('POST','/customers',{metadata:{qubo_tenant:tenant}},'qubo-customer-'+key.customerCreateKey);
  if(remote.livemode!==false||!/^cus_[A-Za-z0-9_]+$/.test(remote.id)||remote.metadata?.qubo_tenant!==tenant)reject('CUSTOMER_MISMATCH','Cliente de Stripe inválido.',502);
  return mutatePlatform(bucket,state=>{const c=state.customers.find(c=>c.id===tenant),b=c?.stripeBilling;if(!b||b.customerCreateKey!==key.customerCreateKey)reject('BINDING_CONFLICT','La vinculación cambió.');if(b.customerId&&b.customerId!==remote.id)reject('BINDING_CONFLICT','La vinculación cambió.');if(state.customers.some(other=>other.id!==tenant&&other.stripeBilling?.customerId===remote.id))reject('BINDING_CONFLICT','El cliente de Stripe ya está vinculado.');b.customerId=remote.id;return {value:remote.id};});
 }
 async function checkout(customer,body){
  const intent=body.intent||'paid';if(!['paid','trial'].includes(intent)||intent==='trial'&&body.trialConsent!==true)reject('TRIAL_CONSENT_REQUIRED','Confirma los 15 días con tarjeta y el cobro automático posterior.',400);
  if(intent==='trial'){const portal=await api('GET','/billing_portal/configurations/'+config.portalConfiguration);if(portal.livemode!==false||!portal.features?.subscription_cancel?.enabled)reject('CANCELLATION_NOT_CONFIGURED','Configura la cancelación en el portal de pruebas antes de ofrecer una prueba con renovación.',422);}
  if(customer.membership==='enterprise-custom')reject('QUOTATION_REQUIRED','Enterprise Custom se gestiona por cotización.',400);
  const expected=config.prices.find(p=>p.plan===body.plan&&p.cycle===body.cycle);
  if(!expected)reject('PLAN_UNAVAILABLE','Selecciona un plan y periodicidad disponibles; Enterprise requiere cotización.',400);
  validatePrice(await api('GET','/prices/'+expected.id),expected,{checkout:true});
  const customerId=await ensureCustomer(customer.id);
  const pending=await mutatePlatform(bucket,async state=>{
   const c=state.customers.find(c=>c.id===customer.id),b=c.stripeBilling;
   if(intent==='trial'&&b.trialUsedAt)reject('TRIAL_ALREADY_USED','Este laboratorio ya utilizó su prueba comercial.');
   if(c.status!=='Activo')reject('LAB_UNAVAILABLE','Laboratorio no disponible.',403);
   if(b.subscriptionId&&!['canceled','incomplete_expired'].includes(b.status))reject('USE_PORTAL','Gestiona la suscripción existente en el portal.');
   if(b.pending){
    if(b.pending.requestId===body.requestId){if(b.pending.plan!==body.plan||b.pending.cycle!==body.cycle||(b.pending.intent||'paid')!==intent)reject('IDEMPOTENCY_CONFLICT','La misma operación no puede cambiar de plan.');return {unchanged:true,value:{...b.pending}};}
    if(!b.pending.sessionId)reject('CHECKOUT_PENDING','Reintenta la operación pendiente con el mismo identificador.');
    const prior=await api('GET','/checkout/sessions/'+b.pending.sessionId);
    if(prior.customer!==customerId||prior.livemode!==false)reject('SESSION_MISMATCH','Sesión no vinculada.');
    if(prior.status!=='expired')reject('CHECKOUT_PENDING','Hay un checkout pendiente; complétalo o espera su expiración.');
   }
   b.pending={intent,...(intent==='trial'?{consent:{version:'stripe-trial-15-v1',at:new Date().toISOString(),amount:expected.amount,currency:expected.currency,cycle:expected.cycle}}:{}),requestId:body.requestId,plan:body.plan,cycle:body.cycle,price:expected.id,createdAt:Date.now(),expiresAt:Math.floor(Date.now()/1000)+1800};return {value:{...b.pending}};
  });
  if(pending.sessionId){const session=await api('GET','/checkout/sessions/'+pending.sessionId);if(session.customer!==customerId||session.livemode!==false||session.status!=='open')reject('CHECKOUT_CLOSED','El checkout terminó; actualiza el estado.');return {url:hostedUrl(session.url,'checkout.stripe.com')};}
  if(Date.now()-pending.createdAt>23*3600000)reject('RECONCILIATION_REQUIRED','La operación necesita conciliación antes de reintentarse.');
  const returnUrl=origin+'/laboratorio/'+customer.slug+'/suscripcion';
  const session=await api('POST','/checkout/sessions',{mode:'subscription',customer:customerId,client_reference_id:customer.id,line_items:[{price:pending.price,quantity:1}],subscription_data:{metadata:{qubo_tenant:customer.id,qubo_checkout_request:pending.requestId},...(pending.intent==='trial'?{trial_period_days:15,trial_settings:{end_behavior:{missing_payment_method:'cancel'}}}:{})},payment_method_collection:'always',metadata:{qubo_tenant:customer.id,qubo_checkout_request:pending.requestId},success_url:returnUrl+'?checkout=returned',cancel_url:returnUrl+'?checkout=cancelled',expires_at:pending.expiresAt,automatic_tax:{enabled:true},billing_address_collection:'required',customer_update:{address:'auto'},integration_identifier:'qubolabs_sandbox_kpvrnzta',allow_promotion_codes:false},'qubo-checkout-'+customer.id+'-'+pending.requestId);
  if(session.livemode!==false||session.customer!==customerId||session.client_reference_id!==customer.id||!/^cs_test_[A-Za-z0-9_]+$/.test(session.id))reject('SESSION_MISMATCH','Sesión de checkout inválida.',502);
  const url=hostedUrl(session.url,'checkout.stripe.com');
  await mutatePlatform(bucket,state=>{const b=state.customers.find(c=>c.id===customer.id)?.stripeBilling;if(b?.pending?.requestId!==pending.requestId){if(b?.lastCheckoutRequest===pending.requestId)return {unchanged:true};reject('CHECKOUT_CONFLICT','El checkout cambió.');}b.pending.sessionId=session.id;return {};});return {url};
 }
 async function portal(customer){const {state}=await readPlatform(bucket),b=state.customers.find(c=>c.id===customer.id)?.stripeBilling;if(!b?.customerId)reject('NO_CUSTOMER','Primero inicia un checkout.',409);const session=await api('POST','/billing_portal/sessions',{customer:b.customerId,configuration:config.portalConfiguration,return_url:origin+'/laboratorio/'+customer.slug+'/suscripcion'});if(session.livemode!==false||idOf(session.customer)!==b.customerId)reject('PORTAL_MISMATCH','Portal no vinculado.',502);return {url:hostedUrl(session.url,'billing.stripe.com')};}
 async function applySubscription(state,subscriptionId){
  const sub=await api('GET','/subscriptions/'+subscriptionId);
  if(sub.id!==subscriptionId||sub.livemode!==false)reject('SUBSCRIPTION_MISMATCH','Suscripción inválida.',400);
  const c=state.customers.find(c=>c.stripeBilling?.customerId===idOf(sub.customer));if(!c)return 'unrelated-customer';const b=c.stripeBilling;
  if(sub.metadata?.qubo_tenant!==c.id)reject('TENANT_MISMATCH','Suscripción no vinculada al laboratorio.',400);
  if(b.subscriptionId!==sub.id){
   if(!b.pending||sub.metadata.qubo_checkout_request!==b.pending.requestId)return 'unrelated-subscription';
   if(b.subscriptionId&&!['canceled','incomplete_expired'].includes(b.status))reject('DUPLICATE_SUBSCRIPTION','Ya hay una suscripción vinculada.');
  }
  const items=sub.items?.data;if(items?.length!==1||sub.items.has_more||items[0].quantity!==1)reject('SUBSCRIPTION_ITEMS','Se requiere una sola membresía con cantidad uno.',422);
  const priceId=idOf(items[0].price),price=await api('GET','/prices/'+priceId),expected=config.prices.find(p=>p.id===priceId);validatePrice(price,expected);
  let trialAccess=false;
  if(sub.trial_end||sub.status==='trialing'){
   const authorized=b.trialSubscriptionId===sub.id||b.pending?.intent==='trial'&&sub.metadata.qubo_checkout_request===b.pending.requestId;
   if(!authorized||!Number.isSafeInteger(sub.trial_start)||!Number.isSafeInteger(sub.trial_end)||sub.trial_end-sub.trial_start!==15*86400||b.trialEndsAt&&b.trialEndsAt!==sub.trial_end*1000)reject('INVALID_TRIAL','La prueba no corresponde a los 15 días autorizados.',422);
   const sessionId=b.trialSessionId||b.pending?.sessionId;if(!sessionId)reject('TRIAL_SESSION_PENDING','La sesión de prueba todavía no está vinculada.');
   const session=await api('GET','/checkout/sessions/'+sessionId);
   if(session.status!=='complete'||session.customer!==b.customerId||idOf(session.subscription)!==sub.id||session.payment_method_collection!=='always'||session.amount_total!==0||session.payment_status!=='no_payment_required')reject('TRIAL_CHECKOUT_PENDING','Completa Checkout con un medio de pago antes de iniciar la prueba.');
   if(sub.status==='trialing'){
    const remote=await api('GET','/customers/'+b.customerId),paymentId=idOf(sub.default_payment_method)||idOf(remote.invoice_settings?.default_payment_method);
    if(!/^pm_[A-Za-z0-9_]+$/.test(paymentId||''))reject('TRIAL_PAYMENT_METHOD_REQUIRED','Falta un medio de pago confirmado.');
    const method=await api('GET','/payment_methods/'+paymentId);if(method.type!=='card'||idOf(method.customer)!==b.customerId||method.livemode!==false)reject('TRIAL_PAYMENT_METHOD_REQUIRED','Se requiere una tarjeta vinculada al laboratorio.');
    trialAccess=sub.trial_end*1000>Date.now()&&!sub.pause_collection;
   }
   b.trialUsedAt??=new Date().toISOString();b.trialSubscriptionId=sub.id;b.trialSessionId=sessionId;b.trialEndsAt=sub.trial_end*1000;b.trialConsent??=b.pending?.consent;
  }
  let paid=false,paidUntil=0;
  if(sub.status==='active'&&sub.latest_invoice){const invoice=await api('GET','/invoices/'+idOf(sub.latest_invoice));paid=invoice.livemode===false&&idOf(invoice.customer)===b.customerId&&idOf(invoice.parent?.subscription_details?.subscription)===sub.id&&invoice.status==='paid'&&invoice.currency==='mxn'&&Number.isSafeInteger(invoice.amount_paid)&&Number.isSafeInteger(invoice.amount_due)&&invoice.amount_paid>=invoice.amount_due&&invoice.amount_due>0;
   // An old paid invoice must never authorize a new unpaid price or a later period.
   const lines=(invoice.lines?.data||[]).filter(line=>line.amount>0&&line.currency==='mxn'&&line.quantity===1&&idOf(line.pricing?.price_details?.price)===priceId&&Number.isSafeInteger(line.period?.end)&&line.period.start<=Date.now()/1000);paidUntil=lines.length?Math.max(...lines.map(line=>line.period.end)):0;}
  const end=trialAccess?sub.trial_end:Math.min(items[0].current_period_end,paidUntil);
  const access=trialAccess||paid&&sub.status==='active'&&!sub.pause_collection&&Number.isSafeInteger(end)&&end*1000>Date.now();
  // The event receipt and the contract change share the same platform CAS below.
  const applyContract=!b.managed||c.membership!==expected.plan;
  b.subscriptionId=sub.id;b.status=sub.status;b.access=access;b.managed=!!b.managed||access;b.accessUntil=Number.isSafeInteger(end)?end*1000:0;b.cancelAtPeriodEnd=!!sub.cancel_at_period_end;b.syncedAt=new Date().toISOString();b.plan=expected.plan;b.cycle=expected.cycle;b.planAmount=price.unit_amount;b.currency=price.currency;b.nextChargeAt=['active','trialing'].includes(sub.status)&&!sub.cancel_at_period_end&&!sub.cancel_at?(sub.status==='trialing'?sub.trial_end:items[0].current_period_end)*1000:null;b.nextChargeAmount=null;b.endedAt=sub.ended_at?sub.ended_at*1000:null;
  if(access&&applyContract){const plan=resolveContract(expected.plan,state.catalog,state.membershipPlans);c.membership=expected.plan;c.modules=plan.modules;c.tools=plan.tools;c.updatedAt=b.syncedAt;}
  if(b.pending?.requestId===sub.metadata.qubo_checkout_request){b.lastCheckoutRequest=b.pending.requestId;delete b.pending;}
  return trialAccess?'trialing-verified':access?'active-paid':'access-withheld';
 }
 async function webhook(event,raw){
  const digest=createHash('sha256').update(raw).digest('hex');
  return mutatePlatform(bucket,async state=>{
   state.stripeEvents??={};if(Object.hasOwn(state.stripeEvents,event.id)){if(state.stripeEvents[event.id].digest!==digest)reject('EVENT_ID_CONFLICT','El identificador del evento cambió de contenido.',400);return {unchanged:true,value:{received:true,duplicate:true}};}
   let subscriptionId;const object=event.data.object;
   if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','customer.subscription.trial_will_end'].includes(event.type))subscriptionId=object.id;
   else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
    if(!/^cs_test_[A-Za-z0-9_]+$/.test(object.id))reject('INVALID_SESSION','Sesión inválida.',400);
    const session=await api('GET','/checkout/sessions/'+object.id);if(session.livemode!==false||session.mode!=='subscription')reject('INVALID_SESSION','Sesión inválida.',400);subscriptionId=idOf(session.subscription);
   }else if(['invoice.paid','invoice.payment_failed'].includes(event.type)){
    if(!/^in_[A-Za-z0-9_]+$/.test(object.id))reject('INVALID_INVOICE','Factura inválida.',400);
    const invoice=await api('GET','/invoices/'+object.id);if(invoice.livemode!==false)reject('INVALID_INVOICE','Factura inválida.',400);subscriptionId=idOf(invoice.parent?.subscription_details?.subscription);
   }
   let result='ignored';if(subscriptionId){if(!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId))reject('INVALID_SUBSCRIPTION','Suscripción inválida.',400);result=await applySubscription(state,subscriptionId);}
   state.stripeEvents[event.id]={digest,type:event.type,result,processedAt:new Date().toISOString()};return {value:{received:true}};
  });
 }
 async function reconcile(customer){return mutatePlatform(bucket,async state=>{const b=state.customers.find(c=>c.id===customer.id)?.stripeBilling;let id=b?.subscriptionId;if(!id&&b?.pending?.sessionId){const session=await api('GET','/checkout/sessions/'+b.pending.sessionId);if(session.customer!==b.customerId||session.livemode!==false)reject('SESSION_MISMATCH','Sesión no vinculada.');id=idOf(session.subscription);}if(!id)return {unchanged:true,value:{updated:false}};const result=await applySubscription(state,id);return {value:{updated:true,result}};});}
 return {checkout,portal,webhook,reconcile};
}
