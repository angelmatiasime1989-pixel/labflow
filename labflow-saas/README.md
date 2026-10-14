# LabFlow SaaS

Independent copy of LabFlow 42 with a private operator console and isolated laboratory workspaces.

## Access

- `/admin/`: SaaS operator console, authenticated with the trusted Sites identity header. First private-site owner initializes operator ownership; another identity is denied.
- `/laboratorio/<slug>/`: client laboratory, with separate username/password authentication, scoped session cookies and files.
- New customers start empty. Reference roles, account definitions and ISO checklist are retained; operational records, files, employees and demo credentials are not copied.

## Modules

`worker/saas-entitlements.js` defines the implemented registry, dependencies and server-side permission filtering. Client module switches are checkboxes. Configuration is mandatory. Disabling a module preserves its records. Suspending a customer blocks all laboratory routes.

Future entries can be reserved in the operator catalog. They remain unassignable until matching server code and META tools are integrated. New implemented registry entries synchronize automatically with the catalog and remain opt-in for customers.

## Storage and authorization

R2 `saas/platform-v1.json` stores customers, module catalog and service audit. Tenant data and attachments are under `saas/tenants/<UUID>/`. Every laboratory request creates a scoped bucket; no global mutable tenant context is used. Tenant IDs come from the operator registry rather than client input.

The Site starts owner-private. Before exposing customer links publicly, retain the initialized operator identity and verify the Sites audience and operator membership controls. `SAAS_TEST_OPERATOR` is a local test fixture only and must not be configured in deployment.

## Build and test

```
python scripts/assemble.py
bash scripts/build.sh
node scripts/validate-artifact.mjs
node scripts/saas-test.mjs
```

The test covers operator authorization, registration, tenant isolation, module revocation, dependency closure, suspension, password resets, scoped cookies, future-module safeguards and console checkboxes.
