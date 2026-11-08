# 规则 → 校验器索引

> 本文件由 `node scripts/build-checks.mjs` 从 `references/rules/` 自动生成，**不要手改**。
> 规则注册表是「文档 → 代码」的唯一接线处：每条 B/C 类规则都必须声明实现位置与测试位置，
> `scripts/test-rule-registry.mjs` 会双向核对 —— 规则没有实现、或者实现没有测试，都会让回归失败。

- 规则总数：38
- 已实现：38
- 待实现：0

## A · 审美取向（机器不判，由人在闸门上判断）

| 审美取向 | 出处 |
|---|---|
| 画面文字 = 关键词（≤8 字）+ 每期限 2～3 处金句 | SKILL.md#五审美取向 |
| 音效克制：全片只保留关键仪式音 | SKILL.md#五审美取向 |
| 静音看得懂：关掉字幕仍能读出变化 | SKILL.md#〇执行提示词 |
| 手绘／贴纸／撕纸／胶带／印章视觉语言 | SKILL.md#五审美取向 |
| 视觉母结构必须随语义真实演化（保留 DOM 只是技术底线） | references/semantic-scenes.md#判断标准 |
| 品牌只用官方矢量，拿不到就用纯文字标识 | SKILL.md#五审美取向 |
| 人物只留头肩外轮廓 + 点阵填充，不重建五官 | SKILL.md#五审美取向 |

## B · 工艺规范（可机器判定）

| 编号 | 规则 | 状态 | 文档出处 | 实现位置 | 测试 | 关联缺陷 |
|---|---|---|---|---|---|---|
**E01** | 每拍只有一个焦点 | 已实现 | references/visual-verbs.md#通过条件 | `templates/kit/storyboard-contract.js`（rule: E01） | `scripts/test-storyboard-contract.mjs` `scripts/test-agent-flow.mjs` | #12 |
**E02** | 视觉动词必须来自表D 动词表 | 已实现 | references/visual-verbs.md#动词与引擎实现 | `templates/kit/storyboard-contract.js`（rule: E02） | `scripts/test-storyboard-contract.mjs` `scripts/test-agent-flow.mjs` | #12 |
**E03** | 每拍必须写清跨句承接 | 已实现 | references/motion-carry.md#表E承接决策树 | `templates/kit/storyboard-contract.js`（rule: E03） | `scripts/test-storyboard-contract.mjs` `scripts/test-agent-flow.mjs` | #12 |
**E04** | 两级设计卡五字段必填 | 已实现 | references/semantic-scenes.md#先设计机制再写逐句动作 | `templates/kit/storyboard-contract.js`（rule: E04） | `scripts/test-storyboard-contract.mjs` `scripts/test-agent-flow.mjs` | #12 |
**E05** | 表E 承接表不得有空行 | 已实现 | references/motion-carry.md#表E承接决策树 | `templates/kit/storyboard-contract.js`（rule: E05） | `scripts/test-storyboard-contract.mjs` `scripts/test-agent-flow.mjs` | #12 |
**E06** | 样片必须覆盖连续两拍 | 已实现 | references/semantic-scenes.md | `production-flow.mjs`（rule: E06） | `scripts/test-production-flow.mjs` | #13 |
**E07** | 样片不得跳拍 | 已实现 | references/semantic-scenes.md | `production-flow.mjs`（rule: E07） | `scripts/test-production-flow.mjs` | #13 |
**E08** | 样片必须写清跨句演化 | 已实现 | references/semantic-scenes.md | `production-flow.mjs`（rule: E08） | `scripts/test-production-flow.mjs` | #13 |
**E09** | 语义接触表必须随交付 | 已实现 | references/qa-delivery.md#人工必查清单 | `production-flow.mjs`（rule: E09） | `scripts/test-production-flow.mjs` | #14 |
**E10** | 缩放必须只有一个来源 | 已实现 | references/continuous-qa.md#已知坑 | `templates/kit/stage-kit.js`（rule: E10） | `scripts/test-kit-browser.mjs` | #15 |
**E11** | 压缩间距必须大于元素宽度 | 已实现 | references/stage-layout.md | `templates/kit/stage-kit.js`（rule: E11） | `scripts/test-kit-browser.mjs` | #18 |
**E12** | 循环粒子必须显式结束时间 | 已实现 | references/continuous-qa.md#已知坑 | `templates/kit/stage-kit.js`（rule: E12） | `scripts/test-kit-browser.mjs` | #24 |
**E13** | 母版 id 改名必须自带闭合引号 | 已实现 | references/asset-pipeline.md | `templates/kit/master.js`（rule: E13） | `scripts/test-kit.mjs` | #23 |
**E14** | 点阵必须用显式坐标 | 已实现 | references/asset-pipeline.md | `templates/kit/master.js`（rule: E14） | `scripts/test-kit.mjs` | #22 |
**E15** | 母版元素抽取必须含 rect/circle | 已实现 | references/asset-pipeline.md | `templates/kit/master.js`（rule: E15） | `scripts/test-kit.mjs` | #8 |
**E16** | 拆件数不符必须显式失败 | 已实现 | references/asset-pipeline.md | `templates/kit/master.js`（rule: E16） | `scripts/test-kit.mjs` | #8 |
**E17** | 主体占位比不得塌缩 | 已实现 | references/stage-layout.md#布局模板坐标中心点 | `templates/kit/lint-composition.js`（rule: E17） | `scripts/test-kit-browser.mjs` | #15 |
**E18** | 同组信息必须聚拢 | 已实现 | references/stage-layout.md | `templates/kit/lint-composition.js`（rule: E18） | `scripts/test-kit-browser.mjs` | #17 |
**E19** | 装入必须被容器包含 | 已实现 | references/stage-layout.md#表F元素表 | `templates/kit/lint-composition.js`（rule: E19） | `scripts/test-kit-browser.mjs` | #18 |
**E20** | 焦点必须唯一 | 已实现 | references/visual-verbs.md#通过条件 | `templates/kit/lint-composition.js`（rule: E20） | `scripts/test-kit-browser.mjs` | #17 |
**E21** | 动词必须对应真实动作 | 已实现 | references/visual-verbs.md#三方一致性 | `templates/kit/lint-semantics.js`（rule: E21） | `scripts/test-kit-browser.mjs` | #16 |
**E22** | 资产角色必须与旁白语义一致 | 已实现 | references/asset-pipeline.md | `templates/kit/lint-semantics.js`（rule: E22） | `scripts/test-kit-browser.mjs` | #16 |
**E23** | 承接必须连续 | 已实现 | references/motion-carry.md | `templates/kit/lint-semantics.js`（rule: E23） | `scripts/test-kit-browser.mjs` | #24 |
**E24** | 母版语义必须来自统一字典 | 已实现 | references/asset-pipeline.md | `templates/kit/master.js`（rule: E24） | `scripts/test-kit.mjs` | #16 |
**E25** | 每条案例必须关联校验器编号或人工必查编号 | 已实现 | references/cases.md | `scripts/test-rule-registry.mjs`（rule: E25） | `scripts/test-rule-registry.mjs` | #14 |
**E26** | 画面必须与像素基线逐帧可比对 | 已实现 | references/cases.md | `templates/kit/visual-regression.js`（rule: E26） | `scripts/test-visual-regression.mjs` | #15 |
**E28** | 拍数必须由本期语义段落数决定，不得写死 | 已实现 | references/cases.md | `agent-flow.mjs`（rule: E28 拍数由语义段落数决定，不是固定值） | `scripts/test-agent-flow.mjs` `scripts/test-studio-gates.mjs` | #16 |
**E29** | 母版语义字典必须按期存放，不得全局按槽位号共享 | 已实现 | references/cases.md | `templates/kit/master.js`（rule: E29 母版语义字典必须按期存放） | `scripts/test-kit.mjs` | #17 |
**E30** | 时间单位必须符合工程契约 | 已实现 | references/scene-types.md | `scripts/validate_project.py`（rule: E30） | `scripts/test-unit-contract.mjs` | #30 |
**E32** | 画法必须来自隐喻词典或显式标注新造 | 已实现 | references/visual-metaphors.md | `scripts/test-visual-metaphors.mjs`（rule: E32） | `scripts/test-visual-metaphors.mjs` | #36 |
**E33** | 承接手法不得退化 | 已实现 | references/motion-carry.md | `templates/kit/storyboard-contract.js`（rule: E33） | `scripts/test-storyboard-contract.mjs` | #33 |
**E34** | 场景类型文档必须与注册表一致 | 已实现 | references/scene-types.md | `scripts/test-scene-types.mjs`（rule: E34） | `scripts/test-scene-types.mjs` | #34 |

