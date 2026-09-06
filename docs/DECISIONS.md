# 已定案決策紀錄

本檔保存「為什麼現在這樣做」。除非需求明確改變，不要在重構時順手推翻。

## D-001 品牌詞與搜尋詞分工

- 消費者前台與情感語言使用品牌專稱「萌栗」。
- metadata、商品描述、alt 與 schema 自然加入通用搜尋詞「萌粒（POP BEAN）手機鍊」。
- 不做關鍵字堆疊；句子先自然、再兼顧搜尋理解。

## D-002 使用正版泡泡瑪特角色的表述

已核准文案可說「正版的泡泡瑪特萌粒（POP BEAN）IP 角色」與「正版泡泡瑪特角色」。不要擴大成官方合作、授權經銷、聯名或代理關係。

## D-003 網站不是 checkout

官網負責品牌理解、作品瀏覽、SEO 與導流。現貨最終庫存、規格選擇與付款在 7-ELEVEN 賣貨便；詢問與品牌互動在 Instagram。

## D-004 建立 `/products` 與永久商品頁

產品集合不是只為 SEO 隱藏使用，首頁「所有萌栗」提供可見入口。集合頁同時展示目前萌栗與絕版萌栗；商品頁即使售出、removed 或 archived 仍保留，形成歷代作品庫與穩定 crawl path。

## D-005 商品 slug 永不重用

格式為 `mori-yymmdd-nnn`，identity 對照保存在 `data/product-slug-registry.json`。商品下架不釋放 slug，避免 Google 舊網址指到另一個商品。

## D-006 24 小時缺席保留政策

商品只有在連續 24 小時的「成功同步結果」都缺席，才成為 `removed`。賣貨便連線、解析或異常資料失敗不計時，且 removed 不刪頁。

## D-007 sitemap 採準確 lastmod

不輸出 Google 忽略的 `priority`／`changefreq`。只有商品名稱、價格、庫存狀態、圖片、主要內容、結構化資料或關鍵連結真的變更時更新 lastmod，不因 cron 執行本身更新。

## D-008 商品 schema 類別固定 `4550`

`data/seo.ts` 的 `PRODUCT_SCHEMA_CATEGORY` 是唯一程式來源。修改類別時需同步 SEO revision 與文件。

## D-009 本地商品圖優先

同步時封存賣貨便圖為 WebP，網站先讀 GitHub Pages 本地圖；遠端網址僅作來源與 fallback。這降低外站變動、CORS、失效與載入速度風險。

## D-010 靜態跨頁連結使用原生 `<a>`

Vinext beta + static export + GitHub Pages 曾發生 `next/link` 點擊被攔截卻無法導覽。跨頁固定用原生 `<a>`；首頁 anchor 也維持簡單 hash 導覽。

## D-011 開箱動畫技術邊界

- 主編舞：GSAP Timeline。
- 響應式 relocation：只有必要時才用 GSAP Flip。
- 最終手鍊：AVAL 透明 alpha 微互動契約，目前由 Web Animations API 呈現。
- 不用 ScrollTrigger scrub、主 Hero scroll control、carousel/slideshow、frame sequence。
- 手動按鈕觸發，不自動執行。

## D-012 reduced-motion 的處理

不再因 reduced-motion 直接跳 final 或禁用 AVAL。理由是主動畫預設靜止，只有使用者主動按下「打開看看」才播放。其他裝飾性 transition 仍可遵循 reduced-motion。

## D-013 首屏載入優先序

`sealed-box` 是首屏 LCP 候選，設為高優先；peeled、open、card、pouch、bracelet 在首頁可見後 idle preload，並於按鈕 hover／focus／click 保險載入，避免拖慢首次載入又保留點擊後流暢度。

## D-014 圖片來源與壓縮

網頁形象照使用使用者提供或明確核准的本地 IG 圖片，不自行產生替代形象圖。一般站內形象圖 WebP 85，IG 輪播 WebP 90，不 resize、保留比例與 alpha。AVAL 開箱資產依 `ASSET_MANIFEST.md` 的個別核准來源管理。

## D-015 FAQ 單一來源

可見 FAQ 與 SEO `FAQPage` 都從 `data/faq.ts` 建立，防止畫面與 Google 讀到不同答案。
