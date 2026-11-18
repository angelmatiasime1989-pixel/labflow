// Expected persisted layout. Validate existing tables before issuing any CREATE.
// Column order matters for legacy offline INSERT statements without column lists.
const definitions={
 objects:{columns:{key:'varbinary(1024)',value:'longblob',etag:'varchar(36)',uploaded:'bigint',metadata:'longtext'},primary:['key']},
 provider:{columns:{slot:'tinyint',id:'varchar(36)',username:'varchar(80)',name:'varchar(160)',salt:'varchar(64)',password_hash:'varchar(128)',version:'int',must_change_password:'tinyint'},primary:['slot']},
 provider_sessions:{columns:{token_hash:'varchar(64)',provider_id:'varchar(36)',version:'int',expires:'bigint'},primary:['token_hash']},
 login_attempts:{columns:{client:'varchar(64)',attempts:'int',expires:'bigint'},primary:['client']},
 offline_devices:{columns:{tenant:'varchar(64)',user_id:'varchar(64)',device:'varchar(36)',public_key:'text',label:'varchar(80)',status:'varchar(16)'},primary:['tenant','user_id','device']},
 offline_nonce:{columns:{nonce:'varchar(100)',until:'bigint'},primary:['nonce']},
 offline_sessions:{columns:{tenant:'varchar(64)',user_id:'varchar(64)',device:'varchar(36)',session_ref:'varchar(64)',documents:'longtext'},primary:['tenant','user_id','device']}
};
const mismatch=(table,detail)=>{throw Object.assign(Error('Esquema MySQL incompatible: '+table+' ('+detail+'). No se modificó el esquema existente.'),{code:'MYSQL_SCHEMA_INCOMPATIBLE'});};
export async function validateMysqlSchema(db,{allowMissing=false}={}){
 const tables=await db.prepare('SELECT TABLE_NAME name,ENGINE engine,TABLE_TYPE kind FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()').all();
 const columns=await db.prepare('SELECT TABLE_NAME table_name,COLUMN_NAME name,COLUMN_TYPE type,IS_NULLABLE nullable,COLLATION_NAME collation,ORDINAL_POSITION position FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION').all();
 const indexes=await db.prepare('SELECT TABLE_NAME table_name,INDEX_NAME name,COLUMN_NAME column_name,SEQ_IN_INDEX position,SUB_PART prefix,NON_UNIQUE non_unique FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX').all();
 for(const [name,expected] of Object.entries(definitions)){
  const table=tables.find(row=>row.name===name);
  if(!table){if(allowMissing)continue;mismatch(name,'tabla ausente');}
  if(table.engine!=='InnoDB'||table.kind!=='BASE TABLE')mismatch(name,'requiere tabla InnoDB');
  const actual=columns.filter(row=>row.table_name===name),wanted=Object.entries(expected.columns);
  if(actual.length!==wanted.length)mismatch(name,'columnas inesperadas o ausentes');
  for(let i=0;i<wanted.length;i++){
   const [column,type]=wanted[i],row=actual[i],normalized=row.type.toLowerCase().replace(/^(tinyint|int|bigint)\(\d+\)/,'$1');
   if(row.name!==column||normalized!==type||row.nullable!=='NO')mismatch(name,'columna '+column);
   const collation=name==='objects'&&column==='etag'?'ascii_bin':/^(varchar|text|longtext)/.test(type)?'utf8mb4_bin':null;
   if(row.collation!==collation)mismatch(name,'collation de '+column);
  }
  const unique=indexes.filter(row=>row.table_name===name&&Number(row.non_unique)===0);
  if(unique.length!==expected.primary.length||unique.some((row,i)=>row.name!=='PRIMARY'||row.column_name!==expected.primary[i]||row.prefix!==null))mismatch(name,'clave primaria o índices únicos');
 }
}
