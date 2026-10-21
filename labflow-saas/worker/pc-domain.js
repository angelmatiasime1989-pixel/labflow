const upgradeBeforePC=upgradeState;upgradeState=function(s){let added=false;for(const m of ['pcPrograms','pcQuotes'])if(!Array.isArray(s[m])){s[m]=[];added=true;}return upgradeBeforePC(s)||added;};
const permissionsBeforePC=rolePermissions;rolePermissions=function(s,u){const p=clone(permissionsBeforePC(s,u));if(['Administrador','Calidad','Comercial'].includes(u.role))for(const k of ['view','edit'])p[k]=[...new Set([...p[k],'pcPrograms','pcQuotes'])];return p;};
function pcValidate(s,m,input,old){
 const r=cleanData(m,input);generic10(s,m,r,null);
 r.buildingArea=pcNumber(r.buildingArea,'Construcción');r.landArea=pcNumber(r.landArea,'Terreno');
 if(!s.clients.some(c=>c.id===r.clientId))fail('Cliente no disponible');
 if(m==='pcQuotes')Object.assign(r,pcEstimate(input));
 else{if(!s.users.some(u=>u.id===r.ownerId&&u.active))fail('Responsable no disponible');if(r.accreditationDue<today()&&(!old||r.accreditation!==old.accreditation||r.accreditationDue!==old.accreditationDue))fail('La acreditación indicada está vencida');}
 r.status=input.status||old?.status||(m==='pcQuotes'?'Borrador':'Por iniciar');
 if(!(m==='pcQuotes'?PC_QUOTE_STATES:PC_PROGRAM_STATES).includes(r.status))fail('Estado no válido');
 if(m==='pcPrograms'&&r.status==='Aprobado'&&!r.authorityFolio?.trim())fail('Registra el folio de aprobación de la autoridad');
 return r;
}
async function pcRoute(req,url,s,u,env,etag){
 const path=url.pathname;
 if(['/api/mutate','/api/work28'].includes(path)&&req.method==='POST'){const b=await req.clone().json();if(['pcPrograms','pcQuotes'].includes(b.module))fail('Utiliza el flujo de Protección civil',400);}
 if(!path.startsWith('/api/pc/'))return null;
 const module=url.searchParams.get('module');if(!['pcPrograms','pcQuotes'].includes(module))fail('Módulo de PC inválido');
 if(!see(u,module))fail('Tu membresía o perfil no permite Protección civil',403);
 if(path==='/api/pc/pdf'&&req.method==='GET'){
  const row=find(s,module,url.searchParams.get('id'));if(!rowAccessible(s,u,module,row))fail('Sin permiso',403);
  if(row.issuedPC){const o=await env.BUCKET.get(row.issuedPC.pdfKey);if(!o)fail('Original emitido no disponible',409);const bytes=new Uint8Array(await o.arrayBuffer());if(await hash(bytes)!==row.issuedPC.sha256)fail('El original emitido no coincide con su huella',409);return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="'+row.folio+'.pdf"','Cache-Control':'no-store'}});}return pcPdf(s,module,row);
 }
 if(!['/api/pc/save','/api/pc/attachment'].includes(path)||req.method!=='POST')fail('Ruta no disponible',404);
 if(!permit(u,module))fail('Sin permiso para editar',403);
 const raw=await req.text();if(raw.length>(path==='/api/pc/attachment'?7100000:100000))fail('Solicitud demasiado grande',413);const b=JSON.parse(raw);if(b.action&&!['save','program','clone'].includes(b.action))fail('Acción de PC inválida');if(b.revision!==s.revision)fail('Otro usuario guardó cambios. Actualiza antes de guardar.',409);
 const old=b.id?find(s,module,b.id):null;if(old&&!rowAccessible(s,u,module,old))fail('Sin permiso',403);
 const before=old?clone(old):null;
 if(path==='/api/pc/attachment'){if(!old)fail('Selecciona un registro');if(['Aprobado','Cancelado','Cancelada','Rechazada'].includes(old.status))fail('Expediente cerrado; conserva el original');if(!['Levantamiento','Revisión','Entrega','Autoridad','Otro'].includes(b.kind))fail('Indica el tipo de evidencia');const beforeIds=new Set(s.files.map(f=>f.id));await addRecordPDF(s,u,module,old,{name:b.name,base64:b.base64},env);const file=s.files.find(f=>!beforeIds.has(f.id));file.pcKind=b.kind;old.history=[...(old.history||[]),{at:now(),userId:u.id,status:old.status,note:'Evidencia '+b.kind+': '+file.name}];await save(env,s,etag);return json({ok:true,id:file.id});}
 if(b.action==='clone'){if(module!=='pcQuotes'||!old)fail('Selecciona una cotización');const copy=pcValidate(s,module,{...old,due:b.due,status:'Borrador'},null);copy.id=Math.max(0,...s.pcQuotes.map(x=>x.id))+1;copy.folio=folio(s,module);Object.assign(copy,{previousQuoteId:old.id,createdBy:u.id,createdAt:now(),updatedBy:u.id,updatedAt:now(),history:[{at:now(),userId:u.id,status:'Borrador',note:'Nueva propuesta desde '+old.folio}]});s.pcQuotes.push(copy);audit(s,u,module,copy.id,'Renovación de cotización PC',null,copy);await save(env,s,etag);return json({ok:true,id:copy.id});}
 if(b.action==='program'){
  if(module!=='pcQuotes'||old?.status!=='Aceptada')fail('Acepta la cotización antes de crear el programa');
  if(old.programId)return json({ok:true,id:old.programId,existing:true});
  if(!permit(u,'pcPrograms'))fail('Sin permiso',403);
  const input={...old,...b.data,status:'Por iniciar',buildingArea:old.buildingArea,landArea:old.landArea,clientId:old.clientId};
  let r;try{r=pcValidate(s,'pcPrograms',input,null);}catch(e){if(e.status)throw e;fail(e.message);}r.id=Math.max(0,...s.pcPrograms.map(x=>x.id))+1;r.folio=folio(s,'pcPrograms');r.quoteId=old.id;r.createdAt=now();r.createdBy=u.id;r.updatedAt=now();r.updatedBy=u.id;r.history=[{at:now(),userId:u.id,status:r.status,note:'Creado desde '+old.folio}];s.pcPrograms.push(r);old.programId=r.id;audit(s,u,'pcPrograms',r.id,'Creación desde cotización',null,r);await save(env,s,etag);return json({ok:true,id:r.id});
 }
 let r;try{r=pcValidate(s,module,b.data||{},old);}catch(e){if(e.status)throw e;fail(e.message);}
 if(!old&&r.status!==(module==='pcQuotes'?'Borrador':'Por iniciar'))fail('Crea primero el registro en su estado inicial');
 if(old?.status==='Cancelado'||old?.status==='Cancelada')fail('Registro cancelado protegido');
 if(old&&r.status!==old.status&&!String(b.reason||'').trim())fail('Indica el motivo del cambio de estado');
 if(module==='pcQuotes'&&old){
  if(r.status!==old.status&&['Enviada','Aceptada'].includes(r.status)&&r.due<today())fail('La cotización está vencida. Crea una nueva propuesta con vigencia actual');
  const allowed={Borrador:['Borrador','Enviada','Cancelada'],Enviada:['Enviada','Aceptada','Rechazada','Cancelada'],Aceptada:['Aceptada','Cancelada'],Rechazada:['Rechazada']};
  if(!allowed[old.status]?.includes(r.status))fail('Transición de cotización no válida');
  if(old.status!=='Borrador')for(const key of [...META.pcQuotes.fields.map(f=>f[0]),'substances','lineItems'])if(JSON.stringify(r[key])!==JSON.stringify(old[key]))fail('Cotización enviada protegida. Crea una nueva para cambiar importes o alcance');
 }
 if(module==='pcPrograms'&&old){if(['Entregado','Ingresado a autoridad','Con observaciones','Aprobado'].includes(old.status)&&r.status!=='Elaboración')for(const [key]of META.pcPrograms.fields){if(!['notes','authorityFolio','authorityDate','validUntil'].includes(key)&&JSON.stringify(r[key])!==JSON.stringify(old[key]))fail('El alcance revisado está protegido. Regresa a elaboración para modificarlo');}const transitions={'Por iniciar':['Levantamiento','Elaboración','Cancelado'],Levantamiento:['Elaboración','Cancelado'],Elaboración:['Revisión','Cancelado'],Revisión:['Elaboración','Entregado','Cancelado'],Entregado:['Ingresado a autoridad','Cancelado'],'Ingresado a autoridad':['Con observaciones','Aprobado','Cancelado'],'Con observaciones':['Elaboración','Ingresado a autoridad','Aprobado','Cancelado'],Aprobado:['Cancelado']};if(r.status!==old.status&&!transitions[old.status]?.includes(r.status))fail('Completa las etapas de elaboración, revisión e ingreso antes de aprobar');if(r.status!==old.status){if(r.status==='Revisión'&&!s.files.some(f=>f.module===module&&f.recordId===old.id))fail('Adjunta el expediente antes de enviarlo a revisión');if(r.status==='Entregado'){if(!['Administrador','Calidad'].includes(u.role)||u.id===old.ownerId||u.id===old.createdBy)fail('La entrega requiere revisión de otra persona con perfil Administrador o Calidad',403);r.reviewedBy=u.id;r.reviewedAt=now();}if(r.status==='Ingresado a autoridad'&&(!old.reviewedBy||!r.authorityFolio?.trim()))fail('Registra revisión y folio de ingreso');if(r.status==='Aprobado'){if(!old.reviewedBy||!r.authorityDate||r.authorityDate>today()||!s.files.some(f=>f.module===module&&f.recordId===old.id&&f.pcKind==='Autoridad'))fail('La aprobación manual requiere revisión, fecha y PDF de la autoridad');r.authorityVerifiedExternally=false;r.authorityRecordedBy=u.id;}}if(old.status==='Aprobado'&&r.status==='Aprobado')fail('Programa aprobado protegido; conserva la evidencia original');}
 const stamp={updatedAt:now(),updatedBy:u.id};if(old){r={...old,...r,...stamp};}else{r={...r,id:Math.max(0,...s[module].map(x=>x.id))+1,folio:folio(s,module),createdAt:now(),createdBy:u.id,...stamp,history:[]};}
 if(module==='pcPrograms'&&['Elaboración','Revisión'].includes(r.status)){delete r.reviewedBy;delete r.reviewedAt;}
 r.history=[...(old?.history||[]),{at:now(),userId:u.id,status:r.status,note:String(b.reason||'Creación / actualización').slice(0,2000)}];
 if(module==='pcQuotes'&&old?.status==='Borrador'&&r.status==='Enviada'){r.issuedSnapshot={lab:clone(s.labSettings[0]),client:clone(s.clients.find(c=>c.id===r.clientId)),at:now()};const response=await pcPdf(s,module,r),bytes=new Uint8Array(await response.arrayBuffer()),pdfKey='issued/pc/'+crypto.randomUUID()+'.pdf';await env.BUCKET.put(pdfKey,bytes,{onlyIf:{etagDoesNotMatch:'*'}});r.issuedPC={pdfKey,sha256:await hash(bytes),at:now(),version:1};}
 if(old)Object.assign(old,r);else s[module].push(r);audit(s,u,module,r.id,before?'Actualización PC':'Creación PC',before,r,b.reason||'');await save(env,s,etag);return json({ok:true,id:r.id,revision:s.revision});
}
async function pcPdf(s,module,row){
 const document=await PDFLib.PDFDocument.create();let page,y;const font=await document.embedFont(PDFLib.StandardFonts.Helvetica);
 const text=value=>String(value??'').replaceAll('²','2').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ');
 function line(value){for(let i=0,str=text(value);i<str.length||i===0;i+=90){if(!page||y<45){page=document.addPage([595,842]);y=800;}page.drawText(str.slice(i,i+90),{x:40,y,size:10,font});y-=16;}}
 line((row.issuedSnapshot?.lab||s.labSettings[0]).name);line(META[module].title+' · '+row.folio);line('Estado: '+row.status);for(const [key,label] of META[module].fields)line(label+': '+(key==='clientId'?(row.issuedSnapshot?.client||s.clients.find(x=>x.id===row.clientId))?.name:key==='ownerId'?s.users.find(x=>x.id===row.ownerId)?.name:row[key]));
 if(module==='pcQuotes'){for(const item of row.lines)line(item.description+': '+item.quantity+' x '+item.unitPrice+' = '+(item.cents/100)+' MXN');line('Subtotal: '+row.subtotal+' | Descuento: '+row.discount+' | IVA: '+row.tax+' | Total: '+row.total+' MXN');}
 line('Control de elaboracion. No sustituye requisitos ni aprobacion de la autoridad competente.');
 const bytes=await document.save();return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="'+row.folio+'.pdf"','Cache-Control':'no-store'}});
}
