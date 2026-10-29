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
    const groups = [];
    const connectors = [];
    p.nodes.forEach((label, index) => {
      const y = 390 + index * 310;
      if (index < p.nodes.length - 1) {
        const line = api.el('line', { x1: 540, y1: y + 90, x2: 540, y2: y + 300, stroke: '#c6ff3d', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': '18 20' });
        connectors.push(line);
      }
      const group = api.el('g', {});
      api.el('path', { d: 'M250-85H790L850-25V85H290L250 45Z', fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 }, group);
      api.text(label, { x: 540, y: 25, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 72, fill: '#102a22' }, group);
      groups.push({ group, y });
    });
    const caption = api.text(p.caption || '', { x: 540, y: 1580, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 44, fill: '#102a22' });
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      groups.forEach(({ group, y }, index) => {
        const start = times[index] / 1000;
        const enter = api.back(api.prog(t, start, start + .65));
        group.setAttribute('transform', `translate(0 ${y + api.mix(120, 0, enter)}) scale(${api.mix(.65, 1, enter)})`);
        api.opacity(group, api.clamp(enter));
        if (connectors[index]) api.opacity(connectors[index], api.prog(t, start + .45, start + .9));
      });
      const captionStart = (scene.timing.caption || 0) / 1000;
      api.opacity(caption, api.prog(t, captionStart, captionStart + .6));
    };
  },

  compare: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const cards = [p.left, p.right].map((item, index) => {
      const group = api.el('g', {});
      const x = index === 0 ? 90 : 570;
      api.el('rect', { x, y: 420, width: 420, height: 700, rx: 34, fill: '#fffdf7', stroke: '#102a22', 'stroke-width': 5 }, group);
      api.text(item.title, { x: x + 210, y: 540, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 58, fill: '#102a22' }, group);
      api.el('rect', { x: x + 60, y: 1010, width: 300, height: 34, rx: 17, fill: '#102a22', opacity: .12 }, group);
      const bar = api.el('rect', { x: x + 60, y: 1010, width: 0, height: 34, rx: 17, fill: index === 0 ? '#52635c' : '#c6ff3d' }, group);
      const number = api.text('0', { x: x + 210, y: 800, 'text-anchor': 'middle', class: 'mg-num', 'font-size': 140, fill: '#102a22' }, group);
      return { group, bar, number, item };
    });
    const caption = api.text(p.caption || '', { x: 540, y: 1390, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 44, fill: '#102a22' });
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      cards.forEach((card, index) => {
        const enter = api.out(api.prog(t, .2 + index * .25, 1 + index * .25));
        api.opacity(card.group, enter);
        card.group.setAttribute('transform', `translate(${api.mix(index === 0 ? -500 : 500, 0, enter)} 0)`);
        const valueProgress = api.inout(api.prog(t, 1.1, 3.2));
        const value = Number(card.item.value || 0) * valueProgress;
        card.bar.setAttribute('width', 300 * value / 100);
        card.number.textContent = Math.round(value);
      });
      api.opacity(caption, api.prog(t, 3.1, 3.7));
    };
  },

  reveal: (scene, api) => {
    const p = scene.props;
    const header = api.header(scene, p.label);
    const items = p.items.map((label, index) => {
      const group = api.el('g', {});
      api.el('rect', { x: 150, y: 360 + index * 280, width: 780, height: 190, rx: 28, fill: index % 2 ? '#c6ff3d' : '#fffdf7', stroke: '#102a22', 'stroke-width': 5 }, group);
      api.text(label, { x: 540, y: 480 + index * 280, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 68, fill: '#102a22', 'data-on-accent': index % 2 ? 'true' : 'false' }, group);
      return group;
    });
    return t => {
      api.opacity(header, api.prog(t, 0, .4));
      items.forEach((group, index) => {
        const enter = api.back(api.prog(t, index * .7, .65 + index * .7));
        api.opacity(group, api.clamp(enter));
        group.setAttribute('transform', `translate(0 ${api.mix(90, 0, enter)})`);
      });
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

    function human(parent) {
      const group = api.el('g', {}, parent);
      const leftLeg = api.el('path', { d: 'M-12-48L-22 12L-38 66', fill: 'none', stroke: '#d8d6c7', 'stroke-width': 24, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
      const rightLeg = api.el('path', { d: 'M12-48L24 10L40 62', fill: 'none', stroke: '#d8d6c7', 'stroke-width': 24, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, group);
      const leftArm = api.el('path', { d: 'M-24-104L-48-52L-58-12', fill: 'none', stroke: '#d8d6c7', 'stroke-width': 19, 'stroke-linecap': 'round' }, group);
      const rightArm = api.el('path', { d: 'M24-104L48-56L58-18', fill: 'none', stroke: '#d8d6c7', 'stroke-width': 19, 'stroke-linecap': 'round' }, group);
      api.el('path', { d: 'M-24-116Q0-132 24-116L31-46Q0-28-31-46Z', fill: '#d8d6c7' }, group);
      api.el('circle', { cx: 0, cy: -157, r: 29, fill: '#d8d6c7' }, group);
      return { group, leftLeg, rightLeg, leftArm, rightArm };
    }

    function robot(parent) {
      const group = api.el('g', {}, parent);
      const leftLeg = api.el('path', { d: 'M-24-5L-30 42L-48 72', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 25, 'stroke-linecap': 'square', 'stroke-linejoin': 'round' }, group);
      const rightLeg = api.el('path', { d: 'M24-5L32 40L50 68', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 25, 'stroke-linecap': 'square', 'stroke-linejoin': 'round' }, group);
      const leftArm = api.el('path', { d: 'M-52-68L-76-28L-68 12', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 19, 'stroke-linecap': 'square', 'stroke-linejoin': 'round' }, group);
      const rightArm = api.el('path', { d: 'M52-68L76-30L68 10', fill: 'none', stroke: '#c6ff3d', 'stroke-width': 19, 'stroke-linecap': 'square', 'stroke-linejoin': 'round' }, group);
      api.el('rect', { x: -48, y: -82, width: 96, height: 86, rx: 8, fill: '#c6ff3d' }, group);
      api.el('rect', { x: -55, y: -174, width: 110, height: 82, rx: 10, fill: '#c6ff3d' }, group);
      api.el('rect', { x: -37, y: -156, width: 74, height: 43, rx: 4, fill: 'var(--paper)' }, group);
      api.el('circle', { cx: -57, cy: -133, r: 10, fill: '#c6ff3d' }, group);
      api.el('circle', { cx: 57, cy: -133, r: 10, fill: '#c6ff3d' }, group);
      return { group, leftLeg, rightLeg, leftArm, rightArm };
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
    const humans = humanBases.map(base => ({ ...base, ...human(lanes) }));
    const robots = robotBases.map(base => ({ ...base, ...robot(lanes) }));
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
        const step = Math.sin(march + index * .75);
        figure.group.setAttribute('transform', `translate(${figure.x + t * 7} ${figure.y - t * 1.8}) scale(${figure.s})`);
        figure.leftLeg.setAttribute('transform', `rotate(${step * 13} -12 -48)`);
        figure.rightLeg.setAttribute('transform', `rotate(${-step * 13} 12 -48)`);
        figure.leftArm.setAttribute('transform', `rotate(${-step * 10} -24 -104)`);
        figure.rightArm.setAttribute('transform', `rotate(${step * 10} 24 -104)`);
      });
      robots.forEach((figure, index) => {
        const order = robots.length - index - 1;
        const start = .65 + order * .19;
        const enter = api.back(api.prog(t, start, start + .55));
        const step = Math.sin(march + index * .7);
        const visibleScale = figure.s * Math.max(0, enter);
        figure.group.setAttribute('transform', `translate(${figure.x + t * 5} ${figure.y - t * 1.4}) scale(${visibleScale})`);
        api.opacity(figure.group, api.clamp(enter));
        figure.leftLeg.setAttribute('transform', `rotate(${step * 9} -24 -5)`);
        figure.rightLeg.setAttribute('transform', `rotate(${-step * 9} 24 -5)`);
        figure.leftArm.setAttribute('transform', `rotate(${-step * 8} -52 -68)`);
        figure.rightArm.setAttribute('transform', `rotate(${step * 8} 52 -68)`);
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
