from pathlib import Path
import shutil
import subprocess
import time
import urllib.request
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa' / 'redesign'
PROFILE = ROOT / 'qa' / 'chrome-redesign'
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
PORT = 7184
BASE = f'http://127.0.0.1:{PORT}/'
FRAMES = [
    ('founders', 1.5, '04 实名条带进入'),
    ('founders', 4.8, '04 条带开始聚合'),
    ('founders', 7.5, '04 创始人公司成型'),
    ('founders', 9.0, '04 控制路径定格'),
    ('classA', 1.5, '13 股权凭证组装'),
    ('classA', 5.5, '13 权利模块接入'),
    ('classA', 10.5, '13 四项权利完成'),
    ('classA', 13.0, '13 持有人变体'),
    ('classA', 18.5, '13 IPO 流通定格'),
]
QA.mkdir(parents=True, exist_ok=True)
server = None
try:
    server = subprocess.Popen(['node', 'dev-server.mjs', '--host', '127.0.0.1', '--port', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + 15
    while True:
        try:
            with urllib.request.urlopen(BASE, timeout=1) as response:
                if response.status == 200:
                    break
        except Exception:
            if time.time() > deadline:
                raise RuntimeError('重做样片服务未能及时启动')
            time.sleep(.2)
    shots = []
    for scene, moment, label in FRAMES:
        output = QA / f'{scene}-{moment}.png'
        target = f'{BASE}%E4%B8%A4%E6%AE%B5%E9%A2%84%E8%A7%88/player.html?scene={scene}&t={moment}'
        subprocess.run([
            str(CHROME), '--headless=new', '--disable-gpu', '--no-first-run',
            f'--user-data-dir={PROFILE}', '--hide-scrollbars', '--window-size=600,1000',
            '--virtual-time-budget=2500', f'--screenshot={output}', target,
        ], cwd=ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45)
        shots.append((output, label))
        print(label, flush=True)
    sheet = Image.new('RGB', (1200, 1080), '#101a16')
    draw = ImageDraw.Draw(sheet)
    for index, (shot, label) in enumerate(shots):
        image = Image.open(shot).convert('RGB')
        image.thumbnail((230, 465), Image.Resampling.LANCZOS)
        col, row = index % 5, index // 5
        x = col * 240 + (240 - image.width) // 2
        y = row * 540 + 42
        sheet.paste(image, (x, y))
        draw.text((col * 240 + 10, row * 540 + 14), label, fill='#c6ff3d')
    path = QA / 'contact-sheet.jpg'
    sheet.save(path, quality=94, optimize=True)
    print(path)
finally:
    if server is not None:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill(); server.wait(timeout=5)
    if PROFILE.exists():
        shutil.rmtree(PROFILE, ignore_errors=True)
