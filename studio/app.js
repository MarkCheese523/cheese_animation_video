const state = {
  mode: 'generic', style: 'cream-neon', profile: null, fidelity: 'component', intensity: 'balanced',
  selections: {}, slots: [], masters: {}, currentStep: 'direction', referenceSheet: '',
  jobId: '', analysis: null, agentPoll: 0, masterPoll: 0, productionPoll: 0,
  masterJobId: '', masterResult: null, sampleJobId: '', filmJobId: '', sampleResult: null, filmResult: null,
  activeSample: 'opening', viewedSamples: { opening: false, mechanism: false },
  confirmations: { storyboard: false, references: false, masters: false, samples: false }
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const DEMO_PROFILE = {
  source: 'web-product', name: 'Component Demo', url: 'local-demo', description: '虚拟产品，仅用于验证双轨流程',
  tokens: { accent: '#c6ff3d', background: '#f4f0e6', ink: '#102a22', radius: '16px', fontFamily: '系统无衬线' },
  palette: ['#c6ff3d', '#f4f0e6', '#102a22', '#fffdf7'], components: ['按钮', '卡片', 'SVG 图标'],
  assets: ['/studio/demo/component-demo-logo.svg'],
  brandAssets: [{
    url: '/studio/demo/component-demo-logo.svg', label: 'Component Demo · 产品真实标识', kind: 'svg',
    sourceUrl: '/studio/demo/component-demo-logo.svg', author: 'Component Demo', license: '虚构产品自带标识；仅用于本地流程演示'
  }],
  confirmation: 'pending'
};

function allReferencesSelected() {
  return state.slots.length > 0 && state.slots.every(slot => state.selections[slot.id] && !state.selections[slot.id].unavailable);
}
function stepPermissions() {
  const { storyboard, references, masters, samples } = state.confirmations;
  return { direction: true, motion: true, elements: storyboard, redraw: references, preview: masters, film: samples };
}
function updateGateUI() {
  const { storyboard, references, masters, samples } = state.confirmations;
  const allowed = stepPermissions();
  if (!allowed[state.currentStep]) {
    state.currentStep = masters ? 'preview' : references ? 'redraw' : storyboard ? 'elements' : state.analysis ? 'motion' : 'direction';
    $$('[data-page]').forEach(page => { page.hidden = page.dataset.page !== state.currentStep; });
  }
  $$('.steps button').forEach(button => {
    const step = button.dataset.step;
    button.disabled = !allowed[step];
    button.classList.toggle('active', step === state.currentStep);
    const status = button.querySelector('em');
    if (status) {
      const confirmed = step === 'motion' ? storyboard : step === 'elements' ? references : step === 'redraw' ? masters : samples;
      status.textContent = confirmed ? '已确认' : '待确认';
      status.classList.toggle('confirmed', confirmed);
    }
  });
  const gates = [['#motionGate', '确认页 1 / 3', storyboard], ['#referenceGate', '确认页 2 / 3', references], ['#masterGate', '确认页 3 / 3', masters]];
  gates.forEach(([selector, label, confirmed]) => {
    $(selector).textContent = `${label} · ${confirmed ? '已确认' : '待确认'}`;
    $(selector).classList.toggle('confirmed-tag', confirmed);
  });
  const selectedCount = state.slots.filter(slot => state.selections[slot.id]).length;
  $('#referenceProgress').textContent = state.referenceSheet ? '确认单已生成，确认后进入母版制作' : state.slots.length ? `已选 ${selectedCount} / ${state.slots.length} 项，请生成确认单` : '请先为每个元素选择参考';
  $('#confirmMotion').disabled = !state.analysis || !state.slots.length;
  $('#buildReferenceSheet').disabled = !storyboard || !allReferencesSelected();
  $('#confirmReferences').disabled = !storyboard || !allReferencesSelected() || !state.referenceSheet;
  const agentMastersReady = Boolean(state.masterResult) && state.slots.length > 0 && state.slots.every(slot => state.masters[slot.id]?.previewUrl);
  $('#confirmMasters').disabled = !references || !allReferencesSelected() || !agentMastersReady;
  $('#generateSamples').disabled = !(storyboard && references && masters) || Boolean(state.sampleJobId && !state.sampleResult);
  $('#generateFilm').disabled = !samples || Boolean(state.filmJobId && !state.filmResult);
  const bothViewed = state.viewedSamples.opening && state.viewedSamples.mechanism;
  $('#confirmSamples').disabled = !(masters && state.sampleResult && bothViewed) || samples;
  $('#masterProgress').textContent = masters ? '全部母版已确认，可进入两段代表样片' : agentMastersReady ? 'Agent 母版已回写，请对照参考与识别特征后确认' : state.masterJobId ? '等待 Agent 回写真实风格化母版，当前不能确认' : '确认参考后，由 Agent 绘制真实风格化母版';
  $('#sampleProgress').textContent = samples ? '两段样片已确认，全片已解锁' : state.sampleResult ? bothViewed ? '两段均已查看，请明确确认后进入全片' : '请分别打开视觉开场与核心机制，两段都查看后才能确认' : state.sampleJobId ? '等待 Agent 回写两段真实网页样片' : '生成后请分别打开两段样片检查';
  $('#sampleGate').textContent = `代表样片 · ${samples ? '已确认' : state.sampleResult ? '待验收' : '待制作'}`;
  $('#sampleGate').classList.toggle('confirmed-tag', samples);
  $('#filmProgress').textContent = state.filmResult ? '完整网页预览已回写；最终导出仍需另行明确授权' : state.filmJobId ? '等待 Agent 回写全片，不会自动生成或导出' : '全片任务将携带两段样片结果与确认状态';
  scheduleDraftSave();
}
function invalidateProduction() {
  state.confirmations.samples = false;
  state.sampleJobId = ''; state.filmJobId = ''; state.sampleResult = null; state.filmResult = null;
  state.activeSample = 'opening'; state.viewedSamples = { opening: false, mechanism: false };
  state.productionPoll += 1;
  $('#sampleHandoff').hidden = true; $('#sampleWorkspace').hidden = true; $('#sampleBrief').hidden = true;
  $('#filmHandoff').hidden = true; $('#filmWorkspace').hidden = true;
  $('#sampleFrame').removeAttribute('src'); $('#filmFrame').removeAttribute('src');
  $('#samplePrompt').value = ''; $('#filmPrompt').value = '';
  $$('.sample-tabs button').forEach(button => { button.classList.remove('active'); button.querySelector('small').textContent = '未查看'; });
  renderSamplePlan();
  updateGateUI();
}
function invalidateMasters() {
  state.masterPoll += 1; state.masterJobId = ''; state.masterResult = null; state.masters = {};
  $('#masterHandoff').hidden = true; $('#masterPrompt').value = ''; $('#masterList').replaceChildren();
}
function invalidateConfirmations(level = 'storyboard') {
  if (level === 'storyboard') state.confirmations.storyboard = false;
  state.confirmations.references = false;
  state.confirmations.masters = false;
  state.referenceSheet = '';
  $('#referenceSheet').textContent = '选择或语义已变化，请重新生成确认单。';
  invalidateMasters();
  invalidateProduction();
}
function resetAgentAnalysis() {
  state.analysis = null; state.slots = []; state.selections = {}; state.masters = {}; state.jobId = '';
  state.agentPoll += 1;
  $('#agentAnalysis').hidden = true; $('#agentHandoff').hidden = true;
  invalidateConfirmations();
}
function showStep(step) {
  if (!stepPermissions()[step]) return;
  state.currentStep = step;
  $$('[data-page]').forEach(page => { page.hidden = page.dataset.page !== step; });
  if (step === 'redraw') renderMasters();
  if (step === 'preview') renderSamplePlan();
  updateGateUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function brandTextVisual(concept, note = '不绘制近似 Logo') {
  const node = document.createElement('div'); node.className = 'brand-text-visual';
  const title = document.createElement('b'); title.textContent = concept;
  const caption = document.createElement('small'); caption.textContent = note;
  node.append(title, caption); return node;
}
function assetVisual(candidate, concept) {
  if (candidate.visualKind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 360 360'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${concept}通用语义资产`); svg.dataset.semantic = candidate.visualKind;
    const slotFallback = state.slots.find(slot => slot.id === candidate.slot)?.fallback;
    const fallback = typeof candidate.fallback === 'string' ? candidate.fallback : slotFallback;
    const semanticRoles = {
      'lucide:blocks': 'capability', 'lucide:network': 'network',
      'lucide:receipt-text': 'cost', 'lucide:repeat-2': 'retention',
      'lucide:file-chart-column': 'workflow'
    };
    svg.dataset.semanticRole = candidate.visualKind !== 'generic' || candidate.id === 'G0' || candidate.id === 'G0-A' || fallback === 'lucide:user-round'
      ? candidate.visualKind : (semanticRoles[fallback] || 'abstract');
    mountSemanticAsset(svg); return svg;
  }
  if (candidate.abstractOnly) {
    const node = document.createElement('div'); node.className = 'abstract-visual';
    const title = document.createElement('b'); title.textContent = candidate.id.startsWith('G0') ? '实名文字节点' : '文字／数字节点';
    const note = document.createElement('small'); note.textContent = '不制作未确认的具象对象'; node.append(title, note); return node;
  }
  if (candidate.textOnly) return brandTextVisual(concept);
  const source = candidate.svg || candidate.image;
  if (source) {
    const image = document.createElement('img'); image.src = source; image.alt = `${concept}候选参考`; image.loading = 'lazy'; return image;
  }
  if (candidate.brand) return brandTextVisual(concept, '真实参考未加载');
  return localPreview(concept);
}
function candidateVisual(candidate, concept) {
  return assetVisual(candidate, concept);
}
function renderMasters() {
  if (!state.masterResult) { $('#masterList').replaceChildren(); return; }
  const cards = state.slots.filter(slot => state.selections[slot.id]).map(slot => {
    const selected = state.selections[slot.id];
    const agentMaster = state.masterResult.masters.find(item => item.slotId === slot.id);
    const master = state.masters[slot.id];
    if (!agentMaster || !master?.previewUrl) return null;
    const card = document.createElement('article'); card.className = 'master-card'; card.dataset.masterSlot = slot.id;
    const head = document.createElement('div'); head.className = 'master-card-head';
    const title = document.createElement('div'); title.innerHTML = `<small>${slot.brandOnly ? 'BRAND ASSET' : 'SEMANTIC ASSET'}</small>`;
    const name = document.createElement('b'); name.textContent = slot.concept; title.appendChild(name);
    const badge = document.createElement('span'); badge.textContent = 'Agent 真实母版'; head.append(title, badge);
    const compare = document.createElement('div'); compare.className = 'master-compare';
    const reference = document.createElement('figure'); reference.className = 'reference-figure';
    const referenceStage = document.createElement('div'); referenceStage.className = 'master-stage'; referenceStage.appendChild(candidateVisual(selected, slot.concept));
    const referenceCaption = document.createElement('figcaption'); referenceCaption.textContent = `已确认参考 · ${selected.license}`; reference.append(referenceStage, referenceCaption);
    const arrow = document.createElement('span'); arrow.className = 'master-arrow'; arrow.textContent = '→';
    const result = document.createElement('figure'); result.className = 'master-figure';
    const masterStage = document.createElement('div'); masterStage.className = 'master-stage';
    const image = document.createElement('img'); image.className = 'master-visual'; image.src = master.previewUrl; image.alt = `${slot.concept} Agent 风格化母版`; image.loading = 'eager'; masterStage.appendChild(image);
    const masterCaption = document.createElement('figcaption'); masterCaption.textContent = `Agent 重绘 · ${agentMaster.retainedFeatures || '保留已确认识别特征'}`; result.append(masterStage, masterCaption);
    compare.append(reference, arrow, result);
    const controls = document.createElement('div'); controls.className = 'master-controls';
    const label = document.createElement('label'); label.textContent = 'Agent 母版变体';
    const select = document.createElement('select'); select.setAttribute('aria-label', `${slot.concept}母版样式`);
    agentMaster.variants.forEach(variant => {
      const option = document.createElement('option'); option.value = variant.id; option.textContent = variant.label; option.selected = master.variant === variant.id; select.appendChild(option);
    });
    select.addEventListener('change', () => {
      const variant = agentMaster.variants.find(item => item.id === select.value);
      if (!variant) return;
      master.variant = variant.id; master.previewUrl = variant.previewUrl; master.approved = false;
      state.confirmations.masters = false;
      invalidateProduction(); renderMasters(); updateGateUI();
    });
    const note = document.createElement('span'); note.textContent = `来源：${selected.author} · ${selected.license} · QA：${agentMaster.qa || '见任务记录'}`;
    label.appendChild(select); controls.append(label, note); card.append(head, compare, controls); return card;
  }).filter(Boolean);
  $('#masterList').replaceChildren(...cards);
}

function updateMode(mode) {
  state.mode = mode;
  resetAgentAnalysis();
  $$('.mode').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active);
  });
  $('#genericPanel').hidden = mode !== 'generic';
  $('#productPanel').hidden = mode !== 'product';
  $('#fidelityGroup').hidden = mode !== 'product';
  updatePreview();
}

