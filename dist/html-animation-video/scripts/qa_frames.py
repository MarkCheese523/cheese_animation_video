#!/usr/bin/env python3
"""Render deterministic browser keyframes and build contact sheets."""
import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageStat


def find_chrome(explicit=None):
    candidates = [explicit, os.environ.get("CHROME_PATH")]
    if sys.platform == "darwin":
        candidates.append("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    candidates.extend(("google-chrome", "chromium", "chromium-browser", "chrome"))
    for candidate in candidates:
        if not candidate:
            continue
        resolved = shutil.which(candidate) or (candidate if Path(candidate).is_file() else None)
        if resolved:
            return str(resolved)
    raise RuntimeError("未找到 Chrome；请用 --chrome 或 CHROME_PATH 指定")


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_server(url, process):
    deadline = time.time() + 15
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError("预览服务器提前退出")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("预览服务器未能及时启动")


def main():
    parser = argparse.ArgumentParser(description="生成浏览器关键帧和 contact sheet")
    parser.add_argument("--project", default=".", help="工程目录")
    parser.add_argument("--only", help="只检查指定场景，逗号分隔")
    parser.add_argument("--port", type=int, help="预览端口，默认自动选择")
    parser.add_argument("--chrome", help="Chrome 可执行文件")
    args = parser.parse_args()

    root = Path(args.project).expanduser().resolve()
    project = json.loads((root / "project.json").read_text(encoding="utf-8"))
    selected = set(args.only.split(",")) if args.only else None
    scenes = [scene for scene in project["scenes"] if not selected or scene["id"] in selected]
    if not scenes:
        raise RuntimeError("没有匹配的场景")
    chrome = find_chrome(args.chrome)
    port = args.port or free_port()
    base = f"http://127.0.0.1:{port}"
    qa = root / "qa"
    profile = qa / "chrome-profile"
    qa.mkdir(exist_ok=True)
    server = None
    try:
        server = subprocess.Popen(
            ["node", "dev-server.mjs", "--host", "127.0.0.1", "--port", str(port)],
            cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        wait_for_server(base + "/", server)
        common = [
            chrome, "--headless=new", "--disable-gpu", "--no-first-run",
            f"--user-data-dir={profile}", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--virtual-time-budget=2500",
        ]
        probe = subprocess.run(
            common + ["--dump-dom", base + "/player.html?scene=all&t=0&export=1"],
            cwd=root, capture_output=True, text=True, timeout=45,
        )
        if probe.returncode or "data-player-error" in probe.stdout:
            raise RuntimeError("播放器初始化失败或页面存在脚本错误")

        records = []
        for scene in scenes:
            for fraction in (0.25, 0.60, 0.85):
                moment = scene["start"] + scene["duration"] * fraction
                name = f"{scene['id']}-{int(fraction * 100):02d}.png"
                output = qa / name
                target = base + f"/player.html?scene=all&t={moment:.3f}&export=1"
                subprocess.run(
                    common + ["--window-size=1080,1920", f"--screenshot={output}", target],
                    cwd=root, check=True, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, timeout=45,
                )
                with Image.open(output) as image:
                    if image.size != (1080, 1920):
                        raise RuntimeError(f"{name} 分辨率错误：{image.size}")
                    if ImageStat.Stat(image.convert("L")).stddev[0] < 1:
                        raise RuntimeError(f"{name} 疑似空白帧")
                records.append({"id": scene["id"], "fraction": fraction, "time": moment, "file": name})
                print(f"PASS {scene['id']} {int(fraction * 100)}% {moment:.3f}s", flush=True)

        (qa / "frames.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
        sheet_paths = []
        for group_start in range(0, len(records), 18):
            group = records[group_start:group_start + 18]
            rows = (len(group) + 5) // 6
            sheet = Image.new("RGB", (1200, rows * 360 + 16), "#101a16")
            draw = ImageDraw.Draw(sheet)
            for index, record in enumerate(group):
                with Image.open(qa / record["file"]) as source:
                    image = source.convert("RGB")
                    image.thumbnail((190, 320), Image.Resampling.LANCZOS)
                column, row = index % 6, index // 6
                x = column * 200 + (200 - image.width) // 2
                y = row * 360 + 32
                sheet.paste(image, (x, y))
                label = f"{record['id']} {int(record['fraction'] * 100)}% {record['time']:.1f}s"
                draw.text((column * 200 + 8, row * 360 + 10), label, fill="#c6ff3d")
            sheet_path = qa / f"contact-sheet-{group_start // 18 + 1}.jpg"
            sheet.save(sheet_path, quality=92, optimize=True)
            sheet_paths.append(sheet_path)
        print(f"PASS 已生成 {len(records)} 个关键帧")
        for path in sheet_paths:
            print(path)
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)
        if profile.exists():
            shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
