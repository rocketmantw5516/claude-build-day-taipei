#!/usr/bin/env node
// Headless QA harness — dependency-free (Node >= 22: built-in fetch + WebSocket).
// Usage: node qa.mjs <file.html> [--interact] [--wait=4000]
// Output: assist/shots/<name>.png, assist/shots/<name>.txt (+ <name>-after.png in --interact mode)
// Exit code: 0 = clean, 1 = problems found, 2 = harness failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const interact = false; const stepsFile = args.filter(a => !a.startsWith('--'))[1];
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
  await sleep(1500);
  const steps = JSON.parse(readFileSync(stepsFile, 'utf8'));
  const tag = basename(stepsFile).replace(/\.json$/, '');
  let t0 = Date.now(); const out = [];
  const T = () => ((Date.now() - t0) / 1000).toFixed(2) + 's';
  const KEYS = { Space: [' ', 'Space', 32], R: ['r', 'KeyR', 82], A: ['a', 'KeyA', 65], S: ['s', 'KeyS', 83] };
  for (const st of steps) {
    phase = JSON.stringify(st);
    if (st.mark) { t0 = Date.now(); out.push(`--- ${st.mark} (clock reset)`); }
    else if (st.click) { const r = await evaluate(`(e => e ? (e.click(), e.textContent.trim().replace(/\\s+/g,' ')) : 'NOT FOUND')(document.querySelector(${JSON.stringify(st.click)}))`); out.push(`${T()} click ${st.click} -> ${r}`); }
    else if (st.range) { await evaluate(`(e => { e.value = ${JSON.stringify(String(st.range[1]))} === 'min' ? e.min : ${JSON.stringify(String(st.range[1]))} === 'max' ? e.max : ${JSON.stringify(String(st.range[1]))}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); })(document.querySelector(${JSON.stringify(st.range[0])}))`); out.push(`${T()} range ${st.range[0]} = ${st.range[1]}`); }
    else if (st.select) { await evaluate(`(e => { e.selectedIndex = ${st.select[1]}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); })(document.querySelector(${JSON.stringify(st.select[0])}))`); out.push(`${T()} select ${st.select[0]} = ${st.select[1]}`); }
    else if (st.key) { const [key, code, vk] = KEYS[st.key]; await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); out.push(`${T()} key ${st.key}`); }
    else if (st.wait) await sleep(st.wait);
    else if (st.shot) { await shot(`${tag}-${st.shot}.png`); out.push(`${T()} shot ${tag}-${st.shot}.png`); }
    else if (st.eval) { let r; try { r = await evaluate(st.eval); } catch (e) { r = 'ERR ' + e.message; } out.push(`${T()} eval ${st.label || st.eval} -> ${JSON.stringify(r)}`); }
    else if (st.waitFor) { const lim = Date.now() + (st.timeout || 15000); let ok = false; while (Date.now() < lim) { try { if (await evaluate(st.waitFor)) { ok = true; break; } } catch {} await sleep(50); } out.push(`${T()} ${ok ? 'REACHED' : 'TIMEOUT'} ${st.label || st.waitFor}`); }
    else if (st.spaceUntil) { let n = 0; const lim = Date.now() + (st.timeout || 60000); let ok = false; while (Date.now() < lim) { if (await evaluate(st.spaceUntil)) { ok = true; break; } if (st.shotEach) await shot(`${tag}-sp${String(n).padStart(2,'0')}.png`); const [key, code, vk] = KEYS.Space; await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); n++; await sleep(st.gap || 600); } out.push(`${T()} ${ok ? 'REACHED' : 'TIMEOUT'} ${st.label || st.spaceUntil} after ${n} Space presses (gap ${st.gap || 600} ms)`); }
  }
  ws.close();
  const lines = [...out, '', 'errors: ' + (findings.length ? '' : 'none'), ...findings.map(f => `[${f.phase}] ${f.kind}: ${f.text}`)];
  writeFileSync(join(shots, tag + '.txt'), lines.join('\n')); console.log(lines.join('\n'));
  return 0;
}
function dedupe(l) { return l; }
main().then(code => { cleanup(); process.exit(code); }).catch(e => { console.error('drive failure: ' + e.message); cleanup(); process.exit(2); });
