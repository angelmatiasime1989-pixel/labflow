# Espacio del laboratorio: navegación y tableros

Estos cambios se limitan al laboratorio. `/admin/finanzas` es el módulo global del proveedor y no se modifica.

## Navegación

Vista general se presenta como **Tableros**. El encabezado contiene búsqueda literal por folio, código o título, campana de avisos y menú de cuenta (Mi perfil / Cerrar sesión). La búsqueda utiliza exclusivamente el estado filtrado por el servidor y no interpreta preguntas de ventas ni llama a IA. Qubito permanece separado con sus permisos existentes.

La campana cuenta registros con avisos sin leer (el mismo agrupamiento de la bandeja); varios eventos sobre el mismo registro no inflan la cifra. Marcar como leído conserva `notifications17.readBy` y `alertRead18`; no elimina eventos. El historial visible está filtrado por destinatario, permisos actuales y laboratorio. Se conserva la retención previa del historial; no se promete conservación ilimitada. La consulta periódica actualiza la campana sin ventanas emergentes ni duplicados en el inicio.

Finanzas y Contabilidad se agrupan visualmente, pero mantienen identificadores, rutas, almacenamiento y permisos. Técnica se muestra como **Ensayos y calibraciones**, con **Plantillas** dentro de **Informes y certificados**. Calidad permanece independiente. Centro de ayuda y Configuración del laboratorio tienen entradas distintas. La guía de arranque omite SAT/timbrado/envío fiscal sin eliminar registros ni modificar controles fiscales; el diagnóstico completo descargable conserva su alcance anterior.

## Tableros de escritorio

A partir de 1000 px, cuadrícula 2×2: Comercial, Operación y resultados, Calidad y Finanzas. Solo aparecen métricas de módulos permitidos. Cada cifra cuenta registros visibles; no estima ventas, cobros, ganancias ni conformidad técnica. El botón abre la lista exacta de registros, con folio, estado y fecha del filtro.

Filtro común por creación, fecha del registro o actualización. Se compara la parte de fecha guardada en ese campo; un registro sin esa fecha no entra en un rango limitado. «Todas las fechas» permite incluirlo. Por defecto se usa el mes de la fecha operativa del laboratorio. Los informes emitidos y documentos vigentes se filtran además por su estado actual. No son una reconstrucción histórica de estados anteriores.

Los planes que ya habilitaban tableros configurables (Platinum, Diamond y Enterprise Custom), con permiso para indicadores, pueden elegir y ordenar hasta cuatro secciones y guardar el rango de fechas. Se reutiliza `/api/profile/dashboard`; las preferencias están en la propia persona del propio laboratorio. Se rechaza intentar editar otra identidad, seleccionar áreas no permitidas, repetir secciones o sobrescribir una revisión anterior. Los indicadores personalizados existentes siguen disponibles en un bloque separado con su periodo indicado.

Móvil conserva su distribución de contenido previa y navegación operativa. No se aplica la cuadrícula nueva en pantallas pequeñas. La búsqueda y campana siguen accesibles.

## Guías y controles técnicos

Centro de ayuda ofrece recorridos por tarea: cotizar/programar, ensayo/resultados, calidad, registro/conciliación. Los enlaces dependen del rol, plan y permisos. La guía no declara conformidad ISO, no valida métodos ni reemplaza procedimientos del laboratorio. Los controles de avance del servidor no se relajan.

Se ensayan con registros sintéticos los rechazos de avance de un servicio de tipo Ensayo por confirmación del ítem faltante, revisión de capacidad faltante, recepción incompleta, equipo sin aptitud, método no vigente, competencia faltante y ausencia de registro técnico. La prueba verifica que el estado no cambie tras el rechazo. Esto no constituye validación metrológica ni ensayo de aceptación de un laboratorio real. El recorrido positivo de un ensayo con sus evidencias y criterios particulares requiere la validación del responsable técnico; no se crean registros reales para simularla.

## Verificación

`node --test scripts/workspace-test.mjs`, también con `MYSQL_TEST=true MYSQL_TEST_PORT=3308` sobre MariaDB local aislada. `npm run test:workspace-browser` comprueba escritorio y móvil, búsqueda, campana única, historial, perfil, agrupación de módulos, plantillas, cuadrícula, filtros y preferencias. Todos los registros son sintéticos. La suite general conserva comprobaciones de permisos, bloqueos, PDF y navegación offline.
