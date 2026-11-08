---
name: html-animation-video
description: 用 HTML/SVG/CSS 与确定性时间轴制作竖屏口播动画、产品演示与知识短视频。输入是一份 SRT（必需）、可选的文字脚本与配音、以及已确认的素材母版；输出是每段一个网页预览页（1080×1920，可 `?lint` 自检），经用户逐级确认后才导出 MP4。适用于「做视频 / 动画视频 / 视频分镜 / 口播动画 / 录屏成片 / 换一期内容 / 导出成片」等需求；纯文字写作且不涉及画面制作时不适用。交付判据：`?lint` 面板零报错 + 语义接触表通过 + 用户明确说「定稿导出」。
---

# HTML 动画视频 · 施工规范

> 定位：**动画视频 = 一次开发 + 每期换数据**。引擎与装配层只开发一次，每期成本收敛为「配音 + SRT + 本期分镜表 + 本期页面」。本文件是执行入口；细节按需查第六节的路由表。

## 〇 执行提示词

开工时把下面这段约束放在任务开头，然后**先填表、后写代码**：

```text
你是竖屏解说动画的执行者，遵守：
1. 按顺序输出 表A 节拍表 → 表B 结构表 → 表C 布局表 → 表D 分镜表 → 表E 承接表 → 表F 元素表 → 代码。任何一张表没写完不写代码；每张表写完对照它的「通过条件」自查一次。
2. 坐标只从布局模板抄；需要新位置时在模板坐标上做 ±整数偏移，注释里写明理由。安全区 x ∈ [60,1020]，元素不进 y ≥ 1360 的字幕区。
3. 只调用 MotionEngine（templates/engine.js）提供的函数，不改引擎、不自造引擎接口；缺功能写进交付说明的「待确认事项」。
4. 会变形的元素用世界坐标 + morphRect / setBox；整体移动的刚体组用 act 的 x/y/s/r，注释里写「局部坐标，原点为…」。
5. 每个镜头边界在表E 写清「谁活下来、怎么变、变成什么」。「怎么变」只填手法枚举：长成 / 展开 / 归档 / 落下 / 分出多个 / 多个汇成一个 / 替换。
6. 每个数字先写一行「数据→画面映射声明」，再画。
7. 写完代码在网址后加 ?lint 运行，修到面板显示「✓ 没有发现问题」。
8. 不做：整页淡入淡出、闪屏转场、display:none 切场、CSS 变量写进 SVG 属性、位置参数版 TX、子元素时间窗长于父组。
```

### 六张表的空模板（列结构在这里，不必翻 references）

| 表 | 空模板 | 通过条件在 |
|---|---|---|
| A 节拍表 | `拍 \| 起止 \| 字幕(拆分后) \| 关键词@时间 \| 拍类型 \| 视觉动词` | `references/rhythm.md` |
| B 结构表 | `项目 \| 内容`（最外层模式/骨架、持续主体及形态链、人物组、上一段末帧留下的、本段末帧留给下一段的） | `references/script-storyboard.md` |
| C 布局表 / F 元素表 | C：`拍 \| 布局模板 \| 焦点在哪个坐标 \| 和上一拍相比移动了什么`；F：`元素 \| 是什么 \| 图层 \| 坐标(模板出处) \| 出生时间方式 \| 死亡时间方式 \| 承接自 \| 承接给` | `references/stage-layout.md` |
| D 分镜表 | `拍 \| 起止 \| 字幕 \| 焦点 \| 视觉动词 \| 画面描述(一句话) \| 关键词对齐` | `references/visual-verbs.md` |
| E 承接表 | `边界时间 \| 上一拍留下的对象 \| 怎么变(手法) \| 具体描述 \| 变成下一拍的什么` | `references/motion-carry.md` |

填完跑 `node scripts/check-storyboard.mjs <storyboard.json>` 自检；抄格式看 `EXAMPLE.md`（含反例）。

### 开工前三问（答不出任何一问不返工）

1. **这段里正在发生的变化是什么？必须能说出一个动词**（越过／消失／堵住／反转／堆积／被抽走）。
2. **关掉字幕，观众看得懂这段吗？**
3. **这一页的产出单位是「页面」还是「动作」？**落在「页面／版式／图表」上即判退化。

## 一 八步流程

①切拍（关键词出现时间）→表A · ②读结构（论证模式与持续主体）→表B · ③定布局（每拍选一个布局模板）→表C · ④写分镜（每拍一个焦点一个动词）→表D · ⑤设承接（每个边界谁活下来）→表E · ⑥列元素（出生/死亡/坐标/图层）→表F · ⑦写代码（按引擎 helper 填数据）→HTML · ⑧跑检查（?lint 零报错 + 人工清单）→交付。
每张表都有「通过条件」，不通过就回上一步；跳过 ②⑤ 直接写代码，结果就是 PPT。


## 二 铁律

| # | 铁律 | 落点 |
|---|---|---|
| 1 | 引擎与装配层都只开发一次：摆位、母版合成、点阵、压缩、品牌基座、状态词胶囊一律走 `templates/kit/` | E11/E13/E14/E16 |
| 2 | 不新建并行工作流、不重写引擎、不另起姊妹 skill；输入整包走设计台一次性提交，闸门确认才用 `AskUserQuestion` | `references/agent-workflow.md` |
| 3 | 具象素材先出确认板再动手；参考确认 → 母版确认，两道闸门各自独立 | `references/asset-pipeline.md` |
| 4 | 母版锁定后先做两段代表样片（视觉开场 + 核心机制），用户确认后才铺开全片 | E06/E07/E08 |
| 5 | 所有阶段预览只交网页；导出需要用户明确说「定稿导出」 | C05 |
| 6 | 画面文字是关键词（≤8 字）+ 每期限 2～3 处金句，不复述字幕 | A 类，第五节 |
| 7 | 品牌只用官方矢量，拿不到用纯文字标识；人物只留头肩外轮廓 + 点阵填充 | A 类，第五节 |

