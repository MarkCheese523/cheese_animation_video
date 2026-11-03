/* Dark narrative study: original 2.5D sprites, theatrical staging, pure render(t). */
SCENE_BUILDERS.darkNarrativeSequence = (scene, api) => {
  const M = MotionPresets;
  const p = scene.props || {};
  const assetBase = p.assetBase || 'assets/walk';
  const elements = Array.isArray(p.elements) ? p.elements : [];
  const intensity = p.motion?.intensity || 'balanced';
  const timeline = M.makeTimeline(p.beats);
  const amplitude = { subtle: .65, balanced: 1, showreel: 1.35 }[intensity] || 1;
  const damping = { subtle: .72, balanced: .46, showreel: .34 }[intensity] || .46;
  const el = api.el;
  const text = api.text;
  const root = el('g', { 'data-motion-intensity': intensity, 'data-storyboard-id': p.storyboardId || '' });
  const C = { bg: '#071b15', floor: '#0e2b21', raised: '#173a2c', edge: '#29453a', ink: '#eff5e7', muted: '#92a69a', accent: '#c6ff3d', dark: '#102a22' };
  const defs = el('defs', {}, root);
  const glow = el('filter', { id: 'darkNarrativeGlow', x: '-100%', y: '-100%', width: '300%', height: '300%' }, defs);
  el('feGaussianBlur', { stdDeviation: 18, result: 'blur' }, glow);
  const merge = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'blur' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);
  const gradient = el('radialGradient', { id: 'darkNarrativeSpot', cx: '50%', cy: '50%', r: '50%' }, defs);
  el('stop', { offset: '0%', 'stop-color': C.accent, 'stop-opacity': .18 }, gradient);
  el('stop', { offset: '100%', 'stop-color': C.accent, 'stop-opacity': 0 }, gradient);

  el('rect', { width: api.W, height: api.H, fill: C.bg }, root);
  const floorGrid = el('g', { stroke: C.muted, 'stroke-width': 2, opacity: .075 }, root);
  for (let x = -900; x < 1900; x += 150) {
    el('line', { x1: x, y1: 1920, x2: x + 950, y2: 280 }, floorGrid);
    el('line', { x1: x, y1: 280, x2: x + 950, y2: 1920 }, floorGrid);
  }
  const aura = el('ellipse', { cx: 790, cy: 780, rx: 520, ry: 660, fill: 'url(#darkNarrativeSpot)' }, root);
  el('rect', { x: 70, y: 78, width: 12, height: 12, rx: 2, fill: C.accent }, root);
  text('DARK NARRATIVE  /  2.5D STAGE', { x: 103, y: 91, class: 'mg-num', 'font-size': 23, 'font-weight': 750, 'letter-spacing': 2.6, fill: C.muted }, root);
  text('ORTHOGRAPHIC · TOON · RGBA', { x: 1008, y: 91, 'text-anchor': 'end', class: 'mg-num', 'font-size': 17, 'font-weight': 700, 'letter-spacing': 1.5, fill: C.muted, opacity: .55 }, root);
  el('line', { x1: 70, y1: 126, x2: 1010, y2: 126, stroke: C.muted, 'stroke-width': 2, opacity: .22 }, root);
  const beatLabel = text('汇聚', { x: 72, y: 222, class: 'mg-text', 'font-size': 64, 'font-weight': 850, fill: C.ink }, root);
  const beatNote = text('纸盒人与机器人进入同一座叙事舞台', { x: 74, y: 278, class: 'mg-text', 'font-size': 28, fill: C.muted }, root);
  const phases = [
    ['汇聚', '纸盒人与机器人进入同一座叙事舞台'],
    ['触发', '一次点击点亮角色、控制台与能量通路'],
    ['分工', '输入、协作、交付成为三个半立体叙事单元'],
    ['协同', '角色换道，状态与通路一起重新组织'],
    ['共鸣', '角色与机制收束为同一个清晰结论']
  ];

  function label(parent, value, x, y, options = {}) {
    return text(value, { x, y, class: options.num ? 'mg-num' : 'mg-text', 'font-size': options.size || 24, 'font-weight': options.weight || 700, 'letter-spacing': options.spacing || 0, 'text-anchor': options.anchor || 'start', fill: options.fill || C.ink, opacity: options.opacity ?? 1 }, parent);
  }
  function pill(parent, x, y, width, value, active = true) {
    const group = el('g', {}, parent);
    el('rect', { x, y, width, height: 48, rx: 24, fill: active ? C.accent : C.raised, stroke: active ? C.accent : C.edge, 'stroke-width': 2 }, group);
    el('circle', { cx: x + 23, cy: y + 24, r: 5, fill: active ? C.dark : C.muted }, group);
    label(group, value, x + width / 2 + 7, y + 32, { size: 19, anchor: 'middle', fill: active ? C.dark : C.muted });
    return group;
  }
  function platform(parent, x, y, width = 400, height = 130, active = false) {
    const group = el('g', { transform: `translate(${x} ${y})` }, parent);
    el('path', { d: `M${-width / 2} 0L0 ${height / 2}L${width / 2} 0V28L0 ${height / 2 + 28}L${-width / 2} 28Z`, fill: active ? '#294c27' : '#0a241b', stroke: C.edge, 'stroke-width': 3 }, group);
    el('path', { d: `M${-width / 2} 0L0 ${-height / 2}L${width / 2} 0L0 ${height / 2}Z`, fill: active ? '#244529' : C.floor, stroke: active ? C.accent : C.edge, 'stroke-width': 3 }, group);
    el('path', { d: `M${-width / 2 + 34} 0L0 ${-height / 2 + 22}L${width / 2 - 34} 0`, fill: 'none', stroke: active ? C.accent : C.muted, 'stroke-width': 3, opacity: active ? .7 : .16 }, group);
    return group;
  }
  function walker(parent, type, x, y, scale = 1, phase = 0) {
    const group = el('g', {}, parent);
    const shadow = el('ellipse', { cx: 0, cy: 2, rx: 64, ry: 19, fill: '#020b08', opacity: .48 }, group);
    const image = el('image', { href: `${assetBase}/${type}-00.png`, x: -160, y: -296, width: 320, height: 320, preserveAspectRatio: 'xMidYMid meet' }, group);
    return { group, image, shadow, type, x, y, scale, phase };
  }
  function pose(figure, t, x = figure.x, y = figure.y, scale = figure.scale, walking = true) {
    const frame = walking ? Math.floor(((t * 5 + figure.phase) % 1 + 1) % 1 * 16) : 0;
    const source = `${assetBase}/${figure.type}-${String(frame).padStart(2, '0')}.png`;
    if (figure.image.getAttribute('href') !== source) figure.image.setAttribute('href', source);
    figure.group.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
  }
  function isoCube(parent, x, y, size = 90, active = true) {
    const group = el('g', { transform: `translate(${x} ${y})` }, parent);
    const top = active ? '#e2ff9c' : '#315143';
    const left = active ? C.accent : '#203e31';
    const right = active ? '#83b82c' : '#152f24';
    el('path', { d: `M0 ${-size}L${size} ${-size / 2}L0 0L${-size} ${-size / 2}Z`, fill: top, stroke: C.dark, 'stroke-width': 3 }, group);
    el('path', { d: `M${-size} ${-size / 2}L0 0V${size}L${-size} ${size / 2}Z`, fill: left, stroke: C.dark, 'stroke-width': 3 }, group);
    el('path', { d: `M0 0L${size} ${-size / 2}V${size / 2}L0 ${size}Z`, fill: right, stroke: C.dark, 'stroke-width': 3 }, group);
    el('circle', { cx: -size * .42, cy: size * .15, r: 7, fill: C.dark }, group);
    el('circle', { cx: size * .42, cy: -size * .18, r: 7, fill: C.dark }, group);
    return group;
  }
  function selectedVisual(parent, concept, x, y, active) {
    const selected = elements.find(element => element.concept === concept)?.selected;
    const source = selected?.asset || selected?.svg;
    if (!source) return isoCube(parent, x, y, 70, active);
    const group = el('g', { transform: `translate(${x} ${y})`, 'data-selected-element': concept }, parent);
    el('rect', { x: -76, y: -76, width: 152, height: 152, rx: 40, fill: active ? C.accent : C.ink, stroke: C.edge, 'stroke-width': 3 }, group);
    const image = el('image', { href: source, x: -52, y: -52, width: 104, height: 104, preserveAspectRatio: 'xMidYMid meet' }, group);
    image.addEventListener('error', () => { image.remove(); isoCube(group, 0, 0, 70, active); }, { once: true });
    return group;
  }
  function beam(parent, x1, y1, x2, y2) {
    const group = el('g', {}, parent);
    const base = el('path', { d: `M${x1} ${y1}L${x2} ${y2}`, fill: 'none', stroke: C.muted, 'stroke-width': 4, 'stroke-dasharray': '9 15', opacity: .25 }, group);
    const active = el('path', { d: `M${x1} ${y1}L${x2} ${y2}`, fill: 'none', stroke: C.accent, 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, filter: 'url(#darkNarrativeGlow)' }, group);
    const dot = el('circle', { r: 12, fill: C.accent, filter: 'url(#darkNarrativeGlow)', opacity: 0 }, group);
    return { group, base, active, dot, x1, y1, x2, y2 };
  }
  function updateBeam(item, draw, travel) {
    item.active.setAttribute('stroke-dashoffset', 1 - draw);
    item.dot.setAttribute('cx', M.mix(item.x1, item.x2, travel));
    item.dot.setAttribute('cy', M.mix(item.y1, item.y2, travel));
    api.opacity(item.dot, Math.sin(M.clamp(travel) * Math.PI));
  }

  const opening = el('g', {}, root);
  el('path', { d: 'M-80 865L1080 305V520L-80 1130Z', fill: C.floor, opacity: .62 }, opening);
  el('path', { d: 'M-100 1420L1080 660V900L-100 1700Z', fill: C.floor, opacity: .82 }, opening);
  const speedLines = el('g', { stroke: C.accent, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .38 }, opening);
  [[40, 1110, 270, 1010], [360, 1520, 720, 1370], [690, 1060, 1010, 910], [80, 770, 260, 690], [790, 580, 1030, 470]].forEach(v => el('line', { x1: v[0], y1: v[1], x2: v[2], y2: v[3] }, speedLines));
  label(opening, '5×', 76, 472, { num: true, size: 178, weight: 900, fill: C.accent });
  label(opening, '两种角色，共用一条时间轴', 380, 400, { size: 35 });
  label(opening, 'HUMAN  +  AGENT', 384, 449, { num: true, size: 20, spacing: 3, fill: C.muted });
  const openingHumans = [
    [900, 600, .36], [760, 650, .44], [610, 704, .53], [450, 760, .65], [280, 824, .78], [110, 894, .92]
  ].map((v, i) => walker(opening, 'human', ...v, i * .13));
  const openingRobots = [
    [990, 850, .28], [900, 910, .34], [800, 970, .41], [690, 1040, .49], [570, 1115, .58], [440, 1195, .68], [300, 1285, .8], [150, 1380, .94]
  ].map((v, i) => walker(opening, 'robot', ...v, i * .11));
  el('line', { x1: 72, y1: 1570, x2: 72, y2: 1660, stroke: C.accent, 'stroke-width': 9 }, opening);
  label(opening, '不是换色，而是让角色把机制演出来', 108, 1628, { size: 40, weight: 800 });
  label(opening, '16-FRAME WALK CYCLES  /  ORIGINAL MASTERS', 108, 1680, { num: true, size: 17, spacing: 2, fill: C.muted });

  const trigger = el('g', {}, root);
  el('ellipse', { cx: 540, cy: 1010, rx: 460, ry: 490, fill: 'url(#darkNarrativeSpot)' }, trigger);
  platform(trigger, 540, 1210, 770, 240, true);
  const consoleGroup = el('g', {}, trigger);
  el('path', { d: 'M250 760L375 680H940L815 760V1060L690 1140H250Z', fill: '#0a2119', stroke: C.edge, 'stroke-width': 4 }, consoleGroup);
  el('path', { d: 'M250 760H815V1060H250Z', fill: C.raised, stroke: C.muted, 'stroke-opacity': .35, 'stroke-width': 3 }, consoleGroup);
  el('path', { d: 'M250 760L375 680H940L815 760Z', fill: '#244536', stroke: C.edge, 'stroke-width': 3 }, consoleGroup);
  el('path', { d: 'M815 760L940 680V980L815 1060Z', fill: '#0d2b20', stroke: C.edge, 'stroke-width': 3 }, consoleGroup);
  label(consoleGroup, 'COLLABORATION CONSOLE', 294, 817, { num: true, size: 17, spacing: 2, fill: C.muted });
  label(consoleGroup, '协作控制台', 292, 879, { size: 37, weight: 850 });
  [0, 1, 2].forEach(i => {
    el('circle', { cx: 305 + i * 35, cy: 931, r: 8, fill: i === 0 ? C.accent : C.muted, opacity: i === 0 ? 1 : .28 }, consoleGroup);
    el('rect', { x: 292 + i * 100, y: 981, width: 76, height: 10, rx: 5, fill: i === 0 ? C.accent : C.muted, opacity: i === 0 ? .8 : .18 }, consoleGroup);
  });
  const button = el('g', {}, consoleGroup);
  el('rect', { x: 570, y: 846, width: 190, height: 112, rx: 28, fill: '#07170f', stroke: C.accent, 'stroke-width': 4 }, button);
  el('rect', { x: 582, y: 850, width: 166, height: 88, rx: 22, fill: C.accent }, button);
  label(button, '启动', 665, 907, { size: 31, weight: 900, anchor: 'middle', fill: C.dark });
  const BUTTON = { x: 665, y: 894 };
  const clickRing = el('circle', { cx: BUTTON.x, cy: BUTTON.y, r: 18, fill: 'none', stroke: C.accent, 'stroke-width': 8 }, trigger);
  const cursor = el('g', { 'data-pointer': 'true' }, trigger);
  el('path', { d: 'M0 0L-18 30L-6 28V52Q-6 58 0 58Q6 58 6 52V28L18 30Z', fill: C.ink, stroke: C.dark, 'stroke-width': 4, 'stroke-linejoin': 'round', filter: 'url(#shadow)' }, cursor);
  const triggerHuman = walker(trigger, 'human', 175, 1220, 1.03, .2);
  const triggerRobot = walker(trigger, 'robot', 900, 1250, 1.02, .6);
  const triggerBeam = beam(trigger, 810, 820, 905, 1070);
  const triggerStatus = pill(trigger, 385, 1390, 310, '能量通路已接通');
  label(trigger, '角色、物体与光效响应同一拍点', 540, 1530, { size: 31, anchor: 'middle', fill: C.muted });

  const modules = el('g', {}, root);
  const moduleData = [
    { x: 65, concept: '凭证', title: '输入', en: '01 / RECEIVE', type: 'human', note: '接收任务与上下文' },
    { x: 390, concept: '同步', title: '协作', en: '02 / COMPOSE', type: 'robot', note: '拆解、连接与执行' },
    { x: 715, concept: '数据', title: '交付', en: '03 / RESOLVE', type: 'human', note: '验证结果并回收状态' }
  ];
  const moduleCards = moduleData.map((data, index) => {
    const group = el('g', {}, modules);
    el('path', { d: `M${data.x} 610L${data.x + 42} 578H${data.x + 300}V1138L${data.x + 258} 1170H${data.x}Z`, fill: '#091f17', stroke: C.edge, 'stroke-width': 3 }, group);
    el('rect', { x: data.x, y: 610, width: 258, height: 518, rx: 28, fill: index === 1 ? '#173b29' : C.floor, stroke: index === 1 ? C.accent : C.edge, 'stroke-width': 3 }, group);
    el('path', { d: `M${data.x + 28} 610L${data.x + 70} 578H${data.x + 258}L${data.x + 216} 610Z`, fill: index === 1 ? '#345c32' : '#214233' }, group);
    label(group, data.en, data.x + 28, 666, { num: true, size: 15, spacing: 1.5, fill: C.muted });
    label(group, data.title, data.x + 28, 735, { size: 43, weight: 850 });
    selectedVisual(group, data.concept, data.x + 129, 875, index === 1);
    const figure = walker(group, data.type, data.x + 129, 1080, .56, index * .27);
    label(group, data.note, data.x + 129, 1218, { size: 21, anchor: 'middle', fill: C.muted });
    pill(group, data.x + 39, 1260, 180, index === 1 ? '正在协作' : '已连接', index === 1);
    return { group, figure, data };
  });
  const moduleLinks = [beam(modules, 325, 960, 390, 960), beam(modules, 650, 960, 715, 960)];
  label(modules, '3 个叙事单元  /  1 条能量通路', 540, 1455, { size: 36, weight: 800, anchor: 'middle' });
  label(modules, '体积、遮挡、连接与状态共同提供信息', 540, 1510, { size: 25, anchor: 'middle', fill: C.muted });

  const collaboration = el('g', {}, root);
  const switchTrack = el('g', {}, collaboration);
  el('rect', { x: 335, y: 370, width: 410, height: 116, rx: 58, fill: C.floor, stroke: C.edge, 'stroke-width': 3 }, switchTrack);
  const switchKnob = el('g', {}, switchTrack);
  el('circle', { r: 43, fill: C.accent, filter: 'url(#darkNarrativeGlow)' }, switchKnob);
  el('path', { d: 'M-15 0L-4 12L18-14', fill: 'none', stroke: C.dark, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, switchKnob);
  label(collaboration, '串行', 290, 438, { size: 25, anchor: 'end', fill: C.muted });
  label(collaboration, '协同', 790, 438, { size: 25, fill: C.accent });
  const laneCards = [
    { x: 80, title: '任务队列', type: 'human', code: 'HUMAN LANE', detail: '等待 · 接收 · 验证' },
    { x: 580, title: '执行队列', type: 'robot', code: 'AGENT LANE', detail: '拆解 · 执行 · 回传' }
  ].map((data, index) => {
    const group = el('g', {}, collaboration);
    platform(group, data.x + 210, 1140, 390, 135, index === 1);
    el('rect', { x: data.x, y: 620, width: 420, height: 410, rx: 34, fill: C.floor, stroke: index === 1 ? C.accent : C.edge, 'stroke-width': 3 }, group);
    label(group, data.code, data.x + 32, 680, { num: true, size: 16, spacing: 2, fill: C.muted });
    label(group, data.title, data.x + 32, 749, { size: 38, weight: 850 });
    label(group, data.detail, data.x + 32, 794, { size: 21, fill: C.muted });
    for (let row = 0; row < 3; row += 1) {
      el('rect', { x: data.x + 34, y: 850 + row * 47, width: 270 - row * 38, height: 12, rx: 6, fill: row === 0 && index === 1 ? C.accent : C.muted, opacity: row === 0 && index === 1 ? .8 : .18 }, group);
      el('circle', { cx: data.x + 356, cy: 856 + row * 47, r: 7, fill: row <= index ? C.accent : C.muted, opacity: row <= index ? 1 : .2 }, group);
    }
    const figure = walker(group, data.type, data.x + 210, 1115, .86, index * .4);
    return { group, figure, data };
  });
  const route = el('path', { d: 'M170 1370Q540 1580 910 1370', fill: 'none', stroke: C.accent, 'stroke-width': 8, 'stroke-dasharray': '15 17', 'stroke-linecap': 'round' }, collaboration);
  const routeDot = el('g', {}, collaboration);
  el('circle', { r: 24, fill: C.bg, stroke: C.accent, 'stroke-width': 5 }, routeDot);
  el('circle', { r: 8, fill: C.accent }, routeDot);
  label(collaboration, '换道不是位移：队列、状态与结果一起更新', 540, 1645, { size: 29, anchor: 'middle', fill: C.muted });

  const ending = el('g', {}, root);
  el('ellipse', { cx: 540, cy: 880, rx: 480, ry: 580, fill: 'url(#darkNarrativeSpot)' }, ending);
  const endRing = el('ellipse', { cx: 540, cy: 1130, rx: 350, ry: 130, fill: 'none', stroke: C.accent, 'stroke-width': 3, 'stroke-dasharray': '5 17', opacity: .45 }, ending);
  platform(ending, 540, 1180, 620, 210, true);
  const endCube = isoCube(ending, 540, 860, 145, true);
  const endHuman = walker(ending, 'human', 275, 1170, 1.08, .1);
  const endRobot = walker(ending, 'robot', 805, 1170, 1.08, .6);
  label(ending, '机制被看见，', 540, 1400, { size: 62, weight: 850, anchor: 'middle' });
  label(ending, '协作才发生。', 540, 1482, { size: 62, weight: 850, anchor: 'middle', fill: C.accent });
  label(ending, '2D CHARACTERS  ·  VOLUMETRIC STAGING  ·  NARRATIVE LIGHT', 540, 1560, { num: true, size: 16, spacing: 1.7, anchor: 'middle', fill: C.muted });
  pill(ending, 375, 1630, 330, '深色插画叙事风');

  return actualT => {
    const phase = timeline.indexAt(actualT);
    const beat = timeline.beats[phase];
    const t = timeline.warp(actualT);
    root.setAttribute('data-active-beat', beat.id);
    beatLabel.textContent = beat.label;
    beatNote.textContent = phases[phase][1];
    const starts = [0, 3, 7, 11.8, 16.75];
    api.opacity(beatLabel, .55 + .45 * M.out(M.prog(t, starts[phase], .35)));
    aura.setAttribute('transform', `translate(${Math.sin(t * .35) * 45} ${Math.cos(t * .25) * 30})`);

    api.opacity(opening, 1 - M.prog(t, 2.75, .25));
    openingHumans.forEach((figure, i) => {
      const enter = M.springEnter(t, .08 + i * .07, .7);
      pose(figure, t, figure.x + t * 7, figure.y - t * 2, figure.scale * enter);
      api.opacity(figure.group, M.clamp(enter));
    });
    openingRobots.forEach((figure, i) => {
      const enter = M.springEnter(t, .35 + i * .06, .7);
      pose(figure, t, figure.x + t * 5, figure.y - t * 1.5, figure.scale * enter);
      api.opacity(figure.group, M.clamp(enter));
    });
    speedLines.setAttribute('transform', `translate(${(t * 30) % 140} ${-(t * 30) % 140 * .4})`);
    api.opacity(speedLines, timeline.action('gather') === 'logo-reveal' ? .12 : .38);

    api.opacity(trigger, M.prog(t, 2.85, .3) * (1 - M.prog(t, 6.75, .25)));
    const consoleEnter = M.springEnter(t, 3.0, .75);
    consoleGroup.setAttribute('transform', `translate(0 ${M.mix(100, 0, consoleEnter)})`);
    pose(triggerHuman, t, 175, 1220, 1.03, false);
    pose(triggerRobot, t, 900, 1250, 1.02, false);
    const move = M.reflow(t, 3.2, 1.0);
    cursor.setAttribute('transform', `translate(${M.mix(230, BUTTON.x, move)} ${M.mix(1440, BUTTON.y, move)}) scale(${M.press(t, 4.55, 4.78, .82)})`);
    api.opacity(cursor, timeline.action('trigger') === 'direct-press' ? 0 : M.prog(t, 3.1, .25) * (1 - M.prog(t, 5.75, .35)));
    button.setAttribute('transform', `translate(${BUTTON.x} ${BUTTON.y}) scale(${M.press(t, 4.55, 4.78, .9)}) translate(${-BUTTON.x} ${-BUTTON.y})`);
    const click = M.prog(t, 4.52, .08) * (1 - M.prog(t, 4.72, .4));
    api.opacity(clickRing, click);
    clickRing.setAttribute('r', M.mix(18, 115, M.out(M.prog(t, 4.52, .55))));
    updateBeam(triggerBeam, M.drawOn(t, 4.7, .8), M.prog(t, 4.8, 1.25));
    api.opacity(triggerStatus, M.springEnter(t, 5.05, .65));

    api.opacity(modules, M.prog(t, 6.82, .35) * (1 - M.prog(t, 11.5, .28)));
    const moduleReflow = timeline.action('split') === 'card-reflow' ? M.spring(M.prog(t, 8.2, 1), damping, 10) : 0;
    moduleCards.forEach((card, index) => {
      const enter = M.springEnter(t, 7.0 + index * .16, .85, damping);
      card.group.setAttribute('transform', `translate(${(index - 1) * 32 * moduleReflow} ${M.mix(110 * amplitude, 0, enter)})`);
      api.opacity(card.group, M.clamp(enter));
      pose(card.figure, t, card.data.x + 129, 1080, .56, false);
    });
    moduleLinks.forEach((link, index) => {
      api.opacity(link.group, timeline.action('split') === 'component-flow' ? 1 : 0);
      updateBeam(link, M.drawOn(t, 7.8 + index * .3, .8), M.prog(t, 8.1 + index * .3, 1.5));
    });

    api.opacity(collaboration, M.prog(t, 11.58, .3) * (1 - M.prog(t, 16.48, .25)));
    const flip = M.stateFlip(t, 12.85, .85);
    switchKnob.setAttribute('transform', `translate(${M.mix(405, 675, M.spring(flip, damping, 13))} 428)`);
    laneCards.forEach((card, index) => {
      const enter = M.springEnter(t, 11.75 + index * .12, .7, damping);
      const reorder = timeline.action('switch') === 'status-only' ? 0 : M.reflow(t, 14.0, 1.0);
      const direction = index === 0 ? 1 : -1;
      card.group.setAttribute('transform', `translate(${direction * 500 * reorder} ${M.mix(70 * amplitude, 0, enter)})`);
      api.opacity(card.group, M.clamp(enter));
      pose(card.figure, t, card.data.x + 210, 1115, .86, true);
    });
    route.setAttribute('stroke-dashoffset', -t * 45);
    const travel = M.prog(t, 12.1, 3.5);
    routeDot.setAttribute('transform', `translate(${M.mix(170, 910, travel)} ${1370 + 420 * travel * (1 - travel)})`);

    const end = M.logoResolve(t, 16.55, 1.0);
    api.opacity(ending, M.clamp(end));
    ending.setAttribute('transform', `translate(540 1000) scale(${M.mix(.8, 1, end)}) translate(-540 -1000)`);
    endCube.setAttribute('transform', `translate(540 ${860 + Math.sin(t * 2) * 12}) rotate(${Math.sin(t * .7) * 3})`);
    endRing.setAttribute('transform', `rotate(${timeline.action('resolve') === 'hero-hold' ? 0 : t * 7} 540 1130)`);
    pose(endHuman, t, 275, 1170, 1.08, false);
    pose(endRobot, t, 805, 1170, 1.08, false);
  };
};
