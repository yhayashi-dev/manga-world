import { defineConfig } from 'astro/config';
const local = process.env.MANGA_BUILD_TARGET === 'local';
export default defineConfig({
 output: 'static', base: process.env.MANGA_BASE || '/', trailingSlash: 'always',
 site: process.env.MANGA_SITE || undefined,
 outDir: process.env.MANGA_OUT_DIR || (local ? (process.env.MANGA_BASE && process.env.MANGA_BASE !== '/' ? './.subpath-dist' : './.local-dist') : './dist'), publicDir: './static',
 server: {host: '127.0.0.1', port: 4321}, devToolbar: {enabled: false},
 vite: {define: {'import.meta.env.MANGA_LOCAL': JSON.stringify(local), 'import.meta.env.MANGA_SITE': JSON.stringify(process.env.MANGA_SITE || '')}}
});
