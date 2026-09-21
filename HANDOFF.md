# HANDOFF — Claude Code Build Day Taipei(2026-09-20)

寫於 2026-09-21 17:04。寫的人是主線 session(`claude-taipei-54`),要關了。
**活動當天的 demo 結果我不知道** —— 最後一次對話停在 19:17(上台前 13 分鐘),之後沒有任何回報。
下面只寫我親眼確認過的狀態。

## 先看這段

- 成品:**`engine.html`**,單一檔案、143 KB、零外部資源。md5 `4c262931a314254a8b59b6ff465c1209`,git tag **`demo-v2`**(內容同 `demo-v1` 之後的最終版)。
- Repo:https://github.com/rocketmantw5516/claude-build-day-taipei
- ⚠️ **Repo 現在是 PUBLIC。** Frank 9/20 19:17 要求公開,說「明後天再關」。關掉的指令:
  ```
  gh repo edit rocketmantw5516/claude-build-day-taipei --visibility private --accept-visibility-change-consequences
  ```
  公開期間被 fork / clone 的副本收不回來。公開的內容含 `KNOWLEDGE.md`(引擎真實尺寸與工作點)、
  `PLAYBOOK.md`(引用 drone91 / 欽揚案的教訓)、`REFERENCE-fable-demos.md` 第八節(文字提到測試時攝影機拍到房間)。
- `main` 與 `leo` 兩個分支指向同一個 commit(`59b04c2`)。協作者:`llin619`(Leo,push 權限)。

## 這個作品是什麼

**Rocket Engine Test Stand** —— 一座可以操作的火箭引擎試車台模擬器。預設引擎是 Astronauts91 的 350 N 石蠟/GOX 混合式引擎
(真實剖面尺寸),另有錐形噴嘴、大鐘型、液氧煤油、隨機引擎。每顆閥有教學卡片;不照規矩操作會照公式出事,共十個結局。
熱化學標示為「CEA-derived fits」,**不是**即時跑 NASA CEA。

怎麼做出來的:一段提示詞(`PROMPT.md` 的 v4)→ workflow 的 builder A 一次生成 `out/a.html` → 之後由主線 session 手動收尾。
workflow 在 18:46 被我停掉(builder B 22 分鐘沒交出檔案),所以**原計畫的「評審 + 四角度對抗審查 + fixer」沒有跑**,
改由隔壁 session 用無頭 Chrome 的 QA 取代。

## engine.html 在 builder A 之後加了什麼(依時間)

1. 版面:右側欄收窄、虛擬畫布加寬、引擎剖面放大、管路代號字 12.5 px;右側多 8 格讀數(共 20 格);標題列/底列/聚光質感。
2. `requestAnimationFrame` 移到每幀第一行;複製提示詞加 catch 與退路;THERMO 區固定高度。
3. Leo 的 `modules/cards.js` 合進去(19 張教學卡片 + 事故說明的文字)。**他的 `modules/engines.js` 沒有合** ——
   主線的液體引擎多用一個 `fuelCdA_mm` 欄位,他的版本沒有,換進去可能壞。
4. 畫面教練:光圈 + 中英指令 + SAY 英文講稿,三套劇本串接(THE WRONG WAY → THE RIGHT WAY → RANDOM ENGINE)。`D` 開關。
5. `ALL RESET`(右上,快捷鍵 `0`);RESET 會把主閥開啟時間拉回 0.5 s;自由模式按 Space 會自動切到引導模式。
6. 三顆自動示範按鈕(右下):▶1 CLEAN START、▶2 SNAP-OPEN VALVE、▶3 OXYGEN BEFORE FIRE。它們呼叫真正的控制處理函式。
7. 所有操作按鈕加中文小字(`data-zh` + CSS `::after`)。
8. 爆炸 / 點不著火特效換成 `assist/fx.js` 的版本(由 `assist/patches/explosion.md` 套用)。
9. ADIABATIC 事故卡改印公式對「管壓 → 調壓器設定」的完整 T2(實測 564 °C),並註明 400 °C 時就點著;
   防範說明的數字統一成「about 565」。事故卡不透明 + 壓暗背景;結局出現時光圈隱藏。

## 驗證到哪裡

