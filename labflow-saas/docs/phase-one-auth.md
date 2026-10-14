# Fase 1: autenticación independiente y controles de acceso

La administración conserva sus pantallas, clientes, membresías y bitácora. Ahora
requiere usuario y contraseña propios; `oai-authenticated-user-id`, el nombre
proporcionado por Sites y `SAAS_TEST_OPERATOR` no conceden acceso, ni siquiera en
local. No existe alta pública del primer administrador.

## Aprovisionamiento y rotación sin alterar registros

El operador autorizado configura **fuera de la aplicación** el binding secreto
`SAAS_ADMIN_AUTH`, un JSON generado por `scripts/admin-credentials.mjs`.
El script recibe el usuario como argumento y la contraseña por stdin. Nunca
recibe contraseñas por argumentos ni imprime la contraseña. Exige 16–128
caracteres; utiliza sal aleatoria de 256 bits y PBKDF2-SHA-256 con 600.000
iteraciones. La aplicación solo recibe la sal y el hash.

Ejemplo Bash para generar el archivo privado, sin escribir una contraseña en el
historial (elige una contraseña única generada por un gestor):

```bash
cd /workspace/labflow/labflow-saas
umask 077
read -r -s -p 'Contraseña del superadministrador: ' labflow_admin_password
printf '\n'
printf '%s' "$labflow_admin_password" | node scripts/admin-credentials.mjs operador > /tmp/labflow-admin-auth.json
unset labflow_admin_password
```

No versionar ese archivo, mostrarlo en logs ni usar credenciales de ejemplo.
Para desarrollo, coloca el JSON como valor de `SAAS_ADMIN_AUTH` en un archivo
privado `.dev.vars` ignorado por Git, o en un archivo privado pasado a Wrangler
con `--env-file`. Usa `--local` y almacenamiento aislado. No hay contraseña local
predeterminada. Si falta el binding o es inválido, el panel queda bloqueado (503).

Una futura instalación deberá cargar este JSON a su gestor de secretos mediante
un canal administrativo autorizado. Esta fase no publica ni configura producción.
Después de cargarlo, elimina la copia temporal. Las credenciales son independientes
del usuario administrador de cada laboratorio.

Para rotar o recuperar el acceso, genera nuevas credenciales y reemplaza el
binding por el mismo canal autorizado. La huella de configuración cambia e
invalida todas las sesiones administrativas anteriores. No se borra ni migra el
registro de clientes, documentos ni el antiguo `ownerUserId`; este último se
conserva como dato histórico y deja de autorizar accesos.

## Sesiones y protección

- Tokens aleatorios de 256 bits; en el bucket solo se usa el hash del token.
- Cookie `__Host-labflow_admin`, `HttpOnly`, `Secure`, `SameSite=Strict`, sin Domain.
- Caducidad absoluta de ocho horas, cierre de sesión y renovación al autenticar.
- HTTPS obligatorio, salvo loopback para desarrollo; Origin exacto en POST.
- Límite de ocho intentos reservados de forma condicional en quince minutos.
  No confía en cabeceras de IP. Un acceso correcto reinicia el contador solo
  si no hubo reservas concurrentes posteriores. Un ataque puede bloquear
  temporalmente el login global: añadir protección de borde en la siguiente fase.
- Sesiones de laboratorio y del proveedor no son intercambiables.

`/api/profiles` requiere sesión y permiso de Usuarios. La pantalla de login del
laboratorio ya no consulta ni divulga el directorio de usuarios antes del acceso.
Descargas de adjuntos, informes y vistas previas comprueban permisos y licencia,
incluso para Administrador y Calidad. Bajar una membresía no elimina sus datos;
reactivarla restablece el acceso. Los respaldos administrativos completos siguen
conservando todos los datos para recuperación y portabilidad.

## Verificación reproducible

```bash
python3 scripts/assemble.py
npm run build
npm run validate
npm test
```

`npm test` ejecuta la suite SaaS, ocho casos de seguridad y once suites del motor
original (comercial, contabilidad, permisos técnicos, muestreo, personal,
respaldos, fiscal, correo, flujos y acciones de calidad). Estas últimas usan una
copia temporal con el entrypoint del motor `labflowApp`, las bibliotecas ya
vendorizadas y rutas de salida temporales. La copia conserva el código funcional;
no desactiva aserciones y no usa datos de producción. La suite SaaS ejercita el
entrypoint real `saasGateway`. Ninguna de estas pruebas equivale a QA visual o a
pruebas de carga de producción.

También se corrige la referencia antigua `app.fetch` del recorrido de demo
por el nombre existente `labflowApp.fetch`. La demo continúa excluida de las
membresías SaaS; no se habilitan datos ficticios para clientes.

## Pendientes

MFA, recuperación autoservicio, varios operadores, limpieza de sesiones vencidas,
protección de borde contra denegación de servicio y auditoría específica de eventos
de autenticación. Permanecen pendientes la arquitectura de VPS, transacciones,
respaldos externos, monitoreo, cobros SaaS, integraciones fiscales, correo real,
QA de navegador y carga. No se modificó el algoritmo de las contraseñas existentes
de los laboratorios en esta fase.
