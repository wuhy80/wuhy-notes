---
title: "pdoom · 代码渲染 MV"
aliases:
  - 代码渲染MV
  - pdoom demo
tags:
  - AI开发Demo
  - Demo/视频
  - Canvas
type: demo
created: 2026-11-22
updated: 2026-11-22
status: local-only
source: https://github.com/mexicat/pdoom-video
---

# pdoom · 代码渲染 MV

> [!summary] 一句话
> 参考 `mexicat/pdoom-video` 做的极简复刻：**画面是时间的纯函数**，逐词歌词 + 节拍数据驱动三个场景，最后用 headless Chrome 逐帧截图、ffmpeg 合成 mp4。

> [!warning] 暂不入库
> 工程里有 3.4 MB 音轨和 93 MB 成品视频，远超知识库该承载的体积。这里只沉淀做法与命令，源码留在本机 `D:\code\pdoom-demo`。

## 一、它长什么样

- 三个场景按段落名调度：`verse/pre → spark`（地平线网格 + 粒子 + 波形带）、`chorus → slam`（大字逐词砸入 + 底鼓切片）、`bridge/outro → tunnel`（透视隧道 + 尾卡）
- 逐词卡拉 OK：词级 `start/end` 真实演唱时间，从左往右填色
- 节拍驱动：`beats / downbeats / onsets.kick` 都是检测出来的时间点，画面用「距上次事件指数衰减」做脉冲

## 二、导出管线

```bash
cd D:\code\pdoom-demo
node render.mjs --full --format jpeg --out out/pdoom.mp4        # 整首 1080p30
node render.mjs --start 22 --end 28 --format jpeg --out clip.mp4 # 6 秒试片
```

- 零依赖：Node 内置 `WebSocket` 直连 Chrome DevTools 协议（`Target.createTarget` → `Runtime.evaluate` → `Page.captureScreenshot`），不用 puppeteer。
- 原理：页面暴露 `window.renderAt(t)`，把画面定格到 t 重画一帧；导出器逐帧截图，`ffmpeg -framerate` 合成，再接回原音轨。
- 实测：整首 4700 帧约 5.4 分钟（`--format jpeg` 比 PNG 快约 8 倍）。

## 三、可复用的三条

1. **确定性渲染**是离线导出的前提：`draw(t)` 里不允许 `Math.random()`，随机都走 seed；颗粒按帧号偏移。
2. **导出速度取决于截图**，和音频无关：截图用 JPEG（质量 95）再交给 x264 重编码，成本直接降一个量级。
3. **时间轴就是数据**：歌词对齐 + 节拍网格一旦有了，场景切换和动画都不需要手工打点。

## 四、相关文件

- 源码与数据：`D:\code\pdoom-demo`（`src/app.js` 约 900 行、`render.mjs` 约 280 行）
- 成品：`D:\code\pdoom-demo\out\pdoom-demo-1080p30.mp4`（1920×1080 / 30fps / 93 MB）
- 原项目：<https://github.com/mexicat/pdoom-video>（TypeScript + three.js + 多进程离屏渲染）