| 項目 | 狀態 |
|---|---|
| 整頁掃描(30 顆按鈕逐顆 + 連按、兩根滑桿兩端、噴注孔板選項、三張 canvas 點擊格、Space/S/A/R) | 最終版 **0 問題**,61 fps(隔壁 session,`assist/qa.sh --all`) |
| 三顆自動示範 | 最終版重播:ADIABATIC ~3 s、HARD_START ~7 s、CLEAN_RUN ~15 s,零錯誤(`assist/paths/macros.json`) |
| 教練整套劇本(爆炸 → 重置 → 引導 → CLEAN_RUN) | 重播通過(`assist/paths/coach.json`);**第三套隨機引擎沒走過** |
| 十個結局 | 19:06 版全部觸發得到(`assist/CHEATSHEET.md` 有確切點法);最終版沒有逐一重跑 |
| `ALL RESET` | 按下不報錯;重置後狀態的自動檢查那一步沒回傳結果,**未確認** |
| 聲音 | `assist/audio.js` QA 零錯誤,但**沒有任何人聽過**,沒有合進 `engine.html`。成品是原本的簡單合成音,靜音啟動 |

重播工具:`node assist/drive.mjs engine.html assist/paths/<name>.json`。

## 已知問題(都沒修)

- 氮氣吹除支路標籤重疊:`NITROGEN PURGE` 被 PV3 圖示蓋住、`RO2` 黏著 `CK2A`。
- 噴流只有約 250 px 就到畫布邊緣;試車台上下留白大。根因是管路圖座標寫死(`HITS` 陣列 + `drawStatic`),橫向比例固定。要修得重排整張圖。
- 預設引擎燃燒超過約 12–13 s 會 `BURN_THROUGH`。教練與 ▶1 在 6–7 s 關機所以沒事;手動點火要自己記得。
- 引導模式第 7→9 步要在約 5 s 內按完,否則點火器燒完變 `NO_LIGHT`。
- CLEAN_RUN 的條件被我放寬成關機後吹除 ≥ 1 s(原本 4 s;`PARAMS.purgeMin` 還是 4,教練照 4 s 擋)。比較好的做法是改成扣分而不是門檻。
- CLEAN_RUN 成績單的 O/F 第二個數字是「–」(`ofEnd` 沒設)。
- `BURST` 沒有固定路徑,只能靠隨機引擎抽到喉部太小(約 1/9)。
- `STYLE-REFERENCE.md` 的動畫手法表裡,疊加混色與粒子池是我們自己的選擇,不是官方範例的做法(檔內已加註)。

## 檔案地圖

| 路徑 | 內容 |
|---|---|
| `engine.html` | 成品 |
| `out/a.html` | builder A 的原始生成(未經收尾),可對照「一段 prompt 直出」長什麼樣 |
| `PROMPT.md` | 主提示詞 v4 + NASA CEA 標示的說明 |
| `INTERFACE.md` | 介面企劃、兩台電腦的接縫、結局與元件代號 |
| `KNOWLEDGE.md` | 從 `astronauts91` / `rtc_rocket` / `hq` 搜回來的引擎知識(附出處) |
| `PLAYBOOK.md` | 從過去專案提煉的建造 / 審查 / 節奏規則 |
| `STYLE-REFERENCE.md`、`assist/TECHNIQUES.md` | 官方三個範例的技術拆解 |
| `DEMO-1MIN.md`、`DEMO-SCRIPT.md`(Leo) | 60 秒與 2 分鐘講稿。**`DEMO-1MIN.md` 寫在自動示範按鈕之前,已過時**;實際流程是 ▶2 → RESET → ▶1 → RESET → ▶3 → 手動斷電收尾 |
| `assist/` | 隔壁 session 的產出:`qa.sh` / `qa.mjs` / `drive.mjs`、`fx.js`、`audio.js`、`ui-kit.html`、`GRAFT.md`、`patches/`、`paths/`、`CHEATSHEET.md` |
| `modules/`(Leo) | `cards.js`(已合)、`engines.js`(未合)、`preview.html` |
| `WORKFLOW-PLAN.md`、`LEO.md`、`archive/`、`alt/` | 當天的計畫與被取代的舊版,留作紀錄 |

沒進 git 的本機檔:`out/.engine-pre-*.html`(每次大改前的備份)、`assist/trial/`(嫁接試作,含 `engine-audio.html` 聲音試聽版,
是用較舊的 `engine.html` 做的)、`assist/shots/`(QA 截圖)、`assist/ref/`(官方範例原始碼,刻意不進 repo)。

## 如果之後要繼續做

1. 先決定 repo 要不要關。
2. 想加聲音:`python3 assist/trial/gen.py` 會對現在的 `engine.html` 重驗錨點(爆炸那幾組會報已套用,屬正常),只套 `assist/patches/audio.md` 的 A1–A10,A2 與 A3 要一起套。**先找人聽過再合。**
3. 想讓引擎填滿畫面:重排 `HITS` 與 `drawStatic` 的座標,把 `FACE` 往左移,給噴流 400 px 以上。
4. 想把 Leo 的引擎庫合進來:先替 `kerolox` 補上 `fuelCdA_mm`。
5. 改完一律跑 `assist/qa.sh engine.html --all` 和三個重播路徑。
