# TECHNIQUES — mined from the three official demos (assist/ref/)

Techniques only, no copied code. [KNOWN] = already in STYLE-REFERENCE.md, [NEW] = not. Line numbers refer to assist/ref/ref-*.html.

## Top NEW techniques (ranked for our 19:30 demo)
1. **rAF re-armed on the FIRST line of frame()** (maestro L1069) — an exception mid-frame can never freeze the show. One-line graft, zero risk.
2. **Start gate = audio unlock** (maestro L1112-1119): one click handler runs initAudio → `await ctx.resume()` → hide overlay; Space calls the same function. Audio worklet source lives in a template string, loaded via data:/Blob URL, with a `new Function` ScriptProcessor fallback behind one `audio.send(p)` (engine L958-1056).
3. **Ledger row lifecycle** (aurelith L763-788, L252-263): rows built once, cell refs cached, "timing NN%" capped at 99 → value + signed % diff → one `classList.toggle('agree')`; table refreshed at 10 Hz while canvas runs every frame. Reference has no red state — add `tr.fail`.
4. Edge-detected events `th0<X && th1>=X` + adaptive substeps `N=ceil(rate*dt/limit)` clamped (engine L886-888, L1509-1513): physics gets dt*timeScale, drawing gets real dt.
5. Per-element "energy" `e *= exp(-dt*k)` driving glow/colour (maestro L880-891) — cheap way to make a just-clicked valve or gauge flash and decay.
6. `font-variant-numeric: tabular-nums` on readouts (aurelith L224); slider fill via JS-set `--v` in a linear-gradient track (engine L418/L1446); static background pre-rendered to an offscreen canvas, DPR capped at 2 (aurelith L654-698).
7. Sound→visual sync: scheduling a sound also pushes `{t}` to a queue the frame loop pops (maestro L670, L1080-1087); state→sound via `setTargetAtTime` on one bus gain (click-free).

**Correction to STYLE-REFERENCE.md:** the engine reference uses NO globalCompositeOperation and NO particle pool, and its RPM gauge is inline SVG, not canvas. Additive blending / pooling in our fx.js are our own choice, not the reference's.

---

# Source: ref-engine.html

## Techniques from ref-engine.html (Engine Lab)

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

# Source: ref-aurelith.html

## Techniques from ref-aurelith.html (Aurelith orbital ledger demo)

Source: `assist/ref/ref-aurelith.html` (902 lines). Line numbers refer to it.
[KNOWN] = already in STYLE-REFERENCE.md. [NEW] = not there. Techniques only; do not copy code.

## 1. Table / ledger (maps directly to our VERIFY ledger)

- [NEW] **Build once, cache cell refs.** `buildRows()` (L763-773) creates each `<tr>` one time with empty class-tagged cells
  (`.a .tm .tk .diff`), then stores `{p, tr, a, tm, tk, diff}` in a `rowRefs` array (L771). Rebuild happens ONLY when the
  row set changes (add planet, L640). Per-tick update never touches structure.
- [KNOWN-ish] Updates go through `textContent` on cached cells (L777-778, L787). STYLE-REF says "textContent, no DOM rebuild";
  the cached-ref array is the NEW part.
- [NEW] **Pending state = progress percent in the value cell.** While no measurement exists (`measured == null`, L779):
  `frac = min(0.99, progress)` and cell shows `<span class="pending">timing NN%</span>` (L780-781). Cap at 0.99 so it never
  reads "100%" before the value lands. Diff cell shows an en dash `–` (L782) and the `agree` class is removed (L783).
  `.pending` = muted, italic, smaller font (L297-301) so it visibly differs from a real number.
- [NEW] **Measured value carries a sample count.** After measurement: `12.34<span class="laps">x3</span>` (L786); `.laps`
  is tiny muted text (L303-307). For us: "measured over N s" or "N samples" next to the sim value.
