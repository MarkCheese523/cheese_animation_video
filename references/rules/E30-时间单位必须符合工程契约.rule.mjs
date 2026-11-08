/* E30 · 时间单位必须符合工程契约
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/scene-types.md
 * 真实缺陷：30（duration 的单位是秒，timing 的单位是毫秒 —— 同一个 scene 对象里混着两种单位）
 * 实现：scripts/validate_project.py（rule: E30）
 * 测试：scripts/test-unit-contract.mjs
 *
 * 为什么要有它：
 *   单位写错**不报错**，只让画面停在几小时之后。
 *   一段 12.634 秒的口播写成 `duration: 12634`，播放器会安静地把它当成 3.5 小时 ——
 *   没有 lint 会拦，没有任何一条日志会说「你把秒写成毫秒了」。
 *   所以单位必须被写进 Schema，并配一条量纲启发式（duration > 600 直接报错）。
 */
export default {
  id: 'E30',
  type: 'B',
  title: '时间单位必须符合工程契约',
  source: 'references/scene-types.md',
  defects: ['30'],
  status: 'active',
  implementation: { file: 'scripts/validate_project.py', marker: 'rule: E30' },
  tests: ['scripts/test-unit-contract.mjs'],
  fix: 'scenes[].start 与 scenes[].duration 写【秒】，scenes[].timing.* 写【毫秒】；duration 超过 600 秒会被量纲启发式拦下'
};
