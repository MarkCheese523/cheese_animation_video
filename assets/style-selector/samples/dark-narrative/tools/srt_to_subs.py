#!/usr/bin/env python3
"""Convert an SRT file into the player's deterministic subs.js data."""
import argparse
import json
import re
from pathlib import Path

TIME = re.compile(
    r"(?P<h>\d{1,2}):(?P<m>\d{2}):(?P<s>\d{2})[,.](?P<ms>\d{1,3})"
)


def milliseconds(value):
    match = TIME.fullmatch(value.strip())
    if not match:
        raise ValueError(f"无效时间戳：{value}")
    parts = {key: int(number) for key, number in match.groupdict().items()}
    return ((parts["h"] * 60 + parts["m"]) * 60 + parts["s"]) * 1000 + parts["ms"]


def parse_srt(text):
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n").replace("\r", "\n").strip())
    subtitles = []
    for block in blocks:
        lines = [line.strip() for line in block.split("\n") if line.strip()]
        if lines and lines[0].isdigit():
            lines = lines[1:]
        if not lines:
            continue
        timing = next((line for line in lines if "-->" in line), None)
        if timing is None:
            raise ValueError(f"字幕块缺少时间轴：{block[:80]}")
        index = lines.index(timing)
        start_text, end_text = [part.strip() for part in timing.split("-->", 1)]
        end_text = end_text.split()[0]
        start, end = milliseconds(start_text), milliseconds(end_text)
        if end <= start:
            raise ValueError(f"字幕结束时间必须晚于开始时间：{timing}")
        content = " ".join(lines[index + 1:])
        content = re.sub(r"<[^>]+>", "", content).strip()
        if content:
            subtitles.append({"start": start, "end": end, "text": content})
    if not subtitles:
        raise ValueError("未解析到字幕")
    for previous, current in zip(subtitles, subtitles[1:]):
        if current["start"] < previous["start"]:
            raise ValueError("字幕必须按开始时间排序")
    return subtitles


def main():
    parser = argparse.ArgumentParser(description="将 SRT 转换为 subs.js")
    parser.add_argument("input", help="SRT 文件")
    parser.add_argument("--output", default="subs.js", help="输出文件，默认 ./subs.js")
    args = parser.parse_args()
    source = Path(args.input).expanduser()
    subtitles = parse_srt(source.read_text(encoding="utf-8-sig"))
    output = Path(args.output).expanduser()
    output.write_text(
        "const SUBTITLES = " + json.dumps(subtitles, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"已生成 {len(subtitles)} 条字幕：{output.resolve()}")


if __name__ == "__main__":
    main()
