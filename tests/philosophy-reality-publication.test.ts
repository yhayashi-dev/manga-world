import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../src/lib/catalog';
import {verifyPublication} from '../src/lib/publication';
const raw=JSON.parse(readFileSync('src/content/catalog.json','utf8'));
const manifest=JSON.parse(readFileSync('src/content/publication-manifest.json','utf8'));
test('reality release has exactly the ten adopted pages and per-page grants',()=>{
 const c=validateCatalog(raw),e=c.episodes.find(x=>x.id==='PHILOSOPHY-REALITY');assert.ok(e);assert.equal(e.workId,'philosophy-reality');assert.equal(e.approval?.date,'2026-10-18');assert.equal(e.approval?.by,'site-owner');assert.deepEqual(e.pages.map(x=>x.id),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));
 const a=verifyPublication(c.episodes,manifest).filter(x=>x.episode===e.id);assert.equal(a.length,10);assert.deepEqual(readdirSync('release-assets/PHILOSOPHY-REALITY').sort(),e.pages.map(x=>x.id+'.webp'));
 for(const x of a){assert.deepEqual([x.width,x.height],[1086,1448]);assert.equal(createHash('sha256').update(readFileSync('release-assets/'+x.file)).digest('hex'),x.sha256);assert.match(x.pngSha256!,/^[a-f0-9]{64}$/);}
});
test('reality missing approval and unselected eleventh page fail closed',()=>{
 for(const change of ['episode','page','extra']){const c=structuredClone(raw),m=structuredClone(manifest),e=c.episodes.find((x:any)=>x.id==='PHILOSOPHY-REALITY');assert.ok(e);if(change==='episode')delete e.approval;if(change==='page')delete e.pages[9].approval;if(change==='extra'){const a=structuredClone(m.assets.find((x:any)=>x.episode===e.id));a.page='P11';a.file='PHILOSOPHY-REALITY/P11.webp';m.assets.push(a);}assert.throws(()=>verifyPublication(validateCatalog(c).episodes,m));}
});
test('reality source page distinguishes dream, suspension and everyday action',()=>{
 const s=validateCatalog(raw).sources.find(x=>x.id==='PHILOSOPHY-REALITY');assert.ok(s);assert.equal(s.references.length,2);const text=JSON.stringify(s);for(const word of ['第一省察','判断保留','不存在','第六省察','創作','676字'])assert.ok(text.includes(word),word);assert.ok(!text.includes('/Users/'));assert.equal(validateCatalog(raw).works.find(x=>x.id==='philosophy-reality')?.collectionIds.includes('philosophy'),true);
});
