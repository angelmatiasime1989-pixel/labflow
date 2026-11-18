# Entrega para revisión: página comercial, prueba documental y PWA

Estado: cambios en una rama de trabajo, sin publicación en producción. Base: `main` después de la restauración de la versión operativa. No se cambia el arranque ni el backend SQLite existente a MySQL. No se modifican datos, secretos, recursos de Hostinger ni registros reales.

Decisiones recibidas: el propietario completará manualmente los datos y canal comercial. Las copias offline **no vencen por tiempo**; permanecen y se actualizan con internet. Cierre de sesión, cambio de cuenta/laboratorio, borrado explícito y revocación conocida al reconectar retiran las copias, de acuerdo con las restricciones del encargo.

## 1. Página comercial

- Marca visible Qubo Labs en portada, acceso del laboratorio, panel del proveedor, títulos y páginas legales. Se conservan rutas, nombres internos de archivos, claves de almacenamiento y enlaces existentes.
- Se distinguen Agendar demo, la consulta por un plan y la prueba inmediata de control documental. Las consultas no contratan ni cobran. Las citas no se presentan como reservadas antes de acordarlas.
- Formularios de demo/contacto: nombre, laboratorio/organismo, correo y objetivo obligatorios; teléfono, membresía, modalidad y preferencias de cita opcionales. Los controles muestran carga, error y reintento; no se vacían antes de confirmar aceptación. La privacidad y las novedades tienen casillas separadas; novedades inicia desmarcada.
- Canal configurable: CRM privado existente (`inbox`), o CRM más notificación aceptada por Resend (`resend`). Idempotencia por solicitud y clave de entrega; si el proveedor rechaza el correo no se muestra éxito. El prospecto pendiente se conserva para reintentar sin crear otro expediente. No se han enviado correos reales durante las pruebas.
- Los formularios requieren activación explícita, datos del responsable y aprobación explícita de los textos legales desde `/admin`. La versión del consentimiento se conserva. El correo comercial y credenciales nunca se incluyen en JavaScript público.
- Silver, Gold, Platinum, Diamond y Enterprise Custom se mantienen. Precios y funciones proceden del catálogo existente; IVA y descuento anual confirmado del 10% se consolidan en `commercial-terms.json`. Se muestran audiencia y capacidades añadidas. Las consultas conservan plan y modalidad elegidos. Enterprise requiere propuesta; no se anuncian cuotas de almacenamiento.
- Comparación accesible con región desplazable y encabezados de tabla, validada a 390 px. Usuarios ilimitados y marca configurable se conservan en todos los niveles. Los términos dejan de describir Básico/Medio/Avanzado o límites de usuarios.
- FAQ pública, indexable y en sitemap, con enlaces desde menú, pie, planes y acceso. Incluye contratación, migración desde Excel, acceso, soporte, privacidad, exportación/cancelación, Qubito e instalación. No inventa un SLA ni plazos de retención al cancelar. Un respaldo JSON no se anuncia como sustituto de adjuntos.
- Blog: cada artículo termina con un siguiente paso relacionado. Se conservan las capturas reales de demostración y se explicita el recorrido cotizar → programar → ejecutar → revisar → emitir con permisos. Qubito sigue rotulado como simulación y su disponibilidad real depende del plan y autorización individual.
- Corrección de seguridad adicional: la descarga directa de adjuntos comprueba permiso del módulo además del registro. Ayuda, páginas legales y assets públicos funcionan también desde los subdominios de laboratorio sin confundirlos con rutas privadas.

Componentes: `worker/cubolabs-landing.html`, `commercial-memberships.json`, `commercial-terms.json`, `memberships.js`, `public-faq.json`, `public-faq.js`, `sales-channel.js`, `blog.js`, `saas-admin.html`, `cubolabs-ui.js`, `offline-ui.js`, `server/seo.mjs`, accesos y ensamblador Node. El artefacto `worker/index.js` se regenera; la copia `labflow-saas` se sincroniza desde las fuentes.

### Configuración comercial manual

