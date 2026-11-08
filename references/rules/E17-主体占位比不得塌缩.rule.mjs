/* E17 · 主体占位比不得塌缩
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/stage-layout.md#布局模板坐标中心点
 * 真实缺陷：15
 * 实现：templates/kit/lint-composition.js（rule: E17）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E17',
  type: 'B',
  title: '主体占位比不得塌缩',
  source: 'references/stage-layout.md#布局模板坐标中心点',
  defects: ["15"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-composition.js', marker: 'rule: E17' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '主体在画面中的占比不得低于阈值'
};
