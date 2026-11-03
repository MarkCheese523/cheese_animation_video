from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw
import json
import random
import shutil

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / "assets" / "iceland-candidates"
LIBRARY = ROOT / "assets" / "iceland-library"
INK = (23, 43, 50)
PAPER = (243, 240, 232)
BLUE = (127, 212, 232)
YELLOW = (255, 216, 77)

ASSETS = [
    {
        "asset_id": "scene-rainbow-street",
        "option": "S1-A",
        "file": "rainbow-day.jpg",
        "type": "scene",
        "accent": "#FFD84D",
        "source": {
            "url": "https://commons.wikimedia.org/wiki/File:Rainbow_Street_Reykjavik_Iceland.jpg",
            "creator": "APK",
            "license": "CC BY-SA 4.0",
            "usage_note": "Attribution, indicate changes, share adaptations under the same license."
        },
        "identifying_features": ["rainbow pavement perspective", "colorful street facades", "overcast sky"],
        "used_in": ["01-opening"]
    },
    {
        "asset_id": "scene-keflavik-airport",
        "option": "S2-A",
        "file": "airport-hall.jpg",
        "type": "scene",
        "accent": "#7FD4E8",
        "source": {
            "url": "https://commons.wikimedia.org/wiki/File:Keflav%C3%ADk_Airport_interior_2018.jpg",
            "creator": "Antony-22",
            "license": "CC BY-SA 4.0",
            "usage_note": "Attribution, indicate changes, share adaptations under the same license."
        },
        "identifying_features": ["geometric ceiling grid", "central aisle", "rows of seats"],
        "used_in": ["02-arrival"]
    },
    {
        "asset_id": "weather-cloud-break",
        "option": "W1-A",
        "file": "cloud-break.jpg",
        "type": "weather",
        "accent": "#FFD84D",
        "source": {
            "url": "https://unsplash.com/s/photos/sunlight-through-clouds",
            "creator": "CHUTTERSNAP",
            "license": "Unsplash License",
            "usage_note": "Texture and lighting reference; not presented as footage from the owner's trip."
        },
        "identifying_features": ["heavy cloud surround", "central warm opening", "diagonal light potential"],
        "used_in": ["02-arrival", "05-ending"]
    },
    {
        "asset_id": "landscape-glacier",
        "option": "L1-A",
        "file": "glacier-quiet.jpg",
        "type": "landscape",
        "accent": "#7FD4E8",
        "source": {
            "url": "https://commons.wikimedia.org/wiki/File:Eyjafjallaj%C3%B6kull.jpeg",
            "creator": "Andreas Tille",
            "license": "CC BY-SA 3.0",
            "usage_note": "Attribution, indicate changes, share adaptations under the same license."
        },
        "identifying_features": ["quiet glacier", "dark rock strata", "ice foreground", "no eruption"],
        "used_in": ["04-randomness"]
    }
]


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def edge_mask(image, threshold):
    gray = ImageOps.grayscale(image).filter(ImageFilter.GaussianBlur(1.1))
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges)
    return edges.point(lambda p: 0 if p < threshold else min(175, (p - threshold) * 3))


