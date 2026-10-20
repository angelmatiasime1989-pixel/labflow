# Pruebas en el servicio Node.js de GoDaddy

Este modo no requiere Docker, Caddy, Bash ni Python para compilar o arrancar.
El código conserva el backend existente y requiere Node 24.19.x con node:sqlite.
No es una aplicación Vite.

## Panel de despliegue

- Repositorio: angelmatiasime1989-pixel/labflow.
- Rama: feat/godaddy-vps.
- Raíz del proyecto: raíz del repositorio, donde está package.json.
- Build: npm run build.
- Start: npm start.
- Node: 24.19.x.

El build Node ensambla las mismas fuentes en el mismo orden que assemble.py,
genera dist y valida el bundle. No instala dependencias de aplicación.
El servidor utiliza PORT del hosting y escucha en 0.0.0.0 automáticamente cuando
PORT está definido. BIND_ADDRESS permite cambiarlo explícitamente.

## Variables obligatorias (guardadas en el panel, no en Git)

- PUBLIC_ORIGIN: URL pública HTTPS completa, sin rutas, query ni fragmento.
  También se acepta ORIGIN, pero PUBLIC_ORIGIN tiene prioridad.
- DATA_DIR: ruta del volumen persistente escribible asignado por GoDaddy.
  No inventar /data ni usar /tmp: obtener la ruta del proveedor. La aplicación
  no puede determinar si un disco se conserva entre redespliegues.
- SAAS_ADMIN_AUTH: JSON secreto generado con scripts/admin-credentials.mjs.
  Como alternativa, SAAS_ADMIN_AUTH_FILE apunta a un archivo privado legible.

No requiere DB_USER ni DB_PASS: usa SQLite. No necesita claves R2 para operar con
almacenamiento local. Correo es opcional; RESEND_API_KEY y EMAIL_FROM se configuran
solo para probar envíos reales con autorización.

Las credenciales se generan fuera del hosting y se guardan como secreto. El
usuario operador y la contraseña elegidos en esa generación sirven para acceder
al panel. No hay cuenta predeterminada, cabecera especial ni contraseña de demo.
Ver docs/phase-one-auth.md. No publicar el JSON, contraseña o archivos de datos.

Antes del arranque, si el panel ofrece terminal, ejecutar:

    npm run check:hosting

Este chequeo valida origin, credenciales, puerto y escritura en DATA_DIR. No abre
SQLite, no crea clientes y no muestra valores secretos. Si falta configuración,
indica el nombre de cada variable. En un terminal local hay que inyectar primero
las variables: el script no carga automáticamente archivos .env.

Si GoDaddy no ofrece Node 24.19.x o almacenamiento persistente, detener la
instalación: este despliegue local no es compatible con ese plan. Usar un VPS o
preparar otra integración de persistencia antes de introducir datos.

## Entrada y pruebas después de guardar variables y redesplegar

1. Abrir https://DOMINIO/_health: debe devolver {"ok":true} sin modificar registros.
2. Abrir https://DOMINIO/admin/ e iniciar sesión con las credenciales aprovisionadas.
3. Crear exclusivamente clientes ficticios; no importar datos reales inicialmente.
4. Comprobar Básico, Medio y Avanzado, permisos, creación de registros y PDF.
5. Probar sesiones separadas de dos empresas y que no puedan ver sus archivos.
6. Retirar Almacén de un cliente y comprobar el bloqueo de su descarga directa.
7. Reiniciar y volver a desplegar; verificar que permanecen los datos ficticios.
8. Probar respaldo y restauración en un destino separado antes de clientes reales.

El código no se publica al ejecutar npm run build. Una nueva versión en GitHub
requiere que GoDaddy despliegue esa misma rama/commit y reciba las variables.
El mensaje antiguo 'VPS startup failed: verify origin, data directory and credential
configuration' indica una versión anterior del servidor: la actual informa los
requisitos ausentes por nombre. No desactivar esas validaciones para entrar.
