/* E13 · 母版 id 改名必须自带闭合引号
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：23
 * 实现：templates/kit/master.js（rule: E13）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E13',
  type: 'B',
  title: '母版 id 改名必须自带闭合引号',
  source: 'references/asset-pipeline.md',
  defects: ["23"],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E13' },
  tests: ["scripts/test-kit.mjs"],
  fix: '用 Kit 的 withIds()，不要手写 replace'
};
