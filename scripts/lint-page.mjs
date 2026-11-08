// Cheese Motion · 引擎 lint 运行器（通用）
//
// 为什么单独一条链路：引擎自带的 ?lint 会同时跑静态检查（字幕行数/时间窗）
// 和动态检查（每 0.25s 一帧的越界、文字重叠、同屏文字数）。
// 以前的做法是每期在任务目录里重写一份 lint-sample.mjs —— 那正是「装配层
// 每期写一次」的病。这一版抽成通用工具，任何页面 URL 都能跑。
//
// 用法：
//   node scripts/lint-page.mjs <page-url> [--shot <png路径>] [--timeout <ms>]
//
// 输出：面板文本（问题清单）+ 可选截图。退出码非 0 表示有 lint 问题。
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args.find(arg => !arg.startsWith('--') && args[args.indexOf(arg) - 1]?.startsWith('--') !== true);
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
if (!url) throw new Error('用法：node scripts/lint-page.mjs <page-url> [--shot <png路径>] [--timeout <ms>]');

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) {
  console.log('SKIP 引擎 lint：未找到 Chrome，设置 CHROME_PATH 后可运行');
  process.exit(0);
}
const timeout = Number(option('timeout', '60000'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debugPort = 9700 + process.pid % 200;
const profile = path.join(process.cwd(), '.tmp', `lint-page-${process.pid}`);
mkdirSync(profile, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

let ws;
const pending = new Map();
let nextId = 0;
const cdp = (method, params = {}) => {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
};
const evaluate = async expression => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '脚本执行失败');
  return result.result.value;
};

try {
  let targets;
  for (let i = 0; i < 80; i += 1) {
    try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); if (targets?.length) break; } catch { /* Chrome 启动中 */ }
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
  await cdp('Page.navigate', { url: `${url}${url.includes('?') ? '&' : '?'}lint` });

  let panel = '';
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await sleep(250);
    const errors = await evaluate(`(window.__lintErrors || []).join('\\n')`).catch(() => '');
    if (errors) { console.error(errors); process.exitCode = 1; }
    panel = await evaluate(`document.getElementById('lintPanel') ? document.getElementById('lintPanel').innerText : ''`).catch(() => '');
    if (panel) break;
  }
  if (!panel) throw new Error(`lint 面板在 ${timeout}ms 内没有出现（页面脚本可能报错）`);

  const shot = option('shot');
  if (shot) {
    mkdirSync(path.dirname(path.resolve(shot)), { recursive: true });
    const image = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.resolve(shot), Buffer.from(image.data, 'base64'));
  }
  console.log(panel);
  if (panel.includes('✗') || /检查发现 \d+ 个问题/.test(panel)) process.exitCode = 1;
} finally {
  if (ws) ws.close();
  chrome.kill('SIGTERM');
  await sleep(600);
  chrome.kill('SIGKILL');
}
