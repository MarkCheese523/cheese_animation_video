# 二次开发贡献指南

感谢参与 Cheese Animation Video。统一采用 **Fork → 功能分支 → 本地验证 → Pull Request → 合并发布**，不要直接向 `main` 推送开发提交。

## 1. Fork 与克隆

先在 GitHub Fork 本仓库，然后克隆自己的 Fork：

```bash
git clone https://github.com/<你的账号>/cheese_animation_video.git
cd cheese_animation_video
```

关联上游仓库：

```bash
git remote add upstream https://github.com/MarkCheese523/cheese_animation_video.git
git fetch upstream
```

已有原仓库写权限的协作者可以直接克隆原仓库，但仍需通过功能分支和 PR 开发。

## 2. 创建功能分支

```bash
git switch -c feat/my-feature upstream/main
```

分支命名：

- `feat/...`：新场景或新能力。
- `fix/...`：问题修复。
- `docs/...`：文档修改。
- `refactor/...`：不改变外部行为的重构。

一个分支只处理一件事，避免把场景开发、引擎重构和无关格式调整放进同一个 PR。

## 3. 准备环境

要求 Python 3、Node.js 18+、Chrome 和 Pillow：

```bash
python -m pip install Pillow
python scripts/validate_project.py --project assets/template
npm --prefix assets/template test
```

模板没有 npm 第三方依赖，不需要 `npm install`。原始测试通过后再修改代码。

## 4. 确定修改边界

| 需求 | 修改位置 |
|---|---|
| 新增或修改场景 | `assets/template/scenes.js` |
| 播放器、定格或字幕逻辑 | `assets/template/player.js` |
| 通用视觉样式 | `assets/template/player.css` |
| 场景配置说明 | `references/page-types.md` |
| 素材、设计或交付规范 | `references/` |
| 初始化、SRT、校验或 QA 工具 | `scripts/` |
| 技能触发与标准工作流 | `SKILL.md` |
| 安装和使用说明 | `README.md` |

禁止提交真实人物、品牌、配音、单期分镜、测试工程、QA 图片、导出视频、密钥或本机路径。不要把单期文案写进通用引擎，也不要为一期视频复制一套播放器。

## 5. 建立独立测试工程

在仓库外初始化：

```bash
python scripts/init_project.py /完整路径/html-video-test --title "二次开发测试"
cd /完整路径/html-video-test
npm test
npm run validate
```

修改字幕工具时加入 SRT 测试：

```bash
python tools/srt_to_subs.py /完整路径/test.srt
npm run validate
```

修改场景、样式或播放器时运行真实浏览器 QA：

```bash
npm run qa
```

关键帧与 contact sheet 仅用于本地检查，不提交到技能仓库。

## 6. 按改动类型回归

### 新增场景

- 在 `SCENE_BUILDERS` 注册渲染器。
- 返回确定性 `render(t)`，不依赖实时时钟或无种子随机数。
- 在 `references/page-types.md` 增加配置说明。
- 在测试 `project.json` 中覆盖该场景及复用实例。
- 检查入场、中段、结束和任意时间跳转。
- 验证预览与 `export=1` 使用同一渲染路径。

### 修改播放器或共享样式

```bash
npm --prefix assets/template test
```

并在测试工程运行 `npm run qa`，检查场景接缝、字幕碰撞、共享样式污染、字体、素材加载和导出 UI 隔离。

### 修改 Python 工具

```bash
python -m py_compile scripts/*.py
```

同时测试正常与异常输入。异常输入必须有清晰错误，不得覆盖非空目录或已有文件。

## 7. 同步文档

代码和文档在同一个 PR 更新：

- 新安装参数或使用方式：`README.md`。
- 标准流程变化：`SKILL.md`。
- 新场景或字段：`references/page-types.md`。
- 新命令：`references/commands.md`。
- 新回归要求：`references/regression-qa.md`。

配置不兼容旧版本时，必须提供迁移说明。

## 8. 提交与推送

```bash
git status
git diff
git add .
git commit -m "feat: add my scene renderer"
git push origin feat/my-feature
```

提交前排除 `qa/`、`frames/`、`__pycache__/`、`.DS_Store`、配音、录屏和测试生成工程。

## 9. 发起 Pull Request

```text
base repository：MarkCheese523/cheese_animation_video
base：main
head repository：<你的账号>/cheese_animation_video
compare：feat/my-feature
```

按 PR 模板填写改动目的、范围、配置兼容性、测试命令、视觉验证和文档更新。不要只写“已测试”，要列出实际命令和结果。

## 10. 评审与合并

合并前确认：

- 原始模板测试和对应级别回归通过。
- 新能力有实际测试工程验证。
- 时间轴确定、可定格，配置与引擎分离。
- 没有单期内容、敏感信息或无关文件。
- README 与 references 已同步。
- PR 只包含本次相关改动。

维护者使用 **Squash and merge**，合并后删除功能分支。

## 11. 发布

维护者合并后统一执行完整测试、打包 `.skill`、创建 Tag 和 GitHub Release，并在 Release Notes 写明新能力、修复、测试结果和迁移要求。使用者从 Release 获取稳定技能包，开发者从 `main` 获取最新代码。
