import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
export function openDatabase(path){
 const file=resolve(path);mkdirSync(dirname(file),{recursive:true,mode:0o700});
 const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');chmodSync(file,0o600);
 db.exec(`CREATE TABLE IF NOT EXISTS objects(key TEXT PRIMARY KEY,value BLOB NOT NULL,etag TEXT NOT NULL,uploaded INTEGER NOT NULL,metadata TEXT NOT NULL DEFAULT '{}');
 CREATE TABLE IF NOT EXISTS provider(slot INTEGER PRIMARY KEY CHECK(slot=1),id TEXT NOT NULL,username TEXT NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL,version INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS provider_sessions(token_hash TEXT PRIMARY KEY,provider_id TEXT NOT NULL,version INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS login_attempts(client TEXT PRIMARY KEY,attempts INTEGER NOT NULL,expires INTEGER NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(provider)').all().some(column=>column.name==='must_change_password'))db.exec('ALTER TABLE provider ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
 return db;
}
export class SqliteBucket{
 constructor(db){this.db=db;}
 async get(key){const r=this.db.prepare('SELECT * FROM objects WHERE key=?').get(String(key));if(!r)return null;const bytes=Buffer.from(r.value);return{key:String(key),etag:r.etag,httpEtag:'"'+r.etag+'"',size:bytes.length,uploaded:new Date(r.uploaded),httpMetadata:JSON.parse(r.metadata),body:new Uint8Array(bytes),json:async()=>JSON.parse(bytes.toString('utf8')),text:async()=>bytes.toString('utf8'),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}
 async head(key){const r=await this.get(key);if(!r)return null;const{body,json,text,arrayBuffer,...meta}=r;return meta;}
 async put(key,value,options={}){
  const bytes=typeof value==='string'?Buffer.from(value):value instanceof ArrayBuffer?Buffer.from(value):ArrayBuffer.isView(value)?Buffer.from(value.buffer,value.byteOffset,value.byteLength):Buffer.from(await new Response(value).arrayBuffer());
  const etag=randomUUID(),timestamp=Date.now(),metadata=JSON.stringify(options.httpMetadata||{});this.db.exec('BEGIN IMMEDIATE');
  try{const old=this.db.prepare('SELECT etag FROM objects WHERE key=?').get(String(key)),condition=options.onlyIf||{};
   if(condition.etagMatches&&old?.etag!==condition.etagMatches||condition.etagDoesNotMatch==='*'&&old){this.db.exec('ROLLBACK');return null;}
   this.db.prepare('INSERT INTO objects(key,value,etag,uploaded,metadata) VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,etag=excluded.etag,uploaded=excluded.uploaded,metadata=excluded.metadata').run(String(key),bytes,etag,timestamp,metadata);this.db.exec('COMMIT');return{key:String(key),etag,httpEtag:'"'+etag+'"',size:bytes.length,uploaded:new Date(timestamp)};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 async delete(key){const keys=Array.isArray(key)?key:[key];this.db.exec('BEGIN IMMEDIATE');try{for(const k of keys)this.db.prepare('DELETE FROM objects WHERE key=?').run(String(k));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 async list(options={}){const prefix=String(options.prefix||''),last=options.cursor?Buffer.from(options.cursor,'base64url').toString('utf8'):'',limit=Math.max(1,Math.min(1000,Number(options.limit)||1000));const rows=this.db.prepare('SELECT key,etag,length(value) size,uploaded FROM objects WHERE substr(key,1,?)=? AND key>? ORDER BY key LIMIT ?').all(prefix.length,prefix,last,limit+1),truncated=rows.length>limit,objects=rows.slice(0,limit).map(r=>({...r,uploaded:new Date(r.uploaded)}));return{objects,truncated,cursor:truncated?Buffer.from(objects.at(-1).key).toString('base64url'):undefined,delimitedPrefixes:[]};}
}
export async function backupDatabase(db,destination){await backup(db,resolve(destination));chmodSync(resolve(destination),0o600);}
