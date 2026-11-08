// Cheese Motion · 视觉隐喻词典自检
//
// 这条测试存在的理由：
//   全仓库原本**没有任何「概念 → 画法」的映射表**（grep -rln "隐喻\|概念.*画法" 零命中），
//   于是执行模型每拍都在现场发明视觉比喻 —— 同一句「监管」这期画成栅栏、下期画成锁，
//   旁白和画面对不上，返工时也说不清哪一版才对（CASE-16 的根子）。
//
//   更贵的是：写下来的画法可能**引用不存在的 helper**。
//   隐喻文档里的 `morphRect`、`gather`、`imgCard` 必须真的在 templates/engine.js 或
//   templates/kit/*.js 里 —— 否则这份词典是幻觉词典，比没有词典更坏。
//
// 它盯四件事：
//   ① 词典条目数足够（≥20），且主表与顶部机器可读清单逐条对齐
//   ② 主表每一行的「用到的组件/helper」都能在真实源码里找到出处
//   ③ 主表每一行的「对应视觉动词」都来自 references/visual-verbs.md 的 20 个动词
//   ④ **整篇文档里出现的 helper 名 / 动词名都不能是幻觉**（重点项）
/* rule: E32 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const docFile = path.join(repoRoot, 'references/visual-metaphors.md');
const verbsFile = path.join(repoRoot, 'references/visual-verbs.md');
const engineFile = path.join(repoRoot, 'templates/engine.js');
const kitDir = path.join(repoRoot, 'templates/kit');

assert.ok(existsSync(docFile), 'references/visual-metaphors.md 必须存在');
assert.ok(existsSync(verbsFile), 'references/visual-verbs.md 必须存在');
assert.ok(existsSync(engineFile), 'templates/engine.js 必须存在');
assert.ok(existsSync(kitDir), 'templates/kit 必须存在');

const doc = readFileSync(docFile, 'utf8');
const verbsDoc = readFileSync(verbsFile, 'utf8');

/* ---------- 读取真实动词清单（references/visual-verbs.md 的机器可读块） ---------- */

const verbsBlock = verbsDoc.match(/<!-- visual-verbs:begin -->([\s\S]*?)<!-- visual-verbs:end -->/);
assert.ok(verbsBlock, 'references/visual-verbs.md 必须有 <!-- visual-verbs:begin --> 机器可读块');
const VERBS = new Set(
  verbsBlock[1].split(',').map(item => item.trim()).filter(Boolean)
);
assert.ok(VERBS.size === 20, `视觉动词清单读到了 ${VERBS.size} 个，必须正好是 20 个`);

/* ---------- 收集真实存在的 helper 名（引擎 + kit 的声明面） ---------- */

const kitFiles = readdirSync(kitDir).filter(name => name.endsWith('.js')).map(name => path.join(kitDir, name));
const sources = [engineFile, ...kitFiles];

