const FULL_SCENES = [
  { id: '01', start: 0, end: 10.23, build: () => buildOpening() },
  { id: '02', start: 10.23, end: 17.79, build: () => buildDoubtPremium() },
  { id: '03', start: 17.79, end: 27.49, build: () => buildReversalPremium() },
  { id: '04', start: 27.49, end: 36.97, build: () => buildFoundersRedesign() },
  { id: '05', start: 36.97, end: 46.79, build: () => buildShareTypesPremium() },
  { id: '06', start: 46.79, end: 57.49, build: () => buildRightsSplitPremium() },
  { id: '07', start: 57.49, end: 70.92, build: () => buildRightsTranslationPremium() },
  { id: '08', start: 70.92, end: 77.16, build: () => buildRightsAllocationPremium() },
  { id: '09', start: 77.16, end: 87.96, build: () => buildFinancingPremium() },
  { id: '10', start: 87.96, end: 102.42, build: () => buildDeadlockPremium() },
  { id: '11', start: 102.42, end: 108.2, build: () => buildUntanglePremium() },
  { id: '12', start: 108.2, end: 128.44, build: () => buildFiveClassesPremium() },
  { id: '13', start: 128.44, end: 149.18, build: () => buildClassARedesign() },
  { id: '14', start: 149.18, end: 162.1, build: () => buildClassNPremium() },
  { id: '15', start: 162.1, end: 173.68, build: () => buildPartnerNetworkPremium() },
  { id: '16', start: 173.68, end: 189.75, build: () => buildClassTPremium() },
  { id: '17', start: 189.75, end: 204.88, build: () => buildTrustPremium() },
  { id: '18', start: 204.88, end: 224.82, build: () => buildClassEPremium() },
  { id: '19', start: 224.82, end: 232.62, build: () => buildMergeFPremium() },
  { id: '20', start: 232.62, end: 243.1, build: () => buildControl() },
  { id: '21', start: 243.1, end: 258.82, build: () => buildStripRightsPremium() },
  { id: '22', start: 258.82, end: 270.34, build: () => buildCapitalContrastPremium() },
  { id: '23', start: 270.34, end: 278.784, build: () => buildRemainderPremium() },
];

const FULL_COLORS = {
  ink: '#102a22', paper: '#f4f0e6', green: '#c6ff3d', orange: '#ff6b57',
  gray: '#a6aaa4', blue: '#75bfff', yellow: '#ffd166', pink: '#ff9ebb', purple: '#b9a7ff',
  A: '#c6ff3d', N: '#75bfff', T: '#ffd166', F: '#f4f0e6', E: '#ff9ebb',
};

