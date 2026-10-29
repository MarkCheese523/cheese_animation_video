function makeAtmosphere(api, parent, x = 820, y = 480) {
  const group = api.el('g', {}, parent);
  const glow = api.el('circle', { cx: x, cy: y, r: 300, fill: '#c6ff3d', opacity: .07, filter: 'url(#softGlow)' }, group);
  const echo = api.el('circle', { cx: 1080 - x, cy: y + 720, r: 230, fill: '#eff5e7', opacity: .025, filter: 'url(#softGlow)' }, group);
  return { group, glow, echo };
}

function makeTransitionRing(api, parent) {
  return api.el('circle', { cx: 540, cy: 900, r: 40, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 8, opacity: 0, filter: 'url(#smallGlow)' }, parent);
}

function updateTransitionRing(api, ring, t) {
  const progress = api.out(api.prog(t, 0, .72));
  ring.setAttribute('r', api.mix(40, 1050, progress));
  api.opacity(ring, (1 - progress) * .65);
}

function setCamera(api, node, t, amount = .025) {
  const scale = 1 + api.inout(api.prog(t, 0, 5.8)) * amount;
  node.setAttribute('transform', `translate(540 900) scale(${scale}) translate(-540 -900)`);
}

const SCENE_BUILDERS = {
  counter: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const ghost = api.text(String(p.to), { x: api.W / 2, y: 700, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 330, 'font-weight': 900, fill: 'none', stroke: '#102a22', 'stroke-width': 4, opacity: .08 });
    const value = api.text('0', { x: api.W / 2, y: 880, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 190, 'font-weight': 900, fill: '#102a22' });
    const track = api.el('line', { x1: 140, y1: 1080, x2: 940, y2: 1080, stroke: '#102a22', 'stroke-opacity': .14, 'stroke-width': 30, 'stroke-linecap': 'round' });
    const threshold = api.el('line', { x1: 540, y1: 1015, x2: 540, y2: 1145, stroke: '#ff6b57', 'stroke-width': 5 });
    const thresholdLabel = api.text('50%', { x: 540, y: 1190, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 30, fill: '#ff6b57' });
    const progress = api.el('line', { x1: 140, y1: 1080, x2: 140, y2: 1080, stroke: '#c6ff3d', 'stroke-width': 24, 'stroke-linecap': 'round' });
    const traveler = api.el('circle', { cx: 140, cy: 1080, r: 18, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 });
    const caption = api.text(p.caption || '', { x: api.W / 2, y: 1450, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 48, fill: '#102a22' });
    return t => {
      const start = (scene.timing.value || 0) / 1000;
      const progressValue = api.inout(api.prog(t, start, start + Math.min(2.8, scene.duration * .55)));
      const current = api.mix(Number(p.from || 0), Number(p.to || 0), progressValue);
      const decimals = Number.isInteger(Number(p.to)) ? 0 : 1;
      value.textContent = current.toFixed(decimals) + (p.suffix || '');
      const x = 140 + Math.max(0, Math.min(100, current)) / 100 * 800;
      progress.setAttribute('x2', x);
      traveler.setAttribute('cx', x);
      traveler.setAttribute('r', 16 + Math.sin(progressValue * Math.PI) * 12);
      api.opacity(value, api.prog(t, start, start + .3));
      api.opacity(progress, api.prog(t, start, start + .3));
      api.opacity(traveler, api.prog(t, start, start + .3));
      api.opacity(caption, api.prog(t, (scene.timing.caption || 0) / 1000, (scene.timing.caption || 0) / 1000 + .6));
      api.opacity(header, api.prog(t, 0, .4));
      ghost.setAttribute('transform', `rotate(${t * 2} ${api.W / 2} 600)`);
    };
  },

  flow: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const times = scene.timing.nodes || p.nodes.map((_, index) => index * 800);
    const world = api.el('g', {});
    const atmosphere = makeAtmosphere(api, world, 860, 430);
    const groups = [];
    const connectors = [];
    p.nodes.forEach((label, index) => {
      const y = 390 + index * 310;
      if (index < p.nodes.length - 1) {
        const y1 = y + 96;
        const y2 = y + 288;
        const base = api.el('line', { x1: 540, y1, x2: 540, y2, stroke: '#92a69a', 'stroke-opacity': .22, 'stroke-width': 4, 'stroke-dasharray': '10 16' }, world);
        const active = api.el('line', { x1: 540, y1, x2: 540, y2: y1, stroke: '#c6ff3d', 'stroke-width': 7, 'stroke-linecap': 'round' }, world);
        const pulse = api.el('circle', { cx: 540, cy: y1, r: 11, fill: '#c6ff3d', opacity: 0, filter: 'url(#smallGlow)' }, world);
        const halo = api.el('circle', { cx: 540, cy: y2, r: 12, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 5, opacity: 0 }, world);
        connectors.push({ base, active, pulse, halo, y1, y2, index });
      }
      const group = api.el('g', {}, world);
      const spot = api.el('circle', { cx: 540, cy: 0, r: 210, fill: '#c6ff3d', opacity: .04, filter: 'url(#softGlow)' }, group);
      api.el('path', { d: 'M250-85H790L850-25V85H290L250 45Z', fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5, filter: 'url(#depthShadow)' }, group);
      const edge = api.el('path', { d: 'M290-85H760', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, group);
      const content = api.el('g', {}, group);
      api.el('circle', { cx: 334, cy: 0, r: 42, fill: '#c6ff3d' }, content);
      api.text(String(index + 1).padStart(2, '0'), { x: 334, y: 12, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 32, 'font-weight': 900, fill: '#071b15', 'data-on-accent': 'true' }, content);
      api.text(`SEQUENCE ${String(index + 1).padStart(2, '0')}`, { x: 584, y: -23, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 22, 'font-weight': 700, fill: '#52635c', 'letter-spacing': 4 }, content);
      api.text(label, { x: 584, y: 48, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 66, 'font-weight': 750, fill: '#102a22' }, content);
      groups.push({ group, content, edge, spot, y, index });
    });
    const caption = api.text(p.caption || '', { x: 540, y: 1580, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 44, fill: '#102a22' });
    const ring = makeTransitionRing(api, api.el('g', {}));
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      setCamera(api, world, t, .028);
      atmosphere.glow.setAttribute('cx', 860 + t * 9);
      atmosphere.echo.setAttribute('cx', 220 - t * 6);
      groups.forEach(({ group, content, edge, spot, y, index }) => {
        const start = times[index] / 1000;
        const enter = api.back(api.prog(t, start, start + .65));
        const direction = index % 2 ? 1 : -1;
        const scale = api.mix(.9, 1, enter);
        group.setAttribute('transform', `translate(${direction * api.mix(80, 0, enter)} ${y + api.mix(75, 0, enter)}) translate(540 0) scale(${scale}) rotate(${direction * api.mix(3, 0, enter)}) translate(-540 0)`);
        api.opacity(group, api.clamp(enter));
        api.opacity(content, api.prog(t, start + .16, start + .52));
        edge.setAttribute('stroke-dashoffset', 1 - api.out(api.prog(t, start + .12, start + .65)));
        api.opacity(spot, .025 + api.prog(t, start + .35, start + .8) * .07);
      });
      connectors.forEach(({ active, pulse, halo, y1, y2, index }) => {
        const start = times[index] / 1000;
        const draw = api.out(api.prog(t, start + .38, start + .82));
        active.setAttribute('y2', api.mix(y1, y2, draw));
        const travel = api.prog(t, start + .72, start + 1.24);
        pulse.setAttribute('cy', api.mix(y1, y2, api.inout(travel)));
        api.opacity(pulse, Math.sin(travel * Math.PI));
        const arrival = api.out(api.prog(t, start + 1.15, start + 1.55));
        halo.setAttribute('r', api.mix(12, 58, arrival));
        api.opacity(halo, (1 - arrival) * .75);
      });
      const captionStart = (scene.timing.caption || 0) / 1000;
      const captionEnter = api.out(api.prog(t, captionStart, captionStart + .6));
      api.opacity(caption, captionEnter);
      caption.setAttribute('transform', `translate(0 ${api.mix(30, 0, captionEnter)})`);
      updateTransitionRing(api, ring, t);
    };
  },

  compare: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const world = api.el('g', {});
    const atmosphere = makeAtmosphere(api, world, 790, 660);
    const cards = [p.left, p.right].map((item, index) => {
      const x = index === 0 ? 90 : 570;
      const spot = api.el('circle', { cx: x + 210, cy: 740, r: 265, fill: '#c6ff3d', opacity: .03, filter: 'url(#softGlow)' }, world);
      const group = api.el('g', {}, world);
      api.el('rect', { x, y: 420, width: 420, height: 700, rx: 34, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5, filter: 'url(#depthShadow)' }, group);
      const edge = api.el('path', { d: `M${x + 42} 420H${x + 378}`, fill: 'none', stroke: '#c6ff3d', 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, group);
      const content = api.el('g', {}, group);
      api.text(`WORK MODE / ${String(index + 1).padStart(2, '0')}`, { x: x + 210, y: 485, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 22, 'font-weight': 700, fill: '#52635c', 'letter-spacing': 3 }, content);
      api.text(item.title, { x: x + 210, y: 575, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 62, 'font-weight': 750, fill: '#102a22' }, content);
      const number = api.text('0', { x: x + 210, y: 805, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 150, 'font-weight': 850, fill: '#102a22' }, content);
      for (let tick = 0; tick < 5; tick += 1) {
        api.el('line', { x1: x + 60 + tick * 75, y1: 984, x2: x + 60 + tick * 75, y2: 1065, stroke: '#52635c', 'stroke-opacity': .13, 'stroke-width': 3 }, content);
      }
      api.el('rect', { x: x + 60, y: 1010, width: 300, height: 34, rx: 17, fill: '#102a22', opacity: .12 }, content);
      const bar = api.el('rect', { x: x + 60, y: 1010, width: 0, height: 34, rx: 17, fill: index === 0 ? '#52635c' : '#c6ff3d' }, content);
      const traveler = api.el('circle', { cx: x + 60, cy: 1027, r: 9, fill: index === 0 ? '#52635c' : '#c6ff3d' }, content);
      api.text('RELATIVE OUTPUT', { x: x + 210, y: 1084, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 19, fill: '#52635c', 'letter-spacing': 3 }, content);
      return { group, content, edge, spot, bar, traveler, number, item, x, index };
    });
    const versus = api.el('g', {}, world);
    api.el('circle', { cx: 540, cy: 750, r: 50, fill: '#071b15', stroke: '#c6ff3d', 'stroke-width': 5 }, versus);
    api.text('VS', { x: 540, y: 763, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 31, 'font-weight': 900, fill: '#c6ff3d' }, versus);
    const caption = api.text(p.caption || '', { x: 540, y: 1390, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 44, fill: '#102a22' });
    const ring = makeTransitionRing(api, api.el('g', {}));
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      setCamera(api, world, t, .022);
      atmosphere.glow.setAttribute('cx', 790 - t * 7);
      const focus = api.inout(api.prog(t, 3, 3.8));
      cards.forEach((card, index) => {
        const enter = api.back(api.prog(t, .2 + index * .25, .9 + index * .25));
        const direction = index === 0 ? -1 : 1;
        const cx = card.x + 210;
        const scale = api.mix(.94, 1, enter) * (index === 1 ? 1 + focus * .025 : 1 - focus * .015);
        const y = api.mix(55, 0, enter) + (index === 1 ? -26 * focus : 12 * focus);
        card.group.setAttribute('transform', `translate(${direction * api.mix(240, 0, enter)} ${y}) translate(${cx} 770) scale(${scale}) rotate(${direction * api.mix(4, 0, enter)}) translate(${-cx} -770)`);
        api.opacity(card.group, api.clamp(enter) * (index === 0 ? 1 - focus * .12 : 1));
        api.opacity(card.content, api.prog(t, .48 + index * .25, .85 + index * .25));
        card.edge.setAttribute('stroke-dashoffset', 1 - api.out(api.prog(t, .35 + index * .25, 1.05 + index * .25)));
        api.opacity(card.spot, index === 1 ? .025 + focus * .14 : .025);
        const valueProgress = api.inout(api.prog(t, 1.05, 3.05));
        const value = Number(card.item.value || 0) * valueProgress;
        const width = 300 * value / 100;
        card.bar.setAttribute('width', width);
        card.traveler.setAttribute('cx', card.x + 60 + width);
        card.traveler.setAttribute('r', 9 + Math.sin(valueProgress * Math.PI) * 4);
        card.number.textContent = Math.round(value);
      });
      const versusEnter = api.back(api.prog(t, .85, 1.35));
      api.opacity(versus, api.clamp(versusEnter));
      versus.setAttribute('transform', `translate(540 750) scale(${api.mix(.5, 1, versusEnter)}) translate(-540 -750)`);
      const captionEnter = api.out(api.prog(t, 3.1, 3.7));
      api.opacity(caption, captionEnter);
      caption.setAttribute('transform', `translate(0 ${api.mix(28, 0, captionEnter)})`);
      updateTransitionRing(api, ring, t);
    };
  },

  reveal: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const world = api.el('g', {});
    const atmosphere = makeAtmosphere(api, world, 840, 760);
    const spine = api.el('line', { x1: 205, y1: 455, x2: 205, y2: 1015, stroke: '#92a69a', 'stroke-opacity': .2, 'stroke-width': 4, 'stroke-dasharray': '9 15' }, world);
    const spineActive = api.el('line', { x1: 205, y1: 455, x2: 205, y2: 455, stroke: '#c6ff3d', 'stroke-width': 6, 'stroke-linecap': 'round' }, world);
    const traveler = api.el('circle', { cx: 205, cy: 455, r: 11, fill: '#c6ff3d', opacity: 0, filter: 'url(#smallGlow)' }, world);
    const items = p.items.map((label, index) => {
      const y = 360 + index * 280;
      const onAccent = index % 2 === 1;
      const spot = api.el('circle', { cx: 570, cy: y + 95, r: 250, fill: '#c6ff3d', opacity: .025, filter: 'url(#softGlow)' }, world);
      const group = api.el('g', {}, world);
      api.el('rect', { x: 150, y: 0, width: 780, height: 190, rx: 28, fill: onAccent ? '#c6ff3d' : '#fffdf7', stroke: '#102a22', 'stroke-width': 5, filter: 'url(#depthShadow)' }, group);
      const edge = api.el('path', { d: 'M190 0H890', fill: 'none', stroke: onAccent ? '#eff5e7' : '#c6ff3d', 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, group);
      const content = api.el('g', {}, group);
      api.el('rect', { x: 185, y: 55, width: 122, height: 80, rx: 40, fill: onAccent ? '#071b15' : '#c6ff3d' }, content);
      api.text(String(index + 1).padStart(2, '0'), { x: 246, y: 108, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 38, 'font-weight': 900, fill: onAccent ? '#c6ff3d' : '#071b15', 'data-on-accent': onAccent ? 'false' : 'true' }, content);
      api.text(`RESULT / ${String(index + 1).padStart(2, '0')}`, { x: 360, y: 62, class: 'mg-num', 'font-size': 20, 'font-weight': 700, fill: '#52635c', 'letter-spacing': 4, 'data-on-accent': onAccent ? 'true' : 'false' }, content);
      api.text(label, { x: 360, y: 139, class: 'mg-text', 'font-size': 68, 'font-weight': 760, fill: '#102a22', 'data-on-accent': onAccent ? 'true' : 'false' }, content);
      api.el('circle', { cx: 840, cy: 95, r: 34, fill: 'none', stroke: onAccent ? '#071b15' : '#102a22', 'stroke-opacity': .35, 'stroke-width': 4 }, content);
      api.el('path', { d: 'M828 95H850M842 87L850 95L842 103', fill: 'none', stroke: onAccent ? '#071b15' : '#102a22', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, content);
      return { group, content, edge, spot, y, index };
    });
    const ring = makeTransitionRing(api, api.el('g', {}));
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      setCamera(api, world, t, .025);
      atmosphere.glow.setAttribute('cy', 760 - t * 12);
      const draw = api.inout(api.prog(t, .2, 2));
      spineActive.setAttribute('y2', api.mix(455, 1015, draw));
      traveler.setAttribute('cy', api.mix(455, 1015, draw));
      api.opacity(traveler, api.prog(t, .1, .3) * (1 - api.prog(t, 2, 2.3)));
      items.forEach(({ group, content, edge, spot, y, index }) => {
        const start = .12 + index * .65;
        const enter = api.back(api.prog(t, start, start + .65));
        const settle = api.prog(t, 2.2, 2.8);
        const floatY = Math.sin(t * 1.5 - index * .6) * 3 * settle;
        const scale = api.mix(.92, 1, enter);
        group.setAttribute('transform', `translate(${api.mix(120, 0, enter)} ${y + api.mix(60, 0, enter) + floatY}) translate(540 95) scale(${scale}) rotate(${api.mix(2.5, 0, enter)}) translate(-540 -95)`);
        api.opacity(group, api.clamp(enter));
        api.opacity(content, api.prog(t, start + .18, start + .5));
        edge.setAttribute('stroke-dashoffset', 1 - api.out(api.prog(t, start + .15, start + .7)));
        api.opacity(spot, .02 + api.prog(t, start + .2, start + .7) * .055);
      });
      updateTransitionRing(api, ring, t);
    };
  },

  procession: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const number = api.text(String(p.multiplier || 5), { x: 78, y: 450, class: 'mg-num', 'font-size': 190, 'font-weight': 900, fill: '#c6ff3d' });
    const times = api.text('×', { x: 270, y: 440, class: 'mg-num', 'font-size': 72, 'font-weight': 800, fill: '#c6ff3d' });
    const metric = api.text(p.metric || '', { x: 390, y: 405, class: 'mg-text', 'font-size': 38, 'font-weight': 700, fill: 'var(--ink)' });
    const lanes = api.el('g', {});
    api.el('path', { d: 'M0 720L1080 420V790L0 1260Z', fill: '#fffdf7', opacity: .1 }, lanes);
    api.el('path', { d: 'M0 1370L1080 690V1050L0 1920Z', fill: '#fffdf7', opacity: .08 }, lanes);
    const speedLines = api.el('g', { stroke: '#c6ff3d', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .42 }, lanes);
    [[30, 1370, 310, 1240], [390, 1570, 760, 1410], [720, 1160, 1040, 1030], [40, 1020, 230, 950], [760, 690, 1040, 610]].forEach(([x1, y1, x2, y2]) => {
      api.el('line', { x1, y1, x2, y2 }, speedLines);
    });

    function walker(parent, type) {
      const group = api.el('g', {}, parent);
      const image = api.el('image', {
        href: `assets/walk/${type}-00.png`,
        x: -160,
        y: -276,
        width: 320,
        height: 320,
        preserveAspectRatio: 'xMidYMid meet',
      }, group);
      return { group, image, type };
    }

    function setWalkFrame(figure, phase) {
      const frame = Math.floor(phase / (Math.PI * 2) * 16) % 16;
      const source = `assets/walk/${figure.type}-${String(frame).padStart(2, '0')}.png`;
      if (figure.image.getAttribute('href') !== source) figure.image.setAttribute('href', source);
    }

    const humanBases = [
      { x: 900, y: 620, s: .42 }, { x: 760, y: 655, s: .52 }, { x: 610, y: 690, s: .63 },
      { x: 450, y: 730, s: .76 }, { x: 280, y: 770, s: .91 }, { x: 100, y: 820, s: 1.08 },
    ];
    const robotBases = [
      { x: 1000, y: 850, s: .3 }, { x: 920, y: 900, s: .36 }, { x: 840, y: 950, s: .42 },
      { x: 750, y: 1000, s: .49 }, { x: 650, y: 1060, s: .57 }, { x: 540, y: 1120, s: .66 },
      { x: 420, y: 1190, s: .76 }, { x: 290, y: 1260, s: .88 }, { x: 140, y: 1340, s: 1.02 },
    ];
    const humans = humanBases.map(base => ({ ...base, ...walker(lanes, 'human') }));
    const robots = robotBases.map(base => ({ ...base, ...walker(lanes, 'robot') }));
    const caption = api.text(p.caption || '', { x: 90, y: 1690, class: 'mg-text', 'font-size': 48, 'font-weight': 700, fill: 'var(--ink)' });
    const captionRule = api.el('line', { x1: 60, y1: 1630, x2: 60, y2: 1710, stroke: '#c6ff3d', 'stroke-width': 9 });

    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      const numberEnter = api.out(api.prog(t, .15, .8));
      api.opacity(number, numberEnter);
      api.opacity(times, numberEnter);
      api.opacity(metric, api.prog(t, .45, 1));
      const march = t * 5.2;
      humans.forEach((figure, index) => {
        figure.group.setAttribute('transform', `translate(${figure.x + t * 7} ${figure.y - t * 1.8}) scale(${figure.s})`);
        setWalkFrame(figure, march + index * .75);
      });
      robots.forEach((figure, index) => {
        const order = robots.length - index - 1;
        const start = .65 + order * .19;
        const enter = api.back(api.prog(t, start, start + .55));
        const visibleScale = figure.s * Math.max(0, enter);
        figure.group.setAttribute('transform', `translate(${figure.x + t * 5} ${figure.y - t * 1.4}) scale(${visibleScale})`);
        api.opacity(figure.group, api.clamp(enter));
        setWalkFrame(figure, march + index * .7);
      });
      speedLines.setAttribute('transform', `translate(${(t * 28) % 140} ${-(t * 28) % 140 * .35})`);
      const captionEnter = api.prog(t, (scene.timing.caption || 3000) / 1000, (scene.timing.caption || 3000) / 1000 + .6);
      api.opacity(caption, captionEnter);
      api.opacity(captionRule, captionEnter);
    };
  },

  end: (scene, api) => {
    const p = scene.props;
    const title = api.text(p.title, { x: 540, y: 790, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 108, fill: '#102a22' });
    const line = api.el('line', { x1: 250, y1: 900, x2: 830, y2: 900, stroke: '#c6ff3d', 'stroke-width': 22, 'stroke-linecap': 'round' });
    const subtitle = api.text(p.subtitle || '', { x: 540, y: 1040, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 48, fill: '#52635c' });
    const note = api.text(p.note || '', { x: 540, y: 1650, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 30, fill: '#52635c' });
    return t => {
      const enter = api.back(api.prog(t, 0, .9));
      title.setAttribute('transform', `translate(540 790) scale(${api.mix(.55, 1, enter)}) translate(-540 -790)`);
      api.opacity(title, api.clamp(enter));
      const draw = api.out(api.prog(t, .55, 1.35));
      line.setAttribute('x2', api.mix(250, 830, draw));
      api.opacity(subtitle, api.prog(t, 1.1, 1.8));
      api.opacity(note, api.prog(t, 1.8, 2.4));
    };
  }
};
