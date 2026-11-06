import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ROOT = path.resolve('studio/agent-jobs');
const UPLOADS = path.resolve('studio/agent-inbox');
const BEAT_IDS = ['gather', 'trigger', 'split', 'switch', 'resolve'];
const ACTIONS = {
  gather: ['component-gather', 'logo-reveal'],
  trigger: ['cursor-click', 'direct-press'],
  split: ['component-flow', 'card-reflow'],
  switch: ['state-reflow', 'status-only'],
  resolve: ['logo-resolve', 'hero-hold']
};
const MODES = new Set(['generic', 'product']);
const STYLES = new Set(['cream-neon', 'dark-narrative', 'cheeseheart-tech']);
const INTENSITIES = new Set(['subtle', 'balanced', 'showreel']);
const FIDELITIES = new Set(['faithful', 'component', 'abstract']);
const VISUAL_KINDS = new Set(['generic', 'company', 'institution', 'fund', 'trust', 'voting', 'chair', 'vote']);
const RESEARCH_ROUTES = new Set(['auto', 'web', 'icon', 'semantic']);
const EXTENSIONS = new Set(['.srt', '.txt', '.md', '.json', '.mp3', '.wav', '.m4a', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.mov', '.webm']);

function text(value, fallback = '', limit = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : fallback;
}
function safeId(value) {
  return typeof value === 'string' && /^motion-[a-f0-9-]{36}$/.test(value) ? value : '';
}
function jobDirectory(jobId) {
  const id = safeId(jobId);
  if (!id) throw new Error('Agent 任务 ID 无效');
  return path.join(ROOT, id);
}
function cleanProfile(profile, mode) {
  if (mode !== 'product') return null;
  if (!profile || typeof profile !== 'object') throw new Error('网页产品模式需要先确认 Product Profile');
  return JSON.parse(JSON.stringify(profile));
}
function cleanAttachments(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 20).map(item => {
    const url = typeof item?.url === 'string' ? item.url : '';
    if (!/^\/studio\/agent-inbox\/[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/.test(url)) throw new Error('附件地址无效，请重新上传');
    return { name: text(item.name, '附件', 160), url, kind: text(item.kind, 'attachment', 30) };
  });
}
function handoffPrompt(jobId) {
  const directory = `studio/agent-jobs/${jobId}`;
  return [
    `请处理 Cheese Motion Agent 任务 ${jobId}。`,
    `读取 ${directory}/job.json 与 ${directory}/analysis.schema.json，使用 html-animation-video skill 对输入整包进行真实语义拆解。`,
    `请生成本期分镜与素材需求（包括脚本和品牌中的 Logo，不要要求用户预先列清单），将结果写入 ${directory}/analysis.json。`,
    '只写结构化结果，不替用户确认分镜、参考或母版；完成后回复“拆解已回写”。'
  ].join('\n');
}

export async function createAgentJob(input = {}) {
  const script = text(input.script, '', 16000);
  const attachments = cleanAttachments(input.attachments);
  if (!attachments.some(item => item.name.toLowerCase().endsWith('.srt') || item.url.toLowerCase().endsWith('.srt'))) {
    throw new Error('请至少上传一份 SRT 字幕；MP3 配音和文字脚本均可选');
  }
  const mode = MODES.has(input.mode) ? input.mode : 'generic';
  const jobId = `motion-${randomUUID()}`;
  const directory = jobDirectory(jobId);
  const job = {
    version: 1, id: jobId, createdAt: new Date().toISOString(), script, mode,
    style: STYLES.has(input.style) ? input.style : 'cream-neon',
    intensity: INTENSITIES.has(input.intensity) ? input.intensity : 'balanced',
    fidelity: FIDELITIES.has(input.fidelity) ? input.fidelity : 'component',
    aspect: ['16:9', '9:16', '1:1'].includes(input.aspect) ? input.aspect : '9:16',
    notes: text(input.notes, '', 4000), profile: cleanProfile(input.profile, mode),
    attachments, status: 'awaiting_agent'
  };
  const schema = {
    jobId,
    summary: '本期叙事与视觉拆解摘要',
    beats: BEAT_IDS.map((id, index) => ({
      id, label: `第 ${index + 1} 拍短标题`, duration: 3,
      action: ACTIONS[id][0], note: '这一拍可见的动作与信息增量', narration: '对应旁白', assetIds: []
    })),
    assets: [{
      id: 'N1', code: 'N1', concept: '由 Agent 从脚本识别的重要名词或真实对象', query: '英文互联网或公开图标检索词',
      action: '可见动作', researchRoute: 'auto', brandOnly: false, semanticOnly: false, visualKind: '', semanticName: '', rights: '', fallback: 'lucide:shapes', brandAssets: []
    }]
  };
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, 'job.json'), `${JSON.stringify(job, null, 2)}\n`, 'utf8'),
    writeFile(path.join(directory, 'analysis.schema.json'), `${JSON.stringify(schema, null, 2)}\n`, 'utf8'),
    writeFile(path.join(directory, 'request.md'), `${handoffPrompt(jobId)}\n`, 'utf8')
  ]);
  return { jobId, status: job.status, prompt: handoffPrompt(jobId), jobUrl: `/studio/agent-jobs/${jobId}/job.json` };
}