function fullCamera(t, zoom = 1, cy = 960) {
  camera.setAttribute('transform', `translate(540 960) scale(${zoom}) translate(-540 ${-cy})`);
}
function fullPlace(node, x, y, scale = 1, rotate = 0) {
  node.setAttribute('transform', `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`);
}
function fullNode(label, x, y, r = 76, color = FULL_COLORS.green, sub = '') {
  const group = el('g', { filter: 'url(#shadow)' });
  el('circle', { cx: 0, cy: 0, r, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 7 }, group);
  el('circle', { cx: 0, cy: 0, r: r - 15, fill: 'url(#greenDots)', opacity: color === FULL_COLORS.green ? .34 : .12 }, group);
  const main = text(label, { x: 0, y: r * .23, 'text-anchor': 'middle', class: label.length > 3 ? 'mg-text' : 'mg-num', 'font-size': label.length > 3 ? r * .42 : r * 1.05, 'font-weight': 900, fill: color }, group);
  if (sub) text(sub, { x: 0, y: r + 42, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 28, 'letter-spacing': 3, fill: FULL_COLORS.ink }, group);
  group.x = x; group.y = y; group.label = main;
  fullPlace(group, x, y);
  return group;
}
function fullTag(label, x, y, width = 250, color = FULL_COLORS.ink, fontSize = 32) {
  const group = el('g', {});
  el('rect', { x: -width / 2, y: -35, width, height: 70, rx: 18, fill: '#fffdf7', stroke: color, 'stroke-width': 3 }, group);
  const labelColor = [FULL_COLORS.green, FULL_COLORS.yellow, FULL_COLORS.paper].includes(color) ? FULL_COLORS.ink : color;
  text(label, { x: 0, y: 10, 'text-anchor': 'middle', class: /[A-Za-z0-9%$¥.]/.test(label) ? 'mg-num' : 'mg-text', 'font-size': fontSize, 'font-weight': 800, fill: labelColor }, group);
  group.x = x; group.y = y;
  fullPlace(group, x, y);
  return group;
}
function fullStroke(d, color = FULL_COLORS.green, width = 9, dash = '') {
  const common = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const base = el('path', { ...common, stroke: FULL_COLORS.ink, 'stroke-width': width + Math.max(4, width * .55), opacity: .14 });
  const node = el('path', { ...common, stroke: color, 'stroke-width': width, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const sheen = el('path', { ...common, stroke: FULL_COLORS.paper, 'stroke-width': Math.max(1.2, width * .16), opacity: color === FULL_COLORS.paper ? 0 : .48 });
  const length = node.getTotalLength();
  return { node, base, sheen, layers: [base, node, sheen], length };
}
function fullDraw(line, value, visible = 1) {
  const p = clamp(value);
  (line.layers || [line.node]).forEach(layer => {
    layer.style.strokeDasharray = line.length;
    layer.style.strokeDashoffset = line.length * (1 - p);
  });
  if (line.base) opacity(line.base, visible * .14);
  opacity(line.node, visible);
  if (line.sheen) opacity(line.sheen, visible * (line.node.getAttribute('stroke') === FULL_COLORS.paper ? 0 : .48));
}
function fullTraveler(line, color = FULL_COLORS.green, r = 13) {
  const node = el('circle', { r, fill: '#fffdf7', stroke: color, 'stroke-width': 6 });
  return { node, line };
}
function fullMoveTraveler(item, value, visible = 1) {
  const p = clamp(value);
  const point = item.line.node.getPointAtLength(item.line.length * p);
  item.node.setAttribute('cx', point.x); item.node.setAttribute('cy', point.y);
  opacity(item.node, visible);
}
function fullLogo(name, x, y, width, height) {
  return el('image', { href: `../assets/library/brand-${name}/master.svg`, x, y, width, height, preserveAspectRatio: 'xMidYMid meet' });
}
function fullCaption(label, y = 1690, color = FULL_COLORS.ink) {
  return text(label, { x: 540, y, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 48, 'font-weight': 700, 'letter-spacing': 6, fill: color });
}
function fullPanel(x, y, width, height, color = FULL_COLORS.ink) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = `M${x} ${y}H${x + width - 30}L${x + width} ${y + 30}V${y + height}H${x + 30}L${x} ${y + height - 30}Z`;
  el('path', { d, transform: 'translate(10 12)', fill: FULL_COLORS.ink, opacity: .14 }, group);
  el('path', { d, fill: '#fffdf7', stroke: color, 'stroke-width': 4 }, group);
  el('path', { d: `M${x + 16} ${y + 16}H${x + width - 42}M${x + 42} ${y + height - 16}H${x + width - 16}`, fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: .2 }, group);
  for (const px of [x + 22, x + width - 22]) for (const py of [y + 22, y + height - 22]) {
    el('circle', { cx: px, cy: py, r: 3, fill: color, opacity: .42 }, group);
  }
  return group;
}
function fullReveal(node, t, start, duration = .65) {
  const p = back(prog(t, start, start + duration));
  opacity(node, clamp(p));
  return p;
}
function buildDoubt() {
  header('02', 'THURSDAY → WAIT, WHY ¥50?');
  const ghost = text('?', { x: 790, y: 1050, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 900, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 5, opacity: .07 });
  const ad = fullPanel(150, 290, 780, 310);
  text('TODAY / 星期四', { x: 205, y: 365, class: 'mg-num', 'font-size': 28, 'font-weight': 800, 'letter-spacing': 5, fill: FULL_COLORS.gray }, ad);
  text('某基广告？', { x: 540, y: 505, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 92, fill: FULL_COLORS.ink }, ad);
  const stamp = el('g', {});
  el('rect', { x: -190, y: -62, width: 380, height: 124, rx: 10, fill: FULL_COLORS.paper, stroke: FULL_COLORS.orange, 'stroke-width': 10 }, stamp);
  text('THURSDAY', { x: 0, y: 18, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 54, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.orange }, stamp);
  const fifty = el('g', { filter: 'url(#shadow)' });
  el('circle', { cx: 0, cy: 0, r: 210, fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 10 }, fifty);
  text('¥50', { x: 0, y: 55, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 170, 'font-weight': 900, fill: FULL_COLORS.green }, fifty);
  const questions = [];
  for (let i = 0; i < 9; i++) {
    const node = text('?', { 'text-anchor': 'middle', class: 'mg-num', 'font-size': 95 + (i % 3) * 25, 'font-weight': 900, fill: i % 3 === 0 ? FULL_COLORS.orange : FULL_COLORS.ink });
    const angle = -Math.PI * .85 + i * Math.PI * 1.7 / 8;
    questions.push({ node, angle, radius: 340 + (i % 3) * 100 });
  }
  const caption = fullCaption('50元，凭什么？', 1730);
  return t => {
    fullCamera(t, mix(1, 1.1, inout(prog(t, 2.3, 6.8))), mix(960, 1060, prog(t, 2.3, 6.8)));
    const stampIn = back(prog(t, .05, .65));
    fullPlace(stamp, 540, mix(90, 465, stampIn), mix(2.4, 1, stampIn), mix(-28, -9, stampIn)); opacity(stamp, clamp(stampIn));
    ad.setAttribute('transform', `translate(0 ${Math.sin(t * 22) * 7 * (1 - prog(t, .6, 1.1)) * prog(t, .1, .4)})`);
    const enter = back(prog(t, 1.5, 2.35));
    fullPlace(fifty, 540, 1100, mix(.25, 1, enter), mix(-18, 0, enter)); opacity(fifty, clamp(enter));
    questions.forEach((item, i) => {
      const p = inout(prog(t, 2.6 + i * .08, 6.2 + i * .08));
      const radius = mix(item.radius, 245, p);
      const angle = item.angle + p * .7;
      item.node.setAttribute('x', 540 + Math.cos(angle) * radius);
      item.node.setAttribute('y', 1100 + Math.sin(angle) * radius);
      item.node.setAttribute('transform', `rotate(${mix(item.angle * 30, 0, p)} ${540 + Math.cos(angle) * radius} ${1100 + Math.sin(angle) * radius}) scale(${mix(1.35, .72, p)})`);
      opacity(item.node, prog(t, 2.2 + i * .05, 2.8 + i * .05));
    });
    opacity(ghost, .04 + prog(t, 3, 6) * .07); opacity(caption, prog(t, 4.5, 5.2));
  };
}

function buildReversal() {
  header('03', 'MEMBER BLOCKED / CONTROL CONTINUES');
  const card = fullPanel(150, 270, 780, 400);
  fullLogo('claude', 205, 350, 190, 190).setAttribute('opacity', '.9');
  text('Claude', { x: 435, y: 445, class: 'mg-num', 'font-size': 100, 'font-weight': 900, fill: FULL_COLORS.ink }, card);
  text('会员账号 / MEMBER ACCESS', { x: 445, y: 520, class: 'mg-text', 'font-size': 30, 'letter-spacing': 4, fill: FULL_COLORS.gray }, card);
  const lock = fullTag('地区限制 / REGION LOCK', 540, 470, 600, FULL_COLORS.orange, 37);
  const gray = el('rect', { x: 145, y: 265, width: 790, height: 410, rx: 25, fill: FULL_COLORS.ink, opacity: 0 });
  const start = fullNode('¥50', 215, 1170, 120, FULL_COLORS.green);
  const end = fullNode('ON', 855, 800, 120, FULL_COLORS.green, '公司控制权');
  fullLogo('anthropic', 660, 1030, 390, 85);
  const path = fullStroke('M315 1130 C500 1280 960 1240 890 1050 C830 900 510 990 545 810 C570 690 680 720 745 770', FULL_COLORS.green, 14);
  const glow = fullStroke('M315 1130 C500 1280 960 1240 890 1050 C830 900 510 990 545 810 C570 690 680 720 745 770', FULL_COLORS.green, 42);
  glow.node.setAttribute('filter', 'url(#softGlow)');
  const traveler = fullTraveler(path);
  const caption = fullCaption('会员不到达，控制线照样到达', 1690);
  return t => {
    fullCamera(t, mix(1.03, 1, out(prog(t, 0, 1))));
    const blocked = inout(prog(t, .5, 2.4));
    fullPlace(lock, 540, mix(170, 470, back(prog(t, .35, 1.1))), mix(1.6, 1, prog(t, .35, 1.1)), -5);
    opacity(lock, prog(t, .25, .7)); opacity(gray, blocked * .58);
    card.setAttribute('transform', `translate(0 ${blocked * 55}) rotate(${blocked * -3} 540 470)`);
    const draw = out(prog(t, 3.0, 7.3));
    fullDraw(glow, draw, .18); fullDraw(path, draw); fullMoveTraveler(traveler, draw, prog(t, 3, 3.3) * (1 - prog(t, 7.2, 7.6)));
    start.setAttribute('transform', `translate(215 1170) scale(${1 + Math.sin(t * 5) * .025})`);
    const endIn = back(prog(t, 6.6, 7.5)); end.setAttribute('transform', `translate(855 800) scale(${endIn})`); opacity(end, clamp(endIn));
    opacity(caption, prog(t, 7.3, 8.1));
  };
}

function buildFounders() {
  header('04', 'SEVEN FOUNDERS → ONE STRUCTURE');
  const company = fullPanel(215, 690, 650, 270, FULL_COLORS.green);
  fullLogo('anthropic', 285, 735, 510, 105);
  text('创始团队共同控制', { x: 540, y: 905, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 40, 'letter-spacing': 6, fill: FULL_COLORS.ink }, company);
  const money = fullNode('¥50', 540, 825, 82, FULL_COLORS.green);
  const founders = [];
  const lines = [];
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 7;
    const sx = 540 + Math.cos(angle) * 430, sy = 850 + Math.sin(angle) * 610;
    const node = fullNode(i === 0 ? '达里奥' : `0${i + 1}`, sx, sy, i === 0 ? 72 : 62, i === 0 ? FULL_COLORS.green : FULL_COLORS.paper, i === 0 ? '' : '创始人');
    const line = fullStroke(`M${sx} ${sy} Q${540 + Math.cos(angle + .5) * 230} ${850 + Math.sin(angle + .5) * 280} 540 825`, i === 0 ? FULL_COLORS.green : FULL_COLORS.ink, i === 0 ? 9 : 5);
    founders.push({ node, sx, sy, angle }); lines.push(line);
  }
  const person = el('image', { href: '../assets/library/person-dario-amodei/master.png', x: 40, y: 1190, width: 230, height: 288, preserveAspectRatio: 'xMidYMid meet' });
  const caption = fullCaption('不是一个人，是七个人同一套结构', 1700);
  return t => {
    const zoom = mix(1, 1.22, inout(prog(t, 7.2, 9.4)));
    fullCamera(t, zoom, mix(960, 825, prog(t, 7.2, 9.4)));
    founders.forEach((item, i) => {
      const enter = back(prog(t, i * .13, .8 + i * .13));
      const gather = inout(prog(t, 3.3 + i * .08, 6.4 + i * .08));
      const x = mix(item.sx, 540 + Math.cos(item.angle) * 265, gather);
      const y = mix(item.sy, 825 + Math.sin(item.angle) * 330, gather);
      fullPlace(item.node, x, y, mix(.4, 1, enter) * mix(1, .82, gather)); opacity(item.node, clamp(enter));
      fullDraw(lines[i], prog(t, 1.4 + i * .2, 3.5 + i * .2), 1 - gather * .35);
    });
    opacity(company, prog(t, 1.2, 2)); opacity(person, prog(t, .4, 1.2) * (1 - prog(t, 6.8, 7.5)));
    const moneyIn = back(prog(t, 4.8, 5.7)); money.setAttribute('transform', `translate(540 825) scale(${moneyIn}) rotate(${t * 8})`); opacity(money, clamp(moneyIn));
    opacity(caption, prog(t, 5.5, 6.4) * (1 - prog(t, 8.1, 8.8)));
  };
}

