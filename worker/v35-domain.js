const visibleBefore35=visibleState;visibleState=function(s,u){const out=visibleBefore35(s,u);out.master35=masterRows35(out);return out;};
async function route35(req,url,s,u,env,etag){const path=url.pathname;
 if(path==='/api/calibration-program35.pdf'&&req.method==='GET'){if(!see(u,'calibrations')||!see(u,'equipment'))fail('Sin permiso',403);const rows=calibrationRows35(s,today()).filter(e=>rowAccessible(s,u,'equipment',e));const r={folio:'PRO-CAL-'+today().replaceAll('-',''),name:'Programa de calibración',_title28:'Programa de calibración',status:'Consulta',version:s.revision,createdBy:u.id,updatedAt:now(),_program35:rows};return pdfResponse((await institutionalPDF(s,'calibrations',r,env)).bytes);}
 if(path==='/api/master-pdf'&&req.method==='GET'){if(!see(u,'documents'))fail('Sin permiso',403);const rows=exportedMasterRows40(visibleState(s,u));const r={folio:'LM-'+today().replaceAll('-',''),name:'Lista maestra',_title28:'Lista maestra',status:'Consulta',version:s.revision,createdBy:u.id,updatedAt:now(),_master35:rows};return pdfResponse((await institutionalPDF(s,'documents',r,env)).bytes);}
 if(path==='/api/calibration-request35'&&req.method==='POST'){if(!see(u,'equipment')||!permit(u,'purchases'))fail('Sin permiso para solicitar calibración',403);const b=await req.json();if(b.revision!==s.revision)fail('La información cambió. Actualiza antes de guardar.',409);const e=find(s,'equipment',b.equipmentId);if(!rowAccessible(s,u,'equipment',e))fail('Sin permiso para el equipo',403);const row=calibrationRows35(s,today()).find(r=>r.id===e.id);if(!row||row.days===null||row.days>30)fail('La solicitud aplica a equipos vencidos o a 30 días de vencer');let purchase=s.purchases.find(p=>p.calibrationEquipmentId35===e.id&&p.calibrationDue35===e.due&&!['Atendida','Cancelada','Rechazada'].includes(p.status));if(purchase)return json({ok:true,id:purchase.id,folio:purchase.folio,existing:true,revision:s.revision});const center=s.costCenters.find(c=>c.id===Number(b.costCenterId))||s.costCenters.find(c=>c.id===e.costCenterId)||s.costCenters.find(c=>c.active!==false);if(!center)fail('Configura un centro solicitante');purchase=newRecord(s,'purchases',{name:'Calibración · '+e.name,description:'Calibración del equipo '+e.folio+' · Identificación: '+(e.assetId||'')+' · Serie: '+(e.serial||'')+' · Vencimiento: '+e.due,kind:'Servicio',serviceType:'Calibración',costCenterId:center.id,quantity:1,due:e.due<today()?today():e.due,requesterId:u.id,calibrationEquipmentId35:e.id,calibrationDue35:e.due},u);validate(s,'purchases',purchase,null,u);await sendForReview(s,u,'purchases',purchase,env);stamp(purchase,u);audit(s,u,'purchases',purchase.id,'Solicitud automática de calibración',null,purchase);await syncFinance10(s,u,'purchases',purchase,{action:'create',send:true},env);await save(env,s,etag);return json({ok:true,id:purchase.id,folio:purchase.folio,revision:s.revision,receipt:submissionReceipt33(s,'purchases',purchase,{send:true})});}
 if(path.startsWith('/api/email35/'))return emailRoute35(req,url,s,u,env,etag);return null;
}
function mailAddress35(value){return typeof value==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&!/[\r\n]/.test(value);}
function mailEvents35(s,u){u={...u,permissions:rolePermissions(s,u)};const events=(s.notifications17||[]).filter(n=>n.targetIds?.includes(u.id)&&!n.readBy?.includes(u.id)&&see(u,n.module)&&rowAccessible(s,u,n.module,s[n.module]?.find(r=>r.id===n.recordId))).map(n=>({key:'event:'+n.id,module:n.module,id:n.recordId,title:n.title}));const covered=new Set(events.map(n=>n.module+':'+n.id));for(const n of approvalInbox(s,u)){const r=s[n.module]?.find(r=>r.id===n.id);if(!r||covered.has(n.module+':'+n.id)||!see(u,n.module)||!rowAccessible(s,u,n.module,r))continue;events.push({key:'alert:'+alertKey18(s,n),module:n.module,id:n.id,title:n.title});}return events;}
function canQueueLabActivity35(env){
 return env.LAB_ACTIVITY_EMAIL_ENABLED===true&&env.SAAS_TENANT?.status==='Activo'&&env.SAAS_TENANT.internalTest!==true&&typeof env.SEND_MAIL==='function'&&typeof env.CAN_SEND_LAB_ACTIVITY35==='function';
}
function activityRow35(s,module,id){return META[module]&&s[module]?.find(r=>r.id===Number(id));}
function authorizesActivity35(s,person,module,row){return !!row&&rowAccessible(s,{...person,permissions:rolePermissions(s,person)},module,row);}
function queueManagedActivity35(before,s,env){
 if(!canQueueLabActivity35(env)||!env.MAIL_ACTOR35)return;
 const oldEvents=new Set((before.notifications17||[]).map(n=>n.id)),oldAudit=new Set((before.audit||[]).slice(-100).map(n=>n.id)),changes=new Map();
 function add(module,id,recipients){
  if(!META[module]||META[module].group==='Configuración'||['users','roles','labSettings','accounts','system'].includes(module))return;
  const row=activityRow35(s,module,id);if(!row)return;
  const key=module+':'+id,entry=changes.get(key)||{module,id,row,people:new Set()};
  for(const actor of recipients)if(actor)entry.people.add(Number(actor));
  changes.set(key,entry);
 }
 const audited=(s.audit||[]).slice(-40).filter(n=>!oldAudit.has(n.id)&&n.userId===env.MAIL_ACTOR35);
 const auditedRows=new Set(audited.map(n=>n.module+':'+n.recordId));
 for(const n of s.notifications17||[]){
  if(oldEvents.has(n.id))continue;
  const row=activityRow35(s,n.module,n.recordId),previous=activityRow35(before,n.module,n.recordId);
  if(row&&(!previous||auditedRows.has(n.module+':'+n.recordId)||['status','technicianId','signatoryId'].some(k=>row[k]!==previous[k])))add(n.module,n.recordId,n.targetIds||[]);
 }
 // Use confirmed audit changes and prior/updated record participants for actions
 // that do not generate a dedicated in-app event (e.g. a correction or attachment).
 for(const n of audited){
  const fields=['ownerId','requesterId','technicianId','signatoryId','managerId','createdBy','responsibleId'];
  const row=activityRow35(s,n.module,n.recordId),previous=activityRow35(before,n.module,n.recordId);
  const service=row?.serviceId?activityRow35(s,'services',row.serviceId):null;
  add(n.module,n.recordId,[...fields.flatMap(k=>[row?.[k],previous?.[k],service?.[k]]),...(row?.participantIds||[])]);
 }
 if(!changes.size)return;
 s.mailQueue35=s.mailQueue35||[];
 const recipients=new Map(),actorEmail=String(s.users?.find(u=>u.id===env.MAIL_ACTOR35)?.email||'').trim().toLowerCase();
 for(const person of s.users||[]){
  const address=String(person.email||'').trim().toLowerCase();
  if(person.id===env.MAIL_ACTOR35||person.active!==true||address===actorEmail||!mailAddress35(address)||!env.CAN_SEND_LAB_ACTIVITY35(address))continue;
  const principal={...person,permissions:rolePermissions(s,person)};
  const pending=new Set(approvalInbox(s,principal).map(n=>n.module+':'+n.id));
  const authorized=[...changes.entries()].filter(([key,e])=>(e.people.has(person.id)||pending.has(key))&&rowAccessible(s,principal,e.module,e.row)).map(([,e])=>({module:e.module,id:e.id}));
  if(authorized.length&&!recipients.has(address))recipients.set(address,{person,authorized});
 }
 // One private digest per unique address per successful save. The body remains generic.
 for(const [to,{person,authorized}] of recipients){
  const id=crypto.randomUUID();
  s.mailQueue35.push({id,key:'activity:'+id,userId:person.id,to,subject:'Qubo Labs · Nueva actividad en tu laboratorio',at:now(),source35:'activity-v1',records35:authorized});
 }
 s.mailQueue35=s.mailQueue35.slice(-500);
}
function queueMail35(before,s,env={}){
 if(!s.emailSettings35?.enabled)return;
 if(env.LAB_ACTIVITY_MANAGED35){try{queueManagedActivity35(before,s,env);}catch{console.error('No se pudo preparar un aviso de actividad del laboratorio.');}return;}
 s.mailQueue35=s.mailQueue35||[];for(const u of s.users.filter(u=>u.active!==false&&mailAddress35(u.email)&&!/([.]example|@example[.](com|org|net))$/i.test(u.email))){const previousUser=before.users.find(x=>x.id===u.id),previous=new Set(previousUser?mailEvents35(before,previousUser).map(n=>n.key):[]);for(const n of mailEvents35(s,u)){if(previous.has(n.key))continue;const key=u.id+':'+n.key;if(s.mailQueue35.some(x=>x.key===key))continue;s.mailQueue35.push({id:crypto.randomUUID(),key,userId:u.id,to:u.email,subject:'LabFlow · '+n.title,module:n.module,recordId:n.id,at:now()});}}s.mailQueue35=s.mailQueue35.slice(-500);
}
async function maySendManaged35(item,env){
 if(!env.LAB_ACTIVITY_MANAGED35)return true;
 const age=Date.now()-Date.parse(item.at);
 if(!(age>=0&&age<23*3600000))return false;
 if(item.test)return item.source35==='manual-v1'&&!!env.SAAS_TENANT&&!env.SAAS_TENANT.internalTest;
 if(item.source35!=='activity-v1'||!canQueueLabActivity35(env))return false;
 const {s}=await load(env),person=s.users?.find(u=>u.id===item.userId&&u.active===true);
 return !!s.emailSettings35?.enabled&&!!person&&String(person.email||'').trim().toLowerCase()===item.to&&env.CAN_SEND_LAB_ACTIVITY35(item.to)&&item.records35?.some(({module,id})=>authorizesActivity35(s,person,module,activityRow35(s,module,id)));
}
async function flushMail35(s,env){
 if(!(env.SEND_MAIL||env.RESEND_API_KEY)||!mailAddress35(env.EMAIL_FROM))return;
 const deliver=env.SEND_MAIL||((message,key)=>fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:env.EMAIL_FROM,...message}),signal:AbortSignal.timeout(10000)}));
 for(const item of(s.mailQueue35||[]).slice(-40)){const k='public-demo/mail35/'+item.id+'.json',stored=await env.BUCKET.get(k),previous=stored?await stored.json():null;if(['Aceptado por proveedor','Omitido por seguridad'].includes(previous?.status))continue;if(previous?.lastAttempt&&Date.now()-Date.parse(previous.lastAttempt)<60000)continue;const lock=await env.BUCKET.put(k,JSON.stringify({status:'Enviando',lastAttempt:now()}),{onlyIf:stored?{etagMatches:stored.etag}:{etagDoesNotMatch:'*'}});if(!lock)continue;let result;try{if(!await maySendManaged35(item,env)){await env.BUCKET.put(k,JSON.stringify({status:'Omitido por seguridad',lastAttempt:now(),at:now()}),{onlyIf:{etagMatches:lock.etag}});continue;}const response=await deliver({to:[item.to],subject:item.subject,text:'Tienes una nueva notificación en Qubo Labs.\n\n'+(env.SITE_URL||'')+'\n\nInicia sesión con tu usuario para consultar el detalle.'},'labflow-'+item.id);const data=await response.json();result=response.ok&&data.id?{status:'Aceptado por proveedor',providerId:data.id}:{status:'Error de envío',error:'El proveedor no aceptó el envío.'};}catch{result={status:'Error de envío',error:'No se pudo conectar con el proveedor.'};}await env.BUCKET.put(k,JSON.stringify({...result,lastAttempt:now(),at:now()}),{onlyIf:{etagMatches:lock.etag}});}
}
async function emailRoute35(req,url,s,u,env,etag){if(u.role!=='Administrador')fail('Solo administrador',403);const path=url.pathname;
 if(path==='/api/email35/status'&&req.method==='GET'){const history=await Promise.all((s.mailQueue35||[]).slice(-40).reverse().map(async x=>{const r=await env.BUCKET.get('public-demo/mail35/'+x.id+'.json');return{...x,...(r?await r.json():{status:(env.SEND_MAIL||env.RESEND_API_KEY)&&env.EMAIL_FROM?'En cola':'Pendiente de configurar proveedor'})};}));return json({enabled:!!s.emailSettings35?.enabled,configured:!!(env.SEND_MAIL||env.RESEND_API_KEY)&&mailAddress35(env.EMAIL_FROM),from:env.EMAIL_FROM||'',activityReady:env.LAB_ACTIVITY_MANAGED35?canQueueLabActivity35(env):!!env.SEND_MAIL,history});}
 if(req.method!=='POST')fail('Método no permitido',405);const b=await req.json();if(b.revision!==s.revision)fail('La información cambió. Actualiza.',409);
 if(path==='/api/email35/config'){s.emailSettings35={enabled:!!b.enabled};audit(s,u,'labSettings',1,'Notificaciones por correo',null,s.emailSettings35);await save(env,s,etag);return json({ok:true,revision:s.revision});}
 if(path==='/api/email35/test'){if(!mailAddress35(b.to))fail('Correo inválido');const item={id:crypto.randomUUID(),key:'test:'+crypto.randomUUID(),userId:u.id,to:b.to,subject:'LabFlow · Prueba de notificaciones',at:now(),test:true,source35:'manual-v1'};s.mailQueue35=[...(s.mailQueue35||[]),item].slice(-500);audit(s,u,'labSettings',1,'Prueba de correo',null,{to:b.to});await save({...env,MAIL_CTX35:null},s,etag);const sent=await env.BUCKET.get('public-demo/mail35/'+item.id+'.json'),outcome=sent?await sent.json():null;return json({ok:true,revision:s.revision,result:outcome?.status||'Pendiente de configurar proveedor',sent:outcome?.status==='Aceptado por proveedor'});}
 if(path==='/api/email35/retry'){await flushMail35(s,env);return json({ok:true});}fail('Ruta no encontrada',404);
}
