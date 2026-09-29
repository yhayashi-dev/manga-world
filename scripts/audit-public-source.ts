import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const top=['.gitignore','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','astro.config.mjs','tsconfig.json','PUBLIC_README.md','.github/workflows/pages.yml'];
const files=[...top];async function walk(dir:string){for(const e of await readdir(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isSymbolicLink())throw new Error('Public source symlink');if(e.isDirectory())await walk(f);else files.push(f)}}
for(const d of ['src','tests','release-assets'])await walk(d);
for(const f of ['run.ts','audit-output.ts','validate.ts','audit-public-source.ts','verify-production.ts'])files.push('scripts/'+f);
const findings=[];const hashes=[];for(const f of files){const b=await readFile(f);if(!f.endsWith('.webp')){const t=b.toString();if(/\/Users\/[A-Za-z0-9_-]+\/|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}/.test(t))findings.push(f)}hashes.push({file:f,sha256:createHash('sha256').update(b).digest('hex')})}
if(findings.length)throw new Error('Public source findings: '+findings.join(','));
await mkdir('docs/qa/publication',{recursive:true});await writeFile('docs/qa/publication/source-allowlist.json',JSON.stringify({files:hashes,findings,note:'Pattern scan; no exhaustive guarantee for unknown secrets. private/docs/history and original images excluded.'},null,2));console.log('Public source allowlist OK',files.length);
