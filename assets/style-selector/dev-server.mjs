import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sampleMounts = {
  '/samples/cream-neon/': path.join(root, 'samples', 'cream-neon'),
  '/samples/dark-narrative/': path.join(root, 'samples', 'dark-narrative')
};
const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
}
const host = arg('host', '127.0.0.1');
const port = Number(arg('port', '7100'));
const selfTest = args.includes('--self-test');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

function resolveTarget(pathname) {
  for (const [prefix, directory] of Object.entries(sampleMounts)) {
    if (pathname.startsWith(prefix)) {
      const relative = pathname.slice(prefix.length);
      return { target: path.resolve(directory, relative), directory };
    }
  }
  return { target: path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`), directory: root };
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const resolved = resolveTarget(pathname);
    let { target } = resolved;
    if (target !== resolved.directory && !target.startsWith(resolved.directory + path.sep)) {
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
  console.log(`风格选择页：http://${host}:${port}/`);
  if (!selfTest) return;
  try {
    const routes = [
      '/', '/styles.css', '/selector.js',
      '/samples/cream-neon/cover.png',
      '/samples/dark-narrative/cover.png',
      '/samples/cream-neon/player.html?scene=all',
      '/samples/cream-neon/player.js',
      '/samples/cream-neon/scenes.js',
      '/samples/dark-narrative/player.html?scene=all',
      '/samples/dark-narrative/player.js',
      '/samples/dark-narrative/scenes.js'
    ];
    for (const route of routes) {
      const response = await fetch(`http://${host}:${port}${route}`);
      console.log(`${response.status} ${route}`);
      if (!response.ok) throw new Error(`检查失败：${route}`);
      await response.arrayBuffer();
    }
    server.close(() => process.exit(0));
  } catch (error) {
    console.error(error);
    server.close(() => process.exit(1));
  }
});
