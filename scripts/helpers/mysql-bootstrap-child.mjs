// Test-only process: force isolation and gate INSERT to reproduce two empty reads.
import mysql from 'mysql2/promise';
import {MysqlDatabase} from '../../server/mysql.mjs';
const isolation=process.env.QA_ISOLATION;
if(!['READ COMMITTED','REPEATABLE READ'].includes(isolation))throw Error('Invalid test isolation');
const createPool=mysql.createPool;
mysql.createPool=options=>{const pool=createPool({...options,connectionLimit:1});pool.on('connection',connection=>connection.query('SET SESSION TRANSACTION ISOLATION LEVEL '+isolation));return pool;};
const prepare=MysqlDatabase.prototype.prepare;
MysqlDatabase.prototype.prepare=function(sql){const statement=prepare.call(this,sql);if(sql.startsWith('INSERT INTO provider(')){const run=statement.run;statement.run=async(...args)=>{process.send({ready:true});await new Promise(resolve=>process.once('message',resolve));return run(...args);};}return statement;};
await import('../../server/index.mjs');
