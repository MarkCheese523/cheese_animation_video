function paPlaque(label, width = 360, color = FULL_COLORS.ink, fontSize = 34) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = `M${-width / 2}-42H${width / 2 - 28}L${width / 2}-14V42H${-width / 2 + 28}L${-width / 2} 14Z`;
  el('path', { d, transform: 'translate(8 9)', fill: FULL_COLORS.ink, opacity: .18 }, group);
  el('path', { d, fill: '#fffdf7', stroke: color, 'stroke-width': 4 }, group);
  el('path', { d: `M${-width / 2 + 12}-29H${width / 2 - 34}M${-width / 2 + 34} 29H${width / 2 - 12}`, fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: .25 }, group);
  for (const side of [-1, 1]) {
    el('circle', { cx: side * (width / 2 - 19), cy: 0, r: 3.5, fill: color, opacity: .65 }, group);
    el('path', { d: `M${side * (width / 2 - 32)}-19V-10M${side * (width / 2 - 32)} 10V19`, stroke: color, 'stroke-width': 2, opacity: .35 }, group);
  }
  for (let i = -2; i <= 2; i++) el('path', { d: `M${i * 13} 32V${i === 0 ? 38 : 35}`, stroke: color, 'stroke-width': 2, opacity: .35 }, group);
  text(label, { x: 0, y: 12, 'text-anchor': 'middle', class: /[A-Za-z0-9%$¥.]/.test(label) ? 'mg-num' : 'mg-text', 'font-size': fontSize, 'font-weight': 900, 'letter-spacing': 2, fill: [FULL_COLORS.green, FULL_COLORS.yellow, FULL_COLORS.paper].includes(color) ? FULL_COLORS.ink : color }, group);
  return group;
}

function paDarkPlaque(label, width = 360, color = FULL_COLORS.green, fontSize = 34) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = `M${-width / 2}-48H${width / 2 - 30}L${width / 2}-18V48H${-width / 2 + 30}L${-width / 2} 18Z`;
  el('path', { d, transform: 'translate(9 10)', fill: color, opacity: .16 }, group);
  el('path', { d, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, group);
  el('path', { d: `M${-width / 2 + 15}-32H${width / 2 - 38}M${-width / 2 + 38} 32H${width / 2 - 15}`, fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: .3 }, group);
  for (const side of [-1, 1]) {
    el('circle', { cx: side * (width / 2 - 20), cy: 0, r: 4, fill: 'none', stroke: color, 'stroke-width': 2, opacity: .7 }, group);
    el('circle', { cx: side * (width / 2 - 20), cy: 0, r: 1.3, fill: color }, group);
  }
  for (let i = -3; i <= 3; i++) el('rect', { x: i * 11 - 2, y: 36, width: 4, height: i % 2 ? 4 : 7, fill: color, opacity: .38 }, group);
  text(label, { x: 0, y: 13, 'text-anchor': 'middle', class: /[A-Za-z0-9%$¥.]/.test(label) ? 'mg-num' : 'mg-text', 'font-size': fontSize, 'font-weight': 900, 'letter-spacing': 2, fill: color }, group);
  return group;
}

