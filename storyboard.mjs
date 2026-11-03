import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT = path.resolve('studio/generated');
const MODES = new Set(['generic', 'product']);
const STYLES = new Set(['cream-neon', 'dark-narrative']);
const INTENSITIES = new Set(['subtle', 'balanced', 'showreel']);
const FIDELITIES = new Set(['faithful', 'component', 'abstract']);
const DEFAULT_TOKENS = { accent: '#c6ff3d', background: '#f4f0e6', ink: '#102a22', radius: '16px', fontFamily: '系统无衬线' };
const BEATS = [
  { id: 'gather', label: '聚合', duration: 3, action: 'component-gather', transition: 'logo-to-window' },
  { id: 'trigger', label: '点击', duration: 4, action: 'cursor-click', transition: 'button-to-panel' },
  { id: 'split', label: '拆分', duration: 5, action: 'component-flow', transition: 'component-flow' },
  { id: 'switch', label: '切换', duration: 4.75, action: 'state-reflow', transition: 'state-reflow' },
  { id: 'resolve', label: '归位', duration: 3.25, action: 'logo-resolve', transition: 'logo-resolve' }
];
const ACTIONS = {
  gather: ['component-gather', 'logo-reveal'], trigger: ['cursor-click', 'direct-press'],
  split: ['component-flow', 'card-reflow'], switch: ['state-reflow', 'status-only'],
  resolve: ['logo-resolve', 'hero-hold']
};
function cleanBeats(input) {
  let start = 0;
  return BEATS.map((fallback, index) => {
    const source = Array.isArray(input) && input[index]?.id === fallback.id ? input[index] : fallback;
    const duration = Number(source.duration);
    if (!Number.isFinite(duration) || duration < 1 || duration > 12) throw new Error(`${fallback.label}时长需在 1–12 秒之间`);
    const beat = { ...fallback, label: text(source.label, fallback.label, 16), duration, start, action: ACTIONS[fallback.id].includes(source.action) ? source.action : fallback.action };
    start = Math.round((start + duration) * 100) / 100;
    return beat;
  });
}

function color(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
function text(value, fallback = '', limit = 120) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : fallback;
}
function safeAgentJobId(value) {
  return typeof value === 'string' && /^motion-[a-f0-9-]{36}$/.test(value) ? value : '';
}
function assetUrl(value, extension) {
  if (typeof value !== 'string') return '';
  const remote = new RegExp(`^https://[^\\s]+\\.${extension}(?:\\?[^\\s]*)?$`, 'i');
  const local = new RegExp(`^/(?:assets|studio/demo)/[a-zA-Z0-9/_-]+\\.${extension}$`, 'i');
  return (remote.test(value) || local.test(value)) && !value.includes('..') ? value : '';
}
function cleanCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') return null;
  const svg = assetUrl(candidate.svg, 'svg');
  const image = assetUrl(candidate.image, '(?:png|webp|jpe?g)');
  const masterPreview = typeof candidate.master?.previewUrl === 'string' && /^\/studio\/production-jobs\/motion-[a-f0-9-]{36}\/masters\/[A-Za-z0-9/_-]+\.(?:svg|png|webp)$/i.test(candidate.master.previewUrl) && !candidate.master.previewUrl.includes('..') ? candidate.master.previewUrl : '';
  const master = candidate.master && typeof candidate.master === 'object' ? {
    sourceId: text(candidate.master.sourceId, '', 160),
    variant: text(candidate.master.variant, 'ink', 40), previewUrl: masterPreview,
    agentJobId: safeAgentJobId(candidate.master.agentJobId),
    version: Math.max(1, Math.min(999, Number.parseInt(candidate.master.version, 10) || 1)),
    approved: candidate.master.approved === true
  } : null;
  return {
    id: text(candidate.id, 'unknown', 160), choiceId: text(candidate.choiceId, '', 60), name: text(candidate.name, '未命名元素'),
    author: text(candidate.author, '未标注'), license: text(candidate.license, '许可待核'),
    sourceUrl: text(candidate.sourceUrl, '', 500),
    visualKind: ['generic', 'company', 'institution', 'voting', 'chair'].includes(candidate.visualKind) ? candidate.visualKind : '',
    abstractOnly: Boolean(candidate.abstractOnly), textOnly: Boolean(candidate.textOnly), brand: Boolean(candidate.brand),
    svg, image, fallback: Boolean(candidate.fallback), referenceApproved: candidate.referenceApproved === true, master
  };
}
function cleanElement(element, index) {
  const slotId = text(element?.slotId, `slot-${index}`, 60);
  return {
    slotId, kind: element?.kind === 'brand' || /^B\d+$/.test(slotId) ? 'brand' : 'element',
    concept: text(element?.concept, `元素 ${index + 1}`, 60),
    action: text(element?.action, '出现、响应', 60), query: text(element?.query, '', 100),
    selected: cleanCandidate(element?.selected)
  };
}

