# EXAMPLE · 一份填满的六表范例

> **这是一段修好过的片段，弱模型照这个格式填写即可。**
>
> 素材：`studio/production-jobs/motion-4cfd2c66-bdf6-49b5-ac50-e9a4bf1f6c6c/`（DeepSeek Super Agent 期，全仓库唯一走完整条链路的任务）。
> 取两段：视觉开场 `b01→b02`、核心机制 `b13→b14`。旁白与时间戳来自真实 SRT，代码片段能直接跑。
> 最后有一节**反例**，是本仓库最贵的教训，务必先看反例再抄正例。

## 片段背景

| 项 | 内容 |
|---|---|
| 主题 | 「DeepSeek Super Agent」口播解说 |
| 视觉母结构 | **一张任务卡**（`#task-card`）贯穿全片：散件 → 能力卡 → 完成印记 → 分家 → 走进窗口 → 状态丢失 → 收拢回人手里 → 交给中枢 → 落到工位 → 汇报回中枢 → 跨渠道 → 折进技术栈 → 回到人手里 |
| 色板 | `#c6ff3d` 荧光绿（主）／`#8ad8ce` 青（次）／`#ed6a5a` 红（对立）；底 `#0d1a16` |
| 版式 | 标题带 y=230 · 上层文字 y=330 · 中枢节点 y=470 · 卡片停位 y=600–700 · worker 工位 y=900 · 渠道入口／底层 y=1190 |

## 表A 节拍表

| 拍 | 起止 | 字幕（拆分后） | 关键词@时间 | 拍类型 | 视觉动词 |
|---|---|---|---|---|---|
| b01 | 2.97–8.17 | 过去两年／agent 的能力进步很快／写代码 查资料 整理文档 操作浏览器 | 能力 @4.28 | 引入 | 出现 |
| b02 | 8.37–11.87 | 单个任务交给 agent 往往／已经能完成得很不错 | 完成 @10.76 | 强调 | 盖章 |
| b13 | 60.50–64.10 | 判断任务归属／分派工作／但不亲自下场执行 | 分派 @61.50；下场 @63.23 | 展开 | 落下 |
| b14 | 64.13–69.87 | 而 worker 是独立工作间／每个 worker 专注推进一项任务／完成后向 Router 汇报 | 独立工作间 @64.79；推进 @66.91；汇报 @69.39 | 承接 | 运转 |

**通过条件自查**：字幕每行 ≤14 字、每屏 ≤2 行 ✔；每拍时长 5.20/3.50/3.60/5.74 秒，均在 1.5–3.5s 的**例外**（长句一拍可到 5.7 秒，本期由语义段落决定，见 `references/rhythm.md`）✔；每拍恰好一个视觉动词 ✔；无仪式动作超配额 ✔。

关键词时间算法：`关键词时间 = 句子开始 + (关键词前字数 ÷ 句子总字数) × 句子时长`。
例：`完成` 在「已经能完成得很不错」（10.200 起，1.666 秒，9 字，前 3 字）→ 10.200 + 3/9×1.666 = **10.76**。

## 表B 结构表

| 项目 | 内容 |
|---|---|
| 最外层模式 / 骨架 | **流程 + 人的行为**。骨架是「能力聚成一件可交付的东西 → 这件东西被交给别人做 → 做完了汇报回来」。开场与机制段共用同一条骨架，不重新起结构 |
| 持续主体及形态链 | `一张任务卡（成形）→ 四项能力在清单上逐项勾上 → 盖上完成印记 → （交给中枢）→ 沿连线落到 worker 工位 → 在工位里运转推进 → 沿连线汇报回中枢 → 归档回卡面` |
| 人物组（角色） | 无脸人形轮廓（`#figure`，只留头肩外轮廓 + 点阵填充），仅在「卡在人手里」一镜出现 |
| 上一段末帧留下的 | 任务卡停在 (540, 600)，四项能力已逐项勾上（b01 末帧） |
| 本段末帧留给下一段的 | 任务卡回到中枢脚下 (540, 700)，连线消失，下一拍可继续从中枢分派（b14 末帧） |

