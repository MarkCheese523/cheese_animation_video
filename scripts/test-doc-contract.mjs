// Cheese Motion · 文档 ↔ 代码一致性自检
//
// 这条测试存在的理由：
//   现有 35 条规则校验的是「模型填的表单字段」，不是「skill 自己是否在说谎」。
//   本仓库最贵的几起事故全部来自后者 —— 文档里写着 `node tools/gen-subs.mjs`、
//   `serve.command`、`qa-check.mjs` 这些在本仓库从未存在过的文件；文档里写着
//   「duration 是毫秒」，实际是秒；文档里列了 11 个页型，真实注册 5+1 个。
//   这些都不报错，只是让人照着一张不存在的表干活。
//
// 所以这条测试断言四件事：
//   ① 路径存在性：SKILL.md 与 references/*.md 里出现的每个仓库内路径必须真实存在
//   ② 场景类型一致：references/scene-types.md 的 type 清单 == SCENE_BUILDERS 键集
//   ③ 动词三方一致：visual-verbs.md == agent-flow.mjs 的 VISUAL_VERBS == 引擎里真实存在的 helper
//   ④ 规则锚点有效：references/rules/*.rule.mjs 的 source 指向的文件存在、且 #锚点 能在该文件里找到
//
// 另加三条「文档自己不许腐烂」的自检：SKILL.md 行数、日期戳数、命令式措辞密度。
//
// 用法：node scripts/test-doc-contract.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = rel => readFileSync(path.join(repoRoot, rel), 'utf8');
const problems = [];

/* ── 归一化：把标题与锚点都压成同一种可比较的形状 ── */
const normalize = value => String(value)
  .toLowerCase()
  .replace(/[\s·（）()【】\[\]「」『』、，：:；;／/／·—–\-]/g, '');

/* ── ① 路径存在性 ──
 * 只校验「仓库内代码/文档路径」，不校验运行期产物名与示例文件名。
 * 判据（避免误报，同时不漏掉本次的 33 处失效引用）：
 *   ① 以仓库顶层目录名开头（references/ scripts/ templates/ assets/ studio/ docs/ qa/ dist/ examples/）
 *   ② 根目录文档（SKILL.md / README.md / EXAMPLE.md）里的裸文档名（*.md / *.json / *.mjs）
 * 其余（`job.json` 这种任务目录产物、`master.svg` 这种示例文件名、`emit/scatter` 这种 helper 对）
 * 一律跳过 —— 它们不是「文档说有、代码没有」的形态。
 */
const TOP_DIRS = ['references', 'scripts', 'templates', 'assets', 'studio', 'docs', 'qa', 'dist', 'examples'];
const ROOT_DOC_EXT = new Set(['.md', '.json', '.mjs']);
const docsToScan = ['SKILL.md', 'EXAMPLE.md', 'README.md']
  .concat(readdirSync(path.join(repoRoot, 'references'))
    .filter(name => name.endsWith('.md'))
    .map(name => `references/${name}`));

/* 文档里出现的、不是仓库内路径的写法（外部文档、占位符、代码表达式） */
const EXTERNAL = /^(https?:|mailto:|~|\/|#)/;

function expandBraces(token) {
  const match = token.match(/^(.*)\{([^}]*)\}(.*)$/);
  if (!match) return [token];
  const [, head, body, tail] = match;
  return body.split(',').flatMap(part => expandBraces(`${head}${part}${tail}`));
}

