import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import catalog from '../src/content/catalog.json';
import manifest from '../src/content/publication-manifest.json';
import {verifyPublication} from '../src/lib/publication';
test('Arjuna independently publishes ten ordered v002 assets with its own dated approval',()=>{
 const assets=verifyPublication(catalog.episodes as any,manifest).filter(a=>a.episode==='ARJUNA');const e=catalog.episodes.find(e=>e.id==='ARJUNA')!;
 assert.equal(e.workId,'arjuna');assert.equal(e.arc,'人物入門');assert.equal(e.pages.length,10);assert.equal(assets.length,10);assert.deepEqual(e.approval,{by:'site-owner',date:'2026-10-03'});assert.equal(e.publishRequested,true);assert.ok(['ready','published'].includes(e.publicationStatus));assert.deepEqual(e.pages.map(p=>p.id),Array.from({length:10},(_,i)=>`P${String(i+1).padStart(2,'0')}`));assert.deepEqual(readdirSync('release-assets/ARJUNA').sort(),e.pages.map(p=>p.id+'.webp'));
 for(const a of assets){assert.equal(createHash('sha256').update(readFileSync('release-assets/'+a.file)).digest('hex'),a.sha256);assert.deepEqual(a.approval,e.approval);assert.equal(a.width,1086);assert.equal(a.height,1448)}
 assert.equal(assets[7].pngSha256,'4db3a358270c13d382491b94adae9f2fd916697e20966821347f6a3cbc308c98');assert.equal(assets[8].pngSha256,'ca36735a3f0c8ee8a2abd304915e525577e224240bec3250e647afae1e01acee');assert.equal(assets[9].pngSha256,'db459174333c4b3925eeeccc031295b6ca7cb9408fc7645ea78168d20f45f312');
});
test('Arjuna rejects held status, missing grant, cross-work identity, stale hash and mismatched approval',()=>{
 for(const fault of ['held','grant','identity','hash','date']){const c:any=structuredClone(catalog),m:any=structuredClone(manifest);const e=c.episodes.find((e:any)=>e.id==='ARJUNA');if(fault==='held')e.publicationStatus='held';if(fault==='grant')m.episodeApprovals=m.episodeApprovals.filter((a:any)=>a.episode!=='ARJUNA');if(fault==='identity')m.assets.find((a:any)=>a.episode==='ARJUNA').file='EP004/P01.webp';if(fault==='hash')e.pages[7].publicSha256='0'.repeat(64);if(fault==='date')e.pages[0].approval.date='2026-09-29';assert.throws(()=>verifyPublication(c.episodes,m));}
});
