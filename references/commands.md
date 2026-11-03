# 独立工程命令手册

> 在 `html-animation-video/` 根目录执行。默认工程位置为 `~/dev/html-animation-video/`，可用 `HTML_ANIMATION_VIDEO_ROOT` 指向其他副本。

## 启动与检查

```bash
npm run dev -- --host 127.0.0.1 --port 7100
# 打开 http://localhost:7100/

npm test
# JS 语法、首页、两段播放器、确认板、SVG MIME、MP3 Range 自测

npm run qa
# Chrome 实际渲染：两段 8 个关键帧＋母版确认板资产加载检查
```

## 资产重建

```bash
python tools/build-asset-masters.py
# 人物：无五官外轮廓＋坐标点阵
# 品牌：真实路径不变，路径内点阵填充；自动比较路径 d 数据
```

重建后必须重新展示母版确认板并取得用户确认。未确认前不得把资产标为 `locked`，也不得进入分镜。

## 两段代表样片

```text
/两段预览/player.html?scene=opening
/两段预览/player.html?scene=control
```

定格复查：

```text
/两段预览/player.html?scene=opening&t=8.5
/两段预览/player.html?scene=control&t=6.65
```

母版锁定后只能先制作两段代表样片。用户明确确认两段后，才能复制同一播放器与动效语言铺开其余段落。

## 网页与导出边界

- 所有阶段预览只交付网页；抽帧与 contact sheet 仅用于 QA。
- 参考确认、母版确认、两段样片确认均为独立闸门，普通“继续”不代替对应确认。
- 只有用户对最终完整网页版本明确说“确认导出／定稿导出”后，才允许执行导出。
- 当前工程不包含自动导出命令；获得最终导出授权后，先核对完整时间轴、音频路径和导出实现，再执行并抽帧复检。