## 三 全流程 SOP

```text
SRT → 设计台提交输入整包 → 素材参考确认 → 母版确认并锁定 → 填表A–F → 两段代表样片 → 用户确认样片 → 全片页面 → qa:semantic + qa:visual + 语义接触表 → 网页验收（按段反馈则回全片页面）→ 用户明确说「定稿导出」→ export.js + concat.sh
```

逐步要点与真实命令（完整清单见 `references/commands.md`）：

| 步骤 | 做什么 | 命令 / 依据 |
|---|---|---|
| A–B 脚本与输入 | 先定骨架再写字，数字改中文口语读法，结尾挑一组对比数字做 punch；**SRT 是唯一必需输入**，MP3／脚本可选，只有 SRT 时做无声网页预览 | `references/rhythm.md`、`references/agent-workflow.md` |
| C–D 素材 | 联网找候选参考 → 参考确认板 → 风格化母版 → 母版确认板，两道闸门 | `references/asset-pipeline.md` |
| E 对轴 | **填表A–F**；每拍一个焦点一个动词；表E「怎么变」填枚举手法词 | 第〇节 + `EXAMPLE.md` |
| F–G 写页面 | 单舞台 + 视觉母结构 + 逐句推进动作 + 跨句演化；`render(t)` 是纯函数 | `templates/engine.js`、`templates/segment.html` |
| H QA | `npm run validate:motion` → `npm run qa:motion` → `npm run qa:semantic` → `npm run qa:visual`；再出语义接触表 | `references/qa-delivery.md` |
| I 预览 | `npm run dev -- --host 127.0.0.1 --port 7100`；样片与全片验收都在网页 | `references/qa-delivery.md` |
| K 导出 | `node scripts/export.js` + `scripts/concat.sh`；导出后抽帧复检 | C05 |

## 四 架构分层

`assets/template/*` 与 `templates/*` **不是三套并行引擎，也没有竞争关系**，是同一条流水线上的两道工序（硬事实：样片页只加载 `/templates/engine.js` 与 kit/，设计台预览页只加载 `assets/template/*`，两者互不加载）：

| 层 | 真实文件 | 行数 | 每期成本 | 用在哪一步 |
|---|---|---:|---|---|
| 成片引擎 | `templates/engine.js` + `templates/segment.html` | 651 | 零改动 | 样片与全片（Agent 手写页面） |
| 装配层 | `templates/kit/*` | 1713 | 零改动 | 母版合成、点阵、摆位、L2/L3 校验、分镜契约 |
| 分镜预览器 | `assets/template/`（player + scenes + motion-sequence + project.json） | ~693 | 零改动 | 设计台里给用户看分镜稿 |
| 每期页面 | `<job>/opening/index.html` 等 | ~600/段 | 全部新写 | 每期核心工作 |
| 字幕 | `subs.js` | — | 自动生成 | 两者共用 |

判断用哪套：**成片一律走 `templates/engine.js` + `templates/kit/`；`assets/template/*` 只服务设计台分镜预览。** 单位契约（同一对象内两种单位，反直觉）：`scenes[].start` 与 `scenes[].duration` 单位**秒**，`scenes[].timing.*` 单位**毫秒**，详见 `references/scene-types.md`。

## 五 审美取向

- **画面文字 = 关键词（≤8 字）+ 每期限 2～3 处金句**。画面句与字幕并排，删掉画面句不损失信息 → 该页重做成可视化，或不做。
- **音效克制与视觉语言**：全片只保留关键仪式音（如盖章一处），不用翻转／打字等高频提示音；手绘／贴纸／撕纸／胶带／印章体系，不用直尺式直线色块划线；色块不透明度 .92+、饱和度拉满；装饰不压正文。
- **品牌与人物红线**：品牌只用来源可靠的官方矢量，拿不到用纯文字标识，不在 SVG／CSS／Canvas 里手绘近似 Logo；人物只提取头肩／身体外轮廓 + 坐标点阵填充，不重建五官。

## 六 路由表

| 需要什么 | 读哪个文件 |
|---|---|
| 一份填满的完整示范（含反例） | `EXAMPLE.md` |
| 语速、关键词时间、节拍配额、动效硬数字 | `references/rhythm.md` |
| 论证模式、持续主体形态链、字幕显示 | `references/script-storyboard.md` |
| 画布分区、布局模板 L1–L8、文字规范、元素表与图层 | `references/stage-layout.md` |
| 概念 → 画法 | `references/visual-metaphors.md` |
| 视觉动词 → 引擎 helper | `references/visual-verbs.md` |
| 承接决策树、承接手法枚举、Carry helpers | `references/motion-carry.md` |
| 视觉母结构、两级设计卡五字段 | `references/semantic-scenes.md` |
| 场景类型与 props（设计台分镜预览器） | `references/scene-types.md` |
| 人物 | `references/figures.md` |
| 连续舞台工作流与专项 QA | `references/continuous-workflow.md`、`references/continuous-qa.md` |
| 数据诚信与映射声明 | `references/data-viz.md` |
| 素材确认闸门 | `references/asset-pipeline.md` |
| 交付 QA 与人工必查清单 | `references/qa-delivery.md` |
| 命令、设计台交接契约、施工规范索引、规则 → 校验器索引 | `references/commands.md`、`references/agent-workflow.md`、`references/execution-contract.md`、`references/checks.md` |
| 踩坑与真实案例 | `references/pitfalls.md`、`references/cases.md` |
