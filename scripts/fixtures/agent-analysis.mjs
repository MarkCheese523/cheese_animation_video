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
    summary: 'Agent 将凭证的生命周期拆成建立、拆分、交接、失效与同步归位，并自动纳入本期真实品牌。',
    beats: [
      { id: 'gather', label: '凭证建立', duration: 3, action: 'component-gather', note: '人物与凭证聚合，建立权利载体', narration: '先建立可转让的凭证。', assetIds: ['G0', 'N1'] },
      { id: 'trigger', label: '拆分确权', duration: 4, action: 'direct-press', note: '按压后凭证拆成独立权利', narration: '凭证拆分后可以转让。', assetIds: ['N1', 'N2'] },
      { id: 'split', label: '沿路径转让', duration: 5, action: 'component-flow', note: '权利模块沿连接路径交接', narration: '拆分后的权利沿路径转让。', assetIds: ['N2', 'N3'] },
      { id: 'switch', label: '到期失效', duration: 4.75, action: 'state-reflow', note: '过期后权利退去并显示失效', narration: '过期后失效。', assetIds: ['N4'] },
      { id: 'resolve', label: '确认并同步', duration: 3.25, action: 'logo-resolve', note: '确认操作驱动数据同步与品牌归位', narration: '点击确认，数据同步完成。', assetIds: ['N5', 'N6', 'N7', ...brandList.map((_, index) => `B${index + 1}`)] }
    ],
    assets
  };
}
