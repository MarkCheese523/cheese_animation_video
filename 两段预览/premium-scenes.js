function buildDoubtPremium() {
  header('02', 'THURSDAY / AD? / THE ¥50 QUESTION');
  const ghost = text('THU', { x: 540, y: 1160, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 410, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .055 });
  const calendar = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-350-210H310L350-170V250H-310L-350 210Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, calendar);
  el('path', { d: 'M-350-210H310L350-170V-95H-350Z', fill: FULL_COLORS.ink }, calendar);
  text('THURSDAY', { x: 0, y: -135, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 65, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.green }, calendar);
  const cells = [];
  for (let i = 0; i < 21; i++) {
    const cell = el('rect', { x: -295 + (i % 7) * 85, y: -50 + Math.floor(i / 7) * 75, width: 62, height: 50, rx: 5, fill: i === 11 ? FULL_COLORS.orange : FULL_COLORS.ink, opacity: i === 11 ? .95 : .1 }, calendar);
    cells.push(cell);
  }
  const stamp = el('g', {});
  el('path', { d: 'M-230-70H200L230-40V70H-200L-230 40Z', fill: FULL_COLORS.paper, stroke: FULL_COLORS.orange, 'stroke-width': 11 }, stamp);
  text('某基广告？', { x: 0, y: 23, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 67, 'font-weight': 900, fill: FULL_COLORS.orange }, stamp);
  const token = raToken('¥50');
  const questions = [];
  for (let i = 0; i < 11; i++) {
    const plate = el('g', {});
    el('path', { d: 'M-52-78H35L52-61V78H-35L-52 61Z', fill: i % 3 === 0 ? FULL_COLORS.orange : FULL_COLORS.ink }, plate);
    text('?', { x: 0, y: 37, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 105, 'font-weight': 900, fill: i % 3 === 0 ? FULL_COLORS.paper : FULL_COLORS.green }, plate);
    questions.push({ plate, i, angle: -Math.PI * .9 + i * Math.PI * 1.8 / 10 });
  }
  const tear = fullStroke('M180 1210C390 1050 690 1300 910 1110', FULL_COLORS.green, 10);
  const caption = paDarkPlaque('50元，凭什么控制巨头？', 720, FULL_COLORS.green, 45);
  const burst = paBurst(32, FULL_COLORS.orange);
  return t => {
    const tokenPhase = inout(prog(t, 1.9, 3.2));
    const zoom = mix(1, 1.12, inout(prog(t, 3.2, 6.7)));
    fullCamera(t, zoom, mix(960, 1020, tokenPhase));
    ghost.setAttribute('transform', `translate(0 ${mix(120, 0, prog(t, 0, 1.4))})`);
    const calIn = back(prog(t, 0, .8));
    calendar.setAttribute('transform', `translate(540 ${mix(170, 500, calIn)}) rotate(${mix(-16, -3, calIn)}) scale(${mix(.65, .88, calIn)})`);
    opacity(calendar, clamp(calIn) * (1 - tokenPhase * .65));
    cells.forEach((cell, i) => cell.setAttribute('opacity', i === 11 ? .7 + Math.sin(t * 8) * .25 : .05 + prog(t, .3 + i * .025, .8 + i * .025) * .12));
    const hit = back(prog(t, .35, .95));
    stamp.setAttribute('transform', `translate(540 ${mix(90, 480, hit)}) rotate(${mix(-24, 7, hit)}) scale(${mix(2.2, 1, hit)})`);
    opacity(stamp, clamp(hit) * (1 - prog(t, 2.3, 3.1)));
    paRenderBurst(burst, 540, 500, prog(t, .65, 1.35), .8);
    const tokenIn = back(prog(t, 1.65, 2.55));
    token.setAttribute('transform', `translate(540 1050) rotate(${mix(-28, -6, tokenIn)}) scale(${mix(.3, 2.05, tokenIn)})`);
    opacity(token, clamp(tokenIn));
    fullDraw(tear, prog(t, 2.4, 4.2), .5);
    questions.forEach(({ plate, i, angle }) => {
      const p = inout(prog(t, 3 + i * .07, 6.3 + i * .07));
      const radius = mix(520, 290, p), theta = angle + p * .55;
      const x = 540 + Math.cos(theta) * radius, y = 1050 + Math.sin(theta) * radius * .82;
      plate.setAttribute('transform', `translate(${x} ${y}) rotate(${mix(i % 2 ? 50 : -50, 0, p)}) scale(${mix(.8, .48, p)})`);
      opacity(plate, prog(t, 2.8 + i * .05, 3.5 + i * .05));
    });
    caption.setAttribute('transform', 'translate(540 1600)'); opacity(caption, prog(t, 5.4, 6.2));
  };
}

function buildReversalPremium() {
  header('03', 'REGION LOCK / THE CONTROL LINE SURVIVES');
  const ghost = fullLogo('claude', 120, 260, 840, 840); opacity(ghost, .035);
  const member = paBrandBanner('claude', 790, 350, FULL_COLORS.ink);
  const memberLabel = text('MEMBER ACCESS / 会员账号', { x: 0, y: 120, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.gray }, member);
  const lock = paDarkPlaque('REGION LOCK / 地区限制', 710, FULL_COLORS.orange, 40);
  const shutters = [];
  for (let i = 0; i < 5; i++) {
    const blade = el('path', { d: 'M-420-34H390L420-10V34H-390L-420 10Z', fill: FULL_COLORS.ink, opacity: .88 });
    shutters.push(blade);
  }
  const token = raToken('¥50');
  const company = paBrandBanner('anthropic', 680, 220, FULL_COLORS.green);
  const control = paDarkPlaque('CONTROL / 控制权', 440, FULL_COLORS.green, 38);
  const route = fullStroke('M250 1180C390 1410 890 1410 885 1130C880 950 490 1100 500 890C510 720 720 720 805 790', FULL_COLORS.green, 13);
  const glow = fullStroke('M250 1180C390 1410 890 1410 885 1130C880 950 490 1100 500 890C510 720 720 720 805 790', FULL_COLORS.green, 45);
  glow.node.setAttribute('filter', 'url(#softGlow)');
  const travelers = [];
  for (let i = 0; i < 12; i++) {
    const node = el('rect', { width: 12, height: 12, rx: 3, fill: i % 4 ? FULL_COLORS.green : FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 2 });
    travelers.push({ node, i });
  }
  const caption = paPlaque('会员被拦下，控制路径绕过去', 720, FULL_COLORS.ink, 39);
  return t => {
    const routePhase = out(prog(t, 3.1, 7.5));
    fullCamera(t, mix(1.04, 1, prog(t, 0, 1)) + Math.sin(prog(t, 4, 8) * Math.PI) * .05, mix(960, 1010, prog(t, 4, 8)));
    member.setAttribute('transform', `translate(540 ${460 + prog(t, .6, 2.4) * 55}) rotate(${-3 - prog(t, .6, 2.4) * 4})`);
    opacity(member, 1 - prog(t, 1.2, 2.6) * .72); opacity(memberLabel, .8);
    lock.setAttribute('transform', `translate(540 ${mix(120, 460, back(prog(t, .35, 1.1)))}) rotate(-5)`); opacity(lock, prog(t, .25, .8));
    shutters.forEach((blade, i) => {
      const p = inout(prog(t, .8 + i * .15, 1.7 + i * .15));
      blade.setAttribute('transform', `translate(${mix(i % 2 ? 1400 : -320, 540, p)} ${310 + i * 78}) rotate(-5)`);
      opacity(blade, p * .75);
    });
    token.setAttribute('transform', 'translate(220 1160) rotate(-8) scale(.85)'); opacity(token, prog(t, 2.2, 2.8));
    company.setAttribute('transform', 'translate(720 760) rotate(3) scale(.82)'); opacity(company, prog(t, 5.8, 6.8));
    control.setAttribute('transform', 'translate(760 1040) rotate(-3) scale(.82)'); opacity(control, prog(t, 6.8, 7.6));
    fullDraw(glow, routePhase, .17); fullDraw(route, routePhase);
    travelers.forEach(({ node, i }) => {
      const p = clamp(routePhase - i * .035);
      const point = route.node.getPointAtLength(route.length * p);
      node.setAttribute('x', point.x - 6); node.setAttribute('y', point.y - 6);
      node.setAttribute('transform', `rotate(${p * 360 + i * 20} ${point.x} ${point.y})`);
      opacity(node, prog(t, 3.2 + i * .08, 3.6 + i * .08) * (1 - prog(t, 8.2, 8.8)));
    });
    caption.setAttribute('transform', 'translate(540 1630)'); opacity(caption, prog(t, 7.5, 8.3));
  };
}

