import {resolve} from 'node:path';
import {openDatabase,SqliteBucket} from './database.mjs';
import {mysqlConfigured,openMysql,MysqlBucket} from './mysql.mjs';
export async function openStorage(env=process.env){return mysqlConfigured(env)?openMysql(env):openDatabase(resolve(env.DATA_DIR||'data','cubolabs.sqlite'));}
export const storageBucket=db=>db.dialect==='mysql'?new MysqlBucket(db):new SqliteBucket(db);
