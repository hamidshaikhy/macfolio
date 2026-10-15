import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/model.test.ts','tests/db.test.ts','tests/api.test.ts'],outdir:'.test-build',bundle:true,platform:'node',format:'esm',packages:'external',define:{'import.meta.env':'{}'},logLevel:'warning'});
const result=spawnSync(process.execPath,['--test','.test-build/model.test.js','.test-build/db.test.js','.test-build/api.test.js'],{stdio:'inherit'});process.exit(result.status??1);
