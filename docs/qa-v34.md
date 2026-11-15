# LabFlow v34 — revisión funcional

## Correcciones

- Atender una solicitud recibida abre una cotización vinculada, sin regresar a Notificaciones.
- Las transiciones intermedias conservan el detalle; los envíos confirmados cierran la captura.
- Los registros iniciados desde notificaciones continúan en su módulo.
- La selección de compras menores a 2,000 MXN con IVA es accesible; desde 2,000 se conserva la autorización y las tres propuestas.
- El comparativo oculta edición/adición cuando la solicitud ya está fuera de cotización o el perfil no tiene permiso.
- Las confirmaciones no ocultan errores posteriores.
- La creación de un puesto desde Personal selecciona solamente el puesto recién creado.
- Los documentos controlados devuelven destinatario y folio del envío y registran Guardar y enviar en bitácora.

## Validación

25 suites funcionales aprobadas con datos aislados en almacenamiento simulado; no se modificaron datos reales del sitio para probar. Las suites ejecutan el Worker y las API de producción, incluyendo escenarios positivos y rechazos por permisos/validación. La prueba UI usa el script completo entregado por el Worker en un DOM simulado; no es una revisión visual en navegador.

Cobertura: Comercial, Operación, Técnica, Calidad, Compras, Almacén, Recursos humanos, Contabilidad y Configuración; cotización→servicio→informe→entrega→cobranza, auditorías/acciones, personal/autorizaciones, documentos/versiones, compras/pagos, permisos, notificaciones, arranque y recuperación de respaldos.

Las pruebas históricas se actualizaron a los estados y requisitos actuales (confirmación del ítem por técnico, liberación por Calidad competente, conservación de versiones, adjuntos antes del envío y validación de borradores al enviarlos).

| Suite | Resultado |
|---|---|
| scripts/startup31-test.mjs | Aprobada |
| scripts/test.mjs | Aprobada |
| scripts/ui-test.mjs | Aprobada |
| scripts/v10-test.mjs | Aprobada |
| scripts/v11-test.mjs | Aprobada |
| scripts/v12-test.mjs | Aprobada |
| scripts/v13-test.mjs | Aprobada |
| scripts/v14-test.mjs | Aprobada |
| scripts/v15-test.mjs | Aprobada |
| scripts/v16-test.mjs | Aprobada |
| scripts/v17-test.mjs | Aprobada |
| scripts/v18-test.mjs | Aprobada |
| scripts/v19-test.mjs | Aprobada |
| scripts/v24-test.mjs | Aprobada |
| scripts/v27-test.mjs | Aprobada |
| scripts/v28-test.mjs | Aprobada |
| scripts/v29-test.mjs | Aprobada |
| scripts/v30-test.mjs | Aprobada |
| scripts/v32-test.mjs | Aprobada |
| scripts/v33-test.mjs | Aprobada |
| scripts/v34-test.mjs | Aprobada |
| scripts/v6-test.mjs | Aprobada |
| scripts/v7-test.mjs | Aprobada |
| scripts/v8-test.mjs | Aprobada |
| scripts/v9-test.mjs | Aprobada |

Después de los últimos ajustes de la interfaz de compras se repitieron ui-test, v12-test y v34-test. Compilación, sintaxis ESM y diff también verificados.

## Límite

La comprobación visual y de interacción real en navegador queda pendiente: control-browser no está disponible en este entorno. La suite no equivale a una validación técnica formal del software para acreditación.
