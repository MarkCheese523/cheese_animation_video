from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import xml.etree.ElementTree as ET
import shutil
import json
import random

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / 'assets' / 'candidates'
LIBRARY = ROOT / 'assets' / 'library'
INK = '#102a22'
GREEN = '#c6ff3d'


def prepare(asset_id, reference):
    target = LIBRARY / asset_id
    (target / 'variants').mkdir(parents=True, exist_ok=True)
    shutil.copy2(CANDIDATES / reference, target / ('reference' + Path(reference).suffix))
    return target


def vector_variants(asset_id, reference, stroke_width):
    target = prepare(asset_id, reference)
    source = target / ('reference' + Path(reference).suffix)
    shutil.copy2(source, target / 'variants' / 'original.svg')
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    shape_tags = ('path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line')

    for mode in ('dot-matrix', 'ink', 'outline'):
        tree = ET.parse(source)
        root = tree.getroot()
        original_paths = [node.attrib.get('d') for node in root.iter() if node.tag.endswith('path')]
        root.attrib['role'] = 'img'
        root.attrib['aria-label'] = f'{asset_id} {mode}'
        for child in list(root):
            if child.tag.endswith('defs'):
                root.remove(child)

        if mode == 'dot-matrix':
            view_box = [float(value) for value in root.attrib.get('viewBox', '0 0 100 100').split()]
            spacing = max(2.4, min(view_box[2], view_box[3]) / 24)
            tile = spacing * 4
            namespace = 'http://www.w3.org/2000/svg'
            defs = ET.Element(f'{{{namespace}}}defs')
            pattern = ET.SubElement(defs, f'{{{namespace}}}pattern', {
                'id': f'{asset_id}-dots', 'width': str(tile), 'height': str(tile),
                'patternUnits': 'userSpaceOnUse',
            })
            radii = (0.20, 0.23, 0.26, 0.29)
            for row in range(4):
                for column in range(4):
                    index = row * 4 + column
                    color = '#6d7b70' if index == 6 else (GREEN if index == 13 else INK)
                    ET.SubElement(pattern, f'{{{namespace}}}circle', {
                        'cx': str((column + 0.5) * spacing),
                        'cy': str((row + 0.5) * spacing),
                        'r': str(spacing * radii[index % 4]), 'fill': color,
                    })
            root.insert(0, defs)
            root.attrib['data-derivation'] = 'original-geometry-preserved-dot-fill-only'

        for node in root.iter():
            node.attrib.pop('class', None)
            node.attrib.pop('style', None)
            if not node.tag.endswith(shape_tags):
                continue
            if node.attrib.get('fill') == 'none':
                continue
            if mode == 'dot-matrix':
                node.attrib['fill'] = f'url(#{asset_id}-dots)'
                node.attrib['stroke'] = INK
                node.attrib['stroke-width'] = str(stroke_width * 0.65)
                node.attrib['stroke-linejoin'] = 'round'
            elif mode == 'ink':
                node.attrib['fill'] = INK
                node.attrib.pop('stroke', None)
            else:
                node.attrib['fill'] = 'none'
                node.attrib['stroke'] = INK
                node.attrib['stroke-width'] = str(stroke_width)
                node.attrib['stroke-linejoin'] = 'round'
                node.attrib['stroke-linecap'] = 'round'

        current_paths = [node.attrib.get('d') for node in root.iter() if node.tag.endswith('path')]
        if current_paths != original_paths:
            raise RuntimeError(f'{asset_id} 的品牌路径在风格化中发生变化')
        if mode == 'dot-matrix':
            tree.write(target / 'master.svg', encoding='utf-8', xml_declaration=True)
        tree.write(target / 'variants' / f'{mode}.svg', encoding='utf-8', xml_declaration=True)
    return target


# 人物：只从已确认照片提取头肩外轮廓。内部点阵与照片亮度无关，绝不保留五官或面部明暗。
person = prepare('person-dario-amodei', 'dario-official.webp')
import numpy as np
from scipy import ndimage
from PIL import ImageDraw

image = Image.open(person / 'reference.webp').convert('RGB')
source = np.asarray(image).astype(np.float32)
height, width = source.shape[:2]

