function buildFoundersRedesign() {
  header('04', 'SEVEN NAMES → ONE FOUNDING STRUCTURE');
  const ghost = text('07', { x: 780, y: 1150, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 760, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .055 });
  const field = raDotField(74, 40, 230, 980, 1290);
  const anthropicGhost = fullLogo('anthropic', 160, 1300, 760, 160);
  anthropicGhost.setAttribute('opacity', '.06');

  const person = el('g', { filter: 'url(#shadow)' });
  el('image', { href: '../assets/library/person-dario-amodei/master.png', x: 0, y: 0, width: 410, height: 513, preserveAspectRatio: 'xMidYMid meet' }, person);
  el('path', { d: 'M0 525H410L380 555H30Z', fill: FULL_COLORS.ink }, person);
  text('DARIO AMODEI', { x: 24, y: 600, class: 'mg-num', 'font-size': 32, 'font-weight': 900, 'letter-spacing': 3, fill: FULL_COLORS.ink }, person);
  text('01 / CO-FOUNDER', { x: 26, y: 635, class: 'mg-num', 'font-size': 19, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.gray }, person);

  const names = ['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Jack Clark', 'Jared Kaplan', 'Sam McCandlish', 'Chris Olah'];
  const ribbons = names.map((name, i) => {
    const node = raFounderRibbon(name, i + 1, i === 0);
    const startX = i % 2 ? 1120 : -510;
    const queueX = 555 + (i % 2) * 25;
    const queueY = 285 + i * 143;
    const stackX = 285 + i * 12;
    const stackY = 505 + i * 104;
    return { node, name, i, startX, queueX, queueY, stackX, stackY };
  });

  const company = saCompanyBuilding();
  const anthropic = fullLogo('anthropic', 250, 1450, 600, 130);
  const token = raToken('¥50');
  const thread = fullStroke('M810 1230 C970 1080 870 830 760 870 C610 930 770 1190 550 1450', FULL_COLORS.green, 12);
  const threadGlow = fullStroke('M810 1230 C970 1080 870 830 760 870 C610 930 770 1190 550 1450', FULL_COLORS.green, 40);
  threadGlow.node.setAttribute('filter', 'url(#softGlow)');
  const stream = [];
  for (let i = 0; i < 49; i++) {
    const node = el('rect', { width: 7 + i % 4, height: 7 + i % 4, rx: 2, fill: i % 8 === 0 ? FULL_COLORS.green : FULL_COLORS.ink });
    stream.push({ node, i, ribbon: i % 7 });
  }
  const caption = text('七个名字，叠成同一个控制主体', { x: 540, y: 1650, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 43, 'letter-spacing': 5, fill: FULL_COLORS.ink });

  return t => {
    const gather = inout(prog(t, 4.25, 6.8));
    const finish = inout(prog(t, 6.7, 8.7));
    const zoom = t < 4.2 ? mix(1.08, 1, out(prog(t, 0, 2))) : mix(1, 1.12, finish);
    fullCamera(t, zoom, mix(960, 1010, finish));
    ghost.setAttribute('transform', `translate(0 ${mix(120, 0, prog(t, 0, 2))}) rotate(${-8 + gather * 8} 780 900)`);
    field.dots.forEach(dot => {
      dot.node.setAttribute('cx', dot.x + Math.sin(t * .8 + dot.i) * 9);
      dot.node.setAttribute('cy', dot.y + Math.cos(t * .6 + dot.i) * 7);
    });
    opacity(field.group, .55 * (1 - gather * .6));

    const personIn = back(prog(t, .1, 1.05));
    const personExit = inout(prog(t, 4.2, 6.1));
    person.setAttribute('transform', `translate(${mix(-130, 45, personIn) - personExit * 85} ${mix(390, 315, personIn) + personExit * 80}) scale(${mix(.75, .9, personIn) * (1 - personExit * .22)}) rotate(${mix(-8, 0, personIn) - personExit * 4})`);
    opacity(person, clamp(personIn) * (1 - personExit * .72));

    ribbons.forEach(item => {
      const enter = back(prog(t, .65 + item.i * .32, 1.55 + item.i * .32));
      let x = mix(item.startX, item.queueX, enter);
      let y = mix(item.queueY - 80, item.queueY, enter);
      x = mix(x, item.stackX, gather); y = mix(y, item.stackY, gather);
      const rotate = mix(mix(item.i % 2 ? 9 : -9, item.i % 2 ? 2 : -2, enter), -5 + item.i * .45, gather);
      const scale = mix(.82, .92, enter) * mix(1, .93, gather);
      item.node.setAttribute('transform', `translate(${x} ${y}) rotate(${rotate} 205 54) scale(${scale})`);
      opacity(item.node, clamp(enter));
      item.node.dots.forEach((dot, j) => dot.setAttribute('opacity', .25 + .65 * Math.abs(Math.sin(t * 3 + j * .5 + item.i))));
    });

    opacity(company, prog(t, 5.4, 6.5));
    company.setAttribute('transform', `translate(550 ${mix(1390, 1300, out(prog(t, 5.4, 6.7)))}) scale(.42)`);
    company.flag.setAttribute('transform', `rotate(${Math.sin(t * 2.2) * 3} -12 -228)`);
    opacity(anthropic, prog(t, 6.7, 7.7));
    anthropic.setAttribute('transform', `translate(0 ${mix(80, 0, out(prog(t, 6.7, 7.8)))})`);
    const tokenIn = back(prog(t, 6.1, 7)); token.setAttribute('transform', `translate(810 1230) scale(${tokenIn}) rotate(${mix(25, -5, tokenIn)})`); opacity(token, clamp(tokenIn));
    const draw = out(prog(t, 6.9, 8.8)); fullDraw(threadGlow, draw, .17); fullDraw(thread, draw);
    stream.forEach(particle => {
      const p = inout(prog(t, 5.7 + (particle.i % 9) * .08, 8.3 + (particle.i % 9) * .08));
      const sourceX = 650 + (particle.i % 7) * 8, sourceY = 550 + particle.ribbon * 104;
      const x = mix(sourceX, 400 + (particle.i % 14) * 22, p);
      const y = mix(sourceY, 1480 + (particle.i % 4) * 13, p) - Math.sin(p * Math.PI) * (160 + particle.i % 5 * 20);
      particle.node.setAttribute('x', x); particle.node.setAttribute('y', y);
      particle.node.setAttribute('transform', `rotate(${p * 240 + particle.i * 10} ${x} ${y})`);
      opacity(particle.node, Math.sin(p * Math.PI) * .75);
    });
    opacity(caption, prog(t, 7.6, 8.4));
  };
}

