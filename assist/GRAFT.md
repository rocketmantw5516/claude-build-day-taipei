# TRIAL RESULT (18:54) — grafts 1, fx paste, 3, 4, 2 are PROVEN on a copy

Applied to `assist/trial/a-grafted.html` (copy of out/a.html 81082 B) in the order 1 -> fx.js inline -> 3 -> 4 -> 2 (audio.js inline); `qa.sh` load mode after every step: PROBLEMS 0, 61 fps each time. Final: `--all` 0 problems, `--guided=14` 0 problems. `assist/shots/a-grafted-g09.png` (FIRING, 295 N, Pc 10.8 bar) viewed: target plume + diamonds intact, heat-haze streaks visible above the plume, engine/labels undamaged, 60 fps. Not proven by eye: the explosion/misfire visuals and the sound (headless) — they run without errors through `--interact` (which clicks every button incl. faults), nothing more is claimed. Graft 5 (kit plume) NOT tried — still "skip unless idle".

**engine.html now exists and has diverged from a.html** (96035 B, mtime 18:52:08, md5 3ed5e1bc174687d45b7d86246590344c; it already has rAF-first and no `bCopy` clipboard line). So there are two ways to apply, both tested:

1. **One command, if engine.html is still md5 3ed5e1bc…:**
   `cp engine.html /tmp/engine.pre-graft.html && patch engine.html < assist/trial/engine-grafted.patch`
   (verified: patch applies cleanly and reproduces `assist/trial/engine-grafted.html`, which passes `qa.sh --all` with 0 problems). Or simply `cp assist/trial/engine-grafted.html engine.html`.
2. **If engine.html changed again:** the anchored script survives drift (it matched on the 96 KB engine.html where the a.html patch had 3/10 hunks rejected):
   `cp engine.html /tmp/engine.pre-graft.html; for st in fx 3 4 2; do python3 assist/trial/apply.py $st $PWD/engine.html || break; done; assist/qa.sh engine.html --all`
   Each step asserts its anchor occurs exactly once and writes nothing on failure (AssertionError = that step not applied; steps `1` and `clip` fail on engine.html because the main line already did them — expected). Step `2` depends on step `fx` (it anchors on the `const fxDrawPlume=drawPlume;` line).
   `assist/trial/a-grafted.patch` = diff vs out/a.html, only useful for a file identical to a.html.

Where reality differed from the plan below:
- Nothing in the graft snippets needed changing; all anchors, variables (`FXE`, `x,y` in startEnding, `dt`, `tNow`, `NOZ`, `eng.designPc_bar`, `S.oxD`, `S.qFuel`, `S.chugAmp`) exist as written. No new name collisions appeared (kit `drawPlume`/`audioInit` shadowing handled as described).
- Line numbers below are for a.html ONLY. In engine.html everything is shifted (frame() is at L1055, not L840) — use the function names / anchor strings, or apply.py.
- Extra fix found by QA, pre-existing in a.html (not caused by grafts): `#bCopy` handler threw an unhandled `NotAllowedError` from `clipboard.writeText` (`--interact` reported 1 problem on the untouched a.html too). Fixed in the a.html trial copy with try + `.catch(()=>{})` (apply.py step `clip`). engine.html no longer has that line.
- File grows by ~45 KB (fx.js 31 KB + audio.js 13 KB inline); fps unchanged at 61.
- Rollback: `cp /tmp/engine.pre-graft.html engine.html`.

---

# GRAFT — kits (assist/fx.js, audio.js, ui-kit.html) into the simulator

**Target read:** `/Users/frankchen/claude_taipei/out/a.html` — 81082 bytes, 858 lines, mtime Sep 20 18:42:17 2026.
`engine.html` did NOT exist at 18:43. If you `cp out/a.html engine.html`, all line numbers below hold. If a.html was re-assembled since, re-find by function name (all names are unique, grep them).
QA baseline of the untouched target (assist/shots/a.txt): PROBLEMS 0, 61 fps, 25 buttons / 2 ranges / 1 select.

## What the target is (facts you need)

