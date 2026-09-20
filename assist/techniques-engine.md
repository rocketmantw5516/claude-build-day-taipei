# Techniques from ref-engine.html (Engine Lab)

Line numbers refer to `assist/ref/ref-engine.html`. [KNOWN] = already in STYLE-REFERENCE.md, [NEW] = not there.
Corrections to STYLE-REFERENCE.md: the ref uses NO `globalCompositeOperation` anywhere and NO particle pool; the RPM gauge IS inline SVG (not canvas).

## Rendering

- [KNOWN] Three canvases, one job each; DOM only for chrome (L613, L660, L668).
- [NEW] `mkCanvas(id)` (L1061-1073): returns `{el,ctx,w,h,dpr}`; sizes from the PARENT's `getBoundingClientRect()`, watched by `ResizeObserver` on the parent (not window resize). Canvas is `position:absolute; inset:0; width/height:100%` inside a `.cv {position:relative; flex:1; min-height:0}` (L230-242) so the flex/grid layout drives size and the canvas never pushes layout.
- [NEW] DPR is capped: `o.dpr = Math.min(devicePixelRatio||1, 2)` (L1066). Backing store = CSS size x dpr (L1068). STYLE-REFERENCE only says "handled".
- [NEW] `begin(o)` (L1074): every frame `setTransform(dpr,0,0,dpr,0,0)` then `clearRect` in CSS px. All draw code then works in CSS px; no accumulated transforms.
- [KNOWN] Real units: geometry constants in mm (L1097-1102). [NEW] detail: fit scale `s = min(availW/modelW, availH/modelH)` (L1118), static housing drawn in px with `*s`, then per-unit `ctx.save(); translate(xc,crankY); scale(s,s)` (L1152-1153) so moving parts are drawn in raw mm, including lineWidths in mm. `restore()` per unit.
- [KNOWN] `rr()`, `vgrad()`, `hgrad()` helpers (L1075-1090). [NEW] detail: grads take a stops array `[[0,'#..'],[1,'#..']]`; metal look = 4-stop horizontal gradient dark-light-mid-dark (L1200); liner highlight = transparent gradient with 6% white edges overlaid on the cavity (L1165).
- [KNOWN] State-driven gas colour `gasColour(c)` (L1104-1113). [NEW] detail: it lerps cool colour -> hot colour by T, and alpha by sqrt(density); returns an rgba string. Same idea works for our chamber/plume colour vs Tc, O/F.
- [NEW] Flame = radial gradient drawn INSIDE a clip rect (L1169-1185): `ctx.rect(...); ctx.clip()` then fillRect the whole region with a 4-stop gradient (white core -> amber -> orange -> transparent); radius grows with sqrt(burn fraction), intensity alpha from heat-release rate, flicker `1+0.06*sin(performance.now()*0.05+k)`. No particles, no `lighter`.
- [NEW] Spark (L1187-1194): small white-blue radial gradient + 6 short white line rays whose angle is keyed to phase; shown only in a narrow window of the state variable.
- [NEW] Glow on a line: `shadowColor` + `shadowBlur=8` for the live trace only, then reset `shadowBlur=0` immediately (L1343). Trace head = small radial-gradient dot (L1345-1346). shadowBlur is used exactly once in the whole file (it is expensive).
- [NEW] Active-flow port glow (L1231-1242): draw the pipe twice on the same path: thick dark stroke (lineWidth 19), then thinner coloured stroke (11) with `globalAlpha = 0.25+0.6*active`. Cheap "fluid in pipe" look; combines well with our lineDashOffset idea.
- [NEW] Puffs, not a pool (L916, L1290-1299): sim pushes `{k,t,a}` on an event, hard cap `if (S.puffs.length < 48)`; draw loop iterates backwards, ages by real dt, `splice` when t>0.7; each is one radial gradient whose radius grows and alpha fades with u=t/life. In the audio synth, removal is swap-with-last + pop (L985) - use that form for our particles.
- [NEW] Auto-ranging chart axes with easing: `S.pAxis += (target - S.pAxis)*0.08` (L1309-1310, L1359); grid step chosen from range (L1316). Axis never jumps.
- [NEW] Chart data stored as flat interleaved array `[x,y,x,y...]`, pushed only every 0.5 deg of progress (L925-928); previous cycle kept and drawn filled with `fill('evenodd')` under the live one (L1329-1337).
- [NEW] Fixed-size `Float32Array(720)` ring indexed by angle for the strip chart (L868, L931-932); positive/negative areas filled in two colours, dashed green mean line, white cursor line (L1371-1386).
- [NEW] Gauge is inline SVG arc (L628-641): track/redline/fill paths built once by `arcPath()` (L1394-1399); value shown via `stroke-dasharray = "frac*len len"` (L1419); fill stroke uses an SVG linearGradient cyan->amber; big number is a DOM `<b>` centred over it.

