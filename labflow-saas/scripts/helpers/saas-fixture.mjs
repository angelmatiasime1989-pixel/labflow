import worker from '../../worker/index.js';
import {credentials} from '../admin-credentials.mjs';
export class Bucket {
 constructor(){this.data=new Map();this.n=0;}
 async get(k){const x=this.data.get(k);return x?{etag:x.etag,json:async()=>JSON.parse(x.bytes.toString()),arrayBuffer:async()=>x.bytes.buffer.slice(x.bytes.byteOffset,x.bytes.byteOffset+x.bytes.byteLength)}:null;}
 async put(k,v,opt={}){const old=this.data.get(k);if(opt.onlyIf?.etagMatches&&old?.etag!==opt.onlyIf.etagMatches||opt.onlyIf?.etagDoesNotMatch==='*'&&old)return null;this.data.set(k,{bytes:Buffer.from(v),etag:String(++this.n)});return {etag:String(this.n)};}
 async delete(k){this.data.delete(k);}
}
export const password='Independent-Administrator-123!';
export const config=JSON.stringify(await credentials('operator',password));
export function fixture(){
 const env={BUCKET:new Bucket(),SAAS_ADMIN_AUTH:config};
 async function request(path,{body,cookie='',headers={},method=body?'POST':'GET',base='https://test.example'}={}){return worker.fetch(new Request(base+path,{method,headers:{origin:base,'content-type':'application/json',cookie,...headers},...(body?{body:JSON.stringify(body)}:{})}),env);}
 async function login(){const r=await request('/api/saas/login',{body:{username:'operator',password}});if(r.status!==200)throw Error(await r.text());return r.headers.get('set-cookie').split(';')[0];}
 return {env,request,login};
}
