# Finanzas del administrador global

Ruta `/admin/finanzas`, accesible desde **/admin → Finanzas** en escritorio y móvil. Vistas: Resultado mensual, Ingresos, Gastos y Movimientos. No es la pantalla «Mi membresía» del administrador de un laboratorio. API privada: `GET/POST /api/provider/finance`; usa sesión real del proveedor, exige cambio de contraseña temporal y valida origen en escrituras. No acepta identidad enviada en encabezados.

## Registros manuales

Se guardan en `saas/finance-v1.json` mediante el bucket persistente SQLite o MariaDB. Creación y corrección son escrituras condicionales por ETag; las correcciones requieren revisión y conservan historial anterior y autor. Identificador de operación evita duplicar reintentos; referencias no vacías son únicas. No hay borrado ni ejecución de pagos.

Campos: fecha efectiva local (no futura), concepto, importe positivo en centavos MXN, rubro, proyecto, referencia opcional y estado cobrado/pagado o pendiente. El mes filtra por fecha efectiva. No registrar manualmente cobros Stripe ni traspasos; referencias Stripe conocidas son rechazadas. Dos registros sin referencia que describan el mismo hecho económico no pueden reconocerse automáticamente: revisar antes de capturar. Las referencias únicas y la corrección del registro original evitan duplicaciones operativas.

Rubros de ingreso: Capacitación, Consultoría, Auditoría, Ikonos, Otros software, Otros ingresos. Gastos: Hosting y software, Operación, Viáticos, Servicios profesionales, Otros gastos.

## Resultado y comparación

`FINANCE_TIMEZONE` usa `America/Monterrey` por defecto; debe ser un nombre IANA válido. La fecha de Stripe se convierte desde `created` a esa zona; los intervalos de consulta usan fronteras locales del mes, no medianoche UTC. El selector abre el mes actual. Hasta tres años entre 2000 y el actual, doce meses cada uno, usan exactamente el mismo cálculo del detalle y los mismos filtros de rubro/proyecto.

Resultado de flujo MXN = ingresos manuales cobrados + cobros Stripe disponibles − reembolsos disponibles − comisiones − gastos manuales pagados. Pendientes, sandbox, depósitos y traspasos no se suman. No es saldo bancario ni utilidad fiscal; IVA incluido no implica que todo sea utilidad. El gráfico y tabla distinguen cero sin movimientos, futuro sin dato y parcial por Stripe no disponible. Una cifra desconocida no se representa como cero; se muestra por separado el subtotal manual.

Stripe disponible significa movimientos del saldo con `status=available`; pendientes se listan pero no cuentan hasta estar disponibles. Por ello un reporte histórico puede actualizarse cuando se liberen fondos. Cobros `charge/payment`, devoluciones `refund/payment_refund` y cargos independientes `stripe_fee/stripe_fx_fee/tax_fee` usan importes canónicos. No se suma el neto y luego se restan comisiones por segunda vez. Ajustes no clasificados marcan el mes como parcial y requieren conciliación. No pretende sustituir la contabilidad fiscal ni un estado bancario.

La fuente Stripe se clasifica en rubro «Membresías Qubo Labs», proyecto «Qubo Labs». La atribución a laboratorio solo se muestra si el cliente del origen expandido coincide con la vinculación guardada; de otro modo se indica no atribuible. Los filtros de rubro y proyecto aplican a los cálculos y a las tablas; depósitos siguen separados por mes, porque no son ingresos de un proyecto.

## Consulta Stripe, independiente de cobros

Desactivada por defecto: `STRIPE_FINANCE_ENABLED=false`. Para ensayar con credencial segura de sandbox usar `STRIPE_FINANCE_MODE=test` y clave test existente en `STRIPE_SECRET_KEY`; nunca en cliente o Git. Producción requiere configuración explícita `STRIPE_FINANCE_ENABLED=true`, `STRIPE_FINANCE_MODE=live` y clave live con permisos de lectura suficientes. Este módulo no cambia permisos ni los activa por sí mismo. Una clave de modo distinto, errores, falta de permisos, paginación incompleta o respuesta inconsistente producen «No disponible». Sandbox se identifica en Movimientos y jamás se incluye en Resultado mensual.

Solo realiza GET a `/v1/balance_transactions` (expande `data.source`) y `/v1/payouts`, con versión `2026-10-28.endive`. Permisos mínimos a validar en la clave restringida: lectura de transacciones de saldo, lectura de depósitos/payouts y lectura de los orígenes de pago/reembolso que se expanden. No necesita permisos de escritura. Si la expansión está denegada, la consulta falla explícitamente; no ampliar permisos automáticamente. No envía datos de tarjeta ni de destino bancario al navegador. La configuración no habilita Checkout: su bloqueo live permanece independiente.

Se consulta paginación completa hasta 100 páginas de 100; alcanzar ese límite marca no disponible, nunca devuelve un total truncado. Depósitos se consultan por `arrival_date`, con monto y estado originales (paid/pending/failed/canceled). No se deducen de los cobros. La interfaz agrupa movimientos por moneda; Resultado mensual solo MXN.

Referencias oficiales: [transacciones de saldo](https://docs.stripe.com/api/balance_transactions/object), [depósitos](https://docs.stripe.com/api/payouts/list).

## Pruebas

`node --test scripts/finance-test.mjs`; repetir con `MYSQL_TEST=true MYSQL_TEST_PORT=3308` para servidor aislado local. `npm run test:finance-browser` verifica Chromium escritorio y móvil, uno/tres años, barras positivas/negativas, detalle por teclado/clic, registro y corrección, estados parciales y ausencia de desbordamiento de página. Todos los datos, claves y respuestas son sintéticos; no son pruebas contra cuentas Stripe reales. `financeTransport` y `financeClock` son dependencias de código de las pruebas, no variables habilitables desde HTTP.
