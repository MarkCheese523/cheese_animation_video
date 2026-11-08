/* Cheese Motion · 分镜契约（纯函数 · 无 IO）
 *
 * 为什么把它抽出来：
 *   表A–F 的校验（E01–E05）原来只长在 agent-flow.mjs 里 —— 也就是**只在设计台路径**
 *   （job.json → analysis.json）生效。用户直接在对话里给一份 SRT 时，一条都不走。
 *   于是同一套约束出现两个实现，或者干脆没有实现。
 *
 * 所以：把校验抽到这一份纯函数里，agent-flow.mjs（设计台路径）与
 * scripts/check-storyboard.mjs（对话路径）调用**同一个**模块，两条路径不会再漂移。
 *
 * 表E 的「怎么变」从自由文本改成枚举（E33）：
 *   真实产出里 23 行「怎么变」一字不差全是「主体保持身份，只改变形态与位置」——
 *   E03（非空）与 E05（无空行）全部通过，承接设计根本不存在。
 *   要求填 N 行自由文本，就会得到 N 行套话。所以「怎么变」只能是手法枚举，
 *   配一条 detail 写具体描述，再加三条反退化断言。
 */

/* rule: E01 每拍唯一焦点 */
/* rule: E02 视觉动词必须来自动词表 */
/* rule: E03 每拍必须写清跨句承接 */
/* rule: E04 两级设计卡五字段必填 */
/* rule: E05 表E 承接表不得有空行 */
/* rule: E33 承接手法不得退化 */

export const VISUAL_VERBS = new Set([
  '出现', '登场', '落下', '归位', '长成', '展开', '归档', '分出', '注入', '堵住',
  '滴出', '盖章', '标红', '运转', '停住', '划掉', '计数', '走进', '指向', '提问'
]);

/* 表E 承接手法枚举（references/motion-carry.md 的决策树手法词）。
   枚举填不出套话 —— 这是「校验器被模板化填空绕过」的结构性对策。 */
export const CARRY_METHODS = new Set([
  '长成', '展开', '归档', '落下', '分出多个', '多个汇成一个', '替换'
]);

/* 自由文本 → 手法词的推断表（兼容旧数据）。
   只在 row 没有 method 字段时启用，且只认这些具体短语 —— 认不出来就报错，不猜。 */
export const METHOD_HINTS = [
  ['多个汇成一个', ['并成', '汇成', '聚成', '合成', '收敛成', '并入', '落进一张']],
  ['分出多个', ['分出', '裂成', '拆成', '散成']],
  ['长成', ['长成', '生长']],
  ['展开', ['展开', '铺开', '拉开']],
  ['归档', ['归档', '收回', '收起']],
  ['落下', ['落下', '落到', '掉到', '沉到', '归位']],
  ['替换', ['替换', '换成']]
];

/* 拍数与时长边界 —— 拍数由本期语义段落数决定，不是固定值 */
export const BEAT_COUNT = { min: 3, max: 40 };
export const BEAT_DURATION = { min: 1, max: 60 };

/* 长片降填规则：拍数超过 LONG_FILM_BEATS 时，表E 只强制填语义段落边界 */
export const LONG_FILM_BEATS = 12;
export const LONG_FILM_CARRY_ROWS = { min: 4, max: 8 };

/* E33 三条断言的阈值 */
export const E33_MAX_SAME_METHOD = 5;
export const E33_MIN_DETAIL_UNIQUE = 0.6;

/* 已知拍 id 的优先动作（兼容内置演示）；未知拍 id 走通用动作表 */
export const BEAT_ACTION_PREFERENCE = {
  gather: ['component-gather', 'logo-reveal'],
  trigger: ['cursor-click', 'direct-press'],
  split: ['component-flow', 'card-reflow'],
  switch: ['state-reflow', 'status-only'],
  resolve: ['logo-resolve', 'hero-hold']
};
export const GENERIC_ACTIONS = [
  'component-gather', 'component-flow', 'state-reflow', 'logo-resolve', 'direct-press',
  'cursor-click', 'card-reflow', 'status-only', 'logo-reveal', 'hero-hold'
];

function text(value, fallback = '', limit = 200) {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  return raw ? raw.slice(0, limit) : fallback;
}

/**
 * 推断一行承接的「怎么变」手法。
 * @returns {{method: string|null, detail: string, inferred: boolean}}
 */
