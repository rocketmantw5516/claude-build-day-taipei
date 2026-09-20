# DEMO — 60 秒劇本

理念:**一次錯的、一次對的。** 先用一顆閥把它炸掉,再照規矩把它點起來。
觀眾只要記得一句話:「每顆閥都有理由,這個模擬器讓你親手體會那個理由。」

全程只碰 **5 種輸入**:`HV-3` → `MAIN VALVE` → `R` → `Space`×數下 → `PROMPT`。

## 上台前先擺好(不算在 60 秒內)

- 引擎選 `ast91`(我們的真引擎)、模式 `FREE`
- **主閥開啟速度滑桿拉到最快**(這是炸掉的關鍵,上台前就拉好)
- 聲音打開、音量中等(爆炸那一聲很值錢);開場閘門先按掉
- 瀏覽器全螢幕、縮放 100%、滑鼠游標停在 `HV-3` 上

## 劇本

| 秒 | 手 | 嘴(英文,照念) | 畫面上會發生什麼 |
|---|---|---|---|
| 0–8 | 不動 | "We're a student rocket team. This is our real engine on its test stand — rebuilt from the equations, by one prompt, in one HTML file." | 試車台待命,儀表靜止,狀態燈 SAFE |
| 8–12 | 點 `HV-3`,點 `MAIN VALVE` | "Watch. I open the main valve — too fast." | 氧氣衝進管路 → 白閃、爆炸、碎片 |
| 12–24 | 不動,等事故卡滑入 | "Forty bar of oxygen into an empty pipe. Adiabatic compression — five hundred sixty-eight degrees. No spark needed. That is a real accident. It killed three people in 2007." | 畫面凍結轉灰,事故報告卡:**T2 = 568 °C** |
| 24–36 | 按 `R`,然後一下一下按 `Space` | "Now the right way. Purge with nitrogen. Pre-charge the line. Arm. Igniter first — then oxygen, slowly." | 引導模式步驟條一格一格亮;管內流體顏色在走;狀態燈 SAFE → ARMED → FIRING |
| 36–48 | 不動 | "Chamber pressure, thrust, shock diamonds — all computed live. And this table checks the simulation against closed-form answers. Green means they agree within one percent." | 噴流與馬赫鑽石、室壓與推力曲線往上畫、**驗證表逐列變綠** |
| 48–60 | 滑鼠移到任一顆閥上,再點 `PROMPT` | "Every valve has a card: what it is for, and what goes wrong without it. One prompt. One file. Thank you." | 教學卡片跳出 → 提示詞視窗打開 |

英文約 120 字,正常語速 50 秒,留 10 秒給爆炸的安靜。**爆炸後那兩秒不要講話。**

## 這個劇本對成品的要求(收尾那一輪要驗)

1. 預設狀態下,`HV-3` 開 + 主閥快開 = **一定**觸發 `ADIABATIC`,而且 3 秒內事故卡出現,卡上的數字接近 568 °C。
2. `R` 瞬間重置,保留引擎選擇,不用重新整理頁面。
3. `Space` 在重置後直接進引導模式;每一步的等待要有「展示用時間壓縮」:現實的 30 秒吹除 → 畫面上約 1.5 秒。整個序列 6–8 下 `Space` 走完。
4. 燃燒段約 8–10 秒,夠驗證表至少兩列變綠。
5. 室壓、推力、T2 三個數字要夠大,三公尺外讀得到。
6. `PROMPT` 視窗一鍵打開。

## 出狀況時

| 狀況 | 怎麼辦 |
|---|---|
| 爆炸沒觸發 | 不要再試。直接 `R` → `Space`,把對的那次走完,講稿從 "Now the right way" 接 |
| 引導模式卡住 | 改自由模式:點 `IGNITER` → 點 `MAIN VALVE`(慢),一樣會點起來 |
| 整頁壞掉 | 重新整理頁面(`Cmd+R`),從 "Now the right way" 開始,放棄爆炸那段 |
| 超時 | 砍最後一句的教學卡片,直接 `PROMPT` + "One prompt. One file. Thank you." |

## 如果有第二個 30 秒(評審追問時)

按 🎲 隨機引擎 → 點火 → 多半會是壞設計:喉部太小就爆、鐘罩太大就流動分離。
一句話:"It also generates random engines — and most random engines are bad engines. It tells you why."
