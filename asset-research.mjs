import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

function plain(value, fallback = '') {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || fallback;
}
function cleanQuery(value) {
  return String(value || '').replace(/\b(official|svg|vector)\b/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}
function relevance(title, query, brand) {
  const normalized = title.toLowerCase().replace(/^file:/, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const needle = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const brandNeedle = needle.replace(/\blogo\b/g, '').replace(/\s+/g, ' ').trim();
  const exact = brand ? `${brandNeedle} logo` : needle;
  if (normalized === exact) return 100;
  if (brand && normalized.includes(brandNeedle)) return 70;
  if (normalized.startsWith(`${needle} `)) return 60;
  if (normalized.includes(needle)) return 40;
  return 0;
}
function latestYear(title) {
  return Math.max(0, ...[...title.matchAll(/\b(19|20)\d{2}\b/g)].map(match => Number(match[0])));
}

export async function researchWebAssets({ query: input, brand = false, limit = 4 } = {}) {
  const query = cleanQuery(input);
  if (!query) return [];
  const count = Math.max(1, Math.min(6, Number(limit) || 4));
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: brand ? `${query.replace(/\blogo\b/gi, '').trim()} logo filetype:svg` : query,
    gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1000'
  });
  let data;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'user-agent': 'MotionLayer/1.0 (asset reference research)' },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error(`互联网图片检索失败：${response.status}`);
      data = await response.json();
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  if (!data) throw lastError || new Error('互联网图片检索失败');
  return Object.values(data.query?.pages || {})
    .filter(page => {
      const mime = page.imageinfo?.[0]?.mime || '';
      if (!brand) return /^image\/(png|jpeg|webp|svg\+xml)$/.test(mime);
      const title = page.title.toLowerCase();
      const normalized = title.replace(/^file:/, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
      const brandName = query.replace(/\blogo\b/gi, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const remainder = normalized.startsWith(brandName) ? normalized.slice(brandName.length).trim() : '';
      const primaryBrand = remainder === '' || /^(?:ai\s+)?(?:\d{4}\s+)?(?:logo|symbol|wordmark|icon|favicon)(?:\s+\d{4})?$/.test(remainder);
      return mime === 'image/svg+xml' && primaryBrand && /logo|symbol|wordmark|icon|favicon/.test(normalized);
    })
    .sort((a, b) => relevance(b.title, query, brand) - relevance(a.title, query, brand) || latestYear(b.title) - latestYear(a.title) || (a.index || 0) - (b.index || 0))
    .slice(0, count)
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
