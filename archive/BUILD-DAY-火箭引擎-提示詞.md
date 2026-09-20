# Claude Code Build Day — 參賽包

**題目:** Hybrid Rocket Motor Lab — 石蠟/GOX 混合式火箭引擎,從第一性原理
**賽道:** Breakthrough
**基礎資產:** `rtc_rocket`(2026 台灣盃 3K 火箭)+ `astronauts91`(350N 引擎與試車台)
**交付:** 單一 self-contained HTML

---

## 一、主提示詞(18:00 貼這一段,原封不動)

```
Build me an interactive, visually stunning simulation of a PARAFFIN/GOX HYBRID
ROCKET MOTOR, from first principles. This is a real engine: a 350 N-class hybrid
built by a student team for the 2026 Taiwan Cup 3 km rocket competition.

VISUAL STANDARD
Draw the motor as a big animated cutaway — oxidizer tank, injector plate, the
pre-combustion chamber, the cylindrical paraffin fuel grain with its central
port, the flame front, the post-combustion chamber, and a converging-diverging
nozzle with visible shock diamonds in the plume. Make it look like an aerospace
test-stand console: dark, precise, instrument-like, readable from across a room.
As the burn proceeds, the fuel grain port must visibly regress outward and the
grain visibly thin, because that is what the physics says happens.

COMPUTE IT LIVE — NO PRE-COMPUTED CURVES
Integrate the whole burn in real time:
- Fuel regression with the classical hybrid law r_dot = a * G_ox^n, where
  G_ox = m_dot_ox / (pi * r_port^2). Use paraffin values a = 0.155, n = 0.5 (SI).
- Fuel mass flow m_dot_f = rho_fuel * 2*pi*r_port*L_grain * r_dot, with
  rho_fuel = 900 kg/m^3.
- Chamber pressure from the mass balance through a choked throat:
  Pc = m_dot_total * c_star / A_throat.
- c_star as a function of the instantaneous O/F ratio, using a smooth curve
  peaking near O/F = 8 for paraffin/GOX (peak c_star about 1600 m/s), with a
  combustion efficiency eta_c_star = 0.92.
- Nozzle performance from isentropic relations: solve the area-Mach relation for
  the exit Mach number, then exit velocity, exit pressure, and
  F = m_dot_total * V_e + (P_e - P_ambient) * A_e.
- Ambient pressure from a standard atmosphere model as the vehicle climbs.
Do not use lookup tables of thrust versus time. Everything must fall out of the
integration.

LIVE VERIFICATION LEDGER — this is the most important panel
Beside the cutaway, show a table where each row is a quantity computed two
independent ways, with the percentage difference, and the row turns green when
the two agree within one percent:
1. Thrust: momentum+pressure form  m_dot*V_e + (P_e-P_a)*A_e   versus
   coefficient form  C_f * Pc * A_throat.
2. Characteristic velocity: measured  Pc * A_throat / m_dot_total   versus the
   O/F curve value times eta_c_star.
3. Specific impulse: F / (m_dot_total * g0)   versus   C_f * c_star / g0.
4. Mass conservation: the time-integral of m_dot_f   versus   the paraffin
   actually removed from the grain, computed from the swept annulus geometry.
Also show total impulse as a running integral of thrust, and the O/F ratio with
its drift since ignition — hybrids shift O/F as the port opens up, and I want to
see that happening.

FLIGHT RESULT — the payoff
Feed the live thrust curve into a one-degree-of-freedom flight simulation of the
vehicle: 28.5 kg liftoff mass, 155 mm diameter, Cd = 0.45, with gravity, a
standard atmosphere, and drag. Show an altitude tape climbing beside the motor
and a large APOGEE readout. The competition target is 3,000 m — mark that target
line clearly and show whether this design makes it.

INTERACTION
Let me drag sliders for oxidizer mass flow, throat diameter, nozzle expansion
ratio, and grain length, and see the whole solution and the predicted apogee
respond immediately. Let me press a button to ignite, and a button to run the
burn at 1x, 1/4x and 1/20x. Let me click any verification row to expand the two
formulas it is comparing, with the live numbers substituted in.

SOUND
Synthesize the motor roar with the Web Audio API from the simulation itself —
filtered noise whose intensity tracks chamber pressure and whose spectrum shifts
with mass flow. Give me a mute toggle, and start muted.

DELIVERY
Create it as one self-contained HTML file, no external libraries or assets.
Start with the console live and framed to fit, run at 60 fps, and keep the code
clean and correct so it works perfectly the first time it is opened.
```

---

## 二、真實參數(第一輪跑完之後,用這些取代預設值)

