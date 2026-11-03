from pathlib import Path
import argparse
import json
import shutil
import subprocess
import time
import urllib.request
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa' / 'full'
PROFILE = ROOT / 'qa' / 'chrome-full'
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
PORT = 7183
BASE = f'http://127.0.0.1:{PORT}/'
SCENES = [
    ('01', 0, 10.23, '50元接通控制权'),
    ('02', 10.23, 17.79, '星期四质疑'),
    ('03', 17.79, 27.49, '会员受限控制继续'),
    ('04', 27.49, 36.97, '七位创始人聚合'),
    ('05', 36.97, 46.79, '股票类别分化'),
    ('06', 46.79, 57.49, '三项核心权利'),
    ('07', 57.49, 70.92, '术语翻译为结果'),
    ('08', 70.92, 77.16, '分配权利组合'),
    ('09', 77.16, 87.96, '融资新玩家进入'),
    ('10', 87.96, 102.42, '稀释与决策堵塞'),
    ('11', 102.42, 108.2, '通道重新梳理'),
    ('12', 108.2, 128.44, '五类股票归位'),
    ('13', 128.44, 149.18, 'A股完整流通'),
    ('14', 149.18, 162.1, 'N股转让转换'),
    ('15', 162.1, 173.68, '战略合作网络'),
    ('16', 173.68, 189.75, 'T股关键控制线'),
    ('17', 189.75, 204.88, 'LTBT独立监督'),
    ('18', 204.88, 224.82, 'E股与T股制衡'),
    ('19', 224.82, 232.62, '七人合成F股'),
    ('20', 232.62, 243.1, '50.1%越线'),
    ('21', 243.1, 258.82, '抽走现金权'),
    ('22', 258.82, 270.34, '控制权与7美元'),
    ('23', 270.34, 278.784, '47.35与2.65'),
]

parser = argparse.ArgumentParser()
parser.add_argument('--only', help='仅检查指定段号，用逗号分隔，例如 1,20,23')
args = parser.parse_args()
selected = set(args.only.split(',')) if args.only else None
scenes = [scene for scene in SCENES if not selected or str(int(scene[0])) in selected]
QA.mkdir(parents=True, exist_ok=True)

server = None
try:
    server = subprocess.Popen(
        ['node', 'dev-server.mjs', '--host', '127.0.0.1', '--port', str(PORT)],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + 15
    while True:
        try:
            with urllib.request.urlopen(BASE, timeout=1) as response:
                if response.status == 200:
                    break
        except Exception:
            if time.time() > deadline:
                raise RuntimeError('完整预览服务未能及时启动')
            time.sleep(0.2)

    records = []
    for scene_id, start, end, title in scenes:
        duration = end - start
        for fraction in (0.25, 0.60, 0.85):
            moment = start + duration * fraction
            output = QA / f'{scene_id}-{int(fraction * 100):02d}.png'
            target = f'{BASE}%E4%B8%A4%E6%AE%B5%E9%A2%84%E8%A7%88/player.html?scene=all&t={moment:.3f}'
            subprocess.run([
                str(CHROME), '--headless=new', '--disable-gpu', '--no-first-run',
                f'--user-data-dir={PROFILE}', '--hide-scrollbars', '--window-size=600,1000',
                '--virtual-time-budget=2500', f'--screenshot={output}', target,
            ], cwd=ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45)
            records.append({'scene': scene_id, 'title': title, 'fraction': fraction, 'time': round(moment, 3), 'file': output.name})
            print(f'{scene_id} {int(fraction * 100):02d}%  {moment:.3f}s', flush=True)

    (QA / 'frames.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    sheet_paths = []
    for group_start in range(0, len(records), 18):
        group = records[group_start:group_start + 18]
        rows = (len(group) + 5) // 6
        sheet = Image.new('RGB', (1200, rows * 355 + 16), '#101a16')
        draw = ImageDraw.Draw(sheet)
        for index, record in enumerate(group):
            image = Image.open(QA / record['file']).convert('RGB')
            image.thumbnail((190, 315), Image.Resampling.LANCZOS)
            col, row = index % 6, index // 6
            x = col * 200 + (200 - image.width) // 2
            y = row * 355 + 34
            sheet.paste(image, (x, y))
            label = f"{record['scene']}  {int(record['fraction'] * 100)}%  {record['time']:.1f}s"
            draw.text((col * 200 + 10, row * 355 + 10), label, fill='#c6ff3d')
        sheet_path = QA / f'contact-sheet-{group_start // 18 + 1}.jpg'
        sheet.save(sheet_path, quality=92, optimize=True)
        sheet_paths.append(str(sheet_path))
    print(f'已生成 {len(records)} 个关键帧，{len(sheet_paths)} 张分组检查图')
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
    if PROFILE.exists():
        shutil.rmtree(PROFILE, ignore_errors=True)
