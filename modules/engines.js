/* ==== modules/engines.js — engine shape library + seeded random engine generator ====
   Contract: INTERFACE.md `ENGINES[key]` object. Pure classic-script JS: no DOM, no side
   effects, no Math.random, no Date. Units: mm, axisymmetric. `profile` is the INNER wall,
   x = 0 at the injector face, increasing to the nozzle exit.

   Exported names (the only ones the main line may use):  ENGINES, randomEngine(seed)
   Everything else is a helper with an `_eng` prefix (function declarations, so they are
   hoisted and the paste order does not matter).

   Extra informational field (the main line must never need it):
     flaw: null | "THROAT_TOO_SMALL" | "BELL_TOO_BIG" | "CHAMBER_TOO_SHORT"

   Where the numbers come from:
   - KNOWLEDGE.md §1 (real geometry), §2 (operating point, gamma), §5 (40 bar chamber), §6 (kerolox).
   - Anything NOT in KNOWLEDGE.md is marked "CHOICE:" below. */

/* ---------- reference numbers ---------- */
function _engRef() {
  return {
    chamberR: 40,        // §1 chamber Ø80
    chamberL: 140,       // §1 chamber length
    convL: 31.75,        // §1 convergent length (with 40 -> 8.255 this is a 45° cone)
    throatR: 8.255,      // §1 throat Ø16.51
    divL: 15.15,         // §1 divergent length
    exitR: 13.33,        // §1 exit Ø26.66 (area ratio 2.61)
    grainOuterR: 38,     // §1 grain Ø76
    grainPortR: 12.5,    // §1 port Ø25
    grainL: 120,         // §1 grain length
    gamma: 1.2,          // §2
    mdot: 0.143,         // §2 total flow, kg/s
    pc_bar: 10.8,        // CHOICE: midpoint of the §2 operating band 10.0–11.6 bar
    burst_bar: 40,       // §5 chamber design / structural pressure
    pa_bar: 1.01325      // standard sea-level atmosphere (physical constant, not in KNOWLEDGE.md)
  };
}

/* ---------- small numeric helpers ---------- */
function _engRound(v, d) {
  const k = Math.pow(10, d);
  return Math.round(v * k) / k;
}

// mulberry32 seeded PRNG -> function returning floats in [0, 1)
function _engMulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- isentropic nozzle relations (gamma from KNOWLEDGE §2) ---------- */
function _engAreaRatioFromMach(M, g) {
  return (1 / M) * Math.pow((2 / (g + 1)) * (1 + 0.5 * (g - 1) * M * M), (g + 1) / (2 * (g - 1)));
}

// area ratio Ae/At that expands chamber pressure down to exit pressure (pcOverPe = Pc / Pe)
function _engAreaRatioForPressure(pcOverPe, g) {
  const M = Math.sqrt((2 / (g - 1)) * (Math.pow(pcOverPe, (g - 1) / g) - 1));
  return _engAreaRatioFromMach(M, g);
}

// Pe / Pc for a given area ratio (supersonic branch, bisection on Mach number)
function _engExitPressureRatio(eps, g) {
  let lo = 1, hi = 15;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (_engAreaRatioFromMach(mid, g) < eps) lo = mid; else hi = mid;
  }
  const M = 0.5 * (lo + hi);
  return Math.pow(1 + 0.5 * (g - 1) * M * M, -g / (g - 1));
}

/* ---------- geometry helpers (shared by ENGINES and randomEngine) ---------- */

// Append points to `out`: rounds to 0.1 µm, drops exact duplicates, keeps x non-decreasing.
function _engAppend(out, pts) {
  for (let i = 0; i < pts.length; i++) {
    let x = _engRound(pts[i][0], 4);
    const r = _engRound(pts[i][1], 4);
    if (out.length) {
      const last = out[out.length - 1];
      if (x < last[0]) x = last[0];
      if (x === last[0] && r === last[1]) continue;
    }
    out.push([x, r]);
  }
  return out;
}

function _engLinePts(x0, r0, x1, r1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t, r0 + (r1 - r0) * t]);
  }
  return pts;
}

