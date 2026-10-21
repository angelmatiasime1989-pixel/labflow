# Planes configurables, pagos SaaS y correcciones

Fecha: 21 de octubre de 2026. Rama: `feat/saas-plans-billing-fixes`.
Cambios sobre la aplicación existente; sin reconstrucción, datos reales ni despliegue.

## Uso de las nuevas funciones

1. En Administración SaaS, abre **Planes y funciones**. Elige Básico, Medio o
   Avanzado, marca las funciones y guarda. Se presenta una casilla por herramienta,
   agrupada por módulo. Usuarios, roles e identidad son esenciales. Las referencias
   obligatorias se seleccionan automáticamente; desactivar una referencia desactiva
   también sus funciones dependientes antes de guardar.
2. Los cambios crean una versión del plan y se aplican a todos sus clientes.
   Conservan registros, archivos e historial. Los permisos se comprueban en el
   servidor, incluidas las descargas. No son contratos congelados por cliente:
   modificar un plan cambia sus accesos inmediatamente. Protección Civil se mantiene
   exclusivo de Avanzado, como se solicitó anteriormente.
3. En **Clientes → Administrar → Cargos, pagos e historial**, registra el concepto,
   periodo, importe y vencimiento del cargo. Después registra pagos totales o
   parciales con método y referencia. El panel muestra cargos, cobros, saldo,
   vencidos e historial por cliente. Los importes se conservan en centavos MXN;
   las fechas usan el calendario del servidor en `America/Mexico_City`.
4. Un error se corrige con **Anular**, indicando el motivo. El movimiento original
   permanece. Antes de anular un cargo con pagos hay que anular sus pagos.
   No se admite pagar más que el saldo. Los reintentos con el mismo identificador
   no duplican movimientos y no pueden cambiar su contenido.

Este panel registra pagos manuales del servicio SaaS. No procesa tarjetas, no
carga cuentas, no emite CFDI y no suspende automáticamente laboratorios por deuda.
Es independiente de la cobranza de los clientes de cada laboratorio.

## Correcciones del informe anterior

| Hallazgo | Cambio aplicado | Límite o seguimiento |
| --- | --- | --- |
| F01: sesiones reactivadas por restauración | Generación de sesiones fuera del JSON restaurable. JSON/ZIP conservan las identidades y roles actuales; usuarios históricos ausentes quedan inactivos. Se exige iniciar sesión de nuevo. La recuperación integral SQLite y la importación portable eliminan sesiones restauradas. | Una recuperación integral recupera las contraseñas del snapshot: revisar identidades y rotar credenciales antes de reabrir el servicio. |
| F02: contraseña aplicada con respuesta 409 | Se guarda una intención durable junto al cliente antes de cambiar credenciales. Se reanuda ante fallos y evita aplicar dos veces el cambio; una secuencia impide repetir cambios antiguos sobre nuevos. El panel muestra operaciones pendientes. | No convierte R2 en una base transaccional. Un fallo de almacenamiento puede dejar una operación pendiente hasta recuperar el servicio. |
| F03: correo antiguo fuera de reintentos | Procesamiento desde los pendientes más antiguos, lotes de 40, sin recorte de pendientes a 500. Se respetan los envíos aceptados, bloqueo concurrente e idempotencia del proveedor. Historial consultable por páginas. Enlaces por laboratorio. | Aceptado por proveedor no significa entregado. Webhooks de entrega/rebote y alertas externas pendientes. |
| F04: cotización PC vencida | Se bloquea envío/aceptación vencidos. Nueva propuesta vinculada a la anterior para renovar vigencia y precios sin alterar la original. | No se introducen excepciones silenciosas de vigencia. |
| F05: aprobación PC sin expediente | Etapas controladas, adjuntos PDF por tipo, revisión por otra persona con perfil Administrador/Calidad, folio y fecha y PDF de autoridad antes de aprobar. Alcance revisado protegido. | Es registro manual de evidencia; no verificación electrónica de una autoridad ni dictamen de cumplimiento por jurisdicción. |
| F06: demo pública en producción | Arranque normal y `dev` usan el servidor privado. Demo explícita `start:demo`; se rechaza si `LABFLOW_ENV=production`. Salud Node distingue demo/privado. | Configurar la variable y usar recursos/dominio separados en hosting. No se cambió el proyecto de GoDaddy. |
| F07: historial bloqueado | Se elimina el bloqueo al superar 500 entradas PC; no se borran entradas. Se mejora la recuperación ante conflictos. | Persisten JSON por laboratorio, conflictos entre objetos y crecimiento de respaldos/colas; requieren carga, retención y evolución de persistencia. |
| F08: PDF PC cambia al editar maestros | Al enviar una nueva cotización se guarda snapshot del emisor/cliente y PDF original con SHA-256, incluido en ZIP. Descarga verifica su huella. | No se inventan originales de propuestas históricas ya emitidas. Mejoras de membrete/tipografía y archivo inmutable de todas las clases de documentos pendientes. |
| F09: capacidades comerciales/operativas | Panel manual de cobros e historial por cliente. | MFA, varios superadministradores, recuperación autoservicio, pasarela/renovación automática, SAT/PAC, protección perimetral y alertas externas pendientes. |
| F10: pruebas fragmentadas | El comando de regresión ejecuta las 30 suites históricas en copia aislada. Fixtures portables, expectativas actualizadas de sesión/PC/interfaz y CI de build, pruebas, paridad de ensambladores y artefacto. | CI se configura en GitHub con el push. No se configura despliegue automático ni se sustituyen pruebas de carga. |

