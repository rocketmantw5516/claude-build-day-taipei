# DEMO-SCRIPT — 2 分鐘英文上台稿(Rocket Engine Test Stand)

總長 2:00。講稿 166 個英文字(上限 210),加上唸數字約 180 字;每一格都壓在每分鐘 130 字以下(慢速)。
講話的格子合計 98 秒,另外 22 秒完全不講話:第一次爆炸 6 秒、第二次爆炸 10 秒、乾淨燃燒 6 秒。
所有 `____` 都是**從畫面抄的數字**,19:20 凍結後填;沒填的格子上台不准唸、不准猜。
按鈕名稱照 `INTERFACE.md`;成品 `engine.html` 的實際標籤若不同,19:20 彩排時把本檔的名稱改成畫面上的字。

分工:**DRIVER** 只管手(滑鼠與鍵盤),**SPEAKER** 只管講。講的人不碰電腦。

## 講稿

| 時間 | 手(DRIVER) | 講(SPEAKER,英文照唸) |
|---|---|---|
| 0:00–0:12 | 不動。畫面停在 `ast91` + `FREE`,試車台已上壓(見起飛前檢查)。 | "The official demo simulates an engine. We simulate the whole test stand. Every valve has a reason. Behind most reasons, somebody got hurt." |
| 0:12–0:21 | 滑鼠停在畫布上的主閥 `MV1` 一秒(教學卡片跳出)。把 `MAIN VALVE` 開啟速度滑桿拉到**最快**。**不按** `PURGE`。 | "First, I break two rules. No nitrogen pre-charge. And I open the main valve fast." |
| 0:21–0:27 | 按 `MAIN VALVE`。→ 管路起火,閃光、煙。**兩個人都不講話**,等事故報告卡滑進來。 | (安靜 6 秒) |
| 0:27–0:44 | 滑鼠指著報告卡上的 `T2 = … °C (limit 400 °C)` 那一行。 | "I never touched the igniter. Fast oxygen squeezed the gas in a dead-end line. It hit ____ degrees. The limit is 400. In 2007, a cold-flow test killed three people. No ignition. No fuel." |
| 0:44–0:52 | 按 `R`。點 `🎲random`(彩排時確認過這顆的 note 寫喉部太小)。點 `GUIDED`。 | "Reset. A random engine. Its throat is too small. I follow every step, by the book." |
| 0:52–1:02 | 連按 `Space` 走完倒數直到主閥斜坡(次數 = ____ 下,彩排時數)。→ 室壓衝過頭,`BURST`。安靜等報告卡。 | (安靜 10 秒) |
| 1:02–1:09 | 滑鼠指著報告卡上的 `Pc = … bar (burst limit … bar)` 那一行。 | "Burst at ____ bar. The procedure was right. The design was wrong." |
| 1:09–1:15 | 按 `R`。引擎選 `ast91`。點 `GUIDED`。確認 `SOUND` 是開的(沒開就按 `S`)。 | "Reset. Our real engine, the right way." |
| 1:15–1:28 | 跟著 SPEAKER 的節奏按 `Space`;`SEQUENCE` 步驟條會一格一格亮。步驟比句子多的話(吹除開/關、GO/NO-GO、倒數),多的那幾下在句子之間補按。 | "Purge. Close the vent. Key in. Igniter first. Chamber pressure rises. Then oxygen, slowly." |
| 1:28–1:34 | 不動。讓引擎燒、讓聲音響、讓噴流的馬赫鑽石出來。 | (安靜 6 秒,讓大家聽) |
| 1:34–1:46 | 滑鼠指 `READOUTS` 的推力、`GAUGES` 的室壓。**這兩個數字一唸完就按 `Space` 關主閥,不要等 SPEAKER 講完**(燒太久會變 `BURN_THROUGH`)。再指 `VERIFY` 三列,繼續按 `Space` 走完吹除、排氣、拔鑰匙,直到 `CLEAN_RUN` 報告卡。 | "____ newtons of thrust. ____ bar in the chamber. Three independent checks. All green, within ____ percent." |
| 1:46–2:00 | 點 `PROMPT`(SHOW THE PROMPT),讓提示詞全文留在畫面上。手離開鍵盤。 | "One prompt. One HTML file. It is a teaching model, not CFD. The chemistry uses CEA-derived fits. The geometry and operating point are our real engine. Thank you." |

## 出事怎麼辦(台上只有這一條)

**任何東西不照劇本走:按 `R` → 選 `ast91` → 點 `GUIDED` → 直接跑乾淨那一段(1:09 那一列)。** 不在台上除錯、不解釋。
SPEAKER 補一句:"Let me show you the clean run."
如果連乾淨那一段都出事:報告卡照唸,補一句 "We did not plan this one. The simulator did." 然後直接講結尾。

## 第二次爆炸的備案(隨機引擎擲不出喉部太小時用)— `HARD_START`

彩排時若 `🎲random` 兩次內擲不出喉部太小,或按 `R` 之後隨機引擎不會留著,就改用這一段(時間窗相同,0:44–1:09)。
下面的點擊順序是照 `KNOWLEDGE.md` §4、§5 推出來的,**還沒在成品上試過**,19:20 彩排必須實按一次。

