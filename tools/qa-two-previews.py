from pathlib import Path
import shutil
import subprocess
import time
import urllib.request
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa' / 'two-previews'
QA.mkdir(parents=True, exist_ok=True)
PROFILE = ROOT / 'qa' / 'chrome-two-previews'
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
PORT = 7100
BASE = f'http://127.0.0.1:{PORT}/'
FRAMES = [
    ('opening', 1.5, '01 人物出场'),
    ('opening', 5.5, '02 控制连线'),
    ('opening', 8.5, '03 Claude 点阵卡'),
    ('opening', 9.8, '04 开场定格'),
    ('control', 1.5, '05 F 股启动'),
    ('control', 5.5, '06 50% 前减速'),
    ('control', 6.65, '07 越过控制线'),
    ('control', 8.5, '08 控制状态切换'),
]

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
                raise RuntimeError('预览服务未能及时启动')
            time.sleep(0.2)

    shots = []
    for scene, moment, label in FRAMES:
        target = f'{BASE}%E4%B8%A4%E6%AE%B5%E9%A2%84%E8%A7%88/player.html?scene={scene}&t={moment}'
        output = QA / f'{scene}-{moment}.png'
        subprocess.run([
            str(CHROME), '--headless=new', '--disable-gpu', '--no-first-run',
            f'--user-data-dir={PROFILE}', '--hide-scrollbars', '--window-size=600,1000',
            '--virtual-time-budget=3000', f'--screenshot={output}', target,
        ], cwd=ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45)
        shots.append((output, label))

    sheet = Image.new('RGB', (1200, 1080), '#101a16')
    draw = ImageDraw.Draw(sheet)
    for index, (shot, label) in enumerate(shots):
        image = Image.open(shot).convert('RGB')
        image.thumbnail((290, 480), Image.Resampling.LANCZOS)
        x = (index % 4) * 300 + (300 - image.width) // 2
        y = (index // 4) * 540 + 42
        sheet.paste(image, (x, y))
        draw.text((index % 4 * 300 + 14, index // 4 * 540 + 14), label, fill='#c6ff3d')
    sheet_path = QA / 'contact-sheet.jpg'
    sheet.save(sheet_path, quality=92, optimize=True)
    print(f'已生成 {len(shots)} 个关键帧：{sheet_path}')
finally:
    if server is not None:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill(); server.wait(timeout=5)
    if PROFILE.exists():
        shutil.rmtree(PROFILE, ignore_errors=True)
