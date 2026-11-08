/* Cheese Motion · 装配层 kit（浏览器侧）
 *
 * 定位：templates/engine.js 之上的**装配层**。引擎负责时间轴，本 kit 负责
 * 「母版怎么摆、点阵怎么铺、品牌怎么落座、状态词怎么放」。
 * 铁律：引擎只开发一次，装配层也只开发一次 —— 每期 builder 只提供本期数据。
 *
 * 本文件封住的历史陷阱（每条都对应一次真实返工）：
 *   1) place() 内层 scale 与 act() 的 s 轨道相乘 → 主体缩到母版的 17%
 *      本 kit 的 place 签名里根本没有 scale；缩放只有两个合法来源：
 *      placeFitted（独占包围盒缩放）与 placeScaled（显式声明唯一来源）。
 *   2) 压缩只改尺寸不收间距 → 模块重叠、露在机身外
 *      compressInto() 断言 gap 必须大于元素宽度。
 *   3) 替换 SVG id 漏闭合引号 → 属性值吞掉后续属性，整张 SVG 解析破坏
 *      id 改名统一走 Node 侧 master.js 的 withIds()。
 *   4) 点阵用 pattern 填充 → patternUnits=userSpaceOnUse 的原点被浏览器绑到
 *      pattern 定义处，多处复用时除首个外全部错位
 *      需要复用的点阵一律走 Node 侧 dotMatrix() 的显式坐标。
 *
 * 语义注解（Phase 1）：元素可携带 role / verb / anchor / sem 四个声明，
 * 由 Kit.audit() 汇总给 L2 构图校验与 L3 语义校验使用。
 */
