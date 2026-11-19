import {billingError} from './client.mjs';
export const platformKey='saas/platform-v1.json';
export async function readPlatform(bucket){const object=await bucket.get(platformKey);if(!object)throw billingError(503,'PLATFORM_MISSING','El proveedor debe preparar el laboratorio.');return {state:await object.json(),etag:object.etag};}
// A single conditional object write atomically commits event receipts, linkage and contracts
// on SQLite and MariaDB. No SQL transaction is held during a Stripe network request.
export async function mutatePlatform(bucket,fn){
 for(let attempt=0;attempt<6;attempt++){const {state,etag}=await readPlatform(bucket);const result=await fn(state);if(result?.unchanged)return result.value;state.revision++;const saved=await bucket.put(platformKey,JSON.stringify(state),{onlyIf:{etagMatches:etag}});if(saved)return result?.value;}
 throw billingError(409,'BILLING_CONFLICT','Hubo cambios simultáneos; reintenta la misma operación.');
}
export async function laboratoryAdmin(bucket,req,slug){
 const {state}=await readPlatform(bucket),customer=state.customers.find(c=>c.slug===slug);
 if(!customer)throw billingError(404,'LAB_NOT_FOUND','Laboratorio no encontrado.');
 const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)labflow_session=([^;]+)/)?.[1];
 if(!/^[a-f0-9-]{72}$/i.test(token||''))throw billingError(401,'LOGIN_REQUIRED','Ingresa al laboratorio.');
 const prefix='saas/tenants/'+customer.id+'/',sessionObject=await bucket.get(prefix+'public-demo/sessions/'+token),labObject=await bucket.get(prefix+'public-demo/state-v1.json');
 if(!sessionObject||!labObject)throw billingError(401,'LOGIN_REQUIRED','Sesión no disponible.');
 const session=await sessionObject.json(),lab=await labObject.json(),user=lab.users.find(u=>u.id===session.userId);
 if(!user?.active||!(session.expires>Date.now())||(user.authVersion||1)!==session.authVersion)throw billingError(401,'SESSION_REVOKED','Sesión vencida o revocada.');
 if(user.role!=='Administrador')throw billingError(403,'ADMIN_REQUIRED','Solo el administrador del laboratorio gestiona su suscripción.');
 if(customer.status!=='Activo')throw billingError(403,'LAB_UNAVAILABLE','El proveedor debe habilitar este laboratorio.');
 if(customer.internalTest===true)throw billingError(403,'INTERNAL_TEST','Laboratorio interno de pruebas: facturación externa bloqueada.');return {customer,user};
}
