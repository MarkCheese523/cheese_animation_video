# `html-animation-video` Skill 层修复计划

> 诊断依据：[`SKILL-DIAGNOSIS-vs-v2.md`](SKILL-DIAGNOSIS-vs-v2.md)
> 基线：分支 `test`，HEAD `f25784c`
> 对照物：`vertical-explainer-v2`（纯 skill，Opus 5.5 产出，效果好）
> 计划范围：**只修 skill 层**（SKILL.md + references + 执行模型必须调用的契约）。不重写引擎、不动设计台、不改产线脚本的业务逻辑。

---

## 零、三个决定计划形状的发现

在动手之前必须先确立这三条，否则会做成"再写 500 行文档"。

### 发现 1：`execution-contract.md` 是本仓库唯一准确且与代码对齐的施工规范

我把它表D 里引用的全部引擎 helper 对 `templates/engine.js` 做了逐条核验：

```
act ✓  hop ✓  gather ✓  morphRect ✓  unroll ✓  emit ✓  scatter ✓  retract ✓
ps ✓   imgMark ✓  LN ✓  CNT ✓  figAct ✓  zoomThrough ✓  bend ✓  boot ✓
SHAKE ✓  setBox ✓  route ✓  kf ✓  snapshotState ✓  project ✓
→ 22/22 全部命中
```

它的 20 个视觉动词也与 `agent-flow.mjs:41-44` 的 `VISUAL_VERBS` **完全一致**。
`references/commands.md`（45 行）同样准确——用的是真实的 `npm run dev` / `npm test` / `python scripts/init_project.py`。

**结论：仓库里正确的知识已经存在。缺的不是内容，是「把正确的那份放到主路径、把错误的那份清掉」。**
这让整个计划从"创作"变成"重新布线"，工作量和风险都低一个量级。

### 发现 2：SKILL.md 与这两份准确文档互相矛盾

| 事项 | SKILL.md 说 | 准确文档说 | 代码事实 |
|---|---|---|---|
| 起服务 | `serve.command`（L166） | `npm run dev -- --port 7100`（commands.md:8） | `dev-server.mjs` |
| 转字幕 | `node tools/gen-subs.mjs`（L147） | `python scripts/srt_to_subs.py`（commands.md:27） | 两条路径两个工具 |
| 导出 | `node export-video.mjs --audio`（L170） | `scripts/export.js`（commands.md:45） | `scripts/export.js` |
| QA | `qa-check.mjs`（L164） | `npm run qa:motion` / `qa:studio`（commands.md:17） | `scripts/qa_frames.py` |
| 复制模板 | 复制整个仓库排除 qa/frames（L145） | `python scripts/init_project.py`（commands.md:26） | `scripts/init_project.py` |
| 填表 | 从不要求 | 表A–F 不填完不许写代码（execution-contract.md:18） | `agent-flow.mjs` 已实现 E01–E05 |

**SKILL.md 是权威入口，但它是全仓库最不准确的文档。** 修复的主轴就是让 SKILL.md 回到真相。

---

### 发现 3：校验器正在被"模板化填空"绕过 —— 这是"效果差"最直接的证据

我打开了最新最完整的一期真实产出
（`studio/production-jobs/motion-4cfd2c66-.../job.json` 的 `package.agentAnalysis`，
端侧 AI 期，68 句 / 24 拍 / 142.73s）。

`beats` 质量尚可（24 拍，每拍 focus 具体、verb 合法）。但 **`carryTable` 的 23 行全部是同一句话**：

```json
{"boundary":"b01 → b02","survivor":"一张任务卡（同一 DOM 身份 #task-card）",
 "how":"主体保持身份，只改变形态与位置","becomes":"卡面上的完成印记"}
{"boundary":"b02 → b03","survivor":"卡面上的完成印记（同一 DOM 身份 #task-card）",
 "how":"主体保持身份，只改变形态与位置","becomes":"分开的三张卡"}
...（23 行，how 字段一字不差完全相同）
```

- `survivor` = 上一拍 focus 机械拼接「（同一 DOM 身份 #task-card）」
- `becomes` = 下一拍 focus 原样复制
- `how` = **23 行完全相同的一句套话**

而 `execution-contract.md:155-159` 的承接决策树明确要求 `how` 是**手法词**：
`长成 / 展开 / 归档 / 落下 / 分出多个 / 多个汇成一个 / 替换`。
"主体保持身份，只改变形态与位置"**一个都不是**——它是对"承接"这个词的同义反复。

**E03（carry 非空）和 E05（承接表无空行）全部通过。** 校验器完全满意，而承接设计根本不存在。

#### 对照：同一期的 `samples.json` 里，carry 写得很好

```
opening   | beats=[b01,b02] | carry=第1拍四枚能力小件落进一张任务卡，第2拍完成印记盖在卡上
                              —— 同一张卡在两拍之间从「散件」长成「可交付的一张卡」
mechanism | beats=[b13,b14] | carry=第13拍任务卡沿可见连线从中枢落到 worker 工位，
                              第14拍 worker 推进完再沿连线汇报回中枢 —— 同一张卡换了归属
```

**同一个模型，同一期任务。要 2 条，得到 2 条真答案；要 23 行，得到 23 行套话。**

> **这条发现直接改写了修复策略的优先级：**
> 问题不在"规则不够多"，而在**"要求填 N 行自由文本"这种校验形态本身会诱导退化**。
> 对策只有两个方向：① 把自由文本改成**枚举**（填不出套话）；
> ② 把"填 N 行"改成"填关键的 2–3 处"（降低机械填充的收益）。
> 由此新增任务 **P1-6**，并把它提到与 P1-2 同级的优先级。

## 一、三条修复原则

1. **删 > 改 > 写。** 优先删掉失效文档，其次把 SKILL.md 指向已经正确的文档，最后才写新内容。
   目标是文档总量**下降**（1803 → 约 1100 行），不是上升。
2. **约束前移。** 质量来自"模型没有编错的机会"（查表、Schema、枚举），不是"编错了被查出来"。
   每新增一条规则，先问：能不能改成让它编不出来？
3. **一条规则，一个落点。** 任何写进文档的"必须/不得"，要么有校验器编号，要么有 UI 闸门，要么删掉。
   沿用仓库已有的 `references/rules/*.rule.mjs` 注册表格式，不另起体系。

---

## 二、阶段总览

| 阶段 | 主题 | 任务数 | 预估 | 完成后的可观测变化 |
|---|---|---:|---:|---|
| **P0** | 止血：让文档不再说谎 | 6 | 1.5 天 | 模型照 SKILL.md 敲的命令能跑通；单位不再静默出错 |
| **P1** | 接线：把施工规范提到主路径 | 6 | 2.5 天 | 模型开工第一件事是填表；有范例可抄；表E 填不出套话 |
| **P2** | 补料：把判断力变成查表 | 4 | 2 天 | 坐标、画法、动词全部可查，不需要现编 |
| **P3** | 瘦身：砍掉噪声 | 4 | 1 天 | SKILL.md 267 → ~120 行；维护者文档移出加载路径 |
| **P4** | 固化：防止再次漂移 | 3 | 1 天 | CI 拦住"文档说有、代码没有" |

