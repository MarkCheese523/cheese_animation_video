/* E11 · 压缩间距必须大于元素宽度
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/stage-layout.md
 * 真实缺陷：18
 * 实现：templates/kit/stage-kit.js（rule: E11）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E11',
  type: 'B',
  title: '压缩间距必须大于元素宽度',
  source: 'references/stage-layout.md',
  defects: ["18"],
  status: 'active',
  implementation: { file: 'templates/kit/stage-kit.js', marker: 'rule: E11' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '压缩时同步收间距，用 Kit.compressInto'
};
