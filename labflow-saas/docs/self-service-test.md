# Registro, prueba comercial y Mi membresía

El código está preparado para sandbox. No se han activado cobros live, modificado claves o cambiado/archivado productos y precios Stripe. Las claves live y `NODE_ENV=production` continúan bloqueando Checkout.

## Tres acciones separadas

- **Registrarse**, `/registrarse`: crea el espacio y su administrador. No llama a Stripe, no crea suscripción ni concede una prueba. El acceso operacional queda pendiente de una suscripción verificada.
- **Iniciar prueba gratuita**, `/contratar?intent=trial&plan=gold&cycle=monthly`: conserva plan y ciclo al registrarse o ingresar. Luego el administrador confirma términos en Mi membresía y abre Checkout alojado con tarjeta. Usa el precio recurrente pagado correspondiente, `subscription_data.trial_period_days=15`, `payment_method_collection=always` y cancelación si falta medio de pago al terminar. No usa ni archiva un precio de $0 cada 15 días.
- **Contratar membresía**, `/contratar?plan=gold&cycle=monthly`: mismo proceso de autenticación, pero el Checkout NO lleva prueba.

Enterprise Custom permanece por cotización. La demo documental `/prueba-documental` conserva sus 24 horas y no crea una suscripción. La antigua URL `/registro-prueba` redirige al único flujo comercial de Stripe; la API ya no acepta crear pruebas locales sin tarjeta. Los espacios históricos, si existen, conservan sus datos y su vencimiento previo; no se renuevan ni convierten automáticamente.

## Condiciones y autorización

Antes de abrir Checkout, se muestran $0 hoy, tarjeta requerida, 15 días del plan elegido, importe total con IVA del primer cobro previsto, fecha prevista (la fecha definitiva se confirma en Stripe), frecuencia de renovación y cancelación mediante el portal antes del vencimiento. Un checkbox obligatorio recoge el consentimiento; cambiar plan o ciclo lo reinicia. El servidor guarda la versión, fecha, importe y periodicidad aceptados dentro de la reserva idempotente. La configuración de portal debe permitir cancelación antes de ofrecer el trial.

La recepción del retorno de Checkout no otorga acceso. Se exige evento firmado/conciliación y lectura actual de Stripe: suscripción vinculada, precio pagado permitido e inclusivo, trial de exactamente 15 días autorizado en servidor, sesión completada sin pago inicial y tarjeta del mismo cliente. Solo entonces se concede el plan elegido hasta `trial_end`. Una segunda prueba por laboratorio se rechaza. Al terminar, solo una factura positiva pagada y correspondiente al plan/período permite continuar. Cancelación efectiva o pago fallido revocan acceso; cancelar al final del período mantiene acceso hasta ese final y muestra que no habrá próximo cobro.

Se requiere confirmar la configuración de métodos de pago del sandbox para ofrecer tarjeta en Checkout. El servidor no concede prueba si Stripe devuelve un método distinto de tarjeta. No se guardan ni muestran números de tarjeta, datos bancarios ni secretos.

## Mi membresía

El administrador del laboratorio tiene un enlace en su espacio a `/laboratorio/:slug/suscripcion`. La página existente muestra plan, estado, periodicidad, importe del plan con IVA, fecha del primer/próximo cobro programado recibida de Stripe, cancelación y fin de acceso. La fecha de última sincronización queda visible. El importe de la próxima factura se muestra como pendiente cuando no está confirmado, sin inferirlo del precio del plan. El portal autenticado del propio laboratorio permite historial, comprobantes, método de pago y cancelación según su configuración. Usuarios no administradores, sesiones de otro laboratorio y sesiones del admin global no pueden consultar esta cuenta.

## Configuración aislada

El registro exige `SELF_SERVICE_TEST_ENABLED=true`, `STRIPE_TEST_MODE=true` y un `NODE_ENV` no productivo. Stripe exige además `STRIPE_ENABLED=true`, clave `STRIPE_SECRET_KEY` de pruebas, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PORTAL_CONFIGURATION` y los ocho `STRIPE_PRICE_*` indicados en [stripe.md](stripe.md). Las banderas siguen desactivadas por defecto. `COMMERCIAL_TRIAL_DAYS` dejó de controlar la prueba: la duración comercial es fija de 15 días en Stripe.

Sin configuración, los destinos muestran «No disponible»/«Stripe no está configurado» y no prometen una prueba activa. No existe un modo reducido de solo Gold. Gold mensual sigue siendo 1,490 MXN **IVA incluido**; todos los importes permanecen iguales. No se ha verificado el Price live, registro fiscal, categoría ni total real de Checkout; consultar los pendientes fiscales de [stripe.md](stripe.md).

Webhook: `/api/billing/stripe/webhook`, previsto en `https://qubolabs.tech/api/billing/stripe/webhook`. En sandbox usar el origen aislado, eventos snapshot y versión `2026-10-28.endive`: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`. El evento de fin próximo actualiza la cuenta; no envía correo por sí mismo. Configurar recordatorios en Stripe antes del lanzamiento. No se enviaron eventos a producción.

## Límites y verificación

El registro de sandbox requiere identificador `test-…`, contraseña con hash, confirmación de datos ficticios, cuerpo limitado, mismo origen, campos permitidos, una inscripción por correo y máximo 50 espacios. La escritura final usa CAS para evitar duplicados. La verificación de correo, recuperación pública y prevención de abuso a escala siguen pendientes antes de abrir producción. No se confunden estos límites con verificación de identidad.

Las pruebas usan SQLite/MariaDB temporal y respuestas Stripe simuladas, incluyendo firmas, trialing, cancelación, primer cobro y errores. Chromium verifica registro, selección, consentimiento, Mi membresía y navegación de escritorio/móvil; bloquea navegación externa a Stripe. No hay credenciales de sandbox disponibles por canal seguro: falta el ensayo real con Checkout, tarjeta de prueba, reloj de pruebas, primer cobro, cancelación y comprobación fiscal. No hay portal de vista previa configurado; no se afirma disponibilidad pública desde pruebas locales.

Comandos: `npm test`, `npm run test:onboarding-browser`, `MYSQL_TEST=true MYSQL_TEST_PORT=3308 node --test scripts/onboarding-test.mjs scripts/stripe-trial-test.mjs scripts/stripe-integration-test.mjs scripts/stripe-preparation-test.mjs`, `npm run sync:hostinger`, `npm run check:hostinger-source`.