| 時間 | 手(DRIVER) | 講(SPEAKER) |
|---|---|---|
| 0:44–1:00 | 按 `R`,留在 `ast91` + `FREE`。`HV3` 開(如果 `R` 把它關回去了)。`PURGE` 開 → `PURGE` 關(這次有預充,管路不會起火)。`VENT` 關。插 `ARM` 鑰匙。滑桿拉回**慢**,按 `MAIN VALVE`(氧先進去)。等 1 秒。按 `IGNITER`。 | "Reset. Now the wrong order. Oxygen first. Igniter second." |
| 1:00–1:09 | 安靜等報告卡,滑鼠指 `Pspike = … bar` 那一行。 | "Hard start. The chamber spiked to ____ bar. Fire first, then oxygen. Always." |

## 起飛前檢查(上台前 5 分鐘,DRIVER 做,SPEAKER 唸)

1. 瀏覽器全螢幕,只開 `engine.html` 一個分頁;通知、Slack、省電、螢幕保護全關;接上電源。
2. **縮放**:調到整頁一屏、沒有捲軸(版面是 16:9 不捲動)。走到教室最後面,確認看得到事故報告卡上的數字。
3. **聲音**:筆電音量開大、接上場地音響。成品預設靜音,按一次 `S`,確認 `SOUND` 顯示開啟、試一次聽得到。
4. **時間倍率**:`TIME` 設 `1×`(不要停在 `¼×` 或 `1/20×`,會超時)。
5. **引擎**:選 `ast91`。**模式**:`FREE`(第一次爆炸要自己亂按)。
6. **第一次爆炸的預備狀態**(上台前按好,之後不要碰):`HV3` 開、`REGULATOR` 設 ____ bar、`VENT` 關,讓主閥上游有壓力;**不要按 `PURGE`**;`ARM` 鑰匙不插。`GAUGES` 應該看到:瓶壓有壓力、歧管壓接近大氣壓。
   - 如果這個狀態不見了(有人按了 `R`),台上補兩下:`HV3` 開、`VENT` 關,再接 0:12 那一列。
7. **隨機引擎**:先擲好一顆 note 寫喉部太小的。記下要點幾下 `🎲random` 才會到它:____ 下。
8. **彩排時要在成品上確認的五件事**(現在沒有成品,以下都是未知數):
   - 按 `R` 之後,引擎選擇、模式、聲音開關、`HV3`/`REGULATOR` 會不會被清掉?會的話,每次 `R` 之後重選。
   - 引導模式從頭到主閥斜坡要按幾下 `Space`?到 `CLEAN_RUN` 報告卡要幾下?
   - 快開主閥 + 沒預充,是不是真的出 `ADIABATIC` 而不是別的結局?
   - 乾淨那一段從點著到 `BURN_THROUGH` 有幾秒?講稿讓它燒 12 秒左右就關主閥;成品撐不到就把 1:28 那格的安靜縮短。(拿 `KNOWLEDGE.md` §1、§2 的尺寸與退縮率粗算約 20 多秒,這是推算不是實測,成品為準。)
   - 三段各自實際秒數。超過 2:00 就砍備案,不砍安靜。

## 要從畫面抄的數字(19:20 填)

| 格子 | 從哪裡抄 | 值 |
|---|---|---|
| T2(°C) | `ADIABATIC` 事故報告卡的 number 行 | ____ |
| 爆破時室壓(bar) | `BURST` 事故報告卡 number 行的第一個數字(`Pc = …`) | ____ |
| (備案)硬啟動尖峰(bar) | `HARD_START` 事故報告卡 number 行的 `Pspike = …` | ____ |
| 推力(N) | `READOUTS` 推力,穩定燃燒時 | ____ |
| 室壓(bar) | `GAUGES` 室壓,穩定燃燒時 | ____ |
| 驗證表誤差(%) | `VERIFY` 三列裡**最大**的那個 | ____ |

對帳用(出自 `KNOWLEDGE.md`,**不是拿來唸的**,只用來判斷畫面數字有沒有離譜):40 bar 打進 1 bar 死管的 T2 是 568 °C;我們引擎的工作點是推力約 323 N、室壓 10.0–11.6 bar。畫面差很多就先告訴 Frank,台上照畫面唸,不照這一行唸。

## 台上不准講的話(`PLAYBOOK.md` 審查規則 7)

- 不講 "perfectly accurate"、"just like a real engine"、"real CEA"、"live CEA"。"CFD" 只准出現在結尾那句 "not CFD" 裡。
- `VERIFY` 沒有三列全綠,就不講 "All green"。改講實話:"____ of three checks are green."
- "One prompt." 只有台上那份 `engine.html` 真的是一份提示詞直出時才講。19:00 有把 `modules/` 貼進去或手修過,就改講 "One HTML file. No libraries."
- 講得出口的只有兩種:模擬對它自己的獨立解差多少 %;幾何與工作點是我們引擎的真值。
