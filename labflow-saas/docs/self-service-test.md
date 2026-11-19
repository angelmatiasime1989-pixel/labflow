# Registro y contratación en entorno de pruebas

Implementado en `stripe-test-integration`. Publicar el código no habilita el registro: no activar las banderas de sandbox en producción. No se han cambiado hPanel, claves, productos, precios, impuestos ni datos productivos.

## Activación aislada

En un entorno local/sandbox con base exclusiva de datos sintéticos:

```dotenv
NODE_ENV=development
SELF_SERVICE_TEST_ENABLED=true
STRIPE_TEST_MODE=true
COMMERCIAL_TRIAL_DAYS=15
```

Las dos banderas son obligatorias. `NODE_ENV=production` bloquea el registro aunque estén activadas; `SELF_SERVICE_TEST_ENABLED=false` es el valor de ejemplo. La duración admite enteros de 1 a 30 días y solo se revela cuando el registro está habilitado. No conectar este entorno a la base de producción.

Stripe es opcional para registrar: sin su configuración, la prueba funciona y la contratación muestra «Stripe no está configurado», conserva la selección y no abre Checkout. Para ensayar Checkout se requiere la configuración privada de **sandbox**, los ocho precios y el portal descritos en [stripe.md](stripe.md). No se solicitan claves en el navegador ni se almacenan en Git. La configuración fiscal existente no se cambia en esta entrega; su verificación en el sandbox sigue siendo requisito para el ensayo real.

## Recorridos

| Entrada | Resultado |
| --- | --- |
| Landing → Iniciar prueba gratuita / Registrarse | `/registro-prueba`, registro de laboratorio real de pruebas y administrador, login y `/laboratorio/:slug/prueba` con vencimiento exacto. |
| Landing → Contratar membresía | `/contratar`, elección de plan y periodicidad, registro o ingreso con credenciales del laboratorio, selección conservada en `/laboratorio/:slug/suscripcion`. |
| Tarjeta de membresía | La prueba de todas las tarjetas tiene alcance Silver, indicado en cada tarjeta. Contratar conserva su propio plan y el interruptor mensual/anual. Enterprise continúa en cotización. |
| Demo documental | `/prueba-documental`, conserva su flujo separado de 24 horas y su propia bandera. |
| Blog y FAQ | Desaparecen de ambos menús de cabecera; sus páginas y artículos siguen accesibles desde el pie. Se conservan los enlaces contextuales de ayuda en el contenido. |

La prueba usa 15 días por defecto (configurable), tiene alcance Silver, sin tarjeta, sin contacto con Stripe y sin renovación automática. El vencimiento se fija una sola vez al registrar y se comprueba en cada solicitud operacional, antes del acceso offline en servidor y también en el gateway. Al vencer se conserva la información y se bloquea el acceso operacional. Las copias previamente descargadas no se borran remotamente cuando el equipo está sin conexión.

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

## Publicación del piloto con Stripe bloqueado

- Rama de trabajo: `stripe-test-integration`; integración base `540303d`, registro inicial `8e18b6d` (entonces 7 días). El ajuste posterior cambia el valor predeterminado a 15; no existía previamente un piloto de 15 días desplegado desde esta rama.
- Los botones permanecen visibles; si el registro está deshabilitado, el mensaje de disponibilidad y la página de destino lo indican, sin prometer duración ni crear espacios.
- Añadir `STRIPE_SECRET_KEY` y `STRIPE_PRICE_GOLD_MONTHLY` no habilita esta implementación. Incluso con todas las banderas activadas, `sk_live_…`, `rk_live_…` y `NODE_ENV=production` son rechazados. Los tests prueban que no se llama al transporte Stripe en esos casos.
- No se han modificado productos, precios, claves ni configuración fiscal. No se enviarán eventos al webhook de producción para validarlo.
- URL prevista para el dominio público: `https://qubolabs.tech/api/billing/stripe/webhook`. Una instancia de pruebas debe usar SU propio origen HTTPS y esta misma ruta. El endpoint publicado continúa respondiendo como deshabilitado mientras no exista una configuración de pruebas admisible.
- Eventos snapshot, versión `2026-10-28.endive`: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`.

Para ensayar Gold mensual con **el código actual** se requieren `STRIPE_ENABLED=true`, `STRIPE_TEST_MODE=true`, `NODE_ENV` distinto de `production`, `STRIPE_SECRET_KEY` de pruebas, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PORTAL_CONFIGURATION` y **los ocho** IDs únicos de precios: `STRIPE_PRICE_SILVER_MONTHLY`, `STRIPE_PRICE_SILVER_ANNUAL`, `STRIPE_PRICE_GOLD_MONTHLY`, `STRIPE_PRICE_GOLD_ANNUAL`, `STRIPE_PRICE_PLATINUM_MONTHLY`, `STRIPE_PRICE_PLATINUM_ANNUAL`, `STRIPE_PRICE_DIAMOND_MONTHLY`, `STRIPE_PRICE_DIAMOND_ANNUAL`. No existe aún un modo reducido de solo Gold mensual. Gold mensual corresponde a MXN 1,490 totales, IVA incluido; no se han creado ni cambiado precios.

Para registrar espacios además se requiere `SELF_SERVICE_TEST_ENABLED=true`; `COMMERCIAL_TRIAL_DAYS` puede sobrescribir los 15 días predeterminados. Estas instrucciones son para un entorno aislado, no para activar las variables en Hostinger productivo.