function buildShareTypes() {
  header('05', 'SAME WORD “STOCK” / DIFFERENT RIGHTS');
  const stock = fullNode('股', 540, 470, 125, FULL_COLORS.paper, 'STOCK');
  const cards = [];
  const specs = [
    { name: '普通股', en: 'COMMON', x: 210, color: FULL_COLORS.A, rights: ['投票', '股息'] },
    { name: '优先股', en: 'PREFERRED', x: 540, color: FULL_COLORS.N, rights: ['股息', '清算'] },
    { name: '可赎回股', en: 'REDEEMABLE', x: 870, color: FULL_COLORS.T, rights: ['赎回', '清算'] },
  ];
  specs.forEach((spec, i) => {
    const card = fullPanel(-140, -220, 280, 500, spec.color);
    text(spec.name, { x: 0, y: -105, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 48, fill: FULL_COLORS.ink }, card);
    text(spec.en, { x: 0, y: -55, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 20, 'font-weight': 800, 'letter-spacing': 2, fill: FULL_COLORS.gray }, card);
    spec.rights.forEach((right, j) => {
      el('rect', { x: -100, y: 5 + j * 90, width: 200, height: 62, rx: 14, fill: j ? 'url(#dotFill)' : spec.color, opacity: j ? .16 : .9 }, card);
      text(right, { x: 0, y: 48 + j * 90, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 32, fill: FULL_COLORS.ink }, card);
    });
    cards.push({ card, spec, i });
  });
  const caption = fullCaption('不是换一种名字，是换一组权利', 1690);
  return t => {
    fullCamera(t, mix(1.05, 1, prog(t, 0, 1)));
    const split = inout(prog(t, 1.2, 3.6));
    stock.setAttribute('transform', `translate(540 ${mix(850, 420, split)}) scale(${mix(1, .74, split)})`);
    cards.forEach(({ card, spec, i }) => {
      const p = back(prog(t, 1.5 + i * .35, 2.6 + i * .35));
      const reorder = inout(prog(t, 4.5 + i * .25, 7.2 + i * .25));
      fullPlace(card, mix(540, spec.x, p), mix(890, 1050, p) + Math.sin(t * 2 + i) * 8 * reorder, mix(.3, .9, p), mix((i - 1) * 18, (i - 1) * 3, p));
      opacity(card, clamp(p));
      [...card.querySelectorAll('rect')].forEach((rect, j) => { if (j > 0) rect.setAttribute('transform', `translate(${Math.sin(reorder * Math.PI) * (j % 2 ? 45 : -45)} 0)`); });
    });
    opacity(caption, prog(t, 6.3, 7.2));
  };
}

function buildRightsSplit() {
  header('06', 'ONE STOCK → THREE CORE RIGHTS');
  const stock = fullNode('股', 220, 900, 115, FULL_COLORS.paper, 'STOCK');
  const specs = [
    { label: '投票权', en: 'VOTING RIGHTS', y: 500, color: FULL_COLORS.green },
    { label: '股息权', en: 'DIVIDEND RIGHTS', y: 900, color: FULL_COLORS.blue },
    { label: '清算分配权', en: 'CAPITAL RIGHTS', y: 1300, color: FULL_COLORS.orange },
  ];
  const channels = specs.map((spec, i) => {
    const line = fullStroke(`M330 900 C480 900 480 ${spec.y} 650 ${spec.y}`, spec.color, 13);
    const node = fullNode(`0${i + 1}`, 790, spec.y, 90, spec.color, spec.label);
    const title = text(spec.label, { x: 790, y: spec.y - 140, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 52, fill: FULL_COLORS.ink });
    const en = text(spec.en, { x: 790, y: spec.y + 155, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 800, 'letter-spacing': 3, fill: FULL_COLORS.gray });
    const traveler = fullTraveler(line, spec.color);
    return { line, node, title, en, traveler, spec };
  });
  const caption = fullCaption('一份股票，可以拆成三条通道', 1710);
  return t => {
    fullCamera(t, mix(1.1, 1, out(prog(t, 0, 1.2))));
    stock.setAttribute('transform', `translate(220 900) scale(${mix(1.35, 1, prog(t, 0, 1.4))}) rotate(${Math.sin(t * 2) * 3})`);
    channels.forEach((channel, i) => {
      const start = 1.4 + i * 2.65, draw = out(prog(t, start, start + 1.35));
      fullDraw(channel.line, draw); fullMoveTraveler(channel.traveler, draw, prog(t, start, start + .2) * (1 - prog(t, start + 1.2, start + 1.5)));
      const p = back(prog(t, start + .75, start + 1.55)); channel.node.setAttribute('transform', `translate(790 ${channel.spec.y}) scale(${p})`); opacity(channel.node, clamp(p));
      opacity(channel.title, prog(t, start + .9, start + 1.5)); opacity(channel.en, prog(t, start + 1.1, start + 1.7));
    });
    opacity(caption, prog(t, 8.4, 9.2));
  };
}

function buildRightsTranslation() {
  header('07', 'FROM LEGAL TERMS TO REAL OUTCOMES');
  const specs = [
    { term: '投票权', result: '能投几票？', y: 470, color: FULL_COLORS.green },
    { term: '股息权', result: '能拿多少分红？', y: 880, color: FULL_COLORS.blue },
    { term: '清算分配权', result: '散伙拿多少？', y: 1290, color: FULL_COLORS.orange },
  ];
  const rows = specs.map((spec, i) => {
    const from = fullTag(spec.term, 210, spec.y, 280, spec.color, 36);
    const to = fullTag(spec.result, 790, spec.y, 420, spec.color, 43);
    const line = fullStroke(`M350 ${spec.y} C470 ${spec.y - 90} 520 ${spec.y + 90} 580 ${spec.y}`, spec.color, 12);
    const pulse = fullTraveler(line, spec.color);
    return { from, to, line, pulse, spec, i };
  });
  const extras = el('g', {});
  const transfer = fullTag('转让权', 220, 1540, 220, FULL_COLORS.purple); const redeem = fullTag('赎回权', 500, 1540, 220, FULL_COLORS.yellow);
  extras.appendChild(transfer); extras.appendChild(redeem);
  const note = text('其他权利 / 今天不展开', { x: 770, y: 1550, class: 'mg-text', 'font-size': 29, fill: FULL_COLORS.gray });
  const caption = fullCaption('术语背后，是三种实际结果', 1720);
  return t => {
    fullCamera(t);
    rows.forEach((row, i) => {
      const start = .6 + i * 2.75, draw = out(prog(t, start, start + 1.25));
      fullDraw(row.line, draw); fullMoveTraveler(row.pulse, (draw + t * .08) % 1, prog(t, start + .3, start + .6) * .9);
      const p = back(prog(t, start + .7, start + 1.5));
      row.to.setAttribute('transform', `translate(${mix(1030, 790, p)} ${row.spec.y}) scale(${mix(.65, 1, p)})`); opacity(row.to, clamp(p));
      row.from.setAttribute('transform', `translate(210 ${row.spec.y}) scale(${1 - prog(t, start + .6, start + 1.3) * .12})`);
    });
    const retreat = inout(prog(t, 8.7, 11.2));
    transfer.setAttribute('transform', `translate(${mix(220, 85, retreat)} ${mix(1540, 1580, retreat)}) scale(${mix(1, .55, retreat)}) rotate(-12)`);
    redeem.setAttribute('transform', `translate(${mix(500, 260, retreat)} ${mix(1540, 1630, retreat)}) scale(${mix(1, .55, retreat)}) rotate(9)`);
    opacity(extras, 1 - retreat * .5); opacity(note, prog(t, 8.7, 9.5)); opacity(caption, prog(t, 10.2, 11));
  };
}

