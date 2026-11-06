import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class FakeElement {
  constructor(tag, id) {
    this.tagName = tag; this.id = id || ''; this.attributes = {}; this.children = [];
    this.textContent = ''; this.innerHTML = ''; this.style = { setProperty(key, value) { this[key] = value; } };
    this.classList = { values: new Set(), add: value => this.classList.values.add(value) };
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key]; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  get firstElementChild() { return this.children[0]; }
}
const ids = {};
for (const id of ['stage', 'wrap', 'bg', 'world', 'cam', 'sub', 'tc', 'prog', 'play', 're', 'scrub', 'tlabel']) ids[id] = new FakeElement('div', id);
ids.prog.appendChild(new FakeElement('i'));
const gradient = { addColorStop() {} };
const context2d = {
  fillStyle: '', strokeStyle: '', lineWidth: 1,
  fillRect() {}, createRadialGradient() { return gradient; }, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {}
};
ids.bg.getContext = () => context2d;
const document = {
  body: new FakeElement('body'), documentElement: new FakeElement('html'),
  getElementById: id => ids[id] || null,
  createElementNS: (_, tag) => new FakeElement(tag),
  addEventListener() {}
};
const frames = [];
const sandbox = {
  console, document, location: { search: '' }, innerWidth: 540, innerHeight: 960,
  performance: { now: () => 1000 }, requestAnimationFrame: callback => { frames.push(callback); },
  addEventListener() {}, Math, Object, Array, Number, String, JSON, Promise
};
sandbox.window = sandbox;
vm.createContext(sandbox);
const engineSource = fs.readFileSync(new URL('../templates/engine.js', import.meta.url), 'utf8');
vm.runInContext(engineSource, sandbox, { filename: 'engine.js' });
const E = sandbox.MotionEngine;
E.initStage();

// kf 校验:结构、时间递增
assert.throws(() => E.kf(1, null), /kf/, 'kf must reject empty keyframes');
assert.throws(() => E.kf(2.5, [[2, 1], [1, 2]]), /递增/, 'kf must reject non-monotonic times');
assert.equal(E.kf(1, [[0, 0], [2, 10, E.lin]]), 5, 'kf still interpolates valid tracks');
assert.equal(E.SAFE.y1, 1360, 'safe area must match references/stage-layout.md subtitle zone');
assert.equal(E.SAFE.x0, 60, 'safe area side margin must be 60');

// setBox:校验 + 圆角夹紧
const box = E.mk('rect', {}, E.L.main);
E.setBox(box, [300, 400, 200, 100, 80]);
assert.equal(box.getAttribute('x'), '200', 'setBox centers by width');
assert.equal(box.getAttribute('rx'), '50', 'setBox clamps rx to half of the smaller side');
assert.throws(() => E.setBox(box, [300, 400, 200]), /setBox/, 'setBox must reject malformed boxes');

// S:注册即隐藏、命名、校验
const hidden = E.G(E.L.main);
E.S(hidden, 0, 5, () => {}, '测试精灵');
assert.equal(hidden.style.visibility, 'hidden', 'sprites must start hidden until first render');
assert.equal(hidden.getAttribute('data-name'), '测试精灵', 'sprite name must land on the element for lint');
assert.throws(() => E.S(hidden, 5, 5, () => {}), /时间窗/, 'S must reject empty windows');
assert.throws(() => E.S(hidden, 0, 5, 'not-a-function'), /函数/, 'S must reject non-function updaters');

// TX 对象形态:校验 + 渲染
assert.throws(() => E.TX({ x: 0, y: 0, size: 30 }, 0, 5), /text/, 'TX object form must require text');
assert.throws(() => E.TX({ text: '暂停' }, 0, 5), /size/, 'TX object form must require numeric size');
const txg = E.TX({ text: '暂停令', x: 100, y: 200, size: 50, color: '#ff4fd8' }, 0, 5);
assert.equal(txg.children[0].textContent, '暂停令', 'TX object form must render text');

// 人物自带 data-free,lint 跳过画外走进
const fig = E.mkFig(E.L.figs);
assert.equal(fig.g.getAttribute('data-free'), '', 'figures must be exempt from boundary lint');

// lintStatic:字幕与精灵窗口静态检查
const badSubs = [
  [0, 4, '第一行<br>第二行<br>第三行'],
  [3.5, 8, '这是一行明显超过十四个汉字长度的字幕内容呀'],
  [7.5, 12, '与上一条重叠'],
  [12, 11, '结束早于开始']
];
const stray = E.G(E.L.main);
const issues = E.lintStatic({ T0: 0, END: 10, SUBS: badSubs, sprites: [{ el: stray, t0: 20, t1: 30, fn: null }] });
const text = issues.map(([, msg]) => msg).join('\n');
assert.ok(text.includes('超过 2 行'), 'lint must catch subtitles over 2 lines');
assert.ok(text.includes('超过 14 字'), 'lint must catch overlong subtitle lines');
assert.ok(text.includes('重叠'), 'lint must catch subtitle overlap');
assert.ok(text.includes('结束时间'), 'lint must catch inverted subtitle timing');
assert.ok(text.includes('时间窗'), 'lint must catch sprites outside the segment');
assert.equal(E.lintStatic({ T0: 0, END: 10, SUBS: [[0, 4, '合规字幕']], sprites: [] }).length, 0, 'clean input must produce no static issues');

// SHAKE:只在窗口内偏移相机
E.boot({ T0: 0, END: 10, TOTAL: 10, SUBS: [], CAM: [[0, [820, 1]]], SHAKE: [[2, 3, 12]] });
sandbox.renderAt(0.5);
const calm = ids.cam.getAttribute('transform');
sandbox.renderAt(2.5);
const shaking = ids.cam.getAttribute('transform');
assert.ok(calm.startsWith('translate(540 '), 'calm frames must keep camera at 540');
assert.ok(shaking.startsWith('translate(') && !shaking.startsWith('translate(540 '), 'shake frames must offset the camera x');
sandbox.renderAt(5);
assert.equal(ids.cam.getAttribute('transform'), calm, 'camera must recover exactly after the shake window');

console.log('engine-lint: validation, setBox, sprite hiding, TX object form, static lint, data-free and SHAKE OK');
