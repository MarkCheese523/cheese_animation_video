/* E34 · 场景类型文档必须与注册表一致
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/scene-types.md
 * 真实缺陷：34（文档化 11 个页型，真实注册 5+1 个，注册表名字与位置都写错，照文档写配置直接白屏）
 * 实现：scripts/test-scene-types.mjs（rule: E34）
 * 测试：scripts/test-scene-types.mjs
 *
 * 为什么要有它：
 *   场景类型文档写完就没人再对着注册表校 —— 于是「文档说有、代码没有」
 *   重新长了出来。这条把「文档类型清单 == SCENE_BUILDERS 键集」变成可执行的事实。
 */
export default {
  id: 'E34',
  type: 'B',
  title: '场景类型文档必须与注册表一致',
  source: 'references/scene-types.md',
  defects: ['34'],
  status: 'active',
  implementation: { file: 'scripts/test-scene-types.mjs', marker: 'rule: E34' },
  tests: ['scripts/test-scene-types.mjs'],
  fix: '同步 references/scene-types.md 的类型清单与 props 字段；每个 type 必须能在 assets/template/scenes.js 的 SCENE_BUILDERS 里找到'
};
