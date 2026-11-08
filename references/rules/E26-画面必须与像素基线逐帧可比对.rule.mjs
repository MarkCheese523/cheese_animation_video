/* E26 · 画面必须与像素基线逐帧可比对
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/cases.md
 * 真实缺陷：缺陷 15（画面回归无拦截，同期漂移逐期累积）
 * 实现：templates/kit/visual-regression.js（rule: E26）
 * 测试：scripts/test-visual-regression.mjs
 */
export default {
  id: 'E26',
  type: 'B',
  title: '画面必须与像素基线逐帧可比对',
  source: 'references/cases.md',
  defects: ['15'],
  status: 'active',
  implementation: { file: 'templates/kit/visual-regression.js', marker: 'rule: E26' },
  tests: ['scripts/test-visual-regression.mjs'],
  fix: '在固定视口下用 renderAt(t) 重放同一时刻，逐像素与基线比对；显著差异超过容差即判定为漂移并输出差异图'
};