# 用顶部及左右上缘的真实背景拟合平滑底色，分离人物外形；不提取任何内部五官边缘。
border = np.zeros((height, width), dtype=bool)
border[:45, :] = True
border[:330, :24] = True
border[:330, -24:] = True
yy, xx = np.mgrid[:height, :width]
design = np.column_stack([
    np.ones(border.sum()), xx[border] / width, yy[border] / height,
    (xx[border] * yy[border]) / (width * height),
])
coefficients = np.linalg.lstsq(design, source[border], rcond=None)[0]
background = np.stack([
    np.full((height, width), 1.0), xx / width, yy / height,
    (xx * yy) / (width * height),
], axis=-1) @ coefficients
difference = np.linalg.norm(source - background, axis=2)
rough = difference > 24
rough = ndimage.binary_closing(rough, structure=np.ones((9, 9)))
labels, count = ndimage.label(rough)
if count == 0:
    raise RuntimeError('未能从参考照片分离人物轮廓')
sizes = ndimage.sum(rough, labels, range(1, count + 1))
subject = labels == (int(np.argmax(sizes)) + 1)
subject = ndimage.binary_closing(subject, structure=np.ones((13, 13)))
subject = ndimage.binary_fill_holes(subject)
subject = ndimage.binary_opening(subject, structure=np.ones((3, 3)))
subject = ndimage.gaussian_filter(subject.astype(float), 1.3) > 0.5

size = (1280, 1600)
mask_image = Image.fromarray((subject * 255).astype(np.uint8)).resize(size, Image.Resampling.LANCZOS)
mask = np.asarray(mask_image) > 127
paper = '#f4f0e6'
master = Image.new('RGB', size, paper)
particle_layer = Image.new('RGB', size, paper)
draw = ImageDraw.Draw(particle_layer)
random.seed(50)

# 规则点阵只由坐标和随机数控制，不读取源图亮度，因此不会重建面部特征。
for y in range(14, size[1], 20):
    for x in range(14, size[0], 20):
        radius = random.choice((2.0, 2.4, 2.8, 3.2, 3.8))
        color = INK if random.random() > 0.075 else '#6d7b70'
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
for _ in range(210):
    x, y = random.randrange(size[0]), random.randrange(size[1])
    radius = random.choice((2, 3, 4, 5))
    color = GREEN if random.random() > 0.35 else INK
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
master.paste(particle_layer, (0, 0), mask_image)

# 连续外描边明确头肩、抬手与肩线；内部没有照片纹理。
inner = ndimage.binary_erosion(mask, iterations=5)
outline = mask & ~inner
pixels = np.asarray(master).copy()
pixels[outline] = (16, 42, 34)
master = Image.fromarray(pixels)
master.save(person / 'master.png', optimize=True)
preview = master.convert('RGB')
preview.save(person / 'variants' / 'master-preview.jpg', quality=91, optimize=True)

# 创始团队：按已确认方案只建立实名文字节点，不合成虚构人像。
founders = LIBRARY / 'group-anthropic-founders'
(founders / 'variants').mkdir(parents=True, exist_ok=True)
founder_names = ['Dario Amodei', 'Daniela Amodei', 'Tom Brown', 'Jack Clark', 'Jared Kaplan', 'Sam McCandlish', 'Chris Olah']
(founders / 'master.json').write_text(json.dumps({
    'representation': 'seven_named_text_nodes',
    'names': founder_names,
    'portrait_policy': 'Only Dario uses the face-free outline dot-matrix master; no fabricated portraits or group photo.',
    'node_style': {
        'ink': INK, 'accent': GREEN, 'shape': 'abstract_named_nodes',
        'texture': 'dot_matrix', 'dot_fill_source': 'coordinate_pattern_only'
    }
}, ensure_ascii=False, indent=2), encoding='utf-8')

vector_variants('brand-claude', 'claude-symbol.svg', 1.5)
vector_variants('brand-anthropic', 'anthropic-wordmark.svg', 1.8)
vector_variants('brand-amazon', 'amazon-2024.svg', 1.2)
vector_variants('brand-google', 'google-2026.svg', 1.2)

# 每个目录记录当前阶段：参考已确认，母版仍待用户确认。
for asset_dir in LIBRARY.iterdir():
    if not asset_dir.is_dir():
        continue
    record = {
        'asset_id': asset_dir.name,
        'status': 'master_pending',
        'version': 2,
        'approved_reference': True,
        'approved_master': False,
        'master_rule': 'Face-free outline dot matrix for people; original geometry with dot fill for brands; no invented geometry.'
    }
    (asset_dir / 'asset.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')

print('已生成 6 项风格化母版及变体，等待第二道用户确认。')
