/* ==== modules/cards.js — teaching cards + incident reports (pure data) ====
 * Paste verbatim into the top of engine.html's <script>. No DOM, no side effects.
 * Contract: INTERFACE.md + LEO.md. Facts: KNOWLEDGE.md §3 (components), §4 (sequence), §5 (failures).
 *
 * PLACEHOLDERS used in INCIDENTS[*].number — the main line substitutes live values:
 *   {T2}      °C    gas temperature in the dead line after adiabatic compression (KNOWLEDGE §5.1)
 *   {Pc}      bar   chamber pressure (PT-4) at the moment of the ending
 *   {Pburst}  bar   the engine's burst limit = ENGINES[key].burstPc_bar
 *   {Pspike}  bar   peak chamber pressure of the hard-start spike
 *   {dP}      %     injector pressure drop AS A PERCENTAGE OF Pc  (= 100 * dP_bar / Pc; limit is 20 %)
 *   {Pman}    bar   manifold pressure (PT-3), downstream of the regulator
 *   {Pbottle} bar   oxygen bottle pressure (PT-2)
 *   {Ppurge}  bar   nitrogen purge pressure at shutdown (0 if purge was never opened)
 *   {tburn}   s     burn time, main valve open to main valve closed / ending
 *   {OF}      —     oxidizer-to-fuel mass ratio (no unit)
 *   {thrust}  N     average thrust over the burn
 *   {Isp}     s     specific impulse
 *   {impulse} N·s   total impulse = thrust integrated over the burn
 * Not used: none — all thirteen allowed names appear at least once below.
 *
 * Numbers NOT from KNOWLEDGE.md (flagged per the rules):
 *   - "limit 400 °C" on the ADIABATIC line comes from the LEO.md contract example, not KNOWLEDGE.md.
 *   - BURST and BURN_THROUGH have no entry in KNOWLEDGE §5. Their wording follows PROMPT.md
 *     ("throat too small for the flow…", "burn too long, so the grain burns through to the wall"),
 *     INTERFACE.md (burstPc_bar) and KNOWLEDGE §4 (shutdown on timer + Pc). No numbers were invented.
 *   - NO_LIGHT causes ("no oxygen flow / mix that cannot burn") follow PROMPT.md ("igniter fired with no
 *     oxidizer, or mixture outside the flammable range"); the 30-minute rule and 1.0 s window are KNOWLEDGE §4.
 */