function buildShareTypesPremium() {
  header('05', 'THREE SHARE FORMS / THREE RIGHT STRUCTURES');
  const ghost = text('STOCK', { x: 540, y: 1110, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 250, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .05 });
  const origin = paDocument('股票', 'STOCK / ONE WORD', FULL_COLORS.paper, 0);
  const specs = [
    { title: '普通股', en: 'COMMON', color: FULL_COLORS.A, x: 205, angle: -10 },
    { title: '优先股', en: 'PREFERRED', color: FULL_COLORS.N, x: 540, angle: 1 },
    { title: '可赎回股', en: 'REDEEMABLE', color: FULL_COLORS.T, x: 875, angle: 10 },
  ];
  const documents = specs.map((spec, i) => ({ ...spec, doc: paDocument(spec.title, spec.en, spec.color, i), i }));
  const moduleSpecs = [
    ['vote', '投票', FULL_COLORS.green], ['dividend', '股息', FULL_COLORS.blue], ['capital', '清算', FULL_COLORS.orange],
    ['capital', '清算', FULL_COLORS.orange], ['transfer', '赎回', FULL_COLORS.yellow], ['vote', '投票', FULL_COLORS.green],
  ];
  const modules = moduleSpecs.map(([kind, label, color], i) => ({ node: raRightModule(kind, label, color), i, column: i % 3, row: Math.floor(i / 3) }));
  const caption = paDarkPlaque('名字不同，权利结构也不同', 690, FULL_COLORS.green, 42);
  const burst = paBurst(36, FULL_COLORS.green);
  return t => {
    const split = inout(prog(t, 1.1, 3.5));
    fullCamera(t, mix(1.12, 1, out(prog(t, 0, 1.5))) + Math.sin(prog(t, 4, 8) * Math.PI) * .035);
    origin.setAttribute('transform', `translate(540 ${mix(790, 480, split)}) rotate(${mix(-5, 0, split)}) scale(${mix(.85, .55, split)})`);
    opacity(origin, 1 - prog(t, 2.2, 3.5));
    documents.forEach(({ doc, x, angle, i }) => {
      const p = back(prog(t, 1.35 + i * .3, 2.55 + i * .3));
      const reorder = inout(prog(t, 4.6 + i * .25, 7.4 + i * .25));
      doc.setAttribute('transform', `translate(${mix(540, x, p)} ${mix(850, 920, p) + Math.sin(t * 1.7 + i) * 10 * reorder}) rotate(${mix(0, angle, p) + Math.sin(reorder * Math.PI) * (i - 1) * 8}) scale(${mix(.4, .62, p)})`);
      opacity(doc, clamp(p));
      doc.slots.forEach((slot, j) => slot.setAttribute('transform', `translate(${Math.sin(reorder * Math.PI + j) * 22} ${reorder * (j - 1) * 9})`));
    });
    modules.forEach(({ node, i, column, row }) => {
      const p = back(prog(t, 3.4 + i * .28, 4.25 + i * .28));
      const x = 205 + column * 335 + (row ? 55 : -55), y = 1300 + row * 150 + (column === 1 ? 45 : 0);
      node.setAttribute('transform', `translate(${mix(540, x, p)} ${mix(850, y, p)}) rotate(${mix((column - 1) * 60, (column - 1) * 7, p)}) scale(${mix(.2, .48, p)})`);
      opacity(node, clamp(p));
    });
    paRenderBurst(burst, 540, 850, prog(t, 1.3, 2.6), .65);
    caption.setAttribute('transform', 'translate(540 1660)'); opacity(caption, prog(t, 7.2, 8));
  };
}

function buildRightsSplitPremium() {
  header('06', 'SPLIT THE CERTIFICATE / REVEAL THREE RIGHTS');
  const ghost = text('03', { x: 790, y: 1210, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 650, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .05 });
  const certificate = paDocument('股票', 'ONE CERTIFICATE', FULL_COLORS.paper, 0);
  const slices = [];
  const colors = [FULL_COLORS.green, FULL_COLORS.blue, FULL_COLORS.orange];
  for (let i = 0; i < 3; i++) {
    const slice = el('g', { filter: 'url(#shadow)' });
    el('path', { d: 'M-190-65H155L190-30V65H-155L-190 30Z', fill: FULL_COLORS.ink, stroke: colors[i], 'stroke-width': 5 }, slice);
    for (let j = 0; j < 12; j++) el('rect', { x: -150 + j * 26, y: -8, width: 13, height: 16, fill: colors[i], opacity: .2 + (j % 5) * .14 }, slice);
    slices.push(slice);
  }
  const specs = [
    { kind: 'vote', label: '投票权', en: 'VOTING RIGHTS', color: FULL_COLORS.green, y: 480, start: 1.5 },
    { kind: 'dividend', label: '股息权', en: 'DIVIDEND RIGHTS', color: FULL_COLORS.blue, y: 900, start: 4.2 },
    { kind: 'capital', label: '清算分配权', en: 'CAPITAL RIGHTS', color: FULL_COLORS.orange, y: 1320, start: 6.9 },
  ];
  const rights = specs.map((spec, i) => {
    const module = spec.kind === 'vote' ? saVoteMark(spec.label, spec.color) : raRightModule(spec.kind, spec.label, spec.color);
    const en = text(spec.en, { x: 770, y: spec.y + 155, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 900, 'letter-spacing': 4, fill: FULL_COLORS.gray });
    const rail = fullStroke(`M280 850C430 850 430 ${spec.y} 610 ${spec.y}`, spec.color, 13);
    return { ...spec, module, en, rail, i };
  });
  const caption = paPlaque('一份凭证，拆成三条独立权利通道', 760, FULL_COLORS.ink, 39);
  return t => {
    fullCamera(t, mix(1.08, 1, prog(t, 0, 1.2)), 900);
    const split = inout(prog(t, .8, 2.1));
    certificate.setAttribute('transform', `translate(${mix(540, 175, split)} 850) rotate(${mix(0, -7, split)}) scale(${mix(.82, .48, split)})`);
    opacity(certificate, 1 - prog(t, 2.2, 3.3) * .65);
    slices.forEach((slice, i) => {
      const p = inout(prog(t, .9 + i * .25, 2.4 + i * .25));
      slice.setAttribute('transform', `translate(${mix(540, 190, p)} ${mix(850, 600 + i * 250, p)}) rotate(${mix(0, -6 + i * 6, p)}) scale(${mix(.8, .45, p)})`);
      opacity(slice, prog(t, .8 + i * .2, 1.3 + i * .2) * (1 - prog(t, 3.2, 4.1)));
    });
    rights.forEach(right => {
      const p = back(prog(t, right.start + .65, right.start + 1.55));
      fullDraw(right.rail, out(prog(t, right.start, right.start + 1.25)));
      right.module.setAttribute('transform', `translate(${mix(280, 770, p)} ${right.y}) rotate(${mix(-35, 0, p)}) scale(${mix(.35, .82, p)})`);
      opacity(right.module, clamp(p)); opacity(right.en, prog(t, right.start + 1, right.start + 1.7));
      if (right.kind === 'vote') {
        const voteIn = out(prog(t, right.start + .8, right.start + 1.5));
        right.module.raisedArm.setAttribute('transform', `rotate(${mix(28, 0, voteIn) + Math.sin(t * 3) * 2 * voteIn} 34 -28)`);
        const drop = inout(prog(t, right.start + 1, right.start + 1.65));
        right.module.ballot.setAttribute('transform', `translate(0 ${mix(-45, 20, drop)}) scale(${mix(1.15, .85, drop)})`);
        opacity(right.module.ballot, prog(t, right.start + .9, right.start + 1.15) * (1 - prog(t, right.start + 1.55, right.start + 1.9)));
      }
    });
    caption.setAttribute('transform', 'translate(540 1690)'); opacity(caption, prog(t, 8.7, 9.5));
  };
}

function buildRightsTranslationPremium() {
  header('07', 'UNFOLD THE TERMS / SEE THE OUTCOMES');
  const specs = [
    { kind: 'vote', term: '投票权', result: '能投几票？', color: FULL_COLORS.green, y: 450, start: .7 },
    { kind: 'dividend', term: '股息权', result: '能拿多少分红？', color: FULL_COLORS.blue, y: 875, start: 3.4 },
    { kind: 'capital', term: '清算分配权', result: '散伙拿多少？', color: FULL_COLORS.orange, y: 1300, start: 6.1 },
  ];
  const rows = specs.map((spec, i) => {
    const module = raRightModule(spec.kind, spec.term, spec.color);
    const outcome = el('g', { filter: 'url(#shadow)' });
    el('path', { d: 'M-265-105H225L265-65V105H-225L-265 65Z', fill: '#fffdf7', stroke: spec.color, 'stroke-width': 6 }, outcome);
    el('path', { d: 'M-265-105H-225V105H-265Z', fill: spec.color }, outcome);
    text(spec.result, { x: 0, y: 22, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 57, 'font-weight': 900, fill: FULL_COLORS.ink }, outcome);
    text(`0${i + 1} / OUTCOME`, { x: 0, y: 75, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 19, 'font-weight': 900, 'letter-spacing': 4, fill: FULL_COLORS.gray }, outcome);
    const hinge = fullStroke(`M290 ${spec.y}C410 ${spec.y - 90} 450 ${spec.y + 90} 500 ${spec.y}`, spec.color, 10);
    return { ...spec, module, outcome, hinge, i };
  });
  const drawer = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-360-75H330L360-45V75H-330L-360 45Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.purple, 'stroke-width': 5 }, drawer);
  text('其他权利 / 今天不展开', { x: 0, y: 15, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 38, fill: FULL_COLORS.paper }, drawer);
  const transfer = paDockedModule('transfer', '转让权', FULL_COLORS.purple, 0, 0, .45);
  const redeem = paDockedModule('capital', '赎回权', FULL_COLORS.yellow, 0, 0, .45);
  const caption = paPlaque('法律术语，展开成真实结果', 680, FULL_COLORS.ink, 40);
  return t => {
    fullCamera(t, 1 + Math.sin(prog(t, 0, 12) * Math.PI) * .035);
    rows.forEach(row => {
      const p = back(prog(t, row.start, row.start + .9));
      const unfold = out(prog(t, row.start + .55, row.start + 1.65));
      row.module.setAttribute('transform', `translate(190 ${row.y}) rotate(-6) scale(.62)`);
      opacity(row.module, clamp(p));
      row.outcome.setAttribute('transform', `translate(${mix(1060, 745, unfold)} ${row.y}) rotate(${mix(18, 2, unfold)}) scale(${mix(.25, .82, unfold)} ${mix(1.4, 1, unfold)})`);
      opacity(row.outcome, clamp(unfold)); fullDraw(row.hinge, out(prog(t, row.start + .3, row.start + 1.2)));
    });
    const retreat = inout(prog(t, 8.7, 11));
    transfer.setAttribute('transform', `translate(${mix(230, 430, retreat)} ${mix(1570, 1560, retreat)}) rotate(${-12 + retreat * 12}) scale(${mix(.48, .3, retreat)})`);
    redeem.setAttribute('transform', `translate(${mix(790, 650, retreat)} ${mix(1570, 1560, retreat)}) rotate(${12 - retreat * 12}) scale(${mix(.48, .3, retreat)})`);
    opacity(transfer, prog(t, 7.7, 8.4) * (1 - retreat * .4)); opacity(redeem, prog(t, 8, 8.7) * (1 - retreat * .4));
    drawer.setAttribute('transform', `translate(540 1560) scale(${mix(.5, .82, retreat)})`); opacity(drawer, retreat);
    caption.setAttribute('transform', 'translate(540 1740)'); opacity(caption, prog(t, 10.5, 11.4));
  };
}

