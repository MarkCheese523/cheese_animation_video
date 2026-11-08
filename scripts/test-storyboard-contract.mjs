// Cheese Motion · 分镜契约自检（P1-5 + P1-6）
//
// 它盯四件事：
//   ① 设计台路径与对话路径共用同一套校验（agent-flow.mjs 与 CLI 报同样的错）
//   ② 表E 的「怎么变」是枚举，不是自由文本（E33 第一条断言）
//   ③ 同一手法连续过多 = 在套模板（E33 第二条断言）
//   ④ detail 去重率过低 = 每行都在说同一句话（E33 第三条断言）
//
// 现成的真实 fixture（不用造数据）：
//   · 失败样本：studio/production-jobs/motion-4cfd2c66-…/job.json 的
//     package.agentAnalysis.carryTable —— 23 行套话
//   · 通过样本：同一任务的 samples.json 里 opening / mechanism 两条高质量 carry
/* rule: E01 */
/* rule: E02 */
/* rule: E03 */
/* rule: E04 */
/* rule: E05 */
/* rule: E33 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  checkStoryboard, cleanCarryTable, CARRY_METHODS, LONG_FILM_BEATS, LONG_FILM_CARRY_ROWS
} from '../templates/kit/storyboard-contract.js';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = rel => readFileSync(path.join(repoRoot, rel), 'utf8');
const jobId = 'motion-4cfd2c66-bdf6-49b5-ac50-e9a4bf1f6c6c';
const jobDir = `studio/production-jobs/${jobId}`;
assert.ok(existsSync(path.join(repoRoot, jobDir, 'job.json')), `fixture 目录必须存在：${jobDir}`);

const job = JSON.parse(read(`${jobDir}/job.json`));
const samples = JSON.parse(read(`${jobDir}/samples.json`));
const analysis = job.package.agentAnalysis;
const beats = analysis.beats;

/* ── ① 真实 fixture：23 行套话必须被拒 ── */
assert.equal(analysis.carryTable.length, 23, 'fixture 必须是 23 行承接表');
const taohua = analysis.carryTable[0].how;
assert.equal(new Set(analysis.carryTable.map(row => row.how)).size, 1, 'fixture 的 23 行 how 必须完全相同（这正是退化形态）');

assert.throws(
  () => checkStoryboard({ designCard: analysis.designCard, beats, carryTable: analysis.carryTable }),
  error => /手法枚举|套模板|套话|去重率/.test(error.message),
  `23 行套话必须被拒 —— 实际通过了`
);

/* ── ② 真实 fixture：samples.json 的两条高质量 carry 必须通过 ── */
for (const sample of samples.samples) {
  const sampleBeats = beats.filter(beat => sample.coversBeats.includes(beat.id));
  assert.equal(sampleBeats.length, 2, `${sample.id} 必须覆盖两拍`);
  const storyboard = {
    designCard: analysis.designCard,
    beats: sampleBeats,
    carryTable: [{
      boundary: `${sampleBeats[0].id} → ${sampleBeats[1].id}`,
      survivor: '持续主体（同一 DOM 身份）',
      how: sample.carry,
      becomes: sampleBeats[1].focus
    }]
  };
  /* 样片段只有两拍 —— E06 要求样片覆盖连续两拍，所以按单段口径校验 */
  const result = checkStoryboard(storyboard, { minBeats: 2 });
  assert.equal(result.carryTable.length, 1, `${sample.id} 应当只产出一行承接`);
  assert.ok(CARRY_METHODS.has(result.carryTable[0].method), `${sample.id} 应当推断出手法枚举，实际「${result.carryTable[0].method}」`);
  assert.equal(result.carryTable[0].methodInferred, true, `${sample.id} 的手法应当是从自由文本推断出来的`);
}

/* ── ③ E33 三条断言各自触发 ── */
const beatIds = beats.map(beat => beat.id);
const goodRow = { survivor: '持续主体', method: '落下', detail: '从 (540,700) 移到 (280,900)', becomes: '工位上的卡' };

