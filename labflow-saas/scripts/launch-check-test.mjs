import test from 'node:test';
import assert from 'node:assert/strict';
import {launchChecks} from './launch-check.mjs';
import {config} from './helpers/saas-fixture.mjs';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
test('commercial preflight fails closed, reports missing requirements and never exposes secrets',async()=>{
 const checks=await launchChecks({SAAS_ADMIN_AUTH:'SECRET-MUST-NOT-BE-LOGGED'});assert.ok(checks.some(c=>!c.ok));assert.ok(!JSON.stringify(checks).includes('SECRET-MUST-NOT-BE-LOGGED'));for(const id of ['runtime','origin','mode','entrypoint','storage','contact','privacy','recovery','monitoring','legal','security'])assert.ok(checks.some(c=>c.id===id));
});
test('synthetic launch configuration still rejects temporary storage and stale recovery drills',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'isodesk-preflight-'));t.after(()=>rm(dir,{recursive:true,force:true}));const env={PUBLIC_ORIGIN:'https://isodesk.company',DATA_DIR:dir,SAAS_ADMIN_AUTH:config,LABFLOW_ENV:'production',DATA_PERSISTENCE_CONFIRMED:'true',SALES_CONTACT_URL:'https://sales.isodesk.company',PRIVACY_POLICY_URL:'https://isodesk.company/privacy',BACKUP_VERIFIED_AT:new Date().toISOString(),BACKUP_OFFSITE_CONFIRMED:'true',MONITORING_CONFIRMED:'true',LEGAL_REVIEW_CONFIRMED:'true',SECURITY_REVIEW_CONFIRMED:'true'};let checks=await launchChecks(env);assert.equal(checks.find(c=>c.id==='storage').ok,false);assert.ok(checks.filter(c=>c.id!=='storage').every(c=>c.ok));env.BACKUP_VERIFIED_AT='2020-01-01T00:00:00Z';checks=await launchChecks(env);assert.equal(checks.find(c=>c.id==='recovery').ok,false);env.SALES_CONTACT_URL='javascript:alert(1)';env.PRIVACY_POLICY_URL='https://user:password@isodesk.company/privacy';checks=await launchChecks(env);assert.equal(checks.find(c=>c.id==='contact').ok,false);assert.equal(checks.find(c=>c.id==='privacy').ok,false);
});
