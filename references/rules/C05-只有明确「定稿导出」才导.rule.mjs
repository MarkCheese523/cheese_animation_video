/* C05 · 只有明确「定稿导出」才导出
 * 类型：C（协作契约，可由流程/UI 强制）
 * 文档出处：SKILL.md#三全流程SOP
 * 真实缺陷：（流程铁律，无具体缺陷号）
 * 实现：production-flow.mjs（rule: C05）
 * 测试：scripts/test-production-flow.mjs
 */
export default {
  id: 'C05',
  type: 'C',
  title: '只有明确「定稿导出」才导出',
  source: 'SKILL.md#三全流程SOP',
  defects: [],
  status: 'active',
  implementation: { file: 'production-flow.mjs', marker: 'rule: C05' },
  tests: ["scripts/test-production-flow.mjs"],
  fix: '样片/阶段稿/全片一律只交付网页'
};
