/* E03 · 每拍必须写清跨句承接
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/motion-carry.md#表E承接决策树
 * 真实缺陷：12
 * 实现：templates/kit/storyboard-contract.js（rule: E03）
 * 测试：scripts/test-storyboard-contract.mjs、scripts/test-agent-flow.mjs
 */
export default {
  id: 'E03',
  type: 'B',
  title: '每拍必须写清跨句承接',
  source: 'references/motion-carry.md#表E承接决策树',
  defects: ["12"],
  status: 'active',
  implementation: { file: 'templates/kit/storyboard-contract.js', marker: 'rule: E03' },
  tests: ['scripts/test-storyboard-contract.mjs', 'scripts/test-agent-flow.mjs'],
  fix: '写清本拍如何承接上一拍的同一主体（同一 DOM 身份继续运动）'
};
