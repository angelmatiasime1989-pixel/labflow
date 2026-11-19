// Shared definitions only; records are supplied by the authorized visible state.
const WORKSPACE_BOARDS=[
{id:'commercial',name:'Comercial',metrics:[{module:'clients',label:'Clientes'},{module:'quotes',label:'Cotizaciones'},{module:'orders',label:'Órdenes'}]},
{id:'operations',name:'Operación y resultados',metrics:[{module:'services',label:'Servicios'},{module:'records',label:'Registros técnicos'},{module:'reports',label:'Informes emitidos',status:'Emitido'}]},
{id:'quality',name:'Calidad',metrics:[{module:'documents',label:'Documentos vigentes',status:'Vigente'},{module:'quality',label:'Acciones correctivas'},{module:'audits',label:'Auditorías'}]},
{id:'finance',name:'Finanzas',metrics:[{module:'receivables',label:'Registros de cobranza'},{module:'payables',label:'Registros de pagos'},{module:'accounting',label:'Pólizas contables'}]}
];
function workspaceMetricsRows(state,metric,period){return (state[metric.module]||[]).filter(r=>{const date=String(r[period.key]||'').slice(0,10);return (!metric.status||r.status===metric.status)&&(!period.from||date&&date>=period.from)&&(!period.to||date&&date<=period.to);});}
