# 场景类型速查

> 这里描述的是**设计台分镜预览器**（`assets/template/*`：`assets/template/player.js` + `assets/template/scenes.js` + `assets/template/motion-sequence.js` + `assets/template/motion-presets.js`）里的场景类型，**不是成片页型**。
> 成片一律走 `templates/engine.js` + `templates/kit/`（MotionEngine 与母版工具），那条链路的页面写法不在本表内。
> 本表只回答一件事：`project.json` 的 `scenes[].type` 能填什么、填了以后画面上会出现什么。

<!-- CI 读这一行核对 assets/template/scenes.js 的 SCENE_BUILDERS 键集（＋ motion-sequence.js 注册的 motionSequence）。改了这一行，scripts/test-scene-types.mjs 会失败。 -->
SCENE_TYPES: counter, flow, compare, reveal, end, motionSequence

---

## ⚠️ 单位警告（写错不报错，只是画面不动）

同一个 scene 对象里混着两种单位，这是本仓库最容易静默出错的地方。

| 字段 | 单位 | 证据 |
|---|---|---|
| `scenes[].duration` | **秒** | `assets/template/scenes.js:15` 把 `scene.duration * .55` 直接当秒用 |
| `scenes[].start` | **秒**（全片绝对起点） | `assets/template/player.js:69` `selectedScene()?.start` 与 `scene.start` 一起参与全局时间换算 |
| `scenes[].timing.*` | **毫秒**（相对本场景起点） | `assets/template/scenes.js:14` `(scene.timing.value \|\| 0) / 1000` |

也就是说：`duration: 12.634` 才是 12.6 秒。
把毫秒数直接写进 `duration` 会被当成秒 —— 一段 12 秒的口播写成毫秒，画面就会停在三小时之后。
`timing` 里的值则要写毫秒：`"value": 800` 表示本场景开始后 0.8 秒。

---

## 通用结构

```json
{
  "id": "counter-01",
  "type": "counter",
  "start": 0,
  "duration": 6.5,
  "props": { "label": "累计提交", "from": 0, "to": 128, "suffix": " 次" },
  "timing": { "value": 800, "caption": 3200 }
}
```

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `id` | string | 是 | 场景标识，小写字母 / 数字 / 连字符（`scripts/validate_project.py` 校验唯一性） |
| `type` | string | 是 | 场景类型，必须是上面 `SCENE_TYPES` 清单里的值 |
| `start` | number | 是 | 该场景在**全片**中的起点，单位**秒**，从 0 开始且必须与上一场景首尾相接 |
| `duration` | number | 是 | 该场景自身时长，单位**秒**，必须为正数 |
| `props` | object | 是 | 各类型的私有参数，见下 |
| `timing` | object | 否 | 场景内的关键帧时刻，单位**毫秒**，相对本场景起点 |

**注册表在哪**：渲染器注册表叫 `SCENE_BUILDERS`，定义在 `assets/template/scenes.js`（`counter` / `flow` / `compare` / `reveal` / `end`），
`motionSequence` 追加注册在 `assets/template/motion-sequence.js:2`。
`assets/template/player.js` 里**没有** `builders` 这个标识符，它只做 `SCENE_BUILDERS[scene.type]`（`assets/template/player.js:158`）；
type 没注册会直接抛错「未注册的场景类型」（`:159`），画面全白。

**校验器认的类型**：`scripts/validate_project.py` 的 `BUILTINS = {counter, flow, compare, reveal, end, motionSequence}`。

**渲染时序**：每个 builder 返回一个纯函数 `render(t)`，`t` 是**本场景内的秒数**（`assets/template/player.js:86` 用 `global - scene.start` 换算），
所以 `timing` 的毫秒值要除以 1000 才是场景内秒数。

---

## `counter` · 数字计数条