function buildClassARedesign() {
  header('13', 'CLASS A — FOUR MODULES / ONE COMPLETE SHARE');
  const ghost = text('A', { x: 825, y: 1120, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 840, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .045 });
  const field = raDotField(92, 80, 250, 920, 1180);
  const assembly = el('g', {});
  const previousRoot = currentRoot; currentRoot = assembly;
  const certificate = raShareCertificate('A');
  currentRoot = previousRoot;
  const specs = [
    { kind: 'vote', label: '投票权 / 1股1票', color: FULL_COLORS.green, x: 155, y: 555, start: 2.0, fromX: -260, fromY: 330 },
    { kind: 'dividend', label: '股息权', color: FULL_COLORS.blue, x: 920, y: 735, start: 4.25, fromX: 1250, fromY: 420 },
    { kind: 'transfer', label: '转让权', color: FULL_COLORS.purple, x: 155, y: 1030, start: 6.5, fromX: -270, fromY: 1260 },
    { kind: 'capital', label: '清算分配权', color: FULL_COLORS.orange, x: 920, y: 1120, start: 8.75, fromX: 1260, fromY: 1330 },
  ];
  const modules = specs.map((spec, i) => {
    const node = raRightModule(spec.kind, spec.label, spec.color);
    const trail = fullStroke(`M${spec.fromX} ${spec.fromY} Q${spec.x + (i % 2 ? 160 : -160)} ${spec.y - 180} ${spec.x} ${spec.y}`, spec.color, 5);
    return { node, trail, spec, i };
  });
  const complete = el('g', {});
  el('path', { d: 'M250 1300H830L870 1340V1420H290L250 1380Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 5 }, complete);
  text('FULL RIGHTS / 四项权利已接入', { x: 560, y: 1378, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 39, 'letter-spacing': 4, fill: FULL_COLORS.green }, complete);

  const holders = ['创始人', '管理团队', '投资者'].map((label, i) => {
    const group = el('g', {});
    const holderRoot = currentRoot; currentRoot = group;
    const cert = raShareCertificate('A');
    cert.setAttribute('transform', 'scale(.28)');
    text(label, { x: 0, y: 125, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 29, 'letter-spacing': 3, fill: FULL_COLORS.ink }, group);
    currentRoot = holderRoot;
    return { group, cert, label, i };
  });
  const ipo = el('g', {});
  text('IPO', { x: 540, y: 1080, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 320, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.green, 'stroke-width': 6, opacity: .22 }, ipo);
  el('path', { d: 'M170 1430V1200H250M910 1430V1200H830', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 16, 'stroke-linecap': 'square' }, ipo);
  text('PUBLIC CIRCULATION', { x: 540, y: 1490, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 30, 'font-weight': 900, 'letter-spacing': 7, fill: FULL_COLORS.ink }, ipo);
  const ipoStream = [];
  for (let i = 0; i < 44; i++) {
    const node = el('rect', { width: 8, height: 8, rx: 2, fill: i % 5 ? FULL_COLORS.green : FULL_COLORS.ink });
    ipoStream.push({ node, i });
  }
  const finalLabel = text('A 股 = 完整权利 + 上市流通', { x: 540, y: 1650, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 48, 'letter-spacing': 5, fill: FULL_COLORS.ink });

  return t => {
    const holderPhase = inout(prog(t, 11.2, 13.4));
    const ipoPhase = inout(prog(t, 14.2, 17.5));
    let zoom = mix(1.13, 1, out(prog(t, 0, 1.5)));
    if (t > 10.8) zoom = mix(1, .93, holderPhase);
    if (t > 14.2) zoom = mix(.93, 1.06, ipoPhase);
    fullCamera(t, zoom, mix(960, 880, ipoPhase));
    ghost.setAttribute('transform', `rotate(${t * 1.2} 825 850) scale(${1 + Math.sin(t) * .015})`);
    field.dots.forEach(dot => {
      const converge = out(prog(t, 0, 1.6));
      const tx = 345 + (dot.i % 12) * 32, ty = 600 + (dot.i % 17) * 34;
      dot.node.setAttribute('cx', mix(dot.x, tx, converge)); dot.node.setAttribute('cy', mix(dot.y, ty, converge));
      opacity(dot.node, (1 - converge) * .65 + .06);
    });
    const certIn = back(prog(t, .25, 1.45));
    const assemblyY = mix(850, 720, holderPhase) - ipoPhase * 80;
    const assemblyScale = mix(.72, .88, certIn) * mix(1, .78, holderPhase) * mix(1, 1.15, ipoPhase);
    assembly.setAttribute('transform', `translate(540 ${assemblyY}) rotate(${mix(-7, 0, certIn) + Math.sin(t * 1.5) * .6}) scale(${assemblyScale})`);
    opacity(assembly, clamp(certIn));
    certificate.dots.setAttribute('opacity', .1 + prog(t, .3, 1.5) * .18);
    certificate.echoes.forEach((echo, i) => echo.setAttribute('transform', `translate(${(i + 1) * (13 + Math.sin(t * 2 + i) * 2)} ${(i + 1) * 12})`));

    modules.forEach(({ node, trail, spec, i }) => {
      const p = back(prog(t, spec.start, spec.start + 1.05));
      const dock = inout(prog(t, spec.start + .45, spec.start + 1.35));
      let x = mix(spec.fromX, spec.x + (i % 2 ? 85 : -85), p);
      let y = mix(spec.fromY, spec.y - 100, p);
      x = mix(x, spec.x, dock); y = mix(y, spec.y, dock);
      const holderShift = holderPhase * (i % 2 ? 65 : -65);
      const finalX = x + holderShift - ipoPhase * (i % 2 ? 35 : -35);
      const finalY = y - holderPhase * 130 - ipoPhase * 80;
      node.setAttribute('transform', `translate(${finalX} ${finalY}) rotate(${mix(i % 2 ? 35 : -35, 0, p)}) scale(${mix(.55, .72, p)})`);
      opacity(node, clamp(p));
      fullDraw(trail, prog(t, spec.start, spec.start + .8), (1 - dock) * .45);
      const port = certificate.ports[i];
      port.setAttribute('transform', `scale(${1 + Math.sin(prog(t, spec.start + .8, spec.start + 1.5) * Math.PI) * .8})`);
    });
    opacity(complete, prog(t, 10.5, 11.3) * (1 - prog(t, 11.8, 12.4)));

    holders.forEach(({ group, i }) => {
      const p = back(prog(t, 11.5 + i * .45, 12.5 + i * .45));
      const stream = inout(prog(t, 14.5 + i * .2, 16.8 + i * .2));
      const x = mix(250 + i * 290, 540, stream), y = mix(1270 + (i % 2) * 100, 1070, stream);
      group.setAttribute('transform', `translate(${x} ${y}) rotate(${mix((i - 1) * 12, 0, stream)}) scale(${p * (1 - stream * .65)})`);
      opacity(group, clamp(p) * (1 - prog(t, 16.2, 17.2)));
    });
    opacity(ipo, prog(t, 14.1, 15.2));
    ipo.setAttribute('transform', `translate(0 ${mix(160, 0, out(prog(t, 14.1, 15.6)))})`);
    ipoStream.forEach(particle => {
      const p = (prog(t, 14.8, 18.8) + particle.i / 44) % 1;
      const angle = particle.i * 2.399;
      const radius = 310 * (1 - p);
      const x = 540 + Math.cos(angle + p * 4) * radius;
      const y = 1190 - p * 420 + Math.sin(angle) * 60;
      particle.node.setAttribute('x', x); particle.node.setAttribute('y', y);
      particle.node.setAttribute('transform', `rotate(${p * 360} ${x} ${y})`);
      opacity(particle.node, prog(t, 14.5, 15.2) * Math.sin(p * Math.PI) * .7);
    });
    opacity(finalLabel, prog(t, 17.6, 18.6));
  };
}
