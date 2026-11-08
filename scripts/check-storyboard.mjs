#!/usr/bin/env node
// Cheese Motion · 分镜自检 CLI（对话路径）
//
// 为什么要有它：
//   表A–F 的校验（E01–E05）原来只长在 agent-flow.mjs 里 —— 也就是**只在设计台路径**
//   （job.json → analysis.json）生效。用户直接在对话里给一份 SRT 时，一条都不走。
//   这个 CLI 让对话路径也能自检同一套约束：两个路径调用同一个纯函数模块
//   （templates/kit/storyboard-contract.js），不会再漂移。
//
// 用法：node scripts/check-storyboard.mjs <storyboard.json>
//   storyboard.json 结构：
//   {
//     "designCard": { "motherStructure": "", "morphTrack": "", "span": "", "carry": "", "stillFrame": "" },
//     "beats":      [ { "id": "b01", "duration": 3, "focus": "", "verb": "", "relation": "", "soundCue": "", "carry": "" } ],
//     "carryTable": [ { "boundary": "", "survivor": "", "method": "", "detail": "", "becomes": "" } ]
//   }
// 退出码：0 = 通过；1 = 有违规（stderr 逐条列出）
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { checkStoryboard, CARRY_METHODS, LONG_FILM_BEATS, LONG_FILM_CARRY_ROWS } from '../templates/kit/storyboard-contract.js';

const args = process.argv.slice(2);
const segment = args.includes('--segment');
const target = args.find(arg => !arg.startsWith('--'));
if (!target || args.includes('--help') || args.includes('-h')) {
  console.log('用法：node scripts/check-storyboard.mjs <storyboard.json> [--segment]');
  console.log('  校验表A–F 的填表结果：设计卡五字段、逐拍唯一焦点与合法动词、承接表手法枚举与反退化。');
  console.log('  --segment：校验单段样片（允许只有两拍；整片口径是 3–40 拍）。');
  process.exit(target ? 0 : 1);
}

const file = path.resolve(target);
let payload;
try {
  payload = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`FAIL 读不到分镜文件或不是合法 JSON：${file}\n  ${error.message}`);
  process.exit(1);
}

try {
  const result = checkStoryboard(payload, segment ? { minBeats: 2 } : {});
  const longFilm = result.beats.length > LONG_FILM_BEATS;
  console.log(`PASS 分镜自检：${result.beats.length} 拍，承接表 ${result.carryTable.length} 行`);
  console.log(`  承接手法：${[...new Set(result.carryTable.map(row => row.method))].join(' / ')}`);
  console.log(`  表E 填法：${longFilm ? `长片降填（${LONG_FILM_BEATS} 拍以上，只填语义段落边界 ${LONG_FILM_CARRY_ROWS.min}–${LONG_FILM_CARRY_ROWS.max} 行）` : '逐边界全填'}`);
} catch (error) {
  console.error(`FAIL 分镜自检未通过：${error.message}`);
  console.error(`  合法手法枚举：${[...CARRY_METHODS].join(' / ')}`);
  process.exit(1);
}
