# Qubo Labs: actualización comercial y funcional

Fecha: 15 de noviembre de 2026. Destino preparado: Node.js 24, con el directorio `labflow-saas` sincronizado desde las fuentes de la raíz. No se han utilizado registros reales ni modificado recursos de producción.

## Cambios entregados

| Área | Comportamiento |
|---|---|
| Landing | Lenguaje más directo; Silver, Gold, Platinum, Diamond y Enterprise Custom; precios centralizados; pago mensual/anual con 10% de descuento; comparador por 11 categorías; solicitud comercial con nivel y modalidad. |
| Administración | Acceso en `/admin`, sin enlace administrativo en la landing ni reconocimiento automático del administrador en el acceso de laboratorios. Se conserva la ruta anterior como alias compatible. |
| Membresías | Funciones seleccionables mediante casillas, tanto por módulo como individualmente. Se conservan las referencias necesarias, configuración y dependencias. Los niveles superiores heredan los inferiores. No se habilitan desarrollos futuros por anunciarse comercialmente. |
| Contratos existentes | Básico, Medio, Avanzado y las configuraciones personalizadas conservan identificadores y registros. Las nuevas membresías guardan su alcance por cliente; editar una plantilla no cambia contratos ya asignados. Para aplicar un alcance nuevo, seleccionar el plan en la configuración del cliente y guardar. |
| Pagos SaaS | Registro manual por cliente: importe exacto en centavos, fecha, periodo, método, referencia, notas y autor. Evita duplicados y escrituras sobre revisiones antiguas. Anular exige motivo y conserva el registro original. No realiza cobros ni emite CFDI. |
| Enlaces | Cada identificador admite `identificador.qubolabs.tech`. Se preservan las rutas `/laboratorio/identificador/`. Sesiones, almacenamiento y cookies permanecen aislados. |
| Móvil | Controles con mayor contraste, navegación inferior, herramientas agrupadas, espacios de interacción amplios y paneles adaptables. |
| PWA | `/instalar`, instrucciones para Safari/iOS y Chrome/Android, manifest, iconos sin texto y favicon. La caché contiene únicamente iconos; los datos y páginas del laboratorio se consultan por red. Página de desconexión sin datos privados. |
| Identidad | El acceso muestra el nombre y el logotipo configurado por el laboratorio. El endpoint público no entrega nombres, usuarios ni roles del directorio de personal. |
| Seguridad personal | Cambio de contraseña desde Mi perfil, validación de la actual, confirmación y revocación de sesiones. Ojo para mostrar/ocultar contraseñas en el acceso. Se mantiene el cambio obligatorio del administrador temporal. |
| Indicadores | Platinum, Diamond y Enterprise Custom permiten guardar la selección y el orden de KPIs por persona mediante arrastrar/soltar o controles táctiles. Se conserva la compatibilidad con Avanzado existente. |
| Finanzas | Módulo nuevo exclusivo de Diamond y Enterprise Custom. Periodos, ventas aceptadas, ingresos contables, cobros, gastos, resultados, EBITDA condicionado a clasificación, cartera al corte, servicios, ubicaciones, unidades, productividad y CSV. Tablero configurable por persona. |
| Qubito | Exclusivo de Diamond y Enterprise Custom. El administrador del laboratorio selecciona los usuarios autorizados. Chat con personaje animado, consentimiento, cuotas, contexto agregado autorizado y credencial sólo en el servidor. No ejecuta acciones ni lee expedientes completos. |
| Blog | `/blog`, seis guías iniciales y editor administrativo: imagen PNG/JPEG optimizada, borrador, publicación, archivo, fuentes, texto seguro y bitácora. |

## Datos financieros y límites de interpretación