总计 **23 个任务，约 8 人天**。**P0 + P1 完成即可预期效果显著改善**，P2–P4 是让它稳定。

> 如果只能做三件事：**P0-1（单位）+ P1-2（EXAMPLE）+ P1-6（表E 枚举化）**。
> 这三条分别对应"静默出错""没有范本""校验被绕过"，是三个不同性质的根因。

---

# P0 · 止血：让文档不再说谎

> 目标：执行模型照着 SKILL.md 走，不会遇到 ENOENT，不会写出单位错误的配置。
> 这一阶段**不新增任何方法论内容**，纯粹修正事实。

---

### P0-1 · 修正时间单位契约（最高优先级）

**问题**：静默出错，不报错、不被任何 lint 拦截。

| 位置 | 现状 | 真相 |
|---|---|---|
| `SKILL.md:158` | "`duration` = 结束戳 − 起始戳；`timing` 全部是**相对本页的毫秒偏移**" | `duration` 是**秒** |
| `references/page-types.md:7-10` | `duration: 12634` | 若按此写，12.6 秒会被当成 12634 秒 |
| `assets/template/scenes.js:14-15` | `(scene.timing.value)/1000` + `scene.duration * .55` | `timing` 毫秒、`duration` 秒 |
| `assets/template/project.json` | `"start": 0, "duration": 20` | 还有一个文档从没提过的必填字段 `start`（绝对秒） |

**动作**

1. 改写 `SKILL.md:158` 为真实契约，并显式标注"同一对象内两种单位"这个反直觉事实。
2. 新建 `assets/template/project.schema.json`（JSON Schema Draft 2020-12）：
   - `scenes[].start`：`number`，**必填**，单位秒，`minimum: 0`
   - `scenes[].duration`：`number`，**必填**，单位秒，`minimum: 0.5`，`maximum: 600`
   - `scenes[].timing`：`object`，`additionalProperties: {type:"number"}`，单位毫秒
   - `scenes[].type`：`enum`，取值来自 `SCENE_BUILDERS` 的实际键（见 P0-3）
   - 每个字段的 `description` 里写明单位
3. 在 `scripts/validate_project.py` 里接上这份 Schema，并加一条**量纲启发式**：
   `duration > 600` 直接报错并提示"疑似把秒写成了毫秒"。
4. `npm run check` 里加 `npm run validate:motion`（当前只在手动路径）。

**落点**：`SKILL.md:158`、`references/page-types.md:5-12`、新建 `assets/template/project.schema.json`、`scripts/validate_project.py`、`package.json#scripts.check`

**验收**
- 写一个 `duration: 12634` 的 fixture，`npm run validate:motion` 必须 exit 1 且提示量纲
- `npm run check` 包含 schema 校验
- 新增规则 `E30-时间单位必须符合工程契约`，登记进 `references/rules/`

**预估**：M（3–4 h）　**依赖**：无　**可并行**：是

---

### P0-2 · 重写 SKILL.md 第二节 SOP（L107–174）

**问题**：68 行主流程，6 个步骤引用了从未在本仓库存在过的文件名（全历史 `git log --all` 为空）。

**动作**：逐步骤替换为真实命令，**直接引用 `references/commands.md` 而不是复述**（消除双源）。

| 步骤 | 现状（L） | 改为 |
|---|---|---|
| D 复制模板 | "复制 `~/dev/html-animation-video/`，排除 qa/frames/.git"（L145） | `python scripts/init_project.py`（见 commands.md） |
| E 字幕转换 | `node tools/gen-subs.mjs "配音.srt"`（L147） | 页型路径 `python scripts/srt_to_subs.py`；连续舞台路径 `node scripts/srt2subs.js`——**并说明何时用哪条** |
| G QA | `qa-check.mjs 全绿`（L164） | `npm run validate:motion` → `npm run qa:motion` → `npm run qa:semantic` → `npm run qa:visual` |
| H 预览 | 起 `serve.command`（L166） | `npm run dev -- --host 127.0.0.1 --port 7100` |
| K/M 导出 | `node export-video.mjs --audio`（L170） | `node scripts/export.js` + `scripts/concat.sh` |

**附带**：Mermaid 流程图（L109–135）里的节点标签同步更新。

**落点**：`SKILL.md:107-174`

**验收**：SKILL.md 内出现的每条命令，复制粘贴即可执行（允许缺参数报用法，不允许 ENOENT）

**预估**：M（3 h）　**依赖**：无　**可并行**：是

---

### P0-3 · 重写 `references/page-types.md`

**问题**：文档化 11 个页型，真实注册 5 个 + 1，**交集只有 `end`**。

```
文档：sign typewriter redefine logo cards method stack filter persona rule end
真实：counter flow compare reveal end  ＋ motionSequence
```

且开篇写"页型注册表在 `player.js` `builders` 对象"——真实叫 `SCENE_BUILDERS`，在 `scenes.js` 里。
`motionSequence`（`project.json` 默认使用、`motion-sequence.js` 374 行的主力）**零文档**。

**动作**

1. **文件改名** `page-types.md` → `scene-types.md`（名字也错，它不是"页型"是"场景类型"）。
2. 按 `assets/template/scenes.js` 的 `SCENE_BUILDERS` 真实实现重写，每个类型给出：
   - `type` 字符串、必填 `props` 字段表（带类型）、可用 `timing` 键（**标注毫秒**）、
     渲染出的元素与坐标、适用的语义场景
3. **补 `motionSequence` 的完整文档**——它是默认类型，却从没被写过。
   源：`assets/template/motion-sequence.js`，重点是 `props.beats` / `props.elements` /
   `props.profile.tokens` / `props.motion.intensity`（`subtle|balanced|showreel`）三档及其
   `amplitude`/`damping` 取值。
4. 文件顶部加一行机器可读的类型清单，供 P4-1 的 CI 核对。

**落点**：`references/page-types.md` → `references/scene-types.md`；`SKILL.md:156,248` 的引用同步

**验收**
- 文档里的每个 type 都能在 `SCENE_BUILDERS` 里找到；反之亦然（CI 断言，见 P4-1）
- 每个 type 的 props 字段与 builder 实际读取的字段一致

**预估**：L（5–6 h，`motion-sequence.js` 374 行需要通读）　**依赖**：P0-1（单位口径）　**可并行**：否

---

### P0-4 · 重写 SKILL.md 第三节"架构分层"（L176–193）

**问题**：整张表是旧项目的快照——`player.js`（833 行）、`theme.css`（1087 行）、
`config.js`（262 行）、`export-video.mjs`（290 行）、`qa-check.mjs`（206 行）、`editor.js`，
**全历史不存在**。

