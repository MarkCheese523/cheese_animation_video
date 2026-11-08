/* Cheese Motion · 装配层 kit（Node 侧 · 母版与页面）
 *
 * 定位：把「母版怎么读、点阵怎么铺、页面骨架怎么生成」从每期 builder 里抽出来。
 * 每期 builder 只提供本期数据（拍次时间、母版 slug、场景描述）。
 *
 * 封住的历史陷阱：
 *   1) 替换 SVG id 漏闭合引号 → 属性值吞掉后续属性，整张 SVG 解析破坏，
 *      实心件的「反色点阵」母版语言整个失效并飘出幽灵元素（缺陷 23）。
 *      本模块的 withIds() 统一处理，替换结果自带闭合引号。
 *   2) 点阵用 pattern 填充 → patternUnits="userSpaceOnUse" 的原点被浏览器
 *      绑到 pattern 的定义处，同一个 pattern 被多处复用时除首个外全部错位（缺陷 22）。
 *      需要复用的点阵一律用 dotMatrix() 的显式坐标，不用 pattern。
 *   3) 母版只抽 <path>，丢掉 rect/circle → 图标只剩轮廓残骸（缺陷 8）。
 *      masterElements() 统一抽取全部可绘制元素。
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

/* ------------------------------------------------------------------ *
 * 母版语义字典（**按期存放**，不是全局按槽位号）
 * ------------------------------------------------------------------ */

/**
 * 每个母版槽位到底是什么图形。
 * 这张表的价值：母版一旦被确认，它在画面里的语义就固定了 —— N7 永远是云，
 * 不能因为「看起来像一团曲线」就被当成人声来用（本期缺陷 16 的原形）。
 * 检索期选参考、绘制期落母版、校验期判角色，三处都用同一份字典。
 *
 * ⚠ 关键：槽位号（N1、N2…）是**每期重新分配**的 ——
 * 上一期 N7 是云，这一期 N7 可能是任务卡。所以字典不能是全局的：
 * 全局字典会被下一期静默改写，把上一期的「云不能当人声」判成「任务卡」，
 * 上一期的画面当场失去语义护栏。**权威字典必须放在本期 masters/sem.json**，
 * 由 scripts/master-sem.mjs 从本期 analysis 的资产声明生成。
 * 这里的 MASTER_SEM 只是**兜底默认值**（给没有 sem.json 的老期用）。
 */
/* rule: E24 母版语义必须来自统一字典 */
/* rule: E29 母版语义字典必须按期存放 */
export const MASTER_SEM = {
  N1: 'server-room',
  N2: 'compute-module',
  N3: 'device',
  N4: 'chip',
  N5: 'split-module',
  N6: 'train-carriage',
  N7: 'cloud',
  N8: 'signal-offline',
  N9: 'privacy-lock',
  N10: 'latency-clock',
  G0: 'figure',
  B1: 'brand-logo',
  B2: 'brand-logo',
  B3: 'brand-logo'
};

/** 读取某一期的母版语义字典（<mastersDir>/masters/sem.json）。读不到就返回空表。 */
export function loadSemMap(mastersDir) {
  try {
    const file = path.join(mastersDir, 'masters', 'sem.json');
    const json = JSON.parse(readFileSync(file, 'utf8'));
    const rows = Array.isArray(json) ? json : (json.masters || []);
    const map = {};
    for (const row of rows) {
      const slotId = row?.slotId || row?.id;
      if (slotId && row.sem) map[slotId] = row.sem;
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * 母版槽位的语义标签。未知槽位返回 null（不猜）。
 * @param {string} slotId
 * @param {object} [semMap] 本期语义字典（loadSemMap 的结果）；不给则回退全局默认
 */
export function semOf(slotId, semMap) {
  if (semMap && Object.prototype.hasOwnProperty.call(semMap, slotId)) return semMap[slotId];
  return Object.prototype.hasOwnProperty.call(MASTER_SEM, slotId) ? MASTER_SEM[slotId] : null;
}

/**
 * 语义标签词表：素材「到底是什么图形」只能取自这张表。
 * 检索期选参考、绘制期落母版、校验期判角色，三处共用同一份词表 ——
 * 标签不在表内就只能人工确认，不许自由发挥。
 */
export const SEM_TAGS = new Set([
  /* 上一期（端侧 AI）的语义标签 */
  'server-room', 'compute-module', 'device', 'chip', 'split-module',
  'train-carriage', 'cloud', 'signal-offline', 'privacy-lock', 'latency-clock',
  /* 本期（多任务协调）的语义标签 */
  'task-card', 'agent-window', 'capability-chip', 'router-node', 'worker-cell',
  'operator-figure', 'channel-entry', 'harness-shell', 'stack-layer', 'attention-mark',
  /* 通用 */
  'figure', 'brand-logo', 'voice', 'voice-wave', 'speech', 'waveform'
]);

/**
 * 语义角色约束：某个语义标签能不能承担某个画面角色。
 * 用于把「画面语义与旁白反相」这类错误挡在选参考阶段（而不是第 4 拍才发现）。
 */
export const SEM_ROLE_RULES = {
  speech: ['voice', 'voice-wave', 'speech', 'waveform'],
  brand: ['brand-logo'],
  figure: ['figure', 'operator-figure'],
  compute: ['compute-module', 'split-module', 'chip']
};

/** 判断某语义标签能否承担某角色。 */
export function semCanPlay(sem, role) {
  const allowed = SEM_ROLE_RULES[role];
  if (!allowed) return true;          // 该角色没有硬约束（如 subject / state）
  return allowed.includes(sem);
}

/* ------------------------------------------------------------------ *
 * id 安全改名
 * ------------------------------------------------------------------ */

/** 把 SVG 里出现的 id 与引用同步改名，且替换值自带闭合引号。 */
/* rule: E13 母版 id 改名必须自带闭合引号 */
export function withIds(svg, map) {
  let out = String(svg).replace(/id="([^"]+)"/g, (match, id) => (
    Object.prototype.hasOwnProperty.call(map, id) ? `id="${map[id]}"` : match
  ));
  out = out.replace(/url\(#([^)]+)\)/g, (match, id) => (
    Object.prototype.hasOwnProperty.call(map, id) ? `url(#${map[id]})` : match
  ));
  return out;
}