源码：`assets/template/scenes.js:2-30`

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `label` | string | 是 | 页眉文字，渲染成 `NN / label`（NN 是场景序号，从 01 起） |
| `from` | number | 否 | 计数起点数值，缺省 0（无单位） |
| `to` | number | 是 | 计数终点数值（无单位） |
| `suffix` | string | 否 | 数值后缀，如 `" 次"`、`"%"`（无单位） |
| `caption` | string | 否 | 底部说明文字，缺省为空串 |

### timing 键（毫秒）

| 键 | 类型 | 含义 |
|---|---|---|
| `value` | number | 开始计数的时刻（毫秒，相对本场景起点），缺省 0 |
| `caption` | number | 底部说明淡入的时刻（毫秒，相对本场景起点），缺省 0 |

### 渲染出的元素与坐标（画布 1080×1920）

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 页眉文本 `NN / label` | x=70, y=110, 34px | 下方有分隔线 (70,150)→(W−70,150) |
| 幽灵数字（空心描边） | x=540, y=700, 330px, 描边宽 4, 透明度 .08 | 显示 `to` 的值，随时间 2°/秒 缓慢旋转 |
| 主数值文本 | x=540, y=880, 190px, 900 字重 | 从 `from` 滚到 `to`；`to` 是整数则不带小数位 |
| 轨道线 | (140,1080)→(940,1080), 宽 30, 透明度 .14 | 圆头 |
| 阈值刻度线 | (540,1015)→(540,1145), #ff6b57, 宽 5 | 旁边的文字**写死为 `50%`**（`scenes.js:9`），不随 `to` 变化 |
| 进度条 | (140,1080)→ 动态 x2, #c6ff3d, 宽 24 | 长度 = `clamp(当前值, 0, 100)/100 × 800` |
| 滑块圆点 | cy=1080, cx 随进度, r=18 | 运动中 r 在 16~28 之间呼吸 |
| 底部说明文本 | x=540, y=1450, 48px | 对应 `props.caption` |

计数时长 = `min(2.8, duration × 0.55)` 秒（`scenes.js:15`），即**最长 2.8 秒**滚完。

### 适用语义场景

单个关键数字的滚动：累计提交数、规模数字、达成比例。观众需要一个"数字在涨"的注意力锚点时用它。
不适合表达多个数字（改用 `compare`）或先后关系。

---

## `flow` · 流程步骤链

源码：`assets/template/scenes.js:32-62`

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `label` | string | 是 | 页眉文字 `NN / label` |
| `nodes` | string[] | 是 | 步骤文案数组，第 i 项是第 i 个节点的文字 |
| `caption` | string | 否 | 底部说明文字，缺省为空串 |

### timing 键（毫秒）

| 键 | 类型 | 含义 |
|---|---|---|
| `nodes` | number[] | 每个节点入场的时刻（毫秒，相对本场景起点），第 i 项对应 `nodes[i]` |
| `caption` | number | 底部说明淡入时刻（毫秒，相对本场景起点），缺省 0 |

`timing.nodes` 缺省时按 `i × 800` 毫秒依次入场（`scenes.js:35`）。

### 渲染出的元素与坐标

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 节点卡片 | 路径 `M250-85H790L850-25V85H290L250 45Z`，整组平移到 y = 390 + i×310 | 填充 #fffdf7，描边 #102a22 宽 5 |
| 节点文案 | 组内 x=540, y=25, 72px, 居中 | 对应 `nodes[i]` |
| 节点间连接线 | (540, y+90)→(540, y+300), #c6ff3d, 宽 12, 虚线 `18 20` | 只在相邻节点之间生成 |
| 底部说明文本 | x=540, y=1580, 44px | 对应 `props.caption` |

入场动画：第 i 个节点从 `times[i]/1000` 起 0.65 秒、back 缓动（缩放 .65→1，纵向偏移 120→0）；连接线在起点 +0.45~+0.9 秒出现。

### 适用语义场景

有先后顺序的流程或步骤（3~5 步最好）：工作流拆解、操作链路、"先做 A 再做 B"。
步骤之间必须真的有方向性；并列要点请改用 `reveal`。

