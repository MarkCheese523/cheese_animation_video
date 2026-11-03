import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('studio/production-jobs');
const STAGES = new Set(['masters', 'samples', 'film']);

function text(value, fallback = '', limit = 300) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : fallback;
}
function safeId(value) {
  return typeof value === 'string' && /^motion-[a-f0-9-]{36}$/.test(value) ? value : '';
}
function directory(jobId) {
  const id = safeId(jobId);
  if (!id) throw new Error('制作任务 ID 无效');
  return path.join(ROOT, id);
}
function prompt(jobId, stage) {
  const dir = `studio/production-jobs/${jobId}`;
  if (stage === 'masters') return [
    `请处理 Motion Layer 风格化母版任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/masters.schema.json，使用 html-animation-video skill 的素材双确认流程。`,
    '输入包中的分镜与参考已经用户明确确认。请由 Agent 对照每项已确认参考真实绘制风格化母版，不得用 CSS 滤镜、原图换色或本地通用图形冒充重绘。',
    '保留各项轮廓、比例、动作和识别特征，按本期风格输出墨色、荧绿强调、深色反白等适用变体；品牌必须保持官方路径、字形与比例，人物不得重建五官，抽象项不得补画具象实物。',
    `将实际 SVG 或 PNG 母版写入 ${dir}/masters/<slotId>/，完成浏览器对照 QA，并将结构化结果写入 ${dir}/masters.json。`,
    '只制作并回写母版，不替用户确认母版，不制作样片或全片。完成后回复“风格化母版已回写”。'
  ].join('\n');
  if (stage === 'samples') return [
    `请处理 Motion Layer 两段代表样片任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/samples.schema.json，使用 html-animation-video skill，并严格沿用老 skill 的两段代表样片闸门。`,
    '输入包中的分镜、参考和母版已由用户确认。先形成简短 design brief，只制作一段本期视觉开场和一段本期核心机制的真实网页样片；调用已确认资产，不得使用通用 motion-study 或固定演示冒充本期内容。',
    '样片必须包含本期旁白、字幕和确定性动效；有 SRT 时逐句对轴，没有 SRT 时不要伪造精确对轴。完成浏览器与关键帧 QA，将可播放网页写入本任务目录，并将结构化结果写入 samples.json。',
    `只制作两段样片，不生成全片，不替用户确认样片，不导出 MP4。完成后回复“两段样片已回写”。结果契约见 ${dir}/samples.schema.json。`
  ].join('\n');
  return [
    `请处理 Motion Layer 全片预览任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/film.schema.json，使用 html-animation-video skill。输入包中的两段代表样片已由用户明确确认。`,
    '复用已确认母版、design brief 和两段样片的动效语言，按本期脚本与 SRT 铺开其余场景，完成连续时间轴、字幕、音频、浏览器和关键帧 QA。',
    `将完整网页预览写入本任务目录，并将结构化结果写入 ${dir}/film.json。只交付网页，不导出 MP4，不替用户确认最终导出。完成后回复“全片预览已回写”。`
  ].join('\n');
}
function schema(jobId, stage) {
  if (stage === 'masters') return {
    jobId, stage,
    masters: [{
      slotId: 'N1', sourceId: '与已确认参考 id 完全一致', retainedFeatures: '轮廓、比例、动作与识别特征',
      variants: [
        { id: 'ink', label: '墨色描边', previewUrl: `/studio/production-jobs/${jobId}/masters/N1/ink.svg` },
        { id: 'accent', label: '荧绿强调', previewUrl: `/studio/production-jobs/${jobId}/masters/N1/accent.svg` },
        { id: 'reverse', label: '深色反白', previewUrl: `/studio/production-jobs/${jobId}/masters/N1/reverse.svg` }
      ],
      qa: '原图与母版浏览器对照检查结果'
    }]
  };
  if (stage === 'samples') return {
    jobId, stage,
    designBrief: { reference: '本期视觉参考与借鉴点', palette: ['#c6ff3d'], typography: '字体角色', assetLanguage: '已确认母版与点阵语言', motionCharacter: '动效性格', keyFrames: ['重点画面 1', '重点画面 2'] },
    samples: [
      { id: 'opening', kind: 'visual-opening', sourceBeatId: 'gather', title: '本期视觉开场', narration: '本期真实旁白', duration: 10, assetIds: [], previewUrl: `/studio/production-jobs/${jobId}/opening/index.html`, qa: '浏览器与关键帧检查结果' },
      { id: 'mechanism', kind: 'core-mechanism', sourceBeatId: 'switch', title: '本期核心机制', narration: '本期真实旁白', duration: 10, assetIds: [], previewUrl: `/studio/production-jobs/${jobId}/mechanism/index.html`, qa: '浏览器与关键帧检查结果' }
    ]
  };
  return { jobId, stage, title: '本期完整网页预览', duration: 60, sceneCount: 5, previewUrl: `/studio/production-jobs/${jobId}/film/index.html`, qa: '全片浏览器与关键帧检查结果', mediaRequests: [] };
}

