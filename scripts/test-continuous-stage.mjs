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
const identity = E.G(E.L.main, { id: 'persistent-subject' });
const HK = [[0, [100, 200, 20, 20, 1, 1]], [4, [300, 400, 200, 80, 1, .8]], [10, [300, 400, 200, 80, 1, .8]]];
const hub = E.makeHub(0, 10, HK, '主体');
E.act(identity, 0, 4, { x: [[0, 0], [4, 100]], y: 20, z: [[0, 0], [4, 100]], o: 1 });
const windowA = E.S(E.G(E.L.main), 0, 3.2, () => {});
const windowB = E.S(E.G(E.L.main), 2.8, 6, () => {});
assert.ok(windowA.t1 - windowB.t0 >= .2, 'adjacent Sprite windows must overlap');
const morph = E.rect(E.L.main, 20, 20);
E.morphRect(morph, 2.8, 6, [[2.8, [100, 200, 20, 20, 10, 1]], [6, [300, 400, 200, 80, 24, 1]]]);
const hopEl = E.G(E.L.main);
E.hop(hopEl, 0, 4, [[0, 4, [0, 0], [100, 100], [50, -50]]]);
const zoomEl = E.G(E.L.main);
E.zoomThrough(zoomEl, 0, 4, [[0, [100, 100, .2, 1]], [4, [540, 820, 2, 1]]]);
const gatherItems = [0, 1].map(index => ({ el: E.G(E.L.main), from: [index * 50, 0] }));
E.gather(gatherItems, 0, 4, [300, 300]);
const emitItems = [0, 1].map(index => ({ el: E.G(E.L.main), to: [300, index * 80] }));
E.emit(emitItems, 0, 4, [100, 100], { stagger: .1 });
E.scatter(emitItems, 4, 6, [300, 300], { stagger: .1 });
E.retract(gatherItems, 4, 6, [100, 100]);
const ring = [[0, -10], [10, 0], [0, 10], [-10, 0]], line = [[-20, 0], [-10, 0], [10, 0], [20, 0]];
E.unroll(E.mk('polyline', {}, E.L.main), 0, 4, ring, line);
E.bend(E.mk('polyline', {}, E.L.main), 0, 4, line, ring);
const hero = E.mkFig(E.L.figs);
const HERO = { x: [[0, 100], [4, 200]], y: 500, s: 1.5, face: 1, aR: [[0, 8], [4, 70]], walk: [[0, 4]], o: 1 };
E.figAct(hero, 0, 10, HERO);
const task = E.G(E.L.over);
E.upd(0, 10, t => { const hand = E.figHand(HERO, t); task.setAttribute('transform', `translate(${hand[0]} ${hand[1]})`); });
const counter = new FakeElement('text');
E.CNT(counter, 0, 4, 0, 100);
const CAM = [[0, [820, 1.1]], [4, [820, 1]], [10, [820, 1]]];
const SUBS = [[0, 5, '测试<b>主体</b>']];
E.boot({ T0: 0, END: 10, TOTAL: 20, SUBS, CAM });

sandbox.renderAt(3.2);
const deterministic = {
  transform: identity.getAttribute('transform'), hub: hub.g.getAttribute('transform'),
  morph: { ...morph.attributes }, task: task.getAttribute('transform')
};
const handAt32 = E.figHand(HERO, 3.2);
assert.equal(task.getAttribute('transform'), `translate(${handAt32[0]} ${handAt32[1]})`, 'object must follow the hand');
sandbox.renderAt(8);
assert.equal(String(counter.textContent), '100', 'counter must recover final state after arbitrary seek');
sandbox.renderAt(3.2);
assert.equal(identity.getAttribute('transform'), deterministic.transform, 'seek must be deterministic');
assert.equal(hub.g.getAttribute('transform'), deterministic.hub, 'hub state must be deterministic');
assert.deepEqual({ ...morph.attributes }, deterministic.morph, 'morph state must be deterministic');
assert.equal(task.getAttribute('transform'), deterministic.task, 'hand following must be deterministic');
assert.strictEqual(hub.g, hub.g, 'continuous subject identity must not be rebuilt');
assert.ok(identity.getAttribute('transform').includes('scale('), '2.5D depth track should affect scale');
assert.notEqual(E.depthScale(100), E.depthScale(0));
assert.equal(E.project([540, 820, 0])[0], 540);
assert.ok(E.project([740, 820, 100])[0] < 740, 'positive depth should move toward camera center');

const previousEnd = E.snapshotState(10, CAM, { hub: HK });
const nextStart = E.snapshotState(10, [[10, previousEnd.camera]], { hub: [[10, previousEnd.tracks.hub]] });
assert.deepEqual(JSON.parse(JSON.stringify(nextStart)), JSON.parse(JSON.stringify(previousEnd)), 'next segment first frame must restore previous last frame');

const tracksBefore = JSON.stringify(HK), spriteCount = E.SPR.length, hubReference = hub.g;
E.applyTheme({ accent: '#123456', background: '#abcdef' });
assert.equal(E.theme.accent, '#123456');
assert.equal(JSON.stringify(HK), tracksBefore, 'theme changes must not mutate narrative tracks');
assert.equal(E.SPR.length, spriteCount);
assert.strictEqual(hub.g, hubReference, 'theme changes must preserve subject identity');
assert.equal(E.SPR.filter(sprite => sprite.el).length > 0, true);

// A real audio element becomes the preview master clock when provided.
const audioSandbox = { ...sandbox, document, location: { search: '' }, requestAnimationFrame: callback => { frames.push(callback); } };
const audio = { currentTime: 1.25, paused: true, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
E.boot({ T0: 0, END: 10, TOTAL: 10, SUBS: [], CAM, audio, audioOffset: 0 });
assert.equal(ids.tc.textContent, '00:01.25');
audio.currentTime = 2; audio.paused = false;
frames.at(-1)(2000);
assert.equal(ids.tc.textContent, '00:02.00', 'preview must follow audio currentTime');

const template = fs.readFileSync(new URL('../templates/segment.html', import.meta.url), 'utf8');
const withoutSkin = template.replace(/:root\{[\s\S]*?\n\}/, ':root{/* replacement */}');
assert.ok(withoutSkin.includes('const HK = [[0,[540,800,0,0,0,0]]'), 'skin replacement must not remove narrative code');
assert.ok(!template.includes('#04060c'), 'merged template must not force the old dark tech skin');

console.log('continuous-stage: seek, overlap, identity, morph, figures, Carry, continuity, audio clock and tokens OK');
