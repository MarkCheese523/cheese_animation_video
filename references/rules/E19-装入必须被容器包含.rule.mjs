/* E19 · 装入必须被容器包含
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/stage-layout.md#表F元素表
 * 真实缺陷：18
 * 实现：templates/kit/lint-composition.js（rule: E19）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E19',
  type: 'B',
  title: '装入必须被容器包含',
  source: 'references/stage-layout.md#表F元素表',
  defects: ["18"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-composition.js', marker: 'rule: E19' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '被装入的元素必须完全落在容器包围盒内'
};
