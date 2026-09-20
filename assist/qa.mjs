#!/usr/bin/env node
// Headless QA harness — dependency-free (Node >= 22: built-in fetch + WebSocket).
// Usage: node qa.mjs <file.html> [--interact] [--wait=4000]
// Output: assist/shots/<name>.png, assist/shots/<name>.txt (+ <name>-after.png in --interact mode)
// Exit code: 0 = clean, 1 = problems found, 2 = harness failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const interact = args.includes('--interact');
const waitMs = Number((args.find(a => a.startsWith('--wait=')) || '--wait=4000').split('=')[1]);
if (!file || !existsSync(file)) { console.error('usage: qa.mjs <file.html> [--interact] [--wait=ms]'); process.exit(2); }
if (!existsSync(CHROME)) { console.error('Chrome not found at ' + CHROME); process.exit(2); }

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, 'shots');
mkdirSync(shots, { recursive: true });
const name = basename(file).replace(/\.html?$/i, '') + (interact ? '-interact' : '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), 'qa-chrome-'));
const port = 9300 + Math.floor(Math.random() * 600);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio', '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

const findings = [];   // {phase, kind, text}
let phase = 'load';
const note = (kind, text) => findings.push({ phase, kind, text: String(text).slice(0, 600) });

function cleanup() { try { chrome.kill('SIGKILL'); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} }
process.on('exit', cleanup);

async function main() {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find(t => t.type === 'page');
    } catch {}
    if (!target) await sleep(150);
  }
  if (!target) throw new Error('Chrome DevTools endpoint never came up');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws connect failed')); });
  let seq = 0; const pending = new Map();
  const send = (method, params = {}, timeout = 8000) => new Promise((res, rej) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); rej(new Error('TIMEOUT ' + method)); }, timeout);
    pending.set(id, { res, rej, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const requests = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id) {
      const p = pending.get(m.id); if (!p) return;
      pending.delete(m.id); clearTimeout(p.timer);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
      return;
    }
    const p = m.params;
    switch (m.method) {
      case 'Runtime.consoleAPICalled':
        if (p.type === 'error' || p.type === 'warning' || p.type === 'assert')
          note('console.' + p.type, p.args.map(a => a.value ?? a.description ?? a.type).join(' '));
        break;
      case 'Runtime.exceptionThrown': {
        const d = p.exceptionDetails;
        note('EXCEPTION', (d.exception?.description || d.text) + ` @ line ${d.lineNumber + 1}:${d.columnNumber + 1}`);
        break;
      }
      case 'Log.entryAdded':
        if (p.entry.level === 'error' || p.entry.level === 'warning')
          note('log.' + p.entry.level, `${p.entry.text} ${p.entry.url || ''}`);
        break;
      case 'Network.requestWillBeSent':
        requests.set(p.requestId, p.request.url);
        if (!/^(file|data|blob|about):/.test(p.request.url)) note('EXTERNAL-REQUEST', p.request.url);
        break;
      case 'Network.loadingFailed':
        note('REQUEST-FAILED', `${requests.get(p.requestId) || '?'} — ${p.errorText}`);
        break;
      case 'Network.responseReceived':
        if (p.response.status >= 400) note('HTTP-' + p.response.status, p.response.url);
        break;
      case 'Page.javascriptDialogOpening':
        note('dialog', `${p.type}: ${p.message}`);
        send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
        break;
    }
  };

  const evaluate = async (expr, timeout = 5000) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true }, timeout);
    return r.result?.value;
  };
  const shot = async fname => {
    const r = await send('Page.captureScreenshot', { format: 'png' }, 15000);
    writeFileSync(join(shots, fname), Buffer.from(r.data, 'base64'));
  };

  await Promise.all(['Runtime', 'Log', 'Network', 'Page'].map(d => send(d + '.enable')));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(resolve(file)).href });
  await sleep(waitMs);
  await shot(name + '.png');

  // Health facts (not errors by themselves, but useful)
  const info = [];
  try {
    const h = await evaluate(`new Promise(res => { let n = 0; const t0 = performance.now();
      const tick = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(tick) : res({
        fps: n, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth,
        innerH: innerHeight, innerW: innerWidth, title: document.title,
        buttons: document.querySelectorAll('button').length, ranges: document.querySelectorAll('input[type=range]').length,
        selects: document.querySelectorAll('select').length,
        canvases: [...document.querySelectorAll('canvas')].map(c => (c.id || '?') + ' ' + c.width + 'x' + c.height),
        externals: [...document.querySelectorAll('script[src],link[href],img[src]')].map(e => e.src || e.href).filter(u => !/^(data|blob):/.test(u)),
        bytes: document.documentElement.outerHTML.length }); };
      requestAnimationFrame(tick); })`, 6000);
    info.push(`title: ${h.title}`, `size: ~${h.bytes} chars`, `rAF rate: ${h.fps} fps (headless)`,
      `controls: ${h.buttons} buttons, ${h.ranges} ranges, ${h.selects} selects`, `canvases: ${h.canvases.join(', ') || 'NONE'}`);
    if (h.scrollH > h.innerH + 2 || h.scrollW > h.innerW + 2) note('LAYOUT', `page overflows 1440x900: content ${h.scrollW}x${h.scrollH}`);
    if (h.externals.length) note('EXTERNAL-RESOURCE', h.externals.join(', '));
    if (!h.canvases.length) note('LAYOUT', 'no <canvas> on page');
    if (h.fps < 20) note('PERF', `rAF only ${h.fps} fps`);
  } catch (e) { note('HANG', 'page unresponsive after load: ' + e.message); }

  // --guided[=N]: press Space N times (default 14), 1.5 s apart, screenshot after each press -> <name>-gNN.png
  const gArg = args.find(a => a.startsWith('--guided'));
  if (gArg) {
    const n = Number(gArg.split('=')[1]) || 14;
    for (let i = 1; i <= n; i++) {
      phase = `guided Space #${i}`;
      try {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
        await sleep(1500);
        await shot(`${name}-g${String(i).padStart(2, '0')}.png`);
      } catch (e) { note('HANG', e.message); break; }
    }
  }

  if (interact) {
    const act = async (label, expr) => {
      phase = label;
      try { const r = await evaluate(expr); await sleep(180); return r; }
      catch (e) { note('HANG', `page unresponsive / eval failed: ${e.message}`); return null; }
    };
    const lbl = sel => `(e => (e.id ? '#' + e.id + ' ' : '') + (e.textContent || e.getAttribute('aria-label') || e.name || '').trim().replace(/\\s+/g, ' ').slice(0, 30))(${sel})`;

    // 1) ranges to both ends
    const nR = await act('count ranges', `document.querySelectorAll('input[type=range]').length`) || 0;
    for (let i = 0; i < nR; i++) {
      const sel = `document.querySelectorAll('input[type=range]')[${i}]`;
      const l = await act('range label', `(${sel}) ? ${lbl(sel)} || 'range' : null`);
      for (const end of ['min', 'max']) {
        await act(`range[${i}] ${l} -> ${end}`, `(e => { if (!e) return; e.value = e.${end} !== '' ? e.${end} : (${end === 'min' ? 0 : 100});
          e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })(${sel})`);
      }
    }
    // 2) selects: every option
    const nS = await act('count selects', `document.querySelectorAll('select').length`) || 0;
    for (let i = 0; i < nS; i++) {
      const nO = await act('count options', `document.querySelectorAll('select')[${i}].options.length`) || 0;
      for (let j = 0; j < nO; j++)
        await act(`select[${i}] option ${j}`, `(e => { e.selectedIndex = ${j}; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })(document.querySelectorAll('select')[${i}])`);
    }
    // 3) every button. Pass A: fresh page reload before each (every control tested live, never in a frozen ending).
    //    Pass B: all buttons in DOM order with no reload (catches sequence-dependent bugs).
    const reload = async () => { phase = 'reload'; try { await send('Page.reload', {}, 10000); await sleep(1200); await evaluate('1', 5000); } catch (e) { note('HANG', 'reload failed: ' + e.message); } };
    const nB = await act('count buttons', `document.querySelectorAll('button').length`) || 0;
    const skipped = [];
    for (const pass of ['fresh', 'seq']) {
      if (pass === 'seq') await reload();
      for (let i = 0; i < nB; i++) {
        if (pass === 'fresh') await reload();
        const sel = `document.querySelectorAll('button')[${i}]`;
        const l = await act('button label', `(${sel}) ? ${lbl(sel)} : null`);
        if (l === null) continue;
        const st = await act(`${pass} button[${i}] "${l}"`, `(e => { const s = e.disabled ? 'disabled' : (e.offsetParent === null ? 'hidden' : 'ok'); e.click(); return s; })(${sel})`);
        if (pass === 'fresh') { await sleep(500); if (st && st !== 'ok') skipped.push(`button[${i}] "${l}" is ${st} on a fresh page`); }
      }
    }
    await reload();
    // 4) real mouse clicks over a grid on each canvas (canvas valves are clickable)
    const rects = await act('canvas rects', `[...document.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height, c.id || '?']; })`) || [];
    for (const [l, t, w, h, id] of rects) {
      if (w < 40 || h < 40) continue;
      phase = `canvas #${id} click grid`;
      for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 12; gx++) {
        const x = l + (gx + 0.5) * w / 12, y = t + (gy + 0.5) * h / 8;
        try {
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
          await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
          await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        } catch (e) { note('HANG', `mouse dispatch failed at ${x | 0},${y | 0}: ${e.message}`); gy = 99; break; }
      }
      await sleep(250);
    }
    // 5) keyboard shortcuts from INTERFACE.md (fresh page)
    await reload();
    for (const [key, code, vk] of [[' ', 'Space', 32], ['s', 'KeyS', 83], ['a', 'KeyA', 65], ['r', 'KeyR', 82]]) {
      phase = `key ${code}`;
      try {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
      } catch (e) { note('HANG', e.message); }
      await sleep(250);
    }
    phase = 'after interaction';
    await sleep(1500);
    try { await evaluate('1', 4000); } catch (e) { note('HANG', 'page unresponsive at end of interaction'); }
    await shot(name + '-after.png');
    if (skipped.length) info.push('note: ' + skipped.join('; '));
  }

  ws.close();
  const bad = findings.filter(f => f.kind !== 'dialog' && f.kind !== 'console.warning' && f.kind !== 'log.warning');
  const lines = [
    `QA ${interact ? 'INTERACT' : 'LOAD'} — ${resolve(file)}`, `when: ${new Date().toLocaleString()}`,
    `screenshot: ${join(shots, name + '.png')}` + (interact ? ` , ${join(shots, name + '-after.png')}` : ''),
    ...info, '',
    bad.length ? `PROBLEMS: ${dedupe(bad).length} distinct (${bad.length} events)` : 'PROBLEMS: 0 — clean',
    ...dedupe(findings).map(f => `[${f.phase}] ${f.kind}: ${f.text}${f.n > 1 ? `  (x${f.n})` : ''}`), '',
  ];
  writeFileSync(join(shots, name + '.txt'), lines.join('\n'));
  console.log(lines.join('\n'));
  return bad.length ? 1 : 0;
}

function dedupe(list) {
  const out = new Map();
  for (const f of list) {
    const k = f.kind + '|' + f.text;
    if (out.has(k)) out.get(k).n++; else out.set(k, { ...f, n: 1 });
  }
  return [...out.values()];
}

main().then(code => { cleanup(); process.exit(code); })
  .catch(e => { console.error('QA harness failure: ' + e.message); cleanup(); process.exit(2); });
