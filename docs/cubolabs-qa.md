# cubolabs — interfaz y flujos

Se mantiene el sitio SaaS y su audiencia privada. La raíz sirve la landing; `/entrar` consulta el endpoint autorizado del proveedor y dirige a `/admin/` solamente si responde correctamente. Los otros usuarios pueden indicar su laboratorio. La identidad se verifica en el servidor; no se infiere el rol del nombre de usuario ni de almacenamiento local.

Los logos suministrados se sirven con sus bytes originales desde rutas de activos. La interfaz del laboratorio y el panel del proveedor usan azul marino y superficies claras. Navegación móvil inferior, tablas de consulta en tarjetas, formularios a pantalla completa, buscador oculto durante edición, herramientas agrupadas y buscables, selector de herramienta, filtros por fecha plegables y resumen financiero desplegable. Respaldos y cierre de sesión siguen accesibles. El alta de cliente valida tres pasos sin realizar escrituras hasta guardar el último.

Se conservaron las validaciones y las autorizaciones de negocio: no se agregaron transiciones que salten revisión técnica, Calidad o autorización administrativa. El menú abre directamente la herramienta recordada o principal del módulo, reduciendo una pantalla de navegación. Muestreo continúa sujeto a su membresía y a la activación de esa actividad en la identidad del laboratorio; el selector explica el acceso cuando está pendiente de activar.

## Verificación

- Build y validación del Worker ESM.
- `scripts/saas-test.mjs`: membresías, dependencias, credenciales independientes, revocación, suspensión, separación de registros, migración inclusiva y conflictos.
- `scripts/cubolabs-test.mjs`: landing sin creación/registro de propietario, acceso de administrador, denegación a otra identidad, errores recuperables, logos fieles y sintaxis de páginas.
- Regresión v42 sobre labflowApp interno: acción obligatoria de riesgo, planes por líneas, evidencia/eficacia para cerrar, seguimiento, permisos y PDFs horizontales.
- Regresión v28 sobre labflowApp: documentos/revisión/obsolescencia, personal/competencia, contratos, auditorías, cotización→orden→programación→informe→Calidad→entrega, trabajo no conforme y cierre.
- Regresión v37 sobre labflowApp: fechas, avisos, autorizaciones vigentes, ventas mensuales/anuales, controles administrativos, guardado doble y recuperación de conflictos.
- Navegador: landing escritorio, reconocimiento del proveedor, alta con requeridos y selección de membresía, SaaS en viewport de teléfono, laboratorio, selección de herramientas, navegación a riesgos y formulario con buscador oculto.

El servidor `scripts/dev.mjs` es únicamente de QA: almacenamiento en memoria, identidad ficticia, laboratorio de demostración y rutas `__qa-*`. No se incluye en la entrada desplegada del Worker ni se debe usar para producción. Las verificaciones móviles emplearon un iframe de 390 px para activar los mismos breakpoints; no equivalen a pruebas físicas en todos los teléfonos.

## Canal comercial, privacidad y perfiles

- Landing: módulos detallados, paquetes y comparativo, alternativa personalizada, carrusel con tres capturas reales del entorno ficticio, contacto y demo independientes. No se inventaron tarifas, clientes o testimonios.
- `worker/sales-channel.js`: captación persistente en BUCKET separada del registro de laboratorios, folios, idempotencia, límite por conexión, consentimiento de privacidad y publicidad opcional separados, versión informada y origen. Acceso a prospectos exclusivo del proveedor. Seguimiento con estado, fecha y notas; alta de cliente precargada sin activación automática.
- Datos legales: el propietario eligió completarlos en el panel. Se exigen identidad, domicilio, correo y confirmación antes de recibir solicitudes. Las páginas legales muestran ese estado si faltan datos. No se fabricaron datos del responsable ni se afirma que un texto por sí solo garantice cumplimiento integral.
- Fuente: LFPDPPP, texto vigente con reforma DOF 14-11-2025, arts. 7, 14–16, 18–20, 28–31 y 35–36; LFPC, texto vigente con reforma DOF 12-12-2025, arts. 7, 7 Bis, 10 y 76 Bis. Consulta oficial: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf y https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf. El responsable debe operar las solicitudes ARCO, confidencialidad, conservación y contratos de encargados; la interfaz no sustituye esas obligaciones.
- Retención configurable de prospectos (1 a 24 meses): los vencidos se depuran al acceder o modificar la bandeja. El control de frecuencia usa identificadores derivados de la conexión y depura ventanas vencidas al recibir nuevos envíos. No se mantienen direcciones IP crudas en expedientes comerciales.
- Membresías personalizadas: casillas por módulo, paquetes como base, cierre de dependencias en el servidor y baja en cascada en UI. Los roles siguen limitando acciones. Los datos se conservan al cambiar accesos.
- Menú lateral: iconos SVG y modo contraído persistente, sin ocultar los nombres accesibles; panel deslizable en móvil.
- Perfiles propios: foto PNG/JPG reducida por el navegador y apodo; el servidor impide editar rol, nombre legal, pertenencia o identidad de otro usuario mediante esta ruta. La bitácora conserva nombre formal. También el proveedor puede editar su perfil de presentación, sin modificar su identidad autenticada.
- `scripts/sales-profile-test.mjs`: validación legal, ambos formularios, privacidad obligatoria y marketing opcional, repetición de envío sin duplicación, límites, bandeja privada, seguimiento concurrente, retención, casillas personalizadas, perfil/avatar y rechazo de elevación de privilegios.
- QA visual: capturas de laboratorio ficticio, carrusel y actualización de posición, panel comercial, configuración legal y habilitación con datos ficticios sólo en la vista de desarrollo. La comprobación final de envío por navegador se interrumpió por indisponibilidad de la herramienta; el flujo servidor y las variantes de error sí se comprobaron por pruebas automatizadas.
- Se conservó el acceso privado del sitio. La captación de visitantes externos requiere además autorizar una audiencia pública apropiada; no se cambió la audiencia como efecto secundario de formularios.

## Pestañas por módulo

Se sustituyó el selector de herramienta de `cube-context` por pestañas principales y subpestañas, ambas en una sola fila. `worker/cubolabs-tabs.js` organiza las herramientas por función: en Compras, Compras → solicitudes/cotizaciones/órdenes; Proveedores → catálogo/evaluaciones; Control → pagos/seguros. Calidad, personal y otras áreas amplias se agrupan de la misma manera.

La selección conserva la última subpestaña utilizada de cada sección. La lista parte de herramientas visibles y autorizadas, mantiene acceso a Respaldos del administrador y dispone de fallback para futuras herramientas. Etiquetas cortas en móvil, nombres completos accesibles, navegación por flechas/Inicio/Fin y panel asociado para lectores de pantalla. No se modificaron mutaciones ni niveles de autorización.

`node scripts/module-tabs-test.mjs` verifica cobertura de todas las herramientas actuales (excepto el ejemplo retirado), categorías sin duplicados, visibilidad por permisos, recuerdos de sección, respaldos y teclado. Se comprobó Compras/Control/Seguros en escritorio y Calidad/Mejora a 390 px: las pestañas de cada nivel compartían la misma coordenada vertical y el ancho desplazable era igual al ancho visible (sin desbordamiento). Las pruebas móviles son de viewport simulado, no de todos los dispositivos físicos.
