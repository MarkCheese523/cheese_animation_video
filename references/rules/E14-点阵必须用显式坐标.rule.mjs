/* E14 · 点阵必须用显式坐标
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：22
 * 实现：templates/kit/master.js（rule: E14）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E14',
  type: 'B',
  title: '点阵必须用显式坐标',
  source: 'references/asset-pipeline.md',
  defects: ["22"],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E14' },
  tests: ["scripts/test-kit.mjs"],
  fix: '需要复用的点阵用 dotMatrix()，不要用 pattern 填充'
};
