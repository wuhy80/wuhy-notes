---
tags:
  - 大模型/教程
  - AI大模型原理教程
created: 2026-10-18
source: https://www.xuanyuancode.com/ai-llm/lessons/appendix-attention-paper
course: AI大模型原理免费教程
volume: 卷五 · 附录
lesson: 附2
---

# 附2 《Attention Is All You Need》原文

> [!abstract] 本课导读
> 按论文原文顺序逐段翻译，从摘要、架构、公式、实验表格到参考文献，完整读完 Transformer 的起点

本文来自「轩辕的编程宇宙」免费教程 [《AI 大模型原理》](https://www.xuanyuancode.com/ai-llm/lessons/appendix-attention-paper)，全文 30 课从向量讲到 Transformer。原站图文编排更精美，含交互实验，建议结合阅读。

## 《Attention Is All You Need》逐字译文

**论文题目：**Attention Is All You Need。中文直译为：注意力就是你所需要的一切。

**作者：**Ashish Vaswani、Noam Shazeer、Niki Parmar、Jakob Uszkoreit、Llion Jones、 Aidan N. Gomez、Lukasz Kaiser、Illia Polosukhin。作者分别来自 Google Brain、Google Research、 University of Toronto 等机构；论文发表于第 31 届神经信息处理系统会议（NIPS 2017），地点为美国加州长滩。

Transformer 论文第一作者，长期研究机器翻译、注意力机制与大模型系统。

多头注意力与 MoE 的关键提出者之一，也是 Character.AI 联合创始人。

Transformer 共同作者，曾参与 Adept 与 Essential AI 创立，专长于模型架构与训练。

Transformer 共同作者，后转向 AI for biology，持续推动“biological software”方向。

Transformer 共同作者，后续聚焦基础模型与自主系统研究。

Transformer 共同作者，Cohere 创始团队成员，长期专注企业级大模型与应用。

Transformer 共同作者，也是 Tensor2Tensor 等训练基础设施的重要推动者。

Transformer 共同作者，之后转向去中心化计算与 AI 基础设施。

## 摘要

占主导地位的序列转导模型，是以复杂的循环神经网络或卷积神经网络为基础的，并且包含一个编码器和一个解码器。 表现最好的模型还通过一种注意力机制把编码器和解码器连接起来。我们提出一种新的、简单的网络架构： Transformer。它完全基于注意力机制，彻底舍弃了循环和卷积。

在两个机器翻译任务上的实验表明，这些模型在质量上更优，同时更容易并行化，训练所需时间也显著更少。 在 WMT 2014 英语到德语翻译任务上，我们的模型达到 28.4 BLEU，比包括集成模型在内的既有最佳结果提高超过 2 个 BLEU。在 WMT 2014 英语到法语翻译任务上，我们的模型在 8 块 GPU 上训练 3.5 天后，建立了新的单模型 最先进 BLEU 分数 41.0，而这只需要文献中最佳模型训练成本的一小部分。

## 引言

循环神经网络，尤其是长短期记忆网络（LSTM）和门控循环神经网络（GRU），已经牢固地成为序列建模和序列转导问题中 最先进的方法，例如语言建模和机器翻译。此后，许多努力继续推动循环语言模型和编码器-解码器架构的边界。

循环模型通常沿着输入和输出序列中的符号位置来分解计算。把这些位置与计算时间中的步骤对齐后，它们会生成一串隐藏状态 h_t，其中每个 h_t 都是前一个隐藏状态 h_(t-1) 以及位置 t 的输入的函数。这种内在的顺序性质阻止了训练样本内部的并行化； 当序列长度变长时，这一点会变得非常关键，因为内存限制会限制跨样本的批处理。近期工作通过分解技巧和条件计算，在计算效率上 取得了显著改进；在后者中，模型性能也有所提升。然而，顺序计算这一根本约束仍然存在。

在各种任务中，注意力机制已经成为有吸引力的序列建模和转导模型的组成部分。它允许模型不考虑输入或输出序列中的距离， 就能建模依赖关系。不过，除少数情况外，这样的注意力机制都是与循环网络结合使用的。

在这项工作中，我们提出 Transformer：一种避开循环、完全依赖注意力机制来抽取输入和输出之间全局依赖关系的模型架构。 Transformer 允许显著更多的并行化，并且只需在 8 块 P100 GPU 上训练短短 12 小时，就能在翻译质量上达到新的最先进水平。

## 背景

减少顺序计算的目标，也是 Extended Neural GPU、ByteNet 和 ConvS2S 的基础。这些模型都使用卷积神经网络作为基本构件， 并为所有输入和输出位置并行计算隐藏表示。在这些模型中，把两个任意输入或输出位置的信号关联起来所需的操作数会随着位置之间的距离增长： 对 ConvS2S 来说是线性增长，对 ByteNet 来说是对数增长。这使得学习远距离位置之间的依赖关系更加困难。 在 Transformer 中，这被减少为常数数量的操作，代价是由于对注意力加权位置进行平均，有效分辨率会降低；我们用第 3.2 节所述的 多头注意力来抵消这种影响。

自注意力，有时也叫内部注意力，是一种把单个序列中不同位置彼此关联起来、从而计算该序列表示的注意力机制。 自注意力已经在多种任务中被成功使用，包括阅读理解、抽象式摘要、文本蕴含，以及学习与任务无关的句子表示。

端到端记忆网络基于一种循环注意力机制，而不是与序列对齐的循环；它们已被证明在简单语言问答和语言建模任务上表现良好。

然而，据我们所知，Transformer 是第一个完全依赖自注意力来计算其输入和输出表示、而不使用与序列对齐的 RNN 或卷积的转导模型。 在接下来的几节中，我们将描述 Transformer，说明采用自注意力的动机，并讨论它相对于一些模型的优势。

## 模型架构

大多数有竞争力的神经序列转导模型都有编码器-解码器结构。在这里，编码器把一个符号表示的输入序列 (x_1, ..., x_n) 映射成一个连续表示序列 z = (z_1, ..., z_n)。给定 z 后，解码器一次生成一个元素， 产生符号输出序列 (y_1, ..., y_m)。在每一步，模型都是自回归的：生成下一个符号时，会把此前已经生成的符号作为额外输入。

Transformer 遵循这种整体架构，并且在编码器和解码器中都使用堆叠的自注意力层和逐点全连接层。图 1 的左半部分和右半部分 分别展示了编码器和解码器。

> [!note]- 交互演示｜图 1Transformer 的模型架构。
> 此处原站是一个可操作的交互演示，请到 [原站](https://www.xuanyuancode.com/ai-llm/lessons/appendix-attention-paper) 体验。

**编码器：**编码器由 N = 6 个相同层堆叠而成。每一层有两个子层。第一个是多头自注意力机制； 第二个是一个简单的、逐位置全连接前馈网络。我们在两个子层外都使用残差连接，然后接层归一化。也就是说，每个子层的输出是：

$$
LayerNorm(x+Sublayer(x))
$$

其中 Sublayer(x) 是子层本身实现的函数。为了便于这些残差连接，模型中的所有子层以及嵌入层都产生维度为 d_model = 512 的输出。

**解码器：**解码器也由 N = 6 个相同层堆叠而成。除了每个编码器层中的两个子层之外，解码器还插入第三个子层， 它对编码器堆栈的输出执行多头注意力。与编码器类似，我们在每个子层外使用残差连接，然后接层归一化。我们还修改了解码器堆栈中的 自注意力子层，以防止位置关注到后续位置。这种掩码，再加上输出嵌入向后偏移一个位置，确保位置 i 的预测只能依赖位置小于 i 的已知输出。

## 注意力

一个注意力函数可以被描述为：把一个查询以及一组键-值对映射到一个输出，其中查询、键、值和输出都是向量。 输出被计算为值的加权和；分配给每个值的权重，则由查询与对应键的相容性函数计算出来。

我们把自己使用的这种特定注意力称为「缩放点积注意力」（Scaled Dot-Product Attention）。输入由维度为 d_k 的查询和键、 以及维度为 d_v 的值组成。我们计算查询与所有键的点积，把每个点积都除以 sqrt(d_k)，然后应用 softmax 函数来得到值上的权重。

> [!note]- 交互演示｜图 2左图为缩放点积注意力；右图为多头注意力，它由若干并行运行的注意力层组成。
> 此处原站是一个可操作的交互演示，请到 [原站](https://www.xuanyuancode.com/ai-llm/lessons/appendix-attention-paper) 体验。

在实践中，我们会同时在一组查询上计算注意力函数，并把这些查询打包成矩阵 Q。键和值也分别被打包成矩阵 K 和 V。 我们按下面的方式计算输出矩阵：

$$
Attention(Q,K,V)=softmax(\frac{QK^{T}}{\sqrt{d_{k}}})V
$$

两种最常用的注意力函数是加性注意力和点积（乘性）注意力。除了缩放因子 1 / sqrt(d_k) 之外，点积注意力与我们的算法相同。 加性注意力使用一个带单个隐藏层的前馈网络来计算相容性函数。两者在理论复杂度上相近，但点积注意力在实践中更快、也更节省空间， 因为它可以用高度优化的矩阵乘法代码实现。

当 d_k 较小时，两种机制表现相近；但在较大的 d_k 下，加性注意力优于没有缩放的点积注意力。我们怀疑，当 d_k 较大时， 点积的幅度会变大，把 softmax 函数推入梯度极小的区域。为了抵消这种影响，我们用 1 / sqrt(d_k) 对点积进行缩放。 为了说明点积为什么会变大，假设 q 和 k 的各个分量都是相互独立的随机变量，均值为 0、方差为 1。那么它们的点积 q · k = sum(q_i k_i) 的均值为 0，方差为 d_k。

## 多头注意力及其用法

与其用 d_model 维的键、值和查询执行单个注意力函数，我们发现更有益的做法是：用不同的、学习得到的线性投影， 把查询、键和值分别线性投影 h 次，投影到 d_k、d_k 和 d_v 维。然后，在这些被投影后的查询、键和值的每个版本上， 并行执行注意力函数，得到 d_v 维的输出值。随后把这些输出拼接起来，再投影一次，得到最终值。

多头注意力允许模型在不同位置上，共同关注来自不同表示子空间的信息。使用单个注意力头时，平均操作会抑制这一点。

$$
MultiHead(Q,K,V)=Concat(head_{1},\ldots ,head_{h})W^{O}
$$

$$
head_{i}=Attention(QW^{Q}_{i},KW^{K}_{i},VW^{V}_{i})
$$

$$
W^{Q}_{i}\in \mathbb{R}^{d_{model}\times d_{k}},\quad W^{K}_{i}\in \mathbb{R}^{d_{model}\times d_{k}},\quad W^{V}_{i}\in \mathbb{R}^{d_{model}\times d_{v}},\quad W^{O}\in \mathbb{R}^{hd_{v}\times d_{model}}
$$

在这项工作中，我们使用 h = 8 个并行注意力层，也就是 8 个头。对每一个头，我们使用 d_k = d_v = d_model / h = 64。由于每个头的维度降低了，所以总计算成本与使用完整维度的单头注意力相近。

Transformer 在三种不同方式中使用多头注意力：

- 在「编码器-解码器注意力」层中，查询来自前一个解码器层，记忆中的键和值来自编码器的输出。 这使得解码器中的每个位置都能关注输入序列中的所有位置。这模拟了序列到序列模型中典型的编码器-解码器注意力机制。
- 编码器包含自注意力层。在一个自注意力层中，所有键、值和查询都来自同一个地方；在这里，它们来自编码器中前一层的输出。 编码器中的每个位置都可以关注编码器前一层中的所有位置。
- 类似地，解码器中的自注意力层允许解码器的每个位置关注解码器中直到并包括该位置在内的所有位置。 为了保留自回归属性，我们需要阻止来自未来位置的信息流。我们在缩放点积注意力内部实现这一点： 把 softmax 输入中所有对应非法连接的值都遮蔽掉，也就是设为负无穷。

## 逐位置前馈网络、嵌入与位置编码

除了注意力子层外，编码器和解码器中的每一层都包含一个全连接前馈网络。它会被分别且相同地应用到每个位置上。 这个网络由两个线性变换组成，中间夹一个 ReLU 激活。

$$
FFN(x)=\mathrm{max}(0,xW_{1}+b_{1})W_{2}+b_{2}
$$

尽管这些线性变换在不同位置上是相同的，但不同层之间使用不同参数。另一种描述方式是：这是两个核大小为 1 的卷积。 输入和输出的维度是 d_model = 512，内层维度是 d_ff = 2048。

与其他序列转导模型类似，我们使用学习得到的嵌入，把输入 token 和输出 token 转换为 d_model 维向量。 我们也使用常规的、学习得到的线性变换和 softmax 函数，把解码器输出转换为预测下一个 token 的概率。 在我们的模型中，与相关工作类似，我们在两个嵌入层和 softmax 之前的线性变换之间共享同一个权重矩阵。 在嵌入层中，我们把这些权重乘以 sqrt(d_model)。

由于我们的模型不包含循环，也不包含卷积，为了让模型利用序列顺序，我们必须向序列中 token 的相对位置或绝对位置注入某些信息。 为此，我们在编码器和解码器堆栈底部，把「位置编码」加到输入嵌入上。位置编码与嵌入具有相同的维度 d_model， 因而两者可以相加。位置编码有很多选择，包括学习得到的和固定的。

在这项工作中，我们使用不同频率的正弦和余弦函数：

$$
PE_{(pos,2i)}=\mathrm{sin}(pos/10000^{2i/d_{model}})
$$

$$
PE_{(pos,2i+1)}=\mathrm{cos}(pos/10000^{2i/d_{model}})
$$

其中 pos 是位置，i 是维度。也就是说，位置编码的每个维度都对应一个正弦曲线。波长形成一个从 2π 到 10000 · 2π 的几何级数。我们选择这个函数，是因为我们假设它能让模型容易地学会按相对位置进行关注： 对任意固定偏移 k，PE_(pos+k) 都可以表示为 PE_pos 的线性函数。

我们也实验了用学习得到的位置嵌入替代它，并发现两个版本产生的结果几乎相同。我们选择正弦版本，是因为它也许能让模型外推到 比训练期间遇到的序列更长的序列长度。

## 为什么使用自注意力

在这一节中，我们把自注意力层与常用于把一个可变长度的符号表示序列 (x_1, ..., x_n) 映射到另一个等长序列 (z_1, ..., z_n) 的循环层和卷积层进行比较，其中 x_i、z_i 都属于 R^d；典型序列转导编码器或解码器中的隐藏层就是这种情况。 为了说明我们使用自注意力的动机，我们考虑三个需求。

第一个需求是每层的总计算复杂度。第二个需求是可以被并行化的计算量，这用所需的最少顺序操作数来衡量。 第三个需求是网络中长程依赖之间的路径长度。学习长程依赖是许多序列转导任务中的关键挑战。 影响学习这类依赖能力的一个关键因素，是前向信号和反向信号在网络中必须穿过的路径长度。 在输入和输出序列中任意位置组合之间，这些路径越短，学习长程依赖就越容易。因此，我们也比较由不同层类型组成的网络中， 任意两个输入和输出位置之间的最大路径长度。

表 1：不同层类型的最大路径长度、每层复杂度和最少顺序操作数。n 是序列长度，d 是表示维度，k 是卷积核大小，r 是受限自注意力中的邻域大小。层类型每层复杂度顺序操作数最大路径长度自注意力O(n^2 · d)O(1)O(1)循环O(n · d^2)O(n)O(n)卷积O(k · n · d^2)O(1)O(log_k(n))受限自注意力O(r · n · d)O(1)O(n / r)

如表 1 所示，一个自注意力层用常数数量的顺序执行操作就能连接所有位置，而一个循环层需要 O(n) 个顺序操作。 在计算复杂度方面，当序列长度 n 小于表示维度 d 时，自注意力层比循环层更快；在最先进机器翻译模型所使用的句子表示中， 例如 word-piece 和 byte-pair 表示，这通常正是实际情况。为了提升涉及很长序列的任务中的计算性能， 可以把自注意力限制为只考虑围绕相应输出位置、大小为 r 的邻域。这会把最大路径长度增加到 O(n / r)。 我们计划在未来工作中进一步研究这种方法。

一个核宽为 k 且 k 小于 n 的卷积层，并不会连接所有输入和输出位置对。要做到这一点，在连续卷积核的情况下需要堆叠 O(n / k) 个卷积层；在膨胀卷积的情况下则需要 O(log_k(n)) 个卷积层。这会增加网络中任意两个位置之间最长路径的长度。 卷积层通常比循环层更昂贵，代价多一个 k 因子。不过，可分离卷积能显著降低复杂度，降至 O(k · n · d + n · d^2)。 然而，即使 k = n，可分离卷积的复杂度也等于一个自注意力层和一个逐点前馈层的组合，而这正是我们模型采用的方法。

作为一个额外好处，自注意力可以产生更具可解释性的模型。我们检查了模型中的注意力分布，并在附录中展示和讨论了一些例子。 不仅单个注意力头会清楚地学会执行不同任务，许多注意力头似乎还表现出与句子的句法结构和语义结构相关的行为。

## 训练

这一节描述我们模型的训练方案。

**训练数据与批处理。**我们在标准的 WMT 2014 英语-德语数据集上训练，该数据集约包含 450 万个句子对。 句子用字节对编码（BPE）进行编码，源语言和目标语言共享一个约 37000 个 token 的词表。对于英语-法语， 我们使用大得多的 WMT 2014 英语-法语数据集，其中包含 3600 万个句子，并把 token 切分为 32000 个 word-piece 词表。 句子对按近似序列长度组合成批。每个训练批次包含一组句子对，其中大约有 25000 个源 token 和 25000 个目标 token。

**硬件与日程。**我们在一台带 8 块 NVIDIA P100 GPU 的机器上训练模型。对使用论文中所述超参数的 base 模型， 每个训练步骤大约需要 0.4 秒。我们总共训练 base 模型 100000 步，约 12 小时。对于 big 模型，也就是表 3 最后一行描述的模型， 每步用时 1.0 秒。big 模型训练 300000 步，约 3.5 天。

**优化器。**我们使用 Adam 优化器，其中 beta_1 = 0.9，beta_2 = 0.98，epsilon = 10^-9。 在整个训练过程中，我们按照下面的公式改变学习率：

$$
lrate=d^{-0.5}_{model}\cdot \mathrm{min}(step\_ num^{-0.5},step\_ num\cdot warmup\_ steps^{-1.5})
$$

这对应于在最初 warmup_steps 个训练步骤中线性增加学习率，随后按步骤数的平方根倒数成比例降低学习率。 我们使用 warmup_steps = 4000。

**正则化。**训练期间我们使用正则化。残差 dropout：我们把 dropout 应用于每个子层的输出， 位置在它被加到子层输入并归一化之前。此外，我们还在编码器和解码器堆栈中，对嵌入与位置编码相加后的结果应用 dropout。 对 base 模型，我们使用 P_drop = 0.1。

标签平滑：训练期间，我们使用数值为 epsilon_ls = 0.1 的标签平滑。由于模型学会变得更不确定，这会损害困惑度； 但它会提升准确率和 BLEU 分数。

## 结果

在 WMT 2014 英语到德语翻译任务上，big Transformer 模型（表 2 中的 Transformer (big)）比此前报告的最佳模型 （包括集成模型）高出超过 2.0 BLEU，建立了新的最先进 BLEU 分数 28.4。这个模型的配置列在表 3 的最后一行。 在 8 块 P100 GPU 上训练耗时 3.5 天。即便是我们的 base 模型，也以任何有竞争力模型训练成本的一小部分， 超过了所有此前发表的模型和集成模型。

在 WMT 2014 英语到法语翻译任务上，我们的 big 模型达到 41.0 BLEU，超过了此前发表的所有单模型， 而训练成本低于先前最先进模型的四分之一。用于英语到法语的 Transformer (big) 模型使用 dropout 率 P_drop = 0.1，而不是 0.3。

对 base 模型，我们使用一个由最后 5 个检查点平均得到的单模型，这些检查点每隔 10 分钟写入一次。对 big 模型， 我们平均最后 20 个检查点。我们使用 beam size 为 4、长度惩罚 alpha = 0.6 的 beam search。 这些超参数是在开发集上实验后选择的。推理期间，我们把最大输出长度设为输入长度 + 50，但会在可能时提前终止。

表 2 汇总了我们的结果，并把我们的翻译质量和训练成本与文献中的其他模型架构进行比较。我们通过把训练时间、使用的 GPU 数量、 以及每块 GPU 可持续单精度浮点能力的估计值相乘，来估计训练一个模型所使用的浮点运算次数。

表 2：Transformer 在 English-to-German 和 English-to-French 的 newstest2014 测试上，以训练成本的一小部分取得了优于此前最先进模型的 BLEU 分数。模型EN-DE BLEUEN-FR BLEUEN-DE 训练成本EN-FR 训练成本ByteNet23.75Deep-Att + PosUnk39.21.0 · 10^20GNMT + RL24.639.922.3 · 10^191.4 · 10^20ConvS2S25.1640.469.6 · 10^181.5 · 10^20MoE26.0340.562.0 · 10^191.2 · 10^20Deep-Att + PosUnk Ensemble40.48.0 · 10^20GNMT + RL Ensemble26.3041.161.8 · 10^201.1 · 10^21ConvS2S Ensemble26.3641.297.7 · 10^191.2 · 10^21Transformer (base model)27.338.13.3 · 10^18Transformer (big)28.441.02.3 · 10^19

**模型变体。**为了评估 Transformer 不同组件的重要性，我们以不同方式改变 base 模型， 并在英语到德语翻译开发集 newstest2013 上测量性能变化。我们使用上一节所述的 beam search，但不做检查点平均。 这些结果展示在表 3 中。

表 3：Transformer 架构的变体。未列出的值与 base 模型相同。所有指标都在 English-to-German 翻译开发集 newstest2013 上；困惑度是按 BPE 后的 wordpiece 计算的，不应与按词计算的困惑度比较。变体主要设置或改动PPL(dev)BLEU(dev)参数(百万)baseN=6, d_model=512, d_ff=2048, h=8, d_k=d_v=64, P_drop=0.1, epsilon_ls=0.1, 100K steps4.9225.865Ah=1, d_k=d_v=5125.2924.9Ah=4, d_k=d_v=1285.0025.5Ah=16, d_k=d_v=324.9125.8Ah=32, d_k=d_v=165.0125.4Bd_k=165.1625.158Bd_k=325.0125.460CN=26.1123.736CN=45.1925.350CN=84.8825.580Cd_model=256, d_k=d_v=325.7524.528Cd_model=1024, d_k=d_v=1284.6626.0168Cd_ff=10245.1225.453Cd_ff=40964.7526.290DP_drop=0.05.7724.6DP_drop=0.24.9525.5Depsilon_ls=0.04.6725.3Depsilon_ls=0.25.4725.7E用位置嵌入替代正弦函数4.9225.7bigN=6, d_model=1024, d_ff=4096, h=16, P_drop=0.3, 300K steps4.3326.4213

在表 3 的 (A) 行中，我们改变注意力头的数量以及注意力键和值的维度，同时像第 3.2.2 节所述那样保持计算量不变。 虽然单头注意力比最佳设置差 0.9 BLEU，但头数过多时质量也会下降。

在表 3 的 (B) 行中，我们观察到，降低注意力键大小 d_k 会损害模型质量。这表明确定相容性并不容易， 比点积更复杂的相容性函数可能会有益。我们还在 (C) 和 (D) 行中观察到，正如预期，更大的模型更好， dropout 对避免过拟合非常有帮助。在 (E) 行中，我们用学习得到的位置嵌入替换正弦位置编码，并观察到结果与 base 模型几乎相同。

## 结论

在这项工作中，我们提出了 Transformer：第一个完全基于注意力的序列转导模型。它用多头自注意力替换了编码器-解码器架构中 最常用的循环层。

对翻译任务而言，Transformer 的训练速度可以显著快于基于循环层或卷积层的架构。在 WMT 2014 英语到德语和 WMT 2014 英语到法语两个翻译任务上，我们都达到新的最先进水平。在前一个任务中，我们最好的模型甚至超过了所有此前报告过的集成模型。

我们对基于注意力的模型的未来感到兴奋，并计划把它们应用到其他任务上。我们计划把 Transformer 扩展到涉及文本之外输入和输出模态的问题， 并研究局部的、受限的注意力机制，以高效处理图像、音频和视频等大型输入和输出。让生成过程更少依赖顺序性，也是我们的另一个研究目标。

我们用于训练和评估模型的代码可在 https://github.com/tensorflow/tensor2tensor 获得。

**致谢：**我们感谢 Nal Kalchbrenner 和 Stephan Gouws 富有成效的评论、修正和启发。

## 参考文献

1. Jimmy Lei Ba、Jamie Ryan Kiros、Geoffrey E. Hinton. Layer normalization. arXiv:1607.06450, 2016.
2. Dzmitry Bahdanau、Kyunghyun Cho、Yoshua Bengio. Neural machine translation by jointly learning to align and translate. CoRR, abs/1409.0473, 2014.
3. Denny Britz、Anna Goldie、Minh-Thang Luong、Quoc V. Le. Massive exploration of neural machine translation architectures. CoRR, abs/1703.03906, 2017.
4. Jianpeng Cheng、Li Dong、Mirella Lapata. Long short-term memory-networks for machine reading. arXiv:1601.06733, 2016.
5. Kyunghyun Cho、Bart van Merrienboer、Caglar Gulcehre、Fethi Bougares、Holger Schwenk、Yoshua Bengio. Learning phrase representations using RNN encoder-decoder for statistical machine translation. CoRR, abs/1406.1078, 2014.
6. Francois Chollet. Xception: Deep learning with depthwise separable convolutions. arXiv:1610.02357, 2016.
7. Junyoung Chung、Caglar Gulcehre、Kyunghyun Cho、Yoshua Bengio. Empirical evaluation of gated recurrent neural networks on sequence modeling. CoRR, abs/1412.3555, 2014.
8. Jonas Gehring、Michael Auli、David Grangier、Denis Yarats、Yann N. Dauphin. Convolutional sequence to sequence learning. arXiv:1705.03122v2, 2017.
9. Alex Graves. Generating sequences with recurrent neural networks. arXiv:1308.0850, 2013.
10. Kaiming He、Xiangyu Zhang、Shaoqing Ren、Jian Sun. Deep residual learning for image recognition. Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition, 770-778, 2016.
11. Sepp Hochreiter、Yoshua Bengio、Paolo Frasconi、Jurgen Schmidhuber. Gradient flow in recurrent nets: the difficulty of learning long-term dependencies, 2001.
12. Sepp Hochreiter、Jurgen Schmidhuber. Long short-term memory. Neural Computation, 9(8):1735-1780, 1997.
13. Rafal Jozefowicz、Oriol Vinyals、Mike Schuster、Noam Shazeer、Yonghui Wu. Exploring the limits of language modeling. arXiv:1602.02410, 2016.
14. Lukasz Kaiser、Ilya Sutskever. Neural GPUs learn algorithms. International Conference on Learning Representations, 2016.
15. Nal Kalchbrenner、Lasse Espeholt、Karen Simonyan、Aaron van den Oord、Alex Graves、Koray Kavukcuoglu. Neural machine translation in linear time. arXiv:1610.10099v2, 2017.
16. Yoon Kim、Carl Denton、Luong Hoang、Alexander M. Rush. Structured attention networks. International Conference on Learning Representations, 2017.
17. Diederik Kingma、Jimmy Ba. Adam: A method for stochastic optimization. ICLR, 2015.
18. Oleksii Kuchaiev、Boris Ginsburg. Factorization tricks for LSTM networks. arXiv:1703.10722, 2017.
19. Zhouhan Lin、Minwei Feng、Cicero Nogueira dos Santos、Mo Yu、Bing Xiang、Bowen Zhou、Yoshua Bengio. A structured self-attentive sentence embedding. arXiv:1703.03130, 2017.
20. Samy Bengio、Lukasz Kaiser. Can active memory replace attention? Advances in Neural Information Processing Systems, 2016.
21. Minh-Thang Luong、Hieu Pham、Christopher D. Manning. Effective approaches to attention-based neural machine translation. arXiv:1508.04025, 2015.
22. Ankur Parikh、Oscar Tackstrom、Dipanjan Das、Jakob Uszkoreit. A decomposable attention model. Empirical Methods in Natural Language Processing, 2016.
23. Romain Paulus、Caiming Xiong、Richard Socher. A deep reinforced model for abstractive summarization. arXiv:1705.04304, 2017.
24. Ofir Press、Lior Wolf. Using the output embedding to improve language models. arXiv:1608.05859, 2016.
25. Rico Sennrich、Barry Haddow、Alexandra Birch. Neural machine translation of rare words with subword units. arXiv:1508.07909, 2015.
26. Noam Shazeer、Azalia Mirhoseini、Krzysztof Maziarz、Andy Davis、Quoc Le、Geoffrey Hinton、Jeff Dean. Outrageously large neural networks: The sparsely-gated mixture-of-experts layer. arXiv:1701.06538, 2017.
27. Nitish Srivastava、Geoffrey E. Hinton、Alex Krizhevsky、Ilya Sutskever、Ruslan Salakhutdinov. Dropout: a simple way to prevent neural networks from overfitting. Journal of Machine Learning Research, 15(1):1929-1958, 2014.
28. Sainbayar Sukhbaatar、Arthur Szlam、Jason Weston、Rob Fergus. End-to-end memory networks. Advances in Neural Information Processing Systems 28, 2440-2448, 2015.
29. Ilya Sutskever、Oriol Vinyals、Quoc V. Le. Sequence to sequence learning with neural networks. Advances in Neural Information Processing Systems, 3104-3112, 2014.
30. Christian Szegedy、Vincent Vanhoucke、Sergey Ioffe、Jonathon Shlens、Zbigniew Wojna. Rethinking the inception architecture for computer vision. CoRR, abs/1512.00567, 2015.
31. Yonghui Wu、Mike Schuster、Zhifeng Chen、Quoc V. Le、Mohammad Norouzi、Wolfgang Macherey、Maxim Krikun、Yuan Cao、Qin Gao、Klaus Macherey 等. Google's neural machine translation system: Bridging the gap between human and machine translation. arXiv:1609.08144, 2016.
32. Jie Zhou、Ying Cao、Xuguang Wang、Peng Li、Wei Xu. Deep recurrent models with fast-forward connections for neural machine translation. CoRR, abs/1606.04199, 2016.

## 相关笔记

- 所属卷：[[卷五-附录/卷五导读|卷五 · 附录]]
- 上一课：[[卷五-附录/附1-Transformer全景图|附1 Transformer全景图]]
- 课程总览：[[00-总索引]]