## UI chrome

- [KNOWN] Layout grid, palette, fonts (L9-45, L173-178). [NEW] body background is a radial gradient `radial-gradient(1200px 700px at 20% -10%, #141c2f, var(--bg) 60%)` (L37); panels are `linear-gradient(panel,panel2)` + 1px line border + radius 16 + big soft shadow (L180-190).
- [NEW] PROMPT dialog structure (L598-609): native `<dialog id=promptDlg>`; head row = title+subtitle div (flex:1), `Copy prompt` button, `CLOSE` pill; body = `<pre id=promptText>` with `white-space:pre-wrap; user-select:all` (L161-171) so one click selects all. Prompt text lives in the HTML, not in JS.
- [NEW] Dialog styling (L124-137): `padding:0; width:min(720px,92vw)`, gradient bg, `dialog::backdrop {background:rgba(3,5,10,.7); backdrop-filter:blur(4px)}`.
- [NEW] Open/close with fallback (L1471-1475): `showModal()` if it exists else `setAttribute('open','')`; close guarded by `dlg.open`; backdrop click closes via `if (e.target === dlg)`. Esc is free from native dialog.
- [NEW] Copy (L1476-1488): `await navigator.clipboard.writeText(text)`; on throw (file://, no permission) fall back to Range-select the `<pre>` + `document.execCommand('copy')`. Button text becomes `Copied` / `Select and copy manually`, toggles `.on` (amber), reverts after 1800 ms.
- [NEW] Keyboard handler bails when dialog is open and when focus is in a non-range input (L1490-1498); arrows nudge the slider value then call the stored `apply` fn returned by `bindRange`.
- [NEW] Readout tiles `.card` (L328-362, L645-650): 3-col grid; uppercase 10.5px letter-spaced `<label>`, mono 19px `<b>` value with a nested muted `<small>` unit; `white-space:nowrap; min-width:0`.
- [KNOWN] textContent updates. [NEW] detail: two update rates (L1415-1437): per-frame for fast things (rpm, phase tag, live work), and a `uiTimer` accumulator that refreshes the tiles only every 0.1 s so digits are readable. `fmt()` returns an en dash for NaN (L713) so tiles show "-" before the first cycle.
- [KNOWN] `bindSeg` (L1457-1464). [NEW] detail: one delegated click listener on the container, `e.target.closest('button')`, toggles `.on` across `seg.children`, value read from `data-*`. CSS: pill container with 3px padding, `.on` = gradient + inset 1px ring (L458-485).
- [KNOWN] Slider `--c` colour. [NEW] the fill trick: `--v` percent set from JS in `bindRange` (L1446) and track = `linear-gradient(90deg, var(--c) var(--v), #232d44 var(--v))` (L418); Firefox uses `::-moz-range-progress` (L438); thumb glow `box-shadow: 0 0 14px color-mix(in srgb, var(--c) 60%, transparent)` (L429); per-slider colour via inline `style="--c:#5fd3ff"` (L680). `bindRange` calls `apply()` once at bind time so UI and state start in sync, and returns `apply`.
- [NEW] Slider label row: `<label>Name <output id=..></output></label>` with `justify-content:space-between` (L381-393, L675).
- [NEW] Hint overlay (L514-529, L699): plain footer div `margin-left:auto`, muted 11px, `<kbd>` styled with thicker bottom border; hidden under 960px. Canvas overlays are absolutely positioned DOM: `.legend` top-left with `pointer-events:none` (L244-262), `.crank` info bottom-right (L264-277).
- [NEW] Status word (L80-106, L591-594, L1413-1422): `.tag` pills in header. Phase tag: table `PHASES=[[word,colour],...]`, per frame set `textContent` + `style.background`. Alarm tag: `.tag.warn` red with `animation: blink .5s steps(2) infinite`, shown by toggling the `hidden` attribute from sim state (`$('limiter').hidden = !S.fuelCut`). FPS tag updated every 0.5 s (L1515-1516).
- [NEW] Toggle button state = `.btn.on` amber gradient + `.dot` using `currentColor` (L487-512).

## Audio

- [KNOWN] AudioWorklet with ScriptProcessor fallback exists. Everything below is [NEW].
- One synth class, two hosts: the DSP lives in a plain class inside a template string `SYNTH_SRC` (L958-1002) with `set(p)` and `process(L,R)`; a second string `WORKLET_WRAP` (L1003-1008) subclasses `AudioWorkletProcessor`, forwards `port.onmessage -> synth.set`, and calls `registerProcessor('exhaust', ...)`.
- Loading without an external file (L1021-1023): `addModule('data:application/javascript;charset=utf-8,' + encodeURIComponent(src))` first (works from file://), and on failure `addModule(URL.createObjectURL(new Blob([src],{type:'application/javascript'})))`.
- Node: `new AudioWorkletNode(ctx,'exhaust',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]})` -> gain -> destination (L1018, L1024-1025).
- Fallback (L1027-1034): `new Function(SYNTH_SRC + '; return ExhaustSynth;')()` instantiates the SAME class on the main thread; `createScriptProcessor(2048,1,2)` with `onaudioprocess` calling `synth.process(ch0,ch1)`.
- Uniform interface: `audio.send = p => node.port.postMessage(p)` or `p => synth.set(p)` (L1026, L1033). The rest of the app never knows which path is live.
- Unlock by gesture (L1011-1047): AudioContext is created lazily inside the click/keypress handler `toggleSound()`; an `audio.starting` flag blocks double-init during the awaits; outer try/catch sets label `No audio` and returns.
- Mute = `ctx.suspend()` / `ctx.resume()` on toggle (L1043-1046), not gain 0, so zero CPU when off. Button label + `.on` class reflect state. `updateAudio()` early-returns when off (L1049).
- Driving from sim state (L1048-1056, called every frame L1514): posts a small plain object `{rpm, events, strength, vol}`. rpm is multiplied by `C.timeScale` so slow-motion lowers the pitch. `strength` is a smoothed sim quantity (`S.blowAvg`, EMA 0.3 of blowdown pressure, L915). `set()` only overwrites keys that are present (L970-971).
- Volume is smoothed per-sample inside the synth: `this.v += (this.vol - this.v)*0.0004` (L997) -> no clicks on slider move or start. Output soft-clipped `Math.tanh(1.6*y)*v` (L998).
- Synth recipe (L972-1001), reusable for a rocket roar: deterministic LCG noise (L969); excitation -> bank of 5 band-pass biquads at 78/156/310/620/1240 Hz with Q and gain tables (L964-967) + one-pole low-pass rumble (L992) + high-passed hiss scaled by rpm (L995-996) + tanh. For us: drive continuous noise amplitude by Pc/thrust, resonator centre or gain by Pc, add low-freq sine for chugging instability, pulses for hard start/pop.
- Pulse list inside the synth uses swap-remove (L985) and a 50 ms lifetime; pulse shape `u*exp(1-u)` plus decaying noise burst (L983).

## Main loop

- [KNOWN] `dt = clamp((now-last)/1000, 0, 1/20)`, `simulate(dt*C.timeScale)`, draw, readouts (L1506-1518).
- [NEW] Substep count is adaptive, not fixed: `N = ceil(|omega|*dtSim / (1.5 deg))`, clamped 1..1200, `h = dtSim/N` (L886-888). Rule: bound the change of the fastest state per substep. For us: N from the fastest time constant (feed-line/chamber fill), capped.
- [NEW] Draw/particles use REAL dt (`drawEngine(dt)`, `updateReadouts(dt)`), only physics uses scaled dt (L1509-1513). Slow-mo slows the engine, not the UI or puff fade.
- [NEW] Time scale is just a seg button writing `C.timeScale` (1, 0.25, 0.05) (L689-690, L1466). Because N scales with dtSim, slow-mo gets cheaper, not more expensive.
- [NEW] Two plain objects: `C` = control inputs written by UI (L864), `S` = sim state (L865-870). UI never touches S; sim reads C each substep. Matches our two-machine seam.
- [NEW] Events cross sim -> draw/audio via flags consumed once (`c.evoEvent` set in stepCyl L856, consumed L913-917). Edge detection by interval test `th0 < X && th1 >= X` (L850, L854) so no event is missed at large steps.
- [NEW] Stability clamps inside the physics: mass flow limited to half of what would equalise pressure in one step (L781, L785); heat loss limited (L826-827); T clamped 200..4500 (L845); mass floor 1e-7 (L843).
- [NEW] Display smoothing by dt-correct EMA: `S.tauAvg += (x - S.tauAvg)*Math.min(1, h/0.4)` (L941).
- [NEW] Everything in one IIFE with `'use strict'` (L704-705); `requestAnimationFrame(frame)` first call made via rAF so `now` is valid (L1519); FPS counter averaged over 0.5 s.