def add_coordinate_dots(image, seed, spacing=17):
    rng = random.Random(seed)
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(spacing // 2, image.height, spacing):
        for x in range(spacing // 2, image.width, spacing):
            radius = rng.choice((0.8, 1.0, 1.2, 1.4))
            alpha = rng.choice((18, 22, 26, 30))
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*INK, alpha))
    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def make_scene_master(record, index):
    target = LIBRARY / record["asset_id"]
    (target / "variants").mkdir(parents=True, exist_ok=True)
    source = CANDIDATES / record["file"]
    shutil.copy2(source, target / "reference.jpg")
    original = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    original.thumbnail((1280, 1800), Image.Resampling.LANCZOS)

    smooth = original.filter(ImageFilter.MedianFilter(3))
    poster = smooth.quantize(colors=14, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    poster = ImageEnhance.Color(poster).enhance(0.88)
    poster = ImageEnhance.Contrast(poster).enhance(1.07)
    master = Image.blend(original, poster, 0.82)
    edges = edge_mask(original, 36)
    master.paste(Image.new("RGB", master.size, INK), (0, 0), edges)
    master = add_coordinate_dots(master, 100 + index)
    master.save(target / "master.png", optimize=True)
    master.save(target / "variants" / "master-preview.jpg", quality=91, optimize=True)

    gray = ImageOps.grayscale(original)
    ink = ImageOps.colorize(gray, black=INK, white=PAPER, mid=hex_rgb(record["accent"]))
    ink = ink.quantize(colors=9, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    ink.paste(Image.new("RGB", ink.size, INK), (0, 0), edge_mask(original, 42))
    ink = add_coordinate_dots(ink, 200 + index, spacing=19)
    ink.save(target / "variants" / "ink.png", optimize=True)

    outline = Image.new("RGB", original.size, PAPER)
    outline_mask = edge_mask(original, 28).point(lambda p: min(220, p * 2))
    outline.paste(Image.new("RGB", original.size, INK), (0, 0), outline_mask)
    outline.save(target / "variants" / "outline.png", optimize=True)

    write_record(target, record, "master_pending", True, ["master.png", "variants/ink.png", "variants/outline.png"])


def write_record(target, record, status, approved_reference, variants):
    data = {
        "asset_id": record["asset_id"],
        "type": record["type"],
        "status": status,
        "version": 1,
        "selected_option": record["option"],
        "source": record["source"],
        "reference_file": "reference.jpg" if approved_reference else None,
        "master_file": "master.png" if (target / "master.png").exists() else ("master.svg" if (target / "master.svg").exists() else None),
        "identifying_features": record["identifying_features"],
        "approved_reference": approved_reference,
        "approved_master": False,
        "variants": variants,
        "used_in": record["used_in"]
    }
    (target / "asset.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def make_abstract_master():
    target = LIBRARY / "abstract-itinerary"
    (target / "variants").mkdir(parents=True, exist_ok=True)
    rng = random.Random(300)
    dots = []
    for y in range(18, 580, 22):
        for x in range(18, 1180, 22):
            if rng.random() < 0.13:
                dots.append(f'<circle cx="{x}" cy="{y}" r="{rng.choice((1.2, 1.6, 2.0))}" fill="#172B32" opacity=".22"/>')
    nodes = []
    for i, x in enumerate((140, 390, 640, 890)):
        label = "P" if i < 3 else "01"
        nodes.append(f'''<g transform="translate({x} 190)">
        <rect width="170" height="190" rx="28" fill="#FFFDF8" stroke="#172B32" stroke-width="4"/>
        <path d="M28 130 H142" stroke="#172B32" stroke-width="3" stroke-dasharray="3 10" opacity=".35"/>
        <circle cx="85" cy="78" r="38" fill="url(#nodeDots)" stroke="#172B32" stroke-width="3"/>
        <text x="85" y="91" text-anchor="middle" font-family="ui-monospace,monospace" font-size="34" font-weight="800" fill="#172B32">{label}</text>
        <text x="85" y="163" text-anchor="middle" font-family="PingFang SC,sans-serif" font-size="17" fill="#607078">旅行节点 {i + 1}</text>
        </g>''')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" role="img" aria-label="四人旅行节点与随机路线抽象母版">
    <defs><pattern id="nodeDots" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#7FD4E8" opacity=".34"/><circle cx="3" cy="3" r="1.5" fill="#172B32"/><circle cx="9" cy="9" r="1" fill="#172B32" opacity=".55"/></pattern></defs>
    <rect width="1200" height="600" fill="#F3F0E8"/>
    {''.join(dots)}
    <path d="M55 455 C220 380 275 535 440 455 S720 395 815 465 S1020 530 1140 425" fill="none" stroke="#172B32" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 16"/>
    <path d="M65 470 C240 555 350 370 510 475 S790 540 925 430" fill="none" stroke="#FF725E" stroke-width="5" stroke-linecap="round"/>
    {''.join(nodes)}
    <g font-family="PingFang SC,sans-serif" font-size="18" font-weight="700" fill="#172B32"><text x="70" y="70">四个节点 · 三个 P</text><text x="70" y="555">计划路线断开，随机路线重新连接</text></g>
    <g transform="translate(1010 55) rotate(7)"><rect width="120" height="95" rx="5" fill="#FFFDF8" stroke="#172B32" stroke-width="3"/><path d="M20 25 H92 M20 43 H75 M20 61 H85" stroke="#607078" stroke-width="4" stroke-linecap="round" opacity=".45"/></g>
    </svg>'''
    (target / "master.svg").write_text(svg, encoding="utf-8")
    shutil.copy2(target / "master.svg", target / "variants" / "nodes-route.svg")
    record = {
        "asset_id": "abstract-itinerary", "option": "G1", "type": "abstract",
        "source": {"url": "", "creator": "Kimi coordinate-generated abstract assets", "license": "Original abstract asset", "usage_note": "No real person, brand, program poster or navigation interface."},
        "identifying_features": ["four travel nodes", "three P labels", "abstract route reconnection", "blank itinerary"],
        "used_in": ["03-group", "04-randomness", "05-ending"]
    }
    write_record(target, record, "master_pending", True, ["variants/nodes-route.svg"])


def register_pending_magnet():
    target = LIBRARY / "object-weather-magnet"
    target.mkdir(parents=True, exist_ok=True)
    record = {
        "asset_id": "object-weather-magnet", "option": "O1-A", "type": "object",
        "source": {"url": "", "creator": "Owner photo pending", "license": "Owner authorization pending with photo", "usage_note": "Do not draw or substitute the unique magnet before the actual photo arrives."},
        "identifying_features": ["actual outline pending", "actual material pending", "weather quote"],
        "used_in": ["01-opening", "05-ending"]
    }
    write_record(target, record, "reference_pending", False, [])


if __name__ == "__main__":
    LIBRARY.mkdir(parents=True, exist_ok=True)
    for i, asset in enumerate(ASSETS):
        make_scene_master(asset, i)
    make_abstract_master()
    register_pending_magnet()
    manifest = {
        "project": "Iceland — allow everything to happen",
        "stage": "master_pending",
        "approved_reference_options": ["O1-A (photo pending)", "S1-A", "S2-A", "W1-A", "L1-A", "G1"],
        "approved_master": False,
        "assets": [p.name for p in sorted(LIBRARY.iterdir()) if p.is_dir()]
    }
    (LIBRARY / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Generated four scene masters and one abstract master; O1 remains photo-pending.")
