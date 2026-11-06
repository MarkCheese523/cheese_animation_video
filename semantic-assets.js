function saCompanyBuilding() {
  const group = el('g', { filter: 'url(#shadow)' });
  const windows = [];
  el('path', { d: 'M-238 145H218L250 177V205H-250V177Z', transform: 'translate(10 12)', fill: FULL_COLORS.ink, opacity: .18 }, group);
  el('path', { d: 'M-238 145H218L250 177V192H-250V177Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 5 }, group);
  el('path', { d: 'M-215 192H225V213H-225Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);

  for (const side of [-1, 1]) {
    const x = side * 155;
    el('path', { d: `M${x - 78}-82H${x + 65}L${x + 82}-65V145H${x - 78}Z`, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
    el('path', { d: `M${x + 65}-82L${x + 82}-65V145L${x + 65} 130Z`, fill: FULL_COLORS.ink }, group);
    el('path', { d: `M${x - 68}-68H${x + 52}V130H${x - 68}Z`, fill: 'url(#dotFill)', opacity: .13 }, group);
    el('path', { d: `M${x - 86}-91H${x + 65}L${x + 88}-74H${x - 72}Z`, fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 3 }, group);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      const wx = x - 48 + col * 60, wy = -42 + row * 42;
      const window = el('g', {}, group);
      el('rect', { x: wx, y: wy, width: 34, height: 23, rx: 2, fill: FULL_COLORS.ink }, window);
      el('path', { d: `M${wx + 6} ${wy + 6}H${wx + 28}M${wx + 6} ${wy + 12}H${wx + 20}`, stroke: FULL_COLORS.green, 'stroke-width': 3, opacity: .7 }, window);
      windows.push(window);
    }
  }

  el('path', { d: 'M-118-218H82L118-184V145H-118Z', transform: 'translate(11 12)', fill: FULL_COLORS.ink, opacity: .2 }, group);
  el('path', { d: 'M-118-218H82L118-184V145H-118Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 7 }, group);
  el('path', { d: 'M82-218L118-184V145L82 128Z', fill: FULL_COLORS.ink }, group);
  el('path', { d: 'M-103-198H70V130H-103Z', fill: 'url(#dotFill)', opacity: .1 }, group);
  el('path', { d: 'M-132-228H82L132-190H-98Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 4 }, group);
  el('path', { d: 'M-113-213H76', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .45 }, group);
  text('ANTH / COMPANY', { x: -12, y: -174, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 17, 'font-weight': 900, 'letter-spacing': 3, fill: FULL_COLORS.ink }, group);

  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const wx = -82 + col * 52, wy = -137 + row * 43;
    const window = el('g', {}, group);
    el('rect', { x: wx, y: wy, width: 30, height: 25, rx: 2, fill: FULL_COLORS.ink }, window);
    el('rect', { x: wx + 6, y: wy + 5, width: 18, height: 4, fill: FULL_COLORS.green, opacity: .8 }, window);
    el('circle', { cx: wx + 9, cy: wy + 17, r: 2.3, fill: FULL_COLORS.paper }, window);
    el('circle', { cx: wx + 17, cy: wy + 17, r: 2.3, fill: FULL_COLORS.paper, opacity: .6 }, window);
    windows.push(window);
  }

  el('path', { d: 'M-69 38H48L65 55V145H-69Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 4 }, group);
  const doorLeft = el('g', {}, group), doorRight = el('g', {}, group);
  el('path', { d: 'M-56 53H-7V145H-56Z', fill: 'url(#greenDots)', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .75 }, doorLeft);
  el('path', { d: 'M2 53H51V145H2Z', fill: 'url(#greenDots)', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .75 }, doorRight);
  el('circle', { cx: -16, cy: 101, r: 3, fill: FULL_COLORS.green }, doorLeft);
  el('circle', { cx: 11, cy: 101, r: 3, fill: FULL_COLORS.green }, doorRight);

  el('path', { d: 'M-12-228V-294', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  const flag = el('g', {}, group);
  el('path', { d: 'M-9-291H73L55-269L73-247H-9Z', fill: FULL_COLORS.green, stroke: FULL_COLORS.ink, 'stroke-width': 4 }, flag);
  el('path', { d: 'M5-280H48M5-268H35', stroke: FULL_COLORS.ink, 'stroke-width': 3, opacity: .45 }, flag);
  const beacon = el('circle', { cx: -12, cy: -304, r: 8, fill: FULL_COLORS.green, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, group);
  text('COMPANY / 公司', { x: 0, y: 253, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 24, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.ink }, group);
  group.windows = windows; group.doorLeft = doorLeft; group.doorRight = doorRight; group.flag = flag; group.beacon = beacon;
  return group;
}

function saGenericFigure() {
  const group = el('g', { filter: 'url(#shadow)' });
  el('ellipse', { cx: 7, cy: 119, rx: 72, ry: 17, fill: FULL_COLORS.ink, opacity: .13 }, group);
  el('path', { d: 'M-31 54L-39 112H-8L3 58M31 54L39 112H8L-3 58', fill: FULL_COLORS.ink, stroke: FULL_COLORS.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, group);
  el('path', { d: 'M-51-44Q0-67 51-44L67 61L35 72L27 21V69H-27V21L-35 72L-67 61Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, group);
  el('path', { d: 'M-42-37Q0-53 42-37L50 51L31 57L23 9V58H-23V9L-31 57L-50 51Z', fill: 'url(#dotFill)', opacity: .22 }, group);
  el('path', { d: 'M0-48V58M-20-36L0-15L20-36', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 3, opacity: .45 }, group);
  el('path', { d: 'M-17-67V-48H17V-67', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, group);
  el('circle', { cx: 0, cy: -105, r: 42, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('circle', { cx: 0, cy: -105, r: 34, fill: 'url(#dotFill)', opacity: .42 }, group);
  el('path', { d: 'M-28-133Q0-154 28-133', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  return group;
}

function saModuleCard(x, y, width, height, color) {
  const group = el('g', { transform: `translate(${x} ${y})` });
  el('rect', { x: 5, y: 7, width, height, rx: 12, fill: FULL_COLORS.ink, opacity: .16 }, group);
  el('rect', { x: 0, y: 0, width, height, rx: 12, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, group);
  el('rect', { x: 0, y: 0, width, height: 10, rx: 5, fill: color }, group);
  el('rect', { x: 10, y: 18, width: width - 20, height: height - 28, rx: 6, fill: 'url(#dotFill)', opacity: .14 }, group);
  return group;
}

function saCapabilityModules() {
  const group = el('g', { filter: 'url(#shadow)' });
  const specs = [
    [-142, -123, FULL_COLORS.blue, '01'], [12, -123, FULL_COLORS.green, '02'],
    [-142, 12, FULL_COLORS.purple, '03'], [12, 12, FULL_COLORS.orange, '04']
  ];
  specs.forEach(([x, y, color, label]) => {
    const card = saModuleCard(x, y, 130, 102, color); group.appendChild(card);
    el('rect', { x: 20, y: 31, width: 48, height: 42, rx: 8, fill: FULL_COLORS.ink }, card);
    el('path', { d: 'M31 43H56M31 53H50M31 63H58', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round' }, card);
    text(label, { x: 106, y: 68, 'text-anchor': 'end', class: 'mg-num', 'font-size': 25, 'font-weight': 900, fill: color }, card);
  });
  el('path', { d: 'M-12-72H12M-77-21V12M77-21V12M-12 63H12', stroke: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-dasharray': '4 7' }, group);
  return group;
}

function saNetworkNodes() {
  const group = el('g', { filter: 'url(#shadow)' });
  const nodes = [[-135, -105, FULL_COLORS.blue], [135, -105, FULL_COLORS.green], [-135, 85, FULL_COLORS.purple], [135, 85, FULL_COLORS.orange]];
  nodes.forEach(([x, y]) => el('path', { d: `M0-10L${x} ${y}`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-dasharray': '9 8' }, group));
  nodes.forEach(([x, y, color], index) => {
    const node = el('g', { transform: `translate(${x} ${y})` }, group);
    el('rect', { x: -48, y: -36, width: 96, height: 72, rx: 15, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, node);
    el('circle', { cx: -24, cy: 0, r: 12, fill: color, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, node);
    el('path', { d: 'M0-12H28M0 0H21M0 12H30', stroke: FULL_COLORS.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, node);
    text(`0${index + 1}`, { x: 0, y: 58, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 16, 'font-weight': 900, fill: color }, node);
  });
  el('circle', { cx: 0, cy: -10, r: 62, fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 6 }, group);
  el('circle', { cx: 0, cy: -10, r: 42, fill: 'url(#greenDots)', stroke: FULL_COLORS.paper, 'stroke-width': 2 }, group);
  el('path', { d: 'M-19-10H19M0-29V9', stroke: FULL_COLORS.paper, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  return group;
}

function saCostBalance() {
  const group = el('g', { filter: 'url(#shadow)' });
  const receipt = saModuleCard(-155, -125, 128, 190, FULL_COLORS.green); group.appendChild(receipt);
  text('¥', { x: 64, y: 87, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 64, 'font-weight': 900, fill: FULL_COLORS.ink }, receipt);
  el('path', { d: 'M24 112H103M24 132H88M24 152H97', stroke: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .55 }, receipt);
  el('path', { d: 'M64-112V94M4 94H124M-42-69H170M-28-69L-72 12M156-69L200 12', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  el('path', { d: 'M-118 12H-26Q-34 65-72 65T-118 12ZM154 12H246Q238 65 200 65T154 12Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('path', { d: 'M-105 23H-39M167 23H233', stroke: FULL_COLORS.orange, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  el('circle', { cx: 64, cy: -112, r: 13, fill: FULL_COLORS.green, stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);
  return group;
}

function saRetentionLoop() {
  const group = el('g', { filter: 'url(#shadow)' });
  const card = saModuleCard(-82, -70, 164, 140, FULL_COLORS.green); group.appendChild(card);
  el('path', { d: 'M-45-25H45M-45 0H25M-45 25H37', stroke: FULL_COLORS.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  el('path', { d: 'M-125-52A145 145 0 0 1 111-84L137-64M137-64L129-105M125 52A145 145 0 0 1-111 84L-137 64M-137 64L-129 105', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
  el('path', { d: 'M-125-52A145 145 0 0 1 111-84M125 52A145 145 0 0 1-111 84', fill: 'none', stroke: FULL_COLORS.green, 'stroke-width': 5, 'stroke-linecap': 'round' }, group);
  el('circle', { cx: 70, cy: 48, r: 30, fill: FULL_COLORS.green, stroke: FULL_COLORS.ink, 'stroke-width': 5 }, group);
  el('path', { d: 'M55 48L66 59L86 36', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
  return group;
}

function saWorkflowPipeline() {
  const group = el('g', { filter: 'url(#shadow)' });
  const colors = [FULL_COLORS.blue, FULL_COLORS.purple, FULL_COLORS.orange, FULL_COLORS.green];
  for (let i = 0; i < 4; i++) {
    const x = -160 + i * 82, y = -70 + i * 27;
    const card = saModuleCard(x, y, 110, 126, colors[i]); group.appendChild(card);
    el('path', { d: 'M22 40H85M22 60H72M22 80H87', stroke: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .72 }, card);
    text(`0${i + 1}`, { x: 87, y: 108, 'text-anchor': 'end', class: 'mg-num', 'font-size': 20, 'font-weight': 900, fill: colors[i] }, card);
    if (i < 3) el('path', { d: `M${x + 112} ${y + 61}H${x + 140}L${x + 130} ${y + 51}M${x + 140} ${y + 61}L${x + 130} ${y + 71}`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
  }
  return group;
}

function saAbstractModules() {
  const group = el('g', { filter: 'url(#shadow)' });
  [[-105, -80, FULL_COLORS.blue], [25, -80, FULL_COLORS.green], [-40, 25, FULL_COLORS.purple]].forEach(([x, y, color]) => {
    const card = saModuleCard(x, y, 110, 100, color); group.appendChild(card);
    el('circle', { cx: 55, cy: 58, r: 20, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, card);
  });
  return group;
}

function saShareholderFigure(index, color) {
  const group = saGenericFigure();
  el('path', { d: 'M-19-13H19L24-7V17L19 23H-19L-24 17V-7Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 3 }, group);
  text(String(index).padStart(2, '0'), { x: 0, y: 12, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 21, 'font-weight': 900, fill: color }, group);
  text(`SHAREHOLDER / 股东 ${index}`, { x: 0, y: 157, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 17, 'font-weight': 900, 'letter-spacing': 2, fill: FULL_COLORS.ink }, group);
  return group;
}

function saVoterFigure(index, color) {
  const group = el('g', {});
  el('path', { d: 'M-28 42L-34 96H-8L0 49M28 42L34 96H8L0 49', fill: FULL_COLORS.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' }, group);
  el('path', { d: 'M-43-39Q0-56 43-39L52 53H-52Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('path', { d: 'M-35-31Q0-43 35-31L41 43H-41Z', fill: 'url(#dotFill)', opacity: .25 }, group);
  el('path', { d: 'M-39-27L-72 32', stroke: FULL_COLORS.ink, 'stroke-width': 20, 'stroke-linecap': 'round' }, group);
  el('path', { d: 'M-39-27L-72 32', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .7 }, group);
  const raisedArm = el('g', {}, group);
  el('path', { d: 'M34-28L59-86L48-139', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, raisedArm);
  el('path', { d: 'M34-28L59-86L48-139', fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, raisedArm);
  el('path', { d: 'M39-150L42-166Q44-174 50-168L53-157L58-169Q62-174 66-167L65-147Q61-132 48-132Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }, raisedArm);
  el('circle', { cx: 0, cy: -94, r: 37, fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('circle', { cx: 0, cy: -94, r: 30, fill: 'url(#dotFill)', opacity: .45 }, group);
  el('path', { d: 'M-25-118Q0-137 25-118', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 6, 'stroke-linecap': 'round' }, group);
  el('path', { d: 'M-13-15H13V7H-13Z', fill: color, stroke: FULL_COLORS.ink, 'stroke-width': 2 }, group);
  text(String(index), { x: 0, y: 4, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 15, 'font-weight': 900, fill: FULL_COLORS.ink }, group);
  return { group, raisedArm, pivot: { x: 34, y: -28 } };
}

function saVotingAssembly() {
  const group = el('g', { filter: 'url(#shadow)' });
  const arms = [], voters = [];
  const specs = [
    { x: -155, color: FULL_COLORS.E },
    { x: 0, color: FULL_COLORS.green },
    { x: 155, color: FULL_COLORS.T },
  ];
  specs.forEach((spec, i) => {
    const voter = saVoterFigure(i + 1, spec.color);
    voter.group.setAttribute('transform', `translate(${spec.x} -25) scale(.72)`);
    group.appendChild(voter.group);
    voters.push(voter.group); arms.push({ node: voter.raisedArm, pivot: voter.pivot, i });
  });
  el('path', { d: 'M-250 104H250', stroke: FULL_COLORS.ink, 'stroke-width': 4, 'stroke-dasharray': '5 13', opacity: .25 }, group);
  el('path', { d: 'M-100 41H77L100 64V158H-100Z', transform: 'translate(8 9)', fill: FULL_COLORS.ink, opacity: .2 }, group);
  el('path', { d: 'M-100 41H77L100 64V158H-100Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 6 }, group);
  el('path', { d: 'M-88 57H66L84 72V140H-88Z', fill: 'url(#dotFill)', opacity: .18 }, group);
  el('path', { d: 'M-112 34H88L110 55H-88Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.green, 'stroke-width': 4 }, group);
  el('path', { d: 'M-52 43H40', stroke: FULL_COLORS.paper, 'stroke-width': 7, 'stroke-linecap': 'round' }, group);
  text('VOTE', { x: 0, y: 113, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 43, 'font-weight': 900, 'letter-spacing': 5, fill: FULL_COLORS.ink }, group);
  for (const x of [-77, 77]) for (const y of [78, 137]) el('circle', { cx: x, cy: y, r: 4, fill: FULL_COLORS.green }, group);
  const ballots = [];
  for (let i = 0; i < 3; i++) {
    const ballot = el('g', {}, group);
    el('path', { d: 'M-24-33H15L24-24V33H-24Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 3 }, ballot);
    el('path', { d: 'M-13-15H12M-13-4H7M-13 8H13', stroke: i === 0 ? FULL_COLORS.E : i === 1 ? FULL_COLORS.green : FULL_COLORS.T, 'stroke-width': 4 }, ballot);
    ballots.push({ node: ballot, x: -55 + i * 55, y: -20 - i * 24, i });
  }
  text('举手表决 / 更换董事', { x: 0, y: 205, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 27, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.ink }, group);
  group.arms = arms; group.ballots = ballots; group.voters = voters;
  return group;
}

function saDirectorChair() {
  const group = el('g', { filter: 'url(#shadow)' });
  const upper = el('g', {}, group);
  el('path', { d: 'M-71-139H49L71-117V24H-71Z', transform: 'translate(8 9)', fill: FULL_COLORS.ink, opacity: .2 }, upper);
  el('path', { d: 'M-71-139H49L71-117V24H-71Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 6 }, upper);
  el('path', { d: 'M-53-119H40L52-107V6H-53Z', fill: 'url(#dotFill)', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .65 }, upper);
  for (let i = 0; i < 4; i++) el('path', { d: `M-38 ${-91 + i * 27}H35`, stroke: FULL_COLORS.T, 'stroke-width': 3, opacity: .35 }, upper);
  el('path', { d: 'M-89 17H67L89 39V78H-89Z', fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 6 }, upper);
  el('path', { d: 'M-69 32H61L70 43V59H-69Z', fill: 'url(#dotFill)', opacity: .55 }, upper);
  for (const side of [-1, 1]) {
    el('path', { d: `M${side * 91}-9V53H${side * 65}`, fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 13, 'stroke-linecap': 'round' }, upper);
    el('path', { d: `M${side * 91}-9V53H${side * 65}`, fill: 'none', stroke: FULL_COLORS.T, 'stroke-width': 3, 'stroke-linecap': 'round' }, upper);
  }
  el('circle', { cx: 0, cy: -64, r: 24, fill: FULL_COLORS.ink, stroke: FULL_COLORS.T, 'stroke-width': 4 }, upper);
  text('T', { x: 0, y: -53, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 30, 'font-weight': 900, fill: FULL_COLORS.T }, upper);
  el('path', { d: 'M0 78V129M-62 143L0 119L62 143M-39 157L0 129L39 157', fill: 'none', stroke: FULL_COLORS.ink, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
  for (const [x, y] of [[-62, 143], [62, 143], [-39, 157], [39, 157]]) el('circle', { cx: x, cy: y + 7, r: 9, fill: FULL_COLORS.T, stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);
  text('SPECIAL DIRECTOR / 特别董事', { x: 0, y: 207, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 18, 'font-weight': 900, 'letter-spacing': 2, fill: FULL_COLORS.ink }, group);
  group.upper = upper;
  return group;
}

function saInstitutionBuilding(acronym = 'LTBT', label = '长期利益信托', color = FULL_COLORS.T) {
  const group = el('g', { filter: 'url(#shadow)' });
  el('path', { d: 'M-260 190H240L270 220V256H-270V220Z', transform: 'translate(10 12)', fill: FULL_COLORS.ink, opacity: .18 }, group);
  el('path', { d: 'M-225-151H225V190H-225Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 7 }, group);
  el('path', { d: 'M-209-135H209V174H-209Z', fill: 'url(#dotFill)', opacity: .13 }, group);
  el('path', { d: 'M-268-166L0-302L268-166V-134H-268Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' }, group);
  el('path', { d: 'M-223-169L0-272L223-169Z', fill: 'url(#dotFill)', stroke: color, 'stroke-width': 4, opacity: .7 }, group);
  el('path', { d: 'M-282-139H282V-105H-282Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, group);
  el('path', { d: 'M-248-127H248', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .45 }, group);
  const emblem = el('g', {}, group);
  el('circle', { cx: 0, cy: -199, r: 38, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, emblem);
  el('circle', { cx: 0, cy: -199, r: 27, fill: 'url(#dotFill)', opacity: .65 }, emblem);
  text(acronym === 'LTBT' ? 'T' : 'F', { x: 0, y: -186, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 38, 'font-weight': 900, fill: color }, emblem);
  text(acronym, { x: 0, y: -63, 'text-anchor': 'middle', class: 'mg-num', 'font-size': acronym.length > 4 ? 54 : 72, 'font-weight': 900, 'letter-spacing': 4, fill: FULL_COLORS.ink }, group);
  text(label, { x: 0, y: -18, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 31, 'font-weight': 800, 'letter-spacing': 5, fill: FULL_COLORS.ink }, group);

  const columns = [];
  for (let i = 0; i < 4; i++) {
    const x = -174 + i * 116, column = el('g', {}, group);
    el('path', { d: `M${x - 30} 22H${x + 30}L${x + 23} 157H${x - 23}Z`, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 3 }, column);
    el('path', { d: `M${x - 14} 35V145M${x} 35V145M${x + 14} 35V145`, stroke: FULL_COLORS.paper, 'stroke-width': 3, opacity: .42 }, column);
    el('path', { d: `M${x - 39} 8H${x + 39}V30H${x - 39}ZM${x - 38} 154H${x + 38}V177H${x - 38}Z`, fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 3 }, column);
    for (const y of [17, 165]) el('circle', { cx: x, cy: y, r: 4, fill: color }, column);
    columns.push(column);
  }
  const door = el('g', {}, group);
  el('path', { d: 'M-48 37H48V177H-48Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 4 }, door);
  el('path', { d: 'M-34 51H34V177H-34Z', fill: 'url(#greenDots)', opacity: .35 }, door);
  el('path', { d: 'M0 52V176M-26 110H26', stroke: color, 'stroke-width': 3, opacity: .7 }, door);
  el('circle', { cx: 17, cy: 119, r: 4, fill: color }, door);
  el('path', { d: 'M-260 190H240L270 220V238H-270V220Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 5 }, group);
  el('path', { d: 'M-240 238H250V263H-250Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 4 }, group);
  el('path', { d: 'M-218 213H218M-205 249H205', stroke: FULL_COLORS.paper, 'stroke-width': 2, opacity: .35 }, group);
  const beacon = el('circle', { cx: 0, cy: -315, r: 9, fill: color, stroke: FULL_COLORS.ink, 'stroke-width': 3 }, group);
  text(acronym === 'FUND' ? 'PUBLIC BENEFIT FUND' : 'INDEPENDENT INSTITUTION', { x: 0, y: 304, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 19, 'font-weight': 900, 'letter-spacing': 4, fill: FULL_COLORS.gray }, group);
  group.columns = columns; group.door = door; group.emblem = emblem; group.beacon = beacon;
  return group;
}

function saVoteMark(label = '投票权', color = FULL_COLORS.green) {
  const group = el('g', { filter: 'url(#shadow)' });
  const voter = saVoterFigure(1, color);
  voter.group.setAttribute('transform', 'translate(-78 12) scale(.48)');
  group.appendChild(voter.group);

  el('path', { d: 'M5-5H122L140 12V90H5Z', transform: 'translate(7 8)', fill: FULL_COLORS.ink, opacity: .18 }, group);
  el('path', { d: 'M5-5H122L140 12V90H5Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 5 }, group);
  el('path', { d: 'M15 9H116L126 18V76H15Z', fill: 'url(#dotFill)', opacity: .17 }, group);
  el('path', { d: 'M-5-13H122L143 7H13Z', fill: FULL_COLORS.ink, stroke: color, 'stroke-width': 4 }, group);
  el('path', { d: 'M40-5H93', stroke: FULL_COLORS.paper, 'stroke-width': 6, 'stroke-linecap': 'round' }, group);
  text('VOTE', { x: 71, y: 57, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 29, 'font-weight': 900, 'letter-spacing': 3, fill: FULL_COLORS.ink }, group);
  for (const x of [20, 120]) for (const y of [20, 73]) el('circle', { cx: x, cy: y, r: 3, fill: color }, group);

  const ballot = el('g', {}, group);
  el('path', { d: 'M48-56H78L86-48V-10H48Z', fill: '#fffdf7', stroke: FULL_COLORS.ink, 'stroke-width': 3 }, ballot);
  el('path', { d: 'M56-40H76M56-31H72M56-22H77', stroke: color, 'stroke-width': 3 }, ballot);
  text(label, { x: 0, y: 132, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 30, 'font-weight': 800, 'letter-spacing': 4, fill: FULL_COLORS.ink }, group);
  group.raisedArm = voter.raisedArm; group.pivot = voter.pivot; group.ballot = ballot;
  return group;
}
