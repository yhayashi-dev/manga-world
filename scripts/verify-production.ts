import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {resolve,join,relative} from 'node:path';
import {validateCatalog} from '../src/lib/catalog';import {verifyPublication} from '../src/lib/publication';import {seoConfig} from '../src/lib/seo';
const root=resolve('dist');const data=validateCatalog(JSON.parse(await readFile('src/content/catalog.json','utf8')));const assets=verifyPublication(data.episodes,JSON.parse(await readFile('src/content/publication-manifest.json','utf8')));
const seo=seoConfig(false,process.env.MANGA_SITE,process.env.MANGA_BASE||'/');assert.ok(seo.indexable&&seo.root,'Real release URL required');const base=new URL(seo.root!).pathname;const origin=new URL(seo.root!).origin;
const files:string[]=[];async function walk(d:string){for(const f of await readdir(d,{withFileTypes:true})){assert.equal(f.isSymbolicLink(),false);if(f.isDirectory())await walk(join(d,f.name));else files.push(join(d,f.name))}}await walk(root);
const imageFiles=files.filter(f=>/\.(png|jpe?g|webp|gif|avif)$/.test(f));assert.equal(imageFiles.length,assets.length);assert.equal(assets.length,63);assert.deepEqual([...new Set(assets.map(a=>a.episode))].sort(),['ARJUNA','EP001','EP002','EP003','EP004','EP005','PHILOSOPHY-INTRO','PHILOSOPHY-KNOWLEDGE']);
for(const a of assets){const b=await readFile(join(root,'comics',a.file));assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256)}
const htmlFiles=files.filter(f=>f.endsWith('.html'));let links=0;
for(const file of htmlFiles){const rel=relative(root,file);const text=await readFile(file,'utf8');assert.ok(!/\/Users\/|PRIVATE_ASSET|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9]{30,}/.test(text));assert.ok(!/class="preview-band"/.test(text));
 const canonical=text.match(/<link rel="canonical" href="([^"]+)"/);
 if(rel==='404.html'){assert.ok(text.includes('noindex, nofollow'));assert.equal(canonical,null)}else{assert.ok(text.includes('index, follow'));const path=rel==='index.html'?'':rel.replace(/index\.html$/,'');assert.equal(canonical?.[1],seo.root+path)}
 for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g)){let u;try{u=new URL(m[1],seo.root+rel.replace(/index\.html$/,''))}catch{continue}if(u.origin!==origin)continue;if(u.href==='https://yhayashi-dev.github.io/kurashi-seido-portal/')continue;assert.ok(u.pathname.startsWith(base));let target=join(root,decodeURIComponent(u.pathname.slice(base.length)));if(u.pathname.endsWith('/'))target=join(target,'index.html');assert.ok(files.includes(target),'Missing link '+u.pathname);if(u.hash&&target.endsWith('.html')){const targetText=await readFile(target,'utf8');assert.ok(targetText.includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'))}links++;}
 assert.ok(!rel.includes('episodes/006/'));
}
for(const id of ['001','002','003','004','005']){const s=await readFile(join(root,`works/old-testament/episodes/${id}/index.html`),'utf8');assert.deepEqual([...s.matchAll(/data-page-id="(P[0-9]+)"/g)].map(m=>m[1]),Array.from({length:id==='001'?8:id==='004'?7:6},(_,i)=>`P${String(i+1).padStart(2,'0')}`));}
const arjuna=await readFile(join(root,'works/arjuna/episodes/001/index.html'),'utf8');assert.deepEqual([...arjuna.matchAll(/data-page-id="(P[0-9]+)"/g)].map(m=>m[1]),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));assert.ok(arjuna.includes('左から右'));assert.ok(arjuna.includes('その後戦闘参加'));
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');assert.ok(!sitemap.includes('/006/'));for(const m of sitemap.matchAll(/<loc>(.*?)<\/loc>/g))assert.ok(m[1].startsWith(seo.root!));
const robots=await readFile(join(root,'robots.txt'),'utf8');assert.ok(robots.includes('Allow: /')&&robots.includes('Sitemap: '+seo.root+'sitemap.xml'));assert.ok(!files.some(f=>/EP006|review-comics|\.png$/.test(relative(root,f))));
console.log(JSON.stringify({passed:true,html:htmlFiles.length,images:assets.length,links,site:seo.root,EP001Included:true,EP004Included:true,ARJUNAIncluded:true,EP005Included:true,EP006Excluded:true,hashes:true,seo:true}));

const philosophy=await readFile(join(root,'works/philosophy-intro/episodes/001/index.html'),'utf8');assert.deepEqual([...philosophy.matchAll(/data-page-id="(P[0-9]+)"/g)].map(m=>m[1]),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));assert.ok(philosophy.includes('右から左')&&philosophy.includes('#page-10'));

const knowledge=await readFile(join(root,'works/philosophy-knowledge/episodes/001/index.html'),'utf8');assert.deepEqual([...knowledge.matchAll(/data-page-id="(P[0-9]+)"/g)].map(m=>m[1]),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));assert.ok(knowledge.includes('右から左')&&knowledge.includes('#page-10'));
