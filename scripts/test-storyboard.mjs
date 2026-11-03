import assert from 'node:assert/strict';
import { buildStoryboard } from '../storyboard.mjs';
import { makeAgentAnalysis } from './fixtures/agent-analysis.mjs';

const agentJobId = 'motion-11111111-1111-4111-8111-111111111111';
const agentAnalysis = makeAgentAnalysis(agentJobId, { product: true });
const masterJobId = 'motion-22222222-2222-4222-8222-222222222222';
const agentMaster = sourceId => ({ sourceId, variant: 'ink', previewUrl: `/studio/production-jobs/${masterJobId}/masters/N1/ink.svg`, agentJobId: masterJobId, version: 1, approved: true });
const selected = {
  id: 'lucide:file-check', name: 'File Check', author: 'Lucide', license: 'ISC',
  svg: 'https://api.iconify.design/lucide/file-check.svg', referenceApproved: true,
  master: agentMaster('lucide:file-check')
};
const brandSelected = {
  id: 'product-B1-0', choiceId: 'B1-A', name: 'Component Demo · 产品真实标识', brand: true,
  author: 'Component Demo', license: '虚构产品自带标识', svg: '/studio/demo/component-demo-logo.svg',
  sourceUrl: '/studio/demo/component-demo-logo.svg', referenceApproved: true,
  master: agentMaster('product-B1-0')
};
const input = {
  mode: 'product', style: 'cream-neon', fidelity: 'faithful', intensity: 'showreel',
  script: '凭证生成后，点击确认并完成同步。', agentJobId, agentAnalysis,
  confirmations: { storyboard: true, references: true, masters: true },
  profile: {
    source: 'web-product', name: 'Component Demo', url: 'https://example.com',
    tokens: { accent: '#635bff', background: '#f7f7f5', ink: '#17171c', radius: '18px', fontFamily: 'Inter' },
    components: ['按钮', '卡片']
  },
  elements: [
    { slotId: 'credential', concept: '凭证', action: '绘制、展开、核验', query: 'file check', selected },
    { slotId: 'B1', kind: 'brand', concept: 'Component Demo', action: '原始比例揭示', query: 'Component Demo', selected: brandSelected }
  ]
};
const { storyboard, project } = buildStoryboard(input);
assert.equal(storyboard.profile.name, 'Component Demo');
assert.equal(storyboard.profile.tokens.accent, '#635bff');
assert.equal(storyboard.profile.tokens.background, '#f7f7f5');
assert.equal(storyboard.profile.tokens.ink, '#17171c');
assert.equal(storyboard.fidelity, 'faithful');
assert.equal(storyboard.motion.intensity, 'showreel');
assert.equal(storyboard.elements[0].selected.license, 'ISC');
assert.equal(storyboard.elements[0].selected.name, 'File Check');
assert.equal(storyboard.elements[1].kind, 'brand');
assert.equal(storyboard.elements[1].selected.brand, true);
assert.equal(storyboard.elements[1].selected.svg, '/studio/demo/component-demo-logo.svg');
assert.equal(storyboard.elements[1].selected.choiceId, 'B1-A');
assert.equal(storyboard.motion.primary, 'cursor-click');
assert.equal(storyboard.motion.transition, 'button-to-panel');
assert.deepEqual(storyboard.motion.feedback, ['card-reflow', 'icon-check']);
assert.equal(storyboard.beats.length, 5);
assert.equal(storyboard.beats[0].start, 0);
assert.equal(storyboard.beats.at(-1).start + storyboard.beats.at(-1).duration, 20);
storyboard.beats.slice(1).forEach((beat, index) => {
  const previous = storyboard.beats[index];
  assert.equal(beat.start, previous.start + previous.duration);
});
assert.equal(project.scenes[0].type, 'motionSequence');
assert.equal(project.scenes[0].duration, 20);
assert.equal(project.scenes[0].props.motion.intensity, 'showreel');

const dark = buildStoryboard({ ...input, mode: 'generic', style: 'dark-narrative' });
assert.equal(dark.project.scenes[0].type, 'darkNarrativeSequence');
assert.equal(dark.project.scenes[0].props.assetBase, '../demo/assets/walk');
assert.deepEqual(storyboard.confirmations, { storyboard: true, references: true, masters: true });
assert.equal(storyboard.elements[0].selected.master.approved, true);
assert.equal(storyboard.elements[0].selected.master.agentJobId, masterJobId);
assert.match(storyboard.elements[0].selected.master.previewUrl, /\/masters\/N1\/ink\.svg$/);
assert.throws(() => buildStoryboard({ ...input, agentJobId: '' }), /Agent 拆解结果/);
assert.throws(() => buildStoryboard({ ...input, confirmations: { ...input.confirmations, storyboard: false } }), /确认 Agent 拆解的分镜/);
assert.throws(() => buildStoryboard({ ...input, confirmations: { ...input.confirmations, references: false } }), /确认网上参考与元素/);
assert.throws(() => buildStoryboard({ ...input, elements: [{ ...input.elements[0], selected: null }] }), /每个元素选择参考/);
assert.throws(() => buildStoryboard({ ...input, confirmations: { ...input.confirmations, masters: false } }), /确认全部重绘母版/);
assert.throws(() => buildStoryboard({ ...input, elements: [{ ...input.elements[0], selected: { ...selected, master: { ...selected.master, approved: false } } }] }), /母版.*明确确认/);
assert.throws(() => buildStoryboard({ ...input, elements: [{ ...input.elements[0], selected: { ...selected, master: { sourceId: selected.id, variant: 'ink', version: 1, approved: true } } }] }), /Agent 回写的真实文件/);
assert.throws(() => buildStoryboard({ ...input, profile: null }), /Product Profile/);
assert.throws(() => buildStoryboard({ ...input, elements: [input.elements[0]] }), /品牌 Logo 或纯文字标识/);

const customBeats = storyboard.beats.map((beat, index) => ({
  ...beat, label: index === 0 ? '开场聚集' : beat.label,
  duration: index === 0 ? 4 : beat.duration,
  action: index === 1 ? 'direct-press' : beat.action
}));
const custom = buildStoryboard({ ...input, beats: customBeats });
assert.equal(custom.storyboard.beats[0].label, '开场聚集');
assert.equal(custom.storyboard.beats[0].duration, 4);
assert.equal(custom.storyboard.beats[1].start, 4);
assert.equal(custom.storyboard.beats[1].action, 'direct-press');
assert.equal(custom.storyboard.motion.primary, 'direct-press');
assert.equal(custom.storyboard.duration, 21);
assert.equal(custom.project.scenes[0].duration, 21);
assert.throws(() => buildStoryboard({ ...input, beats: customBeats.map((beat, index) => index === 0 ? { ...beat, duration: 0 } : beat) }), /1–12 秒/);
console.log('PASS 分镜配置、五拍编辑、连续时序、元素许可、产品档案与深色资源路径');