```env
SALES_ENABLED=false
SALES_CHANNEL=inbox
SALES_TO=
```

Para activar el CRM como canal, completar el responsable en Datos legales del administrador, revisar y aprobar los textos y cambiar `SALES_ENABLED=true`. Para correo: `SALES_CHANNEL=resend`, `SALES_TO`, `RESEND_API_KEY` y `EMAIL_FROM` con remitente verificado. No se activa correo por el mero hecho de escribir una dirección en el aviso. Probar una entrega de aceptación en revisión antes de abrir producción.

Pendiente del negocio: identidad, domicilio, correo, encargados/ubicaciones del tratamiento, condiciones de soporte, exportación, retención contractual y cancelación, alcance y condiciones de infraestructura de Enterprise. Los textos son una versión para revisión; no se afirma aprobación jurídica ni cumplimiento automático.

## 2. Prueba documental pública de 24 horas

Ruta: `/prueba-documental`; API separada: `/api/trial/document`. Laboratorio y procedimiento ficticios, cuatro campos editables, vista previa, borrador, listado, revisión y reapertura. No hay publicación, aprobación ni emisión real. El aviso solicitado aparece antes de los campos. Tras guardar se muestra el vencimiento en la hora local; el servidor conserva la fecha original aunque se edite o recargue.

### Aislamiento y eliminación

- Cookie de 256 bits impredecible, privada HttpOnly, SameSite Strict y Secure bajo HTTPS. Recuperación sólo por cookie; no se acepta un ID de otro borrador en la URL.
- Un documento por sesión. Validación de origen, tipos, revisión, campos, tamaño, frecuencia y capacidad. Límite de 12 KB por petición desde el servidor HTTP; límite interno por campo. La API no tiene acciones de aprobación ni operaciones sobre laboratorios.
- SQLite dedicado, fuera de código, datos operativos y respaldos. No se guarda el contenido en `objects` ni en los respaldos operativos. El contenido se cifra AES-256-GCM con una clave derivada del secreto de la cookie; el servidor no persiste ese secreto. No se añade analítica ni registro de cuerpos o cookies.
- Cada lectura/guardado verifica el vencimiento del servidor. Al vencer devuelve 410 incluso antes de la limpieza física. No se amplía el plazo al editar.
- Temporizador de expiración, barrido periódico y limpieza al arrancar. `npm run trial:cleanup` permite mantenimiento independiente de la aplicación; genera sólo fecha y número de filas eliminadas. Se prueba con el proceso web detenido.
- No se usan cachés persistentes ni almacenamiento offline para el contenido de prueba. La página no guarda los campos en localStorage/IndexedDB. Se retiran también las vistas en memoria cuando el reloj sincronizado indica vencimiento.
- La eliminación del almacenamiento gestionado por la aplicación no promete borrar capturas, copias manuales, snapshots o respaldos del proveedor ajenos a su control. El cifrado reduce la exposición de copias del archivo dedicado; no se ofrece una garantía física sobre la infraestructura de terceros.

### Activación, todavía pendiente en producción

```env
PUBLIC_TRIAL_ENABLED=false
PUBLIC_TRIAL_DB=
```

La ruta debe ser absoluta, dedicada, privada y quedar fuera del checkout, `DATA_DIR` y `BACKUP_DIR`, incluidos enlaces simbólicos. No copiar el `.env` ni la base a GitHub. El administrador del alojamiento debe excluirla de respaldos con contenido de pruebas y configurar/verificar el mantenimiento independiente en una carpeta estable de operaciones. No usar una ruta que desaparezca en la siguiente versión.

Ejemplo conceptual de tarea (reemplazar ejecutable, archivo privado y ruta por valores verificados):

```cron
* * * * * /RUTA/ABSOLUTA/node --env-file=/RUTA/PRIVADA/operacion.env /RUTA/ESTABLE/scripts/cleanup-public-trials.mjs
```

