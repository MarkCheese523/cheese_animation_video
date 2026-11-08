/* Cheese Motion · 装配层 kit（Node 侧 · 视觉回归 / Golden Frame 像素基线）
 *
 * 为什么需要它：
 *   语义校验（L2 构图 / L3 语义）能抓住「主体缩到 17%」「云图标当语音源」这类**语义**错误，
 *   但抓不住「同样的画面被悄悄改动了」—— 描边粗了 1px、点阵少了两颗、品牌基座歪了 3px、
 *   模块间距变了 2px。这些回归不会被任何语义规则注意到，但观众看得出来，
 *   而且会一次期一次期地漂移。
 *
 *   怎么做到「确定」：
 *   render(t) 是纯函数 —— 同一 t 必须得到同一帧，这是时间轴引擎的根本保证。
 *   所以只要固定视口（1080×1920，deviceScaleFactor=1），截图就是可复现的，
 *   差异只可能来自「画面真的变了」，不可能来自渲染抖动。
 *
 *   定位（重要）：
 *   视觉回归属于**回归层**，不是交付关卡。画面合法改动必然与基线不符，
 *   而基线只能在用户验收之后由人手动 --update（Agent 不得自行改基线）。
 *   因此它的正确形态是「机器查一致、人拍板」：结果作为**可见状态**呈现在接触表里，
 *   由人决定这次改动是「合法修改 + 更新基线」还是「回归 + 必须改回去」。
 *
 *   谁在用：
 *   - scripts/qa-visual-regression.mjs   命令行入口（CI / 单跑）
 *   - scripts/contact-sheet.mjs          产线接入：把漂移状态写进语义接触表
 */

/* rule: E26 画面必须与像素基线逐帧可比对 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';

/* ------------------------------------------------------------------ *
 * 默认参数
 * ------------------------------------------------------------------ */

export const VISUAL_DEFAULTS = {
  /* 通道差超过此值才算「显著差异」，低于它视为抗锯齿抖动 */
  threshold: 12,
  /* 允许的显著差异像素占比（%）。
     渲染在固定视口下完全确定（实测逐像素零微差），
     所以容差可以卡得很紧：一个 4px 的字号变化就会产生 0.49% 像素差，
     容差放到 0.05% 才拦得住「画面被悄悄改了」这类回归。
     换机器 / 换 Chrome 版本时字体栅格化会不同，需要重新生成基线。 */
  tolerance: 0.05,
  viewport: { width: 1080, height: 1920 }
};

export const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

export function findChrome(explicit) {
  const candidates = explicit ? [explicit, ...CHROME_CANDIDATES] : CHROME_CANDIDATES;
  return candidates.find(candidate => existsSync(candidate)) || null;
}

/** 基线目录约定：<jobDir>/baseline-<segmentId> —— 一段画面一份基线。 */
export function baselineDirFor(jobDir, segmentId) {
  return path.join(jobDir, `baseline-${segmentId}`);
}