**通过条件自查**：主体叫得出名字（「任务卡」，不是 `N1`）✔；形态链覆盖本段每个话题 ✔；首帧末帧都写清 ✔。

## 表C 布局表

| 拍 | 布局模板 | 焦点在哪个坐标 | 和上一拍相比移动了什么 |
|---|---|---|---|
| b01 | L1 单主体居中 | 任务卡 (540, 600) | 首拍，无上一拍。四项能力从左侧依次平移进清单 (448,850+i×58)，逐项画勾 |
| b02 | L1 单主体居中 | 任务卡 (540, 600)，完成印记压在卡面右上 | 主体未移动；新增印记从 (600,400) 落到 (600,505) |
| b13 | L4 上下流程 | 中枢节点 (540, 470)，任务卡落到工位 (280, 900) | 卡片从 (540,700) 经弧线移到 (280,900)；新增分派连线 |
| b14 | L4 上下流程 | 工位里的卡 (280, 900)，汇报连线指向 (540, 620) | 卡片先停在工位运转，再沿连线回到中枢 |

**通过条件自查**：每个坐标都能在 `references/stage-layout.md` 的模板里找到出处 ✔；无元素进入 y≥1360 ✔；每拍焦点唯一 ✔。

坐标出处速查：L1 主体 (540,780)｜L4 入口 (540,600)、处理节点 (540,930)｜R 索引槽 (250,285)/(540,285)/(830,285)｜地面标签基线 y=1240｜注释基线 y=1274。

## 表D 分镜表

| 拍 | 起止 | 字幕 | 焦点 | 视觉动词 | 画面描述（一句） | 关键词对齐 |
|---|---|---|---|---|---|---|
| b01 | 2.97–8.17 | 过去两年…操作浏览器 | 一张任务卡 | 出现 | 一张任务卡先落定，四项能力按说出的顺序在清单上逐项勾上 | 能力 @4.28，强调动作 cardPop 4.33 → **+0.05**；能力四项 5.45/6.00/6.56/7.29 各自对齐 |
| b02 | 8.37–11.87 | 单个任务交给 agent 往往…很不错 | 卡面上的完成印记 | 盖章 | 一枚「✓ 完成」印章从斜 20° 压到卡面右上并回弹 | 完成 @10.76，印章落下 8.87 落位后停在卡面 → 印章已在位，**−1.89（提前强调，落在入场后持续态）** |
| b13 | 60.50–64.10 | 判断任务归属…不亲自下场执行 | 分派出去的连线 | 落下 | 中枢脚下拉出一条折线连线，任务卡沿它落到 worker 工位 | 分派 @61.50，连线 60.7 显形 → **−0.80（入场提前，符合“可提前 0.3–1 秒”）**；下场 @63.23，连线 64.1 收 → **+0.87（收在词后）** |
| b14 | 64.13–69.87 | 而 worker 是独立工作间…向 Router 汇报 | 独立工作间里推进的卡 | 运转 | 工位里的卡持续运转，一条流动虚线把它连回中枢 | 汇报 @69.39，虚线 66.53 起流动 → **−2.86（结构先行，词语落在流动中段）** |

**通过条件自查**：每拍只有一个焦点 ✔；动词全部来自 `references/visual-verbs.md` ✔；强调动作与关键词的差值写在最后一列、可核对 ✔。

## 表E 承接表

「怎么变」列只填手法枚举（`references/motion-carry.md`）：`长成 / 展开 / 归档 / 落下 / 分出多个 / 多个汇成一个 / 替换`。

| 边界时间 | 上一拍留下的对象 | 怎么变（手法） | 具体描述 | 变成下一拍的什么 |
|---|---|---|---|---|
| b01 → b02 | 已被四项能力填满的任务卡 | 落下 | 完成印记从斜 20° 落到卡面右上 (600,505)，落定时回弹到 -12°，随后 11.77–11.87 淡出 | 盖着完成印记的同一张卡面 |
| b02 → b13 | 盖着完成印记的任务卡 | 落下 | 印记淡出，卡沿 x/y 关键帧从 (540,700) 移到 (280,900)，途中无透明度变化 | 落到 worker 工位上的同一张卡 |
| b13 → b14 | 分派连线末端 (280,860) 的任务卡 | 落下 | 汇报虚线从 (280,860) 接回 (540,620)，卡沿虚线方向回中枢 | 汇报回中枢的同一张卡 |

