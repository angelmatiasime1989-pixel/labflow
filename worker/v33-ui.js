// Acknowledge confirmed writes independently of subsequent refreshes.
let receipt33=null;
const toastBefore33=toast;
toast=function(message){
 if(receipt33&&Date.now()<receipt33.expires&&/^(Documento actualizado|Registro actualizado|Registro integrado y guardado|Transición guardada|Guardado y enviado a la etapa correspondiente|Borrador guardado en el servidor)$/.test(message)){message=receipt33.message;}
 toastBefore33(message);
};
const mutateBefore33=mutate;
mutate=async function(m,id,action,data={},extra={}){
 receipt33=null;
 const result=await mutateBefore33(m,id,action,data,extra);
 if(current==='alerts'&&META[m]){current=m;moduleHome27=null;query='';statusFilter='';}
 if(['create','edit','submit','advance','requestRetirement'].includes(action)){
 const r=result.receipt||{};
 const label=r.folio?' · '+r.folio:'';
 const message=r.sent?'Envío exitoso'+label+(r.recipient?'. Enviado a: '+r.recipient+'.':'.'):action==='create'||action==='edit'?'Registro guardado correctamente'+label+'.':'Registro actualizado correctamente'+label+'.';
 receipt33={message,expires:Date.now()+10000};
 if(r.sent||['create','edit','submit','requestRetirement'].includes(action))closeModal();
 toast(message);
 }
 return result;
};
const toastNode33=$('#toast');
if(toastNode33?.setAttribute){toastNode33.setAttribute('role','status');toastNode33.setAttribute('aria-live','polite');}
