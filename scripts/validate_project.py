#!/usr/bin/env python3
"""Validate project timing, scene registration, subtitles, and media paths.

单位契约（同一个 scene 对象里混着两种单位，最容易静默出错的地方）：
  scenes[].start    单位【秒】—— 全片绝对起点
  scenes[].duration 单位【秒】—— 本场景时长
  scenes[].timing.* 单位【毫秒】—— 相对本场景起点的偏移

`scenes[].duration` 写 12634（把 12.634 秒写成毫秒）不会报错，只会让画面停在三小时之后。
所以这里接了 assets/template/project.schema.json，并在 Schema 之外再加一条量纲启发式。
"""
import argparse
import json
import re
import sys
from pathlib import Path

BUILTINS = {"counter", "flow", "compare", "reveal", "end", "motionSequence"}

# 量纲启发式阈值：duration 超过它，99% 是把秒写成了毫秒
MAX_SCENE_SECONDS = 600

# rule: E30


def load_schema(root: Path):
    """读取工程内的 JSON Schema（若存在）。缺失时返回 None，校验自动降级。"""
    path = root / "project.schema.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def resolve_ref(root: dict, ref: str):
    """只支持 #/$defs/xxx 这种本地引用 —— 本仓库的 Schema 不需要远端引用。"""
    if not ref.startswith("#/"):
        return None
    node = root
    for part in ref[2:].split("/"):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def validate_against_schema(instance, schema, root, path="$"):
    """JSON Schema Draft 2020-12 的最小子集校验器（零依赖）。

    支持：type / required / properties / additionalProperties / items / enum /
    minimum / maximum / minLength / minItems / pattern / $ref。
    本仓库的 project.schema.json 只用到这些；不需要第三方库。
    """
    errors = []
    if not isinstance(schema, dict):
        return errors
    if "$ref" in schema:
        target = resolve_ref(root, schema["$ref"])
        if target is None:
            errors.append(f"{path} 的 $ref 无法解析：{schema['$ref']}")
        else:
            errors.extend(validate_against_schema(instance, target, root, path))
        return errors

    expected = schema.get("type")
    if expected:
        kinds = expected if isinstance(expected, list) else [expected]
        ok = False
        for kind in kinds:
            if kind == "object":
                ok = ok or isinstance(instance, dict)
            elif kind == "array":
                ok = ok or isinstance(instance, list)
            elif kind == "string":
                ok = ok or isinstance(instance, str)
            elif kind == "integer":
                ok = ok or (isinstance(instance, int) and not isinstance(instance, bool))
            elif kind == "number":
                ok = ok or (isinstance(instance, (int, float)) and not isinstance(instance, bool))
            elif kind == "boolean":
                ok = ok or isinstance(instance, bool)
            elif kind == "null":
                ok = ok or instance is None
        if not ok:
            errors.append(f"{path} 期望类型 {expected}，实际 {type(instance).__name__}")
            return errors

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(f"{path} 取值 {instance!r} 不在允许集合 {schema['enum']}")

    if isinstance(instance, str):
        if "minLength" in schema and len(instance) < schema["minLength"]:
            errors.append(f"{path} 长度不足 {schema['minLength']}")
        if "pattern" in schema and not re.search(schema["pattern"], instance):
            errors.append(f"{path} 不符合格式 {schema['pattern']}")

    if isinstance(instance, (int, float)) and not isinstance(instance, bool):
        if "minimum" in schema and instance < schema["minimum"]:
            errors.append(f"{path} 小于下限 {schema['minimum']}")
        if "maximum" in schema and instance > schema["maximum"]:
            errors.append(f"{path} 大于上限 {schema['maximum']}")

    if isinstance(instance, dict):
        for key in schema.get("required", []):
            if key not in instance:
                errors.append(f"{path} 缺少必填字段 {key}")
        properties = schema.get("properties", {})
        for key, value in instance.items():
            if key in properties:
                errors.extend(validate_against_schema(value, properties[key], root, f"{path}.{key}"))
            else:
                extra = schema.get("additionalProperties", True)
                if extra is False:
                    errors.append(f"{path} 出现未声明字段 {key}")
                elif isinstance(extra, dict):
                    errors.extend(validate_against_schema(value, extra, root, f"{path}.{key}"))

    if isinstance(instance, list):
        if "minItems" in schema and len(instance) < schema["minItems"]:
            errors.append(f"{path} 至少需要 {schema['minItems']} 项")
        items = schema.get("items")
        if isinstance(items, dict):
            for index, item in enumerate(instance):
                errors.extend(validate_against_schema(item, items, root, f"{path}[{index}]"))
    return errors


def extend_type_enum(schema, extra_types):
    """把 scenes.js 里自定义注册的场景类型补进 Schema 的 type 枚举。

    Schema 里的 enum 是「已登记的官方场景类型」权威清单；工程里自定义的类型
    （在 scenes.js 里注册过）不应该被 Schema 判死 —— 否则扩展场景类型就必须
    同时改 Schema，两处真相反而更容易漂移。
    """
    if not extra_types:
        return schema
    scene = schema.get("$defs", {}).get("scene", {})
    prop = scene.get("properties", {}).get("type")
    if not isinstance(prop, dict) or not isinstance(prop.get("enum"), list):
        return schema
    allowed = list(prop["enum"])
    for name in sorted(extra_types):
        if name not in allowed:
            allowed.append(name)
    prop["enum"] = allowed
    return schema


