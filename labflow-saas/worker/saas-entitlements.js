const SAAS_MODULES=[
{id:'commercial',name:'Comercial',group:'Comercial',icon:'briefcase',description:'Clientes, cotizaciones, tarifas y ventas.',requires:['technical','quality','settings']},
{id:'operations',name:'Operación',group:'Operación',icon:'workflow',description:'Servicios, programación, informes y entregas.',requires:['commercial','technical','quality','hr','settings']},
{id:'technical',name:'Técnica',group:'Técnica',icon:'gauge',description:'Métodos, equipos, trazabilidad y resultados.',requires:['quality','settings']},
{id:'sampling',name:'Muestreo',group:'Muestreo',icon:'flask',description:'Planes, registros y reportes de muestreo.',requires:['operations','technical','quality','settings']},
{id:'quality',name:'Calidad',group:'Calidad',icon:'shield',description:'Documentos, riesgos, quejas, acciones y auditorías.',requires:['settings']},
{id:'purchasing',name:'Compras',group:'Compras',icon:'cart',description:'Solicitudes, proveedores y órdenes de compra.',requires:['settings']},
{id:'warehouse',name:'Almacén',group:'Almacén',icon:'box',description:'Inventario, movimientos, activos y resguardos.',requires:['settings']},
{id:'hr',name:'Recursos humanos',group:'Recursos humanos',icon:'users',description:'Personal, puestos, competencia y autorizaciones.',requires:['quality','technical','settings']},
{id:'accounting',name:'Contabilidad',group:'Contabilidad',icon:'chart',description:'Cuentas, pólizas, cobranza y resultados.',requires:['settings']},
{id:'settings',name:'Configuración',group:'Configuración',icon:'settings',description:'Identidad del laboratorio, usuarios, roles y respaldos.',requires:[],required:true}
];
function moduleCodeSaas(m){return SAAS_MODULES.find(x=>x.group===META[m]?.group)?.id||null;}
function licensedSaas(s,m){if(!s.saasEntitlements)return true;const code=moduleCodeSaas(m);return !!code&&s.saasEntitlements.modules.includes(code)&&!['demo30'].includes(m);}
const permissionsBeforeSaas=rolePermissions;rolePermissions=function(s,u){const p=clone(permissionsBeforeSaas(s,u));if(s.saasEntitlements)for(const k of ['view','edit','approve'])p[k]=p[k].filter(m=>licensedSaas(s,m));return p;};
const visibleBeforeSaas=visibleState;visibleState=function(s,u){const out=visibleBeforeSaas(s,u);if(s.saasEntitlements){out.files=(out.files||[]).filter(f=>licensedSaas(s,f.module));out.approvals=(out.approvals||[]).filter(a=>licensedSaas(s,a.module));out.audit=(out.audit||[]).filter(a=>licensedSaas(s,a.module));out.readingInbox=(out.readingInbox||[]).filter(a=>licensedSaas(s,a.sourceModule));if(!licensedSaas(s,'services'))out.myServices=[];}out.saasTenant=s.saasEntitlements?{id:s.saasEntitlements.id,membership:s.saasEntitlements.membership,modules:s.saasEntitlements.modules}:null;if(s.saasEntitlements&&!s.saasEntitlements.modules.includes('accounting')){for(const k of ['financialSummary','results30','inventoryValuation','budgetSummary','fiscalIssues30','accountErrors30','closedPeriods30','fiscalHistory30'])delete out[k];const allowed=new Set((out.kpis||[]).filter(k=>!/(financ|ebitda|margen|cobranza|rentabilidad)/i.test((k.category||'')+' '+(k.source||'')+' '+(k.name||''))).map(k=>k.id));out.kpiDashboard=(out.kpiDashboard||[]).map(period=>({...period,items:(period.items||[]).filter(x=>allowed.has(x.id))}));}return out;};

const SAAS_PACKAGES=[
{id:'basic',name:'Básico',description:'Ciclo completo del laboratorio: cotización, servicio, informe y cobranza, con calidad y personal.',modules:['commercial','operations','technical','quality','hr','accounting','settings']},
{id:'medium',name:'Medio',description:'Todo Básico, más compras y almacén para abastecimiento, inventario y pagos integrados.',modules:['commercial','operations','technical','quality','hr','accounting','settings','purchasing','warehouse']},
{id:'advanced',name:'Avanzado',description:'Todo Medio, más muestreo y todas las herramientas disponibles. Incluye nuevos módulos cuando estén integrados.',modules:null}
];
function packagesSaas(catalog){return SAAS_PACKAGES.map(p=>({...p,modules:selectedModulesSaas(p.modules||catalog.filter(m=>m.status==='ready').map(m=>m.id),catalog)}));}
function membershipSaas(id,catalog){const p=packagesSaas(catalog).find(p=>p.id===id);if(!p)fail('Selecciona una membresía: Básico, Medio o Avanzado');return p;}
function migrateMembershipSaas(c,catalog){return packagesSaas(catalog).find(p=>(c.modules||[]).every(id=>p.modules.includes(id)))?.id||'advanced';}
