# 场景配置与渲染器

## 目录

1. 通用结构
2. 内置场景
3. 新增渲染器
4. 数据约束

## 一、通用结构

`project.json` 是本期唯一场景数据源：

```json
{
  "title": "示例",
  "width": 1080,
  "height": 1920,
  "audio": "assets/voice.mp3",
  "scenes": [
    {
      "id": "opening",
      "type": "counter",
      "start": 0,
      "duration": 6,
      "props": {
        "label": "控制权变化",
        "from": 0,
        "to": 50.1,
        "suffix": "%",
        "caption": "标记越过控制线"
      },
      "timing": { "label": 0, "value": 600 }
    }
  ]
}
```

- `id`：稳定且唯一，只使用字母、数字和连字符。
- `start`：全片绝对秒数；第一段通常为 0。
- `duration`：秒；下一段 `start` 必须等于本段 `start + duration`。
- `timing`：相对本页的毫秒，所有值必须满足 `0 <= value < duration * 1000`。
- `props`：只放本期数据，不放函数或 DOM 对象。

## 二、内置场景

### counter：数字与阈值变化

适合进度、投票、增长、稀释和越线。

```json
{
  "type": "counter",
  "props": {
    "label": "投票权",
    "from": 49.8,
    "to": 50.1,
    "suffix": "%",
    "caption": "越过 50%"
  }
}
```

### flow：元素按顺序连接

适合流程、机制、资源流和因果链。

```json
{
  "type": "flow",
  "props": {
    "label": "机制如何运转",
    "nodes": ["输入", "处理", "结果"],
    "caption": "每一步由时间 cue 驱动"
  }
}
```

节点建议 2–5 个，文字保持短促。

### compare：两组关系对比

适合前后、双方、两种权利或两条路径。

```json
{
  "type": "compare",
  "props": {
    "label": "两种方案",
    "left": { "title": "之前", "value": 35 },
    "right": { "title": "之后", "value": 80 },
    "caption": "比较差异，不复述旁白"
  }
}
```

`value` 使用 0–100 的相对量，只用于视觉比较。

### reveal：关键词逐步揭示

适合少量并列信息，不应用来逐字播放整句字幕。

```json
{
  "type": "reveal",
  "props": {
    "label": "三个结果",
    "items": ["可见", "可控", "可复用"]
  }
}
```

### end：结论落版

```json
{
  "type": "end",
  "props": {
    "title": "核心结论",
    "subtitle": "一句有信息增量的收束",
    "note": "可选署名或行动提示"
  }
}
```

## 三、新增渲染器

在 `scenes.js` 的 `SCENE_BUILDERS` 注册：

```js
SCENE_BUILDERS.myAction = (scene, api) => {
  const node = api.el('circle', { cx: 540, cy: 900, r: 80 });
  return t => {
    const p = api.prog(t, 0, 1.2);
    node.setAttribute('r', api.mix(20, 180, api.out(p)));
  };
};
```

渲染器遵守：

1. 创建阶段只构建 DOM，返回纯 `render(t)`。
2. `t` 是本页相对秒数，任意顺序跳转都得到同一帧。
3. 连续量直接写属性，不依赖 CSS transition。
4. 素材通过资产 ID 和确认版本取得，不在渲染器内猜画。
5. 注册后立即做至少三个时刻的定格检查，并更新本文件。

## 四、数据约束

运行 `python tools/validate_project.py` 检查 JSON、ID、场景连续性、timing、字幕顺序与总时长。自动校验不替代画面目检；尤其要检查录屏裁切、字幕碰撞和动作是否表达旁白。