Mientras el servicio está activo el temporizador apunta al vencimiento exacto. Si está detenido, la tarea independiente debe retirar los vencidos en su siguiente ciclo; el acceso ya está bloqueado por la fecha del servidor. Registrar el último resultado del mantenimiento y alertar si no hay ejecución exitosa. No anunciar una eliminación independiente del proceso web hasta comprobar ese programador en el proveedor.

La prueba está preparada para el backend Node 24 existente. El artefacto Workers por sí solo no incorpora este almacén ni su mantenimiento; no activar ni anunciar la prueba allí sin una implementación equivalente. El botón público sólo se muestra cuando el backend Node confirma disponibilidad. Una configuración opcional inválida deshabilita la prueba sin derribar la aplicación principal.

## 3. PWA de escritorio y documentos sin conexión

### Instalación y shell

- Se amplía `/instalar` con Windows/Chrome/Edge, manteniendo iOS y Android.
- Manifiesto con display standalone, iconos actuales y arranque/scope por laboratorio cuando se instala desde su ruta. Los subdominios conservan manifiesto raíz propio.
- El service worker guarda exclusivamente HTML/JS públicos de la pantalla offline e iconos. Nunca almacena respuestas privadas, APIs, HTML autenticado ni la prueba pública. Cuando una navegación no consigue servidor, abre el shell offline desde cero.
- Las actualizaciones sustituyen sólo las cachés de shell; no eliminan IndexedDB ni recargan por fuerza una edición pendiente. Se activa la nueva versión cuando dejan de usarse sus clientes anteriores.

### Identidad, autorización y cifrado

- Función desactivada por defecto: `OFFLINE_DOCUMENTS_ENABLED=false`.
- Cada dispositivo crea una clave de firma no exportable P-256. Las peticiones firman método, URL, hash del cuerpo, fecha sincronizada con servidor y nonce. El servidor rechaza repeticiones, sesiones inválidas, dispositivos pendientes/revocados y accesos fuera de usuario/laboratorio.
- El administrador del laboratorio autoriza expresamente cada combinación usuario/dispositivo. Otros roles pueden solicitar autorización, pero no concedérsela. El administrador SaaS no suplanta sesiones de laboratorio.
- La autorización reutiliza la sesión, membresía y filtros de acceso existentes. Los PDFs y adjuntos se obtienen por las rutas que ya comprueban permisos. No se descarga todo el repositorio.
- Almacén IndexedDB dedicado, separado criptográficamente por usuario, laboratorio y dispositivo. Contenido, títulos y metadatos documentales se cifran AES-256-GCM; el contenedor guarda ciphertext. Una frase local de al menos 16 caracteres protege la clave de contenido mediante PBKDF2-SHA256 de 600.000 iteraciones. No se transmite ni se guarda la frase, ni la contraseña del sistema. La clave de firma no sirve para descifrar documentos.
- Se exige desbloqueo tras cerrar/reabrir y se bloquea por inactividad. Cerrar el panel no bloquea inmediatamente la preparación en segundo plano de los documentos que se abren; cerrar la app sí elimina la clave de memoria.
- Dispositivos personales autorizados; no se recomienda habilitar en equipos compartidos. El cifrado del navegador no protege frente a un sistema operativo comprometido o una sesión ya desbloqueada. Olvidar la frase obliga a borrar las copias y prepararlas otra vez desde el servidor.

### Qué se conserva y cuándo se actualiza

