export const META={
  "clients": {
    "title": "Clientes",
    "icon": "◎",
    "group": "Comercial",
    "fields": [
      [
        "name",
        "Razón social",
        "text",
        1
      ],
      [
        "email",
        "Correo",
        "email",
        1
      ],
      [
        "contact",
        "Contacto",
        "text"
      ],
      [
        "phone",
        "Teléfono",
        "text"
      ]
    ],
    "prefix": "CLI"
  },
  "quotes": {
    "title": "Cotizaciones",
    "icon": "◇",
    "group": "Comercial",
    "prefix": "COT",
    "fields": [
      [
        "clientId",
        "Cliente",
        "ref:clients",
        1
      ],
      [
        "activity",
        "Tipo de cotización",
        "select:Calibración|Ensayo",
        1
      ],
      [
        "description",
        "Servicio solicitado",
        "textarea",
        1
      ],
      [
        "due",
        "Vigencia",
        "date",
        1
      ],
      [
        "acceptance",
        "Evidencia de aceptación",
        "textarea"
      ],
      [
        "contractId",
        "Contrato relacionado (opcional)",
        "ref:contracts",
        0
      ],
      [
        "clientRequirements",
        "Requisitos acordados con el cliente",
        "textarea",
        1
      ],
      [
        "externalWork",
        "Actividades externalizadas y aceptación del cliente",
        "textarea",
        0
      ],
      [
        "decisionRule",
        "Especificación y regla de decisión acordada",
        "textarea",
        0
      ],
      [
        "capacityReview",
        "Revisión de capacidad y recursos (técnica)",
        "textarea",
        1
      ],
      [
        "currency",
        "Moneda",
        "select:MXN|USD|EUR",
        1
      ],
      [
        "taxRate",
        "IVA (%)",
        "number",
        1
      ],
      [
        "paymentTerms",
        "Condiciones de pago",
        "textarea",
        0
      ]
    ]
  },
  "services": {
    "title": "Programación técnica",
    "icon": "▣",
    "group": "Operación",
    "prefix": "ST",
    "fields": [
      [
        "orderId",
        "Orden de servicio",
        "ref:orders",
        1
      ],
      [
        "technicianId",
        "Técnico",
        "availabletechnician",
        1
      ],
      [
        "due",
        "Fecha compromiso",
        "date",
        1
      ],
      [
        "received",
        "Ítem recibido y conforme",
        "checkbox"
      ],
      [
        "notes",
        "Condición de recepción / custodia",
        "textarea"
      ],
      [
        "itemKey",
        "Ítem de la orden",
        "orderitem",
        1
      ],
      [
        "receiptDate",
        "Fecha de recepción",
        "date",
        1
      ],
      [
        "handling",
        "Transporte, protección, almacenamiento y devolución",
        "textarea",
        1
      ],
      [
        "receiptDeviation",
        "Desviación de recepción / consulta al cliente",
        "textarea",
        0
      ],
      [
        "customerInstructions",
        "Instrucciones / aceptación del cliente",
        "textarea",
        0
      ],
      [
        "disclaimer",
        "Resultados afectados y descargo por desviación",
        "textarea",
        0
      ],
      [
        "executionLocation",
        "Lugar de ejecución",
        "select:Laboratorio|En sitio",
        1
      ],
      [
        "siteAddress",
        "Dirección del sitio / área del laboratorio",
        "text",
        1
      ],
      [
        "startDate",
        "Fecha de inicio",
        "date",
        1
      ],
      [
        "endDate",
        "Fecha de término",
        "date",
        1
      ],
      [
        "startTime",
        "Hora de inicio",
        "time",
        1
      ],
      [
        "endTime",
        "Hora de término",
        "time",
        1
      ],
      [
        "travelNotes",
        "Traslado, acceso y condiciones en sitio",
        "textarea",
        0
      ]
    ]
  },
  "equipment": {
    "title": "Equipos y calibración",
    "icon": "◷",
    "group": "Operación",
    "prefix": "EQ",
    "fields": [
      [
        "name",
        "Descripción del equipo",
        "text",
        1
      ],
      [
        "assetId",
        "ID de inventario",
        "text",
        1
      ],
      [
        "brand",
        "Marca",
        "text",
        1
      ],
      [
        "model",
        "Modelo",
        "text",
        1
      ],
      [
        "serial",
        "Número de serie",
        "text",
        1
      ],
      [
        "location",
        "Ubicación",
        "text",
        1
      ],
      [
        "custodianId",
        "Responsable / resguardo",
        "ref:users",
        1
      ],
      [
        "range",
        "Rango de uso",
        "text",
        1
      ],
      [
        "unit",
        "Unidad",
        "text",
        1
      ],
      [
        "due",
        "Próxima calibración",
        "date",
        1
      ],
      [
        "certificate",
        "Referencia de certificado",
        "text"
      ],
      [
        "evaluation",
        "Evaluación de aptitud",
        "textarea"
      ],
      [
        "status",
        "Estado",
        "select:Apto|Pendiente de evaluación|Fuera de servicio|En calibración|En reparación|Fuera del almacén",
        1
      ],
      [
        "verificationDue",
        "Próxima verificación",
        "date"
      ],
      [
        "maintenanceDue",
        "Próximo mantenimiento",
        "date"
      ],
      [
        "category",
        "Categoría",
        "select:Patrón / referencia|Material de referencia|Equipo auxiliar",
        1
      ],
      [
        "firmware",
        "Versión de software / firmware",
        "text",
        0
      ],
      [
        "verificationCriteria",
        "Criterios de aptitud / exactitud / incertidumbre",
        "textarea",
        1
      ],
      [
        "correctionFactors",
        "Valores de referencia / factores de corrección vigentes",
        "textarea",
        0
      ],
      [
        "validUntil",
        "Validez de material de referencia",
        "date",
        0
      ],
      [
        "maintenancePlan",
        "Plan e instrucciones de mantenimiento y protección",
        "textarea",
        1
      ],
      [
        "traceability",
        "Cadena de trazabilidad y referencias",
        "textarea",
        1
      ],
      [
        "calibrationRequired",
        "Requiere calibración",
        "checkbox",
        0
      ]
    ]
  },
  "methods": {
    "title": "Métodos",
    "icon": "∿",
    "group": "Técnica",
    "prefix": "MET",
    "fields": [
      [
        "name",
        "Método",
        "text",
        1
      ],
      [
        "activity",
        "Actividad",
        "select:Calibración|Ensayo",
        1
      ],
      [
        "scope",
        "Alcance / rango",
        "textarea",
        1
      ],
      [
        "version",
        "Versión",
        "number",
        1
      ],
      [
        "unit",
        "Unidad de resultado",
        "text",
        1
      ],
      [
        "evidence",
        "Evidencia de verificación / validación",
        "textarea"
      ],
      [
        "methodKind",
        "Origen y uso del método",
        "select:Normalizado|No normalizado|Desarrollado|Modificado|Fuera de alcance",
        1
      ],
      [
        "validationProcedure",
        "Procedimiento y alcance de verificación / validación",
        "textarea",
        1
      ],
      [
        "specifications",
        "Requisitos y características de desempeño",
        "textarea",
        1
      ],
      [
        "validationResults",
        "Resultados de verificación / validación",
        "textarea",
        1
      ],
      [
        "conclusion",
        "Conclusión de aptitud para uso previsto",
        "textarea",
        1
      ],
      [
        "tempMin",
        "Temperatura mínima permitida °C",
        "number",
        0
      ],
      [
        "tempMax",
        "Temperatura máxima permitida °C",
        "number",
        0
      ],
      [
        "humidityMin",
        "Humedad mínima %",
        "number",
        0
      ],
      [
        "humidityMax",
        "Humedad máxima %",
        "number",
        0
      ],
      [
        "authorizedLocations",
        "Lugares validados para ejecutar",
        "select:Laboratorio|En sitio|Ambos",
        1
      ],
      [
        "procedureText",
        "Procedimiento técnico documentado (alternativa al PDF)",
        "textarea",
        0
      ]
    ]
  },
  "records": {
    "title": "Registros técnicos",
    "icon": "≋",
    "group": "Técnica",
    "prefix": "RT",
    "fields": [
      [
        "serviceId",
        "Servicio",
        "ref:services",
        1
      ],
      [
        "readings",
        "Lecturas originales (separadas por coma)",
        "text",
        1
      ],
      [
        "result",
        "Resultado",
        "number",
        1
      ],
      [
        "unit",
        "Unidad",
        "text",
        1
      ],
      [
        "uncertainty",
        "Incertidumbre expandida",
        "number"
      ],
      [
        "k",
        "Factor de cobertura k",
        "number"
      ],
      [
        "temperature",
        "Temperatura °C",
        "number",
        1
      ],
      [
        "humidity",
        "Humedad %",
        "number",
        1
      ],
      [
        "notes",
        "Observaciones técnicas",
        "textarea"
      ],
      [
        "uncertaintyId",
        "Evaluación de incertidumbre",
        "ref:uncertainties",
        1
      ],
      [
        "calculationCheck",
        "Comprobación de cálculos y transferencias",
        "textarea",
        1
      ],
      [
        "environmentLogId",
        "Registro ambiental",
        "ref:environment",
        1
      ],
      [
        "equipmentIds",
        "Patrones / equipos utilizados",
        "multi:equipment",
        1
      ]
    ]
  },
  "reports": {
    "title": "Informes y certificados",
    "icon": "▤",
    "group": "Técnica",
    "prefix": "INF",
    "fields": [
      [
        "orderId",
        "Orden de servicio",
        "ref:orders",
        1
      ],
      [
        "serviceId",
        "Servicio",
        "ref:services",
        1
      ],
      [
        "itemKey",
        "Ítem de la orden",
        "orderitem",
        1
      ],
      [
        "templateId",
        "Plantilla del informe",
        "ref:templates",
        1
      ],
      [
        "receiptDate",
        "Fecha de recepción",
        "date",
        1
      ],
      [
        "activityStart",
        "Inicio de actividad",
        "date",
        1
      ],
      [
        "activityEnd",
        "Fin de actividad",
        "date",
        1
      ],
      [
        "labLocation",
        "Lugar donde se realizó la actividad",
        "text",
        1
      ],
      [
        "itemDescription",
        "Descripción e identificación del ítem",
        "textarea",
        1
      ],
      [
        "itemCondition",
        "Condición del ítem recibido",
        "text",
        1
      ],
      [
        "deviations",
        "Desviaciones / adiciones / exclusiones del método",
        "textarea",
        1
      ],
      [
        "customerData",
        "Información proporcionada por el cliente (identificarla)",
        "textarea"
      ],
      [
        "externalResults",
        "Resultados de proveedores externos (identificarlos)",
        "textarea"
      ],
      [
        "traceability",
        "Declaración de trazabilidad metrológica",
        "textarea"
      ],
      [
        "adjusted",
        "Hubo ajuste o reparación",
        "checkbox"
      ],
      [
        "beforeAfter",
        "Resultados antes y después del ajuste",
        "textarea"
      ],
      [
        "uncertaintyRequired",
        "Incertidumbre necesaria para interpretar el ensayo",
        "checkbox"
      ],
      [
        "conformity",
        "Incluir declaración de conformidad",
        "checkbox"
      ],
      [
        "specification",
        "Especificación y apartados evaluados",
        "textarea"
      ],
      [
        "decisionRule",
        "Regla de decisión acordada",
        "textarea"
      ],
      [
        "conformityResult",
        "Resultados a los que aplica y declaración de conformidad",
        "textarea"
      ],
      [
        "opinions",
        "Opiniones / interpretaciones claramente identificadas",
        "textarea"
      ],
      [
        "opinionsBasis",
        "Base documentada y autorización de las opiniones",
        "textarea"
      ],
      [
        "amendmentReason",
        "Motivo y descripción de la modificación",
        "textarea"
      ],
      [
        "description",
        "Observaciones del informe",
        "textarea"
      ],
      [
        "customerDataAffects",
        "Los datos del cliente pueden afectar la validez",
        "checkbox",
        0
      ],
      [
        "customerDisclaimer",
        "Descargo por información del cliente o condición del ítem",
        "textarea",
        0
      ],
      [
        "testConditions",
        "Condiciones específicas del ensayo / información adicional del método",
        "textarea",
        0
      ],
      [
        "intervalRequested",
        "Cliente acordó incluir intervalo de calibración",
        "checkbox",
        0
      ],
      [
        "intervalAgreement",
        "Acuerdo del cliente y recomendación (solo si aplica)",
        "textarea",
        0
      ],
      [
        "opinionsUserId",
        "Persona autorizada para opiniones",
        "ref:users",
        0
      ]
    ]
  },
  "competence": {
    "title": "Personal y competencia",
    "icon": "♧",
    "group": "Gestión",
    "prefix": "AUT",
    "fields": [
      [
        "userId",
        "Persona",
        "ref:users",
        1
      ],
      [
        "methodId",
        "Método",
        "ref:methods",
        1
      ],
      [
        "activity",
        "Autorización",
        "select:Ejecutar|Revisar|Emitir|Validar métodos|Declarar conformidad|Opiniones",
        1
      ],
      [
        "evidence",
        "Evidencia de competencia",
        "textarea",
        1
      ],
      [
        "requirements",
        "Educación, conocimientos, habilidades y experiencia requeridos",
        "textarea",
        1
      ],
      [
        "training",
        "Formación, supervisión y evaluación realizada",
        "textarea",
        1
      ],
      [
        "reviewDue",
        "Próxima revisión de competencia",
        "date",
        1
      ]
    ]
  },
  "documents": {
    "title": "Lista maestra",
    "icon": "▥",
    "group": "Gestión",
    "prefix": "DOC",
    "fields": [
      [
        "name",
        "Nombre del documento",
        "text",
        1
      ],
      [
        "type",
        "Tipo de documento",
        "select:Política|Procedimiento|Método|Instructivo|Formato|Registro|Documento externo|Contrato|Informe|Otro",
        1
      ],
      [
        "version",
        "Versión",
        "number",
        1
      ],
      [
        "content",
        "Descripción / referencia controlada",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date"
      ],
      [
        "distribution",
        "Distribución y puntos de uso",
        "textarea",
        0
      ],
      [
        "retentionYears",
        "Años de conservación definidos por el laboratorio",
        "number",
        1
      ]
    ]
  },
  "quality": {
    "title": "Acciones correctivas",
    "icon": "✧",
    "group": "Gestión",
    "prefix": "AC",
    "fields": [
      [
        "type",
        "Origen",
        "select:Acción correctiva|Trabajo no conforme|Queja|Auditoría|Riesgo|Imparcialidad|Confidencialidad|Revisión dirección|Mejora",
        1
      ],
      [
        "name",
        "Asunto",
        "text",
        1
      ],
      [
        "clause",
        "Numeral relacionado",
        "text"
      ],
      [
        "ownerId",
        "Responsable",
        "ref:users",
        1
      ],
      [
        "due",
        "Fecha límite",
        "date",
        1
      ],
      [
        "description",
        "Descripción / análisis de impacto",
        "textarea",
        1
      ],
      [
        "cause",
        "Causa / análisis",
        "textarea"
      ],
      [
        "plan",
        "Plan de acción / acuerdos",
        "textarea"
      ],
      [
        "evidence",
        "Evidencia de implementación",
        "textarea"
      ],
      [
        "effectiveness",
        "Verificación de eficacia / decisión",
        "textarea"
      ],
      [
        "nonconformingId",
        "Trabajo no conforme relacionado",
        "ref:nonconforming",
        0
      ]
    ]
  },
  "controls": {
    "title": "Validez de resultados",
    "icon": "⌁",
    "group": "Gestión",
    "prefix": "CV",
    "fields": [
      [
        "methodId",
        "Método",
        "ref:methods",
        1
      ],
      [
        "name",
        "Control / ensayo de aptitud",
        "text",
        1
      ],
      [
        "due",
        "Fecha",
        "date",
        1
      ],
      [
        "criterion",
        "Criterio de aceptación",
        "textarea",
        1
      ],
      [
        "result",
        "Resultado / evaluación",
        "textarea",
        1
      ],
      [
        "outcome",
        "Estado",
        "select:Conforme|Fuera de criterio|Investigado",
        1
      ],
      [
        "evidence",
        "Investigación y evaluación de impacto",
        "textarea"
      ],
      [
        "type",
        "Tipo de seguimiento",
        "select:Control interno|Ensayo de aptitud|Comparación interlaboratorio|Repetición|Material de referencia",
        1
      ],
      [
        "frequency",
        "Frecuencia / programa",
        "text",
        1
      ],
      [
        "trend",
        "Análisis de tendencias y acciones",
        "textarea",
        0
      ]
    ]
  },
  "suppliers": {
    "title": "Proveedores",
    "icon": "▧",
    "group": "Administración",
    "fields": [
      [
        "name",
        "Proveedor",
        "text",
        1
      ],
      [
        "type",
        "Tipo de suministro",
        "text",
        1
      ],
      [
        "evidence",
        "Evaluación y criterios",
        "textarea"
      ],
      [
        "contact",
        "Contacto",
        "text",
        0
      ],
      [
        "criteria",
        "Criterios de evaluación y selección",
        "textarea",
        1
      ],
      [
        "technicalRequirements",
        "Requisitos técnicos y competencia necesarios",
        "textarea",
        1
      ],
      [
        "acceptanceCriteria",
        "Criterios de aceptación de productos / servicios",
        "textarea",
        1
      ],
      [
        "reevaluationDue",
        "Próxima reevaluación",
        "date",
        1
      ]
    ],
    "prefix": "PROV"
  },
  "purchases": {
    "title": "Solicitudes de compra",
    "icon": "▱",
    "group": "Administración",
    "prefix": "SC",
    "fields": [
      [
        "newSupplier",
        "Cotizar con nuevo proveedor",
        "checkbox",
        0
      ],
      [
        "supplierId",
        "Proveedor propuesto",
        "ref:suppliers",
        0
      ],
      [
        "name",
        "Concepto solicitado",
        "text",
        1
      ],
      [
        "description",
        "Justificación y especificación",
        "textarea",
        1
      ],
      [
        "quantity",
        "Cantidad",
        "number",
        1
      ],
      [
        "amount",
        "Importe total MXN",
        "number",
        1
      ],
      [
        "due",
        "Fecha requerida",
        "date",
        1
      ],
      [
        "evidence",
        "Evidencia de recepción",
        "textarea"
      ],
      [
        "newSupplierName",
        "Nombre / contacto del proveedor por cotizar",
        "text",
        0
      ],
      [
        "supplierRequirements",
        "Requisitos comunicados al proveedor",
        "textarea",
        0
      ],
      [
        "acceptanceCriteria",
        "Criterios de aceptación del suministro",
        "textarea",
        0
      ]
    ]
  },
  "calibrations": {
    "title": "Programa de calibración",
    "icon": "◴",
    "group": "Operación",
    "prefix": "PC",
    "fields": [
      [
        "equipmentId",
        "Equipo / patrón",
        "ref:equipment",
        1
      ],
      [
        "name",
        "Servicio de calibración / verificación",
        "text",
        1
      ],
      [
        "type",
        "Tipo",
        "select:Calibración|Comprobación|Verificación intermedia|Mantenimiento|Ajuste|Reparación|Modificación",
        1
      ],
      [
        "due",
        "Fecha programada",
        "date",
        1
      ],
      [
        "nextDue",
        "Próxima fecha (intervalo justificado)",
        "date",
        1
      ],
      [
        "providerId",
        "Proveedor",
        "ref:suppliers",
        1
      ],
      [
        "certificate",
        "Referencia del certificado / registro",
        "text"
      ],
      [
        "evaluation",
        "Evaluación de aptitud y criterios",
        "textarea"
      ],
      [
        "outcome",
        "Resultado de evaluación",
        "select:Aceptable|No aceptable",
        1
      ],
      [
        "acceptanceCriteria",
        "Criterios de aceptación",
        "textarea",
        1
      ],
      [
        "priorImpact",
        "Evaluación de impacto en resultados anteriores",
        "textarea",
        1
      ],
      [
        "correctionFactors",
        "Factores / valores de referencia actualizados",
        "textarea",
        0
      ],
      [
        "workNonconformingId",
        "Trabajo no conforme relacionado",
        "ref:nonconforming",
        0
      ]
    ]
  },
  "policies": {
    "title": "Políticas y procedimientos",
    "icon": "▨",
    "group": "Gestión",
    "prefix": "PP",
    "fields": [
      [
        "name",
        "Nombre del documento",
        "text",
        1
      ],
      [
        "type",
        "Tipo",
        "select:Política|Procedimiento",
        1
      ],
      [
        "version",
        "Versión",
        "number",
        1
      ],
      [
        "objective",
        "Objetivo",
        "textarea",
        1
      ],
      [
        "scope",
        "Alcance",
        "textarea",
        1
      ],
      [
        "definitions",
        "Definiciones",
        "textarea",
        1
      ],
      [
        "responsibilities",
        "Responsabilidades",
        "textarea",
        1
      ],
      [
        "development",
        "Desarrollo",
        "textarea",
        1
      ],
      [
        "approval",
        "Aprobación del documento (responsables y criterio)",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ]
    ]
  },
  "templates": {
    "title": "Diseñador de informes",
    "icon": "▦",
    "group": "Técnica",
    "prefix": "PL",
    "fields": [
      [
        "name",
        "Nombre de la plantilla",
        "text",
        1
      ],
      [
        "activity",
        "Tipo de informe",
        "select:Calibración|Ensayo",
        1
      ],
      [
        "labName",
        "Nombre del laboratorio",
        "text",
        1
      ],
      [
        "labAddress",
        "Domicilio del laboratorio",
        "textarea",
        1
      ],
      [
        "labContact",
        "Contacto del laboratorio",
        "text",
        1
      ],
      [
        "reportTitle",
        "Título del informe",
        "text",
        1
      ],
      [
        "accent",
        "Color de acento (hexadecimal)",
        "color",
        1
      ],
      [
        "header",
        "Texto de encabezado",
        "textarea"
      ],
      [
        "resultsTitle",
        "Título de la sección de resultados",
        "text",
        1
      ],
      [
        "additional",
        "Sección adicional personalizada",
        "textarea"
      ],
      [
        "footer",
        "Texto de pie de página",
        "textarea"
      ],
      [
        "version",
        "Versión de plantilla",
        "number",
        1
      ],
      [
        "labLegalIdentity",
        "Identidad legal del laboratorio",
        "text",
        0
      ]
    ]
  },
  "accounts": {
    "title": "Catálogo de cuentas",
    "icon": "≡",
    "group": "Contabilidad",
    "fields": [
      [
        "code",
        "Número de cuenta",
        "text",
        1
      ],
      [
        "name",
        "Nombre de la cuenta",
        "text",
        1
      ],
      [
        "type",
        "Tipo de cuenta",
        "select:Activo|Pasivo|Capital|Ingreso|Gasto",
        1
      ],
      [
        "isCash",
        "Cuenta de efectivo o equivalentes",
        "checkbox",
        0
      ]
    ],
    "prefix": "CTA"
  },
  "accounting": {
    "title": "Contabilidad",
    "icon": "▥",
    "group": "Contabilidad",
    "prefix": "POL",
    "fields": [
      [
        "name",
        "Concepto de la póliza",
        "text",
        1
      ],
      [
        "type",
        "Tipo de movimiento",
        "select:Diario|Ingreso|Egreso",
        1
      ],
      [
        "due",
        "Fecha contable",
        "date",
        1
      ],
      [
        "debitId",
        "Cuenta cargo (debe)",
        "ref:accounts",
        1
      ],
      [
        "creditId",
        "Cuenta abono (haber)",
        "ref:accounts",
        1
      ],
      [
        "amount",
        "Importe del asiento MXN",
        "number",
        1
      ],
      [
        "reference",
        "Factura / pago / referencia",
        "text",
        1
      ],
      [
        "serviceId",
        "Servicio relacionado (opcional)",
        "ref:services"
      ],
      [
        "evidence",
        "Comprobante y descripción",
        "textarea"
      ],
      [
        "flowClass",
        "Clasificación de flujo de efectivo",
        "select:Operación|Inversión|Financiamiento",
        1
      ]
    ]
  },
  "employees": {
    "title": "Expedientes de personal",
    "icon": "♙",
    "group": "Recursos humanos",
    "prefix": "EMP",
    "fields": [
      [
        "name",
        "Nombre de la persona",
        "text",
        1
      ],
      [
        "position",
        "Puesto",
        "text",
        1
      ],
      [
        "dailyRate",
        "Salario diario de referencia MXN",
        "number",
        1
      ],
      [
        "startDate",
        "Fecha de ingreso",
        "date",
        1
      ],
      [
        "active",
        "Persona activa",
        "checkbox"
      ]
    ]
  },
  "payroll": {
    "title": "Prenómina",
    "icon": "▣",
    "group": "Recursos humanos",
    "prefix": "PN",
    "fields": [
      [
        "employeeId",
        "Colaborador",
        "ref:employees",
        1
      ],
      [
        "periodStart",
        "Inicio del periodo",
        "date",
        1
      ],
      [
        "periodEnd",
        "Fin del periodo",
        "date",
        1
      ],
      [
        "paidDays",
        "Días a pagar",
        "number",
        1
      ],
      [
        "absences",
        "Faltas registradas (informativo)",
        "number"
      ],
      [
        "overtime",
        "Horas extra registradas (informativo)",
        "number"
      ],
      [
        "extraPay",
        "Importe autorizado de horas extra MXN",
        "number"
      ],
      [
        "bonus",
        "Bonos / otras percepciones MXN",
        "number"
      ],
      [
        "deductions",
        "Deducciones capturadas MXN",
        "number"
      ],
      [
        "notes",
        "Incidencias y justificación",
        "textarea"
      ]
    ]
  },
  "users": {
    "title": "Usuarios y permisos",
    "icon": "♙",
    "group": "Administración",
    "fields": [
      [
        "username",
        "Usuario de acceso",
        "text",
        1
      ],
      [
        "name",
        "Nombre",
        "text",
        1
      ],
      [
        "email",
        "Correo",
        "email",
        1
      ],
      [
        "role",
        "Rol",
        "select:Administrador|Responsable técnico|Calidad|Comercial|Técnico|Signatario|Recursos humanos|Contabilidad|Auditor",
        1
      ],
      [
        "active",
        "Usuario activo",
        "checkbox"
      ]
    ],
    "prefix": "USR"
  },
  "contracts": {
    "title": "Contratos",
    "group": "Comercial",
    "prefix": "CON",
    "fields": [
      [
        "name",
        "Nombre / referencia contractual",
        "text",
        1
      ],
      [
        "clientId",
        "Cliente",
        "ref:clients",
        1
      ],
      [
        "activity",
        "Tipo de actividad",
        "select:Calibración|Ensayo",
        1
      ],
      [
        "startDate",
        "Inicio",
        "date",
        1
      ],
      [
        "due",
        "Vencimiento",
        "date",
        1
      ],
      [
        "scope",
        "Alcance y condiciones del contrato",
        "textarea",
        1
      ],
      [
        "requirements",
        "Requisitos y métodos acordados",
        "textarea",
        1
      ],
      [
        "capacityReview",
        "Revisión de capacidad y recursos",
        "textarea",
        1
      ],
      [
        "acceptance",
        "Aceptación de ambas partes",
        "textarea",
        1
      ],
      [
        "externalWork",
        "Externalización y aceptación del cliente",
        "textarea",
        0
      ],
      [
        "decisionRule",
        "Especificación y regla de decisión acordada",
        "textarea",
        0
      ]
    ],
    "icon": "◇"
  },
  "orders": {
    "title": "Órdenes de servicio",
    "group": "Comercial",
    "prefix": "OS",
    "fields": [
      [
        "name",
        "Descripción de la orden",
        "text",
        1
      ],
      [
        "clientId",
        "Cliente",
        "ref:clients",
        1
      ],
      [
        "quoteId",
        "Cotización aceptada (opcional)",
        "ref:quotes",
        0
      ],
      [
        "contractId",
        "Contrato vigente (opcional)",
        "ref:contracts",
        0
      ],
      [
        "activity",
        "Actividad",
        "select:Calibración|Ensayo",
        1
      ],
      [
        "due",
        "Fecha compromiso",
        "date",
        1
      ],
      [
        "requirements",
        "Revisión de requisitos y capacidad",
        "textarea",
        1
      ],
      [
        "instructions",
        "Instrucciones acordadas / recepción",
        "textarea",
        0
      ],
      [
        "acceptance",
        "Aceptación del servicio",
        "textarea",
        1
      ]
    ],
    "icon": "▣"
  },
  "inventory": {
    "title": "Almacén · inventario",
    "group": "Almacén",
    "prefix": "ALM",
    "fields": [
      [
        "name",
        "Descripción del artículo",
        "text",
        1
      ],
      [
        "category",
        "Categoría",
        "select:Insumo|Consumible|Material de referencia|Equipo auxiliar|Patrón / referencia",
        1
      ],
      [
        "equipmentId",
        "Equipo asociado (si aplica)",
        "ref:equipment",
        0
      ],
      [
        "unit",
        "Unidad de inventario",
        "text",
        1
      ],
      [
        "lot",
        "Lote / identificación",
        "text",
        0
      ],
      [
        "expiry",
        "Caducidad / validez",
        "date",
        0
      ],
      [
        "location",
        "Ubicación",
        "text",
        1
      ],
      [
        "minimum",
        "Existencia mínima",
        "number",
        1
      ],
      [
        "requirements",
        "Condiciones de almacenamiento y aceptación",
        "textarea",
        1
      ]
    ],
    "icon": "▧"
  },
  "movements": {
    "title": "Entradas y salidas",
    "group": "Almacén",
    "prefix": "MOV",
    "fields": [
      [
        "inventoryId",
        "Artículo",
        "ref:inventory",
        1
      ],
      [
        "direction",
        "Movimiento",
        "select:Entrada|Salida",
        1
      ],
      [
        "quantity",
        "Cantidad",
        "number",
        1
      ],
      [
        "due",
        "Fecha del movimiento",
        "date",
        1
      ],
      [
        "reason",
        "Motivo",
        "select:Compra|Consumo|Calibración|Reparación|Mantenimiento|Traslado|Devolución|Ajuste de inventario",
        1
      ],
      [
        "destination",
        "Origen / destino",
        "text",
        1
      ],
      [
        "serviceId",
        "Servicio técnico relacionado",
        "ref:services",
        0
      ],
      [
        "calibrationId",
        "Servicio de equipo relacionado",
        "ref:calibrations",
        0
      ],
      [
        "details",
        "Justificación y condición de entrega / recepción",
        "textarea",
        1
      ]
    ],
    "icon": "↔"
  },
  "supplierEvaluations": {
    "title": "Evaluaciones de proveedores",
    "group": "Administración",
    "prefix": "EVP",
    "fields": [
      [
        "supplierId",
        "Proveedor",
        "ref:suppliers",
        1
      ],
      [
        "name",
        "Evaluación / reevaluación",
        "text",
        1
      ],
      [
        "due",
        "Fecha",
        "date",
        1
      ],
      [
        "competence",
        "Competencia técnica (0–100)",
        "number",
        1
      ],
      [
        "quality",
        "Calidad y conformidad (0–100)",
        "number",
        1
      ],
      [
        "delivery",
        "Entrega y atención (0–100)",
        "number",
        1
      ],
      [
        "threshold",
        "Criterio mínimo de aceptación (0–100)",
        "number",
        1
      ],
      [
        "critical",
        "Requisitos críticos cumplidos",
        "checkbox",
        0
      ],
      [
        "evidence",
        "Evidencia y evaluación de requisitos",
        "textarea",
        1
      ],
      [
        "actions",
        "Acciones derivadas",
        "textarea",
        0
      ],
      [
        "nextDue",
        "Próxima reevaluación",
        "date",
        1
      ]
    ],
    "icon": "▧"
  },
  "general": {
    "title": "Requisitos generales",
    "group": "Gestión",
    "prefix": "RG",
    "fields": [
      [
        "name",
        "Documento / compromiso",
        "text",
        1
      ],
      [
        "type",
        "Tema",
        "select:Imparcialidad|Confidencialidad",
        1
      ],
      [
        "scope",
        "Personas y actividades cubiertas",
        "textarea",
        1
      ],
      [
        "commitment",
        "Compromiso, acuerdos y responsabilidades",
        "textarea",
        1
      ],
      [
        "riskId",
        "Riesgo relacionado",
        "ref:risks",
        0
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ]
    ],
    "icon": "◈"
  },
  "structure": {
    "title": "Estructura y alcance",
    "group": "Gestión",
    "prefix": "EST",
    "fields": [
      [
        "name",
        "Laboratorio / entidad legal",
        "text",
        1
      ],
      [
        "address",
        "Domicilio e instalaciones",
        "textarea",
        1
      ],
      [
        "legalBasis",
        "Personalidad y responsabilidad legal",
        "textarea",
        1
      ],
      [
        "directorId",
        "Responsable de dirección",
        "ref:users",
        1
      ],
      [
        "scope",
        "Alcance definido (sin muestreo)",
        "textarea",
        1
      ],
      [
        "organization",
        "Organización, responsabilidades y autoridades",
        "textarea",
        1
      ],
      [
        "communication",
        "Comunicación y control de cambios del sistema",
        "textarea",
        1
      ],
      [
        "retentionYears",
        "Conservación documental definida en años",
        "number",
        1
      ]
    ],
    "icon": "▦"
  },
  "facilities": {
    "title": "Instalaciones",
    "group": "Técnica",
    "prefix": "INS",
    "fields": [
      [
        "name",
        "Área / instalación",
        "text",
        1
      ],
      [
        "location",
        "Ubicación",
        "text",
        1
      ],
      [
        "requirements",
        "Condiciones y especificaciones",
        "textarea",
        1
      ],
      [
        "access",
        "Control de acceso y uso",
        "textarea",
        1
      ],
      [
        "controls",
        "Separación, contaminación e interferencias",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ]
    ],
    "icon": "▥"
  },
  "environment": {
    "title": "Condiciones ambientales",
    "group": "Técnica",
    "prefix": "AMB",
    "fields": [
      [
        "serviceId",
        "Servicio",
        "ref:services",
        1
      ],
      [
        "facilityId",
        "Instalación",
        "ref:facilities",
        1
      ],
      [
        "due",
        "Fecha de registro",
        "date",
        1
      ],
      [
        "temperature",
        "Temperatura °C",
        "number",
        1
      ],
      [
        "humidity",
        "Humedad %",
        "number",
        1
      ],
      [
        "other",
        "Otras condiciones relevantes",
        "textarea",
        0
      ],
      [
        "evaluation",
        "Evaluación y medidas aplicadas",
        "textarea",
        1
      ],
      [
        "ownerId",
        "Persona que registra",
        "ref:users",
        1
      ]
    ],
    "icon": "⌁"
  },
  "uncertainties": {
    "title": "Incertidumbre",
    "group": "Técnica",
    "prefix": "INC",
    "fields": [
      [
        "name",
        "Modelo / presupuesto de incertidumbre",
        "text",
        1
      ],
      [
        "methodId",
        "Método",
        "ref:methods",
        1
      ],
      [
        "scope",
        "Mensurando y alcance",
        "textarea",
        1
      ],
      [
        "k",
        "Factor de cobertura",
        "number",
        1
      ],
      [
        "assumptions",
        "Supuestos, distribuciones, correlaciones y justificación de k",
        "textarea",
        1
      ],
      [
        "validation",
        "Validación del modelo / cálculos",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ]
    ],
    "icon": "±"
  },
  "risks": {
    "title": "Riesgos y oportunidades",
    "group": "Gestión",
    "prefix": "RIE",
    "fields": [
      [
        "name",
        "Riesgo / oportunidad",
        "text",
        1
      ],
      [
        "type",
        "Tipo",
        "select:Imparcialidad|Técnico|Gestión|Oportunidad",
        1
      ],
      [
        "ownerId",
        "Responsable",
        "ref:users",
        1
      ],
      [
        "description",
        "Origen, relaciones e impacto",
        "textarea",
        1
      ],
      [
        "plan",
        "Acciones proporcionales al impacto",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ],
      [
        "effectiveness",
        "Evaluación de eficacia",
        "textarea",
        0
      ]
    ],
    "icon": "✧"
  },
  "complaints": {
    "title": "Quejas y retroalimentación",
    "group": "Gestión",
    "prefix": "QUE",
    "fields": [
      [
        "name",
        "Asunto",
        "text",
        1
      ],
      [
        "clientId",
        "Cliente",
        "ref:clients",
        1
      ],
      [
        "serviceId",
        "Servicio relacionado",
        "ref:services",
        0
      ],
      [
        "type",
        "Tipo",
        "select:Queja|Retroalimentación",
        1
      ],
      [
        "investigatorId",
        "Responsable de investigación",
        "ref:users",
        1
      ],
      [
        "description",
        "Recepción y validación de la queja",
        "textarea",
        1
      ],
      [
        "acknowledgment",
        "Acuse y comunicaciones de progreso",
        "textarea",
        0
      ],
      [
        "investigation",
        "Investigación y acciones",
        "textarea",
        0
      ],
      [
        "decision",
        "Decisión y comunicación al cliente",
        "textarea",
        0
      ],
      [
        "closureNotice",
        "Notificación de cierre",
        "textarea",
        0
      ],
      [
        "due",
        "Fecha límite",
        "date",
        1
      ]
    ],
    "icon": "◇"
  },
  "nonconforming": {
    "title": "Trabajo no conforme",
    "group": "Gestión",
    "prefix": "TNC",
    "fields": [
      [
        "name",
        "Incidente",
        "text",
        1
      ],
      [
        "serviceId",
        "Servicio afectado",
        "ref:services",
        0
      ],
      [
        "equipmentId",
        "Equipo afectado",
        "ref:equipment",
        0
      ],
      [
        "risk",
        "Nivel de riesgo",
        "select:Bajo|Medio|Alto",
        1
      ],
      [
        "description",
        "Detección y contención / suspensión",
        "textarea",
        1
      ],
      [
        "impact",
        "Evaluación de importancia y resultados previos",
        "textarea",
        0
      ],
      [
        "decision",
        "Decisión de aceptabilidad / repetición / anulación",
        "textarea",
        0
      ],
      [
        "customerNotice",
        "Notificación al cliente (o justificación)",
        "textarea",
        0
      ],
      [
        "recurrence",
        "Riesgo de recurrencia / requiere acción correctiva",
        "checkbox",
        0
      ],
      [
        "resumption",
        "Condiciones y autorización para reanudar",
        "textarea",
        0
      ],
      [
        "due",
        "Fecha de seguimiento",
        "date",
        1
      ]
    ],
    "icon": "!"
  },
  "audits": {
    "title": "Programa de auditorías internas",
    "group": "Gestión",
    "prefix": "AI",
    "fields": [
      [
        "name",
        "Auditoría / programa",
        "text",
        1
      ],
      [
        "period",
        "Periodo y frecuencia planificada",
        "text",
        1
      ],
      [
        "due",
        "Fecha programada",
        "date",
        1
      ],
      [
        "auditorId",
        "Auditor responsable",
        "ref:users",
        1
      ],
      [
        "scope",
        "Alcance",
        "textarea",
        1
      ],
      [
        "criteria",
        "Criterios",
        "textarea",
        1
      ],
      [
        "method",
        "Método y planificación",
        "textarea",
        1
      ],
      [
        "priorities",
        "Importancia, cambios y auditorías previas",
        "textarea",
        1
      ],
      [
        "results",
        "Resultados y hallazgos",
        "textarea",
        0
      ],
      [
        "actions",
        "Correcciones y acciones vinculadas",
        "textarea",
        0
      ],
      [
        "managementNotice",
        "Comunicación de resultados a dirección",
        "textarea",
        0
      ]
    ],
    "icon": "▥"
  },
  "managementReviews": {
    "title": "Revisión por la dirección",
    "group": "Gestión",
    "prefix": "RD",
    "fields": [
      [
        "name",
        "Revisión",
        "text",
        1
      ],
      [
        "period",
        "Periodo revisado",
        "text",
        1
      ],
      [
        "due",
        "Fecha planificada",
        "date",
        1
      ],
      [
        "directorId",
        "Responsable de dirección",
        "ref:users",
        1
      ],
      [
        "changes",
        "Cambios internos y externos",
        "textarea",
        0
      ],
      [
        "objectives",
        "Cumplimiento de objetivos",
        "textarea",
        0
      ],
      [
        "policies",
        "Adecuación de políticas y procedimientos",
        "textarea",
        0
      ],
      [
        "priorActions",
        "Acciones de revisiones anteriores",
        "textarea",
        0
      ],
      [
        "audits",
        "Auditorías internas recientes",
        "textarea",
        0
      ],
      [
        "corrective",
        "Acciones correctivas",
        "textarea",
        0
      ],
      [
        "external",
        "Evaluaciones externas",
        "textarea",
        0
      ],
      [
        "workScope",
        "Volumen, trabajo y alcance",
        "textarea",
        0
      ],
      [
        "feedback",
        "Retroalimentación de clientes y personal",
        "textarea",
        0
      ],
      [
        "complaints",
        "Quejas",
        "textarea",
        0
      ],
      [
        "improvements",
        "Eficacia de mejoras",
        "textarea",
        0
      ],
      [
        "resources",
        "Recursos",
        "textarea",
        0
      ],
      [
        "risks",
        "Riesgos",
        "textarea",
        0
      ],
      [
        "validity",
        "Validez de resultados",
        "textarea",
        0
      ],
      [
        "other",
        "Seguimiento y formación",
        "textarea",
        0
      ],
      [
        "systemDecisions",
        "Decisiones sobre eficacia del sistema",
        "textarea",
        0
      ],
      [
        "improvementDecisions",
        "Decisiones de mejora",
        "textarea",
        0
      ],
      [
        "resourceDecisions",
        "Recursos requeridos",
        "textarea",
        0
      ],
      [
        "changeDecisions",
        "Necesidades de cambio",
        "textarea",
        0
      ],
      [
        "followup",
        "Acuerdos, responsables y fechas de seguimiento",
        "textarea",
        0
      ]
    ],
    "icon": "▦"
  },
  "system": {
    "title": "Datos y validación del sistema",
    "group": "Gestión",
    "prefix": "SIS",
    "fields": [
      [
        "name",
        "Registro de control",
        "text",
        1
      ],
      [
        "type",
        "Tipo",
        "select:Validación de software|Cambio autorizado|Fallo del sistema|Comprobación de cálculo|Restauración / respaldo|Conservación y archivo",
        1
      ],
      [
        "scope",
        "Funciones e interfaces cubiertas",
        "textarea",
        1
      ],
      [
        "requirements",
        "Criterios de aceptación",
        "textarea",
        1
      ],
      [
        "results",
        "Pruebas, resultados y acciones",
        "textarea",
        1
      ],
      [
        "due",
        "Fecha de revisión",
        "date",
        1
      ]
    ],
    "icon": "↺"
  },
  "requirements": {
    "title": "Matriz de requisitos",
    "group": "Gestión",
    "prefix": "REQ",
    "fields": [
      [
        "clause",
        "Numeral",
        "text",
        1
      ],
      [
        "name",
        "Requisito resumido",
        "text",
        1
      ],
      [
        "module",
        "Módulo / controles relacionados",
        "text",
        1
      ],
      [
        "ownerId",
        "Responsable",
        "ref:users",
        1
      ],
      [
        "evidence",
        "Evidencia del laboratorio / valoración",
        "textarea",
        0
      ],
      [
        "due",
        "Fecha de seguimiento",
        "date",
        1
      ]
    ],
    "icon": "✓"
  },
  "calendar": {
    "title": "Calendario de servicios",
    "group": "Técnica",
    "prefix": "CAL",
    "icon": "calendar",
    "fields": [
      [
        "technicianId",
        "Técnico",
        "ref:users",
        1
      ],
      [
        "name",
        "Nombre del bloqueo / ausencia",
        "text",
        1
      ],
      [
        "startDate",
        "Inicio",
        "date",
        1
      ],
      [
        "endDate",
        "Término",
        "date",
        1
      ],
      [
        "startTime",
        "Hora de inicio",
        "time",
        1
      ],
      [
        "endTime",
        "Hora de término",
        "time",
        1
      ],
      [
        "reason",
        "Motivo / cobertura",
        "textarea",
        1
      ]
    ]
  }
};
export const EDIT={"Administrador":["clients","quotes","services","equipment","methods","records","reports","competence","documents","quality","controls","suppliers","purchases","calibrations","policies","templates","accounts","accounting","employees","payroll","users","contracts","orders","inventory","movements","supplierEvaluations","general","structure","facilities","environment","uncertainties","risks","complaints","nonconforming","audits","managementReviews","system","requirements","calendar"],"Responsable técnico":["services","equipment","calibrations","methods","records","reports","competence","controls","templates","purchases","policies","orders","facilities","environment","uncertainties","nonconforming","requirements","system","calendar","quotes"],"Calidad":["clients","quotes","services","equipment","methods","records","reports","competence","documents","quality","controls","suppliers","purchases","calibrations","policies","templates","accounts","accounting","employees","payroll","contracts","orders","inventory","movements","supplierEvaluations","general","structure","facilities","environment","uncertainties","risks","complaints","nonconforming","audits","managementReviews","system","requirements","calendar"],"Comercial":["clients","quotes","services","purchases","contracts","orders","complaints"],"Técnico":["services","records","purchases","calibrations","environment","movements","nonconforming","complaints"],"Signatario":["reports","purchases"],"Recursos humanos":["employees","payroll","purchases","general","complaints"],"Contabilidad":["accounts","accounting","purchases","movements"],"Auditor":[]};
export const FLOW={"quotes":["Borrador","Revisión","Enviada","Seguimiento","Aceptada"],"services":["Por programar","Programado","Ejecución","Revisión técnica","Pendiente de Calidad","Autorizado","Entregado","Cerrado"],"reports":["Borrador","Revisión técnica","Pendiente de Calidad","Emitido"],"documents":["Borrador","Pendiente de Calidad","Vigente"],"methods":["Borrador","Revisión técnica","Pendiente de Calidad","Vigente"],"policies":["Borrador","Pendiente de Calidad","Vigente"],"templates":["Borrador","Pendiente de Calidad","Vigente"],"quality":["Abierto","En proceso","Pendiente de Calidad","Cerrado"],"purchases":["Borrador","Cotizando","Pendiente de Calidad","Autorizada","Recibida"],"calibrations":["Programada","Pendiente de Calidad","Autorizada","En ejecución","Revisión técnica","Pendiente de evaluación","Cerrada"],"accounting":["Borrador","Pendiente de Calidad","Contabilizada"],"payroll":["Borrador","Pendiente de Calidad","Autorizada"],"inventory":["Borrador","Pendiente de Calidad","Autorizado"],"movements":["Borrador","Pendiente de Calidad","Autorizado"],"supplierEvaluations":["Borrador","Pendiente de Calidad","Autorizado"],"general":["Borrador","Pendiente de Calidad","Autorizado"],"structure":["Borrador","Pendiente de Calidad","Autorizado"],"facilities":["Borrador","Pendiente de Calidad","Autorizado"],"environment":["Borrador","Pendiente de Calidad","Autorizado"],"uncertainties":["Borrador","Pendiente de Calidad","Autorizado"],"risks":["Borrador","Pendiente de Calidad","Autorizado"],"complaints":["Borrador","Pendiente de Calidad","Autorizado"],"nonconforming":["Borrador","Pendiente de Calidad","Autorizado"],"audits":["Borrador","Pendiente de Calidad","Autorizado"],"managementReviews":["Borrador","Pendiente de Calidad","Autorizado"],"system":["Borrador","Pendiente de Calidad","Autorizado"],"requirements":["Borrador","Pendiente de Calidad","Autorizado"],"competence":["Borrador","Pendiente de Calidad","Autorizado"],"controls":["Borrador","Pendiente de Calidad","Autorizado"],"suppliers":["Borrador","Pendiente de Calidad","Aprobado"],"contracts":["Borrador","Pendiente de Calidad","Vigente","Finalizado"],"orders":["Borrador","Pendiente de Calidad","Autorizada"],"clients":["Borrador","Pendiente de Calidad","Autorizado"],"accounts":["Borrador","Pendiente de Calidad","Autorizado"],"employees":["Borrador","Pendiente de Calidad","Autorizado"],"calendar":["Borrador","Pendiente de Calidad","Autorizado"]};
export const REVIEW_INPUTS=[["changes","Cambios internos y externos"],["objectives","Cumplimiento de objetivos"],["policies","Adecuación de políticas y procedimientos"],["priorActions","Acciones de revisiones anteriores"],["audits","Auditorías internas recientes"],["corrective","Acciones correctivas"],["external","Evaluaciones externas"],["workScope","Volumen, trabajo y alcance"],["feedback","Retroalimentación de clientes y personal"],["complaints","Quejas"],["improvements","Eficacia de mejoras"],["resources","Recursos"],["risks","Riesgos"],["validity","Validez de resultados"],["other","Seguimiento y formación"]];