---

## `compare` · 左右对照卡

源码：`assets/template/scenes.js:64-91`

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `label` | string | 是 | 页眉文字 `NN / label` |
| `left` | object | 是 | 左卡，结构 `{ "title": string, "value": number }` |
| `right` | object | 是 | 右卡，结构 `{ "title": string, "value": number }` |
| `caption` | string | 否 | 底部说明文字，缺省为空串 |

`left` / `right` 内部的 `title` 是卡片标题（必填，否则渲染出 `undefined`），`value` 是条形图的目标数值（0~100，缺省 0）。

### timing 键（毫秒）

当前实现**不读取** `timing`：两张卡的入场、数值滚动、说明文字出现的时间都写死在代码里
（入场 0.2 秒 / 0.45 秒起，数值 1.1~3.2 秒，说明 3.1~3.7 秒）。写了 `timing` 也不会生效。

### 渲染出的元素与坐标

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 左卡底板 | x=90, y=420, 420×700, rx=34 | 填充 #fffdf7，描边 #102a22 宽 5 |
| 右卡底板 | x=570, y=420, 420×700, rx=34 | 同上 |
| 卡片标题 | x+210, y=540, 58px, 居中 | 左 `left.title` / 右 `right.title` |
| 数值文本 | x+210, y=800, 140px | 0 → 对应 `value` |
| 条形底槽 | x+60, y=1010, 300×34, rx=17, #102a22 透明度 .12 | 固定 |
| 条形填充 | x+60, y=1010, 高 34, 宽 = 300×value/100 | 左卡 #52635c，右卡 #c6ff3d |
| 底部说明文本 | x=540, y=1390, 44px | 对应 `props.caption` |

入场：左卡从 x−500、右卡从 x+500 滑入。

### 适用语义场景

两个方案的对照：A/B 选择、前后差异、有/无、贵/便宜。左右各自带一个可比数值时最有效。

---

## `reveal` · 要点逐条点亮

源码：`assets/template/scenes.js:93-110`

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `label` | string | 是 | 页眉文字 `NN / label` |
| `items` | string[] | 是 | 要点文案数组，第 i 项是第 i 条要点 |

### timing 键（毫秒）

当前实现**不读取** `timing`：第 i 条要点固定在 `i × 0.7` 秒开始入场，持续 0.65 秒。

### 渲染出的元素与坐标

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 要点底板 | x=150, y=360+i×280, 780×190, rx=28 | 偶数行填充 #fffdf7，奇数行填充 #c6ff3d，描边 #102a22 宽 5 |
| 要点文案 | x=540, y=480+i×280, 68px, 居中 | 对应 `items[i]` |

入场：从 y+90 偏移进入，back 缓动（缩放 .65 起手幅度来自 `api.back`）。

### 适用语义场景

并列要点清单（3~5 条）：清单、优势罗列、"三个理由"。不强调顺序时用它；
要强调顺序请用 `flow`。

---

## `end` · 收尾金句

源码：`assets/template/scenes.js:112-127`

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `title` | string | 是 | 收尾主标题（一句话） |
| `subtitle` | string | 否 | 副标题，缺省为空串 |
| `note` | string | 否 | 底部备注，缺省为空串 |

注意：`end` **不渲染页眉**（其余五类都会调 `api.header`）。

### timing 键（毫秒）

当前实现**不读取** `timing`：标题 0~0.9 秒、线条 0.55~1.35 秒、副标题 1.1~1.8 秒、备注 1.8~2.4 秒，全部写死。

### 渲染出的元素与坐标

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 主标题 | x=540, y=790, 108px, 居中 | 0~0.9 秒从 .55 倍缩放弹入 |
| 强调线 | (250,900)→(830,900), #c6ff3d, 宽 22, 圆头 | x2 从 250 画到 830 |
| 副标题 | x=540, y=1040, 48px, #52635c | 对应 `props.subtitle` |
| 底部备注 | x=540, y=1650, 30px, #52635c | 对应 `props.note` |

