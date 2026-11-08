# 诊断：`html-animation-video` 的 skill 层 对比 `vertical-explainer-v2`

> - A：`/Users/zhishijiaxin/dev/html-animation-video`，分支 `test`（在 `main` 上的增量分支），HEAD `f25784c`
> - B：`/Users/zhishijiaxin/dev/vertical-explainer-v2`，HEAD `68f79a7`
>
> **前提修正（v2 版报告）**：A 是**全项目**——引擎、每期工程模板、设计台、QA、产线脚本、skill 文档都在一个仓库里；
> B 是**纯 skill**。拿 185 个文件比 13 个文件没有意义。
> 本报告只比较**执行模型真正会读到、会调用的那一层**：`SKILL.md` + `references/` + 它必须使用的引擎与模板。

---

## 零、公平口径下的体量对照

只算 skill 面（文档 + 执行模型必须调用的引擎/模板），排除产线脚本、测试、设计台、规则注册表：

| 指标 | A | B |
|---|---:|---:|
| SKILL.md | 267 行 | 111 行 |
| references 文档 | ~1536 行（15 个 md） | 708 行（7 个 md） |
| 填满的端到端范例 | **无** | 176 行（EXAMPLE.md） |
| 文档合计 | **1803** | **995** |
| 执行模型面对的引擎 | 三套并存（见 §4） | 一套，435 行 |
| SKILL.md 中的日期戳 | 29 | 0 |
| SKILL.md 命令式措辞密度 | 0.43 /行 | 0.05 /行 |

即使按公平口径，A 的文档量仍是 B 的 1.8 倍，而效果更差。**问题不是写得不够多。**

---

## 一、【修正】不是"文件不存在"，是"SKILL.md 用的是另一个项目的名字"

### 我上一版说错的地方

我按仓库根目录核验路径，判定 `config.js` / `player.js` / `theme.css` / `subs.js` 等"不存在"。
实际上**这些概念都存在**，只是叫别的名字、在别的位置：

| SKILL.md 的叫法 | 本仓库真实对应物 |
|---|---|
| `config.js`（"每期全部重写"） | `assets/template/project.json` |
| `player.js`（833 行引擎） | `assets/template/player.js`（174 行） |
| `theme.css`（1087 行） | `assets/template/player.css`（2.2 KB） |
| `subs.js` | `assets/template/subs.js` |
| `tools/gen-subs.mjs` | `scripts/srt2subs.js` |
| `export-video.mjs` | `scripts/export.js` |
| `qa-check.mjs` | `npm run qa:motion`（`scripts/qa_frames.py`） |
| `serve.command` | `npm run dev` |

### 但核验结果反而更严重

```
$ for f in config.js theme.css player.js editor.js export-video.mjs \
           qa-check.mjs tools/gen-subs.mjs cover-studio.html; do
    git log --all --oneline -- "$f"
  done
→ 全部：（全历史无）
```

**这些文件名在本仓库的任何分支、任何一次提交里都没有出现过。**

它们来自这个仓库被抽象出来**之前**的那个项目（EP 系列 / 中网那一期）。
`SKILL.md` 的第二节 SOP（68 行）和第三节架构分层（18 行）是照搬旧项目写的，
在仓库重构成通用引擎之后**从未更新**。

所以准确的说法是：**SKILL.md 的主流程描述的是一个已经被重构掉的工程形态，
名字、路径、文件行数全部是旧项目的快照。**

对执行模型的影响和"文件不存在"是一样的——照着敲就是 ENOENT；
区别只是：强模型会去翻 `assets/template/` 自己摸出来，弱模型会开始自己写。

---

## 二、【新增·最硬的证据】文档写的单位是错的，照做必然出事

这一条比路径漂移严重得多，因为它**不会报错，只会出错**。

### 文档怎么说

`references/page-types.md:7-10`（SOP 步骤 F 明确指向它）：

```js
{
  id: "t4a", type: "method", duration: 12634,   // duration = 口播段结束戳 − 起始戳
  props: { ... }
}
```

`SKILL.md:158`：

> 独立页 `duration` = 口播段结束戳 − 起始戳；页内 `timing` 全部是**相对本页的毫秒偏移**

两处都说 **duration 是毫秒**。

### 代码实际怎么用

`assets/template/scenes.js:14-15`：

```js
const start = (scene.timing.value || 0) / 1000;                        // timing 是毫秒 → 转秒
api.prog(t, start, start + Math.min(2.8, scene.duration * .55));       // duration 直接当秒用
```

`assets/template/project.json`：

```json
{ "id": "motion-study", "type": "motionSequence", "start": 0, "duration": 20, ... }
```

真实契约是：
- `duration` = **秒**
- `timing.*` = **毫秒**（同一个对象里两种单位）
- 还有一个文档从没提过的必填字段 **`start`**（绝对秒）

### 后果

模型按 SKILL.md 写 `duration: 12634` 表示一段 12.6 秒的镜头 → 播放器当成 **12634 秒 = 3.5 小时**。
时间轴整个塌掉，但没有任何一条报错，没有任何一条 lint 会拦。

