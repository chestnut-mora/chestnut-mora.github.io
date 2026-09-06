# 栗子森林 Chestnut Mora 官方網站

栗子森林的 Mobile First 品牌官網、萌栗作品索引與靜態商品頁。網站由 Vinext／React 建置，部署於 GitHub Pages，並由 GitHub Actions 每 30 分鐘同步 7-ELEVEN 賣貨便商品狀態。

- 正式網站：<https://chestnut-mora.github.io/>
- 商品索引：<https://chestnut-mora.github.io/products>
- Instagram：<https://www.instagram.com/chestnut_mora/>
- GitHub：<https://github.com/chestnut-mora/chestnut-mora.github.io>

## 工程師從這裡開始

1. 先讀 [`AGENTS.md`](AGENTS.md) 的不可違反規則。
2. 再讀 [`docs/README.md`](docs/README.md) 文件索引。
3. 安裝 Node.js 22，執行 `npm ci`。
4. 本機開發執行 `npm run dev`；交付前至少執行 `npm run build` 與 `npm run test:myship`。
5. 推送前先 `git fetch origin main`，確認並整合 Actions 可能自動產生的新提交，禁止 force push。

## 常用指令

```powershell
npm ci
npm run dev
npm run build
npm run lint
npm run test:myship
npm run sync:myship
npm run generate:seo
```

`npm run sync:myship` 會存取正式賣貨便並改寫商品 JSON、商品圖片、slug registry 與 sitemap；不要把它當成無副作用的查詢指令。完整流程請見 [`docs/OPERATIONS_SOP.md`](docs/OPERATIONS_SOP.md)。

## 文件地圖

| 文件 | 用途 |
| --- | --- |
| [`docs/TECHNICAL_GUIDE.md`](docs/TECHNICAL_GUIDE.md) | 技術架構、路由、元件、資料與動畫 |
| [`docs/OPERATIONS_SOP.md`](docs/OPERATIONS_SOP.md) | 開發、同步、SEO、圖片、部署 SOP |
| [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) | 已知問題、原因、復發防線與排查方式 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 已定案的產品與工程決策 |
| [`docs/HANDOFF_CHECKLIST.md`](docs/HANDOFF_CHECKLIST.md) | 工程師接手與交付檢查表 |
| [`docs/BRAND.md`](docs/BRAND.md) | 品牌語氣、色彩、字型與視覺原則 |
| [`docs/SITE_SPEC.md`](docs/SITE_SPEC.md) | 網站功能與版面規格 |
| [`docs/CONTENT.md`](docs/CONTENT.md) | 核准文案與外部連結 |
| [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) | 圖片來源、用途與核准狀態 |
