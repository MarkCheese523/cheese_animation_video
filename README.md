# HTML Animation Video Skill

将口播稿、配音和 SRT 字幕转化为可定格、可复用、可自动 QA 的 HTML/SVG 动画视频。

这是一个面向 Kimi 的技能包：它提供确定性时间轴播放器、通用场景渲染器、工程初始化脚本、字幕转换工具、配置校验和浏览器关键帧检查。新一期视频只需替换配置、字幕、配音和已确认素材，不必重新开发播放器。

## 能做什么

- 制作口播动画、知识短视频、产品演示和竖版 MG 视频。
- 用绝对时间轴驱动数字、进度、连接、对比和落版动画。
- 将 SRT 自动转换为播放器字幕数据。
- 校验场景连续性、字幕顺序、媒体路径和动画 cue。
- 用真实 Chrome 生成每段 25%、60%、85% 的关键帧与 contact sheet。
- 通过素材参考确认、母版确认和代表样片确认控制视觉质量。

> 本技能生成的是可交互网页动画和 QA 结果，不是文生视频模型。当前模板不包含开箱即用的 MP4 导出器。

## 内置场景

| 类型 | 用途 |
|---|---|
| `counter` | 数字增长、比例变化、越过阈值 |
| `flow` | 流程、因果链、资源流和机制连接 |
| `compare` | 前后对比、双方差异、两组数据 |
| `reveal` | 关键词和少量并列信息逐步出现 |
| `end` | 结论、金句和收尾落版 |

所有场景均由 `render(t)` 确定性渲染，任意跳转到同一时刻都会得到相同画面。

## 安装

### 安装为项目级技能

在你的项目根目录执行：

```bash
mkdir -p .agents/skills
git clone https://github.com/MarkCheese523/html-animation-video.git .agents/skills/html-animation-video
```

重新打开会话，让客户端重新扫描技能。

### 导入 `.skill` 文件

如果客户端支持技能导入，可以将仓库压缩为 `.skill` 文件后导入。`.skill` 本质上是 ZIP 压缩包，压缩时必须保留顶层 `html-animation-video/` 目录：

```bash
zip -r html-animation-video.skill html-animation-video \
  -x "*/.git/*" "*/__pycache__/*" "*/.DS_Store"
```

正确结构：

```text
html-animation-video/
├── SKILL.md
├── README.md
├── references/
├── scripts/
└── assets/template/
```

## 环境要求

- Python 3
- Node.js 18 或更高版本
- Chrome：用于浏览器关键帧 QA
- Pillow：用于图片检查与 contact sheet

```bash
python -m pip install Pillow
```

播放器模板没有 npm 第三方依赖，不需要执行 `npm install`。

## 快速开始

### 1. 初始化一期视频

进入技能目录：

```bash
cd .agents/skills/html-animation-video
python scripts/init_project.py /完整路径/my-video --title "我的第一期视频"
```

目标目录必须为空或不存在，脚本不会覆盖已有项目。

### 2. 准备字幕与配音

```bash
cd /完整路径/my-video
python tools/srt_to_subs.py /完整路径/voice.srt
```

将配音放到 `assets/voice.mp3`，并在 `project.json` 中设置：

```json
"audio": "assets/voice.mp3"
```

没有配音时将 `audio` 留空，可进行无声预览，但不要伪造精确音画对轴。

### 3. 配置场景

编辑 `project.json`：

```json
{
  "title": "我的第一期视频",
  "width": 1080,
  "height": 1920,
  "audio": "assets/voice.mp3",
  "scenes": [
    {
      "id": "opening",
      "type": "counter",
      "start": 0,
      "duration": 6,
      "props": {
        "label": "控制权变化",
        "from": 49.8,
        "to": 50.1,
        "suffix": "%",
        "caption": "越过控制线"
      },
      "timing": {
        "value": 600,
        "caption": 3200
      }
    }
  ]
}
```

时间单位：

- `start`、`duration`：秒。
- `timing`：相对当前场景的毫秒。
- 下一场景的 `start` 必须等于前一场景的 `start + duration`。
- 每个 `timing` 必须小于当前场景的 `duration × 1000`。

完整配置见 [`references/page-types.md`](references/page-types.md)。

### 4. 校验与预览

```bash
npm test
npm run validate
npm run dev -- --host 127.0.0.1 --port 7100
```

打开：

```text
http://127.0.0.1:7100/
```

常用定格地址：

```text
/player.html?scene=all&t=3.2&export=1
/player.html?scene=opening&t=1.5&export=1
```

`export=1` 会隐藏控制条，仅用于定格检查和后续导出，不代表已经导出 MP4。

### 5. 运行关键帧 QA

```bash
npm run qa
```

只检查部分场景：

```bash
python tools/qa_frames.py --only opening,mechanism
```

结果写入本期工程的 `qa/`，包括关键帧、`frames.json` 和 contact sheet。自动检查后仍需人工查看裁切、叠字、字幕碰撞、字体回退和动作可读性。

## 推荐制作流程

1. 将口播拆成逐句画面计划，每段先确定一个可见动作。
2. 搜集人物、品牌、物品等候选参考，并取得用户确认。
3. 制作风格化母版，再次确认后锁定资产。
4. 确定色板、字体、素材语言和动效性格。
5. 先制作视觉开场与核心机制两段网页样片。
6. 样片确认后铺开全片，并完成音画对轴。
7. 运行配置校验、浏览器抽帧和人工回归。
8. 只有用户明确确认最终导出后，才进入 MP4 导出与复检。

详细规则见 [`SKILL.md`](SKILL.md) 和 [`references/qa-delivery.md`](references/qa-delivery.md)。

## 新增场景渲染器

在 `scenes.js` 的 `SCENE_BUILDERS` 中注册：

```js
SCENE_BUILDERS.myAction = (scene, api) => {
  const node = api.el('circle', { cx: 540, cy: 900, r: 80 });
  return t => {
    const p = api.prog(t, 0, 1.2);
    node.setAttribute('r', api.mix(20, 180, api.out(p)));
  };
};
```

渲染器必须遵守：

- 返回纯 `render(t)`，不依赖实时时钟。
- 连续量直接写 SVG/CSS 属性，不只依赖 CSS transition。
- 随机粒子使用固定种子。
- 预览、定格和导出共用同一个渲染函数。
- 新渲染器完成后补充文档和关键帧测试。

## 仓库结构

```text
├── SKILL.md                  # 技能触发描述与完整工作流
├── references/               # 场景、素材、设计、命令与 QA 规范
├── scripts/
│   ├── init_project.py       # 初始化本期工程
│   ├── srt_to_subs.py        # SRT 转字幕数据
│   ├── validate_project.py   # 配置与时间轴校验
│   └── qa_frames.py          # Chrome 关键帧与 contact sheet
└── assets/template/          # 无单期内容的通用播放器模板
```

## MP4 导出边界

仓库当前提供网页播放器、确定性定格和 QA，不附带自动 MP4 导出命令。获得最终导出授权后，可基于：

```text
/player.html?scene=all&t=<秒>&export=1
```

逐帧采集，再使用 ffmpeg 合成帧序列与音频。导出后仍需检查分辨率、帧率、总时长、音轨、场景接缝和首中尾帧。
