/* E01 · 每拍只有一个焦点
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/execution-contract.md#表D
 * 真实缺陷：12
 * 实现：agent-flow.mjs（rule: E01）
 * 测试：scripts/test-agent-flow.mjs
 */
export default {
  id: 'E01',
  type: 'B',
  title: '每拍只有一个焦点',
  source: 'references/execution-contract.md#表D',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E01' },
  tests: ["scripts/test-agent-flow.mjs"],
  fix: '在表D「焦点」列写清观众此刻只看哪里'
};
