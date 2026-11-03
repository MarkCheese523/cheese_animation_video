# 页型速查 · config.js 配置手册

> 所有页型的 `timing` 均为**相对本页起始的毫秒偏移**（SRT 绝对时间 − 本页起始戳）。每个 timing 值必须 < 本页 duration。

## 通用结构

```js
{
  id: "t4a", type: "method", duration: 12634,   // duration = 口播段结束戳 − 起始戳
  props: { ... }                                  // 各页型见下
}
```

页型注册表在 player.js `builders` 对象。新增页型三步：写 `buildXxx(page)`（innerHTML + `seek(t)` 函数，用 `on(el, tm.xxx, t)` 切 `.on` 类）→ 注册进 builders → theme.css 加样式。**写完立即抽帧目检。**

## 1. sign · 墨滴签名开场

```js
{ type:"sign", props:{ name:"Bella" }, timing:{ drop:234, name:567, line:1000 } }
```
墨滴砸落 → 溅点 → 签名浮现 → 下划线拉出。问候语交给字幕。

## 2. typewriter · 打字机钩子

打字逐字出现 + 手绘划线。首期用，科技号版被 sign 替代。

## 3. redefine · 重新定义页（钩子核心）

```js
{ type:"redefine", props:{
    label:"你有过这种体验吗", blames:["懒"],
    noneText:"其实，不是懒。", truth:"完美主义型拖延"
  }, timing:{ tag:0, blame:[4700], strike:6100, none:6500, truth:6700 } }
```
`intro`/`sub` 可选（v3 起默认不用——句子交给字幕）。blames 支持撕纸划掉动效。

## 4. logo · 品牌卡

品牌名 + 一句话定位 + 徽章。`intro` 可选。

## 5. cards · 步骤卡（横排流水线）

```js
{ type:"cards", props:{
    title:"一条流水线",
    steps:[ {k:"先启动",d:"写 30 分钟"}, ... ]   // 3 张纵排 / 4 张自动横排（.n4）
  }, timing:{ card:[2367,3600,4867,5667], stamp:6900 } }
```
`steps.length >= 4` 自动加 `.n4` 类（横排阶梯下沉）。颜色按序 s1–s4。

## 6. method · 媒体槽演示页（录屏主力页型，也可无槽做概念页）

```js
{ type:"method", props:{
    slot:{ id:"t4a", aspect:"9:16", fit:"auto" },  // 录屏槽：aspect 可 16:9/1:1/9:16/auto；fit 见下；省略 slot 则成概念页
    keywords:["AI 自动打标","评估成熟度"],        // 左侧花字贴纸（v3 起替代 note 文本框）
    overlay:{ kind:"stamp", text:"成 稿" },       // 可选：印章/计数/锁 覆盖层
    tagColor:"pink"
  }, timing:{ tag:0, title:0, media:3734, kw:[5167,7700], overlay:8100 } }   // 无 slot 时去掉 media
```
- `aspect:"9:16"` 自动加 `.m-page--9x16` 页级变体（右侧大槽 + 左侧花字区）
- `fit`：默认 `cover`（真 9:16 录屏直接裁切铺满）；`auto` 自动检测视频内部黑边：内容区等比居中 + cover 裁边 + torn 背景色 `#f6f4ef` 填充（适合 1:1 桌面录屏被导出成 9:16 的情况，无黑边时自动退回 contain）；`pad` 仅做 contain + 背景色填充，不自动去黑边
- overlay kind：`count`（30 分钟倒计时贴纸）／`lock`（🔒 封层）／`stamp`（红圆环印章）
- **无 slot 概念页**：不渲染媒体槽，加 `.m-page--concept`，标题/overlay 居中放大。适合已被其他录屏覆盖、只需视觉化概念的时刻（如 t4c 封层锁定）
- **录屏时长 = duration − timing.media**，交付时必须列清单

## 7. stack · 堆叠标签页

若干标签/便签依次拍上。滤镜页、人设页等概念内容的旧载体，v3 起多数场景被专用页型替代。

## 8. filter · 滤镜视觉动线页（v3 新增）

```js
{ type:"filter", props:{
    mine:"我的稿子", theirs:"别人的稿子", kw:"换个视角"
  }, timing:{ tag:0, paper:200, film:367, clock:3634, flip:5134, kw:9900 } }
```
稿纸 → 粉色滤镜纸盖上 → 时针转一整圈（12 小时）→ 标签翻面 → 花字收束。纯动画无录屏槽。

## 9. persona · AI 人设卡页（v3 新增）

```js
{ type:"persona", props:{
    role:"AI 编辑", name:"只读，不代笔",
    badges:["起标题","润色开头","读者反馈"], kw:"3 件事"
  }, timing:{ tag:0, card:2434, role:3400, name:6400, ico:7100, badge:[8167,8767,9367], kw:11100 } }
```
工作证卡进场 → 三枚 skill 徽章贴上 → 花字收束引出下文。

## 10. rule · 铁律页

金句大字 + 盾牌/描线动效。解释性句子删掉，只留金句（如「AI 只读，不写」）。

## 11. end · 收尾页

```js
{ type:"end", props:{
    note:{ txt:["用了一周多，发布数"], num:"2 篇" },   // 纸片数据
    slogan:["先写烂，","再写好。"],                      // 结尾金句（必须醒目，带拍上动效）
    badge:"流水线成品", foot:"评论区见"
  }, timing:{ note:2034, sub:4234, l1:7634, l2:8634, foot:12434 } }
```
slogan/badge/foot 均可选。**结尾金句不要删**——v3 曾误删导致结尾无力，被要求恢复。

## 12. 空白页型？

没有第 12 个。新视觉需求 = 新页型，写完反哺本速查表。