- [NEW] **Row verdict = one classList.toggle.** `tr.classList.toggle('agree', Math.abs(d) < 1)` (L788). All colour is CSS:
  `tr.agree td` gets translucent green bg `rgba(95,208,138,.14)` (L252-254, token L17); first cell gets a 3px left bar via
  `box-shadow: inset 3px 0 0 var(--good)` (L256-258) (no layout shift, works on `<td>`); diff cell turns green + bold
  (L260-263). Add a mirrored `tr.fail` with `--red` for our red case; this demo has no red state.
- [NEW] **Signed percent diff formatting:** `(d>=0?'+':'') + d.toFixed(2) + '%'` (L787). Always show the sign.
- [NEW] **Reference column is live too**: predicted value is recomputed each tick from current state (L603-609, L776), not a
  constant, so the ledger stays honest after the user changes inputs.
- [NEW] **Measurement is event-based with sub-step interpolation**: accumulate swept angle, detect threshold crossing, then
  linearly interpolate the crossing time inside the step `f = (target-before)/dth` (L573-584). For us: time-to-90%-thrust,
  burn duration etc. should interpolate the crossing, not snap to the step. That is why diffs come out ~0.01%.
- [NEW] **Table throttled to 10 Hz**: `tableTimer += real; if (tableTimer > 0.1) {...updateTable()}` (L866-867). Canvas runs at
  60 fps, DOM text at 10 Hz: numbers are readable instead of flickering, and cheaper.
- [NEW] `font-variant-numeric: tabular-nums` on the table and stat values (L224, L331, L369): digits do not jitter in width.
  Right-align all numeric columns, left-align first (L228, L239-243); `white-space: nowrap` on cells (L249).
- [NEW] Header cells: 11px uppercase, letter-spacing .14em, muted, with `title=` tooltips explaining each column (L227-237, L478-480).
- [NEW] Rows are clickable and select the matching object in the canvas: row click toggles `follow` (L769), `tr.selected`
  underlines the name in accent colour (L265-269), hover tint (L275-281). Ledger <-> scene linking.
- [NEW] Colour dot per row with `box-shadow: 0 0 8px currentColor` glow; set both `background` and `color` inline (L283-291, L767).
- [NEW] Footer sentence states the pass criterion in words: "A row turns green when ... agree within one percent" (L515-516).
- [NEW] Conservation check as its own tile pair: total energy + drift since start in `toExponential(2)` % (L792-796). When
  the system changes (new body), the baseline is adjusted so drift stays meaningful (L638-639). For us: mass-flow or
  energy-balance residual tile.

## 2. Rendering

- [KNOWN] `createRadialGradient` glow. NEW detail: glow is a **4-stop falloff** (0 / .15 / .45 / 1 with alpha .55/.28/.07/0,
  L720-725) plus a separate small 3-stop solid core (L726-728). Two layers, no `shadowBlur`, no 'lighter'. Cheap and soft.
- [NEW] **Static background pre-rendered to an offscreen canvas** (`makeStars()`, L659-678), blitted each frame with
  `drawImage` (L697). Rebuilt only on resize. For us: test-stand structure, concrete, sky, grid -> offscreen once.
- [NEW] Offscreen blit is done in device pixels: `setTransform(1,0,0,1,0,0)` -> drawImage -> `setTransform(dpr,0,0,dpr,0,0)`
  (L696-698). Rest of drawing is in CSS pixels.
- [KNOWN] devicePixelRatio handled. NEW details: **capped at 2** `min(dpr, 2)` (L654); canvas sized from the parent's
  `clientWidth/Height` (L655-656); canvas is `position:absolute; inset:0` inside a flex `#stage` with `min-width:0` (L41-54).
- [KNOWN] Real units then one scale. NEW: single `toScreen(x,y)` closure with camera `{cx,cy,scale}` and Y flipped (L692);
  `fit()` computes scale from physical extent * 1.12 margin (L679-691); on resize scale is multiplied by new/old min(W,H) (L871).
- [NEW] **Fading trail** = flat `[x,y,x,y...]` array with fixed cap, `splice(0,2)` when full (L586-587); sampled on a
  per-object time interval, not per frame (`trailEvery`, L548, L585-589); drawn as segments with alpha `0.04 + 0.8*f*f`
  (quadratic fade, L710-712); last segment joins the live position so the trail never lags (L708). Use for our strip charts.
