# Stripe: rama de integración para pruebas

Esta implementación funciona **solo en modo de pruebas**. No está autorizada para producción. El registro opcional de un espacio de prueba aislado se documenta en [self-service-test.md](self-service-test.md). Checkout alojado y portal se abren únicamente para el administrador autenticado del propio laboratorio. Enterprise Custom sigue por cotización y la demo documental aislada de 24 horas no cambia.

## Límites deliberados

- `STRIPE_ENABLED=false` y `STRIPE_TEST_MODE=false` por defecto. Se requiere toda la configuración de pruebas; `NODE_ENV=production` o una clave que no empiece por `sk_test_` bloquean las rutas con 503. Configuración incorrecta no impide arrancar la aplicación.
- Solo claves privadas del servidor. No se usa clave publicable, SDK en navegador ni formularios de tarjetas propios. No configurar ninguna clave en Git ni enviarla por chat.
- Checkout utiliza métodos de pago dinámicos configurados en el Dashboard e identifica el flujo como `qubolabs_sandbox_kpvrnzta`. La integración usa REST de Stripe con `Stripe-Version: 2026-10-28.endive`, HTTPS fijo a `api.stripe.com`, tiempo límite y redirecciones HTTP deshabilitadas. El transporte simulado solo se inyecta desde código de pruebas, nunca mediante HTTP o variables de entorno.
- Billing se gestiona desde el dominio principal y la ruta del laboratorio; los subdominios no exponen estas rutas. El administrador debe iniciar sesión en la ruta principal. Los usuarios normales y las sesiones del proveedor no sirven para gestionar la suscripción del laboratorio.
- Stripe no crea productos o precios automáticamente. El laboratorio sintético puede prepararlo el proveedor o registrarse mediante el autoservicio aislado; este último no se habilita por activar Stripe. No se envían parámetros de trial a Stripe; un webhook de una suscripción con prueba comercial se rechaza.

## Catálogo exacto a configurar en el sandbox de Stripe

Fuente: `worker/commercial-memberships.json` y `worker/commercial-terms.json`. Moneda MXN; importes **antes de IVA**. Anual: mensual × 12 × 0.90. No son doce cargos mensuales: el precio anual se cobra una vez por año.

| Producto | Ciclo | Importe MXN | `unit_amount` (centavos) | Variable privada |
| --- | --- | ---: | ---: | --- |
| Silver | Mensual, `month`, 1 | 790.00 | 79000 | `STRIPE_PRICE_SILVER_MONTHLY` |
| Silver | Anual, `year`, 1 | 8,532.00 | 853200 | `STRIPE_PRICE_SILVER_ANNUAL` |
| Gold | Mensual, `month`, 1 | 1,490.00 | 149000 | `STRIPE_PRICE_GOLD_MONTHLY` |
| Gold | Anual, `year`, 1 | 16,092.00 | 1609200 | `STRIPE_PRICE_GOLD_ANNUAL` |
| Platinum | Mensual, `month`, 1 | 2,490.00 | 249000 | `STRIPE_PRICE_PLATINUM_MONTHLY` |
| Platinum | Anual, `year`, 1 | 26,892.00 | 2689200 | `STRIPE_PRICE_PLATINUM_ANNUAL` |
| Diamond | Mensual, `month`, 1 | 4,490.00 | 449000 | `STRIPE_PRICE_DIAMOND_MONTHLY` |
| Diamond | Anual, `year`, 1 | 48,492.00 | 4849200 | `STRIPE_PRICE_DIAMOND_ANNUAL` |

Crear cuatro productos y dos precios recurrentes por producto, con `billing_scheme=per_unit`, `recurring.usage_type=licensed`, cantidad fija 1, moneda `mxn` y `tax_behavior=exclusive`. Los ocho IDs deben ser distintos. El servidor recupera y valida cada precio antes del checkout y al sincronizar la suscripción. Enterprise Custom permanece por cotización (el catálogo muestra desde 7,990 MXN/mes y anual personalizado); no se crea un checkout para Enterprise.

Checkout solicita cálculo automático de impuestos y domicilio de facturación. Configurar **Stripe Tax en el sandbox** con los datos fiscales que correspondan antes del ensayo; el código no fija una tasa de IVA ni promete un total fiscal. El catálogo conserva sus importes base.

## Configuración del sandbox por el operador

En un entorno separado y con una base **exclusiva de pruebas**:

