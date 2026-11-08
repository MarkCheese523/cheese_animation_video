/* E06 · 样片必须覆盖连续两拍
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/semantic-scenes.md
 * 真实缺陷：13
 * 实现：production-flow.mjs（rule: E06）
 * 测试：scripts/test-production-flow.mjs
 */
export default {
  id: 'E06',
  type: 'B',
  title: '样片必须覆盖连续两拍',
  source: 'references/semantic-scenes.md',
  defects: ["13"],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: E06' },
  tests: ["scripts/test-production-flow.mjs"],
  fix: 'coversBeats 声明连续两拍，单拍入场不算代表样片'
};
