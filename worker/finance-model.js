META.financeDashboard={title:'Finanzas',group:'Finanzas',prefix:'FIN',icon:'▥',fields:[]};
META.businessUnits={title:'Unidades de negocio',group:'Configuración',prefix:'UN',icon:'▥',fields:[['name','Nombre','text',1],['code','Código','text',1]]};
META.labSites={title:'Ubicaciones del laboratorio',group:'Configuración',prefix:'UB',icon:'▥',fields:[['name','Nombre','text',1],['address','Dirección','text',0]]};
for(const module of ['quotes','services','accounting'])META[module].fields.push(['businessUnitId','Unidad de negocio','ref:businessUnits',0],['labSiteId','Ubicación del laboratorio','ref:labSites',0]);

META.services.fields.push(['actualHours','Horas efectivas registradas','number',0]);
META.accounts.fields.push(['financeClass','Clasificación financiera','select:Sin clasificar|Operación|Depreciación|Amortización|Intereses|Impuestos',0]);
