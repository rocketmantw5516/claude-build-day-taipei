/* audio.js — graftable Web Audio kit for the test-stand simulator.
   Works as <script src="audio.js"> or pasted into an inline <script>.
   Public API: audioInit(), audioSet({pc01,mdot01,chug01}), audioOneShot(name),
               audioMute(bool), audioIsReady(), audioPath().
   All private state lives in _AK. Nothing here throws if Web Audio is missing. */

var _AK = {
  ctx: null, ready: false, initPromise: null, path: 'none', muted: true,
  master: null, roarGain: null, shotBus: null, limiter: null,
  noiseBuf: null, node: null, synth: null,
  pPc: null, pMdot: null, pChug: null,
  pc: 0, mdot: 0, chug: 0,
  LEVEL: 0.85,
  forceFallback: false,   // set true before audioInit() to skip the worklet (testing)

  /* DSP core as source text: shared by the AudioWorklet (via Blob URL) and the
     ScriptProcessor fallback (via new Function). */
  SYNTH_SRC: [
    'class AKRoarSynth {',
    '  constructor(sr){',
    '    this.sr = sr; this.tPc = 0; this.tMdot = 0; this.tChug = 0;',
    '    this.pc = 0; this.mdot = 0; this.chug = 0;',
    '    this.k = 1 - Math.exp(-1 / (0.04 * sr));',   // 40 ms parameter smoothing
    '    this.seed = 22222; this.lp1 = 0; this.lp2 = 0; this.hp = 0;',
    '    this.rLow = 0; this.rBand = 0; this.cEnv = 0; this.cLp = 0; this.ph = 0; this.drift = 0;',
    '  }',
    '  process(L, R){',
    '    const n = L.length, sr = this.sr, k = this.k;',
    '    let pc = this.pc, mdot = this.mdot, chug = this.chug, seed = this.seed;',
    '    let lp1 = this.lp1, lp2 = this.lp2, hp = this.hp, rLow = this.rLow, rBand = this.rBand;',
    '    let cEnv = this.cEnv, cLp = this.cLp, ph = this.ph, drift = this.drift;',
    '    const tPc = this.tPc, tMdot = this.tMdot, tChug = this.tChug;',
    '    if (tPc + tMdot + tChug < 1e-5 && pc + mdot < 1e-4 && cEnv < 1e-4) {',
    '      for (let i = 0; i < n; i++) { L[i] = 0; if (R !== L) R[i] = 0; }',
    '      this.pc = 0; this.mdot = 0; this.chug = 0; this.cEnv = 0; return;',
    '    }',
    '    const twoPi = 6.283185307179586;',
    '    for (let i = 0; i < n; i++) {',
    '      pc += (tPc - pc) * k; mdot += (tMdot - mdot) * k; chug += (tChug - chug) * k;',
    '      seed = (seed * 1664525 + 1013904223) >>> 0; const w = seed / 2147483648 - 1;',
    '      seed = (seed * 1664525 + 1013904223) >>> 0; const w2 = seed / 4294967296;',
    // roar: two cascaded one-pole lowpasses, cutoff 250 Hz .. ~5 kHz with pc
    '      const fc = 250 + 4800 * pc * pc;',
    '      let a = twoPi * fc / sr; if (a > 0.9) a = 0.9;',
    '      lp1 += (w - lp1) * a; lp2 += (lp1 - lp2) * a;',
    '      hp += (lp2 - hp) * 0.004;',                   // remove DC / sub-sonic
    '      const roar = (lp2 - hp) * (1.2 / Math.sqrt(a + 0.003)) * 0.22;',
    // rumble: resonant state-variable bandpass on noise, 40..90 Hz
    '      drift += (w2 - 0.5 - drift) * 0.0002;',
    '      const fr = 40 + 50 * pc + 60 * drift;',
    '      const f = 2 * Math.sin(3.141592653589793 * fr / sr);',
    '      rLow += f * rBand; const rHigh = w - rLow - 0.12 * rBand; rBand += f * rHigh;',
    '      if (rBand > 40) rBand = 40; else if (rBand < -40) rBand = -40;',
    '      const rumble = rBand * 0.035;',
    // crackle: random impulses, density follows mdot (up to ~70 /s)
    '      if (w2 < mdot * 70 / sr) cEnv += 0.4 + 0.6 * ((seed >>> 8 & 255) / 255);',
    '      cEnv *= 0.9965; if (cEnv > 1.5) cEnv = 1.5;',
    '      cLp += (w - cLp) * 0.35;',
    '      const crackle = (w - cLp) * cEnv * 0.55;',
    // chug: 8..20 Hz amplitude wobble
    '      ph += (8 + 12 * chug) / sr; if (ph >= 1) ph -= 1;',
    '      const am = 1 - chug * 0.85 * (0.5 + 0.5 * Math.sin(twoPi * ph));',
    '      const lvl = Math.pow(pc, 0.7);',
    '      const drive = lvl > mdot * 0.5 ? lvl : mdot * 0.5;',
    '      let y = (roar * lvl + rumble * lvl + crackle * (0.35 + 0.65 * drive)) * am;',
    '      y = Math.tanh(2.2 * y) * 0.8;',
    '      L[i] = y; if (R !== L) R[i] = y;',
    '    }',
    '    this.pc = pc; this.mdot = mdot; this.chug = chug; this.seed = seed;',
    '    this.lp1 = lp1; this.lp2 = lp2; this.hp = hp; this.rLow = rLow; this.rBand = rBand;',
    '    this.cEnv = cEnv; this.cLp = cLp; this.ph = ph; this.drift = drift;',
    '  }',
    '}'
  ].join('\n'),

  WORKLET_SRC: [
    'class AKRoarProcessor extends AudioWorkletProcessor {',
    '  static get parameterDescriptors(){ return [',
    '    {name:"pc",defaultValue:0,minValue:0,maxValue:1,automationRate:"k-rate"},',
    '    {name:"mdot",defaultValue:0,minValue:0,maxValue:1,automationRate:"k-rate"},',
    '    {name:"chug",defaultValue:0,minValue:0,maxValue:1,automationRate:"k-rate"}]; }',
    '  constructor(){ super(); this.s = new AKRoarSynth(sampleRate); }',
    '  process(inputs, outputs, p){',
    '    const o = outputs[0]; if (!o || !o[0]) return true;',
    '    this.s.tPc = p.pc[0]; this.s.tMdot = p.mdot[0]; this.s.tChug = p.chug[0];',
    '    this.s.process(o[0], o[1] || o[0]); return true;',
    '  }',
    '}',
    'registerProcessor("ak-roar", AKRoarProcessor);'
  ].join('\n'),

  clamp01: function (v) { v = +v; return v > 0 ? (v < 1 ? v : 1) : 0; },

  build: function (ctx) {
    var A = _AK;
    A.limiter = ctx.createDynamicsCompressor();
    A.limiter.threshold.value = -10; A.limiter.knee.value = 6; A.limiter.ratio.value = 16;
    A.limiter.attack.value = 0.002; A.limiter.release.value = 0.18;
    A.master = ctx.createGain(); A.master.gain.value = 0;           // starts MUTED
    A.roarGain = ctx.createGain(); A.roarGain.gain.value = 1;
    A.shotBus = ctx.createGain(); A.shotBus.gain.value = 0.9;
    A.roarGain.connect(A.master); A.shotBus.connect(A.master);
    A.master.connect(A.limiter); A.limiter.connect(ctx.destination);
    // shared white-noise buffer, created once
    var len = Math.floor(ctx.sampleRate * 2), buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noiseBuf = buf;
  },

  startFallback: function (ctx) {
    var A = _AK;
    var Synth = new Function(A.SYNTH_SRC + '; return AKRoarSynth;')();
    A.synth = new Synth(ctx.sampleRate);
    var sp = ctx.createScriptProcessor(2048, 1, 2);
    sp.onaudioprocess = function (ev) {
      var ob = ev.outputBuffer;
      A.synth.process(ob.getChannelData(0), ob.numberOfChannels > 1 ? ob.getChannelData(1) : ob.getChannelData(0));
    };
    sp.connect(A.roarGain);
    A.node = sp; A.path = 'scriptprocessor';
  },

  startWorklet: function (ctx) {
    var A = _AK;
    if (A.forceFallback || !ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') return Promise.reject(new Error('no worklet'));
    var src = A.SYNTH_SRC + '\n' + A.WORKLET_SRC;
    var url = null;
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('worklet timeout')); }, 3000); });
    // data: URL first (accepted on file:// pages, where blob: is refused); Blob URL for hosts whose CSP rejects data:.
    var load = ctx.audioWorklet.addModule('data:application/javascript;charset=utf-8,' + encodeURIComponent(src)).catch(function () {
      url = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
      return ctx.audioWorklet.addModule(url);
    });
    return Promise.race([load, timeout]).then(function () {
      if (url) { try { URL.revokeObjectURL(url); } catch (e) {} }
      var node = new AudioWorkletNode(ctx, 'ak-roar', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      A.pPc = node.parameters.get('pc'); A.pMdot = node.parameters.get('mdot'); A.pChug = node.parameters.get('chug');
      if (!A.pPc || !A.pMdot || !A.pChug) throw new Error('no params');
      node.connect(A.roarGain);
      A.node = node; A.path = 'worklet';
    });
  },

  push: function () {
    var A = _AK;
    if (A.path === 'worklet') { A.pPc.value = A.pc; A.pMdot.value = A.mdot; A.pChug.value = A.chug; }
    else if (A.synth) { A.synth.tPc = A.pc; A.synth.tMdot = A.mdot; A.synth.tChug = A.chug; }
  },

  /* one-shot helpers (standard nodes) */
  env: function (g, t, peak, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },
  noise: function (t, dur, type, f0, f1, q, peak, attack) {
    var A = _AK, c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true;
    f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    A.env(g, t, peak, attack, dur);
    s.connect(f); f.connect(g); g.connect(A.shotBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  tone: function (t, dur, type, f0, f1, peak, attack) {
    var A = _AK, c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    A.env(g, t, peak, attack, dur);
    o.connect(g); g.connect(A.shotBus);
    o.start(t); o.stop(t + dur + 0.05);
  },

  shots: {
    igniter: function (A, t) {
      A.noise(t, 0.02, 'highpass', 3000, 3000, 0.7, 0.8, 0.001);          // click
      A.tone(t + 0.015, 0.28, 'sawtooth', 118, 112, 0.22, 0.01);           // spark buzz
      A.tone(t + 0.015, 0.28, 'square', 236, 228, 0.07, 0.01);
      A.noise(t + 0.015, 0.28, 'bandpass', 2400, 2000, 3, 0.18, 0.01);
    },
    valve: function (A, t) {
      A.tone(t, 0.14, 'sine', 170, 55, 0.9, 0.003);                        // clunk body
      A.noise(t, 0.05, 'bandpass', 1400, 600, 1.2, 0.45, 0.001);           // metallic tick
    },
    relief: function (A, t) {
      A.noise(t, 1.0, 'bandpass', 5200, 3200, 0.8, 0.5, 0.03);             // hiss ~1 s
      A.noise(t, 0.9, 'highpass', 7000, 6000, 0.5, 0.2, 0.02);
    },
    explosion: function (A, t) {
      A.tone(t, 0.5, 'sine', 120, 28, 1.0, 0.004);                         // thump
      A.noise(t, 0.12, 'lowpass', 6000, 1500, 0.5, 1.0, 0.002);            // blast front
      A.noise(t, 1.5, 'lowpass', 1800, 120, 0.6, 0.9, 0.01);               // tail ~1.5 s
      var g = A.roarGain.gain;                                             // duck the roar
      try { g.cancelScheduledValues(t); } catch (e) {}
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.2, t + 0.03);
      g.setValueAtTime(0.2, t + 0.35);
      g.linearRampToValueAtTime(1, t + 1.4);
    },
    misfire: function (A, t) {
      A.noise(t, 0.45, 'bandpass', 2600, 500, 1.5, 0.4, 0.004);            // fizzle
      A.tone(t, 0.3, 'triangle', 140, 50, 0.3, 0.004);
      A.noise(t + 0.18, 0.08, 'highpass', 4000, 4000, 0.7, 0.2, 0.002);
    },
    klaxon: function (A, t) {
      for (var i = 0; i < 4; i++) {                                        // two-tone, 4 x 0.3 s
        var f = (i % 2 === 0) ? 620 : 465;
        A.tone(t + i * 0.3, 0.29, 'square', f, f, 0.22, 0.01);
        A.tone(t + i * 0.3, 0.29, 'sawtooth', f * 0.5, f * 0.5, 0.14, 0.01);
      }
    }
  }
};

