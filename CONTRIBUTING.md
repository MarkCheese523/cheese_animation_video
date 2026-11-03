# 贡献开发指南

感谢你参与 `html-animation-video` 的开发。本指南适用于新功能、问题修复、模板改进、测试和文档贡献。

## 一、协作硬规则

1. **禁止直接向 `main` 推送提交。** 即使账号拥有写权限，也不能执行 `git push origin main`、`git push upstream main` 或等效操作。
2. **禁止强制推送、删除或重建 `main`。**
3. 所有改动必须通过独立分支和 Pull Request 提交。
4. **只有仓库主 `MarkCheese523` 可以合并 PR 到 `main`。** 其他贡献者即使看到 Merge 按钮，也不能点击合并。
5. 不把具体视频案例、客户素材、配音、运行期任务、导出视频、密钥或大体积构建产物提交到通用仓库。
6. 不绕过现有 Agent 工作流、素材确认和样片确认闸门，不新增并行引擎替代通用模板。

## 二、开发前准备

### 环境要求

- Git。
- Node.js 与 npm；项目运行不需要安装 npm 依赖。
- Python 3；图像 QA 需要 Pillow。
- Google Chrome；设计台浏览器 QA 需要。
- 可选：GitHub CLI `gh`，用于登录和查看 PR。

```bash
node --version
npm --version
python --version
git --version
```

图像 QA 环境：

```bash
python -m pip install -r requirements.txt
```

### 先了解项目

开始修改前，至少阅读：

- `README.md`：项目能力、启动方式和工程结构。
- `SKILL.md`：视频制作与交付规则。
- `references/agent-workflow.md`：Agent 任务与回写契约。
- `references/asset-pipeline.md`：素材检索、参考确认和母版确认流程。
- `references/regression-qa.md`：回归检查要求。

## 三、获取代码

推荐使用 Fork 工作流。以下示例中的 `YOUR_NAME` 替换为你的 GitHub 用户名。

1. 在 GitHub 打开 `MarkCheese523/cheese_animation_video`，点击 **Fork**。
2. 克隆自己的 Fork：

```bash
git clone https://github.com/YOUR_NAME/cheese_animation_video.git
cd cheese_animation_video
```

3. 添加上游仓库：

```bash
git remote add upstream https://github.com/MarkCheese523/cheese_animation_video.git
git remote -v
```

预期关系：

- `origin`：你的 Fork，只用于推送个人开发分支。
- `upstream`：官方仓库，只用于获取更新和提交 PR 的目标。

不要向任何远程的 `main` 推送。

## 四、同步主线并创建开发分支

每次开始新任务前，都基于最新 `upstream/main` 创建分支：

```bash
git fetch upstream
git switch -c feat/short-description upstream/main
```

分支前缀：

| 类型 | 前缀 | 示例 |
|---|---|---|
| 新功能 | `feat/` | `feat/asset-filter` |
| 问题修复 | `fix/` | `fix/master-preview` |
| 文档 | `docs/` | `docs/contributing-guide` |
| 重构 | `refactor/` | `refactor/storyboard-state` |
| 测试 | `test/` | `test/production-flow` |
| 维护 | `chore/` | `chore/gitignore` |

一个分支只处理一个独立目标。不要在同一分支混入无关重构、案例文件或格式化修改。

## 五、本地开发

启动设计台：

```bash
npm run dev -- --host 127.0.0.1 --port 7100
```

打开 `http://localhost:7100/`。完成调试后，在终端按 `Ctrl+C` 停止开发服务器，不要让临时进程持续占用端口。

### 代码与目录约定

- 通用设计台位于 `studio/`。
- 通用播放器和演示数据位于 `assets/template/`。
- Agent 分镜与素材任务契约位于 `agent-flow.mjs`。
- 母版、样片与全片任务契约位于 `production-flow.mjs`。
- 自动化测试位于 `scripts/`。
- 规则与流程文档位于 `references/`。
- 运行期内容写入已被 `.gitignore` 排除的任务和生成目录，不进入提交。

### 修改原则

- 优先复用现有数据结构、播放器、任务契约和 QA 工具。
- 保持动画由确定性时间轴驱动，不用一次性 CSS 过渡代替成片时间轴。
- 不用固定词表、预填品牌或本地伪分析冒充 Agent 的真实语义拆解。
- 不用 CSS、基础几何或 emoji 猜画真实品牌与人物。
- 未回写真实 SVG／PNG 母版时，不允许把母版标记为已生成或可确认。
- 修改上游分镜、参考或母版时，必须保留下游确认失效逻辑。
- 网页界面改动应保持响应式布局，并检查实际浏览器效果。
- 不提交密钥、令牌、私有素材、个人路径或本地环境配置。

## 六、提交前验证

### 所有代码改动

```bash
npm test
git diff --check
```

