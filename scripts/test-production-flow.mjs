/* rule: E06 */
/* rule: E07 */
/* rule: E08 */
/* rule: E09 */
/* rule: C05 */
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createProductionJob, readProductionJob, saveProductionResult } from '../production-flow.mjs';
import { makeAgentAnalysis } from './fixtures/agent-analysis.mjs';

const agentJobId = 'motion-11111111-1111-4111-8111-111111111111';
const packet = {
  agentJobId, agentAnalysis: makeAgentAnalysis(agentJobId),
  confirmations: { storyboard: true, references: true, masters: true }
};
const masterCreated = await createProductionJob({
  stage: 'masters',
  package: {
    ...packet,
    confirmations: { storyboard: true, references: true, masters: false },
    elements: [{ slotId: 'N1', concept: '凭证', selected: { id: 'reference-N1', referenceApproved: true } }]
  }
});
const masterDir = path.resolve('studio/production-jobs', masterCreated.jobId);
try {
  assert.match(masterCreated.prompt, /Agent 对照每项已确认参考真实绘制/);
  assert.match(masterCreated.prompt, /不得用 CSS 滤镜/);
  await mkdir(path.join(masterDir, 'masters', 'N1'), { recursive: true });
  for (const id of ['ink', 'accent', 'reverse']) await writeFile(path.join(masterDir, 'masters', 'N1', `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M4 4h32v32H4z" fill="${id === 'accent' ? '#c6ff3d' : '#102a22'}"/></svg>`);
  const masterResult = await saveProductionResult(masterCreated.jobId, {
    jobId: masterCreated.jobId, stage: 'masters',
    masters: [{ slotId: 'N1', sourceId: 'reference-N1', retainedFeatures: '凭证外轮廓与确权标记', variants: ['ink', 'accent', 'reverse'].map(id => ({ id, label: id, previewUrl: `/studio/production-jobs/${masterCreated.jobId}/masters/N1/${id}.svg` })), qa: 'PASS' }]
  });
  assert.equal(masterResult.masters[0].variants.length, 3);
  assert.equal(masterResult.masters[0].approved, undefined);
  await assert.rejects(saveProductionResult(masterCreated.jobId, { ...masterResult, masters: [{ ...masterResult.masters[0], sourceId: 'wrong-reference' }] }), /未对应已确认参考/);
} finally { await rm(masterDir, { recursive: true, force: true }); }

const created = await createProductionJob({ stage: 'samples', package: packet });
const dir = path.resolve('studio/production-jobs', created.jobId);
try {
  assert.match(created.prompt, /两段代表样片/);
  assert.match(created.prompt, /不得使用通用 motion-study/);
  assert.equal((await readProductionJob(created.jobId)).status, 'awaiting_agent');
  for (const id of ['opening', 'mechanism']) {
    await mkdir(path.join(dir, id), { recursive: true });
    await writeFile(path.join(dir, id, 'index.html'), `<!doctype html><title>${id}</title><h1>真实本期样片</h1>`);
  }
  const result = await saveProductionResult(created.jobId, {
    jobId: created.jobId, stage: 'samples',
    designBrief: { reference: '本期开场与权利控制', palette: ['#c6ff3d'], typography: '数字粗体', assetLanguage: '已确认点阵母版', motionCharacter: '快脆', keyFrames: ['50 元', '50.1%'] },
    samples: [
      { id: 'opening', sourceBeatId: 'gather', coversBeats: ['gather', 'trigger'], carry: '凭证本体被按压裂成两块，DOM 身份不变', title: '本期开场', narration: '本期真实开场旁白', duration: 8, assetIds: ['G0'], previewUrl: `/studio/production-jobs/${created.jobId}/opening/index.html`, qa: 'PASS' },
      { id: 'mechanism', sourceBeatId: 'switch', coversBeats: ['switch', 'resolve'], carry: '失效凭证块重新被接住并归位到品牌标识旁', title: '本期机制', narration: '本期真实机制旁白', duration: 9, assetIds: ['N1'], previewUrl: `/studio/production-jobs/${created.jobId}/mechanism/index.html`, qa: 'PASS' }
    ]
  });
  assert.equal(result.samples.length, 2);
  assert.deepEqual(result.samples[0].coversBeats, ['gather', 'trigger']);

  // 语义接触表：每拍一张关键帧 + 动词 + 焦点 + 承接（机器查渲染，人查语义的入口）
  await mkdir(path.join(dir, 'contact-sheet'), { recursive: true });
  await writeFile(path.join(dir, 'contact-sheet', 'contact-sheet.html'), '<!doctype html><title>接触表</title><h1>语义接触表</h1>');
  const withSheet = await saveProductionResult(created.jobId, {
    ...result,
    contactSheet: { url: `/studio/production-jobs/${created.jobId}/contact-sheet/contact-sheet.html`, rows: 5, manual: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'] }
  });
  assert.equal(withSheet.contactSheet.rows, 5, '接触表必须记录覆盖的拍数');
  assert.equal(withSheet.contactSheet.manual.length, 7, '接触表必须记录全部只能人工看的检查项');
  // 「人工必查」不能只活在文档里：缺项必须被拦下
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, contactSheet: { url: `/studio/production-jobs/${created.jobId}/contact-sheet/contact-sheet.html`, rows: 5, manual: ['M1'] }
  }), /缺少只能人工看的检查项/);
  // 接触表地址必须指向本任务的真实文件
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, contactSheet: { url: '/studio/production-jobs/other/contact-sheet/contact-sheet.html', rows: 5, manual: ['M1','M2','M3','M4','M5','M6','M7'] }
  }), /本任务的真实文件/);
  // 接触表文件必须真实存在
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, contactSheet: { url: `/studio/production-jobs/${created.jobId}/contact-sheet/missing.html`, rows: 5, manual: ['M1','M2','M3','M4','M5','M6','M7'] }
  }), /不存在/);
  // 拍数无效必须被拦下
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, contactSheet: { url: `/studio/production-jobs/${created.jobId}/contact-sheet/contact-sheet.html`, rows: 0, manual: ['M1','M2','M3','M4','M5','M6','M7'] }
  }), /拍数/);
  // 样片验证单位：只做单拍入场动画不算代表样片
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, samples: [{ ...result.samples[0], coversBeats: ['gather'] }, result.samples[1]]
  }), /至少两拍/);
  // 不能跳拍做样片
  await assert.rejects(saveProductionResult(created.jobId, {
    ...result, samples: [{ ...result.samples[0], coversBeats: ['gather', 'resolve'] }, result.samples[1]]
  }), /必须连续/);
  assert.equal((await readProductionJob(created.jobId)).status, 'result_ready');
  await assert.rejects(saveProductionResult(created.jobId, { ...result, samples: [{ ...result.samples[0], previewUrl: '/assets/template/player.html' }, result.samples[1]] }), /真实网页/);

  const film = await createProductionJob({ stage: 'film', package: { ...packet, confirmations: { ...packet.confirmations, samples: true }, sampleResult: result } });
  const filmDir = path.resolve('studio/production-jobs', film.jobId);
  try {
    await mkdir(path.join(filmDir, 'film'), { recursive: true });
    await writeFile(path.join(filmDir, 'film', 'index.html'), '<!doctype html><title>全片</title><h1>本期全片预览</h1>');
    const full = await saveProductionResult(film.jobId, { jobId: film.jobId, stage: 'film', title: '本期全片', duration: 58, sceneCount: 5, previewUrl: `/studio/production-jobs/${film.jobId}/film/index.html`, qa: 'PASS', mediaRequests: [] });
    assert.equal(full.sceneCount, 5);
  } finally { await rm(filmDir, { recursive: true, force: true }); }
  await assert.rejects(createProductionJob({ stage: 'film', package: packet }), /两段代表样片确认/);
  console.log('PASS 两段代表样片、真实网页回写、全片确认闸门与任务追溯');
} finally { await rm(dir, { recursive: true, force: true }); }
