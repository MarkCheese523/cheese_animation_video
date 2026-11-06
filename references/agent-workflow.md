# Cheese Motion · 当前对话 Agent 交接

## 职责边界

设计台只收集输入、展示结果并接收用户确认。Agent 负责真实语义拆解；不得用本地正则、固定品牌名单或预填分镜代替 AI 分析，也不要求用户预先提供品牌或元素清单。

```text
页面提交输入整包
→ 用户把页面生成的交接提示发送到当前对话一次
→ Agent 拆解并回写 analysis.json
→ 页面确认分镜
→ 页面按 Agent 返回的语义与检索词查找候选
→ 页面确认参考
→ 制作并确认母版
→ 写入正式分镜与网页预览
```

## 触发与输入

当用户消息包含“请处理 Cheese Motion Agent 任务 motion-…”时：

1. 先调用 `html-animation-video` skill。
2. 读取任务目录中的 `job.json`、`analysis.schema.json` 和 `request.md`。
3. **SRT 是唯一必需输入**；文字脚本与 MP3／M4A 等音频均可选。读取 `attachments` 中的 SRT 搭建骨架；有脚本则辅助理解与纠错，有音频则接入主时钟，只有 SRT 时按无声网页预览制作。产品模式同时读取 `profile` 和 `brandAssets`。`style` 为 `cheeseheart-tech` 时，必须通读 `references/cheeseheart-style/README.md` 并查看两张基线样张，将其色板、字体、HUD、构件与动效约束写入本期视觉设计，不得退回默认深色皮肤。
4. 按本 skill 的叙事、动作、素材双确认规则进行真实分析，不要求用户补交可选脚本或音频。

`analysis.schema.json` 是结构示例，不是要照抄的内容。不得替用户通过分镜、参考或母版确认。

## 反向入口（无任务提示时）

用户直接提出视频需求、消息中没有「请处理 Cheese Motion Agent 任务」提示时，Agent 不得改用对话逐项询问收集输入，而是先启动设计台服务（探测 `http://127.0.0.1:7100/` 是否已在服务本工程，未运行则 `npm run dev -- --host 127.0.0.1 --port 7100`，端口被其他目录占用则换端口），把设计台 URL 发给用户，请其在页面一次性提交整包；页面生成任务提示后按上一节契约执行。`AskUserQuestion` 只用于本 skill 规定的确认闸门，不用于收集输入整包。

## 拆解要求

- `beats`：当前组件级样片使用五个连续拍点，但标题、旁白、动作、时长、信息增量和素材引用必须来自本期输入；不得使用固定演示文案。
- `assets`：自动提取重要名词、通用人物、真实人物、品牌、物品、界面和场景需求。只保留本期有用资产，不机械铺满类别。
- 品牌由 Agent 自动识别；产品模式同时检查 Product Profile 的真实品牌资产。不要让用户回到输入页补品牌。
- 每项资产使用稳定大写 ID。真实品牌使用 `B1、B2…` 并设置 `brandOnly: true`；通用语义资产设置 `semanticOnly` 及必要的 `visualKind`、`semanticName`、`rights`。
- `query` 是适合互联网或公开矢量检索的 1–3 个英文关键词，优先写实体名称，不堆叠 `official / SVG / rights` 等修饰词；`action` 必须是可见动作，`usedIn` 或分镜 `assetIds` 应能追溯使用位置。
- 每项必须给出 `researchRoute`：真实品牌、人物、物品和场景用 `web`；通用图标与符号用 `icon`；不指向真实对象的通用人物或抽象语义用 `semantic`。不能只按品牌／非品牌粗略分流。
- 没有可靠品牌矢量时，后续只使用纯文字标识；不得绘制近似 Logo。

## 回写

将结果写入：

```text
studio/agent-jobs/<jobId>/analysis.json
```

`jobId` 必须与任务目录一致，所有分镜引用的素材 ID 必须存在。可写入文件，或向本地服务发送：

```text
POST /api/agent-jobs/<jobId>/analysis
Content-Type: application/json
```

服务端会校验结构、时长、ID 和素材引用。成功回写后只回复“拆解已回写”，让用户回到页面确认分镜；不要在对话里另行制造一套确认流程。