Object.assign(META,{"meetings": {"title": "Minutas de reuniones", "icon": "▤", "group": "Gestión", "prefix": "MIN", "fields": [["name", "Título de la reunión", "text", 1], ["meetingDate", "Fecha", "date", 1], ["meetingTime", "Hora", "time", 1], ["location", "Lugar / enlace", "text", 1], ["ownerId", "Coordinador", "ref:users", 1], ["attendeeIds", "Participantes", "multi:users", 1], ["objective", "Objetivo", "textarea", 1], ["agenda", "Orden del día", "textarea", 1], ["discussion", "Temas tratados y conclusiones", "textarea", 1], ["nextDate", "Próxima reunión", "date", 0]]}, "meetingTasks": {"title": "Acuerdos de reuniones", "icon": "✓", "group": "Gestión", "prefix": "ACU", "fields": [["name", "Acuerdo / entregable", "text", 1], ["meetingId", "Minuta relacionada", "ref:meetings", 1], ["ownerId", "Responsable", "ref:users", 1], ["due", "Fecha compromiso", "date", 1], ["description", "Detalle del acuerdo", "textarea", 1], ["evidence", "Seguimiento y evidencia", "textarea", 0], ["effectiveness", "Resultado y verificación del acuerdo", "textarea", 0]]}, "kpis": {"title": "Objetivos y KPIs", "icon": "↗", "group": "Gestión", "prefix": "KPI", "fields": [["name", "Indicador", "text", 1], ["objective", "Objetivo", "textarea", 1], ["category", "Área", "select:Comercial|Operación|Técnica|Gestión|Suministros", 1], ["source", "Fuente de cálculo", "select:Entrega a tiempo|Vigencia de equipos|Conversión comercial|Cierre de acciones|Ciclo de compra|Auditorías realizadas|Controles conformes|Captura manual", 1], ["formula", "Definición de la métrica / fórmula", "textarea", 1], ["unit", "Unidad", "select:%|días|horas|cantidad", 1], ["direction", "Sentido de mejora", "select:Mayor es mejor|Menor es mejor", 1], ["target", "Meta", "number", 1], ["frequency", "Frecuencia de revisión", "select:Mensual", 1], ["ownerId", "Responsable", "ref:users", 1], ["plan", "Acciones previstas para alcanzar el objetivo", "textarea", 1]]}, "kpiMeasurements": {"title": "Mediciones de KPIs", "icon": "↗", "group": "Gestión", "prefix": "MED", "fields": [["kpiId", "Indicador", "ref:kpis", 1], ["periodStart", "Inicio del periodo", "date", 1], ["periodEnd", "Fin del periodo", "date", 1], ["numerator", "Numerador (si es porcentaje)", "number", 0], ["denominator", "Denominador (si es porcentaje)", "number", 0], ["value", "Valor directo (otras unidades)", "number", 0], ["evidence", "Fuente y evidencia del resultado", "textarea", 1], ["analysis", "Análisis del resultado", "textarea", 1], ["actionPlan", "Acciones y seguimiento", "textarea", 1]]}});
for(const role of Object.keys(EDIT))if(role!=='Auditor')EDIT[role].push('meetings','meetingTasks');
for(const role of ['Administrador','Calidad','Responsable técnico'])EDIT[role].push('kpis','kpiMeasurements');
Object.assign(FLOW,{meetings:['Borrador','Pendiente de Calidad','Autorizado'],meetingTasks:['Abierto','En proceso','Pendiente de Calidad','Cerrado'],kpis:['Borrador','Pendiente de Calidad','Autorizado'],kpiMeasurements:['Borrador','Pendiente de Calidad','Autorizado']});