**通过条件自查**：无空行 ✔；每个边界的「怎么变」都取自决策树枚举 ✔；「具体描述」三行互不相同 ✔。

> 长片降填规则：拍数 >12 时，表E 只强制填**语义段落边界**（通常 4–8 行）。本例两段共 4 拍、2 个边界，所以全填；24 拍的长片只填段落边界即可。

## 表F 元素表

| 元素 | 是什么 | 图层 | 坐标(模板出处) | 出生时间方式 | 死亡时间方式 | 承接自 | 承接给 |
|---|---|---|---|---|---|---|---|
| `#task-card` | 持续主体：任务卡 | `L.main` | L1 主体 (540,600)；工位 (280,900)（L4 处理节点） | b01 3.27 淡入（`o` 轨道） | 不退场，直到全片结束 | —（首拍诞生） | b02 印记、b13 连线、b14 汇报 |
| `#ability-1..4` | 四项能力勾选框（**页面级自绘，不是母版**） | `L.over` | 卡片下方竖列 (448,850)/(448,908)/(448,966)/(448,1024) | b01 5.45/6.00/6.56/7.29 逐项出现并画勾 | b03 起 0.45s 淡出 | — | —（b03 让位给「一个新的问题」） |
| `#stamp-ok` | 「✓ 完成」印章 | `L.top` | (600,505)（卡面右上，L1 主体区内偏移） | 8.37 淡入 + `s` 0.5→1 回弹 | 11.77→11.87 淡出 | `#task-card` | —（b13 前已退场） |
| `#route-line` | 分派连线（折线 + 流动点） | `L.over` | 路径 (540,560)→(410,720)→(280,860)（L4 入口→工位） | 60.5→60.7 淡入 | 64.1→64.4 淡出 | `#task-card`（从中枢出发） | `#report-line` |
| `#report-line` | 汇报连线（流动虚线） | `L.over` | 路径 (280,860)→(410,740)→(540,620) | 66.33→66.53 淡入 | 69.87→70.07 淡出 | `#route-line` | `#task-card`（回到中枢） |
| `#route-label` | 「判断归属 · 分派 · 不下场」 | `L.labels` | (540,330)（标题带 y=230 下方） | 60.5→60.7 淡入 | 64.1 淡出 | — | — |
| `#report-label` | 「完成后，向中枢汇报」 | `L.labels` | (540,1190)（过渡区上沿） | 66.43→66.63 淡入 | 69.87 淡出 | — | — |

**通过条件自查**：坐标都有出处 ✔；无元素进 y≥1360 ✔；每个元素有出生和死亡 ✔；「承接自/承接给」至少一项非空 ✔；子元素时间窗不长于父组 ✔。

## 数据 → 画面映射声明

```text
// 本片段没有数字型数据。四项能力 = 四类能力（写代码/查资料/整理文档/操作浏览器），
// 是把「四个并列能力」画成清单上四个勾选框，不是四格百分比 —— 不编数字、不画比例。
```

## 真实代码片段（能跑，调用 `templates/engine.js` 真实 helper）