1. Establecer `NODE_ENV=test`, `STRIPE_ENABLED=true`, `STRIPE_TEST_MODE=true` y `PUBLIC_URL` al origen de pruebas (HTTPS cuando se exponga un webhook). No usar la base ni el dominio de producción.
2. Guardar `STRIPE_SECRET_KEY` (`sk_test_…`) y `STRIPE_WEBHOOK_SECRET` (`whsec_…`) en el gestor privado de secretos. Cargar los ocho IDs anteriores. No se necesita compartir los valores para revisar código.
3. Crear una configuración de portal de pruebas y guardar su ID en `STRIPE_PORTAL_CONFIGURATION` (`bpc_…`). Permitir facturas/métodos de pago, cancelación y cambios solo entre los ocho precios configurados; deshabilitar cambios de cantidad, trials, cupones y precios ajenos. Para subir de plan, configurar facturación inmediata del ajuste; para bajar/cancelar, preferir el final del período. La aplicación no concede el nuevo plan si no encuentra cobertura pagada del precio correspondiente.
4. Registrar un webhook **snapshot**, de la propia cuenta (sin Connect), con versión `2026-10-28.endive`, en `/api/billing/stripe/webhook`. No configurar thin events.
5. Eventos atendidos: `customer.subscription.created`, `.updated`, `.deleted`; `checkout.session.completed`, `.async_payment_succeeded`; `invoice.paid`, `.payment_failed`. Otros eventos correctamente firmados se registran como ignorados, sin conceder permisos.
6. Preparar un laboratorio sintético activo con contrato Silver y su administrador, iniciar sesión en `/laboratorio/<slug>/` y abrir `/laboratorio/<slug>/suscripcion`.

No se ejecutó ninguna de estas operaciones sobre una cuenta Stripe real o sandbox desde esta tarea; las pruebas automatizadas simulan el transporte HTTP.

## Rutas

| Método y ruta | Comportamiento |
| --- | --- |
| GET `/laboratorio/<slug>/suscripcion` | Página de pruebas, solo administrador del laboratorio. Selección de plan/ciclo, Checkout, portal y conciliación explícita. |
| GET `/laboratorio/<slug>/api/billing/stripe/status` | Estado local mínimo; no devuelve claves, URLs de sesiones ni cliente Stripe. |
| POST `/laboratorio/<slug>/api/billing/stripe/checkout` | JSON `{requestId, plan, cycle}`; UUID v4, plan permitido, `monthly`/`annual`. Devuelve URL alojada de pruebas. |
| POST `/laboratorio/<slug>/api/billing/stripe/portal` | JSON `{}`. Resuelve el cliente vinculado en servidor; devuelve URL temporal del portal. |
| POST `/laboratorio/<slug>/api/billing/stripe/reconcile` | JSON `{}`. Consulta Stripe y aplica el mismo validador que el webhook; permite recuperar eventos perdidos. |
| POST `/api/billing/stripe/webhook` | Cuerpo original, `Stripe-Signature`; no requiere cookie ni CSRF. Firma válida, modo test y versión admitida obligatorios. |

Los POST del laboratorio requieren cookie vigente de ese laboratorio, rol actual `Administrador`, versión de autenticación vigente, `Origin` del origen principal y JSON. No aceptan `customer`, `price`, `subscription`, URLs de retorno, importes ni `trialDays` del navegador. Un administrador no puede operar otro laboratorio. Una suspensión manual del proveedor sigue prevaleciendo.

## Persistencia, concurrencia y permisos

`server/stripe/` separa configuración, cliente REST/firma, acceso al almacenamiento, reglas de negocio y página. `server/stripe.mjs` enruta las peticiones. No hay migración SQL: el almacenamiento existente usa una escritura condicional por ETag del objeto `saas/platform-v1.json`, compatible con SQLite y MariaDB.

- Cada cliente conserva `stripeBilling`: vínculo al cliente Stripe, reserva idempotente de checkout, suscripción y estado mínimo de acceso. No se guardan claves, tarjetas, dirección fiscal ni URL de portal/checkout.
- `stripeEvents` conserva ID, hash del cuerpo, tipo, resultado y fecha de procesamiento, sin copiar el evento completo. Recibo y cambio de contrato se guardan **en el mismo CAS**, por lo que un fallo no confirma el webhook ni deja un recibo sin efecto aplicado.
- Cada intento carga el ETag **antes** de consultar Stripe. Si otra instancia guarda mientras se obtiene una respuesta, se repite desde el estado nuevo y se vuelve a consultar Stripe. No se mantiene una transacción SQL abierta durante llamadas de red.
- Creación de cliente y checkout usan claves idempotentes persistidas antes de llamar a Stripe. Una respuesta perdida se recupera con la misma operación y parámetros. No se admite un segundo checkout mientras el primero siga abierto o haya una suscripción vinculada no terminal.
- Eventos duplicados no vuelven a modificar el contrato. Un mismo ID con contenido distinto se rechaza. Para eventos fuera de orden se recupera la suscripción actual; no se confía en el estado incluido en el evento. Una suscripción antigua no reemplaza otra ya vinculada.
- Un retorno `?checkout=returned`, `paid=true` o `session_id=…` no cambia acceso. Solo el webhook firmado o una conciliación autenticada con lectura de Stripe pueden actualizarlo.
- Para otorgar el plan se exige suscripción test activa, un solo ítem/cantidad 1, precio permitido y exacto, ausencia de trial/pausa, factura vinculada al mismo cliente/suscripción y pagada con importe positivo. Debe haber una línea positiva en MXN para ese precio y período. El acceso termina como máximo en el menor de los períodos de suscripción y factura pagada. Una factura de un plan anterior no autoriza una subida sin pagar.
- Antes del primer pago verificado, el contrato manual conserva sus permisos, sin mejoras. Después, el contrato queda administrado por Stripe: `past_due`, `unpaid`, `canceled`, pausa o falta de cobertura pagada retienen el acceso operacional. Cancelación al final del período conserva el acceso pagado hasta el corte. Inicio/cierre de sesión y la pantalla de suscripción permiten recuperar el pago.
- Se actualizan módulos y herramientas usando el resolver existente de membresías. Renovar el mismo plan no reinterpreta los permisos configurados del contrato. Nunca se cambia una suspensión manual a `Activo`. Los registros y adjuntos no se borran por falta de pago.
- La demo pública de `server/public-trial/` y sus 24 horas siguen independientes. El periodo gratuito de autoservicio solo existe bajo su propia bandera de sandbox, nunca como trial de Stripe ni en producción. Las copias offline ya descargadas no se borran por este cambio; los endpoints operacionales nuevos quedan sujetos al control de suscripción.

