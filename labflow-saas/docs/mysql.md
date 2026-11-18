# Persistencia MySQL en Hostinger

## Activación

1. Usar Node 24.x, rama `main`, raíz `labflow-saas`, instalación `npm ci` (incluye `mysql2` como dependencia de producción), build `npm run build`, entrada `server/index.mjs`, salida `.`. Publicar sólo después de revisar el commit: el push a main dispara el despliegue automático.
2. En el panel privado conservar `DB_HOST`, `DB_PORT` (normalmente 3306), `DB_NAME`, `DB_USER` y `DB_PASSWORD` con los valores reales asignados por Hostinger. No ponerlos en Git. No se presupone que el host sea localhost. Cualquier DB_* no vacía selecciona MySQL; credenciales incompletas, errores de conexión, permisos o esquema impiden arrancar. SQLite sólo se selecciona si todas están vacías.
3. La base debe existir. El usuario necesita CREATE, SELECT, INSERT, UPDATE y DELETE sobre ella; no necesita privilegios globales ni crear bases. Se crean siete tablas InnoDB con `CREATE TABLE IF NOT EXISTS`, sin borrar o reemplazar filas/tablas. No hay importación automática desde SQLite ni recuperación de archivos de otras versiones de Hostinger. Usar una base vacía dedicada; esta entrega no migra registros previos.
4. Comprobar `SELECT VERSION(), @@max_allowed_packet;`. Se requiere MySQL 8.x y `max_allowed_packet >= 67108864`. El proceso falla antes de escuchar HTTP si el límite es menor; solicitar el ajuste al proveedor. `objects.value` es LONGBLOB y admite objetos de hasta 50 MiB. El límite del cuerpo HTTP también sigue siendo 50 MiB; los límites específicos de cada módulo siguen aplicándose. Si la base requiere TLS, proporcionar `DB_SSL_CA` como ruta a su CA de confianza; nunca desactivar la validación del certificado.
5. Conservar `NODE_ENV=production` y `PUBLIC_URL=https://qubolabs.tech` y la configuración HOST/PORT suministrada por el alojamiento. Para la base vacía, configurar privadamente `CUBOLABS_ADMIN_USERNAME`, `CUBOLABS_ADMIN_PASSWORD` (12–128 caracteres), opcionalmente `CUBOLABS_ADMIN_NAME`, y `CUBOLABS_ADMIN_FORCE_PASSWORD_CHANGE=true`. Alternativamente ejecutar `npm run setup` en el mismo entorno. El primer arranque crea el proveedor; reiniciar no sobreescribe una cuenta existente. Después cambiar la contraseña temporal desde la interfaz. `npm run setup -- --reset` es una operación explícita que conserva el ID y revoca sesiones.
6. Verificar login, creación de laboratorio, registro y PDF/adjunto; reiniciar la aplicación y comprobar conservación. Confirmar tablas y crecimiento de objetos en MySQL. No basta que la portada responda. Conservar las DB_* al desplegar futuras versiones; retirarlas cambia deliberadamente el motor.

## Qué persiste y cómo

`objects` guarda los objetos existentes del SaaS: plataforma, estados por laboratorio, sesiones de laboratorio, adjuntos, informes y respaldos internos. Conserva claves y bytes; no transforma los registros de negocio en tablas relacionales. Las claves son binarias (distinguen mayúsculas), los ETags son opacos y cada PUT genera uno nuevo. INSERT exclusivo y UPDATE con ETag en el WHERE garantizan un solo ganador entre procesos; no hay lectura seguida de escritura incondicional para CAS.

`provider`, `provider_sessions` y `login_attempts` guardan identidad, hashes de contraseña, sesiones y límites de autenticación. Cada transacción usa una conexión reservada del pool, con commit/rollback y liberación en finally. El proveedor se bloquea durante autenticación y cambios de contraseña para evitar límites perdidos y sesiones obsoletas. Las tablas offline usan esa misma exclusión breve para sus actualizaciones; la conexión se libera antes de generar PDFs o consultar objetos. Esto prioriza consistencia; no es una prueba de carga de alta escala.

`offline_devices`, `offline_nonce` y `offline_sessions` persisten autorizaciones, pruebas anti-repetición y selección de documentos si `OFFLINE_DOCUMENTS_ENABLED=true`. Los documentos cifrados del navegador siguen en IndexedDB. La funcionalidad permanece desactivada si la variable no se habilita.

La prueba pública de 24 horas **sigue usando SQLite temporal dedicado**, por diseño: no se mezcla con la base MySQL operativa ni con sus respaldos. Mantener `PUBLIC_TRIAL_ENABLED=false` hasta contar con `PUBLIC_TRIAL_DB` absoluto fuera del código, DATA_DIR y BACKUP_DIR, almacenamiento independiente de las versiones de despliegue y limpieza externa mediante `npm run trial:cleanup`. Sin esas condiciones la prueba permanece indisponible; no se promete durabilidad/limpieza de un archivo efímero de Hostinger. Las pruebas cubren operación, aislamiento y expiración junto al motor MySQL principal.

## Respaldos

`npm run backup` y `npm run restore` son exclusivos de SQLite y rechazan DB_* configuradas para evitar respaldar/restaurar una base local equivocada. No hacen respaldo MySQL. Usar respaldos del panel Hostinger o un dump consistente de InnoDB, por ejemplo:

```sh
mysqldump --defaults-extra-file=/ruta/privada/mysql-client.cnf --single-transaction --quick --hex-blob --no-tablespaces --max-allowed-packet=64M NOMBRE_BASE > /ruta/privada/backup.sql
```

El archivo de opciones contiene las credenciales y debe tener permisos 600. El dump contiene datos sensibles: cifrar y custodiar fuera del hosting, excluirlo de Git y probar restauración en una base separada antes de depender de él. La prueba temporal no forma parte del respaldo operativo. No se ejecutaron respaldos ni restauraciones de producción en esta entrega.

## Reproducir pruebas reales aisladas

No ejecutar contra producción. La suite ignora DB_* y sólo conecta a 127.0.0.1, puerto `MYSQL_TEST_PORT` (3307 por defecto), con credenciales sintéticas fijas. Crea bases `qubo_test_<aleatorio>`; nunca borra bases existentes. Requiere un servidor exclusivamente de pruebas:

```sh
docker run -d --name qubo-mysql-integration -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 127.0.0.1:3307:3306 mysql:8.4 --max-allowed-packet=67108864
# Esperar a que el servidor esté listo.
docker exec qubo-mysql-integration mysql -uroot -e "CREATE USER 'qubo_test'@'%' IDENTIFIED BY 'Synthetic-Integration-Only'; GRANT ALL ON \`qubo_test_%\`.* TO 'qubo_test'@'%';"
npm ci
npm run build
npm run validate
npm test
npm run test:mysql
MYSQL_TEST=true npm run test:pwa-browser
npm run sync:hostinger
npm run check:hostinger-source
```

El último test necesita Chromium local (`CHROMIUM_BIN`, por defecto `/usr/bin/chromium`). La suite MySQL comprueba HTTP real, reinicios de proceso/pool, contraseña temporal, sesiones y revocación, registros, aislamiento, PDFs, adjuntos, 50 MiB, transacciones y dos pools concurrentes/ETags. Las suites compartidas prueban rutas comerciales, trial y offline; las dos pruebas específicas de archivos SQLite usan explícitamente SQLite. Los resultados no demuestran funcionamiento en producción ni conectividad con Hostinger.
