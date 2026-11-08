import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseSrt } from './templates/kit/contactsheet.js';
import { SEM_TAGS } from './templates/kit/master.js';
/* 表A–F 的校验抽到共享纯函数：设计台路径（本文件）与对话路径
   （scripts/check-storyboard.mjs）调用同一份，不会再漂移。 */
import {
  VISUAL_VERBS, BEAT_COUNT, BEAT_ACTION_PREFERENCE, GENERIC_ACTIONS,
  cleanBeat, cleanDesignCard, cleanCarryTable
} from './templates/kit/storyboard-contract.js';

const ROOT = path.resolve('studio/agent-jobs');
const UPLOADS = path.resolve('studio/agent-inbox');

/* 拍数不是模板常量 —— 它由本期语义段落数决定。
   之前的实现把「五拍」写死（BEAT_IDS + length !== 5），
   结果这一期的偶然结果被当成了通用模板：视频一长，拆解根本写不进去。
   现在只保留两条边界：下限（拍太少撑不起一段完整机制）与上限（太多就没法做承接连续）。 */
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
function handoffPrompt(jobId, plan = {}) {
  const directory = `studio/agent-jobs/${jobId}`;
  const suggested = plan.suggested || BEAT_COUNT.min;
  return [
    `请处理 Cheese Motion Agent 任务 ${jobId}。`,
    `读取 ${directory}/job.json 与 ${directory}/analysis.schema.json，使用 html-animation-video skill 对输入整包进行真实语义拆解。`,
    `请生成本期分镜与素材需求（包括脚本和品牌中的 Logo，不要要求用户预先列清单），将结果写入 ${directory}/analysis.json。`,
    /* rule: E28 拍数由语义段落数决定 */
    `分镜拍数由本期语义段落数决定，不是固定值：本期字幕共 ${plan.sentences || '—'} 句，建议不超过 ${suggested} 拍（一个视觉机制可以跨多句，所以实际可能更少），允许范围 ${BEAT_COUNT.min}–${BEAT_COUNT.max} 拍。不要套用固定拍数。`,
    '只写结构化结果，不替用户确认分镜、参考或母版；完成后回复“拆解已回写”。'
  ].join('\n');
}

/* 拍数建议：句数是上界 —— 一拍至少要承载一句旁白，一个段落也可以跨多句。 */
function suggestedBeatCount(sentences) {
  if (!Number.isFinite(sentences) || sentences <= 0) return BEAT_COUNT.min;
  return Math.min(BEAT_COUNT.max, Math.max(BEAT_COUNT.min, sentences));
}

/* 从已上传的 SRT 里数句子 —— 拍数建议的唯一依据。 */
async function srtSentenceCount(attachments) {
  const srt = attachments.find(item => /\.srt$/i.test(item.name || '') || /\.srt$/i.test(item.url || ''));
  if (!srt) return 0;
  try {
    const raw = await readFile(path.join(UPLOADS, path.basename(srt.url)), 'utf8');
    return parseSrt(raw).length;
  } catch {
    return 0;
  }
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
  /* 拍数建议来自 SRT 句数，不是常量 */
  const sentences = await srtSentenceCount(attachments);
  const suggested = suggestedBeatCount(sentences);
  const beatPlan = { sentences, suggested, min: BEAT_COUNT.min, max: BEAT_COUNT.max };
  const job = {
    version: 1, id: jobId, createdAt: new Date().toISOString(), script, mode,
    style: STYLES.has(input.style) ? input.style : 'cream-neon',
    intensity: INTENSITIES.has(input.intensity) ? input.intensity : 'balanced',
    fidelity: FIDELITIES.has(input.fidelity) ? input.fidelity : 'component',
    aspect: ['16:9', '9:16', '1:1'].includes(input.aspect) ? input.aspect : '9:16',
    notes: text(input.notes, '', 4000), profile: cleanProfile(input.profile, mode),
    attachments, beatPlan, status: 'awaiting_agent'
  };
  const beatIds = Array.from({ length: suggested }, (_, index) => `beat-${index + 1}`);
  const schema = {
    jobId,
    summary: '本期叙事与视觉拆解摘要',
    designCard: {
      motherStructure: '视觉母结构：观众持续追踪的主体关系是什么',
      morphTrack: '形态轨迹：从什么形态变成什么形态，每次变形表达什么',
      span: '持续时段：这个机制覆盖哪些句子、从何时到何时',
      carry: '跨句承接：相邻句之间同一对象怎样继续运动',
      stillFrame: '静止帧语义：任取一帧，关掉字幕还能看出什么关系'
    },
    /* 拍数建议已经按句数算好，但这是建议不是规定：
       实际拍数由语义段落数决定，可以比建议值少（一个机制跨多句），范围 3–40 拍。 */
    beats: beatIds.map((id, index) => ({
      id, label: `第 ${index + 1} 拍短标题`, duration: 3,
      action: GENERIC_ACTIONS[index % GENERIC_ACTIONS.length], note: '这一拍可见的动作与信息增量', narration: '对应旁白', assetIds: [],
      focus: '本拍唯一焦点（主语），观众此刻只看这里',
      verb: '出现',
      relation: '观众应看懂的关系',
      soundCue: '声音 cue',
      carry: '本拍如何承接上一拍的同一主体（同一 DOM 身份继续运动）'
    })),
    carryTable: beatIds.slice(1).map((id, index) => ({
      boundary: `${beatIds[index]} → ${id}`,
      survivor: '上一拍活下来的对象',
      how: '怎么变（表E 决策树路径：morphRect / emit / gather / hop）',
      becomes: '下一拍它是什么'
    })),
    assets: [{
      id: 'N1', code: 'N1', concept: '由 Agent 从脚本识别的重要名词或真实对象', query: '英文互联网或公开图标检索词',
      action: '可见动作', sem: '', researchRoute: 'auto', brandOnly: false, semanticOnly: false, visualKind: '', semanticName: '', rights: '', fallback: 'lucide:shapes', brandAssets: []
    }],
    /* 素材语义词表：sem 必须从这张表里选，它就是本期母版语义字典的来源 */
    _semanticTags: [...SEM_TAGS]
  };
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, 'job.json'), `${JSON.stringify(job, null, 2)}\n`, 'utf8'),
    writeFile(path.join(directory, 'analysis.schema.json'), `${JSON.stringify(schema, null, 2)}\n`, 'utf8'),
    writeFile(path.join(directory, 'request.md'), `${handoffPrompt(jobId, beatPlan)}\n`, 'utf8')
  ]);
  return { jobId, status: job.status, prompt: handoffPrompt(jobId, beatPlan), jobUrl: `/studio/agent-jobs/${jobId}/job.json` };
}