for(const m of Object.keys(META)){if(META[m].group==='Gestión')META[m].group='Calidad';if(META[m].group==='Administración')META[m].group='Compras';}
META.users.group='Administración';META.competence.group='Recursos humanos';for(const m of ['equipment','calibrations'])META[m].group='Técnica';for(const m of ['services','calendar'])META[m].group='Operación';

Object.assign(META,{"roles": {"title": "Roles y permisos", "group": "Administración", "prefix": "ROL", "icon": "♧", "fields": [["name", "Nombre del rol", "text", 1], ["description", "Descripción", "textarea", 0]]}, "labSettings": {"title": "Identidad del laboratorio", "group": "Administración", "prefix": "LAB", "icon": "◎", "fields": [["name", "Nombre comercial del laboratorio", "text", 1], ["legalName", "Razón social", "text", 0], ["taxId", "RFC", "text", 0], ["taxRegime", "Régimen fiscal", "text", 0], ["fiscalAddress", "Domicilio fiscal", "textarea", 0], ["address", "Domicilio del laboratorio", "textarea", 0], ["postalCode", "Código postal", "text", 0], ["phone", "Teléfono", "text", 0], ["email", "Correo", "text", 0], ["website", "Sitio web", "text", 0], ["accreditation", "Referencia de acreditación (solo si aplica)", "text", 0], ["color", "Color institucional", "text", 0], ["footer", "Información adicional del pie", "textarea", 0]]}, "manuals": {"title": "Manuales del sistema", "group": "Administración", "prefix": "MAN", "icon": "▤", "fields": [["name", "Manual", "text", 1], ["folder", "Carpeta", "select:Manuales del sistema", 1], ["objective", "Objetivo", "textarea", 1], ["content", "Contenido", "textarea", 1], ["ownerId", "Responsable", "ref:users", 1]]}});
for(const r of ["Administrador","Calidad"])EDIT[r].push("users","roles","labSettings","manuals");FLOW.manuals=["Borrador","Pendiente de Calidad","Autorizado"];
Object.assign(META,{surveys:{title:'Encuestas de satisfacción',group:'Calidad',prefix:'ENC',icon:'♡',fields:[['name','Nombre de la encuesta','text',1],['clientId','Cliente','ref:clients',1],['orderId','Orden de servicio (opcional)','ref:orders',0],['expires','Vigencia del enlace','date',1]]},surveyResponses:{title:'Resultados de satisfacción',group:'Calidad',prefix:'RES-ENC',icon:'↗',fields:[['name','Respuesta','text',1],['clientId','Cliente','ref:clients',0],['orderId','Orden de servicio','ref:orders',0],['average','Promedio (1–5)','number',0],['satisfaction','Satisfacción (%)','number',0],['comment','Comentarios','textarea',0]]}});
META.kpis.fields.find(x=>x[0]==='source')[2]+='|Encuestas de satisfacción';

