// Only build-produced public HTML can enter the fixed analytics page allowlist.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = process.env.MANGA_OUT_DIR || 'dist';
const configFile = "static/analytics-config.js";
const source = readFileSync(configFile, 'utf8');
const match = source.match(/^window\.SuzumeAnalyticsConfig = ([\s\S]*);\s*$/);
if (!match) throw Error('Invalid analytics configuration');
const config = JSON.parse(match[1]);
const walk = (dir) => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : [join(dir,e.name)]);
config.pages = {};
for (const file of walk(root).filter(f => f.endsWith('/index.html')).sort()) {
  const rel = relative(root, file).replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!title || /<|>/.test(title)) throw Error('Missing safe fixed title: '+rel);
  config.pages[config.basePath + rel] = title.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}
if (!Object.keys(config.pages).length) throw Error('No verified public routes');
const output = 'window.SuzumeAnalyticsConfig = '+JSON.stringify(config, null, 2)+';\n';
writeFileSync(join(root, 'analytics-config.js'), output);
console.log('Analytics fixed public routes:', Object.keys(config.pages).length);