- Sólo documentos elegibles abiertos durante la sesión en línea y descargados íntegramente. Se reutiliza la vista documental vigente; no se capturan borradores de formularios sin guardar ni la prueba pública.
- Se guardan hasta 20 documentos por conjunto, PDF más hasta cinco adjuntos PDF, 12 MiB por documento completo y 50 MiB de almacén local. Son límites técnicos de seguridad de esta primera versión, no cuotas comerciales de los planes. Formatos/tamaños no compatibles se indican como consulta con internet.
- El borrado individual evita que la copia vuelva a descargarse al sincronizar. Sólo abrir expresamente de nuevo el documento en línea la vuelve a preparar; las marcas de exclusión también están cifradas.
- Las copias no tienen TTL. Se solicita almacenamiento persistente al navegador; si no lo concede, se muestra el límite. Borrar el perfil, desinstalar con eliminación de datos o la intervención del sistema operativo puede retirar las copias: no se presenta como sustituto del respaldo del servidor.
- Un nuevo inicio de sesión sin documentos abiertos mantiene el último conjunto confirmado para validarlo/actualizarlo. Al abrir el primer documento de la nueva sesión se confirma un nuevo conjunto; se retiran los anteriores que queden fuera. Así un simple reingreso no borra las copias permanentes ni obliga a reabrirlas todas para sincronizar.
- Sincronización al abrir/retomar con conexión, reconectar y abrir un documento elegible. Si está bloqueado, primero valida acceso y sincroniza contenido al desbloquear. Si la app estaba totalmente cerrada, no se promete ejecución de fondo: sincroniza al volver a abrir y desbloquear.
- Compara revisión, descarga, verifica tamaño/hash de todos los archivos y reemplaza atómicamente la copia cifrada. Una descarga incompleta o un error transitorio conserva la última copia completa y no adelanta la fecha de éxito. Coalescencia de trabajo y reintentos acotados.
- Si la sesión simplemente venció, bloquea y solicita acceso en línea sin destruir ciphertext. Si el servidor confirma revocación/eliminación, retira las copias afectadas; cierre de sesión y cambio de cuenta/laboratorio borran el almacén. Se notifica a otras pestañas del mismo origen para retirar vistas y claves en memoria.
- Las revocaciones sólo se conocen al volver a conectar. Por decisión del propietario no hay un vencimiento offline que limite ese periodo.
- La pantalla muestra conexión, versión, estado de descarga, última sincronización y borrado. Sólo lectura; apertura de formularios y escrituras se bloquean al detectar desconexión.

### Configuración / tablas

`OFFLINE_DOCUMENTS_ENABLED=true` habilita el registro de dispositivos sobre la SQLite operativa existente. Crea tablas de metadatos `offline_devices`, `offline_nonce`, `offline_sessions`; no modifica tablas de documentos ni usuarios. Conservar respaldo antes de habilitar. El contenido offline privado vive cifrado en el dispositivo, no en una caché HTTP ni en estas tablas.

Componentes: `server/offline/routes.mjs`, `vault.js`, `client.js`, `view.html`, `server/pwa.mjs`, `server/pwa/install.html`, `worker/offline-ui.js`, integración en `server/app.mjs`. No se activa en el backend Workers sin un adaptador equivalente.

## Verificación y reproducción

Todos los ensayos usan laboratorios, direcciones y contraseñas ficticios; Resend se sustituye por un transporte simulado. No se cargan datos reales ni se envía correo real.

```bash
npm ci
npm run build
npm run validate
npm run check:hostinger-source
npm test
npm run test:pwa-browser
```

El ensayo de navegador necesita Chromium o Chrome instalado. En Linux puede elegirse con `CHROMIUM_BIN`. Genera su informe en `PWA_REPORT_DIR` o en la carpeta temporal de informes. GitHub Actions conserva el informe como artefacto. La prueba abre un servidor temporal, usa un perfil nuevo y lo elimina al finalizar.

- Comercio: marca, rutas, FAQ, términos, planes, consentimiento granular, envío condicionado, aceptación/rechazo del canal, reintento idempotente, modalidad anual y ausencia de cobro.
- Prueba: creación/guardado/recarga, dos contextos de navegador, bloqueo de origen y sesión, conflicto de revisión, sin escrituras operativas, cifrado, vencimiento acelerado, bloqueo antes de limpieza y eliminación por temporizador y por proceso independiente.
- Offline: sesiones reales, permisos de módulo/registro, firmas y replay, autorización de dispositivos, dos usuarios en un laboratorio y dos laboratorios, subdominios y rutas, revisión/cambios, adjuntos íntegros, revocación y conjunto de última sesión.
- Chromium Linux: apertura y preparación desde la interfaz, cifrado real de IndexedDB, clave de firma no exportable, actualización sin reabrir cada documento, corte de descarga y rechazo de cuota simulado conservando la copia previa, dos contextos de prueba pública, formulario comercial y comparador móvil, cierre de las pestañas de la app y caída real del servidor, reapertura offline y PDF/adjunto local, reconexión, reapertura online después de cambios mientras estaba cerrada, cambio real de versión del service worker y retiro de copias al revocar dispositivo.