function paDocument(title, english, color, variant = 0) {
  const group = el('g', { filter: 'url(#shadow)' });
  const shapes = [
    'M-170-230H105L170-165V230H-170Z',
    'M-170-230H170V165L105 230H-170V-165L-105-230Z',
    'M-170-230H170V-80L125-40L170 0V230H-170V80L-125 40L-170 0Z',
  ];
  const d = shapes[variant % shapes.length];
  for (let i = 2; i >= 1; i--) el('path', { d, transform: `translate(${i * 12} ${i * 11})`, fill: i % 2 ? FULL_COLORS.ink : '#fffdf7', stroke: color, 'stroke-width': 4 }, group);
  el('path', { d, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('path', { d, fill: 'url(#dotFill)', opacity: .09 }, group);
  const grid = [];
  for (let y = -180; y <= 180; y += 40) grid.push(`M-72 ${y}H138`);
  for (let x = -52; x <= 128; x += 45) grid.push(`M${x} -195V198`);
  el('path', { d: grid.join(''), fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 1, opacity: .045 }, group);
  el('path', { d: 'M-75-195H125M-75 195H125M138-175V175', fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: .22 }, group);
  if (variant % 3 === 0) el('path', { d: 'M105-230V-165H170M105-190H145', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 2, opacity: .25 }, group);
  el('path', { d: 'M-170-230H-95V230H-170Z', fill: FULL_COLORS.ink }, group);
  el('path', { d: 'M-170-230H-95V230H-170Z', fill: 'url(#greenDots)', opacity: .35 }, group);
  for (let y = -185; y <= 185; y += 74) {
    el('circle', { cx: -132, cy: y, r: 8, fill: FULL_COLORS.paper, stroke: color, 'stroke-width': 3 }, group);
    el('circle', { cx: -132, cy: y, r: 2.5, fill: FULL_COLORS.ink }, group);
  }
  text(title, { x: -58, y: -80, class: 'mg-text', 'font-size': 55, 'font-weight': 900, fill: FULL_COLORS.ink }, group);
  text(english, { x: -55, y: -32, class: 'mg-num', 'font-size': 21, 'font-weight': 900, 'letter-spacing': 3, fill: FULL_COLORS.gray }, group);
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const slot = el('g', {}, group);
    el('rect', { x: -52, y: 25 + i * 55, width: 165, height: 30, rx: 5, fill: i === variant % 3 ? color : FULL_COLORS.ink, opacity: i === variant % 3 ? .85 : .12 }, slot);
    el('path', { d: `M-52 ${20 + i * 55}H113`, stroke: color, 'stroke-width': 1.5, opacity: .35 }, slot);
    for (let j = 0; j < 5; j++) el('circle', { cx: -35 + j * 31, cy: 40 + i * 55, r: 3, fill: i === variant % 3 ? FULL_COLORS.ink : color }, slot);
    slots.push(slot);
  }
  text(`DOC.${String(variant + 1).padStart(3, '0')} / VERIFIED`, { x: -53, y: 211, class: 'mg-num', 'font-size': 12, 'font-weight': 800, 'letter-spacing': 2, fill: FULL_COLORS.gray }, group);
  el('path', { d: 'M122 184V204H102M-75 204H-60', fill: 'none', stroke: color, 'stroke-width': 3, opacity: .55 }, group);
  group.slots = slots;
  return group;
}

function paMachine(label, color = FULL_COLORS.green, width = 280, height = 300) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = `M${-width / 2}${-height / 2}H${width / 2 - 35}L${width / 2}${-height / 2 + 35}V${height / 2}H${-width / 2 + 35}L${-width / 2}${height / 2 - 35}Z`;
  el('path', { d, transform: 'translate(12 14)', fill: FULL_COLORS.ink, opacity: .2 }, group);
  el('path', { d, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 7 }, group);
  el('path', { d: `M${-width / 2 + 20}${-height / 2 + 20}H${width / 2 - 20}V${height / 2 - 20}H${-width / 2 + 20}Z`, fill: 'url(#greenDots)', stroke: color, 'stroke-width': 1.5, opacity: .25 }, group);
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 24);
    el('path', { d: `M${x} ${-height / 2 + 62}V${height / 2 - 62}`, stroke: color, 'stroke-width': 5, opacity: .5 }, group);
    for (const y of [-height / 2 + 28, height / 2 - 28]) {
      el('circle', { cx: x, cy: y, r: 7, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 2.5 }, group);
      el('path', { d: `M${x - 3} ${y}H${x + 3}`, stroke: color, 'stroke-width': 1.5 }, group);
    }
  }
  text('CONTROL / BUS', { x: 0, y: -height / 2 + 43, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 13, 'font-weight': 900, 'letter-spacing': 3, fill: color, opacity: .65 }, group);
  text(label, { x: 0, y: 20, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 62, 'font-weight': 900, fill: color }, group);
  el('path', { d: `M-62 52H62M-42 66H42`, stroke: color, 'stroke-width': 2, opacity: .25 }, group);
  for (let i = 0; i < 7; i++) el('rect', { x: -72 + i * 22, y: height / 2 - 39, width: 12, height: 10 + (i % 3) * 4, rx: 2, fill: color, opacity: .28 + i * .08 }, group);
  return group;
}

function paEmployeeBadge(id) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = 'M-65-85H45L65-65V85H-65Z';
  el('path', { d, transform: 'translate(6 7)', fill: FULL_COLORS.ink, opacity: .18 }, group);
  el('path', { d, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);
  el('path', { d: 'M-54-48H52V72H-54Z', fill: 'none', stroke: FULL_COLORS.E, 'stroke-width': 1.5, opacity: .35 }, group);
  el('rect', { x: -65, y: -85, width: 130, height: 30, fill: FULL_COLORS.E }, group);
  el('path', { d: 'M-58-52H58', stroke: FULL_COLORS.ink, 'stroke-width': 2, opacity: .3 }, group);
  text(`EMP ${String(id).padStart(3, '0')}`, { x: 0, y: -62, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 17, 'font-weight': 900, 'letter-spacing': 2, fill: FULL_COLORS.ink }, group);
  for (let i = 0; i < 18; i++) el('circle', { cx: -40 + (i % 6) * 16, cy: -25 + Math.floor(i / 6) * 20, r: 3 + i % 2, fill: FULL_COLORS.ink, opacity: .3 + (i % 4) * .13 }, group);
  el('path', { d: 'M-40 43H40M-40 55H20', stroke: FULL_COLORS.ink, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .25 }, group);
  for (let i = 0; i < 12; i++) el('rect', { x: -42 + i * 7, y: 67, width: i % 3 ? 2 : 4, height: 9, fill: FULL_COLORS.ink, opacity: .45 }, group);
  for (const x of [-52, 52]) el('circle', { cx: x, cy: 74, r: 2.5, fill: FULL_COLORS.E }, group);
  return group;
}

