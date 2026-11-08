# 维护者文档索引

本目录收录**面向维护者（人类）**的文档，不是执行模型每期要读的 skill 加载路径。

- 执行模型每期应当读取的内容：**`SKILL.md` + `references/**`**（见仓库根目录的 `SKILL.md`）。
- 本目录里的文档回答的是「这套 skill 是怎么演进过来的、下一期该改什么、怎么提 PR」这类问题。

---

## 文档索引

| 文档 | 行数 | 它回答什么问题 | 谁该读 |
|---|---:|---|---|
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 319 | 怎么为这个仓库提 PR？分支／权限／禁止直推 `main` 等协作硬规则是什么？环境需要装什么？提交前要跑哪些检查？ | 任何人第一次向本仓库提交代码前 |
| [`IMPROVEMENT-PLAN.md`](IMPROVEMENT-PLAN.md) | 403 | 下一期要从哪里改起？把 skill 从「文档 + 自觉」升级为「可执行契约系统」的总纲、四阶段路线与待拍板的开放点是什么？ | 维护者做季度／版本级规划时 |
| [`SKILL-RETROSPECTIVE.md`](SKILL-RETROSPECTIVE.md) | 235 | 上一期为什么返工？26 个缺陷分别归属哪个根因？为什么「人读的文档」和「机器读的校验」没接上线？ | 维护者复盘一期交付时；读它来理解现有规则的由来 |
| [`FLOW-TEST-REPORT.md`](FLOW-TEST-REPORT.md) | 133 | 2026-11-07 那次端到端产线走查到底走了哪些闸门？26 个缺陷怎么修的、回归结果如何？ | 维护者想看一次完整流程走查的实证记录时 |
| [`SKILL-DIAGNOSIS-vs-v2.md`](SKILL-DIAGNOSIS-vs-v2.md) | 287 | 本仓库的 skill 层与 `vertical-explainer-v2`（纯 skill、Opus 5.5 产出）相比差在哪？体量、范例密度、规则可执行性差距有多大？ | 维护者做横向对比、判断「还缺什么」时；它是 [`REPAIR-PLAN.md`](REPAIR-PLAN.md) 的诊断底稿 |
| [`REPAIR-PLAN.md`](REPAIR-PLAN.md) | 980 | 按上面那份诊断，具体分几步修？每个改动落点在哪、验收标准是什么？ | 维护者按诊断落地修复时；本目录里最「可执行」的一份行动计划 |

## 归档

| 目录 | 说明 |
|---|---|
| [`archive/skill-reference/`](archive/skill-reference/README.md) | 2026 年初 `.skill-reference/` 的一次性快照，已与 `references/` 现行版本漂移，**仅作历史对照，不得作为执行依据** |

---

## 阅读顺序建议

- **只想提个 PR** → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **想理解这套 skill 为什么长这样** → [`SKILL-RETROSPECTIVE.md`](SKILL-RETROSPECTIVE.md) → [`SKILL-DIAGNOSIS-vs-v2.md`](SKILL-DIAGNOSIS-vs-v2.md)
- **想推进改动** → [`SKILL-DIAGNOSIS-vs-v2.md`](SKILL-DIAGNOSIS-vs-v2.md) → [`REPAIR-PLAN.md`](REPAIR-PLAN.md)
- **想做长期规划** → [`IMPROVEMENT-PLAN.md`](IMPROVEMENT-PLAN.md)

## 约定

- 本目录的文档**不进入** skill 加载路径，不要求执行模型每期读取。
- 新增维护者文档请放在本目录，并在本索引补一行。
- 文档中出现互相引用的路径，请用**相对于本目录**的相对链接，避免目录整体移动后链接失效。
