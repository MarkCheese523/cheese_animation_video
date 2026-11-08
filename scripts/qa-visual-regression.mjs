// Cheese Motion · 视觉回归 CLI（Golden Frame 像素基线）
//
// 引擎与比对逻辑在 templates/kit/visual-regression.js（装配层只开发一次），
// 本文件只是命令行入口，方便单跑 / CI。
//
// 用法：
//   node scripts/qa-visual-regression.mjs <page-url> --baseline <dir> [--update]
//     [--times 0.8,3.6] [--threshold 12] [--tolerance 0.05]
//
//   --update  生成/刷新基线（只在用户验收之后由人手动执行，Agent 不得自行改基线）
//   不加      与已有基线比对，有显著差异则 exit 1 并输出 diff-*.png
import path from 'node:path';
import { runVisualRegression } from '../templates/kit/visual-regression.js';

const args = process.argv.slice(2);
const option = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const positional = args.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = args[index - 1];
  return !['--baseline', '--times', '--threshold', '--tolerance'].includes(previous);
});
const url = positional[0];
const baselineDir = option('baseline');
/* --update 只在命令行里真的出现时才算。
   （原来的写法 `flags.has('--update')` 恒为真 —— flags 是「取值型开关」的集合，
     于是每次跑都会自动刷新基线，「Agent 不得自行改基线」这条闸门形同虚设，
     视觉回归退化成「永远一致」。） */
const update = args.includes('--update');

if (!url || !baselineDir) {
  throw new Error('用法：node scripts/qa-visual-regression.mjs <page-url> --baseline <dir> [--update] [--times 0.8,3.6]');
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const times = option('times') ? option('times').split(',').filter(Boolean).map(Number) : undefined;

const outcome = await runVisualRegression({
  url,
  baselineDir,
  times,
  update,
  threshold: option('threshold') ? Number(option('threshold')) : undefined,
  tolerance: option('tolerance') ? Number(option('tolerance')) : undefined,
  repoRoot,
  log: line => console.log(line)
});

if (outcome.status === 'skipped') {
  console.log(`SKIP 视觉回归：${outcome.note}`);
  process.exit(0);
}
if (outcome.status === 'missing') {
  console.error(`视觉回归未通过：${outcome.note}`);
  process.exit(1);
}
if (update) {
  console.log(`视觉基线已更新 → ${outcome.baselineDir}（${outcome.times.length} 帧）`);
  process.exit(0);
}
if (outcome.status === 'drift') {
  console.log('\n视觉回归未通过：');
  for (const failure of outcome.failures) {
    console.log(`  [${failure.t}s] ${failure.reason}${failure.diffFile ? ` → ${failure.diffFile}` : ''}`);
  }
  console.log('\n提示：画面如果是有意改的，请由人在验收后手动跑 --update 刷新基线；Agent 不得自行改基线。');
  process.exit(1);
}
console.log(`visual-regression: ${outcome.times.length} 帧与基线一致（${outcome.note}）`);
