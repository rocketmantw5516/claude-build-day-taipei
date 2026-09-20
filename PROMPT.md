# PROMPT — 主提示詞(草稿 v3,18:15 討論用)

風格對齊官方三個範例:連續口語段落、演算法只點名一次、禁止預先算好、單檔 HTML。
上台秀的「my prompt」就是這一段。討論時只准做一件事:**刪**。

```
Build me an interactive, visually stunning rocket engine test stand, from first principles. The engine on it is real: our student team's 350 N paraffin and gaseous-oxygen hybrid. I also want to swap it, on the same stand, for a small pressure-fed liquid oxygen and kerosene engine.

Draw the whole stand as one big animated piping diagram wrapped around a cutaway of the engine, like a control-room mimic panel readable from across a room: oxygen bottle and regulator, relief valve and burst disc, manual isolation valve, filter, a slow-opening main valve, a nitrogen purge line with two check valves in series, fail-open vent, igniter, ARM key, and pressure gauges on the bottle, the manifold and the chamber. Fluid must visibly move through the pipes, coloured by what it is; valves turn when I click them; gauges move. Use our real engine profile for the cutaway, in millimetres: chamber 80 bore by 140 long, paraffin grain 76 outer, 25 port, 120 long, convergent 31.75, throat 16.51, divergent 15.15, exit 26.66.

Compute it live, simply but honestly, nothing pre-computed: pressures in a small lumped network of volumes joined by valves and orifices with choked or incompressible flow as appropriate; paraffin regression r_dot = a * G_ox^n with the oxidizer-to-fuel ratio drifting as the port opens; chamber pressure from the mass balance through a choked throat; thrust from isentropic nozzle flow. For the liquid engine: two pressurised tanks, injector flow from Cd * A * sqrt(2 * rho * dP), boil-off, and line chilldown.

Every control teaches. When I hover or operate any valve, switch or gauge, show a short card in plain words: what it is for, and what goes wrong without it. Then let it actually go wrong, from the equations: open the main valve fast into a line that was not pre-charged with nitrogen and compute the adiabatic compression temperature T2 = T1 * (P2/P1)^((gamma-1)/gamma); open oxygen before the igniter and get a hard-start pressure spike; let injector pressure drop fall under 20 percent of chamber pressure and watch it chug; skip the purge after shutdown and let the flame creep back into the injector; cut the power and watch the fail-safe positions save the stand. Each failure freezes into a short incident report: what happened, the number that crossed the line, and the step that would have prevented it.

Give me two modes: a guided countdown through the real sequence — purge, close vent, final go / no-go, ARM key, igniter, chamber pressure confirms ignition, main valve ramp, burn, shutdown, purge, vent, key out — and free play where I can do anything in any order. An ABORT button is always live.

Beside the view, plot chamber pressure, thrust and bottle pressure against time, and show a verification table where each row compares the running simulation against an independent answer with the percentage difference, green within one percent: port radius integrated step by step versus its closed-form solution, fuel burned versus paraffin actually missing from the grain geometry, oxygen drained from the bottle versus integrated valve flow, and thrust from momentum plus pressure versus C_f * Pc * A_throat. Every row must be able to fail; never compute one side from the other.

Synthesize the engine sound from chamber pressure with the Web Audio API, starting muted. Build it as a single self-contained HTML file with no external libraries or assets, make it run at 60 fps, and keep the code clean and correct so it works perfectly the first time it is opened.
```

## 討論時要決定的三件事

1. **兩種引擎都要,還是先只做混合式?** 液氧煤油的數字是教科書量級、不是我們的數據。
   90 分鐘內兩種都做完的風險最高就在這裡。建議:主提示詞保留,但 workflow 的驗收先只驗混合式,
   液體構型當加分項,19:00 沒好就整段拿掉。
2. **失敗結局要幾個?** 現在列 5 個。絕熱壓縮和硬啟動最有戲、公式最乾淨,這兩個是底線。
3. **介面語言。** demo 講英文 → 介面英文;教學卡片可以中英並列。
