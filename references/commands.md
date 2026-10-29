# 命令手册

以下命令在技能目录或本期工程目录执行，注意区分。

## 初始化工程

在技能目录：

```bash
python scripts/init_project.py /absolute/path/to/episode --title "本期标题" --style cream-neon
python scripts/init_project.py /absolute/path/to/episode-dark --title "深色版" --style dark-narrative
```

`--style` 可选 `cream-neon`（奶油×荧绿）或 `dark-narrative`（深色插画叙事），默认 `cream-neon`。新一期需求收集时应让用户明确选择，不要代替用户决定。

目标目录必须为空或不存在。脚本复制通用模板，并安装 `tools/` 下的字幕、校验与 QA 脚本。

## 本期检查与预览

在本期工程目录：

```bash
python tools/srt_to_subs.py /absolute/path/to/voice.srt
npm test
npm run validate
npm run dev -- --host 127.0.0.1 --port 7100
```

打开：

```text
http://127.0.0.1:7100/
http://127.0.0.1:7100/player.html?scene=all
http://127.0.0.1:7100/player.html?scene=opening
http://127.0.0.1:7100/player.html?scene=all&t=3.2&export=1
```

- `scene` 选择场景 ID 或 `all`。
- 单场景模式下 `t` 为相对本段秒数；`all` 模式下为全片绝对秒数。
- `export=1` 隐藏控制条并让画布铺满视口，只用于定格和导出。

## 关键帧 QA

```bash
npm run qa
python tools/qa_frames.py --only opening,mechanism
```

依赖 Node.js、Chrome 和 Pillow。可用 `CHROME_PATH` 指定 Chrome 可执行文件，用 `--port` 指定服务端口。结果写入本期 `qa/`，不要写进技能模板。

## 导出边界

模板只提供网页播放器、确定性定格与 QA，不附带虚假的导出命令。取得最终导出授权后：

1. 核对 `project.json` 总时长、音频路径与画幅。
2. 使用 `/player.html?scene=all&t=<秒>&export=1` 逐帧采集。
3. 用 ffmpeg 合成帧序列与音频，确保输入映射正确。
4. 检查成片时长、分辨率、音轨、首中尾帧和场景接缝。

阶段样片、风格确认和修改复查不导出 MP4。
