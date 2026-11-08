/* E15 · 母版元素抽取必须含 rect/circle
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：8
 * 实现：templates/kit/master.js（rule: E15）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E15',
  type: 'B',
  title: '母版元素抽取必须含 rect/circle',
  source: 'references/asset-pipeline.md',
  defects: ["8"],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E15' },
  tests: ["scripts/test-kit.mjs"],
  fix: '用 masterElements() 全量抽取'
};
