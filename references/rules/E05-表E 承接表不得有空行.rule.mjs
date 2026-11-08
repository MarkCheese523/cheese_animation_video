/* E05 · 表E 承接表不得有空行
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/motion-carry.md#表E承接决策树
 * 真实缺陷：12
 * 实现：templates/kit/storyboard-contract.js（rule: E05）
 * 测试：scripts/test-storyboard-contract.mjs、scripts/test-agent-flow.mjs
 */
export default {
  id: 'E05',
  type: 'B',
  title: '表E 承接表不得有空行',
  source: 'references/motion-carry.md#表E承接决策树',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'templates/kit/storyboard-contract.js', marker: 'rule: E05' },
  tests: ['scripts/test-storyboard-contract.mjs', 'scripts/test-agent-flow.mjs'],
  fix: '每个镜头边界写清谁活下来、怎么变、变成什么'
};
