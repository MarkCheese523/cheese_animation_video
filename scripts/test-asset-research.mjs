import assert from 'node:assert/strict';
import { isPrimaryBrandAsset, latinBrandName, mergeAssetCandidates, parseBingImageResults } from '../asset-research.mjs';

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

// 品牌检索双名回归：Commons 只认英文名，中文名会把命中清零。
assert.equal(latinBrandName('Qualcomm 高通'), 'Qualcomm', 'Commons 应只保留品牌英文名');
assert.equal(latinBrandName('MediaTek 联发科'), 'MediaTek', 'Commons 应只保留品牌英文名');
assert.equal(latinBrandName('Apple 苹果'), 'Apple', 'Commons 应只保留品牌英文名');
assert.equal(latinBrandName('联发科'), '', '没有英文名时不应臆造');
assert.ok(isPrimaryBrandAsset('File:Qualcomm-Logo.svg', 'Qualcomm'), '官方 Logo 应通过品牌判定');
assert.ok(isPrimaryBrandAsset('File:Qualcomm Logo 2018.svg', 'Qualcomm'), '带年份的官方 Logo 应通过');
assert.ok(isPrimaryBrandAsset('File:Apple logo black.svg', 'Apple'), '品牌主 Logo 应通过');
assert.ok(!isPrimaryBrandAsset('File:Qualcomm-BREW.svg', 'Qualcomm'), '子品牌不应被当成品牌主标识');
assert.ok(!isPrimaryBrandAsset('File:Snapdragon logo.svg', 'Qualcomm'), '别家 Logo 不应混入');
assert.ok(!isPrimaryBrandAsset('File:Qualcomm-1.svg', 'Qualcomm'), '非 Logo 文件不应通过');

console.log('国内图片搜索解析、品牌过滤与双源融合测试通过');