- Ventas: cotizaciones aceptadas, subtotal sin IVA, en MXN con el tipo de cambio registrado. No se suman otra vez las órdenes derivadas de esas cotizaciones.
- Ingresos y gastos: pólizas contabilizadas en cuentas de ingreso/gasto y sus reversos. Combustible, compras y viáticos no se suman por segunda vez desde los módulos de origen.
- Cobros: movimientos autorizados aplicados a cuentas por cobrar. Pueden incluir IVA; no equivalen al ingreso contable ni a la venta aceptada.
- Categorías: fuente contable identificada para combustible, viáticos, calibraciones, depreciación y nómina; el resto utiliza la cuenta de gasto. La explosión conserva las partidas y las reclasificaciones.
- EBITDA: requiere clasificar las cuentas de gasto. Si faltan clasificaciones, queda pendiente; no se calcula una cifra supuestamente definitiva.
- Cartera histórica: se reconstruye con movimientos fechados hasta el corte. Los saldos importados sin movimientos requieren conciliación; el reporte lo advierte.
- Ubicaciones/unidades: se agregaron catálogos y referencias opcionales en cotizaciones, servicios y pólizas. Se muestran asignaciones registradas y un grupo de operaciones sin asignar; no se inventan repartos.
- Productividad: avance, entregas fechadas a tiempo, informes y servicios por horas efectivas registradas. La ausencia de horas o fechas no equivale a productividad cero. No sustituye una evaluación profesional del personal.
- Los informes son herramientas de gestión. No son estados financieros dictaminados ni sustituyen la validación contable/fiscal.

## Activación y aceptación en hosting

1. Construir con Node 24: `npm ci`, `npm run build`, `npm run validate`. En Hostinger: raíz `labflow-saas`, entrada `server/index.mjs` y comando `npm run build`.
2. Confirmar volúmenes persistentes de datos y respaldos antes de incorporar clientes reales. Las rutas relativas `./data` y `./backups` no acreditan persistencia por sí mismas. Verificar reinicio y redespliegue con datos sintéticos.
3. Mantener `PUBLIC_URL=https://qubolabs.tech`. Configurar DNS comodín `*.qubolabs.tech` hacia el destino real del alojamiento, sin alterar MX ni verificaciones. El proyecto debe aceptar los subdominios y presentar un certificado válido para cada nombre.
4. Si el Node administrado no permite comodines/alias y certificado correspondiente, usar un VPS con proxy que conserve `Host`, o registrar explícitamente cada alias admitido. El cambio DNS por sí solo no configura el enrutamiento de Hostinger.
5. Configurar privadamente `OPENAI_API_KEY`; `OPENAI_MODEL` es una opción exclusiva del servidor. La disponibilidad del modelo solicitado debe confirmarse con la cuenta del proveedor. No se han realizado llamadas pagadas en las pruebas.
6. Asignar Diamond o Enterprise Custom y autorizar usuarios en Qubito → Acceso del equipo. Sin clave, el chat informa que está pendiente de configuración y no fabrica respuestas.
7. Configurar los datos legales reales del responsable antes de habilitar los formularios comerciales; se mantiene el bloqueo existente hasta completar esos datos.
8. Revisar los artículos y sus referencias normativas antes de anunciarlos como noticias de actualidad. El entorno bloqueó la consulta a fuentes oficiales; los textos iniciales se identifican como guías, sin afirmar reformas o vigencias no verificadas.
9. Probar instalación en un iPhone y un Android reales con HTTPS, además de las pruebas automatizadas de navegador. No se ha distribuido una app de App Store/Play Store.
10. Validar recepción de solicitudes, cobros registrados manualmente, permisos de cada rol, descarga CSV/PDF y recuperación de un respaldo en un entorno separado.

El `worker/index.js` generado es un componente del servidor Node en este despliegue. No publicarlo directamente como Worker sin adaptar primero la autenticación y la validación del host del servidor independiente.

## Costos externos

| Concepto | Condición |
|---|---|
| Hosting Node/VPS y disco persistente | Plan vigente del proveedor; confirmar capacidad, respaldos y soporte de dominios comodín. No se contrataron recursos. |
| Dominio y DNS | Renovación del dominio. Un comodín DNS no debe requerir una licencia por laboratorio, pero el proveedor puede limitar alias/TLS. |
| TLS | Certificados administrados o emisión ACME compatible. Un VPS puede usar DNS-01 para comodín; credenciales del DNS fuera de Git. |
| IA | Consumo facturado por el proveedor. Límite inicial de 20 consultas por usuario autorizado/hora, 100 por laboratorio/hora, 2,000 por laboratorio/mes y 1,200 tokens máximos de salida por consulta. Los dos límites por laboratorio se configuran exclusivamente en el servidor. La tarifa depende del modelo y de su disponibilidad; no se presenta una cotización no verificada. |
| Respaldo externo | Almacenamiento independiente y retención. La copia en el mismo disco no protege frente a pérdida del servidor. |
| Correo, timbrado y cobros | Correo transaccional, PAC y pasarela sólo si se contratan/activan. La entrega actual no simula esas integraciones. |

