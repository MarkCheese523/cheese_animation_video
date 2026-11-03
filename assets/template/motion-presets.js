/* Reusable, deterministic motion primitives. Every value is a pure function of time. */
const MotionPresets = (() => {
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const prog = (t, start, duration) => duration <= 0 ? Number(t >= start) : clamp((t - start) / duration);
  const mix = (a, b, p) => a + (b - a) * p;
  const out = x => 1 - (1 - clamp(x)) ** 3;
  const inout = x => { const p = clamp(x); return p * p * (3 - 2 * p); };
  const spring = (x, damping = .46, frequency = 13) => {
    const p = clamp(x);
    if (p === 0 || p === 1) return p;
    const w = frequency * Math.sqrt(1 - damping * damping);
    return 1 - Math.exp(-damping * frequency * p) * (Math.cos(w * p) + damping * frequency / w * Math.sin(w * p));
  };
  const enter = (t, start, duration = .6, curve = out) => curve(prog(t, start, duration));
  const springEnter = (t, start, duration = .8, damping, frequency) => spring(prog(t, start, duration), damping, frequency);
  const maskReveal = (t, start, duration = .65) => out(prog(t, start, duration));
  const drawOn = (t, start, duration = .8) => inout(prog(t, start, duration));
  const morph = (t, start, duration = .7) => spring(prog(t, start, duration), .58, 11);
  const reflow = (t, start, duration = .85) => spring(prog(t, start, duration), .62, 10);
  const press = (t, pressAt, releaseAt, depth = .94) => {
    if (t < pressAt || t >= releaseAt + .28) return 1;
    if (t < releaseAt) return mix(1, depth, out(prog(t, pressAt, .1)));
    return mix(depth, 1, spring(prog(t, releaseAt, .28), .42, 15));
  };
  const counterRoll = (t, start, duration, from, to) => mix(from, to, inout(prog(t, start, duration)));
  const stateFlip = (t, start, duration = .65) => inout(prog(t, start, duration));
  const logoResolve = (t, start, duration = .9) => spring(prog(t, start, duration), .5, 12);
  const stagger = (index, gap = .12) => index * gap;
  const makeTimeline = configured => {
    const canonical = [
      { id: 'gather', label: '聚合', start: 0, duration: 3, action: 'component-gather' },
      { id: 'trigger', label: '点击', start: 3, duration: 4, action: 'cursor-click' },
      { id: 'split', label: '拆分', start: 7, duration: 5, action: 'component-flow' },
      { id: 'switch', label: '切换', start: 12, duration: 4.75, action: 'state-reflow' },
      { id: 'resolve', label: '归位', start: 16.75, duration: 3.25, action: 'logo-resolve' }
    ];
    let start = 0;
    const beats = canonical.map((base, index) => {
      const source = Array.isArray(configured) && configured[index]?.id === base.id ? configured[index] : base;
      const duration = Number(source.duration) >= 1 && Number(source.duration) <= 12 ? Number(source.duration) : base.duration;
      const beat = { ...base, label: source.label || base.label, action: source.action || base.action, duration, start, canonicalStart: base.start, canonicalDuration: base.duration };
      start += duration;
      return beat;
    });
    const indexAt = t => Math.max(0, beats.findIndex((beat, index) => t < beat.start + beat.duration || index === beats.length - 1));
    const warp = t => {
      const beat = beats[indexAt(t)];
      return beat.canonicalStart + clamp((t - beat.start) / beat.duration) * beat.canonicalDuration;
    };
    return { beats, indexAt, warp, action: id => beats.find(beat => beat.id === id)?.action };
  };
  return { clamp, prog, mix, out, inout, spring, enter, springEnter, maskReveal, drawOn, morph, reflow, press, counterRoll, stateFlip, logoResolve, stagger, makeTimeline };
})();