出處:`astronauts91/design/ENGINE_OXIDIZER_DECISION_20260811.md`、
`astronauts91/design/teststand/00_overview_plain.md`、`rtc_rocket/RocketParams.json`

| 項目 | 真值 | 出處 |
|---|---|---|
| 推力級別 | 350 N | 試車台 00 |
| 氧化劑 | GOX(N2O 已 NO-GO) | 氧化劑決策 |
| `ṁ_GOX` | 0.095 kg/s | 決策報告 |
| `Pc` 工作點 | 10.0 bar / 11.6 bar | 決策報告 |
| 燃料柱初始內徑 | Ø25 mm(`GrainID/2 = 12.5`) | `PhaseLid.cs:163` |
| 噴注剛度 ΔP | 24.6–31.4 % Pc(通過 20% 門檻) | 決策報告 |
| 整箭總長 | 2,700 mm | `RocketParams.json` |
| 箭體外徑 | 155 mm | `RocketParams.json` |
| 總重限制 | < 28.5 kg | `rtc_rocket/README.md` |
| 目標高度 | ≥ 3,000 m | 同上 |
| 終端速度 | < 12 m/s | 同上 |

第二輪提示詞就一句:
> Set the defaults to our real engine: oxidizer mass flow 0.095 kg/s, initial
> port diameter 25 mm, and size the throat so chamber pressure settles near
> 11.6 bar. Label the console "Astronauts91 · V30 · 350 N".

---

## 三、2 分鐘 Demo 腳本(英文)

> 90 秒講完,留 30 秒緩衝。不要解釋物理,只講「這是真的」。

**0:00–0:20 — 你是誰,這是什麼**
> "We're a student rocket team. This is our actual engine — a 350-newton
> paraffin-and-oxygen hybrid we're flying at the Taiwan Cup this year.
> Tonight we asked Claude to rebuild it from the equations, in one HTML file."

*(按 IGNITE。火焰起來、噴流出現、聲音打開兩秒再關掉。)*

**0:20–0:50 — 指著燃料柱**
> "Watch the fuel grain. The port is opening up as it burns — that's the
> regression law solving live. And because the port is opening, the
> oxidizer-to-fuel ratio is drifting. That drift is the thing that makes
> hybrids hard, and nobody hard-coded it. It falls out of the integration."

**0:50–1:20 — 指著驗證表(核心)**
> "This panel is why you should believe it. Every row is one quantity computed
> two independent ways. Thrust from momentum and pressure, versus thrust from
> the coefficient form. Measured c-star versus theoretical. Mass flow integrated
> over time, versus paraffin physically removed from the grain geometry.
> They agree to under one percent. The simulation is checking itself."

**1:20–1:45 — 結尾**
> "And then we feed that thrust curve into the flight model — 28.5 kilos,
> 155 millimetres, real drag."

*(高度條爬升,停住。)*

> "Three thousand and forty metres. Competition minimum is three thousand.
> One prompt, one file, ninety minutes — and it tells us our engine makes it."

---

## 四、90 分鐘時程

| 時間 | 做什麼 |
|---|---|
| 18:00–18:05 | 貼主提示詞,跑。**這段不要動它。** |
| 18:05–18:30 | 第一版出來。只做兩件事:開得起來嗎?驗證表有沒有變綠? |
| 18:30–18:45 | 貼真實參數(第二節),重跑 |
| 18:45–19:10 | 只修兩類問題:**數字對不上**、**不夠好看**。每次一個要求,不要一次給五個 |
| 19:10–19:20 | **凍結程式碼。** 存檔,關掉編輯器 |
| 19:20–19:30 | 兩人各練一次腳本、計時。Leo 操作 / 你講,或反過來 |

**鐵律:19:10 之後一行都不改。** demo 當掉比少一個功能慘十倍。

---

## 五、退路

驗證表如果一直對不上(通常是噴嘴出口馬赫數解錯):

> "Drop the flight simulation and the sound. Focus everything on making the four
> verification rows correct and the cutaway beautiful."

砍掉飛行模擬,剩下的還是一個完整、會自我驗證、很好看的引擎 demo。腳本的 0:20–1:20
那段照講,結尾改成:

> "One prompt, one HTML file, and it checks its own physics to under one percent."

---

## 六、備案題目(如果現場公布的賽道讓火箭不適合)

**drone91 收斂器搬進瀏覽器** —— 拉任務滑桿(酬載、航程、滯空),
即時看重量螺旋一圈一圈收斂,驗證表比對「動量理論預測的懸停功率」vs
「收斂結果的實際功率」。一樣是第一性原理 + 自我驗證,一樣是你們獨有的東西。