function buildRightsAllocation() {
  header('08', 'ONE COMPANY / CUSTOM RIGHT PACKAGES');
  const company = fullNode('公司', 540, 830, 125, FULL_COLORS.green);
  const positions = [[210, 390], [870, 390], [210, 1290], [870, 1290]];
  const packages = [[0, 1], [1, 2], [0, 2], [0, 1, 2]];
  const colors = [FULL_COLORS.green, FULL_COLORS.blue, FULL_COLORS.orange];
  const shareholders = positions.map((pos, i) => {
    const node = fullNode(`S${i + 1}`, pos[0], pos[1], 72, colors[i % 3], `股东 ${i + 1}`);
    const line = fullStroke(`M540 830 Q${(540 + pos[0]) / 2 + (i % 2 ? 100 : -100)} ${(830 + pos[1]) / 2} ${pos[0]} ${pos[1]}`, FULL_COLORS.ink, 5);
    const chips = packages[i].map((r, j) => {
      const chip = el('circle', { r: 17, fill: colors[r], stroke: FULL_COLORS.ink, 'stroke-width': 3 });
      return { chip, r, j };
    });
    return { node, line, chips, pos, i };
  });
  const legend = ['投票', '股息', '清算'].map((label, i) => fullTag(label, 285 + i * 255, 1630, 190, colors[i], 30));
  return t => {
    fullCamera(t, 1 + Math.sin(prog(t, 0, 6.2) * Math.PI) * .035);
    company.setAttribute('transform', `translate(540 830) scale(${1 + Math.sin(t * 4) * .025})`);
    shareholders.forEach((holder, i) => {
      const start = .5 + i * 1.15, draw = out(prog(t, start, start + .8));
      fullDraw(holder.line, draw, .55);
      holder.chips.forEach(({ chip, r, j }) => {
        const p = inout(prog(t, start + .35 + j * .2, start + 1.05 + j * .2));
        const point = holder.line.node.getPointAtLength(holder.line.length * p);
        const tx = holder.pos[0] + (j - (holder.chips.length - 1) / 2) * 48, ty = holder.pos[1] + 125;
        chip.setAttribute('cx', mix(point.x, tx, prog(t, start + 1, start + 1.4))); chip.setAttribute('cy', mix(point.y, ty, prog(t, start + 1, start + 1.4)));
        opacity(chip, prog(t, start + j * .15, start + .35 + j * .15));
      });
    });
    legend.forEach((node, i) => opacity(node, prog(t, 4.4 + i * .15, 5 + i * .15)));
  };
}

function buildFinancing() {
  header('09', 'FINANCING → NEW PLAYERS ENTER');
  const counter = text('100%', { x: 540, y: 460, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 190, 'font-weight': 900, fill: FULL_COLORS.ink });
  const label = text('创始团队持股', { x: 540, y: 525, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 38, 'letter-spacing': 8, fill: FULL_COLORS.gray });
  el('rect', { x: 100, y: 650, width: 880, height: 120, rx: 60, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4 });
  const founderBar = el('rect', { x: 110, y: 660, width: 860, height: 100, rx: 50, fill: FULL_COLORS.green });
  const investorBars = [FULL_COLORS.blue, FULL_COLORS.purple, FULL_COLORS.orange].map(color => el('rect', { x: 970, y: 660, width: 0, height: 100, fill: color }));
  const rounds = ['成立', '种子轮', 'A 轮', 'B 轮'].map((name, i) => {
    const tag = fullTag(name, 180 + i * 240, 940, 190, i === 0 ? FULL_COLORS.green : FULL_COLORS.ink, 31);
    const node = fullNode(i === 0 ? 'F' : `+${i}`, 180 + i * 240, 1220, 66, i === 0 ? FULL_COLORS.green : [FULL_COLORS.blue, FULL_COLORS.purple, FULL_COLORS.orange][i - 1], i === 0 ? '创始团队' : '新玩家进入');
    return { tag, node, i };
  });
  const caption = fullCaption('每一轮进入，都重新分配 100%', 1640);
  return t => {
    fullCamera(t);
    const stage = t < 2.3 ? 0 : t < 5 ? 1 : t < 7.8 ? 2 : 3;
    const targets = [100, 72, 49, 31];
    let value = targets[stage];
    if (stage > 0) value = mix(targets[stage - 1], targets[stage], inout(prog(t, [0, 2.3, 5, 7.8][stage], [0, 3.8, 6.5, 9.3][stage])));
    counter.textContent = `${Math.round(value)}%`;
    founderBar.setAttribute('width', 860 * value / 100);
    let remainingStart = 110 + 860 * value / 100;
    const widths = stage === 0 ? [0, 0, 0] : stage === 1 ? [100 - value, 0, 0] : stage === 2 ? [28, 100 - value - 28, 0] : [28, 23, 100 - value - 51];
    investorBars.forEach((bar, i) => {
      const width = 860 * widths[i] / 100;
      bar.setAttribute('x', remainingStart); bar.setAttribute('width', width); remainingStart += width;
      bar.setAttribute('rx', i === 2 && stage === 3 ? 50 : 0);
    });
    rounds.forEach(({ tag, node, i }) => {
      const start = i * 2.55, p = back(prog(t, start, start + .8));
      fullPlace(tag, 180 + i * 240, 940, mix(.5, 1, p)); opacity(tag, clamp(p));
      fullPlace(node, mix(1160, 180 + i * 240, p), 1220 + Math.sin(t * 3 + i) * 8, mix(.4, 1, p)); opacity(node, clamp(p));
    });
    opacity(caption, prog(t, 8.3, 9.2));
  };
}