function collectPathCandidates(text, docDirIsRoot) {
  const found = new Set();
  for (const span of [...text.matchAll(/`([^`\n]+)`/g)].map(m => m[1])) {
    for (const raw of span.split(/\s+/)) {
      /* 去掉「路径:行号」这种带行号的引用后缀 */
      const token = raw.replace(/[。，、；：,.;:]+$/, '').replace(/:\d+(-\d+)?$/, '');
      if (!token || EXTERNAL.test(token)) continue;
      /* 代码表达式、CSS 变量、占位符、通配、目录通义都不是文件路径 */
      if (/[<>…{}()=;'"$]/.test(token) || token.startsWith('--')) continue;
      if (token.includes('*')) {
        const dir = token.replace(/\*.*$/, '').replace(/\/$/, '');
        if (!dir.includes('/') || !TOP_DIRS.includes(dir.split('/')[0])) continue;
        const abs = path.join(repoRoot, dir);
        if (!existsSync(abs) || !statSync(abs).isDirectory()) problems.push(`路径不存在（通配）：${token}`);
        continue;
      }
      /* 目录引用（以 / 结尾）只校验顶层目录存在 */
      if (token.endsWith('/')) {
        const dir = token.replace(/\/$/, '');
        if (!TOP_DIRS.includes(dir.split('/')[0])) continue;
        if (!existsSync(path.join(repoRoot, dir))) problems.push(`路径不存在（目录）：${token}`);
        continue;
      }
      const expanded = expandBraces(token);
      if (token.includes('/')) {
        if (!TOP_DIRS.includes(token.split('/')[0])) continue;
        for (const item of expanded) found.add(item);
      } else if (docDirIsRoot && ROOT_DOC_EXT.has(path.extname(token))) {
        found.add(token);
      }
    }
  }
  return found;
}

let checkedPaths = 0;
for (const doc of docsToScan) {
  const abs = path.join(repoRoot, doc);
  if (!existsSync(abs)) continue;
  const docDirIsRoot = !doc.includes('/');
  for (const candidate of collectPathCandidates(read(doc), docDirIsRoot)) {
    checkedPaths += 1;
    if (!existsSync(path.join(repoRoot, candidate))) {
      problems.push(`${doc} 引用了不存在的路径：${candidate}`);
    }
  }
}
assert.ok(checkedPaths >= 30, `路径检查样本过少（${checkedPaths}），说明扫描规则失效`);

/* ── ② 场景类型一致 ── */
function readMachineList(file, name) {
  const source = read(file);
  const match = source.match(new RegExp(`<!--\\s*${name}:begin\\s*-->([\\s\\S]*?)<!--\\s*${name}:end\\s*-->`));
  if (match) {
    return match[1].split(/[,\n]/).map(item => item.trim()).filter(Boolean);
  }
  /* 兼容「NAME: a, b, c」单行写法 */
  const flat = source.match(new RegExp(`^${name}:\\s*(.+)$`, 'mi'));
  assert.ok(flat, `${file} 缺少机器可读清单（<!-- ${name}:begin/end --> 或 "${name}: ..."）`);
  return flat[1].split(/[,\n]/).map(item => item.trim()).filter(Boolean);
}

const sceneTypes = readMachineList('references/scene-types.md', 'SCENE_TYPES');
const scenesSource = read('assets/template/scenes.js');
const motionSource = read('assets/template/motion-sequence.js');
const builders = new Set([
  ...[...scenesSource.matchAll(/^\s{2}([A-Za-z_][\w]*)\s*:\s*\(/gm)].map(m => m[1]),
  ...[...motionSource.matchAll(/SCENE_BUILDERS\.([A-Za-z_][\w]*)\s*=/g)].map(m => m[1])
]);
assert.ok(builders.size >= 6, `SCENE_BUILDERS 键集异常（${builders.size}）`);
for (const type of sceneTypes) {
  assert.ok(builders.has(type), `references/scene-types.md 里的类型「${type}」不在 SCENE_BUILDERS 里`);
}
for (const type of builders) {
  assert.ok(sceneTypes.includes(type), `SCENE_BUILDERS 里的类型「${type}」没写进 references/scene-types.md`);
}

/* ── ③ 动词三方一致 ── */
const docVerbs = readMachineList('references/visual-verbs.md', 'visual-verbs');
/* 动词表的唯一实现位置是共享契约模块；agent-flow.mjs 与 CLI 都从它取，
   不允许任何一处再写一份自己的副本。 */
const contractSource = read('templates/kit/storyboard-contract.js');
const verbBlock = contractSource.match(/export const VISUAL_VERBS = new Set\(\[([\s\S]*?)\]\)/);
assert.ok(verbBlock, 'templates/kit/storyboard-contract.js 里找不到 VISUAL_VERBS');
const codeVerbs = [...verbBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
const agentFlow = read('agent-flow.mjs');
assert.ok(
  /import\s*\{[^}]*VISUAL_VERBS[^}]*\}\s*from\s*'\.\/templates\/kit\/storyboard-contract\.js'/.test(agentFlow),
  'agent-flow.mjs 必须从共享契约模块导入 VISUAL_VERBS，不允许自留副本'
);
assert.equal(
  (agentFlow.match(/new Set\(\s*\[[^\]]*'(出现|登场)'/g) || []).length, 0,
  'agent-flow.mjs 里不允许再出现一份自己的视觉动词表'
);
assert.deepEqual(
  [...docVerbs].sort(),
  [...codeVerbs].sort(),
  `references/visual-verbs.md 的动词集与 agent-flow.mjs 的 VISUAL_VERBS 不一致：文档 ${docVerbs.length} 条，代码 ${codeVerbs.length} 条`
);

/* 文档里映射到的 helper 必须真实存在于引擎或装配层 */
const engineSource = read('templates/engine.js');
const kitSource = readdirSync(path.join(repoRoot, 'templates/kit'))
  .filter(name => name.endsWith('.js'))
  .map(name => read(`templates/kit/${name}`))
  .join('\n');
const helperRow = /^(\|[^\n]*\|)\s*$/gm;
const verbTableRows = read('references/visual-verbs.md')
  .split('\n')
  .filter(line => /^\|\s*(出现|登场|落下|归位|长成|展开|归档|分出|注入|堵住|滴出|盖章|标红|运转|停住|划掉|计数|走进|指向|提问)/.test(line));
assert.ok(verbTableRows.length >= 18, `动词表行数过少（${verbTableRows.length}）`);
for (const verb of docVerbs) {
  assert.ok(
    verbTableRows.some(row => row.split('|')[1].split('、').map(item => item.trim()).includes(verb)),
    `references/visual-verbs.md 的动词「${verb}」在表里没有对应行`
  );
}
const helpersChecked = new Set();
for (const row of verbTableRows) {
  const cells = row.split('|');
  const helperCell = cells[2] || '';
  for (const token of [...helperCell.matchAll(/`([^`]+)`/g)].map(m => m[1])) {
    const identifier = token.match(/^[A-Za-z_$][\w$]*/);
    if (!identifier) continue;
    const name = identifier[0];
    helpersChecked.add(name);
    const found = engineSource.includes(name) || kitSource.includes(name);
    assert.ok(found, `references/visual-verbs.md 引用了不存在的 helper「${name}」`);
  }
}
assert.ok(helpersChecked.size >= 12, `helper 抽查样本过少（${helpersChecked.size}）`);