/** 读取基线元信息（times / threshold / tolerance）。 */
export function readBaselineMeta(baselineDir) {
  const file = path.join(baselineDir, 'baseline.json');
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 核心：跑一轮视觉回归
 * ------------------------------------------------------------------ */

/**
 * @param {object} input
 * @param {string} input.url            页面地址（必须是可确定性 renderAt 的预览页）
 * @param {string} input.baselineDir    基线目录
 * @param {number[]} [input.times]      要比对的时刻；不给则读基线元信息
 * @param {boolean} [input.update]      true = 生成/刷新基线
 * @param {number} [input.threshold]
 * @param {number} [input.tolerance]
 * @param {string} [input.chromePath]
 * @param {string} [input.repoRoot]
 * @param {(line: string) => void} [input.log]
 * @returns {Promise<{
 *   status: 'pass'|'drift'|'missing'|'skipped',
 *   ok: boolean,
 *   times: number[],
 *   results: Array<{t:number,status:string,significant?:number,minor?:number,ratio?:number}>,
 *   failures: Array<{t:number,reason:string,diffFile?:string}>,
 *   baselineDir: string,
 *   note: string
 * }>}
 */
export async function runVisualRegression(input) {
  const {
    url,
    baselineDir,
    update = false,
    chromePath,
    repoRoot = process.cwd(),
    log = () => {}
  } = input;
  const threshold = Number(input.threshold ?? VISUAL_DEFAULTS.threshold);
  const tolerance = Number(input.tolerance ?? VISUAL_DEFAULTS.tolerance);
  const { width, height } = input.viewport || VISUAL_DEFAULTS.viewport;

  const chrome = findChrome(chromePath);
  if (!chrome) {
    return {
      status: 'skipped', ok: true, times: [], results: [], failures: [],
      baselineDir, note: '未找到 Chrome（可用 CHROME_PATH 指定），视觉回归本轮跳过'
    };
  }
  if (!url) throw new Error('runVisualRegression 需要 url');
  if (!baselineDir) throw new Error('runVisualRegression 需要 baselineDir');

  const meta = readBaselineMeta(baselineDir);
  const times = Array.isArray(input.times) && input.times.length
    ? input.times
    : (meta?.times || []);
  if (!times.length) {
    return {
      status: 'missing', ok: false, times: [], results: [], failures: [],
      baselineDir, note: '没有可比对的时刻：先跑一次 --update 生成基线'
    };
  }
  if (!update && !existsSync(baselineDir)) {
    return {
      status: 'missing', ok: false, times, results: [], failures: [],
      baselineDir, note: '缺少基线目录（先跑一次 --update 生成基线）'
    };
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const debugPort = 9950 + (process.pid % 40);
  const profile = path.join(repoRoot, '.tmp', `visual-regression-${process.pid}`);
  rmSync(profile, { recursive: true, force: true });
  mkdirSync(profile, { recursive: true });

  const child = spawn(chrome, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--disable-lcd-text',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore' });

  let ws;
  const pending = new Map();
  let nextId = 0;
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  };

  const results = [];
  const failures = [];

  try {
    let targets;
    for (let attempt = 0; attempt < 75; attempt++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
        if (targets.length) break;
      } catch { /* Chrome 启动中 */ }
      await sleep(200);
    }
    if (!targets || !targets.length) throw new Error('无法连接 Chrome');
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
      }
    };
    await cdp('Page.enable');
    // 固定视口 = 舞台原始尺寸，截图才有可比性
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url });
    await sleep(1800);

    const hasRender = await evaluate('typeof window.renderAt === "function"');
    if (!hasRender) throw new Error('页面没有 renderAt —— 无法做确定性视觉回归');

    mkdirSync(baselineDir, { recursive: true });

    for (const t of times) {
      await evaluate(`window.renderAt(${t})`);
      await sleep(120);
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const current = Buffer.from(shot.data, 'base64');
      const file = path.join(baselineDir, `frame-${t}.png`);

      if (update) {
        writeFileSync(file, current);
        results.push({ t, status: 'baseline' });
        continue;
      }
      if (!existsSync(file)) {
        failures.push({ t, reason: `缺少基线帧 ${path.basename(file)}（先跑 --update 生成）` });
        continue;
      }
      const base64 = current.toString('base64');
      const baseline64 = readFileSync(file).toString('base64');
      /* 在浏览器里逐像素比对（避免在 Node 侧手写 PNG 解码） */
      const diff = await evaluate(`(async () => {
        const load = src => new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('图片解码失败'));
          image.src = src;
        });
        const a = await load('data:image/png;base64,${baseline64}');
        const b = await load('data:image/png;base64,${base64}');
        if (a.width !== b.width || a.height !== b.height) {
          return { sizeMismatch: true, a: [a.width, a.height], b: [b.width, b.height] };
        }
        const width = a.width, height = a.height;
        const ca = document.createElement('canvas'); ca.width = width; ca.height = height;
        const cb = document.createElement('canvas'); cb.width = width; cb.height = height;
        const ctxA = ca.getContext('2d', { willReadFrequently: true });
        const ctxB = cb.getContext('2d', { willReadFrequently: true });
        ctxA.drawImage(a, 0, 0); ctxB.drawImage(b, 0, 0);
        const da = ctxA.getImageData(0, 0, width, height).data;
        const db = ctxB.getImageData(0, 0, width, height).data;
        const out = ctxA.createImageData(width, height);
        const od = out.data;
        let significant = 0, minor = 0;
        for (let i = 0; i < da.length; i += 4) {
          const dr = Math.abs(da[i] - db[i]);
          const dg = Math.abs(da[i + 1] - db[i + 1]);
          const dbl = Math.abs(da[i + 2] - db[i + 2]);
          const delta = Math.max(dr, dg, dbl);
          if (delta > ${threshold}) {
            significant++;
            od[i] = 255; od[i + 1] = 0; od[i + 2] = 0; od[i + 3] = 255;
          } else if (delta > 0) {
            minor++;
            od[i] = 255; od[i + 1] = 220; od[i + 2] = 0; od[i + 3] = 90;
          } else {
            const grey = Math.round((da[i] + da[i + 1] + da[i + 2]) / 3 * 0.28);
            od[i] = grey; od[i + 1] = grey; od[i + 2] = grey; od[i + 3] = 255;
          }
        }
        ctxA.putImageData(out, 0, 0);
        return {
          sizeMismatch: false,
          significant, minor, total: width * height,
          diff: ca.toDataURL('image/png')
        };
      })()`);

      if (diff.sizeMismatch) {
        failures.push({ t, reason: `尺寸不一致：基线 ${diff.a.join('×')} vs 当前 ${diff.b.join('×')}` });
        continue;
      }
      const ratio = diff.significant / diff.total * 100;
      if (ratio > tolerance) {
        const diffFile = path.join(baselineDir, `diff-${t}.png`);
        writeFileSync(diffFile, Buffer.from(diff.diff.split(',')[1], 'base64'));
        failures.push({ t, reason: `显著差异 ${diff.significant} 像素（${ratio.toFixed(3)}%，超过容差 ${tolerance}%）`, diffFile });
      } else {
        results.push({ t, status: 'ok', significant: diff.significant, minor: diff.minor, ratio });
      }
      log(`  ${String(t).padStart(6)}s  显著差异 ${String(diff.significant).padStart(7)} 像素（${ratio.toFixed(4)}%）· 抗锯齿微差 ${diff.minor}`);
    }

    if (update) {
      writeFileSync(path.join(baselineDir, 'baseline.json'), `${JSON.stringify({
        version: 1, url, times, threshold, tolerance,
        viewport: { width, height },
        createdAt: new Date().toISOString()
      }, null, 2)}\n`, 'utf8');
      return {
        status: 'pass', ok: true, times, results, failures, baselineDir,
        note: `基线已更新（${times.length} 帧）`
      };
    }
    if (failures.length) {
      return {
        status: 'drift', ok: false, times, results, failures, baselineDir,
        note: `${failures.length}/${times.length} 帧与基线不一致`
      };
    }
    return {
      status: 'pass', ok: true, times, results, failures, baselineDir,
      note: `${times.length} 帧与基线一致`
    };
  } finally {
    try { ws?.close(); } catch { /* ignore */ }
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }); }
    catch { /* Chrome 可能还在写临时目录 */ }
  }
}
