---
tags:
  - 技术/前端
  - 技术/可视化
created: 2026-11-12
updated: 2026-11-12
source:
  - https://www.douyin.com/video/7705430493655622137
status: 完成
---

# Three.js 数字孪生可视化网页制作指南

> [!summary] 一句话总结
> 用 **Three.js（WebGL 3D 引擎）+ 普通 HTML/CSS 数据面板**，全部塞进**一个 HTML 文件**，就能做出抖音上很火的"工厂 3D 数字孪生大屏"——不需要后端、不需要构建工具、不需要装任何软件，浏览器双击打开就能跑。

## 成品效果

参考抖音视频《使用 DeepSeek 做了〈光伏组件无人自动化制造车间〉3D 产线可视化网页》，复刻成品如下（已放在本库附件）：

- 嵌入预览（阅读视图中直接渲染，需联网加载 3D 引擎）：![[光伏工厂数字孪生.html]]
- 独立打开：[[光伏工厂数字孪生.html|光伏工厂数字孪生.html]]（也可在附件目录右键 → 外部打开）

实现的功能清单：

- 深蓝科技风 HUD 大屏：顶部 OEE / 产量 / 洁净等级 / 产值实时跳动，DATA LINK 状态滚动条
- 3D 车间：地面网格 + 五道工序设备（电池串焊接 → 排版铺层 → 真空层压 → EL 检测 → 自动装框）
- 传送带上产品流动动画、AGV 物流车往返、机械臂摆动、层压炉门呼吸灯
- 左侧工序清单 + 右侧设备详情面板，数据每秒随机波动模拟实时采集
- 点击工序 → 相机缓动飞行聚焦设备，3D 设备也可直接点击拾取
- 工具栏：产品流动、暂停运行、俯视视角、X 光透视（线框化）、报警模拟、能耗监控、一键复位

## 技术方案

| 要素 | 选型 | 说明 |
| ---- | ---- | ---- |
| 3D 引擎 | Three.js r128（cdnjs CDN） | UMD 版直接 `<script>` 引入，无需 npm/构建 |
| 图标 | Lucide（unpkg CDN） | `<i data-lucide="名称">` 占位，`lucide.createIcons()` 替换 |
| 数据面板 | 原生 HTML/CSS 绝对定位 | 叠在 3D 画布上层，纯 DOM 渲染 |
| 相机控制 | 手写球坐标 + 缓动动画 | 不依赖 OrbitControls，几十行代码 |
| 交付形态 | 单个 `.html` 文件 | 约 45 KB，微信/网盘直接发送 |

> [!note] 为什么选单文件
> 这类页面 90% 的价值在"打开就能看"。单文件 + CDN 引入意味着零部署：发给同事、放网盘、挂内网静态服务都一样能跑，也正因此适合让 AI 一次性生成。

## 制作步骤（可复用的配方）

### 1. 页面骨架

一个相对定位的"舞台"容器，3D 画布铺满，数据面板绝对定位叠上去：

```html
<div class="stage">
  <div id="canvas-wrap"><!-- three.js 画布 --></div>
  <div id="labels"><!-- 3D→2D 投影的浮动标签层 --></div>
  <aside class="panel-left">工序清单</aside>
  <aside class="panel-right">设备详情</aside>
  <div class="toolbar">工具栏按钮</div>
</div>
```