function buildDeadlock() {
  header('10', 'DILUTION → DECISION TRAFFIC JAM');
  const center = fullNode('决策', 540, 900, 125, FULL_COLORS.orange);
  const counter = text('100% → 18%', { x: 540, y: 340, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 110, 'font-weight': 900, fill: FULL_COLORS.ink });
  const sub = text('创始区域缩小 / 股东节点增加', { x: 540, y: 410, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 34, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const nodes = [], lines = [];
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 12;
    const x = 540 + Math.cos(angle) * 410, y = 900 + Math.sin(angle) * 520;
    const node = fullNode(`${i + 1}`, x, y, 43, i < 3 ? FULL_COLORS.green : FULL_COLORS.paper);
    const c1x = 540 + Math.cos(angle + 1.4) * 300, c1y = 900 + Math.sin(angle + 1.4) * 360;
    const c2x = 540 + Math.cos(angle - 1.1) * 180, c2y = 900 + Math.sin(angle - 1.1) * 250;
    const line = fullStroke(`M${x} ${y} C${c1x} ${c1y} ${c2x} ${c2y} 540 900`, i % 4 === 0 ? FULL_COLORS.orange : FULL_COLORS.ink, 5 + i % 3);
    nodes.push({ node, x, y, angle }); lines.push(line);
  }
  const tangle = el('g', {});
  for (let i = 0; i < 7; i++) {
    el('ellipse', { cx: 540, cy: 900, rx: 125 + i * 21, ry: 60 + i * 17, fill: 'none', stroke: i % 3 === 0 ? FULL_COLORS.orange : FULL_COLORS.ink, 'stroke-width': 5, transform: `rotate(${i * 27} 540 900)` }, tangle);
  }
  const jam = fullTag('公司也不知道听谁的', 540, 1580, 610, FULL_COLORS.orange, 43);
  return t => {
    fullCamera(t, mix(1, 1.08, prog(t, 7, 13)));
    const chaos = inout(prog(t, 3.2, 9.5));
    nodes.forEach((item, i) => {
      const p = back(prog(t, i * .18, .7 + i * .18));
      const squeeze = inout(prog(t, 5 + i * .07, 10 + i * .07));
      const x = mix(item.x, 540 + Math.cos(item.angle + chaos * .45) * (410 - squeeze * 80), squeeze);
      const y = mix(item.y, 900 + Math.sin(item.angle + chaos * .45) * (520 - squeeze * 90), squeeze);
      fullPlace(item.node, x, y, mix(.3, 1, p)); opacity(item.node, clamp(p));
      fullDraw(lines[i], prog(t, 1.5 + i * .15, 3.2 + i * .15), .35 + chaos * .55);
    });
    tangle.setAttribute('transform', `rotate(${chaos * 150 + t * chaos * 7} 540 900) scale(${mix(.4, 1, chaos)})`); opacity(tangle, chaos);
    center.setAttribute('transform', `translate(540 900) scale(${1 - chaos * .3}) rotate(${Math.sin(t * 16) * chaos * 3})`);
    counter.setAttribute('fill', chaos > .6 ? FULL_COLORS.orange : FULL_COLORS.ink);
    opacity(jam, prog(t, 9.3, 10.4));
  };
}

function buildUntangle() {
  header('11', 'DIFFERENT SHARES → CLEAR CHANNELS');
  const center = fullNode('决策', 540, 860, 115, FULL_COLORS.green);
  const mess = el('g', {});
  for (let i = 0; i < 10; i++) el('ellipse', { cx: 540, cy: 860, rx: 180 + i * 14, ry: 70 + i * 11, fill: 'none', stroke: i % 3 ? FULL_COLORS.ink : FULL_COLORS.orange, 'stroke-width': 5, transform: `rotate(${i * 31} 540 860)` }, mess);
  const specs = [
    { x: 210, y: 420, color: FULL_COLORS.green, label: '投票通道' },
    { x: 870, y: 860, color: FULL_COLORS.blue, label: '股息通道' },
    { x: 210, y: 1320, color: FULL_COLORS.orange, label: '清算通道' },
  ];
  const channels = specs.map((spec, i) => {
    const node = fullNode(`S${i + 1}`, spec.x, spec.y, 72, spec.color, spec.label);
    const line = fullStroke(`M${spec.x} ${spec.y} C${spec.x + (540 - spec.x) * .45} ${spec.y} ${540 + (spec.x - 540) * .25} 860 540 860`, spec.color, 12);
    return { node, line, spec };
  });
  const caption = fullCaption('权利分开，秩序重新出现', 1650);
  return t => {
    fullCamera(t);
    const clear = inout(prog(t, .5, 3.8));
    mess.setAttribute('transform', `translate(540 860) rotate(${clear * 120}) scale(${1 - clear * .7}) translate(-540 -860)`); opacity(mess, 1 - clear);
    channels.forEach(({ node, line, spec }, i) => {
      fullDraw(line, out(prog(t, 1.2 + i * .45, 3.4 + i * .45)));
      node.setAttribute('transform', `translate(${mix(540, spec.x, clear)} ${mix(860, spec.y, clear)}) scale(${mix(.65, 1, clear)})`);
    });
    center.setAttribute('transform', `translate(540 860) scale(${mix(.75, 1, back(prog(t, 3, 4.2)))})`);
    opacity(caption, prog(t, 3.8, 4.6));
  };
}

function buildFiveClasses() {
  header('12', 'A / N / T / F / E — ONE COMPANY');
  const company = fullPanel(250, 720, 580, 270, FULL_COLORS.green);
  fullLogo('anthropic', 310, 765, 460, 100);
  text('五种内部股票类别', { x: 540, y: 930, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 38, 'letter-spacing': 5, fill: FULL_COLORS.ink }, company);
  const types = ['A', 'N', 'T', 'F', 'E'];
  const nodes = types.map((type, i) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
    const tx = 540 + Math.cos(angle) * 360, ty = 855 + Math.sin(angle) * 475;
    const sx = i % 2 ? 1180 : -100, sy = 340 + i * 270;
    const node = fullNode(type, sx, sy, 82, FULL_COLORS[type], `${type} 股`);
    const line = fullStroke(`M${tx} ${ty} Q${(tx + 540) / 2} ${(ty + 855) / 2 - 50} 540 855`, FULL_COLORS[type], 7);
    return { node, line, tx, ty, sx, sy, type };
  });
  const marketA = fullTag('A股 / 市场别称', 230, 1460, 330, FULL_COLORS.orange, 33);
  const marketH = fullTag('H股 / 市场别称', 650, 1540, 330, FULL_COLORS.orange, 33);
  const notSame = fullTag('不是股票市场别称', 540, 1240, 470, FULL_COLORS.orange, 38);
  const caption = fullCaption('这里说的是：同一家公司里的五种类别', 1710);
  return t => {
    fullCamera(t, mix(1.04, 1, prog(t, 0, 2)));
    opacity(company, prog(t, .4, 1.5));
    nodes.forEach((item, i) => {
      const start = 2 + i * 1.55, p = back(prog(t, start, start + 1.25));
      fullPlace(item.node, mix(item.sx, item.tx, p), mix(item.sy, item.ty, p), mix(.45, 1, p), mix((i % 2 ? 1 : -1) * 90, 0, p)); opacity(item.node, clamp(p));
      fullDraw(item.line, prog(t, start + .6, start + 1.6), .7);
    });
    const exit = inout(prog(t, 11.3, 14));
    marketA.setAttribute('transform', `translate(${mix(230, -350, exit)} 1460) rotate(${-exit * 25})`);
    marketH.setAttribute('transform', `translate(${mix(650, 1250, exit)} 1540) rotate(${exit * 25})`);
    opacity(notSame, prog(t, 10.2, 11.1) * (1 - prog(t, 14.2, 15)));
    opacity(caption, prog(t, 15.1, 16));
  };
}

function buildClassA() {
  header('13', 'CLASS A — FULLY CIRCULATING');
  const a = fullNode('A', 540, 790, 140, FULL_COLORS.A, '1 股 / 完整权利包');
  const specs = [
    { label: '1股1票', x: 190, y: 390, color: FULL_COLORS.green },
    { label: '股息', x: 890, y: 390, color: FULL_COLORS.blue },
    { label: '转让', x: 190, y: 1190, color: FULL_COLORS.purple },
    { label: '清算', x: 890, y: 1190, color: FULL_COLORS.orange },
  ];
  const rights = specs.map((spec, i) => {
    const tag = fullTag(spec.label, spec.x, spec.y, 250, spec.color, 40);
    const line = fullStroke(`M${spec.x} ${spec.y} Q${(spec.x + 540) / 2} ${(spec.y + 790) / 2 + (i % 2 ? 60 : -60)} 540 790`, spec.color, 10);
    return { tag, line, spec };
  });
  const holders = fullTag('创始人 · 管理团队 · 投资者', 540, 1430, 750, FULL_COLORS.ink, 36);
  const ipo = fullNode('IPO', 540, 1650, 100, FULL_COLORS.green, '上市流通');
  const ipoLine = fullStroke('M540 930 C540 1110 350 1270 540 1550', FULL_COLORS.green, 15);
  const traveler = fullTraveler(ipoLine);
  return t => {
    fullCamera(t, mix(1.04, 1, prog(t, 0, 1)));
    a.setAttribute('transform', `translate(540 790) scale(${1 + Math.sin(t * 2.5) * .025})`);
    rights.forEach(({ tag, line, spec }, i) => {
      const start = 1 + i * 2.75, p = back(prog(t, start, start + .8));
      fullPlace(tag, spec.x, spec.y, mix(.5, 1, p), mix(i % 2 ? 15 : -15, 0, p)); opacity(tag, clamp(p));
      fullDraw(line, out(prog(t, start + .4, start + 1.5)));
    });
    opacity(holders, prog(t, 11.2, 12.1));
    fullDraw(ipoLine, out(prog(t, 13.2, 17.2)));
    const p = back(prog(t, 15.8, 17)); ipo.setAttribute('transform', `translate(540 1650) scale(${p})`); opacity(ipo, clamp(p));
    fullMoveTraveler(traveler, prog(t, 13.2, 17.2), prog(t, 13.2, 13.6) * (1 - prog(t, 17.1, 17.5)));
  };
}

