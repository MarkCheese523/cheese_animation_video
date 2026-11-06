# 构件库

所有构件遵循同一套契约：**建一个 `g` → 用参数化宽高 → 挂进时间轴（`S`/`act`）**。不写死单帧样式，不写 CSS 动画。

## 0. 工具层

```js
const NS = 'http://www.w3.org/2000/svg', MONO = '"JetBrains Mono","SF Mono",Consolas,monospace';
const mk = (tag,a,par)=>{const e=document.createElementNS(NS,tag);for(const k in a)e.setAttribute(k,a[k]);par&&par.appendChild(e);return e};
const txt = (par,s,a)=>{const e=mk('text',Object.assign({'text-anchor':'middle'},a),par);e.textContent=s;return e};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const p=(t,a,b)=>clamp((t-a)/(b-a));                       // 区间进度 0→1
const lin=x=>x, eo=x=>1-Math.pow(1-x,3), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const back=x=>{const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const lerpA=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
const qb=(a,c,b,u)=>[(1-u)*(1-u)*a[0]+2*(1-u)*u*c[0]+u*u*b[0],(1-u)*(1-u)*a[1]+2*(1-u)*u*c[1]+u*u*b[1]];
const op=(el,v)=>el.setAttribute('opacity',clamp(v));
const at=(el,o)=>{for(const k in o)el.setAttribute(k,o[k])};

// 关键帧轨道 [[t,值,缓动?],...]；值可以是数字或数组
function kf(t,K){
  if(t<=K[0][0])return K[0][1];
  for(let i=0;i<K.length-1;i++){
    const [t0,v0]=K[i],[t1,v1,e]=K[i+1];
    if(t<=t1){const u=(e||eio)((t-t0)/(t1-t0));return Array.isArray(v0)?lerpA(v0,v1,u):v0+(v1-v0)*u;}
  }
  return K[K.length-1][1];
}
// 弧线路径 [[t0,t1,起点,终点,控制点?,缓动?],...]
function route(t,R){
  let pos=R[0][2];
  for(const [t0,t1,a,b,c,e] of R){
    if(t<t0)return pos;
    const u=(e||eio)(clamp((t-t0)/(t1-t0)));
    pos=c?qb(a,c,b,u):lerpA(a,b,u);
    if(t<=t1)return pos;
  }
  return pos;
}
```

## 1. 场景层与精灵

```js
const cam=$('cam'), L={};
// 固定六层，z 序从左到右；新增元素一律挂进这六层，不直接挂 cam
['under','main','figs','over','top','labels'].forEach(k=>L[k]=mk('g',{},cam));

const SPR=[];                                     // 所有可动画元素
const S=(el,t0,t1,fn)=>SPR.push({el,t0,t1,fn});   // 时间区间 + 每帧回调
const V=(K,k,t,d)=>{const q=K[k];return q==null?d:typeof q==='function'?q(t):Array.isArray(q)?kf(t,q):q};

// 通用动作：位置/旋转/缩放/透明度，一次给全
function act(el,t0,t1,K,fn){
  S(el,t0,t1,t=>{
    el.setAttribute('transform',
      `translate(${V(K,'x',t,0)} ${V(K,'y',t,0)}) rotate(${V(K,'r',t,0)}) scale(${Math.max(0,V(K,'s',t,1))})`);
    op(el,V(K,'o',t,1));
    fn&&fn(t);
  });
}
// 便捷轨道
const io=(a,b,d=.3)=>[[a,0],[a+d,1,lin],[b-d,1],[b,0,lin]];   // 淡入淡出
const ps=(a,s=1,d=.35)=>[[a,0],[a+d,s,back]];                 // 弹入

function render(t){
  for(const s of SPR){
    const on=t>=s.t0&&t<=s.t1;
    if(s.el)s.el.style.visibility=on?'visible':'hidden';
    if(on&&s.fn)s.fn(t);
  }
}
```

规则：
- 元素的 `t0/t1` 就是它的存活区间，区间外自动 `visibility:hidden`，不用手写移除。
- `S(null,t0,t1,fn)` 用于纯计算/回调（如拉动别的元素），不绑定元素。

## 2. 基础构件

### rect / T / TM

```js
function rect(par,w,h,o={}){
  const a={x:-w/2,y:-h/2,width:w,height:h,rx:o.rx??14,
    fill:o.fill??'rgba(8,22,8,.9)',stroke:o.stroke??'rgba(188,245,0,.6)','stroke-width':o.sw??2.5};
  if(o.dash)a['stroke-dasharray']=o.dash;
  return mk('rect',a,par);
}
function T(par,s,x,y,fs,fill='#fff',o={}){
  const a={x,y,'font-size':fs,fill,'font-weight':o.fw??700,stroke:'none'};
  if(o.mono){a['font-family']=MONO;a['letter-spacing']=o.ls??2;}
  if(o.anchor)a['text-anchor']=o.anchor;
  return txt(par,s,a);
}
// 一行的多色混排（关键词高亮）
function TM(par,parts,x,y,fs){
  const e=mk('text',{x,y,'text-anchor':'middle','font-size':fs,'font-weight':900},par);
  parts.forEach(([s,c])=>mk('tspan',{fill:c},e).textContent=s);
  return e;
}
```