**动作**：替换为真实结构。**"三套并行引擎"这个说法是错的**——我查了调用链，
真相是**两套引擎服务两个不同阶段，外加一个共享装配层**：

```
① 真实成片引擎（Agent 手写页面时调用）
   studio/production-jobs/<job>/opening/index.html  →  <script src="/templates/engine.js">
                                                       <script src="/templates/kit/stage-kit.js">
                                                       <script src="/templates/kit/lint-*.js">
   → templates/engine.js（645 行，MotionEngine）＋ templates/kit/（1453 行）

② 设计台分镜预览器（storyboard.mjs 自动生成，给用户在设计台里看的）
   storyboard.mjs:139  →  type: 'motionSequence' | 'darkNarrativeSequence'
   studio/generated/player.html  →  assets/template/{scenes,motion-sequence,player}.js
   → 它根本不是"视频引擎"，是分镜稿的可视化预览
```

**关键事实**：`studio/generated/player.html` **从不加载 `templates/engine.js`**；
反过来，真实样片 `opening/index.html`（596 行）**从不加载 `assets/template/`**。
两者没有竞争关系，是流水线上的两个工位。

替换后的架构表：

| 层 | 真实文件 | 行数 | 每期成本 | 用在哪一步 |
|---|---|---:|---|---|
| **成片引擎** | `templates/engine.js` + `templates/segment.html` | 645 | 零改动 | **样片与全片（Agent 手写页面）** |
| **装配层** | `templates/kit/*` | 1453 | 零改动 | 母版合成、点阵、摆位、L2/L3 校验 |
| 分镜预览器 | `assets/template/{player,scenes,motion-sequence}.js` | ~750 | 零改动 | 设计台里给用户看分镜稿 |
| 预览数据 | `project.json`（`storyboard.mjs` 生成） | — | 自动生成 | 同上 |
| 每期页面 | `<job>/opening/index.html` 等 | ~600/段 | 全部新写 | 每期核心工作 |
| 字幕 | `subs.js` | — | 自动生成 | 两者共用 |

**同时修正 `SKILL.md:63`**：当前写"页型配置继续服务独立页面与 Cheese Motion 契约"，
暗示两条路径二选一；应改为"`assets/template/` 只服务设计台分镜预览，
成片一律走 `templates/engine.js` + `templates/kit/`"。

**落点**：`SKILL.md:176-193`、`SKILL.md:63`

**验收**：表中每个文件存在且行数准确（±10%）；"我现在该用哪套"可被一句话回答

**预估**：S（1.5 h）　**依赖**：无　**可并行**：是

---

### P0-5 · 清理其余 references 的旧工程名

`grep -coE "config\.js|theme\.css|player\.js|editor\.js|export-video|qa-check|gen-subs|serve\.command|cover-studio"`：

| 文件 | 命中 | 处理 |
|---|---:|---|
| `SKILL.md` | 20 | P0-2 / P0-4 已覆盖 |
| `references/regression-qa.md` | 7 | L1/L2/L3 分级的判据按真实文件重写 |
| `references/page-types.md` | 2 | P0-3 已覆盖 |
| `references/pitfalls.md` | 2 | 坑的描述改挂到真实文件 |
| `references/qa-delivery.md` | 1 | 改为 `npm run qa:*` |
| `references/design-aesthetic.md` | 1 | 改为 `player.css` / token |

**落点**：上表 4 个文件（regression-qa / pitfalls / qa-delivery / design-aesthetic）

**验收**：全仓库 `grep` 这组旧名，只在 `SKILL-DIAGNOSIS-vs-v2.md` 与本计划中出现

**预估**：S（1.5 h）　**依赖**：P0-2、P0-3、P0-4　**可并行**：否

---

### P0-6 · `.skill-reference/` 去重

`.skill-reference/` 下有 `asset-pipeline.md`、`commands.md`、`design-aesthetic.md` 三份，
与 `references/` 同名文件内容漂移（如 `.skill-reference/asset-pipeline.md` 136 行 vs
`references/asset-pipeline.md` 178 行）。**双源 = 必然不一致**。

**已查明用途：历史快照，孤儿目录，可直接删除。** 证据三条：

1. `git grep "skill-reference" -- ':!.skill-reference'` → **全仓库零引用**，
   没有任何代码、文档、脚本读它
2. 引入于初始提交 `dba47c7`（"初始化并恢复 Agent 驱动制作流程"），
   之后只被 `89e4b59`（"清理案例与调研产物"）扫到过一次，**从未被主动维护**
3. 已经漂移：`asset-pipeline.md` 相差 62 行、`design-aesthetic.md` 相差 15 行、
   `commands.md` 相差 2 行

**动作**：`git rm -r .skill-reference/`。三份文件先归档到 `docs/maintainers/archive/`
（保留一次历史快照），不直接丢弃。

**落点**：`.skill-reference/` → 删除

**验收**：不存在内容漂移的同名双份文档；`npm test` 不受影响（本来就没人读它）

**预估**：S（0.5 h）　**依赖**：无　**可并行**：是

---

# P1 · 接线：把施工规范提到主路径

> 目标：执行模型开工第一件事是填表A–F，并且有一份填满的范例可以抄。
> 这是**效果改善最大的一个阶段**。

---

### P1-1 · 把表A–F 提升为 SKILL.md 第一条铁律

**问题**：`execution-contract.md`（209 行，唯一准确的施工规范）在 SKILL.md 里
**只在第 265 行"附：文件索引"倒数第三条出现过一次**；68 行主流程从不要求填表。

```
$ grep -n "表A\|表B\|表C\|表D\|表E\|表F\|填表" SKILL.md
265:- `references/execution-contract.md` …
```

**动作**（对标 `vertical-explainer-v2/SKILL.md:12-23, 42-80`）

1. SKILL.md 新增「第零部分 · 执行提示词」，**第一条**即：
   > 按顺序输出：表A 节拍表 → 表B 结构表 → 表C 布局表 → 表D 分镜表 → 表E 承接表 → 表F 元素表 → 代码。
   > 任何一张表没写完，不得开始写代码。每张表写完，对照它的"通过条件"自查一次。
2. **六张表的空模板直接内联进 SKILL.md**（不是链接）——B 的做法，L42–80。
   模型必须在上下文里直接看到列结构，否则不会去点链接。
3. 通过条件留在 `execution-contract.md`，SKILL.md 给一行路由。
4. 第二节 SOP 的步骤 F（对轴）前面插入 ③–⑥ 填表步骤，让流程图里出现表格节点。

**落点**：`SKILL.md` 新增 ~45 行（第零部分）；`SKILL.md:155-162`（步骤 F）

**验收**
- SKILL.md 前 40 行内出现"表A…表F"和"没填完不得写代码"
- 六张表的列结构可在 SKILL.md 内直接读到，无需打开 references

**预估**：M（2.5 h）　**依赖**：无　**可并行**：是

---

### P1-2 · 补一份填满的 `EXAMPLE.md`