function renderProfile(profile, reset = true) {
  state.profile = profile;
  if (reset) resetAgentAnalysis();
  $('#productProfile').hidden = false;
  $('#profileName').textContent = profile.name;
  $('#profileMeta').textContent = profile.url === 'local-demo' ? profile.description : profile.url;
  $('#profileFont').textContent = profile.tokens.fontFamily || '系统字体';
  $('#profileRadius').textContent = profile.tokens.radius || '12px';
  $('#profileComponents').textContent = profile.components.join('、');
  $('#profileSwatches').replaceChildren(...(profile.palette || Object.values(profile.tokens).slice(0, 4)).map(color => {
    const swatch = document.createElement('span');
    swatch.className = 'swatch'; swatch.style.background = color; swatch.title = color;
    return swatch;
  }));
  updatePreview();
}

function representativeSamples() {
  const edited = beatInput();
  const beats = edited.length
    ? edited.map(edit => ({ ...(state.analysis?.beats.find(beat => beat.id === edit.id) || {}), ...edit }))
    : state.analysis?.beats || [];
  if (!beats.length) return [];
  const opening = beats.find(beat => beat.id === 'gather') || beats[0];
  const mechanism = beats.find(beat => beat.id === 'switch') || beats.find(beat => beat.id === 'trigger') || beats[1] || beats[0];
  return [
    { id: 'opening', label: '视觉开场', beat: opening },
    { id: 'mechanism', label: '核心机制', beat: mechanism }
  ];
}
function renderSamplePlan() {
  const container = $('#samplePlan');
  if (!container) return;
  const samples = representativeSamples();
  if (!samples.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    const note = document.createElement('p'); note.textContent = '完成 Agent 拆解与三项确认后，这里会列出本期视觉开场和核心机制。';
    empty.appendChild(note); container.replaceChildren(empty); return;
  }
  container.replaceChildren(...samples.map(({ id, label, beat }, index) => {
    const card = document.createElement('article'); card.className = 'sample-plan-card'; card.dataset.samplePlan = id;
    const head = document.createElement('div'); head.className = 'sample-plan-head';
    const number = document.createElement('span'); number.textContent = `0${index + 1} · ${label}`;
    const duration = document.createElement('b'); duration.textContent = `${beat.duration} 秒`; head.append(number, duration);
    const title = document.createElement('h3'); title.textContent = beat.label;
    const narration = document.createElement('p'); narration.textContent = beat.narration || '本期旁白由 Agent 按分镜回写。';
    const assets = document.createElement('small');
    const names = (beat.assetIds || []).map(assetId => state.slots.find(slot => slot.id === assetId)?.concept || assetId);
    assets.textContent = names.length ? `调用资产：${names.join('、')}` : '调用资产：按本期分镜与已确认母版匹配';
    card.append(head, title, narration, assets); return card;
  }));
}
function updatePreview() {
  const profile = state.mode === 'product' && state.profile ? state.profile : DEMO_PROFILE;
  const labels = {
    mode: state.mode === 'product' ? '网页产品轨道' : '无产品轨道', style: state.style === 'cream-neon' ? '奶油 × 荧绿' : '深色插画叙事',
    fidelity: { faithful: '原界面', component: '组件级重绘', abstract: '品牌化抽象' }[state.fidelity],
    intensity: { subtle: '克制', balanced: '均衡', showreel: '强展示' }[state.intensity]
  };
  const chips = state.mode === 'product' ? [labels.mode, profile.name, labels.fidelity, labels.intensity] : [labels.mode, labels.style, labels.intensity];
  $('#selectionSummary').replaceChildren(...chips.map(text => { const node = document.createElement('span'); node.textContent = text; return node; }));
  renderSamplePlan();
}

