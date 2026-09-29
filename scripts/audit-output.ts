import {readdir,readFile} from 'node:fs/promises';import {join,relative,extname} from 'node:path';import {createHash} from 'node:crypto';import type {Target} from '../src/lib/catalog.ts';
export async function auditOutput(root:string,target:Target,allowed:{path:string,sha256:string}[]){
 const files:string[]=[];async function walk(dir:string){for(const d of await readdir(dir,{withFileTypes:true})){const f=join(dir,d.name);if(d.isSymbolicLink())throw new Error('No output symlink');if(d.isDirectory())await walk(f);else files.push(f)}}await walk(root);
 let images=0;const seen=new Set();
 for(const f of files){const rel=relative(root,f);const b=await readFile(f);const ext=extname(f);
  if(/\.(png|jpe?g|webp|gif|avif)$/i.test(f)){images++;const entry=allowed.find(a=>a.path===rel);if(!entry)throw new Error(`Unapproved image: ${rel}`);if(createHash('sha256').update(b).digest('hex')!==entry.sha256)throw new Error('Image hash mismatch');seen.add(rel);}
  else {if(!['.html','.css','.js','.txt','.xml'].includes(ext))throw new Error(`Unexpected output file: ${rel}`);const text=b.toString('utf8');if(/\/Users\/|PRIVATE_ASSET|source_path|CHARACTER_BIBLE|CONTINUITY_LOG|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|ghp_[A-Za-z0-9]{30}/.test(text))throw new Error(`Private information: ${rel}`);}
 }
 for(const a of allowed)if(!seen.has(a.path))throw new Error('Missing selected image');
 return {target,files:files.length,images,privateInformationFound:false};
}