**问题**：A 没有任何端到端范例。最接近的 `templates/storyboard.md` 是空模板
（每张表一行 `| M1 |  |  |  |  |  |` 占位符）。
B 的 `EXAMPLE.md` 是 176 行真实片段，六表全满，表D 精确到 `暂停令@43.57 → 43.55（−0.02）`。

**对执行模型，一份填满的范例的条件化作用强于 500 行规则。这是单项投入产出比最高的任务。**

**动作**

**已选定素材源**（我把 70 个 production-job 全部过了一遍）：

> **`studio/production-jobs/motion-4cfd2c66-bdf6-49b5-ac50-e9a4bf1f6c6c/`**
> 端侧 AI 期，2026-11-07 18:05，是全仓库**唯一走完整条链路**的任务。

选它的理由（其余 69 个都缺环节）：

| 产物 | 有无 | 说明 |
|---|---|---|
| `opening/index.html`、`mechanism/index.html` | ✅ | 596 行，真实调用 `/templates/engine.js` + `kit/` |
| `baseline-opening/`、`baseline-mechanism/` | ✅ | 各 5 帧像素基线，**全仓库仅此一份** |
| `contact-sheet/`（md + html + json + shots） | ✅ | 语义接触表齐全 |
| `delivery/`（9 张 PNG） | ✅ | 已交付截图 |
| `film-preview/index.html` | ✅ | 全片预览 |
| `samples.json` | ✅ | 两段样片的 carry 写得**具体、可用**（见 §零 发现 3） |
| `pages.json`、`scenes.mjs`、`build-pages.mjs` | ✅ | 装配脚本 |

**取其中 `opening` 段（b01–b02）＋ `mechanism` 段（b13–b14）**，各 2 拍，
对应 `samples.json` 里那两条高质量 carry 描述。

⚠️ **严禁直接复制该任务的 `agentAnalysis.carryTable`** —— 它 23 行全是套话（§零 发现 3）。
表E 必须**手工重写**，`how` 列只能填决策树里的手法词。
2. 产出 `EXAMPLE.md`，严格按 P1-1 的六张表格式**全部填满**，要求：
   - 表A 每拍带起止、字幕、关键词@时间、拍类型、视觉动词
   - 表B 的"持续主体形态链"必须是一条完整链（`X → 落地 → 长成 Y → 被 Z 罩住 → 归档回 X`）
   - 表C 每个坐标标注模板出处（`L3 左主体` / `R 槽位②`）
   - 表D 的"关键词对齐"列写出实际时间差（必须落在 −0.1 ~ +0.3 s）
   - 表E 无空行，每个边界的"怎么变"都能在承接决策树里找到路径
   - 表F 每个元素有出生/死亡/承接自/承接给/图层
3. 附**关键拍的真实代码片段**（能跑的，调用 `templates/engine.js` 真实 helper）。
4. 文件头写明："这是一段修好过的片段，弱模型照这个格式填写即可。"
5. **新增「反例」一节**（B 的 EXAMPLE 没有，但本仓库必须有）：
   把 §零 发现 3 的那 23 行套话 carryTable **原样贴出来**，标注
   "以下写法通过了 E03/E05 校验，但它是零信息的。`how` 列不是手法词，
   23 行完全相同 = 没有做承接设计"，与上方正例并置。
   **本仓库最贵的教训就是"填满 ≠ 填对"，范例里必须把这个反模式钉死。**

**落点**：新建 `EXAMPLE.md`（仓库根，与 SKILL.md 同级，便于被一起读到）；`SKILL.md` 路由表加一行

**验收**
- 六张表零空格，且表E 的 `how` 列**取值互不相同**、全部来自决策树枚举
- 代码片段里出现的每个函数都在 `templates/engine.js` 中存在
- 含正例 / 反例对照
- 把该段 SRT 交给一个干净会话 + 本 skill，产出的表格结构与 EXAMPLE 同构

**预估**：L（6–8 h，需要真实跑一遍才能填准时间）　**依赖**：P1-1（表格式定稿）　**可并行**：否

---

### P1-3 · 把 `execution-contract.md` 拆分归位

**问题**：这份 209 行文档内容正确，但它同时承担了四个角色——执行提示词、流程、
设计系统（布局坐标）、动词表。放在一个文件里，导致要么全读要么不读。

**动作**（**不是删除，是分发到正确位置**）

| execution-contract 的段落 | 去向 |
|---|---|
| 执行提示词（L13-26） | → `SKILL.md` 第零部分（P1-1） |
| 八步流程（L28-42） | → `SKILL.md` 第一部分 |
| 表A 节奏硬数字（L44-66） | → 新建 `references/rhythm.md`（对标 B 的 `02-rhythm.md`） |
| 表B 论证模式表（L68-93） | → `references/script-storyboard.md`（已有，合并） |
| **表C 布局模板 L1–L8 坐标（L95-118）** | → `references/stage-layout.md`（**覆盖**当前的模糊版，见 P2-1） |
| **表D 视觉动词表（L120-148）** | → 新建 `references/visual-verbs.md`（P2-3） |
| 表E 承接决策树（L150-167） | → `references/motion-carry.md`（已有，合并） |
| 表F + 图层（L169-176） | → `references/stage-layout.md` |
| 数据→画面映射声明（L178-194） | → `references/data-viz.md`（已有，合并） |
| 动效硬数字（L196-202） | → `references/rhythm.md` |
| 交付格式 + 人工必查（L204-209） | → `references/qa-delivery.md`（已有，合并） |

拆分后 `execution-contract.md` 保留为**一页纸索引**（约 30 行），或直接删除。

**落点**：如上表 7 个文件

**验收**：拆分前后内容无丢失（逐条 diff 核对）；每条规则只有一个权威位置

**预估**：M（4 h）　**依赖**：P1-1　**可并行**：否

> ⚠️ **风险**：这是本计划中唯一有"改坏正确文档"风险的任务。
> 建议单独一个 commit，并在拆分前后各跑一次 `npm test` + `node scripts/test-rule-registry.mjs`
> （29 条规则的 `source` 字段指向 `execution-contract.md#表D` 等锚点，**拆分后必须同步更新**，
> 否则三向索引核对会失败）。见 P1-4。

---

### P1-4 · 同步规则注册表的文档锚点

**问题**：`references/rules/` 里 11 条规则的 `source` 字段指向
`references/execution-contract.md#表D` / `#表E` / `#表C` / `#表F` / `#人工必查` / `#两级设计卡`。
P1-3 拆分后这些锚点全部失效，`scripts/test-rule-registry.mjs` 的三向索引核对会红。

**受影响规则**：`E01 E02 E03 E04 E05 E09 E17 E19 E20 E21 C04`

**动作**
1. 按 P1-3 的去向表逐条更新 `source`
2. 重跑 `node scripts/build-checks.mjs` 重新生成 `references/checks.md`
3. `node scripts/test-rule-registry.mjs` 必须全绿
4. **给 `test-rule-registry.mjs` 增强**：当前它核对"规则 → 实现 → 测试"三向，
   建议增加第四向——**`source` 指向的文件和锚点必须真实存在**（这正是 P4-1 的一部分）

