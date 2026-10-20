import http from 'node:http';
const request=http.get({hostname:'127.0.0.1',port:Number(process.env.PORT||8787),path:'/_health',headers:{host:new URL(process.env.PUBLIC_ORIGIN).host},timeout:3000},response=>{response.resume();process.exitCode=response.statusCode===200?0:1;});
request.on('timeout',()=>request.destroy());request.on('error',()=>{process.exitCode=1;});