- [KNOWN] Fixed-cap arrays, no per-frame allocation (there are no particles in this demo).
- [NEW] `colorRGB()` (L750-758): convert any CSS colour (hex, hsl) to "r,g,b" by painting a 1x1 canvas, memoised in a Map.
  Lets you write `rgba(${rgb},alpha)` for any colour token.
- [NEW] Canvas labels: draw text twice, dark copy offset 1px then coloured copy (L746-747). Legible over anything, no shadowBlur cost.
- [NEW] Sphere look in 3 fills: soft halo gradient r*3.2, solid disc, small white 35% highlight offset up-left (L737-741).
- [NEW] Faint large radial "wash" in the background for depth (L665-667); stars vary by size class, alpha and 3 tints (L671-675).
- [NEW] Deterministic LCG `rnd()` with a fixed seed for the initial setup (L612-613); `Math.random` only for user-added items.
  Same opening frame every demo run.

## 3. UI chrome

- [KNOWN] PROMPT dialog with Copy / Close. NEW details: plain `div#modal[hidden]` fixed overlay, not `<dialog>` (L89-102,
  L444); prompt is in a `<pre>` with `white-space: pre-wrap; user-select:text; overflow-y:auto` (L137-145); card
  `width:min(720px,100%)`, `max-height:90vh`, flex column (L104-113); closes on backdrop click (`e.target === modal`,
  L881) and Escape (L882); **copy has a fallback**: `navigator.clipboard` -> hidden textarea + `execCommand('copy')` ->
  label "Select and copy manually" (L883-895); button reads "Copied" for 2.5 s then resets (L893-894). file:// safe.
- [KNOWN] Readout tiles. NEW details: `.stat` = 1px line border, radius 6, `.k` 11px uppercase .16em muted label over `.v`
  20px tabular value, unit in `<small>` muted (L315-338); 2-col grid gap 12 (L309-313).
- [KNOWN] Segmented buttons exist in sibling; this demo has none. Its buttons: uppercase 13px, translucent white bg .05, border
  .18, hover raises both (L383-399); `.primary` = accent border + accent text only, no fill (L401-408).
- [NEW] Slider styling is one line: `accent-color: var(--accent)` (L361-364). Row = uppercase label / range / fixed
  `min-width` value span so layout does not jump (L346-370).
