import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canRead, validateCatalog, assertPublicSelection, orderedPages, withBase, coverFor, unavailableLabel} from '../src/lib/catalog.ts';
const episode = {id:'EP001',workId:'old-testament',slug:'001',order:1,title:'はじまり',productionStatus:'completed_pilot',publicationStatus:'held',publishRequested:false,sourceId:'EP001',pages:[{id:'P01',order:1,localFile:'EP001/P01.png',width:1055,height:1491,alt:'園'}]};
test('heldはローカルのみ閲覧できる',()=>{assert.equal(canRead(episode,'local'),true);assert.equal(canRead(episode,'public'),false)});
test('heldを本番へ選択した場合は拒否',()=>assert.throws(()=>assertPublicSelection([{...episode,publishRequested:true}]),/held/));
test('readyという状態だけでは承認記録なしの素材を通さない',()=>assert.throws(()=>assertPublicSelection([{...episode,publicationStatus:'ready',publishRequested:true}]),/approval/));
test('制作中の空話はローカルでもreaderを作らない',()=>assert.equal(canRead({...episode,pages:[],productionStatus:'in_progress'},'local'),false));
test('ページは明示order順、入力は変更しない',()=>{const p=[{order:2,id:'P02'},{order:1,id:'P01'}];assert.deepEqual(orderedPages(p).map(x=>x.id),['P01','P02']);assert.equal(p[0].id,'P02')});
test('base pathは二重slashにならず保持',()=>{assert.equal(withBase('/works/','/manga/'),'/manga/works/');assert.equal(withBase('/','/'),'/')});
test('重複話IDと順序欠番と危険な画像パスは拒否',()=>{const base={collections:[{id:'story',title:'物語で読む',description:'説明'}],works:[{id:'old-testament',title:'旧約聖書',collectionIds:['story'],summary:'紹介'}],episodes:[episode],sources:[{id:'EP001',original:'創世記',ranges:[],references:[],notes:[]}]};assert.doesNotThrow(()=>validateCatalog(base));assert.throws(()=>validateCatalog({...base,episodes:[episode,episode]}));assert.throws(()=>validateCatalog({...base,episodes:[{...episode,pages:[{...episode.pages[0],order:2}]}]}));assert.throws(()=>validateCatalog({...base,episodes:[{...episode,pages:[{...episode.pages[0],localFile:'../secret.png'}]}]}))});

test('表紙は話とページの明示order順',()=>{const first={...episode,pages:[{...episode.pages[0],id:'P02',order:2},{...episode.pages[0]}]};const next={...episode,id:'EP002',order:2};const cover=coverFor([next,first],'local');assert.equal(cover.episode.id,'EP001');assert.equal(cover.page.id,'P01')});
test('未公開と制作中は別ラベル',()=>{assert.equal(unavailableLabel(episode),'公開準備中');assert.equal(unavailableLabel({...episode,productionStatus:'in_progress'}),'制作中')});
