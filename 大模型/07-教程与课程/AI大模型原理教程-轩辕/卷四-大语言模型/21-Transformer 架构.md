---
tags:
  - 大模型/教程
  - AI大模型原理教程
created: 2026-10-18
source: https://www.xuanyuancode.com/ai-llm/lessons/tf-transformer
course: AI大模型原理免费教程
volume: 卷四 · 大语言模型
lesson: 21
---

# 21 Transformer 架构

> [!abstract] 本课导读
> 把注意力、FFN、残差拼在一起——2017 年那篇论文到底做了什么？

本文来自「轩辕的编程宇宙」免费教程 [《AI 大模型原理》](https://www.xuanyuancode.com/ai-llm/lessons/tf-transformer)，全文 30 课从向量讲到 Transformer。原站图文编排更精美，含交互实验，建议结合阅读。

## 注意力已经很强了，为什么还不够？

前两课我们已经造出了一个很厉害的部件：**注意力**。它让句子里的每个词都能回头看别的词， 于是「它」终于知道自己指的是谁；再加上**多头**，模型还能同时盯住指代、语法、情绪这些不同关系。

到这里，一个很自然的问题就来了：**既然注意力已经能让词彼此看见，为什么 Transformer 还要加别的零件？**为什么不是“几层注意力一叠”，事情就结束了？

这一课我们不背整张结构图，也不一上来扔一堆术语。只做一件事：围着一句最简单的话，**亲手把一台最简 Transformer 搭出来**，并且看清它身上每个零件到底是被什么问题逼出来的。
<p class="lesson-punch">输入：「我 是 一只 小 ___」<br/>目标：预测下一个词</p>

## 先搭最朴素的一版：只有注意力

先别急着加零件。我们先来搭一个**最朴素**的版本试试看：把「我 / 是 / 一只 / 小」这几个词变成向量， 丢进一层注意力，让每个词去看别的词、把相关信息混进自己；再叠几层，最后拿最末尾那个位置的向量去预测下一个词。

这个想法很顺。因为预测「小 ___」后面该接什么，确实需要前文信息： 「我 是 一只 小」看完整体之后，模型大概率会觉得「猫」「狗」「鸟」之类的词比较像答案。

但问题也正卡在这里：**注意力能把信息汇总过来，却不等于它已经会“加工”这些信息。**先把这一点盯牢。

注意力算到最后，每个词拿到的新向量，本质上是别的词的 $V$ 按权重做的一次**加权平均**。 也就是说，它更像是在已有信息之间**重新分配比重**，而不是凭空造出一个全新的判断。

![[L21-fig1.svg]]
*图 21-1注意力的输出是各词 $V$ 的加权平均。它非常擅长把相关信息拉到一起，但这一步本身更像“混合”而不是“深加工”。*

用回我们的例子：注意力当然能让最后那个位置看到「我」「是」「一只」「小」这些上下文， 但它看到之后，**还需要一个部件来把这些线索整理成更明确的特征**，比如“这大概率在说某种小动物”。

这一步的思路，其实和第 16 课一模一样。那一课我们发现：**N-gram 只会查表，查到之后不会推断**， 所以才把卷二早就学过的**全连接网络**接上去，让它把“查来的数字”再加工一遍。这里也一样：**注意力只负责把相关词找来、混到一起；可“找来之后怎么办”，它自己不负责。**

一旦把缺口说清楚，补件其实几乎是顺手拈来的：我们卷二已经有现成的“加工器”了。 它会做三件注意力自己不擅长的事：**加权、过非线性、把结果压成新的表示**。 换句话说，注意力负责**收集材料**，那下一个自然该接上的，就该是一个负责**处理材料**的网络。

> [!question] 想一想
> 如果注意力只是把上下文汇总到当前位置，那么“汇总之后怎么加工”这一步该由谁来做？
>
> > [!tip]- 我想好了，看答案
> > 还缺一个“每个词自己再想一遍”的加工步骤。 注意力负责把相关信息拉过来，但拉过来之后，总得有个部件把这些信息重新整理、筛选、压缩，变成更适合下一层使用的表示。 而我们前面已经学过，最标准的“加工器”就是全连接网络。

## 补上第一块零件：FFN

这时候就轮到第二个部件出场了：**FFN（前馈网络）**。它不是拿来让词和词通信的， 而是让**每个词各自**在拿到上下文之后，再做一轮自己的内部加工。

所以这里不是“凭空又塞了一个模块”，而是顺着缺口往下补：**谁负责收集上下文？注意力。谁负责把收集来的东西再算一遍？FFN。**这和第 16 课“查向量之后，为什么自然要接一个神经网络”是同一种写法。

$$
FFN(x)=W_{2}\mathrm{ReLU}(W_{1}x+b_{1})+b_{2}
$$

你可以把一层 block 想成两步，分工非常清楚：

- **注意力**：横向，负责“去看别人”。
- **FFN**：纵向，负责“拿到信息后自己再想一遍”。

![[L21-fig2.svg]]
*图 21-2一层 Block 里的两步：先用注意力横向汇总上下文，再让每个词各自通过 FFN 做纵向加工。*

所以 FFN 不是配角，而是必需品。没有它，你只有“把相关信息拉过来”这一步；有了它，模型才多了“把拉来的信息重新整理成更好表示”这一步。

论文里 FFN 常写成 **512 → 2048 → 512**：先把维度**撑大**到 4 倍，过一道 ReLU，再**压回**原样。为什么要这么折腾？看个具体例子就懂了。

先看清楚 FFN 拿到的「小」是什么。它**不是**词表里那个孤零零的「小」，而是刚过完注意力、**已经把前文「我 是 一只」的信息揉进来**的一个 512 维向量——里面其实*暗藏*着好几条线索： 前面出现过「一只」、出现过「小」、整句在讲「我」……只是这些线索**挤成一团、藏在那 512 个数字里**，还没被读出来。

FFN 要做的，就是把这些暗藏的线索**一条条识别出来**，合起来判断「**下一个词会不会是某种小动物**」： 有没有「一只」（在点数一个个体）？有没有「小」（体型偏小）？像不像在讲宠物？**撑到 2048 维，就是一次摆开两千多个这样的「小检测器」**，每个查一条线索；ReLU 把查到的留下、没查到的清零； 最后第二个矩阵把亮着的线索**汇总成一句结论**「大概率接小动物」，再压回 512 维交出去。

所以两次变维，各有各的用处：**撑大**，是因为 512 维塞不下这么多检测器、线索一多就照顾不过来；**压回**，是因为下一个 block 接的就是 512 维，不收拢回去就接不上。（至于偏偏是 4 倍，是试出来的经验值，记住套路就行。）

![[L21-fig3.svg]]
*图 21-3FFN 先把维度放大，再通过非线性筛选和压缩，最后回到原维度。这一步发生在每个词内部，而不是词与词之间。*

这一步还有个重要副作用：FFN 里塞满了参数，因此模型很多“内部知识”也会沉在这里。但对这一课来说，你先记住更关键的分工就够了：**attention 管通信，FFN 管加工。**

## 把它们拼起来：最简 Transformer 主干

到这里，block 的主干已经出来了：**一个词进来，先和别的词交换信息，再自己做一轮加工。**把这两个步骤首尾接起来，就是一个 Transformer block。

而且这个 block 有个非常妙的性质：**输入和输出维度一样**。这里说的“输入”，不是一句话的汉字本身， 而是**这一整排词向量**；“输出”则是这排词向量各自经过 attention 和 FFN 之后的新版本。 比如这句「我 / 是 / 一只 / 小」，现在正好有 4 个 token；如果每个词向量是 512 维，那么这一轮一个 block 吃进去的是**4 × 512**，吐出来的仍然是**4 × 512**： 还是 4 个位置、每个位置还是 512 个数，只不过每个位置里的内容都被更新过了。

但要注意，**4 只是这句例子的长度，不是 Transformer 固定只吃 4 个词**。更一般地，一个 block 处理的是**n × 512** 这样一整张表：**n** 是这次实际喂进去的 token 数，512 是每个 token 向量的维度。 句子短，n 就小；句子长，n 就大。唯一的限制是 **n 不能超过模型允许的最大上下文长度**，不可能无限长。

正因为形状没变，一个 block 的输出才能原封不动地送进下一个 block。于是它天然就适合一层一层往上叠。

现在把整个流程接完整：

- 先把「我 / 是 / 一只 / 小」查词表，变成一排向量。
- 过几层 block，让这些向量反复交换信息、反复加工。
- 取最后一个位置的输出向量，去预测“下一个词是谁”。

![[L21-fig4.svg]]
*图 21-4最简 Transformer 主干：词向量输入，经过几层“注意力 + FFN”，最后由末尾位置去预测下一个词。*

这就是 GPT 式生成的核心：先算出「猫 31%、狗 22%、鸟 12%……」，挑一个结果接到句尾， 再把整句重新送进去，继续预测下一个词。于是文本就是这样一个词一个词往外长出来的。

到这里你应该已经抓住主干了：**Transformer block = attention + FFN，并且可以堆叠。**但这台机器还埋着一个马上会翻车的坑。

## 它马上翻车了：模型不知道谁在前谁在后

问题恰好出在我们刚刚夸过的优点上：**并行**。Transformer 能把一整排词同时送进去算， 不像 RNN 那样一个个排队，这让它特别适合 GPU，也特别适合做大。

但“同时处理”也带来副作用：**如果你只给词向量，不额外告诉它位置，注意力本身并不知道顺序。**

<div class="formula" style="font-family:var(--serif);font-size:18px">「猫 追 狗」　vs　「狗 追 猫」</div>

这两句用的是同一批词，意思却完全反过来。可如果模型只看到一袋词和它们的向量， 那它根本不知道“猫”是在前面还是在后面，“狗”是在宾语位置还是主语位置。

这就逼出了第三块零件：**位置编码**。方法很直接：在送进第一层注意力之前， 先给每个词向量加上一份“我是第几个”的信息。

$$
\text{真正的输入}=是什么词词向量+排第几个位置向量
$$

这样一来，“猫@位置0”和“猫@位置2”就不再是同一个向量，“猫追狗”和“狗追猫”也终于会被模型区分开。

![[L21-fig5.svg]]
*图 21-5位置编码的作用不是增加词义，而是把顺序重新塞回模型输入里。*

原始论文用的是正弦/余弦位置编码；后来的模型还会用可学习位置向量、RoPE 等做法。实现细节可以变化， 但目的始终没变：**告诉模型“这些词不只是同时出现，它们还有先后次序”。**

## 到这里，一台最简 Transformer 就拼出来了

现在回头看，整个结构已经很清楚了：

- **词向量**负责告诉模型“这是什么词”。
- **位置编码**负责告诉模型“它排第几个”。
- **注意力**负责让词与词交换信息。
- **FFN**负责让每个词在拿到信息后自己再加工一遍。
- **多层堆叠**负责把这件事反复做深。
- **末尾线性层 + softmax**负责把最后一个位置变成“下一个词的概率表”。

<figure class="fig" style="margin:1.2em 0">
  <div class="fig-frame" style="background:#FFFDF8;border:1px solid #DCD2BF;border-radius:8px;padding:14px;font-family:'Noto Sans SC, sans-serif'">
    <svg id="demo-216-svg" viewBox="0 0 640 780" style="width:100%;max-width:560px;display:block;margin:0 auto"></svg>
    <div id="demo-216-tip" style="text-align:center;font-size:12.5px;color:#5C6B79;min-height:20px;margin-top:6px">把鼠标移到图中任意模块上，看它负责什么。</div>
  </div>
  <figcaption style="margin:6px 4px 0;font-size:.85em;color:#5C6B79;line-height:1.6">
    <span style="color:#C0481E;font-weight:600;margin-right:6px">图 21-6</span>这节课的简化版 Transformer 总览图：token 先变成词向量，再叠加位置信息，经过多层「注意力 + FFN」的 block，最后只拿末位置的表示去预测下一个词。（鼠标悬停可看每个模块的职责）<a href="https://www.xuanyuancode.com/ai-llm/lessons/tf-transformer" style="margin-left:6px">原站交互版</a>
  </figcaption>
</figure>
<script>
(function () {
  var parts = [];
  var svg = document.getElementById('demo-216-svg');
  var tip = document.getElementById('demo-216-tip');
  function txt(x, y, s, size, color, weight, anchor) {
    parts.push('<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + color + '" font-weight="' + (weight || 400) + '" text-anchor="' + (anchor || 'middle') + '" font-family="Noto Sans SC, sans-serif">' + s + '</text>');
  }
  function arrow(x1, y1, x2, y2) {
    parts.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#93A0AC" stroke-width="1.6"/><path d="M' + x2 + ' ' + y2 + ' l-4 -7 l8 0 z" fill="#93A0AC"/>');
  }
  var CX = 320;
  var tokens = ['我', '是', '一只', '小'];
  var tw = [56, 56, 76, 56];
  var gap = 14;
  var total = tw.reduce(function (a, b) { return a + b; }, 0) + gap * 3;
  var x0 = CX - total / 2;
  parts.push('<g data-k="token">');
  for (var i = 0; i < 4; i++) {
    var tx = x0;
    for (var j = 0; j < i; j++) tx += tw[j] + gap;
    parts.push('<rect x="' + tx + '" y="16" width="' + tw[i] + '" height="34" rx="7" fill="#FBEDE8" stroke="#C0481E" stroke-width="1.6"/>');
    txt(tx + tw[i] / 2, 38, tokens[i], 14, '#1E2B38', 700);
  }
  parts.push('</g>');
  arrow(CX, 54, CX, 80);
  parts.push('<g data-k="embed">');
  for (var i = 0; i < 4; i++) {
    var tx = x0;
    for (var j = 0; j < i; j++) tx += tw[j] + gap;
    parts.push('<rect x="' + tx + '" y="86" width="' + tw[i] + '" height="16" rx="4" fill="#EAF3F8" stroke="#3E6B8F" stroke-width="1.4"/>');
  }
  txt(CX, 122, '词向量：每个 token 查词表变成一串数', 12, '#5C6B79');
  parts.push('</g>');
  arrow(CX, 128, CX, 152);
  parts.push('<g data-k="pos">');
  for (var i = 0; i < 4; i++) {
    var tx = x0;
    for (var j = 0; j < i; j++) tx += tw[j] + gap;
    parts.push('<rect x="' + tx + '" y="156" width="' + tw[i] + '" height="16" rx="4" fill="none" stroke="#C9A227" stroke-width="1.4" stroke-dasharray="4 3"/>');
    parts.push('<text x="' + (tx + tw[i] / 2) + '" y="168" font-size="10" fill="#9A7B2E" text-anchor="middle" font-family="JetBrains Mono, monospace">＋pos</text>');
  }
  txt(CX, 192, '叠加位置信息：告诉模型「它排第几」', 12, '#5C6B79');
  parts.push('</g>');
  arrow(CX, 198, CX, 224);
  parts.push('<g data-k="block">');
  parts.push('<rect x="112" y="228" width="416" height="196" rx="12" fill="none" stroke="#C0481E" stroke-width="1.6" stroke-dasharray="7 5"/>');
  parts.push('<rect x="196" y="220" width="248" height="18" fill="#FFFDF8"/>');
  txt(CX, 234, 'Block（一个加工层）', 13, '#C0481E', 700);
  parts.push('<rect x="150" y="252" width="340" height="62" rx="9" fill="#EAF3F8" stroke="#3E6B8F" stroke-width="1.6"/>');
  txt(CX, 278, '注意力', 14, '#1E2B38', 700);
  txt(CX, 298, 'token 与 token 之间横向通信', 11.5, '#3E6B8F');
  parts.push('<rect x="150" y="338" width="340" height="62" rx="9" fill="#EAF5EE" stroke="#3E8F5A" stroke-width="1.6"/>');
  txt(CX, 364, 'FFN', 14, '#1E2B38', 700);
  txt(CX, 384, '每个 token 拿到信息后自己再纵向加工一遍', 11.5, '#3E8F5A');
  arrow(CX, 314, CX, 334);
  parts.push('</g>');
  parts.push('<g data-k="stack">');
  parts.push('<rect x="540" y="252" width="52" height="148" rx="9" fill="#FFF" stroke="#C0481E" stroke-width="1.2" transform="translate(8,6)"/>');
  parts.push('<rect x="540" y="252" width="52" height="148" rx="9" fill="#FFF" stroke="#C0481E" stroke-width="1.2" transform="translate(4,3)"/>');
  parts.push('<rect x="540" y="252" width="52" height="148" rx="9" fill="#FFFDF8" stroke="#C0481E" stroke-width="1.6"/>');
  txt(566, 320, '×3', 16, '#C0481E', 700);
  txt(566, 340, '同样的', 10.5, '#5C6B79');
  txt(566, 354, 'block 堆 3 层', 10.5, '#5C6B79');
  parts.push('</g>');
  arrow(CX, 428, CX, 456);
  parts.push('<g data-k="last">');
  parts.push('<rect x="170" y="460" width="300" height="46" rx="9" fill="#FBF6EA" stroke="#C9A227" stroke-width="1.6"/>');
  txt(CX, 480, '只拿末位置的表示', 13.5, '#1E2B38', 700);
  txt(CX, 498, '前面都白算了吗？没有——它们都被末位置「看过」了', 11, '#9A7B2E');
  parts.push('</g>');
  arrow(CX, 510, CX, 538);
  parts.push('<g data-k="head">');
  parts.push('<rect x="222" y="542" width="196" height="42" rx="9" fill="#FFF" stroke="#5C6B79" stroke-width="1.6"/>');
  txt(CX, 568, '线性层 + softmax', 13.5, '#1E2B38', 700);
  parts.push('</g>');
  arrow(CX, 588, CX, 616);
  parts.push('<g data-k="probs">');
  var bars = [['猫', 0.31, '#C0481E'], ['狗', 0.22, '#3E6B8F'], ['鸟', 0.12, '#6aa84f'], ['其他', 0.35, '#93A0AC']];
  for (var i = 0; i < bars.length; i++) {
    var bx = 150 + i * 90;
    var bh = bars[i][1] * 90;
    parts.push('<rect x="' + bx + '" y="' + (740 - bh) + '" width="46" height="' + bh + '" rx="4" fill="' + bars[i][2] + '" opacity="0.85"/>');
    txt(bx + 23, 736 - bh - 6, Math.round(bars[i][1] * 100) + '%', 11.5, '#1E2B38', 700);
    txt(bx + 23, 758, bars[i][0], 12, '#5C6B79');
  }
  txt(CX, 776, '下一个词的概率表', 12, '#93A0AC');
  parts.push('</g>');
  svg.innerHTML = parts.join('');
  var tips = {
    token: '输入句先被切成一个个 token（这里按词切）。',
    embed: '每个 token 查词表，变成一个高维词向量。',
    pos: '叠加位置信息（位置编码）：同一批 token 一起算，得靠它知道谁在前谁在后。',
    block: 'Block 是 Transformer 的标准加工层：先横向、再纵向。',
    stack: '同一个 block 原样堆 3 层（真实 GPT 是几十层），一层比一层抽象。',
    last: '预测下一个词时只取末位置的表示：因果注意力让末位置恰好「看遍」全句。',
    head: '线性层把表示映到词表大小，softmax 挤成概率分布。',
    probs: '输出就是下一个词的概率表：猫 31%、狗 22%、鸟 12%……采样或取最大，得到续写。'
  };
  svg.addEventListener('mousemove', function (e) {
    var g = e.target.closest('[data-k]');
    tip.textContent = g && tips[g.getAttribute('data-k')] ? tips[g.getAttribute('data-k')] : '把鼠标移到图中任意模块上，看它负责什么。';
  });
  svg.addEventListener('mouseleave', function () {
    tip.textContent = '把鼠标移到图中任意模块上，看它负责什么。';
  });
})();
</script>

这已经是一台能跑的 Transformer 主干了。它能并行、能堆深、能做“预测下一个词”这种任务， 这正是后来 GPT 一路做大的出发点。

当然，真实模型还没讲完。为了突出主线，我们这节课有意省掉了两个重要细节：比如 block 里真正的**Add & Norm** 稳定器，以及生成时的掩码等机制。这些不是不重要，而是值得拆到后面单独讲。

所以这节课的任务不是“把全部细节一次吞下”，而是先把主骨架梳理出来，有一个大体的印象。

## 总结

> [!important] 本课核心 · TAKEAWAY
> Transformer 不是“只有注意力”。一台最简 Transformer 至少包含三样东西：注意力负责让词与词通信，FFN负责让每个词在拿到上下文后继续加工，位置编码负责把顺序信息塞回输入。 把这样的 block 一层层叠起来，再接上线性层和 softmax，就能像 GPT 那样一步步预测下一个词。

- **只靠注意力还不够**：它能汇总上下文，但还缺少“汇总后的逐词加工”。
- **FFN 的职责**：每个词各自做一轮非线性加工，所以 block 不是 attention-only。
- **一个 block 的骨架**：attention（横向通信）+ FFN（纵向加工）。
- **顺序必须额外补回**：没有位置编码，模型分不清“猫追狗”和“狗追猫”。
- **最简 Transformer 主干**：词向量 + 位置信息 → 多层 block → 末尾预测下一个词。

> [!example] 学习小测验
> **Q1. 2017 年的 Transformer 把一个标准「块」拼装起来，主要由哪些部件组成？**
> - A. 卷积层 + 池化层
> - B. （多头）自注意力 + 前馈网络（FFN），并配以残差连接和层归一化 ✅
> - C. 只有一个巨大的全连接层
> - D. 循环单元 + 门控
>
> > [!tip]- 第 1 题讲解
> > 一个 Transformer 块 = 多头自注意力子层 + 逐位置前馈子层，每个子层都包裹着「残差连接 + 层归一化」。注意力负责「词与词之间交流信息」，FFN 负责「对每个位置做非线性加工」，残差和归一化保证深层可训练。
>
> **Q2. Transformer 抛弃了 RNN 的循环结构，带来的一个关键优势是什么？**
> - A. 不再需要任何参数
> - B. 序列内各位置可以并行计算，训练效率大幅提升，且更易建模长距离依赖 ✅
> - C. 彻底不需要数据
> - D. 只能处理很短的句子
>
> > [!tip]- 第 2 题讲解
> > RNN 必须一个词接一个词地算，难以并行。Transformer 用注意力一次性让所有位置互相「看见」，既能并行加速训练，又能直接建立任意两个位置间的联系——这正是它能扩展到超大模型的基础。

## 相关笔记

- 所属卷：[[卷四-大语言模型/卷四导读|卷四 · 大语言模型]]
- 上一课：[[卷四-大语言模型/20-多头注意力|20 多头注意力]]
- 下一课：[[卷四-大语言模型/22-Tokenizer 分词器|22 Tokenizer 分词器]]
- 课程总览：[[00-总索引]]