(function (root) {
  'use strict';
  if (root.Kit) return;

  const VERSION = '1.0.0';
  const ROLES = ['subject', 'focus', 'state', 'speech', 'brand', 'ambient', 'label', 'group', 'relation', 'container'];
  const ANCHORS = ['rack', 'device', 'pocket', 'carriage', 'base', 'stage', 'free'];

  function fail(message) { throw new Error('[kit] ' + message); }
  function group(layer) { return root.G(layer); }

  /* 主题读取：kit 独立成文件后不能再依赖 builder 闭包里的 STAGE_THEME
     （顶层 const 不会挂到 window）。这里自己从 CSS token 读，行为与 builder 一致。 */
  let THEME_CACHE = null;
  function theme() {
    if (root.STAGE_THEME) return root.STAGE_THEME;
    if (THEME_CACHE) return THEME_CACHE;
    const cssToken = name => getComputedStyle(root.document.documentElement).getPropertyValue(name).trim();
    THEME_CACHE = {
      background: cssToken('--background'), surface: cssToken('--surface'),
      ink: cssToken('--ink'), text: cssToken('--text'), muted: cssToken('--muted'),
      accent: cssToken('--accent'), accent2: cssToken('--accent-2'),
      oppose: cssToken('--oppose'), warning: cssToken('--warning'),
      ok: cssToken('--ok'), error: cssToken('--error'), onAccent: cssToken('--on-accent'),
      cardFill: cssToken('--card-fill'), cardStroke: cssToken('--card-stroke'),
      subtitle: cssToken('--subtitle'), subtitleBand: cssToken('--subtitle-band')
    };
    return THEME_CACHE;
  }

  /* ------------------------------------------------------------------ *
   * 语义注解
   * ------------------------------------------------------------------ */
  const CONTAINERS = ['state', 'subject', 'brand', 'group', 'container', 'ambient', 'focus'];

  function describe(el, meta) {
    if (!el || !meta) return el;
    if (meta.role && !ROLES.includes(meta.role)) fail(`未知 role "${meta.role}"（合法值：${ROLES.join('/')}）`);
    if (meta.anchor && !ANCHORS.includes(meta.anchor)) fail(`未知 anchor "${meta.anchor}"（合法值：${ANCHORS.join('/')}）`);
    if (meta.role) el.dataset.role = meta.role;
    if (meta.verb) el.dataset.verb = meta.verb;
    if (meta.anchor) el.dataset.anchor = meta.anchor;
    if (meta.sem) el.dataset.sem = meta.sem;
    if (meta.label) el.dataset.label = meta.label;
    if (meta.owner) el.dataset.owner = meta.owner;
    if (meta.group) el.dataset.group = meta.group;
    if (meta.container) el.dataset.container = meta.container;
    if (meta.splitFrom) el.dataset.splitFrom = meta.splitFrom;
    if (meta.stamp) el.dataset.stamp = '';
    if (meta.counter) el.dataset.counter = '';
    if (meta.strikeThrough) el.dataset.strikeThrough = '';
    // 时间窗化注解：同一个 DOM 跨拍承担不同的动词/容器时，用 from/to 限定生效区间
    if (meta.verbFrom != null) el.dataset.verbFrom = String(meta.verbFrom);
    if (meta.verbTo != null) el.dataset.verbTo = String(meta.verbTo);
    if (meta.containerFrom != null) el.dataset.containerFrom = String(meta.containerFrom);
    if (meta.containerTo != null) el.dataset.containerTo = String(meta.containerTo);
    if (meta.roleFrom != null) el.dataset.roleFrom = String(meta.roleFrom);
    if (meta.roleTo != null) el.dataset.roleTo = String(meta.roleTo);
    return el;
  }

  /* 判断时间窗是否覆盖 t（未给出 t 时视为始终生效） */
  function inWindow(t, from, to) {
    if (t == null) return true;
    if (from != null && t < Number(from)) return false;
    if (to != null && t > Number(to)) return false;
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 摆位
   * ------------------------------------------------------------------ */

  /* place：只做「把母版居中贴到 (x,y)」，缩放交给 act 的 s 轨道。
   * 签名里没有 scale —— 从 API 上消灭双重缩放，而不是靠人记住。
   * 注意：母版内容内部可能自带 scale（例如品牌母版的归一化层 translate+scale），
   * 那是母版自身的一部分（原始比例不得改变），**不能拦**。
   * 真正要拦的是「kit 自己套了两层缩放」—— 那是调用方失误，见 auditScale()。 */
  function place(layer, html, id, meta) {
    const g = group(layer);
    if (id) g.setAttribute('id', id);
    g.innerHTML = '<g transform="translate(-180 -180)">' + html + '</g>';
    g.dataset.kitScale = 'none';
    return describe(g, meta);
  }

  /* placeModule：母版拆件后按自身中心对齐（几何逐字沿用母版，只做 id 改名与居中）。 */
  function placeModule(layer, html, cx, cy, id, meta) {
    const g = group(layer);
    if (id) g.setAttribute('id', id);
    g.innerHTML = '<g transform="translate(' + (-cx) + ' ' + (-cy) + ')">' + html + '</g>';
    g.dataset.kitScale = 'none';
    return describe(g, meta);
  }

  /* placeFitted：按实际包围盒等比归一化到 box。
   * transform 列表自右向左执行：先 scale(k) 再 translate，故平移量必须乘 k。
   * 这是历史缺陷「品牌整体偏移」的根因修复点。 */
  function placeFitted(layer, html, box, meta) {
    const g = group(layer);
    g.innerHTML = '<g transform="translate(-180 -180)">' + html + '</g>';
    const inner = g.firstElementChild;
    inner.removeAttribute('transform');
    const bb = inner.getBBox();
    const w = bb.width, h = bb.height;
    const k = box / Math.max(w, h, 1);
    inner.setAttribute('transform',
      'translate(' + (-(bb.x + w / 2) * k) + ' ' + (-(bb.y + h / 2) * k) + ') scale(' + k + ')');
    g.dataset.kitScale = 'own';
    describe(g, meta);
    return { g, w: w * k, h: h * k, k };
  }

  /* placeScaled：显式声明「这里是唯一的缩放来源」。 */
  function placeScaled(layer, html, id, meta) {
    const g = group(layer);
    if (id) g.setAttribute('id', id);
    g.innerHTML = '<g transform="translate(-180 -180)">' + html + '</g>';
    g.dataset.kitScale = 'own';
    return describe(g, meta);
  }

  /* 审计：kit 自己套了两层缩放，或 kit 缩放又叠加了 act 的 s 轨道 —— 都会相乘。
   * 历史缺陷 15（主体缩到母版 17%）的根治点。
   * 为了让 builder 不必改调用方式，kit 包装全局 act，自动记录每个元素的 s 轨道。 */
  function scaleRange(track) {
    if (!Array.isArray(track) || !track.length) return null;
    let min = Infinity, max = -Infinity;
    for (const frame of track) {
      const value = Array.isArray(frame) ? frame[1] : frame;
      if (typeof value !== 'number') return null;
      min = Math.min(min, value); max = Math.max(max, value);
    }
    return { min, max };
  }

  (function wrapAct() {
    const rawAct = root.act;
    if (typeof rawAct !== 'function' || rawAct.__kitWrapped) return;
    const wrapped = function (el, t0, t1, K, fn) {
      if (el && el.dataset) {
        el.dataset.kitActScale = K && K.s ? 'yes' : 'no';
        const range = scaleRange(K && K.s);
        if (range) el.dataset.kitActScaleMin = String(range.min);
        if (range) el.dataset.kitActScaleMax = String(range.max);
      }
      return rawAct(el, t0, t1, K, fn);
    };
    wrapped.__kitWrapped = true;
    root.act = wrapped;
  })();

  /* rule: E10 缩放必须只有一个来源 */
  function auditScale(scope) {
    const root_ = scope || root.document;
    const issues = [];
    root_.querySelectorAll('[data-kit-scale="own"]').forEach(el => {
      let parent = el.parentElement;
      while (parent) {
        if (parent.dataset && parent.dataset.kitScale === 'own') {
          issues.push(`kit 缩放嵌套：${el.id || '(匿名)'} 位于另一个 kit 缩放元素 ${parent.id || '(匿名)'} 之内，两者会相乘。`);
          break;
        }
        parent = parent.parentElement;
      }
      const min = Number(el.dataset.kitActScaleMin);
      const max = Number(el.dataset.kitActScaleMax);
      if (el.dataset.kitActScale === 'yes' && Number.isFinite(min) && Number.isFinite(max)
        && !(min === 1 && max === 1)) {
        issues.push(`缩放叠加：${el.id || '(匿名)'} 自身已由 kit 归一化（scale=${el.dataset.kitScale}），又挂了 act 的 s 轨道（${min}~${max}），两者相乘会让主体缩到十几%。`);
      }
    });
    return issues;
  }

  /* ------------------------------------------------------------------ *
   * 布局计算
   * ------------------------------------------------------------------ */

  /* compressInto：把一组等宽元素压进一个容器。
   * 硬规则：间距必须大于元素宽度 —— 否则压缩后必然重叠或溢出容器。
   * 历史缺陷「模块 01/04 露在机身外」由这条断言根治。 */
  /* rule: E11 压缩间距必须大于元素宽度 */
  function compressInto(items, options) {
    const gap = Number(options.gap);
    const size = Number(options.size);
    const width = Number(options.width);
    if (!(gap > 0)) fail('compressInto(): gap 必须是正数');
    if (!(size > 0)) fail('compressInto(): size 必须是正数');
    if (width != null && !(gap > width)) {
      fail(`compressInto(): gap ${gap} 必须大于元素宽度 ${width}，否则压缩后必然重叠或溢出容器。`);
    }
    const total = items.length * width + Math.max(0, items.length - 1) * gap;
    const startX = (options.cx != null ? options.cx : 0) - total / 2 + width / 2;
    return items.map((item, index) => Object.assign({}, item, {
      x: startX + index * (width + gap),
      width, gap
    }));
  }

  /* ------------------------------------------------------------------ *
   * 常用绘制件
   * ------------------------------------------------------------------ */

  /* 通用声波弧：以 (cx,cy) 为圆心向右扩散的三道弧 —— 表示「人在说话」，
   * 不得用来冒充任何品牌标识。 */
  function ARC(cx, cy, r, t0, t1, color, meta) {
    const g = group(root.L.over);
    const path = root.MotionEngine.mk('path', {
      d: 'M 0 ' + (-r) + ' A ' + r + ' ' + r + ' 0 0 1 0 ' + r,
      fill: 'none', stroke: color || theme().accent,
      'stroke-width': 5, 'stroke-linecap': 'round'
    }, g);
    root.act(path, t0, t1, {
      x: cx, y: cy,
      s: [[t0, .55], [t0 + .28, 1, root.back], [t1 - .3, 1], [t1, 1.12]],
      o: [[t0, 0], [t0 + .18, 1], [t1 - .4, 1], [t1, 0]]
    });
    return describe(path, meta);
  }

  /* 流动粒子：沿两点直线跑一次，用来把「谁和谁发生关系」画出来。 */
  function FLOW(from, to, t0, t1, color, r, meta) {
    const g = group(root.L.over);
    const dot = root.MotionEngine.mk('circle', {
      r: r || 10, fill: color || theme().accent, filter: 'url(#glow)'
    }, g);
    root.act(dot, t0, t1, {
      x: [[t0, from[0]], [t1, to[0]]],
      y: [[t0, from[1]], [t1, to[1]]],
      o: [[t0, 0], [t0 + .14, 1], [t1 - .16, 1], [t1, 0]]
    });
    return describe(dot, meta);
  }

  /* 循环流动粒子：表示关系持续存在，而不是一次性事件。
   * tEnd 必须显式给出，否则会残留到下一拍（历史缺陷 24）。 */
  function FLOW_LOOP(from, to, t0, period, color, r, tEnd, meta) {
    /* rule: E12 循环粒子必须显式结束时间 */
    if (tEnd == null) fail('FLOW_LOOP(): 必须显式给出 tEnd，否则粒子会残留到下一拍。');
    if (!(tEnd > t0)) fail(`FLOW_LOOP(): tEnd(${tEnd}) 必须大于 t0(${t0})`);
    const g = group(root.L.over);
    const dot = root.MotionEngine.mk('circle', {
      r: r || 8, fill: color || theme().accent, filter: 'url(#glow)'
    }, g);
    root.MotionEngine.S(dot, t0, tEnd, t => {
      const u = (((t - t0) % period) + period) % period / period;
      dot.setAttribute('transform', 'translate(' + (from[0] + (to[0] - from[0]) * u) + ' ' + (from[1] + (to[1] - from[1]) * u) + ')');
      dot.setAttribute('opacity', (u < .18 ? u / .18 : u > .82 ? (1 - u) / .18 : 1).toFixed(3));
    });
    return describe(dot, meta);
  }

  /* 数值结果组：图标在上、数字在中、说明在下，三行都不进字幕区。 */
  function COUNTER(layer, x, y, capText, t0, t1, from, to, color, meta) {
    const g = group(layer);
    const val = root.T(g, '0', 0, 8, 44, color || theme().accent, { mono: 1, ls: 1 });
    const cap = root.T(g, capText, 0, 58, 23, theme().muted, { mono: 1, ls: 2 });
    root.act(g, t0, t1, { x, y, o: [[t0, 0], [t0 + .3, 1], [t1 - .4, 1], [t1, 0]] });
    root.CNT(val, t0 + .3, t1 - .6, from, to, v => Math.round(v) + 'ms');
    return describe(g, meta);
  }

  /* ------------------------------------------------------------------ *
   * 语义审计
   * ------------------------------------------------------------------ */

  /* 汇总页面里所有带语义声明的元素，供 L2 构图校验 / L3 语义校验使用。 */
  function audit(root_, t) {
    const scope = root_ || root.document;
    // 舞台矩形：页面会按视口缩放舞台，所有比例判断都要相对它
    const stage = (root_.document || root.document).getElementById('stage');
    const stageRect = stage ? stage.getBoundingClientRect() : null;
    const stageBox = stageRect ? { x: stageRect.left, y: stageRect.top, w: stageRect.width, h: stageRect.height } : null;
    const out = [];
    scope.querySelectorAll('[data-role],[data-verb],[data-anchor],[data-sem],[data-container],[data-group]').forEach(el => {
      const roleActive = inWindow(t, el.dataset.roleFrom, el.dataset.roleTo);
      const verbActive = inWindow(t, el.dataset.verbFrom, el.dataset.verbTo);
      const containerActive = inWindow(t, el.dataset.containerFrom, el.dataset.containerTo);
      out.push({
        el,
        id: el.id || null,
        role: roleActive ? (el.dataset.role || null) : null,
        verb: verbActive ? (el.dataset.verb || null) : null,
        anchor: el.dataset.anchor || null,
        sem: el.dataset.sem || null,
        owner: el.dataset.owner || null,
        label: el.dataset.label || null,
        group: el.dataset.group || null,
        container: containerActive ? (el.dataset.container || null) : null,
        splitFrom: el.dataset.splitFrom || null,
        stamp: el.hasAttribute('data-stamp'),
        counter: el.hasAttribute('data-counter'),
        strikeThrough: el.hasAttribute('data-strike-through'),
        hasPulse: el.hasAttribute('data-pulse') || !!el.querySelector('[data-pulse]'),
        hasRotate: el.hasAttribute('data-rotate') || !!el.querySelector('[data-rotate]'),
        // 必须用屏幕矩形：getBBox() 不含元素自身 transform，拿不到画面上的真实位置与大小
        box: (() => { try { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; } catch { return null; } })(),
        stageBox
      });
    });
    return out;
  }

  /* 标记动词谓词：元素声明了「运转」就必须真的在脉动/自转。
   * 由 builder 在加动画轨道时调用，L3 校验据此判断「声称的动词」与「实际动作」是否一致。 */
  function markPredicate(el, kind) {
    if (!el) return el;
    el.setAttribute('data-' + kind, '');
    return el;
  }

  /* 把画面渲染到 t 并跑全部语义检查 —— 供 QA 脚本在多个时间点调用 */
  function lintAt(t) {
    if (typeof root.renderAt === 'function') root.renderAt(t);
    const report = audit(root.document, t);
    const issues = [];
    if (typeof root.Kit.lintComposition === 'function') issues.push(...root.Kit.lintComposition(report));
    if (typeof root.Kit.lintSemantics === 'function') issues.push(...root.Kit.lintSemantics(report));
    return { t, issues, report };
  }

  root.Kit = {
    VERSION,
    ROLES,
    ANCHORS,
    lintAt,
    place, placeModule, placeFitted, placeScaled, auditScale,
    compressInto,
    ARC, FLOW, FLOW_LOOP, COUNTER,
    describe, audit, markPredicate, theme, inWindow
  };
})(globalThis);
