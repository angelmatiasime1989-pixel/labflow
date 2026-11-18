# Validación de navegación y modo sin conexión

Validación local con datos sintéticos. No demuestra disponibilidad ni persistencia de producción.

## Cambios

- La landing, `/entrar`, administración y páginas públicas conservan los errores 503 del origen. Si no hay red, muestran una respuesta genérica 503, sin sustituirlas por documentos offline.
- Los documentos offline siguen disponibles en `/laboratorio/…` y la raíz de subdominios de laboratorio. No se borra IndexedDB.
- `/admin` mantiene login/panel administrativo; `/entrar` mantiene el selector de laboratorio incluso cuando un administrador tiene pendiente cambiar su contraseña. El panel y sus APIs siguen protegidos.
- Contacto desde `/entrar` abre `/#contacto`, una sección visible de la landing.

## Evidencia

- `npm test`: auditoría existente, standalone y 66 pruebas Node aprobadas.
- Inventario de 80 entradas (67 comprobaciones HTTP y 13 referencias externas sin verificar) en SQLite y 80 en MariaDB 11.8.9 aislada, con resultados idénticos.
- `MYSQL_TEST_PORT=3308 npm run test:mysql`: 12 pruebas de seguridad/esquema, integración de arranque/reinicio, concurrencia/ETag y adjunto de 50 MiB, más 42 flujos aprobados sobre MariaDB 11.8.9.
- Chromium Linux: 20 escenarios por motor; 122 observaciones de enlaces por motor (109 internas aprobadas y 13 referencias externas). Login real de administrador, selector y espacio de laboratorio, contacto, páginas públicas, precios/demo, FAQ, blog, legales, instalación y trial.
- Se simularon por separado una respuesta HTTP 503 y servidor inaccesible con un service worker activo. La landing no se sustituyó por documentos; el flujo offline de laboratorio siguió funcionando.
- Se validaron cifrado local, exclusión de respuestas privadas del caché, reconexión, actualización del service worker, eliminación y revocación.
- Las referencias externas se enumeran pero no cuentan como navegación interna aprobada. La prueba de PWA instalada en Windows no se ejecutó.

El detalle por motor, las observaciones de enlaces visibles y los escenarios Chromium están en [navigation-validation.json](navigation-validation.json).

## URL → esperado / real

