// Cheese Motion · 语义接触表生成器
//
// 用途：把「每拍一张关键帧 + 动词 + 焦点 + 承接」变成可交付物。
// 机器查渲染，人查语义 —— 本期 11 个画面逻辑缺陷没有一个是 lint 抓到的，
// 全是人眼看出来的，所以语义验收必须提前到每一拍，而不是等到全片。
//
// 用法：
//   node scripts/contact-sheet.mjs <jobId> <samples|film> [--srt <path>] [--out <dir>]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseSrt, buildTimeline, keyFrameTime, buildContactSheet } from '../templates/kit/contactsheet.js';
import { MANUAL_CHECKS } from '../templates/kit/manual-checks.js';
import { runVisualRegression, baselineDirFor } from '../templates/kit/visual-regression.js';

const args = process.argv.slice(2);
const jobId = args.find(arg => !arg.startsWith('--'));
const stage = args.find(arg => args.indexOf(arg) > 0 && !arg.startsWith('--') && arg !== jobId);
if (!jobId || !stage) {
  throw new Error('用法：node scripts/contact-sheet.mjs <jobId> <samples|film> [--srt <path>] [--out <dir>]');
}
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const jobDir = path.join(repoRoot, 'studio/production-jobs', jobId);
if (!existsSync(jobDir)) throw new Error(`找不到生产任务目录：${jobDir}`);
const job = JSON.parse(readFileSync(path.join(jobDir, 'job.json'), 'utf8'));

const analysisFile = path.join(repoRoot, 'studio/agent-jobs', job.package.agentJobId || '', 'analysis.json');
if (!existsSync(analysisFile)) throw new Error(`找不到 Agent analysis：${analysisFile}`);
const analysis = JSON.parse(readFileSync(analysisFile, 'utf8'));

/* ---------- 时间轴：SRT 是唯一可靠来源 ---------- */
const srtPath = option('srt');
let sentences = null;
if (srtPath && existsSync(srtPath)) sentences = parseSrt(readFileSync(srtPath, 'utf8'));
const beats = analysis.beats.map(beat => ({
  ...beat,
  narration: beat.narration || (job.package.beats.find(b => b.id === beat.id) || {}).narration || '',
  label: beat.label || (job.package.beats.find(b => b.id === beat.id) || {}).label || beat.id
}));
const timeline = buildTimeline(beats, sentences);

/* ---------- 片段 → 预览地址 ---------- */
const resultFile = path.join(jobDir, stage === 'film' ? 'film.json' : 'samples.json');
if (!existsSync(resultFile)) throw new Error(`找不到 ${stage} 结果文件：${resultFile}`);
const result = JSON.parse(readFileSync(resultFile, 'utf8'));
const segments = stage === 'film'
  ? [{ id: 'film', title: result.title || '全片', previewUrl: result.previewUrl, coversBeats: beats.map(b => b.id) }]
  : result.samples.map(sample => ({
    id: sample.id, title: sample.title, previewUrl: sample.previewUrl,
    coversBeats: sample.coversBeats || [], carry: sample.carry
  }));
const segmentOf = beatId => segments.find(segment => segment.coversBeats.includes(beatId)) || null;

/* ---------- 抽帧（复用已验证的连续性 QA 工具，顺带保证每帧都过了连续性检查） ---------- */
const outDir = option('out', path.join(jobDir, 'contact-sheet'));
const shotsDir = path.join(outDir, 'shots');
mkdirSync(shotsDir, { recursive: true });

