# 技術指引手冊

## 1. 系統概覽

| 項目 | 現況 |
| --- | --- |
| 前端 | React 19 + TypeScript |
| 框架／建置 | Vinext `1.0.0-beta.5`，使用 Next App Router 形式的目錄 |
| 樣式 | `app/globals.css` 為主要品牌與 RWD 樣式 |
| 動畫 | GSAP 主時間軸；最終萌栗互動以 AVAL 狀態契約搭配 Web Animations API 實作 |
| 匯出 | `next.config.ts` 設定 `output: 'export'`，圖片不經框架最佳化伺服器 |
| 產物 | `dist/client` |
| 正式主機 | GitHub Pages |
| 商品來源 | 7-ELEVEN 賣貨便公開商品頁 |
| 分析 | Google Analytics `G-Q1MERLHQGR` |
| Runtime | Node.js 22 以上 |

這是純靜態網站。沒有資料庫、登入、購物車或伺服器端 checkout；付款與最終庫存交由官方賣貨便，品牌互動則導向 Instagram。

## 2. 路由與資訊架構

```text
/
├── 首頁品牌 Landing Page
├── #about / #mengli / #collection / #faq 等首頁 anchor
└── products
    ├── /products                    所有萌栗集合頁
    └── /products/mori-yymmdd-nnn    靜態商品頁
```

商品頁由 `data/myship-seo.json` 的保留商品清單產生。`generateStaticParams()` 會在 build 時建立每個 slug 的靜態頁。

靜態導覽約定：

- 首頁：`/#top`
- 商品集合：`/products`
- 商品詳情：`/products/{slug}`
- 站內跨頁使用原生 `<a>`，避免目前 Vinext + GitHub Pages 組合中的 client routing 攔截問題。

## 3. 主要程式位置

| 路徑 | 責任 |
| --- | --- |
| `app/layout.tsx` | 全站 metadata、OG、GA、全域 layout |
| `app/page.tsx` | 首頁、Hero 圖片輪播、商品橫向區、FAQ 與品牌內容 |
| `app/products/page.tsx` | 「所有萌栗」集合頁 |
| `app/products/[slug]/page.tsx` | 商品靜態頁與商品 metadata |
| `components/aval-unboxing-hero.tsx` | GSAP 開箱時間軸與最終 AVAL 微互動 |
| `components/myship-product-image.tsx` | 商品圖本地優先與備援鏈 |
| `data/hero.ts` | Hero 輪播圖清單與 alt |
| `data/faq.ts` | 可見 FAQ 與 FAQPage JSON-LD 的唯一來源 |
| `data/seo.ts` | 商品 schema、metadata 文案、JSON-LD 與類別 `4550` |
| `data/myship-seo.json` | 可建立靜態頁的商品快照（自動產生） |
| `public/data/myship-products.json` | 完整同步狀態與生命週期資料（自動產生） |
| `data/product-slug-registry.json` | 永不重用的商品 identity → slug 對照 |
| `scripts/sync-myship.mjs` | 抓取、解析、生命週期合併、圖片封存、SEO 生成 |
| `scripts/myship-lifecycle.mjs` | 生命週期純邏輯 |
| `scripts/archive-myship-product-images.mjs` | 遠端商品圖封存為本地 WebP |
| `scripts/seo-assets.mjs` | SEO dataset、lastmod、slug 與 sitemap |
| `.github/workflows/*.yml` | 定時同步與 GitHub Pages 部署 |

## 4. 商品資料管線

```text
MyShip 公開頁
   ↓ 成功抓取與解析
目前 variants
   ↓ merge lifecycle（保留 last known good）
public/data/myship-products.json
   ↓ archive image / assign stable slug / build SEO snapshot
public/assets/products/{slug}.webp
data/product-slug-registry.json
data/myship-seo.json
public/sitemap.xml
   ↓ vinext build
dist/client
   ↓ GitHub Pages
正式網站
```

圖片顯示的 fallback 順序是：

1. `/assets/products/{slug}.webp`
2. 商品 JSON 的 `image`
3. `sourceImageUrl`
4. 品牌 logo placeholder

因此正常正式頁應載入 GitHub Pages 上的本地 WebP；賣貨便 URL 保留作為來源與故障備援，不是首選。

## 5. 商品生命週期

```text
available → soldout → removed → archived
```

