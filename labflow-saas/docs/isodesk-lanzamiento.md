# isoDesk: interfaz, accesos y preparación comercial

Fecha: 30 de octubre de 2026, zona America/Mexico_City.
Rama de trabajo: `feat/isodesk-commercial`. Evolución de LabFlow; sin reconstrucción.

## Resultado

- `/`: landing pública de **isoDesk**, con solución, recorrido de trabajo, planes,
  preguntas frecuentes y acceso al sistema. Presentación azul oscuro con acentos
  dorados y componentes propios. La ilustración lleva información explícitamente
  de ejemplo; no se publican cifras de clientes, certificaciones ni precios inventados.
- `/acceso`: ingreso central con identificador del laboratorio, usuario y contraseña.
  No existe directorio público de clientes ni usuarios. El enlace directo existente
  `/laboratorio/identificador/` sigue funcionando con usuario y contraseña.
- `/admin/`: acceso separado al proveedor, enlazado en landing y portal. Continúan
  disponibles altas, membresías por función y seguimiento/historial de pagos.
- Marca isoDesk en las pantallas de acceso, laboratorio y administración. Los PDF
  institucionales conservan la identidad configurada por cada laboratorio.
- Menú lateral retráctil en laboratorio y administración. En escritorio conserva
  iconos y recuerda su estado en el navegador. En móvil es un panel superpuesto,
  con fondo, cierre con Escape y por navegación, y controles accesibles.

La referencia `repindsa-app.com` devolvió 403 en este entorno. No se pudo comprobar
su apariencia. Se aplicó una propuesta propia con los colores y la dirección visual
solicitados; no se afirma una reproducción visual verificada de ese sitio.

## Móvil con comportamiento de aplicación

- Encabezado compacto y navegación inferior: Inicio, Trabajo, Avisos, Archivos y
  Menú, adaptados a los permisos disponibles. El proveedor tiene Inicio, Clientes,
  Planes y Menú.
- Accesos táctiles, zona segura del teléfono, indicadores de sección activa y menú
  superpuesto. La búsqueda se sitúa dentro del contenido, sin cruzar la pantalla.
- Indicadores secundarios y consultas extensas se agrupan en un panel desplegable
  para que el inicio móvil priorice el trabajo del día, sin retirar funciones.
- Listados simples se presentan como tarjetas etiquetadas sin quitar campos ni
  acciones. Las tablas de captura/complejas conservan desplazamiento horizontal.
- Formularios como paneles inferiores con acciones visibles y campos de 16 px para
  evitar zoom automático. Notificaciones y avisos quedan por encima de la barra.
- Manifiesto e iconos de 192/512 px para agregar isoDesk a la pantalla de inicio.
  Se abre en modo independiente donde el navegador lo admite. No es una app nativa
  ni promete funcionamiento sin conexión. No se añade caché de datos privados.
- El cierre de sesión sigue disponible en el menú móvil. Solo se persisten la
  preferencia del menú y, si el usuario lo solicita, el identificador del laboratorio.
  No se guardan contraseñas en localStorage.

## Flujos simplificados conservando controles

| Antes | Ahora | Control conservado |
| --- | --- | --- |
| Inicio general sin acceso a tareas frecuentes | Atajos por permisos a cotizar, servicios, informes, documentos y PC | Roles, membresía y validaciones del servidor |
| Laboratorio nuevo sin secuencia visible | Guía: identidad → equipo/perfiles → primer cliente/cotización | No se inventan registros ni se omiten revisiones |
| Iconos sin suficiente contexto | Etiquetas y guía de trabajo; navegación inferior en móvil | Todos los módulos existentes siguen disponibles |
| Tablas anchas en teléfono | Tarjetas para listados compatibles | Datos y botones preservados |
| Página raíz abre la administración | Landing → acceso al laboratorio; enlace administrativo separado | Sesiones administrativas y de clientes independientes |

La lógica técnica, las etapas obligatorias, la revisión independiente y las
comprobaciones de evidencias permanecen. Simplificar navegación no habilita saltos
entre estados ni autorizaciones automáticas.

## Seguridad y conservación de datos

El ingreso central exige mismo origen, HTTPS fuera de loopback, cuerpos limitados,
validación del identificador y limitación persistente de intentos con escritura CAS.
Las respuestas de credenciales incorrectas, espacio inexistente o suspendido son
iguales. La sesión resultante conserva HttpOnly, Secure, SameSite y Path por
laboratorio. No concede permisos administrativos ni utiliza identidad de ChatGPT.

Se corrigió un riesgo adicional: un laboratorio contratado cuyo JSON desaparece
ahora responde 503 y solicita recuperar almacenamiento; no se recrea con datos del
conjunto de pruebas. La portada tampoco crea clientes, estados ni registros.

Se conservaron nombres de claves, UUID, tokens, cookies, formatos de respaldo,
registros y archivos para compatibilidad. El código de fixtures/demo permanece
para pruebas aisladas; no es el arranque productivo, no aparece en las páginas
públicas y no añade un acceso automático al proveedor.

## Validaciones

Resultado: build aprobado, 47 casos automatizados y 30/30 suites históricas
aprobados, además de recorridos en Chromium con datos ficticios.

