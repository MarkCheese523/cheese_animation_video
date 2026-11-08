/* Cheese Motion · 装配层 kit（浏览器侧 · L2 构图校验）
 *
 * L1 渲染层（引擎自带 lint）查的是「画得对不对」：越界、文字重叠、时间窗。
 * L2 构图层查的是「画得像不像样」：主体有没有塌缩成一丁点、同一组信息是不是散在
 * 画面各处、说要「装进去」的东西是不是真的在容器里、一帧里是不是只有一个焦点。
 *
 * 这四条对应本期四个真实返工：
 *   E17 主体被缩到母版的 17%（占位比塌缩）
 *   E18 信号组要素分居画面两端（组聚拢）
 *   E19 压缩后模块露在机身外（装入没被容器包含）
 *   E20 焦点不唯一
 *
 * 全部靠元素自带的语义注解判定，不依赖人的主观判断 —— 这是「机器查一致，
 * 人查好坏」的分工。
 */
/* rule: E17 */
/* rule: E18 */
/* rule: E19 */
/* rule: E20 */
(function (root) {
  'use strict';
  const Kit = root.Kit;
  if (!Kit) throw new Error('[kit] lint-composition 必须在 stage-kit 之后加载');

  const STAGE_W = 1080, STAGE_H = 1920;   // 舞台设计尺寸
  const SUBTITLE_TOP = 1360;              // 字幕区禁入上界（references/stage-layout.md）
  const SCREEN_SCALE = 1080 / STAGE_W;    // 页面按视口缩放舞台时的换算基准

  function unionBox(boxes) {
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map(b => b.x));
    const y = Math.min(...boxes.map(b => b.y));
    const right = Math.max(...boxes.map(b => b.x + b.w));
    const bottom = Math.max(...boxes.map(b => b.y + b.h));
    return { x, y, w: right - x, h: bottom - y };
  }

  function groupBy(items, keyFn) {
    const map = new Map();
    for (const item of items) {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }

  /**
   * L2 构图校验。
   * @param {Array} audit Kit.audit() 的结果
   * @param {object} options { minSubjectRatio } 阈值
   */
  function lintComposition(audit, options = {}) {
    const issues = [];
    const minSubjectRatio = options.minSubjectRatio ?? 0.12;
    const maxGroupSpread = options.maxGroupSpread ?? 2.5;

    const stage = (audit.find(item => item.stageBox) || {}).stageBox;
    const stageWidth = stage ? stage.w : STAGE_W;
    const stageHeight = stage ? stage.h : STAGE_H;

    /* E17 主体占位比：持续主体不得塌缩成画面里的一丁点 */
    const subjects = audit.filter(item => item.role === 'subject' && item.box);
    if (subjects.length) {
      const box = unionBox(subjects.map(item => item.box));
      const ratio = Math.max(box.w, box.h) / stageWidth;
      if (ratio < minSubjectRatio) {
        issues.push(`E17 主体占位比塌缩：持续主体合计只占画面宽度 ${(ratio * 100).toFixed(1)}%，低于 ${(minSubjectRatio * 100).toFixed(0)}% —— 观众看不见它。`);
      }
    }

    /* E18 同组信息必须聚拢：同一组的元素不得散在画面两端 */
    const grouped = groupBy(audit.filter(item => item.group && item.box), item => item.group);
    for (const [name, items] of grouped) {
      if (items.length < 2) continue;
      const sorted = [...items].sort((a, b) => a.box.x - b.box.x);
      const gaps = [];
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = sorted[i - 1].box;
        const current = sorted[i].box;
        gaps.push(Math.max(0, current.x - (previous.x + previous.w)));
      }
      const widest = Math.max(...items.map(item => item.box.w), 1);
      const maxGap = Math.max(...gaps, 0);
      if (maxGap > widest * maxGroupSpread) {
        issues.push(`E18 同组信息散开了：「${name}」组内最大间隙 ${Math.round(maxGap)}px，超过元素宽度的 ${maxGroupSpread} 倍 —— 同一组信息必须聚在一起看。`);
      }
    }

    /* E19 装入必须被容器包含：声明了容器的元素必须完全落在容器里 */
    const byId = new Map(audit.filter(item => item.id).map(item => [item.id, item]));
    for (const item of audit.filter(entry => entry.container && entry.box)) {
      const container = byId.get(item.container);
      if (!container || !container.box) continue;
      const inner = item.box, outer = container.box;
      const inside = inner.x >= outer.x - 2 && inner.y >= outer.y - 2
        && inner.x + inner.w <= outer.x + outer.w + 2
        && inner.y + inner.h <= outer.y + outer.h + 2;
      if (!inside) {
        issues.push(`E19 没装进去：${item.id || '(匿名)'} 声明装在 ${item.container} 里，但它的位置超出了容器边界（元素 ${Math.round(inner.x)},${Math.round(inner.y)} ${Math.round(inner.w)}×${Math.round(inner.h)} / 容器 ${Math.round(outer.x)},${Math.round(outer.y)} ${Math.round(outer.w)}×${Math.round(outer.h)}）。`);
      }
    }

    /* E20 焦点必须唯一：观众此刻只能看一个地方 */
    const focuses = audit.filter(item => item.role === 'focus');
    if (focuses.length > 1) {
      issues.push(`E20 焦点不唯一：同一时刻有 ${focuses.length} 个焦点（${focuses.map(item => item.id || '(匿名)').join('、')}）—— 每拍只能有一个焦点。`);
    }

    /* 焦点元素不得进字幕区 */
    const scale = stageHeight ? STAGE_H / stageHeight : 1;
    for (const item of focuses) {
      if (!item.box || !stage) continue;
      const bottomInStage = (item.box.y + item.box.h - stage.y) / scale;
      if (bottomInStage > SUBTITLE_TOP) {
        issues.push(`E20 焦点侵入字幕区：${item.id || '(匿名)'} 的底边（舞台坐标 ${Math.round(bottomInStage)}）越过字幕区上界 ${SUBTITLE_TOP}。`);
      }
    }

    return issues;
  }

  Kit.lintComposition = lintComposition;
  Kit.compositionHelpers = { unionBox, groupBy };
})(globalThis);