- One `<script>` (L143-856), `'use strict'` on L144. Top level: CARDS, INCIDENTS, ENGINES, `clamp/lerp/fmt`, PARAMS, THERMO, `nozzle()` -> global **NOZ** `{F,Me,Pe,CF,sep,epsUsed,Mj,epsJ}`, `let S` (sim state), `const C` (controls), `newSim/step/end/checkFault/verifyRows`.
- **Everything visual lives INSIDE `function boot(){` (L442-855)**: `eng`, `anim`, `cs/cg/cp` canvases, `drawStand`, `drawPlume`, `drawEngine`, `startEnding`, `showReport`, `audioInit`, `audioUpdate`, `reset`, `frame`. So boot-local names SHADOW kit globals of the same name (see collisions).
- Coordinates: stand canvas is drawn in **virtual units 1120 x 540** (`VW,VH`), via `toV(c)` = `setTransform(dpr*vs,0,0,dpr*vs,dpr*vox,dpr*voy)` (L509). Engine mm -> virtual with `kmm` (about 1.4, recomputed in `layout()`). Axis `y=AX=300`, injector face `x=FACE=585`, nozzle exit `x=exitX()` (L576), exit radius `eng.exitR*kmm`.
  **Call every fx kit function INSIDE the toV transform, passing virtual units as the kit's "px".** Multiply mm by `kmm`; multiply nothing else. (Kit sizes like the 760 px shock ring are then relative to the 1120-wide virtual stage — correct scale.) DPR is already in toV. `fxExplosionDraw` does its own `save / setTransform(1,0,0,1,0,0) / restore` for the white flash using `ctx.canvas.width` — safe.
- Draw order in `drawStand(dt,tNow)` L665-701: static layer blit -> toV -> shake translate -> pipes -> valves -> bubbles -> igniter/ARM -> `drawPlume` -> `drawEngine` (L688) -> smoke -> scorch (L691) -> `drawParticles` (L692) -> shock ring (L693) -> full-canvas flash (L694, resets transform to identity; nothing may be drawn after it without calling `toV(c)` again).
- `dt` passed to drawStand is REAL dt (clamped 1/20); `tNow` = seconds. drawStand runs every frame even when `S.frozen`.
- Endings: `end(code,data)` sets `S.ending`, `S.frozen`; `frame()` calls `startEnding()` once (L845), `showReport()` after 2.4 s (0.5 s for CLEAN_RUN). `EXPLOSIVE` = HARD_START, ADIABATIC, BURST, BURN_THROUGH, FLASHBACK. Blast origin `anim.ex, anim.ey` (virtual units).
- Audio today (L451-469): looped noise -> lowpass -> gain, plus a 46 Hz saw. Thin. No one-shots. `muted` boot-local, toggled at L819.
- DOM chrome already present and working: `<dialog id=dlg>` prompt + Copy, `#card` hover cards, `#report` sliding incident card, VERIFY table v0/v1/v2 with ok/bad classes, `#lamp` state word, `#seq` step strip.

## Ranked table (payoff per minute of risk)

| # | Graft | Payoff | Risk | Minutes | Verdict |
|---|---|---|---|---|---|
| 1 | rAF re-armed on first line of `frame()` | show can never freeze | none | 1 | DO |
| 2 | audio.js replaces L451-469 + one-shots | large, audible: roar/crackle/chug wobble, explosion boom, klaxon | low (contained, all kit calls are try/catch) | 8 | DO |
| 3 | fxExplosion + fxMisfire as overlay in drawStand | large: fireball, bouncing debris, smoke, scorch, 1-frame white flash | low (additive, 6 lines) | 6 | DO |
| 4 | drawHeatHaze over plume | small-medium | very low (1 line) | 2 | DO if 2+3 are green |
| 5 | kit drawPlume replaces hot-plume fill L640-656 | medium; target plume is already physics-driven with diamonds, separation point and labels | medium (shadowed name, sep mapping) | 10 | ONLY if green by 19:05, else SKIP |
| 6 | tkGate start gate | small; conflicts with "starts muted" in the prompt | medium (3 blocks to paste) | 10 | SKIP |
| 7 | drawValve / drawPipeFlow / drawGauge | small; target equivalents fine | HIGH (static layer, HITS hit-testing, needle physics, gaugeFace cache) | 25+ | SKIP — not before 19:20 |
| 8 | ui-kit prompt / card / incident / ledger / state word / steps | near zero; target has all six working | medium-high (duplicate DOM, QA clicks every button) | 20+ | SKIP — not before 19:20 |
| 9 | fxShake | none; target shake L667 already scales with thrust + chug | — | — | skip |