function localPreview(concept) {
  const paths = {
    凭证: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h4M10 14l2 2 4-5"/>',
    拆分: '<path d="M4 12h5M9 12c5 0 3-6 8-6h3M9 12c5 0 3 6 8 6h3"/><path d="m17 3 3 3-3 3m0 6 3 3-3 3"/>',
    转让: '<path d="M3 8h17m-4-4 4 4-4 4M21 16H4m4-4-4 4 4 4"/>',
    失效: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2M4 4l16 16"/>',
    确认: '<path d="m5 3 13 10-6 1-3 6z"/><path d="m14 15 4 5"/>',
    同步: '<path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>',
    权限: '<path d="M12 3 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6z"/><path d="m8 12 3 3 5-6"/>',
    数据: '<path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/>',
    账户: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-label', `${concept}的本地语义预览`); svg.classList.add('local-preview');
  svg.innerHTML = paths[concept] || '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>';
  return svg;
}

async function loadCandidates(slot, grid, button) {
  button.disabled = true;
  const route = researchRoute(slot);
  const localOnly = route === 'semantic';
  grid.replaceChildren(); grid.className = 'slot-status'; grid.textContent = route === 'web' ? '正在互联网检索真实图片、原始来源与授权…' : localOnly ? '正在准备通用语义资产与表达方向…' : '正在检索开放矢量图标库…';
  let candidates;
  if (slot.brandOnly) {
    candidates = await searchBrandCandidates(slot);
  } else if (localOnly) {
    candidates = [{
      id: `${slot.id}-A`, name: slot.semanticName, author: 'Motion Layer', license: slot.rights,
      fallback: true, semantic: true, visualKind: slot.visualKind, abstractOnly: slot.abstractOnly, slot: slot.id
    }];
    if (!slot.abstractOnly) candidates.push({
      id: `${slot.id}-B`, name: '仅使用文字／数字节点',
      author: 'Motion Layer', license: '不制作具象资产，只保留文字、数字与关系。',
      fallback: true, abstractOnly: true, slot: slot.id
    });
  } else {
    let searchFailed = false;
    try { candidates = route === 'web' ? await searchWebCandidates(slot) : await searchIconCandidates(slot.query, 5); }
    catch { candidates = []; searchFailed = true; }
    if (!candidates.length) candidates = fallbackCandidates(slot).map(candidate => ({
      ...candidate, license: searchFailed ? '联网检索连接失败；当前为本地备用，点击重新找图可重试。' : '联网未找到匹配素材；当前为本地备用。'
    }));
    candidates = [...candidates.slice(0, 5), {
      id: `semantic-${slot.id}`, name: `${slot.concept} · 抽象文字／关系备选`, author: 'Motion Layer',
      license: '不猜测具体物体或人物；仅保留文字、数字与关系，无外部参考。',
      fallback: true, semantic: true, abstractOnly: true, slot: slot.id
    }];
  }
  grid.replaceChildren(); grid.className = 'candidates';
  delete state.selections[slot.id];
  delete state.masters[slot.id];
  invalidateConfirmations('references');
  candidates.forEach((candidate, index) => {
    candidate.choiceId = `${slot.id}-${String.fromCharCode(65 + index)}`;
    const choice = document.createElement('label'); choice.className = 'candidate'; choice.dataset.candidateId = candidate.id;
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `reference-${slot.id}`; radio.value = candidate.id; radio.className = 'candidate-radio';
    const choiceLine = document.createElement('div'); choiceLine.className = 'choice-line';
    const code = document.createElement('span'); code.textContent = candidate.choiceId;
    choiceLine.appendChild(code);
    const badgeText = index === 0 ? '推荐' : candidate.semantic ? '无外部参考' : candidate.textOnly ? '纯文字' : '';
    if (badgeText) {
      const badge = document.createElement('span'); badge.className = 'candidate-badge'; badge.textContent = badgeText; choiceLine.appendChild(badge);
    }
    const visual = document.createElement('span'); visual.className = 'candidate-visual';
    visual.appendChild(assetVisual(candidate, slot.concept));
    const image = visual.querySelector('img');
    if (image) image.addEventListener('error', () => {
      candidate.previewFallback = true;
      if (candidate.brand) {
        candidate.unavailable = true; radio.disabled = true; choice.classList.add('unavailable');
        image.replaceWith(brandTextVisual(slot.concept, '参考加载失败，请改选'));
        if (state.selections[slot.id]?.id === candidate.id) delete state.selections[slot.id];
        invalidateConfirmations('references');
      } else image.replaceWith(localPreview(slot.concept));
    }, { once: true });
    const name = document.createElement('h3'); name.textContent = candidate.name;
    const usage = document.createElement('p'); usage.className = 'candidate-usage';
    usage.textContent = slot.brandOnly ? `只保留真实路径、字形与原始比例，用于「${slot.action}」；不改画近似标识。` : `拟保留轮廓、比例与识别特征，用于「${slot.action}」。`;
    const rights = document.createElement('p'); rights.className = 'candidate-rights'; rights.textContent = `${candidate.author} · ${candidate.license}`;
    choice.append(radio, choiceLine, visual, name, usage, rights);
    const sourceUrl = candidate.sourceUrl || candidate.svg || candidate.image;
    if (sourceUrl) {
      const source = document.createElement('a'); source.href = sourceUrl; source.target = '_blank'; source.rel = 'noreferrer'; source.textContent = slot.brandOnly ? '查看真实资产与来源 ↗' : '查看公开矢量与来源 ↗';
      source.addEventListener('click', event => event.stopPropagation()); choice.appendChild(source);
    }
    choice.title = `${candidate.author} · ${candidate.license}`;
    radio.addEventListener('change', () => {
      if (!radio.checked || candidate.unavailable) return;
      grid.querySelectorAll('.candidate').forEach(node => node.classList.remove('selected'));
      choice.classList.add('selected');
      state.selections[slot.id] = candidate;
      delete state.masters[slot.id];
      invalidateConfirmations('references');
      markGeneratedStale();
    });
    grid.appendChild(choice);
  });
  const recommended = grid.querySelector('.candidate-radio:not(:disabled)');
  if (recommended) { recommended.checked = true; recommended.dispatchEvent(new Event('change', { bubbles: true })); }
  button.disabled = false;
  markGeneratedStale();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
async function researchSlot(slot) {
  const route = researchRoute(slot);
  const localOnly = route === 'semantic';
  const container = document.createElement('article');
  const detail = slot.id === 'G0' ? '先于具体角色建立；后续人物只派生颜色、编号、姿态与组合，不逐镜头重画。' : slot.brandOnly ? '智能分流：互联网真实图片。检索可靠矢量或提取产品真实标识；保留原始路径、字形与比例，找不到时才使用纯文字备用。' : localOnly ? '智能分流：通用语义母版。不指向特定真实对象，不强行联网伪造。' : route === 'web' ? '智能分流：互联网真实图片。展示原始来源、作者与授权，同时保留通用语义设计备选。' : '智能分流：开放矢量图标库。按 Agent 的语义检索通用图标，同时保留语义设计备选。';
  const title = slot.id === 'G0' ? '通用人物母版' : slot.brandOnly ? '互联网品牌 Logo 与真实来源' : localOnly ? '语义资产方向' : route === 'web' ? '互联网真实图片参考' : '开放图标与素材参考';
  container.className = 'element-slot'; container.dataset.slot = slot.id;
  container.innerHTML = `<div class="slot-head"><span class="asset-id">${escapeHtml(slot.code)}</span><div class="slot-title"><b>${escapeHtml(slot.concept)} · ${title}</b><p>${detail}</p></div><button class="slot-research" type="button">${localOnly ? '刷新表达方向' : '按此语义重新找图 ↗'}</button></div><div class="slot-semantics"><label>预期动作<input class="slot-action-input" value="${escapeHtml(slot.action)}"></label><label>联网检索词<input class="slot-query" value="${escapeHtml(slot.query)}" ${localOnly ? 'disabled' : ''}></label></div>`;
  const grid = document.createElement('div');
  const button = container.querySelector('.slot-research');
  container.querySelector('.slot-action-input').addEventListener('input', event => { slot.action = event.target.value; invalidateConfirmations('references'); markGeneratedStale(); });
  container.querySelector('.slot-query').addEventListener('input', event => { slot.query = event.target.value; invalidateConfirmations('references'); markGeneratedStale(); });
  button.addEventListener('click', () => loadCandidates(slot, grid, button));
  container.appendChild(grid);
  $('#elementSlots').appendChild(container);
  await loadCandidates(slot, grid, button);
}

$$('.steps button').forEach(button => button.addEventListener('click', () => showStep(button.dataset.step)));
$$('[data-go]').forEach(button => button.addEventListener('click', () => showStep(button.dataset.go)));
async function uploadAttachments() {
  const files = [...$('#attachmentInput').files, ...$('#screenshotInput').files];
  const unique = [...new Map(files.map(file => [`${file.name}-${file.size}-${file.lastModified}`, file])).values()];
  const attachments = [];
  for (const file of unique) {
    const response = await fetch(`/api/agent-upload?filename=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `附件 ${file.name} 上传失败`);
    attachments.push({ ...result, kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'recording' : 'attachment' });
  }
  return attachments;
}
function applyAgentAnalysis(analysis) {
  state.analysis = analysis; state.slots = analysis.assets;
  state.selections = {}; state.masters = {};
  $('#agentHandoff').hidden = true; $('#agentAnalysis').hidden = false;
  $('#analysisSummary').textContent = `${analysis.summary} 已生成 ${analysis.beats.length} 拍分镜与 ${analysis.assets.length} 项素材需求，请检查后明确确认。`;
  renderBeatEditor(); updateGateUI(); updatePreview();
}
async function pollAgentJob(jobId) {
  const token = ++state.agentPoll;
  const check = async () => {
    if (token !== state.agentPoll || state.jobId !== jobId) return;
    try {
      const response = await fetch(`/api/agent-jobs/${jobId}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Agent 任务读取失败');
      if (result.analysis) { applyAgentAnalysis(result.analysis); return; }
      $('#agentStatus').textContent = '整包已保存。请把交接提示发送到当前对话；Agent 回写后，本页会自动出现实际分镜。';
      setTimeout(check, 2000);
    } catch (error) {
      $('#agentStatus').textContent = `${error.message}。可返回输入重新提交，或稍后刷新本页。`;
    }
  };
  await check();
}
$('#startMotion').addEventListener('click', async () => {
  if (state.mode === 'product' && !state.profile) {
    $('#profileError').textContent = '请先提取 Product Profile，或使用虚拟产品演示。'; $('#profileError').hidden = false; return;
  }
  const button = $('#startMotion'); button.disabled = true; $('#profileError').hidden = true;
  try {
    resetAgentAnalysis();
    const attachments = await uploadAttachments();
    if (!attachments.some(item => item.name.toLowerCase().endsWith('.srt'))) throw new Error('请至少上传一份 SRT 字幕；MP3 配音和文字脚本均可选');
    const response = await fetch('/api/agent-jobs', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        script: $('#scriptInput').value, mode: state.mode, style: state.style,
        fidelity: state.fidelity, intensity: state.intensity, aspect: $('#aspectInput').value,
        notes: $('#notesInput').value, profile: state.mode === 'product' ? state.profile : null, attachments
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Agent 任务创建失败');
    state.jobId = result.jobId;
    $('#agentPrompt').value = result.prompt; $('#agentHandoff').hidden = false; $('#agentAnalysis').hidden = true;
    $('#agentStatus').textContent = '整包已保存。复制交接提示并发送到当前对话，Agent 拆解后本页会自动更新。';
    showStep('motion'); pollAgentJob(result.jobId);
  } catch (error) {
    $('#profileError').textContent = error.message; $('#profileError').hidden = false;
  } finally { button.disabled = false; }
});
$('#copyAgentPrompt').addEventListener('click', async () => {
  const field = $('#agentPrompt'); field.focus(); field.select();
  try { await navigator.clipboard.writeText(field.value); }
  catch { document.execCommand('copy'); }
  $('#copyAgentPrompt').textContent = '已复制，回当前对话发送';
});
$('#confirmMotion').addEventListener('click', async () => {
  if (!state.analysis) return;
  invalidateConfirmations(); state.confirmations.storyboard = true; updateGateUI(); showStep('elements');
  await researchAll();
});
$('#buildReferenceSheet').addEventListener('click', () => {
  if (!allReferencesSelected()) return;
  const choices = state.slots.map(slot => state.selections[slot.id].choiceId || state.selections[slot.id].id);
  state.referenceSheet = `重要名词、品牌与参考素材确认：${choices.join('、')}。\n通用人物与语义资产按所列方向复用；真实参考仅保留已列出来源、授权与识别特征；品牌 Logo 保留原始路径、字形和比例，不用近似图形替代；抽象项不补画具象实物。\n同意基于这些设计方向与参考制作风格化母版。`;
  $('#referenceSheet').textContent = state.referenceSheet;
  updateGateUI();
});
$('#confirmReferences').addEventListener('click', async () => {
  if (!state.confirmations.storyboard || !allReferencesSelected() || !state.referenceSheet) return;
  invalidateProduction(); invalidateMasters();
  state.confirmations.references = true; state.confirmations.masters = false;
  updateGateUI(); showStep('redraw');
  await createMasterProduction();
});
$('#confirmMasters').addEventListener('click', () => {
  if (!state.confirmations.references || !allReferencesSelected() || !state.masterResult) return;
  if (state.slots.some(slot => !state.masters[slot.id]?.previewUrl || state.masters[slot.id].sourceId !== state.selections[slot.id].id)) return;
  state.slots.forEach(slot => { state.masters[slot.id].approved = true; });
  state.confirmations.masters = true; updateGateUI(); showStep('preview');
});
$$('.mode').forEach(button => button.addEventListener('click', () => updateMode(button.dataset.mode)));
$$('.style-card').forEach(button => button.addEventListener('click', () => {
  state.style = button.dataset.style;
  resetAgentAnalysis();
  $$('.style-card').forEach(node => node.classList.toggle('selected', node === button));
  updatePreview();
}));
$$('.segmented').forEach(group => group.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
  group.querySelectorAll('button').forEach(node => node.classList.toggle('active', node === button));
  state[group.dataset.setting] = button.dataset.value;
  invalidateConfirmations();
  updatePreview();
})));

