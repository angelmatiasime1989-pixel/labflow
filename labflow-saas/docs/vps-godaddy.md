# LabFlow en un VPS de GoDaddy

## Alcance y arquitectura

Se conserva el Worker y todas sus interfaces, módulos y membresías. `vps/server.mjs`
ejecuta el mismo `worker/index.js` en Node 24.19.0. No se usa Wrangler para servir
producción. `vps/bucket.mjs` implementa las operaciones de BUCKET que usa LabFlow:
get, head, put condicional por ETag, delete y list paginado.

El destino es **un VPS Linux**, no hosting compartido/cPanel. Recomendación inicial:
Ubuntu 24.04 LTS o Debian compatible, 2 vCPU, 4 GB RAM, SSD local de al menos 40 GB,
Docker Engine y Compose v2. Node 24.19.x y Python 3 se requieren para ensamblado y
pruebas; el script de respaldo también utiliza Node. Confirmar arquitectura del
VPS, espacio para documentos, copias y crecimiento antes de contratar.

Flujo: dominio GoDaddy → Caddy (HTTPS) → contenedor Node → volumen SQLite local.
El frontend sigue incluido en LabFlow. No necesita Cloudflare para funcionar en
el VPS. El despliegue Workers/R2 existente se conserva como alternativa.

SQLite guarda objetos completos, no convierte los módulos a tablas relacionales.
Los UUID, prefijos, JSON y documentos se mantienen. WAL y transacciones locales
protegen las escrituras condicionales de cada objeto. Esto **no** añade transacciones
entre varios objetos de aplicación. Se admite una sola instancia del servicio,
con disco local; no NFS, clusters, réplicas escritoras o balanceo entre VPS.

## Preparación de una versión

Trabajar en una rama de despliegue y registrar el commit elegido. No cambiar main
ni publicar automáticamente. Antes de crear una imagen:

```bash
cd labflow-saas
python3 scripts/assemble.py
npm run build
npm run validate
npm test
```

Usar como `LABFLOW_VERSION` una etiqueta única, idealmente el SHA del commit.
Guardar esa imagen y la versión anterior. El Dockerfile fija Node; actualizar
imágenes y revisar vulnerabilidades de manera controlada. `build.sh` sigue siendo
el build original: hay que ensamblar primero. Los nuevos archivos VPS no se
incluyen en el bundle Workers ni cambian la persistencia R2.

## Secretos, entorno y volumen

1. Crear `/etc/labflow` con acceso administrativo restringido.
2. Generar un JSON independiente con `scripts/admin-credentials.mjs`, recibiendo
   la contraseña por stdin, como explica `docs/phase-one-auth.md`. No ponerla
   en argumentos, historial, Git ni archivos de configuración públicos.
3. Guardar ese JSON en `/etc/labflow/admin-auth.json`.
4. Si se usa correo, guardar solo la clave en `/etc/labflow/resend-key`. Si no,
   crear un archivo vacío para ese secreto. No crear claves ficticias.
5. Los archivos montados como secretos deben ser legibles por UID 1000 del
   contenedor: asignar propietario 1000:1000 y modo 0400 a ambos. Mantener el
   directorio padre protegido; no hacer los archivos legibles globalmente.
6. Copiar `deploy/vps/environment.example` a `/etc/labflow/vps.env`, completar
   dominio, etiqueta, nombre de volumen y rutas. Ese archivo no lleva contraseñas.

`PUBLIC_ORIGIN` se deriva del dominio y utiliza HTTPS. No se confía en Host,
Forwarded ni cabeceras de identidad proporcionadas por visitantes para construir
la identidad o URL pública. El servidor rechaza hosts distintos. Las cookies
seguras y las comprobaciones de Origin se conservan. Solo Caddy publica puertos;
el puerto Node no se publica al host. El login nunca acepta SAAS_TEST_OPERATOR.

Si hay recuperación de acceso, reemplazar el secreto y recrear el servicio app.
Cambiar las credenciales invalida sesiones previas. Guardar los secretos en un
custodio independiente: los respaldos de objetos no contienen SAAS_ADMIN_AUTH.

Staging debe tener dominio, secreto, proyecto Compose y `LABFLOW_DATA_VOLUME`
distintos; nunca usar el volumen de producción ni copiar datos sin anonimizar.

## Instalación y HTTPS (solo con autorización de publicación)

Desde la carpeta `labflow-saas`, tras tener artefacto y configuración revisados:

```bash
docker compose --env-file /etc/labflow/vps.env -f deploy/vps/compose.yaml config --quiet
docker compose --env-file /etc/labflow/vps.env -f deploy/vps/compose.yaml build app
# No ejecutar hasta completar el ensayo de datos y autorizar la publicación:
docker compose --env-file /etc/labflow/vps.env -f deploy/vps/compose.yaml up -d
```

