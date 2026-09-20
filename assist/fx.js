/* ==== FX ART PACK (assist/fx.js) ====
   Pure Canvas 2D drawing functions in the STYLE-REFERENCE palette.
   No DOM access, no libraries, no per-frame array/object allocation
   (particle pools are typed arrays created once inside the state object).
   Works as <script src="fx.js"> or pasted straight into engine.html.
   Only names introduced: FX_PAL, _fx* helpers, and the public functions below.

   drawPlume(ctx, {x,y,exitR,mach,peOverPa,thrust01,t, dir?, bellLen?})
   fxExplosionCreate() / fxExplosionStart(state,x,y) / fxExplosionDraw(ctx,state,dt)
   fxMisfireCreate()   / fxMisfireStart(state,x,y)   / fxMisfireDraw(ctx,state,dt)
   drawPipeFlow(ctx, points, {flow01,fluid,t, width?, phase?})
   drawValve(ctx, x, y, {kind,open01,failSafe,hot, angle?,size?,label?,glow?})
   drawGauge(ctx, x, y, r, {value,max,redline,label,unit})
   drawHeatHaze(ctx, {x,y,w,h,intensity01,t})
   fxShake(thrust01, t, out?) -> {dx,dy}
*/
const FX_PAL = Object.freeze({
  bg: '#070a12', panel: '#101725', panel2: '#0c111c', line: '#232d44',
  text: '#e9eef7', muted: '#8b98b2',
  amber: '#ffb347', flame: '#ff7a1a', cyan: '#5fd3ff', green: '#6ee7a0', red: '#ff5c6c',
  white: '#fff6e6', smoke: '#566074', metal: '#3a465f',
  fluid: Object.freeze({ gox: '#5fd3ff', n2: '#6ee7a0', lox: '#8fb0ff', kerosene: '#ffb347', hot: '#ff7a1a', vent: '#8b98b2' }),
  dash: Object.freeze([10, 8]), nodash: Object.freeze([]),
  mono: '"SF Mono","JetBrains Mono",Menlo,Consolas,monospace'
});
function _fxClamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* ---------------------------------------------------------------------------
   drawPlume(ctx, {x, y, exitR, mach, peOverPa, thrust01, t, dir?, bellLen?})
   x,y      nozzle exit centre (px).  exitR exit radius (px).  dir flow angle (rad, default 0 = +x).
   mach     exit Mach number -> shock-cell length ~ 2*exitR*sqrt(M^2-1)*(Pe/Pa)^0.4
   peOverPa <1 over-expanded: plume pinches, diamonds sit at the pinches, close together
            >1 under-expanded: plume balloons, diamonds sit at the necks
            <0.4 with bellLen>0: flow separation — a narrow ragged jet starts INSIDE the bell
   thrust01 0..1 overall intensity/length.  t seconds (flicker only).  Draws nothing at thrust01≈0.
