# LabFlow v30 — revisión de implementación

## Cambios ejecutados

- Personal unifica lista, puestos, autorizaciones y expediente. PDF institucional con tres columnas y sin datos bancarios o personales sensibles.
- Calificación inicia por colaborador, puesto automático, método y fecha. Icono de evaluación distinto de capacitación. AVR y Software identifican las herramientas de Calidad.
- Agrupadores oficiales del Anexo 24 RMF 2026, separados de los números internos. Naturaleza D/A, jerarquía, cuentas de movimiento y revisión contable explícita.
- Estado de resultados por mes y KPI EBITDA / margen EBITDA desde pólizas contabilizadas. Se separan costo, operación, depreciación/amortización, financieros, otros resultados e ISR/PTU.
- IVA facturado pendiente y reclasificación proporcional al cobro o pago de compras. No determina por sí misma acreditamiento/deducibilidad fiscal.
- XML CFDI 4.0 vinculado a orden, compra, nómina o complemento de cobro. Guarda XML, hash, origen y verificación SAT registrada por Contabilidad. No equivale a validación integral ni timbrado.
- Catálogo/balanza XML 1.3 y ZIP; balanza normal/complementaria; pólizas/resultados CSV. Catálogo no revisado bloquea exportación y cierre.
- Obligaciones por régimen/periodo con fecha verificada, responsable, acuse y evidencia PDF obligatorios antes de concluir.
- Cierres/reaperturas con motivo y responsable. Pólizas contabilizadas inmutables; reversión manual identificada, una sola vez. Las fuentes automáticas se corrigen desde su origen.
- Respaldos incluyen XML fiscales; compatibilidad con respaldos anteriores al módulo fiscal.
- Se corrigió el acceso a documentos fuera de distribución mediante API y se reinician lecturas al crear una revisión nueva, conservando la historia previa.
- Configuración / Implementación muestra evidencia y pendientes de preparación. No atribuye cumplimiento automático por tener un módulo.
- Operación / Ejemplo contiene un recorrido transaccional de Almacenadora del Golfo: dos termómetros, cotización, orden, recepción, confirmación, resultados, Calidad, certificados, entrega, cierre y cobranza. Todos los datos de ejemplo son ficticios y no son evidencia de un laboratorio real.

## Validación

Pruebas API de comercial, compras/almacén, activos, tesorería, nómina, capacitación/vacaciones, personal, documentos, auditorías/acciones, recepción/custodia/muestreo, restricciones de alcance, tarifas/negocio/reporte semestral, respaldos y privacidad técnica. Pruebas de límites de calificación y pruebas de navegación/markup/JavaScript ensamblado. Los XML de prueba pasan los XSD oficiales SAT 1.3 descargados desde sat.gob.mx. PDF revisados con Poppler.

No se dispuso de navegador para QA visual interactiva. La navegación se comprobó con el entorno VM; los PDF sí se renderizaron.

## Pendientes antes de producción

1. Validar catálogo y saldos de apertura con el contador del laboratorio, clasificación y reglas de reconocimiento contable, deducibilidad/acreditamiento, retenciones y obligaciones según su régimen.
2. Integrar PAC/timbrado y servicios SAT: validación integral/estatus, complementos, cancelaciones/sustituciones y declaraciones. No se emiten ni presentan automáticamente CFDI o declaraciones en esta versión.
3. El módulo fiscal no es un motor completo de ISR/IMSS/INFONAVIT/DIOT, declaraciones anuales, moneda extranjera o retenciones por todos los supuestos. Los cálculos profesionales y acuses externos deben validarse y conservarse.
4. Configurar y probar obligaciones, calendarios, impuestos locales, privacidad, recuperación, retención y acceso de la instalación concreta.
5. Calidad debe validar evidencia por método y revisar alcance de acreditación/aprobación, NOM/PEC aplicable, instalaciones, personal, trazabilidad y autorizaciones. La existencia del ERP no otorga acreditación ni demuestra por sí sola conformidad con ISO/IEC 17025 o la LIC.

## Fuentes oficiales revisadas

- SAT, Anexo 24 RMF 2026: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo_24_RMF2026-13012026.pdf
- SAT, XSD catálogo: https://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas/CatalogoCuentas_1_3.xsd
- SAT, XSD balanza: https://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion/BalanzaComprobacion_1_3.xsd
- SAT, CFDI 4.0: https://wwwmat.sat.gob.mx/aplicacion/75169/servicio-de-facturacion-cfdi-version-4.0-%28vigente-a-partir-del-1-de-enero-de-2022%29
- DOF, Reglamento de la LIC: https://sidof.segob.gob.mx/notas/docFuente/5797937
