# Preparación de Stripe — integración todavía no implementada

Este cambio reserva configuración y rutas del servidor. No instala un SDK, no llama a Stripe, no crea cuentas/productos/precios, no genera cobros y no modifica la base de datos ni las membresías. No hay controles comerciales nuevos ni campos para secretos en la administración.

## Configuración privada

Los nombres están en `.env.example`, con valores de credenciales e IDs vacíos:

- `STRIPE_ENABLED=false`: intención futura de habilitar la integración. **Cambiarla a `true` no activa nada**; las rutas siguen bloqueadas porque falta la implementación y su verificación.
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET`: exclusivamente del servidor.
- `STRIPE_PRICE_{SILVER,GOLD,PLATINUM,DIAMOND}_{MONTHLY,ANNUAL}`: ocho espacios para IDs de precios. No se derivan de importes enviados por el navegador. Enterprise Custom continúa por cotización, sin ID ni checkout automático.

`server/stripe.mjs` contiene `readStripeConfig(env)`, reservado para el futuro adaptador y con `enabled:false` incondicional. La aplicación actual solo consulta la intención de habilitación; no necesita leer las claves ni validar los IDs para arrancar. No se pasan estas variables a `worker` ni a HTML, JavaScript cliente, respuestas de estado, logs o almacenamiento operacional. No poner valores reales en archivos versionados. No se requiere cambiar hPanel para esta preparación.

## Puntos reservados

`createApp` en `server/app.mjs` conecta `stripeRoutes` antes del enrutamiento operacional. Solo se reservan en el origen principal. El manejador se ejecuta antes de la autenticación operacional porque hoy rechaza todas las peticiones; no hereda una sesión autenticada. La implementación futura de checkout/portal deberá verificar explícitamente sesión, autorización y CSRF antes de cualquier operación:

| Método y ruta | Integración futura | Comportamiento actual |
| --- | --- | --- |
| POST `/api/billing/stripe/checkout` | Crear sesión de checkout para el laboratorio autenticado y un plan/ciclo autorizado | 503 `STRIPE_DISABLED`; con bandera `true`, 501 `STRIPE_NOT_IMPLEMENTED` |
| POST `/api/billing/stripe/portal` | Abrir portal para el cliente Stripe vinculado al laboratorio autenticado | Mismo rechazo, sin URL ni sesión |
| POST `/api/billing/stripe/webhook` | Verificar y aplicar eventos de Stripe | Mismo rechazo; ni siquiera se lee el cuerpo; nunca confirma recepción válida |

Otros métodos devuelven 405, con `Allow: POST`; rutas desconocidas y variantes dentro de laboratorios/subdominios devuelven 404. Todas las respuestas son `no-store`. La identidad, cookies, firma simulada, `paid:true` y parámetros de prueba no desbloquean estas rutas. No existe una ruta de éxito que otorgue permisos. No registrar este webhook en Stripe todavía: responde con error deliberadamente.

## Trabajo pendiente antes de activar

1. Implementar un adaptador del servidor y fijar su dependencia/versionado. Validar configuración, entorno de pruebas frente a producción, moneda, importes y ciclos contra el catálogo vigente; no reinterpretar ni cambiar los planes existentes.
2. Checkout y portal: exigir sesión válida del laboratorio y autorización comercial explícita, proteger frente a CSRF, determinar el laboratorio desde la sesión y resolver en servidor su cliente Stripe. No aceptar IDs de cliente, importes, precios arbitrarios ni URL de retorno del navegador. Definir retornos del mismo origen y operaciones idempotentes.
3. Webhook: verificar firma sobre el cuerpo original antes de interpretar eventos; rechazar firmas ausentes o inválidas. Definir eventos admitidos, correspondencia cliente/suscripción/laboratorio, almacenamiento de eventos procesados, duplicados, reintentos y orden de eventos. Persistir de forma atómica antes de confirmar recepción. Un retorno de checkout o un evento no verificado nunca activa planes.
4. Persistencia y acceso: diseñar y revisar una migración explícita para IDs externos, suscripción y eventos; no hay tablas nuevas en este paso. La gestión actual de clientes/contratos está en `worker/saas-gateway.js` (`/api/saas/customer`, `/api/saas/membership-plan`, `/api/saas/payment`); mantiene revisiones/ETag y contratos existentes. No convertir automáticamente pagos manuales en suscripciones ni conceder acceso desde estados del frontend.
5. Prueba comercial por laboratorio: definir elegibilidad, responsable autorizado, comienzo/fin, estado persistente, expiración, cancelación y conversión a pago verificada. Debe separarse de la demostración pública de documentos. **No se implementa ni activa una prueba de siete días**, ni se añade una variable que la active. Las decisiones de duración y acceso requieren un cambio posterior explícito.
6. Mantener `server/public-trial/` y `PUBLIC_TRIAL_*` independientes: la demo documental de 24 horas, su almacenamiento aislado y su limpieza no cambian.
7. Antes de retirar el bloqueo, probar en entorno aislado checkout/portal autorizados, aislamiento entre laboratorios, secretos no expuestos, importes/ciclos incorrectos, firmas falsas, duplicados, desorden de eventos, carreras, cancelaciones, fallos de red y conservación tras reinicio. Activar únicamente después de implementar y revisar todo el flujo; las claves por sí solas no bastan.

## Verificación de esta preparación

`node --test scripts/stripe-preparation-test.mjs` comprueba inicio y flujos existentes sin claves, bloqueo con bandera activada y configuración sintética, ausencia de modificaciones de objetos/planes, rechazo de peticiones anónimas o con sesión, métodos y rutas alternativas, ausencia de secretos en respuestas, y webhook sin lectura ni confirmación del evento. `npm test` incluye estas comprobaciones junto con las pruebas actuales de autenticación, membresías y demo pública.