$('#productForm').addEventListener('submit', async event => {
  event.preventDefault();
  $('#profileError').hidden = true; $('#profileLoading').hidden = false; $('#productProfile').hidden = true;
  try {
    const response = await fetch('/api/product-profile', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: $('#productUrl').value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '网页分析失败');
    renderProfile(result);
  } catch (error) {
    $('#profileError').textContent = `${error.message}。可使用虚拟演示，或提供截图与资源后继续。`;
    $('#profileError').hidden = false;
  } finally { $('#profileLoading').hidden = true; }
});
$('#demoProduct').addEventListener('click', () => { $('#profileError').hidden = true; renderProfile(DEMO_PROFILE); });
$('#screenshotInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const image = $('#screenshotPreview');
  image.src = URL.createObjectURL(file); image.hidden = false;
  if (!state.profile) renderProfile({ ...DEMO_PROFILE, name: file.name.replace(/\.[^.]+$/, ''), description: '用户提供的网页产品截图' });
  else resetAgentAnalysis();
});
async function researchAll() {
  if (!state.confirmations.storyboard || !state.analysis) return;
  state.selections = {}; state.masters = {};
  invalidateConfirmations('references');
  const summary = document.createElement('section'); summary.className = 'needs-summary';
  const summaryHead = document.createElement('div'); summaryHead.className = 'slot-head';
  summaryHead.innerHTML = '<span class="asset-id">AI</span><div class="slot-title"><b>Agent 从本期脚本提取的素材清单</b><p>分镜、重要名词、真实品牌与通用语义资产来自同一次 AI 拆解；这里只确认参考，不要求用户预先列清单。</p></div>';
  const summaryList = document.createElement('div'); summaryList.className = 'needs-list';
  state.slots.forEach(slot => { const item = document.createElement('span'); item.textContent = `${slot.id} ${slot.concept} · ${slot.action}`; summaryList.appendChild(item); });
  summary.append(summaryHead, summaryList);
  $('#elementSlots').replaceChildren(summary);
  await Promise.all(state.slots.map(researchSlot));
}
const BEAT_ACTIONS = {
  gather: [['component-gather', '组件聚合'], ['logo-reveal', 'Logo 强调']],
  trigger: [['cursor-click', '指针点击'], ['direct-press', '直接按压']],
  split: [['component-flow', '组件流动'], ['card-reflow', '卡片重排']],
  switch: [['state-reflow', '状态切换＋重排'], ['status-only', '仅状态切换']],
  resolve: [['logo-resolve', '品牌聚合落版'], ['hero-hold', '品牌定格']]
};
function beatInput() {
  return $$('.beat-row').map(row => ({
    id: row.dataset.beat, label: row.querySelector('[data-field="label"]').value,
    action: row.querySelector('[data-field="action"]').value,
    duration: Number(row.querySelector('[data-field="duration"]').value)
  }));
}
function updateBeatSummary() {
  const beats = beatInput();
  const total = Math.round(beats.reduce((sum, beat) => sum + (Number.isFinite(beat.duration) ? beat.duration : 0), 0) * 100) / 100;
  $('#beatTotal').textContent = `共 ${total} 秒`;
  renderSamplePlan();
}
function renderBeatEditor() {
  const beats = state.analysis?.beats || [];
  $('#beatRows').replaceChildren(...beats.map((beat, index) => {
    const row = document.createElement('div'); row.className = 'beat-row'; row.dataset.beat = beat.id;
    const number = document.createElement('span'); number.className = 'beat-index'; number.textContent = String(index + 1).padStart(2, '0');
    const fields = [['label', '标题'], ['action', '主动作'], ['duration', '时长']].map(([field, label]) => {
      const wrapper = document.createElement('div'); wrapper.className = `beat-field ${field === 'duration' ? 'beat-duration' : ''}`;
      const caption = document.createElement('label'); caption.textContent = label;
      let control;
      if (field === 'action') {
        control = document.createElement('select');
        BEAT_ACTIONS[beat.id].forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; control.appendChild(option); });
        control.value = beat.action;
      } else {
        control = document.createElement('input'); control.value = field === 'label' ? beat.label : beat.duration;
        if (field === 'label') { control.maxLength = 16; control.type = 'text'; }
        else { control.type = 'number'; control.min = 1; control.max = 12; control.step = .25; }
      }
      control.dataset.field = field; control.addEventListener(field === 'action' ? 'change' : 'input', () => { updateBeatSummary(); invalidateConfirmations(); markGeneratedStale(); });
      wrapper.append(caption, control);
      if (field === 'duration') { const unit = document.createElement('span'); unit.textContent = '秒'; wrapper.appendChild(unit); }
      return wrapper;
    });
    const note = document.createElement('p'); note.className = 'beat-note'; note.textContent = `${beat.narration} ${beat.note}`;
    row.append(number, ...fields, note); return row;
  }));
  updateBeatSummary();
}
function storyboardInput() {
  const edits = beatInput();
  const beats = edits.map(edit => ({ ...(state.analysis?.beats.find(beat => beat.id === edit.id) || {}), ...edit }));
  return {
    title: 'Motion Layer · 本期制作整包', mode: state.mode, style: state.style,
    profile: state.mode === 'product' ? state.profile : DEMO_PROFILE,
    fidelity: state.fidelity, intensity: state.intensity, script: $('#scriptInput').value, aspect: $('#aspectInput').value,
    beats, confirmations: { ...state.confirmations }, agentJobId: state.jobId, agentAnalysis: state.analysis,
    elements: state.slots.map(slot => ({
      slotId: slot.id, kind: slot.brandOnly ? 'brand' : 'element', concept: slot.concept, action: slot.action, query: slot.query,
      selected: state.selections[slot.id] ? {
        ...state.selections[slot.id], referenceApproved: state.confirmations.references,
        master: state.masters[slot.id] || null
      } : null
    })),
    motion: { primary: 'cursor-click', transition: 'button-to-panel', feedback: ['card-reflow', 'icon-check'], intensity: state.intensity }
  };
}
function markGeneratedStale() {
  if (state.sampleJobId || state.sampleResult || state.filmJobId || state.filmResult || state.confirmations.samples) invalidateProduction();
}
async function copyPrompt(field, button) {
  field.focus(); field.select();
  try { await navigator.clipboard.writeText(field.value); }
  catch { document.execCommand('copy'); }
  const original = button.textContent; button.textContent = '已复制，回当前对话发送';
  setTimeout(() => { button.textContent = original; }, 1800);
}
function renderDesignBrief(brief) {
  const entries = [['参考', brief.reference], ['色板', (brief.palette || []).join(' · ')], ['字体角色', brief.typography], ['素材语言', brief.assetLanguage], ['动效性格', brief.motionCharacter], ['重点画面', (brief.keyFrames || []).join('；')]];
  $('#sampleBriefContent').replaceChildren(...entries.map(([label, value]) => {
    const row = document.createElement('div'); const title = document.createElement('b'); title.textContent = label;
    const text = document.createElement('span'); text.textContent = value || '由 Agent 在本期样片中明确'; row.append(title, text); return row;
  }));
  $('#sampleBrief').hidden = false;
}
function showSample(id) {
  const sample = state.sampleResult?.samples.find(item => item.id === id);
  if (!sample) return;
  state.activeSample = id; state.viewedSamples[id] = true;
  $('#sampleFrame').src = sample.previewUrl;
  $('#sampleTitle').textContent = sample.title;
  $('#sampleNarration').textContent = sample.narration;
  $('#sampleSource').textContent = sample.sourceBeatId;
  $('#sampleDuration').textContent = `${sample.duration} 秒`;
  $('#sampleAssets').textContent = (sample.assetIds || []).map(assetId => state.slots.find(slot => slot.id === assetId)?.concept || assetId).join('、') || '抽象图形与文字节点';
  $('#sampleQa').textContent = sample.qa ? `QA：${sample.qa}` : 'QA：等待本期检查摘要';
  $$('.sample-tabs button').forEach(button => {
    const active = button.dataset.sample === id;
    button.classList.toggle('active', active); button.setAttribute('aria-selected', active);
    button.querySelector('small').textContent = state.viewedSamples[button.dataset.sample] ? '已查看' : '未查看';
  });
  updateGateUI();
}
function applyProductionResult(stage, result) {
  if (stage === 'samples') {
    state.sampleResult = result;
    $('#sampleHandoff').hidden = true; $('#sampleWorkspace').hidden = false;
    renderDesignBrief(result.designBrief); showSample('opening');
  } else {
    state.filmResult = result;
    $('#filmHandoff').hidden = true; $('#filmWorkspace').hidden = false;
    $('#filmFrame').src = result.previewUrl;
    $('#filmResultSummary').textContent = `${result.title} · ${result.duration} 秒 · ${result.sceneCount} 个场景。QA：${result.qa || '见本期任务记录'}`;
  }
  updateGateUI();
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let result;
  try { result = JSON.parse(body); }
  catch {
    throw new Error(response.ok
      ? '制作服务返回了无法识别的数据，请重启预览后重试'
      : `制作服务未更新或暂不可用（HTTP ${response.status}），请重启预览后重试`);
  }
  if (!response.ok) throw new Error(result.error || `制作请求失败（HTTP ${response.status}）`);
  return result;
}
function applyMasterResult(result) {
  state.masterResult = result;
  state.masters = Object.fromEntries(result.masters.map(master => {
    const variant = master.variants.find(item => item.id === 'ink') || master.variants[0];
    return [master.slotId, { sourceId: master.sourceId, variant: variant.id, previewUrl: variant.previewUrl, agentJobId: result.jobId, approved: false, version: 1 }];
  }));
  $('#masterHandoff').hidden = true;
  renderMasters(); updateGateUI();
}
async function pollMasterJob(jobId) {
  const token = ++state.masterPoll;
  const check = async () => {
    if (token !== state.masterPoll || state.masterJobId !== jobId) return;
    try {
      const result = await requestJson(`/api/production-jobs/${jobId}`, { cache: 'no-store' });
      if (result.result) { applyMasterResult(result.result); return; }
      setTimeout(check, 2000);
    } catch (error) {
      $('#masterStatus').textContent = `${error.message}。可重新确认参考或稍后刷新。`;
    }
  };
  await check();
}
async function createMasterProduction() {
  if (!(state.confirmations.storyboard && state.confirmations.references) || !allReferencesSelected()) return;
  $('#masterHandoff').hidden = false; $('#masterStatus').textContent = '正在保存已确认参考与本期风格整包…';
  try {
    const result = await requestJson('/api/production-jobs', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stage: 'masters', package: storyboardInput() })
    });
    state.masterJobId = result.jobId; $('#masterPrompt').value = result.prompt;
    $('#masterStatus').textContent = '任务已保存。复制交接提示到当前对话；Agent 真实绘制并回写母版文件后，这里自动显示对照图。';
    updateGateUI(); pollMasterJob(result.jobId);
  } catch (error) {
    $('#masterStatus').textContent = error.message; updateGateUI();
  }
}
async function pollProductionJob(stage, jobId) {
  const token = ++state.productionPoll;
  const check = async () => {
    const currentId = stage === 'samples' ? state.sampleJobId : state.filmJobId;
    if (token !== state.productionPoll || currentId !== jobId) return;
    try {
      const result = await requestJson(`/api/production-jobs/${jobId}`, { cache: 'no-store' });
      if (result.result) { applyProductionResult(stage, result.result); return; }
      setTimeout(check, 2000);
    } catch (error) {
      $(stage === 'samples' ? '#sampleStatus' : '#filmStatus').textContent = `${error.message}。可重新生成任务或稍后刷新。`;
    }
  };
  await check();
}
async function createProduction(stage) {
  const samples = stage === 'samples';
  if (samples && !(state.confirmations.storyboard && state.confirmations.references && state.confirmations.masters)) return;
  if (!samples && !state.confirmations.samples) return;
  if (samples) invalidateProduction();
  else {
    state.productionPoll += 1; state.filmJobId = ''; state.filmResult = null;
    $('#filmWorkspace').hidden = true; $('#filmFrame').removeAttribute('src');
  }
  const handoff = $(samples ? '#sampleHandoff' : '#filmHandoff');
  const status = $(samples ? '#sampleStatus' : '#filmStatus');
  handoff.hidden = false; status.textContent = '正在保存本期制作整包与确认状态…';
  try {
    const packet = storyboardInput();
    if (!samples) packet.sampleResult = state.sampleResult;
    const result = await requestJson('/api/production-jobs', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stage, package: packet })
    });
    if (samples) state.sampleJobId = result.jobId; else state.filmJobId = result.jobId;
    $(samples ? '#samplePrompt' : '#filmPrompt').value = result.prompt;
    status.textContent = samples ? '任务已保存。复制交接提示到当前对话；Agent 只制作本期两段样片，回写后自动显示。' : '任务已保存。复制交接提示到当前对话；Agent 回写完整网页后自动显示。';
    updateGateUI(); pollProductionJob(stage, result.jobId);
  } catch (error) {
    status.textContent = error.message;
    updateGateUI();
  }
}
$$('.sample-tabs button').forEach(button => button.addEventListener('click', () => showSample(button.dataset.sample)));
$('#generateSamples').addEventListener('click', () => createProduction('samples'));
$('#generateFilm').addEventListener('click', () => createProduction('film'));
$('#confirmSamples').addEventListener('click', () => {
  if (!state.sampleResult || !state.viewedSamples.opening || !state.viewedSamples.mechanism) return;
  state.confirmations.samples = true; updateGateUI(); showStep('film');
});
$('#copyMasterPrompt').addEventListener('click', () => copyPrompt($('#masterPrompt'), $('#copyMasterPrompt')));
$('#copySamplePrompt').addEventListener('click', () => copyPrompt($('#samplePrompt'), $('#copySamplePrompt')));
$('#copyFilmPrompt').addEventListener('click', () => copyPrompt($('#filmPrompt'), $('#copyFilmPrompt')));
let draftSaveTimer = 0;
let serverRecovery = null;
function draftSnapshot() {
  return {
    ...state, version: 2, script: $('#scriptInput').value, notes: $('#notesInput').value,
    aspect: $('#aspectInput').value, beats: beatInput(), savedAt: new Date().toISOString()
  };
}
function recoveryDraft(result) {
  if (result.draft) return result.draft;
  const { job, analysis } = result;
  return {
    version: 2, mode: job.mode, style: job.style, profile: job.profile, fidelity: job.fidelity, intensity: job.intensity,
    selections: {}, slots: analysis.assets, masters: {}, currentStep: 'motion', referenceSheet: '', jobId: job.id, analysis,
    masterJobId: '', masterResult: null, sampleJobId: '', filmJobId: '', sampleResult: null, filmResult: null,
    activeSample: 'opening', viewedSamples: { opening: false, mechanism: false },
    confirmations: { storyboard: false, references: false, masters: false, samples: false },
    script: job.script, notes: job.notes || '', aspect: job.aspect, beats: analysis.beats, savedAt: analysis.analyzedAt || job.createdAt
  };
}
function persistDraft(manual = false) {
  if (!state.jobId || !state.analysis) return;
  clearTimeout(draftSaveTimer);
  const draft = draftSnapshot();
  localStorage.setItem('motion-layer-draft', JSON.stringify(draft));
  $('#saveStatus').textContent = manual
    ? '草稿已保存在此浏览器和服务端任务中，可在输入页点击“继续上次草稿”恢复。'
    : `已自动保存 ${new Date().toLocaleTimeString('zh-CN')} · 换端口也可恢复`;
  fetch(`/api/agent-jobs/${state.jobId}/draft`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft)
  }).then(async response => {
    if (!response.ok) throw new Error('服务端草稿保存失败');
    serverRecovery = draft;
  }).catch(error => {
    if (manual) $('#saveStatus').textContent = `${error.message}；已保留浏览器草稿`;
  });
  refreshDraftNotice();
}
function scheduleDraftSave() {
  clearTimeout(draftSaveTimer);
  if (!state.jobId || !state.analysis) return;
  draftSaveTimer = setTimeout(() => persistDraft(false), 400);
}
async function refreshDraftNotice() {
  const notice = $('#draftNotice');
  try {
    let draft = JSON.parse(localStorage.getItem('motion-layer-draft') || 'null');
    let fromServer = false;
    if (!draft) {
      const response = await fetch('/api/agent-jobs/latest', { cache: 'no-store' });
      const result = await response.json();
      serverRecovery = result.result ? recoveryDraft(result.result) : null;
      draft = serverRecovery;
      fromServer = Boolean(draft);
    }
    if (!draft) { notice.hidden = true; return; }
    const savedAt = draft.savedAt ? new Date(draft.savedAt) : null;
    const time = savedAt && !Number.isNaN(savedAt.getTime()) ? `保存于 ${savedAt.toLocaleString('zh-CN')}` : '可继续上次制作进度';
    $('#draftNoticeMeta').textContent = `${time} · ${fromServer ? '从服务端任务跨端口恢复' : '恢复分镜、确认与制作结果'}`;
    $('#loadDraft').disabled = false; notice.hidden = false;
  } catch {
    $('#draftNoticeMeta').textContent = '草稿内容无法读取，请重新开始或清除站点数据';
    $('#loadDraft').disabled = true; notice.hidden = false;
  }
}
function renderRestoredReferences() {
  const summary = document.createElement('section'); summary.className = 'needs-summary';
  const summaryHead = document.createElement('div'); summaryHead.className = 'slot-head';
  summaryHead.innerHTML = '<span class="asset-id">AI</span><div class="slot-title"><b>已恢复本期素材与参考选择</b><p>以下来源、授权和母版选择来自草稿。点击重新找图会重新打开候选，并使下游确认失效。</p></div>';
  const summaryList = document.createElement('div'); summaryList.className = 'needs-list';
  state.slots.forEach(slot => { const item = document.createElement('span'); item.textContent = `${slot.id} ${slot.concept} · ${slot.action}`; summaryList.appendChild(item); });
  summary.append(summaryHead, summaryList);
  const cards = state.slots.map(slot => {
    const selected = state.selections[slot.id];
    const container = document.createElement('article'); container.className = 'element-slot'; container.dataset.slot = slot.id;
    const localOnly = researchRoute(slot) === 'semantic';
    container.innerHTML = `<div class="slot-head"><span class="asset-id">${escapeHtml(slot.code)}</span><div class="slot-title"><b>${escapeHtml(slot.concept)} · ${selected ? '已恢复参考' : '参考待补齐'}</b><p>${selected ? '保留草稿中的来源、授权、拟保留特征与母版选择。' : '草稿中这项选择未完整保存，正在自动补齐候选；其余已选项保持不变。'}</p></div><button class="slot-research" type="button">${localOnly ? '刷新表达方向' : '重新打开候选 ↗'}</button></div><div class="slot-semantics"><label>预期动作<input class="slot-action-input" value="${escapeHtml(slot.action)}"></label><label>联网检索词<input class="slot-query" value="${escapeHtml(slot.query)}" ${localOnly ? 'disabled' : ''}></label></div>`;
    const grid = document.createElement('div'); grid.className = 'candidates';
    const button = container.querySelector('.slot-research');
    container.querySelector('.slot-action-input').addEventListener('input', event => { slot.action = event.target.value; invalidateConfirmations('references'); });
    container.querySelector('.slot-query').addEventListener('input', event => { slot.query = event.target.value; invalidateConfirmations('references'); });
    button.addEventListener('click', () => loadCandidates(slot, grid, button));
    if (selected) {
      const choice = document.createElement('label'); choice.className = 'candidate selected';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `reference-${slot.id}`; radio.checked = true; radio.className = 'candidate-radio';
      const choiceLine = document.createElement('div'); choiceLine.className = 'choice-line';
      const code = document.createElement('span'); code.textContent = selected.choiceId || selected.id;
      const badge = document.createElement('span'); badge.className = 'candidate-badge'; badge.textContent = '已恢复'; choiceLine.append(code, badge);
      const visual = document.createElement('span'); visual.className = 'candidate-visual'; visual.appendChild(assetVisual(selected, slot.concept));
      const name = document.createElement('h3'); name.textContent = selected.name;
      const usage = document.createElement('p'); usage.className = 'candidate-usage'; usage.textContent = `拟保留轮廓、比例与识别特征，用于「${slot.action}」。`;
      const rights = document.createElement('p'); rights.className = 'candidate-rights'; rights.textContent = `${selected.author} · ${selected.license}`;
      choice.append(radio, choiceLine, visual, name, usage, rights);
      const sourceUrl = selected.sourceUrl || selected.svg || selected.image;
      if (sourceUrl) { const source = document.createElement('a'); source.href = sourceUrl; source.target = '_blank'; source.rel = 'noreferrer'; source.textContent = '查看真实资产与来源 ↗'; choice.appendChild(source); }
      grid.appendChild(choice);
    } else {
      grid.className = 'slot-status'; grid.textContent = '正在补齐这一项的候选，其他已选参考不受影响…';
      queueMicrotask(() => loadCandidates(slot, grid, button));
    }
    container.appendChild(grid); return container;
  });
  $('#elementSlots').replaceChildren(summary, ...cards);
}
async function restorePendingMasters() {
  if (!state.masterJobId) return;
  const value = await requestJson(`/api/production-jobs/${state.masterJobId}`, { cache: 'no-store' });
  $('#masterPrompt').value = value.prompt; $('#masterHandoff').hidden = false;
  if (value.result) applyMasterResult(value.result);
  else pollMasterJob(state.masterJobId);
}
async function restorePendingProduction(stage) {
  const samples = stage === 'samples';
  const jobId = samples ? state.sampleJobId : state.filmJobId;
  if (!jobId) return;
  const value = await requestJson(`/api/production-jobs/${jobId}`, { cache: 'no-store' });
  $(samples ? '#samplePrompt' : '#filmPrompt').value = value.prompt;
  $(samples ? '#sampleHandoff' : '#filmHandoff').hidden = false;
  if (value.result) applyProductionResult(stage, value.result);
  else pollProductionJob(stage, jobId);
}
async function loadDraft() {
  const button = $('#loadDraft'); button.disabled = true;
  try {
    const draft = JSON.parse(localStorage.getItem('motion-layer-draft') || 'null') || serverRecovery;
    if (!draft?.analysis || !draft.jobId || !Array.isArray(draft.slots) || !Array.isArray(draft.beats)) throw new Error('草稿缺少分镜或素材数据');
    state.agentPoll += 1; state.masterPoll += 1; state.productionPoll += 1;
    ['mode', 'style', 'profile', 'fidelity', 'intensity', 'selections', 'slots', 'masters', 'referenceSheet', 'jobId', 'analysis', 'masterJobId', 'masterResult', 'sampleJobId', 'filmJobId', 'sampleResult', 'filmResult', 'activeSample'].forEach(key => {
      if (draft[key] !== undefined) state[key] = draft[key];
    });
    state.confirmations = { storyboard: false, references: false, masters: false, samples: false, ...(draft.confirmations || {}) };
    state.viewedSamples = { opening: false, mechanism: false, ...(draft.viewedSamples || {}) };
    if (state.masterResult) {
      if (state.masterResult.jobId !== state.masterJobId || state.masterResult.masters?.length !== state.slots.length) throw new Error('草稿中的 Agent 母版追溯信息不一致');
      state.masterResult.masters.forEach(master => {
        if (!state.masters[master.slotId]?.previewUrl || !master.variants.some(variant => variant.previewUrl === state.masters[master.slotId].previewUrl)) throw new Error('草稿中的 Agent 母版地址无效');
      });
    } else if (state.confirmations.masters || state.sampleResult || state.filmResult) {
      state.confirmations.masters = false; state.confirmations.samples = false;
      state.sampleJobId = ''; state.filmJobId = ''; state.sampleResult = null; state.filmResult = null;
    }
    if (state.sampleResult) {
      if (state.sampleResult.jobId !== state.sampleJobId || state.sampleResult.samples?.length !== 2) throw new Error('草稿中的样片结果追溯信息不一致');
      state.sampleResult.samples.forEach(sample => {
        if (sample.previewUrl !== `/studio/production-jobs/${state.sampleJobId}/${sample.id}/index.html`) throw new Error('草稿中的样片地址无效');
      });
    }
    if (state.filmResult && (state.filmResult.jobId !== state.filmJobId || state.filmResult.previewUrl !== `/studio/production-jobs/${state.filmJobId}/film/index.html`)) throw new Error('草稿中的全片结果追溯信息不一致');
    $('#scriptInput').value = draft.script || '';
    $('#notesInput').value = draft.notes || '';
    if (draft.aspect) $('#aspectInput').value = draft.aspect;
    $$('.mode').forEach(node => { const active = node.dataset.mode === state.mode; node.classList.toggle('active', active); node.setAttribute('aria-selected', active); });
    $$('.style-card').forEach(node => node.classList.toggle('selected', node.dataset.style === state.style));
    $$('.segmented').forEach(group => group.querySelectorAll('button').forEach(node => node.classList.toggle('active', node.dataset.value === state[group.dataset.setting])));
    $('#genericPanel').hidden = state.mode !== 'generic'; $('#productPanel').hidden = state.mode !== 'product'; $('#fidelityGroup').hidden = state.mode !== 'product';
    if (state.mode === 'product' && state.profile) renderProfile(state.profile, false); else $('#productProfile').hidden = true;
    $('#agentHandoff').hidden = true; $('#agentAnalysis').hidden = false;
    $('#analysisSummary').textContent = `${state.analysis.summary} 已从草稿恢复 ${state.analysis.beats.length} 拍分镜与 ${state.analysis.assets.length} 项素材需求。`;
    renderBeatEditor();
    draft.beats.forEach(beat => {
      const row = $(`.beat-row[data-beat="${beat.id}"]`); if (!row) return;
      row.querySelector('[data-field="label"]').value = beat.label;
      row.querySelector('[data-field="action"]').value = beat.action;
      row.querySelector('[data-field="duration"]').value = beat.duration;
    });
    updateBeatSummary(); renderRestoredReferences(); renderMasters();
    $('#referenceSheet').textContent = state.referenceSheet || '选择或语义已变化，请重新生成确认单。';
    $('#masterHandoff').hidden = true;
    $('#sampleHandoff').hidden = true; $('#sampleWorkspace').hidden = true; $('#sampleBrief').hidden = true;
    $('#filmHandoff').hidden = true; $('#filmWorkspace').hidden = true;
    if (state.sampleResult) {
      $('#sampleWorkspace').hidden = false; renderDesignBrief(state.sampleResult.designBrief); showSample(state.activeSample);
    }
    if (state.filmResult) applyProductionResult('film', state.filmResult);
    $('#attachmentList').replaceChildren();
    if (state.jobId) { const item = document.createElement('li'); item.textContent = '本地文件选择不恢复；已上传附件仍保存在原 Agent 任务中'; $('#attachmentList').appendChild(item); }
    updatePreview();
    const desired = draft.currentStep && stepPermissions()[draft.currentStep] ? draft.currentStep : 'direction';
    showStep(desired);
    if (!state.masterResult && state.masterJobId) await restorePendingMasters();
    if (!state.sampleResult && state.sampleJobId) await restorePendingProduction('samples');
    if (!state.filmResult && state.filmJobId) await restorePendingProduction('film');
    $('#saveStatus').textContent = '草稿已恢复，可继续制作；再次保存会覆盖此浏览器中的旧草稿。';
    refreshDraftNotice();
  } catch (error) {
    $('#draftNotice').hidden = false; $('#draftNoticeMeta').textContent = `加载失败：${error.message}`;
    button.disabled = false;
  }
}
$('#saveDraft').addEventListener('click', () => persistDraft(true));
$('#loadDraft').addEventListener('click', loadDraft);
window.addEventListener('pagehide', () => persistDraft(false));
['#scriptInput', '#notesInput', '#aspectInput'].forEach(selector => {
  $(selector).addEventListener('input', () => { resetAgentAnalysis(); markGeneratedStale(); scheduleDraftSave(); });
});
$('#attachmentInput').addEventListener('change', () => {
  resetAgentAnalysis();
  $('#attachmentList').replaceChildren(...[...$('#attachmentInput').files].map(file => {
    const item = document.createElement('li'); item.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`; return item;
  }));
});
updatePreview();
updateGateUI();
refreshDraftNotice();
showStep('direction');