`npm test` 覆盖 JavaScript 语法、Agent 工作流、制作流程、Product Profile、分镜约束、通用页面、SVG MIME 和二进制 Range 自测。

### 修改通用模板或播放器

```bash
npm run validate:motion
npm run qa:motion
```

同时检查相关场景的关键帧，确认字幕、素材和动画状态没有异常。

### 修改设计台或 Agent 交接界面

```bash
npm run qa:studio
```

必须确认整包交接、Agent 分镜与素材、三次确认、母版和完整预览全部通过。视觉改动还应在 PR 中附上前后截图或关键帧。

### 文档改动

至少检查：

```bash
git diff --check
git diff -- README.md CONTRIBUTING.md references/
```

确认命令可执行、路径存在、没有失效引用。如果文档描述了新的代码行为，还应执行对应测试。

任何测试失败时，先修复再提交 PR；不要以“本地没跑”代替验证结果。

## 七、提交改动

先检查实际改动：

```bash
git status --short
git diff
```

只暂存本任务需要的文件，避免直接使用不加区分的批量暂存：

```bash
git add path/to/file
```

再次检查暂存内容：

```bash
git diff --cached --check
git diff --cached --stat
git status --short
```

提交信息使用简短前缀，清楚说明结果：

```text
feat: 增加素材候选筛选
fix: 修复母版回写后的确认状态
docs: 完善贡献开发流程
test: 覆盖样片任务异常状态
```

提交示例：

```bash
git commit -m "feat: 增加素材候选筛选"
```

一个 PR 可以包含多个小提交，但每个提交应保持可理解、可检查，不混入生成产物。

## 八、推送开发分支并创建 PR

只推送当前功能分支到自己的 Fork：

```bash
git branch --show-current
git push -u origin feat/short-description
```

确认输出中的分支名不是 `main`。禁止以下操作：

```text
git push origin main
git push upstream main
git push --force origin main
git push origin --delete main
```

然后在 GitHub 创建 Pull Request：

- Base repository：`MarkCheese523/cheese_animation_video`
- Base branch：`main`
- Head repository：你的 Fork
- Compare branch：当前开发分支

PR 正文必须包含：

```markdown
## 改动目标
说明解决了什么问题，为什么这样改。

## 主要改动
- 改动一
- 改动二

## 验证结果
- `npm test`：通过
- 其他实际执行过的检查：通过
- 未执行的检查及原因（如有）

## 界面或关键帧证据
界面和视觉改动附截图；纯文档改动可写“无”。

## 风险与回滚
说明受影响流程、兼容性注意事项和必要的回滚方式。
```

不要虚构测试结果、截图、任务 ID 或功能完成状态。

## 九、评审与修改

1. 等待仓库主评审，不自行合并。
2. 根据评审意见在当前分支继续修改。
3. 修改后重新执行相关测试。
4. 提交并推送同一个开发分支，PR 会自动更新：

```bash
git add path/to/file
git commit -m "fix: 处理评审提出的边界状态"
git push origin feat/short-description
```

如果官方 `main` 已更新并产生冲突：

```bash
git fetch upstream
git merge upstream/main
# 解决冲突，重新运行测试
git push origin feat/short-description
```

不要为了“保持干净”而强制推送别人的分支。确需改写自己的分支历史时，只能使用 `--force-with-lease`，且目标绝不能是 `main`。

## 十、合并权限与合并后清理

**只有仓库主可以执行最终合并。** 贡献者完成 PR 后即停止在该分支上追加无关改动，等待仓库主处理。

仓库主合并后，贡献者同步本地环境：

```bash
git switch main
git fetch upstream
git pull --ff-only upstream main
git branch -d feat/short-description
git push origin --delete feat/short-description
```

这里的本地 `main` 只用于读取和继续基于上游开发，仍然不能向任何远程 `main` 推送。

## 十一、PR 完成定义

提交前逐项确认：

- [ ] 分支基于最新 `upstream/main`，且不是直接在 `main` 上开发。
- [ ] 改动只服务一个明确目标，没有无关文件。
- [ ] 没有具体案例、客户素材、配音、任务产物、密钥或构建压缩包。
- [ ] 已执行与改动范围匹配的测试，结果真实通过。
- [ ] 界面或视觉改动已进行浏览器检查，并准备必要截图。
- [ ] 文档、命令和文件引用与当前实现一致。
- [ ] PR 已说明改动、验证结果、风险与回滚。
- [ ] 没有向 `main` 推送，也不会自行合并 PR。

## 十二、仓库主的 `main` 保护建议

以下设置仅由仓库主在 GitHub 仓库设置中维护：

- 为 `main` 启用分支保护。
- 要求通过 Pull Request 合并。
- 禁止强制推送和删除分支。
- 按需启用状态检查，要求 `npm test` 与关键 QA 通过。
- 将最终审核与合并权限保留给仓库主。

即使分支保护尚未生效，本指南中的禁止直推和禁止自行合并规则仍然有效。
