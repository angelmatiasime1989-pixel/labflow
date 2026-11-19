# Correo transaccional con Resend (desactivado por defecto)

La integración reside en `server/mail/`. No incorpora claves al navegador ni al worker portable. La copia Node de Hostinger entrega una función privada al worker para reutilizar su cola existente de avisos críticos y el canal comercial. No se creó otro proveedor ni se modificaron DNS o Stripe.

## Requisitos para una prueba autorizada

Configurar únicamente en el servidor: `RESEND_API_KEY`, `EMAIL_FROM` (dirección simple del dominio verificado) y `RESEND_ALLOWED_RECIPIENTS` (direcciones explícitas separadas por comas). Se requieren además `TRANSACTIONAL_EMAIL_ENABLED=true`, `RESEND_DOMAIN_VERIFIED=true` y `RESEND_API_VERIFIED=true`, con URL pública HTTPS. Las tres banderas están apagadas en `.env.example`. Son confirmaciones del operador, no verificación automática del dominio ni del permiso de la clave. No activarlas mientras Resend no muestre el dominio verificado y no se haya autorizado el destinatario de ensayo. Una clave presente por sí sola nunca habilita envíos.

Se usa `POST https://api.resend.com/emails`, clave con permiso mínimo de envío para ese dominio y sin permisos para modificar DNS. No son necesarios permisos para gestionar contactos, dominios o facturación. No compartir la clave por chat o Git.

## Recuperación y avisos

- `/recuperar`: usuarios de laboratorio; el enlace aparece en su acceso solamente con el correo habilitado. El administrador global mantiene su mecanismo de recuperación administrativa existente.
- `POST /api/account/recovery/request`: identificador de laboratorio y usuario. Respuesta genérica idéntica, límite persistente de 5 solicitudes/IP/hora y 3 por cuenta/hora. Utiliza el correo previamente asignado al usuario, que debe ser correcto y estar verificado por el administrador antes de habilitar el ensayo.
- `POST /api/account/recovery/reset`: token aleatorio de 256 bits, válido 15 minutos y una sola vez. Se guarda solo su hash. El enlace lleva el token en el fragmento y lo retira de la barra al abrirse. Una actualización atómica cambia la contraseña y revoca sesiones anteriores. Los cambios de correo/contraseña, suspensión o expiración invalidan el enlace. Un corte durante la operación falla cerrado: solicitar otro enlace.
- Bienvenida sin contraseñas tras alta administrativa confirmada o suscripción verificada elegible; no después de una mera redirección del navegador ni de una suscripción pendiente. Esto no cambia el flujo de aprovisionamiento Stripe existente.
- Los avisos críticos reutilizan `mailQueue35` y requieren que el laboratorio los habilite. Una clave de evento estable y un registro persistente evitan duplicados. Los reintentos ambiguos se detienen antes de 23 horas para no exceder la ventana de idempotencia de Resend (24 horas); requieren revisión manual después.

Los recibos de envío no guardan texto ni tokens; guardan hash, estado e identificador del proveedor. Los hashes de recuperación usados/vencidos y contadores quedan en el almacenamiento privado; no se implementó aún una política automática de purga. No se añadieron invitaciones nuevas ni una campaña de correos.

## Pruebas y límites

`node --test scripts/mail-test.mjs` usa transporte simulado y datos sintéticos: ninguna llamada a Resend. Comprueba desactivación, destinatarios permitidos, idempotencia, reintentos ambiguos, recuperación genérica, caducidad, reutilización, concurrencia, revocación de sesión, aislamiento, CSRF, límite de cuerpo, bienvenida confirmada y ausencia de secretos en HTML. La entrega real, reputación, DNS y acceso a la cuenta Resend no se validaron. Falta confirmar el dominio como Verified y ejecutar un envío a un destinatario expresamente autorizado mediante configuración privada.
