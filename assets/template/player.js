const NS = 'http://www.w3.org/2000/svg';
const params = new URLSearchParams(location.search);
const svg = document.getElementById('scene');
const sceneRoot = document.getElementById('sceneRoot');
const audio = document.getElementById('audio');
const playButton = document.getElementById('playButton');
const seek = document.getElementById('seek');
const timeLabel = document.getElementById('timeLabel');
const subtitleNode = document.getElementById('subtitle');
const subtitles = typeof SUBTITLES !== 'undefined' ? SUBTITLES : [];
let project;
let W = 1080, H = 1920;
let currentRoot = sceneRoot;
let activeIndex = -1;
let localTime = 0;
let playing = false;
let frameRequest = 0;
let fallbackStarted = 0;
let fallbackOffset = 0;
const builtScenes = [];

function showError(error) {
  const message = error instanceof Error ? error.message : String(error);
  document.body.dataset.playerError = message;
  const panel = document.createElement('pre');
  panel.className = 'player-error';
  panel.textContent = '播放器错误\n' + message;
  document.body.appendChild(panel);
  console.error(error);
}
window.addEventListener('error', event => showError(event.error || event.message));
window.addEventListener('unhandledrejection', event => showError(event.reason));

function el(name, attrs = {}, parent = currentRoot) {
  const node = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  parent.appendChild(node);
  return node;
}
function text(value, attrs = {}, parent = currentRoot) {
  const node = el('text', attrs, parent);
  node.textContent = value;
  return node;
}
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function prog(t, a, b) { return b === a ? Number(t >= b) : clamp((t - a) / (b - a)); }
function out(x) { return 1 - (1 - x) ** 3; }
function inout(x) { return x * x * (3 - 2 * x); }
function back(x) { const c = 1.70158; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; }
function mix(a, b, p) { return a + (b - a) * p; }
function opacity(node, value) { node.setAttribute('opacity', clamp(value)); }
function clock(seconds) { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }

function header(scene, label) {
  const group = el('g', {});
  const index = project.scenes.findIndex(item => item.id === scene.id) + 1;
  text(`${String(index).padStart(2, '0')} / ${label}`, { x: 70, y: 110, class: 'mg-text', 'font-size': 34, 'font-weight': 700, fill: '#102a22' }, group);
  el('line', { x1: 70, y1: 150, x2: W - 70, y2: 150, stroke: '#102a22', 'stroke-opacity': .22, 'stroke-width': 2 }, group);
  return group;
}

const selectedId = params.get('scene') || 'all';
const fixed = params.has('t') ? Number(params.get('t')) : null;
if (params.get('export') === '1') document.body.classList.add('exporting');

function selectedScene() {
  return selectedId === 'all' ? null : project.scenes.find(scene => scene.id === selectedId);
}
function selectedStart() { return selectedScene()?.start || 0; }
function selectedDuration() { return selectedScene()?.duration || (project.scenes.at(-1).start + project.scenes.at(-1).duration); }

function render(local) {
  localTime = Math.max(0, Math.min(selectedDuration(), local));
  const global = selectedStart() + localTime;
  let index;
  if (selectedScene()) index = project.scenes.indexOf(selectedScene());
  else {
    index = 0;
    project.scenes.forEach((scene, sceneIndex) => { if (scene.start <= global + 0.000001) index = sceneIndex; });
  }
  if (index !== activeIndex) {
    builtScenes.forEach((built, builtIndex) => built.group.setAttribute('display', builtIndex === index ? 'inline' : 'none'));
    activeIndex = index;
  }
  const scene = project.scenes[index];
  builtScenes[index].render(Math.max(0, global - scene.start));
  const subtitle = subtitles.find(item => global * 1000 >= item.start && global * 1000 < item.end);
  subtitleNode.textContent = subtitle?.text || '';
  seek.value = Math.round(localTime / selectedDuration() * 1000);
  timeLabel.textContent = `${clock(localTime)} / ${clock(selectedDuration())}`;
}

function stop() {
  playing = false;
  cancelAnimationFrame(frameRequest);
  playButton.textContent = '播放';
}
function tick() {
  if (!playing) return;
  if (project.audio) localTime = audio.currentTime - selectedStart();
  else localTime = fallbackOffset + (performance.now() - fallbackStarted) / 1000;
  if (localTime >= selectedDuration()) {
    render(selectedDuration());
    stop();
    return;
  }
  render(localTime);
  frameRequest = requestAnimationFrame(tick);
}
async function togglePlay() {
  if (playing) {
    audio.pause();
    stop();
    return;
  }
  if (localTime >= selectedDuration()) render(0);
  playing = true;
  playButton.textContent = '暂停';
  if (project.audio) {
    audio.currentTime = selectedStart() + localTime;
    await audio.play();
  } else {
    fallbackOffset = localTime;
    fallbackStarted = performance.now();
  }
  tick();
}

async function init() {
  const response = await fetch('project.json');
  if (!response.ok) throw new Error(`project.json 加载失败：${response.status}`);
  project = await response.json();
  W = project.width || 1080;
  H = project.height || 1920;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const paper = document.getElementById('paper');
  paper.setAttribute('width', W);
  paper.setAttribute('height', H);
  document.title = project.title;
  if (selectedId !== 'all' && !selectedScene()) throw new Error(`未知场景：${selectedId}`);
  const api = { el, text, clamp, prog, out, inout, back, mix, opacity, header, get W() { return W; }, get H() { return H; } };
  const grid = document.getElementById('grid');
  for (let x = 0; x <= W; x += 90) el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#102a22', 'stroke-opacity': .05 }, grid);
  for (let y = 0; y <= H; y += 90) el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#102a22', 'stroke-opacity': .05 }, grid);
  project.scenes.forEach(scene => {
    const group = el('g', { 'data-scene': scene.id }, sceneRoot);
    currentRoot = group;
    const builder = SCENE_BUILDERS[scene.type];
    if (!builder) throw new Error(`未注册的场景类型：${scene.type}`);
    builtScenes.push({ group, render: builder(scene, api) });
  });
  currentRoot = sceneRoot;
  if (project.audio) audio.src = project.audio;
  playButton.addEventListener('click', () => togglePlay().catch(showError));
  seek.addEventListener('input', () => {
    stop();
    audio.pause();
    render(Number(seek.value) / 1000 * selectedDuration());
    if (project.audio) audio.currentTime = selectedStart() + localTime;
  });
  window.__seek = seconds => { stop(); audio.pause(); render(seconds); };
  render(fixed === null ? 0 : fixed);
}
init().catch(showError);
