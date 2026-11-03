const RA_TYPE_COLORS = { A: '#c6ff3d', N: '#75bfff', T: '#ffd166', F: '#f4f0e6', E: '#ff9ebb' };

function raPattern(id, color) {
  const defs = document.querySelector('#scene defs');
  if (document.getElementById(id)) return;
  const pattern = el('pattern', { id, width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 5, cy: 5, r: 2.5, fill: color }, pattern);
  el('circle', { cx: 15, cy: 15, r: 1.7, fill: color, opacity: .55 }, pattern);
}

function raShareCertificate(type = 'A') {
  const color = RA_TYPE_COLORS[type];
  const patternId = `raDots${type}`;
  raPattern(patternId, color);
  const group = el('g', { filter: 'url(#shadow)' });
  const d = 'M-205-285H122L205-202V218L138 285H-205Z';
  const echoes = [];
  for (let i = 3; i >= 1; i--) {
    echoes.push(el('path', { d, transform: `translate(${i * 13} ${i * 12})`, fill: i % 2 ? FULL_COLORS.ink : '#fffdf7', stroke: color, 'stroke-width': 4, opacity: .75 }, group));
  }
  const body = el('path', { d, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' }, group);
  const dots = el('path', { d, fill: `url(#${patternId})`, opacity: .18 }, group);
  const spine = el('path', { d: 'M-205-285H-118V285H-205Z', fill: FULL_COLORS.ink }, group);
  const spineDots = el('path', { d: 'M-205-285H-118V285H-205Z', fill: `url(#${patternId})`, opacity: .6 }, group);
  text('CLASS', { x: -161, y: -225, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 20, 'font-weight': 800, 'letter-spacing': 3, fill: '#fffdf7', transform: 'rotate(-90 -161 -225)' }, group);
  const letter = text(type, { x: -160, y: 55, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 138, 'font-weight': 900, fill: color }, group);
  text('SHARE / 01', { x: -82, y: -222, class: 'mg-num', 'font-size': 25, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.ink }, group);
  text(type === 'A' ? 'FULL RIGHTS' : `${type} CLASS`, { x: -80, y: -145, class: 'mg-num', 'font-size': 42, 'font-weight': 900, 'letter-spacing': 2, fill: FULL_COLORS.ink }, group);
  el('line', { x1: -80, y1: -105, x2: 150, y2: -105, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, group);
  const serial = text('ANTH / 0001', { x: -78, y: 235, class: 'mg-num', 'font-size': 21, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.gray }, group);
  const ports = [];
  const portPositions = [[-205, -150], [205, -55], [-205, 65], [205, 160]];
  portPositions.forEach(([x, y], i) => {
    const port = el('g', {}, group);
    el('rect', { x: x - 17, y: y - 35, width: 34, height: 70, rx: 6, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 3 }, port);
    for (let j = 0; j < 3; j++) el('circle', { cx: x, cy: y - 18 + j * 18, r: 4, fill: color }, port);
    ports.push(port);
  });
  const seam = el('path', { d: 'M-82-65H145M-82-25H105M-82 15H145M-82 55H80', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-opacity': .16, 'stroke-width': 12, 'stroke-linecap': 'round' }, group);
  group.body = body; group.dots = dots; group.spine = spine; group.spineDots = spineDots;
  group.letter = letter; group.ports = ports; group.echoes = echoes; group.seam = seam;
  return group;
}

function raRightModule(kind, label, color) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = 'M-145-65H105L145-25V65H-105L-145 25Z';
  el('path', { d, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, group);
  el('path', { d, fill: 'url(#dotFill)', opacity: .13 }, group);
  text(label, { x: 0, y: 96, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 31, 'font-weight': 700, 'letter-spacing': 3, fill: FULL_COLORS.ink }, group);
  if (kind === 'vote') {
    text('1 / 1', { x: 0, y: 25, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 65, 'font-weight': 900, fill: color }, group);
    for (let i = 0; i < 5; i++) el('rect', { x: -115 + i * 50, y: -48, width: 26, height: 9, fill: color, opacity: .35 + i * .12 }, group);
  } else if (kind === 'dividend') {
    for (let i = 0; i < 5; i++) el('rect', { x: -108 + i * 45, y: 25 - i * 15, width: 28, height: 30 + i * 15, fill: color, opacity: .45 + i * .1 }, group);
    text('DIV', { x: 93, y: -20, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 900, fill: color }, group);
  } else if (kind === 'transfer') {
    el('path', { d: 'M-105-15H80L45-48M105 28H-80L-45 61', fill: 'none', stroke: color, 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
  } else {
    for (let i = 0; i < 4; i++) el('path', { d: `M${-110 + i * 57}-42H${-70 + i * 57}L${-53 + i * 57}-25V42H${-110 + i * 57}Z`, fill: color, opacity: .4 + i * .16 }, group);
  }
  return group;
}

function raFounderRibbon(name, index, active = false) {
  const group = el('g', { filter: 'url(#shadow)' });
  const width = 410, height = 108;
  const d = `M0 0H${width - 38}L${width} 38V${height}H38L0 ${height - 38}Z`;
  el('path', { d, transform: 'translate(9 10)', fill: 'none', stroke: active ? FULL_COLORS.green : FULL_COLORS.ink, 'stroke-width': 5, opacity: .55 }, group);
  el('path', { d, fill: active ? FULL_COLORS.ink : '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);
  el('path', { d: `M0 0H72V${height}H38L0 ${height - 38}Z`, fill: active ? FULL_COLORS.green : FULL_COLORS.ink }, group);
  text(String(index).padStart(2, '0'), { x: 39, y: 67, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 43, 'font-weight': 900, fill: active ? FULL_COLORS.ink : FULL_COLORS.green }, group);
  text(name.toUpperCase(), { x: 96, y: 51, class: 'mg-num', 'font-size': name.length > 13 ? 25 : 30, 'font-weight': 900, 'letter-spacing': 1.5, fill: active ? FULL_COLORS.green : FULL_COLORS.ink }, group);
  text('CO-FOUNDER', { x: 98, y: 82, class: 'mg-num', 'font-size': 16, 'font-weight': 800, 'letter-spacing': 4, fill: active ? FULL_COLORS.paper : FULL_COLORS.gray }, group);
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const dot = el('circle', { cx: 300 + (i % 6) * 16, cy: 70 + Math.floor(i / 6) * 16, r: i % 3 === 0 ? 4 : 2.5, fill: active ? FULL_COLORS.green : FULL_COLORS.ink, opacity: .3 + (i % 4) * .15 }, group);
    dots.push(dot);
  }
  group.dots = dots; group.width = width; group.height = height;
  return group;
}

function raDotField(count, x, y, width, height, color = FULL_COLORS.ink) {
  const group = el('g', {});
  const dots = [];
  for (let i = 0; i < count; i++) {
    const px = x + ((i * 83) % 997) / 997 * width;
    const py = y + ((i * 157) % 991) / 991 * height;
    const node = el('circle', { cx: px, cy: py, r: 2 + (i % 4), fill: i % 11 === 0 ? FULL_COLORS.green : color, opacity: .12 + (i % 5) * .08 }, group);
    dots.push({ node, x: px, y: py, i });
  }
  return { group, dots };
}

function raToken(label, color = FULL_COLORS.green) {
  const group = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-120-70H85L120-35V70H-85L-120 35Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 6 }, group);
  text(label, { x: 0, y: 27, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 74, 'font-weight': 900, fill: color }, group);
  return group;
}
