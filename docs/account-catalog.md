# Catálogo contable de laboratorios

Contabilidad está disponible exclusivamente para Diamond y Enterprise Custom. La licencia se comprueba en el servidor, también para contratos anteriores que todavía enumeren el módulo. Las restricciones de rol se mantienen. Finanzas global de `/admin` no cambia. Los registros existentes se conservan al cambiar a un plan sin Contabilidad.

En el detalle de una cuenta, **Eliminar cuenta** solicita un motivo. Se permite eliminar cuentas sin referencias en registros (incluidas pólizas en borrador), subcuentas ni archivos vinculados. No se eliminan pólizas ni evidencias. Un periodo cerrado impide eliminar cuentas hasta su reapertura por el flujo existente.

Las cuentas utilizadas por operaciones automáticas pueden personalizarse en código y nombre. Su tipo debe ser compatible con su función. Para eliminar una de estas cuentas sin uso, se debe seleccionar una cuenta activa del mismo tipo, sin movimientos ni otra función automática; la función se transfiere en el mismo guardado. Los cambios quedan en bitácora, con control de revisión/ETag. Los identificadores eliminados no se reutilizan. Al renombrar una cuenta de mayor se actualizan y auditan las referencias de sus subcuentas.

Los centros de gasto son un catálogo operativo en Compras → Control y siguen disponibles para compras y viáticos según permisos. Esto no concede acceso a cuentas, pólizas, tesorería ni exportaciones contables.

Validación reproducible (datos ficticios):

```sh
npm ci
npm run build
npm test
npm run test:workspace-browser
npm run test:public-browser
npm run test:pwa-browser
npm run sync:hostinger
npm run check:hostinger-source
```

`account-catalog-test.mjs` comprueba los cinco planes, contratos anteriores, permisos, aislamiento entre laboratorios, edición de códigos, jerarquía, eliminación, sustitución automática, no reutilización de IDs, periodos cerrados y conflictos de revisión. La prueba Chromium del workspace recorre creación y eliminación en 1440 y 390 px. Usa SQLite local; no acredita acceso a MariaDB productiva ni despliegue en Hostinger. El cambio reutiliza la persistencia existente y no ejecuta migraciones ni borra datos de producción.
