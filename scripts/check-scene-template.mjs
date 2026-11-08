// Cheese Motion · 场景模板结构校验器
//
// 为什么需要：场景代码是一段**模板字面量**，里面混着 ${...} 插值与纯文本的
// 括号/引号。插值一旦少一个 } 或数组少一个 ]，Node 不会报错 ——
// 错误会推迟到浏览器里执行页面脚本时才炸，而且报错位置和真正写错的地方
// 差了上百行。本工具把模板里的插值全部替换成占位符 0，再对剩下的纯文本
// 做括号配平扫描，直接指出「哪一行的括号没闭上」。
//
// 用法：node scripts/check-scene-template.mjs <scenes.mjs>
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('用法：node scripts/check-scene-template.mjs <scenes.mjs>');
const src = readFileSync(file, 'utf8');

/* 找出所有模板字面量（`...`），逐个做结构检查 */
const pieces = [];
let i = 0;
while (i < src.length) {
  const ch = src[i];
  if (ch === '`') {
    const start = i;
    i += 1;
    let depth = 0;
    let plain = '';
    while (i < src.length) {
      if (src[i] === '\\') { plain += src.slice(i, i + 2); i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') {
        plain += '0';
        i += 2;
        let inner = '';
        while (i < src.length) {
          if (src[i] === '\\') { inner += src.slice(i, i + 2); i += 2; continue; }
          if (src[i] === '{') depth += 1;
          if (src[i] === '}') { if (depth === 0) break; depth -= 1; }
          if (src[i] === '\n') break;
          inner += src[i];
          i += 1;
        }
        if (src[i] !== '}') { console.log(`✗ 插值没有闭合：${src.slice(start, start + 40)}…`); process.exitCode = 1; }
        i += 1;
        continue;
      }
      if (src[i] === '`') { i += 1; break; }
      plain += src[i];
      i += 1;
    }
    pieces.push({ start, plain });
    continue;
  }
  i += 1;
}

const PAIRS = { ')': '(', ']': '[', '}': '{' };
let bad = 0;
for (const piece of pieces) {
  const lines = piece.plain.split('\n');
  const stack = [];
  let line = 1;
  for (const text of lines) {
    let j = 0;
    while (j < text.length) {
      const c = text[j];
      if (c === '\'' || c === '"') {
        const quote = c; j += 1;
        while (j < text.length && text[j] !== quote) { if (text[j] === '\\') j += 1; j += 1; }
        j += 1;
        continue;
      }
      if (c === '/' && text[j + 1] === '/') break;
      if (c === '(' || c === '[' || c === '{') { stack.push([c, line]); j += 1; continue; }
      if (c === ')' || c === ']' || c === '}') {
        const top = stack.pop();
        if (!top || top[0] !== PAIRS[c]) {
          console.log(`✗ 第 ${line} 行括号不匹配：遇到 ${c}，但最近未闭合的是 ${top ? top[0] + '（第 ' + top[1] + ' 行）' : '无'}`);
          console.log(`   ${text.trim().slice(0, 140)}`);
          bad += 1;
          break;
        }
        j += 1;
        continue;
      }
      j += 1;
    }
    line += 1;
  }
  if (stack.length) {
    console.log(`✗ 模板结尾还有 ${stack.length} 个未闭合：${stack.slice(-4).map(s => s[0] + '@' + s[1]).join(', ')}`);
    bad += 1;
  }
}
if (!bad) console.log('✓ 场景模板括号配平通过');
else process.exitCode = 1;
