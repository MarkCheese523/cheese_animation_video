/* =====================================================================
 * Motion Layer continuous-stage engine v2.0
 * One SVG stage, deterministic Sprite windows, Carry helpers and 2.5D.
 * Classic browser script: initStage() -> build sprites -> boot({...}).
 * Node tests may evaluate this file in a VM and use global MotionEngine.
 * ===================================================================== */
(function attachMotionEngine(root) {
  'use strict';

  const W = 1080, H = 1920, D = Math.PI / 180;
  const NS = 'http://www.w3.org/2000/svg';
  const DEFAULT_THEME = Object.freeze({
    background: '#f4f0e6', surface: '#fffdf7', surfaceRaised: '#ffffff',
    ink: '#102a22', text: '#102a22', muted: '#65736b', accent: '#c6ff3d',
    accent2: '#8ad8ce', oppose: '#ed6a5a', actor: '#102a22', agent: '#7768ae',
    warning: '#e3aa3c', ok: '#3b9b72', error: '#d84c4c', onAccent: '#102a22',
    cardFill: 'rgba(255,253,247,.96)', cardStroke: 'rgba(16,42,34,.55)',
    subtitle: '#102a22', subtitleBand: 'rgba(244,240,230,.94)',
    mono: '"SFMono-Regular",Consolas,"Liberation Mono",monospace',
    sans: '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    grid: false, particles: false, scanlines: false, hud: false,
    perspective: 900
  });
  let THEME = { ...DEFAULT_THEME };
  let MONO = THEME.mono;
  let CY = THEME.accent, BL = THEME.accent2, MG = THEME.oppose;
  let VI = THEME.agent, GY = THEME.muted, AM = THEME.warning;
  let OKC = THEME.ok, ERR = THEME.error, SUBC = THEME.subtitle, DIM = THEME.muted;

  const $ = id => document.getElementById(id);
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const key in (attrs || {})) el.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const txt = (parent, value, attrs) => {
    const el = mk('text', { 'text-anchor': 'middle', ...(attrs || {}) }, parent);
    el.textContent = value;
    return el;
  };
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const p = (t, a, b) => a === b ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a));
  const lin = x => x;
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerpA = (a, b, u) => a.map((value, i) => value + (b[i] - value) * u);
  const qb = (a, c, b, u) => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]
  ];
  const op = (el, value) => el.setAttribute('opacity', clamp(value));
  const at = (el, attrs) => { for (const key in attrs) el.setAttribute(key, attrs[key]); };
  const setL = (line, x1, y1, x2, y2) => at(line, { x1, y1, x2, y2 });
  let seed = 5;
  const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function applyTheme(patch = {}) {
    THEME = { ...THEME, ...patch };
    MONO = THEME.mono;
    CY = THEME.accent; BL = THEME.accent2; MG = THEME.oppose;
    VI = THEME.agent; GY = THEME.muted; AM = THEME.warning;
    OKC = THEME.ok; ERR = THEME.error; SUBC = THEME.subtitle; DIM = THEME.muted;
    return THEME;
  }

  /** K = [[time, number|array, easing?], ...]; easing belongs to the incoming segment. */
  function kf(t, K) {
    if (!K || !K.length) throw new Error('kf requires at least one keyframe');
    if (t <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i += 1) {
      const [t0, v0] = K[i], [t1, v1, easing] = K[i + 1];
      if (t <= t1) {
        const u = (easing || eio)(p(t, t0, t1));
        return Array.isArray(v0) ? lerpA(v0, v1, u) : v0 + (v1 - v0) * u;
      }
    }
    return K[K.length - 1][1];
  }

  /** R = [[t0,t1,start,end,control?,easing?], ...]. */
  function route(t, R) {
    if (!R || !R.length) throw new Error('route requires at least one segment');
    let pos = R[0][2];
    for (const [t0, t1, a, b, c, easing] of R) {
      if (t < t0) return pos;
      const u = (easing || eio)(p(t, t0, t1));
      pos = c ? qb(a, c, b, u) : lerpA(a, b, u);
      if (t <= t1) return pos;
    }
    return pos;
  }

  const L = {}, SPR = [];
  function initStage(layers = ['under', 'main', 'figs', 'over', 'top', 'labels']) {
    const cam = $('cam');
    if (!cam) throw new Error('initStage requires #cam');
    SPR.length = 0;
    for (const key of Object.keys(L)) delete L[key];
    layers.forEach(key => { L[key] = mk('g', { 'data-layer': key }, cam); });
    return L;
  }
  const S = (el, t0, t1, fn) => {
    const sprite = { el, t0, t1, fn };
    SPR.push(sprite);
    return sprite;
  };
  const upd = (t0, t1, fn) => S(null, t0, t1, fn);
  const V = (K, key, t, fallback) => {
    const q = K[key];
    return q == null ? fallback : typeof q === 'function' ? q(t) : Array.isArray(q) ? kf(t, q) : q;
  };
  const depthScale = (z = 0, perspective = THEME.perspective) => perspective / Math.max(1, perspective + z);
  function project(point, camera = {}) {
    const [x, y, z = 0] = point;
    const cx = camera.cx ?? W / 2, cy = camera.cy ?? 820;
    const scale = depthScale(z, camera.perspective ?? THEME.perspective);
    return [cx + (x - cx) * scale, cy + (y - cy) * scale, scale];
  }
  function act(el, t0, t1, K, fn) {
    S(el, t0, t1, t => {
      const scale = Math.max(0, V(K, 's', t, 1)) * depthScale(V(K, 'z', t, 0));
      el.setAttribute('transform', `translate(${V(K, 'x', t, 0)} ${V(K, 'y', t, 0)}) rotate(${V(K, 'r', t, 0)}) scale(${scale})`);
      op(el, V(K, 'o', t, 1));
      if (fn) fn(t);
    });
    return el;
  }
  const io = (a, b, d = .3) => [[a, 0], [a + d, 1, lin], [b - d, 1], [b, 0, lin]];
  const ps = (a, s = 1, d = .35) => [[a, 0], [a + d, s, back]];

  const G = (parent, attrs) => mk('g', attrs || {}, parent);
  function rect(parent, w, h, o = {}) {
    const attrs = {
      x: -w / 2, y: -h / 2, width: w, height: h, rx: o.rx ?? 14,
      fill: o.fill ?? THEME.cardFill, stroke: o.stroke ?? THEME.cardStroke,
      'stroke-width': o.sw ?? 2.5
    };
    if (o.dash) attrs['stroke-dasharray'] = o.dash;
    return mk('rect', attrs, parent);
  }
  function T(parent, value, x, y, fs, fill = THEME.text, o = {}) {
    const attrs = { x, y, 'font-size': fs, fill, 'font-weight': o.fw ?? 700, stroke: 'none' };
    if (o.mono) { attrs['font-family'] = MONO; attrs['letter-spacing'] = o.ls ?? 2; }
    if (o.anchor) attrs['text-anchor'] = o.anchor;
    return txt(parent, value, attrs);
  }
  function TM(parent, parts, x, y, fs) {
    const el = mk('text', { x, y, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 900 }, parent);
    parts.forEach(([value, color]) => { mk('tspan', { fill: color }, el).textContent = value; });
    return el;
  }
  function pill(parent, label, w, h, o = {}) {
    const g = G(parent);
    g.r = rect(g, w, h, { rx: o.rx ?? h / 2, fill: o.fill ?? THEME.surface, stroke: o.stroke ?? BL, sw: o.sw ?? 2.5, dash: o.dash });
    const fs = o.fs ?? 24;
    g.t = T(g, label, 0, fs * .36, fs, o.color ?? THEME.text, o);
    return g;
  }
  function P(label, x, y, w, h, t0, t1, o = {}) {
    const g = pill(o.par || L.main, label, w, h, o);
    act(g, t0, t1, { x, y, s: o.sk || ps(t0, o.sc ?? 1), o: io(t0, t1, .25) });
    return g;
  }
  function TX(value, x, y, fs, t0, t1, o = {}) {
    const g = G(o.par || L.labels);
    T(g, value, 0, 0, fs, o.color || THEME.text, o);
    act(g, t0, t1, { x, y: [[t0, y + 18], [t0 + .35, y, eo]], o: io(t0, t1, .25) });
    return g;
  }
  function LN(points, t0, t1, o = {}) {
    const line = mk('polyline', {
      points: points.map(q => q.join(',')).join(' '), fill: 'none', stroke: o.c || CY,
      'stroke-width': o.w || 3, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }, o.par || L.main);
    S(line, t0, t1, t => {
      line.setAttribute('stroke-dashoffset', 1 - eo(p(t, t0, t0 + (o.d || .4))));
      op(line, 1 - p(t, t1 - .3, t1));
    });
    return line;
  }
  function CNT(el, t0, t1, from, to, fmt = value => Math.round(value)) {
    return upd(t0, 1e9, t => { el.textContent = fmt(from + (to - from) * eo(p(t, t0, t1))); });
  }

  function icon(parent, kind, x, y, s = 1, color = THEME.ink) {
    const g = G(parent, { transform: `translate(${x} ${y}) scale(${s})`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const M = (tag, attrs) => mk(tag, attrs, g);
    switch (kind) {
      case 'doc': M('rect', { x: -18, y: -24, width: 36, height: 48, rx: 4 }); [-10, 0, 10].forEach(v => M('line', { x1: -10, y1: v, x2: 10, y2: v })); break;
      case 'code': M('rect', { x: -28, y: -20, width: 56, height: 40, rx: 5 }); T(g, '</>', 0, 6, 16, color, { mono: 1, ls: 0 }); break;
      case 'chat': M('path', { d: 'M-26 -16 H26 V12 H-6 L-16 22 V12 H-26 Z' }); break;
      case 'book': [-14, 0, 14].forEach((v, i) => M('rect', { x: -24 + i * 3, y: v - 6, width: 44, height: 12, rx: 2 })); break;
      case 'team': M('circle', { cx: -14, cy: -10, r: 7 }); M('circle', { cx: 14, cy: -10, r: 7 }); M('path', { d: 'M-26 14 Q-14 -2 -2 14 M2 14 Q14 -2 26 14' }); break;
      case 'chart': [[-16, 10], [-4, 20], [8, 30], [20, 16]].forEach(([v, h]) => M('line', { x1: v, y1: 18, x2: v, y2: 18 - h })); break;
      case 'search': M('circle', { cx: -5, cy: -5, r: 13 }); M('line', { x1: 5, y1: 5, x2: 18, y2: 18 }); break;
      case 'stack': [-12, 0, 12].forEach(v => M('line', { x1: -20, y1: v, x2: 20, y2: v })); break;
      case 'loop': M('path', { d: 'M16 -10 A18 18 0 1 0 18 8' }); M('path', { d: 'M10 -16 L17 -10 L10 -4' }); break;
      case 'eye': M('path', { d: 'M-26 0 Q0 -22 26 0 Q0 22 -26 0 Z' }); M('circle', { cx: 0, cy: 0, r: 7 }); break;
      case 'bolt': M('path', { d: 'M4 -24 L-12 4 H0 L-4 24 L12 -4 H0 Z', fill: AM, stroke: 'none' }); break;
      case 'lock': M('rect', { x: -14, y: -4, width: 28, height: 22, rx: 4 }); M('path', { d: 'M-8 -4 V-12 A8 8 0 0 1 8 -12 V-4' }); break;
      default: throw new Error(`Unknown abstract icon: ${kind}`);
    }
    return g;
  }
  function door(parent) {
    const g = G(parent);
    mk('path', { d: 'M-60 100 V-80 A60 30 0 0 1 60 -80 V100', fill: THEME.surface, stroke: CY, 'stroke-width': 4 }, g);
    mk('circle', { cx: 35, cy: 15, r: 6, fill: CY }, g);
    return g;
  }

  /** Continuous identity hub. HK = [[t,[x,y,w,h,opacity,labelScale]], ...]. */
  function makeHub(T0, END, HK, label = '主体', override) {
    const g = G(L.top, { 'data-continuous-subject': label });
    const halo = mk('circle', { fill: 'url(#gHalo)' }, g);
    const r = mk('rect', { fill: 'url(#gChip)', stroke: CY, 'stroke-width': 4, filter: 'url(#glow)' }, g);
    const lg = G(g); T(lg, label, 0, 16, 46, THEME.text, { fw: 900 });
    const state = t => {
      const [x, y, w, h, o, ls] = kf(t, HK);
      const value = { x, y, w, h, o, ls };
      return (override && override(t, value)) || value;
    };
    S(g, T0, END, t => {
      const value = state(t);
      g.setAttribute('transform', `translate(${value.x} ${value.y})`);
      at(r, { x: -value.w / 2, y: -value.h / 2, width: value.w, height: value.h, rx: Math.min(value.w, value.h) / 2 });
      halo.setAttribute('r', Math.min(value.w, value.h) * 1.8 * (1 + .04 * Math.sin(t * 5)));
      lg.setAttribute('transform', `scale(${value.ls})`);
      op(g, value.o);
    });
    return { g, r, halo, label: lg, state };
  }

  function mkFig(parent, color = THEME.actor, width = 5, dash) {
    const g = G(parent, { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
    if (dash) g.setAttribute('stroke-dasharray', dash);
    const F = { g };
    ['legL', 'legR', 'torso', 'armL', 'armR'].forEach(key => { F[key] = mk('line', {}, g); });
    F.head = mk('circle', { cx: 0, cy: -108, r: 12 }, g);
    return F;
  }
  function poseFig(F, feet, scale, face, o = {}) {
    const phase = o.ph || 0, amp = o.amp || 0, grow = o.grow ?? 1;
    const bob = -Math.abs(Math.sin(phase)) * 4 * (amp / 25);
    F.g.setAttribute('transform', `translate(${feet[0]} ${feet[1] + bob * scale}) scale(${scale * face} ${scale})`);
    const legAngle = amp * Math.sin(phase) * D;
    setL(F.legL, 0, -52, 52 * Math.sin(legAngle) * grow, -52 + 52 * Math.cos(legAngle) * grow);
    setL(F.legR, 0, -52, -52 * Math.sin(legAngle) * grow, -52 + 52 * Math.cos(legAngle) * grow);
    setL(F.torso, 0, -92, 0, -92 + 40 * grow);
    const swing = amp * .8 * Math.sin(phase);
    const aL = ((o.aL ?? -8) - swing) * D, aR = ((o.aR ?? 8) + swing) * D;
    setL(F.armL, 0, -88, 40 * Math.sin(aL) * grow, -88 + 40 * Math.cos(aL) * grow);
    setL(F.armR, 0, -88, 40 * Math.sin(aR) * grow, -88 + 40 * Math.cos(aR) * grow);
    op(F.g, grow === 0 ? 0 : 1);
  }
  function figAct(F, t0, t1, K) {
    S(F.g, t0, t1, t => {
      let amp = 0;
      (K.walk || []).forEach(([a, b]) => { amp = Math.max(amp, 22 * Math.min(p(t, a, a + .12), 1 - p(t, b - .12, b))); });
      poseFig(F, [V(K, 'x', t, 0), V(K, 'y', t, 0)], V(K, 's', t, 1), V(K, 'face', t, 1) < 0 ? -1 : 1,
        { ph: t * 13, amp, aR: V(K, 'aR', t, 8), aL: V(K, 'aL', t, -8), grow: V(K, 'grow', t, 1) });
      op(F.g, V(K, 'o', t, 1) * (V(K, 'grow', t, 1) === 0 ? 0 : 1));
    });
    return F;
  }
  const figHand = (K, t) => {
    const scale = V(K, 's', t, 1), face = V(K, 'face', t, 1) < 0 ? -1 : 1, angle = V(K, 'aR', t, 8) * D;
    return [V(K, 'x', t, 0) + scale * face * 40 * Math.sin(angle), V(K, 'y', t, 0) + scale * (-88 + 40 * Math.cos(angle))];
  };

  function imgCard(src, aspectRatio, title, width = 960, parent) {
    const height = width / aspectRatio, g = G(parent || L.over, { 'data-evidence-card': title });
    rect(g, width + 24, height + 76, { rx: 18, fill: THEME.cardFill, stroke: CY, sw: 3 }).setAttribute('transform', 'translate(0 -26)');
    T(g, title, -width / 2, -height / 2 - 30, 22, SUBC, { mono: 1, anchor: 'start' });
    mk('rect', { x: -width / 2, y: -height / 2, width, height, fill: '#fff' }, g);
    mk('image', { href: src, x: -width / 2, y: -height / 2, width, height, preserveAspectRatio: 'xMidYMid meet' }, g);
    g.W = width; g.H = height;
    return g;
  }
  function imgMark(card, fx, fy, fw, fh, t0, t1, label, color = MG) {
    const width = card.W, height = card.H, g = G(card);
    mk('rect', { x: -width / 2 + fx * width, y: -height / 2 + fy * height, width: fw * width, height: fh * height, rx: 6, fill: 'none', stroke: color, 'stroke-width': 4 }, g);
    if (label) {
      const lw = label.length * 20 + 30;
      const lp = pill(g, label, lw, 38, { stroke: color, fill: color, color: THEME.onAccent, fs: 20 });
      lp.setAttribute('transform', `translate(${-width / 2 + (fx + fw) * width - lw / 2} ${-height / 2 + fy * height - 24})`);
    }
    S(g, t0, t1, t => op(g, p(t, t0, t0 + .2) * (.75 + .25 * Math.sin(t * 8))));
    return g;
  }

  /* ------------------------- Carry helpers ------------------------- */
  /** K = [[t,[x,y,w,h,rx,opacity?]], ...], all values in the rect's parent coordinates. */
  function morphRect(el, t0, t1, K, fn) {
    S(el, t0, t1, t => {
      const state = kf(t, K), [x, y, w, h, rx, opacity = 1] = state;
      at(el, { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: Math.max(0, Math.min(rx, w / 2, h / 2)) });
      op(el, opacity);
      if (fn) fn(t, state);
    });
    return el;
  }
  /** K = [[t,[x,y,scale,opacity]], ...]; optional inner content crossfades in. */
  function zoomThrough(el, t0, t1, K, options = {}) {
    act(el, t0, t1, {
      x: t => kf(t, K)[0], y: t => kf(t, K)[1], s: t => kf(t, K)[2], o: t => kf(t, K)[3] ?? 1
    }, options.fn);
    if (options.inner) {
      const inner = options.inner;
      S(inner, t0, t1, t => op(inner, p(t, t0 + (options.delay || 0), t1) * p(t, t0, t1)));
    }
    return el;
  }
  function hop(el, t0, t1, R, K = {}) {
    return act(el, t0, t1, { ...K, x: t => route(t, R)[0], y: t => route(t, R)[1] });
  }
  function gather(items, t0, t1, target, options = {}) {
    const sprites = [];
    items.forEach((item, index) => {
      const el = item.el || item[0], from = item.from || item[1];
      const delay = item.delay ?? index * (options.stagger || 0), a = t0 + delay;
      const b = Math.max(a + .01, t1 - (options.tail || 0));
      sprites.push(act(el, a, b, {
        x: [[a, from[0]], [b, target[0], options.easing || eio]],
        y: [[a, from[1]], [b, target[1], options.easing || eio]],
        s: [[a, item.scale ?? 1], [b, 0, options.easing || eio]],
        o: [[a, 1], [b - Math.min(.2, (b - a) / 2), 1], [b, 0]]
      }));
    });
    if (options.targetEl) {
      const el = options.targetEl;
      sprites.push(act(el, t0, t1, { x: target[0], y: target[1], s: [[t0, 0], [t1, options.targetScale ?? 1, back]], o: [[t0, 0], [t1, 1]] }));
    }
    return sprites;
  }
  function emit(items, t0, t1, origin, options = {}) {
    const sprites = [];
    items.forEach((item, index) => {
      const el = item.el || item[0], to = item.to || item[1];
      const delay = item.delay ?? index * (options.stagger ?? .06), a = t0 + delay;
      const b = Math.max(a + .01, t1 - (options.tail || 0));
      sprites.push(act(el, a, options.end ?? t1, {
        x: [[a, origin[0]], [b, to[0], options.easing || eo]], y: [[a, origin[1]], [b, to[1], options.easing || eo]],
        s: [[a, 0], [b, item.scale ?? 1, back]], o: [[a, 0], [Math.min(b, a + .2), 1]]
      }));
    });
    return sprites;
  }
  const scatter = emit;
  function retract(items, t0, t1, target, options = {}) {
    return gather(items, t0, t1, target, { ...options, stagger: options.stagger ?? .04 });
  }
  function interpolatePoints(el, t0, t1, from, to, options = {}) {
    if (from.length !== to.length) throw new Error('Point tracks must have equal lengths');
    S(el, t0, t1, t => {
      const u = (options.easing || eio)(p(t, t0, t1));
      const points = from.map((point, index) => lerpA(point, to[index], u));
      el.setAttribute('points', points.map(point => point.join(',')).join(' '));
      if (options.opacity != null) op(el, typeof options.opacity === 'function' ? options.opacity(t) : options.opacity);
    });
    return el;
  }
  function unroll(el, t0, t1, ringPoints, linePoints, options = {}) {
    return interpolatePoints(el, t0, t1, ringPoints, linePoints, options);
  }
  function bend(el, t0, t1, linePoints, arcPoints, options = {}) {
    return interpolatePoints(el, t0, t1, linePoints, arcPoints, options);
  }

  /** Deterministic continuity snapshot for segment-boundary comparisons. */
  function snapshotState(t, CAM, tracks = {}) {
    return {
      t,
      camera: kf(t, CAM),
      tracks: Object.fromEntries(Object.entries(tracks).map(([key, K]) => [key, typeof K === 'function' ? K(t) : kf(t, K)]))
    };
  }

  /* ------------------------- Optional background skin ------------------------- */
  let bgParts = null;
  function drawBG(ctx, t, cy, zoom) {
    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, W, H);
    if (THEME.grid) {
      const step = 90 * zoom, oy = (((820 - (cy - 820) * .5 * zoom) % step) + step) % step;
      const ox = ((540 % step) + step) % step;
      ctx.strokeStyle = THEME.gridColor || 'rgba(16,42,34,.06)'; ctx.lineWidth = 1;
      for (let x = ox - step; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = oy - step; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    if (THEME.particles) {
      if (!bgParts) bgParts = Array.from({ length: 70 }, () => ({ x: rr() * W, y: rr() * H, speed: 20 + rr() * 50, r: 1 + rr() * 2.5, a: .2 + rr() * .5, d: .3 + rr() * .7 }));
      bgParts.forEach(q => {
        const y = ((q.y - t * q.speed - (cy - 820) * q.d) % H + H) % H;
        ctx.fillStyle = THEME.particleColor || `rgba(16,42,34,${q.a})`;
        ctx.beginPath(); ctx.arc(q.x, y, q.r, 0, Math.PI * 2); ctx.fill();
      });
    }
  }

  function boot({ T0, END, TOTAL = END, SUBS = [], CAM = [[0, [820, 1]]], theme, audio, audioOffset = T0 }) {
    if (theme) applyTheme(theme);
    const ctx = $('bg').getContext('2d'), cam = $('cam'), sub = $('sub');
    const EXPORT = /(?:\?|&)export(?:=|&|$)/.test(location.search);
    if (EXPORT) document.body.classList.add('export');
    const audioEl = typeof audio === 'string' ? $(audio) : audio;
    let lastSub = -2;

    function render(t) {
      const [cy, zoom] = kf(t, CAM);
      drawBG(ctx, t, cy, zoom);
      cam.setAttribute('transform', `translate(540 820) scale(${zoom}) translate(-540 ${-cy})`);
      for (const sprite of SPR) {
        const on = t >= sprite.t0 && t <= sprite.t1;
        if (sprite.el) sprite.el.style.visibility = on ? 'visible' : 'hidden';
        if (on && sprite.fn) sprite.fn(t);
      }
      const mm = Math.floor(t / 60), ss = Math.floor(t % 60), cc = Math.floor(t % 1 * 100);
      $('tc').textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
      $('prog').firstElementChild.style.width = `${clamp(t / TOTAL) * 100}%`;
      const si = SUBS.findIndex(item => t >= item[0] && t < item[1]);
      if (si !== lastSub) { sub.innerHTML = si >= 0 ? SUBS[si][2] : ''; lastSub = si; }
      if (si >= 0) {
        const k = eo(p(t, SUBS[si][0], SUBS[si][0] + .18));
        sub.style.opacity = k; sub.style.transform = `translateY(${20 * (1 - k)}px)`; sub.style.setProperty('--u', k);
      } else sub.style.opacity = 0;
    }

    window.renderAt = render;
    window.SEG = { T0, END, TOTAL, sprites: SPR, layers: L };
    const fit = () => {
      const scale = EXPORT ? 1 : Math.min(innerWidth / W, (innerHeight - 70) / H);
      $('stage').style.transform = `scale(${scale})`;
      $('wrap').style.width = `${W * scale}px`; $('wrap').style.height = `${H * scale}px`;
    };
    addEventListener('resize', fit); fit();
    let cur = T0;
    const match = location.search.match(/[?&]t=([\d.]+)/); if (match) cur = clamp(+match[1], T0, END);
    if (audioEl && Number.isFinite(audioEl.currentTime) && !match) cur = clamp(audioEl.currentTime - audioOffset, T0, END);
    render(cur);
    if (EXPORT) return { render, sprites: SPR };

    const playButton = $('play'), scrub = $('scrub');
    scrub.min = T0; scrub.max = END; scrub.value = cur;
    let playing = false, startedAt = 0;
    const setPlay = value => {
      playing = value;
      playButton.textContent = value ? '⏸ 暂停' : '▶ 播放';
      if (value) {
        if (cur >= END) cur = T0;
        startedAt = performance.now() - (cur - T0) * 1000;
        if (audioEl) { audioEl.currentTime = Math.max(0, cur + audioOffset); const promise = audioEl.play(); if (promise?.catch) promise.catch(() => setPlay(false)); }
      } else if (audioEl && !audioEl.paused) audioEl.pause();
    };
    playButton.onclick = () => setPlay(!playing);
    $('re').onclick = () => { cur = T0; if (audioEl) audioEl.currentTime = Math.max(0, T0 + audioOffset); setPlay(true); };
    scrub.oninput = () => {
      cur = +scrub.value;
      if (audioEl) audioEl.currentTime = Math.max(0, cur + audioOffset);
      setPlay(false); render(cur); $('tlabel').textContent = `${cur.toFixed(2)}s`;
    };
    document.addEventListener('keydown', event => {
      if (event.code === 'Space') { event.preventDefault(); setPlay(!playing); }
      if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        cur = clamp(cur + (event.code === 'ArrowRight' ? 5 : -5), T0, END);
        if (audioEl) audioEl.currentTime = Math.max(0, cur + audioOffset);
        if (playing) startedAt = performance.now() - (cur - T0) * 1000;
        render(cur); scrub.value = cur;
      }
    });
    function tick(now) {
      if (audioEl && !audioEl.paused) {
        cur = clamp(audioEl.currentTime - audioOffset, T0, END); playing = cur < END;
      } else if (playing && !audioEl) {
        cur = T0 + (now - startedAt) / 1000;
      }
      if ((playing || (audioEl && !audioEl.paused)) && cur >= END) { cur = END; setPlay(false); }
      if (playing || (audioEl && !audioEl.paused)) {
        render(cur); scrub.value = cur; $('tlabel').textContent = `${cur.toFixed(2)}s`;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    if (location.search.includes('auto')) setPlay(true);
    return { render, sprites: SPR };
  }

  const api = {
    W, H, D, NS, DEFAULT_THEME, L, SPR, initStage, S, upd, act, V, kf, route,
    clamp, p, lin, eo, eio, back, lerpA, qb, op, at, setL, mk, txt, G, rect, T, TM,
    pill, P, TX, LN, CNT, icon, door, makeHub, mkFig, poseFig, figAct, figHand,
    imgCard, imgMark, morphRect, zoomThrough, hop, gather, emit, scatter, unroll,
    bend, retract, project, depthScale, snapshotState, applyTheme, boot, io, ps,
    get theme() { return THEME; }, get MONO() { return MONO; }, get CY() { return CY; },
    get BL() { return BL; }, get MG() { return MG; }, get VI() { return VI; },
    get GY() { return GY; }, get AM() { return AM; }, get OKC() { return OKC; },
    get ERR() { return ERR; }, get SUBC() { return SUBC; }, get DIM() { return DIM; }
  };
  root.MotionEngine = api;
  for (const [key, value] of Object.entries(api)) {
    if (key === 'theme' || ['MONO', 'CY', 'BL', 'MG', 'VI', 'GY', 'AM', 'OKC', 'ERR', 'SUBC', 'DIM'].includes(key)) continue;
    if (!(key in root)) root[key] = value;
  }
  for (const key of ['MONO', 'CY', 'BL', 'MG', 'VI', 'GY', 'AM', 'OKC', 'ERR', 'SUBC', 'DIM']) {
    if (!(key in root)) Object.defineProperty(root, key, { configurable: true, get: () => api[key] });
  }
})(globalThis);
