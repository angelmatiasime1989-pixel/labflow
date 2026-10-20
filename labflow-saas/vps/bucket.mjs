import {DatabaseSync, backup} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

// R2-compatible object storage. Each conditional write is one SQLite transaction.
export class SqliteBucket {
 constructor(path){
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  this.db=new DatabaseSync(path);
  this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS objects (key TEXT PRIMARY KEY, bytes BLOB NOT NULL, etag TEXT NOT NULL, uploaded INTEGER NOT NULL)');
 }
 metadata(row){return row?{key:row.key,size:row.size??row.bytes.length,etag:row.etag,httpEtag:'"'+row.etag+'"',uploaded:new Date(row.uploaded)}:null;}
 async get(key){
  const row=this.db.prepare('SELECT * FROM objects WHERE key=?').get(String(key));if(!row)return null;
  const response=new Response(row.bytes);
  return {...this.metadata(row),body:response.body,json:()=>response.json(),arrayBuffer:()=>response.arrayBuffer(),text:()=>response.text()};
 }
 async head(key){return this.metadata(this.db.prepare('SELECT key,length(bytes) AS size,etag,uploaded FROM objects WHERE key=?').get(String(key)));}
 async put(key,value,options={}){
  const bytes=Buffer.from(await new Response(value).arrayBuffer());
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const old=this.db.prepare('SELECT etag FROM objects WHERE key=?').get(String(key));const condition=options.onlyIf;
   if(condition&&(condition.etagMatches!==undefined&&old?.etag!==condition.etagMatches||condition.etagDoesNotMatch!==undefined&&(condition.etagDoesNotMatch==='*'?!!old:old?.etag===condition.etagDoesNotMatch))){this.db.exec('ROLLBACK');return null;}
   const etag=randomUUID(),uploaded=Date.now();
   this.db.prepare('INSERT INTO objects VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET bytes=excluded.bytes,etag=excluded.etag,uploaded=excluded.uploaded').run(String(key),bytes,etag,uploaded);
   this.db.exec('COMMIT');return {key:String(key),size:bytes.length,etag,httpEtag:'"'+etag+'"',uploaded:new Date(uploaded)};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async delete(keys){
  this.db.exec('BEGIN IMMEDIATE');try{for(const key of Array.isArray(keys)?keys:[keys])this.db.prepare('DELETE FROM objects WHERE key=?').run(String(key));this.db.exec('COMMIT');}catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async list({prefix='',cursor,limit=1000}={}){
  if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('Invalid list limit');
  let after='';if(cursor){try{after=Buffer.from(cursor,'base64url').toString('utf8');}catch{throw Error('Invalid cursor');}}
  const rows=this.db.prepare('SELECT key,length(bytes) AS size,etag,uploaded FROM objects WHERE substr(key,1,length(?))=? AND key>? ORDER BY key LIMIT ?').all(prefix,prefix,after,limit+1);
  const truncated=rows.length>limit,objects=rows.slice(0,limit).map(row=>this.metadata(row));
  return {objects,truncated,...(truncated?{cursor:Buffer.from(objects.at(-1).key).toString('base64url')}:{})};
 }
 check(){return this.db.prepare('SELECT 1 AS ok').get().ok===1;}
 async snapshot(destination){await backup(this.db,destination);}
 close(){this.db.close();}
}
