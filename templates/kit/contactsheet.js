/* Cheese Motion · 装配层 kit（Node 侧 · 语义接触表）
 *
 * 为什么要有接触表：
 *   机器查渲染（越界、重叠、时间窗），人查语义（这一画在表达什么）。
 *   本期 11 个画面逻辑缺陷，没有一个是 lint 抓到的，全是人眼看出来的 ——
 *   那就应该让人眼在最早的时刻看到最早的那一帧，而不是等到第 4 拍或全片。
 *
 *   本模块把「每拍一张关键帧 + 动词 + 焦点 + 承接」变成可交付物，
 *   同时是 Phase 3「manual 项必须在交付接触表出现」的验收依据。
 */

/* ------------------------------------------------------------------ *
 * SRT 解析（时间轴的唯一可靠来源）
 * ------------------------------------------------------------------ */

function srtTime(text) {
  const match = String(text).match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
    + Number(match[4].padEnd(3, '0')) / 1000;
}

/** 解析 SRT，返回 [{ index, start, end, text }]。 */
export function parseSrt(raw) {
  const blocks = String(raw).replace(/\r/g, '').trim().split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    const timeLine = lines.find(line => line.includes('-->'));
    if (!timeLine) continue;
    const [left, right] = timeLine.split('-->').map(part => part.trim());
    const start = srtTime(left);
    const end = srtTime(right);
    if (start == null || end == null) continue;
    const text = lines.filter(line => line !== timeLine && !/^\d+$/.test(line)).join(' ');
    out.push({ index: out.length + 1, start, end, text });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 拍次时间轴
 * ------------------------------------------------------------------ */

/**
 * 把拍次与字幕句子对齐，得到每拍的绝对起止时间。
 * 优先用 SRT 句子时间（精确）；句数与拍数不一致时按比例分配并标记为估算。
 *
 * ★ 分镜表自带起止时优先用分镜表的：
 *   一拍常常盖住 2–5 句字幕（SRT 句数 ≠ 拍数），这时「按句对齐」走不通，
 *   只能按 duration 累加 —— 而累加出来的起点与真实时间差一个常数偏移，
 *   接触表的关键帧就会整体错位。分镜表（storyboard.json / analysis.json 的
 *   beats[].start / beats[].end）是表A 的权威起止，有它就用它。
 */
export function buildTimeline(beats, sentences) {
  const rows = [];
  const exact = Array.isArray(sentences) && sentences.length === beats.length;
  beats.forEach((beat, index) => {
    const sentence = exact ? sentences[index] : null;
    const declared = Number.isFinite(beat?.start) && Number.isFinite(beat?.end)
      ? { start: beat.start, end: beat.end } : null;
    const duration = Number(beat.duration) || (sentence ? sentence.end - sentence.start : 0);
    rows.push({
      ...beat,                        // 保留 focus / verb / relation / carry 等全部原始字段
      id: beat.id,
      label: beat.label,
      narration: beat.narration || (sentence ? sentence.text : ''),
      start: declared ? declared.start : (sentence ? sentence.start : null),
      end: declared ? declared.end : (sentence ? sentence.end : null),
      duration,
      estimated: !declared && !sentence
    });
  });
  if (!exact && !rows.every(row => row.start != null && row.end != null)) {
    // 回退：按 duration 顺序累加，标注为估算（关键帧时间只用于定位，不代表真实对轴）
    let cursor = rows[0] && rows[0].start != null ? rows[0].start : 0.5;
    for (const row of rows) {
      if (row.start != null && row.end != null) { cursor = row.end; continue; }
      row.start = Number(cursor.toFixed(2));
      row.end = Number((cursor + row.duration).toFixed(2));
      row.estimated = true;
      cursor = row.end;
    }
  }
  return rows;
}

/** 每拍的关键帧时间：变化已经发生、字幕已稳定的那一帧。 */
export function keyFrameTime(row, ratio = 0.72) {
  const start = row.start ?? 0;
  const span = Math.max(0.6, (row.end ?? start + row.duration) - start);
  return Number((start + span * ratio).toFixed(2));
}

/* ------------------------------------------------------------------ *
 * 接触表组装
 * ------------------------------------------------------------------ */

const cell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

/* 视觉回归状态（回归层，不是交付关卡）——
   画面合法改动必然与基线不符，基线只能由人在验收后手动刷新，
   所以这里只呈现「机器查一致」的结果，由人拍板这次改动是合法修改还是回归。 */
const VISUAL_STATUS = {
  pass: { label: '与基线一致', tone: 'ok' },
  drift: { label: '与基线不一致', tone: 'bad' },
  missing: { label: '缺基线', tone: 'warn' },
  skipped: { label: '本轮跳过', tone: 'mute' }
};

/**
 * 组装语义接触表。
 * @param {object} input
 * @param {string} input.title       标题
 * @param {string} input.stage       环节（samples / film）
 * @param {string} input.previewUrl  网页预览地址
 * @param {Array}  input.rows        每拍 { label, verb, focus, relation, carry, start, end, shot, shotLabel }
 * @param {Array}  [input.manual]    只能人工看的检查项（Phase 3 闭环用）
 * @param {object} [input.visual]    视觉回归状态 { overall, segments:[{id,title,status,note,frames,diffs}] }
 */
export function buildContactSheet(input) {
  const { title, stage, previewUrl, rows = [], manual = [], visual = null } = input;
  const header = [
    `| 拍 | 时间 | 关键帧 | 动词 | 焦点 | 承接（谁活下来 → 怎么变 → 变成什么） |`,
    `|---|---|---|---|---|---|`
  ];
  const body = rows.map((row, index) => [
    `| ${index + 1}. ${cell(row.label)}`,
    `${row.start != null ? row.start.toFixed(2) : '—'}–${row.end != null ? row.end.toFixed(2) : '—'}s`,
    row.shot ? `![${cell(row.label)}](${row.shot})` : '（缺帧）',
    cell(row.verb),
    cell(row.focus),
    cell(row.carry || row.relation)
  ].join(' | ') + ' |');

  const manualBlock = manual.length
    ? ['', '### 只能人工看的检查项（machine 无法判定，必须逐条确认）', '',
      ...manual.map(item => `- [ ] ${cell(item.title)}${item.hint ? ` —— ${cell(item.hint)}` : ''}`)]
    : [];

  /* 视觉回归块 —— 机器查一致，人拍板 */
  const visualBlock = visual && visual.segments?.length
    ? [
      '',
      '### 视觉回归（Golden Frame 像素基线）',
      '',
      '> 这是**回归层**，不是交付关卡：画面合法改动必然与基线不符，基线只能在验收后由人手动刷新。',
      '> 机器负责说「这一帧和上次不一样」，**由人决定**这次改动是合法修改（刷新基线）还是回归（必须改回去）。',
      '',
      '| 片段 | 基线 | 帧数 | 状态 | 说明 |',
      '|---|---|---|---|---|',
      ...visual.segments.map(segment => [
        cell(segment.title || segment.id),
        segment.baselineDir ? `\`${cell(segment.baselineDir)}\`` : '—',
        segment.frames != null ? String(segment.frames) : '—',
        VISUAL_STATUS[segment.status]?.label || segment.status,
        cell(segment.note || '')
      ].join(' | ') + ' |'),
      '',
      ...visual.segments.flatMap(segment => (segment.diffs || []).map(diff =>
        `- ⚠️ ${cell(segment.title || segment.id)} ${diff.t}s —— ${cell(diff.reason)}${diff.diffFile ? `（差异图：\`${cell(diff.diffFile)}\`）` : ''}`)),
      visual.segments.flatMap(segment => segment.diffs || []).length ? '' : null
    ].filter(line => line !== null)
    : [];

  const markdown = [
    `# ${title} · 语义接触表`,
    '',
    `- 环节：${stage}`,
    `- 网页预览：${previewUrl}`,
    `- 帧来源：${rows.filter(row => row.shot).length}/${rows.length} 拍（每拍取变化已发生的那一帧）`,
    visual && visual.segments?.length
      ? `- 视觉回归：${visual.segments.map(segment => `${segment.title || segment.id} ${VISUAL_STATUS[segment.status]?.label || segment.status}`).join('；')}`
      : null,
    '',
    '> 机器查渲染，人查语义。这张表是**语义验收**的入口 —— 每一行都要能回答：这一拍在发生什么变化？',
    '',
    ...header,
    ...body,
    ...visualBlock,
    ...manualBlock,
    ''
  ].filter(line => line !== null).join('\n');

  const htmlRows = rows.map((row, index) => `
      <tr>
        <td class="beat">${index + 1}. ${cell(row.label)}${row.visualStatus ? `<span class="vbadge v-${VISUAL_STATUS[row.visualStatus]?.tone || 'mute'}">${VISUAL_STATUS[row.visualStatus]?.label || row.visualStatus}</span>` : ''}</td>
        <td class="mono">${row.start != null ? row.start.toFixed(2) + '–' + row.end.toFixed(2) + 's' : '—'}</td>
        <td class="shot">${row.shot ? `<img src="${row.shot}" alt="${cell(row.label)}">` : '<span class="miss">缺帧</span>'}</td>
        <td><b>${cell(row.verb)}</b></td>
        <td>${cell(row.focus)}</td>
        <td>${cell(row.carry || row.relation)}</td>
      </tr>`).join('');

  const visualHtml = visual && visual.segments?.length
    ? `<h2>视觉回归（Golden Frame 像素基线）</h2>
<p class="note">这是<b>回归层</b>，不是交付关卡：画面合法改动必然与基线不符，基线只能在验收后由人手动刷新。
机器负责说「这一帧和上次不一样」，<b>由人决定</b>这次改动是合法修改（刷新基线）还是回归（必须改回去）。</p>
<table><thead><tr><th>片段</th><th>基线</th><th>帧数</th><th>状态</th><th>说明</th></tr></thead><tbody>
${visual.segments.map(segment => `<tr>
        <td class="beat">${cell(segment.title || segment.id)}</td>
        <td class="mono">${segment.baselineDir ? cell(segment.baselineDir) : '—'}</td>
        <td class="mono">${segment.frames != null ? segment.frames : '—'}</td>
        <td><span class="vbadge v-${VISUAL_STATUS[segment.status]?.tone || 'mute'}">${VISUAL_STATUS[segment.status]?.label || segment.status}</span></td>
        <td>${cell(segment.note || '')}${(segment.diffs || []).length ? '<ul>' + segment.diffs.map(diff => `<li>${diff.t}s —— ${cell(diff.reason)}${diff.diffFile ? `（差异图：${cell(diff.diffFile)}）` : ''}</li>`).join('') + '</ul>' : ''}</td>
      </tr>`).join('')}
</tbody></table>`
    : '';

  const manualHtml = manual.length
    ? `<h2>只能人工看的检查项</h2><ul>${manual.map(item => `<li><label><input type="checkbox"> ${cell(item.title)}</label>${item.hint ? `<span class="hint">${cell(item.hint)}</span>` : ''}</li>`).join('')}</ul>`
    : '';

  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${cell(title)} · 语义接触表</title>
<style>
:root{--bg:#0d1a16;--surface:#132520;--ink:#eef4e8;--muted:#8fa79b;--accent:#c6ff3d;--line:rgba(198,255,61,.35)}
*{box-sizing:border-box}body{margin:0;padding:32px;background:var(--bg);color:var(--ink);
font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.6}
h1{font-size:26px;margin:0 0 6px}h2{font-size:19px;margin:32px 0 10px}
.meta{color:var(--muted);font-size:14px;margin-bottom:20px}
.meta a{color:var(--accent)}
.note{color:var(--muted);font-size:14px;margin:0 0 14px;max-width:900px}
table{border-collapse:collapse;width:100%;background:var(--surface)}
th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top;font-size:14px}
th{background:rgba(198,255,61,.08);font-size:13px;letter-spacing:1px}
td.shot{width:150px}td.shot img{width:100%;border-radius:4px;display:block}
td.beat{white-space:nowrap;font-weight:700}
.mono{font-family:"SFMono-Regular",Consolas,monospace;white-space:nowrap;color:var(--muted)}
.miss{color:#c04a34}
li{margin:6px 0}.hint{display:block;color:var(--muted);font-size:13px}
.vbadge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:400;white-space:nowrap}
.v-ok{background:rgba(198,255,61,.18);color:#c6ff3d}
.v-bad{background:rgba(255,90,70,.20);color:#ff8a70}
.v-warn{background:rgba(255,200,60,.18);color:#ffc83c}
.v-mute{background:rgba(255,255,255,.08);color:var(--muted)}
</style></head><body>
<h1>${cell(title)} · 语义接触表</h1>
<div class="meta">环节 ${cell(stage)} · 网页预览 <a href="${previewUrl}">${previewUrl}</a></div>
<table><thead><tr><th>拍</th><th>时间</th><th>关键帧</th><th>动词</th><th>焦点</th><th>承接</th></tr></thead>
<tbody>${htmlRows}</tbody></table>
${visualHtml}
${manualHtml}
</body></html>`;

  return { markdown, html };
}