### pill（标签）

```js
function pill(par,label,w,h,o={}){
  const g=mk('g',{},par);
  g.r=rect(g,w,h,{rx:o.rx??h/2,fill:o.fill??'rgba(10,32,12,.95)',
    stroke:o.stroke??BL,sw:o.sw??2.5,dash:o.dash});
  const fs=o.fs??24;
  g.t=T(g,label,0,fs*.36,fs,o.color??'#fff',o);
  return g;
}
```

三种预设：

| 型号 | stroke | fill | color | 用途 |
|---|---|---|---|---|
| 我方 | `CY` | `rgba(188,245,0,.18)` | `CY` | 达标、已接入 |
| 中性 | `MU` | `rgba(10,32,12,.95)` | `#fff` | 型号、序号 |
| 负面 | `MG` | `rgba(255,79,216,.15)` | `MG` | 低于、更贵 |

实心品红标签上写近黑字 `#1a0016`（对比 7:1 够用），这是全片唯一允许深色字压亮底的地方。

### bar（数据条）

```js
// 一条三段式对比：主色=我方，灰=基线，紫=对照
function barRow(par,y,name,vals,o={}){
  const g=mk('g',{},par), W=o.w??760, X0=o.x??-W/2;
  T(g,name,X0,y-18,22,'#d8e6bc',{anchor:'start'});
  return {g,draw:(t,t0)=>{
    vals.forEach((v,k)=>{
      const yy=y+k*26, c=[CY,VI,GY][k]??GY;
      const len=W*v/100*eo(p(t,t0+k*.06,t0+.7+k*.06));
      mk('rect',{x:X0,y:yy-7,width:len,height:14,rx:7,fill:c},g);
      T(g,v.toFixed(1),X0+len+10,yy+6,15,k===0?CY:'#d8e6bc',{mono:1,ls:0,anchor:'start'});
    });
  }};
}
```

规则：条长按百分比 × 可用宽度；数值贴在条尾外侧 10px；主色那条叠 `filter:url(#glow)` 表示"当前重点"。

### table（表格式对比）

无竖线，仅每行底部一条 `rgba(188,245,0,.12)` 细线；行高 130；列：名称左对齐、数值等宽居中、标签右对齐。表头用 `CY` + mono 26。

### imgCard（原图/截图展示）

```js
function imgCard(par,src,title,W,ar){
  const H=W/ar, g=mk('g',{},par);
  rect(g,W+24,H+76,{rx:18,fill:'rgba(8,22,8,.96)',stroke:CY,sw:3})
    .setAttribute('transform','translate(0 -26)');
  T(g,title,-W/2,-H/2-30,22,'#dfff9e',{mono:1,anchor:'start'});
  mk('rect',{x:-W/2,y:-H/2,width:W,height:H,fill:'#fff'},g);          // 白底包边
  mk('image',{href:src,x:-W/2,y:-H/2,width:W,height:H,
    preserveAspectRatio:'xMidYMid meet'},g);                            // 不裁切
  g.W=W; g.H=H; return g;
}
```

要点：
- `ar` 用**图片实际像素比**，不要估。填错会出现白边或压扁。
- 必须有白底 `rect`，截图多为白底，直接放深底上会露出透明区。
- 圈注框用相对坐标（0–1），尺寸变了不用重算。

```js
function imgMark(card,fx,fy,fw,fh,t0,t1,label,c=MG,labelFx){
  const W=card.W,H=card.H,g=mk('g',{},card);
  mk('rect',{x:-W/2+fx*W,y:-H/2+fy*H,width:fw*W,height:fh*H,rx:6,
    fill:'none',stroke:c,'stroke-width':4},g);
  if(label){
    const lw=label.length*20+30;
    const lp=pill(g,label,lw,38,{stroke:c,fill:c,color:'#1a0016',fs:20});
    const lx=labelFx!=null?labelFx:fx+fw;
    lp.setAttribute('transform',`translate(${-W/2+lx*W-lw/2} ${-H/2+fy*H-24})`);
  }
  S(g,t0,t1,t=>op(g,p(t,t0,t0+.2)*(.75+.25*Math.sin(t*8))));   // 呼吸
}
```

第九参数之前的 `labelFx` 是可选微调：标签默认贴框右端，会被中央大字压住时传左端坐标。

### icon（线性图标）

48×48 网格，`stroke-width:3`，圆头圆角，`fill:none`，色 `LT2`。内置：doc / code / chat / book / team / chart / search / stack / loop / eye / bolt / lock。**不用 emoji**。