```js
/* ---------- 持续主体：任务卡（同一 DOM 身份贯穿全片） ---------- */
const card = place(L.main, CARD, 'task-card', {
  role: 'subject', sem: "task-card", anchor: 'free',
  verb: '出现', verbFrom: 2.97, verbTo: 8.57
});
const HOME = [540, 600];        // 卡在主视觉区中心（L1）
const WORKER_AT = [280, 900];   // 落到 worker 工位（L4 处理节点）
act(card, T0, END, {
  x: [[2.97, HOME[0]], [61.1, HOME[0]], [62.7, WORKER_AT[0], eio], [END, WORKER_AT[0]]],
  y: [[2.97, HOME[1]], [61.1, HOME[1]], [62.7, WORKER_AT[1], eio], [END, WORKER_AT[1]]],
  s: [[2.97, .95], [62.7, .50, eio], [END, .50]],
  o: [[2.97, 0], [3.27, 1], [END, 1]]
});

/* ---------- 拍1：四项能力勾选框按说出的顺序逐项勾上 ---------- */
/* 不用母版 —— 原先用的是一个 136×136 描边方框加上下左右引脚的母版，
   观众一眼就读成 CPU 芯片。改成页面级自绘件：圆角方框 + 一笔勾 + 一个能力词。
   自绘件与印章、状态条、问题边界同一层级，不进母版库。 */
const ABILITY_WORDS = ['写代码', '查资料', '整理文档', '操作浏览器'];
const ABILITY_AT = [[448, 850], [448, 908], [448, 966], [448, 1024]];
ABILITY_AT.forEach(([ax, ay], i) => {
  const land = EV.b01['ability' + (i + 1)];      // 强调时刻读自 storyboard.json
  const el = G(L.over);
  el.setAttribute('id', 'ability-' + (i + 1));
  Kit.describe(el, { role: 'state', sem: "task-card", group: 'abilities',
    verb: '出现', verbFrom: land, verbTo: land + .6 });
  MotionEngine.mk('rect', { x: -17, y: -17, width: 34, height: 34, rx: 8,
    fill: 'none', stroke: STAGE_THEME.muted, 'stroke-width': 3 }, el);
  /* 勾是一笔画出来的（dashoffset），不是换个颜色 */
  const check = MotionEngine.mk('polyline', { points: '-9,1 -3,8 10,-8', fill: 'none',
    stroke: STAGE_THEME.accent, 'stroke-width': 5, 'stroke-linecap': 'round',
    'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, el);
  const word = MotionEngine.mk('text', { x: 30, y: 10, 'font-size': 26, 'font-weight': 700,
    fill: STAGE_THEME.text, 'text-anchor': 'start' }, el);
  word.textContent = ABILITY_WORDS[i];
  /* 入场从左侧平移（不从上方落下：会横穿上一行，引擎 lint 判文字重叠） */
  act(el, T0, END, {
    x: [[land - .5, ax - 170], [land, ax, eio], [END, ax]],
    y: [[land - .5, ay], [land, ay, eo], [END, ay]],
    s: [[land - .5, .62], [land, 1, back], [END, 1]],
    o: [[land - .5, 0], [land - .3, 1], [11.93, 1], [12.38, 0], [END, 0]]
  }, t => {
    const u = Math.max(0, Math.min(1, (t - land) / .35));
    check.setAttribute('stroke-dashoffset', String(1 - u));
  });
});

/* ---------- 拍2：完成印记盖在卡上 ---------- */
const stamp = G(L.top);
stamp.setAttribute('id', 'stamp-ok');
Kit.describe(stamp, { role: 'state', sem: "task-card", stamp: true, verb: '盖章', verbFrom: 8.37, verbTo: 11.87 });
MotionEngine.mk('rect', { x: -80, y: -26, width: 160, height: 52, rx: 26, fill: 'none',
  stroke: STAGE_THEME.accent, 'stroke-width': 4 }, stamp);
const st = MotionEngine.mk('text', { x: 0, y: 0, 'font-size': 30, 'font-weight': 800,
  fill: STAGE_THEME.accent, 'text-anchor': 'middle' }, G(stamp));
st.textContent = '✓ 完成';
act(stamp, T0, END, {
  x: 600, y: [[8.37, 400], [8.87, 505, eo], [END, 505]],
  s: [[8.37, .5], [8.87, 1, back]],
  r: [[8.37, -20], [8.87, -12, back]],
  o: [[8.37, 0], [8.55, 1], [11.77, 1], [11.87, 0]]
});

/* ---------- 拍13：任务沿可见路径落到工位 ---------- */
const ROUTE = [[540, 560], [410, 720], [280, 860]];
const routeLine = G(L.over);
routeLine.setAttribute('id', 'route-line');
Kit.describe(routeLine, { role: 'relation', sem: "task-card", group: 'route', verb: '落下', verbFrom: 60.5, verbTo: 64.1 });
MotionEngine.mk('polyline', { points: ROUTE.map(q => q.join(',')).join(' '), fill: 'none',
  stroke: STAGE_THEME.muted, 'stroke-width': 3, 'stroke-linecap': 'round' }, routeLine);
act(routeLine, T0, END, { x: 0, y: 0, s: 1, o: [[60.5, 0], [60.7, .8], [64.1, .8], [64.4, 0]] });

/* ---------- 拍14：完成后向中枢汇报（「运转」必须真的有动作轨迹，E21） ---------- */
const reportLine = G(L.over);
reportLine.setAttribute('id', 'report-line');
Kit.describe(reportLine, { role: 'relation', sem: "task-card", group: 'report', verb: '运转', verbFrom: 64.13, verbTo: 69.87 });
const reportPath = MotionEngine.mk('polyline',
  { points: [[280, 860], [410, 740], [540, 620]].map(q => q.join(',')).join(' '), fill: 'none',
    stroke: STAGE_THEME.accent, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '20 16' },
  reportLine);
Kit.markPredicate(reportLine, 'pulse');
MotionEngine.S(reportLine, T0, END, t => {
  if (t < 64.13 || t > 70.27) return;
  reportPath.setAttribute('stroke-dashoffset', String(-(((t - 64.13) * 70) % 36)));
});
act(reportLine, T0, END, { x: 0, y: 0, s: 1,
  o: [[64.13, 0], [66.33, 0], [66.53, .9], [69.87, .9], [70.07, 0]] });
```

