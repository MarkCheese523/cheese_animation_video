/* E04 · 两级设计卡五字段必填
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/execution-contract.md#两级设计卡
 * 真实缺陷：12
 * 实现：agent-flow.mjs（rule: E04）
 * 测试：scripts/test-agent-flow.mjs
 */
export default {
  id: 'E04',
  type: 'B',
  title: '两级设计卡五字段必填',
  source: 'references/execution-contract.md#两级设计卡',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E04' },
  tests: ["scripts/test-agent-flow.mjs"],
  fix: '补齐视觉母结构/形态轨迹/持续时段/跨句承接/静止帧语义'
};
