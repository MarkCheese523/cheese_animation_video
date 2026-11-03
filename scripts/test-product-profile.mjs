import assert from 'node:assert/strict';
import { assertPublicProductUrl, profileFromHtml } from '../product-profile.mjs';

assert.equal(assertPublicProductUrl('https://example.com').hostname, 'example.com');
assert.throws(() => assertPublicProductUrl('http://127.0.0.1:7100'), /私有网络|本机/);
assert.throws(() => assertPublicProductUrl('file:///tmp/product.html'), /http\/https/);

const html = `<!doctype html><html><head><title>Demo Product</title><meta name="description" content="A component demo"><style>:root{--accent:#635bff;--paper:#f7f7f5;--ink:#17171c}body{font-family:"Inter",sans-serif}.card{border-radius:16px;background:#f7f7f5;color:#17171c}</style></head><body><nav></nav><button>Start</button><div class="card"></div><svg></svg><img class="product-logo" alt="Demo Product Logo" src="/assets/mark.svg"><img src="/assets/photo.webp"></body></html>`;
const profile = profileFromHtml(html, 'https://example.com/product');
assert.equal(profile.name, 'Demo Product');
assert.equal(profile.tokens.accent, '#635bff');
assert.equal(profile.tokens.background, '#f7f7f5');
assert.equal(profile.tokens.ink, '#17171c');
assert.equal(profile.tokens.radius, '16px');
assert.equal(profile.tokens.fontFamily, 'Inter');
assert.ok(profile.components.includes('按钮'));
assert.ok(profile.components.includes('卡片'));
assert.equal(profile.assets[0], 'https://example.com/assets/mark.svg');
assert.equal(profile.brandAssets.length, 1);
assert.equal(profile.brandAssets[0].url, 'https://example.com/assets/mark.svg');
assert.equal(profile.brandAssets[0].kind, 'svg');
assert.equal(profile.brandAssets[0].label, 'Demo Product Logo');
assert.equal(profile.brandAssets[0].sourceUrl, 'https://example.com/product');
assert.equal(profile.confirmation, 'pending');
console.log('PASS Product Profile 提取、资产解析与私有地址拦截');
