import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../src/lib/catalog';
import {verifyPublication} from '../src/lib/publication';
const raw=JSON.parse(readFileSync('src/content/catalog.json','utf8'));
const manifest=JSON.parse(readFileSync('src/content/publication-manifest.json','utf8'));
const adoptedPngHashes={"P01": "0a81cdd807813f9c933cc85ece2d4ee5bc139aa0b803056e03751de7e5e56216", "P02": "58dbbb3ffd09fd12541cc7174ba1b683998f4a5f65083f4a7c23a64305be1902", "P03": "8130961bc92fb78e2c8354e6c24dc5a8944e08edd11d468dcd1f8cbffbf1e696", "P04": "611a8a19a8116b0847f7e2b0370c57e9fb5c29f8d42a33ff23c477ec9f377698", "P05": "09c6accef100e8935e3ddb8eeea22e06cefb30a26426521f43b630eb62c41cae", "P06": "6cea48b381429aac1a351e77853cb4ef41d5fbfcf65e37b4279155b9b3559f39"};
function ep008(c:any){const e=c.episodes.find((e:any)=>e.id==='EP008');assert.ok(e,'EP008 adopted publication must exist');return e;}
test('EP008 grant covers exactly six ordered adopted pages and exact release bytes',()=>{
 const c=validateCatalog(raw),e=ep008(c);assert.equal(e.workId,'old-testament');assert.equal(e.slug,'008');assert.equal(e.order,8);assert.equal(e.productionStatus,'production_complete');assert.deepEqual(e.approval,{by:'site-owner-delegated-review',date:'2026-10-11'});
 assert.deepEqual(e.pages.map((p:any)=>p.id),['P01','P02','P03','P04','P05','P06']);assert.deepEqual(readdirSync('release-assets/EP008').sort(),e.pages.map((p:any)=>p.id+'.webp'));
 const assets=verifyPublication(c.episodes,manifest).filter(a=>a.episode==='EP008');assert.equal(assets.length,6);
 for(const a of assets){assert.equal(a.pngSha256,adoptedPngHashes[a.page as keyof typeof adoptedPngHashes]);assert.deepEqual([a.width,a.height],['P03','P04','P06'].includes(a.page)?[1055,1491]:[1054,1492]);const bytes=readFileSync('release-assets/'+a.file);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.deepEqual(a.approval,e.approval);}
});
test('EP008 missing grants, page permission, request or matching hash fail closed',()=>{
 for(const change of ['episode','page','asset','grant','hash','request','missing']){const c=structuredClone(raw),m=structuredClone(manifest),e=ep008(c);
 if(change==='episode')delete e.approval;if(change==='page')delete e.pages[5].approval;if(change==='asset')m.assets.find((a:any)=>a.episode==='EP008').approval.by='different-review';if(change==='grant')m.episodeApprovals=m.episodeApprovals.filter((a:any)=>a.episode!=='EP008');if(change==='hash')e.pages[0].publicSha256='0'.repeat(64);if(change==='request')e.publishRequested=false;if(change==='missing')m.assets=m.assets.filter((a:any)=>!(a.episode==='EP008'&&a.page==='P06'));
 assert.throws(()=>verifyPublication(validateCatalog(c).episodes,m));}
});
test('EP008 held status and extra candidate page cannot enter public selection',()=>{
 const c=structuredClone(raw);ep008(c).publicationStatus='held';assert.throws(()=>verifyPublication(validateCatalog(c).episodes,manifest));
 const m=structuredClone(manifest);ep008(raw);const a=structuredClone(m.assets.find((a:any)=>a.episode==='EP008'));a.page='P07';a.file='EP008/P07.webp';m.assets.push(a);assert.throws(()=>verifyPublication(validateCatalog(raw).episodes,m));
});
