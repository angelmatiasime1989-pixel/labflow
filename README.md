> **Hostinger:** selecciona **`labflow-saas`** como directorio raíz, rama `main`, Node **24.x**, build `npm run build`, salida `.` y entrada **`server/index.mjs`**. Esa carpeta contiene una copia sincronizada de la aplicación nueva, incluido el cubo y Qubito. La compilación solo necesita Node.
> Para desarrollar, edita las fuentes de la raíz y ejecuta `npm run sync:hostinger` antes de guardar los cambios. CI verifica la sincronización. Nunca se copian datos ni `.env` privados.

# cubolabs · SaaS independiente

Aplicación de gestión de laboratorios preparada para ejecutarse en Node.js sin Sites ni una sesión de ChatGPT. Conserva los módulos y flujos del software; incorpora servidor HTTP propio, autenticación del proveedor, persistencia SQLite y respaldos cifrados.

## Subir a GitHub

Descomprime el ZIP y publica la carpeta `cubolabs` completa mediante GitHub Desktop o Git. No hay que quitar archivos. Incluye `.github`, `.openai`, `.gitignore` y `.env.example`. Si cargas desde la página de GitHub, sube carpetas por tandas cuando la interfaz limite el número de archivos; no subas el ZIP como un solo archivo.

**La configuración privada entregada por separado pertenece al servidor, no al repositorio.** `.env`, bases de datos y respaldos están ignorados por Git. El ZIP de código no incluye claves reales.

Consulta [la configuración MySQL y migración](docs/mysql-hostinger-y-conservacion.md) y [la conservación de datos y respaldos automáticos](docs/almacenamiento-y-respaldos-automaticos.md) antes de actualizar producción.

## Requisitos

- Node.js **24 o superior**, con el módulo incorporado `node:sqlite`.
- La compilación de producción solo necesita Node. Python 3 se conserva como referencia de ensamblado y para comprobaciones opcionales.
- npm e Internet para instalar las dependencias de producción y de pruebas.
- SQLite: disco persistente y permisos de escritura para `DATA_DIR` y `BACKUP_DIR`. MySQL: servidor accesible, credenciales privadas y respaldo externo o administrado verificado.

## Arranque de una instalación existente

1. Instala el contenido del ZIP de código.
2. Copia el `.env` del paquete privado a la raíz de `cubolabs` en tu servidor o computadora.
3. Confirma que la base existente esté en el almacenamiento persistente configurado. No inicialices otra base para recuperar registros.
4. Ejecuta:

```bash
npm ci
npm run build
npm run validate
npm start
```

Abre **http://localhost:3000** en desarrollo o el dominio HTTPS configurado. El servidor exige una base ya inicializada: no crea automáticamente usuarios ni bases al arrancar. El acceso del proveedor está en `/admin`. Desde ese panel puedes dar de alta a cada cliente, su administrador y los módulos de su membresía.

Una instalación expresamente nueva empieza **vacía, sin laboratorios ni datos de demostración**; una actualización debe conservar la base existente. Las contraseñas de los laboratorios las define el proveedor al darlos de alta. La contraseña del proveedor no permite entrar como usuario de laboratorio.

Con SQLite, la identidad se conserva en el archivo `cubolabs.sqlite` de `DATA_DIR`; en producción ese directorio debe ser persistente y estar fuera de las versiones del código. Con `DB_DRIVER=mysql` se conserva en la base configurada, después de migrar los datos. Reiniciar no reemplaza usuarios, contraseñas ni registros existentes. Guarda de forma segura el paquete privado y la clave de respaldo.

## Instalar sin paquete privado

Sólo para una instalación realmente nueva, copia `.env.example` como `.env` y ejecuta `npm run setup -- --initialize-new-installation`. El asistente solicita un usuario y contraseña nuevos; la contraseña no se muestra al escribirla. Después ejecuta `npm start`. Define una clave hexadecimal de 32 bytes en `BACKUP_ENCRYPTION_KEY` antes de generar respaldos cifrados.

Para restablecer al proveedor, con acceso al servidor:

```bash
npm run setup -- --reset
```

Si `CUBOLABS_ADMIN_PASSWORD` contiene un valor, el comando usa ese valor; si está vacío, pide uno nuevo. El restablecimiento revoca las sesiones anteriores y conserva el identificador del proveedor, los clientes y sus registros.

## Compilación y pruebas

```bash
npm run build
npm run validate
npm test
```

`npm test` ejecuta las 34 suites funcionales del laboratorio y SaaS, seguidas de las pruebas independientes de Node, persistencia, autenticación, respaldos y restauración. Usa datos ficticios y directorios temporales. No necesita claves de correo ni servicios fiscales.

`npm run dev` conserva una demostración **efímera** para desarrollo de interfaz, con datos en memoria y acceso simulado. No es el servidor real. Para operación usa `npm start`.

## Datos y respaldos

La base SQLite guarda clientes, permisos, registros, adjuntos PDF, sesiones y configuración. El almacenamiento mantiene separación por laboratorio y escrituras condicionales para detectar conflictos de edición.

```bash
npm run backup
```

Genera una copia SQLite consistente cifrada con AES-256-GCM en `BACKUP_DIR`. Para restaurar, **detén primero el servidor**:

```bash
npm run restore -- /ruta/respaldo.clbackup --confirm
```

La clave debe ser la misma que cifró el respaldo. Se verifica la integridad y se conserva la base anterior. Copia regularmente los respaldos a otro destino; la ejecución periódica se programa en el servidor. Perder la clave impide recuperarlos.

## Despliegue

Consulta **[DEPLOYMENT.md](DEPLOYMENT.md)** para configurar dominio, HTTPS, variables, arranque y almacenamiento en un VPS o alojamiento Node. Se incluyen ejemplos de Nginx y systemd. El alojamiento debe soportar Node 24 y disco persistente; un hosting exclusivamente PHP no es suficiente.

## Servicios externos

- **OpenAI / ChatGPT / Sites:** no son necesarios para operar esta versión.
- **Correo opcional:** Resend, mediante `RESEND_API_KEY` y `EMAIL_FROM` reales. Sin estas variables no se envía correo externo; la plataforma sigue funcionando.
- **Fiscal:** las funciones contables y XML existentes se conservan. No se agrega un PAC, timbrado ni consulta automática al SAT que no existieran previamente.
- **Dominio, HTTPS y copias externas:** se configuran en el alojamiento elegido.

No se exportan datos reales del alojamiento anterior, sus sesiones, adjuntos remotos ni claves de cuentas externas. Esta entrega prepara el software independiente; no migra automáticamente la base remota.

## Estructura

- `server/`: HTTP Node, autenticación del proveedor y almacenamiento SQLite.
- `worker/`: módulos, reglas de negocio, API, interfaz y recursos originales; `index.js` es el ensamblado completo.
- `vendor/`: dependencias funcionales integradas y avisos de licencia disponibles.
- `scripts/`: compilación, configuración, pruebas y respaldos.
- `deploy/`: ejemplos de despliegue.
- `docs/`: auditoría funcional y documentación histórica.
- `.github/workflows/ci.yml`: compilación y pruebas en GitHub.
- `.openai/hosting.json`: referencia histórica; no se utiliza para arrancar en Node.

La documentación histórica en `docs/` describe la edición original. Este README y DEPLOYMENT.md son las instrucciones vigentes para la edición independiente.
