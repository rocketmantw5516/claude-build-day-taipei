# Build Day 提示詞 v2 — 官方範例語感版

原則:一段提示詞進去,一個 HTML 出來。現場從空資料夾開始。
第 1 輪 = 作品本體(上台時展示的「my prompt」就是這段)
第 2 輪 = 只在需要時用的修正

---

## 第 1 輪:主提示詞(18:00 原封不動貼上)

```
Build me an interactive, visually stunning simulation of a hybrid rocket motor, from first principles. It is a real engine: our student team's 350 N paraffin and gaseous-oxygen hybrid, built for the Taiwan Cup 3 km rocket competition.
Compute the burn live: the paraffin grain regressing as r_dot = a * G_ox^n, the oxidizer-to-fuel ratio drifting as the port opens up, chamber pressure from the mass balance through a choked throat, and thrust from isentropic nozzle flow. Nothing pre-computed; every curve must fall out of the integration.
Draw the motor as a big animated cutaway, like a test-stand console readable from across a room: injector, fuel grain with its port visibly widening as it burns, flame, nozzle, and a plume with shock diamonds. Next to it draw thrust and chamber pressure against time as the burn happens.
Beside the view show a live verification table where each row compares the running simulation against an independent answer, with the percentage difference, highlighting a row green when they agree within one percent: port radius (integrated step by step versus the closed-form solution r^(2n+1) = r0^(2n+1) + (2n+1) * a * (m_dot_ox/pi)^n * t, restarted whenever I move the oxidizer slider), fuel burned (integrated mass flow versus paraffin actually missing from the grain geometry), thrust (momentum plus pressure form versus C_f * Pc * A_throat), and flight energy (work done by thrust minus drag losses versus kinetic plus potential energy gained). Every row must be able to fail: never compute one side from the other. Also show total impulse and the O/F ratio with its drift since ignition.
Then feed the live thrust curve into a one-dimensional flight of our rocket — 28.5 kg at liftoff, 155 mm diameter, real drag and a standard atmosphere — with an altitude tape, a big apogee readout, and the 3,000 m competition target marked.
Give me an ignite button, sliders for oxidizer flow, throat diameter and grain length, a 1x / 1/4x / 1/20x time control, and motor sound synthesized from chamber pressure with the Web Audio API, starting muted.
Defaults: oxidizer flow 0.095 kg/s, initial port diameter 25 mm, throat sized so chamber pressure settles near 11.6 bar.
Build it as a single self-contained HTML file with no external libraries or assets, make it run at 60 fps, and keep the code clean and correct so it works perfectly the first time it is opened.
```

---

## 第 2 輪:備用修正(看第一版狀況挑一個貼,一次只貼一個)

**A. 驗證表沒變綠 / 數字對不上**
```
The verification rows do not agree within one percent. Find out why from the equations, not by tuning constants, fix the root cause, and tell me what was wrong.
```

**B. 到不了 3,000 m(或高得離譜)**
```
Keep the physics untouched. Add a "size for 3 km" button that searches grain length and burn time for the smallest motor that reaches 3,000 m, and animates the search.
```
(這反而是更好的 demo 結尾:引擎自己把自己設計到過關)

**C. 不夠好看**
```
The physics is right; now make it beautiful. Treat it as a museum exhibit of a test-stand console: stronger glow and heat colour in the chamber, shock diamonds in the plume, larger type for the numbers that matter, and nothing on screen that does not earn its place.
```

**D. 加 SHOW THE PROMPT 按鈕(建議最後一定做)**
```
Add a small "SHOW THE PROMPT" button in the corner that opens a panel with the exact prompt that generated this page, with a copy button.
```
(跟官方三個 demo 同款;上台時按一下,直接呼應「帶著你的 prompt」這個主題)
