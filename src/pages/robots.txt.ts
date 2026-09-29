import type {APIRoute} from 'astro';import {seo} from '../lib/site';
export const GET:APIRoute=()=>new Response(seo.indexable?`User-agent: *\nAllow: /\nSitemap: ${seo.root}sitemap.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