## C · 协作契约（可由流程/UI 强制）

| 编号 | 规则 | 状态 | 文档出处 | 实现位置 | 测试 | 关联缺陷 |
|---|---|---|---|---|---|---|
**C01** | 闸门回退必须永远可用 | 已实现 | SKILL.md#二铁律 | `studio/app.js`（rule: C01） | `scripts/test-studio-gates.mjs` | #20 |
**C02** | 服务端 analysis 是唯一权威 | 已实现 | references/agent-workflow.md | `studio/app.js`（rule: C02） | `scripts/test-studio-gates.mjs` | #21 |
**C03** | 迟到结果不得覆盖已确认闸门 | 已实现 | references/agent-workflow.md | `studio/app.js`（rule: C03） | `scripts/test-studio-gates.mjs` | #3 |
**C04** | manual 项必须出现在交付接触表 | 已实现 | references/qa-delivery.md#人工必查清单 | `production-flow.mjs`（rule: C04） | `scripts/test-rule-registry.mjs` | #14 |
**C05** | 只有明确「定稿导出」才导出 | 已实现 | SKILL.md#三全流程SOP | `production-flow.mjs`（rule: C05） | `scripts/test-production-flow.mjs` | — |
**E27** | 基线只能由人验收后手动刷新，产线不得自动改基线 | 已实现 | references/cases.md | `scripts/contact-sheet.mjs`（rule: E27） | `scripts/test-visual-regression.mjs` | #15 |

## 规则写法约定

```js
// references/rules/<编号>-<短标题>.rule.mjs
export default {
  id: 'E01', type: 'B', title: '每拍只有一个焦点',
  source: 'references/visual-verbs.md#动词与引擎实现',   // 文档出处（单向：文档 → 规则）
  defects: ['12'],                                // 关联的真实缺陷编号
  status: 'active',
  implementation: { file: 'agent-flow.mjs', marker: 'rule: E01' },
  tests: ['scripts/test-agent-flow.mjs'],
  fix: '在表D「焦点」列写清观众此刻只看哪里'
};
```

- `type`：**A** 审美（人判，不进注册表）/ **B** 工艺（必须机器判）/ **C** 协作（必须流程强制）
- `implementation.file` 必须真实存在，且文件里必须能搜到 `marker`（本规则用 `/* rule: <id> */` 标注）
- `tests` 里的每个文件必须存在，且文件里必须能搜到同一条 `marker` —— 这是「文档 → 校验器 → 测试」三向索引