En GoDaddy configurar A hacia la IPv4 del VPS y AAAA solo si IPv6 está realmente
configurado. Aquí no es necesario cambiar nameservers a Cloudflare. Conservar
MX, SPF, DKIM, DMARC y registros de otros servicios. Caddy solicita y renueva el
certificado con el dominio resolviendo al VPS y puertos 80/443 accesibles. No
se puede validar ese certificado antes de disponer del dominio/servidor real.

Firewall: abrir 80/443, restringir SSH por claves y origen autorizado; no publicar
8787, SQLite ni el API administrativo de Caddy. Mantener SO/Docker actualizados.
Instalar alertas y protección de acceso de borde antes de abrir al público.

## Transferencia desde R2 (no ejecutada automáticamente)

No hay datos reales en el repositorio. Obtener permiso de lectura y alcance exacto
antes de exportar. No asumir que `labflow-demo-data` contiene todos los registros
alojados. Inventariar también el bucket de origen real y sus objetos desconocidos.

1. Ensayar todo con datos ficticios y un destino nuevo.
2. Congelar **todos los escritores** del origen durante la exportación final,
   incluidas tareas y GET que puedan actualizar esquemas. No basta congelar la UI.
3. En una máquina autorizada con AWS CLI v2, configurar un perfil R2 de solo
   lectura mediante su gestor de credenciales; nunca incluir claves en Git.
4. Usar el endpoint S3 de la cuenta, por ejemplo:

```bash
export R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
export AWS_PROFILE=labflow-readonly
node vps/r2-export.mjs labflow-demo-data /ruta/privada/export-nuevo
```

El exportador solo lista y obtiene objetos. Usa paginación, lecturas condicionadas
por ETag y una comparación del inventario al finalizar; genera archivos numerados
más `manifest.json` con claves originales y SHA-256. No escribe ni elimina nada
en R2. La comparación no reemplaza la obligación de detener escritores. Un fallo
no produce un manifiesto terminado; conservar el origen y repetir en otro directorio.

5. Verificar conteo y hashes, registro `saas/platform-v1.json`, todos los prefijos
   `saas/tenants/<UUID>/`, estados, adjuntos, informes y XML. Decidir explícitamente
   si conservar sesiones; la importación no elimina ninguna clave por defecto.
6. Importar **solo a una base nueva y con el servicio destino detenido**:

```bash
node vps/storage.mjs import /ruta/privada/export-nuevo /ruta/datos-nuevos/labflow.sqlite
```

El importador valida todos los hashes y rechaza bases existentes. No cambia las
claves ni el contenido JSON. Los ETag locales se regeneran; no equivalen a hashes
de contenido. La importación no ejecuta el Worker ni sus actualizaciones de esquema.
7. Colocar la base importada en un volumen nuevo antes de arrancar app. Para
   inicializar un volumen mediante Docker, usar una imagen construida con el tag
   aprobado, el servicio detenido y un volumen vacío:

```bash
# Ajustar rutas, etiqueta y nombre; no reutilizar un volumen con datos:
docker volume create labflow-production-data
# El directorio de origen contiene exclusivamente la base importada y verificada.
docker run --rm --user 0 --entrypoint sh \
  -v labflow-production-data:/data \
  -v /ruta/datos-nuevos:/import:ro labflow-vps:TAG_APROBADO \
  -c 'test ! -e /data/labflow.sqlite && cp /import/labflow.sqlite /data/labflow.sqlite && chown 1000:1000 /data /data/labflow.sqlite && chmod 700 /data && chmod 600 /data/labflow.sqlite'
```

8. Probar primero una copia de ensayo, aislada del correo real: las lecturas del
   motor existente pueden actualizar esquemas. Contrastar clientes, membresías,
   roles, expedientes, descargas y cantidades antes/después. No abrir un destino
   vacío al público esperando que la demo reponga datos: eso no es una migración.
9. Autorizar cambio DNS solo tras validar recuperación y funcionalidad. Mantener
   el origen congelado y recuperable hasta cerrar la ventana de migración.

## Respaldos y recuperación

No copiar a mano solo el SQLite mientras está abierto: puede haber cambios en WAL.
`storage.mjs backup` utiliza la API de respaldo consistente de SQLite y genera un
manifiesto SHA-256. Incluye todos los objetos, también documentos, sesiones y
registro SaaS; la credencial del proveedor se custodia por separado.

```bash
node vps/storage.mjs backup /ruta/datos/labflow.sqlite /ruta/copias/FECHA.sqlite
# Restauración a ruta NUEVA, con app detenida:
node vps/storage.mjs restore /ruta/copias/FECHA.sqlite /ruta/volumen-nuevo/labflow.sqlite
# Formato portable con manifiesto de objetos:
node vps/storage.mjs export /ruta/datos/labflow.sqlite /ruta/export-nuevo
```

