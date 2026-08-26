# Odysseia Forum OG Service

类脑索引的独立 Open Graph 图片生成服务。项目部署在 Vercel，以 `1200×630` 逻辑布局生成
`2400×1260` 的 2× PNG；论坛 React SPA 和 `/share/...` HTML 仍由 Cloudflare Pages提供。

## 请求链

```text
Discordbot
  -> Cloudflare /share/{type}/{id}
  -> HTML 中的 og:image 指向本服务
  -> Vercel /api/og/{type}/{id}?v={updated_at}
  -> 带 OG_SERVICE_TOKEN 请求 Python 后端
  -> next/og ImageResponse 返回 PNG
```

支持路由：

```text
/api/og/threads/{id}
/api/og/authors/{id}
/api/og/booklists/{id}
/api/og/tournaments/{id}
```

赛事与书单都请求后端的 `/internal/share-metadata/booklists/{id}`，渲染类型由 URL
区分。资源不存在、Token 缺失或渲染失败时返回 `public/fallback.png`。

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

在 `.env.local` 中配置：

```text
API_BASE_URL=https://forum.shimmerday.top/v1
OG_SERVICE_TOKEN=后端只读OG服务Token
```

不要给变量添加 `NEXT_PUBLIC_` 或 `VITE_` 前缀。

## 本地批量渲染

原 Playground 的批量渲染能力保留为 `scripts/render-local.mjs`，并与线上路由共用
`lib/renderer.mjs` 中的布局：

```bash
pnpm render
```

macOS 默认使用：

```text
/System/Library/Fonts/Supplemental/Arial Unicode.ttf
```

其他环境通过 `OG_FONT_PATH` 指定 TTF、OTF 或 WOFF 字体。设置
`OG_SERVICE_TOKEN` 后，还会读取真实作者、帖子、书单和赛事 DTO。输出写入被 Git
忽略的 `output/`。

Vercel 路由不依赖本机字体，而是按当前卡片实际字符请求 Noto Sans SC 字体子集，避免把完整
中文字体打进 Function。

## 资源边界

- `public/og-assets/backgrounds/`：历史生产实验中压缩过的 7 张背景 JPG，单张约
  30–42 KB；保留并提交。
- `public/og-assets/server-logo-128.png`：卡片品牌图标；保留并提交。
- `public/fallback.png`：生成失败时使用的站点默认图；保留并提交。
- `public/og-assets/mascot-avatar-256.png`：主站看板娘头像，作者头像不可用时作为回退；保留并提交。
- `output/`：可重复生成的 PNG/SVG，当前约 119 MB；只保留在本地，不提交。

原始高分辨率 PNG 背景仍属于论坛前端设计资产，不复制到本服务。

## Vercel 部署

1. 将本目录初始化为独立 Git 仓库并推送到单独的 GitHub 仓库。
2. 在 Vercel 中导入该仓库，Framework Preset 使用 Next.js。
3. 在 Production 和 Preview 环境分别配置 `API_BASE_URL`、`OG_SERVICE_TOKEN`。
4. 部署后先访问一个 `/api/og/...` 地址，确认返回 `200` 与 `Content-Type: image/png`。
5. 默认直接使用 Vercel 分配的免费 `*.vercel.app` 域名。
6. 验证通过后，才在主前端 Cloudflare Function 中把 `og:image` 指向本服务。

Vercel 的 Domain 必须绑定到一个 Project，但不要求购买新域名。只有想把自定义域名直接交给
Vercel 托管时，才需要拥有该域名并能修改 DNS。

现有 share 链接若必须保持原域名和路径不变，不要迁移整个站点域名。继续由 Cloudflare 处理
`/share/...` HTML，只让其中的 `og:image` 指向本项目的 `*.vercel.app/api/og/...` 即可。

带稳定版本参数的 URL 会返回一年不可变缓存：

```text
https://你的项目.vercel.app/api/og/booklists/426?v=2026-08-26T00%3A00%3A00Z
```

没有 `v` 时只使用短浏览器缓存和一天 CDN 缓存，便于直接调试。

## GitHub 初始化

本目录位于父仓库忽略的 `playground/` 内，可以直接作为独立仓库，不会污染论坛前端的
Git 状态：

```bash
git init
git add .
git status
git commit -m "Initial standalone OG service"
```

创建 GitHub 仓库后，再按 GitHub 给出的 remote 命令推送。提交前确认 `.env.local`、
`output/`、`.next/` 和 `node_modules/` 没有进入暂存区。
