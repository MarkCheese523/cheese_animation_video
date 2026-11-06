import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { makeAgentAnalysis } from './fixtures/agent-analysis.mjs';

const root = process.cwd();
const port = 7137;
const debugPort = 9237;
const profile = path.join(root, 'qa', 'studio-chrome-profile');
const output = path.join(root, 'qa', 'studio.png');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) throw new Error('未找到 Chrome；请设置 CHROME_PATH');
mkdirSync(path.dirname(output), { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const children = [];
let ws;
let nextId = 0;
const pending = new Map();
const errors = [];

async function waitFor(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const response = await fetch(url); if (response.ok) return response; } catch { /* retry */ }
    await sleep(200);
  }
  throw new Error(`等待超时：${url}`);
}
async function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '浏览器脚本执行失败');
  return result.result.value;
}
async function waitExpression(expression, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return;
    await sleep(250);
  }
  throw new Error(`浏览器状态等待超时：${expression}`);
}
async function returnAgentAnalysis(options) {
  const prompt = await evaluate(`document.querySelector('#agentPrompt').value`);
  const jobId = prompt.match(/motion-[a-f0-9-]{36}/)?.[0];
  if (!jobId) throw new Error('页面未生成真实 Agent 交接任务');
  const response = await fetch(`http://127.0.0.1:${port}/api/agent-jobs/${jobId}/analysis`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(makeAgentAnalysis(jobId, options))
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Agent 拆解回写失败');
  return jobId;
}
async function productionJob(stage) {
  const selector = stage === 'masters' ? '#masterPrompt' : stage === 'samples' ? '#samplePrompt' : '#filmPrompt';
  const prompt = await evaluate(`document.querySelector('${selector}').value`);
  const jobId = prompt.match(/motion-[a-f0-9-]{36}/)?.[0];
  if (!jobId) throw new Error(`页面未生成 ${stage} 制作交接任务`);
  const response = await fetch(`http://127.0.0.1:${port}/api/production-jobs/${jobId}`);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '制作任务读取失败');
  return { jobId, job: value.job };
}
async function returnMastersResult() {
  const { jobId, job } = await productionJob('masters');
  const dir = path.join(root, 'studio', 'production-jobs', jobId, 'masters');
  const masters = [];
  for (const element of job.package.elements) {
    const slotDir = path.join(dir, element.slotId); mkdirSync(slotDir, { recursive: true });
    const variants = ['ink', 'accent', 'reverse'].map(id => {
      const color = id === 'accent' ? '#c6ff3d' : id === 'reverse' ? '#eff5e7' : '#102a22';
      writeFileSync(path.join(slotDir, `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><rect x="30" y="30" width="300" height="300" rx="50" fill="none" stroke="${color}" stroke-width="18"/><circle cx="180" cy="180" r="72" fill="${color}"/><text x="180" y="330" text-anchor="middle" font-size="22" fill="${color}">${element.slotId} AGENT</text></svg>`);
      return { id, label: id, previewUrl: `/studio/production-jobs/${jobId}/masters/${element.slotId}/${id}.svg` };
    });
    masters.push({ slotId: element.slotId, sourceId: element.selected.id, retainedFeatures: 'Agent 对照参考保留轮廓、比例与识别特征', variants, qa: 'PASS Agent 真实文件对照' });
  }
  const response = await fetch(`http://127.0.0.1:${port}/api/production-jobs/${jobId}/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jobId, stage: 'masters', masters }) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Agent 母版回写失败');
  return jobId;
}
async function returnSamplesResult() {
  const { jobId, job } = await productionJob('samples');
  const beats = job.package.beats;
  const opening = beats.find(beat => beat.id === 'gather') || beats[0];
  const mechanism = beats.find(beat => beat.id === 'switch') || beats.find(beat => beat.id === 'trigger') || beats[1];
  const dir = path.join(root, 'studio', 'production-jobs', jobId);
  for (const [id, beat] of [['opening', opening], ['mechanism', mechanism]]) {
    mkdirSync(path.join(dir, id), { recursive: true });
    writeFileSync(path.join(dir, id, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${beat.label}</title><body data-real-sample="${id}"><h1>${beat.label}</h1><p>${beat.narration}</p><script>window.__seek=function(t){document.body.dataset.time=String(t)};<\/script></body></html>`);
  }
  const sample = (id, kind, beat) => ({ id, kind, sourceBeatId: beat.id, title: beat.label, narration: beat.narration, duration: beat.duration, assetIds: beat.assetIds, previewUrl: `/studio/production-jobs/${jobId}/${id}/index.html`, qa: 'PASS 浏览器、关键帧与本任务网页路径' });
  const result = {
    jobId, stage: 'samples',
    designBrief: { reference: '本期已确认分镜与产品档案', palette: ['#c6ff3d'], typography: '本期字体角色', assetLanguage: '只调用已确认母版', motionCharacter: '动作先于版式', keyFrames: [opening.label, mechanism.label] },
    samples: [sample('opening', 'visual-opening', opening), sample('mechanism', 'core-mechanism', mechanism)]
  };
  const response = await fetch(`http://127.0.0.1:${port}/api/production-jobs/${jobId}/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '两段样片回写失败');
  return jobId;
}
async function returnFilmResult() {
  const { jobId, job } = await productionJob('film');
  const dir = path.join(root, 'studio', 'production-jobs', jobId, 'film');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>本期全片</title><body data-real-film="true"><h1>本期完整网页预览</h1><script>window.__seek=function(t){document.body.dataset.time=String(t)};<\/script></body></html>');
  const duration = job.package.beats.reduce((sum, beat) => sum + Number(beat.duration), 0);
  const result = { jobId, stage: 'film', title: '本期完整网页预览', duration, sceneCount: job.package.beats.length, previewUrl: `/studio/production-jobs/${jobId}/film/index.html`, qa: 'PASS 连续时间轴与真实网页路径', mediaRequests: [] };
  const response = await fetch(`http://127.0.0.1:${port}/api/production-jobs/${jobId}/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '全片回写失败');
  return jobId;
}

try {
  const server = spawn(process.execPath, ['dev-server.mjs', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: 'ignore' });
  children.push(server);
  await waitFor(`http://127.0.0.1:${port}/studio/`);
  const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--disable-gpu', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  children.push(chrome);
  await waitFor(`http://127.0.0.1:${debugPort}/json/list`);
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/studio/` });
  await waitExpression(`document.readyState === 'complete' && !!document.querySelector('#startMotion') && !!document.querySelector('#samplePlan')`);
  if (await evaluate(`document.querySelector('#demoFrame') || document.querySelector('#generateStoryboard') || document.querySelector('#sampleFrame').hasAttribute('src')`)) throw new Error('初始页面不应加载通用播放器或旧生成入口');
  if (await evaluate(`document.querySelectorAll('.style-card').length`) !== 2) throw new Error('无产品风格选项缺失');
  if (!await evaluate(`document.querySelector('#direction #scriptInput') && !document.querySelector('#elements #scriptInput')`)) throw new Error('脚本输入未归入方向阶段');
  if (!await evaluate(`document.querySelector('#motion').compareDocumentPosition(document.querySelector('#elements')) === Node.DOCUMENT_POSITION_FOLLOWING && document.querySelector('#elements').compareDocumentPosition(document.querySelector('#redraw')) === Node.DOCUMENT_POSITION_FOLLOWING && document.querySelector('#redraw').compareDocumentPosition(document.querySelector('#preview')) === Node.DOCUMENT_POSITION_FOLLOWING && document.querySelector('#preview').compareDocumentPosition(document.querySelector('#film')) === Node.DOCUMENT_POSITION_FOLLOWING`)) throw new Error('阶段顺序应为分镜→找图→重绘→两段样片→全片');
  if (!await evaluate(`document.querySelectorAll('[data-page]:not([hidden])').length === 1 && !document.querySelector('#direction').hidden && document.querySelector('#confirmSamples').disabled && document.querySelector('[data-step="film"]').disabled`)) throw new Error('初始页面或制作闸门不正确');
  const plainError = await evaluate(`requestJson('/not-an-api').catch(error => error.message)`);
  if (!plainError.includes('制作服务未更新或暂不可用（HTTP 404）') || plainError.includes('Unexpected token')) throw new Error('非 JSON 接口错误未转换为可读提示');

  if (await evaluate(`document.querySelector('#brandInput') || document.querySelector('#researchButton')`)) throw new Error('页面不应要求用户补品牌或触发本地语义拆解');
  const realBrandCandidates = await evaluate(`searchBrandCandidates({ id: 'TEST', concept: 'Anthropic 官方品牌标识', semanticName: 'Anthropic', query: 'Anthropic official logo SVG', brandAssets: [], brandOnly: true, researchRoute: 'web' })`);
  if (!realBrandCandidates.some(candidate => candidate.web && candidate.svg?.includes('upload.wikimedia.org') && candidate.sourceUrl?.includes('commons.wikimedia.org'))) throw new Error('品牌未进入互联网真实矢量与来源页通道');
  const amazonCandidates = await evaluate(`searchBrandCandidates({ id: 'TEST', concept: '亚马逊官方品牌标识', semanticName: 'Amazon', query: 'Amazon official logo SVG', brandAssets: [], brandOnly: true, researchRoute: 'web' })`);
  if (!amazonCandidates.some(candidate => candidate.web && candidate.svg?.includes('upload.wikimedia.org'))) throw new Error('亚马逊未返回互联网真实品牌矢量');
  await evaluate(`document.querySelector('[data-mode="product"]').click(); document.querySelector('#demoProduct').click(); document.querySelector('#startMotion').click()`);
  await waitExpression(`!document.querySelector('#productProfile').hidden && !document.querySelector('#motion').hidden && !document.querySelector('#agentHandoff').hidden && document.querySelector('#agentPrompt').value`);
  if (!await evaluate(`document.querySelector('#confirmMotion').disabled && document.querySelectorAll('.beat-row').length === 0`)) throw new Error('Agent 回写前不得显示预填分镜或允许确认');
  const handoffShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-handoff.png'), Buffer.from(handoffShot.data, 'base64'));
  const productJobId = await returnAgentAnalysis({ product: true });
  await waitExpression(`!document.querySelector('#agentAnalysis').hidden && document.querySelectorAll('.beat-row').length === 5 && !document.querySelector('#confirmMotion').disabled`);
  const motionShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-motion.png'), Buffer.from(motionShot.data, 'base64'));
  if (await evaluate(`document.querySelector('#fidelityGroup').hidden`)) throw new Error('产品保真度选项未显示');
  if (!await evaluate(`document.querySelector('[data-step="elements"]').disabled`)) throw new Error('分镜未确认时找图页面不应解锁');
  await evaluate(`document.querySelector('#confirmMotion').click()`);
  await waitExpression(`!document.querySelector('#elements').hidden && document.querySelectorAll('.candidate').length >= 9 && [...document.querySelectorAll('.element-slot')].every(slot => slot.querySelector('.candidates'))`, 30000);
  if (await evaluate(`[...document.querySelectorAll('.element-slot')].some(slot => slot.querySelectorAll('.candidate').length > 6)`)) throw new Error('单个元素槽的候选超过 6 个');
  if (!await evaluate(`document.querySelector('[data-slot="G0"] svg[data-semantic="generic"][data-semantic-role="generic"][data-semantic-ready="true"]')`)) throw new Error('G0 未加载原版通用人物语义资产');
  if (!await evaluate(`document.querySelector('[data-slot="N1"] svg[data-semantic-role="capability"][data-semantic-ready="true"]')`)) throw new Error('非人物通用语义仍错误回落到人物母版');
  if (!await evaluate(`document.querySelector('[data-slot="N2"] .candidate img') && !document.querySelector('[data-slot="N2"] .slot-query').disabled`)) throw new Error('semanticOnly 普通元素仍跳过联网检索或禁用了检索词');
  await evaluate(`(() => {
    const slot = document.querySelector('[data-slot="N1"]');
    const action = slot.querySelector('.slot-action-input'); action.value = '绘制、展开、确权'; action.dispatchEvent(new Event('input', { bubbles: true }));
    const query = slot.querySelector('.slot-query'); query.value = 'document'; query.dispatchEvent(new Event('input', { bubbles: true }));
    slot.querySelector('.slot-research').click();
  })()`);
  await waitExpression(`document.querySelector('[data-slot="N1"] .candidates') && !document.querySelector('[data-slot="N1"] .slot-research').disabled`, 30000);
  await evaluate(`(async () => {
    const images = [...document.querySelectorAll('.candidate img')];
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.race([
      Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      }))),
      new Promise(resolve => setTimeout(resolve, 8000))
    ]);
  })()`);
  if (await evaluate(`[...document.querySelectorAll('.candidate')].some(node => !node.querySelector('img, .local-preview, svg[data-semantic][data-semantic-ready="true"], .abstract-visual, .brand-text-visual'))`)) throw new Error('元素候选缺少可用预览');
  if (!await evaluate(`document.querySelector('[data-slot="B1"] .candidate img[src="/studio/demo/component-demo-logo.svg"]') && document.querySelector('[data-slot="B1"] .candidate-radio:checked')`)) throw new Error('产品 Logo 未进入 B1 默认推荐');
  const previewStats = await evaluate(`({ remote: document.querySelectorAll('.candidate img').length, local: document.querySelectorAll('.candidate .local-preview').length, semantic: document.querySelectorAll('.candidate svg[data-semantic][data-semantic-ready="true"]').length })`);
  if (!await evaluate(`document.querySelector('.needs-summary') && document.querySelectorAll('.candidate-rights').length === document.querySelectorAll('.candidate').length && document.querySelectorAll('.candidate a').length > 0`)) throw new Error('原版名词清单、来源授权或公开链接未合并');
  const referenceShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-references.png'), Buffer.from(referenceShot.data, 'base64'));
  await evaluate(`document.querySelectorAll('.element-slot').forEach(slot => slot.querySelector('.candidate')?.click())`);
  if (!await evaluate(`!document.querySelector('#buildReferenceSheet').disabled && document.querySelector('#confirmReferences').disabled`)) throw new Error('未生成确认单时不应允许进入重绘');
  await evaluate(`document.querySelector('#buildReferenceSheet').click()`);
  if (!await evaluate(`document.querySelector('#referenceSheet').textContent.includes('G0-A') && document.querySelector('#referenceSheet').textContent.includes('N1-A') && document.querySelector('#referenceSheet').textContent.includes('B1-A') && !document.querySelector('#confirmReferences').disabled`)) throw new Error('默认推荐或未写入原版式参考确认单');
  await evaluate(`document.querySelector('#confirmReferences').click()`);
  await waitExpression(`!document.querySelector('#redraw').hidden && !document.querySelector('#masterHandoff').hidden && document.querySelector('#masterPrompt').value.includes('风格化母版任务')`);
  if (!await evaluate(`document.querySelectorAll('.master-card').length === 0 && document.querySelector('#confirmMasters').disabled`)) throw new Error('Agent 回写前不应显示本地伪母版或允许确认');
  const { jobId: masterJobId, job: masterJob } = await productionJob('masters');
  if (masterJob.package.confirmations.masters || masterJob.package.elements.some(element => !element.selected.referenceApproved)) throw new Error('母版任务未携带参考确认或提前确认母版');
  await returnMastersResult();
  await waitExpression(`document.querySelector('#masterHandoff').hidden && document.querySelectorAll('.master-card').length === document.querySelectorAll('.element-slot').length && !document.querySelector('#confirmMasters').disabled`);
  if (!await evaluate(`document.querySelector('[data-master-slot="B1"] .reference-figure img') && document.querySelector('[data-master-slot="B1"] .master-figure img')`)) throw new Error('品牌参考与 Agent 母版未并排显示');
  if (!await evaluate(`[...document.querySelectorAll('.master-figure img')].every(image => image.src.includes('/masters/') && image.complete && image.naturalWidth > 0)`)) throw new Error('母版未使用 Agent 回写的真实文件');
  await evaluate(`(() => { const select = document.querySelector('.master-card select'); select.value = 'accent'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  if (!await evaluate(`document.querySelector('.master-card .master-figure img').src.includes('/accent.svg') && !document.querySelector('.master-card .variant-accent') && document.querySelector('[data-step="preview"]').disabled`)) throw new Error('Agent 母版变体或未确认预览闸门不正确');
  await sleep(500);
  const masterShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-redraw.png'), Buffer.from(masterShot.data, 'base64'));
  await evaluate(`document.querySelector('#confirmMasters').click(); document.querySelector('#saveDraft').click()`);
  await waitExpression(`!document.querySelector('#preview').hidden && !document.querySelector('#generateSamples').disabled`);
  if (!await evaluate(`!!localStorage.getItem('motion-layer-draft')`)) throw new Error('候选方案未保存');
  if (!await evaluate(`document.querySelectorAll('.sample-plan-card').length === 2 && document.querySelector('[data-sample-plan="opening"]').textContent.includes('先建立可转让的凭证。') && document.querySelector('[data-sample-plan="mechanism"]').textContent.includes('过期后失效。')`)) throw new Error('代表样片计划未使用本期 Agent 分镜与真实旁白');
  if (!await evaluate(`!document.querySelector('#sampleFrame').hasAttribute('src') && document.querySelector('#confirmSamples').disabled && document.querySelector('[data-step="film"]').disabled`)) throw new Error('样片回写前不应显示播放器或解锁全片');
  const prematureFilm = await evaluate(`fetch('/api/production-jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stage: 'film', package: storyboardInput() }) }).then(async response => ({ status: response.status, body: await response.json() }))`);
  if (prematureFilm.status !== 400 || !prematureFilm.body.error.includes('两段代表样片确认')) throw new Error('服务端未阻止未确认样片的全片任务');

  await evaluate(`document.querySelector('#generateSamples').click()`);
  await waitExpression(`!document.querySelector('#sampleHandoff').hidden && document.querySelector('#samplePrompt').value.includes('两段代表样片')`);
  const { jobId: samplesJobId, job: samplesJob } = await productionJob('samples');
  const packet = samplesJob.package;
  if (packet.agentJobId !== productJobId || packet.agentAnalysis?.jobId !== productJobId) throw new Error('制作整包未追溯本期 Agent 拆解');
  const expectedSelected = await evaluate(`document.querySelectorAll('.element-slot').length`);
  if (packet.elements.filter(element => element.selected).length !== expectedSelected) throw new Error('已选元素未全部写入制作整包');
  if (!packet.confirmations?.storyboard || !packet.confirmations?.references || !packet.confirmations?.masters || packet.confirmations?.samples) throw new Error('三项确认或样片未确认状态未正确写入');
  if (packet.elements.some(element => !element.selected.referenceApproved || !element.selected.master?.approved)) throw new Error('参考或母版确认未逐项写入制作整包');
  if (packet.elements.some(element => element.selected.master.agentJobId !== masterJobId || !element.selected.master.previewUrl.includes(`/production-jobs/${masterJobId}/masters/`))) throw new Error('后续制作整包未追溯 Agent 真实母版');
  if (packet.elements[0].slotId !== 'G0' || packet.elements[0].selected.visualKind !== 'generic' || packet.elements[0].selected.master.variant !== 'accent') throw new Error('G0 推荐或母版变体未写入制作整包');
  if (packet.profile.name !== 'Component Demo' || packet.motion.intensity !== 'balanced' || packet.beats.length !== 5 || !packet.beats.every(beat => beat.narration && beat.note && Array.isArray(beat.assetIds))) throw new Error('产品档案、五拍或原始旁白资产信息未完整写入');
  const editedConcept = packet.elements.find(element => element.slotId === 'N1');
  if (editedConcept?.action !== '绘制、展开、确权' || editedConcept?.query !== 'document') throw new Error('同屏修正的语义与检索词未写入制作整包');

  await returnSamplesResult();
  await waitExpression(`!document.querySelector('#sampleWorkspace').hidden && document.querySelector('#sampleFrame').src.includes('${samplesJobId}/opening/') && document.querySelector('#sampleFrame').contentDocument?.querySelector('[data-real-sample="opening"]')`);
  if (!await evaluate(`!document.querySelector('#sampleBrief').hidden && document.querySelector('#sampleBrief').textContent.includes('只调用已确认母版') && document.querySelector('#confirmSamples').disabled`)) throw new Error('design brief 缺失，或只查看开场就允许确认');
  const sampleShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-samples.png'), Buffer.from(sampleShot.data, 'base64'));
  await evaluate(`document.querySelector('[data-sample="mechanism"]').click()`);
  await waitExpression(`document.querySelector('#sampleFrame').src.includes('${samplesJobId}/mechanism/') && document.querySelector('#sampleFrame').contentDocument?.querySelector('[data-real-sample="mechanism"]') && !document.querySelector('#confirmSamples').disabled`);
  if (await evaluate(`document.querySelector('#sampleFrame').src.includes('motion-study')`)) throw new Error('代表样片仍指向通用演示');
  await evaluate(`document.querySelector('#confirmSamples').click()`);
  await waitExpression(`!document.querySelector('#film').hidden && !document.querySelector('[data-step="film"]').disabled && !document.querySelector('#generateFilm').disabled`);

  await evaluate(`document.querySelector('#generateFilm').click()`);
  await waitExpression(`!document.querySelector('#filmHandoff').hidden && document.querySelector('#filmPrompt').value.includes('全片预览任务')`);
  const { jobId: filmJobId, job: filmJob } = await productionJob('film');
  if (!filmJob.package.confirmations.samples || filmJob.package.sampleResult?.samples?.length !== 2 || filmJob.package.sampleResult.jobId !== samplesJobId) throw new Error('全片任务未携带两段样片结果与明确确认');
  await returnFilmResult();
  await waitExpression(`!document.querySelector('#filmWorkspace').hidden && document.querySelector('#filmFrame').src.includes('${filmJobId}/film/') && document.querySelector('#filmFrame').contentDocument?.querySelector('[data-real-film="true"]')`);
  if (await evaluate(`document.querySelector('#filmFrame').src.includes('motion-study') || document.querySelector('#filmFrame').contentDocument.body.dataset.playerError`)) throw new Error('全片未指向本期真实网页或存在脚本错误');
  if (errors.length) throw new Error(`浏览器存在 ${errors.length} 个脚本异常`);

  const metrics = await cdp('Page.getLayoutMetrics');
  const height = Math.min(5000, Math.ceil(metrics.cssContentSize.height));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height, deviceScaleFactor: 1, mobile: false });
  await sleep(500);
  const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
  writeFileSync(path.join(root, 'qa', 'studio-film.png'), Buffer.from(screenshot.data, 'base64'));

  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('[data-step="preview"]').click(); document.querySelector('#saveDraft').click()`);
  await waitExpression(`!document.querySelector('#draftNotice').hidden && JSON.parse(localStorage.getItem('motion-layer-draft')).filmResult?.jobId === '${filmJobId}'`);
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/studio/` });
  await waitExpression(`document.readyState === 'complete' && !document.querySelector('#draftNotice').hidden && !document.querySelector('#loadDraft').disabled`);
  await evaluate(`document.querySelector('#loadDraft').click()`);
  await waitExpression(`!document.querySelector('#preview').hidden && document.querySelector('#sampleFrame').src.includes('${samplesJobId}/') && !document.querySelector('[data-step="film"]').disabled`);
  if (!await evaluate(`state.confirmations.storyboard && state.confirmations.references && state.confirmations.masters && state.confirmations.samples && state.viewedSamples.opening && state.viewedSamples.mechanism && state.filmResult?.jobId === '${filmJobId}'`)) throw new Error('刷新后未恢复确认、查看状态或制作结果');
  await evaluate(`document.querySelector('[data-step="elements"]').click()`);
  if (!await evaluate(`document.querySelectorAll('#elements .candidate.selected').length === ${expectedSelected} && document.querySelector('[data-slot="B1"] .candidate.selected img') && document.querySelector('#referenceSheet').textContent.includes('G0-A')`)) throw new Error('刷新后未恢复参考选择、品牌或确认单');
  await evaluate(`document.querySelector('[data-step="redraw"]').click()`);
  if (!await evaluate(`document.querySelectorAll('.master-card').length === ${expectedSelected} && document.querySelector('.master-card .master-figure img').src.includes('/accent.svg') && state.masterResult?.jobId === '${masterJobId}'`)) throw new Error('刷新后未恢复 Agent 母版或真实变体');
  await evaluate(`document.querySelector('[data-step="film"]').click()`);
  await waitExpression(`!document.querySelector('#film').hidden && document.querySelector('#filmFrame').src.includes('${filmJobId}/film/') && document.querySelector('#filmFrame').contentDocument?.querySelector('[data-real-film="true"]')`);
  const restoredShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(path.join(root, 'qa', 'studio-draft-restored.png'), Buffer.from(restoredShot.data, 'base64'));

  await evaluate(`(() => {
    document.querySelector('[data-step="motion"]').click();
    document.querySelector('[data-setting="intensity"] [data-value="showreel"]').click();
    const gather = document.querySelector('[data-beat="gather"]');
    gather.querySelector('[data-field="label"]').value = '开场聚集';
    gather.querySelector('[data-field="label"]').dispatchEvent(new Event('input', { bubbles: true }));
    gather.querySelector('[data-field="duration"]').value = 4;
    gather.querySelector('[data-field="duration"]').dispatchEvent(new Event('input', { bubbles: true }));
    const trigger = document.querySelector('[data-beat="trigger"] [data-field="action"]');
    trigger.value = 'direct-press'; trigger.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  if (!await evaluate(`document.querySelector('#generateSamples').disabled && document.querySelector('[data-step="elements"]').disabled && document.querySelector('[data-step="redraw"]').disabled && document.querySelector('[data-step="preview"]').disabled && document.querySelector('[data-step="film"]').disabled && !document.querySelector('#sampleFrame').hasAttribute('src') && !document.querySelector('#filmFrame').hasAttribute('src')`)) throw new Error('修改分镜后样片、全片与下游确认未全部失效');
  await evaluate(`document.querySelector('#confirmMotion').click()`);
  await waitExpression(`!document.querySelector('#elements').hidden && !document.querySelector('#buildReferenceSheet').disabled`, 30000);
  await evaluate(`document.querySelector('#buildReferenceSheet').click(); document.querySelector('#confirmReferences').click()`);
  await waitExpression(`!document.querySelector('#masterHandoff').hidden && document.querySelector('#masterPrompt').value.includes('风格化母版任务')`);
  await returnMastersResult();
  await waitExpression(`document.querySelector('#masterHandoff').hidden && !document.querySelector('#confirmMasters').disabled`);
  await evaluate(`document.querySelector('#confirmMasters').click(); document.querySelector('#saveDraft').click(); document.querySelector('#generateSamples').click()`);
  await waitExpression(`!document.querySelector('#sampleHandoff').hidden && document.querySelector('#samplePrompt').value`);
  const { job: editedJob } = await productionJob('samples');
  const edited = editedJob.package;
  if (edited.motion.intensity !== 'showreel' || edited.beats[0].label !== '开场聚集' || edited.beats[0].duration !== 4 || edited.beats[0].narration !== '先建立可转让的凭证。' || edited.beats[1].action !== 'direct-press') throw new Error('修改后的分镜、强度与原始旁白未正确进入新样片任务');
  if (!await evaluate(`JSON.parse(localStorage.getItem('motion-layer-draft')).beats?.length === 5`)) throw new Error('五拍编辑未保存到草稿');

  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/studio/demo/player.html?scene=motion-study&export=1` });
  await waitExpression(`document.readyState === 'complete' && document.querySelector('[data-scene="motion-study"]') && typeof window.__seek === 'function'`);
  const darkFrames = [[2, 'motion-dark.png'], [4.7, 'motion-dark-trigger.png'], [10, 'motion-dark-modules.png'], [15, 'motion-dark-selected.png'], [18, 'motion-dark-ending.png']];
  for (const [time, name] of darkFrames) {
    await evaluate(`window.__seek(${time})`);
    if (await evaluate(`document.body.dataset.playerError || ''`)) throw new Error('深色样片播放器存在脚本错误');
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path.join(root, 'qa', name), Buffer.from(screenshot.data, 'base64'));
  }
  await evaluate(`window.__seek(4.45)`);
  const pointerRect = await evaluate(`(() => { const r = document.querySelector('[data-pointer]').getBoundingClientRect(); return { x: r.x - 30, y: r.y - 30, width: r.width + 60, height: r.height + 60 }; })()`);
  const pointerShot = await cdp('Page.captureScreenshot', { format: 'png', clip: { ...pointerRect, scale: 3 } });
  writeFileSync(path.join(root, 'qa', 'pointer-dark.png'), Buffer.from(pointerShot.data, 'base64'));
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/assets/template/player.html?scene=motion-study&export=1` });
  await waitExpression(`document.readyState === 'complete' && typeof window.__seek === 'function'`);
  await evaluate(`window.__seek(4.45)`);
  const lightPointerRect = await evaluate(`(() => { const r = document.querySelector('[data-pointer]').getBoundingClientRect(); return { x: r.x - 30, y: r.y - 30, width: r.width + 60, height: r.height + 60 }; })()`);
  const lightPointerShot = await cdp('Page.captureScreenshot', { format: 'png', clip: { ...lightPointerRect, scale: 3 } });
  writeFileSync(path.join(root, 'qa', 'pointer-light.png'), Buffer.from(lightPointerShot.data, 'base64'));

  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/studio/` });
  await waitExpression(`document.readyState === 'complete' && !!document.querySelector('#startMotion')`);
  await evaluate(`(() => {
    document.querySelector('[data-mode="generic"]').click();
    const script = document.querySelector('#scriptInput'); script.value = 'AsterQuark 与 Northstar 建立连接。'; script.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#startMotion').click();
  })()`);
  await waitExpression(`!document.querySelector('#agentHandoff').hidden && document.querySelector('#agentPrompt').value`);
  await returnAgentAnalysis({ brands: [{ name: 'AsterQuark', query: 'asterquark' }, { name: 'Northstar', query: 'northstar' }] });
  await waitExpression(`!document.querySelector('#agentAnalysis').hidden && !document.querySelector('#confirmMotion').disabled`);
  await evaluate(`document.querySelector('#confirmMotion').click()`);
  await waitExpression(`['B1', 'B2'].every(id => document.querySelector('[data-slot="' + id + '"] .candidates'))`, 30000);
  if (!await evaluate(`document.querySelector('[data-slot="B1"] .slot-title b').textContent.startsWith('AsterQuark') && document.querySelector('[data-slot="B2"] .slot-title b').textContent.startsWith('Northstar')`)) throw new Error('Agent 未自动返回未预置的新品牌');
  if (await evaluate(`[...document.querySelectorAll('[data-slot^="B"]')].some(slot => slot.querySelector('.local-preview') || !slot.querySelector('.candidate-rights'))`)) throw new Error('品牌候选不得使用近似几何回退');

  const darkOutput = path.join(root, 'qa', 'motion-dark.png');
  console.log('PASS 整包交接、Agent 分镜与素材、三次确认、品牌母版和完整预览');
  console.log(`元素预览：远程 ${previewStats.remote}，本地回退 ${previewStats.local}`);
  console.log(output);
  console.log(darkOutput);
} catch (error) {
  console.error(error);
  if (ws) {
    try {
      const diagnostic = await evaluate(`({ page: document.querySelector('[data-page]:not([hidden])')?.dataset.page, slots: [...document.querySelectorAll('.element-slot')].map(slot => ({ id: slot.dataset.slot, status: slot.querySelector('.slot-status')?.textContent || '', candidates: slot.querySelectorAll('.candidate').length })), sampleJob: document.querySelector('#samplePrompt')?.value || '', filmJob: document.querySelector('#filmPrompt')?.value || '' })`);
      console.error(JSON.stringify(diagnostic, null, 2));
      if (errors.length) console.error(JSON.stringify(errors, null, 2));
      const failureShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(path.join(root, 'qa', 'studio-error.png'), Buffer.from(failureShot.data, 'base64'));
    } catch { /* preserve the original failure */ }
  }
  throw error;
} finally {
  if (ws) ws.close();
  for (const child of children.reverse()) { if (!child.killed) child.kill('SIGTERM'); }
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