**落点**：`references/rules/*.rule.mjs`（11 个）、`references/checks.md`（自动生成）、`scripts/test-rule-registry.mjs`

**验收**：`npm test` 全绿

**预估**：S（1.5 h）　**依赖**：P1-3　**可并行**：否

---

### P1-5 · 把表A–F 校验接到对话路径

**问题**：`agent-flow.mjs:175-226` 已经实现了 E01（focus 非空）、E02（verb ∈ 词表）、
E03（carry 非空）、E04（设计卡五字段）、E05（承接表无空行）、E28（拍数 3–40）——
**但这些只在 Cheese Motion 设计台路径（`job.json` → `analysis.json`）生效**。
用户在对话里直接给 SRT 时，一条都不走。

**动作**
1. 把 `cleanBeat` / `cleanDesignCard` / `cleanCarryTable` 从 `agent-flow.mjs` 抽到
   `templates/kit/storyboard-contract.js`（纯函数，无 IO）
2. 新增 CLI：`node scripts/check-storyboard.mjs <storyboard.json>`，
   让对话路径也能自检同一套约束
3. `SKILL.md` 的交付前自检清单加一行：填完表A–F 后跑这条命令
4. `agent-flow.mjs` 改为调用抽出来的模块（保证两条路径**同一套校验**，不会再漂移）

**落点**：新建 `templates/kit/storyboard-contract.js`、`scripts/check-storyboard.mjs`；
改 `agent-flow.mjs:168-226`；`package.json#scripts`

**验收**
- 同一份不合格 storyboard，设计台路径和 CLI 路径报同样的错
- `npm test` 全绿；新增 `scripts/test-storyboard-contract.mjs`

**预估**：M（3–4 h）　**依赖**：P1-1　**可并行**：与 P1-2 可并行

---

### P1-6 · 【新增·高优先级】把表E 的「怎么变」从自由文本改成枚举

> 这是 §零 发现 3 的直接对策，也是本计划中**唯一一条针对"校验器被绕过"的结构性修复**。
> 优先级与 P1-2 同级。

**问题回顾**：真实产出里 23 行 `how` 字段一字不差完全相同
（"主体保持身份，只改变形态与位置"），E03/E05 全部通过。
**要求填 N 行自由文本，就会得到 N 行套话。**

**动作**（三层，缺一不可）

1. **改成枚举（输入端约束，治本）**
   `carryTable[].how` 从 `string` 改为**枚举字段** `method`，取值来自
   `execution-contract.md:155-159` 的承接决策树：
   ```
   长成 | 展开 | 归档 | 落下 | 分出多个 | 多个汇成一个 | 替换
   ```
   另加一个 `detail: string` 放具体描述。**枚举填不出套话。**

2. **加反退化校验（输出端兜底）**
   新增规则 **`E33-承接手法不得退化`**，三条断言：
   - `method` ∈ 枚举（硬失败）
   - 同一 `method` 连续出现 > 5 次 → 失败（提示"检查是否在套模板"）
   - `detail` 字段的**去重率**：`len(set(details)) / len(details) < 0.6` → 失败
     （23 行里只有 1 种写法 = 去重率 0.04，直接拦下）

3. **降低机械填充的收益（流程层）**
   长片（>12 拍）的表E 改为**只强制填写"语义段落边界"**（通常 4–8 行），
   段落内部的拍间承接由 `method` 枚举 + 默认值覆盖。
   **要 23 行得到套话，要 6 行才会得到真答案**——`samples.json` 已经证明了这一点。

**落点**：`templates/kit/storyboard-contract.js`（P1-5 抽出的模块）、
`agent-flow.mjs:211-226`（`cleanCarryTable`）、
新建 `references/rules/E33-承接手法不得退化.rule.mjs`、
`scripts/test-storyboard-contract.mjs`

**验收**
- 把 `motion-4cfd2c66` 的真实 `carryTable` 喂进校验器，**必须 exit 1**
  （这是现成的回归 fixture，不用造数据）
- 把 `samples.json` 里那两条高质量 carry 喂进去，必须通过
- `references/cases.md` 新增一条 `CASE-33`，关联 `E33`

**预估**：M（3–4 h）　**依赖**：P1-5（共用抽出的模块）　**可并行**：否

> 💡 **这条修复的方法论可以推广**：遍历现有 29 条规则，凡是"要求填自由文本且不限条数"的
> （E03、E04、E05、E22、E23 嫌疑最大），都应审查是否存在同类退化。建议并入 P4-3 的贡献约束。

---

# P2 · 补料：把判断力变成查表

> 目标：模型不需要审美判断，坐标、画法、动词、节奏全部可查。
> 对标 B 的 `03-design-system.md`（177 行纯查表）。

---

### P2-1 · `stage-layout.md` 去模糊化

**问题**：当前 58 行全是区间和"约"：

```
主视觉区 | 360–1300 | 默认视觉中心约 (540, 800)
卡片 | rect | 默认圆角 14–24，可按 token 调整
指标卡 | 自定义 | 参考 290×180，三列中心 x=220/540/860
同一时刻一个焦点主体，约 3–5 个活跃元素
```

而精确版（9 个布局模板 R/L1–L8 的中心坐标）只存在于 `execution-contract.md:95-118`。

模糊词密度：A 1803 行里"约"62 次（3.4%）、"参考"67 次、"可选"17 次；
B 819 行里"约"12 次（1.5%）、"参考"0、"可选"0。

**动作**
1. 把 `execution-contract.md:95-118` 的 L1–L8 坐标表**迁入并作为唯一权威**
2. 逐条消除"约/参考/建议/可按…调整"：每一处要么给常数，要么给**带判据的枚举**
   （如 `圆角：卡片 18 / 胶囊 高度一半 / 槽位 33`）
3. 补齐 B 有而 A 没有的两张表：
   - **画布分区表**：6 个 y 区间 + 每区的硬规则（含"字幕区以下什么都不能放"的精确 y）
   - **文字规范表**：5 档用途 → 字号 → **精确基线 y**（当前 A 只有"汉字约 1em"）
4. 组合规则（`R 可配任意模板`、`L7 可与 L1/L4 组合`）一并迁入

**落点**：`references/stage-layout.md`（58 → 约 120 行）

**验收**
- "约/参考/建议"在本文件中出现 ≤3 次，且每次都有判据
- 每个布局模板给出可直接写进代码的中心坐标
- 新增规则 `E31-坐标必须有模板出处`，校验表C 的坐标列非空且能匹配模板编号

**预估**：M（3 h）　**依赖**：P1-3　**可并行**：是

---

### P2-2 · 新建视觉隐喻词典 `references/visual-metaphors.md`

**问题**：A **全仓库没有"概念 → 画法"映射**（`grep -rln "隐喻\|概念.*画法"` 零命中）。
B 有 17 条（`03-design-system.md` 4.6）：

