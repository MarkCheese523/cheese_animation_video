# HTML Animation Video

可运行的 HTML/SVG 时间轴动画视频开发工程，也是 `html-animation-video` 技能的完整母本。根页面现为 Motion Layer 双轨设计台：输入脚本与方向后，依次经过「分镜确认 → 找图确认 → 重绘母版确认」三个独立页面，全部确认后才解锁可变时长的完整网页预览。原有《A社的F股》23 段完整网页版本仍保留在 `两段预览/`。

## 快速启动

```bash
npm run dev -- --host 127.0.0.1 --port 7100
```

打开 `http://localhost:7100/`。无需 npm 依赖安装。

Motion Layer 支持：

- 双轨整包输入：无产品风格探索，或公开网页 URL／截图的产品风格提取；脚本、SRT、配音、截图、录屏、画幅和补充说明在同一页面提交。
- Product Profile：色板、字体、圆角、组件与 `brandAssets` 品牌资产；真实产品素材仍需双确认。
- 真实 Agent 交接：页面保存 `job.json` 并生成当前对话交接提示；Agent 阅读整包后回写实际分镜与素材需求，不使用本地品牌名单、正则或预填分镜冒充 AI。
- 三个独立确认页：Agent 分镜确认、网上参考确认、重绘母版确认；修改上游内容会使下游确认失效。分镜确认后，页面按 Agent 返回的语义和检索词自动查找候选。
- 原版素材确认板与元素语义合并：重要名词、通用人物、真实品牌和其他素材来自同一次 Agent 拆解；普通名词每项最多 5 个 Iconify 联网候选＋1 个通用语义设计，可修正动作与检索词。
- 品牌与普通元素同页确认：Agent 自动返回 B 类品牌槽位，无需用户补品牌；候选仅采用产品真实资产、Simple Icons 可靠矢量或纯文字标识，参考加载失败会阻止确认，不使用近似几何猜画。
- 母版对照：并排展示已确认参考与风格化母版，支持墨色、强调色和反白变体；品牌母版保留原始路径、字形和比例，确认记录、Agent 任务 ID 与独立 SVG 资产写入分镜并供生成预览调用。
- 动作与状态：8 类目录动作、弹性进入，以及按钮、卡片、图标、光标、连接器和数字／标签状态。
- 可变时长组件级样片：当前播放器使用五个连续拍点，但标题、动作、时长和素材引用均由 Agent 按本期内容生成，可编辑后确认。

```bash
npm test                 # 语法、三项确认约束、Product Profile、页面与媒体自测
npm run validate:motion  # 校验 20 秒样片配置
npm run qa:motion        # 样片 25%／60%／85% 关键帧
npm run qa:studio        # 三个确认页、失效重确认、母版资产与样片浏览器验收
npm run qa               # 原全片 69 个关键帧与资产图像 QA
```

QA 需要本机 Python、Pillow 和 Google Chrome；资产重建另需 NumPy、SciPy：

```bash
python -m pip install -r requirements.txt
```

## 工程结构

```text
SKILL.md                  技能主规则与创作 SOP
references/               资产、设计、命令、回归与交付规范
index.html                Motion Layer 双轨设计台入口
studio/                   双轨配置、Product Profile 展示与元素候选
product-profile.mjs       公开网页风格提取与私有地址拦截
assets/template/
  player.js               确定性播放器与产品色板参数
  motion-presets.js       纯时间动作预设
  element-states.js       小元素状态与动作目录
  motion-sequence.js      20 秒五拍组件级样片
两段预览/
  player.js               统一时间轴、配音、字幕与定格播放器
  full-scenes.js          23 段绝对时间边界与场景调度
  redesign-assets.js      股权凭证、权利模块、实名点阵条带
  redesign-scenes.js      已确认的 04 与 13 设计基准
  premium-assets.js       机制、品牌、员工与代币资产变体
  premium-scenes.js       其余 19 段高质量场景
assets/
  candidates/             已搜集候选参考与来源
  library/                已确认并锁定的点阵母版及变体
  fonts/                  本地字体
  asset-manifest.json     资产状态、用途与权利记录
  vo-full.mp3             完整配音
素材确认板.html           第一道：参考确认示例
母版确认板.html           第二道：母版确认示例
分镜方案-v1.md            23 段分镜参考
tools/
  build-asset-masters.py  点阵母版重建与品牌路径一致性校验
  qa-master-board.py      母版图像加载与浏览器截图检查
  qa-full.py              全片 69 个关键帧与分组 contact sheet
  qa-redesign.py          04 与 13 基准样片回归检查
```

## 强制工作流

1. **分镜确认**：先确认脚本文义、五拍结构、主动作和时长，再进入素材环节。
2. **参考确认**：按已确认分镜联网找人物、品牌、物品等真实参考，展示候选并由用户明确确认。
3. **母版确认**：按确认参考制作风格化母版，展示对照并再次取得明确确认。
4. **两段样片确认**：锁定资产后只做两段代表网页样片，确认后才能铺开其余段落。
5. **最终导出确认**：阶段预览永远只用网页；只有用户对最终完整网页版本明确说“确认导出／定稿导出”才可导出。

普通“OK／继续”不代替当前闸门的明确确认。

## 点阵资产规则

- 人物只保留外轮廓，内部点阵由坐标或固定随机种子生成，不读取照片亮度、色彩或内部边缘，不显示五官。
- 品牌只在已确认真实矢量路径内做点阵填充与描边，不改路径、比例或字形；重建脚本会比较路径数据。
- 其他真实人物未确认肖像时使用实名点阵节点，不生成虚构头像。
- 禁止用星形、多边形、圆形等基础几何猜画品牌 Logo。

## 预览与定格

```text
/两段预览/player.html?scene=opening
/两段预览/player.html?scene=control
/两段预览/player.html?scene=opening&t=8.5
/两段预览/player.html?scene=control&t=6.65
```

`scene` 选择段落，`t` 以秒为单位定格，用于确定性 QA。所有动画均由时间轴计算，不依赖一次性 CSS 过渡。

## 新一期开发

复制整个工程，排除 `qa/`、`.git/`、旧 MP3 和导出文件；替换配音、`subs.js`、场景配置及资产。沿用播放器、开发服务器和 QA 工具，不另写并行引擎。详细规则以 `SKILL.md` 和 `references/` 为准。
