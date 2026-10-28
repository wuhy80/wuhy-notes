---
tags:
  - 大模型/教程
  - AI大模型原理教程
created: 2026-10-18
source: https://www.xuanyuancode.com/ai-llm/lessons/nlp-04-rnn
course: AI大模型原理免费教程
volume: 卷三 · 自然语言处理
lesson: 17
---

# 17 RNN 循环神经网络

> [!abstract] 本课导读
> 固定窗口看不到更早的词——能不能给网络装上「记忆」？

本文来自「轩辕的编程宇宙」免费教程 [《AI 大模型原理》](https://www.xuanyuancode.com/ai-llm/lessons/nlp-04-rnn)，全文 30 课从向量讲到 Transformer。原站图文编排更精美，含交互实验，建议结合阅读。

## 固定窗口的死角

读这句话，填空：

<div class="formula" style="font-family:var(--serif);font-size:18px;line-height:2">「小猫没有过马路，因为<span class="f-hl">＿＿</span>太害怕了。」</div>

空里该填「它」——怕的是前面那只小猫。这对你毫不费力，可对上一课的固定窗口模型却是道坎： 「小猫」离空格隔了好几个词。如果模型只看最近 5 个词（「因为＿＿太害怕了」）， 它根本瞧不见「小猫」，只能干猜「因为*什么*太害怕了」，压根不知道主语是猫、是人还是狗。

这就是固定窗口的死角：**窗口以外的所有信息，等于不存在。**可真实文本里，代词（「它」「他们」「这」）和它指代的对象常常隔着几十个词， 段落之间前后呼应的线索甚至隔着几百个词——窗口再大也兜不住。

> [!question] 想一想
> 固定窗口的毛病是看不到远处。有没有办法让模型「记住」很久之前读过的内容，又不必把每个词都存下来？
>
> > [!tip]- 我想好了，看答案
> > 维护一份「读到这里为止的摘要」。不是把读过的每个词都原样存下来（那太多了）， 而是只留一个不断更新的「当前记忆」：每读一个新词，就用它来更新这份记忆。 这样无论句子多长，手边始终攥着一份简短的「我读到了什么」总结， 预测下一个词时就拿它来用。

## 给网络一个「记忆向量」

循环神经网络（RNN）的思路正是这样：读每个词时，除了当前这个词，网络还多收一个输入—— 来自上一步的「记忆」，记作 $h$（书上叫「隐藏状态」，我们就叫它**记忆向量**）。

每读一个词，做两件事：
<div class="formula">新记忆 = tanh( W · [当前词向量, 旧记忆] + b )<br/>预测下一个词 = 用新记忆去算</div>

更新公式拆开看其实很朴素：把**当前词向量**和**旧记忆**拼在一起，过一个线性变换 $W\cdot []+b$， 再套一层 tanh，就得到新记忆。就这一步，从句首到句尾反复执行。

这里的 $W\cdot []+b$ 还是第 4、7 课那个 **Wx+b**；外面的 tanh 就是第 8 课的**激活函数**（形状像 Sigmoid，但输出在 −1~1 之间）。所以 RNN 没造新零件——它只是把「线性变换 + 激活」接成了一个**环**： 上一步的输出，又喂回来当这一步的输入。

![[L17-fig1.svg]]
*图 17-1RNN 展开图：每个方块是读一个词时做的同一套操作。记忆向量 h 从左到右传递，理论上「小猫」的信息会一直保留到预测「它」的时候。*

这个设计最大的好处是**不限制句子长度**：无论句子多长，每步都只做同一件事——读一个词、更新记忆。 100 个词和 10 个词用的是同一套参数 $W,b$，记忆向量 h 始终在手边，随句子推进不断刷新。

## 手算一遍：记忆怎么一步步更新

公式归公式，我们把它**缩小到能口算**，亲眼看一遍记忆是怎么流动的。让记忆 $h$ 就是**一个数**，专门记「这句话里有没有提到小猫」。更新规则简化成：

$$
h_{新}=\mathrm{tanh}(0.6\times h_{旧}+x)
$$

这里 0.6 是「上一步记忆能带过来多少」（记忆传递系数），$x$ 是当前这个词带来的新信号。 我们让只有「小猫」带来强信号 $x=1.5$，其余的词都和猫无关、$x=0$。 从 $h_{0}=0$ 开始，一个词一个词地算：
<div class="formula" style="text-align:left;font-size:14px;line-height:2.1">① 小猫：h = tanh(0.6×0 + <span class="f-hl">1.5</span>) = tanh(1.5) ≈ <span class="f-hl">0.90</span>　← 记忆被「小猫」点亮<br/>② 没有：h = tanh(0.6×0.90 + 0) = tanh(0.54) ≈ <span class="f-hl">0.50</span><br/>③ 过　：h = tanh(0.6×0.50 + 0) = tanh(0.30) ≈ <span class="f-hl">0.29</span><br/>④ 马路：h = tanh(0.6×0.29 + 0) = tanh(0.17) ≈ <span class="f-hl">0.17</span><br/>⑤ 因为：h = tanh(0.6×0.17 + 0) = tanh(0.10) ≈ <span class="f-hl">0.10</span></div>

看这串数：0.90 → 0.50 → 0.29 → 0.17 → 0.10。每读一个无关的词，「小猫」的信号都先乘 0.6、再被 tanh 压一下， 一步步矮下去。到第 5 个词「因为」，它只剩峰值的约 **11%**——好在 5 个词还撑得住， 预测「它」时记忆里多少还残着点猫味。下面这台机器，按「读下一个词」就走一步，自己看这个过程：

<figure class="fig" style="margin:1.2em 0">
  <div class="fig-frame" style="background:#FFFDF8;border:1px solid #DCD2BF;border-radius:8px;padding:14px;font-family:'Noto Sans SC, sans-serif'">
    <div id="demo-17a-words" style="display:flex;gap:8px;justify-content:center;align-items:flex-end;margin-bottom:6px"></div>
    <div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px;font-size:10px;color:#93A0AC;font-family:'JetBrains Mono, monospace',monospace" id="demo-17a-hs"></div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;margin-bottom:8px;font-size:13px;color:#5C6B79">
      <button id="demo-17a-prev" type="button" style="padding:6px 14px;border-radius:8px;border:1.5px solid #DCD2BF;background:#FFFDF8;color:#5C6B79;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px">← 上一词</button>
      <button id="demo-17a-next" type="button" style="padding:6px 14px;border-radius:8px;border:1.5px solid #C0481E;background:#C0481E;color:#fff;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px">读下一个词 →</button>
      <button id="demo-17a-reset" type="button" style="padding:6px 14px;border-radius:8px;border:1.5px solid #DCD2BF;background:#FFFDF8;color:#5C6B79;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px">↺ 重置</button>
      <span id="demo-17a-prog" style="font-family:'JetBrains Mono, monospace',monospace"></span>
    </div>
    <div id="demo-17a-formula" style="text-align:center;font-family:'JetBrains Mono, monospace',monospace;font-size:13px;color:#1E2B38;min-height:22px"></div>
    <div id="demo-17a-note" style="text-align:center;font-size:12.5px;color:#C0481E;font-weight:600;margin-top:6px;min-height:18px"></div>
  </div>
  <figcaption style="margin:6px 4px 0;font-size:.85em;color:#5C6B79;line-height:1.6">
    <span style="color:#C0481E;font-weight:600;margin-right:6px">互动 17-A</span>一维记忆的现场演算：每点「读下一个词」就执行一次 h ← tanh(0.6·h + x)。蓝条的高度就是当前记忆 h，越往右越矮——「小猫」的信号正被一步步稀释。读完全句，想想：到句尾要预测「它」时，记忆里还剩多少猫味？<a href="https://www.xuanyuancode.com/ai-llm/lessons/nlp-04-rnn" style="margin-left:6px">原站交互版</a>
  </figcaption>
</figure>
<script>
(function () {
  var words = ['小猫', '没有', '过', '马路', '因为', '它'];
  var SIG = [1.5, 0, 0, 0, 0, 0];
  var pos = 0;
  var wordsEl = document.getElementById('demo-17a-words');
  var hsEl = document.getElementById('demo-17a-hs');
  var progEl = document.getElementById('demo-17a-prog');
  var formulaEl = document.getElementById('demo-17a-formula');
  var noteEl = document.getElementById('demo-17a-note');
  function tanh(x) { return Math.tanh(x); }
  function hist() {
    var hs = [0];
    for (var i = 0; i < pos; i++) hs.push(tanh(0.6 * hs[i] + SIG[i]));
    return hs;
  }
  function draw() {
    var hs = hist();
    wordsEl.innerHTML = '';
    hsEl.innerHTML = '';
    for (var i = 0; i < words.length; i++) {
      var read = i < pos, isNext = i === pos;
      var col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
      var hNow = i < pos ? hs[i + 1] : 0;
      var barBox = '<div style="width:44px;height:86px;display:flex;align-items:flex-end;justify-content:center;background:#FAF6EE;border-radius:6px;border:1px solid #EFE6CC">' +
        '<div style="width:30px;height:' + (hNow * 82).toFixed(1) + 'px;border-radius:5px;background:#3E6B8F;opacity:' + (i < pos ? 1 : 0.15) + ';transition:height .25s"></div></div>';
      var chip = '<div style="padding:5px 0;width:46px;text-align:center;border-radius:8px;font-size:13px;font-weight:700;border:1.5px solid ' + (isNext ? '#C0481E' : read ? '#3E6B8F' : '#DCD2BF') + ';background:' + (isNext ? '#C0481E' : read ? '#EAF3F8' : '#FFFDF8') + ';color:' + (isNext ? '#fff' : read ? '#1E2B38' : '#93A0AC') + '">' + words[i] + '</div>';
      col.innerHTML = barBox + chip;
      wordsEl.appendChild(col);
      var hcell = document.createElement('span');
      hcell.style.cssText = 'width:50px;text-align:center';
      hcell.textContent = i < pos ? 'h=' + hs[i + 1].toFixed(2) : '·';
      hsEl.appendChild(hcell);
    }
    progEl.textContent = pos === 0 ? '还没开始读' : '读到第 ' + pos + ' / 6 个词';
    if (pos === 0) {
      formulaEl.innerHTML = 'h₀ = 0，等着第一个词进来';
      noteEl.textContent = '点「读下一个词」，看「小猫」的信号怎样被一步步稀释';
    } else {
      var prev = hs[pos - 1], x = SIG[pos - 1], h = hs[pos];
      formulaEl.innerHTML = words[pos - 1] + '：h = tanh(0.6 × ' + prev.toFixed(2) + ' + ' + x + ') = tanh(' + (0.6 * prev + x).toFixed(2) + ') = <strong style="color:#3E6B8F">' + h.toFixed(2) + '</strong>';
      noteEl.textContent = pos >= 5
        ? '句子读完。句尾的「它」指的就是开头的「小猫」——可记忆只剩峰值的一成左右，隔 20 个词更是 0.6²⁰ ≈ 0.00004，几乎归零'
        : pos === 1 ? '第 1 步读到「小猫」，记忆一下冲到峰值——稀释从下一个无关词才开始' : '「小猫」的信号 ×0.6 又矮了一截';
    }
    document.getElementById('demo-17a-prev').disabled = pos === 0;
    document.getElementById('demo-17a-next').disabled = pos >= 5;
  }
  document.getElementById('demo-17a-prev').addEventListener('click', function () { if (pos > 0) { pos -= 1; draw(); } });
  document.getElementById('demo-17a-next').addEventListener('click', function () { if (pos < 5) { pos += 1; draw(); } });
  document.getElementById('demo-17a-reset').addEventListener('click', function () { pos = 0; draw(); });
  pos = 1;  draw();
})();
</script>

## 局限：记忆随距离消退

上一站那串递减的数字，藏着 RNN 最残酷的毛病。记忆 h 每读一个词就被刷新一次， 而每次刷新都是「**旧记忆 × 0.6 + 新词**」的混合——也就是说，旧记忆每走一步都被稀释一点。 这就像**打电话传话**：第一个人说「小猫今天心情不好」，一个传一个， 传到第二十个人，「小猫」多半已经变成「谁？」

把上一站的 0.6 连乘下去，衰减快得吓人。隔 5 个词还剩 $0.6^{5}\approx 0.08$， 可隔 20 个词呢？

$$
0.6^{20}\approx 0.00004
$$

几乎归零。这就是为什么 RNN 记不住远处的词。

![[L17-fig2.svg]]
*图 17-2每刷新一次记忆，旧记忆就被稀释。距离越远的词，残留越少——这叫「记忆淡出」，也是梯度消失的一种表现。*

> [!important] 梯度也跟着淡了
> 从训练的角度看，这事更严重。要让「第 1 步读到的小猫」学会影响「第 20 步预测的它」， 得把梯度从第 20 步一路反向传回第 1 步，每经过一步就要乘一次权重的导数。 只要这个数稍小于 1，连乘 20 次后就几乎变成零——**梯度消失**，第 1 步的参数根本得不到有效更新。
> 这两个词你都见过：第 8 课讲 Sigmoid 时埋过「梯度消失」的伏笔，第 13 课讲反向传播时摊开过「链式法则」的连乘。 这一课它俩正面撞上了——RNN 把**同一个权重沿时间连乘几十次**， 数稍小于 1，远处梯度就被连乘到几乎不存在。这不是代码写错，是数学上的硬限制： 实践中 RNN 确实学不到间隔超过 5~10 个词的依赖。

> [!question] 想一想
> 「每步无差别混合所有信息」是病根。如果记忆能*有选择地*更新——重要的多留、无关的少写——会不会好很多？
>
> > [!tip]- 我想好了，看答案
> > 病根是「每步都无差别地混合旧记忆和新词」——重要的「小猫」和无关的「马路」被一视同仁地稀释。 那解药就是：*别再一视同仁*。让记忆自己决定「这一步该保留多少旧的、写入多少新的」。 读到「小猫」这种关键信息就大量保留，读到「过」「马路」这种过渡词就少写入、别去冲掉重要记忆。 说白了，给记忆装上几个「开关」——阀门，控制信息的流量。

## 总结

> [!important] 本课核心 · TAKEAWAY
> RNN 给网络加了个「记忆向量」h，每读一个词就用 h ← tanh(W·[词, 旧记忆] + b) 刷新一次，理论上能记住任意长的上下文。可实践中，旧记忆每步被稀释， 距离远的词信息几乎消失——梯度也随距离连乘到近乎为零，网络根本学不到远距离依赖。

- **固定窗口的死角**：窗口外的词等于不存在，处理不了长距离的代词指代。
- **RNN 的思路**：一个记忆向量 h，每读一个词更新一次，把「线性变换+激活」接成环。
- **手算一遍**：h 从 0.90 一路衰减到 0.10——「小猫」信号 5 个词后只剩约 11%。
- **RNN 的局限**：记忆随距离淡出（0.6²⁰≈0.00004）；梯度随距离消失；学不到远依赖。

> [!example] 学习小测验
> **Q1. RNN（循环神经网络）相比固定窗口的前馈模型，关键创新是什么？**
> - A. 层数更多
> - B. 引入「隐藏状态」并循环传递，相当于给网络装上了能携带历史信息的「记忆」 ✅
> - C. 不需要训练
> - D. 只能处理图像
>
> > [!tip]- 第 1 题讲解
> > RNN 逐个处理序列中的词，每一步都把「当前输入 + 上一步的隐藏状态」结合，更新出新的隐藏状态再传给下一步。这个不断更新、向后传递的隐藏状态，就是它的记忆，理论上能容纳任意长的历史。
>
> **Q2. 原始 RNN 在处理长序列时常遇到的核心困难是什么？**
> - A. 参数太少
> - B. 梯度消失/爆炸，导致很难学到「相隔很远」的依赖关系 ✅
> - C. 无法处理文字
> - D. 只能正向不能反向
>
> > [!tip]- 第 2 题讲解
> > 反向传播要穿过很多时间步，梯度连乘后容易指数级衰减（消失）或膨胀（爆炸），使得早期信息的影响传不到后面。结果是 RNN 的「记忆」其实传不远——这正是 LSTM 要解决的问题。

## 相关笔记

- 所属卷：[[卷三-自然语言处理/卷三导读|卷三 · 自然语言处理]]
- 上一课：[[卷三-自然语言处理/16-前馈神经网络语言模型|16 前馈神经网络语言模型]]
- 下一课：[[卷三-自然语言处理/18-LSTM 长短期记忆网络|18 LSTM 长短期记忆网络]]
- 课程总览：[[00-总索引]]
