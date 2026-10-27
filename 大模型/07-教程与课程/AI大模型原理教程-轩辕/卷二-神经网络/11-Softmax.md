---
tags:
  - 大模型/教程
  - AI大模型原理教程
created: 2026-10-18
source: https://www.xuanyuancode.com/ai-llm/lessons/nn-04-softmax
course: AI大模型原理免费教程
volume: 卷二 · 神经网络
lesson: 11
---

# 11 Softmax

> [!abstract] 本课导读
> 一组任意大小的分数，怎么变成一组加起来等于 1 的概率？

本文来自「轩辕的编程宇宙」免费教程 [《AI 大模型原理》](https://www.xuanyuancode.com/ai-llm/lessons/nn-04-softmax)，全文 30 课从向量讲到 Transformer。原站图文编排更精美，含交互实验，建议结合阅读。

## 分类器的最后一层输出什么？

回到那台猜水果的机器。它最后一层给每种水果配了一个神经元——这一课先用**苹果、香蕉、西瓜**三种举例。 经过若干层 Wx + b 和 ReLU 之后，假设三个神经元的输出是：

<div class="formula">[🍎 苹果: 2.1，  🍌 香蕉: −0.5，  🍉 西瓜: 1.8]</div>

这三个数叫 **logits**（原始分数）。它们的大小可以比较——2.1 > 1.8 > −0.5， 说明网络认为「苹果」的可能性最高。但有两个问题：

- 「苹果」的概率是多少？2.1 这个数字本身没有概率意义。
- 三个数加起来等于 3.4，不等于 1。概率必须加起来等于 1。

交叉熵损失需要的输入是概率。所以需要一个转换：**把三个任意实数变成三个加起来等于 1 的非负数**。

> [!question] 想一想
> 最简单的想法：把三个数都除以它们的总和，这样不就加起来等于 1 了？试试看，有什么问题？
>
> > [!tip]- 我想好了，看答案
> > 最直接：把每个数除以三个数的总和。2.1/3.4 ≈ 0.62，−0.5/3.4 ≈ −0.15，1.8/3.4 ≈ 0.53。 问题立刻出现：香蕉的那一项变成了 **−0.15**——负概率！ 概率必须非负，直接除以总和在有负数时行不通。

## 修补负数：先变成正数再归一化

负数的问题在于：直接除以总和后，原来是负数的项仍然是负数。 要让所有项变成正数，再归一化。 最直觉的修补：把所有数都加上最小值的绝对值，平移到非负区间。
<div class="formula">2.1 + 0.5 = 2.6<br/>−0.5 + 0.5 = 0<br/>1.8 + 0.5 = 2.3<br/>总和 = 4.9<br/>概率 = [2.6/4.9, 0/4.9, 2.3/4.9] ≈ [0.53, 0, 0.47]</div>

> [!important] 平移量是任意的
> 「加上 0.5」是因为最小值是 −0.5，我们选择了把它平移到 0。 但为什么必须是 0？如果把最小值平移到 1，结果就完全不同了： [3.1/6.9, 1/6.9, 2.8/6.9] ≈ [0.45, 0.14, 0.41]。**概率的分布随着任意选择的平移量而改变**——这不合理。 我们需要一种不依赖「平移量」的转换方法。

问题的核心是：需要一个函数，能把任意实数（包括负数）变成正数， 而且**不依赖其他数的绝对大小**，只保留相对排序信息。

## 指数函数：天然无负数

有一个函数对所有实数输出都是正数，而且不需要知道其他项是多少——就是指数函数 $e^{x}$。 先看它长什么样：

<figure class="fig" style="margin:1.2em 0">
  <div class="fig-frame" style="background:#FFFDF8;border:1px solid #DCD2BF;border-radius:8px;padding:8px">
    <div id="kx-fig-11-1" style="width:100%;height:320px"></div>
  </div>
  <figcaption style="margin:6px 4px 0;font-size:.85em;color:#5C6B79;line-height:1.6">
    <span style="color:#C0481E;font-weight:600;margin-right:6px">图 11-1</span>指数函数 y = e^x：不管输入是正、是负、还是零，输出永远在 0 以上（曲线始终不碰横轴）。而且输入越大、输出涨得越快——这两条性质正是 Softmax 看中它的原因。（悬停查看坐标）
  </figcaption>
</figure>
<script>
(function () {
  function draw() {
    var xs = [], ys = [];
    for (var i = 0; i <= 110; i++) {
      var x = -2.2 + i / 110 * 4.5;
      xs.push(Number(x.toFixed(2)));
      ys.push(Number(Math.exp(x).toFixed(3)));
    }
    Plotly.newPlot('kx-fig-11-1', [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#C0481E', width: 3 }, name: 'y = eˣ', hoverinfo: 'skip' },
      { x: [-0.5, 1.8, 2.1], y: [0.61, 6.05, 8.17], type: 'scatter', mode: 'markers',
        marker: { color: ['#C9A227', '#3E8F5A', '#C0481E'], size: 9 }, name: '本课三个 logit' }
    ], {
      paper_bgcolor: '#FFFDF8', plot_bgcolor: '#FFFDF8',
      font: { family: 'Noto Sans SC, sans-serif', size: 12, color: '#5C6B79' },
      margin: { l: 48, r: 18, t: 16, b: 40 }, height: 320,
      showlegend: true, legend: { orientation: 'h', y: 1.12, font: { size: 11, color: '#5C6B79' } },
      xaxis: { title: { text: 'x', font: { size: 12, color: '#5C6B79' } }, range: [-2.3, 2.4], gridcolor: '#DCD2BF', zerolinecolor: '#93A0AC', tickfont: { family: 'JetBrains Mono, monospace', size: 10, color: '#93A0AC' } },
      yaxis: { title: { text: 'y', font: { size: 12, color: '#5C6B79' } }, range: [0, 10.5], gridcolor: '#DCD2BF', zerolinecolor: '#93A0AC', tickfont: { family: 'JetBrains Mono, monospace', size: 10, color: '#93A0AC' } },
      shapes: [{ type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: 0, y1: 0, line: { color: '#93A0AC', width: 1, dash: 'dot' } }],
      annotations: [{ x: -1.2, y: 1.5, xref: 'x', yref: 'y', text: '负数也落在 0 以上', showarrow: false, font: { family: 'Noto Sans SC, sans-serif', size: 11, color: '#5C6B79' } }]
    }, { displayModeBar: false, responsive: true });
  }
  if (window.Plotly) { draw(); }
  else {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js';
    s.onload = draw;
    document.head.appendChild(s);
  }
})();
</script>

把三个 logit（苹果 2.1、香蕉 −0.5、西瓜 1.8）分别代进去，负数也变成了正数：

$$
e^{2.1}\approx 8.17\qquad e^{-0.5}\approx 0.61\qquad e^{1.8}\approx 6.05\qquad \sum\approx 14.83
$$

全部除以总和：

🍎 苹果：$\frac{8.17}{14.83}\approx 0.551$🍌 香蕉：$\frac{0.61}{14.83}\approx 0.041$🍉 西瓜：$\frac{6.05}{14.83}\approx 0.408$三者之和 = 1.000 ✓

这就是 **Softmax**：对每个 logit 取 e 的指数，再整体归一化。 （第 6 课埋过一个伏笔——「把任意一组实数变成概率分布，正是 Softmax 的工作」。这一课就是来兑现承诺的。）

$$
Softmax(z_{i})=\frac{e^{z_{i}}}{\sum_{j}e^{z_{j}}}
$$

![[L11-fig1.svg]]
*图 11-2Softmax 把 logits 变成概率：所有值非负，和为 1。指数放大了原本的差距——苹果 2.1 比西瓜 1.8 只大一点，但概率大了 35%。*

这正是第 7 课见过的那台机器的**输出层**——当时只说「softmax 把分数挤成概率」，现在你知道它在里面具体做了什么了。 下面把那台四种水果的机器再搬出来：转旋钮改变四个神经元的**分数**，看 softmax 如何把它们实时换算成一组加起来 = 100% 的概率：

<figure class="fig" style="margin:1.2em 0">
  <div class="fig-frame" style="background:#FFFDF8;border:1px solid #DCD2BF;border-radius:8px;padding:8px">
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;margin:6px 0;font-size:13px;color:#1E2B38">
      <span>苹果 z₁<input id="kx-11a-apple" type="range" min="-2" max="4" step="0.1" value="2.1" style="width:110px;vertical-align:middle" aria-label="苹果的分数"></span>
      <span>香蕉 z₂<input id="kx-11a-banana" type="range" min="-2" max="4" step="0.1" value="-0.5" style="width:110px;vertical-align:middle" aria-label="香蕉的分数"></span>
      <span>西瓜 z₃<input id="kx-11a-melon" type="range" min="-2" max="4" step="0.1" value="1.8" style="width:110px;vertical-align:middle" aria-label="西瓜的分数"></span>
    </div>
    <div id="kx-fig-11a" style="width:100%;height:280px"></div>
  </div>
  <figcaption style="margin:6px 4px 0;font-size:.85em;color:#5C6B79;line-height:1.6">
    <span style="color:#C0481E;font-weight:600;margin-right:6px">互动 11-A</span>softmax 在水果神经元上的现场演算：每个分数先取 e^z（消除负数），再整体归一化。拖动旋钮调分数，看对应水果的 e^z 和概率一起被推高。<a href="https://www.xuanyuancode.com/ai-llm/lessons/nn-04-softmax" style="margin-left:6px">原站交互版</a>
  </figcaption>
</figure>
<script>
(function () {
  var knobs = { 苹果: document.getElementById('kx-11a-apple'), 香蕉: document.getElementById('kx-11a-banana'), 西瓜: document.getElementById('kx-11a-melon') };
  var fruits = ['苹果', '香蕉', '西瓜'];
  function draw() {
    var logits = fruits.map(function (f) { return parseFloat(knobs[f].value); });
    var exps = logits.map(function (z) { return Math.exp(z); });
    var sum = exps.reduce(function (a, b) { return a + b; }, 0);
    var probs = exps.map(function (e) { return e / sum; });
    var data = fruits.map(function (f, i) {
      return { x: [f], y: [probs[i]], type: 'bar', name: f + '（e^z=' + exps[i].toFixed(2) + '）',
        marker: { color: ['#C0481E', '#C9A227', '#3E8F5A'][i] }, text: [(probs[i] * 100).toFixed(1) + '%'],
        textposition: 'outside', textfont: { family: 'JetBrains Mono, monospace', size: 12, color: '#1E2B38' }, hoverinfo: 'skip' };
    });
    Plotly.newPlot('kx-fig-11a', data, {
      paper_bgcolor: '#FFFDF8', plot_bgcolor: '#FFFDF8', barmode: 'group',
      font: { family: 'Noto Sans SC, sans-serif', size: 12, color: '#5C6B79' },
      margin: { l: 48, r: 18, t: 10, b: 30 }, height: 280, showlegend: false, bargap: 0.3,
      yaxis: { title: { text: '概率', font: { size: 12, color: '#5C6B79' } }, range: [0, 1], gridcolor: '#DCD2BF', tickfont: { family: 'JetBrains Mono, monospace', size: 10, color: '#93A0AC' } }
    }, { displayModeBar: false, responsive: true });
  }
  Object.keys(knobs).forEach(function (k) { knobs[k].addEventListener('input', draw); });
  if (window.Plotly) { draw(); }
  else {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js';
    s.onload = draw;
    document.head.appendChild(s);
  }
})();
</script>

## 一个意外的发现：温度参数

指数函数有一个有趣的副效应：它*放大*了 logits 之间的差距。 2.1 比 1.8 大 17%，但 $e^{2.1}/e^{1.8}\approx 1.35$——差距被扩大了 35%。 差距越大，最大值的概率越接近 1，其他值越接近 0。

这个「放大程度」是可以调节的——引入一个**温度参数 $T$**，把 logits 先除以 $T$，再做 Softmax：

$$
Softmax(\frac{z_{i}}{T})
$$

<figure class="fig" style="margin:1.2em 0">
  <div class="fig-frame" style="background:#FFFDF8;border:1px solid #DCD2BF;border-radius:8px;padding:8px">
    <div id="kx-fig-11-3" style="width:100%;height:330px"></div>
    <div style="text-align:center;font-family:'JetBrains Mono, monospace',monospace;font-size:11px;color:#93A0AC">三种温度下三者之和均为 1.000 ✓</div>
  </div>
  <figcaption style="margin:6px 4px 0;font-size:.85em;color:#5C6B79;line-height:1.6">
    <span style="color:#C0481E;font-weight:600;margin-right:6px">图 11-3</span>同一组 logits，三种温度下的概率分布。T=0.5 时模型极度自信（几乎全押苹果）；T=2 时分布趋于均匀（更多随机性）。这就是 ChatGPT 里 temperature 参数的数学来源。（悬停查看数值）
  </figcaption>
</figure>
<script>
(function () {
  function draw() {
    Plotly.newPlot('kx-fig-11-3', [
      { x: ['苹果', '香蕉', '西瓜'], y: [0.85, 0.01, 0.14], type: 'bar', name: 'T=0.5 低温·果断', marker: { color: '#C0481E' }, hoverinfo: 'skip' },
      { x: ['苹果', '香蕉', '西瓜'], y: [0.55, 0.04, 0.41], type: 'bar', name: 'T=1 标准', marker: { color: '#3E6B8F' }, hoverinfo: 'skip' },
      { x: ['苹果', '香蕉', '西瓜'], y: [0.38, 0.16, 0.46], type: 'bar', name: 'T=2 高温·随机', marker: { color: '#8a7d63' }, hoverinfo: 'skip' }
    ], {
      paper_bgcolor: '#FFFDF8', plot_bgcolor: '#FFFDF8', barmode: 'group',
      font: { family: 'Noto Sans SC, sans-serif', size: 12, color: '#5C6B79' },
      margin: { l: 48, r: 18, t: 16, b: 30 }, height: 330,
      showlegend: true, legend: { orientation: 'h', y: 1.12, font: { size: 11, color: '#5C6B79' } }, bargap: 0.3,
      yaxis: { title: { text: '概率', font: { size: 12, color: '#5C6B79' } }, range: [0, 1], gridcolor: '#DCD2BF', zerolinecolor: '#93A0AC', tickfont: { family: 'JetBrains Mono, monospace', size: 10, color: '#93A0AC' } }
    }, { displayModeBar: false, responsive: true });
  }
  if (window.Plotly) { draw(); }
  else {
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.35.2/plotly.min.js';
    s.onload = draw;
    document.head.appendChild(s);
  }
})();
</script>

这就是你使用 ChatGPT 时看到的「temperature」旋钮： 低温（如 0.2）让输出更确定、更保守——适合写代码、做数学； 高温（如 0.8~1.0）让输出更多样、更有创意——适合写故事、头脑风暴。

> [!important] 数值不稳定
> 当某个 logit 是 1000 时，$e^{1000}$ 超出浮点数上限（上溢出）。 解法：先把所有 logit 减去最大值再取指数——数学上等价（分子分母同乘 $e^{-max}$ 抵消），但数值上稳定。 这叫 log-sum-exp 技巧，PyTorch 的 `F.cross_entropy` 已经内置，直接传 logits 即可。

## 总结

> [!important] 本课核心 · TAKEAWAY
> Softmax 解决了「分数→概率」的两个问题（负数 + 不加和为 1）： 对每个 logit 取 eˣ（天然非负），再整体归一化。 指数放大差距，温度参数可以反向调节这个放大—— 这就是ChatGPT temperature 的数学来源。

- **Logits**：分类网络最后一层的原始分数，有正有负，不是概率。
- **直接归一化的问题**：有负数时会出现负概率；平移量任意导致结果不稳定。
- **Softmax**：eᶻⁱ / Σeᶻʲ，先取指数消除负数，再归一化；差距被放大。
- **温度参数 T**：Softmax(z/T)；T 越小越果断，T 越大越随机。

> [!example] 学习小测验
> **Q1. Softmax 要解决的核心问题是：把一组任意实数的 logits 变成概率。它分两步，正确的是？**
> - A. 先取绝对值，再除以个数
> - B. 先对每个数取指数 eˣ（保证非负），再整体归一化（保证和为 1） ✅
> - C. 先排序，再取最大值
> - D. 先减去平均值，再四舍五入
>
> > [!tip]- 第 1 题讲解
> > Softmax(zᵢ)=eᶻⁱ/Σeᶻʲ。取指数让所有数变正（解决负概率问题），再除以总和让它们加起来等于 1。指数还会「放大」原本的差距，让领先的类别概率更突出。
>
> **Q2. Softmax 里的「温度参数 T」（把 logits 先除以 T 再做 Softmax）有什么效果？**
> - A. T 越大输出越确定，T 越小越随机
> - B. T 越小（低温）分布越尖锐果断，T 越大（高温）分布越平缓随机 ✅
> - C. T 只影响速度，不影响结果
> - D. T 必须等于 1，否则结果错误
>
> > [!tip]- 第 2 题讲解
> > 温度调节「放大程度」：低温（T<1）拉大差距、让最大项概率接近 1，输出更果断；高温（T>1）拉平分布、增加随机性。这正是 ChatGPT 里 temperature 旋钮的数学来源——低温适合写代码，高温适合写故事。

## 相关笔记

- 所属卷：[[卷二-神经网络/卷二导读|卷二 · 神经网络]]
- 上一课：[[卷二-神经网络/10-损失函数|10 损失函数]]
- 下一课：[[卷二-神经网络/12-梯度下降与优化器|12 梯度下降与优化器]]
- 课程总览：[[00-总索引]]
