// Cheese Motion · 视觉回归自检
//
// 这条测试要证明三件事：
//   1) 像素比对**能抓住**画面被悄悄改动（假阴性 = 0）—— 改了尺寸就必须报漂移；
//   2) 像素比对**不会误报**（假阳性 = 0）—— 同一份画面重跑必须零差异；
//   3) 基线只能由人手动刷新，产线入口（contact-sheet）绝不自己改基线。
//
// 第 1、2 条是这套东西能不能用的前提：抓不住改动的回归层等于没有回归层。
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import {
  runVisualRegression, baselineDirFor, readBaselineMeta, findChrome, VISUAL_DEFAULTS
} from '../templates/kit/visual-regression.js';
import { buildContactSheet } from '../templates/kit/contactsheet.js';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

/* rule: E26 画面必须与像素基线逐帧可比对 */
/* rule: E27 基线只能由人验收后手动刷新，产线不得自动改基线 */

assert.ok(findChrome(), '未找到 Chrome，视觉回归测试无法运行');

/* ---------- 纯函数部分（无浏览器依赖，必须始终可跑） ---------- */

/* 基线目录约定：一段画面一份基线 */
assert.equal(
  baselineDirFor('/jobs/j1', 'film'),
  path.join('/jobs/j1', 'baseline-film'),
  '基线目录必须遵循 baseline-<segmentId> 约定'
);

const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'visual-regression-test-'));

try {
  /* ---------- 接触表必须把视觉回归状态呈现为可见状态 ---------- */
  const sheet = buildContactSheet({
    title: '夹具', stage: 'film', previewUrl: '/x/index.html',
    rows: [{ label: '第一拍', verb: '出现', focus: 'f', carry: 'c', start: 0, end: 1, shot: 's.png', visualStatus: 'drift' }],
    manual: [],
    visual: {
      overall: 'drift',
      segments: [{
        id: 'film', title: '全片', status: 'drift', baselineDir: 'jobs/j1/baseline-film',
        frames: 13, note: '1/13 帧与基线不一致', diffs: [{ t: 3.6, reason: '显著差异 10095 像素（0.4868%）' }]
      }]
    }
  });
  assert.ok(sheet.html.includes('视觉回归'), '接触表 HTML 必须包含视觉回归区块');
  assert.ok(sheet.html.includes('与基线不一致'), '接触表 HTML 必须显示漂移状态');
  assert.ok(sheet.html.includes('0.4868%'), '接触表 HTML 必须显示差异细节');
  assert.ok(sheet.markdown.includes('视觉回归'), '接触表 Markdown 必须包含视觉回归区块');
  assert.ok(sheet.markdown.includes('baseline-film'), '接触表 Markdown 必须显示基线路径');

  /* 状态缺失时不能装作通过 */
  const noVisual = buildContactSheet({
    title: '夹具', stage: 'film', previewUrl: '/x/index.html',
    rows: [], manual: []
  });
  assert.ok(!noVisual.html.includes('视觉回归（Golden Frame'), '没有视觉数据时不应渲染视觉回归区块');

  /* ---------- 产线入口绝不自己改基线 ---------- */
  const contactSheetSource = readFileSync(path.join(repoRoot, 'scripts/contact-sheet.mjs'), 'utf8');
  assert.ok(
    !/update\s*:\s*true/.test(contactSheetSource),
    'contact-sheet.mjs 不得以 update:true 调用视觉回归 —— 基线只能由人手动刷新'
  );
  assert.ok(
    !/['"`]--update['"`]/.test(contactSheetSource),
    'contact-sheet.mjs 不得引用 --update 参数 —— 基线刷新是人工动作'
  );
  const cliSource = readFileSync(path.join(repoRoot, 'scripts/qa-visual-regression.mjs'), 'utf8');
  assert.ok(cliSource.includes('--update'), 'CLI 必须保留 --update 入口（由人手动执行）');

  /* ---------- 浏览器部分：假阴性 / 假阳性 ---------- */
  const fixtureUrl = pathToFileURL(path.join(repoRoot, 'scripts/fixtures/visual-regression.html')).href;
  const baselineDir = path.join(tmpRoot, 'baseline-fixture');
  const times = [0.5, 2];

  const build = await runVisualRegression({
    url: `${fixtureUrl}?c=%23c6ff3d&s=400`,
    baselineDir, times, update: true, repoRoot, log: () => {}
  });
  assert.equal(build.status, 'pass', '生成基线应成功');
  assert.equal(build.results.filter(r => r.status === 'baseline').length, 2, '应生成 2 帧基线');
  const meta = readBaselineMeta(baselineDir);
  assert.ok(meta && meta.times.length === 2, '基线元信息必须记录时刻');
  assert.ok(meta.tolerance === VISUAL_DEFAULTS.tolerance, '基线必须记录容差');

  const same = await runVisualRegression({
    url: `${fixtureUrl}?c=%23c6ff3d&s=400`, baselineDir, times, repoRoot, log: () => {}
  });
  assert.equal(same.status, 'pass', '同一画面重跑必须通过（假阳性 = 0）');
  assert.equal(same.results.length, 2);
  for (const result of same.results) {
    assert.equal(result.significant, 0, `t=${result.t} 不应有显著差异`);
  }

  /* 画面被悄悄改了 4px —— 必须被抓到（假阴性 = 0） */
  const changed = await runVisualRegression({
    url: `${fixtureUrl}?c=%23c6ff3d&s=404`, baselineDir, times, repoRoot, log: () => {}
  });
  assert.equal(changed.status, 'drift', '画面改动必须被检出');
  assert.equal(changed.failures.length, 2, '两帧都应报漂移');
  assert.ok(changed.failures[0].reason.includes('超过容差'), '失败原因要说明超过容差');
  assert.ok(existsSync(changed.failures[0].diffFile), '必须写出差异图');

  /* 缺基线不能装作通过 */
  const missing = await runVisualRegression({
    url: `${fixtureUrl}?c=%23c6ff3d&s=400`,
    baselineDir: path.join(tmpRoot, 'baseline-none'), times, repoRoot, log: () => {}
  });
  assert.equal(missing.status, 'missing', '缺基线必须显式失败');
} finally {
  rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
}

console.log('PASS 视觉回归：能抓住画面改动（假阴性 0）、不误报一致画面（假阳性 0）、基线刷新仅限人工');