| 狀態 | 首頁 | 商品頁 | Schema |
| --- | --- | --- | --- |
| `available` | 顯示 | 保留 | `InStock` offer |
| `soldout` | 隱藏 | 保留 | `OutOfStock` offer |
| `removed` | 隱藏 | 保留 | 不宣稱目前 offer |
| `archived` | 歷代作品用途 | 保留 | 不宣稱目前 offer |

`removed` 的條件是商品在「成功同步」結果中連續缺席滿 24 小時。網路失敗、解析失敗、異常空清單均不得推進缺席時鐘。此專案沒有自動刪除商品頁的步驟。

## 6. SEO 結構

- 首頁輸出 `Organization`、`WebSite`、`ItemList`、`FAQPage` 與現貨 `Product`。
- 商品頁輸出 `Product` 與 `BreadcrumbList`。
- 集合頁輸出 `CollectionPage`、`BreadcrumbList` 與 `ItemList`。
- 商品 schema `category` 固定為 `4550`。
- `public/sitemap.xml` 包含 `/`、`/products/` 與所有保留商品頁。
- sitemap 不輸出 `priority` 或 `changefreq`。
- `lastmod` 只在名稱、價格、狀態、圖片、連結、識別資料或 SEO revision 等 fingerprint 真正變更時更新，不會因每 30 分鐘 cron 無差異執行而全面刷新。
- 消費者可見品牌用語以「萌栗」為主；metadata、描述、alt 與 schema 自然補入大眾搜尋詞「萌粒（POP BEAN）手機鍊」。

## 7. Hero 與互動

### AVAL 開箱 Hero

- 初始只顯示封盒，動畫必須由「打開看看」按鈕觸發。
- GSAP Timeline 控制 `sealed → peel → open → card-reveal → pouch-reveal → bracelet-reveal → final`。
- 卡片盒內初始角度為 `-6deg`；袋子三層共用盒內初始角度 `-8deg`。
- 霧面袋組合以底層純白袋形、手鍊、中上層霧面袋形成視差；目前沒有啟用 pouch blur mask。
- final 交接前，GSAP 靜態手鍊與 AVAL 手鍊使用一致幾何；AVAL 圖載入完成後，在 paint 前移除 GSAP 層，避免雙重陰影閃爍。
- sealed image 使用 `priority`；其他素材在瀏覽器 idle 時預載，並在按鈕 hover、focus、click 時補強預載。
- 不使用 ScrollTrigger、scroll scrub、frame sequence 或自動播放。
- `prefers-reduced-motion` 不會自動跳到 final，也不會停用 AVAL；因為動畫本身只在使用者按鈕操作後開始。

### 原品牌 Hero 圖片輪播

- 使用 `data/hero.ts` 的核准本地形象照與 Instagram `post-03` 到 `post-30`。
- 第一次顯示採隨機起點，每 3.5 秒向左切換。
- 支援滑鼠拖曳、觸控 swipe、鍵盤方向鍵；左鍵下一張、右鍵上一張。
- 圖片 hover 放大必須被圓角 viewport clip，不得露出下一張底圖。

### 精選萌栗橫向區

- 桌面滑鼠移入後，垂直滾輪轉換為水平捲動。
- 左右邊界羽化是視覺層，捲到起點或終點也保持存在。
- 商品卡片點擊進入本地 SEO 商品頁；現貨 CTA 另開賣貨便。

## 8. 圖片策略

- 形象、Hero、details、products 核准圖使用 WebP quality 85，Instagram 輪播使用 WebP quality 90；不 resize、維持比例與 alpha。
- `docs/ASSET_MANIFEST.md` 是可使用素材清單；新增或替換圖時必須同步更新 manifest 與 alt。
- 商品圖片由同步腳本封存到 `public/assets/products`，避免正常頁面依賴遠端 CDN。
- 裝飾層使用空 alt；內容圖使用自然、具體、不堆疊關鍵字的 alt。

## 9. GitHub Actions

| Workflow | 觸發 | 工作 |
| --- | --- | --- |
| `Deploy Chestnut Mora site` | push main／手動 | npm ci → build → 上傳 `dist/client` → Pages deploy |
| `Sync MyShip products` | 每 30 分鐘／手動 | 同步商品；有變更才 commit、build、deploy |

同步 workflow job 具備 `contents: write`，因此可使用該 run 的 `GITHUB_TOKEN` 推送自動產生的資料。這個 token 只存在 Actions 執行環境，不能拿來授權本機 Git push。
