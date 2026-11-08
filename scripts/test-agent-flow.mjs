/* rule: E01 */
/* rule: E02 */
/* rule: E03 */
/* rule: E04 */
/* rule: E05 */
/* rule: E28 拍数由语义段落数决定，不是固定值 */
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createAgentJob, readAgentJob, readLatestAgentJob, saveAgentAnalysis, saveAgentDraft, uploadAgentAsset, validateAgentAnalysis } from '../agent-flow.mjs';
import { makeAgentAnalysis, scaleAgentAnalysis } from './fixtures/agent-analysis.mjs';

const srtAttachment = { name: 'voice.srt', url: '/studio/agent-inbox/00000000-0000-0000-0000-000000000000-voice.srt', kind: 'attachment' };
await assert.rejects(() => createAgentJob({ script: '只有脚本，没有 SRT' }), /SRT/);
const job = await createAgentJob({ script: '', mode: 'generic', style: 'cheeseheart-tech', aspect: '9:16', attachments: [srtAttachment] });
const directory = path.resolve('studio/agent-jobs', job.jobId);
try {
  assert.match(job.jobId, /^motion-[a-f0-9-]{36}$/);
  assert.match(job.prompt, /真实语义拆解/);
  assert.match(job.prompt, /不要要求用户预先列清单/);
  const pending = await readAgentJob(job.jobId);
  assert.equal(pending.status, 'awaiting_agent');
  assert.equal(pending.analysis, null);
  assert.equal(pending.job.script, '');
  assert.equal(pending.job.attachments.some(item => item.name.endsWith('.mp3')), false);

  const analysis = makeAgentAnalysis(job.jobId, { brands: [{ name: 'AsterQuark', query: 'asterquark' }] });
  await saveAgentAnalysis(job.jobId, analysis);
  const ready = await readAgentJob(job.jobId);
  assert.equal(ready.status, 'analysis_ready');
  assert.equal(ready.analysis.assets.at(-1).concept, 'AsterQuark');
  assert.equal(ready.analysis.beats.length, 5);
  assert.throws(() => validateAgentAnalysis({ ...analysis, jobId: 'motion-00000000-0000-0000-0000-000000000000' }, job.jobId), /任务 ID 不匹配/);
  const invalid = structuredClone(analysis);
  invalid.beats[0].assetIds = ['MISSING'];
  assert.throws(() => validateAgentAnalysis(invalid, job.jobId), /不存在的素材/);
  // 两级设计卡与表E 承接表是硬闸门：缺字段不得进入制作
  const noCard = structuredClone(analysis);
  delete noCard.designCard.morphTrack;
  assert.throws(() => validateAgentAnalysis(noCard, job.jobId), /两级设计卡/);
  const noVerb = structuredClone(analysis);
  noVerb.beats[1].verb = '呼吸缩放';
  assert.throws(() => validateAgentAnalysis(noVerb, job.jobId), /视觉动词/);
  const noFocus = structuredClone(analysis);
  noFocus.beats[2].focus = '';
  assert.throws(() => validateAgentAnalysis(noFocus, job.jobId), /焦点/);
  const emptyCarry = structuredClone(analysis);
  emptyCarry.carryTable[1].method = '';
  emptyCarry.carryTable[1].detail = '';
  assert.throws(() => validateAgentAnalysis(emptyCarry, job.jobId), /承接表/);
  const shortCarry = structuredClone(analysis);
  shortCarry.carryTable = shortCarry.carryTable.slice(0, 2);
  assert.throws(() => validateAgentAnalysis(shortCarry, job.jobId), /承接表/);

  /* rule: E28 拍数由语义段落数决定，不是固定值
     —— 这一段是本期「五拍写死」的回归测试：
        3 拍要能写进去，8 拍（长视频）也要能写进去，只有越界的才拒绝。 */
  const threeBeats = scaleAgentAnalysis(analysis, 3);
  assert.equal(validateAgentAnalysis(threeBeats, job.jobId).beats.length, 3);
  const eightBeats = scaleAgentAnalysis(analysis, 8);
  const scaled = validateAgentAnalysis(eightBeats, job.jobId);
  assert.equal(scaled.beats.length, 8);
  assert.equal(scaled.carryTable.length, 7, '承接表行数必须等于拍数减一');
  assert.deepEqual(scaled.carryTable[6].boundary.split(' → '), ['beat-7', 'beat-8']);
  /* 拍 id 自由，不再限制在旧的五拍 id 上 */
  assert.ok(scaled.beats.every(beat => /^beat-\d+$/.test(beat.id)));
  /* 少于下限 / 多于上限都要明确拒绝，而不是默默截断 */
  assert.throws(() => validateAgentAnalysis(scaleAgentAnalysis(analysis, 2), job.jobId), /3–40 拍/);
  assert.throws(() => validateAgentAnalysis(scaleAgentAnalysis(analysis, 41), job.jobId), /3–40 拍/);
  /* 拍 id 重复必须拒绝 */
  const duplicated = scaleAgentAnalysis(analysis, 4, { ids: ['a', 'b', 'c', 'c'] });
  assert.throws(() => validateAgentAnalysis(duplicated, job.jobId), /id 不得重复/);
  /* 拍 id 非法字符必须拒绝（会进 DOM dataset 与 CSS 选择器） */
  const badId = scaleAgentAnalysis(analysis, 3, { ids: ['ok', 'bad id', 'fine'] });
  assert.throws(() => validateAgentAnalysis(badId, job.jobId), /不合法/);
  /* 承接表行数必须跟着实际拍数走 */
  const wrongCarry = scaleAgentAnalysis(analysis, 8);
  wrongCarry.carryTable = wrongCarry.carryTable.slice(0, 4);
  assert.throws(() => validateAgentAnalysis(wrongCarry, job.jobId), /承接表/);
  /* 单拍时长上限放开到 60 秒（长视频的一段语义机制可以跨多句） */
  const longBeat = scaleAgentAnalysis(analysis, 3);
  longBeat.beats[0].duration = 45;
  assert.equal(validateAgentAnalysis(longBeat, job.jobId).beats[0].duration, 45);
  const overLongBeat = scaleAgentAnalysis(analysis, 3);
  overLongBeat.beats[0].duration = 90;
  assert.throws(() => validateAgentAnalysis(overLongBeat, job.jobId), /时长/);

  /* 拍数建议必须来自 SRT 句数，而不是常量 */
  const srtText = Array.from({ length: 7 }, (_, index) =>
    `${index + 1}\n00:00:0${index},000 --> 00:00:0${index + 1},000\n第 ${index + 1} 句\n`
  ).join('\n');
  const longUpload = await uploadAgentAsset(Readable.from([srtText]), 'long.srt');
  const longJob = await createAgentJob({ script: '长视频脚本', attachments: [longUpload] });
  const longDir = path.resolve('studio/agent-jobs', longJob.jobId);
  try {
    const longSchema = JSON.parse(await readFile(path.join(longDir, 'analysis.schema.json'), 'utf8'));
    assert.equal(longSchema.beats.length, 7, '契约模板的拍数建议必须按 SRT 句数推导');
    assert.equal(longSchema.carryTable.length, 6);
    assert.match(longJob.prompt, /拍数由本期语义段落数决定/);
    assert.match(longJob.prompt, /7/);
  } finally {
    await rm(longDir, { recursive: true, force: true });
    await unlink(path.resolve(`.${longUpload.url}`));
  }

  const draft = {
    jobId: job.jobId, analysis: ready.analysis, slots: ready.analysis.assets, beats: ready.analysis.beats,
    script: ready.job.script, confirmations: { storyboard: true, references: false, masters: false, samples: false },
    selections: { B1: { id: 'selected-reference' } }, currentStep: 'elements'
  };
  await saveAgentDraft(job.jobId, draft);
  const restored = await readAgentJob(job.jobId);
  assert.equal(restored.draft.confirmations.storyboard, true);
  assert.equal(restored.draft.selections.B1.id, 'selected-reference');
  assert.equal(restored.draft.currentStep, 'elements');
  const latest = await readLatestAgentJob();
  assert.equal(latest.job.id, job.jobId);
  assert.equal(latest.draft.jobId, job.jobId);
  await assert.rejects(() => saveAgentDraft(job.jobId, { ...draft, jobId: 'motion-00000000-0000-0000-0000-000000000000' }), /不匹配/);

  const upload = await uploadAgentAsset(Readable.from(['1\n00:00:00,000 --> 00:00:01,000\n测试\n']), 'voice.srt');
  try {
    assert.equal(upload.name, 'voice.srt');
    assert.match(upload.url, /^\/studio\/agent-inbox\//);
    const content = await readFile(path.resolve(`.${upload.url}`), 'utf8');
    assert.match(content, /测试/);
  } finally { await unlink(path.resolve(`.${upload.url}`)); }
  console.log('PASS Agent 整包、真实拆解回写、未知品牌素材与附件契约、拍数由语义段落数决定');
} finally {
  await rm(directory, { recursive: true, force: true });
}