const timesBySegment = new Map();
for (const segment of segments) {
  const times = timeline
    .filter(row => segment.coversBeats.includes(row.id))
    .map(row => keyFrameTime(row));
  if (times.length) timesBySegment.set(segment.id, times);
}
for (const [segmentId, times] of timesBySegment) {
  const segment = segments.find(item => item.id === segmentId);
  const url = `http://127.0.0.1:7100${segment.previewUrl}`;
  console.log(`抽帧 ${segmentId}：${times.join(',')}s ← ${url}`);
  const run = spawnSync(process.execPath, [
    path.join(repoRoot, 'scripts/qa-continuous-runtime.mjs'), url,
    '--times', times.join(','), '--shots', shotsDir
  ], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error(`抽帧失败（${segmentId}）：qa-continuous-runtime 未通过`);
}

/* ---------- 语义校验（L2 构图 + L3 语义 + 承接连续） ----------
   接触表不能只是一张图：它必须建立在「已通过语义校验」的帧上。
   校验不通过 → 接触表不生成 → 产线不会把这版交到用户面前。 */
const boundaries = timeline.slice(0, -1).map((row, index) => {
  const next = timeline[index + 1];
  const boundary = Number(((row.end + next.start) / 2).toFixed(2));
  return { from: row.id, to: next.id, boundary, before: Number((boundary - 0.05).toFixed(2)), after: Number((boundary + 0.05).toFixed(2)) };
});
for (const segment of segments) {
  const segmentTimes = timeline.filter(row => segment.coversBeats.includes(row.id)).map(row => keyFrameTime(row));
  const segmentPairs = boundaries
    .filter(boundary => segment.coversBeats.includes(boundary.from) && segment.coversBeats.includes(boundary.to))
    .map(boundary => `${boundary.before},${boundary.after}`);
  if (!segmentTimes.length) continue;
  const args = [
    path.join(repoRoot, 'scripts/qa-semantic-lint.mjs'),
    `http://127.0.0.1:7100${segment.previewUrl}`,
    '--times', segmentTimes.join(',')
  ];
  if (segmentPairs.length) args.push('--carry-pairs', segmentPairs.join(';'));
  const run = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (run.status !== 0) throw new Error(`语义校验未通过（${segment.id}）—— 接触表不予生成`);
}

/* ---------- 视觉回归（回归层 · 机器查一致，人拍板） ----------
   画面合法改动必然与基线不符，所以这里**不阻断交付** ——
   它的作用是把「这一帧和上次不一样」摆在验收者面前，由人决定是合法修改还是回归。
   基线只能由人在验收后手动 --update，Agent 不得自行改基线。 */

/* rule: E27 基线只能由人验收后手动刷新，产线不得自动改基线 */
const visualSegments = [];
for (const segment of segments) {
  const baselineDir = baselineDirFor(jobDir, segment.id);
  const url = `http://127.0.0.1:7100${segment.previewUrl}`;
  const outcome = await runVisualRegression({
    url, baselineDir, repoRoot,
    log: line => console.log(line)
  });
  visualSegments.push({
    id: segment.id,
    title: segment.title,
    status: outcome.status,
    baselineDir: path.relative(repoRoot, baselineDir),
    frames: outcome.times.length || null,
    note: outcome.note,
    diffs: outcome.failures.map(failure => ({
      t: failure.t, reason: failure.reason, diffFile: failure.diffFile ? path.relative(repoRoot, failure.diffFile) : null
    }))
  });
  console.log(`视觉回归 ${segment.id}：${outcome.status} —— ${outcome.note}`);
}
const visualStatusOf = new Map(visualSegments.map(segment => [segment.id, segment.status]));
const visualOverall = visualSegments.some(segment => segment.status === 'drift') ? 'drift'
  : visualSegments.some(segment => segment.status === 'missing') ? 'missing'
  : visualSegments.every(segment => segment.status === 'skipped') ? 'skipped' : 'pass';

/* ---------- 组装 ---------- */
const rows = timeline.map(row => {
  const segment = segmentOf(row.id);
  const time = keyFrameTime(row);
  const shot = segment ? `shots/frame-${time}.png` : null;
  return {
    id: row.id,
    label: row.label,
    segment: segment ? segment.title : null,
    start: row.start,
    end: row.end,
    verb: row.verb,
    focus: row.focus,
    relation: row.relation,
    carry: row.carry,
    shot,
    visualStatus: segment ? (visualStatusOf.get(segment.id) || null) : null,
    estimated: row.estimated
  };
});

/* 只能人工看的检查项 —— 共享清单（templates/kit/manual-checks.js），跨期只有一份 */
const manual = MANUAL_CHECKS;

const sheet = buildContactSheet({
  title: `${job.package.title} · ${stage === 'film' ? '全片' : '两段代表样片'}`,
  stage,
  previewUrl: stage === 'film' ? result.previewUrl : segments.map(s => s.previewUrl).join(' / '),
  rows,
  manual,
  visual: { overall: visualOverall, segments: visualSegments }
});

writeFileSync(path.join(outDir, 'contact-sheet.md'), sheet.markdown, 'utf8');
writeFileSync(path.join(outDir, 'contact-sheet.html'), sheet.html, 'utf8');
const manifest = {
  version: 1, jobId, stage,
  previewUrl: stage === 'film' ? result.previewUrl : segments.map(s => s.previewUrl),
  rows: rows.map(row => ({
    beat: row.id, label: row.label, segment: row.segment,
    start: row.start, end: row.end, verb: row.verb, focus: row.focus,
    carry: row.carry, shot: row.shot, visualStatus: row.visualStatus, estimated: row.estimated
  })),
  manual: manual.map(item => item.id),
  visual: { overall: visualOverall, segments: visualSegments },
  boundaries,
  generatedAt: new Date().toISOString()
};
writeFileSync(path.join(outDir, 'contact-sheet.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`语义接触表已生成 → ${outDir}/contact-sheet.html（${rows.filter(r => r.shot).length}/${rows.length} 拍有帧）`);
console.log(`视觉回归状态：${visualOverall}${visualOverall === 'drift' ? ' —— 有帧与基线不一致，请人工确认是合法修改还是回归' : ''}`);
