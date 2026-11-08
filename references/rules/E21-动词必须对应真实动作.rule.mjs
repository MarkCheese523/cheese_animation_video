/* E21 · 动词必须对应真实动作
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/visual-verbs.md#三方一致性
 * 真实缺陷：16
 * 实现：templates/kit/lint-semantics.js（rule: E21）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E21',
  type: 'B',
  title: '动词必须对应真实动作',
  source: 'references/visual-verbs.md#三方一致性',
  defects: ["16"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-semantics.js', marker: 'rule: E21' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '声明「运转」的元素必须真的有脉动/自转轨道'
};
