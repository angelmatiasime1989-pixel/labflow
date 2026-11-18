import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['--test','scripts/landing-experience-test.mjs','scripts/saas-release-test.mjs','scripts/commercial-trial-test.mjs','scripts/offline-documents-test.mjs'],{stdio:'inherit',env:{...process.env,MYSQL_TEST:'true'}});
child.on('error',()=>{process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