Para Compose, `deploy/vps/backup.sh` realiza el respaldo dentro del contenedor,
copia archivo y manifiesto al directorio externo y verifica su hash. Rechaza
ejecutarse si BACKUP_MOUNT no está montado o el directorio está fuera de ese montaje. Ejemplo de
programación horaria con entorno configurado por el administrador:

```bash
LABFLOW_CONFIG=/etc/labflow/vps.env BACKUP_DIR=/mnt/respaldo/labflow BACKUP_MOUNT=/mnt/respaldo \
  bash deploy/vps/backup.sh
```

Automatizarlo con un timer/cron del VPS; BACKUP_DIR debe estar en almacenamiento
independiente o replicarse cifrado a otra cuenta. Copias en el mismo SSD no cubren
pérdida del VPS. El script no borra copias: programar retención solo después de
ensayar restauración y definir requisitos. Monitorizar espacio tanto en /data
como en el destino; las copias temporales también consumen disco.

Objetivos propuestos: RPO de una hora, RTO de cuatro horas; no garantizados hasta
medirlos. Comprobar restauración en volumen nuevo, manifiestos, clientes y PDFs.
El acceso a backups equivale a acceso a datos confidenciales; cifrar el transporte
y el almacenamiento externo. No enviar copias por chat ni incorporarlas al repo.

## Salud, monitoreo y reversión

`GET /_health` comprueba SQLite sin crear clientes ni modificar registros. Se usa
en el healthcheck Compose. No usar `/api/saas/health` del motor para monitoreo:
ese endpoint histórico puede inicializar/actualizar datos. El servidor registra
JSON de estado, duración, método e ID de solicitud; omite cookies, cuerpos, URLs
con tokens y claves. Docker rota logs. Añadir sondeo externo HTTPS, alertas de
5xx, servicio no saludable, disco, RAM, CPU y último respaldo verificado. Un
healthcheck no saludable por sí solo no reinicia automáticamente el contenedor;
restart unless-stopped recupera procesos que terminan, no sustituye alertas.

Criterios de aceptación: login/logout y revocación; aislamiento de dos clientes;
Básico/Medio/Avanzado y revocación de descargas; PDF y respaldos; datos y sesiones
conservados al reiniciar; restauración verificada; TLS y correo en staging;
capacidad bajo carga medida. Las pruebas automatizadas cubren el adaptador y
persistencia; no certifican carga ni certificados de un VPS que aún no existe.

Reversión de código: volver al tag anterior conservando volumen si es compatible
con su esquema. Antes de cada actualización respaldar y conservar ambas imágenes.
Si cambia el esquema o los datos, detener escritores, preservar el estado nuevo
y recuperar una copia en OTRO volumen; conciliar escrituras posteriores antes de
reanudar. Volver DNS al origen sin conciliar esas escrituras perdería cambios.
Nunca usar `docker compose down -v`: elimina los volúmenes.

## Límites pendientes

SQLite no elimina el JSON completo por laboratorio, los conflictos de revisión,
las operaciones parciales entre objetos ni la necesidad de medir grandes PDFs.
El adaptador limita a 16 las peticiones simultáneas y devuelve 503 con Retry-After
al excederlas para acotar el consumo de memoria; debe medirse la carga real.
Para alta concurrencia evaluar almacenamiento relacional/colas en otra fase.
No se añade cobro automático, MFA, recuperación autoservicio ni protección de
borde completa. El limitador del laboratorio no confía en IP recibida del cliente;
detrás de Caddy las peticiones comparten IP interna, por lo que debe añadirse una
protección de acceso adecuada al VPS antes de un lanzamiento abierto.

Esta preparación no compra servicios, cambia DNS, conecta a R2, copia datos reales
ni publica el software. Se necesitan acceso al VPS, dominio, credenciales privadas,
inventario de origen y autorización específica para la transferencia/publicación.

### Plantillas de programación y pruebas adicionales

`deploy/vps/labflow-backup.service` y `.timer` son plantillas para systemd. Ajustar
la ruta `/opt/labflow`, el entorno y el montaje de respaldo antes de instalarlas;
probar primero el servicio manualmente. El timer es horario y recupera ejecuciones
omitidas. Configurar notificación de fallo y comprobar que `/mnt/respaldo` esté
montado en almacenamiento independiente antes de habilitarlo. No se instala ni
activa automáticamente ningún timer en esta preparación.

Prueba opcional del contenedor en una máquina de desarrollo con Docker:

```bash
docker build -t labflow-vps:validation -f deploy/vps/Dockerfile .
npm run test:vps:docker
```

El smoke test crea y elimina exclusivamente su propio contenedor/volumen, usa
credenciales ficticias y no publica puertos. Comprueba login y persistencia al
reiniciar. La exportación R2 se prueba con AWS CLI simulado; la conexión real
requiere autorización y credenciales externas. La validación de Caddy es estática;
no equivale a haber emitido el certificado del dominio final.