### Aceptación Windows pendiente — no se declara superada

Este entorno es Linux. No se dispone de una PWA instalada desde el icono en Windows ni dispositivos iOS/Android reales. Antes de activar producción, ejecutar en Chrome y Edge de Windows:

1. Instalar desde el laboratorio en revisión y abrir desde el icono. Aprobar el dispositivo y preparar frase local.
2. Abrir dos documentos y un adjunto; confirmar descargas completas.
3. Cerrar por completo la app, desconectar red y reabrir desde el icono. Desbloquear y comprobar lectura, adjuntos y aviso para documentos no descargados.
4. Cambiar un documento en el servidor; reconectar con app abierta y comprobar actualización automática. Desconectar y consultar la versión nueva.
5. Repetir con app cerrada durante la reconexión; abrir en línea, desbloquear y comprobar actualización sin reabrir cada documento.
6. Interrumpir una descarga y comprobar que conserva la copia anterior; probar falta de espacio.
7. Cambiar cuenta/laboratorio, cerrar sesión y revocar acceso/dispositivo. Comprobar retiro de copias y vistas en todas las ventanas al reconectar.
8. Actualizar el service worker y verificar acceso normal, instalación móvil y conservación de copias permitidas. Repetir instalación en Safari iOS y Chrome Android.

## Estado de producción y reversión

Listo para revisión: mejoras comerciales y FAQ, canal configurable, prueba Node aislada y PWA cifrada con tests reproducibles. Pendiente de activación comercial: datos, canal y textos aprobados que el propietario configurará. Pendiente de prueba pública en producción: ruta dedicada, exclusión de respaldos y programador independiente verificado. Pendiente de offline en producción: aprobación de dispositivos, validación Windows instalada y validación móvil real.

**Bloqueo heredado no resuelto por este alcance:** `main` fue restaurado al backend SQLite que puede usar una carpeta relativa de despliegue. Antes de publicar estas mejoras debe verificarse almacenamiento persistente y conservación de datos reales en Hostinger. Estos cambios no migran ni recuperan registros desaparecidos. No usar una publicación de interfaz como prueba de conservación de datos de clientes.

Reversión de código: volver a la revisión base conservada, sin borrar la base operativa ni cambiar secretos. Desactivar las tres funciones mediante sus flags si hay problemas en revisión. La prueba debe seguir limpiándose con su tarea independiente aunque el sitio se revierta. Los dispositivos deben borrar copias desde la pantalla antes de retirar el código si se quiere una limpieza inmediata; una revocación no puede alcanzar equipos sin conexión. No cambiar la contraseña de cifrado ni crear otra base para revertir una interfaz.

## Resultado de esta revisión

| Verificación local | Resultado |
|---|---|
| Compilación y validación del artefacto ESM | Superadas |
| Sincronización de fuentes `labflow-saas` | Superada |
| Baterías funcionales existentes | 34/34 superadas |
| Pruebas específicas Node | 47/47 superadas, sin omisiones |
| Escenarios Chromium Linux | 16/16 superados |
| Entrega real por Resend | Pendiente de configuración; aceptación, rechazo y reintento probados con transporte simulado |
| PWA instalada desde icono en Windows | Pendiente: este entorno es Linux |
| Dispositivos iOS/Android reales | Pendiente |
| Despliegue o migración en producción | No ejecutados |

Los fallos encontrados durante la revisión (compatibilidad de la interfaz antigua, captura desde el visor documental vigente, sincronización coalescida, borrado individual que se volvía a descargar, aislamiento de configuración opcional y rechazo de enlaces duros a una base operativa) se corrigieron antes de estos resultados. No se sustituye una prueba de almacenamiento persistente real de Hostinger por estos ensayos temporales.
