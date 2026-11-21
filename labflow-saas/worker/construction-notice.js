// Temporary public-homepage notice. Set enabled=false or remove its build markers to retire it.
(()=>{
  const enabled=true;
  if(!enabled||location.pathname!=='/')return;
  const notice=document.getElementById('construction-notice');
  if(!notice||typeof notice.showModal!=='function')return;
  const dismissalKey='qubolabs-construction-notice-v1';
  try{if(sessionStorage.getItem(dismissalKey)==='closed')return;}catch{}
  const previousFocus=document.activeElement;
  for(const button of notice.querySelectorAll('[data-construction-close]'))button.addEventListener('click',()=>notice.close());
  notice.addEventListener('close',()=>{
    try{sessionStorage.setItem(dismissalKey,'closed');}catch{}
    if(previousFocus&&previousFocus!==document.body&&typeof previousFocus.focus==='function')previousFocus.focus();
  });
  notice.showModal();
})();