export async function createProductionJob(input = {}) {
  const stage = STAGES.has(input.stage) ? input.stage : '';
  if (!stage) throw new Error('制作阶段必须是 masters、samples 或 film');
  const packet = input.package && typeof input.package === 'object' ? JSON.parse(JSON.stringify(input.package)) : null;
  if (!packet?.agentAnalysis || !safeId(packet.agentJobId) || packet.agentAnalysis.jobId !== packet.agentJobId) throw new Error('缺少本期 Agent 拆解与追溯信息');
  const confirmations = packet.confirmations || {};
  if (!confirmations.storyboard || !confirmations.references) throw new Error('分镜与参考确认后才能制作风格化母版');
  if (stage === 'masters' && (!packet.elements?.length || packet.elements.some(element => !element.selected?.referenceApproved))) throw new Error('每项已确认参考都需要写入母版制作整包');
  if (stage !== 'masters' && !confirmations.masters) throw new Error('母版确认后才能制作代表样片或全片');
  if (stage === 'film' && (!confirmations.samples || !packet.sampleResult?.samples || packet.sampleResult.samples.length !== 2)) throw new Error('两段代表样片确认后才能生成全片');
  const jobId = `motion-${randomUUID()}`;
  const dir = directory(jobId);
  const job = { version: 1, id: jobId, stage, createdAt: new Date().toISOString(), status: 'awaiting_agent', package: packet };
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dir, 'job.json'), `${JSON.stringify(job, null, 2)}\n`),
    writeFile(path.join(dir, `${stage}.schema.json`), `${JSON.stringify(schema(jobId, stage), null, 2)}\n`),
    writeFile(path.join(dir, 'request.md'), `${prompt(jobId, stage)}\n`)
  ]);
  return { jobId, stage, status: job.status, prompt: prompt(jobId, stage) };
}

