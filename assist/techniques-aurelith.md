# Techniques from ref-aurelith.html (Aurelith orbital ledger demo)

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
