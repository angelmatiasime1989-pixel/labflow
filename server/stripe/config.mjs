import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../../worker/commercial-memberships.json',import.meta.url),'utf8'));
const terms=JSON.parse(readFileSync(new URL('../../worker/commercial-terms.json',import.meta.url),'utf8'));
export const priceCatalog=catalog.filter(p=>p.id!=='enterprise-custom').flatMap(p=>['monthly','annual'].map(cycle=>({plan:p.id,name:p.name,cycle,currency:terms.currency.toLowerCase(),amount:Math.round(p.monthly*100*(cycle==='annual'?12*(1-terms.annualDiscount):1)),interval:cycle==='annual'?'year':'month',env:`STRIPE_PRICE_${p.id.toUpperCase()}_${cycle.toUpperCase()}`})));
export function readStripeConfig(env={}){
 const prices=priceCatalog.map(p=>({...p,id:env[p.env]||''}));
 const requested=env.STRIPE_ENABLED==='true';
 const enabled=requested&&env.STRIPE_TEST_MODE==='true'&&env.NODE_ENV!=='production'&&/^sk_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY||'')&&/^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET||'')&&/^bpc_[A-Za-z0-9]+$/.test(env.STRIPE_PORTAL_CONFIGURATION||'')&&prices.every(p=>/^price_[A-Za-z0-9_]+$/.test(p.id))&&new Set(prices.map(p=>p.id)).size===8;
 return {requested,enabled,secretKey:env.STRIPE_SECRET_KEY||'',webhookSecret:env.STRIPE_WEBHOOK_SECRET||'',portalConfiguration:env.STRIPE_PORTAL_CONFIGURATION||'',prices};
}
