# 漫画でひらく世界

物語と学びの漫画サイト。Astro / TypeScript の静的サイトです。

公開用ソースと明示承認されたロスレスWebPだけを管理します。制作原版、ローカル検証画像、内部監査資料は含みません。

Node.js 22.12以上、pnpm。`pnpm install --frozen-lockfile` → `pnpm validate` → `pnpm test` → `pnpm check` → `pnpm build`。

公開URL確定後に `MANGA_SITE`（HTTPS origin）、`MANGA_BASE`（`/repo/` または `/`）を設定します。未設定の候補ビルドはnoindexを保持し、架空canonical/sitemapを出しません。ローカル検証ビルドは常にnoindexです。

GitHub Pages向けの公開workflowを用意しています。`Verified Pages release` の手動実行で検証済みdistだけを配信します。EP001新版8ページ、EP002/EP003各6ページ、EP004「虹の契約」7ページと、人物入門「アルジュナって何者？」制作版v002の10ページを公開対象とします。承認者・承認日はschema v2で話別に管理します。

本番設定：`MANGA_SITE=https://yhayashi-dev.github.io`、`MANGA_BASE=/manga-world/`。`pnpm verify:production` は実URLを用いたSEO・内部リンク・公開画像37枚のhash・held除外を確認します。

公開サイト：https://yhayashi-dev.github.io/manga-world/
