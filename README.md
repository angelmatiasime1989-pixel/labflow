# LabFlow — exportación fiel para Codex

## Contenido y fidelidad

Esta copia contiene dos proyectos independientes: `labflow/` (LabFlow original, versión 42) y `labflow-saas/` (SaaS actual con panel del proveedor, clientes aislados y membresías Básico, Medio y Avanzado). Para continuar el SaaS, abre **labflow-saas** en Codex. No mezcles los árboles ni sus almacenamientos.

Se copió byte por byte todo el árbol registrado en Git: fuentes, componentes, HTML, CSS, lógica, configuración, generación PDF/ZIP, bibliotecas distribuidas, fuentes tipográficas, datos iniciales, fixtures y pruebas. `worker/index.js` es el bundle existente; los demás archivos de `worker/` son las fuentes que se ensamblan. No hay un frontend React separado ni dependencias npm de aplicación omitidas.

`MANIFEST_ORIGINALES_SHA256.json` registra commits y hashes. Los únicos añadidos son este README, el manifiesto y los ejemplos `wrangler.*.toml`; `dist/` se genera con el build existente. No se modificaron funcionalidades ni se publicaron cambios. Los README internos y notas históricas se conservan íntegros; ciertas instrucciones antiguas sobre casillas por módulo preceden a las tres membresías actuales.

## Requisitos y dependencias

- Node.js: verificado con 24.19.0, con Web Crypto y APIs web disponibles.
- Python 3: verificado con 3.12.14. `assemble.py` utiliza la biblioteca estándar.
- Bash para el build; en Windows puedes usar WSL.
- Wrangler 4 para ejecución local en runtime Workers y R2 emulado. Se instala vía npm/npx con conexión a internet. Esta herramienta no estaba incluida ni fijada en el repositorio original.
- PDF-lib, JSZip y fuentes precompiladas están en `vendor/`, junto con las licencias disponibles. No necesitas npm install para ensamblar o ejecutar las pruebas de aplicación.
- Opcionales: lxml para `scripts/xsd30-check.py`; fonttools y la fuente DejaVu Sans del sistema para `scripts/font-data.py`. Las fuentes compiladas ya están incluidas: no requieren regeneración.
- No existía un package-lock del proyecto. No se inventó uno ni se fijaron nuevas dependencias de aplicación.

## Instalación, build y pruebas

Descomprime el ZIP y abre una terminal:

```bash
cd LabFlow_Exportacion_Codex/labflow-saas
python3 scripts/assemble.py
bash scripts/build.sh
node scripts/validate-artifact.mjs
node scripts/saas-test.mjs
```

Para el original, usa `labflow` y `node scripts/test.mjs` en lugar de la prueba SaaS. El build crea `dist/server/index.js` y el manifiesto de hosting. Modifica las fuentes y vuelve a ensamblar cuando continúes el desarrollo; no edites únicamente el bundle.

## Ejecución fuera de ChatGPT en local

Desde la carpeta del proyecto:

```bash
npx wrangler@4 dev --config wrangler.local.toml --local --port 8787
```

Abre `http://localhost:8787/` en ese mismo equipo. El SaaS usa `/admin/` para el proveedor y `/laboratorio/<identificador>/` para clientes. El panel del proveedor requiere credenciales independientes mediante `SAAS_ADMIN_AUTH`; consulta `labflow-saas/docs/phase-one-auth.md`. Las cabeceras de Sites y `SAAS_TEST_OPERATOR` ya no autentican, tampoco en local. El bucket emulado empieza vacío y Wrangler mantiene su estado localmente. El original carga los datos demo incluidos. El SaaS crea su registro de proveedor vacío y cada cliente recibe las credenciales establecidas en su alta.

Las cookies existentes son Secure. Usa localhost o HTTPS; acceder por HTTP mediante una IP en otro equipo puede impedir que el navegador conserve la sesión. No se cambiaron cookies para esta exportación.

Wrangler no se instaló ni se levantó durante esta tarea. Se verificaron ensamblado, entrada ESM y pruebas backend en Node. La puesta en marcha con Wrangler y el despliegue externo deben validarse en tu entorno. npx descargará herramientas adicionales y no garantiza una versión idéntica en futuras instalaciones.

## Dependencias de ChatGPT / Sites y servicios externos

