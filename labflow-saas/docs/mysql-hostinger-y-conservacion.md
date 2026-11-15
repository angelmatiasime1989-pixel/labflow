# MySQL en Hostinger y conservación de información

## Lo que demuestra el código actual

La versión publicada antes de esta rama usa SQLite, independientemente de que se haya creado una base MySQL en hPanel. El asistente “Conecta una base de datos” mostrado por Hostinger ofrece guías de Supabase y MongoDB Atlas; no confirma por sí mismo la vinculación de MySQL ni realiza esta migración.

Esta rama prepara un backend MySQL con tablas propias `qubolabs_*`. Conserva los módulos, interfaces, archivos, registros y reglas de acceso existentes. El contenido de cada laboratorio mantiene su separación y sus revisiones de concurrencia. Las credenciales, versiones y sesiones del superadministrador también pasan a MySQL, para no perder acceso administrativo tras sustituir el código.

## Activación segura

1. Conservar la base SQLite actual antes de desplegar. No dar por supuesto que la copia diaria del alojamiento incluya los archivos generados por el proceso Node.
2. Confirmar que el servidor MySQL creado sea accesible desde el entorno Node de Hostinger. La existencia de una base en otro producto o plan no garantiza esa conectividad. Revisar host, puerto, permisos de red, usuario y TLS con el proveedor; no seleccionar Supabase ni MongoDB únicamente por aparecer en la guía.
3. Preparar el código de esta rama y sus dependencias en una carpeta de herramientas independiente. No hacer checkout sobre el directorio de producción mientras sus datos estén allí.
4. Configurar las variables privadas de conexión, conservando las demás variables existentes. No sustituir secretos por valores enmascarados y no subir un `.env` a GitHub.
5. Durante el corte, detener escrituras y ejecutar `npm run mysql:migrate -- --from /ruta/actual/cubolabs.sqlite` con la clave privada de respaldo existente y un directorio de copias seguro.
6. La migración genera primero un respaldo SQLite cifrado, comprueba que el destino no contenga registros Qubo Labs, copia en una transacción y verifica conteos y bytes de objetos. Conserva el origen y rechaza sobrescribir MySQL si se repite sobre un destino ocupado.
7. Cambiar `DB_DRIVER=mysql` en el alojamiento sólo después de comprobar la migración. El arranque no crea automáticamente otro administrador ni un sistema vacío si MySQL aún no tiene datos inicializados.
8. Verificar clientes, usuarios, adjuntos, acceso del administrador y sesiones. Ensayar un nuevo despliegue con datos sintéticos y comprobar su conservación.

No ejecutar `mysql:setup` antes de migrar: es únicamente para una instalación realmente nueva mediante `--initialize-new-installation`, o un restablecimiento expresamente autorizado mediante `--reset`.

## Variables

| Nombre | Uso |
|---|---|
| `DB_DRIVER` | `mysql` después de migrar. `sqlite` conserva la compatibilidad anterior. |
| `DB_HOST` | Host confirmado para el proceso Node. `localhost` sólo si el servicio realmente es accesible allí. |
| `DB_PORT` | Puerto del servidor; `3306` si corresponde. |
| `DB_NAME` | Base dedicada que ya creó el propietario. |
| `DB_USER` | Usuario con permisos sobre esa base. |
| `DB_PASSWORD` | Contraseña en secretos de Hostinger. No debe enviarse al chat. |
| `DB_SSL` | `true` para MySQL remoto en producción. |
| `DB_SSL_CA` | Certificado CA si lo requiere el proveedor; no se desactiva la validación del certificado. |

La base debe permitir tablas InnoDB y operaciones transaccionales. Revisar `max_allowed_packet` para el tamaño de los objetos y archivos que utilice el laboratorio. Los archivos ya existentes se conservan como datos binarios; la configuración del servidor debe admitirlos. Para volúmenes mayores se puede separar almacenamiento de archivos y datos sin reconstruir las pantallas.

## Respaldos sin descargas a la computadora

Hay dos opciones que deben verificarse antes de producción:

- **Copias administradas por Hostinger:** confirmar que los respaldos diarios incluyan la base MySQL vinculada y verificar una restauración aislada. En ese caso puede desactivarse el programador de la aplicación expresamente con `BACKUP_AUTO_ENABLED=false`, manteniendo la política del proveedor activa. La captura que muestra “Diariamente” no prueba por sí sola el alcance de la copia.
- **Programador de Qubo Labs con R2:** `BACKUP_AUTO_ENABLED=true`, la clave de cifrado actual y las credenciales privadas del bucket. Genera una instantánea transaccional consistente de MySQL, la cifra y la envía automáticamente. En producción MySQL exige por defecto destino externo para este programador, pues su carpeta temporal de copias puede desaparecer al redesplegar. No hace falta descargar archivos manualmente.

Los respaldos MySQL usan formato `QUBOMYSQL1`; los SQLite existentes conservan `CUBOLABS1`. Para MySQL, `npm run mysql:restore -- archivo.clbackup --confirm` exige un destino vacío, valida el cifrado, restaura en transacción y rechaza sobreescribir datos existentes. Realizar las recuperaciones inicialmente en una base separada. No restaurar una copia antigua sobre operaciones posteriores sin conciliarlas.

`npm run storage:inspect` reconoce ambos backends y muestra conexión, inicialización y conteos sin imprimir claves.

## Validación automatizada

Pruebas sobre MySQL 8 real, aislado y con datos sintéticos: migración desde SQLite incluyendo binarios y sesiones; comparación de bytes; concurrencia por etag; prefijos y paginación; mutaciones por laboratorio; permisos y rechazo de cabeceras externas; cambio obligatorio de contraseña y revocación; límite de intentos; rechazo de migración repetida; respaldo cifrado y recuperación; y sustitución de la carpeta de versión conservando registros y acceso.

La integración de GitHub incluye un servicio MySQL de prueba. Las credenciales de ese servicio son ficticias y no corresponden al alojamiento del usuario.

## Pendiente en el alojamiento real

Autorizar Hostinger Connector o disponer del acceso operativo necesario, localizar el SQLite vigente, confirmar conectividad y copias de MySQL, configurar secretos y realizar el corte. El código se integra en `main` por solicitud del propietario. La activación en el alojamiento sigue pendiente: un cambio de código por sí solo no recupera ni transporta los datos almacenados en una carpeta efímera. No redesplegar antes de preservar el origen y coordinar la conexión y migración.