### 适用语义场景

一页只放一句话的收尾：金句、品牌落款、行动号召。主标题必须短（≤12 字最好读）。

---

## `motionSequence` · 组件级动效样片（默认类型）

源码：`assets/template/motion-sequence.js`（374 行）＋ `assets/template/motion-presets.js`（时间轴与缓动原语）。
元素状态与动效原语的词表在 `assets/template/element-states.js`（`ELEMENT_STATES` / `MOTION_CATALOG`）。
`assets/template/project.json` 的默认场景就是这一类。它不是"一页一要素"，而是**一个场景内部跑完一整条五拍时间轴**。

### props 字段

| 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `beats` | object[] | 否 | 五拍时间轴配置，见下；缺省用规范五拍（总时长 20 秒） |
| `elements` | object[] | 否 | 画面元素与已选素材的对应关系，见下 |
| `profile` | object | 否 | 品牌档案：`{ name, source, tokens }` |
| `profile.name` | string | 否 | 品牌名，缺省时回落到 `props.productName` |
| `profile.source` | string | 否 | `generic`（默认）或 `web-product`；后者强制走排版品牌 |
| `profile.tokens` | object | 否 | 三个色值 token：`{ accent, background, ink }` |
| `profile.tokens.accent` | string | 否 | 强调色，缺省 `#c6ff3d` |
| `profile.tokens.background` | string | 否 | 纸面底色，缺省 `#f4f0e6` |
| `profile.tokens.ink` | string | 否 | 主文字色，缺省 `#102a22`；亮度 > .62 时自动切深色底（surface `#1d3228`、raised `#294238`） |
| `motion` | object | 否 | 运动强度配置，目前只有 `intensity` |
| `motion.intensity` | string | 否 | `subtle` / `balanced`（默认） / `showreel`，见下表 |
| `productName` | string | 否 | 品牌名兜底，缺省 `MOTION SYSTEM` |
| `storyboardId` | string | 否 | 写进根节点 `data-storyboard-id`，便于分镜稿回指 |

### `beats` · 五拍时间轴

规范五拍（`motion-presets.js:30-36`）：

| 拍 id | 标签 | 规范起点（秒） | 规范时长（秒） | 默认 action |
|---|---|---|---|---|
| `gather` | 聚合 | 0 | 3 | `component-gather` |
| `trigger` | 点击 | 3 | 4 | `cursor-click` |
| `split` | 拆分 | 7 | 5 | `component-flow` |
| `switch` | 切换 | 12 | 4.75 | `state-reflow` |
| `resolve` | 归位 | 16.75 | 3.25 | `logo-resolve` |

| `beats[i]` 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `beats[].id` | string | 否 | 必须与规范拍 id **完全一致**且顺序相同，否则该拍的自定义被整拍忽略（`motion-presets.js:39`） |
| `beats[].label` | string | 否 | 拍标题（左上角大字），缺省用规范标签 |
| `beats[].action` | string | 否 | 拍的行为分支，缺省用规范 action，见下表 |
| `beats[].duration` | number | 否 | 该拍时长，单位**秒**，取值 1~12；越界回落到规范时长（`motion-presets.js:40`） |

- 拍的**实际起点由前序拍时长累加得出**（`motion-presets.js:42`），配置里写不了 `start`。
- 规范起点/时长是"画布时间轴坐标"，渲染时用 `timeline.warp` 把实际时间映射回规范时间（`motion-presets.js:46`）。
- 右上角 `STUDY 01 · N SEC` 的 N = 最后一拍 start + duration（秒）。

`action` 覆盖后的行为差异：

