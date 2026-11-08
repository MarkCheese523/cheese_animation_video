/* E07 · 样片不得跳拍
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/semantic-scenes.md
 * 真实缺陷：13
 * 实现：production-flow.mjs（rule: E07）
 * 测试：scripts/test-production-flow.mjs
 */
export default {
  id: 'E07',
  type: 'B',
  title: '样片不得跳拍',
  source: 'references/semantic-scenes.md',
  defects: ["13"],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: E07' },
  tests: ["scripts/test-production-flow.mjs"],
  fix: 'coversBeats 必须是相邻拍次'
};
