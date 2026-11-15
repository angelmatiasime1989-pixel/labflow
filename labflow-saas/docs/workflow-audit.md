# Revisión funcional de cubolabs

Fecha de revisión: 30 de octubre de 2026.

## Resultado y alcance

34 suites aprobadas. Se inspeccionaron 104 definiciones de herramientas y vistas, con 10 usuarios ficticios de los perfiles incorporados. La prueba sobre las rutas SaaS rechazó 697 intentos de escritura y generó 263 vistas previas PDF. Las comprobaciones usan almacenamiento en memoria; no modifican los datos del servicio publicado.

Las pruebas históricas de dominio usan un reloj fijo de octubre de 2026 y un adaptador que selecciona el worker de laboratorio solo dentro del proceso de prueba. Las pruebas SaaS usan el gateway real, cookies por cliente y almacenamiento separado. El artefacto publicado sigue exportando exclusivamente el gateway SaaS.

No se interpreta este resultado como certificación de ausencia de errores o cumplimiento normativo. No se enviaron correos reales, no se timbró ni consultó al SAT y no se probaron fallos de infraestructura real. Las validaciones de correo usan respuestas simuladas y las fiscales usan XML ficticios.

## Correcciones aplicadas

| Hallazgo reproducido | Corrección y comprobación |
|---|---|
| Un usuario asignado podía cambiar la definición del plan o el estado de líneas de otros responsables durante el seguimiento. | El servidor conserva acción, responsable, compromiso y recursos; solo permite actualizar estados propios a quien tiene permisos por asignación. Los coordinadores conservan el seguimiento global. Se prueban solicitudes manipuladas y la persistencia del rechazo. |
| La asignación a una línea habilitaba edición general y creación de acciones. | La asignación concede seguimiento, sin permitir crear o editar planes mediante la API. La interfaz oculta la creación y edición que no corresponden. |
| La fecha de seguimiento se actualizaba también en líneas de otros usuarios. | Se conserva la fecha de las líneas ajenas; las fechas se calculan en el servidor. |
| Cambiar recursos, fecha o responsable del tratamiento podía dejar el riesgo y su acción desalineados. | Si la acción ya tiene avance, se crea otra vinculada y se conserva la anterior y su historial. Se prueba el cambio de recursos con avance existente. |
| Una revisión documental podía conservar “Emisión inicial”. | La revisión exige una descripción de cambios distinta a la emisión inicial y al texto de la versión anterior. La emisión nueva mantiene el valor automático. |
| Algunos PDF de Software fallaban cuando “resultados” era texto. | Los generadores distinguen texto de arreglos tabulares. El barrido de vistas previas cubre los perfiles y registros disponibles. |
| Una ruta interna heredada del caso de demostración llamaba al nombre anterior del worker. | Se corrigió la referencia y se ejecutó el escenario completo de dos servicios hasta cobro. El ejemplo sigue fuera del menú. |
| El detalle de una acción de riesgo mostraba cinco porqués vacíos. | Se retiran los campos de causa raíz para acciones de riesgo y se conserva el plan tabular. El cierre se ofrece después del seguimiento y la finalización de líneas. |
| Pruebas antiguas dependían de carpetas temporales desaparecidas y de rutas anteriores al SaaS. | Se agregan un ejecutor reproducible, carpetas temporales portables, fixtures autónomos y comprobaciones de la navegación actual. |

## Familias de flujos ejecutadas

| Familia | Operaciones y controles comprobados |
|---|---|
| Comercial y operación | Cliente, oportunidad, cotización, capacidad, aprobación, aceptación, orden, múltiples ítems y métodos, programación, disponibilidad, reservas, ejecución y entrega. |
| Técnica y metrología | Recepción y custodia, resultados, ambiente, incertidumbre, competencia, muestreo, equipos, salida y retorno, calibración, eventos, bloqueo y aptitud. |
| Informes | Elaboración, revisión de Calidad, autorización técnica, emisión, PDF institucional, anexos, correcciones, enmiendas, entrega y control de duplicados. |
| Compras y almacén | Solicitud, propuestas, comparación y selección, límites de compra, autorizaciones, orden, recepción, inventario, consumo, devolución, activos y depreciación. |
| Finanzas | CxP, CxC, anticipos, pagos parciales, rechazo de sobrepago, presupuesto, asientos balanceados, conciliación, cierres y reaperturas, reversión única, resultados, EBITDA y exportaciones XML ficticias. |
| Personal | Expediente, puesto, contrato, capacitación, calificación, prueba inicial, competencia, vacaciones y nómina. |
| Documentos | Elaboración, PDF opcional cuando aplica, guardar y enviar, devolución, liberación por Calidad, revisión, lectura, obsolescencia y lista maestra vigente. |
| Mejora | Riesgos, quejas y trabajo no conforme con acción independiente obligatoria; líneas del plan, seguimiento, evidencia y eficacia al solicitar cierre, aprobación de Calidad e historial. |
| Auditorías y gestión | Equipo, programa, plan, apertura, lista de verificación, hallazgo, no conformidad y acción, reunión de cierre e informe liberado. Minutas, acuerdos, objetivos, KPIs y encuestas. |
| SaaS y seguridad | Proveedor separado del administrador del laboratorio, alta de clientes, paquetes y casillas, dependencias, suspensión/reactivación, cambio de contraseña y revocación, aislamiento de cookies y datos, perfil, prospectos y consentimiento. |
| Interfaz y confiabilidad | Arranque, reconexión de lecturas, ausencia de repetición automática de escrituras, formularios y detalles, navegación por pestañas, teclado, búsquedas, filtros, buscador oculto en expedientes y revisión visual del alta de riesgo con acción vinculada. |

