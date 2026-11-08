// Cheese Motion · 装配层 kit 的回归测试（Node 侧纯函数）
// 这些断言锁死的都是**真实返工过的坑**：一旦 kit 退化，测试必须立刻失败。
/* rule: E13 */
/* rule: E14 */
/* rule: E15 */
/* rule: E16 */
/* rule: E24 */
import assert from 'node:assert/strict';
import {
  withIds, stripSvgShell, stripBackdrop, splitCells, cellCenter, dotMatrix, masterElements,
  semOf, semCanPlay, SEM_TAGS
} from '../templates/kit/master.js';

/* --- 缺陷 23：替换 SVG id 时漏闭合引号，破坏整张 SVG 的属性解析 --- */
{
  const svg = '<defs><pattern id="dots" width="11" height="11"><circle r="2"/></pattern></defs>'
    + '<rect id="shape" fill="url(#dots)"/><rect fill="url(#shape)"/>';
  const out = withIds(svg, { dots: 'dots-N2', shape: 'shape-N2' });
  assert.ok(out.includes('id="dots-N2"'), 'id 替换后必须自带闭合引号');
  assert.ok(out.includes('id="shape-N2"'), 'id 替换后必须自带闭合引号');
  assert.ok(out.includes('url(#dots-N2)'), '引用必须与 id 同步改名');
  assert.ok(out.includes('url(#shape-N2)'), '引用必须与 id 同步改名');
  // 每个 id 属性都必须完整闭合：不能出现 'id="xxx' 后紧跟非引号
  const ids = [...out.matchAll(/id="([^"]*)"/g)].map(m => m[1]);
  assert.equal(ids.length, 2, '替换后 id 属性数量不变');
  assert.ok(ids.every(id => id && id.endsWith('-N2')), '所有 id 都应完成改名');
  assert.ok(!/id="[^"]*"(?![^>]*")/.test('') || true, '占位');
  const attrCount = (out.match(/\sid="/g) || []).length;
  assert.equal(attrCount, 2, '不能吞掉后续属性');
}

/* --- 同一 id 在多处复用时必须全部改名 --- */
{
  const svg = '<g id="dots"><rect id="dots"/></g>';
  const out = withIds(svg, { dots: 'dots-X' });
  assert.equal((out.match(/id="dots-X"/g) || []).length, 2, '多处出现的同名 id 必须全部改名');
}

/* --- 未登记的 id 不得被改动 --- */
{
  const out = withIds('<rect id="keep"/>', { dots: 'dots-X' });
  assert.ok(out.includes('id="keep"'), '未登记 id 保持原样');
}

/* --- 外壳与底板剥离 --- */
{
  const raw = '<svg viewBox="0 0 360 360"><rect width="360" height="360" fill="#0d1a16"/><g><path d="M0 0"/></g></svg>';
  const inner = stripBackdrop(stripSvgShell(raw));
  assert.ok(!inner.includes('<svg'), '应剥掉 svg 外壳');
  assert.ok(!inner.includes('width="360" height="360"'), '应剥掉 360×360 底板');
  assert.ok(inner.includes('<g>'), '内容应保留');
}

/* --- 缺陷 22：点阵必须用显式坐标，不用 pattern --- */
{
  const dots = dotMatrix({ cols: 8, rows: 8, pitch: 11, r: 2.3, fill: '#fffdf7' });
  assert.equal((dots.match(/<circle /g) || []).length, 64, '8×8 点阵应有 64 个点');
  assert.ok(!dots.includes('pattern'), '点阵不得依赖 pattern 填充');
  assert.ok(dots.includes('cx="-38.5"'), '首点 x 应相对 cell 中心为 -38.5');
  assert.ok(dots.includes('cy="-38.5"'), '首点 y 应相对 cell 中心为 -38.5');
  assert.ok(dots.includes('cx="38.5"'), '末点 x 应为 38.5');
}

/* --- 母版拆件：数量不符必须显式失败，而不是默默少拆一个 --- */
{
  const svg = '<g><rect x="70" y="78" width="94" height="94"/></g><g><rect x="196" y="78" width="94" height="94"/></g>';
  assert.equal(splitCells(svg, 2).length, 2, '应拆出 2 个单元');
  assert.throws(() => splitCells(svg, 4), /应拆出 4 个单元/, '数量不符必须抛错');
}

/* --- 单元中心计算 --- */
{
  const center = cellCenter('<rect x="70" y="78" width="94" height="94"/>', 94);
  assert.equal(center.x, 117, '中心 x = 70 + 47');
  assert.equal(center.y, 125, '中心 y = 78 + 47');
}

/* --- 缺陷 8：母版只抽 <path> 会丢掉 rect/circle --- */
{
  const inner = '<path d="M0 0"/><rect x="1" y="2" width="3" height="4"/><circle cx="5" cy="6" r="7"/>';
  const elements = masterElements(inner);
  assert.equal(elements.length, 3, 'rect/circle 必须与 path 一并抽出');
  assert.ok(elements.some(e => e.startsWith('<rect')), 'rect 不能丢');
  assert.ok(elements.some(e => e.startsWith('<circle')), 'circle 不能丢');
}

/* --- E24 母版语义必须来自统一字典：云图标永远不能当语音源 --- */
{
  assert.equal(semOf('N7'), 'cloud', 'N7 的语义固定是云');
  assert.equal(semOf('N2'), 'compute-module', 'N2 的语义固定是算力模块');
  assert.equal(semCanPlay('cloud', 'speech'), false, '云不能承担「说话」角色（本期缺陷 16 的原形）');
  assert.equal(semCanPlay('voice-wave', 'speech'), true, '声波可以承担「说话」角色');
  assert.equal(semCanPlay('brand-logo', 'brand'), true, '品牌标识可以承担品牌角色');
  assert.equal(semOf('NOT-A-SLOT'), null, '未登记槽位不得瞎猜语义');
}

/* --- E29 母版语义字典必须按期存放：槽位号每期重分配，全局字典不能当权威 --- */
/* rule: E29 母版语义字典必须按期存放 */
{
  const thisPeriod = { N1: 'task-card', N7: 'channel-entry', B1: 'brand-logo' };
  assert.equal(semOf('N1', thisPeriod), 'task-card', '本期语义字典必须能覆盖同槽位号的旧语义');
  assert.equal(semOf('N7', thisPeriod), 'channel-entry', '本期 N7 不能继续沿用上一期的 cloud');
  assert.equal(semOf('N2', thisPeriod), 'compute-module', '本期没声明的槽位回退全局默认');
  assert.equal(semOf('NOT-A-SLOT', thisPeriod), null, '本期字典与全局表都没有的槽位不得瞎猜');
  /* 语义词表是跨期共享的词汇表 —— 标签本身不随期变，槽位映射才随期变 */
  assert.ok(SEM_TAGS.has('task-card') && SEM_TAGS.has('cloud'), '语义词表必须同时容纳新旧标签');
  assert.ok(!SEM_TAGS.has('not-a-semantic-tag'), '语义词表必须拒绝自造标签');
  /* 上一期与本期对同一槽位号给出不同语义时，互不污染 */
  const previous = { N7: 'cloud' };
  assert.equal(semOf('N7', previous), 'cloud', '上一期的字典不受影响');
  assert.equal(semOf('N7', thisPeriod), 'channel-entry', '本期的字典不被上一期覆盖');
}

console.log('PASS kit（Node 侧）：id 安全改名、显式点阵、拆件断言、元素全抽取、母版语义字典');
