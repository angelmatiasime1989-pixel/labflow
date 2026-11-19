# Laboratorios internos de prueba: separación preparada, no publicada

Integración exclusiva del control desde `30359eb`, sobre main `194c90b`. No incluye la semilla ni aprovisiona cuentas o datos ficticios. No se creó ningún laboratorio en producción ni se cambió Hostinger, Stripe o Resend.

## Clasificación y compatibilidad

El administrador global puede marcar **Laboratorio interno de pruebas** al crear un cliente. `internalTest: true` vive en el índice JSON existente, con autor/fecha y auditoría; no requiere ALTER TABLE ni conversión de registros. Ausencia del campo equivale a cliente ordinario. La clasificación es inmutable después del alta, incluso para el administrador global: evita reclasificar historia económica o abrir integraciones por accidente. No es editable desde el laboratorio. La membresía sigue siendo Diamond normal, sin planes ni cuentas predeterminadas nuevas.

El inventario de clientes conserva ambos tipos para administrarlos. Los indicadores comerciales de clientes registrados/activos/en preparación y la lista reciente excluyen pruebas. El espacio muestra un aviso de datos ficticios.

## Efectos y Finanzas

- Pagos del servicio, Checkout, portal y reconciliación quedan bloqueados para el tenant marcado, incluso con configuración Stripe habilitada en el fixture.
- Se excluye la bienvenida automática al guardar el cliente en administración. Recuperación mantiene respuesta genérica, sin envío. Configuración/envío/reintento de correo y POST fiscal quedan bloqueados; no se inyectan transportes de correo ni clave de IA externa al tenant.
- Los registros operativos internos, PDF ficticios y avisos internos conservan su función. No se envían avisos a terceros. El ensayo de correo con transporte simulado es una prueba separada, no una excepción habilitada para este cliente.
- La contabilidad del laboratorio está en su almacenamiento aislado; no alimenta el libro manual de Finanzas global. Ese libro no se reclasifica por nombres ni se borra.
- Finanzas global usa movimientos canónicos de Stripe. Un test no vinculado deja exactamente iguales los totales/detalles; el índice solo atribuye laboratorio. Si aparece una vinculación incoherente de un test a Stripe, el componente Stripe entero informa **No disponible** y el resultado queda parcial. No se inventa cero ni se intenta separar comisiones/reembolsos no atribuibles; los datos manuales globales se conservan. Reparar ese caso requiere revisión, no conversión automática.

## Pruebas reproducibles

Node 24, desde raíz:

```sh
npm ci
node --test scripts/client-test/boundary-test.mjs
node scripts/client-test/boundary-browser.mjs
node --test scripts/finance-test.mjs scripts/mail-test.mjs
npm test
npm run build
npm run validate
npm run check:hostinger-source
```

MariaDB requiere el contenedor aislado descrito por `scripts/helpers/test-mysql.mjs`, nunca datos/credenciales productivos. En Linux:

```sh
MYSQL_TEST=true node --test scripts/client-test/boundary-test.mjs
```

Se probaron MariaDB 11.8.9 y SQLite. Las tres pruebas de separación incluyen autorización global, inmutabilidad, compatibilidad del campo ausente, tenant de control intacto, cero llamadas de integración para el test y guardado repetido sin duplicados. El caso financiero emplea un cobro sintético no nulo y duplicado del mismo ID en un stub: deduplicación y comparación exacta antes/después. La clave con prefijo live de ese caso es una cadena ficticia con transporte sustituido; no conecta a Stripe. La bienvenida de control se acepta una vez por el simulador; el guardado del test nunca llama al transporte. Todas las promesas de bienvenida de ese caso se esperan explícitamente.

Chromium 154 headless: panel global a 1440×950 y emulación 390×950, indicador de clientes reales, clasificación nueva/inalterable, ausencia del formulario de pago y aviso en el workspace; sin excepciones JavaScript ni desbordamiento del editor. No es un teléfono real ni prueba PWA instalada. El seed completo usa SQLite, no se afirma haber probado todas sus cadenas en MariaDB.

## Paso siguiente

Para crear Cliente Prueba en producción aún faltan verificar el despliegue de estos controles, acceso autenticado por un canal oficial y completar la matriz pendiente. No solicitar contraseñas por chat ni crear un cliente ordinario para eludir la marca. Los correos reales requieren, por separado, dominio verificado y destinatario autorizado; no están habilitados por este trabajo.


## Validación sobre main 194c90b

Sin cambios en autenticación, operadores, catálogo, membresías ni configuración de correo. Solo el administrador global ya autenticado puede fijar la marca durante el alta; el cliente ordinario conserva sus flujos. La prueba de bienvenida compara un cliente ordinario (un envío simulado idempotente) con un test (cero envíos), incluidos guardados repetidos.

Aprobados: 34 auditorías, standalone y 124 pruebas generales; 18 pruebas de separación/Finanzas/correo en MariaDB 11.8.9; Chromium escritorio/móvil de clasificación, Finanzas y workspace, y PWA en Linux. Build y validación correctos. No se incluye la semilla ni se crean registros durante el despliegue. Los datos ficticios solo existen dentro de fixtures temporales de prueba.