## Inventario de permisos y estados

Matriz obtenida de los perfiles de prueba. ADM: Administrador; RT: Responsable técnico; CAL: Calidad; COM: Comercial; RH: Recursos humanos; TEC: Técnico; CON: Contabilidad; SIG: Signatario; AUD: Auditor. Las asignaciones de registros y competencias limitan adicionalmente el acceso. Compras y los roles configurables se prueban en los escenarios específicos de compras y autorización. Una licencia SaaS también puede restringir el acceso.

Los estados listados son la definición base. Algunas herramientas usan rutas especializadas, revisiones documentales, estados derivados o registros automáticos protegidos. “Editar” no equivale a autorizar ni permite modificar registros cerrados.

| Módulo / herramienta | Consulta | Edición base | Aprobación base | Estados base |
|---|---|---|---|---|
| Comercial · Clientes (`clients`) | ADM, RT, CAL, COM, TEC, CON, SIG, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Comercial · Cotizaciones (`quotes`) | ADM, CAL, COM, CON, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Revisión → Enviada → Seguimiento → Aceptada |
| Operación · Programación técnica (`services`) | ADM, RT, CAL, COM, TEC, SIG, AUD | ADM, RT, CAL, TEC | ADM, CAL | Por programar → Programado → Ejecución → Revisión técnica → Pendiente de Calidad → Autorizado → Entregado → Cerrado |
| Técnica · Equipos y calibración (`equipment`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | — | Vista, catálogo o registro especializado |
| Técnica · Métodos (`methods`) | ADM, RT, CAL, COM, RH, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Revisión técnica → Pendiente de Calidad → Vigente |
| Técnica · Registros técnicos (`records`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC | — | Vista, catálogo o registro especializado |
| Técnica · Informes y certificados (`reports`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC, SIG | ADM, CAL | Borrador → Pendiente de Calidad → Emitido |
| Recursos humanos · Autorización del personal (`competence`) | ADM, RT, CAL, RH, TEC, SIG, AUD | ADM, RT, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Lista maestra (`documents`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Seguimiento de acciones (`quality`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Abierto → En proceso → Pendiente de Calidad → Cerrado |
| Calidad · AVR · Aseguramiento de la validez de los resultados (`controls`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Compras · Proveedores (`suppliers`) | ADM, RT, CAL, TEC, CON, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de evaluación → Aprobado |
| Compras · Solicitudes de compra (`purchases`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON, SIG | ADM, CAL | Borrador → Recibida solicitud → Cotizando → Pendiente de Administrador → Autorizada → Atendida |
| Técnica · Programa de calibración (`calibrations`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC | ADM, CAL | Programada → Pendiente de Calidad → Autorizada → En ejecución → Revisión técnica → Pendiente de evaluación → Cerrada |
| Calidad · Políticas y procedimientos (`policies`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Técnica · Diseñador de informes (`templates`) | ADM, RT, CAL, COM, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Contabilidad · Catálogo de cuentas (`accounts`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de Calidad → Autorizado |
| Contabilidad · Contabilidad (`accounting`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de Calidad → Contabilizada |
| Recursos humanos · Personal (`employees`) | ADM, CAL, RH | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Recursos humanos · Nómina (`payroll`) | ADM, CAL, RH | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Autorizada |
| Configuración · Usuarios y permisos (`users`) | ADM, CAL | ADM, CAL | — | Vista, catálogo o registro especializado |
| Comercial · Contratos (`contracts`) | ADM, CAL, COM, CON, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Vigente → Finalizado |
| Comercial · Órdenes de servicio (`orders`) | ADM, RT, CAL, COM, TEC, CON, SIG, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Autorizada |
| Almacén · Almacén · inventario (`inventory`) | ADM, RT, CAL, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Almacén · Entradas y salidas (`movements`) | ADM, RT, CAL, TEC, CON, SIG, AUD | ADM, CAL, TEC, CON | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Compras · Evaluaciones de proveedores (`supplierEvaluations`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Requisitos generales (`general`) | ADM, RT, CAL, RH, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Estructura y alcance (`structure`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Técnica · Instalaciones (`facilities`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Técnica · Condiciones ambientales (`environment`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Técnica · Incertidumbre (`uncertainties`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Riesgos y oportunidades (`risks`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Quejas y retroalimentación (`complaints`) | ADM, RT, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Trabajo no conforme (`nonconforming`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Auditorías (`audits`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Revisión por la dirección (`managementReviews`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Software (`system`) | ADM, RT, CAL, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Lista de verificación ISO 17025 (`requirements`) | ADM, RT, CAL, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Operación · Calendario de servicios (`calendar`) | ADM, RT, CAL, COM, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Minutas (`meetings`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Acuerdos de reuniones (`meetingTasks`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON | ADM, CAL | Abierto → En proceso → Pendiente de Calidad → Cerrado |
| Calidad · Objetivos y KPIs (`kpis`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Mediciones de KPIs (`kpiMeasurements`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Configuración · Roles y permisos (`roles`) | ADM, CAL | ADM, CAL | — | Vista, catálogo o registro especializado |
| Configuración · Identidad del laboratorio (`labSettings`) | ADM, CAL | ADM, CAL | — | Vista, catálogo o registro especializado |
| Configuración · Manuales del sistema (`manuals`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Calidad · Satisfacción del cliente (`surveys`) | ADM, CAL, AUD | ADM, CAL | — | Vista, catálogo o registro especializado |
| Calidad · Resultados de satisfacción (`surveyResponses`) | ADM, CAL, AUD | ADM, CAL | — | Vista, catálogo o registro especializado |
| Comercial · CRM · prospectos (`crm`) | ADM, CAL, COM | ADM, CAL, COM | — | Vista, catálogo o registro especializado |
| Contabilidad · Centros de gasto (`costCenters`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Compras · Cotizaciones de proveedores (`purchaseBids`) | ADM, CAL, CON | ADM, CAL | — | Vista, catálogo o registro especializado |
| Compras · Órdenes de compra (`purchaseOrders`) | ADM, CAL, CON | ADM, CAL | ADM, CAL | Borrador → Autorizada → Recibida |
| Contabilidad · Cuentas por pagar (`payables`) | ADM, CAL, CON | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Contabilidad · Cuentas por cobrar (`receivables`) | ADM, CAL, CON | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Contabilidad · Pagos y cobros (`settlements`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de Administrador → Autorizado |
| Contabilidad · Presupuestos por centro (`budgets`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de Administrador → Autorizado |
| Almacén · Vehículos y activos fijos (`assets`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Administrador → Autorizado |
| Contabilidad · Depreciación y baja de activos (`depreciations`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de Administrador → Autorizado |
| Operación · Combustible (`fuel`) | ADM, RT, CAL, TEC, CON | ADM, RT, CAL, TEC | ADM, CAL | Borrador → Pendiente de Administrador → Autorizado |
| Recursos humanos · Solicitudes de viáticos (`travelRequests`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON, SIG | ADM, CAL, RH | Borrador → Pendiente de RH → Pendiente de Administrador → Autorizada |
| Recursos humanos · Administración de viáticos (`travelAdmin`) | ADM, CAL, RH, CON | ADM, CAL, RH, CON | ADM, CAL | Abierto → Pendiente de Administrador → Comprobado → Cerrado |
| Contabilidad · Anticipos de clientes (`advances`) | ADM, CAL, CON | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Compras · Pagos programados (`scheduledPayments`) | ADM, CAL | ADM, CAL | — | Vista, catálogo o registro especializado |
| Almacén · Asignaciones y resguardos (`assetAssignments`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Lecturas de documentos (`documentReadings`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | — | Vista, catálogo o registro especializado |
| Compras · Seguros y renovaciones (`insurancePolicies`) | ADM, CAL, CON | ADM, CAL | ADM, CAL | Borrador → Pendiente de Administrador → Autorizado |
| Operación · Recepción de ítems (`itemReceipts`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC, SIG | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Operación · Custodia y entrega de ítems (`itemCustody`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL, TEC, SIG | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Técnica · Cambios técnicos de ítems (`itemChanges`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Técnica · Expediente y liberación de equipos (`equipmentEvents`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Muestreo · Planes de muestreo (`samplingPlans`) | ADM, CAL | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Autorizado |
| Muestreo · Registros e informes de muestreo (`samplingRecords`) | ADM, CAL | ADM, CAL | ADM, CAL | Borrador → Revisión técnica → Pendiente de Calidad → Autorizado |
| Recursos humanos · Anticipos, préstamos y conceptos de nómina (`personnelMovements`) | ADM, CAL, RH | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Administrador → Autorizado |
| Operación · Órdenes de entrega / envío (`deliveryOrders`) | ADM, RT, CAL, COM, TEC, SIG | ADM, RT, CAL, COM, TEC, SIG | ADM, CAL | Pendiente de entrega → Entregado |
| Recursos humanos · Programa anual de capacitación (`training`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Programada → Completada |
| Recursos humanos · Solicitudes de vacaciones (`vacations`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL | Borrador → Pendiente de jefe directo → Autorizada |
| Recursos humanos · Contratos laborales (`employmentContracts`) | ADM, CAL, RH | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Administrador → Autorizado |
| Operación · Expediente legal (`legalDocuments`) | ADM, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Comercial · Tarifas (`tariffs`) | ADM, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Comercial · Plan de negocio (`businessPlans`) | ADM, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Comercial · Solicitudes no atendidas (`unattendedRequests`) | ADM, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Revisada |
| Comercial · Reportes semestrales (`semiannualReports`) | ADM, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Listo para envío |
| Operación · Acreditación y aprobación (`complianceCases`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Operación · Cambios regulatorios del alcance (`regulatoryChanges`) | ADM, RT, CAL, AUD | ADM, RT, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Cerrado |
| Operación · Suspensión de alcance (`scopeRestrictions`) | ADM, RT, CAL, TEC, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Comercial · Listados y envío de tarifas (`tariffLists`) | ADM, CAL, COM, AUD | ADM, CAL, COM | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Recursos humanos · Descripciones de puestos (`jobDescriptions`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Recursos humanos · Organigrama (`organigrams`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Recursos humanos · Calificación del personal (`qualifications`) | ADM, RT, CAL, RH, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Recursos humanos · Pruebas iniciales de desempeño (`initialPerformance`) | ADM, RT, CAL, RH, AUD | ADM, CAL, RH | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · No conformidades (`nonconformities`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Planes de auditoría (`auditPlans`) | ADM, RT, CAL, AUD | ADM, CAL, AUD | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Equipo auditor (`auditTeam`) | ADM, RT, CAL, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Reuniones de auditoría (`auditMeetings`) | ADM, RT, CAL, AUD | ADM, CAL, AUD | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Informes de auditoría (`auditReports`) | ADM, RT, CAL, AUD | ADM, CAL, AUD | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Calidad · Verificaciones de auditoría (`auditChecks`) | ADM, RT, CAL, AUD | ADM, CAL, AUD | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Comercial · Ventas (`sales`) | ADM, CAL, COM, CON | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Operación · Tablero de servicios (`kanban`) | ADM, RT, CAL, COM, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Recursos humanos · Personal (`personnel`) | ADM, RT, CAL, COM, RH, TEC, CON, SIG, AUD | ADM, CAL | ADM, CAL | Borrador → Pendiente de Calidad → Vigente |
| Contabilidad · Control fiscal (`fiscal30`) | ADM, CAL, CON | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Configuración · Preparación de implementación (`readiness30`) | ADM, RT, CAL, CON, AUD | ADM, CAL | — | Vista, catálogo o registro especializado |
| Operación · Ejemplo de servicio (`demo30`) | — | — | — | Vista, catálogo o registro especializado |
| Contabilidad · Comprobantes fiscales (`cfdis30`) | ADM, CAL, CON | ADM, CAL, CON | — | Vista, catálogo o registro especializado |
| Contabilidad · Obligaciones fiscales (`taxObligations30`) | ADM, CAL, CON | ADM, CAL, CON | ADM, CAL, CON | Borrador → Pendiente de autorización → Presentada |

## Ejecución reproducible

```bash
python3 scripts/assemble.py
node scripts/audit-tests.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

Los registros detallados de ejecución se generan bajo `/tmp/cubolabs-audit`. El resumen de esta revisión se conserva en `docs/workflow-audit-results.json`. Las pruebas necesitan el runtime de PDF indicado en los scripts, o su adaptación a la instalación externa.

La prueba visual realizada en la aplicación local confirmó el guardado de un riesgo, el folio independiente de su acción, sus datos completos y la ocultación del buscador al abrir ambos expedientes. No se ejecutaron todas las combinaciones de dispositivo y navegador ni integraciones externas reales.
