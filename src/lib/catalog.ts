import {z} from 'zod';
const id=z.string().regex(/^[a-zA-Z0-9-]+$/);
const localFile=z.string().regex(/^[A-Z0-9-]+\/P[0-9]+\.png$/);
const approval=z.object({by:z.string().min(1),date:z.iso.date()});
const pageSchema=z.object({id,order:z.number().int().positive(),localFile,width:z.number().int().positive(),height:z.number().int().positive(),alt:z.string().min(1),publicFile:z.string().regex(/^[A-Z0-9-]+\/P[0-9]+\.webp$/).optional(),publicSha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),approval:approval.optional()});
const episodeSchema=z.object({id,workId:id,slug:id,order:z.number().int().positive(),title:z.string().min(1),description:z.string().optional(),arc:z.string().optional(),productionStatus:z.enum(['in_progress','completed_pilot','production_complete']),publicationStatus:z.enum(['held','ready','published']),publishRequested:z.boolean(),approval:approval.optional(),sourceId:id,pages:z.array(pageSchema)});
const schema=z.object({collections:z.array(z.object({id,title:z.string(),description:z.string(),future:z.array(z.string()).optional()})),works:z.array(z.object({id,title:z.string(),collectionIds:z.array(id).min(1),summary:z.string(),description:z.string().optional(),topics:z.array(z.string()).optional()})),episodes:z.array(episodeSchema),sources:z.array(z.object({id,original:z.string(),ranges:z.array(z.object({locator:z.string(),event:z.string()})),references:z.array(z.object({title:z.string(),url:z.url(),checked:z.string()})),notes:z.array(z.string()),textNote:z.string().optional()}))});
export type Catalog=z.infer<typeof schema>;
export type Episode=Catalog['episodes'][number];
export type Page=Episode['pages'][number];
export type Target='local'|'public';
function unique(values:string[],label:string){if(new Set(values).size!==values.length)throw new Error(`Duplicate ${label}`)}
export function validateCatalog(input:unknown):Catalog {
 const data=schema.parse(input);
 for(const key of ['collections','works','episodes','sources'] as const) unique(data[key].map(x=>x.id),key);
 for(const work of data.works){if(work.collectionIds.some(id=>!data.collections.some(c=>c.id===id)))throw new Error('Unknown collection'); const eps=data.episodes.filter(e=>e.workId===work.id);unique(eps.map(e=>String(e.order)),'episode order');unique(eps.map(e=>e.slug),'episode slug');}
 for(const ep of data.episodes){
  if(!data.works.some(w=>w.id===ep.workId)||!data.sources.some(s=>s.id===ep.sourceId))throw new Error('Unknown work/source');
  unique(ep.pages.map(p=>p.id),'page id');unique(ep.pages.map(p=>p.localFile),'page file');
  orderedPages(ep.pages).forEach((p,i)=>{if(p.order!==i+1||p.id!==`P${String(i+1).padStart(2,'0')}`)throw new Error('Page order must be contiguous')});
  if(ep.productionStatus!=='in_progress'&&!ep.pages.length)throw new Error('Completed episode needs pages');
 }
 return data;
}
export function assertPublicSelection(episodes:Episode[]):void {
 for(const e of episodes.filter(e=>e.publishRequested)) {
  if(e.publicationStatus==='held')throw new Error(`${e.id}: held material cannot enter public build`);
  if(!e.approval||!e.pages.length||e.pages.some(p=>!p.approval||!p.publicFile||!p.publicSha256))throw new Error(`${e.id}: approval and separate public assets required`);
 }
}
export function canRead(e:Pick<Episode,'pages'|'publicationStatus'|'publishRequested'|'productionStatus'>,target:Target):boolean {
 return e.pages.length>0 && (target==='local'||(e.publishRequested&&e.publicationStatus!=='held'));
}
export function orderedPages<T extends {order:number}>(pages:T[]):T[]{return [...pages].sort((a,b)=>a.order-b.order)}
export function withBase(path:string,base='/'):string {return `${base.replace(/\/$/,'')}/${path.replace(/^\//,'')}`;}

export function coverFor(episodes:Episode[],target:Target){const episode=orderedPages(episodes).find(e=>canRead(e,target));return episode?{episode,page:orderedPages(episode.pages)[0]}:undefined;}
export function unavailableLabel(e:Pick<Episode,'productionStatus'>){return e.productionStatus==='in_progress'?'制作中':'公開準備中';}
