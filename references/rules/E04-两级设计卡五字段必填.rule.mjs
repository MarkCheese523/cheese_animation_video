/* E04 · 两级设计卡五字段必填
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/semantic-scenes.md#先设计机制再写逐句动作
 * 真实缺陷：12
 * 实现：templates/kit/storyboard-contract.js（rule: E04）
 * 测试：scripts/test-storyboard-contract.mjs、scripts/test-agent-flow.mjs
 */
export default {
  id: 'E04',
  type: 'B',
  title: '两级设计卡五字段必填',
  source: 'references/semantic-scenes.md#先设计机制再写逐句动作',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'templates/kit/storyboard-contract.js', marker: 'rule: E04' },
  tests: ['scripts/test-storyboard-contract.mjs', 'scripts/test-agent-flow.mjs'],
  fix: '补齐视觉母结构/形态轨迹/持续时段/跨句承接/静止帧语义'
};
