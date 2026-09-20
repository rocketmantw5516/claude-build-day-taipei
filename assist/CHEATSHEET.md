# CHEATSHEET — how to trigger each of the ten endings

Tested by script (`node assist/drive.mjs engine.html assist/paths/<file>.json`) against `engine.html`
builds of 18:52–18:58, headless Chrome, 1× time. Times are wall-clock from the first click.
All paths start from a **fresh page or `R`**, mode **FREE**, engine **AST91**, unless stated.
After every ending the report card slides in about 2.5–3 s later (CLEAN_RUN: 0.5 s). `R` resets.

"LIGHT IT" below means this five-click sequence (open-time slider at its default 0.50 s):
**HV3 → VENT (close it) → ARM KEY → IGNITER → (wait ~½ s) → MAIN VALVE**. Lit within 1 s.

| # | Ending | Exact clicks | Fires after | Replay file |
|---|---|---|---|---|
| 1 | `ADIABATIC` | open-time slider to **minimum (0.02 s)** → HV3 → MAIN VALVE | 0.05 s after MAIN VALVE; card at ~3 s | `paths/demo.json` |
| 2 | `NO_LIGHT` | ARM KEY → IGNITER, touch nothing else | ~8 s (igniter burns 4 s sim, then the verdict) | `paths/end-NO_LIGHT.json` |
| 3 | `HARD_START` | open-time slider to **maximum (1.0 s)** → HV3 → VENT (close) → MAIN VALVE → wait 2.5 s → ARM KEY → IGNITER | ~1.5 s after IGNITER | `paths/end-HARD_START.json` |
| 4 | `CHUG` | IP1 injector dropdown → **"oversize bore, no plate (soft)"** → LIGHT IT | ~1.5 s after MAIN VALVE (stiffness 6.8 %, amplitude 27 %) | `paths/end-CHUG1.json` |
| 5 | `BURN_THROUGH` | LIGHT IT, then hands off | **~12–13 s of burn** | `paths/end-BURN_THROUGH.json` |
| 6 | `FLASHBACK` | LIGHT IT → burn 4 s → MAIN VALVE (shut) → do NOT purge | ~4 s after shutting the valve | `paths/end-FLASHBACK.json` |
| 7 | `REG_FAIL` | HV3 → VENT (close) → FAULT: REGULATOR | ~5 s | `paths/end-REG_FAIL.json` |
| 8 | `POWER_CUT` | HV3 → FAULT: POWER CUT (also works mid-burn: LIGHT IT → 3 s → FAULT: POWER CUT) | ~5–6 s | `paths/end-POWER_CUT.json`, `…_firing.json` |
| 9 | `BURST` | click **RANDOM ENGINE** until the note under the stand says "BAD DESIGN: throat far too small…" → LIGHT IT | ~1 s after MAIN VALVE (Pc 15.6 vs 15 bar burst) | `paths/end-BURST.json` |
| 10 | `CLEAN_RUN` | GUIDED mode, slider 0.50 s: **Space ×9 briskly (~0.7 s apart)** → FIRING at ~6 s → burn **8 s, no longer** → Space (shutdown) → Space (purge on) → **wait 5 s** → Space (vent) → Space (purge off, key out) | ~22 s total; card: Pc 11.0 bar · 287 N · Isp 213 s · grade B | `paths/clean2.json` |

## Traps found while testing (bug reports for the main line)

1. **BURST has no deterministic path.** It needs the random engine to roll the small-throat design (1 in 9 per roll).
   On stage: roll before the talk and do not touch the engine selector afterwards, or skip this ending.
2. **BURN_THROUGH comes fast.** The default engine burns through after ~12–13 s. Any "let it run while I talk"
   beat must be under ~9 s, then shut down.
3. **Guided rhythm matters both ways.** Too slow between step 7 (igniter) and step 9 (main valve) — about 5 s —
   gives `NO_LIGHT`. Too fast through steps 11→13 (purge shorter than 4 s) gives **no ending at all**: every step
   green, "Key in pocket", no report card. Wait 5 s on the purge step.
4. **After the ADIABATIC demo, `R` keeps FREE mode and keeps the slider at 0.02 s.** In FREE mode Space does nothing.
   Click GUIDED and drag the open-time slider back to 0.50 s before pressing Space, or the guided run explodes again at step 9.
   **Rechecked on the 19:02 build:** `R` now restores the slider to 0.50 s (fixed), and the card now prints 564 °C,
   but `R` still leaves the mode on FREE and Space still does nothing there (29 presses, never lit) —
   **you must click GUIDED after `R`.**
5. CLEAN_RUN card prints "O/F 1.98 → –": the end-of-burn O/F is never filled in.
6. Pressing Space quickly skips the pre-fire purge time, so the clean-run grade is B ("pre-fire purge was skipped").
   For grade A hold ~2 s on step 2 (purge on) — but then keep steps 7→9 brisk.

## Not tested

- The kerolox, conical and big-bell engines (only AST91 and one random engine were driven).
- ¼× and 1/20× time scales.
- Clicking valves on the canvas instead of the console buttons.
- Anything audible.
