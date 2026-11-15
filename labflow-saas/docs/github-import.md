# Actualización de GitHub con Cubolabs Node

Se incorporó el código de `cubolabs-github-node.zip` en la raíz del repositorio.
SHA-256 del ZIP: `61ea74d2db5ffeabc3d440c17440a09b3f862507fa21907fd8651d464ee42a3c`.

- La versión anterior se conserva en el historial Git. `labflow-saas/` se actualizó posteriormente como copia de despliegue sincronizada con la aplicación nueva.
- La aplicación nueva usa `package.json`, `server/`, `worker/`, `vendor/` y `scripts/` de la raíz.
- No se incluyeron `.env`, `ACCESO-ADMINISTRADOR.txt`, contraseñas, claves, bases de datos ni respaldos privados.
- El artefacto `worker/index.js` se recompiló con las fuentes entregadas. `SOURCE-MANIFEST.json` se conserva como manifiesto de la entrega original.
- En el selector de Hostinger debe elegirse `labflow-saas`, que ahora contiene la aplicación nueva completa. Usar Node 24, `npm ci`, `npm run build` y entrada `server/index.mjs` o `npm start`, según el producto contratado. Las fuentes principales siguen en la raíz.
- Las variables del paquete privado deben instalarse en el servidor/panel, nunca en GitHub. Ajustar `PUBLIC_URL` al dominio HTTPS real, `HOST` a la escucha que permita el hosting, y `DATA_DIR`/`BACKUP_DIR` a almacenamiento persistente.
- El cambio de código no importa ni migra bases de datos del alojamiento anterior. La continuidad de datos requiere revisar y respaldar su almacenamiento antes de cambiar el servidor.

Consulta `DEPLOYMENT.md` para los requisitos de arranque y los comandos de respaldo/restauración. La subida a `main` puede activar el despliegue automático si Hostinger lo tiene configurado. No se modificó el panel de Hostinger ni se cargaron secretos al alojamiento.

## Ajustes solicitados en esta actualización

La landing incorpora un cubo 3D de 27 piezas, la nueva leyenda comercial, secciones de beneficios y explicación por público/proceso, y Qubito con una conversación de ejemplo interactiva. Los estilos y el comportamiento se mantienen en `worker/landing-experience.css` y `worker/landing-experience.js`; `scripts/assemble.py` los integra en el artefacto. Se agregaron pruebas específicas y se conservó el formulario comercial con su consentimiento y configuración legal.

Qubito es una simulación visible de una integración opcional propuesta: respuestas predefinidas, sin modelo de IA conectado y sin consultar datos de laboratorios. No se introduce una integración de IA real sin alcance, proveedor y permisos definidos.