**29 条规则注册表里，没有一条检查单位。**

---

## 三、【修正并加强】页型文档与真实场景注册表几乎不重叠

上一版我说"11 个页型全部不存在"。更准确的事实：

| | 内容 |
|---|---|
| `references/page-types.md` 文档化的（11 个） | `sign` `typewriter` `redefine` `logo` `cards` `method` `stack` `filter` `persona` `rule` `end` |
| `assets/template/scenes.js` 真实注册的（5 个 + 1） | `counter` `flow` `compare` `reveal` `end` ＋ `motionSequence` |
| **交集** | **`end`，1 个** |

- 文档化的 11 个里，**10 个在代码中没有实现**
- 真实存在的 5 个里，**4 个没有任何文档**
- `motionSequence`（`project.json` 默认使用的那个、`motion-sequence.js` 29 KB 的主力）**完全没有文档**

而 `page-types.md` 开篇写："页型注册表在 `player.js` `builders` 对象"——
真实注册表叫 `SCENE_BUILDERS`，在 `scenes.js` 里，`player.js` 中没有 `builders` 这个标识符。

**这是 SOP 步骤 F 让模型去查的那份"速查手册"。**

---

## 四、三套引擎并存，SKILL.md 没说什么时候用哪套

| 路径 | 入口 | 产物 | SKILL.md 的说法 |
|---|---|---|---|
| ① 页型/场景 | `assets/template/player.js` + `scenes.js`（`SCENE_BUILDERS`） | `project.json` 驱动 | 第三节 + `page-types.md`（内容已失效） |
| ② 连续舞台 | `templates/engine.js`（645 行）+ `templates/segment.html` | 单舞台 Sprite | 〇之三，"连续叙事的默认实现路径" |
| ③ 装配层 | `templates/kit/*`（1453 行） | 母版/点阵/摆位/校验 | 铁律 14 |

`SKILL.md:63` 说"页型配置继续服务独立页面与 Cheese Motion 契约"——
也就是①和②**同时有效**，但没有给出任何选择判据，而①的文档是失效的。

B 这边：一套引擎，435 行，`SKILL.md:17` 一句话收口——
"只能调用 `assets/engine-v2.js` 与 `assets/engine-ext.js` 提供的函数；不能修改引擎，也不能自己造新接口。"

---

## 五、以下结论与"全项目 vs 纯 skill"无关，原样成立

这些是纯粹的 skill 设计问题，换什么仓库结构都一样。

### 5.1 唯一一份可执行的施工规范被藏在附录里

`references/execution-contract.md`（209 行）就是 B 那套方法论的移植：表 A–F、L1–L8 精确坐标、
19 个视觉动词→引擎 helper 映射、承接决策树、节奏硬数字。

```
$ grep -n "表A\|表B\|表C\|表D\|表E\|表F\|填表" SKILL.md
265:- `references/execution-contract.md` —— **执行契约（弱模型版）**：表A–F 固定流程……
```

**只在第 265 行"附：文件索引"的倒数第三条出现过一次。** 68 行的主流程 SOP 从不要求填表。

B 的 `SKILL.md:14`，第一条铁律就是：

> 按顺序输出：表A → … → 表F → 代码。**任何一张表没写完，不得开始写代码。**

同一份知识，一个在主路径第一行，一个在附录倒数第三行。

`SKILL-RETROSPECTIVE.md:48` 自己已经写过这件事（"在代码里从未被执行过一次"），
但那一轮的修法是**给表单字段加校验器**，没有把表格提到主路径。

### 5.2 精确坐标只有一份，在那个不被读的文件里；视觉词典完全没有

B 的 `03-design-system.md`（177 行）全是常数：画布 6 个 y 区间、9 个布局模板的精确中心坐标、
5 档字号 + 精确基线、12 个组件构造规格、**17 条视觉隐喻词典**（`投入 → 硬币流入容器，水位上涨`）。

A 的同位文件 `stage-layout.md`（58 行）：`默认视觉中心约 (540, 800)`、`圆角 14–24，可按 token 调整`、
`约 3–5 个活跃元素`。

- A **全仓库没有视觉隐喻词典**（`grep -rln "隐喻\|概念.*画法"` 零命中）
- L1–L8 坐标表在 A 里唯一出现位置：`execution-contract.md:102-109`

模糊词密度：B 819 行里"约"12 次（1.5%）；A 1803 行里"约"62 次（3.4%），另有"参考"67 次、"可选"17 次。

### 5.3 铁律是禁令，不是构造指令

| | 行数 | 必须 | 不得 | 禁止 | 定死 | 严禁 | 不能/不许 | 合计 | 每行 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A | 267 | 38 | 23 | 15 | 12 | 7 | 10 | **114** | **0.43** |
| B | 111 | 0 | 1 | 1 | 0 | 0 | 3 | **6** | **0.05** |

20 条启动铁律按内容归类：流程闸门 5 条、禁止红线 6 条、工程约束 3 条、交付格式 3 条、语义构造 3 条。
**真正回答"这句旁白画成什么、画在哪个坐标、用哪个函数、多长时间"的：零条。**