/** 去掉最外层 <svg> 壳，保留内部内容。 */
export function stripSvgShell(svg) {
  return String(svg).replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

/** 去掉母版的 360×360 底板矩形（背景由场景层负责）。 */
export function stripBackdrop(inner) {
  return String(inner).replace(/<rect width="360" height="360" fill="[^"]*"\/>/, '');
}

/* ------------------------------------------------------------------ *
 * 母版读取
 * ------------------------------------------------------------------ */

const DEFAULT_ID_MAP = slotId => ({
  dots: `dots-${slotId}`,
  shape: `shape-${slotId}`,
  dotsSolid: `dotsSolid-${slotId}`,
  shapeSolid: `shapeSolid-${slotId}`
});

/**
 * 读取一个母版变体，返回可直接内联进 SVG 的内部内容。
 * @param {string} mastersDir 母版生产任务目录（含 masters/ 子目录）
 * @param {string} slotId      槽位编号（如 N2 / B1）
 * @param {string} [slug]     变体（reverse / ink / accent / solid ...）
 */
export function loadMaster(mastersDir, slotId, slug = 'reverse') {
  const file = path.join(mastersDir, 'masters', slotId, `${slug}.svg`);
  const svg = readFileSync(file, 'utf8');
  return withIds(stripBackdrop(stripSvgShell(svg)), DEFAULT_ID_MAP(slotId));
}

/**
 * 抽取母版里全部可绘制元素（path / rect / circle / ellipse / line / polyline / polygon）。
 * 历史缺陷：母版生成器只抽 <path>，导致 rect/circle 结构件丢失。
 */
/* rule: E15 母版元素抽取必须含 rect/circle */
export function masterElements(inner) {
  const tags = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];
  const out = [];
  for (const tag of tags) {
    const re = new RegExp(`<${tag}\\b[^>]*?(?:/>|>[\s\\S]*?</${tag}>)`, 'g');
    for (const match of String(inner).matchAll(re)) out.push(match[0]);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 母版拆件
 * ------------------------------------------------------------------ */

/**
 * 把母版拆成若干单元（按无属性的 <g> 边界）。
 * 母版结构若变化，拆件数会对不上 —— 此时必须显式失败，而不是默默少拆一个。
 */
/* rule: E16 拆件数不符必须显式失败 */
export function splitCells(inner, expected) {
  const cells = [...String(inner).matchAll(/<g>\s*([\s\S]*?)\s*<\/g>/g)].map(match => match[1]);
  if (expected != null && cells.length !== expected) {
    throw new Error(`母版应拆出 ${expected} 个单元，实际 ${cells.length} —— 母版结构已变，拆件规则需同步更新。`);
  }
  return cells;
}

/** 取单元内主矩形的中心（母版 cell 用 94×94 结构件承载）。 */
export function cellCenter(cell, width = 94) {
  const rect = cell.match(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/);
  if (!rect) throw new Error('单元内未找到结构矩形，无法计算中心。');
  return { x: Number(rect[1]) + Number(rect[3]) / 2, y: Number(rect[2]) + Number(rect[4]) / 2, w: Number(rect[3]) };
}

/* ------------------------------------------------------------------ *
 * 点阵
 * ------------------------------------------------------------------ */

/**
 * 生成显式坐标的点阵（不用 pattern）。
 * patternUnits="userSpaceOnUse" 的原点会被 Chromium 绑到 pattern 的定义处，
 * 同一个 pattern 被多处复用时除首个元素外全部错位 —— 显式坐标是唯一可靠解。
 */
/* rule: E14 点阵必须用显式坐标，不得依赖 pattern */
export function dotMatrix(options = {}) {
  const { cols = 8, rows = 8, pitch = 11, r = 2.3, fill = '#fffdf7', cx = 0, cy = 0 } = options;
  const out = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = cx + (col - (cols - 1) / 2) * pitch;
      const y = cy + (row - (rows - 1) / 2) * pitch;
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}"/>`);
    }
  }
  return out.join('');
}
