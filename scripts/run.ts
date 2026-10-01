import manifest from '../src/content/publication-manifest.json';
import {verifyPublication} from '../src/lib/publication';
import {reviewAssets} from '../src/lib/review-assets.ts';
import {spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {auditOutput} from './audit-output.ts';
import {validateCatalog,assertPublicSelection} from '../src/lib/catalog.ts';
const [command='build',target='public']=process.argv.slice(2);
if(!['build','dev'].includes(command)||(target!=='local'&&target!=='public'))throw new Error('Invalid command/target');
const data=validateCatalog(JSON.parse(await readFile('src/content/catalog.json','utf8')));
if(target==='public')assertPublicSelection(data.episodes);
const args=['node_modules/astro/bin/astro.mjs',command];
if(command==='dev')args.push('--host','127.0.0.1');
const result=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,MANGA_BUILD_TARGET:target,ASTRO_TELEMETRY_DISABLED:'1'}});
if(result.status!==0)process.exit(result.status??1);
if(command==='build'){
 const manifestLocal=target==='local'?JSON.parse(await readFile('private/import-manifest-remake-v001.json','utf8')):null;
 const allowed=target==='local'?data.episodes.flatMap(e=>e.pages.map(p=>({path:`comics/${e.id}/${p.id}.png`,sha256:manifestLocal.assets.find((a:any)=>a.copied_file===`private/local-assets/${p.localFile}`).sha256}))):verifyPublication(data.episodes,manifest).map(a=>({path:`comics/${a.file}`,sha256:a.sha256}));
 if(target==='local')allowed.push(...reviewAssets().map(a=>({path:`review-comics/${a.episode}/${a.page}.webp`,sha256:a.sha256})));
 const report=await auditOutput(process.env.MANGA_OUT_DIR || (target==='local'?(process.env.MANGA_BASE && process.env.MANGA_BASE!=='/'?'.subpath-dist':'.local-dist'):'dist'),target,allowed);
 await mkdir('docs/qa',{recursive:true});await writeFile(`docs/qa/${target}-build-audit.json`,JSON.stringify(report,null,2));console.log('Output audit',report);
}
