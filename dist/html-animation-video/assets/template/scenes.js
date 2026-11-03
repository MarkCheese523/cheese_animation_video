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
      api.text(label, { x: 540, y: 480 + index * 280, 'text-anchor': 'middle', class: 'mg-text', 'font-size': 68, fill: '#102a22' }, group);
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
