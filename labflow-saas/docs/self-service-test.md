# Registro y contratación en entorno de pruebas

Implementado en `stripe-test-integration`. No desplegar esta rama en producción. No se han cambiado hPanel, claves, productos, precios, impuestos ni datos productivos.

## Activación aislada

En un entorno local/sandbox con base exclusiva de datos sintéticos:

```dotenv
NODE_ENV=development
SELF_SERVICE_TEST_ENABLED=true
STRIPE_TEST_MODE=true
COMMERCIAL_TRIAL_DAYS=7
```

Las dos banderas son obligatorias. `NODE_ENV=production` bloquea el registro aunque estén activadas; `SELF_SERVICE_TEST_ENABLED=false` es el valor de ejemplo. La duración admite enteros de 1 a 30 días y solo se revela cuando el registro está habilitado. No conectar este entorno a la base de producción.

Stripe es opcional para registrar: sin su configuración, la prueba funciona y la contratación muestra «Stripe no está configurado», conserva la selección y no abre Checkout. Para ensayar Checkout se requiere la configuración privada de **sandbox**, los ocho precios y el portal descritos en [stripe.md](stripe.md). No se solicitan claves en el navegador ni se almacenan en Git. La configuración fiscal existente no se cambia en esta entrega; su verificación en el sandbox sigue siendo requisito para el ensayo real.

## Recorridos

| Entrada | Resultado |
| --- | --- |
| Landing → Iniciar periodo de prueba | `/registro-prueba`, registro de laboratorio real de pruebas y administrador, login y `/laboratorio/:slug/prueba` con vencimiento exacto. |
| Landing → Contratar membresía | `/contratar`, elección de plan y periodicidad, registro o ingreso con credenciales del laboratorio, selección conservada en `/laboratorio/:slug/suscripcion`. |
| Tarjeta de membresía | Conserva el plan y el interruptor mensual/anual. Enterprise continúa en cotización. |
| Demo documental | `/prueba-documental`, conserva su flujo separado de 24 horas y su propia bandera. |
| Blog y FAQ | Desaparecen de ambos menús de cabecera; sus páginas y artículos siguen accesibles desde el pie. Se conservan los enlaces contextuales de ayuda en el contenido. |

La prueba tiene alcance Silver, sin tarjeta, sin contacto con Stripe y sin renovación automática. El vencimiento se fija una sola vez al registrar y se comprueba en cada solicitud operacional, antes del acceso offline en servidor y también en el gateway. Al vencer se conserva la información y se bloquea el acceso operacional. Las copias previamente descargadas no se borran remotamente cuando el equipo está sin conexión.

Un registro para contratar no recibe acceso operacional hasta una suscripción pagada y verificada. La página de retorno no cambia permisos. Una suscripción verificada sustituye el periodo de prueba para determinar el acceso; una suspensión manual del proveedor continúa teniendo prioridad.

## Seguridad y límites del ensayo

- Registro exclusivamente en el dominio principal, POST JSON, mismo origen, cuerpo de hasta 8 KiB, campos permitidos, contraseña de 12–128 caracteres con hash del mecanismo existente. No se genera una contraseña visible ni se guarda en el cliente.
- Identificadores nuevos `test-…`, una inscripción por correo normalizado y capacidad persistente máxima de 50 espacios de autoservicio. La comprobación final utiliza CAS para evitar duplicados concurrentes. Cambiar el correo no renueva un espacio existente.
- El nombre, correo y contraseña deben ser sintéticos. No hay verificación de correo, recuperación autoservicio ni una política completa contra abuso público: son requisitos pendientes antes de cualquier apertura a producción. Los límites del sandbox no equivalen a verificación de identidad.
- La creación guarda primero el estado del nuevo laboratorio y después lo publica en el índice con CAS. Un conflicto limpia exclusivamente su estado provisional. Una caída entre ambas operaciones podría dejar un estado huérfano inaccesible; conciliar esos huérfanos antes de ampliar el despliegue. No se borran registros de espacios existentes.
- No se invocan rutas del proveedor para crear el espacio ni se aceptan roles, permisos, fechas de vencimiento o IDs Stripe enviados por el cliente.
- El registro no crea una sesión por sí mismo: la interfaz realiza el login normal, con cookie privada del laboratorio, antes de continuar. Una contraseña incorrecta no permite abrir la suscripción de otro laboratorio.
- No existe un portal de vista previa configurado en este entorno. Las capturas y resultados Chromium están en `/tmp/qubo-onboarding-browser` y `/tmp/qubo-onboarding-browser-mariadb`; no son una publicación web.

## Verificación reproducible

```sh
npm run build
node --test scripts/onboarding-test.mjs scripts/stripe-integration-test.mjs scripts/stripe-preparation-test.mjs
MYSQL_TEST=true MYSQL_TEST_PORT=3308 node --test scripts/onboarding-test.mjs scripts/stripe-integration-test.mjs scripts/stripe-preparation-test.mjs
npm run test:onboarding-browser
MYSQL_TEST=true MYSQL_TEST_PORT=3308 ONBOARDING_REPORT_DIR=/tmp/qubo-onboarding-browser-mariadb npm run test:onboarding-browser
npm test
npm run validate
npm run sync:hostinger
npm run check:hostinger-source
```

Los tests usan bases temporales SQLite o bases sintéticas en MariaDB 11.8.9 local. Stripe se simula, incluyendo su firma de webhook; Chromium bloquea cualquier navegación externa a Stripe. Se verifican escritorio 1440 px y móvil 390 px, registro, sesión, vencimiento, plan y periodicidad al registrar o ingresar, Checkout simulado y funcionamiento sin claves. No constituye un ensayo extremo a extremo con Stripe ni una validación de producción.
