/* E28 · 拍数必须由本期语义段落数决定，不得写死
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/cases.md
 * 真实缺陷：缺陷 16（拍数被写死为五，长视频的拆解回写不进来）
 * 实现：agent-flow.mjs（rule: E28 拍数由语义段落数决定，不是固定值）
 * 测试：scripts/test-agent-flow.mjs
 */
export default {
  id: 'E28',
  type: 'B',
  title: '拍数必须由本期语义段落数决定，不得写死',
  source: 'references/cases.md',
  defects: ['16'],
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E28 拍数由语义段落数决定，不是固定值' },
  tests: ['scripts/test-agent-flow.mjs', 'scripts/test-studio-gates.mjs'],
  fix: '把拍数校验改成范围校验（3–40 拍），拍 id 自由且唯一，承接表行数等于拍数减一，契约模板的拍数建议按 SRT 句数推导'
};