def registered_scene_types(scene_source):
    """从 scenes.js 源码里抽出真实注册过的场景类型（官方 6 个之外的部分）。"""
    found = set()
    for match in re.finditer(r"^\s{2}([A-Za-z_][\w]*)\s*:\s*\(", scene_source, re.M):
        found.add(match.group(1))
    for match in re.finditer(r"SCENE_BUILDERS\.([A-Za-z_][\w]*)\s*=", scene_source):
        found.add(match.group(1))
    return found - BUILTINS


def timing_values(value):
    if isinstance(value, bool):
        return
    if isinstance(value, (int, float)):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from timing_values(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from timing_values(item)


def load_subtitles(path):
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    match = re.search(r"\bSUBTITLES\s*=\s*", text)
    if not match:
        raise ValueError("subs.js 中未找到 SUBTITLES 数组")
    value, _ = json.JSONDecoder().raw_decode(text[match.end():].lstrip())
    if not isinstance(value, list):
        raise ValueError("SUBTITLES 必须是数组")
    return value


def main():
    parser = argparse.ArgumentParser(description="校验 HTML 动画视频工程")
    parser.add_argument("--project", default=".", help="工程目录")
    args = parser.parse_args()
    root = Path(args.project).expanduser().resolve()
    errors, warnings = [], []
    try:
        project = json.loads((root / "project.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"FAIL 无法读取 project.json：{error}")
        return 1

    scenes = project.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes 必须是非空数组")
        scenes = []
    if not project.get("title"):
        errors.append("title 不能为空")
    for dimension in ("width", "height"):
        if not isinstance(project.get(dimension), (int, float)) or project[dimension] <= 0:
            errors.append(f"{dimension} 必须是正数")

    scene_source = (root / "scenes.js").read_text(encoding="utf-8") if (root / "scenes.js").exists() else ""

    # 工程契约校验：单位、必填字段、type 枚举（工程目录里带 schema 就用 schema）
    schema = load_schema(root)
    if schema is not None:
        schema = extend_type_enum(schema, registered_scene_types(scene_source))
        for error in validate_against_schema(project, schema, schema):
            errors.append(f"Schema：{error}")
    else:
        warnings.append("工程目录里没有 project.schema.json，跳过 Schema 校验")
    identifiers, expected_start, total = set(), 0.0, 0.0
    for index, scene in enumerate(scenes):
        label = scene.get("id", f"#{index + 1}") if isinstance(scene, dict) else f"#{index + 1}"
        if not isinstance(scene, dict):
            errors.append(f"{label} 不是对象")
            continue
        scene_id = scene.get("id")
        if not isinstance(scene_id, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", scene_id):
            errors.append(f"{label} 的 id 只能使用小写字母、数字和连字符")
        elif scene_id in identifiers:
            errors.append(f"场景 id 重复：{scene_id}")
        else:
            identifiers.add(scene_id)
        scene_type = scene.get("type")
        registered = scene_type in BUILTINS or (
            isinstance(scene_type, str)
            and (re.search(rf"\b{re.escape(scene_type)}\s*:", scene_source)
                 or re.search(rf"SCENE_BUILDERS\.{re.escape(scene_type)}\s*=", scene_source))
        )
        if not registered:
            errors.append(f"{label} 的渲染器未注册：{scene_type}")
        start, duration = scene.get("start"), scene.get("duration")
        if not isinstance(start, (int, float)) or isinstance(start, bool) or start < 0:
            errors.append(f"{label} 的 start 必须是非负数")
            start = expected_start
        if not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0:
            errors.append(f"{label} 的 duration 必须是正数")
            duration = 0
        elif duration > MAX_SCENE_SECONDS:
            errors.append(
                f"{label} 的 duration {duration} 超过 {MAX_SCENE_SECONDS} 秒 —— "
                f"疑似把毫秒写成了秒（{label} 的 duration 单位是秒，timing 才是毫秒）"
            )
        if abs(start - expected_start) > 0.0001:
            errors.append(f"{label} 起点 {start} 与预期 {expected_start:.6f} 不连续")
        expected_start = start + duration
        total = expected_start
        for value in timing_values(scene.get("timing", {})):
            if value < 0 or value >= duration * 1000:
                errors.append(f"{label} 的 timing {value} 超出 [0, {duration * 1000})")

    try:
        subtitles = load_subtitles(root / "subs.js")
        previous_start = -1
        for index, subtitle in enumerate(subtitles):
            start, end = subtitle.get("start"), subtitle.get("end")
            if not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or end <= start:
                errors.append(f"字幕 #{index + 1} 时间无效")
                continue
            if start < previous_start:
                errors.append(f"字幕 #{index + 1} 未按时间排序")
            if end > total * 1000 + 150:
                errors.append(f"字幕 #{index + 1} 超出全片总时长")
            if not subtitle.get("text"):
                warnings.append(f"字幕 #{index + 1} 文本为空")
            previous_start = start
    except (OSError, ValueError, json.JSONDecodeError) as error:
        errors.append(str(error))

    audio = project.get("audio", "")
    if audio:
        audio_path = root / audio
        if audio_path.is_absolute() or ".." in Path(audio).parts:
            errors.append("audio 必须是工程内的相对路径")
        elif not audio_path.is_file():
            errors.append(f"配音文件不存在：{audio}")
    else:
        warnings.append("未配置配音；当前为无声预览")

    for warning in warnings:
        print(f"WARN {warning}")
    for error in errors:
        print(f"FAIL {error}")
    if errors:
        print(f"校验失败：{len(errors)} 个错误")
        return 1
    print(f"PASS {len(scenes)} 个场景，总时长 {total:.3f} 秒")
    return 0


if __name__ == "__main__":
    sys.exit(main())