function cleanBeat(beat, index) {
  const id = BEAT_IDS[index];
  if (beat?.id !== id) throw new Error(`分镜第 ${index + 1} 拍必须使用 ${id}`);
  const duration = Number(beat.duration);
  if (!Number.isFinite(duration) || duration < 1 || duration > 12) throw new Error(`${id} 时长需在 1–12 秒之间`);
  return {
    id, label: text(beat.label, id, 16), duration,
    action: ACTIONS[id].includes(beat.action) ? beat.action : ACTIONS[id][0],
    note: text(beat.note, '可见动作与信息增量', 300), narration: text(beat.narration, '', 1000),
    assetIds: Array.isArray(beat.assetIds) ? beat.assetIds.slice(0, 18).map(value => text(value, '', 60)).filter(Boolean) : []
  };
}
function cleanAsset(asset, index) {
  const id = text(asset?.id, '', 60);
  if (!/^[A-Z][A-Z0-9-]*$/.test(id)) throw new Error(`素材 ${index + 1} 缺少稳定大写 ID`);
  const brandOnly = asset.brandOnly === true || /^B\d+$/.test(id);
  const semanticOnly = asset.semanticOnly === true;
  const researchRoute = RESEARCH_ROUTES.has(asset.researchRoute) ? asset.researchRoute : 'auto';
  return {
    id, code: text(asset.code, id, 60), concept: text(asset.concept, id, 80),
    query: text(asset.query, '', 160), action: text(asset.action, '出现、响应', 120),
    researchRoute: brandOnly && researchRoute === 'auto' ? 'web' : researchRoute,
    brandOnly, semanticOnly, abstractOnly: asset.abstractOnly === true,
    visualKind: VISUAL_KINDS.has(asset.visualKind) ? asset.visualKind : '',
    semanticName: text(asset.semanticName, '', 160), rights: text(asset.rights, '', 500),
    fallback: /^lucide:[a-z0-9-]+$/.test(asset.fallback) ? asset.fallback : 'lucide:shapes',
    brandAssets: brandOnly && Array.isArray(asset.brandAssets) ? JSON.parse(JSON.stringify(asset.brandAssets.slice(0, 8))) : [],
    source: text(asset.source, 'agent-analysis', 40), usedIn: Array.isArray(asset.usedIn) ? asset.usedIn.slice(0, 20).map(value => text(value, '', 60)).filter(Boolean) : []
  };
}
export function validateAgentAnalysis(input = {}, expectedJobId = '') {
  const jobId = safeId(input.jobId);
  if (!jobId || (expectedJobId && jobId !== expectedJobId)) throw new Error('拆解结果的任务 ID 不匹配');
  if (!Array.isArray(input.beats) || input.beats.length !== 5) throw new Error('当前组件样片需要 Agent 返回五拍分镜');
  const beats = input.beats.map(cleanBeat);
  const assets = Array.isArray(input.assets) ? input.assets.slice(0, 18).map(cleanAsset) : [];
  if (!assets.length) throw new Error('Agent 至少需要返回一项素材需求');
  const ids = new Set(assets.map(asset => asset.id));
  if (ids.size !== assets.length) throw new Error('素材 ID 不得重复');
  beats.forEach(beat => beat.assetIds.forEach(id => { if (!ids.has(id)) throw new Error(`分镜引用了不存在的素材 ${id}`); }));
  return { version: 1, jobId, summary: text(input.summary, '', 2000), beats, assets, analyzedAt: new Date().toISOString() };
}

