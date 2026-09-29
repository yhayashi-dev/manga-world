export function seoConfig(local:boolean,site:string|undefined,base:string){
 if(!base.startsWith('/')||base.includes('..')||base.includes('?')||base.includes('#')||base.includes('\\')||base.includes('//'))throw new Error('Invalid base');
 const path=base.endsWith('/')?base:base+'/';
 if(!site)return {indexable:false,root:undefined};
 const u=new URL(site);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw new Error('MANGA_SITE must be an HTTPS origin');
 return {indexable:!local,root:u.origin+path};
}
