import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCatalog,canRead,coverFor} from '../src/lib/catalog.ts';
import {verifyPublication} from '../src/lib/publication.ts';
const catalog=validateCatalog(JSON.parse(readFileSync('src/content/catalog.json','utf8')));
test('新版EP001は8頁を承認済み公開候補として読め、既存公開12枚を維持',()=>{
 const ep=catalog.episodes.find(e=>e.id==='EP001')!;
 assert.equal(ep.pages.length,8);assert.equal(ep.productionStatus,'production_complete');assert.ok(['ready','published'].includes(ep.publicationStatus));assert.equal(ep.publishRequested,true);
 assert.deepEqual(ep.pages.map(p=>p.id),Array.from({length:8},(_,i)=>`P${String(i+1).padStart(2,'0')}`));
 assert.ok(ep.pages.every(p=>p.localFile.startsWith('EP001-REMAKE-V001/')));
 assert.equal(canRead(ep,'local'),true);assert.equal(canRead(ep,'public'),true);
 assert.equal(coverFor(catalog.episodes,'local')?.episode.id,'EP001');assert.equal(coverFor(catalog.episodes,'public')?.episode.id,'EP001');
 const assets=verifyPublication(catalog.episodes,JSON.parse(readFileSync('src/content/publication-manifest.json','utf8')));assert.equal(assets.length,20);assert.equal(assets.filter(a=>a.episode==='EP001').length,8);
});
