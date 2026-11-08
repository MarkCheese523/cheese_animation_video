/* C02 · 服务端 analysis 是唯一权威
 * 类型：C（协作契约，可由流程/UI 强制）
 * 文档出处：SKILL.md#〇-13
 * 真实缺陷：21
 * 实现：studio/app.js（rule: C02）
 * 测试：scripts/test-studio-gates.mjs
 */
export default {
  id: 'C02',
  type: 'C',
  title: '服务端 analysis 是唯一权威',
  source: 'SKILL.md#〇-13',
  defects: ["21"],
  status: 'active',
  implementation: { file: 'studio/app.js', marker: 'rule: C02' },
  tests: ["scripts/test-studio-gates.mjs"],
  fix: '草稿不得覆盖服务端已校验的 analysis'
};