/* 手法不在枚举内 */
assert.throws(
  () => cleanCarryTable([{ ...goodRow, method: '飘过去' }], ['b01', 'b02']),
  /手法枚举/
);
/* 同一手法连续超过 5 次 */
const sameMethod = Array.from({ length: 6 }, (_, index) => ({
  ...goodRow, detail: `第 ${index} 个边界的不同描述 ${index}`
}));
assert.throws(() => cleanCarryTable(sameMethod, beatIds), /套模板/);
/* detail 去重率过低 */
const sameDetail = Array.from({ length: 6 }, (_, index) => ({
  ...goodRow, method: ['长成', '展开', '归档', '落下', '分出多个', '多个汇成一个'][index]
}));
assert.throws(() => cleanCarryTable(sameDetail, beatIds), /去重率/);
/* 手法合法 + 描述各异 → 通过 */
assert.equal(cleanCarryTable(sameDetail.map((row, index) => ({ ...row, detail: `第 ${index} 个边界的不同描述` })), beatIds).length, 6);

/* ── ④ 长片降填：>12 拍只强制填语义段落边界 ── */
const longIds = Array.from({ length: 24 }, (_, index) => `b${String(index + 1).padStart(2, '0')}`);
assert.throws(
  () => cleanCarryTable(Array.from({ length: 23 }, (_, index) => ({ ...goodRow, detail: `描述 ${index}` })), longIds),
  /长片|语义段落边界/,
  '24 拍的长片填 23 行必须被拒'
);
const longRows = Array.from({ length: LONG_FILM_CARRY_ROWS.min }, (_, index) => ({
  ...goodRow, method: ['长成', '展开', '归档', '落下', '分出多个', '多个汇成一个', '替换'][index],
  detail: `第 ${index} 个语义段落边界：${index}`
}));
assert.equal(cleanCarryTable(longRows, longIds).length, LONG_FILM_CARRY_ROWS.min, '长片填 4 行必须通过');
assert.ok(LONG_FILM_BEATS === 12, '长片阈值应是 12 拍');

/* ── ⑤ 设计台路径与对话路径报同样的错 ── */
{
  const { validateAgentAnalysis } = await import('../agent-flow.mjs');
  let designDeskError = null;
  try {
    validateAgentAnalysis({
      jobId: analysis.jobId, summary: '', designCard: analysis.designCard,
      beats, carryTable: analysis.carryTable,
      assets: analysis.assets
    });
  } catch (error) {
    designDeskError = error.message;
  }
  assert.ok(designDeskError, '设计台路径也必须拒绝 23 行套话');
  assert.match(designDeskError, /手法枚举|套模板|套话|去重率/, `设计台路径的原因必须与模块一致，实际：${designDeskError}`);
}

/* ── ⑥ CLI 与模块报同样的错 ── */
const tmp = mkdtempSync(path.join(tmpdir(), 'storyboard-'));
try {
  const badFile = path.join(tmp, 'bad.json');
  writeFileSync(badFile, JSON.stringify({
    designCard: analysis.designCard, beats, carryTable: analysis.carryTable
  }), 'utf8');
  const cli = spawnSync(process.execPath, [path.join(repoRoot, 'scripts/check-storyboard.mjs'), badFile], { encoding: 'utf8' });
  assert.equal(cli.status, 1, 'CLI 对 23 行套话必须 exit 1');
  assert.match(`${cli.stdout}\n${cli.stderr}`, /手法枚举|套模板|套话|去重率/, 'CLI 必须给出与模块一致的原因');

  const goodFile = path.join(tmp, 'good.json');
  writeFileSync(goodFile, JSON.stringify({
    designCard: analysis.designCard,
    beats: beats.filter(beat => ['b01', 'b02'].includes(beat.id)),
    carryTable: [{
      boundary: 'b01 → b02', survivor: '持续主体', how: samples.samples[0].carry, becomes: '卡面上的完成印记'
    }]
  }), 'utf8');
  const okCli = spawnSync(process.execPath, [path.join(repoRoot, 'scripts/check-storyboard.mjs'), goodFile, '--segment'], { encoding: 'utf8' });
  assert.equal(okCli.status, 0, `CLI 对合格分镜必须 exit 0：\n${okCli.stdout}\n${okCli.stderr}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`PASS 分镜契约：23 行套话被拒、samples.json 两条高质量 carry 通过、E33 三条断言各自触发、长片降填生效、CLI 与模块报同样的错（套话原文：「${taohua.slice(0, 20)}…」）`);