// ERP integrado v10

Object.assign(META,{"crm": {"title": "CRM · prospectos", "group": "Comercial", "prefix": "CRM", "icon": "▥", "fields": [["name", "Prospecto / oportunidad", "text", 1], ["clientId", "Cliente vinculado", "ref:clients", 0], ["contact", "Contacto", "text", 1], ["email", "Correo", "email", 0], ["phone", "Teléfono", "text", 0], ["stage", "Etapa comercial", "select:Prospección|Contacto|Necesidad identificada|Cotización|Negociación|Ganada|Perdida", 1], ["nextDate", "Próximo seguimiento", "date", 1], ["notes", "Necesidad / seguimiento", "textarea", 0]]}, "costCenters": {"title": "Centros de gasto", "group": "Contabilidad", "prefix": "CG", "icon": "▥", "fields": [["code", "Código", "text", 1], ["name", "Centro solicitante", "text", 1], ["ownerId", "Responsable", "ref:users", 1]]}, "purchaseBids": {"title": "Cotizaciones de proveedores", "group": "Compras", "prefix": "CP", "icon": "▥", "fields": [["requestId", "Solicitud autorizada", "ref:purchases", 1], ["supplierId", "Proveedor", "ref:suppliers", 1], ["unitPrice", "Precio unitario sin IVA MXN", "number", 1], ["taxRate", "IVA (%)", "number", 1], ["due", "Vigencia", "date", 1], ["deliveryDays", "Plazo de entrega (días)", "number", 1], ["terms", "Condiciones / requisitos del proveedor", "textarea", 1]]}, "purchaseOrders": {"title": "Ejecución de compras", "group": "Compras", "prefix": "OC", "icon": "▥", "fields": [["requestId", "Solicitud autorizada", "ref:purchases", 1], ["bidId", "Cotización seleccionada", "ref:purchaseBids", 1], ["costCenterId", "Centro de gasto", "ref:costCenters", 1], ["kind", "Destino contable", "select:Inventario|Servicio|Activo fijo", 1], ["inventoryId", "Artículo en almacén (productos)", "ref:inventory", 0], ["assetId", "Activo / vehículo (activos fijos)", "ref:assets", 0], ["due", "Fecha de pago comprometida", "date", 1], ["acceptanceCriteria", "Criterios de aceptación", "textarea", 1], ["supplierRequirements", "Requisitos comunicados al proveedor", "textarea", 1], ["invoice", "Referencia de factura / comprobante", "text", 0], ["receiptDate", "Fecha de recepción / servicio", "date", 0], ["receiptEvidence", "Evidencia de recepción / conformidad del servicio", "textarea", 0]]}, "payables": {"title": "Cuentas por pagar", "group": "Contabilidad", "prefix": "CXP", "icon": "▥", "fields": [["name", "Obligación", "text", 1], ["source", "Origen", "text", 1], ["costCenterId", "Centro", "ref:costCenters", 0], ["supplierId", "Proveedor", "ref:suppliers", 0], ["amount", "Importe MXN", "number", 1], ["due", "Vencimiento", "date", 1], ["paid", "Pagado MXN", "number", 0]]}, "receivables": {"title": "Cuentas por cobrar", "group": "Contabilidad", "prefix": "CXC", "icon": "▥", "fields": [["name", "Servicio entregado", "text", 1], ["clientId", "Cliente", "ref:clients", 1], ["orderId", "Orden", "ref:orders", 1], ["amount", "Importe MXN", "number", 1], ["due", "Vencimiento", "date", 1], ["paid", "Cobrado MXN", "number", 0]]}, "settlements": {"title": "Pagos y cobros", "group": "Contabilidad", "prefix": "TES", "icon": "▥", "fields": [["name", "Concepto", "text", 1], ["direction", "Tipo", "select:Pago|Cobro", 1], ["payableId", "Cuenta por pagar", "ref:payables", 0], ["receivableId", "Cuenta por cobrar", "ref:receivables", 0], ["travelAdminId", "Anticipo / reintegro viáticos", "ref:travelAdmin", 0], ["bankId", "Cuenta bancaria / efectivo", "ref:accounts", 1], ["amount", "Importe MXN", "number", 1], ["due", "Fecha", "date", 1], ["reference", "Referencia bancaria", "text", 1], ["evidence", "Comprobante / evidencia", "textarea", 1]]}, "budgets": {"title": "Presupuestos por centro", "group": "Contabilidad", "prefix": "PRE", "icon": "▥", "fields": [["name", "Presupuesto", "text", 1], ["costCenterId", "Centro", "ref:costCenters", 1], ["period", "Mes (AAAA-MM)", "text", 1], ["amount", "Presupuesto mensual MXN", "number", 1], ["notes", "Criterios / alcance", "textarea", 0]]}, "assets": {"title": "Vehículos y activos fijos", "group": "Almacén", "prefix": "AF", "icon": "▥", "fields": [["name", "Descripción", "text", 1], ["kind", "Tipo", "select:Vehículo|Equipo|Mobiliario|Otro", 1], ["assetCode", "ID del activo", "text", 1], ["brand", "Marca", "text", 0], ["model", "Modelo", "text", 0], ["serial", "Serie / VIN", "text", 0], ["plate", "Placa (vehículos)", "text", 0], ["custodianId", "Responsable", "ref:users", 1], ["costCenterId", "Centro", "ref:costCenters", 1], ["acquired", "Fecha de adquisición", "date", 1], ["usefulMonths", "Vida útil contable (meses)", "number", 1], ["residual", "Valor residual MXN", "number", 1], ["openingCost", "Costo inicial documentado (0 si se adquiere por compra)", "number", 1], ["location", "Ubicación", "text", 1]]}, "depreciations": {"title": "Depreciación de activos", "group": "Contabilidad", "prefix": "DEP", "icon": "▥", "fields": [["assetId", "Activo", "ref:assets", 1], ["period", "Mes (AAAA-MM)", "text", 1], ["evidence", "Revisión / evidencia", "textarea", 1]]}, "fuel": {"title": "Combustible", "group": "Operación", "prefix": "COMB", "icon": "▥", "fields": [["name", "Carga / suministro", "text", 1], ["assetId", "Vehículo", "ref:assets", 1], ["costCenterId", "Centro", "ref:costCenters", 1], ["supplierId", "Proveedor", "ref:suppliers", 1], ["due", "Fecha de pago", "date", 1], ["liters", "Litros", "number", 1], ["unitPrice", "Precio por litro sin IVA MXN", "number", 1], ["taxRate", "IVA (%)", "number", 1], ["odometer", "Kilometraje", "number", 1], ["reference", "Factura / ticket", "text", 1], ["evidence", "Ruta / justificación", "textarea", 1]]}, "travelRequests": {"title": "Solicitudes de viáticos", "group": "Recursos humanos", "prefix": "SV", "icon": "▥", "fields": [["name", "Comisión / viaje", "text", 1], ["costCenterId", "Centro solicitante", "ref:costCenters", 1], ["startDate", "Inicio", "date", 1], ["endDate", "Fin", "date", 1], ["destination", "Destino", "text", 1], ["purpose", "Justificación", "textarea", 1], ["requested", "Anticipo solicitado MXN", "number", 1]]}, "travelAdmin": {"title": "Administración de viáticos", "group": "Recursos humanos", "prefix": "VIA", "icon": "▥", "fields": [["requestId", "Solicitud autorizada", "ref:travelRequests", 1], ["due", "Fecha de comprobación", "date", 1], ["actual", "Gasto comprobado MXN (IVA incluido)", "number", 1], ["evidence", "Detalle / comprobantes / reintegro", "textarea", 1]]}});
Object.assign(FLOW,{"purchaseOrders": ["Borrador", "Pendiente de Administrador", "Autorizada", "Ejecutada", "Recibida"], "settlements": ["Borrador", "Pendiente de Administrador", "Autorizado"], "budgets": ["Borrador", "Pendiente de Administrador", "Autorizado"], "assets": ["Borrador", "Pendiente de Administrador", "Autorizado"], "depreciations": ["Borrador", "Pendiente de Administrador", "Autorizado"], "fuel": ["Borrador", "Pendiente de Administrador", "Autorizado"], "travelRequests": ["Borrador", "Pendiente de Administrador", "Autorizada"], "travelAdmin": ["Abierto", "Pendiente de Administrador", "Comprobado", "Cerrado"]});
META.purchases.fields=[["name", "Producto / servicio solicitado", "text", 1], ["description", "Justificación y especificación", "textarea", 1], ["kind", "Tipo de solicitud", "select:Producto|Servicio", 1], ["serviceType", "Tipo de servicio", "select:No aplica|Capacitación|Auditoría|Calibración|Reparación|Otro", 1], ["costCenterId", "Centro solicitante", "ref:costCenters", 1], ["quantity", "Cantidad", "number", 1], ["due", "Fecha requerida", "date", 1]];
FLOW.purchases=['Borrador','Pendiente de Administrador','Autorizada','Atendida'];
META.quotes.fields=META.quotes.fields.filter(x=>!['acceptance','contractId','capacityReview'].includes(x[0]));META.quotes.fields.push(['crmId','Oportunidad CRM (opcional)','ref:crm',0],['terms','Términos y condiciones del servicio','textarea',1],['accredited','Servicio dentro del alcance acreditado','checkbox',0],['accreditationScope','Referencia de acreditación y alcance aplicable','textarea',0],['privacyUrl','URL del aviso de privacidad','text',0],['exchangeRate','Tipo de cambio a MXN (1 para MXN)','number',1]);
META.services.fields.push(['capacityReview','Revisión interna de capacidad y recursos','textarea',0]);META.inventory.fields.push(['openingUnitCost','Costo unitario inicial MXN','number',0]);META.movements.fields.push(['costCenterId','Centro de gasto (consumo)','ref:costCenters',0],['unitCost','Costo unitario MXN (entradas nuevas / ajuste)','number',0],['valueEffect','Efecto patrimonial','select:Ninguno|Alta|Consumo|Retorno|Baja',0]);META.accounting.fields.push(['costCenterId','Centro de gasto','ref:costCenters',0]);META.contracts.fields.push(['quoteId','Cotización aceptada (opcional)','ref:quotes',0],['amount','Importe contratado sin IVA MXN','number',0],['taxRate','IVA (%)','number',0]);META.calibrations.fields.push(['purchaseOrderId','Compra del servicio externo (si aplica)','ref:purchaseOrders',0]);META.labSettings.fields.push(['privacyUrl','URL del aviso de privacidad','text',0],['accreditationScope','Alcance acreditado autorizado','textarea',0]);

