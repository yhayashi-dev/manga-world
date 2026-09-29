import type {APIRoute} from 'astro';
import {readFile,realpath,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {catalog,isLocal,readable} from '../../../lib/site';
export function getStaticPaths(){if(!isLocal)return [];return catalog.episodes.filter(readable).flatMap(e=>e.pages.map(p=>({params:{episode:e.id,page:p.id},props:{page:p}})))}
export const GET:APIRoute=async({props})=>{
 const p=props.page;const root=resolve(isLocal?'private/local-assets':'private/publication-assets');
 const file=resolve(root,isLocal?p.localFile:p.publicFile);
 const real=await realpath(file);if(!real.startsWith(root+sep)||(await lstat(file)).isSymbolicLink())throw new Error('Unsafe asset path');
 const b=await readFile(file);const hash=createHash('sha256').update(b).digest('hex');
 let expected=p.publicSha256;
 if(isLocal){const m=JSON.parse(await readFile('private/import-manifest.json','utf8'));expected=m.assets.find((a:any)=>a.copied_file===`private/local-assets/${p.localFile}`)?.sha256;}
 if(hash!==expected||b.readUInt32BE(16)!==p.width||b.readUInt32BE(20)!==p.height)throw new Error('Asset integrity mismatch');
 return new Response(new Uint8Array(b),{headers:{'Content-Type':'image/png'}});
};