function buildClassN() {
  header('14', 'CLASS N → TRANSFER → CLASS A');
  const moving = fullNode('N', 190, 790, 125, FULL_COLORS.N, '无投票权');
  const gate = el('g', { filter: 'url(#shadow)' });
  const left = el('path', { d: 'M440 490H550V1090H440Z', fill: '#fffdf7', stroke: FULL_COLORS.purple, 'stroke-width': 6 }, gate);
  const right = el('path', { d: 'M550 490H660V1090H550Z', fill: 'url(#dotFill)', stroke: FULL_COLORS.purple, 'stroke-width': 6, opacity: .85 }, gate);
  text('转 让 闸 门', { x: 550, y: 450, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 40, 'letter-spacing': 6, fill: FULL_COLORS.ink }, gate);
  const aTarget = fullNode('A', 895, 790, 105, FULL_COLORS.A, '上市流通');
  const vote = fullStroke('M190 480V620', FULL_COLORS.green, 12);
  const voteTag = fullTag('投票权 / 无', 190, 370, 270, FULL_COLORS.orange, 33);
  const cut = el('g', {});
  el('line', { x1: 145, y1: 520, x2: 235, y2: 590, stroke: FULL_COLORS.orange, 'stroke-width': 14 }, cut);
  el('line', { x1: 235, y1: 520, x2: 145, y2: 590, stroke: FULL_COLORS.orange, 'stroke-width': 14 }, cut);
  const dividends = fullTag('股息 ✓', 200, 1260, 230, FULL_COLORS.blue, 34);
  const capital = fullTag('清算 ✓', 480, 1260, 230, FULL_COLORS.orange, 34);
  const market = fullTag('以后可能在市场流通', 740, 1390, 520, FULL_COLORS.green, 37);
  const path = fullStroke('M190 790H895', FULL_COLORS.green, 10);
  return t => {
    fullCamera(t);
    fullDraw(vote, 1 - prog(t, 1.1, 2.3)); opacity(cut, prog(t, 1.2, 1.8));
    cut.setAttribute('transform', `translate(190 555) scale(${back(prog(t, 1.2, 1.9))}) translate(-190 -555)`);
    opacity(dividends, prog(t, 2.4, 3.1)); opacity(capital, prog(t, 3.1, 3.8));
    fullDraw(path, prog(t, 4.5, 5.2), .4);
    const move = inout(prog(t, 5, 9.3)), open = Math.sin(move * Math.PI);
    left.setAttribute('transform', `translate(${-open * 100} 0)`); right.setAttribute('transform', `translate(${open * 100} 0)`);
    const x = mix(190, 895, move);
    moving.setAttribute('transform', `translate(${x} 790) scale(${1 + Math.sin(move * Math.PI) * .18}) rotate(${move * 360})`);
    moving.label.textContent = move > .53 ? 'A' : 'N'; moving.label.setAttribute('fill', move > .53 ? FULL_COLORS.A : FULL_COLORS.N);
    opacity(aTarget, prog(t, 8.8, 9.5) * .25); opacity(market, prog(t, 9.2, 10.2));
  };
}

function buildPartnerNetwork() {
  header('15', 'CLASS N — STRATEGIC PARTNER NETWORK');
  const n = fullNode('N', 540, 850, 135, FULL_COLORS.N, '战略合作伙伴');
  fullLogo('anthropic', 355, 1110, 370, 85);
  const amazon = fullPanel(80, 260, 390, 230, FULL_COLORS.N);
  fullLogo('amazon', 130, 325, 290, 105);
  const google = fullPanel(610, 260, 390, 230, FULL_COLORS.N);
  fullLogo('google', 660, 325, 290, 105);
  const fund = fullNode('基金', 540, 1390, 105, FULL_COLORS.purple, '圈子公益基金');
  const specs = [
    { d: 'M450 720 C350 620 300 560 280 490', target: amazon, x: 275, y: 490 },
    { d: 'M630 720 C730 620 780 560 805 490', target: google, x: 805, y: 490 },
    { d: 'M540 985 C540 1120 540 1190 540 1285', target: fund, x: 540, y: 1285 },
  ];
  const links = specs.map((spec, i) => ({ ...spec, line: fullStroke(spec.d, i === 2 ? FULL_COLORS.purple : FULL_COLORS.N, 11), pulse: null }));
  links.forEach(link => { link.pulse = fullTraveler(link.line, FULL_COLORS.N); });
  const caption = fullCaption('N 股连接的是合作网络，不是投票控制', 1690);
  return t => {
    fullCamera(t, 1 + Math.sin(t * .7) * .015);
    n.setAttribute('transform', `translate(540 850) scale(${1 + Math.sin(t * 3) * .025})`);
    links.forEach((link, i) => {
      const start = 1.2 + i * 2.4;
      fullDraw(link.line, out(prog(t, start, start + 1.4)));
      const p = back(prog(t, start + .6, start + 1.4)); opacity(link.target, clamp(p));
      link.target.setAttribute('transform', `translate(${link.x} ${link.y}) scale(${p}) translate(${-link.x} ${-link.y})`);
      fullMoveTraveler(link.pulse, (prog(t, start + 1, 10.8) + i * .22) % 1, prog(t, start + 1, start + 1.4) * .9);
    });
    opacity(caption, prog(t, 8.2, 9.1));
  };
}

function buildClassT() {
  header('16', 'CLASS T — LIMITED VOTE / KEY LEVERS');
  const tNode = fullNode('T', 210, 790, 125, FULL_COLORS.T, '仅 1 个');
  const limited = fullTag('有限投票事项', 210, 380, 360, FULL_COLORS.orange, 38);
  const vote = fullStroke('M210 455V650', FULL_COLORS.orange, 10);
  const squeeze = el('g', {});
  el('path', { d: 'M80 560H340L280 650H140Z', fill: 'url(#dotFill)', stroke: FULL_COLORS.orange, 'stroke-width': 5 }, squeeze);
  const director = fullNode('董事', 850, 480, 100, FULL_COLORS.T, '特别董事');
  const redeem = fullNode('E', 850, 1200, 100, FULL_COLORS.E, '赎回控制');
  const line1 = fullStroke('M320 720 C520 610 610 480 745 480', FULL_COLORS.T, 13);
  const line2 = fullStroke('M320 850 C520 970 610 1200 745 1200', FULL_COLORS.T, 13);
  const pulse1 = fullTraveler(line1, FULL_COLORS.T), pulse2 = fullTraveler(line2, FULL_COLORS.T);
  const power = text('LIMITED ≠ WEAK', { x: 540, y: 1570, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 64, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.ink });
  const caption = fullCaption('投票受限，但两条关键控制线向外延伸', 1690);
  return t => {
    fullCamera(t);
    fullDraw(vote, prog(t, .5, 1.4));
    const narrow = inout(prog(t, 1.2, 4)); squeeze.setAttribute('transform', `translate(210 605) scale(${mix(1.3, .68, narrow)} 1) translate(-210 -605)`);
    opacity(limited, prog(t, .4, 1.1));
    fullDraw(line1, out(prog(t, 5, 8))); fullDraw(line2, out(prog(t, 8.2, 11.4)));
    [director, redeem].forEach((node, i) => { const p = back(prog(t, 6.5 + i * 3.2, 7.5 + i * 3.2)); node.setAttribute('transform', `translate(850 ${i ? 1200 : 480}) scale(${p})`); opacity(node, clamp(p)); });
    fullMoveTraveler(pulse1, prog(t, 6, 14.8), prog(t, 6, 6.5)); fullMoveTraveler(pulse2, prog(t, 9.2, 15), prog(t, 9.2, 9.7));
    opacity(power, prog(t, 11.7, 12.6)); opacity(caption, prog(t, 12.5, 13.4));
  };
}

