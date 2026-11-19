# Recepción de contacto, demo y cotización

Los datos legales aprobados y el canal de recepción son requisitos distintos. La landing mantiene los campos deshabilitados cuando falta cualquiera de ellos.

En **Administración → Datos legales → Recepción de formularios**, el administrador global puede seleccionar:

- **Prospectos · sin enviar correos**: guarda contacto y solicitudes de demo/cotización en la bandeja privada. Requiere datos legales ya aprobados. Es una elección explícita del administrador, independiente de la configuración del canal externo; no necesita Resend.
- **Canal configurado en el servidor**: comportamiento anterior, conforme `SALES_ENABLED` y `SALES_CHANNEL` y sus requisitos. Es el modo predeterminado de bases existentes. No se altera ese canal al desplegar.
- **Pausar formularios**: impide nuevas solicitudes sin borrar prospectos existentes.

Después de guardar recepción, recargar la landing para obtener el estado actualizado. No es necesario volver a capturar los datos legales si ya están aprobados. La configuración persiste en el índice existente (`salesIntakeMode`), con auditoría y control de revisión; solo administración global puede cambiarla. Los consentimientos, versión del aviso, limitación de solicitudes e idempotencia se conservan.

Esta opción no habilita contratación, Stripe, pruebas comerciales, correos transaccionales ni envíos de laboratorio. No crea cuentas ni laboratorios. En el despliegue no se selecciona automáticamente un modo ni se modifica información legal productiva.

Validación: fixtures con SQLite/MariaDB; canal existente con transporte de correo simulado; activación global después de aprobación legal; denegación a anónimos/laboratorios/origen ajeno; pausa; recuperación tras reinicio; captura/reintento sin duplicados. Chromium 1440 y 390 px prueba campos inicialmente bloqueados, selección desde administración, captura y envío de contacto/demo y consulta de los tres prospectos ficticios resultantes. No hubo envío real ni registros productivos.
