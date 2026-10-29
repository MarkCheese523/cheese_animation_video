#!/usr/bin/env python3
"""Validate project timing, scene registration, subtitles, and media paths."""
import argparse
import json
import re
import sys
from pathlib import Path

BUILTINS = {"counter", "flow", "compare", "reveal", "end"}


def timing_values(value):
    if isinstance(value, bool):
        return
    if isinstance(value, (int, float)):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from timing_values(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from timing_values(item)


def load_subtitles(path):
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    match = re.search(r"\bSUBTITLES\s*=\s*", text)
    if not match:
        raise ValueError("subs.js 中未找到 SUBTITLES 数组")
    value, _ = json.JSONDecoder().raw_decode(text[match.end():].lstrip())
    if not isinstance(value, list):
        raise ValueError("SUBTITLES 必须是数组")
    return value


def main():
    parser = argparse.ArgumentParser(description="校验 HTML 动画视频工程")
    parser.add_argument("--project", default=".", help="工程目录")
    args = parser.parse_args()
    root = Path(args.project).expanduser().resolve()
    errors, warnings = [], []
    try:
        project = json.loads((root / "project.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"FAIL 无法读取 project.json：{error}")
        return 1

    scenes = project.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes 必须是非空数组")
        scenes = []
    if not project.get("title"):
        errors.append("title 不能为空")
    if project.get("style", "cream-neon") not in {"cream-neon", "dark-narrative"}:
        errors.append("style 必须是 cream-neon 或 dark-narrative")
    for dimension in ("width", "height"):
        if not isinstance(project.get(dimension), (int, float)) or project[dimension] <= 0:
            errors.append(f"{dimension} 必须是正数")

    scene_source = (root / "scenes.js").read_text(encoding="utf-8") if (root / "scenes.js").exists() else ""
    identifiers, expected_start, total = set(), 0.0, 0.0
    for index, scene in enumerate(scenes):
        label = scene.get("id", f"#{index + 1}") if isinstance(scene, dict) else f"#{index + 1}"
        if not isinstance(scene, dict):
            errors.append(f"{label} 不是对象")
            continue
        scene_id = scene.get("id")
        if not isinstance(scene_id, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", scene_id):
            errors.append(f"{label} 的 id 只能使用小写字母、数字和连字符")
        elif scene_id in identifiers:
            errors.append(f"场景 id 重复：{scene_id}")
        else:
            identifiers.add(scene_id)
        scene_type = scene.get("type")
        registered = scene_type in BUILTINS or (
            isinstance(scene_type, str)
            and (re.search(rf"\b{re.escape(scene_type)}\s*:", scene_source)
                 or re.search(rf"SCENE_BUILDERS\.{re.escape(scene_type)}\s*=", scene_source))
        )
        if not registered:
            errors.append(f"{label} 的渲染器未注册：{scene_type}")
        start, duration = scene.get("start"), scene.get("duration")
        if not isinstance(start, (int, float)) or isinstance(start, bool) or start < 0:
            errors.append(f"{label} 的 start 必须是非负数")
            start = expected_start
        if not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0:
            errors.append(f"{label} 的 duration 必须是正数")
            duration = 0
        if abs(start - expected_start) > 0.0001:
            errors.append(f"{label} 起点 {start} 与预期 {expected_start:.6f} 不连续")
        expected_start = start + duration
        total = expected_start
        for value in timing_values(scene.get("timing", {})):
            if value < 0 or value >= duration * 1000:
                errors.append(f"{label} 的 timing {value} 超出 [0, {duration * 1000})")

    try:
        subtitles = load_subtitles(root / "subs.js")
        previous_start = -1
        for index, subtitle in enumerate(subtitles):
            start, end = subtitle.get("start"), subtitle.get("end")
            if not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or end <= start:
                errors.append(f"字幕 #{index + 1} 时间无效")
                continue
            if start < previous_start:
                errors.append(f"字幕 #{index + 1} 未按时间排序")
            if end > total * 1000 + 150:
                errors.append(f"字幕 #{index + 1} 超出全片总时长")
            if not subtitle.get("text"):
                warnings.append(f"字幕 #{index + 1} 文本为空")
            previous_start = start
    except (OSError, ValueError, json.JSONDecodeError) as error:
        errors.append(str(error))

    audio = project.get("audio", "")
    if audio:
        audio_path = root / audio
        if audio_path.is_absolute() or ".." in Path(audio).parts:
            errors.append("audio 必须是工程内的相对路径")
        elif not audio_path.is_file():
            errors.append(f"配音文件不存在：{audio}")
    else:
        warnings.append("未配置配音；当前为无声预览")

    for warning in warnings:
        print(f"WARN {warning}")
    for error in errors:
        print(f"FAIL {error}")
    if errors:
        print(f"校验失败：{len(errors)} 个错误")
        return 1
    print(f"PASS {len(scenes)} 个场景，总时长 {total:.3f} 秒")
    return 0


if __name__ == "__main__":
    sys.exit(main())
