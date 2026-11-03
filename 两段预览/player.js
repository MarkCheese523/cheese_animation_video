const NS = 'http://www.w3.org/2000/svg';
const W = 1080, H = 1920;
const params = new URLSearchParams(location.search);
const requestedScene = params.get('scene') || 'all';
const sceneName = ['all', 'opening', 'control', 'founders', 'classA', 'allocation', 'classE'].includes(requestedScene) ? requestedScene : 'all';
const scenes = {
  all: { start: 0, duration: 278.784, title: 'A社的F股 · 完整版' },
  opening: { start: 0, duration: 10.23, title: '01 · 50元接通控制权' },
  control: { start: 232.62, duration: 10.48, title: '20 · 50.1%越过控制线' },
  founders: { start: 27.49, duration: 9.48, title: '04 · 创始团队聚合 · 资产变体重做' },
  classA: { start: 128.44, duration: 20.74, title: '13 · A股权利集齐 · 资产变体重做' },
  allocation: { start: 70.92, duration: 6.24, title: '08 · 公司楼宇与股东 · 语义化预览' },
  classE: { start: 204.88, duration: 19.94, title: '18 · 举手投票与董事座椅 · 语义化预览' },
};
const sceneInfo = scenes[sceneName];
const fixed = params.has('t') ? Number(params.get('t')) : null;
const svg = document.getElementById('scene');
const root = document.getElementById('sceneRoot');
let currentRoot = root;
const camera = document.getElementById('camera');
const audio = document.getElementById('audio');
const playButton = document.getElementById('playButton');
const seek = document.getElementById('seek');
const timeLabel = document.getElementById('timeLabel');
const subtitle = document.getElementById('subtitle');
const subtitles = typeof SUBTITLES !== 'undefined' ? SUBTITLES : [];
let seeking = false;
let localTime = fixed === null ? 0 : fixed;

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
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function prog(t, a, b) { return clamp((t - a) / (b - a)); }
function out(x) { return 1 - (1 - x) ** 3; }
function inout(x) { return x * x * (3 - 2 * x); }
function back(x) { const c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; }
function mix(a, b, p) { return a + (b - a) * p; }
function opacity(node, value) { node.setAttribute('opacity', clamp(value)); }
function clock(seconds) { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
function header(index, label) {
  const headerRoot = document.getElementById('headerRoot');
  const group = el('g', {}, headerRoot);
  text(`${index} / ${label}`, { x: 70, y: 100, class: 'mg-num', 'font-size': 30, 'font-weight': 700, 'letter-spacing': 5, fill: '#102a22' }, group);
  el('line', { x1: 70, y1: 142, x2: 1010, y2: 142, stroke: '#102a22', 'stroke-opacity': .25, 'stroke-width': 2 }, group);
  return group;
}
function animateChars(chars, t, start, exitStart, mode = 'rise') {
  chars.forEach((node, index) => {
    const enter = back(prog(t, start + index * .08, start + .55 + index * .08));
    const exit = inout(prog(t, exitStart + index * .025, exitStart + .42 + index * .025));
    opacity(node, clamp(enter) * (1 - exit));
    const direction = index % 2 ? 1 : -1;
    const y = (mode === 'drop' ? mix(-150, 0, enter) : mix(100, 0, enter)) + exit * 80;
    node.setAttribute('transform', `translate(0 ${y}) rotate(${direction * mix(16, 0, enter) + exit * direction * 14}) scale(${mix(.35, 1, enter)} ${mix(1.65, 1, enter)})`);
  });
}

const grid = document.getElementById('grid');
for (let x = 0; x <= W; x += 90) el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#102a22', 'stroke-opacity': .05 }, grid);
for (let y = 0; y <= H; y += 90) el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#102a22', 'stroke-opacity': .05 }, grid);

function buildOpening() {
  header('01', 'SMALL CAPITAL → TOTAL CONTROL');
  const matrix = el('g', { filter: 'url(#shadow)' });
  const cells = [];
  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 12;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000'; ctx.font = '900 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('1T', 8, 6.5);
  const pixels = ctx.getImageData(0, 0, 16, 12).data;
  let index = 0;
  for (let row = 0; row < 12; row++) for (let col = 0; col < 16; col++) {
    if (pixels[(row * 16 + col) * 4 + 3] < 80) continue;
    const i = index++;
    const ix = 555 + col * 27, iy = 315 + row * 40;
    const angle = -Math.PI * .85 + (i / 55) * Math.PI * 2.15;
    const radius = 210 + (i % 4) * 23;
    const cx = 770 + Math.cos(angle) * radius, cy = 700 + Math.sin(angle) * radius;
    const bx = 260 + (i % 8) * 80, by = 1240 + (i % 3) * 145;
    const node = el('rect', { width: 32, height: 32, rx: 7, fill: i % 7 === 0 ? '#c6ff3d' : '#102a22' }, matrix);
    cells.push({ node, i, ix, iy, cx, cy, bx, by, badge: i % 3 === 0, seed: Math.sin(i * 91.7) * 100 });
  }

  const trillionGhost = text('1T', { x: 770, y: 790, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 300, 'font-weight': 900, fill: 'none', stroke: '#102a22', 'stroke-width': 4 });
  const trillionLabel = text('万亿美元公司', { x: 770, y: 260, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 42, 'letter-spacing': 8, fill: '#102a22' });

  const person = el('g', {});
  el('image', { href: '../assets/library/person-dario-amodei/master.png', x: 0, y: 0, width: 430, height: 538, preserveAspectRatio: 'xMidYMid meet' }, person);
  el('path', { d: 'M18 548H400', fill: 'none', stroke: '#102a22', 'stroke-width': 3, 'stroke-dasharray': '7 12' }, person);
  text('DARIO / 达里奥', { x: 20, y: 594, class: 'mg-num', 'font-size': 31, 'font-weight': 800, 'letter-spacing': 4, fill: '#102a22' }, person);

  const darioChars = ['达', '里', '奥'].map((value, i) => text(value, { x: 105 + i * 130, y: 1000, class: 'mg-text dario-char', 'font-size': 94, fill: '#102a22' }));
  const lostChars = ['钱', '包', '丢', '了'].map((value, i) => text(value, { x: 62 + i * 112, y: 1090, class: 'mg-text lost-char', 'font-size': 62, fill: '#102a22' }));

  const controlPathD = 'M250 1280 C80 1110 250 960 480 990 C720 1010 940 870 770 700';
  const controlPathGhost = el('path', { d: controlPathD, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 46, 'stroke-linecap': 'round', filter: 'url(#softGlow)' });
  const controlPath = el('path', { d: controlPathD, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 12, 'stroke-linecap': 'round' });
  const pathLength = controlPath.getTotalLength();
  [controlPath, controlPathGhost].forEach(path => { path.style.strokeDasharray = pathLength; path.style.strokeDashoffset = pathLength; });
  const traveler = el('circle', { cx: 250, cy: 1280, r: 12, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 });

  const core = el('g', {});
  el('circle', { cx: 770, cy: 700, r: 112, fill: '#102a22', stroke: '#c6ff3d', 'stroke-width': 8 }, core);
  el('circle', { cx: 770, cy: 700, r: 84, fill: 'none', stroke: '#c6ff3d', 'stroke-opacity': .4, 'stroke-width': 3, 'stroke-dasharray': '7 12' }, core);
  text('ON', { x: 770, y: 722, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 50, 'font-weight': 800, fill: '#c6ff3d' }, core);

  const controlChars = [...'CONTROL'].map((value, i) => text(value, { x: 440 + i * 78, y: 1110, class: 'mg-num control-char', 'font-size': 62, 'font-weight': 800, fill: '#102a22' }));
  const fifty = el('g', { class: 'mg-num', 'text-anchor': 'middle' });
  text('50', { x: 0, y: 0, 'font-size': 160, 'font-weight': 900, fill: '#102a22' }, fifty);
  text('¥', { x: -112, y: -12, 'font-size': 70, 'font-weight': 800, fill: '#102a22' }, fifty);

  const claude = el('g', { filter: 'url(#shadow)' });
  const panelD = 'M-400-155H330L400-85V145H-330L-400 75Z';
  const claudeEcho = el('path', { d: panelD, transform: 'translate(12 14)', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 12, 'stroke-linejoin': 'round' }, claude);
  const claudePanel = el('path', { d: panelD, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5, 'stroke-linejoin': 'round' }, claude);
  const claudeContent = el('g', {}, claude);
  text('回头送你', { x: -340, y: -102, class: 'mg-text claude-char', 'font-size': 31, fill: '#102a22' }, claudeContent);
  text('MEMBER ACCESS / 001', { x: 330, y: -104, 'text-anchor': 'end', class: 'mg-num claude-char', 'font-size': 21, 'font-weight': 700, 'letter-spacing': 3, fill: '#52635c' }, claudeContent);
  el('line', { x1: -340, y1: -74, x2: 330, y2: -74, stroke: '#102a22', 'stroke-opacity': .22, 'stroke-width': 2 }, claudeContent);
  el('image', { href: '../assets/library/brand-claude/master.svg', x: -330, y: -45, width: 170, height: 170, preserveAspectRatio: 'xMidYMid meet', class: 'claude-char' }, claudeContent);
  text('Claude', { x: -125, y: 40, class: 'mg-num claude-char', 'font-size': 90, 'font-weight': 800, fill: '#102a22' }, claudeContent);
  text('会员账号', { x: -120, y: 103, class: 'mg-text claude-char', 'font-size': 29, 'letter-spacing': 9, fill: '#52635c' }, claudeContent);
  const scan = el('line', { x1: -355, y1: 0, x2: 355, y2: 0, stroke: '#ff6b57', 'stroke-width': 5, opacity: 0 }, claude);

  const finalMark = el('g', {});
  el('line', { x1: 230, y1: 1690, x2: 850, y2: 1690, stroke: '#102a22', 'stroke-width': 3 }, finalMark);
  text('50元 → 控制权', { x: 540, y: 1770, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 54, 'letter-spacing': 8, fill: '#102a22' }, finalMark);

  return function render(t) {
    let scale = mix(1.18, 1.02, out(prog(t, 0, .66))), cx = 540, cy = 790;
    if (t >= 4.08 && t < 7.36) { const p = inout(prog(t, 4.08, 7.36)); scale = mix(1.02, 1.15, p); cx = mix(540, 650, p); cy = mix(790, 830, p); }
    if (t >= 7.36) { const p = inout(prog(t, 7.36, 9.65)); scale = mix(1.15, .95, p); cx = mix(650, 540, p); cy = mix(830, 900, p); }
    camera.setAttribute('transform', `translate(540 960) scale(${scale}) translate(${-cx} ${-cy})`);

    cells.forEach(cell => {
      const enter = out(prog(t, cell.i * .006, .75 + cell.i * .006));
      const morph = inout(prog(t, 4.08 + (cell.i % 9) * .05, 6.72 + (cell.i % 9) * .05));
      const badge = inout(prog(t, 7.36 + (cell.i % 6) * .05, 8.25 + (cell.i % 6) * .05));
      let x = mix(cell.ix + cell.seed * 2, cell.ix, enter), y = mix(cell.iy - 480 - cell.seed * 2, cell.iy, enter);
      x = mix(x, cell.cx, morph); y = mix(y, cell.cy, morph);
      if (cell.badge) { x = mix(x, cell.bx, badge); y = mix(y, cell.by, badge); }
      const flip = Math.sin(morph * Math.PI), width = 34 * (1 - flip * .65), height = 34 * (1 + flip * .45);
      cell.node.setAttribute('x', x - width / 2); cell.node.setAttribute('y', y - height / 2);
      cell.node.setAttribute('width', Math.max(2, width)); cell.node.setAttribute('height', height);
      cell.node.setAttribute('transform', `rotate(${morph * 180 + badge * 45} ${x} ${y})`);
      cell.node.setAttribute('fill', morph > .45 && cell.i % 3 === 0 ? '#c6ff3d' : '#102a22');
      opacity(cell.node, enter * (cell.badge ? 1 - badge * .7 : 1 - badge * .35));
    });
    opacity(trillionGhost, .1 * (1 - prog(t, 4.08, 5.4)));
    opacity(trillionLabel, prog(t, .25, .75) * (1 - prog(t, 6.8, 7.3)));
    const personIn = back(prog(t, .15, .95)), personShift = inout(prog(t, 4.08, 5.2));
    person.setAttribute('transform', `translate(${mix(65, 15, personShift)} ${mix(315, 290, personIn)}) scale(${mix(.78, 1, personIn) * mix(1, .82, personShift)})`);
    opacity(person, clamp(personIn) * mix(1, .72, personShift));
    animateChars(darioChars, t, .66, 3.72);
    animateChars(lostChars, t, 1.0, 3.72, 'drop');

    const fiftyIn = back(prog(t, .35, 1.05)), fiftyMorph = inout(prog(t, 4.08, 5.1));
    fifty.setAttribute('transform', `translate(${mix(250, 310, fiftyMorph)} ${mix(1280, 1180, fiftyMorph)}) scale(${mix(.3, 1, fiftyIn) * (1 + fiftyMorph * 2.2)} ${mix(1.8, 1, fiftyIn) * (1 - fiftyMorph * .72)}) rotate(${mix(-16, 0, fiftyIn) + fiftyMorph * 62})`);
    opacity(fifty, clamp(fiftyIn) * (1 - prog(t, 4.7, 5.35)));
    const draw = out(prog(t, 4.68, 6.82));
    controlPath.style.strokeDashoffset = pathLength * (1 - draw); controlPathGhost.style.strokeDashoffset = pathLength * (1 - draw);
    opacity(controlPath, prog(t, 4.45, 4.75)); opacity(controlPathGhost, prog(t, 4.45, 4.75) * .22);
    const point = controlPath.getPointAtLength(pathLength * draw);
    traveler.setAttribute('cx', point.x); traveler.setAttribute('cy', point.y); traveler.setAttribute('r', 9 + 9 * Math.sin(draw * Math.PI));
    opacity(traveler, prog(t, 4.68, 4.9) * (1 - prog(t, 6.72, 6.92)));
    const coreIn = back(prog(t, 6.15, 6.85));
    core.setAttribute('transform', `translate(770 700) scale(${coreIn}) translate(-770 -700)`); opacity(core, clamp(coreIn));
    controlChars.forEach((node, i) => { const p = back(prog(t, 5.82 + i * .07, 6.42 + i * .07)); opacity(node, clamp(p)); node.setAttribute('transform', `translate(0 ${mix(55, 0, p)}) scale(${mix(.5, 1, p)} ${mix(1.5, 1, p)})`); });

    const badgeIn = back(prog(t, 7.36, 8.12)), panelOpen = out(prog(t, 7.36, 7.94));
    claude.setAttribute('transform', `translate(540 1380) scale(${mix(.2, 1, badgeIn)} ${mix(1.6, 1, badgeIn)}) rotate(${mix(-10, 0, badgeIn)})`); opacity(claude, clamp(badgeIn));
    claudePanel.setAttribute('transform', `scale(${mix(.08, 1, panelOpen)} 1)`); claudeEcho.setAttribute('transform', `translate(12 14) scale(${mix(.08, 1, panelOpen)} 1)`);
    [...claudeContent.querySelectorAll('.claude-char')].forEach((node, i) => { const p = back(prog(t, 7.65 + i * .04, 8.2 + i * .04)); opacity(node, clamp(p)); });
    const scanP = inout(prog(t, 8.18, 9.22)); scan.setAttribute('transform', `translate(0 ${mix(-160, 155, scanP)}) rotate(-7)`); opacity(scan, Math.sin(scanP * Math.PI) * .75);
    opacity(finalMark, prog(t, 9.15, 9.65));
  };
}

function buildControl() {
  header('20', 'ONE SHARE → COMPANY CONTROL');
  const ghost = text('50.1', { x: 540, y: 700, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 330, 'font-weight': 900, fill: 'none', stroke: '#102a22', 'stroke-width': 4, opacity: .08 });
  const orbit = el('g', {});
  el('circle', { cx: 540, cy: 475, r: 245, fill: 'none', stroke: '#102a22', 'stroke-opacity': .1, 'stroke-width': 3, 'stroke-dasharray': '8 20' }, orbit);
  el('circle', { cx: 540, cy: 475, r: 190, fill: 'none', stroke: '#c6ff3d', 'stroke-opacity': .32, 'stroke-width': 4, 'stroke-dasharray': '3 18' }, orbit);
  const fNode = el('g', { filter: 'url(#shadow)' });
  el('circle', { cx: 540, cy: 475, r: 125, fill: '#102a22', stroke: '#c6ff3d', 'stroke-width': 8 }, fNode);
  el('circle', { cx: 540, cy: 475, r: 99, fill: 'url(#greenDots)', stroke: '#c6ff3d', 'stroke-opacity': .4, 'stroke-width': 3 }, fNode);
  text('F', { x: 540, y: 515, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 138, 'font-weight': 900, fill: '#f4f0e6' }, fNode);
  const shareLabel = text('1 F SHARE', { x: 540, y: 690, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 35, 'font-weight': 800, 'letter-spacing': 8, fill: '#102a22' });

  const connectorD = 'M540 600 C540 730 360 710 360 820 C360 900 540 890 540 990';
  const connector = el('path', { d: connectorD, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 10, 'stroke-linecap': 'round' });
  const connectorLength = connector.getTotalLength(); connector.style.strokeDasharray = connectorLength; connector.style.strokeDashoffset = connectorLength;

  const counter = text('00.0%', { x: 540, y: 875, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 170, 'font-weight': 900, fill: '#102a22' });
  const counterLabel = text('全公司投票权', { x: 540, y: 935, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 36, 'letter-spacing': 12, fill: '#52635c' });
  const track = el('line', { x1: 140, y1: 1030, x2: 940, y2: 1030, stroke: '#102a22', 'stroke-opacity': .14, 'stroke-width': 30, 'stroke-linecap': 'round' });
  const midpoint = el('g', {});
  el('line', { x1: 540, y1: 970, x2: 540, y2: 1090, stroke: '#ff6b57', 'stroke-width': 5 }, midpoint);
  text('50%', { x: 540, y: 1135, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 29, 'font-weight': 800, fill: '#ff6b57' }, midpoint);
  const progressGlow = el('line', { x1: 140, y1: 1030, x2: 140, y2: 1030, stroke: '#c6ff3d', 'stroke-width': 44, 'stroke-linecap': 'round', filter: 'url(#softGlow)' });
  const progress = el('line', { x1: 140, y1: 1030, x2: 140, y2: 1030, stroke: '#c6ff3d', 'stroke-width': 24, 'stroke-linecap': 'round' });
  const traveler = el('circle', { cx: 140, cy: 1030, r: 18, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 });
  const particles = [];
  for (let i = 0; i < 42; i++) {
    const node = el('circle', { r: 3 + i % 4, fill: i % 9 === 0 ? '#c6ff3d' : '#102a22' });
    particles.push({ node, i, x: 145 + (i * 83) % 790, y: 970 + (i * 47) % 130 });
  }

  const controlPanel = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M140 1210H910L950 1250V1570H170L140 1540Z', fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 }, controlPanel);
  el('path', { d: 'M140 1210H910L950 1250V1570H170L140 1540Z', fill: 'url(#dotFill)', opacity: .09 }, controlPanel);
  el('image', { href: '../assets/library/brand-anthropic/master.svg', x: 250, y: 1270, width: 580, height: 70, preserveAspectRatio: 'xMidYMid meet' }, controlPanel);
  const off = text('CONTROL / OFF', { x: 540, y: 1455, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 78, 'font-weight': 900, 'letter-spacing': 6, fill: '#a6aaa4' }, controlPanel);
  const on = text('CONTROL / ON', { x: 540, y: 1455, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 86, 'font-weight': 900, 'letter-spacing': 6, fill: '#102a22' }, controlPanel);
  const controlChinese = text('控制权', { x: 540, y: 1540, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 62, 'letter-spacing': 20, fill: '#102a22' }, controlPanel);
  const controlLines = el('g', {});
  const leftLine = el('path', { d: 'M540 1160 C420 1160 280 1140 230 1210', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 9 }, controlLines);
  const rightLine = el('path', { d: 'M540 1160 C660 1160 800 1140 850 1210', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 9 }, controlLines);
  [leftLine, rightLine].forEach(path => { const length = path.getTotalLength(); path.style.strokeDasharray = length; path.style.strokeDashoffset = length; });
  const finalMark = text('1 F  /  50.1%  /  ANTHROPIC CONTROL', { x: 540, y: 1720, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 31, 'font-weight': 800, 'letter-spacing': 5, fill: '#102a22' });

  return function render(t) {
    const cross = inout(prog(t, 5.86, 6.65));
    let scale = mix(1.1, 1, out(prog(t, 0, .7)));
    if (t > 5.5) scale = 1 + Math.sin(prog(t, 5.5, 8.8) * Math.PI) * .07;
    camera.setAttribute('transform', `translate(540 960) scale(${scale}) translate(-540 -900)`);
    opacity(ghost, .07 + cross * .05);
    orbit.setAttribute('transform', `rotate(${t * 13} 540 475)`);
    const fIn = back(prog(t, 0, .75));
    fNode.setAttribute('transform', `translate(0 ${mix(-320, 0, fIn)}) scale(${mix(.4, 1, fIn)})`); opacity(fNode, clamp(fIn));
    opacity(shareLabel, prog(t, .45, .9));
    const draw = out(prog(t, .55, 1.6)); connector.style.strokeDashoffset = connectorLength * (1 - draw); opacity(connector, prog(t, .45, .75));

    let value = 0;
    if (t >= 1 && t < 3.7) value = 49.8 * out(prog(t, 1, 3.7));
    else if (t >= 3.7 && t < 5.55) value = mix(49.8, 50, inout(prog(t, 3.7, 5.55)));
    else if (t >= 5.55 && t < 5.86) value = 50;
    else if (t >= 5.86) value = mix(50, 50.1, cross);
    const x = 140 + value / 100 * 800;
    counter.textContent = `${value.toFixed(1)}%`;
    progress.setAttribute('x2', x); progressGlow.setAttribute('x2', x); traveler.setAttribute('cx', x);
    opacity(progress, prog(t, .85, 1.05)); opacity(progressGlow, prog(t, .85, 1.05) * .25); opacity(traveler, prog(t, .85, 1.05));
    traveler.setAttribute('r', 16 + cross * 14 + Math.sin(t * 5) * 2);
    midpoint.setAttribute('transform', `translate(0 ${Math.sin(t * 3) * (t > 3.7 && t < 6.6 ? 4 : 0)})`);
    particles.forEach(particle => {
      const appear = prog(t, 1.1 + particle.i * .015, 1.8 + particle.i * .015);
      const stream = inout(prog(t, 6.2 + (particle.i % 7) * .05, 8 + (particle.i % 7) * .05));
      const px = mix(particle.x, 540 + Math.cos(particle.i) * 320, stream);
      const py = mix(particle.y, 1220 + (particle.i % 6) * 52, stream);
      particle.node.setAttribute('cx', px); particle.node.setAttribute('cy', py); opacity(particle.node, appear * .42 * (1 - stream * .45));
    });
    opacity(controlPanel, prog(t, 1.1, 1.8));
    opacity(off, prog(t, 1.3, 1.8) * (1 - prog(t, 6.15, 6.55)));
    opacity(on, prog(t, 6.25, 6.65));
    on.setAttribute('transform', `scale(${mix(.78, 1, back(prog(t, 6.25, 6.75)))})`); opacity(controlChinese, prog(t, 6.7, 7.3));
    [leftLine, rightLine].forEach(path => { const length = path.getTotalLength(); path.style.strokeDashoffset = length * (1 - out(prog(t, 6.65, 8.05))); });
    opacity(controlLines, prog(t, 6.55, 6.85)); opacity(finalMark, prog(t, 8.4, 9.15));
  };
}

const renderScene = sceneName === 'all'
  ? buildFullScene()
  : sceneName === 'control'
    ? buildControl()
    : sceneName === 'founders'
      ? buildFoundersRedesign()
      : sceneName === 'classA'
        ? buildClassARedesign()
        : sceneName === 'allocation'
          ? buildRightsAllocationPremium()
          : sceneName === 'classE'
            ? buildClassEPremium()
            : buildOpening();
document.title = `${sceneInfo.title} · 点阵 MG ${sceneName === 'all' ? '完整版' : '预览'}`;

function currentTime() { return fixed === null ? localTime : fixed; }
function update() {
  if (fixed === null && !seeking && !audio.paused) {
    localTime = clamp(audio.currentTime - sceneInfo.start, 0, sceneInfo.duration);
    if (audio.currentTime >= sceneInfo.start + sceneInfo.duration) {
      audio.pause(); localTime = sceneInfo.duration;
    }
  }
  const current = currentTime();
  if (!seeking) seek.value = String(current / sceneInfo.duration * 1000);
  timeLabel.textContent = `${clock(current)} / ${clock(sceneInfo.duration)}`;
  const milliseconds = (sceneInfo.start + current) * 1000;
  const active = subtitles.find(item => milliseconds >= item.a && milliseconds < item.b);
  subtitle.textContent = active ? active.t : '';
  renderScene(clamp(current, 0, sceneInfo.duration));
  requestAnimationFrame(update);
}
async function togglePlay() {
  if (audio.paused) {
    if (localTime >= sceneInfo.duration - .03 || audio.currentTime < sceneInfo.start || audio.currentTime >= sceneInfo.start + sceneInfo.duration) localTime = 0;
    audio.currentTime = sceneInfo.start + localTime;
    try { await audio.play(); } catch (error) { console.error('播放失败', error); }
  } else audio.pause();
}
playButton.addEventListener('click', togglePlay);
audio.addEventListener('play', () => { playButton.textContent = '暂停'; });
audio.addEventListener('pause', () => { playButton.textContent = localTime >= sceneInfo.duration - .03 ? '重播' : '播放'; });
seek.addEventListener('pointerdown', () => { seeking = true; });
seek.addEventListener('input', () => {
  localTime = Number(seek.value) / 1000 * sceneInfo.duration;
  audio.currentTime = sceneInfo.start + localTime;
  renderScene(localTime);
});
seek.addEventListener('change', () => { seeking = false; });
document.addEventListener('keydown', event => { if (event.code === 'Space' && event.target.tagName !== 'INPUT') { event.preventDefault(); togglePlay(); } });
window.__mgSeek = seconds => { localTime = clamp(seconds, 0, sceneInfo.duration); renderScene(localTime); };
window.__pageReady = document.fonts.ready.then(() => { renderScene(currentTime()); return true; });
update();
