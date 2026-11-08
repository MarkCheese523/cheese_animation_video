# 执行契约 · 索引页

> 本文件已按「一条规则一个落点」拆分。原 209 行的内容已全部迁出，下面只保留**去哪查**。
> 执行提示词与八步流程在 `SKILL.md` 第零部分与第一部分。

## 去哪查

| 需要什么 | 去哪 |
|---|---|
| 执行提示词、八步流程、表A–F 空模板 | `SKILL.md` 第零部分 / 第一部分 |
| 一份填满的完整范例（含反例） | `EXAMPLE.md` |
| 语速口径、关键词时间公式、节拍配额、动效硬数字 | `references/rhythm.md` |
| 论证模式表、持续主体形态链、字幕显示 | `references/script-storyboard.md` |
| 画布分区、布局模板 L1–L8、文字规范、元素表与图层 | `references/stage-layout.md` |
| 视觉动词 → 引擎 helper | `references/visual-verbs.md` |
| 承接决策树、承接手法枚举、Carry helpers | `references/motion-carry.md` |
| 数据 → 画面映射声明、语义陷阱 | `references/data-viz.md` |
| 交付格式、人工必查清单、QA 全流程 | `references/qa-delivery.md` |
| 场景类型与 props（设计台分镜预览器） | `references/scene-types.md` |
| 视觉母结构与两级设计卡五字段 | `references/semantic-scenes.md` |
| 人物 | `references/figures.md` |
| 素材确认闸门 | `references/asset-pipeline.md` |
| 命令 | `references/commands.md` |

## 使用方式

1. 先读 `SKILL.md` 第零部分（执行提示词），照它填表A–F，**表没填完不许写代码**。
2. 每张表的「通过条件」在它归位的那个文件里（见上表）。
3. 抄 `EXAMPLE.md` 的格式，别自己发明列。
4. 填完跑 `node scripts/check-storyboard.mjs <storyboard.json>` 自检。
5. 写完代码在网址后加 `?lint`，修到「✓ 没有发现问题」。

**表格阶段改起来便宜，写进代码后修改成本高一个数量级** —— 这份契约存在的全部理由就是把判断留在填表阶段。

## 已迁走的内容对照（历史锚点）

| 原锚点 | 现位置 |
|---|---|
| `#表A` | `references/rhythm.md` |
| `#表B` | `references/script-storyboard.md` |
| `#表C` | `references/stage-layout.md` |
| `#表D` | `references/visual-verbs.md` |
| `#表E` | `references/motion-carry.md` |
| `#表F` | `references/stage-layout.md` |
| `#数据→画面映射` | `references/data-viz.md` |
| `#动效硬数字` | `references/rhythm.md` |
| `#交付格式` / `#人工必查` | `references/qa-delivery.md` |
| `#两级设计卡` | `references/semantic-scenes.md` |
