# Demo temporal pública para vista previa Node.js

Solo para pruebas con datos ficticios. Cualquier persona con el enlace puede
entrar al panel y modificar los datos compartidos. No es producción ni un
entorno privado de clientes.

En el proyecto Node.js de GoDaddy:

- Rama de vista previa recomendada: demo/godaddy-preview.
- Alternativa: feat/godaddy-vps con comando explícito start:demo.
- Raíz: raíz del repositorio.
- Node: 24.19.x, como la versión del servidor existente.
- Build: npm run build.
- **Start en demo/godaddy-preview: npm start**.
- Si el panel de vista previa ejecuta **npm run dev**, también inicia esta demo
  (desde la raíz o desde labflow-saas), respetando PORT.
- **Start en feat/godaddy-vps: npm run start:demo**.
- Guardar y redesplegar la vista previa.

No requiere PUBLIC_ORIGIN, DATA_DIR ni SAAS_ADMIN_AUTH. No se omiten los controles
de producción: este comando inicia otro servidor y crea su propio SQLite en un
directorio temporal, con credenciales aleatorias independientes. Ignora las
credenciales de producción, los datos persistentes y las claves de correo.
PORT lo asigna el hosting y el servidor escucha en 0.0.0.0.

Al abrir la URL pública aparecerá una portada con **Entrar a Administración SaaS**.
Ese botón concede acceso público exclusivamente a esta demo temporal. No hay
que introducir una contraseña de superadministrador. El acceso público no existe
al ejecutar npm run start:production.

Se crean tres laboratorios ficticios: Básico, Medio y Avanzado. La portada tiene
sus enlaces. Para esos laboratorios el usuario es `demo` y la contraseña
**pública de demostración** es `DemoTemporal-2026!`. No reutilizarla para cuentas
reales. Los datos de todos los visitantes son compartidos y pueden cambiar.

La demo tiene un máximo de ocho clientes ficticios y 32 MB de contenido de
objetos; los archivos SQLite/WAL pueden ocupar más. El servidor no se apaga por
un temporizador: permanece disponible mientras el hosting mantenga el proceso
activo. El plan gratuito puede suspenderlo o reiniciarlo. En cada arranque se
crea una demo vacía con los tres clientes iniciales;
no se conserva lo introducido. Los reinicios forzados pueden dejar archivos en
el almacenamiento temporal hasta que el hosting los limpie. Correo externo está
deshabilitado. No se conectan buckets R2 ni se realizan migraciones.

El origen de demo se deriva de Host porque todavía no se conoce el dominio
público de la vista previa. Solo se aceptan hosts con formato limitado, no se
utiliza X-Forwarded-Host. Fuera de loopback se requiere que el navegador entre por
HTTPS y que el proxy conserve Host; las cookies de sesión siguen siendo Secure.
Esta inferencia y el acceso público solo existen en el comando de demo.

Para abandonar la demo, volver a la rama feat/godaddy-vps, usar npm run start:production y configurar los secretos y disco
persistente según docs/godaddy-node.md. No convertir el SQLite temporal en una
base de clientes reales ni desplegar el comando de demo en un dominio productivo.