function buildRightsAllocationPremium() {
  header('08', 'THE COMPANY ASSEMBLES CUSTOM RIGHT PACKAGES');
  const company = saCompanyBuilding();
  const brand = fullLogo('anthropic', 360, 245, 360, 80);
  const specs = [
    { x: 190, y: 470, color: FULL_COLORS.A, rights: [FULL_COLORS.green, FULL_COLORS.blue] },
    { x: 890, y: 470, color: FULL_COLORS.N, rights: [FULL_COLORS.blue, FULL_COLORS.orange] },
    { x: 190, y: 1280, color: FULL_COLORS.T, rights: [FULL_COLORS.green, FULL_COLORS.orange] },
    { x: 890, y: 1280, color: FULL_COLORS.E, rights: [FULL_COLORS.green, FULL_COLORS.blue, FULL_COLORS.orange] },
  ];
  const holders = specs.map((spec, i) => {
    const figure = saShareholderFigure(i + 1, spec.color);
    const route = fullStroke(`M540 880Q${(540 + spec.x) / 2 + (i % 2 ? 110 : -110)} ${(880 + spec.y) / 2} ${spec.x} ${spec.y}`, FULL_COLORS.ink, 6);
    const chips = spec.rights.map((color, j) => ({ node: el('rect', { width: 30, height: 30, rx: 5, fill: color, stroke: FULL_COLORS.ink, 'stroke-width': 3 }), j, color }));
    return { ...spec, figure, route, chips, i };
  });
  const caption = paDarkPlaque('同一家公司，发出不同的权利组合', 760, FULL_COLORS.green, 39);
  return t => {
    fullCamera(t, 1 + Math.sin(t * .8) * .018);
    company.setAttribute('transform', `translate(540 875) scale(${.78 + Math.sin(t * 4) * .012})`);
    company.flag.setAttribute('transform', `rotate(${Math.sin(t * 3.2) * 4} -12 -291)`);
    opacity(company.beacon, .55 + Math.sin(t * 6) * .4);
    const doorOpen = .5 + Math.sin(t * 2.1) * .5;
    company.doorLeft.setAttribute('transform', `translate(${-doorOpen * 13} 0)`);
    company.doorRight.setAttribute('transform', `translate(${doorOpen * 13} 0)`);
    company.windows.forEach((window, i) => opacity(window, .28 + prog(t, .1 + i * .025, .7 + i * .025) * .72));
    opacity(brand, prog(t, .2, .8));
    holders.forEach(holder => {
      const start = .55 + holder.i * 1.15;
      const p = back(prog(t, start, start + .75));
      const x = mix(540, holder.x, p), y = mix(875, holder.y, p);
      holder.figure.setAttribute('transform', `translate(${x} ${y}) rotate(${mix(holder.i % 2 ? 55 : -55, holder.i % 2 ? 4 : -4, p)}) scale(${mix(.15, .58, p)})`);
      opacity(holder.figure, clamp(p)); fullDraw(holder.route, out(prog(t, start + .2, start + .85)), .45);
      holder.chips.forEach(({ node, j }) => {
        const travel = inout(prog(t, start + .45 + j * .2, start + 1.15 + j * .2));
        const point = holder.route.node.getPointAtLength(holder.route.length * travel);
        const dockX = holder.x + (j - (holder.chips.length - 1) / 2) * 45, dockY = holder.y + 125;
        const settle = prog(t, start + 1.1, start + 1.45);
        node.setAttribute('x', mix(point.x, dockX, settle) - 15); node.setAttribute('y', mix(point.y, dockY, settle) - 15);
        node.setAttribute('transform', `rotate(${travel * 270} ${mix(point.x, dockX, settle)} ${mix(point.y, dockY, settle)})`);
        opacity(node, prog(t, start + .4 + j * .15, start + .65 + j * .15));
      });
    });
    caption.setAttribute('transform', 'translate(540 1640)'); opacity(caption, prog(t, 4.8, 5.5));
  };
}

