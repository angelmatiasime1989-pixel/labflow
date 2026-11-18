# Validación MySQL — 2026-11-18

Base inicial: `00b5c9d`; correcciones posteriores a `b494afb`. Node 24.19.0, MySQL 8.4.13 y MariaDB 11.8.9-ubu2404 en contenedores aislados locales. Sin credenciales ni acceso productivo. No se publicó a main.

| Verificación | Resultado |
|---|---|
| Build y validación raíz | PASS |
| `npm test`: 34 suites históricas | 34/34 PASS (detalle abajo) |
| Standalone SQLite/HTTP, respaldo cifrado y restauración | PASS |
| Pruebas Node de landing/primer login/SaaS/trial/offline (repetidas tras corrección) | 48/48 PASS |
| `npm run test:mysql`: integración HTTP y almacenamiento MySQL | PASS; detalle abajo |
| Flujos compartidos con MySQL (landing/SaaS/trial/offline) | 42/42 PASS; dos comprobaciones de archivos SQLite usan explícitamente SQLite |
| Offline después de añadir concurrencia | 9/9 PASS SQLite y 9/9 PASS MySQL |
| Chromium real, principal MySQL, trial separado | 16/16 PASS |
| MySQL con max_allowed_packet=32 MiB | Arranque rechazado; restaurado a 64 MiB en servidor aislado |
| Copia Hostinger: npm ci --omit=dev, build, validate | PASS |
| npm audit --omit=dev | 0 vulnerabilidades reportadas |
| Sincronización y git diff --check | PASS |

Integración MySQL: arranque desde base vacía; rechazo de configuración parcial/conexión fallida sin archivo SQLite; bloqueo de cabeceras falsas y CSRF; cambio obligatorio de contraseña persistente tras reiniciar; rotación de sesiones; dos laboratorios aislados; alta de registro; PDF generado y analizado; adjunto binario íntegro; 20 INSERT condicionales concurrentes con un ganador y 20 CAS sobre un ETag con un ganador entre dos pools; rollback y ausencia de lectura sucia desde otra conexión; listado/paginación con claves binarias y prefijos literales; LONGBLOB de 50 MiB íntegro; borrado por lote sólo de objetos sintéticos; conservación tras reiniciar HTTP y pool; límites de login concurrentes; reset conserva cuenta y revoca sesiones.

Offline concurrente: dos aperturas conservan ambas selecciones; ocho descargas PDF simultáneas terminan sin agotar las conexiones reservadas para metadatos. Chromium: cifrado local, sincronización, descarga interrumpida, arranque offline con servidor inaccesible, reconexión, actualización de service worker, cuota simulada, eliminación individual, revocación, cierre de sesión; comercial y trial en contextos de navegador separados.

La primera ejecución del navegador detectó una espera insuficiente del test: comprobaba el mensaje de autorización antes de terminar el render asíncrono del formulario. Se añadió una espera al campo concreto y la ejecución completa pasó. La primera ejecución de suites compartidas encontró dos fixtures que asumían archivo SQLite; ahora esas comprobaciones declaran explícitamente ese motor y las demás usan MySQL real.

## Resultados individuales de suites históricas

- `cubolabs-test`: PASS (exit 0).
- `module-tabs-test`: PASS (exit 0).
- `saas-test`: PASS (exit 0).
- `sales-profile-test`: PASS (exit 0).
- `startup31-test`: PASS (exit 0).
- `test`: PASS (exit 0).
- `ui-test`: PASS (exit 0).
- `v11-test`: PASS (exit 0).
- `v12-test`: PASS (exit 0).
- `v13-test`: PASS (exit 0).
- `v14-test`: PASS (exit 0).
- `v15-test`: PASS (exit 0).
- `v16-test`: PASS (exit 0).
- `v17-test`: PASS (exit 0).
- `v18-test`: PASS (exit 0).
- `v19-test`: PASS (exit 0).
- `v24-test`: PASS (exit 0).
- `v27-test`: PASS (exit 0).
- `v28-test`: PASS (exit 0).
- `v29-test`: PASS (exit 0).
- `v30-test`: PASS (exit 0).
- `v32-test`: PASS (exit 0).
- `v33-test`: PASS (exit 0).
- `v34-test`: PASS (exit 0).
- `v35-test`: PASS (exit 0).
- `v37-test`: PASS (exit 0).
- `v38-test`: PASS (exit 0).
- `v40-test`: PASS (exit 0).
- `v42-test`: PASS (exit 0).
- `v6-test`: PASS (exit 0).
- `v7-test`: PASS (exit 0).
- `v8-test`: PASS (exit 0).
- `v9-test`: PASS (exit 0).
- `workflow-audit-test`: PASS (exit 0).