```
监管、规则        → 对立色虚线框罩住对象，加"监管收紧"胶囊
投入、资本开支    → 硬币不断流入容器，水位上涨
不确定、什么时候  → 问号变成时钟，指针快速转动
```

这是"模型不知道第 3 拍该画什么"的直接原因——它每次都要现场发明一个视觉比喻。

**动作**
1. 建 `references/visual-metaphors.md`，**最少 20 条**，每条四列：
   `概念 | 画法（一句话） | 用到的组件/helper | 对应视觉动词`
2. 来源：
   - B 的 17 条（通用，可直接移植）
   - 本仓库 `studio/production-jobs/` 里已验收过的真实镜头（反向提炼）
   - `references/cases.md` 里 CASE-16（云图标当语音源）这类**反例**单列一节"语义反相禁用表"
3. 与 P2-3 的动词表交叉引用：每个隐喻标注它用哪个动词

**落点**：新建 `references/visual-metaphors.md`（约 60 行）；`SKILL.md` 路由表加一行

**验收**
- ≥20 条；每条的"用到的组件/helper"都能在 `templates/engine.js` 或 `templates/kit/` 中找到
- 新增规则 `E32-画法必须来自隐喻词典或显式标注新造`

**预估**：M（4 h）　**依赖**：P2-1　**可并行**：否

---

### P2-3 · 抽出 `references/visual-verbs.md`

**现状良好**：`execution-contract.md:120-148` 的 20 个动词 → 引擎 helper → 缓动/时长映射
**已核验 22/22 全部命中** `templates/engine.js`，且与 `agent-flow.mjs:41-44` 的
`VISUAL_VERBS` 完全一致。这是仓库里质量最高的一张表。

**动作**（低风险，主要是搬家 + 加固）
1. 独立成 `references/visual-verbs.md`
2. 补第 5 列：**典型误用**（如"展开"不能用整页淡入实现）
3. 补第 6 列：**该动词的 lint 可判定项**（供 `lint-semantics.js` 的 E21 使用）
4. 在文件头加机器可读清单，供 P4-1 的 CI 对 `engine.js` 与 `VISUAL_VERBS` 做三方核对

**落点**：新建 `references/visual-verbs.md`；`agent-flow.mjs:41-44` 改为从该文件生成或加注释指向

**验收**：CI 断言「文档动词集 == `VISUAL_VERBS` == 实现中可用的 helper 集」

**预估**：S（2 h）　**依赖**：P1-3　**可并行**：是

---

### P2-4 · 新建 `references/rhythm.md`

**动作**：把 `execution-contract.md:44-66`（节奏硬数字）与 `:196-202`（动效硬数字）
合并成独立文件，对标 B 的 `02-rhythm.md`（59 行）。内容已准确，补两项：

1. **关键词时间公式**（B 有，A 散在各处）：
   `关键词时间 = 句子开始 + (关键词前字数 ÷ 句子总字数) × 句子时长`
2. 中文语速口径统一（当前 `SKILL.md:139` 说 280–300 字/分，
   `execution-contract.md:46` 说"保守下限 3.6 字/秒"——**两处口径需对齐并标明何时用哪个**）

**落点**：新建 `references/rhythm.md`（约 55 行）

**验收**：语速口径全仓库唯一；`SKILL.md:139` 改为引用

**预估**：S（1.5 h）　**依赖**：P1-3　**可并行**：是

---

# P3 · 瘦身：砍掉噪声

---

### P3-1 · 20 条铁律砍到 ≤8 条

**问题**：`SKILL.md:12-31` 的 20 条启动铁律，按内容归类：

| 类型 | 条目 | 数量 |
|---|---|---:|
| 流程闸门 / 确认顺序 | 0, 8, 10, 11, 18 | 5 |
| 禁止红线 | 1, 2, 3, 5, 7, 9 | 6 |
| 工程架构约束 | 14, 17, 19 | 3 |
| 交付格式 | 4, 6, 16 | 3 |
| 语义/构造指令 | 12, 15, 20 | 3 |

**真正回答"这句旁白画成什么、画在哪个坐标、用哪个函数、多长时间"的：零条。**

命令式措辞密度 114 次 / 267 行 = 0.43/行（B：6 / 111 = 0.05/行，**差 8.6 倍**）。
另有 **29 个日期戳**与事故叙述（B：0 个）占着最高优先级位置。

**动作**（沿用 `SKILL-RETROSPECTIVE.md:147-157` 自己提出的 A/B/C 分类）

| 类 | 定义 | 去向 |
|---|---|---|
| A 审美取向 | 人执行 | 留在 SKILL.md，≤3 条 |
| B 工艺规范 | 机器可断言 | **下沉** `execution-contract` 拆分后的各文件，并**必须配校验器编号** |
| C 协作契约 | 流程/UI 强制 | **下沉** `references/agent-workflow.md`，并配 UI 闸门 |

规则：
- **去掉全部 29 个日期戳和事故叙述**（"2026-09-30 中网项目血泪沉淀"这类）——
  它们是给维护者的，移进 `references/cases.md`（那里本来就是案例库）
- 没有校验器编号的 B 类规则，标记为"未实现"或删除
- SKILL.md 只保留：A 类 + 开工前三问 + 路由表

**落点**：`SKILL.md:12-31` → 约 12 行；增量内容进 `references/agent-workflow.md` 与 `references/cases.md`

**验收**
- SKILL.md 日期戳 = 0
- 命令式措辞密度 < 0.15/行
- 每条保留的 B 类铁律都有 `E*`/`C*` 编号

**预估**：M（3 h）　**依赖**：P1-3、P1-4　**可并行**：否

---

### P3-2 · 维护者文档移出 skill 加载路径

| 文件 | 行数 | 读者 |
|---|---:|---|
| `IMPROVEMENT-PLAN.md` | 403 | 维护者 |
| `CONTRIBUTING.md` | 319 | 维护者 |
| `SKILL-RETROSPECTIVE.md` | 235 | 维护者 |
| `FLOW-TEST-REPORT.md` | 133 | 维护者 |
| **合计** | **1090** | |

**动作**：移到 `docs/maintainers/`（或独立分支）。`README.md` 留指针。
`SKILL-DIAGNOSIS-vs-v2.md` 与本计划同样移入。

**落点**：新建 `docs/maintainers/`，`git mv` 6 个文件

**验收**：仓库根目录只剩 `SKILL.md` / `EXAMPLE.md` / `README.md` / `package.json` 等执行必需品

**预估**：S（0.5 h）　**依赖**：无　**可并行**：是

---

### P3-3 · 重建 SKILL.md 路由表

**动作**：对标 B 的 `SKILL.md:82-93`——一张「需要什么 → 读哪个文件」表，
并明确写上"**按需要读，不要一次全读**"。

重建后的路由表（预期）：

