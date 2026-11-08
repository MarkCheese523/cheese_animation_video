/* E25 · 每条案例必须关联校验器编号或人工必查编号
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/cases.md
 * 真实缺陷：缺陷 14（文档规则无机器拦截）
 * 实现：scripts/test-rule-registry.mjs（rule: E25）
 * 测试：scripts/test-rule-registry.mjs
 */
export default {
  id: 'E25',
  type: 'B',
  title: '每条案例必须关联校验器编号或人工必查编号',
  source: 'references/cases.md',
  defects: ['14'],
  status: 'active',
  implementation: { file: 'scripts/test-rule-registry.mjs', marker: 'rule: E25' },
  tests: ['scripts/test-rule-registry.mjs'],
  fix: '把案例关联到已实现的规则编号，或关联到人工必查编号（并让它出现在交付接触表里）'
};
