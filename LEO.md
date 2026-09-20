# LEO — 你那台電腦跑的部分

原則:**兩台電腦不碰同一個檔案。** Frank 的機器跑主線(`engine.html`),你的機器做三個純內容模組。
主線自己也會生出一份簡版,所以**你這邊就算沒做完,主線也不會壞**;做完了,19:00 由 fixer 把你的版本換進去。

## 你只碰這些路徑

```
modules/cards.js        教學卡片 + 事故報告(純資料)
modules/engines.js      引擎形狀庫 + 隨機引擎產生器(純函式)
modules/preview.html    你自己看形狀用的小頁面(不進成品)
DEMO-SCRIPT.md          2 分鐘英文講稿
```

分支用 `leo`,做完一塊就 push 一次。不要動 `PROMPT.md`、`engine.html`、`out/`。

## 介面契約(主線照這個接;物件欄位以 `INTERFACE.md` 的定案為準)

```js
// modules/cards.js — 不准碰 DOM、不准有副作用
const CARDS = {            // key = 元件代號,見 KNOWLEDGE.md §3
  MV1: { name: "Main valve", what: "…一句話…", without: "…沒有它會怎樣,一句話…" },
  // CYL PR1 RV3 HV3 FL1 MV1 NV1 IP1 PV3 CK2 PV1 RV1 RD1 PT2 PT3 PT4 ARM IGN ABORT
};
const INCIDENTS = {        // key = 結局代號
  ADIABATIC: { title: "Line fire", happened: "…", number: "T2 = {T2} °C  (limit 400 °C)", prevent: "…" },
  // NO_LIGHT HARD_START ADIABATIC CHUG BURST BURN_THROUGH FLASHBACK REG_FAIL POWER_CUT CLEAN_RUN
};   // {T2} 這種大括號是主線會代入的即時數字

// modules/engines.js — 純函式,單位 mm,軸對稱,x 沿軸向、r 為半徑
const ENGINES = {
  ast91:   { label: "Astronauts91 hybrid 350 N", type: "hybrid", profile: [[x, r], …], throatR: 8.255, exitR: 13.33 },
  conical: { … }, bell: { … }, kerolox: { type: "liquid", … }
};
function randomEngine(seed) { /* 回傳同樣形狀的物件;要會產生「壞設計」:喉部太小、鐘罩過大、燃燒室太短 */ }
```

## 貼進你那台 Claude Code 的提示詞

```
Read INTERFACE.md, KNOWLEDGE.md, STYLE-REFERENCE.md and LEO.md in this repo. INTERFACE.md is the contract: use its exact object fields, ending codes and component codes. Work only on the `leo` branch and only in
modules/ and DEMO-SCRIPT.md.

1. Write modules/engines.js exactly to the interface in LEO.md: our real hybrid profile from KNOWLEDGE.md §1,
   a 15-degree conical nozzle, a large Rao-style bell nozzle (parabolic approximation, 80 percent length),
   a small pressure-fed kerosene / liquid oxygen engine, and randomEngine(seed) using a seeded PRNG that
   varies contraction ratio, characteristic length, expansion ratio and bell fraction — and deliberately
   produces a bad design about one time in three. Pure functions, millimetres, no DOM.
2. Write modules/preview.html: a single self-contained page that draws every engine profile side by side on a
   Canvas 2D in the dark control-room palette from STYLE-REFERENCE.md, with a button that rolls new random
   engines, so I can see the shapes are right.
3. Write modules/cards.js exactly to the interface in LEO.md: one teaching card per component in
   KNOWLEDGE.md §3 and one incident report per ending. Plain English a twelve-year-old can follow, two
   sentences maximum per field, every "without" grounded in KNOWLEDGE.md — do not invent reasons.
4. Draft DEMO-SCRIPT.md: a two-minute English demo script, 90 seconds of speech, that blows the engine up
   twice on purpose and then runs it clean. Leave every number as ____ to be filled from the screen later.

Commit and push after each of the four steps.
```

## 優先順序(只剩一小時)

1. `modules/cards.js` — **最先做、18:50 前 push**。這是主線最需要、也最不會出錯的一塊。
2. `modules/engines.js` + `preview.html` — 19:00 前 push。
3. `DEMO-SCRIPT.md` — 19:00 之後寫,19:20 從畫面抄數字。

每一塊做完就 push,不要等全部好。

## 19:00 怎麼合

Frank 這邊的 fixer 把 `modules/cards.js`、`modules/engines.js` 的內容**整段貼進** `engine.html` 的 `<script>` 開頭,
取代主線自己生的簡版。成品仍然是單一檔案、零外部資源。你那邊沒好的模組就不合,主線用自己的。