| Elemento | Qué requiere fuera del entorno actual |
|---|---|
| Hosting privado y audiencia de ChatGPT/Sites | Sustituir por hosting y controles propios. `.openai/hosting.json` conserva la configuración original, pero no configura un VPS. |
| Identidad del proveedor SaaS | Usuario y contraseña propios; aprovisionamiento externo mediante `SAAS_ADMIN_AUTH`. Las cabeceras de identidad externas se ignoran. Requiere HTTPS y configuración segura del secreto. |
| Propietario del panel | El antiguo ID de Sites se conserva en `saas/platform-v1.json` como dato histórico, sin autorizar acceso. Las credenciales independientes no se guardan en registros exportables. |
| Runtime Worker | El backend exporta `default.fetch(request, env, ctx)`. Puede ejecutarse en Workers o con el adaptador Node independiente `labflow-saas/vps/server.mjs`. La guía VPS explica persistencia, HTTPS y despliegue. |
| BUCKET | Binding de almacenamiento R2 o compatible, con get/json/arrayBuffer, put condicional por ETag, delete y list. Debe preservar concurrencia e aislamiento. Obligatorio para estado, documentos y sesiones. |
| Correo Resend | Opcional: `RESEND_API_KEY`, `EMAIL_FROM` verificado, `SITE_URL` y conexión a `https://api.resend.com/emails`. Sin configurar no envía correos. Claves y cuentas no están incluidas. |
| Referencias legales/técnicas | Enlaces a SAT, NIST y otras fuentes; no son copias locales de esos contenidos ni se garantiza disponibilidad sin conexión. |
| API OpenAI | No se identificó una integración de ejecución con la API de OpenAI en este código. Codex es el entorno de desarrollo de destino. |

**Nunca publiques la configuración local en producción.** La identidad administrativa de prueba fue eliminada. Antes de abrir el SaaS al público, configura las credenciales independientes del proveedor. Las rutas de laboratorio mantienen su autenticación propia con usuario, contraseña y sesiones almacenadas.

El ejemplo `wrangler.production.example.toml` requiere sustituir dominio/bucket y configurar secretos externamente. No ejecuta una migración ni está listo para publicar sin completar identidad y datos. Para GoDaddy/VPS se incluye un adaptador Node, almacenamiento SQLite compatible y configuración Docker/Caddy; consulta `labflow-saas/docs/vps-godaddy.md`. Copiar el ZIP a cPanel no basta.

## Qué no puede exportarse en este paquete

Este ZIP es el proyecto de código disponible, **no un respaldo de los datos alojados**. No incluye registros capturados por usuarios, clientes SaaS alojados, adjuntos subidos, PDFs emitidos, sesiones, respaldos remotos, secretos ni credenciales del servicio. Los datos iniciales y fixtures que forman parte del código sí se conservaron fielmente.

No se dispuso de acceso directo para exportar los objetos del bucket remoto. Para una migración con datos se requiere copiar todas sus claves y bytes, sin cambiar referencias:

- Original: `public-demo/state-v1.json`, `public-demo/backups/`, `public-demo/sessions/`, `attachments/`, `reports/` y cualquier otra clave del bucket.
- SaaS: `saas/platform-v1.json` y todo `saas/tenants/<UUID>/`, incluyendo estados, adjuntos, informes y respaldos. Inventariar también las demás claves existentes.
- El respaldo JSON que ofrece el ERP incluye registros e índices, pero no reemplaza los archivos binarios del bucket.
- Las sesiones pueden invalidarse por una decisión explícita de migración; esta exportación no las copia ni altera.

Tampoco se incluyen infraestructura administrada, certificados SSL, DNS, audiencia de ChatGPT, historial de conversaciones, secretos, historial de versiones de Sites ni la carpeta .git. Se conserva el commit de origen en el manifiesto y todo el árbol de la versión actual. El acceso nativo de ChatGPT debe sustituirse fuera de su plataforma; no es un archivo descargable.

## Continuar en Codex

1. Abre `labflow-saas/` como carpeta del proyecto.
2. Inicializa tu propio Git si lo deseas, sin publicar secretos o datos de clientes.
3. Ejecuta build, validación y pruebas.
4. Levanta el entorno local y verifica formularios, informes, login y permisos.
5. Antes de producción, resuelve identidad, almacenamiento y migración separada de datos.

La entrega es una exportación fiel de las fuentes, no una migración de alojamiento ya realizada.

## Preparación para VPS GoDaddy

La instalación independiente, transferencia R2, respaldos y reversión se documentan en [la guía VPS](labflow-saas/docs/vps-godaddy.md). No se migra ni publica automáticamente.
