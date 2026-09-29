import {z} from 'zod';
import type {Episode} from './catalog';
import {assertPublicSelection} from './catalog';
const approval=z.object({by:z.string().min(1),date:z.iso.date()});
const schema=z.object({version:z.literal(1),approved:z.literal(true),approval,assets:z.array(z.object({episode:z.string().regex(/^EP[0-9]+$/),page:z.string().regex(/^P[0-9]+$/),file:z.string().regex(/^EP[0-9]+\/P[0-9]+\.webp$/),sha256:z.string().regex(/^[a-f0-9]{64}$/),pngSha256:z.string().regex(/^[a-f0-9]{64}$/),width:z.number().int().positive(),height:z.number().int().positive(),bytes:z.number().int().positive(),losslessVerified:z.literal(true),approval}))});
export function verifyPublication(episodes:Episode[],input:unknown){
 assertPublicSelection(episodes);const m=schema.parse(input);const selected=episodes.filter(e=>e.publishRequested);const keys=new Set<string>();
 for(const a of m.assets){const key=a.episode+'/'+a.page;if(keys.has(key)||a.file!==key+'.webp')throw new Error('Publication identity mismatch');keys.add(key);
 const e=selected.find(e=>e.id===a.episode);const p=e?.pages.find(p=>p.id===a.page);
 if(!e||!p||p.publicFile!==a.file||p.publicSha256!==a.sha256||p.width!==a.width||p.height!==a.height||JSON.stringify(p.approval)!==JSON.stringify(a.approval)||JSON.stringify(e.approval)!==JSON.stringify(m.approval))throw new Error('Publication approval/asset mismatch');}
 if(selected.reduce((n,e)=>n+e.pages.length,0)!==m.assets.length)throw new Error('Missing publication assets');return m.assets;
}
