# Procedencia y adaptación

Base: cubolabs SaaS, commit `e7a6741fed9001bb931685957fd6923b667d2a68`, posterior a la revisión funcional del 30 de octubre de 2026.

Esta entrega adapta el software para operar fuera de Sites. Agrega servidor Node 24, almacenamiento SQLite con BLOB para adjuntos y escrituras condicionales, autenticación propia del proveedor, configuración de primer arranque, respaldo cifrado, restauración y ejemplos de despliegue. La landing incorpora acceso al administrador y el panel añade cierre de sesión.

Las reglas de negocio, módulos, permisos de laboratorio y procesos se conservan. La identidad y el almacenamiento del alojamiento anterior se sustituyen en el adaptador Node. La compilación y las dependencias de pruebas se hacen portables.

La configuración `.openai/hosting.json` es histórica; no se necesita para ejecutar Node. El código de demostración se conserva como entorno de desarrollo, separado del servidor real.

Se excluyen historial Git, dependencias instaladas, temporales, base de producción, sesiones y adjuntos remotos. El ZIP de código no contiene secretos. El paquete privado separado contiene la configuración del servidor y el acceso inicial solicitado. Los datos de prueba existentes son ficticios.
