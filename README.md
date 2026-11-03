# HTML Animation Video

通用 HTML/SVG 时间轴动画视频工程，也是 `html-animation-video` 技能的开发母本。根页面为 Motion Layer 双轨设计台：输入脚本与方向后，依次经过「分镜确认 → 找图确认 → 重绘母版确认」三个独立页面，全部确认后进入两段代表样片和完整网页预览。

本仓库只保留通用代码、模板、测试与规范，不包含具体视频案例的脚本、配音、素材、确认板或预览产物。

## 快速启动

```bash
npm run dev -- --host 127.0.0.1 --port 7100
```

打开 `http://localhost:7100/`。无需 npm 依赖安装。

Motion Layer 支持：

- 双轨整包输入：无产品风格探索，或公开网页 URL／截图的产品风格提取；脚本、SRT、配音、截图、录屏、画幅和补充说明在同一页面提交。
- Product Profile：色板、字体、圆角、组件与 `brandAssets` 品牌资产；真实产品素材仍需确认。
- 真实 Agent 交接：页面保存 `job.json` 并生成交接提示；Agent 阅读整包后回写实际分镜与素材需求，不使用本地品牌名单、正则或预填分镜冒充 AI。
- 三个独立确认页：Agent 分镜确认、网上参考确认、重绘母版确认；修改上游内容会使下游确认失效。
- 素材与元素语义合并：重要名词、通用人物、真实品牌和其他素材来自同一次 Agent 拆解；普通名词可展示 Iconify 联网候选与通用语义设计，并支持修正动作与检索词。
- 品牌与普通元素同页确认：Agent 自动返回品牌槽位，无需用户预先补品牌；候选仅采用产品真实资产、可靠矢量或纯文字标识。
- Agent 母版交接：并排展示已确认参考与 Agent 回写的真实风格化母版；未回写独立 SVG／PNG 前不能确认。
- 两段真实样片与全片交接：复用已确认分镜、参考、母版和动效语言，阶段交付均为网页，不自动导出 MP4。

## 检查与 QA

```bash
npm test                 # 语法、Agent 工作流、确认约束、通用页面与二进制自测
npm run validate:motion  # 校验通用样片配置
npm run qa:motion        # 通用样片关键帧检查
npm run qa:studio        # 整包交接、三次确认、母版和完整预览浏览器验收
```

浏览器 QA 需要本机 Google Chrome；图像 QA 需要 Python 与 Pillow：

```bash
python -m pip install -r requirements.txt
```

## 工程结构

```text
SKILL.md                  技能主规则与创作 SOP
references/               Agent、资产、设计、命令、回归与交付规范
index.html                Motion Layer 双轨设计台入口
studio/                   双轨配置、素材候选、母版与制作交接界面
agent-flow.mjs            分镜与素材 Agent 任务契约
production-flow.mjs       母版、样片与全片 Agent 任务契约
asset-research.mjs        联网素材候选检索
asset-board.js            通用语义素材绘制
product-profile.mjs       公开网页风格提取与私有地址拦截
storyboard.mjs            分镜配置与确认状态
assets/template/          通用播放器、场景、字幕、动作与项目模板
assets/fonts/             通用本地字体
scripts/                  初始化、字幕、校验、单元测试与浏览器 QA
```

运行期任务、生成结果和案例资产不进入通用仓库，相关目录见 `.gitignore`。

## 强制工作流

1. **分镜确认**：Agent 按输入整包拆解脚本文义、拍点、主动作和素材需求，用户确认后进入素材环节。
2. **参考确认**：按已确认分镜联网找人物、品牌、物品等真实参考，展示候选并由用户明确确认。
3. **母版确认**：Agent 按确认参考制作真实风格化母版，展示对照并再次取得明确确认。
4. **两段样片确认**：锁定资产后只做两段代表网页样片，确认后才能制作其余段落。
5. **最终导出确认**：阶段预览永远只用网页；只有用户对最终完整网页版本明确说“确认导出／定稿导出”才可导出。

普通“OK／继续”不代替当前闸门的明确确认。

## 通用模板预览

```text
/assets/template/player.html?scene=motion-study&t=10
/assets/template/player.html?scene=all
/studio/demo/player.html?scene=all
```

`scene` 选择段落，`t` 以秒为单位定格，用于确定性 QA。所有动画均由时间轴计算，不依赖一次性 CSS 过渡。

## 新一期开发

使用 `scripts/init_project.py` 从 `assets/template/` 创建独立项目，替换本期配音、字幕、场景配置及资产。沿用通用播放器、开发服务器和 QA 工具，不从具体案例复制内容，不另写并行引擎。详细规则以 `SKILL.md` 和 `references/` 为准。

## 开源协议

本项目采用 [MIT License](LICENSE)。使用、修改和分发时请保留版权与协议声明；软件按“原样”提供，不附带明示或默示担保。
