# LabFlow v35 — navegación, documentos, calibración y correo

## Cambios
- Un único botón de regreso por pantalla de herramienta.
- Políticas y procedimientos se gestionan desde Lista maestra; se conserva el origen y su flujo de Calidad.
- Lista maestra única con Documentos, Registros y Documentos externos, referencias sin duplicar los registros, búsqueda, detalles y PDF institucional. Se filtra por perfil y distribución.
- Programa completo de calibración en PDF institucional horizontal; equipo, serie, vencimiento, situación y certificado/responsable. Tablas con paginación.
- Solicitud automática de compra para equipos vencidos o a 30 días de vencer, vinculada al equipo/vencimiento y protegida contra duplicados abiertos.
- Visor PDF de pantalla completa para documentos e informes, también para formularios sin guardar; conserva el formulario al cerrar el visor.
- Alta de cliente conectada con la cotización: preserva campos e ítems y selecciona el nuevo cliente.
- Correo transaccional por evento nuevo y destinatario autorizado. Cola persistente, claves idempotentes, aceptación del proveedor diferenciada de entrega al buzón, errores e historial. El envío normal se ejecuta en segundo plano con waitUntil; la prueba solicita respuesta del proveedor.
- Corrección de acceso histórico del signatario cuando un ítem se retira: utiliza métodos conservados en el registro/origen y mantiene la comprobación de competencia.

## Validación
26 suites funcionales aprobadas, incluidos los flujos anteriores. Se volvió a ejecutar v35-test después del ajuste del envío en segundo plano. Las pruebas usan Worker/API reales con almacenamiento aislado y un DOM simulado para el script de interfaz completo. El proveedor de correo se simula para validar aceptación, destinatarios e idempotencia.

Programa de calibración y lista maestra renderizados e inspeccionados en primera y última página; corregida una primera página vacía en tablas horizontales. Compilación y sintaxis ESM verificadas.

## Configuración externa pendiente
No hay RESEND_API_KEY ni EMAIL_FROM configurados en el sitio. La prueba dirigida a angelmatiasime1989@gmail.com queda Pendiente de configurar proveedor. Nunca se reporta como correo enviado o entregado.

El servidor espera RESEND_API_KEY (secreto), EMAIL_FROM (dirección de remitente verificada), SITE_URL (opcional). No guardar claves en el código o en datos exportables. La conexión del plugin Resend por sí sola no configura estas variables del servidor; después de conectar se debe preparar la credencial de envío y el remitente.

Los eventos de flujo se encolan al guardar; los reintentos pueden ejecutarse en Configuración → Correo. Los avisos por vencimiento requieren un cambio/consulta que los materialice; una revisión periódica desatendida de vencimientos requiere configurar adicionalmente el disparador de servidor.

La revisión visual de navegación en navegador real sigue pendiente porque control-browser no está disponible.

## Corrección v36 validada en almacenamiento con cuerpo de lectura única
El respaldo previo se lee una sola vez y se reutiliza para copia y cola de correo. La respuesta de prueba de correo también consume su resultado una sola vez. El doble consumo detectado en la prueba publicada ya no se permite en el mock R2 de v35-test.
