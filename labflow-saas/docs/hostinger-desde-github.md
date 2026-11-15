# Conectar MySQL desde GitHub, sin Hostinger Connector

## Alcance

La automatización usa GitHub Actions → SSH → herramientas de mantenimiento aisladas en el alojamiento. No usa el conector MCP. No descarga bases ni respaldos a GitHub ni a la computadora del propietario, no elimina bases antiguas, no modifica `main`, no cambia las variables del alojamiento y no inicia despliegues. Sólo envía código público de la revisión seleccionada y muestra rutas y conteos, nunca el contenido de los registros.

El proceso Node del servidor SSH debe ser versión 24 o superior. Si el Node del panel no está en el PATH de SSH, definir la variable de GitHub `HOSTINGER_NODE_BIN` con la ruta absoluta del ejecutable Node 24 confirmado por Hostinger. No adivinarla. El servidor necesita acceso npm para instalar `mysql2`, y MySQL debe aceptar conexiones desde ese servidor. No se requiere abrir MySQL a los ejecutores públicos de GitHub.

## Preparación una sola vez

En GitHub → repositorio → Settings → Environments, crear `hostinger-maintenance`. Para la ejecución de migración se recomienda habilitar revisores si el plan lo permite. Las credenciales del panel Node no se transfieren automáticamente a GitHub.

Agregar estos secretos al entorno:

| Secreto | Contenido |
|---|---|
| `HOSTINGER_SSH_PRIVATE_KEY` | Clave privada de una llave SSH dedicada cuyo componente público se agregó a la cuenta Hostinger. Nunca pegarla en el chat ni en archivos del repositorio. |
| `HOSTINGER_SSH_KNOWN_HOSTS` | Entrada OpenSSH verificada para `[201.58.99.66]:65002`. Comparar su huella con hPanel antes de confiar en ella. |
| `HOSTINGER_MYSQL_PASSWORD` | La contraseña de MySQL ya configurada en el panel. Sólo necesaria para migrar. |
| `HOSTINGER_BACKUP_ENCRYPTION_KEY` | El mismo valor privado de `BACKUP_ENCRYPTION_KEY` existente; 64 caracteres hexadecimales. Sólo necesario para migrar. |
| `HOSTINGER_MYSQL_SSL_CA` | CA del proveedor, si requiere una específica. No desactivar TLS para evitar errores de certificado. |

No es necesario crear tokens de GitHub personales ni compartir la contraseña SSH. Si Hostinger no admite llaves SSH para esta cuenta, esta vía debe revisarse con el proveedor antes de ejecutarla. Para preparar una llave en una computadora de confianza puede usarse `ssh-keygen -t ed25519 -f qubolabs-actions`; no reutilizar una llave personal. La automatización requiere una llave sin frase de paso o un agente de llaves adaptado; protegerla como secreto, limitar el acceso al repositorio y revocarla al terminar si es temporal. La clave pública `.pub` va en Hostinger; la privada sólo en Secrets de GitHub.

`ssh-keyscan -p 65002 201.58.99.66` obtiene una entrada candidata, no prueba su identidad. Guardarla temporalmente, comprobar la huella con `ssh-keygen -lf archivo` y compararla con hPanel antes de cargarla en `HOSTINGER_SSH_KNOWN_HOSTS`. No aceptar una huella únicamente por provenir de la misma red que se intenta verificar.

El workflow incluye host, puerto y usuario SSH facilitados por el propietario. Se pueden reemplazar con variables `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_USER` del entorno. Incluye también los identificadores MySQL del alojamiento; no incluye contraseñas. TLS está activado por defecto. Sólo permitir `HOSTINGER_MYSQL_SSL=false` si el proveedor confirma que la conexión ocurre en localhost y se ajusta el host en el workflow; el backend rechaza conexiones remotas de producción sin TLS.

## Primera ejecución: inspección sin cambiar producción

El workflow `Preparar MySQL en Hostinger` se ejecuta al cambiar sus herramientas o `.github/hostinger-maintenance-request.json` en la rama `fix/persistent-storage-password-eye`. La solicitud inicial usa `inspect`.

Después de agregar los dos secretos SSH, abrir Actions → Preparar MySQL en Hostinger y volver a ejecutar todos los jobs de la ejecución inicial, o editar el archivo de solicitud en esa rama y confirmar un nuevo commit. La salida muestra todas las bases accesibles hasta profundidad 12, ruta absoluta, fecha, tamaño, número de objetos y presencia de administrador; no imprime nombres de clientes ni contraseñas. No decide cuál es la base activa sólo por su fecha o cantidad de objetos. Si hay registros repartidos entre versiones, reconciliarlos antes de elegir una sola base; la migración no fusiona automáticamente versiones divergentes.

