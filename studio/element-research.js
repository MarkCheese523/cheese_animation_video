const FALLBACK_LABELS = {
  'lucide:file-badge': '线性凭证', 'lucide:split': '路径拆分', 'lucide:arrow-left-right': '双向交接',
  'lucide:timer-off': '到期计时', 'lucide:mouse-pointer-click': '光标确认', 'lucide:refresh-cw': '循环同步',
  'lucide:shield-check': '安全核验', 'lucide:chart-no-axes-combined': '数据图表', 'lucide:user-round': '用户账户'
};

async function searchIconify(query, limit = 6, prefix = '') {
  const filter = prefix ? `&prefixes=${encodeURIComponent(prefix)}` : '';
  const [searchResponse, collectionsResponse] = await Promise.all([
    fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}${filter}`, { signal: AbortSignal.timeout(10000) }),
    fetch('https://api.iconify.design/collections', { signal: AbortSignal.timeout(10000) })
  ]);
  if (!searchResponse.ok) throw new Error(`元素检索失败：${searchResponse.status}`);
  const search = await searchResponse.json();
  const collections = collectionsResponse.ok ? await collectionsResponse.json() : {};
  return (search.icons || []).filter(id => !prefix || id.startsWith(`${prefix}:`)).slice(0, limit).map(id => {
    const [collection, name] = id.split(':');
    const info = collections[collection] || {};
    return {
      id, name: info.name ? `${info.name} · ${name}` : name,
      style: info.palette || 'SVG', author: info.author?.name || '未标注',
      license: info.license?.title || '查看图标集许可',
      svg: `https://api.iconify.design/${collection}/${name}.svg?height=none`
    };
  });
}

function normalizedIconSubject(candidate) {
  const name = candidate.id.split(':').slice(1).join(':').toLowerCase();
  return name
    .replace(/(?:^|-)(?:bold|regular|thin|outline|duotone|solid|line|fill|rounded|sharp|twotone)(?=-|$)/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function diverseIconCandidates(candidates, limit) {
  const subjects = new Map();
  candidates.forEach(candidate => {
    const subject = normalizedIconSubject(candidate);
    if (subject && !subjects.has(subject)) subjects.set(subject, candidate);
  });
  const selected = [];
  const collections = new Set();
  for (const preferNewCollection of [true, false]) {
    for (const candidate of subjects.values()) {
      if (selected.includes(candidate)) continue;
      const collection = candidate.id.split(':')[0];
      if (preferNewCollection && collections.has(collection)) continue;
      selected.push(candidate);
      collections.add(collection);
      if (selected.length === limit) return selected;
    }
  }
  return selected;
}

async function searchIconCandidates(query, limit = 5) {
  const words = String(query || '').trim().split(/\s+/).filter(Boolean);
  const pairs = words.flatMap((word, index) => words.slice(index + 1).map(other => `${word} ${other}`));
  const attempts = [...new Set([
    words.join(' '), words.slice(0, 3).join(' '), words.slice(0, 2).join(' '), ...pairs, ...words
  ].filter(Boolean))];
  let lastError;
  for (const attempt of attempts) {
    try {
      const candidates = await searchIconify(attempt, 32);
      if (candidates.length) return diverseIconCandidates(candidates, limit);
    } catch (error) { lastError = error; }
  }
  if (lastError) throw lastError;
  return [];
}

function researchRoute(slot) {
  if (slot.researchRoute && slot.researchRoute !== 'auto') return slot.researchRoute;
  if (slot.brandOnly) return 'web';
  if (slot.id === 'G0' || slot.abstractOnly) return 'semantic';
  return 'icon';
}

async function searchWebCandidates(slot) {
  const localName = (slot.semanticName || slot.concept || '')
    .replace(/(?:品牌|产品)?标识.*$/, '').replace(/(?:与|和).*$/, '').trim();
  const query = (slot.brandOnly
    ? [slot.query, localName].filter(Boolean).join(' ')
    : (slot.query || slot.semanticName || slot.concept)).trim();
  const params = new URLSearchParams({ query, brand: slot.brandOnly ? '1' : '0', limit: '4' });
  const response = await fetch(`/api/asset-research?${params}`, { signal: AbortSignal.timeout(35000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '互联网图片检索失败');
  return result.candidates || [];
}

async function searchBrandCandidates(slot) {
  const product = (slot.brandAssets || []).map((asset, index) => ({
    id: `product-${slot.id}-${index}`, name: asset.label || `${slot.concept} · 产品真实标识`,
    author: asset.author || slot.concept, license: asset.license || '产品资产；商标与使用许可待确认',
    svg: asset.kind === 'svg' ? asset.url : '', image: asset.kind === 'svg' ? '' : asset.url,
    sourceUrl: asset.sourceUrl || asset.url, brand: true
  }));
  let web = [];
  let failed = false;
  try { web = await searchWebCandidates(slot); } catch { failed = true; }
  const seen = new Set();
  const real = [...product, ...web].filter(candidate => {
    const source = candidate.svg || candidate.image;
    if (!source || seen.has(source)) return false;
    seen.add(source); return true;
  }).slice(0, 5);
  return [...real, {
    id: `text-${slot.id}`, name: `${slot.concept} · 纯文字备用`, author: 'Motion Layer',
    license: real.length
      ? '没有选用互联网真实矢量时的完整文字排版；不得绘制近似 Logo。'
      : `互联网未找到可靠品牌矢量${failed ? '（检索服务连接失败）' : ''}；当前仅提供纯文字备用，不得绘制近似 Logo。`,
    textOnly: true, brand: true, fallback: true
  }];
}

function fallbackCandidates(slot) {
  return [slot.fallback, 'lucide:shapes', 'lucide:sparkles'].map((id, index) => ({
    id: index === 0 ? id : `${id}-${index}`, name: index === 0 ? (FALLBACK_LABELS[id] || slot.concept) : '抽象辅助元素',
    style: '本地回退', author: '通用几何', license: '待制作母版', fallback: true, slot: slot.id
  }));
}