// Slope angle (rad) of the straight wall that joins two tangent fillets.
// L = axial length, H = radial change, S = sum of the two fillet radii. S = 0 -> plain cone.
function _engTangentAngle(L, H, S) {
  const A = Math.sqrt(L * L + (H - S) * (H - S));
  return Math.atan2(H - S, L) + Math.asin(Math.min(1, S / A));
}

// Inverse of the above: axial length needed for a chosen wall angle.
function _engLengthForAngle(H, S, angleRad) {
  return (S + (H - S) * Math.cos(angleRad)) / Math.sin(angleRad);
}

// Shrinks fillet radii until a tangent straight wall of less than 85° exists. Returns scale 0..1.
function _engFilletScale(L, H, S) {
  if (S <= 0) return 0;
  for (let k = 1; k > 0.05; k -= 0.1) {
    const s = S * k;
    const A = Math.sqrt(L * L + (H - s) * (H - s));
    if (s < 0.999 * A && _engTangentAngle(L, H, s) < 85 * Math.PI / 180 && H >= s * (1 - Math.cos(_engTangentAngle(L, H, s)))) return k;
  }
  return 0;
}

// Convergent: optional entry fillet -> straight cone -> optional upstream throat arc.
// Ends EXACTLY at [xStart + length, throatR].
function _engConvergent(xStart, chamberR, throatR, length, rEntry, rThroatUp, nArc, nLine) {
  const H = chamberR - throatR;
  const k = _engFilletScale(length, H, rEntry + rThroatUp);
  const r1 = rEntry * k, r2 = rThroatUp * k;
  const th = _engTangentAngle(length, H, r1 + r2);
  const xT = xStart + length;
  let pts = [];
  for (let i = 0; i <= nArc; i++) {
    const a = th * i / nArc;
    pts.push([xStart + r1 * Math.sin(a), chamberR - r1 * (1 - Math.cos(a))]);
  }
  const p1 = pts[pts.length - 1];
  const p2 = [xT - r2 * Math.sin(th), throatR + r2 * (1 - Math.cos(th))];
  pts = pts.concat(_engLinePts(p1[0], p1[1], p2[0], p2[1], nLine));
  for (let i = 1; i <= nArc; i++) {
    const a = th * (1 - i / nArc);
    pts.push([xT - r2 * Math.sin(a), throatR + r2 * (1 - Math.cos(a))]);
  }
  pts.push([xT, throatR]);
  return pts;
}

// Conical divergent: optional downstream throat arc -> straight cone. Ends at [xT + length, exitR].
function _engConeDivergent(xT, throatR, exitR, length, rThroatDown, nArc, nLine) {
  const H = exitR - throatR;
  const rd = rThroatDown * _engFilletScale(length, H, rThroatDown);
  const al = _engTangentAngle(length, H, rd);
  let pts = [];
  for (let i = 0; i <= nArc; i++) {
    const a = al * i / nArc;
    pts.push([xT + rd * Math.sin(a), throatR + rd * (1 - Math.cos(a))]);
  }
  const p = pts[pts.length - 1];
  pts = pts.concat(_engLinePts(p[0], p[1], xT + length, exitR, nLine));
  return pts;
}

// Rao-style bell length: frac × the length of a 15° cone of the same area ratio (textbook definition).
function _engBellLength(throatR, eps, frac) {
  return frac * (Math.sqrt(eps) - 1) * throatR / Math.tan(15 * Math.PI / 180);
}

// Bell wall angles (deg) at the inflection point (thetaN) and at the exit (thetaE).
// CHOICE: smooth fits to values read off Rao's textbook chart (e.g. 80 % bell: eps 4 -> 21.5°/14°,
// eps 25 -> ~30°/~8.5°). They only shape the drawing; they are NOT from KNOWLEDGE.md or our data.
function _engBellAngles(eps, frac) {
  const ln = Math.log(Math.max(eps, 1.5) / 4);
  let thN = 21.5 + 4.55 * ln + (0.8 - frac) * 26;
  let thE = 14 - 2.8 * ln + (0.8 - frac) * 25;
  thN = Math.min(45, Math.max(12, thN));
  thE = Math.min(22, Math.max(2, thE));
  return [thN, thE];
}

