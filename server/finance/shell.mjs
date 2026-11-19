import {readFileSync} from 'node:fs';
// Render the same provider shell used by /admin. Finance keeps its existing
// authenticated API and its own function scope, without a second document/frame.
export function financeAdminPage(){
 const admin=readFileSync(new URL('../../worker/saas-admin.html',import.meta.url),'utf8');
 const finance=readFileSync(new URL('./page.html',import.meta.url),'utf8');
 const content=finance.match(/<main>([\s\S]*?)<\/main>/)[1];
 const script=finance.match(/<script>([\s\S]*?)<\/script>/)[1];
 const styles=readFileSync(new URL('./view.css',import.meta.url),'utf8');
 const html='<div class="finance-view">'+content+'</div>';
 return admin.replace("page=adminPageFromUrl()","page='finance'")
  .replace('</style>','\n'+styles+'</style>')
  .replace('\nstart();','\nfunction financePage(){$(\'#content\').innerHTML=head(\'Finanzas\',\'Resultado de flujo, ingresos, gastos y movimientos.\')+'+JSON.stringify(html)+';\n(function(){'+script+'})();}\nstart();');
}
