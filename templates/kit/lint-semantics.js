/* Cheese Motion · 装配层 kit（浏览器侧 · L3 语义校验）
 *
 * L3 查的是「画的是不是它声称的东西」：
 *   E21 元素声称「运转」，画面上却没有在动
 *   E22 元素承担「说话」角色，语义标签却是云 —— 画面在表达相反的意思
 *   E23 承接不连续：同一主体的位置在拍次边界上跳变
 *
 * E22 是本期最贵的一个缺陷：第 4 拍把「云」图标当成语音源放在人物嘴边，
 * 而旁白是「照样听懂了你说的话」—— 观众看到的是云，不是人声。
 * 修它靠的不是「更小心」，而是让角色与语义标签变成可核对的数据。
 */
/* rule: E21 */
/* rule: E22 */
/* rule: E23 */
(function (root) {
  'use strict';
  const Kit = root.Kit;
  if (!Kit) throw new Error('[kit] lint-semantics 必须在 stage-kit 之后加载');

  /* 表D 视觉动词 → 可判定的谓词。
   * 只有能被元素注解判定的动词才有谓词；其余动词标注为 manual，由接触表逐条人工确认。 */
  const VERB_PREDICATE = {
    运转: item => item.hasPulse || item.hasRotate,
    停住: item => !item.hasPulse && !item.hasRotate,
    分出: item => Boolean(item.splitFrom),
    盖章: item => Boolean(item.stamp),
    计数: item => Boolean(item.counter),
    划掉: item => Boolean(item.strikeThrough)
  };
  const VERB_MANUAL = ['出现', '登场', '落下', '归位', '长成', '展开', '归档', '注入', '堵住', '滴出', '标红', '走进', '指向', '提问'];

  /* role=speech 允许的语义标签：只有「声音」类图形能承担说话角色 */
  const SPEECH_SEM = ['voice', 'voice-wave', 'speech', 'waveform'];

  function lintSemantics(audit, options = {}) {
    const issues = [];
    const speechSem = options.speechSem || SPEECH_SEM;

    /* E21 动词必须对应真实动作 */
    for (const item of audit.filter(entry => entry.verb)) {
      const predicate = VERB_PREDICATE[item.verb];
      if (!predicate) continue;
      if (!predicate(item)) {
        issues.push(`E21 声称的动词与画面不符：${item.id || '(匿名)'} 声明动词「${item.verb}」，但画面上没有对应的动作轨道（运转需脉动/自转，停住需无脉动）。`);
      }
    }

    /* E22 资产角色必须与语义标签一致 */
    for (const item of audit.filter(entry => entry.role === 'speech')) {
      if (!item.sem) {
        issues.push(`E22 角色缺语义标签：${item.id || '(匿名)'} 承担「说话」角色，但没有标注它到底是什么图形（sem）—— 无法判断它与旁白是否一致。`);
      } else if (!speechSem.includes(item.sem)) {
        issues.push(`E22 画面语义与旁白反相：${item.id || '(匿名)'} 承担「说话」角色，但它其实是「${item.sem}」—— 观众看到的是${item.sem}，不是人声。`);
      }
    }

    /* 品牌元素必须有角色声明，避免品牌抢焦点 */
    for (const item of audit.filter(entry => entry.role === 'brand' && entry.verb)) {
      if (item.verb === '出现' && item.role === 'focus') {
        issues.push(`E20 品牌标识不得成为本拍焦点：${item.id || '(匿名)'} 同时被声明为 brand 与 focus。`);
      }
    }

    return issues;
  }

  /**
   * E23 承接连续：相邻两个时间点之间，同一主体的位置不得跳变。
   * @param {Array} previous 上一个时间点的 audit
   * @param {Array} current 当前时间点的 audit
   * @param {object} options { maxJump } 单步最大位移（像素）
   */
  function lintCarry(previous, current, options = {}) {
    const issues = [];
    const maxJump = options.maxJump ?? 260;
    const before = new Map(previous.filter(item => item.id && item.box).map(item => [item.id, item]));
    for (const item of current.filter(entry => entry.id && entry.box)) {
      const prior = before.get(item.id);
      if (!prior) continue;
      const dx = item.box.x - prior.box.x;
      const dy = item.box.y - prior.box.y;
      const jump = Math.hypot(dx, dy);
      if (jump > maxJump) {
        issues.push(`E23 承接跳变：${item.id} 在相邻时间点之间位移了 ${Math.round(jump)}px（超过 ${maxJump}px）—— 跨句演化必须连续，不能瞬移。`);
      }
    }
    return issues;
  }

  Kit.lintSemantics = lintSemantics;
  Kit.lintCarry = lintCarry;
  Kit.VERB_PREDICATE = VERB_PREDICATE;
  Kit.VERB_MANUAL = VERB_MANUAL;
})(globalThis);