También se corrigió un fallo de alta de usuarios en laboratorios nuevos cuyo
administrador no tenía correo, y una discrepancia de fecha UTC/México en pagos.

## Validación realizada

- `npm run build`: artefacto ESM válido para el adaptador Node y Worker.
- `npm test`: SaaS, seguridad, planes/cobros, regresiones, VPS, PC y demo aprobados.
- 30/30 suites históricas de flujos, con pruebas sobre copias sintéticas aisladas.
- 35 casos automatizados actuales: 8 seguridad, 9 planes/pagos/correcciones,
  6 VPS, 8 Protección Civil y 4 demo. Tres casos de planes/correo/fecha y el bloqueo de demo en producción se
  ejecutaron adicionalmente después de ampliar la suite.
- Sondas: 550 correos sin omisiones/duplicados; reintento programado de dos colas
  de 50 mensajes con enlaces independientes; conflictos en ambas fases del
  cambio de contraseña; restauraciones JSON/ZIP y revocación; comprobación de
  permisos de archivo tras quitar/reactivar funciones; conservación de datos;
  original PDF estable aunque cambien los datos maestros.
- Chromium: cambio real de casillas guardado y recuperado, cargo de $1,200 y pago
  parcial de $400 con saldo $800, otro cliente intacto, sin excepciones JavaScript.
- Docker local: imagen construida, login, reinicio con persistencia y respaldo /
  recuperación SQLite verificados. Solo contenedor y volumen de prueba propios.
- Ensambladores Node/Python comparados byte a byte; `git diff --check` sin errores.

Las pruebas simulan el proveedor de correo: no envían mensajes reales ni cobran.
No se ha validado entrega de correo real, TLS/dominio de GoDaddy, persistencia del
plan gratuito, carga comercial ni requisitos de la autoridad local.

## Configuración que requiere el futuro despliegue

- Node 24.19.x, `PUBLIC_ORIGIN`, `DATA_DIR` persistente y `SAAS_ADMIN_AUTH` o su
  archivo secreto. Ninguna contraseña nueva ni secreto de hosting en Git.
- Normal: `npm start` / `npm run dev` privados. Demo: `npm run start:demo`, datos
  efímeros. En producción configurar `LABFLOW_ENV=production` y verificar salud.
- Correo opcional: `EMAIL_FROM` verificado y `RESEND_API_KEY` como secreto. Node
  reintenta cada dos minutos; para Workers activar el cron del ejemplo Wrangler
  en el entorno contratado. Sin proveedor configurado no se intenta enviar.
- Respaldar **todos** los objetos o SQLite, incluido `saas/platform-v1.json`:
  allí están planes, cargos/pagos, bitácora e intenciones. El ZIP de un laboratorio
  no contiene la administración financiera del proveedor.
- Mantener copia externa cifrada, alertas de espacio/errores y simulacro de
  recuperación antes de usar datos reales. Ningún recurso externo se creó aquí.

## Aplicación y reversión

Probar esta rama en staging con una copia sintética. Respaldar íntegramente el
almacenamiento antes de actualizar y comprobar acceso, descarga, planes y cobros.
No se requiere ejecutar una migración manual: los campos nuevos son aditivos y
los planes existentes conservan sus accesos iniciales al cargarse.

Para revertir una selección, restaurar sus casillas y guardar otra versión; no
borrar registros. Antes de revertir código conservar una copia del estado actual.
Las versiones anteriores no aplican licencias por función ni muestran cobros, por
lo que no es seguro retroceder en un servicio abierto. Usar mantenimiento y una
versión corregida compatible; restaurar una copia completa solamente si se acepta
perder explícitamente los movimientos posteriores. Una restauración no equivale
a deshacer un pago: utilizar su anulación trazable.

`main`, la rama de preview y los recursos de producción no se modificaron.
Los cambios están preparados para revisión en la rama independiente indicada.
