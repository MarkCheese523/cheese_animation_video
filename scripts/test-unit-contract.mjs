// Cheese Motion · 时间单位契约自检（E30）
//
// 为什么要有它：
//   单位写错不报错。一段 12.634 秒的口播写成 `duration: 12634`，播放器安静地
//   把它当成 3.5 小时 —— 没有 lint 拦、没有日志提示。这是最典型的静默错误。
//
// 它盯三件事：
//   ① assets/template/project.schema.json 存在，且 start/duration 标注「秒」、timing 标注「毫秒」
//   ② Schema 的 scene.type 枚举 == scenes.js 的 SCENE_BUILDERS 真实键集
//   ③ 量纲启发式真的拦得住：duration=12634 的 fixture 必须 exit 1 且提示单位
/* rule: E30 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = rel => readFileSync(path.join(repoRoot, rel), 'utf8');

/* ① Schema 存在，且单位写清楚 */
const schemaFile = path.join(repoRoot, 'assets/template/project.schema.json');
assert.ok(existsSync(schemaFile), 'assets/template/project.schema.json 必须存在');
const schema = JSON.parse(read('assets/template/project.schema.json'));
const scene = schema.$defs.scene;
assert.ok(scene, 'Schema 必须定义 $defs.scene');
for (const field of ['id', 'type', 'start', 'duration']) {
  assert.ok(scene.required.includes(field), `Schema 的 scene 必须要求 ${field}`);
}
assert.ok(/秒/.test(scene.properties.start.description), 'start 的 description 必须写明单位是秒');
assert.ok(/秒/.test(scene.properties.duration.description), 'duration 的 description 必须写明单位是秒');
assert.ok(/毫秒/.test(scene.properties.timing.description), 'timing 的 description 必须写明单位是毫秒');
assert.equal(scene.properties.duration.minimum, 0.5, 'duration 的下限应是 0.5 秒');
assert.equal(scene.properties.duration.maximum, 600, 'duration 的上限应是 600 秒（量纲防呆线）');
assert.equal(scene.properties.start.minimum, 0, 'start 的下限应是 0');
assert.equal(scene.properties.timing.additionalProperties.type, 'number', 'timing 的每个值必须是数字（毫秒）');

/* ② type 枚举 == SCENE_BUILDERS 真实键集 */
const scenesSource = read('assets/template/scenes.js');
const motionSource = read('assets/template/motion-sequence.js');
const builders = new Set([
  ...[...scenesSource.matchAll(/^\s{2}([A-Za-z_][\w]*)\s*:\s*\(/gm)].map(m => m[1]),
  ...[...motionSource.matchAll(/SCENE_BUILDERS\.([A-Za-z_][\w]*)\s*=/g)].map(m => m[1])
]);
assert.ok(builders.size >= 6, `SCENE_BUILDERS 键集异常（${builders.size}）`);
assert.deepEqual(
  [...scene.properties.type.enum].sort(),
  [...builders].sort(),
  'Schema 的 scene.type 枚举必须等于 SCENE_BUILDERS 的真实键集'
);

/* ③ 量纲启发式：duration=12634 必须 exit 1 且提示单位 */
const fixture = mkdtempSync(path.join(tmpdir(), 'unit-contract-'));
try {
  for (const name of ['project.json', 'scenes.js', 'subs.js', 'project.schema.json']) {
    const source = path.join(repoRoot, 'assets/template', name);
    if (existsSync(source)) copyFileSync(source, path.join(fixture, name));
  }
  const project = JSON.parse(read('assets/template/project.json'));
  project.scenes[0].duration = 12634;
  writeFileSync(path.join(fixture, 'project.json'), JSON.stringify(project, null, 2), 'utf8');

  const result = spawnSync('python3', [path.join(repoRoot, 'scripts/validate_project.py'), '--project', fixture], {
    encoding: 'utf8'
  });
  assert.notEqual(result.status, 0, 'duration=12634 的工程必须校验失败（exit 1）');
  const output = `${result.stdout}\n${result.stderr}`;
  assert.ok(/毫秒/.test(output), `量纲错误必须提示单位问题，实际输出：\n${output}`);
  assert.ok(/12634/.test(output), '量纲错误必须报出实际数值');

  /* 正常工程必须通过 */
  const good = spawnSync('python3', [path.join(repoRoot, 'scripts/validate_project.py'), '--project', path.join(repoRoot, 'assets/template')], {
    encoding: 'utf8'
  });
  assert.equal(good.status, 0, `模板工程必须校验通过：\n${good.stdout}\n${good.stderr}`);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('PASS 时间单位契约：Schema 标注秒/毫秒、type 枚举与 SCENE_BUILDERS 一致、duration=12634 被量纲启发式拦下');