export function normalizeCarryMethod(row) {
  const explicit = text(row?.method, '', 40);
  const legacy = text(row?.how, '', 360);
  const detail = text(row?.detail, '', 360) || legacy;
  if (explicit) return { method: explicit, detail, inferred: false };
  if (!legacy) return { method: null, detail, inferred: false };
  for (const [method, hints] of METHOD_HINTS) {
    if (hints.some(hint => legacy.includes(hint))) return { method, detail: legacy, inferred: true };
  }
  return { method: null, detail: legacy, inferred: false };
}

/**
 * 表E 承接表校验（E05 + E33）。
 * @param {Array} rows 承接表
 * @param {Array<string>} beatIds 拍 id 列表
 */
export function cleanCarryTable(rows, beatIds) {
  const boundaries = Math.max(0, beatIds.length - 1);
  const longFilm = beatIds.length > LONG_FILM_BEATS;
  if (!Array.isArray(rows)) {
    /* rule: E05 表E 承接表不得有空行 */
    throw new Error(`表E 承接表必须覆盖 ${boundaries} 个镜头边界（每两个相邻拍之间一行）`);
  }

  const out = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const survivor = text(row?.survivor, '', 240);
    const becomes = text(row?.becomes, '', 240);
    const { method, detail, inferred } = normalizeCarryMethod(row);
    if (!survivor || !detail || !becomes) {
      /* rule: E05 表E 承接表不得有空行 */
      throw new Error(`表E 承接表第 ${index + 1} 行有空缺：每个边界都要写清谁活下来、怎么变、变成什么`);
    }
    /* rule: E33 承接手法不得退化 */
    if (!method || !CARRY_METHODS.has(method)) {
      throw new Error(
        `表E 承接表第 ${index + 1} 行的「怎么变」不是手法枚举（${[...CARRY_METHODS].join(' / ')}），`
        + `也没能从自由文本推断出手法词 —— 这正是校验器被绕过的形态：写的是「承接」的同义反复，`
        + `不是一个能画出来的手法。原文：「${detail.slice(0, 60)}」`
      );
    }
    out.push({
      boundary: text(row?.boundary, '', 80) || `${beatIds[index] || ''} → ${beatIds[index + 1] || ''}`,
      survivor,
      method,
      detail,
      becomes,
      methodInferred: inferred
    });
  }

  /* 长度校验放在逐行校验之后：先说「这些行根本不是手法词」，
     再谈「长片不该填这么多行」—— 前者才是真病因，后者只是症状。 */
  if (longFilm) {
    /* 长片降填：只强制填写语义段落边界（通常 4–8 行）。
       段落内部的拍间承接由 method 枚举 + 默认值覆盖。 */
    if (rows.length < LONG_FILM_CARRY_ROWS.min || rows.length > LONG_FILM_CARRY_ROWS.max) {
      throw new Error(
        `表E 承接表在 ${beatIds.length} 拍的长片里只填 ${LONG_FILM_CARRY_ROWS.min}–${LONG_FILM_CARRY_ROWS.max} 行`
        + `（语义段落边界），当前 ${rows.length} 行 —— 要 ${rows.length} 行会得到套话，要 ${LONG_FILM_CARRY_ROWS.min} 行才会得到真答案`
      );
    }
  } else if (rows.length !== boundaries) {
    /* rule: E05 表E 承接表不得有空行 */
    throw new Error(`表E 承接表必须覆盖 ${boundaries} 个镜头边界（每两个相邻拍之间一行）`);
  }
  if (rows.length > boundaries) {
    throw new Error(`表E 承接表有 ${rows.length} 行，超过镜头边界数 ${boundaries}`);
  }

  /* rule: E33 承接手法不得退化 —— 同一手法连续出现过多 = 在套模板 */
  let streak = 1;
  for (let index = 1; index < out.length; index += 1) {
    streak = out[index].method === out[index - 1].method ? streak + 1 : 1;
    if (streak > E33_MAX_SAME_METHOD) {
      throw new Error(
        `表E 承接表第 ${index - E33_MAX_SAME_METHOD + 1}–${index + 1} 行连续 ${streak} 次使用同一手法「${out[index].method}」`
        + `（上限 ${E33_MAX_SAME_METHOD}）—— 检查是否在套模板`
      );
    }
  }

  /* rule: E33 承接手法不得退化 —— detail 去重率过低 = 每行都在说同一句话 */
  const details = out.map(row => row.detail);
  const uniqueRate = new Set(details).size / details.length;
  if (details.length >= 3 && uniqueRate < E33_MIN_DETAIL_UNIQUE) {
    throw new Error(
      `表E 承接表的「具体描述」去重率 ${uniqueRate.toFixed(2)}（${new Set(details).size}/${details.length} 种写法），`
      + `低于 ${E33_MIN_DETAIL_UNIQUE} —— 这些行说的是同一句话，没有做承接设计`
    );
  }

  return out;
}

