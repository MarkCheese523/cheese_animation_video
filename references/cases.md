# 案例库 · 每一次返工都要留下可追溯的记录

> 本文件由本期流程测试沉淀而成。**每一条案例都必须关联一个校验器编号（E*/C*）或一个人工必查编号（M*）**
> —— 关联校验器的，规则已经变成机器关卡；关联人工必查的，必须出现在每次交付的语义接触表里。
> `scripts/test-rule-registry.mjs` 会核对这条关联关系：既没有校验器也没有人工项的案例，不算闭环。

| 案例 | 现象 | 根因 | 归属 | 回归测试 |
|---|---|---|---|---|
| CASE-01 | Commons 品牌检索被中英混合词清零 | 检索层把「Apple 手机」这类混合词一起过滤，品牌名被过滤掉 | `E24` | `scripts/test-asset-research.mjs` |
| CASE-02 | Bing 通用词歧义：「隐私锁」返回一堆不相干图标 | 检索层没有语义收敛，只按词匹配 | `E24` | `scripts/test-asset-research.mjs` |
| CASE-03 | 参考确认单被迟到的检索结果静默清空 | 候选回调无条件清空已确认的选择并自动改选第一个 | `C03` | `scripts/test-studio-gates.mjs` |
| CASE-04 | Iconify 推荐把被裁切的残缺字形排第一 | 检索层没有完整性判据 | `E24` | `scripts/test-asset-research.mjs` |
| CASE-05 | 母版描边宽度被内层 scale 放大 | 缩放有两个来源：母版内层 + act 的 s 轨道 | `E10` | `scripts/test-kit-browser.mjs` |
| CASE-06 | 深色变体里结构件被填成纸白 | 变体调色板没有覆盖全部结构件 | `E24` | `scripts/test-kit.mjs` |
| CASE-07 | 样片/全片缺 #tc / #prog 崩溃 | 页面骨架不统一，每期各写一份 | `E13` | `scripts/test-kit.mjs` |
| CASE-08 | 母版只抽 <path>，丢掉 rect/circle | 母版抽取只匹配单一标签 | `E15` | `scripts/test-kit.mjs` |
| CASE-09 | 母版校验只对品牌查 path | 普通元素不走同一套校验 | `E15` | `scripts/test-kit.mjs` |
| CASE-10 | 实心字形被当线稿画成空壳，描边细 3.4 倍 | 母版变体规则没有区分实心件与线稿件 | `E24` | `scripts/test-kit.mjs` |
| CASE-11 | 多色 Logo 被刷成同色，字标被压平吞掉 | 多色标识没有压成色板的规则 | `E24` | `scripts/test-kit.mjs` |
| CASE-12 | 两级设计卡/表D/表E 在 analysis 校验中完全缺失 | 文档里的通过条件没有对应代码 | `E01` | `scripts/test-agent-flow.mjs` |
| CASE-13 | 样片只查恰好 2 段，不查跨句演化 | 样片校验只数段数 | `E06` | `scripts/test-production-flow.mjs` |
| CASE-14 | 文档规则无机器拦截 | 规则只存在于文档层 | `E09` | `scripts/test-rule-registry.mjs` |
| CASE-15 | 主体被缩到母版的 17% | place() 内层 scale 与 act 的 s 轨道相乘 | `E10` | `scripts/test-kit-browser.mjs` |
| CASE-16 | 第 4 拍误用云图标作语音源（画面语义与旁白反相） | 资产只确认来源，不确认在画面里代表什么 | `E22` | `scripts/test-kit-browser.mjs` |
| CASE-17 | 信号组要素分居画面两端 | 同一组信息没有聚拢约束 | `E18` | `scripts/test-kit-browser.mjs` |
| CASE-18 | 压缩间距未大于元素宽度，模块重叠露在机身外 | 压缩只改尺寸不收间距 | `E11` | `scripts/test-kit-browser.mjs` |
| CASE-19 | placeFitted transform 顺序错致品牌整体偏移 | 先缩放后平移，平移量没乘 k | `E10` | `scripts/test-kit-browser.mjs` |
| CASE-20 | 已有样片任务无结果时前端永久禁用重做（返工死锁） | 闸门只有前进路径，没有回退载体 | `C01` | `scripts/test-studio-gates.mjs` |
| CASE-21 | 草稿恢复用旧快照覆盖服务端新版 analysis | 状态有两个权威源 | `C02` | `scripts/test-studio-gates.mjs` |
| CASE-22 | pattern 点阵跨 DOM 复用错位 | patternUnits=userSpaceOnUse 的原点被浏览器绑到 pattern 定义处 | `E14` | `scripts/test-kit.mjs` |
| CASE-23 | id 替换缺右引号破坏 SVG 解析（实心件反色点阵失效 + 幽灵元素） | 手写正则替换 id，没有闭合引号保护 | `E13` | `scripts/test-kit.mjs` |
| CASE-24 | 全片路径线/粒子缺结束时间残留到下一拍 | 循环粒子没有强制显式 tEnd | `E12` | `scripts/test-kit-browser.mjs` |
| CASE-25 | 背景场景未在拍次边界完全退场 | 背景轨道退场时间没有对齐拍次边界 | `E23` | `scripts/qa-semantic-lint.mjs` |
| CASE-26 | 全片关键帧时间重复 | 同一元素两个轨道时间点撞车 | `E23` | `scripts/qa-semantic-lint.mjs` |
| CASE-27 | 用户抱怨「画面逻辑有问题」，但没有任何一处提示该看什么 | 人工必查清单写在文档最后一行，没有变成交付物 | `M7` | `scripts/test-production-flow.mjs` |
| CASE-28 | 第 5 拍品牌字标点阵化后可读性偏低（遗留瑕疵） | 字标缺少独立处理档位（本期未修） | `M5` | `scripts/test-kit.mjs` |
| CASE-29 | 描边粗了 1px、点阵少了两颗、模块间距变了 2px —— 没有任何一条规则注意到 | 语义校验只判「说得通不对」，不判「和上次一样不一样」；画面回归全程无拦截 | `E26` | `scripts/test-visual-regression.mjs` |
| CASE-30 | 若基线可被自动刷新，回归层等于不存在 | 画面合法改动必然与基线不符，基线刷新必须是人工动作而不是产线动作 | `E27` | `scripts/test-visual-regression.mjs` |
| CASE-31 | 视频一长，Agent 拆解回写直接被拒（「需要 Agent 返回五拍分镜」） | 拍数被写死成五拍 —— 把这一期的偶然结果当成了通用模板 | `E28` | `scripts/test-agent-flow.mjs` |
| CASE-32 | 拍 id 换成第六种，闸门页面白屏 | 画面动作词表按拍 id 绑定，未知 id 直接取不到值 | `E28` | `scripts/test-studio-gates.mjs` |

## 编号对照

- `E*` / `C*`：见 `references/checks.md`（规则 → 校验器索引，由 `scripts/build-checks.mjs` 生成）
- `M*`：见 `templates/kit/manual-checks.js`（人工必查清单，必须出现在交付接触表里）
