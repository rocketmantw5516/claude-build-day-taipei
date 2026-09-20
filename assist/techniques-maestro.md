# Techniques from ref-maestro.html (official single-file demo)

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
