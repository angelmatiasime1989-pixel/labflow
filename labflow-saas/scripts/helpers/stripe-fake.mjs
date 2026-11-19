import {createHmac,randomUUID} from 'node:crypto';
import {API_VERSION} from '../../server/stripe/client.mjs';
import {priceCatalog} from '../../server/stripe/config.mjs';
export function fakeStripe(){
 const env={STRIPE_ENABLED:'true',STRIPE_TEST_MODE:'true',NODE_ENV:'test',STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',STRIPE_PORTAL_CONFIGURATION:'bpc_synthetic'};
 const objects=new Map(),calls=[],cache=new Map();let sequence=0,hook=null;
 for(const p of priceCatalog){const id='price_'+p.plan+'_'+p.cycle;env[p.env]=id;objects.set('/prices/'+id,{id,object:'price',livemode:false,active:true,currency:p.currency,unit_amount:p.amount,type:'recurring',billing_scheme:'per_unit',tax_behavior:'exclusive',recurring:{interval:p.interval,interval_count:1,usage_type:'licensed'}});}
 const response=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 async function transport(url,options){const path=new URL(url).pathname.replace('/v1',''),params=Object.fromEntries(new URLSearchParams(options.body)),key=options.headers['Idempotency-Key'];calls.push({path,method:options.method,params,key,version:options.headers['Stripe-Version']});if(hook){const override=await hook({path,options,params});if(override)return override;}if(key&&cache.has(key))return response(cache.get(key));let data;
  if(options.method==='GET'){data=objects.get(path);if(!data)return new Response('{}',{status:404});}
  else if(path==='/customers'){data={id:'cus_test'+(++sequence),livemode:false,metadata:{qubo_tenant:params['metadata[qubo_tenant]']}};objects.set('/customers/'+data.id,data);}
  else if(path==='/checkout/sessions'){data={id:'cs_test_'+(++sequence),livemode:false,mode:'subscription',status:'open',customer:params.customer,client_reference_id:params.client_reference_id,metadata:{qubo_tenant:params['metadata[qubo_tenant]'],qubo_checkout_request:params['metadata[qubo_checkout_request]']},price:params['line_items[0][price]'],subscription:null,url:'https://checkout.stripe.com/c/pay/synthetic'+sequence};objects.set('/checkout/sessions/'+data.id,data);}
  else if(path==='/billing_portal/sessions')data={id:'bps_test'+(++sequence),livemode:false,customer:params.customer,url:'https://billing.stripe.com/p/session/synthetic'+sequence};
  else throw Error('Unexpected fake Stripe operation '+path);
  if(key)cache.set(key,structuredClone(data));return response(data);
 }
 function complete(sessionId,{status='active',paid=true,price,quantity=1}={}){const session=objects.get('/checkout/sessions/'+sessionId),id='sub_test'+(++sequence),invoiceId='in_test'+sequence;const sub={id,livemode:false,customer:session.customer,status,metadata:structuredClone(session.metadata),latest_invoice:invoiceId,items:{has_more:false,data:[{price:price||session.price,quantity,current_period_end:Math.floor(Date.now()/1000)+2592000}]},cancel_at_period_end:false};objects.set('/subscriptions/'+id,sub);objects.set('/invoices/'+invoiceId,{id:invoiceId,livemode:false,customer:session.customer,currency:'mxn',status:paid?'paid':'open',amount_due:100,amount_paid:paid?100:0,lines:{data:[{amount:100,currency:'mxn',quantity:1,pricing:{price_details:{price:price||session.price}},period:{start:Math.floor(Date.now()/1000)-60,end:sub.items.data[0].current_period_end}}]},parent:{subscription_details:{subscription:id}}});session.subscription=id;session.status='complete';return sub;}
 return {env,transport,objects,calls,complete,setHook(fn){hook=fn;}};
}
export function eventFor(type,object,extra={}){return {id:'evt_'+randomUUID().replaceAll('-',''),object:'event',api_version:API_VERSION,created:Math.floor(Date.now()/1000),livemode:false,type,data:{object},...extra};}
export function signedRequest(event,{secret='whsec_synthetic',time=Math.floor(Date.now()/1000),origin='https://review.test',raw=Buffer.from(JSON.stringify(event))}={}){const signature=createHmac('sha256',secret).update(time+'.').update(raw).digest('hex');return new Request(origin+'/api/billing/stripe/webhook',{method:'POST',headers:{'stripe-signature':`t=${time},v1=${signature}`,'content-type':'application/json'},body:raw});}