- [NEW] **Logarithmic slider**: range -1..1.5, value = `10^x` (L505, L811). Gives 0.1x to 32x on one control.
- [NEW] **Slider consequence note**: a sentence under the slider restates the setting in human terms ("completes an orbit in
  about 30 seconds of real time", L508, L806-810). For us: "burn of 8 s plays in 8 s" / "slow-mo 0.1x".
- [NEW] Hint overlay: bottom-right of stage, 13px uppercase .12em muted, `pointer-events:none`, 3 short lines with `<br>`,
  hidden under 1000px (L166-177, L436-438, L462). Status badge bottom-left: muted uppercase label + `<b>` normal-case
  value in text colour (L147-164, L798-802). HUD title top-left: 40px serif accent name + 15px .22em uppercase subtitle,
  container `pointer-events:none`, the button inside re-enables `pointer-events:auto` (L60-87).
- [NEW] Panel is translucent `rgba(9,11,22,.82)` + `backdrop-filter: blur(14px)` (L11, L179-190); fixed width via
  `--panel-w: 520px`, flex column gap 22, `.foot` pushed down with `margin-top:auto` (L410-417).
- [NEW] Type system: serif (Georgia) for titles only, sans for everything, `h2` section labels 12px .24em uppercase muted
  (L192-207). Minimum body text 14-15px: readable from a distance. `.lede` paragraph under the title says what is real (L467-469).
- [NEW] Cursor communicates mode: `crosshair` default, `pointer` when `#stage.following` (L53-58, L801).
- [NEW] Space toggles pause but is ignored when focus is in INPUT/BUTTON/TEXTAREA or the modal is open (L817). Pause button
  text flips Pause/Resume (L815).
- [KNOWN] Narrow-screen collapse. Here: flex row -> column at 1000px, panel becomes 46vh (L419-439).

## 4. Main loop

- [KNOWN] dt clamp: `real = min(0.1, (now-last)/1000)` (L857). (Sibling clamps to 1/20; this one 1/10.)
- [KNOWN] Fixed substeps. NEW details: **accumulator** pattern: `acc += real*baseRate*speedMult; n = floor(acc/DT);
  step n times; acc -= n*DT` (L859-862), leftover carried to next frame so sim time is exact; **hard cap 20000 steps/frame**
  (L860) so a huge time scale cannot freeze the tab.
- [NEW] **Time scale derived from the content**: `baseRate = outerT / 30` (L616-617) i.e. "slowest interesting event takes
  ~30 s of wall time". Pick ours the same way (full burn sequence ~20-30 s at 1x).
- [NEW] Paused still draws and still updates the table (L858-867); only stepping is skipped. Camera/UI stay live.
- [NEW] Boot order in one line: `resize(); fit(); buildRows(); updateTable(); updateSpeedLabel(); ...; rAF` (L872-873). No
  blank first frame, no empty table.
- [NEW] Single state object `S` exposed as `window.__system` for console inspection / automated checks (L526, L897-898).

## 5. Striking from across a room

- [NEW] The green rows ARE the show: rows go from italic "timing 37%" to numbers to green one by one, inner (fast) first,
  outer last at ~30 s. Staggered payoff keeps people watching. Order our VERIFY rows so quick checks land early.
- [NEW] Honesty copy in the panel: says the numbers are integrated, "Nothing follows a drawn ellipse" (L467-469), and
  the foot states units and the pass rule (L515-516). Judges read this.
- [NEW] One warm accent (#f2d29b) + one semantic green on near-black; every other colour belongs to a data object and is
  reused identically in canvas, row dot and label (L530-535, L767, L747).
- [NEW] "Add a random ..." primary button that creates a new object which immediately gets its own ledger row and starts
  being measured (L631-642). Matches our "random engine" idea: new engine -> rows reset to "measuring 0%".
- [NEW] Zoom about the cursor with `exp(-deltaY*0.0015)` and clamped scale (L820-828); click vs drag split by a 4px
  threshold with pointer capture (L831-852); hit radius 22px, generous for a demo (L843).

# Source: ref-maestro.html

## Techniques from ref-maestro.html (official single-file demo)

Line numbers refer to `assist/ref/ref-maestro.html`. [KNOWN] = already in STYLE-REFERENCE.md, [NEW] = not there.
Techniques only; do not copy code. "-> us" = how it maps to the rocket test stand.

## 1. Onboarding (start gate)

- [NEW] **Overlay is a DOM div on top of the canvas, not drawn in canvas.** `#overlay` is `position:absolute; inset:0` inside the relatively positioned `#stageWrap` (88-93, 246-256, 441-449). It only covers the stage; header and side panel stay visible and readable behind it.
- [NEW] **See-through scrim**: background is a radial gradient from 55% to 92% opaque dark (253), so the already-animating scene shows dimly through. The loop runs before start (1107) so the stage is alive behind the gate.
- [NEW] **Gate content = 4 things**: big spaced title (h2, 40px, letter-spacing 8px, 258-265), one paragraph of what to do, one small italic tip line that names the fallback ("No webcam? Tap the space bar", 446-447), one pill button (281-294: gradient fill, radius 999px, uppercase, glow `box-shadow 0 0 30px`).
- [NEW] **One click does everything, in this order** (1112-1119): `initAudio()` -> `await ctx.resume()` -> hide overlay -> `S.started = true` -> set a curtain target -> set status word -> then the slow/permissioned thing (camera) LAST. Audio is created inside the click handler, so the AudioContext is born from a user gesture and never starts suspended.
- [NEW] **Dismissal is two-layer**: DOM overlay disappears instantly (`classList.add('hidden')` -> `display:none`, 300-302, 1114), while the theatrical reveal is a canvas animation: `S.curtainTarget = 1` and the loop eases `S.curtain` toward it (1092). Curtains are drawn last, over everything (1099), width = lerp(half screen, 3.5% sliver) (992) so they never fully leave; they frame the stage.
  -> us: blast-door / bunker shutter opening, or test-cell lights coming up, driven by one eased 0..1 value.
- [NEW] **`S.started` gates input and sim, not rendering** (1073, 1134). Before start the scene draws in its idle state.
- [NEW] **State word top right**: a single `<span id="status">` in the header (436), uppercase, letter-spaced, dim by default; one helper `setStatus(txt, cls)` sets text AND class together (719). Classes are just colours: `.live` green, `.paused` amber (74-80). Text progresses as a story: "Curtain down" -> "Raise your baton" -> "Playing" -> "Hands down. Orchestra waiting" (436, 1116, 708, 716).
  -> us: SAFE / ARMED / IGNITION / MAINSTAGE / ABORT / RUD with green/amber/red classes.
- [NEW] **Keyboard fallback** (1132-1135): one `window` keydown listener; uses `e.code === 'Space'`, guarded by `S.started` AND "modal is closed"; `e.preventDefault()` stops page scroll / button re-click; it calls the SAME function the sensor path calls (`onBeat`), so fallback and main input share one code path. Escape closes the modal in the same listener.
- [NEW] **Failure of the fancy input is not fatal**: camera error is caught, hint text is swapped to the fallback instruction, app continues (796-805).

## 2. Audio

- [NEW] **Create lazily, in the gesture**: `new (window.AudioContext || window.webkitAudioContext)()` inside `initAudio()`, called only from the start click, followed by `await ctx.resume()` (602, 1113). No context exists before the click. (STYLE-REFERENCE only says "AudioWorklet, fallback ScriptProcessor"; this demo uses neither, only stock nodes.)
- [NEW] **Bus graph** (603-608): sources -> `orch` gain (starts at 0) -> compressor -> `master` gain (0.85) -> destination. Parallel reverb send: `orch` -> send gain (0.38) -> convolver -> compressor. Compressor threshold -14 dB, ratio 4 protects the PA from clipping when many voices stack.
  -> us: engine bus + alarm bus into one compressor; essential on a venue sound system.
- [NEW] **Synthesised reverb impulse**: 2.4 s stereo noise buffer with `(1 - i/len)^2.6` decay and a 20 ms fade-in, fed to a ConvolverNode (581-588). No audio file needed. -> us: test-cell / canyon echo on the ignition bang and shutdown.
- [NEW] **Noise-burst texture baked once into a buffer**: 900 random 15 ms decaying noise clicks summed, then an overall fade in/out envelope (589-600); played through a bandpass at 1800 Hz (659-664). -> us: same recipe gives crackle / combustion roughness / debris rattle.
- [NEW] **One generic voice function with an options object** (613-630): oscillator(s) -> lowpass -> gain -> bus; envelope via `setValueAtTime(0.0001)` then `exponentialRampToValueAtTime` (never ramp to 0 exponentially; 0.0001 is the floor) (616-619). Detuned oscillator pair for thickness (624). LFO -> gain -> `osc.detune` for vibrato, with the depth itself ramped in (625-629). Every node gets `start(t)` and `stop(t+dur)` so nothing leaks.
- [NEW] **Percussive hit recipe** (646-656): sine with pitch drop `f*1.6 -> f` in 90 ms + short lowpassed noise burst with cubic decay. -> us: igniter pop, valve clunk, hard-start bang.
- [NEW] **Inharmonic partials for metal** (638-645): ratios 1, 2.76, 5.4 with decay time shrinking as 1/sqrt(ratio). -> us: pipe ring / tank ping.
- [NEW] **Lookahead scheduler on the audio clock** (692-700): each frame, `while (next < ctx.currentTime + 0.12)` schedule and advance. Timing comes from `ctx.currentTime`, not rAF, so sound stays tight even if frames drop. Called from the rAF loop, no setInterval (1079).
- [NEW] **Visuals synced to audio via an event queue**: scheduling a sound also pushes `{t, sec}` into `S.events` (670, 675); the frame loop pops events whose `t <= ctx.currentTime` and fires the visual (1080-1087). Picture and sound land together despite the lookahead. -> us: flash/shake exactly on the scheduled bang.
- [NEW] **Sound follows state through ONE bus gain**: start = `cancelScheduledValues` + `setTargetAtTime(1, now, 0.06)`; stop = same to 0 with 0.12 time constant (702-718). Click-free, and already-scheduled notes are silenced without tracking them. Pending visual events are filtered out on stop (715). Parameter changes (bpm) are read fresh each schedule step (695), so state changes take effect within ~120 ms.
  -> us: throttle/chamber pressure -> `setTargetAtTime` on gain and filter cutoff each frame; abort = bus to 0.
- [NEW] **Mute: there is none.** No mute button, no `M` key. The master gain node (603) is the obvious hook. For a live stage we should add one: `master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.02)` plus a key.

## 3. Rendering

- [KNOWN] DPR handled; radial gradients for glow; `shadowBlur` glow; particle array with fixed cap; linear gradients for metal.
- [NEW] **DPR details** (811-816): cap `dpr` at 2 (`Math.min(devicePixelRatio, 2)`), size from the PARENT's `getBoundingClientRect`, `setTransform(dpr,0,0,dpr,0,0)` so all drawing is in CSS pixels, and a `ResizeObserver` on the parent (818) instead of `window.resize`. Layout is recomputed inside resize (816). Guard `W>1 && H>1` before drawing (1071).
- [NEW] **Single `UNIT` scale**: `UNIT = min(W*0.43, H*1.15)` (822); every size, font and radius is a multiple of UNIT, so the scene fits any projector aspect. (Complements the KNOWN "draw in mm" idea.)
- [NEW] **Energy-decay activation**: each element has `e` in 0..1, set to 1 on its event, decayed `e *= exp(-dt*3.2)` and snapped to 0 below 0.003 (880-881). One number drives glow alpha, shadowBlur, body colour, bob amplitude, label brightness, and the DOM dot (883-891, 903, 909-916). Framerate-independent. -> us: valve actuation flash, sensor spike, igniter.
- [NEW] **Cheap perspective floor glow**: radial gradient drawn inside `translate / scale(1, 0.5) / translate back` to squash a circle into a floor ellipse (887-888); same trick for expanding shock rings, `scale(1, 0.45)` with alpha and lineWidth fading by age (945-950). -> us: shockwave ring on the pad, flame-trench glow.
- [NEW] **`hexA(hex, a)` helper** converts `#rrggbb` + alpha to rgba (833), so one palette constant feeds gradients at any opacity.
- [NEW] **Conditional shadowBlur**: glow is only set when `e > 0.05`, inside save/restore (910-911, 936). shadowBlur is expensive; never leave it on globally.
- [NEW] **Painter's sort** by y before drawing (894-897).
- [NEW] **Depth cues from gradients only**: 3-stop wall gradient, 4-stop cylinder gradient for pipes (846-848), floor lines spaced by `pow(i/n, 1.6)` for fake perspective (859), large low-alpha (0.10) radial spotlights (861-865).
- [NEW] **Vignette pass** near the end: radial transparent -> rgba(0,0,0,.6) over the whole frame (1013-1017). Cheap, instantly "cinematic".
- [NEW] **Particles** (974-988): hard cap 320 checked at spawn, life in seconds, alpha = `min(1, life)`, filter-and-update in one pass. NOTE: this demo does NOT pool (it allocates and filters every frame) and does NOT use `globalCompositeOperation='lighter'`; for our flame keep the KNOWN pooled + 'lighter' approach.
- [NEW] **Canvas text fading** with alpha from remaining time (1100-1104) for transient banners ("Bravo") -> us: "IGNITION", "MECO".
- [NEW] **Offscreen canvas** for intermediate data, `getContext('2d', {willReadFrequently:true})` when reading pixels (725-728).

## 4. UI chrome

- [KNOWN] PROMPT dialog with Copy / Close; CSS grid shell; DOM for chrome, canvas for the picture; `textContent` updates.
- [NEW] **Modal build**: plain div, not `<dialog>`: `position:fixed; inset:0; z-index:10`, 80% dark scrim, flex-centred box max-width 720 (323-346). Toggled by a `.hidden` class (334). Prompt lives in a `readonly <textarea>` (483-486), which makes selection and the copy fallback trivial.
- [NEW] **Three ways to close**: Close button, click on the scrim (`e.target === promptModal`), Escape (1124-1125, 1133).
- [NEW] **Copy with fallback and feedback** (1126-1129): `navigator.clipboard.writeText` in try; catch -> `select()` + `execCommand('copy')` (works on file:// and non-secure contexts). Confirmation text in a span with `margin-right:auto` so it sits left of the buttons (401-406); cleared on reopen (1123).
- [NEW] **Button hierarchy**: primary = gold gradient pill, no border; secondary = transparent with 1px line border, dim text, gold on hover (304-321, 379-399). All uppercase with letter-spacing 2-3px.
- [NEW] **Tiles**: `.card` (dark fill, 1px line, radius 10) + tiny `.label` (11px, letter-spacing 3px, uppercase, dim) (111-124). Big number: 74px, `font-variant-numeric: tabular-nums` so digits do not jitter, text-shadow glow (126-134).
- [NEW] **Number pulse on event**: add class `pulse` (scale 1.07, 80 ms transition, transform-origin left), remove after 90 ms (132-138, 1085).
- [NEW] **Derived word under the number**: BPM -> "Allegro" etc. (1060-1062, 1088). -> us: chamber pressure -> "NOMINAL / ROUGH / CHUGGING".
- [NEW] **Legend dots mirror the canvas**: list built from the same data array (555-560); dot colour and box-shadow driven by the same `e` value (890-891).
- [NEW] **Hints live where the thing will appear**: placeholder text centred inside the empty panel (169-180, 461), swapped on failure (802); tiny status tag drawn in the panel corner, colour-coded (1040-1041). Idle values show "--" and a word ("tacet") rather than 0 (717).
- [NEW] **Slider with a worded readout** (Low/Normal/High) and `accent-color` (234-237, 733-739); apply function run once at load.
- [NEW] Responsive: one media query at 900px collapses to one column and turns the aside into a wrapping row (408-428).

## 5. Main loop

- [KNOWN] `dt` clamped to 1/20 s (1070); draw then update readouts.
- [NEW] **`requestAnimationFrame(frame)` is the FIRST line of `frame`** (1069), so an exception later in the frame cannot kill the loop. Important for a live demo.
- [NEW] **Early-out guard** on zero-size canvas (1071).
- [NEW] **Two clocks**: `performance.now()` for visuals and input timing, `ctx.currentTime` for audio and audio-synced events (1080).
- [NEW] **Edge-triggered state transitions**: `if (moving && !playing) start(); if (!moving && playing) stop();` with idempotent start/stop (702-703, 710-711, 1075-1077). A 650 ms hold window debounces the input (1075).
- [NEW] **All smoothing is dt-based**: `x *= exp(-dt*k)` for decays (1091), `x += (target-x)*min(1, dt*k)` for eases (1092). No frame-count animation anywhere.
- [NEW] **Fixed draw order as a list of small functions** (1094-1105): background -> actors -> particles -> hero -> vignette -> curtains -> banner text. Overlays after the vignette stay bright.
- [NEW] **Input smoothing**: median of last 4 intervals, clamp, then half-step toward target (783-788); jitter rejection by minimum interval (780); sanity cap "if >75% of pixels changed it is lighting, not a hand" (759). -> us: same pattern for any noisy live input.
- [NEW] Whole script wrapped in an IIFE with `'use strict'` and a single state object `S` (497-498, 565-574).
