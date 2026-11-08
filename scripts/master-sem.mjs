// Cheese Motion · 母版语义清单生成器（**按期存放**）
//
// 为什么要有它：
//   母版一旦被确认，它在画面里的语义就固定了 —— 一期的 N7 永远是云，
//   不能因为「看起来像一团曲线」就被当成人声来用（缺陷 16 的原形）。
//
// ⚠ 为什么必须「按期」：
//   槽位号（N1、N2…）是**每期重新分配**的 —— 这一期 N7 是云，下一期 N7 可能是任务卡。
//   如果把字典写成一个全局表，下一期一改，上一期的语义护栏当场失效
//   （「云不能当人声」变成「任务卡不能当人声」，上一期的画面失去校验）。
//   权威字典因此放在**本期** masters/sem.json 里，由本期 analysis 的资产声明生成，
//   检索期、绘制期、校验期读同一份 —— 跨期不共享。
//
// 产出：<母版任务>/masters/sem.json —— 每个槽位是什么图形、能承担哪些画面角色。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { semOf, semCanPlay, SEM_ROLE_RULES, SEM_TAGS } from '../templates/kit/master.js';

const jobDir = process.argv[2];
if (!jobDir) throw new Error('用法：node scripts/master-sem.mjs <母版任务目录>');
const dir = path.resolve(jobDir);
const manifestFile = path.join(dir, 'masters.json');
if (!existsSync(manifestFile)) throw new Error(`找不到母版清单：${manifestFile}`);
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : (manifest.masters || manifest.elements || []);

/* 本期 analysis 的资产声明 —— 本期语义字典的权威来源 */
let assets = [];
const jobFile = path.join(dir, 'job.json');
if (existsSync(jobFile)) {
  try {
    const job = JSON.parse(readFileSync(jobFile, 'utf8'));
    assets = job?.package?.agentAnalysis?.assets || [];
  } catch { /* 读不到就退回全局字典 */ }
}
const assetById = new Map(assets.map(asset => [asset.id, asset]));

const rows = [];
for (const entry of entries) {
  const slotId = entry.slotId || entry.id;
  if (!slotId) continue;
  const asset = assetById.get(slotId);
  /* 本期声明优先；本期没声明才回退全局默认（老期兼容），都没有就留空并标出来 */
  const sem = (asset && asset.sem) || semOf(slotId) || null;
  const roles = Object.entries(SEM_ROLE_RULES)
    .filter(([, allowed]) => !sem || allowed.includes(sem))
    .map(([role]) => role);
  rows.push({
    slotId,
    sem,
    concept: asset?.concept || entry.concept || null,
    kind: asset?.visualKind || entry.kind || null,
    roles: roles.length ? roles : ['subject', 'state', 'ambient'],
    source: asset?.sem ? '本期 analysis 资产声明' : (semOf(slotId) ? '全局默认字典（本期未声明）' : null),
    note: sem ? null : '未登记语义字典 —— 需人工确认这个母版到底是什么图形'
  });
}

mkdirSync(path.join(dir, 'masters'), { recursive: true });
const out = {
  version: 2,
  generatedAt: new Date().toISOString(),
  source: '本期 analysis 资产声明（templates/kit/master.js#SEM_TAGS 校验词表）',
  semanticTags: [...SEM_TAGS],
  masters: rows
};
writeFileSync(path.join(dir, 'masters', 'sem.json'), `${JSON.stringify(out, null, 2)}\n`, 'utf8');
const unknown = rows.filter(row => !row.sem);
const fromGlobal = rows.filter(row => row.source && row.source.startsWith('全局默认'));
console.log(`母版语义清单已生成 → ${path.join(dir, 'masters', 'sem.json')}（${rows.length} 个槽位`
  + `${unknown.length ? `，${unknown.length} 个未登记语义` : ''}`
  + `${fromGlobal.length ? `，${fromGlobal.length} 个沿用全局默认（本期未声明，建议补声明）` : ''}）`);