--------------------------------------------------------------------------- */
function _fxPlumeR(s, R, lam, a, L, t, sep) {
  const u = s / L;
  let r = R;
  if (s >= 0) {
    const c = Math.sin(Math.PI * s / lam);
    r *= 1 + a * c * c * Math.exp(-s / (2.5 * lam));
    if (u > 0.55) { const q = (u - 0.55) / 0.45; r *= 1 - q * q; }
  } else {
    r *= 1 + 0.35 * s / (R * 3);           // jet narrows going upstream into the bell
  }
  r *= 1 + 0.04 * Math.sin(t * 47 + s * 0.31) + 0.03 * Math.sin(t * 31 - s * 0.17);
  if (sep > 0) r += R * 0.09 * sep * Math.sin(t * 41 + s * 0.33) * Math.sin(t * 17 + s * 0.13);
  return r > 0 ? r : 0;
}
function _fxPlumePath(ctx, s0, L, R, lam, a, t, sep, k, spread) {
  const N = 36;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const s = s0 + (L - s0) * i / N;
    const r = _fxPlumeR(s, R, lam, a, L, t, sep) * k + (s > 0 ? s * spread * (1 - s / L) : 0);
    if (i === 0) ctx.moveTo(s, -r); else ctx.lineTo(s, -r);
  }
  for (let i = N; i >= 0; i--) {
    const s = s0 + (L - s0) * i / N;
    const r = _fxPlumeR(s, R, lam, a, L, t + 3.7, sep) * k + (s > 0 ? s * spread * (1 - s / L) : 0);
    ctx.lineTo(s, r);
  }
  ctx.closePath();
}
function drawPlume(ctx, p) {
  const th = _fxClamp(p.thrust01 || 0, 0, 1);
  if (th < 0.003) return;
  const R0 = p.exitR, t = p.t || 0;
  const M = Math.max(1.02, isFinite(p.mach) ? p.mach : 2);
  const pr = _fxClamp(isFinite(p.peOverPa) ? p.peOverPa : 1, 0.05, 20);
  const bellLen = p.bellLen || 0;
  const sep = (pr < 0.4 && bellLen > 0) ? _fxClamp((0.4 - pr) / 0.3, 0, 1) : 0;
  const R = R0 * (1 - 0.5 * sep);
  const lnp = Math.log(pr);
  const lam = _fxClamp(0.9 * 2 * R * Math.sqrt(M * M - 1) * Math.pow(pr, 0.4), R * 0.9, R * 14);
  const a = lnp >= 0 ? Math.min(1.4, 0.55 * lnp) : -Math.min(0.55, 0.5 * -lnp);
  const L = (R0 * 8 + 3.2 * lam) * (0.35 + 0.65 * th);
  const s0 = -bellLen * 0.6 * sep;

  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.dir) ctx.rotate(p.dir);
  if (sep > 0) {
    // recirculation zone: dark, cold ambient air sucked in between the detached jet and the bell wall
    // (wall assumed ~linear from 0.35*exitR at the throat to exitR at the lip)
    for (let sgn = -1; sgn <= 1; sgn += 2) {
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const q = s0 * (1 - i / 12); ctx.lineTo(q, sgn * R0 * (1 + 0.65 * q / bellLen) * 0.96); }
      for (let i = 12; i >= 0; i--) { const q = s0 * (1 - i / 12); ctx.lineTo(q, sgn * _fxPlumeR(q, R, lam, a, L, t, 0) * 0.95); }
      ctx.closePath();
      ctx.globalAlpha = 0.85 * sep; ctx.fillStyle = '#01030a'; ctx.fill();
      ctx.globalAlpha = 0.30 * sep; ctx.fillStyle = FX_PAL.cyan; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'lighter';

  // outer mixing layer
  let g = ctx.createLinearGradient(s0, 0, L, 0);
  g.addColorStop(0, 'rgba(255,122,26,0.55)'); g.addColorStop(0.5, 'rgba(255,90,20,0.28)'); g.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.globalAlpha = 0.75 * th;
  ctx.shadowColor = FX_PAL.flame; ctx.shadowBlur = 24;
  ctx.fillStyle = g;
  _fxPlumePath(ctx, s0, L, R, lam, a, t, sep, 1.18, 0.10);
  ctx.fill();
  ctx.shadowBlur = 0;
  // body
  g = ctx.createLinearGradient(s0, 0, L * 0.9, 0);
  g.addColorStop(0, 'rgba(255,190,90,0.9)'); g.addColorStop(0.6, 'rgba(255,140,40,0.4)'); g.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.globalAlpha = 0.85 * th;
  ctx.fillStyle = g;
  _fxPlumePath(ctx, s0, L * 0.9, R, lam, a, t * 1.3, sep, 0.8, 0.03);
  ctx.fill();
  // white-hot core
  g = ctx.createLinearGradient(s0, 0, L * 0.7, 0);
  g.addColorStop(0, 'rgba(255,250,235,0.95)'); g.addColorStop(0.5, 'rgba(255,225,170,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.globalAlpha = th;
  ctx.fillStyle = g;
  _fxPlumePath(ctx, s0, L * 0.7, R, lam, a, t * 1.7, sep, 0.42, 0);
  ctx.fill();

  // shock diamonds (Mach disks): at pinches when over-expanded, at necks when under-expanded
  const dI = _fxClamp(Math.abs(lnp) * 1.4 + 0.12, 0, 1);
  ctx.fillStyle = FX_PAL.white;
  ctx.shadowColor = FX_PAL.amber; ctx.shadowBlur = 14;
  for (let k = 1; k <= 7; k++) {
    const s = lam * (a < 0 ? k - 0.5 : k);
    if (s > L * 0.8) break;
    const rr = _fxPlumeR(s, R, lam, a, L, t, 0);
    const h = rr * 0.62, w = Math.min(lam * 0.24, rr * 1.6) * (1 + 0.08 * Math.sin(t * 40 + k));
    ctx.globalAlpha = th * dI * Math.exp(-(k - 1) * 0.42) * (0.85 + 0.15 * Math.sin(t * 53 + k * 2.1));
    ctx.beginPath();
    ctx.moveTo(s - w, 0); ctx.lineTo(s, -h); ctx.lineTo(s + w * 1.5, 0); ctx.lineTo(s, h);
    ctx.closePath(); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // separation: bright ragged shear-layer edge on the detached jet, then ambient air curling back in
  if (sep > 0) {
    const e1 = R0 * 1.2;
    ctx.strokeStyle = FX_PAL.white; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.shadowColor = FX_PAL.amber; ctx.shadowBlur = 10; ctx.globalAlpha = 0.9 * sep * th;
    for (let sgn = -1; sgn <= 1; sgn += 2) {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const q = s0 + (e1 - s0) * i / 16; ctx.lineTo(q, sgn * _fxPlumeR(q, R, lam, a, L, t + (sgn > 0 ? 3.7 : 0), sep) * 1.05); }
      ctx.stroke();
    }
    // detachment point ticks on the wall
    ctx.shadowBlur = 0; ctx.strokeStyle = FX_PAL.cyan; ctx.lineWidth = 2; ctx.globalAlpha = 0.9 * sep;
    ctx.globalCompositeOperation = 'source-over';
    const wr = R0 * (1 + 0.65 * s0 / bellLen);
    ctx.beginPath(); ctx.moveTo(s0, -wr); ctx.lineTo(s0, -wr * 0.72); ctx.moveTo(s0, wr); ctx.lineTo(s0, wr * 0.72); ctx.stroke();
    ctx.strokeStyle = FX_PAL.cyan; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.75 * sep;
    const cx = -bellLen * 0.22, cy = (R0 + R) * 0.5, cr = Math.max(2, (R0 - R) * 0.42);
    for (let sgn = -1; sgn <= 1; sgn += 2) {
      const a0 = t * 5 * sgn;
      ctx.beginPath(); ctx.arc(cx, cy * sgn, cr, a0, a0 + 4.2, sgn < 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - cr * 2.4, cy * sgn * 0.92, cr * 0.7, -a0, -a0 + 4.2, sgn > 0); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   Explosion.  state = fxExplosionCreate()  (or any {} — pools are made on first Start)
   fxExplosionStart(state, x, y)      arm the sequence at x,y. Optional before Start:
                                      state.groundY (px, debris bounces), state.scale (default 1)
   fxExplosionDraw(ctx, state, dt)    advance by dt seconds and draw. Call every frame.
   Timeline: frame 0 full-canvas white flash (fades in 0.15 s) -> fireball + sparks ->
             debris with gravity + expanding shock ring -> smoke -> state.done = true at ~4.5 s
             (a scorch mark keeps drawing after done; set state.active=false to clear it).
--------------------------------------------------------------------------- */
function fxExplosionCreate() {
  const N = 64, S = 96, K = 40;
  return {
    active: false, done: false, t: 0, frame: 0, x: 0, y: 0, scale: 1, groundY: 1e9,
    dN: N, dx: new Float32Array(N), dy: new Float32Array(N), dvx: new Float32Array(N), dvy: new Float32Array(N),
    drot: new Float32Array(N), dvr: new Float32Array(N), dsz: new Float32Array(N),
    sN: S, sx: new Float32Array(S), sy: new Float32Array(S), svx: new Float32Array(S), svy: new Float32Array(S), slife: new Float32Array(S),
    kN: K, kx: new Float32Array(K), ky: new Float32Array(K), kvx: new Float32Array(K), kvy: new Float32Array(K),
    ksz: new Float32Array(K), klife: new Float32Array(K), kborn: new Float32Array(K)
  };
}
function fxExplosionStart(state, x, y) {
  if (!state.dx) {
    const gy = state.groundY, sc = state.scale;
    Object.assign(state, fxExplosionCreate());
    if (gy !== undefined) state.groundY = gy;
    if (sc !== undefined) state.scale = sc;
  }
  const k = state.scale || 1;
  state.active = true; state.done = false; state.t = 0; state.frame = 0; state.x = x; state.y = y;
  for (let i = 0; i < state.dN; i++) {
    const an = Math.random() * Math.PI * 2, sp = (180 + Math.random() * 620) * k;
    state.dx[i] = x; state.dy[i] = y;
    state.dvx[i] = Math.cos(an) * sp; state.dvy[i] = Math.sin(an) * sp - 220 * k;
    state.drot[i] = Math.random() * 6.28; state.dvr[i] = (Math.random() - 0.5) * 24;
    state.dsz[i] = (2 + Math.random() * Math.random() * 11) * k;
  }
  for (let i = 0; i < state.sN; i++) {
    const an = Math.random() * Math.PI * 2, sp = (300 + Math.random() * 900) * k;
    state.sx[i] = x; state.sy[i] = y;
    state.svx[i] = Math.cos(an) * sp; state.svy[i] = Math.sin(an) * sp;
    state.slife[i] = 0.35 + Math.random() * 0.9;
  }
  for (let i = 0; i < state.kN; i++) {
    const an = Math.random() * Math.PI * 2, sp = (20 + Math.random() * 170) * k;
    state.kx[i] = x + Math.cos(an) * 34 * k; state.ky[i] = y + Math.sin(an) * 26 * k;
    state.kvx[i] = Math.cos(an) * sp; state.kvy[i] = Math.sin(an) * sp * 0.6 - (25 + Math.random() * 55) * k;
    state.ksz[i] = (14 + Math.random() * 26) * k;
    state.klife[i] = 2.4 + Math.random() * 2.0; state.kborn[i] = Math.random() * 0.7;
  }
}
function fxExplosionDraw(ctx, state, dt) {
  if (!state.active) return;
  const k = state.scale || 1, x = state.x, y = state.y;
  const first = state.frame === 0;
  state.t += dt; state.frame++;
  const t = state.t;
  ctx.save();

  // scorch mark (persists)
  ctx.globalAlpha = 0.55 * _fxClamp(t * 3, 0, 1);
  ctx.fillStyle = '#020306';
  ctx.beginPath(); ctx.ellipse(x, y, 70 * k, 38 * k, 0, 0, 6.2832); ctx.fill();
  if (t > 4.5) { state.done = true; ctx.restore(); return; }

  // smoke
  ctx.fillStyle = FX_PAL.smoke;
  for (let i = 0; i < state.kN; i++) {
    const age = t - state.kborn[i];
    if (age < 0 || age > state.klife[i]) continue;
    const dr = Math.exp(-1.6 * dt);
    state.kvx[i] *= dr; state.kvy[i] = state.kvy[i] * dr - 14 * k * dt;
    state.kx[i] += state.kvx[i] * dt; state.ky[i] += state.kvy[i] * dt;
    ctx.globalAlpha = 0.11 * (1 - age / state.klife[i]) * _fxClamp(age * 4, 0, 1);
    ctx.beginPath(); ctx.arc(state.kx[i], state.ky[i], state.ksz[i] * (1 + age * 1.1), 0, 6.2832); ctx.fill();
  }

  // fireball
  ctx.globalCompositeOperation = 'lighter';
  if (t < 1.0) {
    const fr = (30 + 190 * (1 - Math.exp(-t * 9))) * k;
    const g = ctx.createRadialGradient(x, y, 0, x, y, fr);
    g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(0.35, 'rgba(255,179,71,0.85)');
    g.addColorStop(0.7, 'rgba(255,122,26,0.4)'); g.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.globalAlpha = _fxClamp(1 - t / 1.0, 0, 1);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, fr, 0, 6.2832); ctx.fill();
  }
  // sparks (streaks)
  ctx.strokeStyle = FX_PAL.amber; ctx.lineWidth = 1.6 * k; ctx.lineCap = 'round';
  for (let i = 0; i < state.sN; i++) {
    if (t > state.slife[i]) continue;
    const dr = Math.exp(-2.2 * dt);
    state.svx[i] *= dr; state.svy[i] = state.svy[i] * dr + 500 * k * dt;
    state.sx[i] += state.svx[i] * dt; state.sy[i] += state.svy[i] * dt;
    ctx.globalAlpha = 1 - t / state.slife[i];
    ctx.beginPath(); ctx.moveTo(state.sx[i], state.sy[i]);
    ctx.lineTo(state.sx[i] - state.svx[i] * 0.03, state.sy[i] - state.svy[i] * 0.03); ctx.stroke();
  }

  // debris (gravity, bounce on groundY)
  ctx.globalCompositeOperation = 'source-over';
  const heat = _fxClamp(1 - t / 1.2, 0, 1);
  for (let i = 0; i < state.dN; i++) {
    state.dvy[i] += 900 * k * dt;
    state.dvx[i] *= Math.exp(-0.5 * dt);
    state.dx[i] += state.dvx[i] * dt; state.dy[i] += state.dvy[i] * dt;
    if (state.dy[i] > state.groundY) {
      state.dy[i] = state.groundY; state.dvy[i] *= -0.32; state.dvx[i] *= 0.6; state.dvr[i] *= 0.5;
      if (Math.abs(state.dvy[i]) < 30 * k) { state.dvy[i] = 0; state.dvr[i] = 0; state.dvx[i] *= 0.8; }
    }
    state.drot[i] += state.dvr[i] * dt;
    const sz = state.dsz[i];
    ctx.save();
    ctx.translate(state.dx[i], state.dy[i]); ctx.rotate(state.drot[i]);
    ctx.globalAlpha = _fxClamp(4.5 - t, 0, 1);
    ctx.fillStyle = FX_PAL.metal; ctx.fillRect(-sz, -sz * 0.4, sz * 2, sz * 0.8);
    if (heat > 0) { ctx.globalAlpha = heat; ctx.fillStyle = (i & 1) ? FX_PAL.amber : FX_PAL.flame; ctx.fillRect(-sz, -sz * 0.4, sz * 2, sz * 0.8); }
    ctx.restore();
  }

  // shock ring
  if (t < 0.9) {
    const rr = 760 * k * Math.pow(t, 0.72);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8 * (1 - t / 0.9);
    ctx.strokeStyle = FX_PAL.white; ctx.lineWidth = (10 * (1 - t / 0.9) + 1) * k;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.stroke();
  }
  // white flash: one full frame, then a very fast fade
  if (first || t < 0.15) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = first ? 1 : 0.8 * (1 - t / 0.15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   Misfire (NO_LIGHT).  state = fxMisfireCreate() (or {}).
   fxMisfireStart(state, x, y) / fxMisfireDraw(ctx, state, dt)
   0–0.4 s igniter spark crackle -> 0.25–2.3 s one small grey puff drifting up -> nothing.
   state.done = true at 2.5 s. The silence is the effect.
--------------------------------------------------------------------------- */
function fxMisfireCreate() {
  const S = 14, K = 8;
  return {
    active: false, done: false, t: 0, x: 0, y: 0, scale: 1,
    sN: S, sx: new Float32Array(S), sy: new Float32Array(S), svx: new Float32Array(S), svy: new Float32Array(S), slife: new Float32Array(S),
    kN: K, kx: new Float32Array(K), ky: new Float32Array(K), kvx: new Float32Array(K), kvy: new Float32Array(K), ksz: new Float32Array(K)
  };
}
function fxMisfireStart(state, x, y) {
  if (!state.sx) { const sc = state.scale; Object.assign(state, fxMisfireCreate()); if (sc !== undefined) state.scale = sc; }
  const k = state.scale || 1;
  state.active = true; state.done = false; state.t = 0; state.x = x; state.y = y;
  for (let i = 0; i < state.sN; i++) {
    const an = Math.random() * 6.2832, sp = (40 + Math.random() * 160) * k;
    state.sx[i] = x; state.sy[i] = y; state.svx[i] = Math.cos(an) * sp; state.svy[i] = Math.sin(an) * sp;
    state.slife[i] = 0.12 + Math.random() * 0.3;
  }
  for (let i = 0; i < state.kN; i++) {
    state.kx[i] = x + (Math.random() - 0.5) * 8 * k; state.ky[i] = y + (Math.random() - 0.5) * 8 * k;
    state.kvx[i] = (10 + Math.random() * 26) * k; state.kvy[i] = -(6 + Math.random() * 16) * k;
    state.ksz[i] = (5 + Math.random() * 7) * k;
  }
}
function fxMisfireDraw(ctx, state, dt) {
  if (!state.active) return;
  state.t += dt;
  const t = state.t, k = state.scale || 1, x = state.x, y = state.y;
  if (t > 2.5) { state.done = true; state.active = false; return; }
  ctx.save();
  if (t > 0.25) {
    const age = t - 0.25;
    ctx.fillStyle = FX_PAL.smoke;
    for (let i = 0; i < state.kN; i++) {
      const dr = Math.exp(-1.2 * dt);
      state.kvx[i] *= dr; state.kvy[i] *= dr;
      state.kx[i] += state.kvx[i] * dt; state.ky[i] += state.kvy[i] * dt;
      ctx.globalAlpha = 0.22 * _fxClamp(age * 5, 0, 1) * _fxClamp(1 - age / 2.05, 0, 1);
      ctx.beginPath(); ctx.arc(state.kx[i], state.ky[i], state.ksz[i] * (1 + age * 0.9), 0, 6.2832); ctx.fill();
    }
  }
  if (t < 0.45) {
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.5 + 0.5 * Math.sin(t * 190) * Math.sin(t * 67);
    ctx.globalAlpha = _fxClamp(1 - t / 0.45, 0, 1) * (0.4 + 0.6 * fl);
    ctx.shadowColor = FX_PAL.cyan; ctx.shadowBlur = 12;
    ctx.strokeStyle = FX_PAL.white; ctx.lineWidth = 1.4 * k; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {               // crackling star
      const an = j * 0.785 + t * 40, len = (8 + 9 * fl) * k;
      ctx.moveTo(x - Math.cos(an) * len, y - Math.sin(an) * len); ctx.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = FX_PAL.amber; ctx.lineWidth = 1.1 * k;
    for (let i = 0; i < state.sN; i++) {
      if (t > state.slife[i]) continue;
      state.svy[i] += 380 * k * dt;
      state.sx[i] += state.svx[i] * dt; state.sy[i] += state.svy[i] * dt;
      ctx.globalAlpha = 1 - t / state.slife[i];
      ctx.beginPath(); ctx.moveTo(state.sx[i], state.sy[i]);
      ctx.lineTo(state.sx[i] - state.svx[i] * 0.04, state.sy[i] - state.svy[i] * 0.04); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   drawPipeFlow(ctx, points, {flow01, fluid, t, width?, phase?})
   points   polyline, [[x,y],…] or [{x,y},…] (caller pre-allocates; not modified)
   flow01   0..1 -> dash speed and brightness (0 = dim static pipe; negative = reverse flow)
   fluid    'gox'|'n2'|'lox'|'kerosene'|'hot'|'vent' -> fixed colour (FX_PAL.fluid)
   t        seconds. For glitch-free speed changes pass phase (px, caller integrates
            phase += flow01*140*dt) and it is used instead of t*flow01.
--------------------------------------------------------------------------- */
function _fxPolyline(ctx, pts) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const q = pts[i], px = q.x !== undefined ? q.x : q[0], py = q.y !== undefined ? q.y : q[1];
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
}
function drawPipeFlow(ctx, points, o) {
  if (!points || points.length < 2) return;
  const f = _fxClamp(o.flow01 || 0, -1, 1), af = Math.abs(f), w = o.width || 7;
  const col = FX_PAL.fluid[o.fluid] || FX_PAL.muted;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  ctx.setLineDash(FX_PAL.nodash);
  _fxPolyline(ctx, points);
  ctx.strokeStyle = FX_PAL.line; ctx.lineWidth = w; ctx.stroke();            // pipe wall
  ctx.strokeStyle = FX_PAL.panel2; ctx.lineWidth = w - 2.5; ctx.stroke();    // bore
  ctx.strokeStyle = col; ctx.globalAlpha = 0.16 + 0.22 * af; ctx.lineWidth = w - 2.5; ctx.stroke(); // fluid tint
  if (af > 0.004) {
    ctx.setLineDash(FX_PAL.dash);
    ctx.lineDashOffset = -(o.phase !== undefined ? o.phase : (o.t || 0) * f * 140);
    ctx.globalAlpha = 0.45 + 0.55 * af;
    ctx.lineWidth = Math.max(1.5, w - 4.5);
    if (o.fluid === 'hot') { ctx.shadowColor = col; ctx.shadowBlur = 8; }
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   drawValve(ctx, x, y, {kind, open01, failSafe, hot, angle?, size?, label?})
   kind     'manual' (bow-tie + lever that swings 90°: across pipe = closed, along pipe = open)
            'pneumatic' (bow-tie + stem + actuator dome with spring, NO/NC letter, travel pip)
            'check' (arrow + seat bar; flow direction = +x of angle)
            'relief' (angle valve + spring; vents upward when open01>0)
            'burstDisc' (domed disc between flanges; open01>=0.5 = ruptured petals)
   open01   0 closed … 1 open (caller tweens).  failSafe 'NO'|'NC' (pneumatic only).
   hot      true -> red/flame glow (over-temperature or over-pressure).
   angle    pipe direction in rad (default 0).  size half-length px (default 14).  label below.
   glow     0..1 extra flash energy on actuation; caller decays it: glow *= Math.exp(-dt * 6).
--------------------------------------------------------------------------- */
function drawValve(ctx, x, y, o) {
  const s = o.size || 14, op = _fxClamp(o.open01 || 0, 0, 1), kind = o.kind || 'manual';
  const live = o.hot ? FX_PAL.red : FX_PAL.green;
  ctx.save();
  ctx.translate(x, y);
  if (o.label) {
    ctx.font = '10px ' + FX_PAL.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = FX_PAL.muted; ctx.fillText(o.label, 0, s + 6);
  }
  if (o.angle) ctx.rotate(o.angle);
  ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = o.hot ? FX_PAL.red : FX_PAL.text;
  const gl = _fxClamp(o.glow || 0, 0, 1);
  if (o.hot || gl > 0) { ctx.shadowColor = o.hot ? FX_PAL.flame : FX_PAL.amber; ctx.shadowBlur = (o.hot ? 12 : 0) + 30 * gl; }

  if (kind === 'burstDisc') {
    ctx.beginPath(); ctx.moveTo(-s * 0.35, -s); ctx.lineTo(-s * 0.35, s); ctx.moveTo(s * 0.35, -s); ctx.lineTo(s * 0.35, s); ctx.stroke();
    if (op < 0.5) {
      ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.8); ctx.quadraticCurveTo(s * 0.55, 0, -s * 0.35, s * 0.8);
      ctx.strokeStyle = o.hot ? FX_PAL.red : FX_PAL.amber; ctx.stroke();
    } else {
      ctx.strokeStyle = FX_PAL.red;
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.8); ctx.quadraticCurveTo(s * 0.5, -s * 0.75, s * 1.0, -s * 0.95);
      ctx.moveTo(-s * 0.35, s * 0.8); ctx.quadraticCurveTo(s * 0.5, s * 0.75, s * 1.0, s * 0.95);
      ctx.moveTo(s * 0.1, -s * 0.2); ctx.lineTo(s * 0.7, -s * 0.35);
      ctx.moveTo(s * 0.1, s * 0.2); ctx.lineTo(s * 0.7, s * 0.35);
      ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (kind === 'check') {
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.62); ctx.lineTo(s * 0.55, 0); ctx.lineTo(-s, s * 0.62); ctx.closePath();
    ctx.fillStyle = FX_PAL.panel; ctx.fill();
    ctx.globalAlpha = 0.15 + 0.75 * op; ctx.fillStyle = live; ctx.fill(); ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.55 + op * s * 0.3, -s * 0.7); ctx.lineTo(s * 0.55 + op * s * 0.3, s * 0.7);
    ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore(); return;
  }
  // bow-tie body (manual / pneumatic); relief = angle body
  ctx.beginPath();
  if (kind === 'relief') {
    ctx.moveTo(-s, -s * 0.6); ctx.lineTo(0, 0); ctx.lineTo(-s, s * 0.6); ctx.closePath();
    ctx.moveTo(-s * 0.6, -s); ctx.lineTo(0, 0); ctx.lineTo(s * 0.6, -s); ctx.closePath();
  } else {
    ctx.moveTo(-s, -s * 0.6); ctx.lineTo(0, 0); ctx.lineTo(-s, s * 0.6); ctx.closePath();
    ctx.moveTo(s, -s * 0.6); ctx.lineTo(0, 0); ctx.lineTo(s, s * 0.6); ctx.closePath();
  }
  ctx.fillStyle = FX_PAL.panel; ctx.fill();
  ctx.globalAlpha = 0.12 + 0.78 * op; ctx.fillStyle = live; ctx.fill(); ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (kind === 'manual') {
    ctx.save();
    ctx.rotate(-Math.PI / 2 * (1 - op));          // across the pipe = closed, along = open
    ctx.strokeStyle = op > 0.5 ? live : FX_PAL.amber; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(-s * 0.15, 0); ctx.lineTo(s * 1.25, 0); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = FX_PAL.text; ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, 6.2832); ctx.fill();
  } else if (kind === 'pneumatic') {
    const top = -s * 1.35;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, top); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, top, s * 0.78, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = FX_PAL.panel; ctx.fill(); ctx.stroke();
    // travel pip on the stem
    ctx.fillStyle = op > 0.5 ? live : FX_PAL.amber;
    ctx.fillRect(-3, -s * 0.35 - op * s * 0.7 - 1.5, 6, 3);
    if (!o.angle) {
      ctx.font = 'bold ' + Math.round(s * 0.55) + 'px ' + FX_PAL.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = o.failSafe === 'NO' ? FX_PAL.cyan : FX_PAL.amber;
      ctx.fillText(o.failSafe === 'NO' ? 'NO' : 'NC', 0, top - s * 0.34);
    } else {
      ctx.fillStyle = o.failSafe === 'NO' ? FX_PAL.cyan : FX_PAL.amber;
      ctx.beginPath(); ctx.arc(0, top - s * 0.36, 2.6, 0, 6.2832); ctx.fill();
    }
  } else if (kind === 'relief') {
    // spring zig-zag above the outlet, compresses as it lifts
    const h = s * 1.5 * (1 - 0.3 * op), y0 = -s;
    ctx.beginPath(); ctx.moveTo(0, y0);
    for (let i = 1; i <= 6; i++) ctx.lineTo((i & 1 ? 1 : -1) * s * 0.38, y0 - h * i / 6.5);
    ctx.lineTo(0, y0 - h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.5, y0 - h); ctx.lineTo(s * 0.5, y0 - h); ctx.stroke();
    if (op > 0.02) {
      ctx.strokeStyle = FX_PAL.muted; ctx.globalAlpha = op; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) { ctx.moveTo(s * (0.9 + 0.1 * i), -s * 0.9 + i * 3); ctx.lineTo(s * 1.9, -s * (1.3 - i * 0.35)); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   drawGauge(ctx, x, y, r, {value, max, redline, label, unit})
   270° dial, red arc from redline to max, needle turns red past redline.
   Needle inertia is the CALLER's job: pass a smoothed value, e.g.
     shown += (actual - shown) * (1 - Math.exp(-dt * 9));
   Non-finite values draw "–" and park the needle at zero.
--------------------------------------------------------------------------- */
function drawGauge(ctx, x, y, r, o) {
  const max = o.max > 0 ? o.max : 1, ok = isFinite(o.value);
  const v = ok ? o.value : 0, f = _fxClamp(v / max, 0, 1.04);
  const A0 = Math.PI * 0.75, SW = Math.PI * 1.5;
  const red = isFinite(o.redline) ? _fxClamp(o.redline / max, 0, 1) : 1;
  const over = ok && isFinite(o.redline) && v >= o.redline;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832);
  ctx.fillStyle = FX_PAL.panel2; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = over ? FX_PAL.red : FX_PAL.line;
  if (over) { ctx.shadowColor = FX_PAL.red; ctx.shadowBlur = 14; }
  ctx.stroke(); ctx.shadowBlur = 0;
  // scale arcs
  ctx.lineWidth = Math.max(2, r * 0.07); ctx.lineCap = 'butt';
  ctx.strokeStyle = FX_PAL.line;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, A0, A0 + SW * red); ctx.stroke();
  if (red < 1) { ctx.strokeStyle = FX_PAL.red; ctx.beginPath(); ctx.arc(0, 0, r * 0.82, A0 + SW * red, A0 + SW); ctx.stroke(); }
  ctx.strokeStyle = over ? FX_PAL.red : FX_PAL.green; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.82, A0, A0 + SW * Math.min(f, 1)); ctx.stroke();
  ctx.globalAlpha = 1;
  // ticks
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 20; i++) {
    const a = A0 + SW * i / 20, major = i % 2 === 0;
    const r1 = r * (major ? 0.62 : 0.68), r2 = r * 0.75;
    ctx.strokeStyle = i / 20 >= red ? FX_PAL.red : (major ? FX_PAL.text : FX_PAL.muted);
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke();
  }
  // text
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = FX_PAL.muted; ctx.font = Math.max(8, Math.round(r * 0.19)) + 'px ' + FX_PAL.mono;
  if (o.label) ctx.fillText(o.label, 0, r * 0.16);
  if (o.unit) ctx.fillText(o.unit, 0, r * 0.74);
  ctx.fillStyle = over ? FX_PAL.red : FX_PAL.text; ctx.font = 'bold ' + Math.max(10, Math.round(r * 0.3)) + 'px ' + FX_PAL.mono;
  ctx.fillText(ok ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) : "–", 0, r * 0.5);
  // needle
  const an = A0 + SW * f;
  ctx.strokeStyle = over ? FX_PAL.red : FX_PAL.amber; ctx.lineWidth = Math.max(1.6, r * 0.045); ctx.lineCap = 'round';
  ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(-Math.cos(an) * r * 0.12, -Math.sin(an) * r * 0.12); ctx.lineTo(Math.cos(an) * r * 0.7, Math.sin(an) * r * 0.7); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = FX_PAL.metal; ctx.beginPath(); ctx.arc(0, 0, r * 0.09, 0, 6.2832); ctx.fill();
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   drawHeatHaze(ctx, {x, y, w, h, intensity01, t})
   Shimmer over the rectangle x,y,w,h (top-left + size): rising wavy low-alpha strips,
   additive, warm near the bottom edge. Pure strokes — no getImageData, no allocations.
   Put it above/around the plume; intensity01 ~ thrust01.
--------------------------------------------------------------------------- */
function drawHeatHaze(ctx, o) {
  const k = _fxClamp(o.intensity01 || 0, 0, 1);
  if (k < 0.01 || !(o.w > 0) || !(o.h > 0)) return;
  const t = o.t || 0, N = 8, SEG = 22;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'butt';
  for (let i = 0; i < N; i++) {
    const ph = (t * (0.2 + 0.05 * (i % 3)) + i / N) % 1;          // 0 bottom -> 1 top, loops
    const yy = o.y + o.h * (1 - ph);
    const amp = (2 + 5 * ph) * (0.5 + k);
    const a0 = 0.06 * k * Math.sin(Math.PI * ph);
    ctx.strokeStyle = ph < 0.35 ? FX_PAL.amber : FX_PAL.muted;
    ctx.lineWidth = 3 + 6 * ph;
    let qx = o.x, qy = yy + amp * Math.sin(qx * 0.021 + t * 7 + i * 1.7);
    for (let j = 1; j <= SEG; j++) {                              // per-segment alpha fades the strip ends
      const px = o.x + o.w * j / SEG;
      const py = yy + amp * Math.sin(px * 0.021 + t * 7 + i * 1.7) + amp * 0.5 * Math.sin(px * 0.047 - t * 11 + i);
      ctx.globalAlpha = a0 * Math.sin(Math.PI * (j - 0.5) / SEG);
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      qx = px; qy = py;
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   fxShake(thrust01, t, out?) -> {dx, dy}
   Screen-shake offset in px, amplitude ∝ thrust01 (max ≈ 3 px), deterministic summed sines
   (no Math.random). Writes into `out` if given, else into one reused module-level object.
   Usage: const s = fxShake(thrust01, t); ctx.translate(s.dx, s.dy);
--------------------------------------------------------------------------- */
const _FX_SHAKE = { dx: 0, dy: 0 };
function fxShake(thrust01, t, out) {
  const o = out || _FX_SHAKE, a = 3 * _fxClamp(thrust01 || 0, 0, 1);
  o.dx = a * (0.5 * Math.sin(t * 71.3) + 0.3 * Math.sin(t * 113.7 + 1.3) + 0.2 * Math.sin(t * 37.1 + 4.1));
  o.dy = a * (0.5 * Math.sin(t * 83.9 + 2.2) + 0.3 * Math.sin(t * 127.1 + 0.4) + 0.2 * Math.sin(t * 43.3 + 5.0));
  return o;
}
/* ==== END FX ART PACK ==== */
