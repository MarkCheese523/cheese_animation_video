/* E05 · 表E 承接表不得有空行
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/execution-contract.md#表E
 * 真实缺陷：12
 * 实现：agent-flow.mjs（rule: E05）
 * 测试：scripts/test-agent-flow.mjs
 */
export default {
  id: 'E05',
  type: 'B',
  title: '表E 承接表不得有空行',
  source: 'references/execution-contract.md#表E',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E05' },
  tests: ["scripts/test-agent-flow.mjs"],
  fix: '每个镜头边界写清谁活下来、怎么变、变成什么'
};