### 文字浮现 TX

```js
function TX(s,x,y,fs,t0,t1,o={}){
  const g=mk('g',{},o.par||L.labels);
  T(g,s,0,0,fs,o.color||'#fff',o);
  act(g,t0,t1,{x,y:[[t0,y+18],[t0+.35,y,eo]],o:io(t0,t1,.25)});
  return g;
}
```

统一手感：从下方 18px 浮上来 + 淡入 0.35s。全片所有说明文字都用这一个动作，不要混入其他入场方式。

## 3. 舞台层（HTML/CSS，不进 SVG）

```html
<div id="stage">
  <canvas id="bg" width="1080" height="1920"></canvas>
  <svg id="world" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs><!-- gCy / gChip / gHalo / glow --></defs>
    <g id="cam"></g>
  </svg>
  <div class="corner c1"></div><div class="corner c2"></div>
  <div class="corner c3"></div><div class="corner c4"></div>
  <div class="hud-top mono">
    <div><span class="dot"></span>cheeseheart//deepthinking//HY-4</div>
    <div id="tc">00:00.00</div>
  </div>
  <div id="prog"><i></i></div>
  <div id="subBand"></div><div id="sub"></div>
  <div class="scan"></div>
</div>
```

层级顺序不能换：canvas → svg → 括角 → HUD → 字幕带 → 字幕 → 扫描线。扫描线必须在最上层，否则没有"屏幕"感。

背景绘制（canvas，每帧重画）：

```js
function drawBG(ctx,t,cy,z){
  ctx.fillStyle='#050704'; ctx.fillRect(0,0,1080,1920);
  const g=ctx.createRadialGradient(540,820,50,540,820,950);
  g.addColorStop(0,'rgba(34,84,28,.32)'); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,1080,1920);
  const step=90*z;
  ctx.strokeStyle='rgba(188,245,0,.06)'; ctx.lineWidth=1;
  for(let x=0;x<=1080;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1920);ctx.stroke();}
  for(let y=0;y<=1920;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y);ctx.stroke();}
}
```

## 4. 字幕

```js
const SUBS=[
  [0.0,2.0, "让 <b>HY4</b> 具备了"],
  [2.0,4.0, "更完整的<b>生产力版图</b>"],
];
// 渲染：切句才改 innerHTML（避免每帧重排）
let lastSub=-2;
function drawSub(t){
  const i=SUBS.findIndex(s=>t>=s[0]&&t<s[1]);
  if(i!==lastSub){$('sub').innerHTML=i>=0?SUBS[i][2]:'';lastSub=i;}
  if(i>=0){
    const u=eo(p(t,SUBS[i][0],SUBS[i][0]+.18));
    $('sub').style.opacity=u;
    $('sub').style.transform=`translateY(${20*(1-u)}px)`;
    $('sub').style.setProperty('--u',u);       // 驱动下划线辉光
  } else $('sub').style.opacity=0;
}
```

- `<b>` 是唯一的强调手段，渲染为 `#bcf500`，**每句最多两处**。
- 一句 1.3–2.6 秒；两句之间留 0.1–0.3 秒空白，不要无缝衔接（读不过来）。
- 换行用 `<br>` 手动控制，让两行长度接近，不要交给自动折行。

## 5. 常驻界面元素

```css
.hud-top{position:absolute;left:70px;right:70px;top:80px;display:flex;
  justify-content:space-between;font-size:26px;letter-spacing:3px;color:#dfff9e}
.hud-top .dot{display:inline-block;width:14px;height:14px;border-radius:50%;
  background:#bcf500;box-shadow:0 0 14px #bcf500;margin-right:14px;vertical-align:middle}

#subBand{position:absolute;left:0;right:0;top:1360px;height:560px;pointer-events:none;
  background:linear-gradient(180deg,rgba(4,7,4,0),rgba(4,7,4,.85) 28%,rgba(4,7,4,.95))}

#sub{position:absolute;top:1470px;left:50px;right:50px;text-align:center;
  font-size:60px;font-weight:800;line-height:1.3;text-shadow:0 4px 18px rgba(0,0,0,.9)}
#sub b{color:#bcf500}
#sub:after{content:"";display:block;margin:20px auto 0;width:120px;height:5px;
  background:linear-gradient(90deg,#7cb300,#bcf500);box-shadow:0 0 12px #bcf500;
  opacity:var(--u,0)}
```

`#sub:after` 那条短横线是风格的签名细节：字幕出现时从中间长出来、带辉光。别省。

## 6. 静止帧也不能"死"

```js
S(core,0,DUR,t=>{
  core.halo.setAttribute('r',260*(1+.04*Math.sin(t*5)));   // 光晕呼吸 ±4%
  dashEl.setAttribute('stroke-dashoffset',(t*40)%1000);     // 虚线缓慢流动
});
```

任何持续超过 2 秒的画面，至少挂一个这样的微动。
