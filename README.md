# Claude Code Build Day Taipei — Astronauts(Frank + Leo)

**題目:Rocket Engine Test Stand — 一台會教你「每顆閥為什麼在那裡」的火箭引擎試車台模擬器**

單一 HTML 檔、現場從零生成。不帶任何舊程式碼,只帶我們自己踩過的知識與引擎的 2D 尺寸。

## 一句話

官方範例是「一台從方程式長出來的四行程引擎」。我們的是「一整座試車台」:
氧氣瓶、調壓器、主閥、氮氣吹除、排氣、點火器、ARM 鑰匙 —— 每個都能操作,
每個都有一張卡片講它為什麼存在,而且**你不照規矩來,它就真的照公式出事**。

## 檔案

| 檔案 | 內容 |
|---|---|
| [`PROMPT.md`](PROMPT.md) | 主提示詞(上台秀的就是這段) |
| [`WORKFLOW-PLAN.md`](WORKFLOW-PLAN.md) | 多 agent workflow 的形狀、分工、今天的時程 |
| [`KNOWLEDGE.md`](KNOWLEDGE.md) | 引擎剖面尺寸、工作點、流路、點火序列、失敗模式、液氧煤油構型 |
| [`PLAYBOOK.md`](PLAYBOOK.md) | 從 drone91 / rtc_rocket / astronauts91 / ast91 提煉的建造與審查規則 |
| [`REFERENCE-fable-demos.md`](REFERENCE-fable-demos.md) | 官方三個範例的實測紀錄(Leo 整理) |
| `archive/` | 前兩版提示詞,已被取代 |

## 今天的節奏

18:15 討論 → 18:30 workflow 開跑 → 19:00 第一輪收斂 → 19:20 凍結 → 19:30 上台(2 分鐘,英文)

## 誠實界線

- 這是教學用的集總參數模擬,不是 CFD,也不是設計工具。
- 混合式引擎的工作點與幾何是我們的真值;液氧煤油構型用的是教科書量級的數字。
- 成品 `engine.html` 在活動現場生成,這個 repo 在開工前只有計畫與知識。