function paDollarToken(value = '$1', color = FULL_COLORS.orange) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = 'M-82-52H58L82-28V52H-58L-82 28Z';
  el('path', { d, transform: 'translate(7 8)', fill: color, opacity: .18 }, group);
  el('path', { d, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, group);
  el('path', { d: 'M-67-37H51L66-22V37H-51L-67 22Z', fill: 'url(#dotFill)', stroke: color, 'stroke-width': 1.5, opacity: .35 }, group);
  el('path', { d: 'M-67-27V27M67-16V26', stroke: color, 'stroke-width': 3, opacity: .6 }, group);
  for (const x of [-54, 54]) for (const y of [-31, 31]) el('circle', { cx: x, cy: y, r: 3, fill: color, opacity: .75 }, group);
  for (let i = -2; i <= 2; i++) el('path', { d: `M${i * 12} 40V${i % 2 ? 44 : 47}`, stroke: color, 'stroke-width': 2, opacity: .5 }, group);
  text(value, { x: 0, y: 20, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 58, 'font-weight': 900, fill: color }, group);
  return group;
}

function paBrandBanner(name, width = 600, height = 190, color = FULL_COLORS.ink) {
  const group = el('g', { filter: 'url(#shadow)' });
  const d = `M${-width / 2}${-height / 2}H${width / 2 - 35}L${width / 2}${-height / 2 + 35}V${height / 2}H${-width / 2 + 35}L${-width / 2}${height / 2 - 35}Z`;
  el('path', { d, transform: 'translate(11 12)', fill: FULL_COLORS.ink, opacity: .16 }, group);
  el('path', { d, fill: '#fffdf7', stroke: color, 'stroke-width': 5 }, group);
  el('path', { d: `M${-width / 2 + 16}${-height / 2 + 16}H${width / 2 - 43}M${-width / 2 + 43} ${height / 2 - 16}H${width / 2 - 16}`, fill: 'none', stroke: color, 'stroke-width': 1.5, opacity: .22 }, group);
  el('path', { d: `M${-width / 2}${-height / 2}H${-width / 2 + 26}V${height / 2}H${-width / 2}Z`, fill: color }, group);
  for (let i = 0; i < 9; i++) {
    const x = -width * .34 + i * width * .085;
    el('path', { d: `M${x} ${-height / 2 + 7}V${-height / 2 + (i % 2 ? 12 : 17)}M${x} ${height / 2 - 7}V${height / 2 - (i % 2 ? 12 : 17)}`, stroke: color, 'stroke-width': 2, opacity: .25 }, group);
  }
  el('path', { d: `M${width / 2 - 50} ${-height / 2 + 27}H${width / 2 - 25}V${-height / 2 + 52}M${-width / 2 + 45} ${height / 2 - 27}H${-width / 2 + 25}`, fill: 'none', stroke: color, 'stroke-width': 3, opacity: .45 }, group);
  el('image', { href: `../assets/library/brand-${name}/master.svg`, x: -width * .39, y: -height * .28, width: width * .78, height: height * .56, preserveAspectRatio: 'xMidYMid meet' }, group);
  return group;
}

function paCertificate(type, x = 0, y = 0, scale = 1) {
  const cert = raShareCertificate(type);
  cert.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
  return cert;
}

function paDockedModule(kind, label, color, x, y, scale = .72) {
  const module = raRightModule(kind, label, color);
  module.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
  return module;
}

function paBurst(count, color = FULL_COLORS.green) {
  const group = el('g', {});
  const particles = [];
  for (let i = 0; i < count; i++) {
    const node = el('rect', { width: 6 + i % 5, height: 6 + i % 5, rx: 2, fill: i % 6 === 0 ? color : FULL_COLORS.ink }, group);
    particles.push({ node, i, angle: i * 2.399, radius: 60 + (i % 8) * 24 });
  }
  return { group, particles };
}

function paRenderBurst(burst, x, y, p, visible = 1) {
  burst.particles.forEach(particle => {
    const radius = particle.radius * out(p);
    const px = x + Math.cos(particle.angle) * radius, py = y + Math.sin(particle.angle) * radius;
    particle.node.setAttribute('x', px); particle.node.setAttribute('y', py);
    particle.node.setAttribute('transform', `rotate(${p * 180 + particle.i * 12} ${px} ${py})`);
    opacity(particle.node, Math.sin(clamp(p) * Math.PI) * visible);
  });
}
