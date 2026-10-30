# Vista de prueba de isoDesk: acceso y sincronización

Se corrigió el desfase entre `feat/isodesk-commercial` (rediseño nuevo) y
`demo/godaddy-preview` (versión anterior). La rama de preview integra ahora la
landing, el portal de acceso y la interfaz móvil de isoDesk, conservando su
arranque aislado con datos ficticios y sin secretos productivos.

## GoDaddy Node.js

- Fuente: `demo/godaddy-preview`.
- Raíz del proyecto: raíz del repositorio.
- Build: `npm run build`.
- Start: `npm start`; si el panel invoca desarrollo, `npm run dev` también funciona.
- Node: 24.19.x. `PORT` lo asigna GoDaddy.
- Esta rama no necesita `PUBLIC_ORIGIN`, `DATA_DIR` ni `SAAS_ADMIN_AUTH`.
  No colocar credenciales reales para intentar habilitar una demo pública.
- `LABFLOW_ENV=production` bloquea el lanzador de pruebas intencionalmente.
  Para producción se usa `npm run start:production` con almacenamiento y secretos.

Después de sincronizar GitHub, actualizar/reiniciar **la vista previa**, no publicar
producción. Si el panel sigue mostrando una versión antigua, revisar la rama
seleccionada y la última implementación. Los cambios en otra rama no se aplican
por sí solos al proyecto conectado a `demo/godaddy-preview`.

## Qué abrir

- `/`: landing de isoDesk, no la portada antigua “LabFlow · Demo temporal”.
- `/_demo`: accesos con un clic a Básico, Medio, Avanzado y Administración SaaS.
- `/acceso`: acceso manual; identificador `demo-basico`, `demo-medio` o
  `demo-avanzado`, usuario `demo`, contraseña pública `DemoTemporal-2026!`.
- `/_preview/status`: diagnóstico público sin datos de clientes. Debe indicar
  `product: isoDesk`, `version: 1.3.0`, `release: isodesk-preview-2026-10-30`,
  `landing: isodesk` y `mode: preview`. Si falta la ruta, sigue desplegada la versión
  anterior o se está abriendo otra URL.

Usar la URL pública de preview en una pestaña propia. El portal conserva cookies
seguras y protección frente a inclusión en sitios externos; un marco incrustado del
panel de hosting puede bloquear la sesión o la página.

## Aislamiento y límites

Solo se accede a los tres identificadores de prueba conocidos. El ingreso rápido
valida método, origen y tamaño, y usa las mismas credenciales de laboratorio y
rutas de autenticación. Las sesiones conservan el Path del laboratorio y no
conceden acceso administrativo. El botón administrativo existe únicamente en el
lanzador de demo; la aplicación productiva no contiene esos endpoints.

Los visitantes comparten los datos de prueba. Se restablecen al reiniciar y otro
visitante podría modificar usuarios o suspender un laboratorio. No usar información
real. La nota discreta explica este límite sin sustituir la marca isoDesk. Correos
y recursos de producción permanecen desconectados.

`npm run check:launch` debe rechazar este entorno como productivo; eso no es un
fallo de la demo. La rama productiva conserva el servidor privado y sus controles.

## Verificado

Build Node/ESM, entrada con un clic a cada membresía y al panel, login manual,
Path de cookies, aislamiento de sesiones, rechazo de origen externo e
identificadores arbitrarios, JS del panel, formulario móvil y bloqueo del lanzador
en producción. No se verificó el sitio remoto: la red del entorno rechazó la
conexión a la URL de preview. El estado del hosting no se deduce de las pruebas
locales.
