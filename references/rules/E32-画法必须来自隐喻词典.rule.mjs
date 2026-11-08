/* E32 · 画法必须来自隐喻词典或显式标注新造
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/visual-metaphors.md
 * 真实缺陷：36（全仓库没有任何「概念 → 画法」的映射表，执行模型每拍都在现场发明视觉比喻 —— 同一句「监管」这期画成栅栏、下期画成锁，旁白和画面对不上，返工时说不清哪一版才对）
 * 实现：scripts/test-visual-metaphors.mjs（rule: E32）
 * 测试：scripts/test-visual-metaphors.mjs
 *
 * 为什么要有它：
 *   CASE-16 是本仓库最贵的返工：第 4 拍拿云图标当语音源，画面语义与旁白反相。
 *   根因不是「不够小心」，而是**没有一份可查的画法表** —— 现场发明，
 *   发明出来的比喻既不保证语义正确，也不保证 helper 真的存在。
 *   这条把「隐喻词典里的画法必须可执行」变成机器关卡：
 *   词典里写的每个 helper 都必须在 templates/engine.js 或 templates/kit/*.js 里真实存在，
 *   每个视觉动词都必须来自 references/visual-verbs.md 的 20 个动词。
 *   写一个不存在的 helper 名 = 隐喻当场失效且没有任何报错。
 */
export default {
  id: 'E32',
  type: 'B',
  title: '画法必须来自隐喻词典或显式标注新造',
  source: 'references/visual-metaphors.md',
  defects: ['36'],
  status: 'active',
  implementation: { file: 'scripts/test-visual-metaphors.mjs', marker: 'rule: E32' },
  tests: ['scripts/test-visual-metaphors.mjs'],
  fix: '把画法回填进 references/visual-metaphors.md：主表每行写清「概念 | 画法 | 用到的组件/helper | 对应视觉动词」；helper 名必须是 templates/engine.js 或 templates/kit/*.js 里真实存在的名字，动词必须来自 references/visual-verbs.md；词典里没有的概念走「新造画法」流程，在两级设计卡里显式标注 [新造] 并说明理由，交付后回填词典'
};
