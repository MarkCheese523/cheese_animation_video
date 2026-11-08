# 通用工程命令手册

> 在 `html-animation-video/` 根目录执行。默认工程位置为 `~/dev/html-animation-video/`，可用 `HTML_ANIMATION_VIDEO_ROOT` 指向其他副本。

## 启动与检查

```bash
npm run dev -- --host 127.0.0.1 --port 7100
# 打开 http://localhost:7100/

npm test
# JS 语法、Agent 工作流、三次确认约束、通用页面、SVG MIME 与 Range 自测

npm run validate:motion
# 校验通用播放器配置

npm run qa:studio
# 浏览器验收整包交接、三次确认、母版与完整预览
```

## 通用模板

模板位于 `assets/template/`，包含播放器、场景、字幕、动作预设和项目配置。新一期通过初始化脚本复制模板，不从具体视频案例复制内容。

```bash
python scripts/init_project.py --help
python scripts/srt_to_subs.py --help
python scripts/validate_project.py --project assets/template
python scripts/qa_frames.py --project assets/template
```

模板定格复查：

```text
/assets/template/player.html?scene=motion-study&t=10
/assets/template/player.html?scene=all
```

## 制作与导出边界

- 所有阶段预览只交付网页；抽帧与 contact sheet 仅用于 QA。
- 分镜、参考、母版确认均为独立闸门，普通“继续”不代替对应确认。
- 母版锁定后只能先制作两段代表样片。用户明确确认两段后，才能沿用同一播放器与动效语言制作全片。
- 只有用户对最终完整网页版本明确说“确认导出／定稿导出”后，才允许执行导出。
- 当前工程不包含自动导出命令；获得最终导出授权后，先核对完整时间轴、音频路径和导出实现，再执行并抽帧复检。
