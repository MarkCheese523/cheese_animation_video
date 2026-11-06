#!/usr/bin/env node
/**
 * SRT -> subtitle array for templates/engine.js.
 * Usage: node scripts/srt2subs.js input.srt [fix.json] [keys.txt] [maxUnits=14]
 * fix.json: {"混元四":"混元4","workbody":"WorkBuddy"}
 * keys.txt: one highlight per line; longer keys win.
 */
import fs from 'node:fs';

const [, , srt, fixFile, keyFile, maxArg] = process.argv;
if (!srt) {
  console.error('Usage: node scripts/srt2subs.js input.srt [fix.json] [keys.txt] [maxUnits=14]');
  process.exit(2);
}
const MAX = Number(maxArg || 14);
if (!Number.isFinite(MAX) || MAX < 2) throw new Error('maxUnits must be a number >= 2');
const FIX = fixFile ? JSON.parse(fs.readFileSync(fixFile, 'utf8')) : {};
const KEYS = keyFile ? fs.readFileSync(keyFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean).sort((a, b) => b.length - a.length) : [];
const toSeconds = value => {
  const match = value.trim().match(/^(\d+):(\d+):(\d+)[,.](\d{1,3})$/);
  if (!match) throw new Error(`Invalid SRT timestamp: ${value}`);
  const [, h, m, sec, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(sec) + Number(ms.padEnd(3, '0')) / 1000;
};
const visualLength = value => [...value].reduce((n, char) => n + (/[\u0000-\u00ff]/.test(char) ? .5 : 1), 0);
const escapeHTML = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function wrap(value) {
  if (visualLength(value) <= MAX) return [value];
  const chars = [...value], middle = chars.length / 2;
  let best = -1, bestDistance = Infinity;
  chars.forEach((char, index) => {
    if (/[,，、。;；:：\s]/.test(char) && Math.abs(index - middle) < bestDistance) {
      best = index + 1; bestDistance = Math.abs(index - middle);
    }
  });
  if (best < 0 || bestDistance > chars.length * .3) best = Math.round(middle);
  return [chars.slice(0, best).join('').replace(/[,，、\s]+$/, ''), chars.slice(best).join('').trim()];
}
function highlight(line) {
  const tokens = [];
  KEYS.forEach(key => {
    if (line.includes(key)) {
      line = line.split(key).join(`\u0001${tokens.length}\u0002`);
      tokens.push(key);
    }
  });
  return escapeHTML(line).replace(/\u0001(\d+)\u0002/g, (_, index) => `<b>${escapeHTML(tokens[index])}</b>`);
}
const blocks = fs.readFileSync(srt, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split(/\n\s*\n/);
const output = blocks.filter(Boolean).map(block => {
  const lines = block.split('\n'), index = lines.findIndex(line => line.includes('-->'));
  if (index < 0) throw new Error(`Invalid SRT block: ${block}`);
  const [start, end] = lines[index].split('-->').map(toSeconds);
  if (end < start) throw new Error(`Subtitle ends before it starts: ${lines[index]}`);
  let text = lines.slice(index + 1).join('').trim();
  for (const key in FIX) text = text.split(key).join(FIX[key]);
  return `  [${start.toFixed(3)}, ${end.toFixed(3)}, ${JSON.stringify(wrap(text).map(highlight).join('<br>'))}]`;
});
console.log(`const SUBS = [\n${output.join(',\n')}\n];`);
