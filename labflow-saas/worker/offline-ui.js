// Offline copies use a separate encrypted vault, never the generic response cache.
let offlineClientPromise;
function offlineClient(){return offlineClientPromise||(offlineClientPromise=import('/offline/client.js'));}
function showOfflineDocuments(){offlineClient().then(module=>module.open()).catch(()=>toast('Abre esta sección con conexión la primera vez.'));}
const renderBeforeOffline=render;
render=function(){renderBeforeOffline();if(typeof window==='undefined'||!window.QUBO_OFFLINE_ENABLED||!S?.me)return;const sidebar=document.getElementById('sidebar');if(sidebar&&!sidebar.querySelector('.qubo-offline-entry')){const button=document.createElement('button');button.className='qubo-offline-entry';button.textContent='Documentos sin conexión';button.onclick=showOfflineDocuments;sidebar.append(button);}offlineClient().then(module=>module.identityChanged({userId:S.me.id,tenantId:S.saasTenant?.id})).catch(()=>{});};
const documentPreviewBeforeOffline=documentPreview28;
documentPreview28=function(module,id){documentPreviewBeforeOffline(module,id);if(typeof window==='undefined'||!window.QUBO_OFFLINE_ENABLED)return;const frame=document.querySelector('#preview35 iframe,.document-preview28');if(frame)offlineClient().then(client=>client.opened(module,id)).catch(()=>{});};
const logoutBeforeOffline=logout;
logout=async function(){if(typeof window!=='undefined'&&window.QUBO_OFFLINE_ENABLED)await offlineClient().then(async client=>{await client.clearAll();client.closePanel();});return logoutBeforeOffline();};
function offlineReadOnly(){return typeof window!=='undefined'&&window.QUBO_OFFLINE_ENABLED&&typeof navigator!=='undefined'&&navigator.onLine===false;}
const apiBeforeOffline=api;api=async function(path,options={}){if(offlineReadOnly()&&!['GET','HEAD'].includes((options.method||'GET').toUpperCase()))throw Error('Sin conexión. Sólo puedes consultar las copias preparadas; los cambios requieren internet.');return apiBeforeOffline(path,options);};
const openFormBeforeOffline=openForm;openForm=function(...args){if(offlineReadOnly()){toast('La edición requiere internet. Consulta tus documentos disponibles sin conexión.');return;}return openFormBeforeOffline(...args);};
function offlineBanner(){if(typeof document.getElementById!=='function')return;document.getElementById('qubo-offline-banner')?.remove();if(!offlineReadOnly()||!S?.me)return;const banner=document.createElement('aside');banner.id='qubo-offline-banner';banner.setAttribute('role','status');banner.style.cssText='padding:12px 20px;background:#fff3d7;color:#071b38;border-bottom:1px solid #b18b3d';banner.textContent='Sin conexión · Sólo lectura. ';const button=document.createElement('button');button.textContent='Documentos preparados';button.onclick=showOfflineDocuments;banner.append(button);document.body.prepend(banner);}
if(typeof window!=='undefined'&&typeof window.addEventListener==='function'){window.addEventListener('offline',offlineBanner);window.addEventListener('online',offlineBanner);}
