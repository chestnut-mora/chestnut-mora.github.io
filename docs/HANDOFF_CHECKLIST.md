# 工程師接手與交付檢查表

## 接手第一天

- [ ] 確認 repository 是 `chestnut-mora/chestnut-mora.github.io`，不是其他品牌帳號。
- [ ] 確認 branch 是 `main`，remote URL 正確。
- [ ] 閱讀 `AGENTS.md` 與 `docs/README.md` 指向的文件。
- [ ] 安裝 Node.js 22，執行 `npm ci`。
- [ ] 執行 `npm run build` 與 `npm run test:myship`，記錄 baseline。
- [ ] 查看最近一次 Pages deploy 與 MyShip sync Action，不把歷史成功當成現在成功。
- [ ] 抽查正式首頁、`/products`、現貨商品頁、絕版商品頁、`/sitemap.xml`。
- [ ] 確認 GitHub 帳號／SSH 或 GCM 能推送，不保存明文 token。

## 每次功能修改

- [ ] 先 fetch/rebase，保留 Actions 最新同步資料。
- [ ] 變更只涵蓋需求範圍，不覆蓋無關使用者修改。
- [ ] 跨頁連結仍是原生 `<a>`，路徑符合 `/#top`、`/products`、`/products/{slug}`。
- [ ] 品牌前台仍以「萌栗」為主，SEO 才自然補充「萌粒」。
- [ ] FAQ 只改 `data/faq.ts`。
- [ ] 自動產生檔透過腳本更新，不手工拼接。
- [ ] 新圖已寫入 asset manifest，沒有 Instagram hotlink 或未核准生成圖。
- [ ] Mobile First；至少檢查 360、390、430、768、1280px。
- [ ] 沒有 page-level 水平 overflow，互動有鍵盤／觸控基本可用性。

## 商品同步或 SEO 修改

- [ ] 失敗同步不推進 missing clock。
- [ ] `available` 才進首頁現貨區。
- [ ] `soldout`／`removed`／`archived` 的商品頁仍存在。
- [ ] slug registry 已提交且沒有重用。
- [ ] 商品圖片正常時使用本地 WebP。
- [ ] schema category 是 `4550`。
- [ ] FAQPage 與畫面文字一致。
- [ ] sitemap 有 `/`、`/products/`、所有保留商品頁。
- [ ] `lastmod` 只對真實內容異動更新。

## Hero 動畫修改

- [ ] 初始不自動播放，按鈕才開始。
- [ ] sealed 首屏優先，其餘素材延遲預載。
- [ ] sealed → peel 是自然溶解；後續節奏符合 GSAP timeline。
- [ ] 卡片初始 `-6deg`、袋子初始 `-8deg`，且在盒內合理排列。
- [ ] 手鍊抽出前與袋子綁定，抽出後沒有瞬移。
- [ ] GSAP → AVAL 沒有閃白、雙影或 geometry 跳動。
- [ ] reduced-motion 裝置仍可由按鈕播放，不直接跳 final。
- [ ] 重播至少兩次，沒有初始盒圖與 final 同時露出的殘留狀態。

## 發佈前

- [ ] `npm run build`
- [ ] `npm run test:myship`
- [ ] `git diff --check`
- [ ] 檢視 `git diff --stat` 與 generated data 差異。
- [ ] 再次 fetch/rebase，處理 Action 競速。
- [ ] 使用明確 commit message 推送 `main`，不 force push。
- [ ] 等待 Pages Action 完成並記錄 commit SHA。
- [ ] 用帶 short SHA 的 cache-busting URL 驗證正式站。
- [ ] 若功能或 know-how 有改變，同步更新本文件與相關決策／已知問題。
