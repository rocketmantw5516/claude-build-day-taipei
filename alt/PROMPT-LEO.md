# PROMPT-LEO — 備案版提示詞(Leo 這台跑;同一個目標,為「一次就開得起來 + 台上好演」調過)

對主線 `PROMPT.md` v4 的調整(依官方三段提示詞的寫法:短、具體、每段一個目的、有「自己證明算對」的表):

1. **刪** 液氧煤油引擎(主線自己列的第一順位刪除項)→ 管路圖只畫一套,成功率上升。
2. **加** SCENARIOS 一鍵情境:只幫你把「犯錯前一刻」的條件擺好、替你按下那個錯的動作,結局仍由方程式算出 → 台上 2 分鐘「炸兩次 + 乾淨跑一次」不靠手速。
3. **加** AUTO-RUN:整套正確程序自動走一遍(官方星系範例的「start running immediately」)。
4. **加** BREAK THE PHYSICS 開關:時間步長 ×50,驗證表必須變紅 → 當場證明那張表不是裝飾(PLAYBOOK 審查規則 2)。
5. 其餘(十個結局、教學卡片、隨機引擎、CEA-derived fits、聲音、SHOW THE PROMPT)與主線相同,接縫與代號照 `INTERFACE.md`。

```
Build me an online rocket engine test stand: an interactive, visually stunning simulator where I run a real engine start sequence and where it can genuinely go wrong — it may refuse to light, it may chug, it may explode — all computed live from first principles, and readable from across a room.

The default engine is real: our student team's 350 N paraffin and gaseous-oxygen hybrid. Let me swap in a classic 15-degree conical nozzle, a large bell nozzle like the ones on launch vehicles, and a "random engine" button that invents a new chamber and nozzle each time — about one in three of them a bad design that will overpressure, separate or fail to light.

Draw the stand as one big animated piping diagram wrapped around a cutaway of the engine, like a control-room mimic panel: oxygen bottle and regulator, relief valve and burst disc, manual isolation valve, filter, a slow-opening main valve, a nitrogen purge line with two check valves in series, a fail-open vent, igniter, ARM key, and gauges on the bottle, the manifold and the chamber. Fluid visibly moves through the pipes, coloured by what it is; valves turn when I click them; gauge needles swing. Draw the engine in millimetres from its real profile — chamber 80 bore by 140 long, grain 76 outer with a 25 port and 120 long, convergent 31.75, throat 16.51, divergent 15.15, exit 26.66 — with the fuel port visibly widening as it burns, and draw the plume from the physics: shock diamonds spaced by exit Mach number, a plume that pinches when over-expanded and balloons when under-expanded, and flow separating inside a bell too big for sea level.

Compute it live, simply but honestly, nothing pre-computed: a small lumped network of volumes joined by valves and orifices; fuel regression r_dot = a * G_ox^n with the oxidizer-to-fuel ratio drifting as the port opens; chamber pressure from the mass balance through a choked throat; thrust from the ideal-rocket relations. Take characteristic velocity, gamma and flame temperature as functions of O/F from curve fits to published NASA CEA equilibrium results, and say so on screen in a small "thermochemistry" readout labelled CEA-derived fits, not a live CEA run.

The situations are the point, and each must arise from the equations and the order I do things in, never from a script: igniter fired with no oxidizer or a mixture outside the flammable range, so it does not light, and the 30-minute misfire rule starts; oxygen opened before the igniter, so a hard-start spike; main valve snapped open into a line not pre-charged with nitrogen, so adiabatic compression T2 = T1 * (P2/P1)^((gamma-1)/gamma) lights the line; injector pressure drop under 20 percent of chamber pressure, so it chugs; throat too small for the flow, so the chamber bursts; burn too long, so the grain burns through to the wall; no purge after shutdown, so flame creeps back into the injector; regulator failure, so the relief valve lifts; power cut, so the fail-safe valve positions save the stand. A clean run is also an ending, with a report card. Every failure plays out on screen — flash, debris, shockwave, smoke, silence — then freezes to grey and slides in a short incident report: what happened, the number that crossed the line, and the step that would have prevented it.

Every control teaches: hovering or operating any valve, switch or gauge shows a short plain-language card — what it is for, and what goes wrong without it.

Start alive and safe the moment the page opens, framed to fit one screen with no scrolling. Give me a guided countdown through the real sequence — purge, close vent, go / no-go, ARM key, igniter, chamber pressure confirms ignition, main valve ramp, burn, shutdown, purge, vent, key out — where Space performs the next step and doing things out of order is allowed and has consequences; free play where I may do anything; an AUTO-RUN button that flies the whole clean sequence hands-free; and a row of SCENARIOS that set up the moment just before each classic mistake and then make it for me, so the outcome still comes out of the physics. ABORT is always live. Time runs at 1x, 1/4x or 1/20x so a failure can be watched in slow motion.

Beside the view, plot chamber pressure, thrust and bottle pressure against time, with a small verification table comparing the running simulation against independent answers, green within one percent: port radius integrated versus its closed form, fuel burned versus paraffin missing from the grain geometry, oxygen drained from the bottle versus integrated valve flow. Every row must be able to fail — add a BREAK THE PHYSICS switch that multiplies the time step by fifty and turns rows red.

Synthesize engine sound from chamber pressure with the Web Audio API, starting muted. Add a SHOW THE PROMPT button that displays this exact prompt. Build it as a single self-contained HTML file with no external libraries or assets, drawn with Canvas 2D in a dark control-room style, running at 60 fps, with clean, correct code that works perfectly the first time it is opened.
```
