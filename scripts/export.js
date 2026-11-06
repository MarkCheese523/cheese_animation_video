#!/usr/bin/env node
/**
 * Authorized final-export tool: deterministic frames -> MP4.
 * Dependencies: npm install puppeteer; ffmpeg on PATH.
 * Usage: node scripts/export.js part3.html 20.5 255.5 30 part3.mp4
 * Do not run for previews or skill development. Requires explicit final-export authorization.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , src, t0s, t1s, fpsS = '30', out = 'out.mp4'] = process.argv;
if (!src || !t0s || !t1s) {
  console.error('Usage: node scripts/export.js input.html t0 t1 [fps=30] [out.mp4]');
  process.exit(2);
}
const t0 = Number(t0s), t1 = Number(t1s), fps = Number(fpsS);
if (![t0, t1, fps].every(Number.isFinite) || t1 <= t0 || fps <= 0) throw new Error('Invalid time range or fps');
const N = Math.round((t1 - t0) * fps);
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { throw new Error('Missing dependency: install puppeteer before authorized export'); }
const joiner = /[?#]/.test(src) ? '&' : '?';
const url = (/^https?:/.test(src) ? src : pathToFileURL(path.resolve(src)).href) + `${joiner}export=1`;
const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files', '--disable-web-security'] });
let ffmpeg;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const ready = await page.evaluate(() => typeof window.renderAt === 'function');
  if (!ready) throw new Error('Page does not expose window.renderAt(t)');
  ffmpeg = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpeg.on('error', reject);
    ffmpeg.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
  });
  for (let i = 0; i < N; i += 1) {
    const t = t0 + i / fps;
    await page.evaluate(time => window.renderAt(time), t);
    const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!ffmpeg.stdin.write(buffer)) await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    if (i % fps === 0) process.stdout.write(`\r${t.toFixed(1)}s / ${t1}s`);
  }
  ffmpeg.stdin.end();
  await ffmpegDone;
  console.log(`\n完成：${out}（${N} 帧）`);
} finally {
  if (ffmpeg && !ffmpeg.stdin.destroyed) ffmpeg.stdin.destroy();
  await browser.close();
}
