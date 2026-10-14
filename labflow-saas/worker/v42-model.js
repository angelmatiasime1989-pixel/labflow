// The plan is entered once; summary fields are derived from its rows.
META.quality.fields=META.quality.fields.filter(([k])=>!['cause','plan','evidence','effectiveness','recurrenceKey','actionPlan','actionOwnerId','actionDue','ownerId','due'].includes(k));
const order42=['type','name','clause','description','why1','why2','why3','why4','why5','rootCause'];META.quality.fields.sort((a,b)=>(order42.includes(a[0])?order42.indexOf(a[0]):99)-(order42.includes(b[0])?order42.indexOf(b[0]):99));META.quality.fields.splice(META.quality.fields.findIndex(f=>f[0]==='rootCause')+1,0,['planLines42','Plan de acción','plan42',1]);
META.risks.fields=META.risks.fields.filter(([k])=>!['why1','why2','why3','why4','why5','rootCause','recurrenceKey','plan','effectiveness','qualityId'].includes(k));META.risks.fields.unshift(['process42','Proceso o actividad','text',1]);for(const f of META.risks.fields){if(['actionPlan','actionOwnerId','actionDue'].includes(f[0]))f[3]=1;if(f[0]==='actionPlan')f[1]='Tratamiento y acción propuesta';if(f[0]==='description')f[1]='Descripción del riesgo';}
for(const m of Object.keys(META)){const unique=new Map();for(const f of META[m].fields)if(!unique.has(f[0]))unique.set(f[0],f);META[m].fields=[...unique.values()];}

META.risks.fields=META.risks.fields.filter(([k])=>!['residualProbability','residualImpact'].includes(k));const riskOrder42=['process42','name','type','description','impact','probability','ownerId','actionPlan','actionOwnerId','actionDue','due','validityMonths','changeReason'];META.risks.fields.sort((a,b)=>riskOrder42.indexOf(a[0])-riskOrder42.indexOf(b[0]));

for(const m of SOURCE_DOCS28)META[m].fields.splice(META[m].fields.findIndex(f=>f[0]==='actionPlan')+1,0,['actionResources42','Recursos para la acción','textarea',m==='risks'?1:0]);

for(const m of SOURCE_DOCS28)for(const f of META[m].fields){if(['actionPlan','actionOwnerId','actionDue','actionResources42'].includes(f[0]))f[3]=1;if(f[0]==='actionPlan'&&m!=='risks')f[1]='Acción propuesta (registro independiente)';}

for(const m of SOURCE_DOCS28)META[m].fields=META[m].fields.filter(([k])=>!['qualityId','recurrenceKey'].includes(k));
