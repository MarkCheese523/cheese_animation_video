/* E20 · 焦点必须唯一
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/visual-verbs.md#通过条件
 * 真实缺陷：17
 * 实现：templates/kit/lint-composition.js（rule: E20）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E20',
  type: 'B',
  title: '焦点必须唯一',
  source: 'references/visual-verbs.md#通过条件',
  defects: ["17"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-composition.js', marker: 'rule: E20' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '一帧里只能有一个 role=focus 的元素'
};
