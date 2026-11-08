/* E29 · 母版语义字典必须按期存放，不得全局按槽位号共享
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/cases.md
 * 真实缺陷：缺陷 17（槽位号每期重分配，语义字典却是全局的，上一期护栏会被下一期静默改写）
 * 实现：templates/kit/master.js（rule: E29 母版语义字典必须按期存放）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E29',
  type: 'B',
  title: '母版语义字典必须按期存放，不得全局按槽位号共享',
  source: 'references/cases.md',
  defects: ['17'],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E29 母版语义字典必须按期存放' },
  tests: ['scripts/test-kit.mjs'],
  fix: '把槽位→语义的权威字典放进本期 masters/sem.json（由本期 analysis 的资产声明生成），全局表只做兜底；builders 一律读本期字典'
};
