import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=process.argv[2];if(!source)throw new Error('Pass the verified APK absolute path.');
const apk=await readFile(source);if(apk[0]!==0x50||apk[1]!==0x4b)throw new Error('Not an APK/ZIP file');
const dest='public/downloads';await mkdir(dest,{recursive:true});for(const f of await readdir(dest))if(/^(?:rooz-android|to-do-list)\.part\d+$/.test(f))await unlink(`${dest}/${f}`);
const chunkSize=16*1024*1024,parts=[];
for(let i=0;i<apk.length;i+=chunkSize){const name=`to-do-list.part${parts.length}`;await writeFile(`${dest}/${name}`,apk.subarray(i,i+chunkSize));parts.push(`/downloads/${name}`);}
const manifest={available:true,version:'1.0.0',bytes:apk.length,sha256:createHash('sha256').update(apk).digest('hex'),parts};await writeFile(`${dest}/android.json`,JSON.stringify(manifest,null,2)+'\n');console.log(manifest);
