// Cheese Motion · 规则注册表 → references/checks.md 生成器
//
// 为什么要有它：
//   本期最有价值的缺陷不是某个画面错了，而是「规则写在文档里、代码里一处都没有」——
//   execution-contract.md 的表D/表E 通过条件写得很完整，却从来没被任何代码读过。
//   本脚本把规则注册表渲染成唯一索引，让「规则有没有落地」变成可执行的事实，
//   而不是靠人记得。
//
// 用法：node scripts/build-checks.mjs [--check]
//   --check 只校验 checks.md 与注册表一致（不写盘），供回归测试使用。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rulesDir = path.join(repoRoot, 'references/rules');
const outFile = path.join(repoRoot, 'references/checks.md');
const checkOnly = process.argv.includes('--check');

const files = readdirSync(rulesDir).filter(name => name.endsWith('.rule.mjs')).sort();
const rules = [];
for (const file of files) {
  const module = await import(path.join(rulesDir, file));
  const rule = module.default;
  if (!rule || !rule.id) throw new Error(`规则文件缺少 id：${file}`);
  rules.push({ ...rule, file: `references/rules/${file}` });
}
rules.sort((a, b) => a.id.localeCompare(b.id));

/* A 类（审美取向）无法机器判定，列在这里提醒：它们由人在闸门上判断，不写进注册表。 */
const MANUAL_CLASS = [
  ['画面文字 = 关键词（≤8 字）+ 每期限 2～3 处金句', 'SKILL.md#五'],
  ['音效克制：全片只保留关键仪式音', 'SKILL.md#五'],
  ['静音看得懂：关掉字幕仍能读出变化', 'SKILL.md#〇之二'],
  ['手绘／贴纸／撕纸／胶带／印章视觉语言', 'SKILL.md#五'],
  ['视觉母结构必须随语义真实演化（保留 DOM 只是技术底线）', 'SKILL.md#〇之三'],
  ['品牌只用官方矢量，拿不到就用纯文字标识', 'SKILL.md#〇-7'],
  ['人物只留头肩外轮廓 + 点阵填充，不重建五官', 'SKILL.md#〇-9']
];

const typeLabel = { A: 'A 审美（人判）', B: 'B 工艺（机器判）', C: 'C 协作（流程判）' };
const statusLabel = { active: '已实现', planned: '待实现' };
const cell = value => String(value ?? '').replace(/\|/g, '\\|').trim();

const groups = [
  ['B · 工艺规范（可机器判定）', rules.filter(rule => rule.type === 'B')],
  ['C · 协作契约（可由流程/UI 强制）', rules.filter(rule => rule.type === 'C')]
];

const lines = [
  '# 规则 → 校验器索引',
  '',
  '> 本文件由 `node scripts/build-checks.mjs` 从 `references/rules/` 自动生成，**不要手改**。',
  '> 规则注册表是「文档 → 代码」的唯一接线处：每条 B/C 类规则都必须声明实现位置与测试位置，',
  '> `scripts/test-rule-registry.mjs` 会双向核对 —— 规则没有实现、或者实现没有测试，都会让回归失败。',
  '',
  `- 规则总数：${rules.length}`,
  `- 已实现：${rules.filter(rule => rule.status === 'active').length}`,
  `- 待实现：${rules.filter(rule => rule.status === 'planned').length}`,
  '',
  '## A · 审美取向（机器不判，由人在闸门上判断）',
  '',
  '| 审美取向 | 出处 |',
  '|---|---|',
  ...MANUAL_CLASS.map(([item, source]) => `| ${cell(item)} | ${cell(source)} |`),
  ''
];

for (const [title, group] of groups) {
  lines.push(`## ${title}`, '');
  lines.push('| 编号 | 规则 | 状态 | 文档出处 | 实现位置 | 测试 | 关联缺陷 |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const rule of group) {
    lines.push([
      `**${rule.id}**`,
      cell(rule.title),
      statusLabel[rule.status] || rule.status,
      cell(rule.source),
      rule.implementation ? `\`${rule.implementation.file}\`（${rule.implementation.marker}）` : '—',
      rule.tests?.length ? rule.tests.map(file => `\`${file}\``).join(' ') : '—',
      rule.defects?.length ? rule.defects.map(id => `#${id}`).join(' ') : '—'
    ].join(' | ') + ' |');
  }
  lines.push('');
}

lines.push('## 规则写法约定', '');
lines.push('```js');
lines.push('// references/rules/<编号>-<短标题>.rule.mjs');
lines.push('export default {');
lines.push("  id: 'E01', type: 'B', title: '每拍只有一个焦点',");
lines.push("  source: 'references/execution-contract.md#表D',   // 文档出处（单向：文档 → 规则）");
lines.push('  defects: [\'12\'],                                // 关联的真实缺陷编号');
lines.push("  status: 'active',");
lines.push('  implementation: { file: \'agent-flow.mjs\', marker: \'rule: E01\' },');
lines.push("  tests: ['scripts/test-agent-flow.mjs'],");
lines.push("  fix: '在表D「焦点」列写清观众此刻只看哪里'");
lines.push('};');
lines.push('```');
lines.push('');
lines.push('- `type`：**A** 审美（人判，不进注册表）/ **B** 工艺（必须机器判）/ **C** 协作（必须流程强制）');
lines.push('- `implementation.file` 必须真实存在，且文件里必须能搜到 `marker`（本规则用 `/* rule: <id> */` 标注）');
lines.push('- `tests` 里的每个文件必须存在，且文件里必须能搜到同一条 `marker` —— 这是「文档 → 校验器 → 测试」三向索引');
lines.push('');

const content = lines.join('\n');

if (checkOnly) {
  const current = readFileSync(outFile, 'utf8');
  if (current !== content) {
    console.error('references/checks.md 与规则注册表不一致，请运行 node scripts/build-checks.mjs');
    process.exit(1);
  }
  console.log(`checks.md 与注册表一致（${rules.length} 条规则）`);
} else {
  writeFileSync(outFile, content, 'utf8');
  console.log(`references/checks.md 已生成（${rules.length} 条规则，${rules.filter(r => r.status === 'active').length} 条已实现）`);
}
