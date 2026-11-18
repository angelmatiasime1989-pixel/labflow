# Validación MySQL — 2026-11-18

Base revisada: `00b5c9d`, Node 24.19.0, MySQL 8.4.13 en Docker aislado local. Sin credenciales ni acceso productivo. No se publicó a main.

| Verificación | Resultado |
|---|---|
| Build y validación raíz | PASS |
| `npm test`: 34 suites históricas | 34/34 PASS (detalle abajo) |
| Standalone SQLite/HTTP, respaldo cifrado y restauración | PASS |
| Pruebas Node de landing/primer login/SaaS/trial/offline | 47/47 PASS |
| `npm run test:mysql`: integración HTTP y almacenamiento MySQL | PASS; detalle abajo |
| Flujos compartidos con MySQL (landing/SaaS/trial/offline) | 41/41 PASS; dos comprobaciones de archivos SQLite usan explícitamente SQLite |
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

No se verificaron la conexión, permisos, versión, TLS/CA o max_allowed_packet del MySQL de Hostinger; no hay credenciales productivas en este entorno. No se ejecutó despliegue, migración, borrado, respaldo o restauración de producción. No se comprobó restauración de dump MySQL ni pérdida de energía del servidor de base. La persistencia probada incluye reinicios del proceso web y de sus conexiones. Chromium se ejecutó en Linux; instalación PWA nativa en Windows no disponible. No es una prueba de carga.

La prueba pública requiere su archivo temporal independiente y limpieza externa antes de habilitarla en Hostinger. Los comandos backup/restore existentes sólo son SQLite y se bloquean cuando hay DB_*; usar respaldos MySQL del proveedor/dump consistente. Ver `docs/mysql.md` para activación y reproducción.