// Parabolic-approximation bell: downstream throat arc (0.382·Rt, Rao's standard) -> quadratic
// Bézier whose end tangents are thetaN and thetaE. Ends at [xT + length, exitR].
function _engBellDivergent(xT, throatR, exitR, length, thetaNdeg, thetaEdeg, nArc, nCurve) {
  const d2r = Math.PI / 180;
  // keep the two tangents on either side of the mean wall slope, otherwise no parabola fits
  const mean = Math.atan2(exitR - throatR, length) / d2r;
  const thN = Math.max(thetaNdeg, mean + 4) * d2r;
  const thE = Math.max(2, Math.min(thetaEdeg, mean - 4)) * d2r;
  const rd = 0.382 * throatR;
  const pts = [];
  for (let i = 0; i <= nArc; i++) {
    const a = thN * i / nArc;
    pts.push([xT + rd * Math.sin(a), throatR + rd * (1 - Math.cos(a))]);
  }
  const N = pts[pts.length - 1];
  const E = [xT + length, exitR];
  const m1 = Math.tan(thN), m2 = Math.tan(thE);
  let qx = (E[1] - N[1] + m1 * N[0] - m2 * E[0]) / (m1 - m2);
  let qr = N[1] + m1 * (qx - N[0]);
  if (!(qx > N[0] && qx < E[0] && qr >= N[1] && qr <= E[1])) { // fallback: straight wall
    qx = 0.5 * (N[0] + E[0]);
    qr = 0.5 * (N[1] + E[1]);
  }
  for (let i = 1; i <= nCurve; i++) {
    const t = i / nCurve, u = 1 - t;
    pts.push([u * u * N[0] + 2 * u * t * qx + t * t * E[0], u * u * N[1] + 2 * u * t * qr + t * t * E[1]]);
  }
  return pts;
}

// Volume of revolution under a wall contour (sum of frustums), mm³.
function _engVolume(pts) {
  let v = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], a = pts[i - 1][1], b = pts[i][1];
    v += Math.PI * dx / 3 * (a * a + a * b + b * b);
  }
  return v;
}

// Characteristic length L* in metres: free gas volume up to the throat (chamber + convergent,
// minus the solid fuel) divided by throat area.
function _engLstarM(e) {
  let iT = 0;
  for (let i = 0; i < e.profile.length; i++) if (e.profile[i][1] < e.profile[iT][1]) iT = i;
  let v = _engVolume(e.profile.slice(0, iT + 1));
  if (e.grain) v -= Math.PI * (e.grain.outerR * e.grain.outerR - e.grain.portR * e.grain.portR) * e.grain.length;
  return v / (Math.PI * e.throatR * e.throatR) / 1000;
}

// Assemble one engine object in the exact INTERFACE.md shape.
// s.nozzle: "cone" | "bell".  s.divL = divergent length.  Fillet radii may be 0 (sharp corners).
function _engBuild(s) {
  const pts = [];
  _engAppend(pts, _engLinePts(0, s.chamberR, s.chamberL, s.chamberR, 8));
  _engAppend(pts, _engConvergent(s.chamberL, s.chamberR, s.throatR, s.convL, s.rEntry, s.rThroatUp, 8, 14));
  const iT = pts.length - 1;
  const xT = s.chamberL + s.convL;
  if (s.nozzle === "bell") {
    const ang = _engBellAngles((s.exitR * s.exitR) / (s.throatR * s.throatR), s.bellFrac);
    _engAppend(pts, _engBellDivergent(xT, s.throatR, s.exitR, s.divL, ang[0], ang[1], 8, 24));
  } else {
    _engAppend(pts, _engConeDivergent(xT, s.throatR, s.exitR, s.divL, s.rThroatDown, 8, 16));
  }
  // pin the contract stations exactly; nothing may dip below the throat radius
  for (let i = 0; i < pts.length; i++) if (pts[i][1] < s.throatR) pts[i][1] = s.throatR;
  pts[0][1] = s.chamberR;
  pts[iT][1] = s.throatR;
  pts[pts.length - 1][1] = s.exitR;
  return {
    label: s.label,
    type: s.type,
    profile: pts,
    throatR: s.throatR,
    exitR: s.exitR,
    chamberR: s.chamberR,
    chamberL: s.chamberL,
    grain: s.grain,
    designPc_bar: s.designPc_bar,
    burstPc_bar: s.burstPc_bar,
    note: s.note,
    flaw: s.flaw || null
  };
}

