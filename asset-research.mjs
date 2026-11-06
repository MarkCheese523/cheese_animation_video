import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

function plain(value, fallback = '') {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || fallback;
}
function cleanQuery(value) {
  return String(value || '').replace(/\b(official|svg|vector)\b/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}
function normalize(value) {
  return String(value || '').toLowerCase().replace(/^file:/, '').replace(/\.[a-z0-9]+$/i, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function relevance(title, query, brand) {
  const normalized = normalize(title);
  const needle = normalize(query);
  const brandNeedle = normalize(query.replace(/\blogo\b/gi, ''));
  if (!needle || !brandNeedle) return 0;
  const exact = brand ? `${brandNeedle} logo` : needle;
  if (normalized === exact) return 100;
  if (brand && normalized.includes(brandNeedle)) return 70;
  if (normalized.startsWith(`${needle} `)) return 60;
  if (normalized.includes(needle)) return 40;
  const tokens = brandNeedle.split(' ').filter(token => token.length > 1);
  return tokens.length && tokens.every(token => normalized.includes(token)) ? 30 : 0;
}
function latestYear(title) {
  return Math.max(0, ...[...title.matchAll(/\b(19|20)\d{2}\b/g)].map(match => Number(match[0])));
}
function decodeEntities(value) {
  return String(value || '').replace(/&(#x[a-f0-9]+|#\d+|quot|amp|apos|lt|gt);/gi, (entity, code) => {
    const entities = { quot: '"', amp: '&', apos: "'", lt: '<', gt: '>' };
    if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return entities[code.toLowerCase()] || entity;
  });
}
function hostname(value) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return '互联网来源'; }
}

export function parseBingImageResults(html, { query, brand = false, limit = 4 } = {}) {
  const candidates = [];
  for (const match of String(html || '').matchAll(/<a\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\bclass="[^"]*\biusc\b[^"]*"/i.test(tag)) continue;
    const payload = tag.match(/\bm="([^"]+)"/i)?.[1];
    if (!payload) continue;
    try {
      const meta = JSON.parse(decodeEntities(payload));
      const assetUrl = plain(meta.murl);
      const sourceUrl = plain(meta.purl, assetUrl);
      if (!/^https?:\/\//i.test(assetUrl)) continue;
      const title = plain(meta.t, `${query} 图片候选`);
      if (brand && !/logo|标志|标识|图标|icon|favicon|wordmark/i.test(`${title} ${assetUrl} ${sourceUrl}`)) continue;
      const svg = /\.svg(?:$|[?#])/i.test(assetUrl);
      const host = hostname(sourceUrl);
      const brandTokens = normalize(query.replace(/\blogo\b/gi, '')).split(' ').filter(token => token.length > 1);
      const domainMatch = brandTokens.some(token => normalize(host).includes(token)) ? 20 : 0;
      candidates.push({
        id: `bing-${plain(meta.md5, String(candidates.length))}`,
        name: title,
        author: host,
        license: `搜索结果仅供参考；版权与使用许可需在来源页核验${brand ? '；商标权与品牌规范仍归品牌方' : ''}`,
        svg: svg ? assetUrl : '', image: svg ? '' : assetUrl,
        sourceUrl, brand, web: true, source: 'Bing 国内图片',
        score: relevance(title, query, brand) + domainMatch
      });
    } catch { /* 跳过单个无法解析的搜索结果。 */ }
  }
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...candidate }) => candidate);
}

async function searchBingAssets({ query, brand, limit }) {
  const params = new URLSearchParams({
    q: brand ? `${query.replace(/\blogo\b/gi, '').trim()} logo 官方` : query,
    form: 'HDRSC2', first: '1', count: '35', setlang: 'zh-hans', cc: 'cn'
  });
  const response = await fetch(`https://cn.bing.com/images/search?${params}`, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.7'
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Bing 国内图片检索失败：${response.status}`);
  return parseBingImageResults(await response.text(), { query, brand, limit });
}

async function searchCommonsAssets({ query, brand, limit }) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: brand ? `${query.replace(/\blogo\b/gi, '').trim()} logo filetype:svg` : query,
    gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1000'
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'user-agent': 'MotionLayer/1.0 (asset reference research)' },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`Wikimedia Commons 检索失败：${response.status}`);
  const data = await response.json();
  return Object.values(data.query?.pages || {})
    .filter(page => {
      const mime = page.imageinfo?.[0]?.mime || '';
      if (!brand) return /^image\/(png|jpeg|webp|svg\+xml)$/.test(mime);
      const normalized = normalize(page.title);
      const brandName = normalize(query.replace(/\blogo\b/gi, ''));
      const remainder = normalized.startsWith(brandName) ? normalized.slice(brandName.length).trim() : '';
      const primaryBrand = remainder === '' || /^(?:ai\s+)?(?:\d{4}\s+)?(?:logo|symbol|wordmark|icon|favicon)(?:\s+\d{4})?$/.test(remainder);
      return mime === 'image/svg+xml' && primaryBrand && /logo|symbol|wordmark|icon|favicon/.test(normalized);
    })
    .sort((a, b) => relevance(b.title, query, brand) - relevance(a.title, query, brand) || latestYear(b.title) - latestYear(a.title) || (a.index || 0) - (b.index || 0))
    .slice(0, limit)
    .map(page => {
      const info = page.imageinfo[0];
      const metadata = info.extmetadata || {};
      const svg = info.mime === 'image/svg+xml';
      const license = plain(metadata.LicenseShortName?.value, '许可待核');
      const restrictions = plain(metadata.Restrictions?.value);
      return {
        id: `commons-${page.pageid}`,
        name: page.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
        author: plain(metadata.Artist?.value, 'Wikimedia Commons 贡献者'),
        license: `${license}${restrictions ? `；${restrictions}` : ''}${brand ? '；商标权与使用规范仍归品牌方' : ''}`,
        svg: svg ? info.url : '', image: svg ? '' : (info.thumburl || info.url),
        sourceUrl: info.descriptionurl, brand, web: true,
        source: 'Wikimedia Commons'
      };
    });
}

export function mergeAssetCandidates(domestic, commons, limit = 4) {
  const merged = [];
  const seen = new Set();
  for (let index = 0; index < Math.max(domestic.length, commons.length); index += 1) {
    for (const candidate of [domestic[index], commons[index]]) {
      if (!candidate) continue;
      const key = candidate.svg || candidate.image;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(candidate);
    }
  }
  return merged.slice(0, limit);
}

export async function researchWebAssets({ query: input, brand = false, limit = 4 } = {}) {
  const query = cleanQuery(input);
  if (!query) return [];
  const count = Math.max(1, Math.min(6, Number(limit) || 4));
  const options = { query, brand, limit: count };
  const [domestic, commons] = await Promise.allSettled([
    searchBingAssets(options),
    searchCommonsAssets(options)
  ]);
  if (domestic.status === 'rejected' && commons.status === 'rejected') {
    throw new Error(`${domestic.reason?.message || '国内图片检索失败'}；${commons.reason?.message || 'Wikimedia Commons 检索失败'}`);
  }
  return mergeAssetCandidates(
    domestic.status === 'fulfilled' ? domestic.value : [],
    commons.status === 'fulfilled' ? commons.value : [],
    count
  );
}
