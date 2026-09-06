# 栗子森林網站工程規則

本檔是未來工程師與程式代理的第一入口。修改前依序讀取：

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/BRAND.md`
4. `docs/SITE_SPEC.md`
5. `docs/CONTENT.md`
6. `docs/ASSET_MANIFEST.md`
7. 與工作內容相關的 SOP／決策／已知問題

若文件與目前程式不一致，先查 Git 歷史並更新文件；不要默默以猜測覆蓋資料。

## 不可違反的防回歸規則

- 正式倉庫只使用 `chestnut-mora/chestnut-mora.github.io` 的 `main`，公開根網址是 `https://chestnut-mora.github.io/`。
- 這是 Vinext 的靜態匯出網站。站內跨頁連結一律用原生 `<a>`，不要改回 `next/link`。
- 首頁使用 `/#top`，商品集合使用 `/products`，商品頁使用 `/products/{slug}`。`/products` 不加尾斜線。
- 賣貨便 Actions 可能在工作期間推進 `origin/main`。提交與推送前必須先 fetch/rebase；禁止 force push。
- 不直接編輯自動產生的 `data/myship-seo.json`、`public/data/myship-products.json`、`public/sitemap.xml` 或商品 slug；應修改同步／SEO 腳本後重新生成。
- 商品 slug 一旦分配不可重用；`data/product-slug-registry.json` 必須納入提交。
- 賣貨便連線或解析失敗不可以被當成商品下架。只有連續 24 小時的成功同步都找不到商品，才可進入 `removed`。
- 商品頁不自動刪除。`soldout`、`removed`、`archived` 都保留可索引頁面。
- 商品圖優先使用本地 `/assets/products/{slug}.webp`，遠端賣貨便網址只做來源紀錄與載入失敗備援。
- FAQ 可見內容與 FAQPage JSON-LD 必須共同引用 `data/faq.ts`，不可維護兩份文案。
- Hero 開箱只由按鈕觸發，不自動播放；不要重新加入 reduced-motion 直接跳到 final 或停用最終互動的邏輯。
- 開箱主時間軸使用 GSAP；不要加入 ScrollTrigger scrub、輪播、frame sequence 或捲動劫持。
- 首屏只把 `sealed-box` 設為高優先；其餘 AVAL 素材使用 idle／hover／focus／click 預載。
- 網站圖像只用 `docs/ASSET_MANIFEST.md` 已核准的本地素材。不要熱連 Instagram，也不要自行生成商品或形象圖片。
- 保留 Mobile First、鍵盤焦點、語意 HTML、合理 alt、44px 以上觸控區與無水平頁面溢出。

## 變更最低驗證

```powershell
npm run build
npm run test:myship
git diff --check
```

連結或路由變更還要檢查產物中的 `/`、`/products`、至少一個 `/products/{slug}`。同步與部署細節見 `docs/OPERATIONS_SOP.md`。