## Application order (page works after every step)

`cp out/a.html engine.html` (if engine.html absent) -> **1 -> 3a(paste fx.js) -> 3 -> 4 -> 2 -> (5)**. Before each step: `cp engine.html /tmp/engine.stepN.html`. After each step: `assist/qa.sh engine.html --all` must print `PROBLEMS: 0`; look at `assist/shots/engine-interact-after.png`. Roll back = `cp /tmp/engine.stepN.html engine.html`. Stop grafting at 19:15 whatever the state; ship the last green copy.

---

## 1. rAF first  — DO

(a) `frame(now)` L840-852. Move L852 `requestAnimationFrame(frame);` to be the first statement of the function:
```js
function frame(now){
  requestAnimationFrame(frame);
  const dt=clamp((now-lastNow)/1000,0,1/20);lastNow=now;
```
and delete the old one at the end of frame (keep the one at L854 outside the function). (c) none. (d) qa; rollback trivial.

## 3a. Paste fx.js (prerequisite for 3, 4, 5)

Paste the whole of `assist/fx.js` at top level right after L144 `'use strict';` (before `/* ==== CONTENT MODULES`). It is strict-safe, touches no DOM at load, so `out/.a_test.js`-style node loading still works.
(c) Collisions, grepped:
- `drawPlume` — kit global vs boot-local `function drawPlume(c,tNow)` L630, called L688. Boot-local shadows the kit inside boot. Harmless until graft 5. For graft 5 add at top level, right after the pasted kit: `const fxDrawPlume=drawPlume;`.
- `S` — kit `fxExplosionCreate` has a function-local `const N=64,S=96,K=40`. Local scope only; does not touch the sim `S`. No action.
- `clamp`, `lerp`, `rr`, `COL`, `DASH`, `NODASH`, `PT`, `spawn`: kit uses `_fxClamp`, `FX_PAL` and locals only — no clash. (`rr` appears in fxExplosionDraw as a local const inside the kit function: fine.)
- No clash for FX_PAL, _fxPlumeR, _fxPlumePath, _fxPolyline, _FX_SHAKE, drawPipeFlow, drawValve, drawGauge, drawHeatHaze, fxShake (grep of a.html: zero hits).
(d) qa must still be 0 problems (nothing calls the kit yet).

## 3. Explosion + misfire overlay — DO

