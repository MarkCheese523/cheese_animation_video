/* A crafted component-level motion study. One scene, five beats, pure render(t). */
SCENE_BUILDERS.motionSequence = (scene, api) => {
  const M = MotionPresets;
  const p = scene.props || {};
  const profile = p.profile || {};
  const tokens = profile.tokens || {};
  const accent = tokens.accent || '#c6ff3d';
  const paper = tokens.background || '#f4f0e6';
  const ink = tokens.ink || '#102a22';
  const inkIsLight = [1, 3, 5].reduce((sum, index, channel) => sum + parseInt(ink.slice(index, index + 2), 16) / 255 * [.2126, .7152, .0722][channel], 0) > .62;
  const surface = inkIsLight ? '#1d3228' : '#fffdf7';
  const raised = inkIsLight ? '#294238' : '#ffffff';
  const onAccent = inkIsLight ? '#102a22' : ink;
  const productName = profile.name || p.productName || 'MOTION SYSTEM';
  const intensity = p.motion?.intensity || 'balanced';
  const timeline = M.makeTimeline(p.beats);
  const amplitude = { subtle: .65, balanced: 1, showreel: 1.35 }[intensity] || 1;
  const damping = { subtle: .72, balanced: .46, showreel: .34 }[intensity] || .46;
  const elements = Array.isArray(p.elements) ? p.elements : [];
  const elementFor = concept => elements.find(element => element.concept === concept);
  const primaryBrand = elements.find(element => element.kind === 'brand' || element.slotId === 'B1')?.selected || null;
  const primaryBrandSource = primaryBrand?.asset || primaryBrand?.svg || primaryBrand?.image || '';
  const root = api.el('g', { 'data-motion-intensity': intensity, 'data-storyboard-id': p.storyboardId || '' });
  const el = api.el;
  const text = api.text;

  function selectedIcon(parent, concept, type, cx, cy, size = 100, color = ink) {
    const selected = elementFor(concept)?.selected;
    const source = selected?.asset || selected?.svg || selected?.image;
    if (!source) return icon(parent, type, cx, cy, size, color);
    const group = el('g', { transform: `translate(${cx} ${cy}) scale(${size / 100})`, 'data-selected-element': concept }, parent);
    const image = el('image', { href: source, x: -43, y: -43, width: 86, height: 86, preserveAspectRatio: 'xMidYMid meet' }, group);
    image.addEventListener('error', () => { image.remove(); icon(group, type, 0, 0, 92, color); }, { once: true });
    return group;
  }

  function pill(parent, x, y, width, label, options = {}) {
    const group = el('g', {}, parent);
    el('rect', { x, y, width, height: options.height || 48, rx: options.rx || 24, fill: options.fill || accent, stroke: options.stroke || 'none', 'stroke-width': 2 }, group);
    if (options.dot) el('circle', { cx: x + 22, cy: y + (options.height || 48) / 2, r: 5, fill: options.color || onAccent }, group);
    text(label, { x: x + width / 2 + (options.dot ? 7 : 0), y: y + (options.height || 48) / 2 + 8, 'text-anchor': 'middle', class: 'mg-text', 'font-size': options.fontSize || 21, 'font-weight': 750, fill: options.color || onAccent }, group);
    return group;
  }

  function icon(parent, type, cx, cy, size = 100, color = ink) {
    const group = el('g', { transform: `translate(${cx} ${cy}) scale(${size / 100})` }, parent);
    const common = { fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (type === 'file') {
      el('rect', { x: -36, y: -40, width: 62, height: 76, rx: 9, fill: 'none', stroke: color, 'stroke-width': 5, opacity: .25, transform: 'translate(-8 7)' }, group);
      el('path', { d: 'M-30-46H12L34-24V42H-30Z M12-46V-24H34', ...common }, group);
      el('path', { d: 'M-17-9H18M-17 7H10', ...common, 'stroke-width': 5, opacity: .5 }, group);
      el('circle', { cx: 23, cy: 27, r: 20, fill: accent, stroke: color, 'stroke-width': 5 }, group);
      el('path', { d: 'M13 27L21 35L34 18', fill: 'none', stroke: onAccent, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
    } else if (type === 'transfer') {
      el('rect', { x: -45, y: -38, width: 34, height: 34, rx: 10, fill: 'none', stroke: color, 'stroke-width': 6 }, group);
      el('rect', { x: 11, y: 4, width: 34, height: 34, rx: 10, fill: accent, stroke: color, 'stroke-width': 6 }, group);
      el('path', { d: 'M-4-21H25L15-31M25-21L15-11M4 21H-25L-15 11M-25 21L-15 31', ...common }, group);
      el('circle', { cx: -42, cy: 37, r: 4, fill: color }, group);
      el('circle', { cx: 42, cy: -37, r: 4, fill: color }, group);
    } else if (type === 'shield') {
      el('path', { d: 'M0-47L38-32V-2C38 25 22 42 0 50C-22 42-38 25-38-2V-32Z', ...common }, group);
      el('path', { d: 'M-19 0L-5 15L22-17', fill: 'none', stroke: accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
      el('path', { d: 'M-48-45L-54-53M48-45L54-53M0-57V-65', ...common, 'stroke-width': 5, opacity: .45 }, group);
    } else if (type === 'cursor') {
      el('path', { d: 'M-32-42L22 5L2 10L-10 34Z', ...common }, group);
      el('path', { d: 'M5 13L23 36M25-33V-21M39-22L30-13M-4-46L-8-57', ...common, 'stroke-width': 5 }, group);
    }
    return group;
  }

  function logoMark(parent, cx, cy, scale = 1) {
    const group = el('g', { transform: `translate(${cx} ${cy}) scale(${scale})` }, parent);
    if (primaryBrandSource) {
      group.setAttribute('data-selected-brand', productName);
      const image = el('image', { href: primaryBrandSource, x: -112, y: -112, width: 224, height: 224, preserveAspectRatio: 'xMidYMid meet' }, group);
      image.addEventListener('error', () => {
        image.remove();
        text(productName.slice(0, 24), { x: 0, y: 18, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 52, 'font-weight': 850, fill: ink }, group);
      }, { once: true });
      return group;
    }
    if (primaryBrand || profile.source === 'web-product') {
      group.setAttribute('data-selected-brand', productName);
      text(productName.slice(0, 24), { x: 0, y: 4, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 58, 'font-weight': 850, fill: ink }, group);
      text('TYPOGRAPHIC BRAND', { x: 0, y: 48, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 15, 'font-weight': 750, 'letter-spacing': 4, fill: ink, opacity: .48 }, group);
      return group;
    }
    el('rect', { x: -108, y: -108, width: 216, height: 216, rx: 62, fill: accent, transform: 'rotate(9)' }, group);
    el('rect', { x: -108, y: -108, width: 216, height: 216, rx: 62, fill: ink, stroke: ink, 'stroke-width': 4 }, group);
    el('path', { d: 'M-55-42H55M-55 0H24M-55 42H55', fill: 'none', stroke: accent, 'stroke-width': 18, 'stroke-linecap': 'round' }, group);
    el('circle', { cx: 52, cy: 0, r: 9, fill: surface }, group);
    return group;
  }

  el('rect', { x: 0, y: 0, width: api.W, height: api.H, fill: paper }, root);
  const soft = el('circle', { cx: 910, cy: 310, r: 400, fill: accent, opacity: .09 }, root);
  const contour = el('path', { d: 'M-80 1530C230 1340 430 1690 720 1500S1110 1410 1190 1530', fill: 'none', stroke: ink, 'stroke-width': 2, opacity: .06 }, root);
  const dotField = el('g', { opacity: .12 }, root);
  for (let row = 0; row < 6; row += 1) for (let column = 0; column < 7; column += 1) {
    el('circle', { cx: 74 + column * 24, cy: 1570 + row * 24, r: 2.2, fill: ink }, dotField);
  }
  el('rect', { x: 72, y: 78, width: 12, height: 12, rx: 3, fill: accent }, root);
  text('MOTION LAYER  /  COMPONENT SYSTEM', { x: 102, y: 91, class: 'mg-num', 'font-size': 24, 'font-weight': 750, 'letter-spacing': 2.5, fill: ink, opacity: .68 }, root);
  const totalDuration = timeline.beats.at(-1).start + timeline.beats.at(-1).duration;
  text(`STUDY 01  ·  ${totalDuration} SEC`, { x: 1008, y: 91, 'text-anchor': 'end', class: 'mg-num', 'font-size': 20, 'font-weight': 700, 'letter-spacing': 2, fill: ink, opacity: .42 }, root);
  el('line', { x1: 72, y1: 125, x2: 1008, y2: 125, stroke: ink, 'stroke-width': 2, opacity: .1 }, root);
  const beatLabel = text('聚合', { x: 72, y: 215, class: 'mg-text', 'font-size': 62, 'font-weight': 850, fill: ink }, root);
  const beatNote = text('小组件先聚合，再展开成完整界面', { x: 74, y: 270, class: 'mg-text', 'font-size': 28, fill: ink, opacity: .56 }, root);
  const phaseWords = [
    ['聚合', '小组件先聚合，再展开成完整界面'],
    ['点击', '指针、按压、波纹与面板响应同一拍点'],
    ['拆分', '凭证、流转与核验成为独立的运动组件'],
    ['切换', '状态、布局、标签与反馈一起变化'],
    ['归位', '所有细节收束成清晰的品牌记忆点']
  ];

  const logo = el('g', {}, root);
  logoMark(logo, 540, 835, 1.25);
  const logoName = text(productName.slice(0, 20).toUpperCase(), { x: 540, y: 1100, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 48, 'font-weight': 850, 'letter-spacing': 4, fill: ink }, logo);
  text('COMPONENTS BEFORE DECORATION', { x: 540, y: 1160, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 20, 'font-weight': 700, 'letter-spacing': 3, fill: ink, opacity: .42 }, logo);
  const introChips = [
    { x: 250, y: 660, type: 'file', concept: '凭证' }, { x: 830, y: 730, type: 'transfer', concept: '转让' }, { x: 285, y: 1050, type: 'shield', concept: '权限' }
  ].map(data => {
    const group = el('g', {}, root);
    el('rect', { x: -65, y: -65, width: 130, height: 130, rx: 34, fill: raised, stroke: ink, 'stroke-width': 3, filter: 'url(#shadow)' }, group);
    selectedIcon(group, data.concept, data.type, 0, 0, 65);
    return { group, ...data };
  });

  const windowGroup = el('g', {}, root);
  const windowRect = el('rect', { x: 440, y: 750, width: 200, height: 200, rx: 44, fill: surface, stroke: ink, 'stroke-width': 4, filter: 'url(#shadow)' }, windowGroup);
  const chrome = el('g', {}, windowGroup);
  el('line', { x1: 70, y1: 475, x2: 1010, y2: 475, stroke: ink, 'stroke-width': 3, opacity: .12 }, chrome);
  [0, 1, 2].forEach(index => el('circle', { cx: 116 + index * 30, cy: 414, r: 7, fill: index === 0 ? accent : ink, opacity: index === 0 ? 1 : .16 }, chrome));
  el('rect', { x: 350, y: 388, width: 380, height: 52, rx: 26, fill: ink, opacity: .045 }, chrome);
  el('circle', { cx: 382, cy: 414, r: 6, fill: accent }, chrome);
  text('product.local / credentials', { x: 405, y: 422, class: 'mg-num', 'font-size': 18, fill: ink, opacity: .46 }, chrome);
  pill(chrome, 865, 389, 105, 'LIVE', { height: 50, dot: true, fontSize: 18 });

  el('rect', { x: 94, y: 505, width: 176, height: 900, rx: 28, fill: ink, opacity: .04 }, chrome);
  text('WORKSPACE', { x: 122, y: 558, class: 'mg-num', 'font-size': 16, 'font-weight': 750, 'letter-spacing': 2, fill: ink, opacity: .38 }, chrome);
  ['凭证总览', '流转记录', '权限核验', '系统设置'].forEach((label, index) => {
    const y = 590 + index * 92;
    el('rect', { x: 108, y, width: 148, height: 68, rx: 18, fill: index === 0 ? accent : 'transparent' }, chrome);
    el('rect', { x: 128, y: y + 23, width: 22, height: 22, rx: 6, fill: 'none', stroke: index === 0 ? onAccent : ink, 'stroke-width': 3, opacity: index === 0 ? 1 : .35 }, chrome);
    if (index === 0) el('circle', { cx: 139, cy: y + 34, r: 4, fill: onAccent }, chrome);
    text(label, { x: 164, y: y + 42, class: 'mg-text', 'font-size': 17, 'font-weight': index === 0 ? 800 : 600, fill: index === 0 ? onAccent : ink, opacity: index === 0 ? 1 : .48 }, chrome);
  });
  el('line', { x1: 122, y1: 1010, x2: 238, y2: 1010, stroke: ink, 'stroke-width': 2, opacity: .12 }, chrome);
  text('SYNC STATUS', { x: 122, y: 1060, class: 'mg-num', 'font-size': 15, 'letter-spacing': 1.5, fill: ink, opacity: .38 }, chrome);
  el('circle', { cx: 132, cy: 1110, r: 7, fill: accent }, chrome);
  text('所有组件已连接', { x: 151, y: 1117, class: 'mg-text', 'font-size': 16, fill: ink, opacity: .58 }, chrome);
  el('rect', { x: 122, y: 1170, width: 114, height: 7, rx: 4, fill: ink, opacity: .08 }, chrome);
  el('rect', { x: 122, y: 1170, width: 82, height: 7, rx: 4, fill: accent }, chrome);

  text('凭证流转', { x: 310, y: 558, class: 'mg-text', 'font-size': 34, 'font-weight': 850, fill: ink }, chrome);
  text('一个动作，驱动整条组件链', { x: 312, y: 594, class: 'mg-text', 'font-size': 19, fill: ink, opacity: .45 }, chrome);
  const mainCard = el('g', {}, chrome);
  el('rect', { x: 305, y: 635, width: 665, height: 360, rx: 34, fill: paper, stroke: ink, 'stroke-width': 3, 'stroke-opacity': .12 }, mainCard);
  el('rect', { x: 305, y: 635, width: 9, height: 360, rx: 5, fill: accent }, mainCard);
  text('CURRENT CREDENTIAL', { x: 350, y: 697, class: 'mg-num', 'font-size': 17, 'font-weight': 750, 'letter-spacing': 2, fill: ink, opacity: .42 }, mainCard);
  text('01', { x: 346, y: 875, class: 'mg-num', 'font-size': 150, 'font-weight': 850, fill: ink }, mainCard);
  pill(mainCard, 350, 904, 138, '有效', { dot: true, height: 48, fontSize: 20 });
  el('rect', { x: 690, y: 700, width: 220, height: 190, rx: 32, fill: raised, stroke: ink, 'stroke-width': 3, 'stroke-opacity': .1 }, mainCard);
  selectedIcon(mainCard, '凭证', 'file', 800, 790, 112);
  const spark = el('path', { d: 'M530 928L570 908L610 918L650 866', fill: 'none', stroke: accent, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mainCard);
  [530, 570, 610, 650].forEach((x, index) => el('circle', { cx: x, cy: [928, 908, 918, 866][index], r: 5, fill: ink }, mainCard));

  text('下一步', { x: 315, y: 1055, class: 'mg-text', 'font-size': 19, 'font-weight': 750, fill: ink, opacity: .48 }, chrome);
  el('rect', { x: 310, y: 1090, width: 280, height: 112, rx: 30, fill: 'none', stroke: ink, 'stroke-width': 3, 'stroke-opacity': .18 }, chrome);
  selectedIcon(chrome, '权限', 'shield', 355, 1146, 48);
  text('先核验权限', { x: 400, y: 1156, class: 'mg-text', 'font-size': 25, 'font-weight': 750, fill: ink, opacity: .65 }, chrome);
  const button = el('g', {}, chrome);
  el('rect', { x: 650, y: 1100, width: 280, height: 112, rx: 30, fill: ink }, button);
  text('确认转让', { x: 782, y: 1164, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 30, 'font-weight': 850, fill: surface }, button);
  el('path', { d: 'M866 1145L878 1156L866 1167', fill: 'none', stroke: accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, button);
  const BUTTON_TARGET = { x: 790, y: 1156 };

  [0, 1].forEach(index => {
    const y = 1270 + index * 82;
    el('circle', { cx: 328, cy: y, r: 16, fill: index === 0 ? accent : raised, stroke: ink, 'stroke-width': 3, 'stroke-opacity': .2 }, chrome);
    if (index === 0) el('path', { d: 'M320 1270L326 1276L337 1263', fill: 'none', stroke: onAccent, 'stroke-width': 4, 'stroke-linecap': 'round' }, chrome);
    text(index === 0 ? '凭证已生成' : '等待转让确认', { x: 360, y: y + 7, class: 'mg-text', 'font-size': 21, 'font-weight': 700, fill: ink, opacity: index === 0 ? .75 : .45 }, chrome);
    text(index === 0 ? '09:41' : 'NOW', { x: 936, y: y + 7, 'text-anchor': 'end', class: 'mg-num', 'font-size': 17, fill: ink, opacity: .35 }, chrome);
  });

  const clickRing = el('circle', { cx: BUTTON_TARGET.x, cy: BUTTON_TARGET.y, r: 18, fill: 'none', stroke: accent, 'stroke-width': 8 }, root);
  const cursor = el('g', { 'data-pointer': 'true' }, root);
  el('path', { d: 'M0 0L-18 30L-6 28V52Q-6 58 0 58Q6 58 6 52V28L18 30Z', fill: raised, stroke: ink, 'stroke-width': 4, 'stroke-linejoin': 'round', filter: 'url(#shadow)' }, cursor);

  const componentStage = el('g', {}, root);
  const cards = [];
  const cardData = [
    { x: 60, concept: '凭证', title: '凭证组件', subtitle: elementFor('凭证')?.action || '绘制 · 展开 · 核验', type: 'file', code: '01 / OBJECT' },
    { x: 385, concept: '转让', title: '流转组件', subtitle: elementFor('转让')?.action || '连接 · 交接 · 回弹', type: 'transfer', code: '02 / ACTION' },
    { x: 710, concept: '权限', title: '状态组件', subtitle: elementFor('权限')?.action || '选中 · 打勾 · 收束', type: 'shield', code: '03 / STATE' }
  ];
  cardData.forEach((data, index) => {
    const group = el('g', {}, componentStage);
    el('rect', { x: data.x, y: 510, width: 310, height: 590, rx: 38, fill: raised, stroke: ink, 'stroke-width': 4, filter: 'url(#shadow)' }, group);
    text(data.code, { x: data.x + 30, y: 562, class: 'mg-num', 'font-size': 16, 'font-weight': 750, 'letter-spacing': 1.4, fill: ink, opacity: .42 }, group);
    [0, 1, 2].forEach(dot => el('circle', { cx: data.x + 246 + dot * 14, cy: 555, r: 3, fill: ink, opacity: .25 }, group));
    text(data.title, { x: data.x + 30, y: 632, class: 'mg-text', 'font-size': 32, 'font-weight': 850, fill: ink }, group);
    text(data.subtitle, { x: data.x + 30, y: 672, class: 'mg-text', 'font-size': 19, fill: ink, opacity: .45 }, group);
    el('rect', { x: data.x + 45, y: 720, width: 220, height: 210, rx: 42, fill: index === 1 ? accent : paper, stroke: ink, 'stroke-width': 3, 'stroke-opacity': .1 }, group);
    selectedIcon(group, data.concept, data.type, data.x + 155, 825, 124, index === 1 ? onAccent : ink);
    pill(group, data.x + 30, 970, 128, index === 0 ? '已绘制' : index === 1 ? '可交接' : '已核验', { height: 44, fontSize: 18, dot: true });
    [0, 1, 2].forEach(bar => el('rect', { x: data.x + 184 + bar * 28, y: 990 - bar * 7, width: 17, height: 8 + bar * 7, rx: 4, fill: ink, opacity: .15 + bar * .15 }, group));
    el('line', { x1: data.x + 30, y1: 1042, x2: data.x + 280, y2: 1042, stroke: ink, 'stroke-width': 2, opacity: .1 }, group);
    text('READY FOR MOTION', { x: data.x + 30, y: 1073, class: 'mg-num', 'font-size': 14, 'font-weight': 700, 'letter-spacing': 1.5, fill: ink, opacity: .35 }, group);
    cards.push({ group, data });
  });
  const connector = el('path', { d: 'M215 1150Q540 1390 865 1150', fill: 'none', stroke: accent, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': '18 18' }, componentStage);
  const flowDots = [0, 1, 2].map(() => el('g', {}, componentStage));
  flowDots.forEach(group => {
    el('circle', { r: 16, fill: raised, stroke: ink, 'stroke-width': 4 }, group);
    el('circle', { r: 6, fill: accent }, group);
  });
  text('3 COMPONENTS  /  1 TIMELINE', { x: 540, y: 1340, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 17, 'font-weight': 700, 'letter-spacing': 2.5, fill: ink, opacity: .38 }, componentStage);
  const metric = text('0', { x: 540, y: 1460, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 108, 'font-weight': 850, fill: ink }, componentStage);
  text('组件同步完成', { x: 540, y: 1515, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 25, fill: ink, opacity: .5 }, componentStage);

  const stateStage = el('g', {}, root);
  const toggle = el('g', {}, stateStage);
  el('rect', { x: 340, y: 360, width: 400, height: 140, rx: 70, fill: raised, stroke: ink, 'stroke-width': 4, filter: 'url(#shadow)' }, toggle);
  el('circle', { cx: 420, cy: 430, r: 7, fill: ink, opacity: .2 }, toggle);
  el('path', { d: 'M645 430L658 443L681 416', fill: 'none', stroke: ink, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .3 }, toggle);
  text('OFF', { x: 288, y: 439, 'text-anchor': 'end', class: 'mg-num', 'font-size': 20, 'font-weight': 750, 'letter-spacing': 2, fill: ink, opacity: .38 }, stateStage);
  text('ON', { x: 792, y: 439, class: 'mg-num', 'font-size': 20, 'font-weight': 750, 'letter-spacing': 2, fill: ink, opacity: .38 }, stateStage);
  const knob = el('g', {}, toggle);
  el('circle', { r: 51, fill: accent, stroke: ink, 'stroke-width': 4 }, knob);
  el('path', { d: 'M-18 0L-5 14L22-17', fill: 'none', stroke: onAccent, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, knob);

  const stateCards = [
    { x: 100, title: '凭证 A', subtitle: '保持当前布局', selected: false },
    { x: 580, title: '凭证 B', subtitle: '切换并移动到前排', selected: true }
  ].map((data, index) => {
    const group = el('g', {}, stateStage);
    el('rect', { x: data.x, y: 680, width: 400, height: 580, rx: 42, fill: raised, stroke: ink, 'stroke-width': 4, filter: 'url(#shadow)' }, group);
    const selectedWash = el('rect', { x: data.x, y: 680, width: 400, height: 580, rx: 42, fill: accent, opacity: data.selected ? 0 : 0 }, group);
    const meta = text(`0${index + 1} / CREDENTIAL`, { x: data.x + 34, y: 738, class: 'mg-num', 'font-size': 16, 'font-weight': 700, 'letter-spacing': 1.5, fill: ink, opacity: .45 }, group);
    const title = text(data.title, { x: data.x + 34, y: 810, class: 'mg-text', 'font-size': 38, 'font-weight': 850, fill: ink }, group);
    const subtitle = text(data.subtitle, { x: data.x + 34, y: 852, class: 'mg-text', 'font-size': 20, fill: ink, opacity: .5 }, group);
    el('rect', { x: data.x + 34, y: 900, width: 332, height: 150, rx: 30, fill: paper, stroke: ink, 'stroke-width': 3, 'stroke-opacity': .12 }, group);
    selectedIcon(group, '凭证', 'file', data.x + 105, 974, 80);
    el('circle', { cx: data.x + 292, cy: 975, r: 39, fill: raised, stroke: ink, 'stroke-width': 5 }, group);
    const check = el('path', { d: `M${data.x + 274} 976L${data.x + 287} 989L${data.x + 312} 958`, fill: 'none', stroke: accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
    const controls = [];
    [0, 1].forEach(row => {
      const y = 1100 + row * 55;
      const box = el('rect', { x: data.x + 36, y, width: 22, height: 22, rx: 7, fill: row === 0 && data.selected ? accent : 'none', stroke: ink, 'stroke-width': 3, opacity: row === 0 && data.selected ? 1 : .3 }, group);
      const bar = el('rect', { x: data.x + 76, y: y + 5, width: row === 0 ? 190 : 145, height: 12, rx: 6, fill: ink, opacity: .13 }, group);
      controls.push({ box, bar });
    });
    const status = pill(group, data.x + 34, 1192, 142, data.selected ? '等待切换' : '未选择', { height: 44, fontSize: 18, fill: paper, color: ink, stroke: ink });
    return { group, selectedWash, meta, title, subtitle, controls, check, status, data };
  });
  const toast = el('g', {}, stateStage);
  el('rect', { x: 235, y: 1370, width: 610, height: 104, rx: 34, fill: ink, filter: 'url(#shadow)' }, toast);
  el('circle', { cx: 294, cy: 1422, r: 25, fill: accent }, toast);
  el('path', { d: 'M282 1422L291 1431L307 1412', fill: 'none', stroke: onAccent, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, toast);
  text('布局与状态已同步', { x: 340, y: 1432, class: 'mg-text', 'font-size': 28, 'font-weight': 800, fill: surface }, toast);
  pill(toast, 710, 1398, 100, 'DONE', { height: 48, fontSize: 17 });

  const endGroup = el('g', {}, root);
  const orbit = el('circle', { cx: 540, cy: 830, r: 235, fill: 'none', stroke: ink, 'stroke-width': 2, 'stroke-dasharray': '3 15', opacity: .16 }, endGroup);
  logoMark(endGroup, 540, 830, 1.25);
  const endName = text(productName.slice(0, 20).toUpperCase(), { x: 540, y: 1160, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 48, 'font-weight': 850, 'letter-spacing': 4, fill: ink }, endGroup);
  text('每一个组件，都有自己的动作', { x: 540, y: 1230, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 29, fill: ink, opacity: .58 }, endGroup);
  const endChips = el('g', {}, endGroup);
  pill(endChips, 195, 1320, 190, '绘制', { fill: raised, color: ink, stroke: ink, height: 54, fontSize: 20 });
  pill(endChips, 445, 1320, 190, '流转', { height: 54, fontSize: 20 });
  pill(endChips, 695, 1320, 190, '收束', { fill: raised, color: ink, stroke: ink, height: 54, fontSize: 20 });

  return actualT => {
    const phase = timeline.indexAt(actualT);
    const beat = timeline.beats[phase];
    const t = timeline.warp(actualT);
    root.setAttribute('data-active-beat', beat.id);
    beatLabel.textContent = beat.label;
    beatNote.textContent = phaseWords[phase][1];
    const phaseStart = [0, 3, 7, 11.8, 16.75][phase];
    api.opacity(beatLabel, .45 + .55 * M.out(M.prog(t, phaseStart, .35)));
    soft.setAttribute('transform', `translate(${Math.sin(t * .35) * 30} ${Math.cos(t * .28) * 24})`);
    contour.setAttribute('transform', `translate(${Math.sin(t * .22) * 24} 0)`);

    const gather = M.reflow(t, .1, 1.05);
    introChips.forEach((chip, index) => {
      const x = M.mix(chip.x, 540 + (index - 1) * 45, gather);
      const y = M.mix(chip.y, 835 + (index - 1) * 28, gather);
      chip.group.setAttribute('transform', `translate(${x} ${y}) scale(${M.mix(1, .45, gather)})`);
      api.opacity(chip.group, M.prog(t, index * .08, .3) * (1 - M.prog(t, 1.25, .35)) * (timeline.action('gather') === 'logo-reveal' ? .25 : 1));
    });
    const intro = M.morph(t, 1.35, 1.05);
    const logoOut = M.inout(M.prog(t, 1.6, .65));
    api.opacity(logo, 1 - logoOut);
    const logoStart = timeline.action('gather') === 'logo-reveal' ? 1.18 : 1;
    logo.setAttribute('transform', `translate(540 835) scale(${M.mix(logoStart, .48, intro)}) translate(-540 -835)`);
    logoName.setAttribute('letter-spacing', M.mix(4, 12, intro));

    api.opacity(windowGroup, M.inout(M.prog(t, 1.35, .55)) * (1 - M.prog(t, 6.72, .42)));
    windowRect.setAttribute('x', M.mix(440, 70, intro));
    windowRect.setAttribute('y', M.mix(750, 350, intro));
    windowRect.setAttribute('width', M.mix(200, 940, intro));
    windowRect.setAttribute('height', M.mix(200, 1100, intro));
    windowRect.setAttribute('rx', M.mix(44, 42, intro));
    api.opacity(chrome, M.out(M.prog(t, 2.0, .7)));
    spark.setAttribute('stroke-dasharray', 180);
    spark.setAttribute('stroke-dashoffset', 180 * (1 - M.drawOn(t, 3.2, .8)));
    const cursorMove = M.reflow(t, 3.0, 1.15);
    cursor.setAttribute('transform', `translate(${M.mix(210, BUTTON_TARGET.x, cursorMove)} ${M.mix(1430, BUTTON_TARGET.y, cursorMove)}) scale(${M.press(t, 4.55, 4.78, .86)})`);
    api.opacity(cursor, timeline.action('trigger') === 'direct-press' ? 0 : M.prog(t, 2.8, .3) * (1 - M.prog(t, 5.65, .35)));
    const click = M.prog(t, 4.52, .08) * (1 - M.prog(t, 4.65, .45));
    api.opacity(clickRing, click);
    clickRing.setAttribute('r', M.mix(18, 100, M.out(M.prog(t, 4.52, .5))));
    button.setAttribute('transform', `translate(${BUTTON_TARGET.x} ${BUTTON_TARGET.y}) scale(${M.press(t, 4.55, 4.78)}) translate(${-BUTTON_TARGET.x} ${-BUTTON_TARGET.y})`);
    mainCard.setAttribute('transform', `translate(0 ${M.mix(0, -28, M.morph(t, 4.85, .75))})`);

    api.opacity(componentStage, M.prog(t, 6.78, .45) * (1 - M.prog(t, 11.48, .28)));
    const cardReflow = timeline.action('split') === 'card-reflow' ? M.spring(M.prog(t, 8.25, 1), damping, 10) : 0;
    cards.forEach((card, index) => {
      const enter = M.springEnter(t, 6.95 + index * .14, .85, damping);
      card.group.setAttribute('transform', `translate(${(index - 1) * 45 * cardReflow} ${M.mix(100 * amplitude, 0, enter)}) scale(${M.mix(1 - .14 * amplitude, 1, enter)})`);
      api.opacity(card.group, M.clamp(enter));
    });
    const draw = M.drawOn(t, 7.8, 1.2);
    connector.setAttribute('stroke-dashoffset', 900 * (1 - draw));
    api.opacity(connector, timeline.action('split') === 'component-flow' ? 1 : 0);
    flowDots.forEach((group, index) => {
      const progress = M.prog(t, 8.15 + index * .22, 1.7);
      const x = M.mix(215, 865, progress);
      const y = 1150 + 480 * amplitude * progress * (1 - progress);
      group.setAttribute('transform', `translate(${x} ${y})`);
      api.opacity(group, M.prog(t, 8.0 + index * .2, .25) * (1 - M.prog(t, 10.7, .3)) * (timeline.action('split') === 'component-flow' ? 1 : 0));
    });
    metric.textContent = `${Math.round(M.counterRoll(t, 8.55, 1.8, 0, 100))}%`;

    api.opacity(stateStage, M.prog(t, 11.55, .3) * (1 - M.prog(t, 16.48, .25)));
    const flip = M.stateFlip(t, 12.85, .85);
    const knobProgress = M.spring(flip, damping, 12);
    knob.setAttribute('transform', `translate(${M.mix(420, 660, knobProgress)} 430)`);
    stateCards.forEach((card, index) => {
      const enter = M.springEnter(t, 11.48 + index * .1, .65, damping);
      const direction = index === 0 ? 1 : -1;
      const reorder = timeline.action('switch') === 'status-only' ? 0 : M.spring(M.prog(t, 14.05, 1.0), damping, 10);
      card.group.setAttribute('transform', `translate(${direction * 480 * reorder} ${M.mix(90 * amplitude, 0, enter)})`);
      api.opacity(card.group, M.clamp(enter));
      if (card.data.selected) {
        api.opacity(card.selectedWash, flip * .96);
        const foreground = flip > .48 ? onAccent : ink;
        [card.meta, card.title, card.subtitle].forEach(node => node.setAttribute('fill', foreground));
        card.controls.forEach(({ box, bar }, row) => {
          box.setAttribute('stroke', foreground);
          bar.setAttribute('fill', foreground);
          if (row === 0) box.setAttribute('fill', flip > .48 ? foreground : accent);
        });
        card.status.querySelector('text').textContent = flip > .55 ? '已选择' : '等待切换';
        card.check.setAttribute('stroke-dasharray', 90);
        card.check.setAttribute('stroke-dashoffset', 90 * (1 - M.drawOn(t, 13.05, .55)));
      } else {
        card.check.setAttribute('opacity', .18);
      }
    });
    api.opacity(toast, M.out(M.prog(t, 14.55, .45)));
    toast.setAttribute('transform', `translate(0 ${M.mix(45, 0, M.springEnter(t, 14.55, .65))})`);

    const end = M.logoResolve(t, 16.55, 1.0);
    api.opacity(endGroup, M.clamp(end));
    endGroup.setAttribute('transform', `translate(540 850) scale(${M.mix(.62, 1, end)}) translate(-540 -850)`);
    orbit.setAttribute('transform', `rotate(${timeline.action('resolve') === 'hero-hold' ? 0 : t * 8} 540 830)`);
    endName.setAttribute('letter-spacing', M.mix(12, 4, M.out(M.prog(t, 16.7, .8))));
    api.opacity(endChips, timeline.action('resolve') === 'hero-hold' ? 0 : M.out(M.prog(t, 17.1, .65)));
  };
};
