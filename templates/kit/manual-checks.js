/* Cheese Motion · 人工必查清单（跨期共享的单一事实源）
 *
 * 背景：references/qa-delivery.md 的「人工必查清单」写着
 *   「lint 查不出、人工必查：首帧等于上段末帧；每个边界前后 0.5s 拖动可见承接变形；
 *     每拍只有一个焦点；数字语义与映射声明一致；观众可见标签无开发编号」
 * 这份清单准确，但写在文档最后一行，就等于不存在 —— 本期 11 个画面逻辑缺陷
 * 没有一个是 lint 抓到的，全是人眼看出来的。
 *
 * 所以：把它变成**带编号的清单**，并且**强制出现在每次交付的语义接触表里**。
 * 机器查渲染，人查语义；这张表就是人那一侧的验收入口。
 * 没列出来的检查项 = 没检查过。
 */
export const MANUAL_CHECKS = [
  { id: 'M1', title: '首帧等于上一拍末帧', hint: '摄像机、位置、尺寸、旋转、计数、标签一致', source: 'references/qa-delivery.md#人工必查清单' },
  { id: 'M2', title: '每个拍次只有一个焦点', hint: '观众此刻只能看一个地方', source: 'references/visual-verbs.md#通过条件' },
  { id: 'M3', title: '强调动作对准关键词', hint: '与关键词时间差在 −0.1~+0.3 秒', source: 'references/visual-verbs.md#通过条件' },
  { id: 'M4', title: '画面是字幕的补充而非复述', hint: '删掉画面文字后不损失新信息', source: 'SKILL.md#五审美取向' },
  { id: 'M5', title: '观众可见标签无开发编号', hint: '不出现 N1/P1 这类内部编号', source: 'references/qa-delivery.md#人工必查清单' },
  { id: 'M6', title: '数字语义与映射声明一致', hint: '每个数字都有来源或标注「示意」', source: 'references/data-viz.md#数据映射声明' },
  { id: 'M7', title: '静音看得懂这一拍在发生什么', hint: '关掉字幕仍能读出变化', source: 'SKILL.md#〇执行提示词' }
];

/** 全部人工必查项的编号（产线校验用）。 */
export const MANUAL_IDS = MANUAL_CHECKS.map(check => check.id);
