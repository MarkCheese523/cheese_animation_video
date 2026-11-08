import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MANUAL_IDS } from './templates/kit/manual-checks.js';

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
    `请处理 Cheese Motion 风格化母版任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/masters.schema.json，使用 html-animation-video skill 的素材双确认流程。`,
    '输入包中的分镜与参考已经用户明确确认。请由 Agent 对照每项已确认参考真实绘制风格化母版，不得用 CSS 滤镜、原图换色或本地通用图形冒充重绘。',
    '保留各项轮廓、比例、动作和识别特征，按本期风格输出墨色、荧绿强调、深色反白等适用变体；品牌必须保持官方路径、字形与比例，人物不得重建五官，抽象项不得补画具象实物。',
    `将实际 SVG 或 PNG 母版写入 ${dir}/masters/<slotId>/，完成浏览器对照 QA，并将结构化结果写入 ${dir}/masters.json。`,
    '只制作并回写母版，不替用户确认母版，不制作样片或全片。完成后回复“风格化母版已回写”。'
  ].join('\n');
  if (stage === 'samples') return [
    `请处理 Cheese Motion 两段代表样片任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/samples.schema.json，使用 html-animation-video skill，并严格沿用老 skill 的两段代表样片闸门。`,
    '输入包中的分镜、参考和母版已由用户确认。先形成简短 design brief，只制作一段本期视觉开场和一段本期核心机制的真实网页样片；调用已确认资产，不得使用通用 motion-study 或固定演示冒充本期内容。',
    '样片验证单位：一段样片必须覆盖至少两拍连续句，并在其中演出一次跨句演化（同一主体同一 DOM 身份继续运动并改变形态），只做单拍入场动画不算代表样片；每段都要写明 coversBeats 与 carry。',
    '样片必须包含本期旁白、字幕和确定性动效；有 SRT 时逐句对轴，没有 SRT 时不要伪造精确对轴。完成浏览器与关键帧 QA，将可播放网页写入本任务目录，并将结构化结果写入 samples.json。',
    '交付前必须生成语义接触表：node scripts/contact-sheet.mjs <jobId> samples --srt <SRT路径>（每拍一张关键帧 + 动词 + 焦点 + 承接 + 只能人工看的检查项），并把 contactSheet 的 url / rows / manual 写进结果。',
    `只制作两段样片，不生成全片，不替用户确认样片，不导出 MP4。完成后回复“两段样片已回写”。结果契约见 ${dir}/samples.schema.json。`
  ].join('\n');
  return [
    `请处理 Cheese Motion 全片预览任务 ${jobId}。`,
    `读取 ${dir}/job.json 与 ${dir}/film.schema.json，使用 html-animation-video skill。输入包中的两段代表样片已由用户明确确认。`,
    '复用已确认母版、design brief 和两段样片的动效语言，按本期脚本与 SRT 铺开其余场景，完成连续时间轴、字幕、音频、浏览器和关键帧 QA。',
    /* rule: C05 只有明确「定稿导出」才导出 */
    `将完整网页预览写入本任务目录，并将结构化结果写入 ${dir}/film.json。只交付网页，不导出 MP4，不替用户确认最终导出。完成后回复“全片预览已回写”。`,
    `交付前必须生成语义接触表：node scripts/contact-sheet.mjs ${jobId} film --srt <SRT路径>，并把 contactSheet 的 url / rows / manual 写进结果。`
  ].join('\n');
}
/* 制作契约模板 —— 拍数与承接表都按本期实际分镜生成，
   不能再像以前那样把「五拍」写死在模板里（那样长视频根本没法按契约做）。 */
