/* C01 · 闸门回退必须永远可用
 * 类型：C（协作契约，可由流程/UI 强制）
 * 文档出处：SKILL.md#二铁律
 * 真实缺陷：20
 * 实现：studio/app.js（rule: C01）
 * 测试：scripts/test-studio-gates.mjs
 */
export default {
  id: 'C01',
  type: 'C',
  title: '闸门回退必须永远可用',
  source: 'SKILL.md#二铁律',
  defects: ["20"],
  status: 'active',
  implementation: { file: 'studio/app.js', marker: 'rule: C01' },
  tests: ["scripts/test-studio-gates.mjs"],
  fix: '任何状态下都能退回上一环'
};
