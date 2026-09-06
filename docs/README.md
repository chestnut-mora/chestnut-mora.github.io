# 技術文件索引

這組文件把品牌規格、實際程式架構、前面迭代累積的 know-how 與維運步驟分開保存，避免單一長文件同時承擔所有用途。

## 閱讀順序

### 第一次接手

1. [`../AGENTS.md`](../AGENTS.md) — 防回歸規則
2. [`TECHNICAL_GUIDE.md`](TECHNICAL_GUIDE.md) — 現況架構
3. [`OPERATIONS_SOP.md`](OPERATIONS_SOP.md) — 如何開發、同步與部署
4. [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) — 過去發生過的問題
5. [`HANDOFF_CHECKLIST.md`](HANDOFF_CHECKLIST.md) — 接手核對

### 修改品牌或內容

1. [`BRAND.md`](BRAND.md) — 品牌名稱、語氣、色彩、Huninn 字型
2. [`CONTENT.md`](CONTENT.md) — 已核准可見文案與官方連結
3. [`SITE_SPEC.md`](SITE_SPEC.md) — 頁面結構、互動與 SEO 規格
4. [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md) — 可使用的圖片與來源
5. [`DECISIONS.md`](DECISIONS.md) — 為什麼採取目前作法

## 哪份文件是準則

| 問題 | 優先查閱 |
| --- | --- |
| 品牌要怎麼說、怎麼看 | `BRAND.md`、`CONTENT.md` |
| 頁面應有哪些功能 | `SITE_SPEC.md` |
| 哪些圖片能使用 | `ASSET_MANIFEST.md` |
| 現在程式怎麼運作 | `TECHNICAL_GUIDE.md` |
| 要怎麼執行固定工作 | `OPERATIONS_SOP.md` |
| 為何不能改回某種作法 | `DECISIONS.md`、`KNOWN_ISSUES.md` |

文件記錄的是 repository 內可驗證的現況。GitHub Actions 執行結果、正式站部署狀態與賣貨便內容會隨時間變動，交付時仍須即時查證。
