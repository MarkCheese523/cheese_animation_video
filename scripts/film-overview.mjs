// Cheese Motion · 逐拍总览图（构图体检用）
//
// 为什么需要：引擎 lint 只查越界、文字重叠、时间窗；L2/L3 查语义一致性。
// 但「图形撞图形」「焦点被压住」「三样东西挤在一列」这类**构图**问题，
// 机器一条都抓不到 —— 上期的 11 个画面逻辑缺陷全是人眼看出来的。
// 这一版把每一拍抽一帧，排成一张总览图，让「整片一眼看完」变成可能。
//
// 用法：
//   node scripts/film-overview.mjs <page-url> <out.png> [--beats 3.0,8.4,...] [--cols 6]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args.find(arg => !arg.startsWith('--') && args[args.indexOf(arg) - 1]?.startsWith('--') !== true);
const out = args.find(arg => arg.endsWith('.png'));
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
if (!url || !out) throw new Error('用法：node scripts/film-overview.mjs <page-url> <out.png> [--beats ...] [--cols N]');
if (!existsSync(url.startsWith('http') ? path.join(process.cwd(), 'noop') : url)) { /* http 时跳过本地检查 */ }

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) throw new Error('未找到 Chrome');
const times = option('beats').split(',').filter(Boolean).map(Number);
if (!times.length) throw new Error('必须给出 --beats');
const cols = Number(option('cols', '6'));
const cellW = 300, cellH = 533;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debugPort = 9600 + process.pid % 300;
const profile = path.join(process.cwd(), '.tmp', `film-overview-${process.pid}`);
mkdirSync(profile, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--force-device-scale-factor=1',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

let ws;
const pending = new Map();
let nextId = 0;
const cdp = (method, params = {}) => {
  const id = ++nextId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
};

try {
  let targets;
  for (let i = 0; i < 80; i += 1) {
    try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); if (targets?.length) break; } catch { /* 启动中 */ }
    await sleep(200);
  }
  const target = targets?.find(item => item.type === 'page');
  if (!target) throw new Error('Chrome 调试端口未就绪');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url });
  await sleep(1800);

  const frames = [];
  for (const t of times) {
    await cdp('Runtime.evaluate', { expression: `window.renderAt(${t})` });
    await sleep(120);
    const shot = await cdp('Page.captureScreenshot', { format: 'png' });
    frames.push({ t, data: Buffer.from(shot.data, 'base64').toString('base64') });
  }

  const rows = Math.ceil(frames.length / cols);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#05100d;font:20px/1.4 -apple-system,sans-serif;color:#c6ff3d}
    .grid{display:grid;grid-template-columns:repeat(${cols},${cellW}px)}
    .cell{position:relative;width:${cellW}px;height:${cellH}px;overflow:hidden;border:1px solid #1d3b33}
    .cell img{width:${cellW}px;height:${cellH}px;object-fit:cover;object-position:top center;display:block}
    .tag{position:absolute;left:0;top:0;background:rgba(0,0,0,.75);padding:2px 8px;font-size:18px}
  </style></head><body><div class="grid">
  ${frames.map(f => `<div class="cell"><img src="data:image/png;base64,${f.data}"><div class="tag">${f.t}s</div></div>`).join('')}
  </div></body></html>`;
  const tmp = path.join(process.cwd(), '.tmp', `film-overview-${process.pid}.html`);
  writeFileSync(tmp, html, 'utf8');
  await cdp('Page.navigate', { url: `file://${tmp}` });
  await sleep(1200);
  const size = await cdp('Runtime.evaluate', { expression: 'JSON.stringify({w:document.body.scrollWidth,h:document.body.scrollHeight})', returnByValue: true });
  const { w, h } = JSON.parse(size.result.value);
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  writeFileSync(path.resolve(out), Buffer.from(shot.data, 'base64'));
  console.log(`总览图已生成 → ${path.resolve(out)}（${frames.length} 拍，${cols} 列）`);
} finally {
  if (ws) ws.close();
  chrome.kill('SIGTERM');
  await sleep(600);
  chrome.kill('SIGKILL');
}
