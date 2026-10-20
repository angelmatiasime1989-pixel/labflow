# Protección civil · membresía Avanzado

Herramienta para terceros acreditados que elaboran Programas Internos de Protección
Civil (PIPC). Se añade al árbol existente; no sustituye módulos ni reconstruye el
sistema. Solo Avanzado incluye `civilProtection`; Básico y Medio conservan sus
paquetes. El servidor aplica membresía y permisos a datos, edición y PDF.

## Programas

Registrar primero al cliente en Comercial. En Protección civil → Programas internos
de PC se administra cada establecimiento: domicilio, jurisdicción/autoridad,
superficies, responsable, tercero acreditado, número y autoridad del registro,
vigencia de acreditación, compromiso, vigencia del programa, folio de autoridad y
observaciones. Estados: Por iniciar, Levantamiento, Elaboración, Revisión,
Entregado, Ingresado a autoridad, Con observaciones, Aprobado y Cancelado.

Cada cambio de estado requiere motivo y conserva historial con usuario y fecha.
Aprobado exige folio de autoridad capturado; esto no verifica su autenticidad.
La acreditación no puede estar vencida al registrar un programa nuevo. El historial
existente puede seguirse consultando; no se borra por vencimiento o cambio de plan.
La interfaz permite búsqueda por cliente/folio y filtrado por estado, y señala
registros fuera de fecha. Hay exportación PDF individual.

## Cotizar Programas de PC

La cotización es independiente del flujo de ensayos/calibraciones, que se conserva.
Incluye cliente, inmueble, jurisdicción, vigencia y condiciones. Todas las tarifas
son configurables por cotización; no se presentan precios como tarifas oficiales.

- Elaboración base (MXN).
- Construcción: m² × tarifa por m².
- Terreno: m² × tarifa por m².
- Sustancias: nombre, tipo, cantidad, unidad y tarifa adicional por unidad.
- Conceptos repetibles de Capacitación, Simulacro y Otro: descripción, cantidad,
  precio unitario. Se pueden añadir o quitar filas.
- Descuento en MXN e IVA configurable (16% inicial).

El servidor vuelve a calcular importes; ignora totales enviados por el navegador.
Redondea cada línea a centavos, resta descuento y calcula IVA. Rechaza cantidades
negativas/no finitas, descuentos superiores al subtotal y valores fuera de límites.
Máximo 50 sustancias y 50 conceptos por cotización. La clasificación y la tarifa de
sustancias las define el tercero: no se infiere riesgo oficial ni cumplimiento.

Flujo: Borrador → Enviada → Aceptada/Rechazada/Cancelada. Una cotización enviada
no permite cambiar el alcance ni sus precios; debe crearse otra. Los cambios de
estado quedan motivados en historial. El PDF conserva desglose e importes.
Desde una cotización aceptada se crea un programa vinculado, completando los datos
de acreditación y responsabilidad. La operación evita crear dos programas por
reintento de la misma cotización. No genera cargos, CFDI o cobros automáticamente.

## Roles, datos y despliegue

Administrador, Calidad y Comercial pueden gestionar el módulo en Avanzado; los
roles configurables pueden recibir permisos mediante la administración existente.
Los datos permanecen dentro del estado y bucket de cada empresa. No hay registro
compartido entre clientes. Retirar Avanzado oculta y bloquea el módulo y sus PDF;
volver a contratarlo recupera los registros. Los respaldos administrativos completos
conservan datos para recuperación. Los respaldos anteriores sin campos PC se admiten
como colecciones vacías al importar.

Los ensambladores Python y Node incluyen los archivos pc-model.js, pc-domain.js y
pc-ui.js; la aplicación de Workers y el servidor Node utilizan el mismo bundle.
En la demo temporal se accede por el laboratorio demo-avanzado, con un cliente,
una cotización aceptada y un programa vinculados, todos ficticios; se mantienen los
avisos de datos ficticios y su eliminación al reiniciar. La demo pública sigue
siendo compartida y no sirve para documentos ni acreditaciones reales.

Pruebas: npm run build; npm test (incluye test:pc). Se comprueban cálculo, estados,
acreditación, conversión, PDF, aislamiento, planes y revocación/restauración de acceso.
No se ha publicado ni ejecutado una migración en producción. Se requiere desplegar
la versión actualizada y mantener respaldo previo. Las colecciones nuevas se
inicializan de forma aditiva por el mecanismo existente al cargar datos.

Este módulo controla la elaboración y seguimiento; no redacta por sí solo un PIPC
completo, no consulta padrones oficiales y no determina requisitos municipales o
estatales. Los documentos, dictámenes y aprobación deben revisarse por los terceros
y autoridades competentes según la jurisdicción de cada inmueble.