## Oportunidades para competir con un ERP como Odoo

| Prioridad | Hallazgo / oportunidad | Siguiente entrega verificable |
|---|---|---|
| P0 | Persistencia del hosting no confirmada. | Volumen persistente documentado, respaldo externo cifrado, retención y recuperación probada tras redespliegue. |
| P0 | Dominio comodín/TLS y cuenta de IA sin validar en alojamiento. | Pruebas reales de dos subdominios, aislamiento, HTTPS y límites/costos de IA con una cuenta configurada. |
| P0 | Funciones comerciales como timbrado, infraestructura dedicada e integraciones no están completas por estar en una tarjeta. | Matriz contractual aprobada por plan, validación de PAC/SAT y propuesta técnica específica de Enterprise. |
| P1 | Estado de cada laboratorio conservado como un documento en SQLite/R2: correcto para preservar la app, limitado para gran volumen analítico/concurrencia. | Medir carga y avanzar gradualmente a tablas/eventos/indexación, sin reescribir módulos ni perder auditoría. |
| P1 | La facturación recurrente y la conciliación SaaS siguen siendo manuales. | Cargos/suscripciones por proveedor, webhooks idempotentes, facturas/recibos y conciliación con los pagos registrados. |
| P1 | Analítica depende de calidad y dimensiones de los registros. | Datos de prueba de varias ubicaciones/unidades, clasificación contable aprobada y conciliación con cierres de referencia. |
| P1 | Integraciones y capacidades empresariales anunciadas no son un ecosistema comparable a Odoo. | API autenticada/versionada, webhooks, conectores, permisos y trazabilidad de cada integración. |
| P1 | Qubito usa contexto agregado y una consulta por envío; no busca documentos ni opera autónomamente. | RAG con documentos autorizados, citas verificables, presupuesto por empresa, métricas y confirmación humana de acciones. |
| P1 | Supervisión operativa externa no fue activada. | Alarmas de disponibilidad, errores, latencia, disco, antigüedad de respaldos y gasto de IA; logs sin secretos. |
| P2 | Informes de gestión no equivalen a contabilidad/fiscalidad completa de un ERP. | Flujo de cierres, conciliación bancaria, impuestos, estados completos y escenarios multiempresa validados por especialista. |
| P2 | Experiencia móvil requiere validación física. | Matriz iOS/Android, tamaños de pantalla, accesibilidad, lector de pantalla, interacción táctil y actualización PWA. |

## Reversión y conservación

- Trabajar y revisar en rama independiente. No reemplazar ni borrar bases existentes para cambiar de versión.
- Antes de activar en producción: respaldo cifrado verificado y copia de código/configuración vigente; guardar la clave fuera del repositorio.
- Revertir el código mediante el commit anterior y conservar el archivo SQLite/objetos. Los campos nuevos son aditivos; los niveles existentes mantienen sus identificadores.
- Anular pagos, archivar publicaciones y retirar autorizaciones de Qubito sin borrar su historial. Desactivar la clave de IA detiene nuevas consultas externas.
- Ante un problema con comodines, mantener temporalmente los enlaces compatibles `/laboratorio/identificador/` y revertir sólo los registros DNS que se hayan cambiado, conservando correo y verificaciones.
- No restaurar un respaldo anterior sobre nuevas operaciones sin conciliar primero los registros creados después del respaldo.

## SEO