## Límites de lo verificado

El agente del panel informó MariaDB 11.8.9-MariaDB-log, max_allowed_packet de 1 GiB, ALL PRIVILEGES sobre la base asignada y variables DB_*/administrador presentes. No se comprobó desde este entorno la conexión Node, credenciales o TLS/CA de Hostinger; no hay credenciales productivas aquí. No se ejecutó despliegue, migración, borrado, respaldo o restauración de producción. No se comprobó restauración de dump MySQL ni pérdida de energía del servidor de base. La persistencia probada incluye reinicios del proceso web y de sus conexiones. Chromium se ejecutó en Linux; instalación PWA nativa en Windows no disponible. No es una prueba de carga.

La prueba pública requiere su archivo temporal independiente y limpieza externa antes de habilitarla en Hostinger. Los comandos backup/restore existentes sólo son SQLite y se bloquean cuando hay DB_*; usar respaldos MySQL del proveedor/dump consistente. Ver `docs/mysql.md` para activación y reproducción.


## Corrección tras revisión independiente

`reset=false` usa únicamente INSERT exclusivo. Un duplicado produce `PROVIDER_EXISTS`; no ejecuta UPDATE ni DELETE de sesiones. El arranque `ensureProvider` recupera la identidad ganadora después del rollback y continúa; el CLI setup continúa rechazando sobrescribir sin --reset. El reset explícito usa UPDATE separado y conserva ID.

La validación previa consulta information_schema y rechaza motor no InnoDB, tipos/longitudes/nulabilidad incorrectos, columnas ausentes/adicionales/desordenadas, collation incorrecta y claves primarias/índices únicos incompatibles. Se ejecuta antes de cualquier CREATE, y otra vez tras crear sólo las tablas faltantes. No realiza ALTER ni corrige datos.

| Prueba nueva o repetida | MySQL 8.4.13 | MariaDB 11.8.9 |
|---|---|---|
| Dos pools, READ COMMITTED, perdedor conserva hash/ID/sesiones | PASS | PASS |
| Dos procesos HTTP, READ COMMITTED, ambos arrancan con cuenta ganadora | PASS | PASS |
| Dos pools, REPEATABLE READ, perdedor conserva hash/ID/sesiones | PASS | PASS |
| Dos procesos HTTP, REPEATABLE READ, ambos arrancan con cuenta ganadora | PASS | PASS |
| Rechazo de MyISAM, BLOB corto, PK incorrecta, columna ausente, clave no binaria, expiración nullable e índice único extra | 7/7 PASS | 7/7 PASS |
| Esquema válido reabre sin modificar filas | PASS | PASS |
| Integración HTTP, objetos/ETags, rollback, 50 MiB, PDF, sesiones y reinicios | PASS | PASS |
| Flujos compartidos SaaS/comerciales/trial/offline | 42/42 PASS | 42/42 PASS |
| Chromium real sobre MariaDB (offline cifrado, revocación, trial, comercial) | No repetido en esta corrección | 16/16 PASS |

La prueba de dos procesos fuerza que ambos hayan observado la ausencia de proveedor antes de liberar el INSERT ganador. Después inserta una sesión sintética y libera al perdedor, comprobando que éste no cambió ninguna columna de la cuenta ni esa sesión. Los casos de esquema dejan una tabla faltante deliberadamente: el rechazo no la vuelve a crear ni cambia las filas testigo. Todas las alteraciones de fixtures afectan exclusivamente bases aleatorias de contenedores locales.

La primera construcción del fixture MyISAM intentó convertir la tabla objects, cuya clave de 1024 bytes excede el máximo MyISAM de 1000. Se corrigió el fixture para convertir provider; las 12 comprobaciones pasaron después en ambos motores. No fue un fallo de ejecución de la aplicación.

Revisión independiente de sólo lectura posterior: ambos hallazgos anteriores resueltos y ningún nuevo bloqueo de código. Observó que el validador es deliberadamente estricto y que los rechazos específicos por collation/orden no tienen casos dedicados (sí son comprobados por el código).

Después de las correcciones se repitieron build, validate y npm test completo: 34 suites históricas, standalone SQLite/HTTP/respaldo/restauración y 48 pruebas Node, todas PASS. Sincronización de 226 archivos y git diff --check aprobados.
