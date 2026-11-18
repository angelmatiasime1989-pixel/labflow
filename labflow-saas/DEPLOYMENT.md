# Despliegue de cubolabs independiente

## Variables del servidor

| Variable | Uso |
|---|---|
| `NODE_ENV` | `production` al publicar; exige PUBLIC_URL con HTTPS. |
| `PUBLIC_URL` | Origen público exacto, por ejemplo `https://cubolabs.tudominio.com`, sin subcarpeta. |
| `PORT` | Puerto asignado por el hosting o 3000 en un VPS. |
| `HOST` | Dirección de escucha; `127.0.0.1` detrás de un proxy local. Usar `0.0.0.0` únicamente si la plataforma lo requiere. |
| `DATA_DIR` | Directorio persistente fuera de carpetas que se sustituyan al desplegar. |
| `BACKUP_DIR` | Destino persistente para respaldos cifrados. |
| `BACKUP_ENCRYPTION_KEY` | Clave privada hexadecimal de 64 caracteres. No cambiar sin conservar la clave de respaldos anteriores. |
| `CUBOLABS_ADMIN_USERNAME` | Usuario del proveedor para el primer arranque o restablecimiento. |
| `CUBOLABS_ADMIN_PASSWORD` | Contraseña privada de primer arranque/restablecimiento. No reemplaza una cuenta ya existente durante un arranque normal. |
| `CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE` | `true` exige cambiar la contraseña después del primer login; solo al crear/restablecer la cuenta. |
| `CUBOLABS_ADMIN_NAME` | Nombre inicial del proveedor. |
| `TRUST_PROXY` | `true` solo si existe un proxy local confiable que sustituye X-Forwarded-For. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Opcionales; deben provenir de la cuenta del remitente. |

El servidor elimina las cabeceras de identidad que envíe el navegador. Solo la sesión propia verificada puede crear la identidad interna del proveedor. Las cookies usan HttpOnly y SameSite; en HTTPS también Secure.

## GoDaddy Node.js Hosting o plataforma similar

1. Verifica que permita Node 24, procesos Node persistentes y acceso a disco persistente.
2. Conecta el repositorio. En Hostinger selecciona `labflow-saas` como directorio raíz, Node 24.x, salida `.`, entrada `server/index.mjs`. Usa `npm ci` y `npm run build`; la compilación es nativa de Node y no necesita Python. La raíz del repositorio también permite ejecutar la aplicación fuera de ese selector.
3. Selecciona **`server/index.mjs`** como archivo de entrada, o `npm start` como comando si permite comandos de arranque.
4. Carga las variables del `.env` privado en el panel de variables de Node o instala el archivo `.env` en la raíz de la aplicación. Si el hosting ejecuta directamente `node server/index.mjs`, usa las variables del panel; ese comando directo no carga `.env` automáticamente.
5. Configura `PUBLIC_URL` con el dominio HTTPS real y `NODE_ENV=production`. Respeta el puerto asignado por el proveedor.
6. Usa rutas persistentes para `DATA_DIR` y `BACKUP_DIR`, fuera del checkout que sustituya el despliegue. No publiques esos directorios como archivos estáticos.
7. Arranca y abre `/administrador/ingresar`. Comprueba el alta de un cliente, su acceso, un registro y su conservación tras reiniciar.

La configuración exacta del panel depende del producto contratado. Esta edición no necesita R2, una cuenta de Cloudflare ni identidad de Sites.

## VPS Linux

Ejemplo de organización: código en `/opt/cubolabs`, datos en `/var/lib/cubolabs` y respaldos en `/var/backups/cubolabs`. Ejecuta con un usuario del sistema dedicado que tenga permisos sobre datos y respaldos. Instala Node 24, copia el código y ejecuta `npm ci` y `npm run build`.

Copia la configuración privada a `/etc/cubolabs.env` con permisos `600`; adapta dominio y rutas. El servicio de ejemplo lee ese archivo mediante systemd. El archivo no debe estar bajo una raíz web ni en GitHub.

Adapta `deploy/cubolabs.service` y `deploy/nginx.conf` a tu servidor, habilita HTTPS con tu certificado y arranca el servicio. El proxy debe conservar el origen HTTPS que figura en PUBLIC_URL. Las peticiones de escritura desde otro origen se rechazan.

## Escala y operación

SQLite y los adjuntos están en una sola base local: inicia con **una instancia** de la aplicación y disco local persistente, no un volumen NFS ni múltiples servidores con copias independientes. No usar un despliegue serverless de disco efímero. Se conserva el control de conflictos de edición.

Programa `npm run backup` con el planificador del servidor, usando el mismo archivo de variables, y copia los `.clbackup` a almacenamiento externo. Prueba periódicamente la restauración en otro directorio antes de necesitarla. El comando `restore` conserva la base anterior y rechaza respaldos alterados o claves incorrectas.

Los avisos legales requieren completar la identidad y datos del responsable en el panel SaaS antes de captar prospectos. No se han inventado esos datos ni claves de terceros.

## Contraseña temporal del proveedor

Configurar `CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE=true` junto con las credenciales iniciales. Tras validar la contraseña temporal, el acceso al panel y sus API se bloquea hasta cambiarla en `/administrador/cambiar-contrasena`. El cambio revoca todas las sesiones anteriores y crea una sesión nueva; reiniciar no vuelve a aplicar la contraseña temporal. Si ya existe un administrador, las variables no lo sobrescriben. Para un restablecimiento expresamente autorizado, ejecutar `npm run setup -- --reset` desde el entorno configurado. No cambiar claves de respaldo existentes ni rutas de datos al restablecer credenciales.
