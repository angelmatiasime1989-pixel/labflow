// Checks configuration names and writability without logging values or opening SQLite.
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {readHostingConfig,createAppServer} from '../vps/server.mjs';
try{
 const config=readHostingConfig();const app=createAppServer(config);
 mkdirSync(config.dataDir,{recursive:true,mode:0o700});
 const probe=mkdtempSync(join(config.dataDir,'.labflow-check-'));
 try{writeFileSync(join(probe,'probe'),'ok',{mode:0o600});}finally{rmSync(probe,{recursive:true,force:true});}
 app.server.close();
 console.log('PASS: origin, administrator credentials, PORT and writable DATA_DIR. Confirm persistence with the hosting provider before using real data.');
}catch(error){console.error(error.message);process.exitCode=1;}
