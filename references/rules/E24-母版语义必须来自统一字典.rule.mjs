/* E24 · 母版语义必须来自统一字典
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/asset-pipeline.md
 * 真实缺陷：缺陷 16（第 4 拍误用云图标作语音源）
 * 实现：templates/kit/master.js（rule: E24）
 * 测试：scripts/test-kit.mjs
 */
export default {
  id: 'E24',
  type: 'B',
  title: '母版语义必须来自统一字典',
  source: 'references/asset-pipeline.md',
  defects: ['16'],
  status: 'active',
  implementation: { file: 'templates/kit/master.js', marker: 'rule: E24' },
  tests: ['scripts/test-kit.mjs'],
  fix: '在 MASTER_SEM 里登记槽位语义；角色约束由 SEM_ROLE_RULES 判定'
};
