/* Cheese Motion · 装配层 kit（Node 侧 · 页面骨架）
 *
 * 每期 builder 不再各写一份 HTML 骨架 —— 骨架统一在这里，
 * 保证舞台尺寸、安全区、字幕带、控件与 kit/engine 的引入顺序永远一致。
 */
export const KIT_ASSETS = [
  '/templates/engine.js',
  '/templates/kit/stage-kit.js',
  '/templates/kit/lint-composition.js',
  '/templates/kit/lint-semantics.js'
];

const STYLE = `
:root{
  --background:#0d1a16;--surface:#132520;--surface-raised:#182e28;
  --ink:#eef4e8;--text:#eef4e8;--muted:#8fa79b;--accent:#c6ff3d;
  --accent-2:#8ad8ce;--oppose:#c04a34;--actor:#eef4e8;--agent:#8ad8ce;
  --warning:#e3aa3c;--ok:#8ad8ce;--error:#ed6a5a;--on-accent:#0d1a16;
  --card-fill:rgba(19,37,32,.96);--card-stroke:rgba(198,255,61,.45);
  --subtitle:#eef4e8;--subtitle-band:rgba(13,26,22,.92);
  --sans:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
  --mono:"SFMono-Regular",Consolas,"Liberation Mono",monospace;
  --grid:false;--particles:false;--scanlines:false;--hud:false;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:var(--background);overflow:hidden;font-family:var(--sans);color:var(--text)}
#wrap{position:absolute;left:50%;top:calc(50% - 35px);transform:translate(-50%,-50%)}
#stage{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;overflow:hidden;background:var(--background)}
#bg,#world{position:absolute;left:0;top:0}#world text{font-family:inherit}.mono{font-family:var(--mono)}
#subBand{position:absolute;left:0;right:0;top:1360px;height:560px;pointer-events:none;background:var(--subtitle-band)}
#sub{position:absolute;top:1470px;left:50px;right:50px;text-align:center;font-size:58px;font-weight:800;line-height:1.32;color:var(--subtitle);text-shadow:0 2px 12px var(--background)}
#sub b{color:var(--accent)}
.footer{position:absolute;bottom:100px;width:100%;text-align:center;font-size:22px;letter-spacing:6px;color:var(--muted)}
#ctrl{position:fixed;left:0;right:0;bottom:0;height:60px;display:flex;align-items:center;gap:14px;padding:0 20px;background:var(--surface);font-size:14px;color:var(--text);border-top:1px solid var(--card-stroke)}
#ctrl button{background:var(--accent);color:var(--on-accent);border:1px solid var(--card-stroke);padding:6px 14px;border-radius:4px;cursor:pointer}#ctrl input{flex:1}
body.export #wrap{left:0;top:0;transform:none}body.export #ctrl{display:none}
`;

const BODY = footer => `
<div id="wrap"><div id="stage">
  <canvas id="bg" width="1080" height="1920"></canvas>
  <svg id="world" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <radialGradient id="gHalo"><stop offset="0" stop-color="#c6ff3d" stop-opacity=".22"/><stop offset="1" stop-color="#c6ff3d" stop-opacity="0"/></radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g id="cam"></g>
  </svg>
  <div id="subBand"></div><div id="sub"></div>
  <div class="hud-top mono" style="position:absolute;left:70px;right:70px;top:80px;display:flex;justify-content:space-between;font-size:26px;letter-spacing:3px;color:#8fa79b"><div>CHEESE MOTION</div><div id="tc">00:00.00</div></div>
  <div id="prog" style="position:absolute;left:70px;right:70px;top:140px;height:3px;background:rgba(198,255,61,.45)"><i style="display:block;height:100%;width:0;background:#c6ff3d"></i></div>
  <div class="footer mono">${footer}</div>
</div></div>
<div id="ctrl"><button id="play">▶ 播放</button><button id="re">⟲ 重播</button><input id="scrub" type="range" step="0.01"><span id="tlabel" class="mono"></span></div>
`;

/** 生成舞台页面。script 为本期脚本内容，在 kit 与 engine 之后执行。
 *  footer 是**本页的题材署名**，每期必须传对 ——
 *  它以前是硬编码的「端侧 AI」，结果每一期、每一帧都印着上一期的题材。 */
export function stagePage({ title, script, footer = 'CHEESE MOTION', assets = KIT_ASSETS }) {
  const tags = assets.map(src => `<script src="${src}"></script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
${BODY(footer)}
${tags}
<script>
${script}
</script>
</body>
</html>
`;
}