用到的 helper 全部真实存在于 `templates/engine.js`：`act` / `S` / `G` / `MotionEngine.mk` / `MotionEngine.S`；语义注解走 `templates/kit/stage-kit.js` 的 `Kit.place` / `Kit.describe` / `Kit.markPredicate`。

## 交付格式（照这五项交）

1. 表A 至表F 全文；
2. 完整代码（文件头注释含映射声明）；
3. 本段末帧状态（下一段 `snapshotState` 复原用）；
4. 待确认事项（估算时间、数据疑问、转写疑问）；
5. `?lint` 面板显示「✓ 没有发现问题」。

---

# 反例 · 填满 ≠ 填对

> **下面这段通过了 E03（carry 非空）与 E05（承接表无空行）两条校验，但它是零信息的。**
> 它来自同一个任务的 `studio/production-jobs/motion-4cfd2c66-bdf6-49b5-ac50-e9a4bf1f6c6c/job.json` → `package.agentAnalysis.carryTable`，23 行真实产出，原样贴出。
> `how` 列 23 行**一字不差完全相同**；`survivor` 是上一拍 focus 机械拼接「（同一 DOM 身份 #task-card）」；`becomes` 是下一拍 focus 原样复制。
> 承接决策树要求 `how` 是手法词（长成 / 展开 / 归档 / 落下 / 分出多个 / 多个汇成一个 / 替换）——「主体保持身份，只改变形态与位置」一个都不是，它是对「承接」这个词的同义反复。

```json
{"boundary":"b01 → b02","survivor":"一张任务卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"卡面上的完成印记"}
{"boundary":"b02 → b03","survivor":"卡面上的完成印记（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"分开的三张卡"}
{"boundary":"b03 → b04","survivor":"分开的三张卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"三个窗口里各自推进的卡"}
{"boundary":"b04 → b05","survivor":"三个窗口里各自推进的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"空白掉的状态栏"}
{"boundary":"b05 → b06","survivor":"空白掉的状态栏（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"收拢进人形手中的卡"}
{"boundary":"b06 → b07","survivor":"收拢进人形手中的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"交给中枢节点的卡"}
{"boundary":"b07 → b08","survivor":"交给中枢节点的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"被划掉的「更聪明」"}
{"boundary":"b08 → b09","survivor":"被划掉的「更聪明」（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"关键判断句"}
{"boundary":"b09 → b10","survivor":"关键判断句（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"卡在人身上的多任务"}
{"boundary":"b10 → b11","survivor":"卡在人身上的多任务（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"展开的双层架构"}
{"boundary":"b11 → b12","survivor":"展开的双层架构（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"总协调节点脚下的卡"}
{"boundary":"b12 → b13","survivor":"总协调节点脚下的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"分派出去的连线"}
{"boundary":"b13 → b14","survivor":"分派出去的连线（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"独立工作间里推进的卡"}
{"boundary":"b14 → b15","survivor":"独立工作间里推进的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"跨渠道迁移的卡"}
{"boundary":"b15 → b16","survivor":"跨渠道迁移的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"随时打开的渠道入口"}
{"boundary":"b16 → b17","survivor":"随时打开的渠道入口（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"自己决定动或静的卡"}
{"boundary":"b17 → b18","survivor":"自己决定动或静的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"长成三层的技术栈"}
{"boundary":"b18 → b19","survivor":"长成三层的技术栈（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"另一个问题"}
{"boundary":"b19 → b20","survivor":"另一个问题（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"谁来承载的卡"}
{"boundary":"b20 → b21","survivor":"谁来承载的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"三层分工的卡"}
{"boundary":"b21 → b22","survivor":"三层分工的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"落进技术栈的卡"}
{"boundary":"b22 → b23","survivor":"落进技术栈的卡（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"回到人身上的协调成本"}
{"boundary":"b23 → b24","survivor":"回到人身上的协调成本（同一 DOM 身份 #task-card）","how":"主体保持身份，只改变形态与位置","becomes":"松开卡片的手"}
```