export async function saveAgentAnalysis(jobId, input) {
  const directory = jobDirectory(jobId);
  await readFile(path.join(directory, 'job.json'), 'utf8');
  const analysis = validateAgentAnalysis(input, jobId);
  await writeFile(path.join(directory, 'analysis.json'), `${JSON.stringify(analysis, null, 2)}\n`, 'utf8');
  return analysis;
}

export async function saveAgentDraft(jobId, input = {}) {
  const directory = jobDirectory(jobId);
  await readFile(path.join(directory, 'job.json'), 'utf8');
  if (input.jobId !== jobId || input.analysis?.jobId !== jobId || !Array.isArray(input.slots) || !Array.isArray(input.beats)) {
    throw new Error('草稿的任务 ID、分镜或素材数据不匹配');
  }
  const draft = { ...input, version: 2, savedAt: new Date().toISOString() };
  await writeFile(path.join(directory, 'draft.json'), `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
  return { jobId, savedAt: draft.savedAt };
}

export async function readAgentJob(jobId) {
  const directory = jobDirectory(jobId);
  const job = JSON.parse(await readFile(path.join(directory, 'job.json'), 'utf8'));
  let analysis = null;
  let draft = null;
  try { analysis = JSON.parse(await readFile(path.join(directory, 'analysis.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { draft = JSON.parse(await readFile(path.join(directory, 'draft.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { job, analysis, draft, status: analysis ? 'analysis_ready' : 'awaiting_agent', prompt: handoffPrompt(jobId) };
}

export async function readLatestAgentJob() {
  const entries = await readdir(ROOT, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const jobs = await Promise.all(entries
    .filter(entry => entry.isDirectory() && safeId(entry.name))
    .map(async entry => {
      try { return await readAgentJob(entry.name); } catch { return null; }
    }));
  return jobs
    .filter(value => value?.analysis)
    .sort((a, b) => Date.parse(b.draft?.savedAt || b.job.createdAt) - Date.parse(a.draft?.savedAt || a.job.createdAt))[0] || null;
}

export async function uploadAgentAsset(req, filename) {
  const extension = path.extname(filename || '').toLowerCase();
  if (!EXTENSIONS.has(extension)) throw new Error('不支持此附件格式');
  const basename = path.basename(filename || `附件${extension}`).replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
  const storedName = `${randomUUID()}-${basename}`;
  await mkdir(UPLOADS, { recursive: true });
  const target = path.join(UPLOADS, storedName);
  let size = 0;
  const limit = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      if (size > 100 * 1024 * 1024) callback(new Error('单个附件不得超过 100 MB'));
      else callback(null, chunk);
    }
  });
  try { await pipeline(req, limit, createWriteStream(target, { flags: 'wx' })); }
  catch (error) { await unlink(target).catch(() => {}); throw error; }
  return { name: path.basename(filename || basename).slice(0, 160), url: `/studio/agent-inbox/${storedName}`, size };
}