function schema(jobId, stage, beats = []) {
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
  const ids = beats.map(beat => beat.id);
  /* 样片要覆盖连续两拍：开场取前两拍，核心机制取中后段两拍 */
  const openingPair = ids.slice(0, 2);
  const mechanismPair = ids.length >= 4 ? ids.slice(Math.floor(ids.length / 2) - 1, Math.floor(ids.length / 2) + 1) : ids.slice(-2);
  const pair = (covers, sourceId, title, kind) => ({
    id: kind, kind, sourceBeatId: sourceId, coversBeats: covers,
    carry: '这两拍之间同一主体发生了什么跨句演化', title, narration: '本期真实旁白',
    duration: beats.filter(beat => covers.includes(beat.id)).reduce((sum, beat) => sum + Number(beat.duration || 0), 0),
    assetIds: [], previewUrl: `/studio/production-jobs/${jobId}/${kind}/index.html`, qa: '浏览器与关键帧检查结果'
  });
  if (stage === 'samples') return {
    jobId, stage,
    designBrief: { reference: '本期视觉参考与借鉴点', palette: ['#c6ff3d'], typography: '字体角色', assetLanguage: '已确认母版与点阵语言', motionCharacter: '动效性格', keyFrames: ['重点画面 1', '重点画面 2'] },
    samples: [
      pair(openingPair, openingPair[0], '本期视觉开场', 'opening'),
      pair(mechanismPair, mechanismPair[0], '本期核心机制', 'mechanism')
    ],
    contactSheet: { url: `/studio/production-jobs/${jobId}/contact-sheet/contact-sheet.html`, rows: ids.length, manual: ['M1', 'M2'] }
  };
  const duration = beats.reduce((sum, beat) => sum + Number(beat.duration || 0), 0);
  return {
    jobId, stage, title: '本期完整网页预览', duration: duration || 60, sceneCount: ids.length || 1,
    previewUrl: `/studio/production-jobs/${jobId}/film/index.html`, qa: '全片浏览器与关键帧检查结果',
    contactSheet: { url: `/studio/production-jobs/${jobId}/contact-sheet/contact-sheet.html`, rows: ids.length || 1, manual: ['M1', 'M2'] },
    mediaRequests: []
  };
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
  const beats = packet.agentAnalysis?.beats || [];
  const job = { version: 1, id: jobId, stage, createdAt: new Date().toISOString(), status: 'awaiting_agent', package: packet };
  await mkdir(dir, { recursive: true });
  await Promise.all([
    writeFile(path.join(dir, 'job.json'), `${JSON.stringify(job, null, 2)}\n`),
    writeFile(path.join(dir, `${stage}.schema.json`), `${JSON.stringify(schema(jobId, stage, beats), null, 2)}\n`),
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

/* 语义接触表：每拍一张关键帧 + 动词 + 焦点 + 承接。
   机器查渲染，人查语义 —— 这张表是语义验收的入口（scripts/contact-sheet.mjs 生成）。 */
/* rule: E09 语义接触表必须随交付 */
async function assertContactSheet(jobId, input) {
  if (!input) return null;
  const url = text(input.url, '', 400);
  const prefix = `/studio/production-jobs/${jobId}/`;
  if (!url.startsWith(prefix) || !url.endsWith('.html') || url.includes('..')) {
    throw new Error('语义接触表地址必须指向本任务的真实文件');
  }
  let info = null;
  try { info = await stat(path.join(directory(jobId), url.slice(prefix.length))); }
  catch { throw new Error('语义接触表文件不存在或不可读'); }
  if (!info.isFile() || info.size < 40) throw new Error('语义接触表文件不存在或内容为空');
  const rows = Number(input.rows);
  if (!Number.isFinite(rows) || rows < 1) throw new Error('语义接触表必须声明覆盖的拍数');
  const manual = Array.isArray(input.manual) ? input.manual.map(value => text(value, '', 40)).filter(Boolean) : [];
  /* rule: C04 manual 项必须在交付接触表出现 —— 「人工必查」不能只活在文档里 */
  const missing = MANUAL_IDS.filter(id => !manual.includes(id));
  if (missing.length) {
    throw new Error(`语义接触表缺少只能人工看的检查项：${missing.join('、')} —— 「人工必查」必须逐条出现在交付接触表里`);
  }
  return { url, rows, manual };
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
  const beats = job.package.agentAnalysis.beats || [];
  const beatIds = new Set(beats.map(beat => beat.id));
  const samples = [];
  for (const [index, id] of ['opening', 'mechanism'].entries()) {
    const sample = input.samples[index];
    if (sample?.id !== id) throw new Error(`第 ${index + 1} 段必须是 ${id}`);
    const duration = Number(sample.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 120) throw new Error(`${id} 时长无效`);
    if (!beatIds.has(sample.sourceBeatId)) throw new Error(`${id} 未追溯本期分镜`);
    if (!text(sample.narration, '', 1200)) throw new Error(`${id} 缺少本期真实旁白`);
    // 样片验证单位（references/semantic-scenes.md）：代表样片必须覆盖一段完整视觉机制，
    // 也就是至少两拍连续句，且这两拍之间发生了一次跨句演化；只做单拍入场动画不算样片。
    const covers = Array.isArray(sample.coversBeats) ? sample.coversBeats.map(value => text(value, '', 60)).filter(Boolean) : [];
    /* rule: E06 样片必须覆盖连续两拍 */
    if (covers.length < 2) throw new Error(`${id} 必须声明覆盖的连续分镜（coversBeats 至少两拍），单拍入场动画不能验证连续机制`);
    covers.forEach(beatId => { if (!beatIds.has(beatId)) throw new Error(`${id} 声明的拍 ${beatId} 不在本期分镜里`); });
    const covered = beats.filter(beat => covers.includes(beat.id)).map(beat => beat.id);
    const positions = covered.map(beatId => beats.findIndex(beat => beat.id === beatId));
    const consecutive = positions.every((value, index) => index === 0 || value === positions[index - 1] + 1);
    /* rule: E07 样片不得跳拍 */
    if (!consecutive) throw new Error(`${id} 覆盖的拍必须连续（${covered.join(' → ')}），不能跳拍做样片`);
    /* rule: E08 样片必须写清跨句演化 */
    if (!text(sample.carry, '', 800)) throw new Error(`${id} 必须写清这连续两拍之间的跨句演化（carry）`);
    await assertPreview(job.id, id, sample.previewUrl);
    samples.push({
      id, kind: id === 'opening' ? 'visual-opening' : 'core-mechanism', sourceBeatId: sample.sourceBeatId,
      coversBeats: covered, carry: text(sample.carry, '', 800),
      title: text(sample.title, id, 100), narration: text(sample.narration, '', 1200), duration,
      assetIds: cleanAssets(job, sample.assetIds), previewUrl: sample.previewUrl, qa: text(sample.qa, '', 1000)
    });
  }
  const brief = cleanBrief(input.designBrief);
  if (!brief.reference || !brief.assetLanguage || !brief.motionCharacter) throw new Error('design brief 不完整');
  const contactSheet = await assertContactSheet(job.id, input.contactSheet);
  return { version: 1, jobId: job.id, stage: 'samples', designBrief: brief, samples, contactSheet };
}
async function validateFilm(job, input) {
  const duration = Number(input.duration);
  const sceneCount = Number(input.sceneCount);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 7200) throw new Error('全片时长无效');
  if (!Number.isInteger(sceneCount) || sceneCount < 1 || sceneCount > 200) throw new Error('全片场景数量无效');
  await assertPreview(job.id, 'film', input.previewUrl);
  const contactSheet = await assertContactSheet(job.id, input.contactSheet);
  return {
    version: 1, jobId: job.id, stage: 'film', title: text(input.title, '本期完整网页预览', 120), duration, sceneCount,
    previewUrl: input.previewUrl, qa: text(input.qa, '', 1500), contactSheet,
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
