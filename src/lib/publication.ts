import {z} from 'zod';
import type {Episode} from './catalog';
import {assertPublicSelection} from './catalog';
const approval = z.object({by:z.string().trim().min(1), date:z.iso.date()}).strict();
const episodeId = z.string().regex(/^(?:EP[0-9]+|ARJUNA|PHILOSOPHY-INTRO|PHILOSOPHY-KNOWLEDGE)$/);
const asset = z.object({
 episode:episodeId, page:z.string().regex(/^P[0-9]+$/),
 file:z.string().regex(/^(?:EP[0-9]+|ARJUNA|PHILOSOPHY-INTRO|PHILOSOPHY-KNOWLEDGE)\/P[0-9]+\.webp$/),
 sha256:z.string().regex(/^[a-f0-9]{64}$/), pngSha256:z.string().regex(/^[a-f0-9]{64}$/),
 width:z.number().int().positive(), height:z.number().int().positive(), bytes:z.number().int().positive(),
 losslessVerified:z.literal(true), approval
}).strict();
// Metadata records maintenance, never permission to publish an episode.
const schema = z.object({
 schemaVersion:z.literal(2),
 metadata:z.object({createdAt:z.iso.datetime({offset:true}).optional(),updatedAt:z.iso.datetime({offset:true})}).strict(),
 episodeApprovals:z.array(z.object({episode:episodeId,approval}).strict()),
 assets:z.array(asset)
}).strict();
type Approval = z.infer<typeof approval>;
function sameApproval(a:Approval|undefined,b:Approval):boolean {
 return !!a && a.by===b.by && a.date===b.date;
}
export function verifyPublication(episodes:Episode[],input:unknown){
 assertPublicSelection(episodes);
 const m=schema.parse(input);
 const selected=episodes.filter(e=>e.publishRequested);
 const grants=new Map<string,Approval>();
 for(const grant of m.episodeApprovals){
  if(grants.has(grant.episode))throw new Error('Duplicate episode approval');
  const e=selected.find(e=>e.id===grant.episode);
  if(!e || !sameApproval(e.approval,grant.approval))throw new Error('Publication approval/episode mismatch');
  grants.set(grant.episode,grant.approval);
 }
 if(grants.size!==selected.length)throw new Error('Missing episode approval');
 const keys=new Set<string>();
 for(const a of m.assets){
  const key=a.episode+'/'+a.page;
  if(keys.has(key)||a.file!==key+'.webp')throw new Error('Publication identity mismatch');
  keys.add(key);
  const e=selected.find(e=>e.id===a.episode);
  const p=e?.pages.find(p=>p.id===a.page);
  const grant=grants.get(a.episode);
  if(!e||!p||!grant||p.publicFile!==a.file||p.publicSha256!==a.sha256||p.width!==a.width||p.height!==a.height
   ||!sameApproval(e.approval,grant)||!sameApproval(p.approval,grant)||!sameApproval(a.approval,grant)){
   throw new Error('Publication approval/asset mismatch');
  }
 }
 if(selected.reduce((n,e)=>n+e.pages.length,0)!==m.assets.length)throw new Error('Missing publication assets');
 return m.assets;
}
