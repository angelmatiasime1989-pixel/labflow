import mysql from 'mysql2/promise';
import {randomBytes} from 'node:crypto';
import {openStorage} from '../../server/storage.mjs';
// Never use DB_* or a production target. Tests require their own loopback-only server.
export async function openTestMysql(){
 const name='qubo_test_'+randomBytes(8).toString('hex');
 const env={DB_HOST:'127.0.0.1',DB_PORT:process.env.MYSQL_TEST_PORT||'3307',DB_USER:'qubo_test',DB_PASSWORD:'Synthetic-Integration-Only',DB_NAME:name};
 const connection=await mysql.createConnection({host:env.DB_HOST,port:Number(env.DB_PORT),user:env.DB_USER,password:env.DB_PASSWORD});
 try{await connection.query('CREATE DATABASE `'+name+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin');}finally{await connection.end();}
 const db=await openStorage(env);db.testEnv=env;return db;
}