META.movements.fields.push(['returnMovementId','Consumo original (retorno)','ref:movements',0]);

// Plazos, facturación y anticipos v11.
const PAYMENT_TERMS11='select:Contado|Crédito 30 días|Crédito 60 días|Crédito 90 días';
for(const m of ['quotes','purchaseOrders'])META[m].fields.push(['paymentPlan','Condición de pago',PAYMENT_TERMS11,1]);
META.orders.fields.push(['invoiceFolio','Folio de factura','text',0],['invoiceUUID','UUID fiscal (opcional)','text',0],['invoiceDate','Fecha de factura','date',0],['invoiceMethod','Método de pago de factura','select:PPD|PUE',0],['paymentPlan','Condición de pago',PAYMENT_TERMS11,0]);
META.settlements.fields.push(['quoteAdvanceId','Anticipo de cotización aceptada','ref:quotes',0],['paymentComplement','Referencia complemento de pago PPD (registro externo)','text',0]);
META.payables.fields.push(['paymentPlan','Condición de pago',PAYMENT_TERMS11,0],['invoice','Factura / comprobante','text',0]);
META.receivables.fields.push(['invoiceFolio','Factura','text',0],['invoiceDate','Fecha de factura','date',0],['invoiceMethod','PPD / PUE','select:PPD|PUE',0],['paymentPlan','Condición de pago',PAYMENT_TERMS11,0],['advanceApplied','Anticipos aplicados MXN','number',0]);
META.advances={title:'Anticipos de clientes',group:'Contabilidad',prefix:'ANT',icon:'▥',fields:[['name','Cotización / cliente','text',1],['quoteId','Cotización aceptada','ref:quotes',1],['clientId','Cliente','ref:clients',1],['amount','Anticipo recibido MXN','number',1],['applied','Aplicado MXN','number',0],['orderId','Orden de servicio','ref:orders',0]]};

