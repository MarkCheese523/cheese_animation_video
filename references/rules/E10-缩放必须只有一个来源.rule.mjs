/* E10 · 缩放必须只有一个来源
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/continuous-qa.md#已知坑
 * 真实缺陷：15
 * 实现：templates/kit/stage-kit.js（rule: E10）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E10',
  type: 'B',
  title: '缩放必须只有一个来源',
  source: 'references/continuous-qa.md#已知坑',
  defects: ["15"],
  status: 'active',
  implementation: { file: 'templates/kit/stage-kit.js', marker: 'rule: E10' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '用 Kit.place/placeFitted，不要在内容里再套 scale'
};
