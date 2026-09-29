import type {APIRoute} from 'astro';
import {readFile,realpath,lstat} from 'node:fs/promises';import {resolve,sep} from 'node:path';import {createHash} from 'node:crypto';
import {publicAssets,isLocal} from '../../../lib/site';
export function getStaticPaths(){return isLocal?[]:publicAssets.map(a=>({params:{episode:a.episode,page:a.page},props:{asset:a}}))}
export const GET:APIRoute=async({props})=>{const a=props.asset;const root=resolve('release-assets');const file=resolve(root,a.file);const real=await realpath(file);if(!real.startsWith(root+sep)||(await lstat(file)).isSymbolicLink())throw new Error('Unsafe publication asset');const b=await readFile(file);if(createHash('sha256').update(b).digest('hex')!==a.sha256||b.length!==a.bytes||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw new Error('Publication integrity mismatch');return new Response(new Uint8Array(b),{headers:{'Content-Type':'image/webp'}})};
