const PRIVATE_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|::1|\[::1\]|.*\.local$)/i;

export function assertPublicProductUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('只支持 http/https 网页地址');
  if (PRIVATE_HOST.test(url.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) throw new Error('不支持本机或私有网络地址');
  return url;
}

async function fetchText(url, timeout = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': 'MotionLayerProfile/1.0' } });
    if (!response.ok) throw new Error(`网页读取失败：${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!/text\/html|text\/css/.test(type)) throw new Error('目标不是网页或样式表');
    const text = await response.text();
    return text.slice(0, 1_200_000);
  } finally { clearTimeout(timer); }
}

const clean = value => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const unique = values => [...new Set(values.filter(Boolean))];

function colorsFrom(text) {
  const counts = new Map();
  for (const match of text.matchAll(/#[0-9a-f]{6}\b/gi)) {
    const color = match[0].toLowerCase();
    counts.set(color, (counts.get(color) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([color]) => color);
}

function isNeutral(color) {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 34;
}
function luminance(color) {
  const values = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);
  return values.reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}

function brandAssetsFromHtml(html, productUrl, productName) {
  const assets = new Map();
  for (const match of html.matchAll(/<(?:img|source|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const value = tag.match(/(?:src|href)=["']([^"']+)["']/i)?.[1] || '';
    if (!/\.(?:svg|png|webp)(?:\?|$)/i.test(value) || !/(?:logo|brand|wordmark|logotype)/i.test(`${tag} ${value}`)) continue;
    try {
      const url = new URL(value, productUrl).href;
      const label = clean(tag.match(/alt=["']([^"']+)["']/i)?.[1] || '') || `${productName} 品牌标识`;
      assets.set(url, {
        url, label: label.slice(0, 100), kind: /\.svg(?:\?|$)/i.test(value) ? 'svg' : 'image',
        sourceUrl: productUrl, author: productName, license: '产品页面真实资产；商标与使用许可待确认'
      });
    } catch { /* Ignore malformed asset URLs. */ }
  }
  return [...assets.values()].slice(0, 4);
}

export function profileFromHtml(html, productUrl, css = '') {
  const source = `${html}\n${css}`;
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '') || new URL(productUrl).hostname;
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || '';
  const palette = colorsFrom(source);
  const accent = palette.find(color => !isNeutral(color)) || '#635bff';
  const background = palette.find(color => luminance(color) > .82) || '#f7f7f5';
  const ink = palette.find(color => luminance(color) < .28) || '#17171c';
  const fonts = unique([...source.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map(match => match[1].trim().split(',')[0].replace(/["']/g, ''))).slice(0, 4);
  const radii = unique([...source.matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?px)/gi)].map(match => match[1])).slice(0, 4);
  const components = unique([
    /<button\b/i.test(html) && '按钮', /<nav\b/i.test(html) && '导航', /<table\b/i.test(html) && '表格',
    /<input\b/i.test(html) && '输入控件', /<svg\b/i.test(html) && 'SVG 图标',
    /class=["'][^"']*(card|panel)/i.test(html) && '卡片', /class=["'][^"']*(modal|dialog)/i.test(html) && '弹窗'
  ]);
  const assets = unique([...html.matchAll(/(?:src|href)=["']([^"']+\.(?:svg|png|webp))(?:\?[^"']*)?["']/gi)].map(match => {
    try { return new URL(match[1], productUrl).href; } catch { return ''; }
  })).slice(0, 8);
  return {
    source: 'web-product', name: title.slice(0, 80), url: productUrl, description: description.slice(0, 240),
    tokens: { accent, background, ink, radius: radii[0] || '12px', fontFamily: fonts[0] || '系统字体' },
    palette: palette.slice(0, 8), components: components.length ? components : ['界面组件待确认'], assets,
    brandAssets: brandAssetsFromHtml(html, productUrl, title.slice(0, 80)),
    fidelity: 'component', motionIntensity: 'balanced', capturedAt: new Date().toISOString(), confirmation: 'pending'
  };
}

export async function researchProduct(value) {
  const url = assertPublicProductUrl(value);
  const html = await fetchText(url);
  const links = [...html.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)].slice(0, 3);
  const cssParts = [];
  for (const tag of links) {
    const href = tag[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try { cssParts.push(await fetchText(new URL(href, url), 5000)); } catch { /* HTML tokens remain usable. */ }
  }
  return profileFromHtml(html, url.href, cssParts.join('\n'));
}
