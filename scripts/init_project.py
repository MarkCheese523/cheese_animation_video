#!/usr/bin/env python3
"""Initialize a clean episode project from the bundled template."""
import argparse
import json
import shutil
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = SKILL_ROOT / "assets" / "template"
TOOLS = ("srt_to_subs.py", "validate_project.py", "qa_frames.py")


def main():
    parser = argparse.ArgumentParser(description="初始化 HTML 动画视频工程")
    parser.add_argument("target", help="目标目录；必须为空或不存在")
    parser.add_argument("--title", default="HTML 动画视频", help="本期标题")
    parser.add_argument(
        "--style", default="cream-neon", choices=("cream-neon", "dark-narrative"),
        help="视觉风格：cream-neon 奶油荧绿，dark-narrative 深色叙事",
    )
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    if target.exists() and not target.is_dir():
        parser.error(f"目标不是目录：{target}")
    if target.exists() and any(target.iterdir()):
        parser.error(f"目标目录非空，拒绝覆盖：{target}")
    if not TEMPLATE.is_dir():
        parser.error(f"模板缺失：{TEMPLATE}")

    shutil.copytree(TEMPLATE, target, dirs_exist_ok=True)
    tools = target / "tools"
    tools.mkdir(exist_ok=True)
    for name in TOOLS:
        shutil.copy2(SKILL_ROOT / "scripts" / name, tools / name)

    project_file = target / "project.json"
    project = json.loads(project_file.read_text(encoding="utf-8"))
    project["title"] = args.title
    project["style"] = args.style
    project_file.write_text(json.dumps(project, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"已初始化：{target}")
    print("下一步：替换 project.json、配音和 SRT，然后运行 npm test。")


if __name__ == "__main__":
    main()