/* ── ④ 规则锚点有效 ── */
const ruleDir = path.join(repoRoot, 'references/rules');
const ruleFiles = readdirSync(ruleDir).filter(name => name.endsWith('.rule.mjs'));
let anchorChecked = 0;
for (const file of ruleFiles) {
  const module = await import(path.join(ruleDir, file));
  const rule = module.default;
  const source = String(rule.source || '');
  const [filePart, anchor] = source.split('#');
  assert.ok(filePart, `${rule.id} 的 source 没有文件部分：${source}`);
  const abs = path.join(repoRoot, filePart);
  assert.ok(existsSync(abs), `${rule.id} 的 source 指向不存在的文件：${filePart}`);
  if (!anchor) continue;
  anchorChecked += 1;
  const docSource = readFileSync(abs, 'utf8');
  const headings = [...docSource.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)].map(m => m[1]);
  const hit = headings.some(heading => normalize(heading) === normalize(anchor));
  assert.ok(hit, `${rule.id} 的 source 锚点在 ${filePart} 里找不到标题「${anchor}」`);
}
assert.ok(anchorChecked >= 8, `锚点抽查样本过少（${anchorChecked}）`);

/* ── ⑤ 承接手法枚举：文档与实现必须同一份 ── */
const carryMethods = readMachineList('references/motion-carry.md', 'carry-methods');
const contractFile = 'templates/kit/storyboard-contract.js';
if (existsSync(path.join(repoRoot, contractFile))) {
  const contractSource = read(contractFile);
  for (const method of carryMethods) {
    assert.ok(contractSource.includes(method), `承接手法「${method}」没有出现在 ${contractFile} 里 —— 文档与实现不同源`);
  }
}

/* ── ⑥ SKILL.md 自身不许腐烂 ── */
const skill = read('SKILL.md');
const skillLines = skill.split('\n').length;
assert.ok(skillLines <= 130, `SKILL.md 过长（${skillLines} 行，上限 130）—— 细节该下沉到 references`);
const dateStamps = (skill.match(/20\d{2}-\d{2}-\d{2}/g) || []).length;
assert.equal(dateStamps, 0, `SKILL.md 里有 ${dateStamps} 个日期戳 —— 日期戳属于维护者文档，不属于执行入口`);
const imperativeHits = (skill.match(/必须|不得|禁止|严禁|务必|一律|只能|不可/g) || []).length;
const imperativeDensity = imperativeHits / skillLines;
assert.ok(imperativeDensity < 0.15, `SKILL.md 命令式措辞密度过高（${imperativeDensity.toFixed(3)}/行，上限 0.15）—— 该下沉到 references 的就下沉`);

if (problems.length) {
  console.error('文档 ↔ 代码一致性检查失败：');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`PASS 文档契约：路径 ${checkedPaths} 处全部存在，场景类型 ${sceneTypes.length} 个双向一致，动词 ${docVerbs.length} 个三方一致，helper ${helpersChecked.size} 个真实存在，规则锚点 ${anchorChecked} 个有效，SKILL.md ${skillLines} 行 / 日期戳 0 / 命令式密度 ${imperativeDensity.toFixed(3)}`);