const CARDS = {
  CYL: {
    name: "OXYGEN BOTTLE",
    what: "Holds the oxygen, squeezed to 150–200 bar. Everything downstream exists to tame that pressure.",
    without: "No oxygen, no burn. But if that full pressure ever gets loose downstream, pipes burst."
  },
  PR1: {
    name: "REGULATOR",
    what: "Steps bottle pressure down to a steady 20–60 bar. Its setting is the throttle: more pressure pushes more oxygen through the injector holes.",
    without: "Set it wrong and the engine gets the wrong flow. If it fails, full bottle pressure shoots downstream."
  },
  RV3: {
    name: "RELIEF VALVE 70 BAR",
    what: "A safety valve just after the regulator. It stays shut until pressure hits 70 bar, then opens and dumps the excess.",
    without: "If the regulator fails, full bottle pressure hits the pipes downstream. They burst."
  },
  HV3: {
    name: "HAND VALVE",
    what: "A shut-off valve you turn by hand. It stays closed whenever people are at the stand.",
    without: "If a remote valve fails, nothing else stands between the crew and the oxygen."
  },
  FL1: {
    name: "FILTER 40 µm",
    what: "Catches specks of grit down to 40 thousandths of a millimetre. It sits UPSTREAM of the main valve, on purpose.",
    without: "Grit slamming into metal is the number-one way high-pressure oxygen fires start. Leave it out, or fit it on the wrong side, and the line itself can catch fire."
  },
  MV1: {
    name: "MAIN VALVE",
    what: "Air-powered valve that lets oxygen into the engine. It opens slowly, over 0.4–0.8 s, and shuts by itself if power is lost.",
    without: "Snap it open and the gas trapped in the dead pipe is squeezed so fast it heats up like air in a bike pump. 40 bar into a 1 bar pipe gives 568 °C — enough to light the line."
  },
  NV1: {
    name: "NEEDLE VALVE",
    what: "A fine adjusting valve on the main valve's air exhaust. It sets how slowly the main valve opens.",
    without: "Set too loose, the main valve snaps open and you risk a line fire. Fitted on the air inlet side instead, the valve's actuator sticks."
  },
  IP1: {
    name: "INJECTOR PLATE",
    what: "The real metering element: a swappable plate of small holes that sets the oxygen flow. The pressure drop across it must be at least 20 % of chamber pressure.",
    without: "A bare Ø10 inlet drops only 0.011 bar — zero stiffness — so the chamber pushes back on the feed. Flow and pressure chase each other: guaranteed chug."
  },
  PV3: {
    name: "N2 PURGE VALVE",
    what: "Blows nitrogen through the line: pre-fill before firing, then put out the fire and sweep leftover oxygen after. It is normally open, so losing power opens it.",
    without: "No purge at shutdown, and the flame creeps back into the plumbing. No pre-fill, and a fast valve opening can light the line."
  },
  CK2: {
    name: "CHECK VALVES ×2",
    what: "Two one-way valves in a row on the nitrogen line. Gas may flow toward the engine, never back.",
    without: "One alone cannot be trusted to stop oxygen creeping back into the nitrogen bottle. Then you own a high-pressure bottle and nobody knows what is in it."
  },
  PV1: {
    name: "VENT VALVE",
    what: "Lets the pressure out of the stand. Power holds it shut, so it opens by itself if power, air or signal is lost.",
    without: "A dead stand would sit there full of high-pressure oxygen. This is the most important fail-safe on the whole stand."
  },
  RV1: {
    name: "RELIEF VALVE 75 BAR",
    what: "Opens at 75 bar to let overpressure out. It has its own port, and no shut-off valve is ever allowed upstream of it.",
    without: "Without it, only the burst disc is left against overpressure. A shut-off valve upstream would cut it off from the pressure it guards, so that is never allowed."
  },
  RD1: {
    name: "BURST DISC 90 BAR",
    what: "The last resort: a disc that breaks open at 90 bar if the relief valve is not enough. It has its own separate port.",
    without: "If it shared a port with the relief valve, that one port would be a single point of failure. Lose the port and both safeties are gone at once."
  },
  PT2: {
    name: "PT-2 BOTTLE PRESSURE",
    what: "Pressure sensor on the bottle side. Before firing, the crew checks that its reading makes sense.",
    without: "A reading that does not add up means a leak or a bad sensor. Without it you would never know."
  },
  PT3: {
    name: "PT-3 MANIFOLD PRESSURE",
    what: "Pressure sensor on the manifold, the pipe just before the injector. It shows the pressure actually feeding the engine.",
    without: "Its blind branch pipe must be no longer than 3 times its inside diameter. Longer, and it becomes one more dead pocket for slammed oxygen to heat up."
  },
  PT4: {
    name: "PT-4 CHAMBER PRESSURE",
    what: "Pressure sensor inside the combustion chamber. Rising chamber pressure is the only trusted proof that the engine has lit.",
    without: "You would have to judge ignition by 'seeing fire', and that is not trusted. Open the oxygen on a false 'lit' and you get a hard start."
  },
  ARM: {
    name: "ARM KEY",
    what: "The one physical lock on the igniter circuit. The test conductor puts it in, takes it out, and keeps it in their own pocket.",
    without: "With the key out and in the conductor's pocket, the igniter circuit is open and cannot fire. Without it, nothing physical guards the igniter."
  },
  IGN: {
    name: "IGNITER",
    what: "Makes the first flame inside the chamber. The rule is: fire first, oxygen second.",
    without: "Swap the order and a burnable mix fills the chamber before the flame arrives. It all lights at once — a hard start."
  },
  ABORT: {
    name: "ABORT",
    what: "Anyone may shout it, at any time. One press: main valve shuts, vent opens, purge blows.",
    without: "After T−0 the sequence runs itself, because a human reacts in about 0.3 s — slower than the whole ignition start. Abort is the only input people keep."
  }
};

