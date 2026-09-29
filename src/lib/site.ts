import input from '../content/catalog.json';
import publicationManifest from '../content/publication-manifest.json';
import {verifyPublication} from './publication';
import {seoConfig} from './seo';
import {validateCatalog,canRead,withBase,coverFor,type Episode} from './catalog';
export const catalog=validateCatalog(input);
export const isLocal=import.meta.env.MANGA_LOCAL;
export const target=isLocal?'local':'public';
export const publicAssets=verifyPublication(catalog.episodes,publicationManifest);
export const seo=seoConfig(isLocal,import.meta.env.MANGA_SITE,import.meta.env.BASE_URL);
export const href=(path:string)=>withBase(path,import.meta.env.BASE_URL);
export const workPath=(id:string)=>`/works/${id}/`;
export const episodePath=(e:Episode)=>`${workPath(e.workId)}episodes/${e.slug}/`;
export const readable=(e:Episode)=>canRead(e,target);
export const episodesFor=(id:string)=>catalog.episodes.filter(e=>e.workId===id).sort((a,b)=>a.order-b.order);
export const originalPageUrl=(e:Episode,p:{id:string})=>href(`/comics/${e.id}/${p.id}.png`);

export const coverForWork=(id:string)=>coverFor(episodesFor(id),target);

export const pageUrl=(e:Episode,p:{id:string})=>isLocal?href(`/review-comics/${e.id}/${p.id}.webp`):href(`/comics/${e.id}/${p.id}.webp`);