function buildTrust() {
  header('17', 'LTBT — INDEPENDENT LONG-TERM WATCHDOG');
  const company = fullNode('A社', 190, 850, 105, FULL_COLORS.paper, 'Anthropic');
  const mission = fullNode('长期', 890, 850, 105, FULL_COLORS.green, '长期利益');
  const frame = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M390 420H690L735 465V1220H345V465Z', fill: '#fffdf7', 'fill-opacity': .9, stroke: FULL_COLORS.T, 'stroke-width': 9 }, frame);
  el('path', { d: 'M390 420H690L735 465V1220H345V465Z', fill: 'url(#dotFill)', opacity: .11 }, frame);
  text('LTBT', { x: 540, y: 590, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 110, 'font-weight': 900, fill: FULL_COLORS.ink }, frame);
  text('长期利益信托', { x: 540, y: 665, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 39, 'letter-spacing': 5, fill: FULL_COLORS.ink }, frame);
  text('INDEPENDENT', { x: 540, y: 1090, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 25, 'font-weight': 800, 'letter-spacing': 6, fill: FULL_COLORS.gray }, frame);
  const good = fullStroke('M295 850H785', FULL_COLORS.green, 12);
  const bad = fullStroke('M270 980 C430 1080 530 1270 740 1420', FULL_COLORS.orange, 12);
  const deviation = fullTag('偏离使命', 790, 1450, 300, FULL_COLORS.orange, 38);
  const rebound = fullTraveler(bad, FULL_COLORS.orange, 17);
  const caption = fullCaption('独立监督：把偏离长期利益的箭头拦回去', 1690);
  return t => {
    fullCamera(t);
    const rise = back(prog(t, 1.4, 2.8)); frame.setAttribute('transform', `translate(0 ${mix(850, 0, rise)})`); opacity(frame, clamp(rise));
    fullDraw(good, prog(t, 3.2, 5.2));
    const advance = out(prog(t, 5.2, 8.2));
    const bounce = inout(prog(t, 8.2, 10.8));
    const p = bounce > 0 ? mix(.63, .12, bounce) : advance * .63;
    fullDraw(bad, advance); fullMoveTraveler(rebound, p, prog(t, 5.2, 5.6));
    rebound.node.setAttribute('r', 17 + Math.sin(prog(t, 8, 8.5) * Math.PI) * 20);
    opacity(deviation, prog(t, 5, 5.8) * (1 - prog(t, 9.2, 10.5)));
    frame.setAttribute('opacity', prog(t, 1.2, 1.8) * (1 - Math.sin(prog(t, 8, 8.5) * Math.PI) * .12));
    opacity(caption, prog(t, 10.5, 11.5));
  };
}

function buildClassE() {
  header('18', 'CLASS E ↔ CLASS T — CHECKS & BALANCES');
  const e = fullNode('E', 250, 850, 125, FULL_COLORS.E, '员工股');
  const tNode = fullNode('T', 830, 850, 125, FULL_COLORS.T, '特别董事');
  const beam = el('g', {});
  el('line', { x1: 250, y1: 1120, x2: 830, y2: 1120, stroke: FULL_COLORS.ink, 'stroke-width': 20, 'stroke-linecap': 'round' }, beam);
  el('path', { d: 'M540 1120L470 1300H610Z', fill: FULL_COLORS.ink }, beam);
  const employees = [];
  for (let i = 0; i < 7; i++) {
    const node = fullNode(`${i + 1}`, 60 + (i % 3) * 105, 300 + Math.floor(i / 3) * 130, 36, FULL_COLORS.E);
    employees.push(node);
  }
  const vote = fullStroke('M340 730 C500 570 650 570 740 730', FULL_COLORS.E, 11);
  const director = fullTag('投票更换董事', 540, 480, 400, FULL_COLORS.E, 38);
  const rights = [
    { tag: fullTag('无法转让', 200, 1460, 250, FULL_COLORS.purple, 32), start: 7 },
    { tag: fullTag('没有股息', 540, 1460, 250, FULL_COLORS.blue, 32), start: 9 },
    { tag: fullTag('清算≈0', 870, 1460, 230, FULL_COLORS.orange, 32), start: 11 },
  ];
  const balance = fullTag('相 互 制 衡', 540, 1650, 490, FULL_COLORS.green, 48);
  return t => {
    fullCamera(t);
    employees.forEach((node, i) => {
      const p = inout(prog(t, .4 + i * .3, 2.4 + i * .3));
      const sx = 60 + (i % 3) * 105, sy = 300 + Math.floor(i / 3) * 130;
      fullPlace(node, mix(sx, 250 + Math.cos(i) * 75, p), mix(sy, 850 + Math.sin(i) * 80, p), mix(1, .3, p)); opacity(node, 1 - prog(t, 3.3, 4.2));
    });
    fullDraw(vote, out(prog(t, 3.6, 5.8))); opacity(director, prog(t, 4.5, 5.3));
    rights.forEach(({ tag, start }) => { const off = prog(t, start, start + .8); opacity(tag, 1 - off * .78); tag.setAttribute('transform', `translate(${tag.x} ${tag.y + off * 80}) rotate(${off * 12}) scale(${1 - off * .25})`); });
    const swing = Math.sin(prog(t, 11.5, 17) * Math.PI * 3) * (1 - prog(t, 11.5, 17)) * 12;
    beam.setAttribute('transform', `rotate(${swing} 540 1120)`);
    e.setAttribute('transform', `translate(250 ${850 + swing * 3})`); tNode.setAttribute('transform', `translate(830 ${850 - swing * 3})`);
    opacity(balance, prog(t, 16, 17.2));
  };
}

