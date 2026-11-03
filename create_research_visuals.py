import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

plt.rcParams['font.family'] = ['Noto Sans CJK SC', 'PingFang SC', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

COLORS = {
    'ink': '#172033',
    'muted': '#64748B',
    'blue': '#356AE6',
    'teal': '#0E9F8C',
    'orange': '#E58A2B',
    'pale_blue': '#EAF0FF',
    'pale_teal': '#E6F7F3',
    'pale_orange': '#FFF3E3',
    'paper': '#FAFBFD',
}

# Conceptual pipeline diagram
fig, ax = plt.subplots(figsize=(14, 7), dpi=160)
fig.patch.set_facecolor(COLORS['paper'])
ax.set_facecolor(COLORS['paper'])
ax.set_xlim(0, 14)
ax.set_ylim(0, 7)
ax.axis('off')

ax.text(0.6, 6.35, '文章所述“代码驱动动效工作室”生产闭环', fontsize=23, fontweight='bold', color=COLORS['ink'])
ax.text(0.6, 5.86, '模型负责规划、编程与视觉复查；浏览器和 FFmpeg 负责实际成片', fontsize=12.5, color=COLORS['muted'])

boxes = [
    (0.6, 3.65, 2.25, 1.25, '① 创意输入', '参考图 · 品牌资产\n时长 · 规格 · 分镜', COLORS['pale_blue'], COLORS['blue']),
    (3.35, 3.65, 2.25, 1.25, '② 动画程序', 'seek(t) / 帧号纯函数\n场景组件 · 弹簧运动', COLORS['pale_blue'], COLORS['blue']),
    (6.1, 3.65, 2.25, 1.25, '③ 逐帧渲染', 'Headless Browser\n固定字体 · 随机种子', COLORS['pale_teal'], COLORS['teal']),
    (8.85, 3.65, 2.25, 1.25, '④ 编码合成', 'FFmpeg\n帧序列 + 音频 → MP4', COLORS['pale_teal'], COLORS['teal']),
    (11.6, 3.65, 1.8, 1.25, '⑤ 交付', '多比例导出\n源码与 README', COLORS['pale_orange'], COLORS['orange']),
]
for x, y, w, h, title, body, fill, edge in boxes:
    patch = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.04,rounding_size=0.12',
                           linewidth=1.5, edgecolor=edge, facecolor=fill)
    ax.add_patch(patch)
    ax.text(x + 0.16, y + h - 0.31, title, fontsize=13.5, fontweight='bold', color=COLORS['ink'])
    ax.text(x + 0.16, y + 0.27, body, fontsize=10.5, color=COLORS['muted'], linespacing=1.5)

for i in range(len(boxes) - 1):
    x, y, w, h, *_ = boxes[i]
    nx, ny, nw, nh, *_ = boxes[i + 1]
    ax.add_patch(FancyArrowPatch((x + w + 0.08, y + h/2), (nx - 0.08, ny + nh/2),
                                 arrowstyle='-|>', mutation_scale=15, linewidth=1.5, color='#94A3B8'))

# Feedback loop
ax.add_patch(FancyArrowPatch((9.95, 3.48), (4.45, 3.48), connectionstyle='arc3,rad=-0.32',
                             arrowstyle='-|>', mutation_scale=17, linewidth=2.2, color=COLORS['orange']))
ax.text(5.45, 1.38, '视觉自检与导演反馈：联系表 → 找出最差三项 → 局部修改 → 重新渲染',
        fontsize=12.5, fontweight='bold', color=COLORS['orange'], ha='center')
ax.text(7.0, 0.55, '关键边界：自检评分不是客观验收；最终仍需人工审美与技术 QA',
        fontsize=11, color=COLORS['muted'], ha='center')

plt.tight_layout(pad=0.6)
plt.savefig('research-pipeline.png', bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)

# Data-driven frame count chart
fig, ax = plt.subplots(figsize=(11, 6.5), dpi=160)
fig.patch.set_facecolor(COLORS['paper'])
ax.set_facecolor(COLORS['paper'])
durations = np.array([15, 30, 60, 142])
for fps, color, marker, label_offset in [
    (24, COLORS['blue'], 'o', -16),
    (30, COLORS['teal'], 's', 9),
    (60, COLORS['orange'], '^', 10),
]:
    frames = durations * fps
    ax.plot(durations, frames, label=f'{fps} fps', color=color, linewidth=2.5, marker=marker, markersize=7)
    for x, y in zip(durations, frames):
        ax.annotate(f'{y:,}', (x, y), textcoords='offset points', xytext=(0, label_offset), ha='center', fontsize=9, color=color)

ax.set_title('视频时长与逐帧渲染工作量', fontsize=20, fontweight='bold', color=COLORS['ink'], loc='left', pad=22)
ax.text(0, 1.015, '帧数 = 时长（秒）× 帧率；不包含重复修改与重渲', transform=ax.transAxes, fontsize=11.5, color=COLORS['muted'])
ax.set_xlabel('视频时长（秒）', fontsize=12, color=COLORS['ink'])
ax.set_ylabel('需要生成的帧数（帧）', fontsize=12, color=COLORS['ink'])
ax.set_xticks(durations)
ax.set_ylim(0, 9200)
ax.grid(axis='y', color='#DDE3EC', linewidth=0.8)
ax.spines[['top', 'right']].set_visible(False)
ax.spines[['left', 'bottom']].set_color('#CBD5E1')
ax.tick_params(colors=COLORS['muted'])
ax.legend(frameon=False, loc='upper left', fontsize=11)
plt.tight_layout()
plt.savefig('research-frame-counts.png', bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close(fig)
