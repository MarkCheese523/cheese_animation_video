/* E18 · 同组信息必须聚拢
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/stage-layout.md
 * 真实缺陷：17
 * 实现：templates/kit/lint-composition.js（rule: E18）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E18',
  type: 'B',
  title: '同组信息必须聚拢',
  source: 'references/stage-layout.md',
  defects: ["17"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-composition.js', marker: 'rule: E18' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '同一组要素的包围盒间距不得超阈值'
};