### 2. 场景搭建

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050e1c);
scene.fog = new THREE.Fog(0x050e1c, 62, 165);          // 雾让远处融入背景，营造纵深
const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 400);
scene.add(new THREE.HemisphereLight(0x9fd0ff, 0x0a1a2e, 0.55)); // 半球光：冷色天光
const sun = new THREE.DirectionalLight(0xdfeeff, 0.85);          // 主方向光
scene.add(sun);
```

地面 = 大平面 + `GridHelper`（青蓝色网格线），科技感主要来自**配色**：深蓝底 + 青色发光描边，比堆模型更重要。

### 3. 设备建模：用基础几何体拼

不需要建模软件，全部用 `BoxGeometry` / `CylinderGeometry` / `SphereGeometry` 组合。每台设备 = 底座 + 机身 + 发光饰条 + 状态灯：

```js
const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); return m;
};
const glow = (color, i = 1) => new THREE.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: i      // 自发光 = 霓虹感的关键
});
```

产品流动 = 一排薄板沿 X 轴循环移动；AGV = 盒子小车做 `sin` 往返；机械臂 = 父子 Group 嵌套，旋转关节即可。

### 4. 相机：球坐标 + 缓动飞行

用球坐标 `(theta, phi, radius)` 描述相机位姿，拖拽改角度、滚轮改半径；点击工序时对这四个量做缓动插值：

```js
camera.position.set(
  t.x + r * Math.sin(phi) * Math.sin(theta),
  t.y + r * Math.cos(phi),
  t.z + r * Math.sin(phi) * Math.cos(theta)
);
camera.lookAt(t);
// 飞行：easeInOutCubic 插值 1.2 秒，观感立刻专业
```

### 5. 点击拾取：Raycaster

```js
ray.setFromCamera(ndc, camera);
const hit = ray.intersectObjects(stationGroups, true)[0]; // true = 递归子网格
```

注意区分"拖拽"和"点击"：记录 `pointerdown` 位置，`pointerup` 时位移小于 7px 才算点击。

### 6. 数据面板与浮动标签

面板是普通 DOM；设备名标签需要 3D→2D 投影，每帧把世界坐标投到屏幕坐标：

```js
v.copy(anchor).project(camera);
el.style.left = (v.x * 0.5 + 0.5) * wrap.clientWidth + 'px';
el.style.top  = (-v.y * 0.5 + 0.5) * wrap.clientHeight + 'px';
if (v.z > 1) el.style.visibility = 'hidden';   // 相机背后要隐藏
```

"实时数据"用随机游走模拟：每秒 `v += (random-0.5)*幅度` 并夹在合理区间，观感和真数据无异。

### 7. 工具栏特效

- **X 光透视**：遍历场景把每个网格换成 `wireframe: true` 的青色材质（还原时取回备份的原材质）
- **报警模拟**：随机选一台设备，状态灯变红 + 以 `sin(t*9)` 频闪，标签/列表/详情面板同步变红，8 秒后自动解除
- **俯视/复位**：都是对相机球坐标赋目标值 + 缓动飞行

## 让 AI 生成的提问模板

视频作者是用 DeepSeek 生成的，任何 AI 都行，关键是把需求说全：

```text
用 Three.js 做一个单文件 HTML 的工厂 3D 数字孪生大屏：
- 深蓝科技风 HUD，顶部 OEE/产量/产值数据栏
- 产线共 N 道工序：<工序1>→<工序2>…，传送带上产品流动，加 AGV 和机械臂动画
- 左侧工序清单、右侧设备详情面板（温度/良品率/速度），每秒数据波动
- 点击工序相机飞过去，工具栏：俯视视角、X光透视、报警模拟、一键复位
- 全部中文，黑色边框发光描边，直接双击可打开
```

生成后人工要调的通常只有三处：相机初始角度、设备布局坐标、配色变量。

## 踩坑记录

> [!warning] 这些坑都在实际制作中遇到过
> 1. **中文乱码**：独立打开时浏览器可能按 GBK 解码 → 文件开头显式加 `<meta charset="utf-8">`（必须在文件前 1KB 内）。
> 2. **`hidden` 属性失效**：元素 CSS 写了 `display:flex` 会覆盖 `hidden` 的默认 `display:none`，要补一条 `[hidden]{display:none}` 规则。
> 3. **千分位数字算 NaN**：`toLocaleString()` 产生的 `"2,382"` 参与算术会得到 NaN（比如算进度条宽度），进度条要用原始数值，显示才做格式化。
> 4. **标签飘离设备**：3D 标签锚点要贴在机器前脸（z 坐标与机器前面板一致），锚点放在设备身后会因透视投影飘到空中。
> 5. **元素被面板挡住**：全屏布局里运动物体（如 AGV）可能默认被左右面板遮住，布局时给运动路径留出可视走廊。
> 6. **CDN 版本**：Three.js 新版本已移除 UMD 构建，`<script>` 直引要用 r128 这类旧版；Lucide 图标库版本间路径不同，引用前先 `curl -I` 验证 200。

## 扩展方向

- **接真实数据**：把"随机游走"换成 MQTT over WebSocket 或轮询后端接口，前端结构完全不用动——面板只认每秒更新的数值
- **换主题**：设备建模函数和工序数据表（名称/坐标/参数区间）都是现成的，换行业只需重写这两块
- **做成简报大屏**：配合树莓派/旧笔记本 + 全屏模式（F11）就是车间看板

## 参考资料

- [抖音参考视频：DeepSeek 做光伏车间 3D 可视化](https://www.douyin.com/video/7705430493655622137)
- [Three.js 官方文档](https://threejs.org/docs/)（入门看 Primitives 与 Material 两章即可）
- [Lucide 图标库](https://lucide.dev/)（图标名速查）
- 本地成品：`附件/光伏工厂数字孪生.html`（另有一份在 `D:\code\video_make\pv-factory-digital-twin.html`）
