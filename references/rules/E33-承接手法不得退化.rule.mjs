/* E33 · 承接手法不得退化
 * 类型：B（工艺规范，可机器判定）
 * 文档出处：references/motion-carry.md
 * 真实缺陷：33（23 行承接表的「怎么变」一字不差全是同一句套话，E03/E05 全部通过，承接设计根本不存在）
 * 实现：templates/kit/storyboard-contract.js（rule: E33）
 * 测试：scripts/test-storyboard-contract.mjs
 *
 * 为什么要有它：
 *   「要求填 N 行自由文本」这种校验形态本身会诱导退化 —— 要 23 行得到 23 行套话，
 *   要 6 行才会得到真答案。所以这条规则不是「再写一句提醒」，而是把自由文本改成枚举，
 *   再用三条断言兜住「枚举也套模板」的退路。
 *
 *   ① method ∈ 枚举（长成/展开/归档/落下/分出多个/多个汇成一个/替换）—— 硬失败
 *   ② 同一 method 连续出现 > 5 次 —— 失败（提示检查是否在套模板）
 *   ③ detail 去重率 len(set)/len < 0.6 —— 失败（每行都在说同一句话）
 *
 *   另配流程层对策：拍数 > 12 的长片，表E 只强制填写语义段落边界（4–8 行）。
 */
export default {
  id: 'E33',
  type: 'B',
  title: '承接手法不得退化',
  source: 'references/motion-carry.md',
  defects: ['33'],
  status: 'active',
  implementation: { file: 'templates/kit/storyboard-contract.js', marker: 'rule: E33' },
  tests: ['scripts/test-storyboard-contract.mjs'],
  fix: '把「怎么变」改成手法枚举（method）+ 具体描述（detail）；长片只填 4–8 个语义段落边界'
};
