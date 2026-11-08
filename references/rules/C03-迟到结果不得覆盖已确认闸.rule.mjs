/* C03 · 迟到结果不得覆盖已确认闸门
 * 类型：C（协作契约，可由流程/UI 强制）
 * 文档出处：references/agent-workflow.md
 * 真实缺陷：3
 * 实现：studio/app.js（rule: C03）
 * 测试：scripts/test-studio-gates.mjs
 */
export default {
  id: 'C03',
  type: 'C',
  title: '迟到结果不得覆盖已确认闸门',
  source: 'references/agent-workflow.md',
  defects: ["3"],
  status: 'active',
  implementation: { file: 'studio/app.js', marker: 'rule: C03' },
  tests: ["scripts/test-studio-gates.mjs"],
  fix: '已确认后返回的检索结果只能作为候补'
};