| URL | Sesión | Esperado | SQLite | MariaDB |
| --- | --- | --- | --- | --- |
| `/` | anonymous | 200 | 200 | 200 |
| `/entrar` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes` | anonymous | 200 | 200 | 200 |
| `/blog` | anonymous | 200 | 200 | 200 |
| `/privacidad` | anonymous | 200 | 200 | 200 |
| `https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf` | external | reference only | not fetched | not fetched |
| `https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf` | external | reference only | not fetched | not fetched |
| `/terminos` | anonymous | 200 | 200 | 200 |
| `https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf` | external | reference only | not fetched | not fetched |
| `https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf` | external | reference only | not fetched | not fetched |
| `/instalar` | anonymous | 200 | 200 | 200 |
| `/prueba-documental` | anonymous | 200 | 200 | 200 |
| `/#modulos` | anonymous | 200 | 200 | 200 |
| `/#qubito` | anonymous | 200 | 200 | 200 |
| `/#membresias` | anonymous | 200 | 200 | 200 |
| `/#demo` | anonymous | 200 | 200 | 200 |
| `/#recorrido` | anonymous | 200 | 200 | 200 |
| `/#para-tu-equipo` | anonymous | 200 | 200 | 200 |
| `/#como-empezar` | anonymous | 200 | 200 | 200 |
| `/assets/screen-dashboard.jpg` | anonymous | 200 | 200 | 200 |
| `/assets/screen-modules.jpg` | anonymous | 200 | 200 | 200 |
| `/assets/screen-risks.jpg` | anonymous | 200 | 200 | 200 |
| `/#contacto` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#contratacion` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#migracion` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#recuperacion` | anonymous | 200 | 200 | 200 |
| `/entrar#demo` | anonymous | 200 | 200 | 200 |
| `/entrar#recorrido` | anonymous | 200 | 200 | 200 |
| `/entrar#modulos` | anonymous | 200 | 200 | 200 |
| `/entrar#para-tu-equipo` | anonymous | 200 | 200 | 200 |
| `/entrar#qubito` | anonymous | 200 | 200 | 200 |
| `/entrar#como-empezar` | anonymous | 200 | 200 | 200 |
| `/entrar#contacto` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#datos` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#qubito` | anonymous | 200 | 200 | 200 |
| `/preguntas-frecuentes#instalacion` | anonymous | 200 | 200 | 200 |
| `/blog/administracion` | anonymous | 200 | 200 | 200 |
| `https://www.iso.org/iso-9001-quality-management.html` | external | reference only | not fetched | not fetched |
| `/blog/gestion-calidad` | anonymous | 200 | 200 | 200 |
| `https://www.iso.org/iso-9001-quality-management.html` | external | reference only | not fetched | not fetched |
| `/blog/ley-infraestructura-calidad` | anonymous | 200 | 200 | 200 |
| `https://www.diputados.gob.mx/LeyesBiblio/pdf/LICal.pdf` | external | reference only | not fetched | not fetched |
| `https://www.dof.gob.mx/` | external | reference only | not fetched | not fetched |
| `/blog/normas-iso` | anonymous | 200 | 200 | 200 |
| `https://www.iso.org/standard/66912.html` | external | reference only | not fetched | not fetched |
| `https://www.iso.org/iso-9001-quality-management.html` | external | reference only | not fetched | not fetched |
| `/blog/reglamento-lic` | anonymous | 200 | 200 | 200 |
| `https://www.dof.gob.mx/` | external | reference only | not fetched | not fetched |
| `https://www.diputados.gob.mx/LeyesBiblio/` | external | reference only | not fetched | not fetched |
| `/blog/equipos-trazabilidad` | anonymous | 200 | 200 | 200 |
| `https://www.iso.org/standard/66912.html` | external | reference only | not fetched | not fetched |
| `/sin-conexion` | anonymous | 200 | 200 | 200 |
| `/admin` | anonymous | 200 | 200 | 200 |
| `/admin` | provider | 200 | 200 | 200 |
| `/admin/` | anonymous | 303 | 303 | 303 |
| `/admin/` | provider | 200 | 200 | 200 |
| `/administrador/ingresar` | anonymous | 200 | 200 | 200 |
| `/administrador/ingresar` | provider | 303 | 303 | 303 |
| `/entrar` | anonymous | 200 | 200 | 200 |
| `/entrar` | provider | 200 | 200 | 200 |
| `/entrar/` | anonymous | 200 | 200 | 200 |
| `/entrar/` | provider | 200 | 200 | 200 |
| `/admin` | laboratory | 200 | 200 | 200 |
| `/entrar` | laboratory | 200 | 200 | 200 |
| `/entrar/` | laboratory | 200 | 200 | 200 |
| `/laboratorio/links-qa/api/state` | anonymous | 401 | 401 | 401 |
| `/laboratorio/links-qa/api/state` | provider | 401 | 401 | 401 |
| `/laboratorio/links-qa/api/state` | laboratory | 200 | 200 | 200 |
| `/laboratorio/links-qa/` | laboratory | 200 | 200 | 200 |
| `/laboratorio/links-qa/instalar` | laboratory | 200 | 200 | 200 |
| `/laboratorio/links-qa/manifest.webmanifest` | laboratory | 200 | 200 | 200 |
| `/manifest.webmanifest` | laboratory | 200 | 200 | 200 |
| `/sw.js` | laboratory | 200 | 200 | 200 |
| `/sin-conexion` | laboratory | 200 | 200 | 200 |
| `/admin` | provider password change required | 303 | 303 | 303 |
| `/admin/` | provider password change required | 303 | 303 | 303 |
| `/api/saas/state` | provider password change required | 403 | 403 | 403 |
| `/entrar` | provider password change required | 200 | 200 | 200 |
| `/entrar/` | provider password change required | 200 | 200 | 200 |
| `/` | provider password change required | 200 | 200 | 200 |

## Producción y activación

El backend público fue reportado con HTTP 503 antes de este parche. Su causa actual requiere logs nuevos; el último error conocido fue `ER_ACCESS_DENIED_ERROR`, anterior a la corrección de configuración informada por el usuario. Este parche no cambia credenciales, motor ni tratamiento de fallos de base de datos.

Hostinger despliega `main` desde `labflow-saas`. El nuevo service worker necesita que `/sw.js` vuelva a responder y puede esperar hasta cerrar las pestañas controladas por la versión anterior. No borrar datos del sitio: contienen copias offline cifradas. Comprobar el HTTP de origen sin sesión/service worker y luego el navegador actualizado; no interpretar contenido cacheado como recuperación del backend.
