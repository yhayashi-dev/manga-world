import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../src/lib/catalog';
import {verifyPublication} from '../src/lib/publication';
const raw=JSON.parse(readFileSync('src/content/catalog.json','utf8'));
const manifest=JSON.parse(readFileSync('src/content/publication-manifest.json','utf8'));
const adoptedPngHashes={"P01": "c863f2640e76d6ad3c1a44d6f95ccf09219ba578d90c16dff4504465c6e2bd11", "P02": "6ddbb58980fbe627b03029b0f2bc8b21403b1dcdb18ca914b37b9d7fd00e73b2", "P03": "3ca11f560a186a3a8e818fe844db5f5750e700f9c6a6a2a4fafea965608db34c", "P04": "5d4a69902e1e8f096e3de83001a71a9c95deb9df735a92dcc22eb467e1f0528a", "P05": "6357af729d5c6bc7aa60135af26d0e553ec22526e5b5f31a41a2377d49caf0ad", "P06": "915d1d53f820e5c237c34dad489aaf3886676f57d7d0cb86c54f2cc7e81f2766", "P07": "761cec6de9b136bedda88bea30fe255da131eb078c7bc4e7fac386a3565523a1", "P08": "499b1c87c8e4932527a205993dc072c59cc5fe121540c8ad8b04a2c1ced18e5a", "P09": "5496c25eee84255157fff30b5814e1054eb4ea2c240274dec873e978aaccba9f", "P10": "7ba5a40b9001390f0dbb21ef60d17535bacd041bd63160bed883ea77a3f3e3e2"};
test('ethics delegated grant covers exactly ten adopted pages and exact release bytes',()=>{
 const c=validateCatalog(raw),e=c.episodes.find(e=>e.id==='PHILOSOPHY-ETHICS')!;
 assert.equal(e.workId,'philosophy-ethics');assert.equal(e.productionStatus,'production_complete');assert.equal(e.approval?.by,'site-owner-delegated-review');assert.equal(e.approval?.date,'2026-10-11');
 assert.deepEqual(e.pages.map(p=>p.id),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));
 assert.deepEqual(readdirSync('release-assets/PHILOSOPHY-ETHICS').sort(),e.pages.map(p=>p.id+'.webp'));
 const assets=verifyPublication(c.episodes,manifest).filter(a=>a.episode===e.id);assert.equal(assets.length,10);
 for(const a of assets){assert.equal(a.pngSha256,adoptedPngHashes[a.page as keyof typeof adoptedPngHashes]);assert.deepEqual([a.width,a.height],Number(a.page.slice(1))<=8?[1086,1448]:[1024,1536]);const bytes=readFileSync('release-assets/'+a.file);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
});
test('ethics grant is required on episode, every page and manifest asset',()=>{
 for(const change of ['episode','page','asset','grant']){const c=structuredClone(raw),m=structuredClone(manifest);const e=c.episodes.find((e:any)=>e.id==='PHILOSOPHY-ETHICS');if(change==='episode')delete e.approval;if(change==='page')delete e.pages[9].approval;if(change==='asset')m.assets.find((a:any)=>a.episode===e.id&&a.page==='P10').approval.by='different-review';if(change==='grant')m.episodeApprovals=m.episodeApprovals.filter((a:any)=>a.episode!==e.id);assert.throws(()=>verifyPublication(validateCatalog(c).episodes,m));}
});
test('held ethics material and an extra candidate image cannot enter public selection',()=>{
 const c=structuredClone(raw);c.episodes.find((e:any)=>e.id==='PHILOSOPHY-ETHICS').publicationStatus='held';assert.throws(()=>verifyPublication(validateCatalog(c).episodes,manifest));
 const m=structuredClone(manifest);const a=structuredClone(m.assets.find((a:any)=>a.episode==='PHILOSOPHY-ETHICS'));a.page='P11';a.file='PHILOSOPHY-ETHICS/P11.webp';m.assets.push(a);assert.throws(()=>verifyPublication(validateCatalog(raw).episodes,m));
});
test('ethics sources distinguish imaginary conditions, actual agreement and remaining work',()=>{
 const s=validateCatalog(raw).sources.find(s=>s.id==='PHILOSOPHY-ETHICS')!;const text=JSON.stringify(s);assert.ok(text.includes('P05')&&text.includes('想像')&&text.includes('P09')&&text.includes('確認'));assert.ok(text.includes('道徳的正解の証明ではありません'));assert.ok(text.includes('片付けと責任が残り'));assert.ok(text.includes('現代日本語訳を転載した作品ではありません'));assert.ok(text.includes('原語本文の独自校訂'));assert.equal(s.references.length,10);
});
