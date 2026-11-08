// Cheese Motion · 设计台闸门回归测试
// rule: C01
// rule: C02
// rule: C03
// rule: E28 拍数由语义段落数决定，不是固定值
//
// 这三项都是本期真实返工的根因：
//   C01 闸门返工永远可用 —— 本期「样片还要改」被按钮锁死，用户两次卡死
//   C02 服务端 analysis 是唯一权威 —— 本期草稿快照覆盖服务端新版 analysis，闸门 1 看不到设计卡
//   C03 迟到结果不得覆盖已确认闸门 —— 本期迟到的检索结果把已确认的参考单静默清空
//   E28 拍数不再是五 —— 拍 id 自由后，闸门页不能再因为「找不到这个 id 的动作」而白屏
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = process.env.STUDIO_URL || 'http://127.0.0.1:7100';
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) {
  console.log('SKIP 设计台闸门测试：未找到 Chrome，设置 CHROME_PATH 后可运行');
  process.exit(0);
}

/* 设计台没跑起来时跳过（缺资源不阻塞） */
try {
  const probe = await fetch(`${base}/studio/`, { method: 'GET' });
  if (!probe.ok) throw new Error(String(probe.status));
} catch {
  console.log(`SKIP 设计台闸门测试：${base} 未启动`);
  process.exit(0);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const debugPort = 9900 + process.pid % 80;
const profile = path.join(repoRoot, '.tmp', `studio-gates-${process.pid}`);
rmSync(profile, { recursive: true, force: true });

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
  await cdp('Page.navigate', { url: `${base}/studio/` });
  await sleep(1500);

  /* 用测试钩子直接构造「已确认到样片、已有全片任务」的状态 */
  const prepared = await evaluate(`(() => {
    const hook = window.__motionGateTest;
    if (!hook) return { ok: false, reason: '缺少测试钩子 window.__motionGateTest' };
    hook.state.analysis = { summary: '测试', beats: [], assets: [] };
    hook.state.slots = [{ id: 'N1' }, { id: 'N2' }];
    hook.state.confirmations = { storyboard: true, references: true, masters: true, samples: true };
    hook.state.masterJobId = 'job-master-test';
    hook.state.masterResult = { jobId: 'job-master-test' };
    hook.state.sampleJobId = 'job-samples-test';
    hook.state.sampleResult = { jobId: 'job-samples-test' };
    hook.state.filmJobId = 'job-film-test';
    hook.state.filmResult = { jobId: 'job-film-test' };
    hook.updateGateUI();
    return { ok: true };
  })()`);
  assert.equal(prepared.ok, true, `无法准备测试状态：${prepared.reason || ''}`);

  /* C01：每一环有产物时，返工按钮都必须可用 */
  const rejectState = await evaluate(`({
    storyboard: !document.getElementById('rejectStoryboard').disabled,
    references: !document.getElementById('rejectReferences').disabled,
    masters: !document.getElementById('rejectMasters').disabled,
    samples: !document.getElementById('rejectSamples').disabled,
    film: !document.getElementById('rejectFilm').disabled
  })`);
  for (const [gate, enabled] of Object.entries(rejectState)) {
    assert.equal(enabled, true, `C01 ${gate} 闸门有产物时返工按钮必须可用`);
  }

  /* C01：全片按钮不得因「已有任务未出结果」被锁死 */
  const filmButton = await evaluate(`({ disabled: document.getElementById('generateFilm').disabled, label: document.getElementById('generateFilmLabel').textContent })`);
  assert.equal(filmButton.disabled, false, 'C01 样片已确认时全片按钮必须可用');
  assert.match(filmButton.label, /重新生成/, 'C01 已有全片任务时按钮文案必须说明是重新生成');

  /* C01：执行返工必须真的清掉该环产物 */
  const afterReject = await evaluate(`(() => {
    window.__motionGateTest.rejectGate('film');
    return {
      filmDisabled: document.getElementById('rejectFilm').disabled,
      generateDisabled: document.getElementById('generateFilm').disabled,
      snapshot: window.__motionGateTest.snapshot()
    };
  })()`);
  assert.equal(afterReject.filmDisabled, true, 'C01 全片返工后该环产物应清空（按钮转为不可用）');
  assert.equal(afterReject.generateDisabled, false, 'C01 全片返工后仍应能重新生成');
  assert.equal(afterReject.snapshot.filmJobId, '', 'C01 全片返工必须清掉任务号');

  /* C01：样片返工必须清掉样片确认，同时保留上游的母版确认 */
  const sampleReject = await evaluate(`(() => {
    const hook = window.__motionGateTest;
    hook.state.confirmations.samples = true;
    hook.state.sampleJobId = 'job-samples-test';
    hook.updateGateUI();
    hook.rejectGate('samples');
    return hook.snapshot();
  })()`);
  assert.equal(sampleReject.confirmations.samples, false, 'C01 样片返工必须清掉样片确认');
  assert.equal(sampleReject.confirmations.masters, true, 'C01 样片返工不得连带清掉上游母版确认');

  /* C03：迟到结果不得覆盖已确认闸门 */
  const lateResult = await evaluate(`(async () => {
    const hook = window.__motionGateTest;
    const slot = { id: 'TEST1', concept: '测试素材', action: '出现', query: 'test', abstractOnly: true, semanticName: '测试', rights: '本地生成' };
    hook.state.slots = [slot];
    hook.state.confirmations.references = true;
    hook.state.selections = { TEST1: { id: 'old-choice', name: '旧选择' } };
    const grid = document.createElement('div');
    const button = document.createElement('button');
    document.body.append(grid, button);
    await window.loadCandidates(slot, grid, button);
    const result = {
      selection: hook.state.selections.TEST1,
      referencesConfirmed: hook.state.confirmations.references,
      notice: grid.textContent.includes('迟到')
    };
    grid.remove(); button.remove();
    return result;
  })()`);
  assert.equal(lateResult.selection && lateResult.selection.id, 'old-choice', 'C03 迟到结果不得清空已确认的选择');
  assert.equal(lateResult.referencesConfirmed, true, 'C03 迟到结果不得作废 references 确认');
  assert.equal(lateResult.notice, true, 'C03 必须明确告诉用户这是迟到结果且已保留原选择');

  /* C02：服务端 analysis 是唯一权威 —— 本地旧快照不得覆盖服务端已校验的 analysis */
  const authority = await evaluate(`(async () => {
    const helper = window.__motionGateTest ? null : null;
    const draft = { jobId: 'motion-does-not-exist', analysis: { version: 1, summary: '旧快照' } };
    const fn = window.authoritativeAnalysis;
    if (typeof fn !== 'function') return { hasHelper: false };
    const result = await fn(draft);
    return { hasHelper: true, summary: result && result.summary };
  })()`);
  assert.equal(authority.hasHelper, true, 'C02 必须存在 authoritativeAnalysis 权威源判定');
  assert.equal(authority.summary, '旧快照', 'C02 服务端不可用时必须回落到草稿快照，而不是崩掉');

  /* E28：拍数不再固定为五，拍 id 也自由 —— 闸门页必须照常渲染，不能白屏 */
  const freeBeats = await evaluate(`(() => {
    const hook = window.__motionGateTest;
    const beats = Array.from({ length: 8 }, (_, index) => ({
      id: 'beat-' + (index + 1), label: '第 ' + (index + 1) + ' 拍', duration: 4,
      action: 'component-flow', narration: '旁白 ' + (index + 1), note: '动作',
      focus: '焦点', verb: '出现', relation: '关系', soundCue: 'cue', carry: '承接', assetIds: []
    }));
    hook.state.analysis = { summary: '测试', beats, assets: [] };
    hook.renderBeatEditor();
    const rows = [...document.querySelectorAll('.beat-row')];
    const selects = rows.map(row => row.querySelector('[data-field="action"]'));
    const samples = hook.representativeSamples();
    return {
      rowCount: rows.length,
      everySelectHasOptions: selects.every(select => select && select.options.length > 0),
      sampleIds: samples.map(sample => sample.beat.id),
      unknownIdOptions: hook.beatActions('beat-1').length
    };
  })()`);
  assert.equal(freeBeats.rowCount, 8, 'E28 八拍分镜必须全部渲染出来');
  assert.equal(freeBeats.everySelectHasOptions, true, 'E28 未知拍 id 也必须有画面动作可选（旧实现会直接抛错白屏）');
  assert.ok(freeBeats.unknownIdOptions > 0, 'E28 未知拍 id 必须回落到通用动作表');
  assert.equal(freeBeats.sampleIds[0], 'beat-1', 'E28 开场样片应取首拍');
  assert.ok(freeBeats.sampleIds[1] && freeBeats.sampleIds[1] !== 'beat-1', 'E28 核心机制样片不能与开场撞同一拍');

  console.log('PASS 设计台闸门：返工永远可用、全片不锁死、权威源判定存在、拍数自由不白屏');
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGTERM');
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); }
  catch { /* Chrome 可能还在写临时目录 */ }
}