const INCIDENTS = {
  NO_LIGHT: {
    title: "Misfire — no ignition",
    happened: "The igniter fired, but chamber pressure never rose. No pressure rise means no ignition, whatever your eyes say.",
    number: "Pc = {Pc} bar  (must rise within 1.0 s of the igniter)  ·  O/F = {OF}",
    prevent: "Nobody moves for 30 minutes — by the clock, not by judgement. Next time, check there is oxygen flow and a mix that can burn."
  },
  HARD_START: {
    title: "Hard start",
    happened: "Oxygen got in before the flame. A burnable mix filled the chamber and lit all at once.",
    number: "Pspike = {Pspike} bar  (chamber design pressure 40 bar)",
    prevent: "Fire first, oxygen second. Wait for chamber pressure to rise before the main valve opens."
  },
  ADIABATIC: {
    title: "Line fire",
    happened: "Oxygen slammed into a low-pressure dead pipe and squeezed the gas until it was hot enough to light the line. A 2007 cold-flow test at Scaled Composites killed three — no igniter, no fuel.",
    number: "T2 = {T2} °C  (limit 400 °C)",
    prevent: "Do both: pre-fill the line with nitrogen to at least 1/3 of upstream pressure, and open the main valve over 0.3 s or more. 40 bar into 1 bar gives 568 °C; pre-filled to 15 bar, only 115 °C."
  },
  CHUG: {
    title: "Chug",
    happened: "The injector's pressure drop was too small, so the chamber pushed back on the feed. Flow and pressure chased each other in a low, heavy shake.",
    number: "Injector drop = {dP} % of Pc  (minimum 20 %)",
    prevent: "Fit the injector plate with small holes, so the drop is at least 20 % of chamber pressure. Our real engine runs 24.6–31.4 %."
  },
  BURST: {
    title: "Chamber burst",
    happened: "The throat was too small for the flow, so pressure piled up behind it. The chamber split open.",
    number: "Pc = {Pc} bar  (burst limit {Pburst} bar)",
    prevent: "Read the engine's design pressure before you set the regulator. A bad random engine says so in its note."
  },
  BURN_THROUGH: {
    title: "Burn-through",
    happened: "The burn ran too long. The wax fuel burned away and the flame reached the bare chamber wall.",
    number: "Burn time = {tburn} s  (fuel grain used up — wall exposed)",
    prevent: "Shut the main valve at the planned burn time. The real stand uses two triggers for that: a timer and chamber pressure."
  },
  FLASHBACK: {
    title: "Flashback",
    happened: "At shutdown the purge was missing, or weaker than the chamber. The flame ran backwards through the injector into the manifold.",
    number: "Purge = {Ppurge} bar  vs  Pc = {Pc} bar  (purge must be higher)",
    prevent: "Open the nitrogen purge 0.5 s after the main valve closes and keep it on for 30 s. Purge must beat chamber pressure: 25 bar against 12."
  },
  REG_FAIL: {
    title: "Regulator failed — relief valve held",
    happened: "The regulator failed and full bottle pressure rushed downstream. Relief valve RV-3 lifted at 70 bar and dumped it.",
    number: "Manifold = {Pman} bar  (relief lifts at 70 bar)  ·  bottle = {Pbottle} bar",
    prevent: "Nothing to fix: the safety design worked. Without RV-3, that pressure would have burst the downstream pipes."
  },
  POWER_CUT: {
    title: "Power cut — stand made itself safe",
    happened: "All power was lost. Every valve fell to its resting position: main valve shut, vent open, purge open.",
    number: "Manifold = {Pman} bar and falling to 0  (vent valve is normally-open)",
    prevent: "Nothing to fix: this is fail-safe design working. Each valve was chosen so that 'no power' means 'safe'."
  },
  CLEAN_RUN: {
    title: "Clean run",
    happened: "Pre-fill, fire first, slow valve, steady burn, purge, vent. Every step in order, every number inside its limit.",
    number: "Thrust {thrust} N  ·  Isp {Isp} s  ·  Burn {tburn} s  ·  Total impulse {impulse} N·s",
    prevent: "You pre-filled with nitrogen, lit the igniter before the oxygen, and opened the main valve slowly. Then you purged, vented and pulled the ARM key."
  }
};
/* ==== end modules/cards.js ==== */
