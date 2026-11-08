/* E08 · 样片必须写清跨句演化
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/semantic-scenes.md
 * 真实缺陷：13
 * 实现：production-flow.mjs（rule: E08）
 * 测试：scripts/test-production-flow.mjs
 */
export default {
  id: 'E08',
  type: 'B',
  title: '样片必须写清跨句演化',
  source: 'references/semantic-scenes.md',
  defects: ["13"],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: E08' },
  tests: ["scripts/test-production-flow.mjs"],
  fix: '写明这两拍之间同一主体发生了什么演化（同一 DOM 身份 + 形态改变）'
};
