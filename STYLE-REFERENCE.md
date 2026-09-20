# STYLE REFERENCE — 官方 Engine Lab 是怎麼做的(實際讀原始碼得到的)

來源:`https://codewithpassion.github.io/fable-demos/engine/`(71 KB、單檔、零外部資源)。
**學它的骨架與手法,不複製它的程式碼。**

## 技術選擇

- **純 Canvas 2D**,三張 canvas 各管一件事:`#engine` 剖面、`#pv` 圖、`#tq` 扭力條。沒有 WebGL、沒有 SVG、沒有任何函式庫。
- DOM 只負責外框:標題列、讀數格、滑桿、分段按鈕、`<dialog>` 式的 PROMPT 視窗(Copy / Close)。
- 版面是 CSS grid:整頁 `auto / 1fr / auto` 三列;主區 `1.62fr : minmax(330px,1fr)` 兩欄(左大圖、右儀表);窄螢幕塌成單欄。
- 字體不載入外部字型:`system-ui` 當內文,`"SF Mono","JetBrains Mono",Menlo,Consolas` 當數字。
- `devicePixelRatio` 有處理(高解析螢幕不糊)。

## 配色(深色控制室)

```
--bg #070a12   --panel #101725   --panel2 #0c111c   --line #232d44
--text #e9eef7 --muted #8b98b2
--amber #ffb347  --flame #ff7a1a  --cyan #5fd3ff  --green #6ee7a0  --red #ff5c6c
```
語意固定:青 = 冷/新鮮氣、橘 = 燃燒、灰 = 廢氣、綠 = 正常、紅 = 超限。滑桿用 `--c` 變數各自上色。

## 程式結構(它的 12 節,我們照這個順序寫)

```
0 Utilities(clamp / lerp / fmt:非有限值一律顯示「–」)
1 常數與幾何          2 物理模型(單一狀態物件)   3 整機狀態與時間積分
4 聲音(AudioWorklet,退回 ScriptProcessor)      5 Canvas plumbing(mkCanvas / begin)
6 剖面繪製(以 mm 為單位畫,原點放在機構中心)     7–8 即時圖表
9 儀表與讀數           10 Controls(bindRange / bindSeg 兩個小工具綁所有控制)
11 Main loop
```

- 主迴圈:`dt = clamp((now-last)/1000, 0, 1/20)` → `simulate(dt * timeScale)` 內部再切固定小步 → 畫三張圖 → 更新讀數。
- **剖面用真實單位(mm)畫**,最後才乘一個縮放。所以換幾何只要換數字。
- 氣體顏色由狀態決定(`gasColour()`),不是寫死的動畫。
- 讀數更新走 `textContent`,不重建 DOM。

## 動畫手法(我們要用的)

註:官方引擎範例本身**沒有**用 `globalCompositeOperation`、也沒有粒子池,儀表是 inline SVG。下表的疊加混色與粒子池是我們自己的選擇,不是它的做法。

| 效果 | 做法 |
|---|---|
| 發光、火焰核心 | `createRadialGradient` + `shadowBlur`;火焰粒子用 `globalCompositeOperation = 'lighter'` 疊加 |
| 金屬件 | 線性漸層的小工具 `hgrad()` / `vgrad()`,一個函式畫所有圓角矩形 `rr()` |
| 排氣 / 煙 | 粒子陣列,固定上限,回收重用,不每幀配置 |
| **管內流動** | 虛線 `setLineDash` + `lineDashOffset` 隨流量前進,顏色 = 流體種類。便宜、遠看清楚 |
| **噴流與馬赫鑽石** | 鑽石間距隨 `Pe/Pa` 與出口馬赫數變;過膨脹 → 噴流內縮、鑽石密;欠膨脹 → 噴流外張成氣球狀 |
| 推力感 | 畫面輕微震動,振幅跟推力成正比;熱霾用低透明度的抖動疊層 |
| **爆炸** | 白閃一幀 → 碎片粒子(帶重力)+ 衝擊波環 → 畫面凍結、轉灰 → 事故報告卡滑入 |
| 點不著 | 點火器火花 → 一小團煙 → 什麼都沒發生。安靜本身就是效果 |
| 閥門 | 手柄旋轉 90° 的補間;氣動閥另畫致動器;常開/常閉用不同符號 |
| 儀表 | 圓弧刻度 + 指針,紅線區上色;指針帶一點慣性 |