`workflow_dispatch` permite seleccionar la rama en la interfaz cuando el workflow también exista en la rama predeterminada. Para evitar publicar prematuramente `main`, la alternativa de commits sobre el archivo de solicitud funciona desde la rama independiente y no depende de `workflow_dispatch`.

## Migración única

1. Confirmar la ruta activa y revisar los conteos. Asegurar que las bases anteriores sigan disponibles y que no haya registros que deban reconciliarse. Confirmar acceso MySQL y TLS y política de respaldo.
2. Añadir los dos secretos de migración y CA si corresponde. No crear el administrador con `mysql:setup`: la identidad existente se migra.
3. En Hostinger, detener las escrituras de TODOS los usuarios y tareas durante la copia y hasta el cambio de backend. Esta automatización no detiene el sitio por su cuenta. No marcar `writesPaused=true` mientras la aplicación siga aceptando cambios. Si no se puede hacer una pausa verificable, no migrar todavía.
4. Editar `.github/hostinger-maintenance-request.json` en la rama independiente:

```json
{
  "mode": "migrate",
  "source": "/ruta/absoluta/confirmada/nodejs/data/cubolabs.sqlite",
  "writesPaused": true
}
```

El commit dispara el workflow. Se crea una carpeta privada de herramientas en `$HOME/.qubolabs-maintenance/<run>-<attempt>`; se instalan dependencias de producción allí. Antes de copiar MySQL se hacen respaldos consistentes y cifrados de TODAS las bases encontradas, incluyendo datos WAL. Se conservan en `$HOME/.qubolabs-preserved/<fecha>` con un manifiesto de rutas. Un directorio ilegible o una base inválida debe resolverse antes de continuar. El MySQL de destino debe estar vacío de datos Qubo Labs.

La migración ya existente usa transacción, verifica conteos y bytes y conserva los archivos originales. No se confunden credenciales MySQL con las del administrador del sistema. Si falla, no activar MySQL ni reintentar sobre tablas que contengan datos; las copias y el origen se conservan.

5. Con el resultado verificado y las escrituras aún detenidas, configurar `DB_DRIVER=mysql` en Hostinger y la configuración TLS verificada. Elegir ANTES del despliegue una política de respaldo: confirmar que las copias administradas incluyen ese MySQL y una recuperación ensayada, o configurar el programador cifrado R2. El backend exige configuración válida y una base inicializada; no publica un sistema vacío ni omite controles para arrancar.
6. Promover la versión probada de la rama a `main` o cambiar conscientemente la rama de despliegue del panel. No activar un despliegue de `main` antiguo con `DB_DRIVER=mysql`: ese código no implementa el backend nuevo. Coordinar cambio de variables/código durante el mantenimiento, verificar clientes, usuarios, archivos y permisos y reabrir las escrituras sólo después.
7. Restablecer el archivo de solicitud a `inspect` con `source` vacío y `writesPaused=false`. Ensayar una actualización con datos sintéticos y confirmar su conservación. Configurar respaldo periódico y retención fuera de los directorios de versión; las copias previas a migración no sustituyen el respaldo continuo de MySQL.

La clave de cifrado debe preservarse en secretos protegidos: sin ella no se pueden restaurar las copias. El espacio bajo HOME debe confirmarse como duradero para las copias previas; mantener copia externa automática (R2 o proveedor) para cubrir pérdida completa del alojamiento.

## Reversión

Antes de reabrir escrituras, si falla el cambio, restaurar la configuración y versión anterior apuntando al SQLite original confirmado. No usar por defecto un `/data` vacío. No eliminar MySQL ni SQLite al revertir.

Después de nuevas operaciones sobre MySQL, no volver a un SQLite antiguo: detener cambios y recuperar MySQL en un destino separado o conciliar las operaciones posteriores. El flujo no realiza una sincronización inversa automática. Las instrucciones de recuperación están en `mysql-hostinger-y-conservacion.md`.

## Costos y límites

GitHub Actions consume los minutos incluidos en el plan; pueden existir cargos si se supera su cuota. No se compra infraestructura ni se contrata una nueva base. Se utiliza el MySQL y SSH existentes, sujetos a límites del plan, espacio y conectividad. Los respaldos locales consumen almacenamiento; R2 y copias externas tienen sus propias tarifas. La ejecución completa sobre Hostinger sigue pendiente de credenciales válidas y no se considera verificada por pasar los ensayos locales.
