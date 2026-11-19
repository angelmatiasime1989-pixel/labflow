# Finanzas dentro de la administración global

`/admin/finanzas` y `/admin/finanzas/` reutilizan `worker/saas-admin.html`: identidad, encabezado, menú lateral y navegación móvil. `server/finance/shell.mjs` compone la vista existente dentro del contenido del panel, con funciones privadas para evitar colisiones con el administrador. `view.css` limita los estilos específicos de gráficas y filtros a `.finance-view`; tarjetas, botones y tablas heredan el diseño del panel.

No cambia el modelo de movimientos, el cálculo mensual ni la configuración de Stripe. La ruta y la API requieren la sesión del proveedor; la sesión del administrador de laboratorio no la sustituye. Las demás vistas seleccionables del panel conservan su selección mediante `?view=…`, incluyendo navegación Atrás.

Verificación reproducible:

- `npm test`: flujos y autorización existentes, además de enlace directo autenticado y rechazo de sesión de laboratorio.
- `npm run test:finance-browser`: Chromium Linux, 1440 y 390 px; marco único, Finanzas activa, recarga, salida a Clientes y Atrás, uno/tres años, teclado, filtros y movimientos sintéticos, Stripe no disponible y ausencia de desbordamiento.
- `npm run test:pwa-browser`: regresión PWA existente. No equivale a un dispositivo Windows o móvil instalado.

Las pruebas utilizan datos sintéticos y respuestas simuladas de Stripe. Publicar en Git no demuestra que Hostinger ya sirva el commit; la verificación del panel vivo requiere una sesión global autorizada.
