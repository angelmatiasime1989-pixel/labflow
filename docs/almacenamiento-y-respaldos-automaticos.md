# Actualizaciones que conservan la información

## Estado de esta entrega

El botón de mostrar contraseña utiliza una columna independiente de 44 px: no se superpone al texto y respeta las reglas del formulario de acceso. Se corrigieron tanto el acceso de laboratorios como el administrativo.

Las herramientas de almacenamiento y respaldo se integran en `main` por solicitud del propietario. Antes de desplegarlas en producción, identificar la base vigente, confirmar el almacenamiento persistente y conservar una copia consistente fuera del directorio que se sustituye al desplegar.

El código no puede convertir una carpeta efímera en un volumen persistente ni recuperar registros que ya fueron borrados por el proveedor. Si faltan datos, revisar primero las copias de Hostinger y preservar cualquier base encontrada.

El arranque Node ya no crea una base ni un administrador automáticamente, incluso si `NODE_ENV` se configuró por error como desarrollo. Las variables de contraseña no inicializan ni restablecen instalaciones al publicar código. Para una instalación nueva se ejecuta `npm run setup` de forma explícita (en producción con `--initialize-new-installation`); no hacerlo para intentar recuperar registros.

Si falta la base, el servidor detiene el arranque con un diagnóstico en lugar de presentar un sistema vacío. Este comportamiento evita nuevas instalaciones silenciosas, pero no puede crear un volumen persistente del proveedor ni recuperar registros de una carpeta de versión anterior por sí solo. Antes de redesplegar se deben preservar los datos reales y configurar el destino.

## Protección de arranque

En producción se requieren `DATA_DIR` y `BACKUP_DIR` absolutos, fuera del código de la aplicación y de las carpetas del proyecto que se renuevan al desplegar. También se comprueban rutas mediante enlaces simbólicos. Una ruta absoluta por sí sola no prueba persistencia: el proveedor debe garantizarla y la aplicación debe poder acceder a ella.

Si falta `cubolabs.sqlite`, o no contiene una instalación reconocible con administrador, el servidor se detiene en lugar de crear silenciosamente un sistema vacío. Las credenciales iniciales del entorno no reinicializan producción.

Sólo una instalación realmente nueva puede inicializarse expresamente con `npm run setup -- --initialize-new-installation`. No utilizar esa opción para intentar recuperar datos desaparecidos. `npm run dev` es temporal y se bloquea cuando `NODE_ENV=production`; producción debe usar `npm start` o `server/index.mjs`.

## Respaldos automáticos, sin descargas manuales

- Activados por defecto en producción cuando `BACKUP_AUTO_ENABLED` está vacío o no existe; `true` también los activa en desarrollo. `false` los desactiva expresamente.
- Copias consistentes mediante la API de backup de SQLite, incluyendo transacciones confirmadas presentes en WAL. La aplicación puede seguir operando durante los respaldos periódicos.
- Cifrado AES-256-GCM compatible con los archivos `.clbackup` y el restaurador existente.
- Respaldo al iniciar el proceso y cada 24 horas de ejecución, configurable entre 1 y 168 horas.
- Respaldo al detectar un cambio del código, antes de abrir la base con las migraciones de arranque de la nueva versión. Esto presupone que los datos ya están fuera del directorio reemplazable.
- Retención local de 30 días, configurable; se conserva siempre la copia más reciente. No se eliminan archivos ajenos al formato del servicio.
- Si falla el respaldo periódico, se conserva la copia local, se registra un error sin claves y se reintenta a los 15 minutos.
- Se escribe `.last-success.json` en el directorio de respaldos después de un resultado satisfactorio, para supervisar su antigüedad.

### Variables del servidor

| Variable | Configuración |
|---|---|
| `NODE_ENV` | `production`. |
| `DATA_DIR` | Ruta persistente real confirmada por Hostinger. No usar `./data` en producción. |
| `BACKUP_DIR` | Otra ubicación persistente fuera del código. Puede estar en el mismo volumen de datos, pero no sustituye una copia externa. |
| `BACKUP_ENCRYPTION_KEY` | Conservar la clave privada actual de 64 caracteres hexadecimales. No cambiarla al desplegar. Guardarla también en un gestor de secretos para recuperación. |
| `BACKUP_AUTO_ENABLED` | Vacío o `true` en producción. |
| `BACKUP_INTERVAL_HOURS` | `24` por defecto. |
| `BACKUP_RETENTION_DAYS` | `30` por defecto. |
| `R2_ACCOUNT_ID`, `R2_BUCKET` | Cuenta y bucket privados elegidos para producción; no se crea ni contrata ningún recurso automáticamente. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Credenciales privadas con acceso al bucket necesario. No compartirlas en el chat ni subirlas a GitHub. |
| `BACKUP_REMOTE_PREFIX` | `qubolabs-backups` por defecto. Se añade un identificador de instalación para separar copias. |
| `BACKUP_REMOTE_REQUIRED` | `true` si se exige copia externa. Sin R2 completo, detiene el arranque protegido antes de actualizar la base. |

