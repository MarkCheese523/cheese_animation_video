/* E09 · 语义接触表必须随交付
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/execution-contract.md#人工必查
 * 真实缺陷：14
 * 实现：production-flow.mjs（rule: E09）
 * 测试：scripts/test-production-flow.mjs
 */
export default {
  id: 'E09',
  type: 'B',
  title: '语义接触表必须随交付',
  source: 'references/execution-contract.md#人工必查',
  defects: ["14"],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: E09' },
  tests: ["scripts/test-production-flow.mjs"],
  fix: '运行 scripts/contact-sheet.mjs 并把 contactSheet 写进结果'
};
