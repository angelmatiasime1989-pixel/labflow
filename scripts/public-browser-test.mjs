// Local public-page verification; no customer records or external payment calls.
import assert from 'node:assert/strict';import {createServer} from 'node:http';import {spawn} from 'node:child_process';import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {fixture} from './helpers/saas-fixture.mjs';
class Cdp{constructor(url){this.socket=new WebSocket(url);this.sequence=0;this.pending=new Map();this.errors=[];this.navigations=[];this.ready=new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',reject,{once:true});});this.socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const pending=this.pending.get(message.id);this.pending.delete(message.id);if(message.error)pending.reject(Error(message.error.message));else pending.resolve(message.result);}if(message.method==='Page.frameRequestedNavigation')this.navigations.push(message.params.url);if(message.method==='Runtime.exceptionThrown')this.errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);};}
 async call(method,params={}){await this.ready;return new Promise((resolve,reject)=>{const id=++this.sequence;this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}));});}
 async js(expression){const data=await this.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(data.exceptionDetails)throw Error(data.exceptionDetails.exception?.description||data.exceptionDetails.text);return data.result.value;}
 async until(expression,timeout=20000){const end=Date.now()+timeout;while(Date.now()<end){try{if(await this.js(expression))return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Browser timeout: '+expression+' errors: '+this.errors.join('\n'));}
 close(){this.socket.close();}}

const cleanup=[],dir=await mkdtemp(join(tmpdir(),'qubo-finance-browser-'));let f,browser,cdp;
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const r=await f.app(new Request(origin+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch{res.writeHead(500);res.end('test error');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://localhost:'+server.address().port,report='/tmp/qubo-public-browser';
try{
 f=await fixture({after:fn=>cleanup.push(fn)},{},origin);
 browser=spawn(process.env.CHROMIUM_BIN||'/usr/bin/chromium',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});let port;for(let i=0;i<150;i++){try{port=(await readFile(join(dir,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(port);const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();cdp=new Cdp(targets[0].webSocketDebuggerUrl);await cdp.call('Page.enable');await cdp.call('Runtime.enable');await cdp.call('Network.enable');await cdp.call('Network.setBlockedURLs',{urls:['https://api.stripe.com/*','https://checkout.stripe.com/*']});await mkdir(report,{recursive:true});
 async function shot(name){assert.equal(await cdp.js('document.documentElement.scrollWidth>innerWidth'),false);const image=await cdp.call('Page.captureScreenshot',{format:'png'});await writeFile(join(report,name+'.png'),Buffer.from(image.data,'base64'));}
 for(const width of [1440,390]){
 await cdp.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await cdp.call('Page.navigate',{url:origin+'/#recorrido'});
 await cdp.until(`document.querySelector('#sales-carousel-track img')?.complete&&document.querySelector('#sales-carousel-track img').naturalWidth>0`);
 await cdp.js(`document.querySelector('#recorrido').scrollIntoView()`);
 assert.ok(await cdp.js(`(()=>{const r=document.querySelector('#sales-carousel-track img').getBoundingClientRect();return r.width>250&&r.height>150&&r.top<innerHeight&&r.bottom>0})()`));
 assert.equal(await cdp.js(`getComputedStyle(document.querySelector('.sales-demo-steps li')).color`),'rgb(41, 72, 103)');
 await shot('tour-first-'+width);
 const count=await cdp.js(`document.querySelector('#sales-carousel-track').children.length`);
 for(let i=1;i<count;i++){
 await cdp.js(`moveSalesSlide(1)`);
 await cdp.until(`(()=>{const t=document.querySelector('#sales-carousel-track'),img=t.children[${i}].querySelector('img');return img.complete&&img.naturalWidth>0&&Math.abs(t.scrollLeft-t.children[${i}].offsetLeft)<3})()`);
 }
 await shot('tour-last-'+width);
 await cdp.call('Page.navigate',{url:origin+'/instalar'});
 await cdp.until(`document.querySelector('.commercial-header .commercial-logo')?.complete&&document.querySelector('.commercial-header .commercial-logo').naturalWidth>0`);
 assert.equal(await cdp.js(`document.querySelectorAll('.commercial-header').length`),1);
 assert.ok(await cdp.js(`!!document.querySelector('.footer a[href="/blog"]')&&!!document.querySelector('.footer a[href="/preguntas-frecuentes"]')`));
 assert.ok(await cdp.js(`document.querySelector('main').textContent.includes('iPhone')&&document.querySelector('main').textContent.includes('Android')&&document.querySelector('main').textContent.includes('Windows')`));
 assert.equal(await cdp.js(`document.querySelector('link[rel="manifest"]').getAttribute('href')`),'/manifest.webmanifest');
 await shot('install-'+width);
 if(width<600){await cdp.js(`document.querySelector('.commercial-mobile summary').click()`);assert.ok(await cdp.js(`document.querySelector('.commercial-mobile').open`));await shot('install-menu-'+width);await cdp.js(`document.querySelector('.commercial-mobile-nav a[href="/#membresias"]').click()`);await cdp.until(`location.pathname==='/'&&location.hash==='#membresias'`);}
 }
 assert.deepEqual(cdp.errors,[]);console.log('PASS public Chromium desktop/mobile: first and all carousel images loaded/visible, compact tour, shared install logo/header/footer, mobile menu and manifest.');
}finally{cdp?.close();browser?.kill();server.closeAllConnections();await new Promise(r=>server.close(r));for(const fn of cleanup.reverse())await fn();await rm(dir,{recursive:true,force:true,maxRetries:8,retryDelay:150});}