export function buildStoryboard(input = {}) {
  const mode = MODES.has(input.mode) ? input.mode : 'generic';
  const style = STYLES.has(input.style) ? input.style : 'cream-neon';
  const intensity = INTENSITIES.has(input.intensity) ? input.intensity : 'balanced';
  const fidelity = FIDELITIES.has(input.fidelity) ? input.fidelity : 'component';
  const sourceProfile = input.profile && typeof input.profile === 'object' ? input.profile : {};
  const sourceTokens = sourceProfile.tokens && typeof sourceProfile.tokens === 'object' ? sourceProfile.tokens : {};
  const profile = {
    source: text(sourceProfile.source, mode, 40), name: text(sourceProfile.name, mode === 'product' ? 'PRODUCT' : 'MOTION SYSTEM', 60),
    url: text(sourceProfile.url, mode === 'generic' ? 'generic' : '', 300),
    tokens: {
      accent: color(sourceTokens.accent, DEFAULT_TOKENS.accent), background: color(sourceTokens.background, DEFAULT_TOKENS.background),
      ink: color(sourceTokens.ink, DEFAULT_TOKENS.ink), radius: text(sourceTokens.radius, DEFAULT_TOKENS.radius, 20),
      fontFamily: text(sourceTokens.fontFamily, DEFAULT_TOKENS.fontFamily, 80)
    },
    components: Array.isArray(sourceProfile.components) ? sourceProfile.components.slice(0, 12).map(item => text(item, '', 40)).filter(Boolean) : [],
    assets: Array.isArray(sourceProfile.assets) ? sourceProfile.assets.slice(0, 20).filter(item => typeof item === 'string' && /^https:\/\//.test(item)) : []
  };
  if (style === 'dark-narrative' && mode === 'generic') {
    profile.tokens.accent = '#c6ff3d'; profile.tokens.background = '#071b15'; profile.tokens.ink = '#eff5e7';
  }
  const elements = (Array.isArray(input.elements) ? input.elements : []).slice(0, 18).map(cleanElement);
  const agentJobId = text(input.agentJobId, '', 60);
  if (!/^motion-[a-f0-9-]{36}$/.test(agentJobId) || input.agentAnalysis?.jobId !== agentJobId) throw new Error('缺少与本期输入对应的 Agent 拆解结果');
  const agentAnalysis = JSON.parse(JSON.stringify(input.agentAnalysis));
  const confirmations = {
    storyboard: input.confirmations?.storyboard === true,
    references: input.confirmations?.references === true,
    masters: input.confirmations?.masters === true
  };
  if (!confirmations.storyboard) throw new Error('请先确认 Agent 拆解的分镜');
  if (!confirmations.references) throw new Error('请先确认网上参考与元素');
  if (!elements.length || elements.some(element => !element.selected)) throw new Error('请为每个元素选择参考后再确认');
  if (elements.some(element => !element.selected.referenceApproved)) throw new Error('每项参考都需要明确确认');
  if (!confirmations.masters) throw new Error('请先确认全部重绘母版');
  if (elements.some(element => !element.selected.master?.approved || element.selected.master.sourceId !== element.selected.id)) throw new Error('每项母版都需要与已确认参考对应并明确确认');
  if (elements.some(element => !element.selected.master.previewUrl || !element.selected.master.agentJobId)) throw new Error('每项母版都必须来自 Agent 回写的真实文件');
  if (mode === 'product' && !input.profile) throw new Error('请先提取或选择 Product Profile');
  if (mode === 'product' && !elements.some(element => element.kind === 'brand')) throw new Error('请确认产品品牌 Logo 或纯文字标识');
  const id = `motion-${Date.now()}`;
  const beats = cleanBeats(input.beats);
  const duration = beats.at(-1).start + beats.at(-1).duration;
  const motion = {
    primary: beats[1].action, transition: 'button-to-panel', feedback: ['card-reflow', 'icon-check'], intensity
  };
  const storyboard = {
    version: 1, id, title: text(input.title, `${profile.name} · 动态分镜`, 100), duration,
    createdAt: new Date().toISOString(),
    source: { mode, script: text(input.script, '', 8000), aspect: text(input.aspect, '9:16', 10), agentJobId },
    style, fidelity, profile, confirmations, elements, motion, beats, agentAnalysis, projectFile: 'project.json'
  };
  const project = {
    title: storyboard.title, style, width: 1080, height: 1920, audio: '',
    scenes: [{
      id: 'motion-study', type: style === 'dark-narrative' ? 'darkNarrativeSequence' : 'motionSequence',
      start: 0, duration,
      props: {
        profile, elements, motion, storyboardId: id, beats: storyboard.beats,
        ...(style === 'dark-narrative' ? { assetBase: '../demo/assets/walk' } : {})
      },
      timing: {}
    }]
  };
  return { storyboard, project };
}

async function downloadSelectedAssets(storyboard) {
  const assetDir = path.join(OUTPUT, 'assets');
  const root = path.resolve('.');
  await mkdir(assetDir, { recursive: true });
  for (let index = 0; index < storyboard.elements.length; index += 1) {
    const element = storyboard.elements[index];
    const selected = element.selected;
    const source = selected?.master?.previewUrl || '';
    if (!source.endsWith('.svg')) continue;
    try {
      const target = path.resolve(root, `.${source}`);
      if (!target.startsWith(root + path.sep)) continue;
      const svg = await readFile(target, 'utf8');
      if (svg.length > 262144 || !svg.includes('<svg') || /<script|onload\s*=|<foreignObject/i.test(svg)) continue;
      const filename = `${element.kind === 'brand' ? 'brand' : 'element'}-${index + 1}-master.svg`;
      await writeFile(path.join(assetDir, filename), svg, 'utf8');
      selected.sourceSvg = source;
      selected.asset = `assets/${filename}`;
    } catch { /* The approved remote reference remains available as a fallback. */ }
  }
}

export async function writeStoryboard(input) {
  const { storyboard, project } = buildStoryboard(input);
  await mkdir(OUTPUT, { recursive: true });
  await downloadSelectedAssets(storyboard);
  project.scenes[0].props.elements = storyboard.elements;
  await Promise.all([
    writeFile(path.join(OUTPUT, 'storyboard.json'), `${JSON.stringify(storyboard, null, 2)}\n`, 'utf8'),
    writeFile(path.join(OUTPUT, 'project.json'), `${JSON.stringify(project, null, 2)}\n`, 'utf8')
  ]);
  return {
    id: storyboard.id, selectedCount: storyboard.elements.filter(element => element.selected).length,
    beatCount: storyboard.beats.length, duration: storyboard.duration,
    previewUrl: `/studio/generated/player.html?scene=motion-study&revision=${encodeURIComponent(storyboard.id)}`,
    storyboardUrl: '/studio/generated/storyboard.json', projectUrl: '/studio/generated/project.json'
  };
}