| 需要什么 | 读哪个文件 |
|---|---|
| 八步流程、六张表的通过条件 | `references/execution-contract.md`（或拆分后索引） |
| 语速、关键词时间、节奏配额 | `references/rhythm.md` |
| 画布分区、布局模板 L1–L8、字号、组件 | `references/stage-layout.md` |
| 概念 → 画法 | `references/visual-metaphors.md` |
| 视觉动词 → 引擎 helper | `references/visual-verbs.md` |
| 承接决策树、Carry helpers | `references/motion-carry.md` |
| 场景类型与 props | `references/scene-types.md` |
| 人物 | `references/figures.md` |
| 数据诚信与映射声明 | `references/data-viz.md` |
| 素材确认闸门 | `references/asset-pipeline.md` |
| 交付 QA | `references/qa-delivery.md` |
| 命令 | `references/commands.md` |
| **一份填满的完整示范** | **`EXAMPLE.md`** |

**落点**：`SKILL.md:246-267`

**预估**：S（1 h）　**依赖**：P2 全部　**可并行**：否

---

### P3-4 · 重写 frontmatter description

**问题**：当前是领地声明而非触发描述——
"一切视频制作与视频剪辑需求的**唯一入口（铁律）**……必须先调用本 skill。"

对比 B：说清了输入（SRT/脚本）、输出（1080×1920 单文件 HTML）、
适用场景、**以及交付判据**（`?lint` 零报错）。

**动作**：改写为「输入 → 输出 → 触发场景 → 交付判据」四要素，去掉"唯一入口""铁律""必须"。

**落点**：`SKILL.md:1-4`

**预估**：S（0.5 h）　**依赖**：无　**可并行**：是

---

# P4 · 固化：防止再次漂移

> 这些问题之所以存在，是因为**没有任何机制阻止文档和代码分叉**。
> 不做 P4，半年后会重新长回来。

---

### P4-1 · 新增文档↔代码一致性 CI（本计划中性价比最高的一条）

**动作**：新建 `scripts/test-doc-contract.mjs`，断言四件事：

1. **路径存在性**：`SKILL.md` 与 `references/*.md` 中出现的每个仓库内路径（形如
   `` `xxx.md` `` / `` `xxx.mjs` `` / `` `xxx/` ``）必须在工作区存在
   → 这一条就能抓到本次全部 20 + 13 处失效引用
2. **场景类型一致**：`references/scene-types.md` 的 type 清单
   == `assets/template/scenes.js` 的 `SCENE_BUILDERS` 键集
3. **动词三方一致**：`references/visual-verbs.md` 的动词集
   == `agent-flow.mjs` 的 `VISUAL_VERBS` == 文档中映射到的 helper 全部存在于 `templates/engine.js`
4. **规则锚点有效**：`references/rules/*.rule.mjs` 的 `source` 字段
   指向的文件存在、且 `#锚点` 能在该文件中找到对应标题

接进 `package.json#scripts.test`。

**落点**：新建 `scripts/test-doc-contract.mjs`；`package.json`

**验收**：故意把 SKILL.md 里某个路径改错一个字母，`npm test` 必须 exit 1

**预估**：M（4 h）　**依赖**：P0、P2 完成　**可并行**：否

> 💡 **这一条比现有 29 条规则加起来更有价值**——29 条规则校验的是模型填的表单字段，
> 这一条校验的是**skill 自身是否在说谎**。本次全部致命问题都会被它拦下。

---

### P4-2 · 单位与量纲防呆

**动作**
1. P0-1 的 Schema 之外，在 `assets/template/player.js` 的 `init()` 里加运行时断言：
   `scene.duration > 600` → `console.error` + 页面红色横幅（而不是静默渲染 3.5 小时）
2. `templates/engine.js` 的 `S(el, t0, t1, ...)` 已有 `t1 <= t0` 断言（`motion-carry.md:5`），
   补一条 `t1 - t0 > 600` 的量纲警告

**落点**：`assets/template/player.js`、`templates/engine.js`

**预估**：S（1.5 h）　**依赖**：P0-1　**可并行**：是

---

### P4-3 · 建立「文档变更必须同步」的贡献约束

**动作**：在 `docs/maintainers/CONTRIBUTING.md` 增加一节，并用 CI 弱提醒：

- 改 `SCENE_BUILDERS` → 必须同步 `references/scene-types.md`
- 改 `VISUAL_VERBS` 或 engine helper 名 → 必须同步 `references/visual-verbs.md`
- 新增 B 类规则 → 必须同时提交校验器 + 测试 + `references/rules/` 条目
  （`SKILL-RETROSPECTIVE.md:200` 自己的教训："写规则的人要同时写校验器"）

**落点**：`docs/maintainers/CONTRIBUTING.md`

**预估**：S（1 h）　**依赖**：P3-2

---

## 三、执行顺序与依赖图

```
P0-1 单位 ──┬─> P0-3 场景类型 ──┐
            │                   ├─> P0-5 清理旧名 ─┐
P0-2 SOP ───┤                   │                  │
P0-4 架构 ──┘                   │                  │
P0-6 去重（独立，需你确认）      │                  │
                                │                  │
P1-1 表A-F 提主路径 ────┬───────┴──> P1-3 拆分 ──> P1-4 锚点同步 ─┐
                        │                                          │
                        ├──> P1-2 EXAMPLE.md（最高价值，最耗时）   │
                        └──> P1-5 校验接对话路径 ──> P1-6 表E 枚举化（反退化）│
                                                                   │
P2-1 坐标去模糊 ──> P2-2 隐喻词典                                  │
P2-3 动词表（可并行）                                              │
P2-4 节奏表（可并行）                                              │
                                        │                          │
                                        └──> P3-1 铁律瘦身 <───────┘
P3-2 维护者文档外移（可随时做）              │
P3-4 frontmatter（可随时做）                 ├──> P3-3 路由表
                                             │
                                             └──> P4-1 一致性 CI ──> P4-3
P4-2 量纲防呆（依赖 P0-1）
```

**建议排期（7.5 人天）**

| 天 | 任务 |
|---|---|
| D1 | P0-1、P0-2、P0-4、P0-6 |
| D2 | P0-3、P0-5 |
| D3 | P1-1、P1-5、**P1-6**（表E 枚举化） |
| D4–D5 | **P1-2 EXAMPLE.md**（需真实跑一遍）、P1-3、P1-4 |
| D6 | P2-1、P2-3、P2-4 |
| D7 | P2-2、P3-1、P3-2、P3-4 |
| D8（半天） | P3-3、P4-1、P4-2、P4-3 |

---

## 四、完成后的量化目标