function buildMergeF() {
  header('19', 'SEVEN FOUNDERS → ONE F SHARE');
  const company = fullPanel(290, 690, 500, 250, FULL_COLORS.F);
  text('创始人公司', { x: 540, y: 790, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 58, fill: FULL_COLORS.ink }, company);
  text('FOUNDERS’ COMPANY', { x: 540, y: 850, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 23, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.gray }, company);
  const f = fullNode('F', 540, 1220, 135, FULL_COLORS.F, '仅 1 个');
  const counter = text('7', { x: 540, y: 450, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 180, 'font-weight': 900, fill: FULL_COLORS.ink });
  const label = text('位创始人 / FOUNDERS', { x: 540, y: 520, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 34, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const founders = [], links = [];
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 7;
    const x = 540 + Math.cos(angle) * 390, y = 800 + Math.sin(angle) * 410;
    const node = fullNode(`${i + 1}`, x, y, 50, FULL_COLORS.paper);
    const line = fullStroke(`M${x} ${y} Q${(x + 540) / 2} ${(y + 800) / 2} 540 800`, FULL_COLORS.paper, 6);
    founders.push({ node, x, y }); links.push(line);
  }
  const one = fullTag('ONE F / 仅 1 个', 540, 1570, 480, FULL_COLORS.green, 46);
  return t => {
    const merge = inout(prog(t, 1.8, 5.2)); fullCamera(t, mix(1, 1.1, prog(t, 4.8, 7.2)), mix(960, 1050, prog(t, 4.8, 7.2)));
    founders.forEach((item, i) => {
      const p = inout(prog(t, 1.5 + i * .15, 4.2 + i * .15));
      fullPlace(item.node, mix(item.x, 540, p), mix(item.y, 800, p), 1 - p * .75); opacity(item.node, 1 - prog(t, 4.3, 5.3));
      fullDraw(links[i], prog(t, .3 + i * .1, 1.5 + i * .1), 1 - merge * .4);
    });
    counter.textContent = merge < .75 ? '7' : '1'; label.textContent = merge < .75 ? '位创始人 / FOUNDERS' : '枚 F 股 / ONE SHARE';
    const p = back(prog(t, 4.3, 5.5)); f.setAttribute('transform', `translate(540 1220) scale(${p}) rotate(${mix(-180, 0, p)})`); opacity(f, clamp(p));
    opacity(one, prog(t, 5.5, 6.2));
  };
}

function buildStripRights() {
  header('21', 'REMOVE CASH RIGHTS / KEEP CONTROL');
  const f = fullNode('F', 540, 780, 150, FULL_COLORS.F, '只为控制');
  const rights = [
    { tag: fullTag('转让权', 200, 410, 260, FULL_COLORS.purple, 39), x: 200, y: 410, dx: -330, dy: -150, start: 1 },
    { tag: fullTag('股息权', 880, 650, 260, FULL_COLORS.blue, 39), x: 880, y: 650, dx: 350, dy: -50, start: 3.6 },
    { tag: fullTag('清算分配', 850, 1150, 300, FULL_COLORS.orange, 39), x: 850, y: 1150, dx: 350, dy: 220, start: 6.2 },
  ];
  const links = rights.map(right => fullStroke(`M540 780 Q${(540 + right.x) / 2} ${(780 + right.y) / 2} ${right.x} ${right.y}`, FULL_COLORS.gray, 6));
  const dim = el('rect', { x: 0, y: 150, width: 1080, height: 1530, fill: FULL_COLORS.ink, opacity: 0 });
  const control = el('g', { filter: 'url(#softGlow)' });
  el('circle', { cx: 540, cy: 820, r: 185, fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 12 }, control);
  el('circle', { cx: 540, cy: 820, r: 150, fill: 'url(#greenDots)', opacity: .4 }, control);
  text('控制权', { x: 540, y: 845, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 88, fill: FULL_COLORS.green }, control);
  const final = fullTag('NOT FOR CASH / FOR CONTROL', 540, 1410, 720, FULL_COLORS.green, 36);
  return t => {
    fullCamera(t, mix(1.02, 1.1, prog(t, 9, 14)), mix(960, 850, prog(t, 9, 14)));
    rights.forEach((right, i) => {
      const p = inout(prog(t, right.start, right.start + 1.8));
      right.tag.setAttribute('transform', `translate(${right.x + right.dx * p} ${right.y + right.dy * p}) rotate(${(i % 2 ? 1 : -1) * p * 45}) scale(${1 - p * .35})`);
      opacity(right.tag, 1 - prog(t, right.start + 1.2, right.start + 2)); fullDraw(links[i], 1 - p, .7 * (1 - p));
    });
    opacity(dim, prog(t, 8.5, 11) * .82); opacity(f, 1 - prog(t, 8.2, 10.5));
    const p = back(prog(t, 9.2, 10.6)); control.setAttribute('transform', `translate(540 820) scale(${p}) translate(-540 -820)`); opacity(control, clamp(p));
    control.setAttribute('filter', `url(#softGlow)`); opacity(final, prog(t, 11.5, 12.5));
  };
}

function buildCapitalContrast() {
  header('22', '50.1% CONTROL ↔ ONLY $7 CAPITAL');
  el('line', { x1: 540, y1: 260, x2: 540, y2: 1510, stroke: FULL_COLORS.ink, 'stroke-opacity': .18, 'stroke-width': 3, 'stroke-dasharray': '8 16' });
  const leftTitle = text('50.1%', { x: 285, y: 650, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 128, 'font-weight': 900, fill: FULL_COLORS.ink });
  const leftSub = text('全公司投票权', { x: 285, y: 730, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 35, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const f = fullNode('F', 285, 1030, 125, FULL_COLORS.F, '控制权');
  const total = text('$0', { x: 800, y: 650, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 180, 'font-weight': 900, fill: FULL_COLORS.orange });
  const totalSub = text('创始人公司资本', { x: 800, y: 730, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 35, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const dollars = [];
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 7;
    const node = fullNode('$1', 800 + Math.cos(angle) * 170, 1060 + Math.sin(angle) * 230, 48, FULL_COLORS.orange);
    dollars.push(node);
  }
  const contrast = fullTag('7 人 × 1 美元 = 7 美元', 800, 1450, 460, FULL_COLORS.orange, 36);
  const final = fullCaption('巨大的控制权，极小的初始资本', 1690);
  return t => {
    fullCamera(t);
    const leftIn = back(prog(t, .2, 1.1)); f.setAttribute('transform', `translate(285 1030) scale(${leftIn})`); opacity(f, clamp(leftIn));
    opacity(leftTitle, prog(t, .3, 1)); opacity(leftSub, prog(t, .6, 1.3));
    let count = 0;
    dollars.forEach((node, i) => {
      const p = back(prog(t, 2.3 + i * .8, 3.1 + i * .8)); if (t >= 2.3 + i * .8) count = i + 1;
      node.setAttribute('transform', `translate(${800 + Math.cos(-Math.PI / 2 + i * Math.PI * 2 / 7) * 170} ${1060 + Math.sin(-Math.PI / 2 + i * Math.PI * 2 / 7) * 230}) scale(${p})`); opacity(node, clamp(p));
    });
    total.textContent = `$${count}`; opacity(total, prog(t, 1.8, 2.4)); opacity(totalSub, prog(t, 1.8, 2.4));
    opacity(contrast, prog(t, 7.8, 8.7)); opacity(final, prog(t, 8.7, 9.6));
  };
}

function buildRemainder() {
  header('23', '¥50 − ¥47.35 = ¥2.65 LEFT');
  const fifty = text('¥50', { x: 540, y: 650, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 250, 'font-weight': 900, fill: FULL_COLORS.ink });
  const splitLine = fullStroke('M250 790H830', FULL_COLORS.ink, 4, '8 15');
  const big = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-350-160H290L350-100V160H-290L-350 100Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 8 }, big);
  text('47.35', { x: 0, y: 50, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 170, 'font-weight': 900, fill: FULL_COLORS.green }, big);
  text('元 / 创始人公司', { x: 0, y: 120, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 33, 'letter-spacing': 5, fill: FULL_COLORS.paper }, big);
  const small = fullNode('2.65', 830, 1210, 105, FULL_COLORS.orange, '元 / 达里奥');
  const company = fullTag('50.1% 控制权', 540, 1450, 580, FULL_COLORS.green, 58);
  const moneyLine = fullStroke('M540 1000V1320', FULL_COLORS.green, 12);
  const smallLine = fullStroke('M700 950C820 980 830 1050 830 1100', FULL_COLORS.orange, 8);
  const final = fullTag('CONTROL 50.1%  /  COST ¥47.35', 540, 1660, 850, FULL_COLORS.ink, 37);
  return t => {
    fullCamera(t, mix(1.04, 1, prog(t, 0, 1)));
    const split = inout(prog(t, .8, 2.5));
    fifty.setAttribute('transform', `translate(540 570) scale(${1 - split * .45}) translate(-540 -570)`); opacity(fifty, 1 - prog(t, 1.6, 2.6));
    fullDraw(splitLine, prog(t, .8, 1.8), .35);
    const p = back(prog(t, 1.5, 2.7)); big.setAttribute('transform', `translate(${mix(540, 390, split)} ${mix(700, 880, split)}) scale(${mix(.3, 1, p)}) rotate(${mix(-20, 0, p)})`); opacity(big, clamp(p));
    const smallIn = back(prog(t, 2.8, 3.7)); small.setAttribute('transform', `translate(830 1210) scale(${smallIn}) rotate(${mix(40, 0, smallIn)})`); opacity(small, clamp(smallIn));
    fullDraw(moneyLine, prog(t, 3.3, 5)); fullDraw(smallLine, prog(t, 3.4, 4.8));
    opacity(company, prog(t, 4.4, 5.2)); opacity(final, prog(t, 5.6, 6.4));
    if (t > 6.4) { const hop = Math.sin(prog(t, 6.4, 7.5) * Math.PI) * 35; small.setAttribute('transform', `translate(830 ${1210 - hop}) rotate(${Math.sin(prog(t, 6.4, 7.5) * Math.PI) * 8})`); }
  };
}

function wrapFullBuilder(builder) {
  const group = el('g', {}, root);
  currentRoot = group;
  const render = builder();
  render.group = group;
  render.header = document.getElementById('headerRoot').lastElementChild;
  currentRoot = root;
  return render;
}

function buildFullScene() {
  const built = FULL_SCENES.map(scene => ({ ...scene, render: wrapFullBuilder(scene.build) }));
  built.forEach(scene => { scene.render.group.style.display = 'none'; scene.render.header.style.display = 'none'; });
  let activeIndex = -1;
  return absoluteSeconds => {
    const t = clamp(absoluteSeconds, 0, 278.784);
    let index = built.findIndex(scene => t >= scene.start && t < scene.end);
    if (index < 0) index = built.length - 1;
    if (index !== activeIndex) {
      built.forEach((scene, i) => {
        scene.render.group.style.display = i === index ? '' : 'none';
        scene.render.header.style.display = i === index ? '' : 'none';
      });
      activeIndex = index;
    }
    const scene = built[index];
    scene.render(t - scene.start);
  };
}
