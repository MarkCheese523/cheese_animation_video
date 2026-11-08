// Cheese Motion · 语义校验（L2 构图 + L3 语义）QA
//
// 为什么单独一条链路：
//   L1 渲染层（引擎 lint）查越界、重叠、时间窗；本期 11 个画面逻辑缺陷它一个都抓不到。
//   这一层查的是「画面在表达什么」—— 主体有没有塌缩、同组信息有没有散开、
//   声称「装进去」的东西是不是真的在容器里、焦点是不是唯一、
//   元素声称的动词与真实动作是否一致、角色与语义标签是否与旁白一致。
//
//   这些判定全部来自元素自带的语义注解（role/verb/anchor/sem/group/container），
//   不需要 AI 判断，也不依赖人的主观感受 —— 机器查一致，人查好坏。
//
// 用法：node scripts/qa-semantic-lint.mjs <page-url> --times 0.8,3.6,6.9 [--strict]
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const url = args.find(arg => !arg.startsWith('--') && args[args.indexOf(arg) - 1]?.match(/^--(times|shots)$/) === undefined);
const times = option('times', '').split(',').filter(Boolean).map(Number);
/* 承接连续检查（rule: E23）：只在**拍次边界**前后比对，中间帧位移大是设计本身，不是错误 */
const carryPairs = option('carry-pairs', '').split(';').filter(Boolean)
  .map(pair => pair.split(',').map(Number)).filter(pair => pair.length === 2 && pair.every(Number.isFinite));
if (!url || !times.length) {
  throw new Error('用法：node scripts/qa-semantic-lint.mjs <page-url> --times 0.8,3.6,6.9 [--carry-pairs "6.9,6.95;12.75,12.85"]');
}

const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) {
  console.log('SKIP 语义校验：未找到 Chrome，设置 CHROME_PATH 后可运行');
  process.exit(0);
}
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debugPort = 9800 + process.pid % 150;
const profile = path.join(repoRoot, '.tmp', `semantic-lint-${process.pid}`);
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

let ws;
const pending = new Map();
let nextId = 0;
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
};

try {
  let targets;
  for (let attempt = 0; attempt < 75; attempt++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      if (targets.length) break;
    } catch { /* Chrome 启动中 */ }
    await sleep(200);
  }
  if (!targets || !targets.length) throw new Error('无法连接 Chrome');
  const { WebSocket } = await import('node:worker_threads').then(() => ({ WebSocket: globalThis.WebSocket }));
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  await cdp('Page.enable');
  await cdp('Page.navigate', { url });
  await sleep(1600);

  const hasKit = await evaluate('typeof Kit !== "undefined" && typeof Kit.lintAt === "function"');
  if (!hasKit) throw new Error('页面没有加载 kit（templates/kit/stage-kit.js）—— 无法做语义校验');

  const findings = [];
  for (const t of times) {
    const result = await evaluate(`(() => { const r = Kit.lintAt(${t}); return { t: r.t, issues: r.issues, annotated: r.report.length }; })()`);
    for (const issue of result.issues) findings.push({ t: result.t, issue });
    console.log(`  ${String(t).padStart(6)}s  语义元素 ${String(result.annotated).padStart(3)} 个 · ${result.issues.length ? '⚠ ' + result.issues.length + ' 项' : '✓'}`);
  }

  /* 承接连续：拍次边界前后，同一主体不得跳变 */
  for (const [before, after] of carryPairs) {
    const beforeReport = await evaluate(`Kit.lintAt(${before}).report`);
    const afterReport = await evaluate(`Kit.lintAt(${after}).report`);
    const carryIssues = await evaluate(`Kit.lintCarry(${JSON.stringify(beforeReport)}, ${JSON.stringify(afterReport)}, { maxJump: 40 })`);
    for (const issue of carryIssues) findings.push({ t: after, issue });
    console.log(`  ${before}s → ${after}s  承接连续 ${carryIssues.length ? '⚠ ' + carryIssues.length + ' 项' : '✓'}`);
  }

  if (findings.length) {
    console.log('\n语义校验未通过：');
    for (const finding of findings) console.log(`  [${finding.t}s] ${finding.issue}`);
    writeFileSync(path.join(repoRoot, '.tmp', 'semantic-lint-failures.json'), JSON.stringify(findings, null, 2), 'utf8');
    process.exitCode = 1;
  } else {
    console.log(`\nsemantic-lint: ${times.length} 个时间点语义一致（L2 构图 + L3 语义），无问题`);
  }
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGTERM');
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); }
  catch { /* Chrome 可能还在写临时目录，清理失败不影响校验结论 */ }
}
