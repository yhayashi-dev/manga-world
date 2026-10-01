import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyPublication} from '../src/lib/publication';
import catalog from '../src/content/catalog.json';
import current from '../src/content/publication-manifest.json';
// Synthetic in-memory approvals only. Never writes EP001 approval or release assets.
function fixture(){
 const episodes:any[]=structuredClone(catalog.episodes);
 const assets:any[]=structuredClone(current.assets.filter(a=>a.episode!=='EP001'));
 const approvals=episodes.filter(e=>e.publishRequested&&e.id!=='EP001').map(e=>({episode:e.id,approval:structuredClone(e.approval)}));
 const approval={by:'test-only-reviewer',date:'2030-01-02'};
 const ep=episodes.find(e=>e.id==='EP001');ep.publicationStatus='ready';ep.publishRequested=true;ep.approval=approval;
 ep.pages=ep.pages.map((p:any,i:number)=>({...p,publicFile:`EP001/${p.id}.webp`,publicSha256:(i+1).toString(16).repeat(64),approval}));
 for(const p of ep.pages)assets.push({episode:ep.id,page:p.id,file:p.publicFile,sha256:p.publicSha256,pngSha256:'a'.repeat(64),width:p.width,height:p.height,bytes:100,losslessVerified:true,approval});
 approvals.push({episode:ep.id,approval});
 return {episodes,manifest:{schemaVersion:2,metadata:{updatedAt:'2031-01-01T00:00:00Z'},episodeApprovals:approvals,assets}};
}
function fail(name:string,mutate:(x:ReturnType<typeof fixture>)=>void){test(name,()=>{const x=fixture();mutate(x);assert.throws(()=>verifyPublication(x.episodes,x.manifest))})}
test('B/I: EP001の別日承認とEP002/3既存日付は共存可能（テスト内のみ）',()=>{const x=fixture();assert.equal(verifyPublication(x.episodes,x.manifest).length,20)});
fail('C: episode承認なし',x=>{delete x.episodes[0].approval});
fail('D: pageとepisode日付不一致',x=>{x.episodes[0].pages[0].approval={by:'test-only-reviewer',date:'2030-01-03'}});
fail('E: assetとepisode日付不一致',x=>{x.manifest.assets[12].approval={by:'test-only-reviewer',date:'2030-01-03'}});
fail('F: 承認者不一致',x=>{x.episodes[0].pages[0].approval={by:'someone-else',date:'2030-01-02'}});
fail('G: held選択は拒否',x=>{x.episodes[0].publicationStatus='held'});
fail('H: publishRequested=falseのasset混入を拒否',x=>{x.episodes[0].publishRequested=false});
fail('J: 旧EP001 asset hashへの差替え拒否',x=>{x.manifest.assets[12].sha256='ad17169fe97c2c276ea906bb2be6882f2aacf61bdb47f6fba25cf7dea326c208'});
fail('K: 不採用P04 v001差替え拒否',x=>{x.manifest.assets[15].sha256='eff5742807c9eee5b45bc37d6cff6810a1d9e410d039e09728c7b67f21222abb'});
fail('未承認page',x=>{delete x.episodes[0].pages[0].approval});
fail('未承認asset',x=>{delete x.manifest.assets[12].approval});
fail('話別承認一覧に存在しない話',x=>{x.manifest.episodeApprovals.pop()});
fail('重複話承認',x=>{x.manifest.episodeApprovals.push(x.manifest.episodeApprovals[0])});
fail('重複asset',x=>{x.manifest.assets.push(x.manifest.assets[0])});
fail('欠けたasset',x=>{x.manifest.assets.pop()});
fail('page/assetを共に別日へ変えてepisodeだけ残す攻撃を拒否',x=>{const a={by:'test-only-reviewer',date:'2030-01-03'};x.episodes[0].pages[0].approval=a;x.manifest.assets[12].approval=a});
test('metadata日時は公開承認日と独立',()=>{const x=fixture();x.manifest.metadata.updatedAt='2040-12-31T00:00:00Z';assert.equal(verifyPublication(x.episodes,x.manifest).length,20)});
test('承認objectキー順によらずby/dateで照合',()=>{const x=fixture();x.manifest.assets[12].approval={date:'2030-01-02',by:'test-only-reviewer'};assert.equal(verifyPublication(x.episodes,x.manifest).length,20)});