// The real Astronauts91 grain (KNOWLEDGE §1).
// CHOICE: x0 = 10. KNOWLEDGE.md gives the grain length (120) and chamber length (140) but not the
// grain's axial position, so the 20 mm of slack is split evenly: 10 mm gap at the injector face,
// 10 mm gap before the convergent. The grain (x 10..130) sits fully inside the chamber (x 0..140).
function _engRealGrain() {
  const R = _engRef();
  return { outerR: R.grainOuterR, portR: R.grainPortR, length: R.grainL, x0: (R.chamberL - R.grainL) / 2 };
}

/* ---------- the four preset engines ---------- */
function _engPresets() {
  const R = _engRef();
  const g = R.gamma;

  // ast91 — KNOWLEDGE §1 to the digit. Sharp straight cones: the config gives lengths and
  // diameters only (no fillet radii), and 40 -> 8.255 over 31.75 is exactly a 45° cone.
  const ast91 = _engBuild({
    label: "Astronauts91 hybrid 350 N", type: "hybrid",
    chamberR: R.chamberR, chamberL: R.chamberL, throatR: R.throatR, exitR: R.exitR,
    convL: R.convL, rEntry: 0, rThroatUp: 0, nozzle: "cone", divL: R.divL, rThroatDown: 0,
    grain: _engRealGrain(), designPc_bar: R.pc_bar, burstPc_bar: R.burst_bar,
    note: "Our real 350 N paraffin and oxygen hybrid: throat 16.51 mm across, area ratio 2.61, runs at 10.0 to 11.6 bar in a chamber built for 40 bar."
  });

  // conical — same chamber and convergent, classic 15° half-angle cone, cut where the exit
  // pressure equals sea-level air at the 10.8 bar operating point (isentropic, gamma 1.2).
  const epsSL = _engAreaRatioForPressure(R.pc_bar / R.pa_bar, g);
  const conExitR = _engRound(R.throatR * Math.sqrt(epsSL), 2);
  const conEps = (conExitR * conExitR) / (R.throatR * R.throatR);
  const conical = _engBuild({
    label: "15° conical, sea level", type: "hybrid",
    chamberR: R.chamberR, chamberL: R.chamberL, throatR: R.throatR, exitR: conExitR,
    convL: R.convL, rEntry: 0, rThroatUp: 0, nozzle: "cone",
    divL: _engLengthForAngle(conExitR - R.throatR, 0, 15 * Math.PI / 180), rThroatDown: 0,
    grain: _engRealGrain(), designPc_bar: R.pc_bar, burstPc_bar: R.burst_bar,
    note: "Same chamber as our hybrid with a classic 15 degree cone, cut at area ratio " + conEps.toFixed(2) +
      " so the exhaust leaves at the same pressure as sea-level air when the chamber is at " + R.pc_bar + " bar."
  });

  // bell — LARGE Rao-style bell, parabolic approximation, 80 % length.
  // CHOICE: area ratio 16 (exit radius = 4 × throat radius). Not from KNOWLEDGE.md; picked so the
  // exit pressure is far below 1 bar and the nozzle is clearly over-expanded on a sea-level stand.
  // Throat arcs 1.5·Rt upstream / 0.382·Rt downstream are Rao's standard textbook values.
  const bellEps = 16;
  const bellExitR = _engRound(R.throatR * Math.sqrt(bellEps), 2);
  const bellPe = R.pc_bar * _engExitPressureRatio(bellEps, g);
  const bell = _engBuild({
    label: "Rao bell, area ratio 16", type: "hybrid",
    chamberR: R.chamberR, chamberL: R.chamberL, throatR: R.throatR, exitR: bellExitR,
    convL: R.convL, rEntry: 0, rThroatUp: 1.5 * R.throatR, nozzle: "bell", bellFrac: 0.8,
    divL: _engBellLength(R.throatR, bellEps, 0.8),
    grain: _engRealGrain(), designPc_bar: R.pc_bar, burstPc_bar: R.burst_bar,
    note: "A big 80 percent Rao-style bell at area ratio 16, sized for vacuum: at sea level its exit pressure is only about " +
      bellPe.toFixed(2) + " bar against 1 bar of outside air, so it is over-expanded and the flow separates from the wall on this stand."
  });

  // kerolox — KNOWLEDGE §6: the SAME chamber and nozzle geometry stays on the stand, only the
  // feed side changes (two pressurised tanks). No solid fuel, so grain = null.
  // CHOICE: designPc_bar reuses the hybrid's 10.8 bar (same throat, same chamber); §6 gives no Pc.
  const kerolox = _engBuild({
    label: "LOX / kerosene, pressure-fed", type: "liquid",
    chamberR: R.chamberR, chamberL: R.chamberL, throatR: R.throatR, exitR: R.exitR,
    convL: R.convL, rEntry: 0, rThroatUp: 0, nozzle: "cone", divL: R.divL, rThroatDown: 0,
    grain: null, designPc_bar: R.pc_bar, burstPc_bar: R.burst_bar,
    note: "Small pressure-fed liquid oxygen and kerosene engine that reuses our hybrid's chamber and nozzle as a simplification; its numbers (O/F about 2.3, c* about 1780 m/s) are textbook-scale, not our test data."
  });

  return { ast91: ast91, conical: conical, bell: bell, kerolox: kerolox };
}

