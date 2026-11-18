import mysql from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const mysqlConfigured = (env=process.env) => ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','DB_SSL_CA'].some(k=>!!env[k]);
const schema = [
 `CREATE TABLE IF NOT EXISTS objects(\`key\` VARBINARY(1024) PRIMARY KEY,value LONGBLOB NOT NULL,etag VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,uploaded BIGINT NOT NULL,metadata LONGTEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS provider(slot TINYINT PRIMARY KEY,id VARCHAR(36) NOT NULL,username VARCHAR(80) NOT NULL,name VARCHAR(160) NOT NULL,salt VARCHAR(64) NOT NULL,password_hash VARCHAR(128) NOT NULL,version INT NOT NULL,must_change_password TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS provider_sessions(token_hash VARCHAR(64) PRIMARY KEY,provider_id VARCHAR(36) NOT NULL,version INT NOT NULL,expires BIGINT NOT NULL,INDEX(expires)) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS login_attempts(client VARCHAR(64) PRIMARY KEY,attempts INT NOT NULL,expires BIGINT NOT NULL,INDEX(expires)) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS offline_devices(tenant VARCHAR(64) NOT NULL,user_id VARCHAR(64) NOT NULL,device VARCHAR(36) NOT NULL,public_key TEXT NOT NULL,label VARCHAR(80) NOT NULL,status VARCHAR(16) NOT NULL,PRIMARY KEY(tenant,user_id,device)) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS offline_nonce(nonce VARCHAR(100) PRIMARY KEY,until BIGINT NOT NULL,INDEX(until)) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`,
 `CREATE TABLE IF NOT EXISTS offline_sessions(tenant VARCHAR(64) NOT NULL,user_id VARCHAR(64) NOT NULL,device VARCHAR(36) NOT NULL,session_ref VARCHAR(64) NOT NULL,documents LONGTEXT NOT NULL,PRIMARY KEY(tenant,user_id,device)) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`
];
// SQL here is deliberately MySQL-specific; no automatic SQLite SQL translation.
export class MysqlDatabase {
 constructor(connection){this.connection=connection;this.dialect='mysql';}
 prepare(sql){const query=async args=>(await this.connection.execute(sql,args))[0];return {get:async(...args)=>(await query(args))[0],all:(...args)=>query(args),run:async(...args)=>{const r=await query(args);return {changes:r.affectedRows};}};}
 async transaction(fn){const connection=await this.connection.getConnection();try{await connection.beginTransaction();const result=await fn(new MysqlDatabase(connection));await connection.commit();return result;}catch(error){await connection.rollback();throw error;}finally{connection.release();}}
 async close(){await this.connection.end();}
}
export async function openMysql(env){
 for(const key of ['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD'])if(!env[key])throw Error('Configuración MySQL incompleta: falta '+key+'. No se usará SQLite.');
 const port=Number(env.DB_PORT||3306);if(!Number.isInteger(port)||port<1||port>65535)throw Error('DB_PORT no válido.');
 const pool=mysql.createPool({host:env.DB_HOST,port,database:env.DB_NAME,user:env.DB_USER,password:env.DB_PASSWORD,charset:'utf8mb4_bin',connectionLimit:5,waitForConnections:true,queueLimit:100,connectTimeout:10000,...(env.DB_SSL_CA?{ssl:{ca:readFileSync(env.DB_SSL_CA,'utf8'),rejectUnauthorized:true}}:{})});
 const db=new MysqlDatabase(pool);
 try{const packet=await db.prepare('SELECT @@max_allowed_packet AS size').get();if(Number(packet.size)<64*1024*1024)throw Error('MySQL requiere max_allowed_packet >= 67108864 (64 MiB) para adjuntos.');for(const sql of schema)await pool.query(sql);await db.prepare('SELECT must_change_password FROM provider LIMIT 1').all();return db;}catch(error){await pool.end();throw Error('No se pudo inicializar MySQL: '+(error.message.startsWith('MySQL requiere')?error.message:(error.code||'esquema o conexión no disponible')));}
}
const keyBytes=key=>{const bytes=Buffer.from(String(key));if(!bytes.length||bytes.length>1024)throw Error('Clave de objeto inválida (1–1024 bytes).');return bytes;};
export class MysqlBucket {
 constructor(db){this.db=db;}
 async get(key){const r=await this.db.prepare('SELECT * FROM objects WHERE `key`=?').get(keyBytes(key));if(!r)return null;const bytes=Buffer.from(r.value);return {key:String(key),etag:r.etag,httpEtag:'"'+r.etag+'"',size:bytes.length,uploaded:new Date(Number(r.uploaded)),httpMetadata:JSON.parse(r.metadata),body:new Uint8Array(bytes),json:async()=>JSON.parse(bytes.toString('utf8')),text:async()=>bytes.toString('utf8'),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}
 async head(key){const r=await this.db.prepare('SELECT etag,uploaded,metadata,OCTET_LENGTH(value) size FROM objects WHERE `key`=?').get(keyBytes(key));return r?{key:String(key),etag:r.etag,httpEtag:'"'+r.etag+'"',size:r.size,uploaded:new Date(Number(r.uploaded)),httpMetadata:JSON.parse(r.metadata)}:null;}
 async put(key,value,options={}){
  const bytes=typeof value==='string'?Buffer.from(value):value instanceof ArrayBuffer?Buffer.from(value):ArrayBuffer.isView(value)?Buffer.from(value.buffer,value.byteOffset,value.byteLength):Buffer.from(await new Response(value).arrayBuffer());
  if(bytes.length>50*1024*1024)throw Error('Objeto demasiado grande (máximo 50 MiB).');
  const k=keyBytes(key),etag=randomUUID(),uploaded=Date.now(),metadata=JSON.stringify(options.httpMetadata||{}),condition=options.onlyIf||{};
  if(condition.etagMatches&&condition.etagDoesNotMatch==='*')return null;
  if(condition.etagMatches){const r=await this.db.prepare('UPDATE objects SET value=?,etag=?,uploaded=?,metadata=? WHERE `key`=? AND etag=?').run(bytes,etag,uploaded,metadata,k,condition.etagMatches);if(!r.changes)return null;}
  else if(condition.etagDoesNotMatch==='*'){try{await this.db.prepare('INSERT INTO objects(`key`,value,etag,uploaded,metadata) VALUES(?,?,?,?,?)').run(k,bytes,etag,uploaded,metadata);}catch(error){if(error.code==='ER_DUP_ENTRY')return null;throw error;}}
  else await this.db.prepare('INSERT INTO objects(`key`,value,etag,uploaded,metadata) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value),etag=VALUES(etag),uploaded=VALUES(uploaded),metadata=VALUES(metadata)').run(k,bytes,etag,uploaded,metadata);
  return {key:String(key),etag,httpEtag:'"'+etag+'"',size:bytes.length,uploaded:new Date(uploaded)};
 }
 async delete(key){const keys=Array.isArray(key)?key:[key];await this.db.transaction(async tx=>{for(const k of keys)await tx.prepare('DELETE FROM objects WHERE `key`=?').run(keyBytes(k));});}
 async list(options={}){const prefix=Buffer.from(String(options.prefix||'')),last=options.cursor?Buffer.from(options.cursor,'base64url'):Buffer.alloc(0),limit=Math.max(1,Math.min(1000,Math.floor(Number(options.limit)||1000)));const rows=await this.db.prepare(`SELECT \`key\`,etag,OCTET_LENGTH(value) size,uploaded FROM objects WHERE LEFT(\`key\`,?)=? AND \`key\`>? ORDER BY \`key\` LIMIT ${limit+1}`).all(prefix.length,prefix,last);const truncated=rows.length>limit,objects=rows.slice(0,limit).map(r=>({...r,key:r.key.toString('utf8'),uploaded:new Date(Number(r.uploaded))}));return {objects,truncated,cursor:truncated?Buffer.from(objects.at(-1).key).toString('base64url'):undefined,delimitedPrefixes:[]};}
}