/** 从源码里抽出「声明出来的名字」：函数、变量、导出、以及 api / Kit 对象字面量的键。 */
function declaredNames(source) {
  const names = new Set();
  const add = name => { if (name) names.add(name); };
  for (const match of source.matchAll(/(?:^|[\s;{(])(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) add(match[1]);
  for (const match of source.matchAll(/(?:^|[\s;{(])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) add(match[1]);
  for (const match of source.matchAll(/\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) add(match[1]);
  for (const match of source.matchAll(/\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(match[1]);
  for (const match of source.matchAll(/\bKit\.([A-Za-z_$][\w$]*)\s*=/g)) add(match[1]);
  /* 对象字面量的键：api = { ... } / root.Kit = { ... } / MARKER = { ... } */
  for (const match of source.matchAll(/=\s*\{([\s\S]*?)\n\s*\};/g)) {
    for (const key of match[1].matchAll(/(?:^|[{,\n])\s*([A-Za-z_$][\w$]*)\s*[:,]/g)) add(key[1]);
  }
  return names;
}

const HELPERS = new Set();
for (const file of sources) for (const name of declaredNames(readFileSync(file, 'utf8'))) HELPERS.add(name);
assert.ok(HELPERS.size >= 80, `从源码里只读到 ${HELPERS.size} 个声明名，抽取方式可能失效了`);

/* ---------- 读取文档顶部机器可读清单 ---------- */

const manifestBlock = doc.match(/<!-- visual-metaphors:begin -->([\s\S]*?)<!-- visual-metaphors:end -->/);
assert.ok(manifestBlock, 'references/visual-metaphors.md 必须有 <!-- visual-metaphors:begin --> 机器可读清单');
const manifest = manifestBlock[1]
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('<!--'))
  .map(line => {
    const cut = line.indexOf('|');
    assert.ok(cut > 0, `机器可读清单的行没有「概念|画法」两字段：${line}`);
    return { concept: line.slice(0, cut).trim(), draw: line.slice(cut + 1).trim() };
  });
assert.ok(manifest.length >= 20, `视觉隐喻词典条目过少（${manifest.length}），至少要 20 条`);

/* ---------- 读取主表 ---------- */

const mainSection = doc.split('## 主表')[1];
assert.ok(mainSection, 'references/visual-metaphors.md 必须有「## 主表」小节');
const tablePart = mainSection.split('## 语义反相禁用表')[0];

const rows = [...tablePart.matchAll(/^\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/gm)]
  .map(match => match.slice(1).map(cell => cell.trim()))
  .filter(cells => !/^-+$/.test(cells[0]) && cells[0] !== '概念');

assert.ok(rows.length >= 20, `主表条目过少（${rows.length}），至少要 20 条`);
assert.equal(rows.length, manifest.length,
  `主表行数（${rows.length}）与机器可读清单条数（${manifest.length}）不一致 —— 清单是给 CI 读的，必须逐条对齐`);

/* ---------- ① 清单逐条对齐主表 ---------- */

rows.forEach((cells, index) => {
  const [concept, draw, helpers, verb] = cells;
  const aliases = concept.split('/').map(part => part.trim()).filter(Boolean);
  assert.equal(manifest[index].concept, aliases.join(','),
    `第 ${index + 1} 条的概念在机器可读清单里对不上：清单写「${manifest[index].concept}」，主表写「${concept}」`);
  assert.equal(manifest[index].draw, draw,
    `第 ${index + 1} 条的画法在机器可读清单里对不上`);
  assert.ok(draw.length > 8, `第 ${index + 1} 条（${concept}）的画法太短，写清楚它到底长什么样`);
});

/* ---------- ② 主表每一行的 helper 都必须真实存在 ---------- */

const helperCells = new Set();
rows.forEach((cells, index) => {
  const [concept, , helpers] = cells;
  const names = helpers
    .split(/[、,，\s]+/)
    .map(name => name.replace(/`/g, '').trim())
    .filter(Boolean);
  assert.ok(names.length > 0, `第 ${index + 1} 条（${concept}）没有写用到的组件/helper`);
  for (const name of names) {
    assert.ok(HELPERS.has(name),
      `第 ${index + 1} 条（${concept}）引用的 helper「${name}」在 templates/engine.js 或 templates/kit/*.js 里找不到 —— 隐喻词典不许出现幻觉 helper`);
    helperCells.add(name);
  }
});

/* ---------- ③ 主表每一行的视觉动词都必须来自表D ---------- */

const usedVerbs = new Set();
rows.forEach((cells, index) => {
  const [concept, , , verb] = cells;
  const names = verb.split(/[、,，\s]+/).map(name => name.trim()).filter(Boolean);
  assert.ok(names.length > 0, `第 ${index + 1} 条（${concept}）没有写对应视觉动词`);
  for (const name of names) {
    assert.ok(VERBS.has(name),
      `第 ${index + 1} 条（${concept}）的视觉动词「${name}」不在 references/visual-verbs.md 的 20 个动词里`);
    usedVerbs.add(name);
  }
});

/* ---------- ④ 整篇文档不许出现幻觉 helper / 幻觉动词（重点项） ---------- */

/* 只扫「行内代码」里的裸标识符：文件路径（含 / 或 .）与中文短语不是 helper 名。 */
const inlineCode = [...doc.matchAll(/`([^`\n]+)`/g)].map(match => match[1]);
const nonHelperTokens = new Set([
  'references', 'templates', 'scripts', 'studio'
]);

for (const span of inlineCode) {
  if (/^[A-Za-z_$][\w$]*$/.test(span)) {
    if (nonHelperTokens.has(span)) continue;
    assert.ok(HELPERS.has(span),
      `文档里出现了不存在的 helper「${span}」—— references/visual-metaphors.md 里的 helper 名必须在 templates/engine.js 或 templates/kit/*.js 里真实存在`);
    continue;
  }
  if (/^[一-龥]{2}$/.test(span)) {
    assert.ok(VERBS.has(span),
      `文档里出现了不在表D 里的动词「${span}」—— 视觉动词必须来自 references/visual-verbs.md 的 20 个动词`);
  }
}

/* 反例表里的 helper 也必须是真实的 */
const antiSection = doc.split('## 语义反相禁用表')[1];
assert.ok(antiSection, 'references/visual-metaphors.md 必须有「## 语义反相禁用表」小节');
const antiRows = [...antiSection.matchAll(/^\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/gm)]
  .map(match => match.slice(1).map(cell => cell.trim()))
  .filter(cells => !/^-+$/.test(cells[0]) && cells[0] !== '错误画法');
assert.ok(antiRows.length >= 4, `语义反相禁用表至少要有 4 条真实案例，当前只有 ${antiRows.length} 条`);
for (const cells of antiRows) {
  for (const span of [...cells.join(' ').matchAll(/`([^`\n]+)`/g)].map(match => match[1])) {
    if (/^[A-Za-z_$][\w$]*$/.test(span)) {
      assert.ok(HELPERS.has(span), `反例表里引用了不存在的 helper「${span}」`);
    }
  }
  assert.ok(/CASE-\d+/.test(cells[3]), `反例表每条都要关联 references/cases.md 里的真实案例编号：${cells[0]}`);
}

/* ---------- ⑤ 词表必须覆盖全部 20 个动词（词典不能只教一小撮） ---------- */

assert.equal(usedVerbs.size, VERBS.size,
  `词典只用了 ${usedVerbs.size} 个视觉动词，表D 有 ${VERBS.size} 个 —— 至少有一个动词没有对应的画法`);

console.log(`PASS 视觉隐喻词典：${rows.length} 条隐喻（${helperCells.size} 个 helper、${usedVerbs.size} 个视觉动词），反例 ${antiRows.length} 条，helper 与动词出处全部可追溯`);
