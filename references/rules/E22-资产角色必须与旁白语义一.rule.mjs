/* E22 · 资产角色必须与旁白语义一致
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：16
 * 实现：templates/kit/lint-semantics.js（rule: E22）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E22',
  type: 'B',
  title: '资产角色必须与旁白语义一致',
  source: 'references/asset-pipeline.md',
  defects: ["16"],
  status: 'active',
  implementation: { file: 'templates/kit/lint-semantics.js', marker: 'rule: E22' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '云图标不能承担「说话」角色'
};