for(const m of ['payables','receivables'])META[m].fields.push(['balance','Saldo MXN','number',0],['ageDays','Antigüedad (días)','number',0],['overdueDays','Días vencidos','number',0]);
// v12: compras sin autorizaciones duplicadas y pagos recurrentes.
META.purchaseOrders.title='Órdenes de compra';META.purchaseBids.fields[0][1]='Solicitud de compra';META.purchaseOrders.fields[0][1]='Solicitud con propuesta aceptada';
FLOW.purchases=['Borrador','Recibida solicitud','Cotizando','Pendiente de Administrador','Autorizada','Atendida'];FLOW.purchaseOrders=['Borrador','Autorizada','Recibida'];FLOW.travelRequests=['Borrador','Pendiente de RH','Pendiente de Administrador','Autorizada'];FLOW.suppliers=['Borrador','Pendiente de evaluación','Aprobado'];
META.scheduledPayments={title:'Pagos programados',group:'Compras',prefix:'PF',icon:'◷',fields:[['name','Servicio fijo','text',1],['category','Concepto','select:Luz|Agua|Internet|Arrendamiento|Otro servicio fijo',1],['supplierId','Proveedor autorizado','ref:suppliers',1],['costCenterId','Centro de gasto','ref:costCenters',1],['amount','Importe por pago con IVA MXN (máximo 2,000)','number',1],['taxRate','IVA (%)','number',1],['nextDue','Próximo vencimiento','date',1],['frequency','Frecuencia en meses','select:1|2|3|6|12',1],['notes','Contrato / referencia del servicio','textarea',1]]};
for(const r of ['Administrador','Calidad'])EDIT[r].push('scheduledPayments');
for(const f of META.fuel.fields)if(f[0]==='reference')f[3]=0;

META.scheduledPayments.fields.push(['status','Estado del programa','select:Activo|Suspendido',1]);
// v13: bandeja personal, distribución controlada, resguardos, bajas y seguros.
for(const m of ['documents','policies','methods','manuals'])META[m].fields.push(['audience','Distribución del documento','select:Todo el personal|Personal técnico|Administración|Usuarios seleccionados',0],['readerIds','Lectores (usuarios seleccionados)','multi:users',0]);
META.roles.fields.push(['profileType','Tipo de vista','select:General|Técnico',0]);
META.depreciations.title='Depreciación y baja de activos';META.depreciations.fields.push(['kind','Movimiento','select:Depreciación mensual|Baja',1],['disposalDate','Fecha de baja','date',0],['reason','Motivo / disposición del activo','textarea',0]);
META.assetAssignments={title:'Asignaciones y resguardos',group:'Almacén',prefix:'RES',icon:'✓',fields:[['assetId','Vehículo / activo','ref:assets',1],['userId','Persona responsable','ref:users',1],['employeeId','Expediente de personal (opcional)','ref:employees',0],['due','Fecha de entrega','date',1],['location','Ubicación / uso autorizado','text',1],['condition','Estado, accesorios y condiciones de entrega','textarea',1],['returnDate','Fecha de devolución','date',0],['returnEvidence','Condiciones / evidencia de devolución','textarea',0]]};FLOW.assetAssignments=['Borrador','Pendiente de Calidad','Vigente'];
META.documentReadings={title:'Lecturas de documentos',group:'Calidad',prefix:'LEC',icon:'✓',fields:[['name','Documento / versión','text',1],['sourceModule','Tipo de registro','text',1],['sourceId','Registro origen','number',1],['userId','Lector','ref:users',1],['documentVersion','Versión liberada','number',1],['due','Fecha objetivo de lectura','date',1],['readAt','Confirmación de lectura','text',0]]};
META.insurancePolicies={title:'Seguros y renovaciones',group:'Compras',prefix:'SEG',icon:'◈',fields:[['name','Seguro / póliza','text',1],['policyNumber','Número de póliza','text',1],['kind','Cobertura','select:Vehículo|Activo fijo|Responsabilidad civil|Personal|Otro',1],['assetId','Activo asegurado','ref:assets',0],['employeeId','Persona asegurada (opcional)','ref:employees',0],['purchaseOrderId','Orden de compra del seguro','ref:purchaseOrders',1],['startDate','Inicio de cobertura','date',1],['endDate','Fin de cobertura','date',1],['ownerId','Responsable de renovación','ref:users',1],['coverage','Coberturas / exclusiones','textarea',1],['emergencyPhone','Teléfono de asistencia','text',0],['notes','Condiciones / seguimiento','textarea',0]]};FLOW.insurancePolicies=['Borrador','Pendiente de Administrador','Autorizado'];
META.purchases.fields.find(f=>f[0]==='serviceType')[2]+='|Seguro';
for(const r of ['Administrador','Calidad'])EDIT[r].push('assetAssignments','documentReadings','insurancePolicies');

