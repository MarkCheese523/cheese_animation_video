/* E16 · 拆件数不符必须显式失败
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：8
 * 实现：templates/kit/master.js（rule: E16）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E16',
  type: 'B',
  title: '拆件数不符必须显式失败',
  source: 'references/asset-pipeline.md',
  defects: ["8"],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E16' },
  tests: ["scripts/test-kit.mjs"],
  fix: '母版结构变了就同步更新拆件规则，不要默默少拆'
};
