// Cheese Motion · 场景类型文档一致性自检
//
// 这条测试存在的理由：
//   旧版 `references/page-types.md` 文档化 11 个页型，真实注册的只有 5+1 个，
//   交集仅 `end`；注册表的名字（SCENE_BUILDERS）与位置（scenes.js）也写错了。
//   文档腐烂不报错，只是让人照着一张不存在的表写配置 —— 必须有机器盯着。
//
// 它盯三件事：
//   ① 文档顶部的机器可读类型清单 == SCENE_BUILDERS 的真实键集（＋ motionSequence）
//   ② 反向：每个已注册的类型在文档里都有对应小节
//   ③ 文档里出现的每个 type 字符串都能在注册表里找到，且不残留把毫秒当秒的样板
/* rule: E34 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const docFile = path.join(repoRoot, 'references/scene-types.md');
const scenesFile = path.join(repoRoot, 'assets/template/scenes.js');
const motionFile = path.join(repoRoot, 'assets/template/motion-sequence.js');

assert.ok(existsSync(docFile), 'references/scene-types.md 必须存在');
assert.ok(existsSync(scenesFile), 'assets/template/scenes.js 必须存在');

const doc = readFileSync(docFile, 'utf8');
const scenesSource = readFileSync(scenesFile, 'utf8');
const motionSource = readFileSync(motionFile, 'utf8');

/* ---------- 读取真实注册表 ---------- */

/* SCENE_BUILDERS = { counter: (scene, api) => {...}, ... } —— 取对象字面量里的键 */
const builderKeys = new Set(
  [...scenesSource.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*)\s*:\s*\(\s*scene\s*,\s*api\s*\)\s*=>/gm)]
    .map(match => match[1])
);
/* motion-sequence.js：SCENE_BUILDERS.motionSequence = (scene, api) => {...} */
for (const match of motionSource.matchAll(/SCENE_BUILDERS\.([A-Za-z][A-Za-z0-9]*)\s*=/g)) {
  builderKeys.add(match[1]);
}
assert.ok(builderKeys.size >= 6, `SCENE_BUILDERS 键集读得太少（${builderKeys.size}）：源码结构可能变了`);

/* ---------- 读取文档顶部的机器可读清单 ---------- */

const listMatch = doc.match(/^SCENE_TYPES:\s*(.+)$/m);
assert.ok(listMatch, 'references/scene-types.md 顶部必须有一行「SCENE_TYPES: a, b, c」供 CI 核对');
const docTypes = listMatch[1].split(',').map(item => item.trim()).filter(Boolean);
assert.ok(docTypes.length >= 6, `文档类型清单条目过少（${docTypes.length}）`);
assert.equal(new Set(docTypes).size, docTypes.length, '文档类型清单里出现重复类型');

/* ---------- ① 清单 == 真实注册表 ---------- */

const expected = [...builderKeys].sort();
assert.deepEqual([...docTypes].sort(), expected,
  `文档类型清单与真实注册表不一致：\n  文档：${docTypes.join(', ')}\n  源码：${expected.join(', ')}`);

/* ---------- ② 反向：每个已注册类型都有小节 ---------- */

for (const type of expected) {
  const section = new RegExp(`^##\\s+\`?${type}\`?\\b`, 'm');
  assert.ok(section.test(doc), `已注册类型 ${type} 在 references/scene-types.md 里没有对应小节`);
}

/* ---------- ③ 文档里的 type 字符串都在注册表里 ---------- */

for (const match of doc.matchAll(/["']?type["']?\s*:\s*["']([A-Za-z][A-Za-z0-9]*)["']/g)) {
  assert.ok(builderKeys.has(match[1]),
    `文档里出现了未注册的场景类型 ${match[1]}（SCENE_BUILDERS 只有：${expected.join(', ')}）`);
}

/* ---------- ④ 不得残留把毫秒当秒的样板 ---------- */

assert.ok(!doc.includes('12634'),
  '文档里还有「duration: 12634」这类把毫秒当秒的样板（duration 单位是秒）');
assert.match(doc, /duration[^\n]*秒/, '文档必须写明 duration 的单位是秒');
assert.match(doc, /timing[^\n]*毫秒/, '文档必须写明 timing 的单位是毫秒');

/* ---------- ⑤ 每个类型的 props 字段都能在对应源码里找到出处 ---------- */

const SOURCE_OF = {
  counter: scenesSource, flow: scenesSource, compare: scenesSource,
  reveal: scenesSource, end: scenesSource, motionSequence: motionSource
};

function sectionOf(type) {
  const start = doc.search(new RegExp(`^##\\s+\`?${type}\`?\\b`, 'm'));
  assert.ok(start >= 0, `找不到 ${type} 的小节`);
  const rest = doc.slice(start + 1);
  const next = rest.search(/^##\s+/m);
  return next < 0 ? rest : rest.slice(0, next);
}

for (const type of expected) {
  const section = sectionOf(type);
  const heading = /^###\s*props[^\n]*$/m.exec(section);
  assert.ok(heading, `${type} 的小节缺少「### props 字段」表`);
  const afterHeading = section.slice(heading.index + heading[0].length);
  const nextHeading = afterHeading.search(/^###\s+/m);
  const propsBlock = nextHeading < 0 ? afterHeading : afterHeading.slice(0, nextHeading);
  const source = SOURCE_OF[type];
  assert.ok(source, `${type} 没有登记源码出处`);
  const rows = propsBlock.split('\n').filter(line => /^\|/.test(line));
  assert.ok(rows.length >= 3, `${type} 的 props 表至少要有一行字段`);
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length < 4) continue;                       // 表头 / 分隔行
    if (/^-+$/.test(cells[0].replace(/`/g, ''))) continue;
    const field = cells[0].replace(/`/g, '').trim();
    if (!field || !/^[A-Za-z][A-Za-z0-9.\[\]]*$/.test(field)) continue;
    for (const segment of field.split('.').map(part => part.replace(/\[\]$/, ''))) {
      assert.ok(new RegExp(`\\b${segment}\\b`).test(source),
        `${type} 的 props 字段「${field}」里的「${segment}」在源码里找不到出处`);
    }
  }
}

/* ---------- ⑥ motionSequence 的三档强度与取值必须写对 ---------- */

const motionSection = sectionOf('motionSequence');
for (const intensity of ['subtle', 'balanced', 'showreel']) {
  assert.ok(motionSection.includes(intensity), `motionSequence 小节没有写 ${intensity} 档`);
}
for (const [intensity, amplitude, damping] of [['subtle', '0.65', '0.72'], ['balanced', '1', '0.46'], ['showreel', '1.35', '0.34']]) {
  const row = motionSection.split('\n').find(line => line.includes(`\`${intensity}\``) && line.includes(amplitude) && line.includes(damping));
  assert.ok(row, `motionSequence 的 ${intensity} 档 amplitude=${amplitude} / damping=${damping} 与源码不一致`);
}

console.log(`PASS 场景类型文档：${expected.length} 个类型（${expected.join(', ')}）与 SCENE_BUILDERS 一致，props 字段出处可追溯`);