- Títulos y descripciones propios para portada, blog y artículos; URL canónica sin parámetros publicitarios.
- Open Graph y Twitter Cards; imágenes de artículos mediante una URL pública estable.
- Datos estructurados WebSite, Organization, SoftwareApplication, BlogPosting y BreadcrumbList, sin reseñas o calificaciones inventadas.
- Precios estructurados derivados del mismo catálogo comercial. Enterprise se mantiene como propuesta personalizada.
- `/robots.txt` y `/sitemap.xml`: sólo portada, blog y artículos publicados. Borradores y archivos quedan fuera.
- Administrador, accesos, APIs, rutas de laboratorio y subdominios de clientes con `X-Robots-Tag: noindex`; robots de los subdominios bloquea el rastreo.
- Entornos locales/de prueba no indexables. No se anuncia una fecha de publicación para las guías iniciales cuando no existe una fecha editorial verificada.
- Siguiente paso externo: verificar la propiedad de `qubolabs.tech` en Search Console y enviar `https://qubolabs.tech/sitemap.xml`. El metatag opcional `GOOGLE_SITE_VERIFICATION` se configura en hosting.
- El SEO técnico facilita el rastreo; aún se necesita continuidad editorial, revisión de fuentes, enlaces relevantes y medición de resultados. No se han comprado anuncios ni contratado herramientas SEO.

## Archivos y verificación

Las fuentes canónicas se editan en la raíz; `labflow-saas/` es una copia sincronizada para el directorio de despliegue de Hostinger.

| Archivos principales | Cambio |
|---|---|
| `worker/commercial-memberships.json`, `scripts/render-memberships.mjs`, `worker/memberships.*` | Datos comerciales únicos, presentación, precios y comparación. |
| `worker/saas-admin.html`, `worker/saas-gateway.js`, `worker/saas-entitlements.js` | Planes configurables, alcance contratado, pagos, permisos y administración del blog. |
| `worker/finance-model.js`, `worker/finance-domain.js`, `worker/finance-ui.js` | Dimensiones, cálculo, autorización, reportes, CSV y configuración financiera. |
| `worker/qubito-domain.js`, `worker/qubito-ui.js` | Accesos, contexto autorizado, conexión al proveedor, cuotas y chat animado. |
| `server/app.mjs`, `server/index.mjs`, `server/tenant-hosts.mjs` | Entrada independiente, validación de host, rutas por subdominio y cookies. |
| `server/pwa.mjs`, `server/pwa/`, `server/seo.mjs` | Instalación, iconos, favicon, caché segura, metadatos, robots y sitemap. |
| `worker/blog.js`, `worker/blog-seeds.json`, `worker/cubolabs-landing.html` | Blog público, seis guías iniciales y comunicación comercial. |
| `worker/password-auth.js`, `worker/domain.js`, `worker/server.js`, `worker/cubolabs-ui.js`, `worker/cubolabs.css` | Cambio de contraseña, bloqueo de cabeceras de IP externas, acceso con marca, usuarios SaaS sin límite de diez, contraste y móvil. |
| `scripts/saas-release-test.mjs`, pruebas de landing/acceso/UI y ensamblador | Regresión funcional y compatibilidad del artefacto Node. |
| `.env.example`, `deploy/wildcard-nginx.conf.example` | Opciones sin credenciales y plantilla revisable para VPS. |

Pruebas realizadas con datos sintéticos:

- 34 suites de regresión de los módulos existentes.
- Auditoría de rutas SaaS sobre 107 herramientas y diez perfiles: 723 escrituras no autorizadas rechazadas y 263 vistas previas PDF generadas.
- 26 pruebas específicas de landing, primer acceso y esta entrega: precios, selección de funciones, pagos, subdominios, datos públicos, contraseñas, indicadores, finanzas, IA simulada, límites de acceso y SEO.
- Servidor HTTP Node real, persistencia, respaldo cifrado, restauración completa y rechazo de clave incorrecta.
- Chromium en escritorio, tableta y móvil: comparación y precios, solicitudes, administración, pagos/anulación, imagen del blog, acceso con marca, contraseña, indicadores por arrastre, finanzas por arrastre y CSV, autorización individual de IA, personaje con movimiento reducido, caché sin datos privados y pantalla sin conexión tras detener el servidor de prueba.
- Compilación Node, validación ESM y verificación de la copia de despliegue. No se agregaron dependencias de ejecución para IA, gráficos o PWA.

Fallos corregidos durante la verificación: inserción del script PWA dentro del código de impresión, carga financiera que mantenía el estado visual “Cargando”, doble consulta de identidad al iniciar sesión, alta de usuarios cuando el administrador no tenía correo y límite heredado de diez usuarios en tenants SaaS. Los formularios siguen sin repetir automáticamente escrituras ante errores de red.
