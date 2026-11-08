/* E23 · 承接必须连续
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/motion-carry.md
 * 真实缺陷：24
 * 实现：templates/kit/lint-semantics.js（rule: E23）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E23',
  type: 'B',
  title: '承接必须连续',
  source: 'references/motion-carry.md',
  defects: ["24"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-semantics.js', marker: 'rule: E23' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '上一拍末帧 = 下一拍首帧'
};
