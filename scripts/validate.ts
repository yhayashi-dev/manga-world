import {readFile} from 'node:fs/promises';
import {validateCatalog,assertPublicSelection} from '../src/lib/catalog.ts';
const data=validateCatalog(JSON.parse(await readFile('src/content/catalog.json','utf8')));
assertPublicSelection(data.episodes);
const {verifyPublication}=await import('../src/lib/publication');
verifyPublication(data.episodes,JSON.parse(await readFile('src/content/publication-manifest.json','utf8')));
console.log(`Data OK: ${data.collections.length} entrances, ${data.works.length} work, ${data.episodes.length} episodes; held excluded`);
