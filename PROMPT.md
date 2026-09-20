# PROMPT — 主提示詞 v4(18:30 定稿用)

v4 的改動:**狀況(會爆、點不著)是主角,參數退到配角**;加入引擎形狀選擇與隨機引擎;
介面骨架明講向官方 Engine Lab 學(見 `STYLE-REFERENCE.md`);熱化學標示 NASA CEA 來源。

```
Build me an online rocket engine simulator: an interactive, visually stunning test stand where I operate a real engine start sequence, and where it can genuinely go wrong — it may refuse to light, it may chug, it may explode — all from first principles.

The default engine is real: our student team's 350 N paraffin and gaseous-oxygen hybrid. Let me also choose other engines for the same stand: a classic conical nozzle, a large bell nozzle like the ones everybody has seen on launch vehicles, a small pressure-fed liquid oxygen and kerosene engine, and a "random engine" button that generates a new chamber and nozzle shape each time — some of them bad designs that will overpressure, separate or fail to light.

Draw the stand as one big animated piping diagram wrapped around a cutaway of the engine, like a control-room mimic panel readable from across a room: oxygen bottle and regulator, relief valve and burst disc, manual isolation valve, filter, a slow-opening main valve, a nitrogen purge line with two check valves in series, a fail-open vent, igniter, ARM key, and gauges on the bottle, the manifold and the chamber. Fluid visibly moves through the pipes, coloured by what it is; valves turn when I click them; gauges swing. Draw the engine in millimetres from its real profile — ours is chamber 80 bore by 140 long, grain 76 outer with a 25 port and 120 long, convergent 31.75, throat 16.51, divergent 15.15, exit 26.66 — and draw the plume from the physics: shock diamonds whose spacing follows exit Mach number, a plume that pinches when over-expanded and balloons when under-expanded, and flow separation inside a bell that is too big for sea level.

Compute it live, simply but honestly, nothing pre-computed: a small lumped network of volumes joined by valves and orifices; fuel regression r_dot = a * G_ox^n with the oxidizer-to-fuel ratio drifting as the port opens; chamber pressure from the mass balance through a choked throat; thrust from the ideal-rocket relations. Take characteristic velocity, gamma and flame temperature as functions of O/F from curve fits to published NASA CEA equilibrium results, and say so on screen in a small "thermochemistry" readout — labelled as CEA-derived fits, not as a live CEA run.

The situations are the point. Each must arise from the equations and the order I do things in, not from a script: igniter fired with no oxidizer, or mixture outside the flammable range, so it does not light — and then the 30-minute misfire rule; oxygen opened before the igniter, so a hard-start spike; main valve snapped open into a line not pre-charged with nitrogen, so adiabatic compression T2 = T1 * (P2/P1)^((gamma-1)/gamma) lights the line; injector pressure drop under 20 percent of chamber pressure, so it chugs; throat too small for the flow, so the chamber bursts past its design pressure; burn too long, so the grain burns through to the wall; no purge after shutdown, so the flame creeps back into the injector; regulator failure, so the relief valve lifts; power cut, so the fail-safe valve positions save the stand. A clean run is also an ending, with a report card. Every failure plays out on screen — flash, debris, smoke, silence — then freezes into a short incident report: what happened, the number that crossed the line, and the step that would have prevented it.

Every control teaches. Hovering or operating any valve, switch or gauge shows a short plain-language card: what it is for, and what goes wrong without it.

Two modes: a guided countdown through the real sequence — purge, close vent, final go / no-go, ARM key, igniter, chamber pressure confirms ignition, main valve ramp, burn, shutdown, purge, vent, key out — and free play where I may do anything in any order. ABORT is always live.

Beside the view, plot chamber pressure, thrust and bottle pressure against time, with a small verification table comparing the running simulation against independent answers, green within one percent: port radius integrated versus its closed form, fuel burned versus paraffin missing from the grain geometry, oxygen drained versus integrated valve flow. Every row must be able to fail.

Synthesize engine sound from chamber pressure with the Web Audio API, starting muted. Add a SHOW THE PROMPT button that displays this exact prompt. Build it as a single self-contained HTML file with no external libraries or assets, drawn with Canvas 2D in a dark control-room style, running at 60 fps, with clean, correct code that works perfectly the first time it is opened.
```

## 關於「NASA CEA」:畫面上能講到哪裡

NASA CEA 是一支化學平衡求解器(最小化 Gibbs 自由能),不是一條公式。
90 分鐘內要在瀏覽器裡重寫一個可信的平衡求解器風險太高,而且我手上沒有 CEA 的實際輸出可以對帳。

所以提示詞寫的是:**c\*、γ、火焰溫度對 O/F 的曲線,取自已發表的 NASA CEA 結果做曲線擬合;
噴嘴性能用 CEA 同一套理想火箭關係式。** 畫面標示為「CEA-derived fits」,不標「live CEA」。
這符合 PLAYBOOK 審查規則 7(不做排他宣稱):被懂行的評審問到,講得出來、站得住。

如果衝刺順利、19:00 還有餘裕,加分項是一個小型平衡求解器(CO₂/CO/H₂O/H₂/O₂/OH/H/O 八物種),
到時再另下一輪提示詞。

## 定稿前只准做一件事:刪

候選刪除順序(由先到後):液氧煤油引擎 → 聲音 → 驗證表第三列 → 引導模式。
**「狀況」那一段和「隨機引擎」不刪,那是這個作品的靈魂。**
