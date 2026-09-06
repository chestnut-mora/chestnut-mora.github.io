# 已知問題與 Know-how

## 1. 站內 `<Link>` 看似正常但點擊無反應

### 症狀

- 首頁「所有萌栗」無法前往集合頁。
- 商品頁的回首頁／回所有萌栗按鈕沒有反應。
- 開新分頁可能有效，普通點擊卻被攔截。

### 根因

本專案使用 Vinext beta 的 App Router 相容層並靜態匯出到 GitHub Pages。過去把原生 `<a>` 改成 `next/link` 後，client router 攔截了導覽，但匯出的實體路徑與預期 routing 行為不完全一致。另一個問題是 `/products/` 尾斜線與實際輸出 `/products` 不一致。

這不是「長對話壓縮」或某個模型一定造成的可證明結論；直接、可驗證的原因是後續程式修改重新引入了 `Link` 與尾斜線。

### 固定解法

- 站內跨頁一律原生 `<a>`。
- `/products` 不加尾斜線。
- 回首頁統一 `/#top`。
- 每次路由改動執行：

  ```powershell
  rg -n 'next/link|href="/products/"' app components
  npm run build
  ```

## 2. 另一台裝置打開就是 final，沒有 GSAP／AVAL

舊程式偵測 `prefers-reduced-motion` 後直接 `setPhase('final')`，並停用 AVAL。啟用系統「減少動態效果」的裝置因此跳過整段動畫。

現行動畫不會自動開始，必須由使用者按按鈕，因此已移除 reduced-motion 直接跳 final 與 AVAL 禁用邏輯。CSS 仍可降低其他非必要 transition，但不得阻止這段手動互動。

## 3. final 切換時閃一下、雙重陰影

根因是 GSAP 靜態手鍊與 AVAL 互動手鍊在交接幀同時可見，或兩者 geometry／drop-shadow 不一致。

- AVAL 圖載入完成前保留 GSAP 層。
- AVAL ready 後在 layout effect 中移除 GSAP 層，避免中間 paint。
- 不要在兩層同時做 opacity crossfade。
- 調整 final 尺寸、定位或陰影時，兩層一起核對。

## 4. Hero 偶爾同時出現初始盒底圖

常見原因是 React mount 前的 CSS 與 GSAP `set()` 狀態不一致、重播未完全 reset，或圖片延遲載入時先畫出預設 DOM 狀態。

- 非 sealed 物件在 CSS 初始狀態就隱藏，不只依賴 mount 後的 JavaScript。
- `timeline.restart()` 前同步關閉 AVAL，並把 presence 隱藏。
- sealed 高優先，後續素材 idle preload。
- 修改 timeline 後連續重播並重新整理測試。

## 5. 輪播 hover 時右側露出下一張圖

放大 transform 套在圖片時，如果 clip／overflow 位於錯誤 DOM 層，放大的像素會超出圓角 viewport；同時底下或下一張 slide 仍在可見範圍。

- 固定 viewport `overflow: hidden` 與圓角。
- transform 只套在 viewport 內的當前圖片。
- 手機可略加 cover scale，但不能以此取代正確 clipping。

## 6. 精選萌栗捲到底後羽化消失

羽化應是 carousel 容器的固定視覺 overlay，不應綁定 `canScrollLeft`／`canScrollRight`。若設計要求永遠羽化，起點與終點也保留左右 overlay。

## 7. 商品圖仍看起來來自賣貨便

商品原圖來源本來是賣貨便，但正常 runtime 首選已封存的本地 `/assets/products/{slug}.webp`。`sourceImageUrl` 仍存在 JSON 是正確的：它提供追溯與 fallback。判斷是否熱連應看實際 `<img src>`，不能只看資料檔有沒有遠端 URL。

## 8. GitHub Action 能 push，本機不能 push

Actions workflow 有 job-scoped `contents: write`，GitHub 在 run 內提供臨時 `GITHUB_TOKEN`。本機不在該 run 內，不能取得或重用它。本機錯誤另由 Git for Windows、TLS backend 或 Credential Manager 處理；兩者不是同一個權限通道。

## 9. 定時同步與人工提交互相衝突

MyShip workflow 可能在工程師工作期間提交資料，造成 push non-fast-forward。每次開始與推送前 fetch/rebase；保留遠端最新商品資料，禁止 force push 或用舊 JSON 覆蓋 Actions commit。

## 10. 文件可能落後程式

品牌規格在多輪迭代後曾出現舊標題、舊 reduced-motion 行為與「單一路由」描述。重大功能變更的 Definition of Done 必須包含更新 `docs/`；工程師接手時仍以程式、Git 歷史與實際 Actions 為現況證據。