function cleanAsset(asset, index) {
  const id = text(asset?.id, '', 60);
  if (!/^[A-Z][A-Z0-9-]*$/.test(id)) throw new Error(`素材 ${index + 1} 缺少稳定大写 ID`);
  const brandOnly = asset.brandOnly === true || /^B\d+$/.test(id);
  const semanticOnly = asset.semanticOnly === true;
  const researchRoute = RESEARCH_ROUTES.has(asset.researchRoute) ? asset.researchRoute : 'auto';
  /* 素材声明「它到底是什么图形」—— 这份声明是本期母版语义字典的来源，
     检索期、绘制期、校验期都按它走（同一张字典，跨期不共享）。 */
  const sem = text(asset?.sem, '', 40);
  if (sem && !SEM_TAGS.has(sem)) throw new Error(`素材 ${id} 声明的语义「${sem}」不在语义词表内，只能用：${[...SEM_TAGS].join('、')}`);
  return {
    id, code: text(asset.code, id, 60), concept: text(asset.concept, id, 80),
    query: text(asset.query, '', 160), action: text(asset.action, '出现、响应', 120),
    sem, researchRoute: brandOnly && researchRoute === 'auto' ? 'web' : researchRoute,
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
  /* rule: E28 拍数由语义段落数决定，不是固定值 */
  if (!Array.isArray(input.beats) || input.beats.length < BEAT_COUNT.min || input.beats.length > BEAT_COUNT.max) {
    throw new Error(`本期分镜必须落在 ${BEAT_COUNT.min}–${BEAT_COUNT.max} 拍之间（拍数由语义段落数决定，不是固定值）`);
  }
  const designCard = cleanDesignCard(input.designCard);
  const beats = input.beats.map(cleanBeat);
  const beatIds = beats.map(beat => beat.id);
  if (new Set(beatIds).size !== beatIds.length) throw new Error('分镜 id 不得重复');
  const carryTable = cleanCarryTable(input.carryTable, beatIds);
  const assets = Array.isArray(input.assets) ? input.assets.slice(0, 18).map(cleanAsset) : [];
  if (!assets.length) throw new Error('Agent 至少需要返回一项素材需求');
  const ids = new Set(assets.map(asset => asset.id));
  if (ids.size !== assets.length) throw new Error('素材 ID 不得重复');
  beats.forEach(beat => beat.assetIds.forEach(id => { if (!ids.has(id)) throw new Error(`分镜引用了不存在的素材 ${id}`); }));
  return { version: 2, jobId, summary: text(input.summary, '', 2000), designCard, beats, carryTable, assets, analyzedAt: new Date().toISOString() };
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
  return { job, analysis, draft, status: analysis ? 'analysis_ready' : 'awaiting_agent', prompt: handoffPrompt(jobId, job.beatPlan || {}) };
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