function audioInit() {
  var A = _AK;
  try {
    if (A.initPromise) {
      if (A.ctx && A.ctx.state === 'suspended') { try { var r = A.ctx.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
      return A.initPromise;
    }
    var Ctx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) { A.path = 'unavailable'; A.initPromise = Promise.resolve(false); return A.initPromise; }
    var ctx = new Ctx();
    A.ctx = ctx;
    try { var rp = ctx.resume(); if (rp && rp.catch) rp.catch(function () {}); } catch (e) {}
    A.build(ctx);
    A.initPromise = A.startWorklet(ctx).catch(function () {
      A.startFallback(ctx);
    }).then(function () {
      A.ready = true; A.push(); return true;
    }).catch(function () {
      A.path = 'unavailable'; A.ready = false; return false;
    });
    return A.initPromise;
  } catch (e) {
    A.path = 'unavailable';
    A.initPromise = Promise.resolve(false);
    return A.initPromise;
  }
}

function audioSet(s) {
  var A = _AK;
  if (!A.ready || !s) return;
  try {
    var pc = A.clamp01(s.pc01), md = A.clamp01(s.mdot01), ch = A.clamp01(s.chug01);
    if (pc === A.pc && md === A.mdot && ch === A.chug) return;
    A.pc = pc; A.mdot = md; A.chug = ch;
    A.push();
  } catch (e) {}
}

function audioOneShot(name) {
  var A = _AK;
  if (!A.ready || !A.ctx) return;
  try {
    var fn = A.shots.hasOwnProperty(name) ? A.shots[name] : null;
    if (fn) fn(A, A.ctx.currentTime + 0.005);
  } catch (e) {}
}

function audioMute(m) {
  var A = _AK;
  A.muted = !!m;
  if (!A.ctx || !A.master) return;
  try {
    var g = A.master.gain, t = A.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(A.muted ? 0 : A.LEVEL, t + 0.02);
  } catch (e) {}
}

function audioIsReady() { return !!_AK.ready; }
function audioPath() { return _AK.path; }