// v14: custodia de ítems, muestreo opcional y expediente de equipamiento.
META.labSettings.fields.push(['samplingEnabled','Activar módulo de muestreo','checkbox',0]);
META.itemReceipts={title:'Recepción de ítems',group:'Operación',prefix:'REC',icon:'▦',fields:[['orderId','Orden de servicio','ref:orders',1],['serviceId','Servicio / ítem','ref:services',1],['due','Fecha de recepción','date',1],['condition','Condición, embalaje y accesorios','textarea',1],['location','Ubicación de custodia','text',1],['storage','Transporte, preservación y almacenamiento','textarea',1],['deviation','Diferencias / daños / desviaciones','textarea',0],['customerInstructions','Consulta e instrucciones del cliente','textarea',0],['disclaimer','Resultados posiblemente afectados','textarea',0],['expiry','Límite de conservación (si aplica)','date',0]]};
META.itemCustody={title:'Custodia y entrega de ítems',group:'Operación',prefix:'CUS',icon:'↔',fields:[['receiptId','Recepción registrada','ref:itemReceipts',1],['kind','Evento','select:Transferencia|Subdivisión|Almacenamiento|Entrega al cliente|Disposición final',1],['due','Fecha','date',1],['recipient','Responsable / receptor','text',1],['location','Ubicación / destino','text',1],['condition','Condición, protección y evidencia','textarea',1],['childId','Identificación de subdivisión (si aplica)','text',0],['authorization','Acuerdo de disposición / recepción','textarea',0],['temperature','Temperatura de conservación °C (si aplica)','number',0]]};
META.itemChanges={title:'Cambios técnicos de ítems',group:'Técnica',prefix:'CIT',icon:'±',fields:[['orderId','Orden autorizada','ref:orders',1],['kind','Cambio','select:Agregar|Retirar',1],['itemKey','Ítem a retirar','orderitem',0],['reason','Justificación técnica','textarea',1],['customerAgreement','Acuerdo del cliente / ajuste comercial','textarea',1],['itemId','ID del nuevo ítem','text',0],['description','Descripción','text',0],['serial','Serie','text',0],['brand','Marca','text',0],['model','Modelo','text',0],['unit','Unidad','text',0],['parameters','Parámetros / requisito de ensayo','text',0],['resolution','Resolución / tipo de muestra','text',0],['methodIds','Métodos aplicables','multi:methods',0]]};
META.equipmentEvents={title:'Expediente y liberación de equipos',group:'Técnica',prefix:'EVE',icon:'◷',fields:[['equipmentId','Equipo','ref:equipment',1],['kind','Evento','select:Retiro de uso|Reincorporación|Mantenimiento preventivo|Mantenimiento correctivo|Comprobación|Ajuste|Daño / falla',1],['due','Fecha','date',1],['reason','Motivo y evaluación','textarea',1],['condition','Condiciones del equipo','textarea',1],['impact','Impacto en resultados anteriores / acción','textarea',1],['releaseEvidence','Verificación de aptitud antes de uso','textarea',0],['nonconformingId','Trabajo no conforme relacionado','ref:nonconforming',0]]};
META.samplingPlans={title:'Planes de muestreo',group:'Muestreo',prefix:'PMU',icon:'▦',fields:[['orderId','Orden de servicio','ref:orders',1],['name','Plan / objetivo','text',1],['methodId','Método vigente de muestreo','ref:methods',1],['technicianId','Personal autorizado','ref:users',1],['due','Fecha programada','date',1],['location','Lugar / puntos / croquis','textarea',1],['selection','Selección de muestras / fundamento estadístico','textarea',1],['quantity','Número de muestras','number',1],['preparation','Preparación, equipos y recipientes','textarea',1],['preservation','Transporte y conservación','textarea',1],['criteria','Condiciones y criterios de aceptación','textarea',1],['uncertainty','Contribuciones de muestreo a incertidumbre','textarea',1]]};
META.samplingRecords={title:'Registros e informes de muestreo',group:'Muestreo',prefix:'RMU',icon:'▤',fields:[['planId','Plan autorizado','ref:samplingPlans',1],['serviceId','Servicio / ítem de la orden','ref:services',1],['due','Fecha de muestreo','date',1],['sampleId','ID único de muestra','text',1],['location','Ubicación / puntos / coordenadas','textarea',1],['environment','Condiciones ambientales','textarea',1],['equipmentIds','Equipos utilizados','multi:equipment',1],['preparation','Preparación / tratamiento real','textarea',1],['observations','Observaciones y resultados','textarea',1],['deviations','Desviaciones / exclusiones / adiciones','textarea',1],['uncertainty','Información para incertidumbre posterior','textarea',1],['transport','Recipiente, conservación y transporte','textarea',1],['receiptId','Recepción / custodia posterior','ref:itemReceipts',0]]};
for(const m of ['itemReceipts','itemCustody','itemChanges','equipmentEvents','samplingPlans','samplingRecords'])FLOW[m]=['Borrador','Pendiente de Calidad','Autorizado'];
META.movements.fields.push(['condition','Condiciones físicas al salir / volver','textarea',0],['returnOf','Salida original del equipo','ref:movements',0]);
META.movements.fields.find(f=>f[0]==='reason')[2]='select:Compra|Consumo|Calibración|Reparación|Mantenimiento|Mantenimiento preventivo|Mantenimiento correctivo|Comprobación|Traslado|Devolución|Ajuste de inventario';
META.reports.fields.push(['samplingRecordId','Registro de muestreo (si aplica)','ref:samplingRecords',0]);

META.methods.fields.find(f=>f[0]==='activity')[2]='select:Calibración|Ensayo|Muestreo';
META.quotes.fields.push(['samplingIncluded','Incluye muestreo contratado (si está activado)','checkbox',0]);
META.samplingRecords.fields.push(['time','Hora de muestreo','time',1],['sampleDescription','Descripción / matriz / cantidad recolectada','textarea',1]);
META.itemReceipts.fields.push(['tempMin','Temperatura mínima de conservación °C (si aplica)','number',0],['tempMax','Temperatura máxima de conservación °C (si aplica)','number',0]);
for(const f of META.services.fields)if(['receiptDate','handling'].includes(f[0]))f[3]=0;
FLOW.samplingRecords=['Borrador','Revisión técnica','Pendiente de Calidad','Autorizado'];

META.samplingRecords.fields.push(['amendmentReason','Motivo y alcance de la enmienda (si aplica)','textarea',0]);
// v16: expediente único, personal y documentos externos.
META.services.fields.push(['signatoryId','Signatario reservado (opcional)','ref:users',0]);
META.reports.fields.push(['testSite','Sitio del ensayo / calibración','select:Instalaciones del cliente|Laboratorio',1],['siteName','Nombre / dirección del sitio','text',1],['temperature','Temperatura °C','number',1],['humidity','Humedad relativa %','number',1],['correctionReason','Justificación de corrección / sustitución','textarea',0]);
META.documents.fields.push(['origin','Origen','select:Interno|Externo',1],['documentType','Tipo documental','select:Política|Registro|Formato|Plantilla|Programa|Procedimiento|Norma|Ley|Reglamento|Estándar|Método normalizado|Requisito de cliente',1]);
const policyType16=META.policies.fields.find(f=>f[0]==='type');if(policyType16)policyType16[2]='select:Política|Registro|Formato|Plantilla|Programa|Procedimiento';
META.personnelMovements={title:'Anticipos, préstamos y conceptos de nómina',group:'Recursos humanos',prefix:'RH',icon:'▥',fields:[['employeeId','Colaborador','ref:employees',1],['kind','Concepto','select:Anticipo de nómina|Préstamo|Bono|Descuento|Prestación|Otro ingreso',1],['amount','Importe MXN','number',1],['due','Fecha de pago / aplicación','date',1],['periodStart','Inicio del periodo de nómina','date',1],['periodEnd','Fin del periodo de nómina','date',1],['installments','Número de cuotas (anticipos / préstamos)','number',1],['reason','Justificación / acuerdo','textarea',1],['costCenterId','Centro de gasto','ref:costCenters',1]]};FLOW.personnelMovements=['Borrador','Pendiente de Administrador','Autorizado'];
for(const [key,label,type] of [['catalogSourceCode','Número de cuenta original','text'],['level','Nivel','number'],['parent','Cuenta de mayor','text'],['nature','Naturaleza','text'],['statementType','Tipo del catálogo','text'],['satCode','Código agrupador SAT','text'],['rubric','Rubro de estados financieros','text'],['acceptsMovements','Acepta movimientos','checkbox'],['notes','Observaciones','textarea']])META.accounts.fields.push([key,label,type,0]);
META.deliveryOrders={title:'Órdenes de entrega / envío',group:'Operación',prefix:'ENT',icon:'↔',fields:[['orderId','Orden de servicio','ref:orders',1],['due','Fecha de entrega','date',1],['channel','Entrega / envío','select:Entrega presencial|Mensajería|Entrega digital y devolución',1],['recipient','Receptor / cliente','text',1],['evidence','Acuse, guía y condiciones de entrega','textarea',1]]};FLOW.deliveryOrders=['Pendiente de entrega','Entregado'];
const STAFF17=[['userId','Usuario vinculado','ref:users'],['managerId','Jefe directo','ref:users'],['schedule','Horario','text'],['shift','Turno','text'],['infonavit','Infonavit mensual MXN','number'],['fonacot','Fonacot mensual MXN','number'],['alimony','Pensión alimenticia mensual MXN','number'],['otherRetention','Otros descuentos mensuales MXN','number'],['retentionReason','Concepto / autorización de otros descuentos','textarea'],['curp','CURP','text'],['rfc','RFC','text'],['clabe','CLABE bancaria','text'],['bank','Banco','text'],['nss','NSS','text'],['personalEmail','Correo personal','email'],['phone','Teléfono','text'],['address','Domicilio','textarea'],['ine','Número INE','text'],['emergencyName','Contacto de emergencia','text'],['emergencyRelationship','Parentesco','text'],['emergencyAddress','Domicilio de emergencia','textarea'],['emergencyPhone','Teléfono de emergencia','text']];for(const [k,l,t]of STAFF17)META.employees.fields.push([k,l,t,0]);META.employees.fields[0][1]='Nombre completo';META.payroll.title='Nómina';META.payroll.fields.push(['isr','ISR del periodo MXN','number',0],['imss','Cuota obrera IMSS del periodo MXN','number',0],['vacationPremiumRate','Prima vacacional %','number',0]);
META.training={title:'Programa anual de capacitación',group:'Recursos humanos',prefix:'CAP',icon:'▣',fields:[['kind','Tipo','select:Inducción|Capacitación',1],['name','Tema','text',1],['participantIds','Participantes','multi:users',1],['startDate','Fecha de inicio','date',1],['endDate','Fecha de fin','date',1],['startTime','Hora de inicio','time',1],['endTime','Hora de fin','time',1],['duration','Duración en horas','number',1],['location','Sitio','text',1],['evidence','Asistencia / evaluación / evidencia','textarea',0]]};FLOW.training=['Borrador','Programada','Completada'];
META.vacations={title:'Solicitudes de vacaciones',group:'Recursos humanos',prefix:'VAC',icon:'◷',fields:[['startDate','Inicio','date',1],['endDate','Fin','date',1],['reason','Comentarios','textarea',0],['conflictAccepted','Acepto solicitar fechas con servicios programados','checkbox',0]]};FLOW.vacations=['Borrador','Pendiente de jefe directo','Autorizada'];
META.employmentContracts={title:'Contratos laborales',group:'Recursos humanos',prefix:'CL',icon:'▤',fields:[['employeeId','Colaborador','ref:employees',1],['kind','Tipo de contrato','select:Temporal|Tiempo indefinido|Por proyecto|Prueba 3 meses',1],['endDate','Fin (temporal / proyecto / prueba)','date',0],['purpose','Causa de temporalidad / proyecto / funciones especializadas','textarea',0],['representative','Representante del patrón','text',1],['terms','Condiciones adicionales','textarea',0]]};FLOW.employmentContracts=['Borrador','Pendiente de Administrador','Autorizado'];
META.employees.fields.push(['workWeek','Días laborables','select:Lunes a viernes|Lunes a sábado|Todos los días',0]);
META.equipment.fields.find(f=>f[0]==='category')[2]+='|Equipo de medición';
META.training.fields.find(f=>f[0]==='participantIds')[3]=0;META.training.fields.push(['participantEmployeeIds','Colaboradores participantes','multi:employees',0]);
FLOW.reports=['Borrador','Pendiente de Calidad','Emitido'];
META.equipment.title='Equipos y calibración';