const ENGINES = _engPresets();

/* ---------- seeded random engine ---------- */
// Deterministic per seed. Varies contraction ratio, L*, expansion ratio, bell fraction and
// conical-vs-bell. About one seed in three is a deliberately bad design (see `flaw` and `note`).
//
// All ranges below are CHOICES (not in KNOWLEDGE.md), anchored on our real engine:
// - Same stand flow (0.143 kg/s) and propellants, so chamber pressure scales with 1 / throat area
//   from our real point: Ø16.51 throat <-> 10.8 bar.
// - Good throat: sized for 8–16 bar. Bad throat: sized so pressure heads for 50–75 bar (> 40 bar).
// - Contraction ratio 12–30 (our real engine: 23.5); 12–18 when the flaw is a too-short chamber.
// - Good L* 1.0–1.8 m (our real engine, free volume / throat area: about 1.3 m).
//   Bad chamber: only 0.03–0.12 m of L* on top of what the convergent alone provides.
// - Good area ratio: 0.85–1.25 × the sea-level ideal for its pressure. Bad bell: area ratio 14–30.
// - Bell fraction 0.60–0.95. Convergent half-angle 45° (as our real engine).
// - Port Ø25 kept (same oxidiser flow and G_ox as §2); grain fills the chamber in the same
//   proportions as the real one (2 mm radial gap, 6/7 of chamber length, centred).
// - burstPc_bar = 40: same chamber build standard as §5.
function randomEngine(seed) {
  const R = _engRef();
  const s = (Number(seed) || 0) >>> 0;
  const rnd = _engMulberry32(s);
  // fixed draw order -> same seed, same engine
  const uBad = rnd(), uKind = rnd(), uPc = rnd(), uCR = rnd(), uL = rnd(),
    uEps = rnd(), uFrac = rnd(), uNoz = rnd(), uSev = rnd();

  const flaw = uBad < 1 / 3 ? ["THROAT_TOO_SMALL", "BELL_TOO_BIG", "CHAMBER_TOO_SHORT"][Math.min(2, Math.floor(uKind * 3))] : null;

  // what the designer aimed for
  const pcNom = 8 + 8 * uPc;
  const rtNom = R.throatR * Math.sqrt(R.pc_bar / pcNom);
  const atNom = Math.PI * rtNom * rtNom;
  // CHOICE: a too-short chamber is drawn with a slimmer contraction ratio (12–18). With a 45° convergent,
  // a fat chamber's cone alone holds ~0.6 m of L*, which would hide the flaw; this keeps its L* under ~0.5 m.
  const CR = flaw === "CHAMBER_TOO_SHORT" ? 12 + 6 * uCR : 12 + 18 * uCR;
  const chamberR = _engRound(rtNom * Math.sqrt(CR), 1);

  // throat actually built
  const throatR = _engRound(flaw === "THROAT_TOO_SMALL" ? R.throatR * Math.sqrt(R.pc_bar / (50 + 25 * uSev)) : rtNom, 2);
  const pcRun = _engRound(R.pc_bar * (R.throatR * R.throatR) / (throatR * throatR), 1);

  // nozzle
  const isBell = flaw === "BELL_TOO_BIG" ? true : uNoz < 0.5;
  const frac = _engRound(0.6 + 0.35 * uFrac, 2);
  const epsIdeal = _engAreaRatioForPressure(pcNom / R.pa_bar, R.gamma);
  const epsWant = flaw === "BELL_TOO_BIG" ? 14 + 16 * uSev : epsIdeal * (0.85 + 0.4 * uEps);
  const exitR = _engRound(throatR * Math.sqrt(epsWant), 2);
  const eps = (exitR * exitR) / (throatR * throatR);
  const divL = isBell ? _engBellLength(throatR, eps, frac)
    : _engLengthForAngle(exitR - throatR, 0.382 * throatR, 15 * Math.PI / 180);

  // convergent: 45° wall with a soft chamber corner and a 1.5·Rt throat arc
  const rEntry = 0.2 * chamberR, rUp = 1.5 * throatR;
  const convL = _engLengthForAngle(chamberR - throatR, rEntry + rUp, 45 * Math.PI / 180);
  const vConv = _engVolume(_engConvergent(0, chamberR, throatR, convL, rEntry, rUp, 8, 14));

  // chamber length from the L* target (free volume = chamber + convergent − solid fuel)
  const outerR = _engRound(chamberR - 2, 1), portR = R.grainPortR;
  const freeArea = Math.PI * (chamberR * chamberR - (6 / 7) * (outerR * outerR - portR * portR));
  const lstarWant = flaw === "CHAMBER_TOO_SHORT" ? vConv / atNom / 1000 + 0.03 + 0.09 * uSev : 1.0 + 0.8 * uL;
  let chamberL = (lstarWant * 1000 * atNom - vConv) / freeArea;
  chamberL = _engRound(Math.min(240, Math.max(0.3 * chamberR, chamberL)), 1); // keep it drawable
  const grain = { outerR: outerR, portR: portR, length: _engRound(chamberL * 6 / 7, 1), x0: _engRound(chamberL / 14, 1) };

  const e = _engBuild({
    label: "Random #" + s, type: "hybrid",
    chamberR: chamberR, chamberL: chamberL, throatR: throatR, exitR: exitR,
    convL: convL, rEntry: rEntry, rThroatUp: rUp,
    nozzle: isBell ? "bell" : "cone", bellFrac: frac, divL: divL, rThroatDown: 0.382 * throatR,
    grain: grain, designPc_bar: pcRun, burstPc_bar: R.burst_bar, note: "", flaw: flaw
  });

  const lstar = _engLstarM(e);
  const lstarReal = _engLstarM(ENGINES.ast91);
  const dT = (2 * throatR).toFixed(1);
  const shape = isBell ? Math.round(frac * 100) + " percent bell" : "15 degree cone";
  if (flaw === "THROAT_TOO_SMALL") {
    e.note = "Bad design: the " + dT + " mm throat is too small for the stand's " + R.mdot + " kg/s, so chamber pressure heads for about " +
      Math.round(pcRun) + " bar, past the " + R.burst_bar + " bar chamber limit, and it will burst.";
  } else if (flaw === "BELL_TOO_BIG") {
    e.note = "Bad design: the area ratio " + eps.toFixed(0) + " bell is sized for vacuum, so at sea level its exit pressure is only about " +
      (pcRun * _engExitPressureRatio(eps, R.gamma)).toFixed(2) + " bar against 1 bar of outside air and the flow separates from the wall.";
  } else if (flaw === "CHAMBER_TOO_SHORT") {
    e.note = "Bad design: the chamber is only " + chamberL.toFixed(0) + " mm long (L* " + lstar.toFixed(2) + " m against about " +
      lstarReal.toFixed(1) + " m on our real engine), so the gas leaves before it finishes burning: poor combustion, and it may not light.";
  } else {
    e.note = "Sound design: the " + dT + " mm throat holds about " + pcRun.toFixed(1) + " bar at the stand's " + R.mdot +
      " kg/s (limit " + R.burst_bar + " bar), the " + shape + " at area ratio " + eps.toFixed(2) +
      " is close to the sea-level ideal, and L* " + lstar.toFixed(2) + " m gives the gas room to finish burning.";
  }
  return e;
}
/* ==== end modules/engines.js ==== */
