export function makeAgentAnalysis(jobId, { product = false, brands = [] } = {}) {
  const assets = [
    { id: 'G0', code: 'G0', concept: '通用人物', query: '', action: '中立站立、递交凭证', researchRoute: 'semantic', semanticOnly: true, visualKind: 'generic', semanticName: '无脸点阵中立母版＋动作变体', rights: '通用语义资产：无外部肖像参考，不指向特定真人。' },
    { id: 'N1', code: 'N1', concept: '凭证', query: 'certificate document', action: '绘制、展开、确权', fallback: 'lucide:blocks', semanticOnly: true, visualKind: 'generic', semanticName: '能力模块组合', rights: '通用模块语义资产，不使用人物。' },
    { id: 'N2', code: 'N2', concept: '拆分', query: 'split', action: '一个变多个', researchRoute: 'icon', fallback: 'lucide:split', semanticOnly: true, semanticName: '路径拆分', rights: '公开图标或通用语义资产；参考与母版待确认。' },
    { id: 'N3', code: 'N3', concept: '转让', query: 'transfer exchange arrows', action: '沿路径交接', fallback: 'lucide:arrow-left-right' },
    { id: 'N4', code: 'N4', concept: '失效', query: 'expired clock alert', action: '退去、打叉', fallback: 'lucide:timer-off' },
    { id: 'N5', code: 'N5', concept: '确认', query: 'click confirm check button', action: '按压、打勾', fallback: 'lucide:mouse-pointer-click' },
    { id: 'N6', code: 'N6', concept: '同步', query: 'sync connection flow', action: '连接、流动', fallback: 'lucide:refresh-cw' },
    { id: 'N7', code: 'N7', concept: '数据', query: 'analytics chart data', action: '滚动、越过', fallback: 'lucide:chart-no-axes-combined' }
  ];
  const brandList = product ? [{ name: 'Component Demo', query: 'Component Demo', brandAssets: [{ url: '/studio/demo/component-demo-logo.svg', label: 'Component Demo · 产品真实标识', kind: 'svg', sourceUrl: '/studio/demo/component-demo-logo.svg', author: 'Component Demo', license: '虚构产品自带标识；仅用于本地流程演示' }] }] : brands;
  brandList.forEach((brand, index) => assets.push({
    id: `B${index + 1}`, code: `B${index + 1}`, concept: brand.name, query: brand.query || brand.name,
    action: '原始比例揭示、聚合、归位', researchRoute: 'web', brandOnly: true, brandAssets: brand.brandAssets || [],
    rights: '真实品牌资产：仅使用可靠来源，保留原始路径、字形和比例。'
  }));
  return {
    jobId,
    summary: 'AI 把凭证的一生拆成建立、拆分、交接、失效和归位五个画面，并自动加入本期真实品牌。',
    designCard: {
      motherStructure: '凭证本体（N1 凭证模块）贯穿五拍，观众全程追踪的是同一块凭证的归属变化。',
      morphTrack: '整块凭证 → 被按压拆成两半 → 拆出的模块沿路径交接 → 整体退去失效 → 重新聚合归位到品牌标识旁。',
      span: '覆盖全部五句旁白，从建立凭证到归位收束，全程不切镜。',
      carry: '相邻两句之间凭证本体保持同一 DOM 身份，只改变形态、位置和去向，不整体淡出重来。',
      stillFrame: '任取一帧关掉字幕，能看出这块凭证现在在谁手里、处于什么状态。'
    },
    beats: [
      { id: 'gather', label: '凭证建立', duration: 3, action: 'component-gather', note: '人物与凭证聚合，建立权利载体', narration: '先建立可转让的凭证。', focus: '凭证本体', verb: '出现', relation: '凭证还没有归属人', soundCue: '建立动词落在关键词上', carry: '第一拍：凭证从人物手中出现，作为后续四拍的持续主体', assetIds: ['G0', 'N1'] },
      { id: 'trigger', label: '拆分确权', duration: 4, action: 'direct-press', note: '按压后凭证拆成独立权利', narration: '凭证拆分后可以转让。', focus: '被按压的凭证', verb: '盖章', relation: '一块凭证变成两块可分别转让的权利', soundCue: '按压瞬间给一记重音', carry: '凭证本体继续运动：从整块被按压裂成两块，DOM 身份不变', assetIds: ['N1', 'N2'] },
      { id: 'split', label: '沿路径转让', duration: 5, action: 'component-flow', note: '权利模块沿连接路径交接', narration: '拆分后的权利沿路径转让。', focus: '沿路径移动的凭证块', verb: '归档', relation: '权利从一个人手里移动到另一个人手里', soundCue: '移动起止各给一个 cue', carry: '拆出的凭证块继续沿同一路径飞行，落进对方手中的槽位', assetIds: ['N2', 'N3'] },
      { id: 'switch', label: '到期失效', duration: 4.75, action: 'state-reflow', note: '过期后权利退去并显示失效', narration: '过期后失效。', focus: '到期的凭证块', verb: '停住', relation: '凭证到了期限，状态从可转让变成失效', soundCue: '失效瞬间短促收尾', carry: '凭证块飞到终点后停住并变灰，DOM 身份保持不变', assetIds: ['N4'] },
      { id: 'resolve', label: '确认并同步', duration: 3.25, action: 'logo-resolve', note: '确认操作驱动数据同步与品牌归位', narration: '点击确认，数据同步完成。', focus: '归位的凭证与品牌标识', verb: '归位', relation: '失效的凭证被确认后重新归位到品牌标识旁', soundCue: '归位落点给一个收束音', carry: '停住的凭证块重新被同一主体接住，归位到品牌标识下方', assetIds: ['N5', 'N6', 'N7', ...brandList.map((_, index) => `B${index + 1}`)] }
    ],
    carryTable: [
      { boundary: 'gather → trigger', survivor: '凭证本体（N1）', how: '按压（morphRect / 盖章）', becomes: '裂成两块可转让权利' },
      { boundary: 'trigger → split', survivor: '拆出的凭证块（N2）', how: '沿路径飞行（act x 轨道）', becomes: '交接中的权利模块' },
      { boundary: 'split → switch', survivor: '到达终点的凭证块', how: '落进槽位（hop）', becomes: '到期的凭证' },
      { boundary: 'switch → resolve', survivor: '失效的凭证块', how: '重新被接住并归位（gather / hop）', becomes: '品牌标识旁的收束凭证' }
    ],
    assets
  };
}

/* 自由拍数夹具：拍 id、拍数、承接表行数全部按参数生成。
   用来验证「拍数由语义段落数决定」—— 旧的实现把五拍写死，
   于是长视频的拆解根本回写不进来。 */
export function scaleAgentAnalysis(analysis, count, { ids } = {}) {
  const out = structuredClone(analysis);
  const beatIds = ids || Array.from({ length: count }, (_, index) => `beat-${index + 1}`);
  out.beats = beatIds.map((id, index) => ({
    ...structuredClone(analysis.beats[index % analysis.beats.length]),
    id,
    label: `第 ${index + 1} 拍`,
    narration: `第 ${index + 1} 句旁白。`
  }));
  out.carryTable = beatIds.slice(1).map((id, index) => ({
    boundary: `${beatIds[index]} → ${id}`,
    survivor: '持续主体', how: '形态继续演化（同一 DOM 身份）', becomes: '下一形态'
  }));
  return out;
}
