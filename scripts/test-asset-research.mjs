import assert from 'node:assert/strict';
import { mergeAssetCandidates, parseBingImageResults } from '../asset-research.mjs';

const payload = value => JSON.stringify(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const html = [
  `<a class="iusc" m="${payload({ murl: 'https://hunyuan.tencent.com/assets/hunyuan.svg', purl: 'https://hunyuan.tencent.com/', t: '腾讯混元官方 Logo', md5: 'svg-id' })}">`,
  `<a class="iusc" m="${payload({ murl: 'https://example.cn/hunyuan.png', purl: 'https://example.cn/article', t: '腾讯混元标识参考', md5: 'png-id' })}">`,
  `<a class="iusc" m="${payload({ murl: 'https://example.cn/office.png', purl: 'https://example.cn/office', t: '普通办公场景', md5: 'noise-id' })}">`,
  '<a class="iusc" m="{broken}">'
].join('\n');

const parsed = parseBingImageResults(html, { query: 'Tencent Hunyuan 腾讯混元品牌标识', brand: true, limit: 4 });
assert.equal(parsed.length, 2, '应保留品牌图像并过滤无关与损坏结果');
assert.equal(parsed[0].source, 'Bing 国内图片');
assert.equal(parsed[0].svg, 'https://hunyuan.tencent.com/assets/hunyuan.svg');
assert.equal(parsed[0].author, 'hunyuan.tencent.com');
assert.equal(parsed[1].image, 'https://example.cn/hunyuan.png');
assert.ok(parsed.every(candidate => candidate.web && candidate.brand && candidate.sourceUrl));
assert.ok(parsed.every(candidate => candidate.license.includes('来源页核验')));

const commons = [{ id: 'commons-1', svg: 'https://upload.wikimedia.org/tencent.svg', image: '', source: 'Wikimedia Commons' }];
const merged = mergeAssetCandidates(parsed, commons, 4);
assert.equal(merged.length, 3);
assert.equal(merged[0].source, 'Bing 国内图片');
assert.equal(merged[1].source, 'Wikimedia Commons', '融合时应保留原有矢量来源');
assert.equal(mergeAssetCandidates([], commons, 4).length, 1, '国内源无结果时仍可使用 Commons');
assert.equal(mergeAssetCandidates(parsed, [], 4).length, 2, 'Commons 失败时仍应返回国内候选');
assert.equal(mergeAssetCandidates([parsed[1], parsed[1]], [], 4).length, 1, '相同图片地址应去重');

console.log('国内图片搜索解析、品牌过滤与双源融合测试通过');
