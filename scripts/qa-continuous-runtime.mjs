import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');
const url = args.find(arg => !arg.startsWith('--') && !args[args.indexOf(arg) - 1]?.match(/^--(times|subject|audio)$/));
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const times = option('times', selfTest ? '0,1,2,3' : '').split(',').filter(Boolean).map(Number);
const subjectSelector = option('subject', selfTest ? '#persistent-subject' : '');
const audioSelector = option('audio', '');
const shotsDir = option('shots', '');
if (shotsDir) mkdirSync(shotsDir, { recursive: true });
if (!selfTest && (!url || !times.length || times.some(time => !Number.isFinite(time)))) {
  throw new Error('用法：node scripts/qa-continuous-runtime.mjs <page-url> --times 0,1.4,2.75 [--subject "#id"] [--audio "#voice"]');
}
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) throw new Error('未找到 Chrome；请设置 CHROME_PATH');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let server;
if (selfTest) {
  const html = `<!doctype html><html><body><svg><g id="persistent-subject"><rect width="20" height="20"/></g><g id="future" style="visibility:hidden"><circle r="10"/></g></svg><script>
    const subject=document.querySelector('#persistent-subject');
    const future=document.querySelector('#future');
    window.MotionEngine={SPR:[{el:future,t0:2,t1:3}]};
    window.renderAt=t=>{subject.setAttribute('transform','translate('+t*10+' 0)');future.style.visibility=t>=2&&t<=3?'visible':'hidden';};
    renderAt(0);
  <\/script></body></html>`;
  server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
}
const targetUrl = selfTest ? `http://127.0.0.1:${server.address().port}/` : url;
const debugPort = 9400 + process.pid % 400;
const profile = path.join(process.cwd(), 'qa', `continuous-runtime-${process.pid}`);
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });
let ws;
const pending = new Map();
const errors = [];
let nextId = 0;
function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(detail || '浏览器脚本执行失败');
  }
  return result.result.value;
}
async function cleanup() {
  if (ws) ws.close();
  if (chrome.exitCode === null && chrome.signalCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([exited, sleep(3000)]);
    if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGKILL');
  }
  if (server) await new Promise(resolve => server.close(resolve));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
try {
  let targets;
  for (let attempt = 0; attempt < 75; attempt++) {
    try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); if (targets.length) break; } catch { /* Chrome 启动中 */ }
    await sleep(200);
  }
  const target = targets?.find(item => item.type === 'page');
  if (!target) throw new Error('Chrome 调试端口未就绪');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id); if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
  };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  if (shotsDir) await cdp('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: targetUrl });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    await sleep(100);
    ready = await evaluate(`document.readyState === 'complete' && typeof renderAt === 'function'`);
    if (ready) break;
  }
  if (!ready) throw new Error('页面未就绪或缺少全局 renderAt(t)');
  if (subjectSelector) {
    const found = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(subjectSelector)});if(!el)return false;window.__continuousQaSubject=el;return true})()`);
    assert.ok(found, `持续主体不存在：${subjectSelector}`);
  }
  if (audioSelector) {
    const audio = await evaluate(`(()=>{const a=document.querySelector(${JSON.stringify(audioSelector)});return a?{readyState:a.readyState,duration:a.duration,src:a.currentSrc||a.src}:null})()`);
    assert.ok(audio, `音频元素不存在：${audioSelector}`);
    assert.ok(audio.src, '音频 src 为空');
    for (let attempt = 0; attempt < 50; attempt++) {
      const state = await evaluate(`document.querySelector(${JSON.stringify(audioSelector)}).readyState`);
      if (state >= 2) break; await sleep(100);
    }
    const playable = await evaluate(`(()=>{const a=document.querySelector(${JSON.stringify(audioSelector)});return {readyState:a.readyState,duration:a.duration}})()`);
    assert.ok(playable.readyState >= 2 && Number.isFinite(playable.duration) && playable.duration > 0, `音频未加载：${JSON.stringify(playable)}`);
  }
  for (const time of times) {
    await evaluate(`renderAt(${time})`);
    if (subjectSelector) assert.ok(await evaluate(`document.querySelector(${JSON.stringify(subjectSelector)})===window.__continuousQaSubject`), `t=${time} 持续主体 DOM 被重建`);
    const leaked = await evaluate(`(()=>{const sprites=window.MotionEngine?.SPR||window.SEG?.sprites||[];return sprites.filter(s=>s.el&&(${time}<s.t0||${time}>s.t1)&&getComputedStyle(s.el).visibility!=='hidden').map(s=>s.el.id||s.el.tagName)})()`);
    assert.deepEqual(leaked, [], `t=${time} 时间窗外 Sprite 可见：${leaked.join(', ')}`);
    assert.deepEqual(errors, [], `t=${time} 页面运行异常：${errors.join('\n')}`);
    if (shotsDir) {
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeFileSync(path.join(shotsDir, `frame-${time}.png`), Buffer.from(shot.data, 'base64'));
    }
  }
  assert.deepEqual(errors, [], `页面运行异常：${errors.join('\n')}`);
  console.log(`continuous-runtime: ${times.length} 个时间点无异常；时间窗、DOM 身份${audioSelector ? '、音频加载' : ''}检查通过`);
} finally {
  await cleanup();
}
