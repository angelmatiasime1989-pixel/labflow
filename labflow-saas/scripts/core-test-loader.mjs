// Legacy domain scenarios exercise the laboratory worker, independently of the SaaS gateway.
// This loader is used only by the test runner; the published export remains saasGateway.
export async function load(url,context,nextLoad){
 const result=await nextLoad(url,context);
 if(url.endsWith('/worker/index.js')||url.startsWith('data:text/javascript;base64,')){
  const source=String(result.source);
  if(source.includes('export default saasGateway;'))return {...result,source:source.replace('export default saasGateway;','export default labflowApp;')};
 }
 return result;
}