| 指标 | 现状 | 目标 | 对照 B |
|---|---:|---:|---:|
| SKILL.md 行数 | 267 | **≤120** | 111 |
| references 文档行数 | ~1536 | ~1000 | 708 |
| 文档合计 | 1803 | **≤1120** | 995 |
| 填满的端到端范例 | 0 | **1 份（≥150 行）** | 176 行 |
| SKILL.md 日期戳 | 29 | **0** | 0 |
| 命令式措辞密度 | 0.43/行 | **≤0.15/行** | 0.05/行 |
| "约/参考/建议"在布局文档中 | 高 | **≤3 处且带判据** | ~0 |
| 失效路径引用 | 33 处 | **0（CI 拦截）** | — |
| 概念→画法映射条目 | **0** | **≥20** | 17 |
| 启动铁律条数 | 20 | **≤8** | 9 |
| 无校验器的 B 类规则 | 未知 | **0** | — |
| 表E `how` 列去重率（真实产出） | **0.04**（23 行 1 种写法） | **≥0.6**（E33 强制） | — |
| 自由文本型校验字段 | 多处 | **关键字段全部枚举化** | — |

---

## 五、效果验证方法（怎么知道真的修好了）

**不要靠"读起来顺了"来判断。** 建议做一次对照实验：

1. 选一段 **从未用过的 30 秒 SRT**
2. 分别用 **修复前的 test 分支** 和 **修复后的分支**，各开 3 个干净会话（共 6 次）
3. 统一提示词："用这个 skill 做这段视频"
4. 记录四个指标：
   - **首次产出是否包含表A–F**（修复前预期 0/3，修复后预期 3/3）
   - **坐标是否有模板出处**（抽查每次产出的 10 个坐标）
   - **是否出现单位错误**（`duration` 写成毫秒）
   - **到第一版可预览网页的往返轮次**
5. 再把 6 份产出匿名打乱给 Bella 盲评排序

这套实验本身建议沉淀成 `docs/maintainers/skill-eval.md`，每次大改跑一遍。

---

## 六、风险与应对

| 风险 | 等级 | 应对 |
|---|---|---|
| **P1-3 拆分 `execution-contract.md` 改坏唯一正确的文档** | 高 | 单独 commit；拆分前后逐条 diff；P1-4 立刻跑 `test-rule-registry` |
| P1-2 EXAMPLE 挑的片段本身质量不高，把坏示范固化 | 高 | 必须选**已通过 Bella 验收**的片段；EXAMPLE 定稿前请她过目 |
| P3-1 砍铁律砍掉了真正救过命的约束 | 中 | 每删一条，先在 `references/cases.md` 找它对应的真实事故；找不到才删 |
| P0-3 重写 scene-types 时误读 `motion-sequence.js`（374 行） | 中 | 用 `?t=` 定格实测每个 props 的效果，不靠读码推断 |
| 文档瘦身后，某些隐性知识丢失 | 中 | 所有删除内容进 `docs/maintainers/archive/`，不直接 `rm` |
| ~~三套引擎的选择判据定不下来~~ | — | **已解决**：调用链证明是两道工序，见 §七 决策 2 |
| P1-6 枚举化后，模型改为"枚举也套模板"（连续选同一个手法词） | 中 | E33 的第二条断言（同一 method 连续 >5 次失败）就是防这个；上线后用真实产出复测一次 |
| 改动期间产线中断 | 低 | 全程在 `test` 分支的子分支上做，`main` 不动 |

---

## 七、决策记录（已定，无需你再拍板）

上一版留了三个待定项。我已经逐一查证并定了，依据和结论如下，**执行时按此办，不必回头确认**。

### 决策 1 · `.skill-reference/` → 删除

| | |
|---|---|
| **结论** | 删除，先归档一份到 `docs/maintainers/archive/` |
| **依据** | ① `git grep` 全仓库**零引用**；② 初始提交引入后**从未被主动维护**；③ 已漂移（62 / 15 / 2 行） |
| **把握** | 高。没有任何代码读它，删除零风险 |
| **落到** | P0-6 |

### 决策 2 · 不是"三套引擎"，是"两个工位 + 一个共享装配层"

| | |
|---|---|
| **结论** | 两者**都保留**，不废弃任何一套；但要在文档里把定位写死 |
| **依据** | 查调用链得到的硬事实：真实样片 `opening/index.html` 只加载 `/templates/engine.js` + `kit/`；设计台 `studio/generated/player.html` 只加载 `assets/template/*`。**两者互不加载，没有竞争关系** |
| **定位** | `templates/engine.js` + `kit/` = **成片引擎**（Agent 手写页面）；`assets/template/*` = **设计台分镜预览器**（`storyboard.mjs` 自动生成，给用户看分镜稿） |
| **把握** | 高。调用链是确定性证据 |
| **落到** | P0-4（含 `SKILL.md:63` 的措辞修正）、P0-3（`page-types.md` 应明确标注自己描述的是预览器） |

> 之所以之前看起来像"三套并行、不知道用哪个"，是因为 `SKILL.md` 把一个**流水线上的两道工序**
> 写成了**两个可选方案**。这是文档问题，不是架构问题——所以不需要砍任何代码。

### 决策 3 · EXAMPLE.md 素材源 = `motion-4cfd2c66-…`，但表E 必须手工重写

| | |
|---|---|
| **结论** | 取 `opening`（b01–b02）+ `mechanism`（b13–b14）两段 |
| **依据** | 过了全部 70 个 production-job，**只有这一个走完整条链路**：真实页面 + 像素基线 + 语义接触表 + delivery 截图 + 全片预览 + 高质量 `samples.json` carry。其余 69 个都缺环节 |
| **红线** | **严禁复制它的 `agentAnalysis.carryTable`**（23 行套话）。表E 手工重写，`how` 只填决策树手法词 |
| **把握** | 中高。素材完整性确定；"是否经 Bella 验收"无法从文件判断，但它是端侧 AI 期的最终产物，且带 delivery/，是现有最强候选 |
| **落到** | P1-2 |

> **唯一仍建议你看一眼的**：EXAMPLE.md 初稿完成后过目一次，确认这两段的画面质量**配得上当范本**。
> 这不是阻塞项——可以先按计划做，在 P1-2 收尾时顺带确认。如果你觉得不行，换成 `mechanism` 另两拍
> 或 `motion-6a866b77` 的样片即可，不影响其余任务。

---

## 八、这次查证额外带来的计划变更

| 变更 | 原因 |
|---|---|
| **新增 P1-6**（表E 枚举化 + 反退化校验），优先级提到与 P1-2 同级 | 发现真实产出的 carryTable 是 23 行套话，E03/E05 形同虚设 |
| P1-2 新增「反例」一节 | 把"填满 ≠ 填对"这个最贵的教训钉进范例 |
| P0-4 从"区分三套引擎"改为"修正两道工序的措辞" | 调用链证明它们不冲突，工作量下降 |
| P0-6 从"待确认"变为"确定删除" | 证据充分 |
| 总任务数 22 → **23**，总预估 7.5 → **8 人天** | 多出 P1-6（3–4 h） |

**最重要的一条认知更新**：

> 原计划假设"规则没被执行"。实际是**规则被执行了，但被模板化填空绕过了**。
> 所以"再加一条规则"是无效投入——必须把**自由文本改成枚举、把 N 行改成关键几行**。
> 这条原则已写进 §一 修复原则第 2 条，并在 P1-6 落地。
