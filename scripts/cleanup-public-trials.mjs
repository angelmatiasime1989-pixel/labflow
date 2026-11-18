// Run from a stable operations directory with a private environment file.
// Only expiration metadata is logged; never trial content, tokens or keys.
import {existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';
import {PublicTrialStore,validateTrialLocation} from '../server/public-trial/store.mjs';
const file=validateTrialLocation(process.env.PUBLIC_TRIAL_DB,{dataDir:process.env.DATA_DIR,backupDir:process.env.BACKUP_DIR,root:fileURLToPath(new URL('../',import.meta.url))});
if(!existsSync(file))throw Error('No existe la base dedicada de pruebas; no se creará una base vacía desde mantenimiento.');
const store=new PublicTrialStore({file});try{console.log(JSON.stringify({task:'public-trial-expiry',completedAt:new Date(store.lastCleanup.at).toISOString(),removed:store.lastCleanup.removed}));}finally{store.close();}
