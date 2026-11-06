import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readFile, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createAgentJob, readAgentJob, readLatestAgentJob, saveAgentAnalysis, saveAgentDraft, uploadAgentAsset, validateAgentAnalysis } from '../agent-flow.mjs';
import { makeAgentAnalysis } from './fixtures/agent-analysis.mjs';

const job = await createAgentJob({ script: 'AsterQuark 将凭证拆分并同步。', mode: 'generic', style: 'cream-neon', aspect: '9:16' });
const directory = path.resolve('studio/agent-jobs', job.jobId);
try {
  assert.match(job.jobId, /^motion-[a-f0-9-]{36}$/);
  assert.match(job.prompt, /真实语义拆解/);
  assert.match(job.prompt, /不要要求用户预先列清单/);
  const pending = await readAgentJob(job.jobId);
  assert.equal(pending.status, 'awaiting_agent');
  assert.equal(pending.analysis, null);
  assert.equal(pending.job.script.includes('AsterQuark'), true);

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
  console.log('PASS Agent 整包、真实拆解回写、未知品牌素材与附件契约');
} finally {
  await rm(directory, { recursive: true, force: true });
}
