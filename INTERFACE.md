# INTERFACE — 介面企劃(兩台電腦的對齊點)

骨架學官方 Engine Lab(見 `STYLE-REFERENCE.md`):深色控制室、純 Canvas 2D、CSS grid、系統字體。

## 畫面分區(桌機 16:9,一頁不捲動)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ TOPBAR  標題 · 引擎選擇[ast91|conical|bell|kerolox|🎲random] · 模式[GUIDED|FREE] │
│         · 狀態燈(SAFE / ARMED / FIRING / INCIDENT) · FPS · PROMPT          │
├──────────────────────────────────────────────┬────────────────────────────┤
│                                              │ GAUGES  瓶壓 · 歧管壓 · 室壓    │
│  #stand  大 canvas(佔 1.62 份)               │ READOUTS 推力 · O/F · Isp · c*  │
│                                              │          · Tc · 出口馬赫 · Pe/Pa │
│   管路示意圖包著引擎剖面:                        ├────────────────────────────┤
│   瓶 → 調壓 → 手動閥 → 濾器 → 主閥 → 噴注 → 引擎 → 噴流  │ #plots  Pc / 推力 / 瓶壓 對時間  │
│   上方:N2 吹除支路(雙止回閥)                    ├────────────────────────────┤
│   側邊:排氣閥、安全閥、爆破片                      │ VERIFY  三列驗證表            │
│                                              │ THERMO  「CEA-derived fits」   │
├──────────────────────────────────────────────┴────────────────────────────┤
│ CONSOLE  ARM 鑰匙 · IGNITER · MAIN VALVE(開啟速度滑桿)· PURGE · VENT          │
│          · REGULATOR 設定 · TIME 1×|¼×|1/20× · SOUND · 【ABORT】              │
│ SEQUENCE 引導模式的步驟條(目前步驟發亮,做錯順序不擋你,只是後果自負)               │
└───────────────────────────────────────────────────────────────────────────┘
浮層:教學卡片(滑到/操作任何元件時出現)· 事故報告卡(結局時滑入,畫面凍結轉灰)
```

## 互動規則

- 畫布上的閥門**可以直接點**;下方 CONSOLE 是同一組控制的大按鈕版(上台時好按)。
- 每個元件 hover → 教學卡片:`name` / `what` / `without`。
- 任何結局 → 動畫演完 → 凍結 → 事故報告卡:`title` / `happened` / `number` / `prevent` + 【RESET】。
- ABORT 永遠可按:主閥關、排氣開、吹除開。
- 鍵盤:`Space` = 引導模式下一步、`A` = ABORT、`R` = reset、`S` = 聲音。

## 兩台電腦的接縫(只有這兩個)

主線 `engine.html` 的 `<script>` 最上面固定留這一段,**Leo 的模組就是換掉這一段**:

```js
/* ==== CONTENT MODULES (replaceable) ==== */
const CARDS = { … };  const INCIDENTS = { … };      // ← modules/cards.js
const ENGINES = { … }; function randomEngine(seed){…} // ← modules/engines.js
/* ==== END CONTENT MODULES ==== */
```

契約細節見 `LEO.md`。主線只透過這四個名字取用內容,不准在別處寫死卡片文字或引擎尺寸。

### `ENGINES[key]` 物件(定案)

```js
{ label, type: "hybrid" | "liquid",
  profile: [[x_mm, r_mm], …],   // 內壁輪廓,x 由噴注面=0 往噴嘴出口遞增,至少 24 點
  throatR, exitR, chamberR, chamberL,          // mm
  grain: { outerR, portR, length, x0 } | null, // 混合式才有
  designPc_bar, burstPc_bar,                   // 超過 burst → BURST 結局
  note }                                       // 一句話,隨機引擎要誠實講它哪裡設計壞了
```

### 結局代號(定案,兩邊都用這十個)

`NO_LIGHT` `HARD_START` `ADIABATIC` `CHUG` `BURST` `BURN_THROUGH` `FLASHBACK` `REG_FAIL` `POWER_CUT` `CLEAN_RUN`

### 元件代號(定案)

`CYL` `PR1` `RV3` `HV3` `FL1` `MV1` `NV1` `IP1` `PV3` `CK2` `PV1` `RV1` `RD1` `PT2` `PT3` `PT4` `ARM` `IGN` `ABORT`
