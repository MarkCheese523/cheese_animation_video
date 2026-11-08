/* E02 · 视觉动词必须来自表D 动词表
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/execution-contract.md#表D
 * 真实缺陷：12
 * 实现：agent-flow.mjs（rule: E02）
 * 测试：scripts/test-agent-flow.mjs
 */
export default {
  id: 'E02',
  type: 'B',
  title: '视觉动词必须来自表D 动词表',
  source: 'references/execution-contract.md#表D',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E02' },
  tests: ["scripts/test-agent-flow.mjs"],
  fix: '把 verb 换成动词表里的词（出现/落下/长成/展开/归档/分出/注入/堵住/滴出/盖章/标红/运转/停住/划掉/计数/走进/指向/提问）'
};
