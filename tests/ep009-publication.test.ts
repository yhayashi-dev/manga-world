import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../src/lib/catalog';
import {verifyPublication} from '../src/lib/publication';
const raw=JSON.parse(readFileSync('src/content/catalog.json','utf8'));
const manifest=JSON.parse(readFileSync('src/content/publication-manifest.json','utf8'));
const sourcePngHashes={P01:'0e2a6cf504adb7a8ca1da7e42197cb3409d0e8a44e26ced893526076213ba05d',P02:'9fdd180a5614fd96c3c7b5c13a0cb06fd12e7acaa5531ad8dc612fd6855eab95',P03:'3827188a0fe0f337f66828f48a713f76059fc48ca9f0eff5ebf72c5c11304088',P04:'abb0aef8977fc6a2e1d2f2c1de1444027ea9e64f4869d37c48f2ad240673ff72',P05:'4ef8da1cc48af493630574c2f033b89456d99054758c76c0a607dbe0d77dc8f9',P06:'0b431ee599b4cf266f6bf3f22f82b07c5c99e346ecdf3c98e2acd739e32fee28'};
const grant={by:'site-owner-publication-instruction',date:'2026-10-13'};
function episode(c:any){const e=c.episodes.find((e:any)=>e.id==='EP009');assert.ok(e,'EP009 publication instruction candidate must exist');return e;}
test('EP009 instruction binds exactly the six current candidate originals and release bytes',()=>{
 const c=validateCatalog(raw),e=episode(c);assert.equal(e.title,'エジプトでの危機');assert.equal(e.workId,'old-testament');assert.equal(e.slug,'009');assert.equal(e.order,9);assert.equal(e.productionStatus,'production_complete');assert.equal(e.publishRequested,true);assert.deepEqual(e.approval,grant);
 assert.deepEqual(e.pages.map((p:any)=>p.id),['P01','P02','P03','P04','P05','P06']);assert.deepEqual(readdirSync('release-assets/EP009').sort(),e.pages.map((p:any)=>p.id+'.webp'));
 const all=verifyPublication(c.episodes,manifest);assert.equal(all.length,98);assert.deepEqual([...new Set(all.map(a=>a.episode))].sort(),['ARJUNA','EP001','EP002','EP003','EP004','EP005','EP006','EP007','EP008','EP009','PHILOSOPHY-ETHICS','PHILOSOPHY-INTRO','PHILOSOPHY-KNOWLEDGE']);
 const assets=all.filter(a=>a.episode==='EP009');assert.equal(assets.length,6);for(const a of assets){assert.equal(a.pngSha256,sourcePngHashes[a.page as keyof typeof sourcePngHashes]);assert.deepEqual([a.width,a.height],a.page==='P01'?[1055,1491]:[1084,1451]);const bytes=readFileSync('release-assets/'+a.file);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.deepEqual(a.approval,grant);assert.equal(a.losslessVerified,true);}
 const s=c.sources.find(s=>s.id==='EP009')!;assert.equal(s.original,'旧約聖書 創世記12:10〜20');for(const word of ['アブラムの予想','奴隷制度','病名','十災','サライの承諾'])assert.ok(s.notes.join(' ').includes(word));assert.ok(!JSON.stringify(s).includes('未承認')&&!JSON.stringify(s).includes('/Users/'));
});
test('EP009 absent grant, page permission, native size, hash or current request fail closed',()=>{
 for(const change of ['episode','page','asset','grant','size','hash','request','missing']){const c=structuredClone(raw),m=structuredClone(manifest),e=episode(c);
  if(change==='episode')delete e.approval;if(change==='page')delete e.pages[5].approval;if(change==='asset')m.assets.find((a:any)=>a.episode==='EP009').approval.by='other';if(change==='grant')m.episodeApprovals=m.episodeApprovals.filter((a:any)=>a.episode!=='EP009');if(change==='size')e.pages[1].width=1055;if(change==='hash')e.pages[2].publicSha256='0'.repeat(64);if(change==='request')e.publishRequested=false;if(change==='missing')m.assets=m.assets.filter((a:any)=>!(a.episode==='EP009'&&a.page==='P06'));
  assert.throws(()=>verifyPublication(validateCatalog(c).episodes,m));}
});
test('EP009 held or duplicate/extra image cannot enter the public selection',()=>{
 const c=structuredClone(raw);episode(c).publicationStatus='held';assert.throws(()=>verifyPublication(validateCatalog(c).episodes,manifest));
 for(const page of ['P06','P07']){const m=structuredClone(manifest),a=structuredClone(m.assets.find((a:any)=>a.episode==='EP009'));a.page=page;a.file='EP009/'+page+'.webp';m.assets.push(a);assert.throws(()=>verifyPublication(validateCatalog(raw).episodes,m));}
});

