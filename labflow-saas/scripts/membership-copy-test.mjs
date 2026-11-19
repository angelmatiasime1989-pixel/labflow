import test from 'node:test';import assert from 'node:assert/strict';import {fixture} from './helpers/saas-fixture.mjs';import {renderMemberships} from './render-memberships.mjs';
test('standard plans inherit tools; card highlights describe actual additions and Enterprise exception',async t=>{
 const f=await fixture(t),ids=['silver','gold','platinum','diamond','enterprise-custom'],plans=ids.map(id=>f.platform.packages.find(p=>p.id===id));
 for(let i=1;i<plans.length;i++)assert.deepEqual(plans[i-1].tools.filter(tool=>!plans[i].tools.includes(tool)),[],ids[i]);
 assert.deepEqual(plans[2].tools.filter(tool=>!plans[1].tools.includes(tool)).sort(),['assetAssignments','movements']);assert.ok(plans[3].tools.includes('financeDashboard'));assert.ok(!plans[2].tools.includes('financeDashboard'));assert.deepEqual(plans[4].tools.filter(tool=>!plans[3].tools.includes(tool)),[]);
 const html=renderMemberships();for(const name of ['Silver','Gold','Platinum','Diamond'])assert.ok(html.includes('Incluye todo lo de '+name+', más:'));
 const cards=[...html.matchAll(/<article class="membership-card[^]*?<\/article>/g)].map(m=>m[0]);assert.equal(cards.length,5);assert.doesNotMatch(cards[2],/Cuentas por cobrar|Compras y proveedores/);assert.match(cards[2],/Entradas y salidas de almacén/);assert.match(cards[4],/Sin módulos estándar adicionales automáticos/);assert.match(cards[4],/Solicitar cotización/);for(const card of cards.slice(0,4))assert.match(card,/membership-purchase/);
});
