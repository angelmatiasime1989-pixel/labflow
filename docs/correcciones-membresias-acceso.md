# Correcciones de membresías y acceso de clientes

15 de noviembre de 2026.

## Información comercial

- Se retiró “Facturación electrónica CFDI” de las membresías y de su comparador.
- Silver y Gold utilizan “Herramientas de cumplimiento LIC”. Los niveles superiores lo heredan. Se eliminó la presentación “Preparación de reportes semestrales LIC”.
- Se retiró “API para conexión con sistemas externos”.
- Los precios, identificadores de planes, registros, pagos y permisos contratados no cambian. Se conservan los módulos internos existentes; esta corrección retira promesas comerciales, sin eliminar funcionalidades o datos.

## Enlace del laboratorio

El administrador y la entrada pública construían subdominios de forma automática. Esa generación no comprobaba que el alojamiento tuviera DNS comodín, certificado y enrutamiento habilitados. Además, el control de apertura utilizaba un botón dentro de un enlace, una combinación de elementos interactivos que se sustituyó por un enlace directo.

El acceso principal ahora es:

`https://qubolabs.tech/laboratorio/identificador/`

El servidor entrega la URL autorizada a la administración; mostrar, copiar y abrir utilizan esa misma dirección. La entrada pública también usa la ruta del dominio principal. No se cambian los identificadores ni las credenciales de los clientes.

### Subdominios opcionales

Se conserva `identificador.qubolabs.tech`. Para utilizarlo como enlace principal, primero verificar DNS, HTTPS y aceptación del hostname en el alojamiento, y después configurar privadamente:

`TENANT_SUBDOMAINS_ENABLED=true`

El valor predeterminado es `false`. Con la opción activa, las entradas por ruta de clientes activos redirigen temporalmente al subdominio. Los accesos de clientes desconocidos o suspendidos mantienen sus restricciones. Los nombres reservados `www`, `admin`, `api` y `mail` siguen utilizando rutas, sin invalidar clientes existentes con esos identificadores.

No se han modificado DNS, certificados, variables privadas ni recursos de producción desde el panel. La verificación externa desde este entorno está bloqueada; no se afirma haber comprobado el DNS real del alojamiento.

## Integración con otros sistemas: viabilidad y alcance

Es viable desarrollarla aprovechando el backend actual, sin reconstruir la aplicación. Sin embargo, los endpoints que hoy utiliza la interfaz no constituyen una API pública soportada para terceros: usan sesiones de usuario, validación del origen y rutas internas. No hay todavía un contrato de integración versionado, claves de servicio por empresa, documentación pública ni webhooks de negocio preparados para clientes externos.

Una primera entrega concreta podría ser:

1. **Consulta de clientes y servicios:** rutas como `GET /api/v1/services` y `GET /api/v1/services/{id}`, con filtros y paginación, inicialmente de lectura.
2. **Identidad de integración:** credenciales revocables por empresa y permisos limitados, por ejemplo `services:read`; guardar el hash del secreto y establecer expiración y rotación. Para integraciones más amplias, evaluar OAuth 2.0.
3. **Aislamiento y seguridad:** resolver la empresa desde la credencial validada, nunca desde una cabecera externa de identidad; reutilizar el almacenamiento aislado y las reglas del dominio, con validación de entradas, límites de uso y auditoría.
4. **Escrituras controladas:** sólo después de validar los flujos de lectura; utilizar claves de idempotencia y control de revisiones para evitar duplicados y conflictos.
5. **Eventos:** notificaciones firmadas para estados de servicios o informes, con reintentos y protección contra repetición. Implementar únicamente los eventos acordados.
6. **Contrato y aceptación:** especificación OpenAPI, entorno de pruebas, ejemplos, pruebas de acceso cruzado entre empresas y validación con el sistema concreto que se quiera conectar.

Ejemplo: el sistema de un cliente consulta el avance de sus servicios con una credencial que sólo permite leer sus registros. No recibe una contraseña de administrador ni acceso a laboratorios ajenos.

La API permanece fuera de la información comercial hasta definir, implementar y verificar este alcance. No se habilitaron integraciones nuevas en esta entrega.

## Validación

- Pruebas de textos y comparador: ausencia de facturación/API anunciadas, presencia de herramientas LIC y conservación de precios.
- Creación del cliente, URL devuelta por el servidor, enlace mostrado, copiado y abierto en administración.
- Inicio de sesión y acceso al espacio del cliente mediante la ruta del dominio principal.
- Activación explícita de subdominios, conservación de restricciones de clientes y compatibilidad de las rutas anteriores.
- Navegador Chromium: apertura en nueva pestaña, inicio de sesión real con datos sintéticos y entrada desde la portada, sin excepciones JavaScript.
- Pruebas de regresión del repositorio, compilación y sincronización del directorio `labflow-saas` para Hostinger.
