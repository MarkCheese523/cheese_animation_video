/* E27 · 基线只能由人验收后手动刷新，产线不得自动改基线
 * 类型：C（协作契约，可由流程强制）
 * 文档出处：references/cases.md
 * 真实缺陷：缺陷 15（画面回归无拦截，同期漂移逐期累积）
 * 实现：scripts/contact-sheet.mjs（rule: E27）
 * 测试：scripts/test-visual-regression.mjs
 */
export default {
  id: 'E27',
  type: 'C',
  title: '基线只能由人验收后手动刷新，产线不得自动改基线',
  source: 'references/cases.md',
  defects: ['15'],
  status: 'active',
  implementation: { file: 'scripts/contact-sheet.mjs', marker: 'rule: E27' },
  tests: ['scripts/test-visual-regression.mjs'],
  fix: '产线只读比对并把漂移状态写进接触表；刷新基线只能由人验收后手动执行 --update，Agent 不得自行改基线'
};