function buildFinancingPremium() {
  header('09', 'NEW CAPITAL PUSHES THE ORIGINAL 100%');
  const counter = text('100%', { x: 540, y: 475, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 200, 'font-weight': 900, fill: FULL_COLORS.ink });
  const label = text('FOUNDERS / 创始团队持股', { x: 540, y: 545, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 28, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.gray });
  el('path', { d: 'M90 650H960L990 680V810H120L90 780Z', transform: 'translate(9 11)', fill: FULL_COLORS.ink, opacity: .16 });
  const track = el('path', { d: 'M90 650H960L990 680V810H120L90 780Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 5 });
  const founder = el('path', { d: 'M110 675H970V785H110Z', fill: FULL_COLORS.green });
  const founderDots = el('path', { d: 'M110 675H970V785H110Z', fill: 'url(#greenDots)', opacity: .32 });
  const segments = [FULL_COLORS.blue, FULL_COLORS.purple, FULL_COLORS.orange].map(color => el('rect', { x: 970, y: 675, width: 0, height: 110, fill: color }));
  const trackFurniture = el('g', {});
  for (let i = 0; i <= 20; i++) {
    const x = 110 + i * 43;
    el('path', { d: `M${x} 657V${i % 5 === 0 ? 673 : 666}M${x} 787V${i % 5 === 0 ? 803 : 796}`, stroke: FULL_COLORS.ink, 'stroke-width': i % 5 === 0 ? 3 : 2, opacity: .45 }, trackFurniture);
    if (i % 5 === 0) text(`${i * 5}`, { x, y: 833, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 14, 'font-weight': 800, fill: FULL_COLORS.gray }, trackFurniture);
  }
  for (const x of [105, 975]) for (const y of [686, 774]) {
    el('circle', { cx: x, cy: y, r: 5, fill: FULL_COLORS.paper, stroke: FULL_COLORS.ink, 'stroke-width': 2 }, trackFurniture);
  }
  const playhead = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M0 660V800', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, playhead);
  el('path', { d: 'M0 660V800', stroke: FULL_COLORS.paper, 'stroke-width': 1.5, opacity: .75 }, playhead);
  el('path', { d: 'M-13 646H13L20 653L0 670L-20 653Z', fill: FULL_COLORS.orange, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, playhead);
  el('path', { d: 'M-12 810H12L0 824Z', fill: FULL_COLORS.orange, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, playhead);
  const rounds = [
    { name: 'FOUNDERS', title: '创始', color: FULL_COLORS.green, x: 170 },
    { name: 'SEED', title: '种子轮', color: FULL_COLORS.blue, x: 410 },
    { name: 'SERIES A', title: 'A轮', color: FULL_COLORS.purple, x: 660 },
    { name: 'SERIES B', title: 'B轮', color: FULL_COLORS.orange, x: 900 },
  ].map((spec, i) => {
    const doc = paDocument(spec.title, spec.name, spec.color, i % 3);
    const plaque = paPlaque(spec.name, 210, spec.color, 25);
    return { ...spec, doc, plaque, i };
  });
  const pushMarks = [];
  for (let i = 0; i < 12; i++) {
    const mark = el('path', { d: 'M0 0L28 22L0 44', fill: 'none', stroke: FULL_COLORS.orange, 'stroke-width': 8, 'stroke-linecap': 'round' });
    pushMarks.push(mark);
  }
  const caption = paDarkPlaque('每一轮新玩家，都重新挤压 100%', 730, FULL_COLORS.green, 40);
  return t => {
    fullCamera(t, mix(1.03, 1, prog(t, 0, 1)));
    const stage = t < 2.3 ? 0 : t < 5 ? 1 : t < 7.8 ? 2 : 3;
    const targets = [100, 72, 49, 31], starts = [0, 2.3, 5, 7.8], ends = [0, 3.8, 6.5, 9.3];
    const value = stage === 0 ? 100 : mix(targets[stage - 1], targets[stage], inout(prog(t, starts[stage], ends[stage])));
    counter.textContent = `${Math.round(value)}%`;
    const width = 860 * value / 100;
    founder.setAttribute('d', `M110 675H${110 + width}V785H110Z`); founderDots.setAttribute('d', `M110 675H${110 + width}V785H110Z`);
    playhead.setAttribute('transform', `translate(${110 + width} 0)`); opacity(playhead, .55 + prog(t, 2.3, 3.1) * .45);
    let x = 110 + width;
    const widths = stage === 0 ? [0, 0, 0] : stage === 1 ? [100 - value, 0, 0] : stage === 2 ? [28, 72 - value, 0] : [28, 23, 49 - value];
    segments.forEach((segment, i) => { const w = 860 * widths[i] / 100; segment.setAttribute('x', x); segment.setAttribute('width', w); x += w; });
    rounds.forEach(round => {
      const p = back(prog(t, round.i * 2.5, .8 + round.i * 2.5));
      round.doc.setAttribute('transform', `translate(${mix(1190, round.x, p)} 1120) rotate(${mix(30, (round.i - 1.5) * 5, p)}) scale(.38)`);
      opacity(round.doc, clamp(p));
      round.plaque.setAttribute('transform', `translate(${round.x} 1370) scale(.8)`); opacity(round.plaque, prog(t, round.i * 2.5 + .3, round.i * 2.5 + .9));
    });
    pushMarks.forEach((mark, i) => {
      const active = stage > 0 ? Math.sin(prog(t, starts[stage], ends[stage]) * Math.PI) : 0;
      mark.setAttribute('transform', `translate(${1010 - (i % 6) * 52} ${670 + Math.floor(i / 6) * 90}) scale(${.5 + active * .4})`);
      opacity(mark, active * .35);
    });
    caption.setAttribute('transform', 'translate(540 1600)'); opacity(caption, prog(t, 8.4, 9.2));
  };
}

function buildDeadlockPremium() {
  header('10', 'DILUTED SHARES / DECISION TRAFFIC JAM');
  const ratio = text('100% → 18%', { x: 540, y: 350, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 120, 'font-weight': 900, fill: FULL_COLORS.ink });
  const founderBar = el('rect', { x: 120, y: 410, width: 840, height: 36, rx: 8, fill: FULL_COLORS.green });
  const machine = paMachine('决策', FULL_COLORS.orange, 300, 320);
  const holders = [], routes = [];
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / 12;
    const x = 540 + Math.cos(angle) * 410, y = 920 + Math.sin(angle) * 500;
    const doc = paDocument(`S${i + 1}`, `SHARE / ${String(i + 1).padStart(2, '0')}`, i < 3 ? FULL_COLORS.green : FULL_COLORS.paper, i % 3);
    const c1x = 540 + Math.cos(angle + 1.5) * 330, c1y = 920 + Math.sin(angle + 1.5) * 350;
    const c2x = 540 + Math.cos(angle - 1.2) * 210, c2y = 920 + Math.sin(angle - 1.2) * 240;
    const route = fullStroke(`M${x} ${y}C${c1x} ${c1y} ${c2x} ${c2y} 540 920`, i % 4 === 0 ? FULL_COLORS.orange : FULL_COLORS.ink, 6 + i % 3);
    holders.push({ doc, x, y, angle, i }); routes.push(route);
  }
  const tangle = el('g', {});
  for (let i = 0; i < 9; i++) el('path', { d: `M${330 + i * 18} ${770 + i * 13}C${770 - i * 9} ${650 + i * 22} ${280 + i * 23} ${1120 - i * 11} ${740 - i * 8} ${1030 + i * 9}`, fill: 'none', stroke: i % 3 ? FULL_COLORS.ink : FULL_COLORS.orange, 'stroke-width': 5 }, tangle);
  const jam = paDarkPlaque('公司也不知道听谁的', 620, FULL_COLORS.orange, 45);
  const warning = text('DECISION / OFFLINE', { x: 540, y: 1260, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 36, 'font-weight': 900, 'letter-spacing': 6, fill: FULL_COLORS.orange });
  return t => {
    const chaos = inout(prog(t, 3.2, 9.5));
    fullCamera(t, mix(1, 1.1, prog(t, 7, 13)), 920);
    founderBar.setAttribute('width', mix(840, 150, chaos)); ratio.setAttribute('fill', chaos > .55 ? FULL_COLORS.orange : FULL_COLORS.ink);
    holders.forEach(holder => {
      const enter = back(prog(t, holder.i * .16, .7 + holder.i * .16));
      const squeeze = inout(prog(t, 5 + holder.i * .06, 10 + holder.i * .06));
      const theta = holder.angle + chaos * .45;
      const x = mix(holder.x, 540 + Math.cos(theta) * 340, squeeze), y = mix(holder.y, 920 + Math.sin(theta) * 400, squeeze);
      holder.doc.setAttribute('transform', `translate(${x} ${y}) rotate(${holder.i * 17 + chaos * 90}) scale(.22)`);
      opacity(holder.doc, clamp(enter)); fullDraw(routes[holder.i], prog(t, 1.5 + holder.i * .13, 3 + holder.i * .13), .3 + chaos * .65);
    });
    machine.setAttribute('transform', `translate(540 920) rotate(${Math.sin(t * 15) * chaos * 4}) scale(${.9 - chaos * .15})`);
    tangle.setAttribute('transform', `rotate(${chaos * 160 + t * chaos * 6} 540 920) scale(${mix(.4, 1, chaos)})`); opacity(tangle, chaos * .85);
    jam.setAttribute('transform', 'translate(540 1530)'); opacity(jam, prog(t, 9.2, 10.2)); opacity(warning, prog(t, 8.8, 9.8));
  };
}

function buildUntanglePremium() {
  header('11', 'UNWEAVE THE JAM / SORT THE RIGHT RAILS');
  const machine = paMachine('决策', FULL_COLORS.green, 290, 310);
  const mess = el('g', {});
  for (let i = 0; i < 11; i++) el('path', { d: `M${280 + i * 17} ${730 + i * 21}C${820 - i * 12} ${590 + i * 27} ${250 + i * 19} ${1190 - i * 16} ${790 - i * 11} ${980 + i * 7}`, fill: 'none', stroke: i % 3 ? FULL_COLORS.ink : FULL_COLORS.orange, 'stroke-width': 6 }, mess);
  const specs = [
    { title: 'S1', x: 175, y: 450, color: FULL_COLORS.green, kind: 'vote', label: '投票通道' },
    { title: 'S2', x: 900, y: 860, color: FULL_COLORS.blue, kind: 'dividend', label: '股息通道' },
    { title: 'S3', x: 175, y: 1320, color: FULL_COLORS.orange, kind: 'capital', label: '清算通道' },
  ];
  const channels = specs.map((spec, i) => {
    const doc = paDocument(spec.title, spec.label, spec.color, i);
    const rail = fullStroke(`M${spec.x} ${spec.y}C${spec.x + (540 - spec.x) * .5} ${spec.y} ${540 + (spec.x - 540) * .25} 860 540 860`, spec.color, 14);
    const module = raRightModule(spec.kind, spec.label, spec.color);
    return { ...spec, doc, rail, module, i };
  });
  const caption = paDarkPlaque('权利各走各的通道，秩序恢复', 720, FULL_COLORS.green, 40);
  return t => {
    const clear = inout(prog(t, .45, 3.8)); fullCamera(t, mix(1.08, 1, clear), 860);
    mess.setAttribute('transform', `translate(540 860) rotate(${clear * 150}) scale(${1 - clear * .72}) translate(-540 -860)`); opacity(mess, 1 - clear);
    machine.setAttribute('transform', `translate(540 860) scale(${mix(.72, .9, back(prog(t, 2.8, 4.1)))})`);
    channels.forEach(channel => {
      fullDraw(channel.rail, out(prog(t, 1.1 + channel.i * .42, 3.3 + channel.i * .42)));
      channel.doc.setAttribute('transform', `translate(${mix(540, channel.x, clear)} ${mix(860, channel.y, clear)}) rotate(${mix(channel.i * 40, -7 + channel.i * 7, clear)}) scale(.3)`);
      channel.module.setAttribute('transform', `translate(${channel.x + (channel.i === 1 ? -10 : 80)} ${channel.y + 145}) scale(.38)`);
      opacity(channel.module, prog(t, 3.2 + channel.i * .2, 3.9 + channel.i * .2));
    });
    caption.setAttribute('transform', 'translate(540 1620)'); opacity(caption, prog(t, 3.9, 4.7));
  };
}

function buildFiveClassesPremium() {
  header('12', 'FIVE CERTIFICATES / ONE ANTHROPIC STRUCTURE');
  const ghost = text('05', { x: 810, y: 1200, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 670, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .045 });
  const brand = paBrandBanner('anthropic', 720, 230, FULL_COLORS.green);
  const types = ['A', 'N', 'T', 'F', 'E'];
  const positions = [[170, 430], [875, 430], [175, 1240], [540, 1370], [890, 1240]];
  const certs = types.map((type, i) => {
    const cert = paCertificate(type);
    const rail = fullStroke(`M${positions[i][0]} ${positions[i][1]}Q${(positions[i][0] + 540) / 2} ${(positions[i][1] + 830) / 2 - 80} 540 830`, FULL_COLORS[type], 7);
    return { cert, rail, type, i, x: positions[i][0], y: positions[i][1] };
  });
  const marketA = paPlaque('A股 / 市场别称', 370, FULL_COLORS.orange, 34);
  const marketH = paPlaque('H股 / 市场别称', 370, FULL_COLORS.orange, 34);
  const warning = paDarkPlaque('不是市场别称，是内部股票类别', 720, FULL_COLORS.orange, 38);
  const caption = paPlaque('A / N / T / F / E · 同一家公司', 690, FULL_COLORS.ink, 38);
  const fragments = paBurst(40, FULL_COLORS.orange);
  return t => {
    fullCamera(t, mix(1.04, 1, prog(t, 0, 2)));
    brand.setAttribute('transform', 'translate(540 835) scale(.88)'); opacity(brand, prog(t, .4, 1.4));
    certs.forEach(item => {
      const start = 1.8 + item.i * 1.55, p = back(prog(t, start, start + 1.2));
      const sx = item.i % 2 ? 1210 : -130, sy = 300 + item.i * 260;
      item.cert.setAttribute('transform', `translate(${mix(sx, item.x, p)} ${mix(sy, item.y, p)}) rotate(${mix(item.i % 2 ? 70 : -70, (item.i - 2) * 5, p)}) scale(${mix(.25, .43, p)})`);
      opacity(item.cert, clamp(p)); fullDraw(item.rail, prog(t, start + .55, start + 1.55), .55);
    });
    marketA.setAttribute('transform', `translate(${mix(250, -430, inout(prog(t, 11.3, 14)))} 1570) rotate(${-prog(t, 11.3, 14) * 35})`);
    marketH.setAttribute('transform', `translate(${mix(710, 1350, inout(prog(t, 11.3, 14)))} 1570) rotate(${prog(t, 11.3, 14) * 35})`);
    opacity(marketA, prog(t, 9.8, 10.5)); opacity(marketH, prog(t, 10.1, 10.8));
    warning.setAttribute('transform', 'translate(540 1080)'); opacity(warning, prog(t, 10.4, 11.2) * (1 - prog(t, 14.1, 15)));
    paRenderBurst(fragments, 540, 1570, prog(t, 11.5, 13.5), .55);
    caption.setAttribute('transform', 'translate(540 1660)'); opacity(caption, prog(t, 15.2, 16.2));
  };
}

function buildClassNPremium() {
  header('14', 'CLASS N / TRANSFER GATE / CLASS A');
  const ghost = text('N→A', { x: 540, y: 1120, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 300, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .05 });
  const n = paCertificate('N');
  const a = paCertificate('A');
  const gate = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-218-392H218V-354H-218ZM-218 354H218V392H-218Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.purple, 'stroke-width': 4 }, gate);
  for (const side of [-1, 1]) {
    const x = side * 190;
    el('path', { d: `M${x - 13}-354H${x + 13}V354H${x - 13}Z`, fill: FULL_COLORS.ink, stroke: FULL_COLORS.purple, 'stroke-width': 3 }, gate);
    el('path', { d: `M${x} -330V330`, stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .45 }, gate);
    for (let y = -315; y <= 315; y += 70) el('rect', { x: x - 21, y: y - 5, width: 42, height: 10, rx: 3, fill: FULL_COLORS.purple, opacity: y % 140 ? .25 : .55 }, gate);
  }
  const left = el('g', {}, gate), right = el('g', {}, gate);
  const gatePanels = [
    { node: left, side: -1, fill: '#fffdf7' },
    { node: right, side: 1, fill: 'url(#dotFill)' },
  ];
  gatePanels.forEach(({ node, side, fill }) => {
    const x = side < 0 ? -160 : 0;
    el('path', { d: `M${x}-348H${x + 160}V348H${x}Z`, transform: 'translate(7 9)', fill: FULL_COLORS.ink, opacity: .22 }, node);
    el('path', { d: `M${x}-360H${x + 160}V360H${x}Z`, fill, stroke: FULL_COLORS.purple, 'stroke-width': 7 }, node);
    el('path', { d: `M${x + 16}-338H${x + 144}V338H${x + 16}Z`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 2, opacity: .2 }, node);
    el('path', { d: `M${side * 145}-310V310`, stroke: FULL_COLORS.purple, 'stroke-width': 8, opacity: .45 }, node);
    for (let y = -260; y <= 260; y += 130) {
      const lockX = side * 18;
      el('path', { d: `M${lockX - 13} ${y - 28}H${lockX + 13}L${lockX + 22} ${y - 19}V${y + 19}L${lockX + 13} ${y + 28}H${lockX - 13}Z`, fill: FULL_COLORS.ink, stroke: FULL_COLORS.purple, 'stroke-width': 3 }, node);
      el('circle', { cx: lockX, cy: y, r: 5, fill: FULL_COLORS.purple }, node);
    }
    for (let y = -290; y <= 290; y += 58) el('path', { d: `M${side * 72} ${y}H${side * 112}`, stroke: FULL_COLORS.ink, 'stroke-width': 5, opacity: .14 }, node);
  });
  el('path', { d: 'M-86-420H86L104-402H-104Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.purple, 'stroke-width': 3 }, gate);
  text('TRANSFER', { x: 0, y: -405, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 38, 'font-weight': 900, 'letter-spacing': 7, fill: FULL_COLORS.ink }, gate);
  text('转 让 闸 门', { x: 0, y: 445, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 36, 'letter-spacing': 6, fill: FULL_COLORS.ink }, gate);
  const conveyor = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M70 1240H1000', stroke: FULL_COLORS.ink, 'stroke-width': 34, 'stroke-linecap': 'round' }, conveyor);
  el('path', { d: 'M70 1240H1000', stroke: FULL_COLORS.paper, 'stroke-width': 20, 'stroke-linecap': 'round' }, conveyor);
  el('path', { d: 'M70 1223H1000M70 1257H1000', stroke: FULL_COLORS.purple, 'stroke-width': 3, opacity: .65 }, conveyor);
  for (let i = 0; i < 16; i++) {
    const x = 90 + i * 60;
    el('circle', { cx: x, cy: 1240, r: 13, fill: FULL_COLORS.ink, stroke: i % 3 ? FULL_COLORS.purple : FULL_COLORS.green, 'stroke-width': 3 }, conveyor);
    el('circle', { cx: x, cy: 1240, r: 3, fill: FULL_COLORS.paper }, conveyor);
    if (i % 3 === 0) el('path', { d: `M${x} 1262V1282H${x + 24}`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, conveyor);
  }
  const vote = raRightModule('vote', '投票权 / 无', FULL_COLORS.orange);
  const dividend = raRightModule('dividend', '股息保留', FULL_COLORS.blue);
  const capital = raRightModule('capital', '清算保留', FULL_COLORS.orange);
  const market = paDarkPlaque('转换后进入市场流通路径', 670, FULL_COLORS.green, 39);
  const cut = paBurst(30, FULL_COLORS.orange);
  return t => {
    const move = inout(prog(t, 4.7, 9.2)), open = Math.sin(move * Math.PI);
    fullCamera(t, 1 + Math.sin(move * Math.PI) * .09, 850);
    const x = mix(180, 895, move), flip = Math.sin(move * Math.PI);
    n.setAttribute('transform', `translate(${x} 790) rotate(${move * 180}) scale(${.55 + flip * .12})`);
    a.setAttribute('transform', `translate(${x} 790) rotate(${move * 180 - 180}) scale(${.55 + flip * .12})`);
    opacity(n, 1 - prog(t, 7, 7.7)); opacity(a, prog(t, 7, 7.7));
    gate.setAttribute('transform', 'translate(550 790) scale(.82)');
    left.setAttribute('transform', `translate(${-open * 145} 0)`); right.setAttribute('transform', `translate(${open * 145} 0)`);
    conveyor.setAttribute('transform', `translate(${Math.sin(t * 5) * 12} 0)`); opacity(conveyor, prog(t, 3.9, 4.6));
    vote.setAttribute('transform', `translate(190 ${390 - prog(t, 1.1, 2.4) * 230}) rotate(${-prog(t, 1.1, 2.4) * 55}) scale(.62)`);
    opacity(vote, prog(t, .4, .9) * (1 - prog(t, 1.7, 2.5)));
    paRenderBurst(cut, 190, 430, prog(t, 1.1, 2.2), .8);
    dividend.setAttribute('transform', 'translate(220 1390) rotate(-6) scale(.48)'); capital.setAttribute('transform', 'translate(690 1390) rotate(5) scale(.48)');
    opacity(dividend, prog(t, 2.4, 3.1)); opacity(capital, prog(t, 3.1, 3.8));
    market.setAttribute('transform', 'translate(590 1580)'); opacity(market, prog(t, 9.1, 10));
  };
}

function buildPartnerNetworkPremium() {
  header('15', 'CLASS N / STRATEGIC PARTNER CONSTELLATION');
  const n = paCertificate('N');
  const anthropic = fullLogo('anthropic', 350, 1070, 380, 85);
  const amazon = paBrandBanner('amazon', 520, 240, FULL_COLORS.N);
  const google = paBrandBanner('google', 520, 240, FULL_COLORS.N);
  const fund = saInstitutionBuilding('FUND', '公益基金', FULL_COLORS.purple);
  const links = [
    { d: 'M440 690C330 610 270 560 250 490', start: 1.1, color: FULL_COLORS.N },
    { d: 'M640 690C750 610 810 560 830 490', start: 3.4, color: FULL_COLORS.N },
    { d: 'M540 1010C540 1160 540 1220 540 1280', start: 5.7, color: FULL_COLORS.purple },
  ].map(spec => ({ ...spec, line: fullStroke(spec.d, spec.color, 11) }));
  const packets = [];
  for (let i = 0; i < 30; i++) {
    const node = el('rect', { width: 10, height: 10, rx: 2, fill: i % 5 ? FULL_COLORS.N : FULL_COLORS.purple });
    packets.push({ node, i, link: i % 3 });
  }
  const caption = paDarkPlaque('战略合作伙伴网络，不是投票控制', 730, FULL_COLORS.green, 39);
  return t => {
    fullCamera(t, 1 + Math.sin(t * .65) * .022);
    n.setAttribute('transform', `translate(540 820) rotate(${Math.sin(t * 1.4) * 2}) scale(.58)`); opacity(n, prog(t, .2, .9));
    amazon.setAttribute('transform', `translate(${mix(-350, 270, back(prog(t, 1.3, 2.3)))} 370) rotate(-6) scale(.82)`);
    google.setAttribute('transform', `translate(${mix(1430, 810, back(prog(t, 3.6, 4.6)))} 370) rotate(6) scale(.82)`);
    fund.setAttribute('transform', `translate(540 ${mix(1750, 1390, back(prog(t, 6, 7)))}) scale(.45)`);
    opacity(amazon, prog(t, 1.2, 1.8)); opacity(google, prog(t, 3.5, 4.1)); opacity(fund, prog(t, 5.8, 6.5));
    opacity(anthropic, prog(t, .5, 1.2));
    links.forEach(link => fullDraw(link.line, out(prog(t, link.start, link.start + 1.25))));
    packets.forEach(packet => {
      const link = links[packet.link], p = (prog(t, link.start + .8, 10.8) + packet.i * .11) % 1;
      const point = link.line.node.getPointAtLength(link.line.length * p);
      packet.node.setAttribute('x', point.x - 5); packet.node.setAttribute('y', point.y - 5);
      packet.node.setAttribute('transform', `rotate(${p * 360} ${point.x} ${point.y})`);
      opacity(packet.node, prog(t, link.start + .8, link.start + 1.2) * .75);
    });
    caption.setAttribute('transform', 'translate(540 1690)'); opacity(caption, prog(t, 8.1, 9));
  };
}

function buildClassTPremium() {
  header('16', 'CLASS T / NARROW VOTE / TWO LONG CONTROL ARMS');
  const tCert = paCertificate('T');
  const vote = raRightModule('vote', '有限投票事项', FULL_COLORS.orange);
  const gate = el('g', { filter: 'url(#shadow)' });
  const leftJaw = el('path', { d: 'M-180-90H0V90H-180L-130 0Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.orange, 'stroke-width': 6 }, gate);
  const rightJaw = el('path', { d: 'M0-90H180L130 0L180 90H0Z', fill: 'url(#dotFill)', stroke: FULL_COLORS.orange, 'stroke-width': 6 }, gate);
  const director = saDirectorChair();
  const eCert = paCertificate('E');
  const redeem = paDarkPlaque('E 股赎回控制', 350, FULL_COLORS.E, 34);
  const arm1 = fullStroke('M330 720C510 620 600 460 740 460', FULL_COLORS.T, 12);
  const arm2 = fullStroke('M330 850C520 950 610 1210 740 1210', FULL_COLORS.T, 12);
  const joints = [];
  for (let i = 0; i < 18; i++) {
    const node = el('g', { filter: 'url(#shadow)' });
    el('path', { d: 'M-30-14H18L30-6V6L18 14H-30L-38 6V-6Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 3 }, node);
    el('path', { d: 'M-19-7H15L22-3V3L15 7H-19Z', fill: 'url(#dotFill)', stroke: FULL_COLORS.paper, 'stroke-width': 1, opacity: .55 }, node);
    el('path', { d: 'M-13 0H13', stroke: FULL_COLORS.T, 'stroke-width': 3, 'stroke-linecap': 'round' }, node);
    for (const x of [-27, 21]) {
      el('circle', { cx: x, cy: 0, r: 6, fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 2 }, node);
      el('circle', { cx: x, cy: 0, r: 1.8, fill: FULL_COLORS.paper }, node);
    }
    const slot = Math.floor(i / 2);
    joints.push({ node, i, arm: i % 2, q: (slot + 1) / 10 });
  }
  const hubs = [
    { x: 330, y: 720, arm: 0 }, { x: 740, y: 460, arm: 0 },
    { x: 330, y: 850, arm: 1 }, { x: 740, y: 1210, arm: 1 },
  ].map(spec => {
    const node = el('g', { filter: 'url(#shadow)' });
    el('circle', { r: 27, fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 5 }, node);
    el('circle', { r: 15, fill: 'url(#dotFill)', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .8 }, node);
    el('circle', { r: 5, fill: FULL_COLORS.T }, node);
    for (let i = 0; i < 4; i++) el('path', { d: 'M0-34V-25', transform: `rotate(${i * 90})`, stroke: FULL_COLORS.ink, 'stroke-width': 5 }, node);
    return { ...spec, node };
  });
  const power = text('LIMITED ≠ WEAK', { x: 540, y: 1570, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 70, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.ink });
  const caption = paPlaque('投票口收窄，关键控制臂伸长', 670, FULL_COLORS.ink, 39);
  return t => {
    fullCamera(t, 1 + Math.sin(prog(t, 4, 14) * Math.PI) * .04);
    tCert.setAttribute('transform', 'translate(205 790) rotate(-6) scale(.55)'); opacity(tCert, prog(t, .2, .9));
    vote.setAttribute('transform', 'translate(205 360) scale(.55)'); opacity(vote, prog(t, .4, 1));
    gate.setAttribute('transform', 'translate(205 570) scale(.8)');
    const narrow = inout(prog(t, 1.2, 4)); leftJaw.setAttribute('transform', `translate(${narrow * 100} 0)`); rightJaw.setAttribute('transform', `translate(${-narrow * 100} 0)`);
    director.setAttribute('transform', `translate(850 435) rotate(4) scale(.62)`); opacity(director, prog(t, 6.3, 7.2));
    director.upper.setAttribute('transform', `rotate(${Math.sin(prog(t, 6.4, 9) * Math.PI * 2) * 6} 0 78)`);
    eCert.setAttribute('transform', 'translate(850 1180) rotate(5) scale(.4)'); opacity(eCert, prog(t, 9.4, 10.3));
    redeem.setAttribute('transform', 'translate(850 1450) scale(.78)'); opacity(redeem, prog(t, 10.2, 11));
    const draw1 = out(prog(t, 4.8, 8)), draw2 = out(prog(t, 8.1, 11.5)); fullDraw(arm1, draw1); fullDraw(arm2, draw2);
    joints.forEach(joint => {
      const arm = joint.arm ? arm2 : arm1, draw = joint.arm ? draw2 : draw1;
      const distance = arm.length * joint.q;
      const point = arm.node.getPointAtLength(distance);
      const before = arm.node.getPointAtLength(Math.max(0, distance - 3));
      const after = arm.node.getPointAtLength(Math.min(arm.length, distance + 3));
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      const reveal = back(prog(draw, joint.q - .07, joint.q + .025));
      joint.node.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle}) scale(${clamp(reveal)})`);
      opacity(joint.node, clamp(reveal));
    });
    hubs.forEach(hub => {
      const draw = hub.arm ? draw2 : draw1, reveal = back(prog(draw, .01, .16));
      hub.node.setAttribute('transform', `translate(${hub.x} ${hub.y}) rotate(${(hub.arm ? -1 : 1) * draw * 45}) scale(${.55 + clamp(reveal) * .45})`);
      opacity(hub.node, clamp(reveal));
    });
    opacity(power, prog(t, 11.6, 12.5)); caption.setAttribute('transform', 'translate(540 1690)'); opacity(caption, prog(t, 12.5, 13.4));
  };
}

function buildTrustPremium() {
  header('17', 'LTBT / AN INDEPENDENT LONG-TERM FRAME');
  const company = paBrandBanner('anthropic', 500, 230, FULL_COLORS.ink);
  const mission = paDarkPlaque('长期利益', 390, FULL_COLORS.green, 57);
  const frame = saInstitutionBuilding('LTBT', '长期利益信托', FULL_COLORS.T);
  const good = fullStroke('M280 850H800', FULL_COLORS.green, 13);
  const bad = fullStroke('M260 1040C420 1140 520 1370 780 1480', FULL_COLORS.orange, 13);
  const deviation = paDarkPlaque('偏离使命', 320, FULL_COLORS.orange, 40);
  const rebound = el('path', { d: 'M-22-22H14L22-14V22H-14L-22 14Z', fill: FULL_COLORS.orange, stroke: FULL_COLORS.ink, 'stroke-width': 4 });
  const impact = paBurst(34, FULL_COLORS.orange);
  const caption = paPlaque('独立框架，把偏离长期利益的箭头拦回', 820, FULL_COLORS.ink, 37);
  return t => {
    fullCamera(t, mix(1.04, 1, prog(t, 0, 1.5)));
    company.setAttribute('transform', 'translate(190 770) rotate(-7) scale(.58)'); opacity(company, prog(t, .2, .9));
    mission.setAttribute('transform', 'translate(885 790) rotate(5) scale(.8)'); opacity(mission, prog(t, .5, 1.2));
    const rise = back(prog(t, 1.4, 2.8));
    const advance = out(prog(t, 5.1, 8.1)), bounce = inout(prog(t, 8.1, 10.7));
    const shake = Math.sin(bounce * Math.PI * 6) * (1 - bounce) * 10;
    frame.setAttribute('transform', `translate(${540 + shake} ${mix(1720, 830, rise)}) rotate(${shake * .12}) scale(.92)`); opacity(frame, clamp(rise));
    frame.columns.forEach((column, i) => opacity(column, prog(t, 1.7 + i * .12, 2.3 + i * .12)));
    opacity(frame.beacon, .55 + Math.sin(t * 5) * .4);
    fullDraw(good, prog(t, 3.1, 5.1));
    const p = bounce > 0 ? mix(.63, .1, bounce) : advance * .63; fullDraw(bad, advance);
    const point = bad.node.getPointAtLength(bad.length * p); rebound.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${p * 360})`); opacity(rebound, prog(t, 5.1, 5.5));
    paRenderBurst(impact, 540, 1260, prog(t, 8, 8.8), .85);
    deviation.setAttribute('transform', `translate(790 ${1500 + bounce * 180}) rotate(8)`); opacity(deviation, prog(t, 5, 5.8) * (1 - prog(t, 9.2, 10.5)));
    caption.setAttribute('transform', 'translate(540 1690)'); opacity(caption, prog(t, 10.5, 11.5));
  };
}

function buildClassEPremium() {
  header('18', 'EMPLOYEE BADGES → CLASS E ↔ CLASS T');
  const e = paCertificate('E'), tCert = paCertificate('T');
  const badges = [];
  for (let i = 0; i < 9; i++) badges.push({ node: paEmployeeBadge(i + 1), i, x: 70 + (i % 3) * 120, y: 260 + Math.floor(i / 3) * 145 });
  const vote = saVotingAssembly();
  const director = saDirectorChair();
  const votePath = fullStroke('M350 690C480 510 650 510 760 690', FULL_COLORS.E, 12);
  const rights = [
    { node: raRightModule('transfer', '无法转让', FULL_COLORS.purple), x: 185, start: 7 },
    { node: raRightModule('dividend', '没有股息', FULL_COLORS.blue), x: 540, start: 9 },
    { node: raRightModule('capital', '清算≈0', FULL_COLORS.orange), x: 895, start: 11 },
  ];
  const balanceBase = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M0 22L-92 418H92Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 4 }, balanceBase);
  el('path', { d: 'M0 76L-48 360H48Z', fill: 'url(#dotFill)', opacity: .45 }, balanceBase);
  el('path', { d: 'M-132 418H112L132 438V474H-132V438Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 5 }, balanceBase);
  el('path', { d: 'M-105 438H105M-84 454H84', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .35 }, balanceBase);
  for (const x of [-105, 105]) el('circle', { cx: x, cy: 446, r: 7, fill: FULL_COLORS.green }, balanceBase);
  el('circle', { r: 48, fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 6 }, balanceBase);
  el('circle', { r: 29, fill: 'url(#greenDots)', stroke: FULL_COLORS.paper, 'stroke-width': 2 }, balanceBase);
  text('E / T', { x: 0, y: 398, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 20, 'font-weight': 900, 'letter-spacing': 3, fill: FULL_COLORS.green }, balanceBase);
  const beam = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-346-20H326L346 0L326 20H-346L-326 0Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 5 }, beam);
  el('path', { d: 'M-314-8H314M-314 8H314', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .32 }, beam);
  for (let i = -12; i <= 12; i++) {
    const x = i * 25;
    el('path', { d: `M${x} -17V${i % 3 === 0 ? 17 : 10}`, stroke: i < 0 ? FULL_COLORS.E : FULL_COLORS.T, 'stroke-width': i % 3 === 0 ? 5 : 3, opacity: .8 }, beam);
  }
  for (const side of [-1, 1]) {
    const x = side * 290, color = side < 0 ? FULL_COLORS.E : FULL_COLORS.T;
    el('circle', { cx: x, cy: 0, r: 17, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, beam);
    el('circle', { cx: x, cy: 0, r: 5, fill: FULL_COLORS.paper }, beam);
    el('path', { d: `M${x} 17L${x - 108} 240M${x} 17L${x + 108} 240M${x} 17V218`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, beam);
    el('path', { d: `M${x} 17L${x - 108} 240M${x} 17L${x + 108} 240`, fill: 'none', stroke: color, 'stroke-width': 2, opacity: .8 }, beam);
    for (const px of [x - 108, x, x + 108]) el('circle', { cx: px, cy: px === x ? 218 : 240, r: 8, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 3 }, beam);
    el('path', { d: `M${x - 128} 240Q${x} 302 ${x + 128} 240L${x + 107} 282Q${x} 330 ${x - 107} 282Z`, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, beam);
    el('path', { d: `M${x - 116} 248Q${x} 292 ${x + 116} 248`, fill: 'none', stroke: FULL_COLORS.paper, 'stroke-width': 3, opacity: .55 }, beam);
    el('path', { d: `M${x - 76} 287H${x + 76}`, stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 10', opacity: .65 }, beam);
  }
  el('circle', { r: 19, fill: FULL_COLORS.ink, stroke: FULL_COLORS.paper, 'stroke-width': 4 }, beam);
  el('circle', { r: 6, fill: FULL_COLORS.green }, beam);
  const balance = paDarkPlaque('E ↔ T / 相互制衡', 570, FULL_COLORS.green, 44);
  return t => {
    fullCamera(t, 1 + Math.sin(prog(t, 11, 18) * Math.PI) * .025);
    badges.forEach(badge => {
      const p = inout(prog(t, .35 + badge.i * .25, 2.2 + badge.i * .25));
      const x = mix(badge.x, 250 + Math.cos(badge.i) * 65, p), y = mix(badge.y, 770 + Math.sin(badge.i) * 90, p);
      badge.node.setAttribute('transform', `translate(${x} ${y}) rotate(${p * 180 + badge.i * 8}) scale(${mix(.75, .22, p)})`);
      opacity(badge.node, 1 - prog(t, 3.2, 4.1));
    });
    const eIn = back(prog(t, 2.6, 3.7)); e.setAttribute('transform', `translate(250 790) rotate(-6) scale(${eIn * .52})`); opacity(e, clamp(eIn));
    tCert.setAttribute('transform', 'translate(830 790) rotate(6) scale(.52)'); opacity(tCert, prog(t, 3.2, 4));
    fullDraw(votePath, out(prog(t, 3.8, 5.8)));
    vote.setAttribute('transform', 'translate(515 395) scale(.62)'); opacity(vote, prog(t, 4.3, 5.1));
    vote.arms.forEach(arm => {
      const wave = Math.sin(t * 4.2 + arm.i * .9) * 7 * prog(t, 4.2, 5);
      arm.node.setAttribute('transform', `rotate(${wave} ${arm.pivot.x} ${arm.pivot.y})`);
    });
    vote.ballots.forEach(ballot => {
      const drop = inout(prog(t, 4.7 + ballot.i * .32, 6.1 + ballot.i * .32));
      const x = mix(ballot.x, -6, drop), y = mix(ballot.y, 42, drop);
      ballot.node.setAttribute('transform', `translate(${x} ${y}) rotate(${mix((ballot.i - 1) * 18, 0, drop)}) scale(${mix(1, .72, drop)})`);
      opacity(ballot.node, prog(t, 4.3 + ballot.i * .2, 4.7 + ballot.i * .2) * (1 - prog(t, 6.2 + ballot.i * .2, 6.8 + ballot.i * .2)));
    });
    director.setAttribute('transform', 'translate(850 385) rotate(3) scale(.58)'); opacity(director, prog(t, 4.8, 5.6));
    director.upper.setAttribute('transform', `rotate(${Math.sin(prog(t, 5.2, 8) * Math.PI * 2) * 7} 0 78)`);
    rights.forEach(right => {
      const off = inout(prog(t, right.start, right.start + 1));
      right.node.setAttribute('transform', `translate(${right.x + (right.x - 540) * off * .35} ${1510 + off * 170}) rotate(${off * 35}) scale(${.48 - off * .18})`);
      opacity(right.node, prog(t, 5.8, 6.5) * (1 - prog(t, right.start + .6, right.start + 1.2)));
    });
    const balanceIn = inout(prog(t, 10.9, 12.1));
    const swing = Math.sin(prog(t, 11.5, 17) * Math.PI * 3) * (1 - prog(t, 11.5, 17)) * 7;
    const theta = swing * Math.PI / 180, cos = Math.cos(theta), sin = Math.sin(theta);
    balanceBase.setAttribute('transform', 'translate(540 900)'); opacity(balanceBase, prog(t, 10.9, 11.8));
    beam.setAttribute('transform', `translate(540 900) rotate(${swing})`); opacity(beam, prog(t, 10.9, 11.8));
    [-1, 1].forEach(side => {
      const lx = side * 290, ly = 265;
      const panX = 540 + lx * cos - ly * sin, panY = 900 + lx * sin + ly * cos;
      const startX = side < 0 ? 250 : 830;
      const x = mix(startX, panX, balanceIn), y = mix(790, panY - 120, balanceIn);
      const rotation = mix(side < 0 ? -6 : 6, swing, balanceIn);
      (side < 0 ? e : tCert).setAttribute('transform', `translate(${x} ${y}) rotate(${rotation}) scale(.52)`);
    });
    balance.setAttribute('transform', 'translate(540 1650)'); opacity(balance, prog(t, 16, 17.2));
  };
}

function buildMergeFPremium() {
  header('19', 'SEVEN FOUNDER RIBBONS → ONE F CERTIFICATE');
  const ghost = text('07→01', { x: 540, y: 1050, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 270, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 4, opacity: .05 });
  const names = ['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Jack Clark', 'Jared Kaplan', 'Sam McCandlish', 'Chris Olah'];
  const ribbons = names.map((name, i) => ({ node: raFounderRibbon(name, i + 1, i === 0), i }));
  const company = saCompanyBuilding();
  const f = paCertificate('F');
  const counter = text('7', { x: 540, y: 380, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 170, 'font-weight': 900, fill: FULL_COLORS.ink });
  const one = paDarkPlaque('ONE F / 仅 1 个', 510, FULL_COLORS.green, 48);
  const burst = paBurst(45, FULL_COLORS.green);
  return t => {
    const merge = inout(prog(t, 1.6, 5.1)); fullCamera(t, mix(1, 1.12, prog(t, 4.8, 7.2)), mix(960, 940, prog(t, 4.8, 7.2)));
    ribbons.forEach(item => {
      const angle = -Math.PI / 2 + item.i * Math.PI * 2 / 7;
      const sx = 540 + Math.cos(angle) * 380 - 205, sy = 790 + Math.sin(angle) * 400 - 54;
      const stackX = 320 + item.i * 10, stackY = 480 + item.i * 85;
      const p = inout(prog(t, 1.4 + item.i * .13, 4.1 + item.i * .13));
      const x = mix(sx, stackX, p), y = mix(sy, stackY, p);
      const collapse = inout(prog(t, 4.3, 5.4));
      item.node.setAttribute('transform', `translate(${mix(x, 450, collapse)} ${mix(y, 760, collapse)}) rotate(${mix(-5 + item.i, 0, collapse)}) scale(${mix(.72, .3, collapse)} ${mix(.72, .08, collapse)})`);
      opacity(item.node, prog(t, .2 + item.i * .1, .8 + item.i * .1) * (1 - prog(t, 4.9, 5.6)));
    });
    company.setAttribute('transform', `translate(540 ${mix(1250, 1120, merge)}) scale(.55)`); opacity(company, prog(t, 2.4, 3.3) * (1 - prog(t, 5.2, 6)));
    company.flag.setAttribute('transform', `rotate(${Math.sin(t * 2.4) * 3} -12 -228)`);
    company.beacon.setAttribute('r', 8 + Math.sin(t * 4) * 1.5);
    counter.textContent = merge < .72 ? '7' : '1';
    const p = back(prog(t, 4.5, 5.7)); f.setAttribute('transform', `translate(540 830) rotate(${mix(-120, 0, p)}) scale(${p * .68})`); opacity(f, clamp(p));
    paRenderBurst(burst, 540, 830, prog(t, 4.5, 5.8), .7);
    one.setAttribute('transform', 'translate(540 1440)'); opacity(one, prog(t, 5.6, 6.4));
  };
}

function buildStripRightsPremium() {
  header('21', 'UNBOLT CASH RIGHTS / KEEP THE CONTROL CORE');
  const f = paCertificate('F');
  const specs = [
    { kind: 'transfer', label: '转让权', color: FULL_COLORS.purple, x: 180, y: 400, dx: -430, dy: -180, start: 1 },
    { kind: 'dividend', label: '股息权', color: FULL_COLORS.blue, x: 895, y: 650, dx: 450, dy: -120, start: 3.6 },
    { kind: 'capital', label: '清算分配', color: FULL_COLORS.orange, x: 860, y: 1190, dx: 460, dy: 260, start: 6.2 },
  ];
  const modules = specs.map(spec => ({ ...spec, node: raRightModule(spec.kind, spec.label, spec.color), bolt: fullStroke(`M540 790Q${(540 + spec.x) / 2} ${(790 + spec.y) / 2} ${spec.x} ${spec.y}`, FULL_COLORS.gray, 7) }));
  const dim = el('rect', { x: 0, y: 160, width: 1080, height: 1500, fill: FULL_COLORS.ink, opacity: 0 });
  const control = el('g', { filter: 'url(#softGlow)' });
  el('path', { d: 'M-245-285H180L245-220V285H-180L-245 220Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 12 }, control);
  el('path', { d: 'M-245-285H180L245-220V285H-180L-245 220Z', fill: 'url(#greenDots)', opacity: .32 }, control);
  text('F', { x: -125, y: 90, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 170, 'font-weight': 900, fill: FULL_COLORS.green }, control);
  text('控制权', { x: 45, y: 30, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 74, fill: FULL_COLORS.green }, control);
  text('CONTROL ONLY', { x: 45, y: 95, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 900, 'letter-spacing': 4, fill: FULL_COLORS.paper }, control);
  const final = paDarkPlaque('NOT FOR CASH / FOR CONTROL', 730, FULL_COLORS.green, 36);
  const burst = paBurst(40, FULL_COLORS.green);
  return t => {
    const end = inout(prog(t, 8.8, 11.2)); fullCamera(t, mix(1.02, 1.12, end), mix(960, 830, end));
    f.setAttribute('transform', `translate(540 790) rotate(${Math.sin(t * 1.4) * 2}) scale(.65)`); opacity(f, 1 - prog(t, 8.4, 10.3));
    modules.forEach(module => {
      const p = inout(prog(t, module.start, module.start + 1.8));
      module.node.setAttribute('transform', `translate(${module.x + module.dx * p} ${module.y + module.dy * p}) rotate(${p * 90}) scale(${.58 - p * .2})`);
      opacity(module.node, prog(t, .3, .8) * (1 - prog(t, module.start + 1.2, module.start + 2)));
      fullDraw(module.bolt, 1 - p, .65 * (1 - p));
    });
    opacity(dim, end * .84);
    const p = back(prog(t, 9.1, 10.6)); control.setAttribute('transform', `translate(540 820) rotate(${mix(-15, 0, p)}) scale(${p * .88})`); opacity(control, clamp(p));
    paRenderBurst(burst, 540, 820, prog(t, 9.2, 10.5), .8);
    final.setAttribute('transform', 'translate(540 1420)'); opacity(final, prog(t, 11.4, 12.4));
  };
}

function buildCapitalContrastPremium() {
  header('22', '50.1% CONTROL ↔ SEVEN $1 TOKENS');
  const divider = el('path', { d: 'M540 250V1510', stroke: FULL_COLORS.ink, 'stroke-opacity': .17, 'stroke-width': 3, 'stroke-dasharray': '8 16' });
  const left = text('50.1%', { x: 285, y: 540, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 128, 'font-weight': 900, fill: FULL_COLORS.ink });
  const leftSub = text('全公司投票权', { x: 285, y: 610, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 35, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const f = paCertificate('F');
  const total = text('$0', { x: 800, y: 540, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 180, 'font-weight': 900, fill: FULL_COLORS.orange });
  const totalSub = text('创始人公司资本', { x: 800, y: 610, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 35, 'letter-spacing': 4, fill: FULL_COLORS.gray });
  const tokens = [];
  for (let i = 0; i < 7; i++) tokens.push({ node: paDollarToken('$1'), i });
  const company = saCompanyBuilding();
  const equation = paDarkPlaque('7 人 × $1 = $7', 460, FULL_COLORS.orange, 43);
  const caption = paPlaque('巨大的控制权，极小的初始资本', 720, FULL_COLORS.ink, 40);
  return t => {
    fullCamera(t, 1 + Math.sin(prog(t, 7, 10) * Math.PI) * .025);
    f.setAttribute('transform', 'translate(285 980) rotate(-6) scale(.52)'); opacity(f, prog(t, .2, .9));
    opacity(left, prog(t, .2, .8)); opacity(leftSub, prog(t, .5, 1.1));
    let count = 0;
    tokens.forEach(token => {
      const start = 2.1 + token.i * .78, p = back(prog(t, start, start + .75)); if (t >= start) count = token.i + 1;
      const row = Math.floor(token.i / 4), x = 680 + (token.i % 4) * 80 + (row ? 40 : 0), y = 900 + row * 180;
      token.node.setAttribute('transform', `translate(${mix(1200, x, p)} ${mix(1100, y, p)}) rotate(${mix(60, (token.i % 4 - 1.5) * 7, p)}) scale(${p * .75})`);
      opacity(token.node, clamp(p));
    });
    total.textContent = `$${count}`; opacity(total, prog(t, 1.7, 2.3)); opacity(totalSub, prog(t, 1.7, 2.3));
    company.setAttribute('transform', 'translate(800 1280) scale(.34)'); opacity(company, prog(t, 6.8, 7.6));
    equation.setAttribute('transform', 'translate(800 1440) scale(.85)'); opacity(equation, prog(t, 7.7, 8.5));
    caption.setAttribute('transform', 'translate(540 1650)'); opacity(caption, prog(t, 8.6, 9.5));
  };
}

function buildRemainderPremium() {
  header('23', '¥50 SPLITS / ¥47.35 FOR CONTROL / ¥2.65 LEFT');
  const ghost = text('¥50', { x: 540, y: 760, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 290, 'font-weight': 900, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 5, opacity: .08 });
  const fifty = raToken('¥50');
  const big = raToken('47.35');
  const bigLabel = paDarkPlaque('元 / 创始人公司', 460, FULL_COLORS.green, 34);
  const small = raToken('2.65', FULL_COLORS.orange);
  const smallLabel = paPlaque('元 / 达里奥', 310, FULL_COLORS.orange, 31);
  const company = paBrandBanner('anthropic', 690, 210, FULL_COLORS.green);
  const control = paDarkPlaque('50.1% 控制权', 570, FULL_COLORS.green, 54);
  const person = el('g', { filter: 'url(#shadow)' });
  el('image', { href: '../assets/library/person-dario-amodei/master.png', x: -115, y: -145, width: 230, height: 288, preserveAspectRatio: 'xMidYMid meet' }, person);
  text('DARIO', { x: 0, y: 175, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 27, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.ink }, person);
  const mainRoute = fullStroke('M450 1050C430 1210 400 1270 400 1370', FULL_COLORS.green, 12);
  const smallRoute = fullStroke('M720 970C850 1000 850 1090 850 1160', FULL_COLORS.orange, 8);
  const final = paPlaque('CONTROL 50.1% / COST ¥47.35', 850, FULL_COLORS.ink, 36);
  const splitBurst = paBurst(38, FULL_COLORS.green);
  return t => {
    const split = inout(prog(t, .8, 2.5)); fullCamera(t, mix(1.07, 1, prog(t, 0, 1)) + Math.sin(prog(t, 5, 8) * Math.PI) * .025);
    fifty.setAttribute('transform', `translate(540 570) rotate(${-split * 8}) scale(${mix(1.8, .8, split)})`); opacity(fifty, 1 - prog(t, 1.5, 2.5));
    ghost.setAttribute('transform', `scale(${1 + split * .15})`); opacity(ghost, .08 * (1 - split));
    paRenderBurst(splitBurst, 540, 650, prog(t, .9, 2.3), .75);
    const bigIn = back(prog(t, 1.4, 2.6));
    big.setAttribute('transform', `translate(${mix(540, 390, split)} ${mix(650, 830, split)}) rotate(${mix(-25, -5, bigIn)}) scale(${bigIn * 1.85})`); opacity(big, clamp(bigIn));
    bigLabel.setAttribute('transform', 'translate(390 1050) scale(.85)'); opacity(bigLabel, prog(t, 2.2, 2.9));
    const smallIn = back(prog(t, 2.7, 3.7));
    small.setAttribute('transform', `translate(825 880) rotate(${mix(45, 7, smallIn)}) scale(${smallIn * .78})`); opacity(small, clamp(smallIn));
    smallLabel.setAttribute('transform', 'translate(825 1030) scale(.75)'); opacity(smallLabel, prog(t, 3.1, 3.8));
    company.setAttribute('transform', 'translate(420 1370) rotate(-2) scale(.78)'); opacity(company, prog(t, 4, 4.8));
    control.setAttribute('transform', 'translate(540 1580) scale(.86)'); opacity(control, prog(t, 4.8, 5.6));
    person.setAttribute('transform', 'translate(875 1320) scale(.72)'); opacity(person, prog(t, 4.2, 5));
    fullDraw(mainRoute, prog(t, 3.2, 4.8)); fullDraw(smallRoute, prog(t, 3.3, 4.7));
    final.setAttribute('transform', 'translate(540 1740) scale(.85)'); opacity(final, prog(t, 5.7, 6.4));
    if (t > 6.3) {
      const hop = Math.sin(prog(t, 6.3, 7.5) * Math.PI) * 45;
      small.setAttribute('transform', `translate(825 ${880 - hop}) rotate(${Math.sin(prog(t, 6.3, 7.5) * Math.PI) * 12}) scale(.78)`);
    }
  };
}

// NEXT_PREMIUM_SCENES