(a) Hooks: `startEnding()` L577-589, `drawStand()` between L692 `drawParticles(c);` and L693 shock ring, `reset()` L798.
(b) Snippets.
Next to `const anim=...` (L500):
```js
const FXE=fxExplosionCreate(),FXM=fxMisfireCreate();
```
In `startEnding()`, inside `if(EXPLOSIVE[code]){` — keep the three spawn loops (they add sparks), but replace `anim.flash=1;anim.shock=0.001;anim.shake=14;anim.scorch=1;` with:
```js
anim.shake=14;FXE.groundY=AX+150;FXE.scale=1;fxExplosionStart(FXE,x,y);   // x,y are already virtual units
```
(kit draws its own flash, shock ring and scorch; leaving the target's on too gives a double ring.)
In the `else if(code==="NO_LIGHT"){` branch append: `fxMisfireStart(FXM,exitX(),AX);` (keep the 26 smoke puffs or delete them; kit has its own single puff — delete them for "the silence is the effect").
In `drawStand`, after `drawParticles(c);`:
```js
fxExplosionDraw(c,FXE,dt);toV(c);fxMisfireDraw(c,FXM,dt);
```
(`toV(c)` re-asserts the virtual transform in case; note this drops the shake translate for the misfire only — irrelevant.) Units: inside toV, virtual units, real `dt` seconds — exactly what the kit wants.
In `reset()` after `anim.scorch=0;`: `FXE.active=false;FXE.done=false;FXM.active=false;FXM.done=false;`
(c) none beyond 3a. (d) qa --all; then manual: FREE mode, HV3, MAIN VALVE with open time slider at 0.02 -> ADIABATIC blast at (440,300); ARM + IGNITER alone -> NO_LIGHT after 4 s. `#stand.dead` grayscale filter (L29) applies when the report shows at 2.4 s; kit explosion runs ~4.5 s so its tail goes grey — acceptable; if not, change `2.4` on L846 to `3.6`.
Rollback: restore the step copy.

## 4. Heat haze — DO if green

(a) `drawStand` L688, immediately after `drawPlume(c,tNow);drawEngine(c,tNow);`.
(b)
```js
if(S.lit)drawHeatHaze(c,{x:exitX(),y:AX-150,w:Math.min(330,VW-exitX()),h:130,intensity01:clamp(NOZ.F/400,0,1),t:tNow});
```
Virtual units, inside toV. `NOZ` is fresh because target `drawPlume` calls `nozzle()` first every frame. (c) none. (d) qa; if fps in `assist/shots/engine.txt` drops under 55, delete the line.

## 2. audio.js — DO

(a) Replace L450-469 (boot-local `let actx...`, `function audioInit`, `function audioUpdate`) and the handler L819. Paste the whole of `assist/audio.js` at TOP LEVEL (after the fx.js paste, outside boot). It guards `typeof window`, never throws.
(c) Collisions, grepped:
- **`audioInit`** — boot-local L452 shadows the kit's. DELETE the boot-local one (whole L451-461). After deletion the call on L819 resolves to the kit global.
- `muted` boot-local `let` (L451) — keep a `let muted=true;` line; kit keeps its own `_AK.muted`.
- `audioUpdate` — target-only name, keep the name, new body below. Called in `frame()` L849, no change there.
- `_AK`, `audioSet`, `audioOneShot`, `audioMute`, `audioIsReady`, `audioPath`: zero hits in target.
- `actx,nGain,lp,oGain`: used ONLY in L451-469 and L819 (grep to confirm `lp` has no other hit besides `lerp`/`lp=`). All go away.
(b) New boot-local block replacing L450-469:
```js
let muted=true,rvWas=false;
function audioUpdate(){
  if(muted||reportShown||S.frozen){audioSet({pc01:0,mdot01:0,chug01:0});return;}
  const pcb=(S.Pc-PARAMS.Pa)/1e5;                                   // bar gauge
  if(S.lit)audioSet({pc01:clamp(pcb/(1.3*eng.designPc_bar),0,1),     // 11 bar design -> ~0.77
    mdot01:clamp((S.oxD+S.qFuel)/0.2,0,1),                           // kg/s; AST91 runs ~0.15-0.18
    chug01:clamp(S.chugAmp/0.3,0,1)});                               // S.chugAmp = (max-min)/mean of Pc, L399
  else audioSet({pc01:clamp(S.qInj*0.6+S.qVent*0.4+S.qRv3*0.3,0,0.15),mdot01:0,chug01:0}); // cold-flow hiss
  const rv=S.rv3Lift>0.05||S.rv1Lift>0.05;if(rv&&!rvWas)audioOneShot('relief');rvWas=rv;
}
```
L819 handler becomes:
```js
B.snd.onclick=()=>{muted=!muted;if(!muted)audioInit();audioMute(muted);B.snd.textContent=muted?"SOUND OFF":"SOUND ON";setCls(B.snd,"on",!muted);};
```
(`audioInit()` builds the graph synchronously and resumes the context inside the click gesture; `audioMute(false)` right after is valid. Still starts muted, as the prompt demands.)
One-shots (names that exist: igniter, valve, relief, explosion, misfire, klaxon) — all no-ops until ready:
- `startEnding()` first line after `const code=...`: `audioOneShot(EXPLOSIVE[code]?'explosion':code==="NO_LIGHT"?'misfire':code==="CLEAN_RUN"?'valve':'klaxon');`
- `ACT.IGN` L767 before `S.ignT=PARAMS.ignDur`: `audioOneShot('igniter');`
- `ACT.HV3/MV1/PV3/PV1` L762-765: append `audioOneShot('valve');` inside each guard. `ACT.ABORT`: `audioOneShot('klaxon');`
Caveat: the early-return zeroes the roar the instant `S.frozen` — so the explosion one-shot plays over silence. That is the intended "flash, debris, smoke, silence".
(d) qa --all (headless has no gesture-blocking issue; kit swallows failures). Manual: click SOUND ON, run guided with SPACE, listen for roar rising with Pc; pick "oversize bore" on IP1 for chug wobble. Check `audioPath()` in console: 'worklet' or 'fallback'. Rollback: step copy.

## 5. Kit drawPlume — ONLY if everything above is green by 19:05, else SKIP

Target plume (L630-664) already has: Prandtl-Pack cell length from `NOZ.Mj`, fully-expanded jet radius from `NOZ.epsJ`, separation start point walked along the profile, two-pass additive fill, 7 fading diamonds, status text, sparks, cold-gas jet. It is good enough for the demo. If you still want the kit's look:
(a) Keep L631-636 (nozzle call, early-out, cold jet) and L657-663 (labels + spark). Replace ONLY L637-656 (from `let x0=ex,R0=...` through `c.globalCompositeOperation="source-over";`). Keep a `const x0=ex,R0=eng.exitR*kmm,Lp=80+11*Math.sqrt(NOZ.F);` line because L663 (sparks) and L660 (`Lc`) use them; set `const Lc=1.306*2*Rt*Math.sqrt(NOZ.epsJ)*Math.sqrt(Math.max(0.05,NOZ.Mj*NOZ.Mj-1));`.
(b)
```js
const pr_=eng.profile;let it_=0,rm_=1e9;for(let i=0;i<pr_.length;i++)if(pr_[i][1]<rm_){rm_=pr_[i][1];it_=i;}
const bellLen=(pr_[pr_.length-1][0]-pr_[it_][0])*kmm;                       // mm -> virtual units
// NOZ.Pe is CLAMPED to 0.4*Pa when separated, and the kit needs <0.4 to show separation, so pass the ideal full-flow Pe:
const Mfull=NOZ.sep?machFromArea(S.eps,g):NOZ.Me;
const peFull=NOZ.sep?S.Pc*Math.pow(1+(g-1)/2*Mfull*Mfull,-g/(g-1)):NOZ.Pe;
fxDrawPlume(c,{x:ex,y:AX,exitR:eng.exitR*kmm,mach:Mfull,peOverPa:peFull/PARAMS.Pa,
  thrust01:clamp(Math.sqrt(NOZ.F/400),0,1),t:tNow,dir:0,bellLen:bellLen});
```
Inside toV, virtual units. `fxDrawPlume` is the top-level alias from 3a (the boot-local `drawPlume` shadows the kit name). Draw order unchanged: plume before `drawEngine`, so the engine cutaway covers the in-bell part except the bore — check the "Big bell" engine visually.
(c) `drawPlume` shadowing as above; `g` is the boot-local const from L631 — reuse it.
(d) qa --all, then eyeball AST91 (Pe/Pa ~ 1, slightly under), Conical (over-expanded, pinched), Big bell (separation). If any looks worse than before: roll back this step only.

## SKIP list — say no plainly

- **drawValve / drawPipeFlow / drawGauge: do NOT attempt before 19:20.** Target valves (`valve()` L548, `relief()`, `ck()`) are tied to hard-coded virtual positions, the pre-rendered `staticLayer`, and `HITS` hit-testing for hover cards; pipes (`PIPES` L481, flat `[x,y,x,y]` arrays, per-pipe `off` phase, pressure tint + fluid colour incl. N2 purple) already move and are coloured by fluid; gauges have a cached `gaugeFace` + spring needle (`anim.needle/needleV`). Kit wants `[[x,y],...]` points and different colours (N2 green vs target purple `--n2`) — it would also break palette consistency. Payoff near zero.
- **ui-kit.html (tkPromptOpen, tkCard*, tkIncident*, tkLedgerSet, tkStateWord, tkStepsInit/Set): skip all.** Target has `#dlg` + Copy, `#card`, `#report` (with slide-in, good/bad border, grayscale stage), VERIFY table with ok/bad, `#lamp`, `#seq` — all wired to state and QA-clean. Grafting means pasting TK STYLE + TK HTML + TK SCRIPT and rewiring `showReport`, `showCard`, `updReadouts`, `syncSteps`: 4 hook sites, duplicate IDs to retire, zero visible gain.
- **tkGate: skip.** The prompt says sound starts muted; SOUND button already unlocks audio in a gesture.
- **fxShake: skip.** L667 already shakes with `S.F` and `S.chugAmp`.
- Optional 30-second CSS nicety (safe): add `font-variant-numeric:tabular-nums` to `#reads b` (L38) and `td` (L40).
