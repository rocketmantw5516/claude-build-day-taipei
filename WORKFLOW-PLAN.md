# WORKFLOW PLAN — 草稿(18:15 討論,18:30 前定稿開跑)

## 形狀(8 個 agent,符合「10 個以內」)

```
Phase 1  Build      同一段 PROMPT.md,兩個 builder 各自獨立生成        builder-A, builder-B
Phase 2  Judge      一個 judge 實際讀兩份,選一份當主線,列出另一份值得搬的點   judge
Phase 3  Review     四個互斥角度各自試圖推翻主線                        physics / gates / first-open / across-room
Phase 4  Fix        一個 fixer 只修「被確認」的問題,一次修完             fixer
```

為什麼兩個 builder:單檔 HTML 沒辦法平行開發,但可以平行「擲兩次骰子」。
同一段 prompt、兩次獨立生成、挑好的那次 —— 這也忠於「one prompt in, one HTML file out」。

## 每個 agent 讀什麼

| agent | 輸入 | 產出 |
|---|---|---|
| builder-A/B | `PROMPT.md` 那一段 + `KNOWLEDGE.md` + `PLAYBOOK.md` 的「建造規則」 | `out/a.html`、`out/b.html` |
| judge | 兩份 HTML + PROMPT | 選哪份、為什麼、另一份可搬的 3 點以內 |
| physics | 主線 HTML + KNOWLEDGE §2 §5 | 公式、單位、因次、極限情形的錯(附行號) |
| gates | 主線 HTML + PLAYBOOK「審查規則」1–3 | 驗證表每列是不是真的兩條路、會不會 FAIL |
| first-open | 主線 HTML | 語法錯、未定義變數、每幀配置、按鈕沒接事件 |
| across-room | 主線 HTML + KNOWLEDGE §3 | 教學卡片有沒有講對「為什麼」、三公尺外讀不讀得到 |
| fixer | 主線 HTML + 全部確認過的 findings | `engine.html` |

## 規則

- reviewer 只報「會讓 demo 出糗」的問題,每人最多 5 條,附行號與修法。風格意見不收。
- fixer 不准用調常數的方式讓驗證列變綠(PLAYBOOK 審查規則 3)。
- 任何 agent 不准引入外部函式庫或外部資源。

## 時程(今天實際時間)

| 時間 | 做什麼 | 誰 |
|---|---|---|
| 18:15–18:30 | 討論:刪 PROMPT、定 workflow、分駕駛/副駕 | 兩人 |
| 18:30 | **workflow 開跑** | 駕駛 |
| 18:30–19:00 | 衝刺。副駕同時寫 2 分鐘英文講稿(數字留空) | 兩人 |
| 19:00 | 第一輪收斂:打開 `engine.html`,真的按每一顆閥、走一次導引倒數、故意搞壞一次 | 兩人 |
| 19:00–19:20 | 收尾一輪:只修「壞的」和「不夠好看」,一次一個要求 | 駕駛 |
| 19:20 | **凍結。** 從畫面抄數字進講稿,計時練兩次 | 副駕喊停 |
| 19:30 | 上台 | — |

19:00 時液氧煤油構型如果還沒好 → 整段拿掉,不救。