### 它为什么能通过校验

| 校验 | 为什么拦不住 |
|---|---|
| E03 每拍必须写清跨句承接 | 只查 `carry` 字段非空 —— 23 行都非空 |
| E05 表E 承接表不得有空行 | 只查空行 —— 23 行都填满了 |

### 它为什么是错的

- **`how` 列不是手法词。** 23 行完全相同 ⇒ `detail` 去重率 = 1/23 = **0.04**，远低于 E33 的 0.6 门槛。
- **它没有回答任何一个具体问题。** 看完这行字，你不知道四项能力是怎么一项项勾上并让位的、也不知道卡是怎么从工位回到中枢的 —— 而这两件事在代码里恰恰都有具体实现（`act` 的 x/y 关键帧 + 透明度轨道）。
- **它把「承接」当成了一个名词。** 承接是**动作**，必须能被画出来；写成「保持身份，只改变形态与位置」等于什么都没说。

### 正确写法长什么样

同一份产出，正例只有两条：

```json
{"boundary":"b01 → b02","survivor":"已被四项能力填满的任务卡","method":"落下",
 "detail":"完成印记从斜 20° 落到卡面右上 (600,505)，落定时回弹到 -12°，随后 11.77–11.87 淡出"}
{"boundary":"b13 → b14","survivor":"分派连线末端 (280,860) 的任务卡","method":"落下",
 "detail":"汇报虚线从 (280,860) 接回 (540,620)，卡沿虚线方向回中枢"}
```

差别只有两点，但决定了这套设计是「承接」还是「换页」：

1. **`method` 是枚举**，只能从 `长成 / 展开 / 归档 / 落下 / 分出多个 / 多个汇成一个 / 替换` 里选 —— 填不出套话。
2. **`detail` 必须写出具体坐标、具体方向、具体形态变化** —— 于是 `detail` 的去重率天然接近 1。

### 结构性对策（不是「再加一条规则」）

| 对策 | 落点 |
|---|---|
| 自由文本 → 枚举 | `carryTable[].method`（枚举）+ `carryTable[].detail`（字符串），见 `references/motion-carry.md` |
| 反退化校验 | **E33**：`method ∈ 枚举`、同一 method 连续 >5 次失败、`detail` 去重率 <0.6 失败 |
| 降低机械填充收益 | 拍数 >12 的长片，表E 只强制填语义段落边界（4–8 行），段落内部由 method 枚举 + 默认值覆盖 |
| 对话路径也能自检 | `node scripts/check-storyboard.mjs <storyboard.json>`（同一套纯函数，设计台路径与对话路径共用） |

> **要 23 行会得到套话，要 6 行才会得到真答案。** 同一期任务的 `studio/production-jobs/motion-4cfd2c66-bdf6-49b5-ac50-e9a4bf1f6c6c/samples.json` 里只写了两条 carry —— 两条都是真答案（见本文件开头「片段背景」）。
