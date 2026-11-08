/* C04 · manual 项必须出现在交付接触表
 * 类型：C（协作契约，可由流程/UI 强制）
 * 文档出处：references/execution-contract.md#人工必查
 * 真实缺陷：14
 * 实现：production-flow.mjs（rule: C04）
 * 测试：scripts/test-rule-registry.mjs
 */
export default {
  id: 'C04',
  type: 'C',
  title: 'manual 项必须出现在交付接触表',
  source: 'references/execution-contract.md#人工必查',
  defects: ["14"],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: C04' },
  tests: ["scripts/test-rule-registry.mjs"],
  fix: '人工必查项必须作为接触表的检查项逐条列出'
};