Si se configura R2, cada respaldo cifrado se envía automáticamente mediante solicitudes S3 firmadas. Nunca se envían la base sin cifrar ni su clave de cifrado. El mantenimiento de retención en R2 debe configurarse en el bucket; esta entrega no elimina objetos remotos ni modifica políticas del proveedor.

La copia local protege frente al reemplazo del código cuando el volumen persiste. La copia externa protege además frente a pérdida del servidor. No es necesario descargar respaldos a una computadora para que este procedimiento funcione.

## Migración inicial sin borrar el origen

1. Conectar a Hostinger y verificar el comando de inicio, el archivo de base realmente utilizado y el volumen persistente disponible. No copiar valores de variables enmascaradas al reemplazar el conjunto completo de secretos.
2. Preservar las bases y respaldos existentes. No desplegar ni reinicializar para buscar datos perdidos.
3. Preparar estas herramientas en una carpeta independiente; no hacer `git checkout` ni sustituir archivos en el directorio de producción antes del respaldo.
4. Confirmar la clave de respaldo existente en el entorno privado y las rutas de destino, sin publicarlas.
5. Para la copia final, detener las escrituras de la aplicación durante el corte. El comando puede hacer una copia online consistente, pero las escrituras posteriores a la instantánea no aparecerán en el destino.
6. Ejecutar `npm run storage:migrate -- --from /ruta/actual/cubolabs.sqlite` con `DATA_DIR` y `BACKUP_DIR` apuntando a las ubicaciones persistentes reales. El comando valida y respalda primero; copia y verifica integridad; no sobrescribe destinos existentes ni borra el origen.
7. Configurar únicamente las variables necesarias en el alojamiento, conservando el resto de secretos. Verificar que la ruta se vea igual desde el proceso Node, no solamente desde SSH.
8. Iniciar con `npm start`, comprobar clientes y registros, el respaldo automático y una restauración aislada.
9. Ensayar un nuevo despliegue con registros sintéticos y verificar su conservación antes de reabrir las escrituras normales.

`npm run storage:inspect` muestra rutas, existencia y conteos, sin imprimir contraseñas ni claves. Ejecutarlo con el mismo entorno privado que usa el servidor. No crea una base si falta.

## Recuperación y reversión

No hay restauración automática de una copia antigua sobre información más reciente. Se mantiene el comando explícito `npm run restore -- archivo.clbackup --confirm`, con servidor detenido, validación del cifrado e integridad y conservación de la base previa. La restauración debe probarse en un directorio separado.

Si falla el nuevo código, volver a la revisión anterior manteniendo `DATA_DIR` y la base persistente. No restaurar datos sólo para revertir una corrección visual. Si una modificación de esquema exige restaurar, revisar primero las operaciones posteriores al respaldo para no descartarlas.

## Verificación realizada

Pruebas con datos sintéticos: rutas inseguras y symlinks, arranque sin base, snapshot de WAL, cifrado y restauración, firma/carga R2 simulada, fallos remotos sin borrar la copia local, retención y concurrencia, migración sin sobrescritura y cambio de directorio de versión manteniendo registros y sesiones. La carga real a un bucket del usuario requiere las credenciales y permisos del proveedor; no se han hecho llamadas reales ni compras.

El diseño del ojo se verifica en Chromium a 1280, 390 y 320 px: campo y botón separados, ancho del botón de 44 px, escritura, alternancia de visibilidad y ausencia de envíos accidentales.

## Recuperación del arranque heredado de Hostinger

Cuando la aplicación se ejecuta dentro de `domains/<dominio>/hbuilds/versions/<versión>/nodejs`, `PUBLIC_URL` corresponde a ese dominio y `DATA_DIR` conserva el valor heredado `./data`, `data` o está ausente, el arranque puede recuperar una única base existente. No se activa para otros proveedores, rutas absolutas explícitas ni MySQL. Puede desactivarse con `HOSTINGER_STORAGE_RECOVERY=false`.

La recuperación busca únicamente las ubicaciones SQLite conocidas bajo las versiones, exige un único archivo, administrador existente e integridad válida. Antes de copiarlo genera un respaldo cifrado con la clave actual. Usa una instantánea SQLite que incluye las transacciones confirmadas del WAL, publica el destino de forma atómica y no sobrescribe ni elimina el origen. Si hay varias bases, falta la clave, no existe un administrador o falla la integridad, se detiene; no elige la versión más reciente ni inicializa cuentas nuevas. Ejecutar durante el corte de mantenimiento, sin escrituras por otras instancias.

El destino está junto a `hbuilds`, en `qubolabs-data`, y las copias en `qubolabs-backups`, fuera del código y de `public_html`. El proceso usa esas rutas efectivas aunque las variables antiguas sigan siendo relativas. El log informa las rutas sin claves. En los siguientes despliegues reutiliza la base y la identidad recuperadas. Si después desaparece ese destino, un marcador impide volver silenciosamente a la copia antigua. La recuperación sólo conserva lo que exista en la base disponible; no reconstruye información eliminada anteriormente.

Esto separa los registros de las carpetas de versiones, pero se debe confirmar con Hostinger la política de conservación de esas carpetas y respaldar externamente para cubrir pérdida del alojamiento. La migración MySQL sigue siendo una operación explícita aparte.
