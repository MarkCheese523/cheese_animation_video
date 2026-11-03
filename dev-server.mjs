import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { researchProduct } from './product-profile.mjs';
import { writeStoryboard } from './storyboard.mjs';
import { createAgentJob, readAgentJob, saveAgentAnalysis, uploadAgentAsset } from './agent-flow.mjs';
import { researchWebAssets } from './asset-research.mjs';
import { createProductionJob, readProductionJob, saveProductionResult } from './production-flow.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
}
const host = arg('host', '127.0.0.1');
const port = Number(arg('port', '7100'));
const selfTest = args.includes('--self-test');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf' };

async function readJson(req, limit = 262_144) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > limit) throw new Error('请求内容过大');
  }
  return JSON.parse(body || '{}');
}
function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify(value));
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/agent-upload') {
      if (req.method !== 'POST') { sendJson(res, 405, { error: '只支持 POST' }); return; }
      try {
        const filename = new URL(req.url, 'http://localhost').searchParams.get('filename') || '';
        sendJson(res, 200, await uploadAgentAsset(req, filename));
      } catch (error) { sendJson(res, 400, { error: error.message || '附件上传失败' }); }
      return;
    }
    if (pathname === '/api/asset-research') {
      if (req.method !== 'GET') { sendJson(res, 405, { error: '只支持 GET' }); return; }
      try {
        const params = new URL(req.url, 'http://localhost').searchParams;
        const candidates = await researchWebAssets({ query: params.get('query') || '', brand: params.get('brand') === '1', limit: params.get('limit') });
        sendJson(res, 200, { candidates, source: 'Wikimedia Commons' });
      } catch (error) { sendJson(res, 502, { error: error.message || '互联网图片检索失败', candidates: [] }); }
      return;
    }
    if (pathname === '/api/agent-jobs' && req.method === 'POST') {
      try { sendJson(res, 200, await createAgentJob(await readJson(req))); }
      catch (error) { sendJson(res, 400, { error: error.message || 'Agent 任务创建失败' }); }
      return;
    }
    const agentMatch = pathname.match(/^\/api\/agent-jobs\/(motion-[a-f0-9-]{36})(\/analysis)?$/);
    if (agentMatch) {
      try {
        if (agentMatch[2] && req.method === 'POST') sendJson(res, 200, await saveAgentAnalysis(agentMatch[1], await readJson(req, 524_288)));
        else if (!agentMatch[2] && req.method === 'GET') sendJson(res, 200, await readAgentJob(agentMatch[1]));
        else sendJson(res, 405, { error: '不支持的 Agent 任务操作' });
      } catch (error) { sendJson(res, error.code === 'ENOENT' ? 404 : 400, { error: error.message || 'Agent 任务读取失败' }); }
      return;
    }
    if (pathname === '/api/production-jobs' && req.method === 'POST') {
      try { sendJson(res, 200, await createProductionJob(await readJson(req, 1_048_576))); }
      catch (error) { sendJson(res, 400, { error: error.message || '制作任务创建失败' }); }
      return;
    }
    const productionMatch = pathname.match(/^\/api\/production-jobs\/(motion-[a-f0-9-]{36})(\/result)?$/);
    if (productionMatch) {
      try {
        if (productionMatch[2] && req.method === 'POST') sendJson(res, 200, await saveProductionResult(productionMatch[1], await readJson(req, 1_048_576)));
        else if (!productionMatch[2] && req.method === 'GET') sendJson(res, 200, await readProductionJob(productionMatch[1]));
        else sendJson(res, 405, { error: '不支持的制作任务操作' });
      } catch (error) { sendJson(res, error.code === 'ENOENT' ? 404 : 400, { error: error.message || '制作任务读取失败' }); }
      return;
    }
    if (pathname === '/api/product-profile') {
      if (req.method !== 'POST') { res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: '只支持 POST' })); return; }
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16_384) throw new Error('请求内容过大');
      }
      try {
        const input = JSON.parse(body || '{}');
        const profile = await researchProduct(input.url || '');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(profile));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || '产品网页分析失败' }));
      }
      return;
    }
    if (pathname === '/api/storyboard') {
      if (req.method !== 'POST') { res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: '只支持 POST' })); return; }
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 262_144) throw new Error('分镜请求内容过大');
      }
      try {
        const result = await writeStoryboard(JSON.parse(body || '{}'));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || '分镜生成失败' }));
      }
      return;
    }
    let target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    let info = await stat(target);
    if (info.isDirectory()) { target = path.join(target, 'index.html'); info = await stat(target); }
    const headers = { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
        if (start <= end && start < info.size) {
          res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1 });
          createReadStream(target, { start, end }).pipe(res);
          return;
        }
      }
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': info.size });
    createReadStream(target).pipe(res);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
});

server.listen(port, host, async () => {
  console.log(`网页预览：http://${host}:${port}/`);
  if (selfTest) {
    try {
      for (const route of ['/', '/studio/', '/assets/template/player.html?scene=motion-study&t=10', '/assets/template/player.html?scene=all', '/studio/demo/player.html?scene=all']) {
        const response = await fetch(`http://${host}:${port}${encodeURI(route)}`);
        console.log(`${response.status} ${route}`);
        if (!response.ok) throw new Error(`检查失败：${route}`);
      }
      const svg = await fetch(`http://${host}:${port}/studio/demo/component-demo-logo.svg`);
      console.log(`${svg.status} SVG ${svg.headers.get('content-type')}`);
      if (!svg.ok || svg.headers.get('content-type') !== 'image/svg+xml') throw new Error('SVG 素材类型配置异常');
      const media = await fetch(`http://${host}:${port}/studio/demo/assets/walk/human-00.png`, { headers: { Range: 'bytes=0-99' } });
      console.log(`${media.status} 二进制 Range 请求`);
      if (media.status !== 206) throw new Error('媒体拖动所需 Range 支持异常');
      server.close(() => process.exit(0));
    } catch (error) {
      console.error(error);
      server.close(() => process.exit(1));
    }
  }
});