| action | 作用在哪一拍 | 效果 | 出处 |
|---|---|---|---|
| `logo-reveal` | `gather` | 聚合芯片压到 25% 不透明度，logo 从 1.18 倍缩放起 | `motion-sequence.js:292`、`:297` |
| `direct-press` | `trigger` | 光标不出现（画面默认按"用户手在点"处理） | `motion-sequence.js:312` |
| `component-flow` | `split` | 连接线与三颗流点可见 | `motion-sequence.js:328`、`:334` |
| `card-reflow` | `split` | 三张组件卡横向重排 | `motion-sequence.js:320` |
| `status-only` | `switch` | 状态卡不重排，只翻状态 | `motion-sequence.js:345` |
| `hero-hold` | `resolve` | 结束段光环不旋转、三枚收束 chip 不出现 | `motion-sequence.js:370`、`:372` |

### `elements` · 元素与已选素材

| `elements[i]` 字段 | 类型 | 必填 | 含义 |
|---|---|---|---|
| `elements[].concept` | string | 是 | 概念名。画面里内置的只有三个：**`凭证`、`转让`、`权限`**（`motion-sequence.js:122`）；写别的名字不会被渲染 |
| `elements[].kind` | string | 否 | `brand` 时该元素会被当作主品牌标记（`motion-sequence.js:21`） |
| `elements[].slotId` | string | 否 | `B1` 同样视为主品牌标记（与 `kind` 二选一即可） |
| `elements[].action` | string | 否 | 组件卡副标题，如 `绘制 · 展开 · 核验`（`motion-sequence.js:194`） |
| `elements[].selected` | object | 否 | 已选素材：`{ asset?, svg?, image? }` |
| `elements[].selected.asset` | string | 否 | 素材路径（优先级最高） |
| `elements[].selected.svg` | string | 否 | 内联 SVG（次之） |
| `elements[].selected.image` | string | 否 | 图片地址（最后） |

- 三选一优先级：`asset` → `svg` → `image`（`motion-sequence.js:22`、`:29`）。
- 素材加载失败（`image` 的 error 事件）时自动回退到内置线稿图标，再失败就回退到文字品牌（`motion-sequence.js:33`、`:79`）。
- 三个 `concept` 各自对应的图标形状：凭证 = file、转让 = transfer、权限 = shield（`motion-sequence.js:122`、`:48`、`:54`、`:60`）。

### `motion.intensity` · 三档强度

| 档位 | `amplitude` | `damping` | 效果 |
|---|---|---|---|
| `subtle` | 0.65 | 0.72 | 位移小、弹簧收敛慢，整体克制 |
| `balanced` | 1 | 0.46 | 默认档：位移与弹簧取基准值 |
| `showreel` | 1.35 | 0.34 | 位移大、回弹快，强烈动效 |

`amplitude` / `damping` 是**无单位倍率**（`motion-sequence.js:17-18`）：`amplitude` 缩放卡片入场位移（`100 × amplitude`），
`damping` 是弹簧阻尼系数，数值越小回弹越快越明显（用于 `M.spring` / `M.springEnter`）。
写错档位名（例如 `fast`）会回落到 `balanced` 的 amplitude=1、damping=0.46。

### timing 键（毫秒）

当前实现**不读取** `timing`：这一类的时间轴完全由 `props.beats` 的时长（秒）决定。

### 渲染出的元素与坐标（画布 1080×1920）

