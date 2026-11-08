/* E12 · 循环粒子必须显式结束时间
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/continuous-qa.md#已知坑
 * 真实缺陷：24
 * 实现：templates/kit/stage-kit.js（rule: E12）
 * 测试：scripts/test-kit-browser.mjs
 */
export default {
  id: 'E12',
  type: 'B',
  title: '循环粒子必须显式结束时间',
  source: 'references/continuous-qa.md#已知坑',
  defects: ["24"],
  status: 'active',
  implementation: { file: 'templates/kit/stage-kit.js', marker: 'rule: E12' },
  tests: ["scripts/test-kit-browser.mjs"],
  fix: '调用 FLOW_LOOP 时显式给出 tEnd'
};