/**
 * 分镜逐拍校验（E01 / E02 / E03）。
 */
export function cleanBeat(beat, index) {
  const id = text(beat?.id, '', 60).toLowerCase() || `beat-${index + 1}`;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) {
    throw new Error(`分镜第 ${index + 1} 拍的 id「${id}」不合法（只能用小写字母、数字与连字符）`);
  }
  const duration = Number(beat?.duration);
  if (!Number.isFinite(duration) || duration < BEAT_DURATION.min || duration > BEAT_DURATION.max) {
    throw new Error(`${id} 时长需在 ${BEAT_DURATION.min}–${BEAT_DURATION.max} 秒之间`);
  }
  /* rule: E01 每拍唯一焦点 */
  const focus = text(beat?.focus, '', 160);
  if (!focus) throw new Error(`${id} 缺少本拍唯一焦点（focus）——表D 要求观众此刻只能看一个地方`);
  /* rule: E02 视觉动词必须来自动词表 */
  const verb = text(beat?.verb, '', 20);
  if (!VISUAL_VERBS.has(verb)) {
    throw new Error(`${id} 的视觉动词「${verb || '空'}」不在表D 动词表内，只能用：${[...VISUAL_VERBS].join('、')}`);
  }
  const relation = text(beat?.relation, '', 400);
  if (!relation) throw new Error(`${id} 缺少「观众应看懂的关系」`);
  const soundCue = text(beat?.soundCue, '', 300);
  if (!soundCue) throw new Error(`${id} 缺少声音 cue`);
  /* rule: E03 每拍必须写清跨句承接 */
  const carry = text(beat?.carry, '', 400);
  if (!carry) throw new Error(`${id} 缺少跨句承接说明——同一主体必须跨句继续运动，不能每句换场`);
  const preference = BEAT_ACTION_PREFERENCE[id] || GENERIC_ACTIONS;
  return {
    id,
    label: text(beat?.label, id, 16),
    duration,
    action: preference.includes(beat?.action) ? beat.action : preference[0],
    note: text(beat?.note, '可见动作与信息增量', 300),
    narration: text(beat?.narration, '', 1000),
    focus,
    verb,
    relation,
    soundCue,
    carry,
    assetIds: Array.isArray(beat?.assetIds)
      ? beat.assetIds.slice(0, 18).map(value => text(value, '', 60)).filter(Boolean)
      : []
  };
}

/**
 * 两级设计卡（E04）：视觉母结构 → 形态轨迹 → 起止时间 → 跨句承接 → 静止帧语义
 */
export function cleanDesignCard(card) {
  const fields = ['motherStructure', 'morphTrack', 'span', 'carry', 'stillFrame'];
  const out = {};
  for (const field of fields) {
    const value = text(card?.[field], '', 800);
    /* rule: E04 两级设计卡五字段必填 */
    if (!value) {
      throw new Error(`两级设计卡缺少「${field}」：视觉母结构、形态轨迹、持续时段、跨句承接、静止帧语义必须先写完再进制作`);
    }
    out[field] = value;
  }
  return out;
}

/**
 * 整体分镜校验：设计卡 + 逐拍 + 承接表。
 * @param {object} input { designCard, beats, carryTable }
 * @param {{minBeats?: number, maxBeats?: number}} options
 *   minBeats 默认 BEAT_COUNT.min（整片口径）。样片段只有两拍 —— E06 要求
 *   「样片必须覆盖连续两拍」—— 校验单段时传 { minBeats: 2 }。
 */
export function checkStoryboard(input, options = {}) {
  const minBeats = options.minBeats ?? BEAT_COUNT.min;
  const maxBeats = options.maxBeats ?? BEAT_COUNT.max;
  const designCard = cleanDesignCard(input?.designCard);
  const beats = (Array.isArray(input?.beats) ? input.beats : []).map(cleanBeat);
  if (beats.length < minBeats || beats.length > maxBeats) {
    throw new Error(`拍数需在 ${minBeats}–${maxBeats} 之间（由本期语义段落数决定）`);
  }
  const carryTable = cleanCarryTable(input?.carryTable, beats.map(beat => beat.id));
  return { designCard, beats, carryTable };
}