| 元素 | 坐标 / 尺寸 | 说明 |
|---|---|---|
| 纸面底色 | 0,0 → W×H | 填充 `tokens.background` |
| 强调色柔光圆 | cx=910, cy=310, r=400, 透明度 .09 | 随时间缓慢漂移 |
| 轮廓线 / 点阵 | 底部路径 + 6×7 个 r=2.2 的圆点 | 纹理层，透明度 .12 |
| 顶栏方块 + 文字 | (72,78) 12×12 rx=3；文字 (102,91) 24px | 固定文案 `MOTION LAYER / COMPONENT SYSTEM` |
| 右上角时长 | (1008,91) 右对齐 20px | `STUDY 01 · N SEC`，N 为总时长（秒） |
| 顶栏分隔线 | (72,125)→(1008,125) | |
| 拍标题 / 拍说明 | (72,215) 62px / (74,270) 28px | 标题取 `beat.label`（可配）；**说明文字写死**（`motion-sequence.js:109-115`），改不了 |
| 主品牌标记 | 中心 (540,835), 缩放 1.25 | 优先用 `elements` 里 `kind === 'brand'` 或 `slotId === 'B1'` 的素材 |
| 品牌名 + 副标 | (540,1100) 48px / (540,1160) 20px | 品牌名上限 20 字符 |
| 聚合芯片 | (250,660) file、(830,730) transfer、(285,1050) shield | 三颗 130×130 rx=34 的方块 |
| 主窗口 | 初始 (440,750) 200×200 rx=44 | 展开后铺到 (70,350) 940×1100 |
| 窗口内 chrome | 顶栏线 (70,475)→(1010,475)；三个圆点 x=116+30i, y=414；地址条 (350,388) 380×52；LIVE pill (865,389) 105×50 | |
| 侧边栏 | (94,505) 176×900 | 四项导航（凭证总览 / 流转记录 / 权限核验 / 系统设置），y=590+i×92 |
| 主卡片 | (305,635) 665×360 rx=34 | 序号 `01` 在 (346,875) 150px；有效 pill (350,904) |
| 折线图 | 路径 M530 928 → L650 866 | 描边随时间画出 |
| 下一步条 / 按钮 | (310,1090) 280×112 / (650,1100) 280×112 | 按钮文案 `确认转让` |
| 时间线条目 | (328,1270) 与 (328,1352) | 右端时间戳右对齐到 x=936 |
| 光标 / 点击波纹 | 波纹圆心 (790,1156) | 光标从 (210,1430) 移到按钮 |
| 组件卡三张 | x=60 / 385 / 710, y=510, 310×590 rx=38 | 标题 `凭证组件` / `流转组件` / `状态组件` |
| 连接弧与流点 | 弧线 M215 1150 → Q540 1390 → 865 1150 | 三颗流点沿弧线移动 |
| 同步百分比 | (540,1460) 108px | 0 → 100% |
| 状态开关 | (340,360) 400×140 rx=70 | 滑块在 x=420↔660 之间 |
| 状态卡两张 | x=100 / 580, y=680, 400×580 rx=42 | 切换时交换前后排 |
| Toast | (235,1370) 610×104 rx=34 | 文案 `布局与状态已同步` |
| 结束段 | 光环 (540,830) r=235 虚线；品牌名 (540,1160)；三枚 chip y=1320, x=195/445/695 | 收束成品牌记忆点 |

### 适用语义场景

组件级动效样片、交互流程演示、品牌动效系统介绍：需要在一条时间轴里讲清
"零件聚合 → 一次交互 → 拆成组件 → 状态切换 → 收回品牌" 的过程时用它。
它自带完整品牌、导航、卡片等界面语汇，**不是通用白板场景**；只想要一个数字或一条流程请用前五类。

---

## 旧文档里的页型为什么不见了

早期有一份「页型速查」文档化过 11 个页型（`sign`、`typewriter`、`redefine`、`logo`、`cards`、`method`、`stack`、`filter`、`persona`、`rule`、`end`），
那是另一套「配置 + 样式」工程（已不在本仓库）。本仓库的预览器**从未注册过**它们：
在 `project.json` 里写这些 type，`assets/template/player.js:159` 会直接抛「未注册的场景类型」。
旧文档里的 `end`（props 为 `note` / `slogan` / `badge` / `foot`）也不是现在这一版 `end`（props 为 `title` / `subtitle` / `note`）。
`studio/demo/dark-narrative-sequence.js` 里的 `darkNarrativeSequence` 是设计台 demo 用的另一套模板，不在 `assets/template/player.html` 的加载链上。