// v18 · Cumplimiento LIC / RLIC y organización del trabajo.
const fields18=(arr)=>arr;
const modules18Model={
legalDocuments:{title:'Expediente legal',group:'Operación',icon:'⚖',prefix:'LEG',fields:[['name','Documento','text',1],['kind','Tipo','select:Acta constitutiva certificada|Documento público / poder|Reforma societaria|Identificación persona física|Comprobante domicilio administrativo|CSF|Opinión fiscal|Estado de cuenta|Escritura|Arrendamiento|Comodato|Permiso / licencia|Soporte legal equipo|Metodología|Gestión y conflictos de interés|Pago de derechos|Requisito adicional',1],['holder','Titular','text',1],['rfc','RFC del titular','text'],['representative','Representante legal','text'],['siteId','Sede / instalación','ref:facilities'],['equipmentId','Equipo vinculado','ref:equipment'],['owner','Propietario / otorgante','text'],['authority','Autoridad emisora','text'],['municipality','Municipio / estado','text'],['activity','Actividad autorizada / uso legal','textarea'],['issueDate','Fecha de emisión','date',1],['validUntil','Vigencia (si aplica)','date'],['originalLocation','Ubicación del original','text',1],['ownerId','Responsable','ref:users',1],['reviewResult','Resultado de revisión','select:Pendiente|Aceptable|No aceptable|Positivo|Negativo',1],['reviewNotes','Revisión / requisitos locales aplicables','textarea',1],['basis','Fundamento / requisito externo','text']]},
tariffs:{title:'Tarifas',group:'Comercial',icon:'＄',prefix:'TAR',fields:[['name','Servicio / tarifa','text',1],['methodId','Método','ref:methods',1],['norm','NOM / estándar / norma / disposición','text',1],['sector','Sector / rama / materia','text',1],['organismType','Tipo de organismo','select:Laboratorio de ensayo|Laboratorio de calibración|Laboratorio de ensayo y calibración',1],['accreditor','Entidad de acreditación','text',1],['accreditationNumber','Número de acreditación','text',1],['unit','Unidad de cobro','text',1],['currency','Moneda','select:MXN|USD|EUR',1],['honoraria','Honorarios','number',1],['travel','Viáticos','number',1],['otherCharges','Otros cargos','number',1],['directCost','Costo directo unitario','number',1],['indirectCost','Costo indirecto unitario','number',1],['pricingMethod','Metodología de costos y justificación de precio','textarea',1],['startDate','Aplicable desde','date',1],['validUntil','Aplicable hasta','date',1],['additional','Información adicional requerida por Secretaría','textarea']]},
businessPlans:{title:'Plan de negocio',group:'Comercial',icon:'▥',prefix:'PN',fields:[['name','Plan anual / siguientes 12 meses','text',1],['startDate','Primer mes del plan','date',1],['tariffId','Tarifa de referencia','ref:tariffs',1],['ownerId','Responsable','ref:users',1],['coverage','Cobertura geográfica','textarea',1],['infrastructure','Capacidad instalada / infraestructura','textarea',1],['equipmentIds','Equipos disponibles','multi:equipment',1],['participantIds','Personal técnico y operativo','multi:users',1],['monthlyCapacity','Capacidad máxima mensual de servicios','number',1],['annualFixedCost','Costos fijos de los 12 meses','number',1],['variableCost','Costo variable por servicio','number',1],['calculationSupport','Soporte del cálculo / supuestos de capacidad y demanda','textarea',1],...Array.from({length:12},(_,i)=>['month'+(i+1),'Servicios estimados · mes '+(i+1),'number',1]),['strategy','Objetivos, acciones comerciales y seguimiento','textarea',1]]},
unattendedRequests:{title:'Solicitudes no atendidas',group:'Comercial',icon:'⊘',prefix:'SNA',fields:[['name','Solicitud / servicio requerido','text',1],['quoteId','Cotización origen (si existe)','ref:quotes'],['clientId','Cliente','ref:clients',1],['requestDate','Fecha de solicitud','date',1],['decisionDate','Fecha de decisión','date',1],['norm','NOM aplicable','text',1],['authority','Autoridad Normalizadora que emitió la NOM','text',1],['cause','Causa','select:Conflicto de interés|Incumplimiento de requisitos NOM|Otra causa comercial',1],['detail','Requisitos incumplidos / explicación de la causa','textarea',1],['evidence','Evidencia y decisión comunicada al solicitante','textarea',1],['ownerId','Responsable','ref:users',1]]},
semiannualReports:{title:'Reportes semestrales',group:'Comercial',icon:'▤',prefix:'RS',fields:[['name','Nombre del reporte','text',1],['year','Año','number',1],['semester','Semestre','select:Enero–junio|Julio–diciembre',1],['authority','Autoridad Normalizadora destinataria','text',1],['ownerId','Responsable','ref:users',1],['due','Fecha de entrega conforme instrucción de autoridad','date',1],['notes','Observaciones / formato requerido por autoridad','textarea']]},
complianceCases:{title:'Acreditación y aprobación',group:'Operación',icon:'✓',prefix:'EXP',fields:[['name','Expediente / alcance','text',1],['kind','Trámite independiente','select:Acreditación|Aprobación',1],['accreditationId','Acreditación vinculada (para aprobación)','ref:complianceCases'],['authority','Entidad / Autoridad Normalizadora','text',1],['reference','Número / referencia de trámite','text',1],['phase','Situación del trámite','select:Preparación|Presentada|Vigente|Suspendida|Cancelada|Vencida',1],['methodIds','Métodos incluidos','multi:methods',1],['siteId','Sede (vacío = todas)','ref:facilities'],['scope','Alcance / actividades / NOM','textarea',1],['submittedDate','Presentación','date'],['resolutionDate','Resolución','date'],['validUntil','Vigencia','date'],['documentIds','Documentos del expediente','multi:legalDocuments',1],['tariffIds','Tarifas (aprobación)','multi:tariffs'],['businessPlanId','Plan de negocio (aprobación)','ref:businessPlans'],['requirements','Requisitos adicionales / PEC / lineamientos aplicables','textarea',1],['receipt','Acuse / resolución y ubicación de evidencia','textarea']]},
regulatoryChanges:{title:'Cambios regulatorios del alcance',group:'Operación',icon:'↻',prefix:'CAM',fields:[['name','Cambio','text',1],['caseId','Acreditación afectada','ref:complianceCases',1],['ownerId','Responsable','ref:users',1],['impact','Impacto en personal, sede, métodos, equipos o alcance','textarea',1],['due','Fecha objetivo / plazo aplicable','date',1],['accreditationRequest','Solicitud de actualización / acuse','textarea',1],['accreditationResolution','Resolución de actualización de acreditación','textarea'],['approvalRequest','Solicitud posterior de actualización de aprobación','textarea'],['approvalResolution','Resolución de aprobación','textarea'],['approvalRequired','Requiere actualizar aprobación','checkbox'],['evidence','Referencias / evidencias del trámite','textarea']]},
scopeRestrictions:{title:'Suspensión de alcance',group:'Operación',icon:'⊘',prefix:'SUS',fields:[['name','Restricción notificada','text',1],['caseId','Expediente afectado','ref:complianceCases'],['kind','Tipo','select:Suspensión parcial|Suspensión total|Cancelación',1],['methodIds','Métodos (vacío = todos)','multi:methods'],['activity','Actividad','select:Todas|Ensayo|Calibración|Muestreo',1],['siteId','Sede (vacío = todas)','ref:facilities'],['startDate','Inicio de restricción','date',1],['authority','Entidad / autoridad','text',1],['reference','Resolución notificada','textarea',1],['ownerId','Responsable','ref:users',1],['evidence','Evidencia / acciones correctivas / seguimiento','textarea',1]]}
};
Object.assign(META,modules18Model);for(const m of Object.keys(modules18Model))FLOW[m]=['Borrador','Pendiente de Calidad',m==='semiannualReports'?'Listo para envío':m==='unattendedRequests'?'Revisada':m==='regulatoryChanges'?'Cerrado':'Vigente'];
META.risks.fields.push(['probability','Probabilidad (1–5)','number',1],['impact','Impacto (1–5)','number',1],['residualProbability','Probabilidad residual (1–5)','number',1],['residualImpact','Impacto residual (1–5)','number',1],['qualityId','Acción correctiva asociada','ref:quality']);
META.uncertainties.fields.push(['equipmentIds','Equipos asociados al presupuesto','multi:equipment',1]);
META.services.fields.push(['siteId','Sede / instalación registrada','ref:facilities']);
META.calibrations.fields.push(['magnitude','Magnitud calibrada','text'],['calibratedRange','Rango cubierto por certificado','text'],['providerScope','Alcance acreditado del proveedor / aceptación','textarea'],['foreignChain','Cadena extranjera','checkbox'],['foreignAuthorizationRequired','Requiere autorización de cadena extranjera','checkbox'],['foreignAuthorization','Autorización CENAM / Instituto Designado o reconocimiento aplicable','textarea']);
META.employees.fields.push(['academicDegree','Grado académico','text'],['experience','Experiencia técnica / evidencias','textarea'],['externalCompetence','Requisitos externos / evaluación exigida por PEC aplicable','textarea']);
META.methods.fields.push(['procedureId','Procedimiento controlado','ref:policies'],['formatId','Formato / documento vigente','ref:documents'],['resourceEquipmentIds','Recursos de equipo','multi:equipment']);
for(const m of ['complaints','nonconforming','audits','risks'])if(!META[m].fields.some(f=>f[0]==='qualityId'))META[m].fields.push(['qualityId','Acción correctiva asociada','ref:quality']);
META.meetings.title='Minutas';META.surveys.title='Satisfacción del cliente';
META.methods.fields.push(['nomReference','NOM / disposición obligatoria aplicable','text'],['approvalRequired','Servicio regulado que exige acreditación y aprobación','checkbox']);
modules18Model.tariffLists={title:'Listados y envío de tarifas',group:'Comercial',icon:'▤',prefix:'LT',fields:[['name','Listado de tarifas para Secretaría','text',1],['listDate','Fecha de elaboración del listado','date',1],['tariffIds','Tarifas incluidas','multi:tariffs',1],['ownerId','Responsable','ref:users',1],['recipient','Destinatario / unidad de Secretaría','text',1],['additional','Información adicional / requisitos del destinatario','textarea']]};META.tariffLists=modules18Model.tariffLists;FLOW.tariffLists=['Borrador','Pendiente de Calidad','Vigente'];
META.labSettings.fields.push(['headerBackground','Fondo del encabezado de documentos','select:Blanco|Azul',0]);

for(const m of Object.keys(META))if(META[m].group==='Administración')META[m].group='Configuración';