## Recuperación y límites antes de producción

Esta rama no debe fusionarse o desplegarse a producción sin revisión adicional. El bloqueo de modo producción es intencional.

- Si se pierde la respuesta de un checkout, reintentar con el `requestId` pendiente que muestra el estado. Tras más de 23 horas con resultado desconocido, se bloquea la recreación: un operador debe conciliar en el sandbox la sesión/cliente antes de liberar la reserva. No borrar reservas para forzar un nuevo cobro.
- Si se pierde un webhook, el administrador dispone de «Consultar estado en Stripe». No hay conciliador periódico todavía; al expirar la cobertura pagada se deniega acceso hasta verificarla de nuevo.
- Configurar el portal para facturar correctamente los cambios. Facturas de importe cero, descuentos/promociones, créditos o trials no otorgan nuevos permisos con esta política conservadora. Para permitirlos se necesitaría una política y pruebas explícitas.
- No se implementa una política de reembolsos/disputas. Se debe definir antes de producción.
- Los recibos se mantienen en el agregado operacional: adecuado para el ensayo aislado, pero falta diseñar retención/archivo y particionado para volumen productivo, sin perder idempotencia ni la atomicidad del cambio de contrato. No eliminar recibos manualmente.
- Añadir monitorización y conciliación periódica, límites de peticiones del área de billing y una revisión de operaciones/recuperación antes de producción. La tasa de solicitudes y duración de retención no se inventan como políticas comerciales.
- La configuración actual admite precios inmutables específicos. Cambiar IDs requiere revisar suscripciones existentes y migración; no sustituir IDs de un contrato activo a ciegas.

## Pruebas reproducibles

```
npm run build
npm run validate
node --test scripts/stripe-preparation-test.mjs scripts/stripe-integration-test.mjs
MYSQL_TEST=true MYSQL_TEST_PORT=3308 node --test scripts/stripe-preparation-test.mjs scripts/stripe-integration-test.mjs
npm run test:stripe-browser
MYSQL_TEST=true MYSQL_TEST_PORT=3308 npm run test:stripe-browser
npm test
npm run sync:hostinger
npm run check:hostinger-source
```

Los tests MariaDB usan exclusivamente un servidor loopback aislado y bases sintéticas creadas por `scripts/helpers/test-mysql.mjs`; ignoran las credenciales `DB_*` productivas. El simulador genera respuestas de Stripe y firmas HMAC válidas/incorrectas sin claves reales ni tráfico a Stripe. Chromium bloquea las navegaciones externas después de comprobar las URL alojadas. Estas pruebas **no son un ensayo extremo a extremo con Stripe**.

Falta para ese ensayo: sandbox configurado, ocho precios e impuestos, portal, secretos privados, origen HTTPS/CLI y webhook real; pagar con los medios de prueba oficiales, comprobar factura y eventos, repetir/alterar eventos, probar cambio de plan/cancelación/fallo de pago, y verificar persistencia tras reiniciar el entorno de pruebas. Conservar únicamente registros sintéticos identificables y no introducir tarjetas reales.

Referencias oficiales usadas para el contrato de API: [Checkout](https://docs.stripe.com/api/checkout/sessions/create), [portal](https://docs.stripe.com/api/customer_portal/sessions/create), [webhooks](https://docs.stripe.com/webhooks), [versionado](https://docs.stripe.com/api/versioning), [líneas de factura](https://docs.stripe.com/api/invoice-line-item/object).
