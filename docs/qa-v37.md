# LabFlow v37 — revisión funcional y correcciones

## Nueva alerta de asignación
Al guardar una asignación o reasignación de técnico/signatario, se genera un evento persistente para el usuario responsable. Detecta cambios por servicio, incluso cuando se asignan desde una orden, no repite eventos al guardar sin cambios y reutiliza un evento nuevo de estado del mismo servicio para evitar duplicados. El aviso abre el detalle con la regla existente de una aparición flotante por evento y usuario. El signatario asignado con autorización vigente para Emitir puede consultar su servicio.

## Hallazgos corregidos
- Ventas del mes: incluye cotizaciones creadas en años anteriores cuya orden se crea en el mes actual. Acumulado anual por fecha de contratación; conversión por cohorte de creación. Excluye órdenes canceladas y cotizaciones rechazadas de las ventas.
- Fechas: rechaza días inexistentes, incluso en borradores documentales. Las vigencias mensuales conservan el último día posible del mes destino, sin saltos al mes siguiente ni errores de año bisiesto.
- Autorización de personal: exige un expediente activo y evidencias de calificación y prueba inicial satisfactorias, vigentes y del mismo método. No acepta evidencias vencidas aunque su estado guardado siga siendo Vigente.
- Distribución: notificaciones e historial documental respetan el acceso al registro; no se permite atender avisos de registros inaccesibles, incluidos los endpoints anteriores.
- Descargas: comparativo de proveedores comprueba la solicitud accesible y sus propuestas; la lista de verificación comprueba que exista la auditoría indicada y que sea accesible.
- Equipos obsoletos/retirados: se excluyen del programa de calibración y de nuevas solicitudes automáticas de compra.
- Formularios: impide solicitudes simultáneas desde Guardar y Guardar y enviar; bloquea ambos botones durante el envío. Si el guardado fue confirmado pero falla la actualización posterior, lo comunica como guardado y evita sugerir un segundo envío. Ante conflicto y fallo de conexión conserva la captura y rehabilita los botones.
- Vista previa de informes: usa el endpoint inline de vista previa; conserva el PDF emitido original y el enlace de descarga.
- Lista maestra: los documentos obsoletos quedan visibles como referencia del índice, sin botones de uso.
- Recuperación: botón Actualizar en todas las pantallas.

## Verificación
Las pruebas usan el Worker real con un almacenamiento R2 aislado y ejecutan el script de interfaz completo en un DOM simulado. v37-test comprueba fechas límite, ventas entre años, evidencias vencidas, distribución, todos los módulos visibles al administrador, documentos obsoletos, el visor de informes y recuperación/doble envío de formularios. Las 27 suites de regresión finalizaron con cero fallas tras integrar la alerta de asignación. Compilación y validación ESM del artefacto aprobadas.

No se modificaron registros reales del sitio durante estas pruebas. El acceso HTTP directo desde este entorno devolvió 403, y control-browser no está disponible. La revisión visual y la navegación de la sesión publicada en un navegador real siguen sin verificar. No se inició un servidor ni se improvisó infraestructura de navegador.

Las integraciones PAC/SAT y el proveedor de correo requieren sus configuraciones externas; esta revisión no las habilita ni afirma cumplimiento fiscal integral.