外加 29 个日期戳与事故叙述（`2026-09-30 中网项目`、`2026-10-29 用户定死`…），
占着主文档最前面、优先级最高的位置，对执行零增益。

### 5.4 没有填满的范例

B 的 `EXAMPLE.md`：真实片段 35.8–57.4s，六张表全部填满，表D 精确到 `暂停令@43.57 → 43.55（−0.02）`，附关键拍代码。

A 最接近的 `templates/storyboard.md`：**空模板**，每张表一行 `| M1 |  |  |  |  |  |` 占位符。
`references/cases.md` 是 32 条缺陷台账；`studio/demo/` 是播放器 demo。都不是"从 SRT 到成片"的示范。

### 5.5 开工第一步就卡死

铁律 0 + 铁律 18：先跑更新检查 → 起设计台服务（:7100）→ 把 URL 发给用户 →
**"不得用 `AskUserQuestion` 逐项收集 SRT"** → **"输入整包未在设计台提交前不进入拆解"**。

用户在对话里贴了 SRT 说"做个视频"，skill 规定不能开工。

B 的开工：建 `out/`，拷三个文件，改文件名。

### 5.6 校验方向反了

29 条规则大多校验 `analysis` JSON 的字段非空（`focus` 非空、`verb` 在表内、`carryTable` 行数对）。
这保证**模型填了格子**，不保证**填得对**。

`SKILL-RETROSPECTIVE.md:14` 自己承认："26 个缺陷里，现有自动检查一个都没有提前抓到。"

> **B 靠输入端约束**（坐标只能从 9 个模板抄、画法只能从 17 条词典查、动词只能从 19 个里选）→ 没有编错的机会
> **A 靠输出端校验**（让模型自由发挥，再检查字段非空）→ 只能查出"空着"，查不出"错了"

§2 的单位错误就是活证据：29 条规则，没有一条能发现 `duration: 12634`。

---

## 六、一句话结论

> **B 把「做什么」收敛成查表，模型的工作是抄；A 把「不做什么」写成铁律，模型的工作是在禁令的缝隙里自己发明。发明的方差就是效果差。**

而且 A **已经有了 B 的那套东西**（`execution-contract.md`），只是放在附录、缺了词典和范例、
而主流程还在用一个被重构掉的旧工程的名字和单位。

---

## 七、改造建议

### P0 · 让文档和工程对齐（不做则后面都是空的）

1. **修单位**（最高优先级，静默出错）：`SKILL.md:158` 与 `page-types.md` 的 `duration` 毫秒口径
   改成真实契约——`duration` 秒、`timing` 毫秒、必填 `start`。顺手给 `project.json` 写一份 JSON Schema
   并接进 `npm run check`。
2. **重写 SKILL.md 第二节 SOP + 第三节架构分层**，把旧项目的文件名换成真实物
   （`project.json` / `assets/template/player.js` / `player.css` / `scripts/srt2subs.js` /
   `scripts/export.js` / `npm run dev|qa:motion`）。
3. **重写或删除 `references/page-types.md`**：按 `SCENE_BUILDERS` 真实的
   `counter / flow / compare / reveal / end` 重写，并补上完全没有文档的 `motionSequence`。
4. **加一条 CI**：SKILL.md 和 references 里出现的每个仓库内路径、每个场景 type、每个引擎函数名，
   必须在代码里存在。**这一条比现有 29 条规则加起来更有价值。**

### P0 · 把施工规范提到主路径

5. **`execution-contract.md` 升为主流程**：SKILL.md 第一条铁律改成"按顺序输出表A–F，没填完不写代码"，
   六张表模板直接内联进 SKILL.md。
6. **补 `EXAMPLE.md`**：从真实做过的一期挑 20–30 秒，六张表填满 + 对应代码。单项投入产出比最高。

### P1 · 补齐查表资产

7. **写视觉隐喻词典**（`概念 → 画法`），A 现在完全没有，参照 B 的 4.6 节，17 条起步。
8. **坐标去模糊**：`stage-layout.md` 的"约/区间"换成 `execution-contract.md` 的精确值，两份合一。
9. **视觉动词表逐条核对** `templates/engine.js` 真实函数。

### P1 · 瘦身与分层

10. `IMPROVEMENT-PLAN.md` / `SKILL-RETROSPECTIVE.md` / `FLOW-TEST-REPORT.md` / `CONTRIBUTING.md`
    （共 1090 行维护者文档）移出 skill 加载路径。
11. **20 条铁律砍到 ≤8 条**，去掉全部日期戳。按 RETROSPECTIVE 自己提的 A/B/C 分类：
    B 类下沉 `execution-contract.md`，C 类下沉 `agent-workflow.md`，SKILL.md 只留 A 类 + 路由表。
12. **三套引擎给出选择判据**，或显式废弃其中一套。

### P2

13. 铁律 18 的设计台改为可选：对话里给了 SRT 就直接开工。
14. 校验重心从"字段非空"转向"输入端收敛"——**让模型没有编错的机会，比检查它编错了更有效**。
