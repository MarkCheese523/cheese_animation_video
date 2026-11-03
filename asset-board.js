const NS = 'http://www.w3.org/2000/svg';
const FULL_COLORS = {
  ink: '#102a22', paper: '#f4f0e6', green: '#c6ff3d', orange: '#ff6b57',
  gray: '#a6aaa4', blue: '#72b7ff', purple: '#b99aff', yellow: '#ffd166',
  A: '#c6ff3d', N: '#72b7ff', T: '#ffd166', E: '#ff6b57', F: '#c6ff3d',
};
let currentRoot = null;
let semanticAssetSerial = 0;

function el(name, attrs = {}, parent = currentRoot) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  parent.appendChild(node);
  return node;
}

function text(value, attrs = {}, parent = currentRoot) {
  const node = el('text', attrs, parent);
  node.textContent = value;
  return node;
}

function mountSemanticAsset(svg) {
  currentRoot = svg;
  const serial = ++semanticAssetSerial;
  const ids = { shadow: `shadow-${serial}`, dotFill: `dotFill-${serial}`, greenDots: `greenDots-${serial}` };
  const defs = el('defs');
  const shadow = el('filter', { id: ids.shadow, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  el('feDropShadow', { dx: 0, dy: 12, stdDeviation: 10, 'flood-color': FULL_COLORS.ink, 'flood-opacity': .18 }, shadow);
  const dots = el('pattern', { id: ids.dotFill, width: 24, height: 24, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 6, cy: 6, r: 2.8, fill: FULL_COLORS.ink }, dots);
  el('circle', { cx: 18, cy: 18, r: 2.2, fill: FULL_COLORS.ink }, dots);
  const greenDots = el('pattern', { id: ids.greenDots, width: 22, height: 22, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 6, cy: 6, r: 2.8, fill: FULL_COLORS.green }, greenDots);
  el('circle', { cx: 17, cy: 17, r: 2, fill: FULL_COLORS.green, opacity: .55 }, greenDots);

  const stage = el('g');
  currentRoot = stage;
  const kind = svg.dataset.semantic;
  const builders = {
    generic: () => saGenericFigure(),
    shareholder: () => saShareholderFigure(1, FULL_COLORS.green),
    company: () => saCompanyBuilding(),
    institution: () => saInstitutionBuilding('INST', '机构建筑', FULL_COLORS.T),
    fund: () => saInstitutionBuilding('FUND', '公益基金', FULL_COLORS.purple),
    trust: () => saInstitutionBuilding('LTBT', '长期利益信托', FULL_COLORS.T),
    voting: () => saVotingAssembly(),
    chair: () => saDirectorChair(),
    vote: () => saVoteMark('投票权', FULL_COLORS.green),
  };
  if (!builders[kind]) throw new Error(`未知语义资产：${kind}`);
  const asset = builders[kind]();
  const defaults = {
    generic: [.9, 190], shareholder: [.8, 180], company: [.55, 185],
    institution: [.48, 185], fund: [.43, 172], trust: [.43, 172],
    voting: [.58, 165], chair: [.75, 175], vote: [.95, 170],
  };
  const [defaultScale, defaultY] = defaults[kind];
  const scale = Number(svg.dataset.scale || defaultScale);
  const y = Number(svg.dataset.y || defaultY);
  asset.setAttribute('transform', `translate(180 ${y}) scale(${scale})`);
  svg.querySelectorAll('*').forEach(node => {
    ['fill', 'filter', 'stroke', 'clip-path', 'mask'].forEach(attribute => {
      const value = node.getAttribute(attribute);
      if (!value) return;
      const scoped = value.replace(/url\(#(shadow|dotFill|greenDots)\)/g, (_, id) => `url(#${ids[id]})`);
      if (scoped !== value) node.setAttribute(attribute, scoped);
    });
  });
  svg.dataset.semanticReady = 'true';
  currentRoot = null;
}

function mountSemanticBoard() {
  document.querySelectorAll('svg[data-semantic]').forEach(mountSemanticAsset);
  document.documentElement.dataset.semanticBoardReady = 'true';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountSemanticBoard, { once: true });
else mountSemanticBoard();
