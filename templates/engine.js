/* =====================================================================
 * Cheese Motion continuous-stage engine v2.1
 * One SVG stage, deterministic Sprite windows, Carry helpers and 2.5D.
 * Classic browser script: initStage() -> build sprites -> boot({...}).
 * Node tests may evaluate this file in a VM and use global MotionEngine.
 *
 * v2.1 加固:参数校验抛错(setBox/kf/S/TX 对象形态)、Sprite 默认隐藏、
 * SHAKE 震屏、data-free 豁免、?lint 自动检查(静态+动态采样)、错误面板。
 * ===================================================================== */
(function attachMotionEngine(root) {
  'use strict';

  const W = 1080, H = 1920, D = Math.PI / 180;
  const NS = 'http://www.w3.org/2000/svg';
  /** 安全区:与 references/stage-layout.md 一致。左右边距 60,字幕区 1360 以下禁止元素进入。 */
  const SAFE = Object.freeze({ x0: 60, x1: 1020, y0: 0, y1: 1360 });
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
    if (!Array.isArray(K) || !K.length || !Array.isArray(K[0]))
      throw new Error('kf: 关键帧必须是 [[t, 值, 缓动?], ...]，收到 ' + JSON.stringify(K));
    if (t <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i += 1) {
      const [t0, v0] = K[i], [t1, v1, easing] = K[i + 1];
      if (!(t1 > t0)) throw new Error(`kf: 关键帧时间必须递增(${t0} → ${t1})`);
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
  const S = (el, t0, t1, fn, name) => {
    if (el != null && typeof el.setAttribute !== 'function') throw new Error('S: 第一个参数必须是 SVG 元素' + (name ? `(${name})` : ''));
    if (!(t1 > t0)) throw new Error(`S: 时间窗无效 ${t0}–${t1}` + (name ? `(${name})` : ''));
    if (fn != null && typeof fn !== 'function') throw new Error('S: 每帧更新必须是函数' + (name ? `(${name})` : ''));
    /* 量纲防呆：时间窗超过 600 秒基本是把毫秒写成了秒。不抛错（会打断渲染），
       只警告一次 —— 静默渲染 3.5 小时比崩溃更难查。规则 E30 / E31。 */
    if (t1 - t0 > 600 && t1 < 1e6 && typeof console !== 'undefined' && !S.__dimensionWarned) {
      S.__dimensionWarned = true;
      console.warn(`[engine] 精灵时间窗 ${t0}–${t1}（跨度 ${(t1 - t0).toFixed(1)} 秒）超过 600 秒 —— 疑似把毫秒写成了秒`);
    }
    if (el && el.style) el.style.visibility = 'hidden';
    if (el && name) el.setAttribute('data-name', name);
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
    if (value && typeof value === 'object') {
      const spec = value, bt0 = x, bt1 = y;
      if (typeof spec.text !== 'string') throw new Error('TX: text 必须是字符串，收到 ' + JSON.stringify(spec));
      if (typeof spec.size !== 'number' || Number.isNaN(spec.size)) throw new Error('TX: size 必须是数字，收到 ' + JSON.stringify(spec));
      const g = G(spec.par || L.labels);
      T(g, spec.text, 0, 0, spec.size, spec.color || THEME.text, spec);
      const px = spec.x ?? 0, py = spec.y ?? 0;
      act(g, bt0, bt1, { x: px, y: [[bt0, py + 18], [bt0 + .35, py, eo]], o: io(bt0, bt1, .25), s: spec.scale ?? 1, r: spec.r ?? 0 });
      return g;
    }
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
    const g = G(parent, { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'data-free': '' });
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
  /** 世界坐标盒子写入:[cx,cy,w,h,rx] 五个数字,rx 自动夹紧。会变形的元素配合 kf 使用。 */
  function setBox(el, box) {
    if (!Array.isArray(box) || box.length !== 5 || box.some(value => typeof value !== 'number' || Number.isNaN(value)))
      throw new Error('setBox: 盒子必须是 [cx,cy,w,h,rx] 五个数字，收到 ' + JSON.stringify(box));
    const [cx, cy, bw, bh, rx] = box;
    at(el, { x: cx - bw / 2, y: cy - bh / 2, width: Math.max(0, bw), height: Math.max(0, bh), rx: clamp(rx, 0, Math.max(0, Math.min(bw, bh) / 2)) });
    return el;
  }
  /** K = [[t,[x,y,w,h,rx,opacity?]], ...], all values in the rect's parent coordinates. */
  function morphRect(el, t0, t1, K, fn) {
    S(el, t0, t1, t => {
      const state = kf(t, K);
      if (!Array.isArray(state) || state.length < 5) throw new Error('morphRect: 形态必须是 [x,y,w,h,rx,opacity?]，收到 ' + JSON.stringify(state));
      const [x, y, w, h, rx, opacity = 1] = state;
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

  /* ------------------------- Lint 自动检查 ------------------------- */
  const vlen = value => [...String(value).replace(/<[^>]+>/g, '')].reduce((sum, ch) => sum + (/[\x00-\xff]/.test(ch) ? .5 : 1), 0);
  function effOp(el) {
    let value = 1;
    for (let node = el; node && node.id !== 'cam'; node = node.parentNode) {
      const attr = node.getAttribute && node.getAttribute('opacity');
      if (attr != null) value *= +attr;
    }
    return value;
  }
  function lintDesc(el) {
    if (!el || !el.tagName) return '逻辑精灵';
    if (el.tagName === 'text') return `文字「${String(el.textContent).slice(0, 14)}」`;
    const owner = typeof el.closest === 'function' ? el.closest('[data-name]') : null;
    return `${el.tagName}${owner ? `(${owner.getAttribute('data-name')})` : ''}`;
  }
  /** 静态检查:不依赖 DOM 测量,可在 Node VM 中运行。返回按时间排序的 [[时间, 问题], ...]。 */
  function lintStatic({ T0 = 0, END = 0, SUBS = [], sprites = SPR } = {}) {
    const issues = [];
    const seen = new Set();
    const add = (t, key, msg) => { if (!seen.has(key)) { seen.add(key); issues.push([t, msg]); } };
    SUBS.forEach((item, index) => {
      const lines = String(item[2]).split('<br>');
      if (lines.length > 2) add(item[0], `sub-lines-${index}`, `字幕超过 2 行:${lines.join('')}`);
      lines.forEach((line, lineIndex) => { if (vlen(line) > 14.5) add(item[0], `sub-len-${index}-${lineIndex}`, `字幕单行超过 14 字:${line}`); });
      if (!(item[1] > item[0])) add(item[0], `sub-time-${index}`, '字幕结束时间必须大于开始时间');
      if (index && item[0] < SUBS[index - 1][1] - 1e-3) add(item[0], `sub-overlap-${index}`, '字幕时间与上一条重叠');
    });
    sprites.forEach((sprite, index) => {
      if (sprite.t1 < T0 || sprite.t0 > END) add(sprite.t0, `win-${index}`, `精灵时间窗不在本段范围内:${lintDesc(sprite.el)}`);
    });
    return issues.sort((a, b) => a[0] - b[0]);
  }
  /** 结果面板:列出问题,点击某一条跳转到对应时间。 */
  function showPanel(items, title) {
    if (typeof document === 'undefined' || !document.createElement) return;
    let panel = document.getElementById('lintPanel');
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'lintPanel';
      panel.style.cssText = 'position:fixed;right:10px;top:10px;width:440px;max-height:75vh;overflow:auto;background:rgba(12,12,12,.94);color:#fff;font:13px/1.5 Consolas,monospace;padding:10px 12px;border:1px solid #ed6a5a;z-index:99';
      document.body.appendChild(panel);
    }
    const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    panel.innerHTML = `<b>${esc(title)}</b>` + (items.length
      ? items.map(([t, msg]) => `<div data-t="${t}" style="cursor:pointer;border-top:1px solid #333;padding:3px 0">${(+t).toFixed(2)}s · ${esc(msg)}</div>`).join('')
      : '<div style="color:#8f8">✓ 没有发现问题</div>');
    panel.onclick = event => {
      const t = event.target && event.target.dataset && event.target.dataset.t;
      if (t == null || !root.renderAt) return;
      root.renderAt(+t);
      const scrub = document.getElementById('scrub');
      if (scrub) scrub.value = t;
    };
  }
  /** 动态采样检查:每 0.25s 渲染一帧做几何测量,仅浏览器 ?lint 模式运行。 */
  function runLint(render, T0, END, SUBS, back0) {
    const issues = lintStatic({ T0, END, SUBS });
    const seen = new Set(issues.map(([, msg]) => msg));
    const add = (t, key, msg) => { if (!seen.has(key)) { seen.add(key); issues.push([t, msg]); } };
    const stage = document.getElementById('stage');
    const selector = '#cam text,#cam rect,#cam circle,#cam ellipse,#cam path,#cam polyline,#cam line,#cam image';
    for (let t = T0; t <= END + 1e-6; t += .25) {
      render(t);
      const sb = stage.getBoundingClientRect(), scale = sb.width / W;
      const box = el => { const r = el.getBoundingClientRect(); return { x: (r.left - sb.left) / scale, y: (r.top - sb.top) / scale, w: r.width / scale, h: r.height / scale }; };
      const shown = [...document.querySelectorAll(selector)].filter(el => getComputedStyle(el).visibility === 'visible' && effOp(el) > .3);
      const texts = [];
      shown.forEach(el => {
        if (typeof el.closest === 'function' && el.closest('[data-free]')) return;
        const b = box(el); if (b.w < 1 && b.h < 1) return;
        if (b.x < SAFE.x0 - 1 || b.x + b.w > SAFE.x1 + 1 || b.y < SAFE.y0 - 1 || b.y + b.h > SAFE.y1 + 1)
          add(t, `out-${lintDesc(el)}`, `越界或进入字幕区:${lintDesc(el)} 位于 x ${b.x | 0}–${(b.x + b.w) | 0}, y ${b.y | 0}–${(b.y + b.h) | 0}`);
        if (el.tagName === 'text' && String(el.textContent).trim()) texts.push({ el, b });
      });
      for (let i = 0; i < texts.length; i += 1) for (let j = i + 1; j < texts.length; j += 1) {
        const A = texts[i].b, B = texts[j].b;
        const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x));
        const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
        if (ix * iy > .25 * Math.min(A.w * A.h, B.w * B.h)) add(t, `ov-${lintDesc(texts[i].el)}-${lintDesc(texts[j].el)}`, `文字重叠:${lintDesc(texts[i].el)} × ${lintDesc(texts[j].el)}`);
      }
      if (texts.length > 10) add(t, `many-${Math.floor(t * 4)}`, `同屏文字 ${texts.length} 处,超过 10 处`);
      SPR.forEach(sprite => {
        if (!sprite.el || getComputedStyle(sprite.el).visibility !== 'visible') return;
        for (let node = sprite.el.parentNode; node && node.id !== 'cam'; node = node.parentNode)
          if (node.style && node.style.visibility === 'hidden') { add(t, `hid-${lintDesc(sprite.el)}`, `父组已隐藏,子精灵仍在显示:${lintDesc(sprite.el)}`); break; }
      });
    }
    render(back0);
    issues.sort((a, b) => a[0] - b[0]);
    showPanel(issues, issues.length ? `✗ 检查发现 ${issues.length} 个问题(点击跳转)` : '检查结果');
    if (typeof console !== 'undefined') console.table(issues.map(([t, msg]) => ({ 时间: (+t).toFixed(2), 问题: msg })));
  }

  function boot({ T0, END, TOTAL = END, SUBS = [], CAM = [[0, [820, 1]]], theme, audio, audioOffset = T0, SHAKE = [] }) {
    if (theme) applyTheme(theme);
    const ctx = $('bg').getContext('2d'), cam = $('cam'), sub = $('sub');
    const EXPORT = /(?:\?|&)export(?:=|&|$)/.test(location.search);
    if (EXPORT) document.body.classList.add('export');
    const audioEl = typeof audio === 'string' ? $(audio) : audio;
    let lastSub = -2;

    function render(t) {
      const [cy, zoom] = kf(t, CAM);
      let shake = 0;
      SHAKE.forEach(([a, b, amp]) => { if (t > a && t < b) shake += Math.sin((t - a) * 95) * amp * (1 - p(t, a, b)); });
      drawBG(ctx, t, cy, zoom);
      cam.setAttribute('transform', `translate(${540 + shake} 820) scale(${zoom}) translate(-540 ${-cy})`);
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
    if (/[?&]lint/.test(location.search)) {
      const schedule = typeof setTimeout === 'function' ? fn => setTimeout(fn, 200) : fn => fn();
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => schedule(() => runLint(render, T0, END, SUBS, cur)));
    }
    return { render, sprites: SPR };
  }

  const api = {
    W, H, D, NS, DEFAULT_THEME, SAFE, L, SPR, initStage, S, upd, act, V, kf, route,
    clamp, p, lin, eo, eio, back, lerpA, qb, op, at, setL, mk, txt, G, rect, T, TM,
    pill, P, TX, LN, CNT, icon, door, makeHub, mkFig, poseFig, figAct, figHand,
    imgCard, imgMark, morphRect, setBox, zoomThrough, hop, gather, emit, scatter, unroll,
    bend, retract, project, depthScale, snapshotState, applyTheme, boot, io, ps,
    vlen, lintStatic, runLint, showPanel,
    get theme() { return THEME; }, get MONO() { return MONO; }, get CY() { return CY; },
    get BL() { return BL; }, get MG() { return MG; }, get VI() { return VI; },
    get GY() { return GY; }, get AM() { return AM; }, get OKC() { return OKC; },
    get ERR() { return ERR; }, get SUBC() { return SUBC; }, get DIM() { return DIM; }
  };
  root.MotionEngine = api;
  if (typeof root.addEventListener === 'function') {
    root.addEventListener('error', event => showPanel([[0, `脚本错误:${(event.error && event.error.message) || event.message || '未知错误'}`]], '✗ 运行出错'));
  }
  for (const [key, value] of Object.entries(api)) {
    if (key === 'theme' || ['MONO', 'CY', 'BL', 'MG', 'VI', 'GY', 'AM', 'OKC', 'ERR', 'SUBC', 'DIM'].includes(key)) continue;
    if (!(key in root)) root[key] = value;
  }
  for (const key of ['MONO', 'CY', 'BL', 'MG', 'VI', 'GY', 'AM', 'OKC', 'ERR', 'SUBC', 'DIM']) {
    if (!(key in root)) Object.defineProperty(root, key, { configurable: true, get: () => api[key] });
  }
})(globalThis);
