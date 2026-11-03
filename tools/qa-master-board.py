from pathlib import Path
import os
import re
import shutil
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa'
QA.mkdir(exist_ok=True)
PROFILE = QA / 'chrome-profile'
SCREENSHOT = QA / 'master-board-full.png'
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
PORT = 7100
BASE = f'http://127.0.0.1:{PORT}/'

server = None
try:
    server = subprocess.Popen(
        ['node', 'dev-server.mjs', '--host', '127.0.0.1', '--port', str(PORT)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
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

    common = [
        str(CHROME), '--headless=new', '--disable-gpu', '--no-first-run',
        f'--user-data-dir={PROFILE}', '--hide-scrollbars',
        '--virtual-time-budget=4000',
    ]
    target = BASE + '%E6%AF%8D%E7%89%88%E7%A1%AE%E8%AE%A4%E6%9D%BF.html'
    subprocess.run(
        common + ['--window-size=1440,8000', f'--screenshot={SCREENSHOT}', target],
        cwd=ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        timeout=45,
    )
    dom = subprocess.run(
        common + ['--dump-dom', target], cwd=ROOT, check=True,
        capture_output=True, text=True, timeout=45,
    ).stdout
    match = re.search(r'<div class="audit" id="audit"[^>]*>(.*?)</div>', dom, re.S)
    audit = re.sub(r'<[^>]+>', '', match.group(1)).strip() if match else '未找到资产检查结论'
    print(audit)
    print(f'截图：{SCREENSHOT}')
    if '未成功加载' in audit or '未找到' in audit:
        raise SystemExit(1)
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
