// Cheese Motion · 装配层 kit 的回归测试（浏览器侧）
// 这些断言锁死的都是**真实返工过的坑**：
//   缺陷 15 主体缩到 17%（kit 缩放嵌套相乘）
//   缺陷 18 压缩间距未大于元素宽度（模块重叠露在机身外）
//   缺陷 19 placeFitted 变换顺序错（品牌整体偏移）
//   缺陷 24 循环粒子缺结束时间（残留到下一拍）
/* rule: E10 */
/* rule: E11 */
/* rule: E12 */
/* rule: E17 */
/* rule: E23 */
/* rule: E18 */
/* rule: E19 */
/* rule: E20 */
/* rule: E21 */
/* rule: E22 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) {
  // 缺资源不阻塞（有 Chrome 时必须全过，没有则明确跳过）
  console.log('SKIP kit（浏览器侧）：未找到 Chrome，设置 CHROME_PATH 后可运行');
  process.exit(0);
}

const engine = readFileSync(path.join(root, 'templates/engine.js'), 'utf8');
const kit = readFileSync(path.join(root, 'templates/kit/stage-kit.js'), 'utf8');
const lintComposition = readFileSync(path.join(root, 'templates/kit/lint-composition.js'), 'utf8');
const lintSemantics = readFileSync(path.join(root, 'templates/kit/lint-semantics.js'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0}#stage{position:absolute;left:0;top:0;width:1080px;height:1920}
#world{position:absolute;left:0;top:0}
</style></head><body>
<div id="stage"><svg id="world" width="1080" height="1920" viewBox="0 0 1080 1920"><g id="cam"></g></svg></div>
<script>${engine}</script>
<script>${kit}</script>
<script>${lintComposition}</script>
<script>${lintSemantics}</script>
</body></html>`;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(html);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

const debugPort = 9700 + process.pid % 200;
const profile = path.join(root, '.tmp', `kit-browser-${process.pid}`);
const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
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
  await cdp('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await sleep(1200);

  const result = await evaluate(`(() => {
    initStage();
    const out = {};

    /* 缺陷 18：压缩间距必须大于元素宽度 */
    try { Kit.compressInto([{}, {}], { gap: 10, size: .3, width: 94 }); out.compressBlocked = false; }
    catch (e) { out.compressBlocked = /gap/.test(e.message); }
    const laid = Kit.compressInto([{}, {}], { gap: 120, size: .3, width: 94, cx: 540 });
    out.compressX = laid.map(item => Math.round(item.x));

    /* 缺陷 15：kit 缩放与 act 的 s 轨道相乘 = 主体缩到 17%，必须被抓到 */
    const scaled = Kit.placeScaled(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-scaled');
    act(scaled, 0, 5, { s: [[0, 2], [5, 2]], x: 100, y: 100 });
    out.scaleIssues = Kit.auditScale(document).length;

    /* kit 缩放嵌套（两层 own）同样必须被抓到 */
    const outer = Kit.placeScaled(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-outer');
    const inner = Kit.placeScaled(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-inner');
    outer.appendChild(inner);
    out.scaleIssuesAfterNest = Kit.auditScale(document).length;

    /* act 的 s 恒为 1（只位移不缩放）不算叠加 */
    const plain = Kit.placeScaled(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-plain-scale');
    act(plain, 0, 5, { s: [[0, 1], [5, 1]], x: 10, y: 10 });
    out.plainScaleIssues = Kit.auditScale(document).filter(i => i.includes('kit-plain-scale')).length;

    /* 缺陷 19：placeFitted 的变换顺序 —— 归一化后包围盒中心必须落在原点 */
    const fitted = Kit.placeFitted(L.main, '<rect x="0" y="0" width="100" height="50" fill="#fff"/>', 200);
    // 用最终渲染矩形判断（getBBox 不含元素自身 transform，无法验证顺序）
    const rect = fitted.g.firstElementChild.getBoundingClientRect();
    out.fitCenter = [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)];
    out.fitSize = [Math.round(fitted.w), Math.round(fitted.h)];

    /* place 不得自带缩放 */
    out.placedScale = /scale/.test(Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-plain').firstElementChild.getAttribute('transform'));

    /* 缺陷 24：循环粒子必须显式给出结束时间 */
    try { Kit.FLOW_LOOP([0, 0], [10, 10], 1, 2); out.loopBlocked = false; }
    catch (e) { out.loopBlocked = /tEnd/.test(e.message); }

    /* 语义注解：未知 role 必须报错 */
    try { Kit.describe(document.createElementNS('http://www.w3.org/2000/svg', 'g'), { role: 'not-a-role' }); out.roleBlocked = false; }
    catch (e) { out.roleBlocked = /role/.test(e.message); }

    /* 语义审计能读到注解 */
    Kit.describe(Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'kit-semantic'),
      { role: 'subject', verb: '运转', anchor: 'device', sem: 'compute-module' });
    const audited = Kit.audit(document).find(item => item.id === 'kit-semantic');
    out.audit = audited ? [audited.role, audited.verb, audited.anchor, audited.sem] : null;

    /* ===== L2 构图 / L3 语义：反例必须被抓到（否则就是假阴性） ===== */
    const layer = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-layer');
    const boxOf = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };

    /* E20 焦点不唯一 */
    const f1 = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'focus-a', { role: 'focus' });
    const f2 = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'focus-b', { role: 'focus' });
    out.focusIssues = Kit.lintComposition(Kit.audit(document)).filter(i => i.includes('E20')).length;

    /* E17 主体占位比塌缩 */
    const tiny = Kit.place(L.main, '<rect x="0" y="0" width="4" height="4"/>', 'tiny-subject', { role: 'subject' });
    out.subjectIssues = Kit.lintComposition(Kit.audit(document)).filter(i => i.includes('E17')).length;

    /* E19 没装进去：声明在容器里，实际在容器外 */
    const container = Kit.place(L.main, '<rect x="0" y="0" width="60" height="60"/>', 'case-container', { role: 'container' });
    const outside = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-outside', { container: 'case-container' });
    outside.setAttribute('transform', 'translate(500 0)');   // 真的落到容器外面去
    out.containerIssues = Kit.lintComposition(Kit.audit(document)).filter(i => i.includes('E19')).length;

    /* E18 同组信息散开 */
    const g1 = Kit.place(L.main, '<rect x="0" y="0" width="20" height="20"/>', 'group-a', { role: 'state', group: 'spread' });
    const g2 = Kit.place(L.main, '<rect x="0" y="0" width="20" height="20"/>', 'group-b', { role: 'state', group: 'spread' });
    g2.setAttribute('transform', 'translate(900 0)');
    out.groupIssues = Kit.lintComposition(Kit.audit(document)).filter(i => i.includes('E18')).length;

    /* E21 声称运转却没有脉动 */
    const still = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-still', { role: 'subject', verb: '运转' });
    out.verbIssues = Kit.lintSemantics(Kit.audit(document)).filter(i => i.includes('E21')).length;

    /* E22 云图标当语音源（本期缺陷 16 的原形） */
    const cloud = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-cloud', { role: 'speech', sem: 'cloud' });
    out.speechIssues = Kit.lintSemantics(Kit.audit(document)).filter(i => i.includes('E22')).length;

    /* E23 承接跳变：同一主体在相邻时间点之间不得瞬移 */
    const mover = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-mover', { role: 'subject' });
    const before = Kit.audit(document);
    mover.setAttribute('transform', 'translate(600 0)');
    const after = Kit.audit(document);
    out.carryIssues = Kit.lintCarry(before, after, { maxJump: 260 }).filter(i => i.includes('case-mover')).length;

    /* 正确声明不应被误报 */
    const good = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-good', { role: 'speech', sem: 'voice-wave' });
    const moving = Kit.place(L.main, '<rect x="0" y="0" width="10" height="10"/>', 'case-moving', { role: 'subject', verb: '运转' });
    Kit.markPredicate(moving, 'pulse');
    out.falsePositives = Kit.lintSemantics(Kit.audit(document)).filter(i => i.includes('case-good') || i.includes('case-moving')).length;

    return out;
  })()`);

  /* 缺陷 18 */
  assert.equal(result.compressBlocked, true, 'gap 小于元素宽度时 compressInto 必须抛错');
  // 两个 94 宽元素、gap 120：总宽 308，起点 = 540 - 154 + 47 = 433，第二件 = 433 + 94 + 120 = 647
  assert.deepEqual(result.compressX, [433, 647], '压缩后的排布必须按 gap 计算');
  /* 缺陷 15 */
  assert.ok(result.scaleIssues >= 1, 'kit 缩放叠加 act 的 s 轨道必须被 auditScale 抓到');
  assert.ok(result.scaleIssuesAfterNest > result.scaleIssues, 'kit 缩放嵌套必须额外被抓到');
  assert.equal(result.plainScaleIssues, 0, 's 恒为 1 的 act 不算缩放叠加');
  /* 缺陷 19 */
  assert.deepEqual(result.fitCenter, [0, 0], 'placeFitted 归一化后包围盒中心必须落在原点（变换顺序正确）');
  assert.deepEqual(result.fitSize, [200, 100], 'placeFitted 的等比缩放尺寸必须正确');
  assert.equal(result.placedScale, false, 'place 不得自带缩放');
  /* 缺陷 24 */
  assert.equal(result.loopBlocked, true, 'FLOW_LOOP 缺 tEnd 必须抛错');
  /* 语义注解 */
  assert.equal(result.roleBlocked, true, '未知 role 必须报错');
  assert.deepEqual(result.audit, ['subject', '运转', 'device', 'compute-module'], '语义审计必须能读出注解');
  /* L2 / L3 反例必须被抓到 —— 抓不到就是假阴性，等于没做 */
  assert.ok(result.focusIssues >= 1, 'E20 焦点不唯一必须被抓到');
  assert.ok(result.subjectIssues >= 1, 'E17 主体占位比塌缩必须被抓到');
  assert.ok(result.containerIssues >= 1, 'E19 没装进容器必须被抓到');
  assert.ok(result.groupIssues >= 1, 'E18 同组信息散开必须被抓到');
  assert.ok(result.verbIssues >= 1, 'E21 声称运转却不动必须被抓到');
  assert.ok(result.speechIssues >= 1, 'E22 云图标当语音源必须被抓到');
  assert.ok(result.carryIssues >= 1, 'E23 承接跳变必须被抓到');
  assert.equal(result.falsePositives, 0, '正确的语义声明不得被误报');

  console.log('PASS kit（浏览器侧）：压缩间距断言、缩放嵌套审计、placeFitted 顺序、粒子结束时间、语义注解');
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGTERM');
  server.close();
}
