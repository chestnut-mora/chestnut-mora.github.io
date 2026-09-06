# 維運與部署 SOP

## SOP 1：開始任何工作

1. 確認目錄與 remote。

   ```powershell
   git status -sb
   git remote -v
   ```

2. 取得遠端最新狀態。賣貨便 Action 會自動 commit，因此即使昨天已同步，今天仍要重新 fetch。

   ```powershell
   git fetch origin main
   git rebase origin/main
   ```

3. 確認沒有覆蓋使用者未提交變更；若工作樹不是乾淨狀態，先辨識來源再處理。
4. 讀 `AGENTS.md` 與相關文件。
5. 使用 Node.js 22，首次或 lockfile 改變時執行 `npm ci`。

## SOP 2：本機開發與驗證

```powershell
npm run dev
```

交付前最低驗證：

```powershell
npm run build
npm run test:myship
git diff --check
```

涉及路由時另外確認：

- 首頁可前往 `/products`。
- `/products` 的 logo、首頁 breadcrumb、回首頁按鈕都前往 `/#top`。
- 商品頁可回 `/products` 與 `/#top`。
- 產物有首頁、商品集合與商品 slug 頁。
- 程式中沒有 `next/link` 重新出現在 `app/page.tsx`、`app/products/**`。

## SOP 3：手動同步賣貨便

此操作會連線正式賣貨便並改寫檔案，先確認網路正常與 working tree 狀態。

```powershell
npm run sync:myship
npm run test:myship
npm run build
```

同步後檢查：

```powershell
git status --short
git diff -- public/data/myship-products.json
git diff -- data/myship-seo.json
git diff -- data/product-slug-registry.json
git diff -- public/sitemap.xml
```

判讀原則：

- 抓取失敗不得產生全商品 removed。
- 只有現貨商品出現在首頁精選萌栗。
- 無庫存 variant 不應顯示為可購買。
- 新 identity 可新增 slug；既有 identity 不得換 slug，舊 slug 不得分配給別人。
- 商品有真正 SEO 變更才更新該商品 `lastmod`。
- 每個本地商品 WebP 應能對上 slug。

## SOP 4：只重建 SEO 與 sitemap

當修改 `data/seo-revision.json`、SEO 生成邏輯或保留商品資料後：

```powershell
npm run generate:seo
npm run build
```

不要手工大量修改 generated JSON 或 sitemap。若文案模板改變但商品 fingerprint 未改，應同步更新 SEO revision，讓正確頁面 lastmod 反映主要內容變更。

## SOP 5：新增／替換圖片

1. 確認圖片是使用者提供、官方 IG 本地抓取或已核准素材。
2. 寫入 `public/assets` 的適當子目錄，盡量維持穩定檔名。
3. 一般形象圖轉 WebP quality 85；IG 輪播 quality 90；Resize OFF；保留比例與 alpha。
4. 更新 `docs/ASSET_MANIFEST.md`。
5. 更新 `data/hero.ts` 或實際引用處的尺寸與 alt。
6. build，並於 360／390／430px、768px、1280px 檢查裁切與溢出。

不要把遠端 Instagram URL 放入 `<img src>`。賣貨便商品圖只有在本地封存圖失敗時才允許 runtime fallback。

## SOP 6：修改 FAQ／SEO 文案

- FAQ 只改 `data/faq.ts`，首頁與 JSON-LD 會共同更新。
- 全站 title／description／OG 改 `app/layout.tsx`。
- 商品 description、schema 與狀態文字改 `data/seo.ts`。
- 商品頁 title 模板改 `app/products/[slug]/page.tsx`。
- 集合頁 metadata 改 `app/products/page.tsx`。
- 品牌核准文案同步更新 `docs/CONTENT.md`，重大決策補到 `docs/DECISIONS.md`。

修改後在 build 產物抽查可見文案、`application/ld+json`、canonical 與 sitemap；避免把「萌粒」硬塞進每個句子，品牌前台仍以「萌栗」為主。

## SOP 7：修改開箱動畫

1. 先讀 `components/aval-unboxing-hero.tsx`、`data/aval.ts` 與對應 CSS。
2. 不改變「按鈕才播放」原則。
3. 保持 sealed 首屏優先載入，其餘 idle／互動預載。
4. 調整 GSAP timeline 時逐段檢查 sealed、peel、open、card、pouch、bracelet、final。
5. static bracelet → AVAL 交接必須保持相同位置、比例與陰影，且兩層不可同時可見。
6. 不加入 scroll scrub、carousel 或 frame sequence。
7. 重新播放至少兩次，檢查重播是否殘留上一輪狀態。

## SOP 8：提交與推送

1. 驗證通過後再次 fetch，因同步 Action 可能剛提交新資料。

   ```powershell
   git fetch origin main
   git rebase origin/main
   ```

2. 檢視變更範圍，提交清楚訊息。

   ```powershell
   git status --short
   git diff --stat
   git add <明確檔案>
   git commit -m "Describe the change"
   git push origin main
   ```

3. 不使用 `git push --force`。
4. 推送後查兩個 workflow：一般 push 應觸發 Pages deploy；同步資料變更可能由 MyShip workflow 自己 build/deploy。

### Windows `git-remote-https.exe` 崩潰

如果出現「記憶體不能為 read」：

1. 先更新 Git for Windows 與 Git Credential Manager。
2. 執行 `gh auth login`，確認登入 `chestnut-mora`。
3. 執行 `gh auth setup-git`，再重試 push。
4. 可測試單次使用 OpenSSL／HTTP 1.1，避免有問題的 Windows TLS 路徑。
5. 若仍失敗，可由已登入的 `gh auth token` 建立「只存在該程序記憶體」的 Basic Authorization header 完成單次 push；絕不可把 token 寫入 remote URL、腳本、文件、shell history 或 Git。

本機不能直接使用 Actions 的 `GITHUB_TOKEN`；它只在 workflow run 中由 GitHub 臨時簽發。永久解法是修復本機 Git/GCM 或改用正常 SSH key，不是複製 Actions token。

## SOP 9：部署後確認

1. GitHub Actions 的 `Deploy Chestnut Mora site` 必須成功。
2. 記錄部署 commit SHA，不要只看瀏覽器舊分頁。
3. 使用無 cache URL，例如 `https://chestnut-mora.github.io/?v=<short-sha>#top`。
4. 確認首頁、`/products`、一個現貨頁與一個絕版頁。
5. 確認 `/sitemap.xml` 可讀，且 lastmod 沒有無故全部變成當天。
6. 若舊裝置顯示舊版，先排除瀏覽器／CDN cache，再判斷是不是程式錯誤。