- Build Node y validación ESM; ensambladores Node/Python comparados byte a byte.
- Suite habitual SaaS, seguridad, planes/pagos, VPS/SQLite, PC y fixtures de demo.
- Pruebas nuevas: portada/rutas, login central y aislamiento, cookies, errores
  indistinguibles, CSRF/TLS/límites, no almacenar contraseñas, enlaces configurables,
  protección frente a pérdida de datos, manifiesto/iconos y navegación retráctil/móvil.
- 30 suites históricas se ejecutan con la fecha del laboratorio sintético fijada
  en 20 de octubre de 2026. Sus calibraciones vencían días después: el arnés ahora
  es reproducible. **El reloj de la aplicación y las suites SaaS/VPS/seguridad
  actuales no se alteran.** Se actualizó un mock DOM para los atributos nuevos.
- Chromium con datos ficticios: landing en escritorio y 390 px, ingreso real,
  navegación, colapso/expansión y memoria al recargar, panel móvil/Escape, tarjetas
  sin desbordamiento horizontal y administración. Sin excepciones JavaScript.
- No se utilizaron datos reales, migraciones ni despliegues de producción.

## Dictamen de comercialización

**Preparado en código para validación de lanzamiento; no se certifica listo para
abrir a clientes reales con la infraestructura actual sin comprobar lo siguiente.**

| Prioridad | Pendiente | Criterio de aceptación |
| --- | --- | --- |
| Bloqueante | Hosting definitivo y Node 24.19.x | Arranque privado estable, HTTPS válido y dominio confirmado |
| Bloqueante | Volumen persistente y secretos | Reinicio/redespliegue conserva clientes, archivos, planes y cobros; credenciales solo en panel/secreto |
| Bloqueante | Recuperación externa | Copia íntegra fuera del servidor y simulacro con checksum, archivos, planes y pagos restaurados |
| Bloqueante comercial | Contacto y precios/alcance | Canal real de ventas, precios y condiciones aprobados; los planes personalizados coinciden con lo contratado |
| Bloqueante legal | Aviso y términos | Responsable, tratamiento de datos, condiciones, soporte y cancelaciones revisados profesionalmente |
| Alta | Monitoreo y operación | Alertas externas de caída, errores, disco/almacenamiento y verificación de restauración |
| Alta | Seguridad privilegiada | MFA o control externo equivalente, recuperación y riesgos operativos revisados antes de abrir |
| Alta | Pruebas de aceptación/carga | Recorridos con expedientes sintéticos representativos y dispositivos reales iOS/Android |
| Siguiente etapa | Cobro recurrente automático | El panel actual es manual: no pasarela, renovaciones, CFDI ni suspensión automática |
| Siguiente etapa | Escala y retención | JSON por laboratorio y respaldos acumulados requieren dimensionamiento y política externa |

No se verificaron producción de GoDaddy, entrega real de correo, persistencia del
plan gratuito, dispositivos físicos ni procesos PAC/SAT/autoridades. La estética
nueva no resuelve esos pendientes.

## Configuración y comprobación

`npm start` y `npm run dev` usan el servidor privado en esta rama. Configurar en
hosting, nunca en Git:

- `PUBLIC_ORIGIN`, `DATA_DIR` persistente, `SAAS_ADMIN_AUTH` o su archivo secreto,
  `PORT` asignado por el proveedor y `LABFLOW_ENV=production`.
- `SALES_CONTACT_URL`: HTTPS de un canal comercial o `mailto:correo-aprobado`.
- `PRIVACY_POLICY_URL`: HTTPS del aviso aprobado. Hasta configurarlos no se generan
  enlaces ficticios. Se solicitó al propietario el contacto y los precios.
- Correo opcional: remitente verificado y `RESEND_API_KEY` como secreto.

`npm run check:launch` revisa configuración sin desplegar, migrar ni abrir SQLite.
En el entorno de desarrollo devuelve pendientes por ausencia de configuración real,
lo cual es esperado. Las variables de confirmación del ejemplo se habilitan solo
tras verificar persistencia, copia externa/simulacro, monitoreo, condiciones legales
y seguridad. **Marcar una variable no demuestra que el servicio externo funcione.**
El preflight de este cambio está orientado al hosting Node; Workers requiere además
validar bindings R2, secretos, dominio y cron en su entorno real.

## Entrega y reversión

1. Revisar la rama y los pendientes anteriores. Conservar copia completa de todos
   los objetos, incluido `saas/platform-v1.json`, archivos y SQLite si aplica.
2. Probar en staging privado con los secretos y volumen correctos. Un hosting
   efímero no debe convertirse en “productivo” ocultando el aviso de pruebas.
3. Autorizar el lanzamiento después de comprobar TLS, reinicio, restauración,
   aislamiento, acceso/descargas y contratos. No modificar recursos reales antes.
4. Revertir la versión de código si es necesario, manteniendo almacenamiento y
   copias actuales. Los accesos directos y datos antiguos siguen compatibles.
   No retroceder registros o pagos para deshacer un cambio visual.

`main` permanece intacta. No se publicó esta versión ni se borraron datos.
