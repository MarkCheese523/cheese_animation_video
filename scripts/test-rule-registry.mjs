// Cheese Motion · 规则注册表自检（文档 → 校验器 → 测试 三向索引）
//
// 这条测试存在的理由：
//   本期最贵的返工不是画面错，而是「规则写在文档里、代码里一处都没有」。
//   execution-contract.md 的表D / 表E 通过条件写了两级设计卡那么完整，
//   却从来没被任何代码读过 —— 于是每期都要用肉眼重新做一遍机器该做的事。
//
// 所以：任何新增的 B/C 类规则，如果没有真实实现与真实测试，这测试就会失败。
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { MANUAL_IDS } from '../templates/kit/manual-checks.js';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rulesDir = path.join(repoRoot, 'references/rules');

const files = readdirSync(rulesDir).filter(name => name.endsWith('.rule.mjs')).sort();
assert.ok(files.length >= 20, `规则注册表条目过少（${files.length}）`);

const rules = [];
for (const file of files) {
  const module = await import(path.join(rulesDir, file));
  const rule = module.default;
  assert.ok(rule && rule.id, `规则文件缺少 id：${file}`);
  assert.match(rule.id, /^[A-Z]\d{2}$/, `规则编号格式不对：${rule.id}`);
  assert.ok(['A', 'B', 'C'].includes(rule.type), `规则类型不对：${rule.id}`);
  assert.ok(rule.title, `规则缺少标题：${rule.id}`);
  assert.ok(rule.source, `规则缺少文档出处：${rule.id}`);
  assert.ok(rule.fix, `规则缺少修复提示：${rule.id}`);
  assert.ok(['active', 'planned'].includes(rule.status), `规则状态不对：${rule.id}`);
  rules.push({ ...rule, file: `references/rules/${file}` });
}

/* 编号唯一 */
const ids = rules.map(rule => rule.id);
assert.equal(new Set(ids).size, ids.length, '规则编号必须唯一');

/* 已实现的规则必须有真实实现与真实测试 —— 这就是「规则不许只活在文档里」的强制手段 */
for (const rule of rules.filter(item => item.status === 'active')) {
  assert.ok(rule.implementation, `${rule.id} 已实现但没有声明实现位置`);
  const implPath = path.join(repoRoot, rule.implementation.file);
  assert.ok(existsSync(implPath), `${rule.id} 的实现文件不存在：${rule.implementation.file}`);
  const implSource = readFileSync(implPath, 'utf8');
  assert.ok(implSource.includes(rule.implementation.marker),
    `${rule.id} 的实现文件里找不到标记「${rule.implementation.marker}」`);
  assert.ok(Array.isArray(rule.tests) && rule.tests.length,
    `${rule.id} 已实现但没有声明测试文件`);
  for (const testFile of rule.tests) {
    const testPath = path.join(repoRoot, testFile);
    assert.ok(existsSync(testPath), `${rule.id} 的测试文件不存在：${testFile}`);
    const testSource = readFileSync(testPath, 'utf8');
    assert.ok(testSource.includes(rule.implementation.marker),
      `${rule.id} 的测试文件 ${testFile} 里找不到标记「${rule.implementation.marker}」—— 测试没有真的覆盖这条规则`);
  }
}

/* 待实现的规则必须已经规划好落点与测试位，否则它只是又一句散文 */
for (const rule of rules.filter(item => item.status === 'planned')) {
  assert.ok(rule.implementation && rule.implementation.file,
    `${rule.id} 待实现但没有规划落点`);
  assert.ok(rule.implementation.marker, `${rule.id} 待实现但没有规划标记`);
}

/* 每条规则的实现与测试必须成对出现（不得只声明实现不声明测试，反之亦然） */
for (const rule of rules) {
  const hasImpl = Boolean(rule.implementation?.file);
  const hasTests = Boolean(rule.tests?.length);
  assert.equal(hasImpl, hasTests, `${rule.id} 的实现与测试声明必须成对出现`);
}

/* 案例库：每条案例必须关联一个已实现的规则编号，或一个人工必查编号 */
/* rule: C04 manual 项必须在交付接触表出现 */
/* rule: E25 每条案例必须关联校验器编号或人工必查编号 */
{
  const casesFile = path.join(repoRoot, 'references/cases.md');
  assert.ok(existsSync(casesFile), '案例库 references/cases.md 必须存在');
  const casesSource = readFileSync(casesFile, 'utf8');
  const rows = [...casesSource.matchAll(/^\| (CASE-\d+) \|(.+?)\|(.+?)\|\s*`([A-Z]\d{2})`\s*\|(.+?)\|$/gm)];
  assert.ok(rows.length >= 20, `案例库条目过少（${rows.length}）`);
  const manualIds = new Set(MANUAL_IDS);
  const ruleIds = new Set(rules.map(rule => rule.id));
  for (const [, caseId, , , owner] of rows) {
    assert.ok(ruleIds.has(owner) || manualIds.has(owner),
      `${caseId} 关联的「${owner}」既不是已注册规则，也不是人工必查编号 —— 案例不算闭环`);
    if (ruleIds.has(owner)) {
      const rule = rules.find(item => item.id === owner);
      assert.equal(rule.status, 'active', `${caseId} 关联的规则 ${owner} 还未实现 —— 案例不能挂着未落地的规则`);
    }
  }
  /* 案例库里用到的人工必查编号，必须出现在交付清单里 */
  const usedManual = new Set(rows.map(row => row[4]).filter(id => manualIds.has(id)));
  for (const id of usedManual) {
    assert.ok(MANUAL_IDS.includes(id), `人工必查编号 ${id} 不在共享清单里`);
  }
}

/* checks.md 必须与注册表一致 —— 防止索引文档腐烂 */
const check = spawnSync(process.execPath, [path.join(repoRoot, 'scripts/build-checks.mjs'), '--check'], {
  cwd: repoRoot, encoding: 'utf8'
});
assert.equal(check.status, 0, `checks.md 与注册表不一致：${check.stderr || check.stdout}`);

console.log(`PASS 规则注册表：${rules.length} 条规则，${rules.filter(r => r.status === 'active').length} 条已实现，文档/校验器/测试三向索引一致`);
