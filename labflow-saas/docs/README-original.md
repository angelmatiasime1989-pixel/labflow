# cubolabs SaaS

Evolución de la copia SaaS de LabFlow: landing en `/`, acceso en `/entrar`, panel del proveedor en `/admin/` y laboratorios aislados en `/laboratorio/<slug>/`. La cuenta propietaria de Sites identifica al administrador del servicio. Los usuarios de laboratorio tienen credenciales separadas; un administrador del laboratorio no obtiene permisos del proveedor.

## Preparar y probar

```bash
python3 scripts/assemble.py
bash scripts/build.sh
node scripts/validate-artifact.mjs
node scripts/saas-test.mjs
node scripts/cubolabs-test.mjs
```

Las fuentes UI y de dominio se ensamblan en `worker/index.js`. `worker/cubolabs.css`, `worker/cubolabs-ui.js`, `worker/cubolabs-landing.html` y `worker/saas-admin.html` implementan la presentación. `worker/assets/` conserva los logos entregados. Los documentos institucionales mantienen la identidad configurada por cada laboratorio.

## Membresías y permisos

Básico contiene comercial, operación, técnica, calidad, personal, contabilidad y configuración. Medio agrega compras/almacén. Avanzado incluye todos los módulos implementados, incluido muestreo. El servidor determina las licencias; los roles y autorizaciones siguen restringiendo acciones. Los futuros módulos reservados no se habilitan hasta integrarse. Cambiar de membresía conserva los registros.

## Datos y publicación

R2 BUCKET almacena `saas/platform-v1.json` y estados/archivos/sesiones bajo `saas/tenants/<UUID>/`. Se preservan aislamiento por cliente, contraseñas hash y cookies por laboratorio. Las escrituras usan revisiones y condiciones ETag. La audiencia continúa privada; no se modificó el acceso público.

El proveedor requiere identidad confiable de Sites. Fuera de ese entorno debe sustituirse su autenticación y proveerse un almacenamiento compatible. Resend y las integraciones fiscales externas conservan sus requisitos propios; esta actualización no las configura.

## Vista de desarrollo

`npm run dev` sirve una demostración local efímera con datos en memoria y una identidad de proveedor simulada. Incluye un laboratorio ficticio y rutas `__qa-mobile`/`__qa-session` para pruebas. **No usar este servidor ni SAAS_TEST_OPERATOR en producción.** El artefacto publicado usa exclusivamente `dist/server/index.js` y el binding real BUCKET, sin las rutas de QA.

Consulta `docs/cubolabs-qa.md` para los cambios, flujos verificados y límites de la comprobación móvil.

## Canal de venta y personalización

La landing incluye módulos detallados, comparación de membresías, capturas reales y dos formularios. El proveedor recibe contacto/demo en Prospectos, con folios, consentimiento, estados y seguimiento. Antes de captar datos debe completar y confirmar Datos legales en su panel. Las rutas `/privacidad` y `/terminos` se generan con esa información y no inventan identidad ni domicilio.

Los paquetes son bases editables: las casillas por módulo permiten crear membresías personalizadas con dependencias verificadas. Los usuarios pueden editar su apodo y foto en Mi perfil sin modificar su nombre formal o permisos. El menú lateral permite contraer a iconos en escritorio.

Ejecutar también `node scripts/sales-profile-test.mjs`. Ver `docs/cubolabs-qa.md` para fuentes legales, pruebas y límites. El sitio conserva su audiencia privada; la apertura a visitantes externos requiere una decisión expresa de publicación pública.

## Auditoría funcional

Ejecutar `node scripts/audit-tests.mjs` después del ensamblado para la regresión completa. El ejecutor separa los escenarios históricos de dominio (reloj fijo y worker de laboratorio aislado) de las pruebas de rutas SaaS reales; no utiliza datos de producción. Véanse [la revisión funcional y matriz de permisos](docs/workflow-audit.md) y [los resultados de ejecución](docs/workflow-audit-results.json).