async function assertPreview(jobId, id, previewUrl) {
  const expected = `/studio/production-jobs/${jobId}/${id}/index.html`;
  if (previewUrl !== expected) throw new Error(`${id} 预览地址必须指向本任务的真实网页`);
  const target = path.join(directory(jobId), id, 'index.html');
  const info = await stat(target);
  if (!info.isFile() || info.size < 40) throw new Error(`${id} 真实网页样片不存在或内容为空`);
}
function cleanAssets(job, input) {
  const known = new Set((job.package.agentAnalysis.assets || []).map(asset => asset.id));
  return Array.isArray(input) ? input.slice(0, 18).map(value => text(value, '', 60)).filter(id => known.has(id)) : [];
}
function cleanBrief(input = {}) {
  return {
    reference: text(input.reference, '', 1000), palette: Array.isArray(input.palette) ? input.palette.slice(0, 8).map(value => text(value, '', 30)).filter(Boolean) : [],
    typography: text(input.typography, '', 500), assetLanguage: text(input.assetLanguage, '', 800),
    motionCharacter: text(input.motionCharacter, '', 500),
    keyFrames: Array.isArray(input.keyFrames) ? input.keyFrames.slice(0, 3).map(value => text(value, '', 300)).filter(Boolean) : []
  };
}
async function validateMasters(job, input) {
  const elements = Array.isArray(job.package.elements) ? job.package.elements : [];
  if (!Array.isArray(input.masters) || input.masters.length !== elements.length) throw new Error('必须为每项已确认参考回写一个 Agent 风格化母版');
  const masters = [];
  for (const element of elements) {
    const master = input.masters.find(item => item?.slotId === element.slotId);
    if (!master || master.sourceId !== element.selected?.id) throw new Error(`${element.slotId} 母版未对应已确认参考`);
    if (!/^[A-Za-z0-9_-]+$/.test(element.slotId) || !Array.isArray(master.variants) || !master.variants.length || master.variants.length > 6) throw new Error(`${element.slotId} 母版变体无效`);
    const variants = [];
    for (const variant of master.variants) {
      const id = text(variant.id, '', 40);
      const previewUrl = text(variant.previewUrl, '', 500);
      const prefix = `/studio/production-jobs/${job.id}/masters/${element.slotId}/`;
      if (!/^[a-z0-9-]+$/.test(id) || !previewUrl.startsWith(prefix) || !/^[A-Za-z0-9/_-]+\.(?:svg|png|webp)$/i.test(previewUrl.slice(prefix.length)) || previewUrl.includes('..')) throw new Error(`${element.slotId} 母版地址必须指向本任务的真实文件`);
      const info = await stat(path.join(directory(job.id), 'masters', element.slotId, previewUrl.slice(prefix.length)));
      if (!info.isFile() || info.size < 40) throw new Error(`${element.slotId} 母版文件不存在或内容为空`);
      variants.push({ id, label: text(variant.label, id, 60), previewUrl });
    }
    masters.push({ slotId: element.slotId, sourceId: master.sourceId, retainedFeatures: text(master.retainedFeatures, '', 800), variants, qa: text(master.qa, '', 1000) });
  }
  return { version: 1, jobId: job.id, stage: 'masters', masters };
}
async function validateSamples(job, input) {
  if (!Array.isArray(input.samples) || input.samples.length !== 2) throw new Error('必须恰好回写视觉开场与核心机制两段样片');
  const beatIds = new Set((job.package.agentAnalysis.beats || []).map(beat => beat.id));
  const samples = [];
  for (const [index, id] of ['opening', 'mechanism'].entries()) {
    const sample = input.samples[index];
    if (sample?.id !== id) throw new Error(`第 ${index + 1} 段必须是 ${id}`);
    const duration = Number(sample.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 120) throw new Error(`${id} 时长无效`);
    if (!beatIds.has(sample.sourceBeatId)) throw new Error(`${id} 未追溯本期分镜`);
    if (!text(sample.narration, '', 1200)) throw new Error(`${id} 缺少本期真实旁白`);
    await assertPreview(job.id, id, sample.previewUrl);
    samples.push({
      id, kind: id === 'opening' ? 'visual-opening' : 'core-mechanism', sourceBeatId: sample.sourceBeatId,
      title: text(sample.title, id, 100), narration: text(sample.narration, '', 1200), duration,
      assetIds: cleanAssets(job, sample.assetIds), previewUrl: sample.previewUrl, qa: text(sample.qa, '', 1000)
    });
  }
  const brief = cleanBrief(input.designBrief);
  if (!brief.reference || !brief.assetLanguage || !brief.motionCharacter) throw new Error('design brief 不完整');
  return { version: 1, jobId: job.id, stage: 'samples', designBrief: brief, samples };
}
async function validateFilm(job, input) {
  const duration = Number(input.duration);
  const sceneCount = Number(input.sceneCount);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 7200) throw new Error('全片时长无效');
  if (!Number.isInteger(sceneCount) || sceneCount < 1 || sceneCount > 200) throw new Error('全片场景数量无效');
  await assertPreview(job.id, 'film', input.previewUrl);
  return {
    version: 1, jobId: job.id, stage: 'film', title: text(input.title, '本期完整网页预览', 120), duration, sceneCount,
    previewUrl: input.previewUrl, qa: text(input.qa, '', 1500),
    mediaRequests: Array.isArray(input.mediaRequests) ? input.mediaRequests.slice(0, 30).map(value => text(value, '', 500)).filter(Boolean) : []
  };
}
export async function saveProductionResult(jobId, input = {}) {
  const job = JSON.parse(await readFile(path.join(directory(jobId), 'job.json'), 'utf8'));
  if (input.jobId !== jobId || input.stage !== job.stage) throw new Error('制作结果的任务或阶段不匹配');
  const result = job.stage === 'masters' ? await validateMasters(job, input) : job.stage === 'samples' ? await validateSamples(job, input) : await validateFilm(job, input);
  await writeFile(path.join(directory(jobId), `${job.stage}.json`), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
export async function readProductionJob(jobId) {
  const job = JSON.parse(await readFile(path.join(directory(jobId), 'job.json'), 'utf8'));
  let result = null;
  try { result = JSON.parse(await readFile(path.join(directory(jobId), `${job.stage}.json`), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { job: { ...job, status: result ? 'result_ready' : 'awaiting_agent' }, result, status: result ? 'result_ready' : 'awaiting_agent', prompt: prompt(jobId, job.stage) };
}
