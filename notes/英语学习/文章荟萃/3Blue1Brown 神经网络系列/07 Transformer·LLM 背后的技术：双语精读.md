---
tags:
  - english
  - 英语学习/外刊精读
  - 大模型/学习资源
created: 2026-11-07
source: https://www.3blue1brown.com/lessons/gpt
status: 精读
---

# 《Transformers, the tech behind LLMs ｜ Deep Learning Chapter 5》（Transformer·LLM 背后的技术）：双语精读

> [!abstract] 文章信息
> - **标题**：Transformers, the tech behind LLMs ｜ Deep Learning Chapter 5（Transformer·LLM 背后的技术｜深度学习第 5 章）
> - **作者**：Lesson by Grant Sanderson（3Blue1Brown）
> - **出处**：官网课页 <https://www.3blue1brown.com/lessons/gpt> · YouTube <https://youtu.be/wjZofJX0v4M> · 2024-04-01 发布
> - **背景**：3Blue1Brown 神经网络与深度学习系列的第 5 章，用标志性的可视化把 GPT 背后的 Transformer（变换器）拆开来看：从词元与嵌入讲起，先给整个网络画一张宏观草图，再为下一章的注意力机制备齐矩阵、点积与 softmax 这些地基。
> - **说明**：左栏原文、右栏译文逐段对照；各节之间附词汇注释，文末有总词汇表。文中的互动 demo 需到[官网原文页](https://www.3blue1brown.com/lessons/gpt)体验。本篇是「3Blue1Brown 神经网络系列」笔记，总览见 [[大模型/07-教程与课程/3Blue1Brown-神经网络与深度学习系列]]。

## GPT 是什么模型？（What is a GPT model?）

| 原文 | 译文 |
|---|---|
| Formally speaking, a GPT is a **Generative Pre-Trained Transformer**. The first two words are self-explanatory: **generative** means the model generates new text; **pre-trained** means the model was trained on large amounts of data. What we will focus on is the **transformer** aspect of the language model, the main proponent of the recent boom in AI. | 严格来说，GPT 指的是**生成式预训练变换器（Generative Pre-Trained Transformer）**。前两个词不言自明：**generative（生成式）**，意思是模型会生成新文本；**pre-trained（预训练）**，意思是模型在海量数据上完成了训练。我们要聚焦的，是这种语言模型中 **transformer（变换器）** 的那一面——正是它，充当了这轮 AI 浪潮的主要推手。 |

> [!note]- 词汇注释 · GPT 是什么模型
> - **self-explanatory** /ˌself ɪkˈsplænətəri/ —— 不言自明的、一眼即懂的。self-（自身）+ explanatory（作解释的）。
> - **generative** /ˈdʒenərətɪv/ —— 生成式的。动词 generate（生成）+ -ive，NLP 高频词。
> - **pre-trained** /ˌpriː ˈtreɪnd/ —— 预训练的。pre-（预先）+ trained，与 fine-tuned（微调的）相对。
> - **proponent** /prəˈpəʊnənt/ —— 倡导者、推手。与 opponent（反对者）正好相对。
> - *the recent boom in AI* —— 近来的 AI 热潮。boom＝激增、繁荣，常见于科技新闻。

## Transformer 究竟是什么？（What exactly is a Transformer?）

| 原文 | 译文 |
|---|---|
| A **transformer** is a special kind of neural network, a _Machine Learning Model_. There are a wide variety of models that can be built using **transformers**: voice-to-text, text-to-voice, text-to-image, machine translation, and many more. The specific variant that we will focus on, which is the type that underlies tools like ChatGPT, will be a model trained to take in a piece of text, maybe even with some surrounding images or sound accompanying it, then produce a prediction of what comes next, in the form of a probability distribution over all chunks of text that might follow. | **Transformer** 是一种特殊的神经网络——而神经网络是一种机器学习模型（Machine Learning Model）。用 **transformer** 能搭出五花八门的模型：语音转文字、文字转语音、文字生成图像、机器翻译，等等。我们要关注的是其中一个特定变体，也就是 ChatGPT 这类工具底层的那个类型：它是一个被训练来读入一段文本的模型——甚至可能附带一些周边的图像或声音——然后对接下来会出现什么做出预测，预测的形式是一个概率分布，铺在所有可能紧随其后的文本块之上。 |
| At first, predicting the next word might feel like a different goal from generating new text. But once you have a prediction model like this, one simple way to make this generate a longer piece is to give it an initial bit of text to work with, have it predict the next word, take a random sample from the distribution it just generated, then run it all again to make a new prediction based on all the text, including what it just added. This process of repeated prediction and sampling is essentially what's happening when you interact with ChatGPT and see it producing one word at a time. | 乍一看，"预测下一个词"似乎和"生成新文本"是两回事。但只要你手上有了这样一个预测模型，让它生成一段更长文字的最简单办法就是：先给它一小段初始文本打底，让它预测下一个词，从它刚生成的分布里随机抽一个样本，然后一切重来——基于全部文本（包括它刚补上的那个词）再做一次新预测。这种反复"预测 + 抽样"的过程，本质上就是你和 ChatGPT 交互、看着它一个词一个词往外蹦时发生的事情。 |
| We'll first preview the transformer with a high-level perspective. We'll spend much more time motivating, interpreting, and expanding on the details of each step, but in broad strokes, when one of these chatbots is generating text, here's what's going on under the hood. | 我们先从宏观视角预览一遍 transformer。后面我们会花多得多的时间来铺垫动机、解读并展开每一步的细节；但粗线条地说，这类聊天机器人生成文本时，引擎盖底下发生的就是下面这些事。 |

> [!note]- 词汇注释 · Transformer 究竟是什么
> - **variant** /ˈveəriənt/ —— 变体、变种。the specific variant 这个特定变体。
> - **underlie** /ˌʌndəˈlaɪ/ —— 构成……的底层基础。underlies tools like ChatGPT＝是这类工具的底层。
> - **accompany** /əˈkʌmpəni/ —— 伴随、随附。images or sound accompanying it。
> - **take a random sample** —— 随机抽取一个样本。生成式模型"抽样"的关键说法。
> - **probability distribution** —— 概率分布。本文反复出现的核心术语。
> - **in broad strokes** —— 粗线条地、大而化之。反义是 in detail（细致地）。
> - **under the hood** —— 引擎盖之下＝表象之下、内部机制。技术写作高频隐喻。

## 词元（Tokens）

| 原文 | 译文 |
|---|---|
| An input is first broken into small chunks that are known as **tokens**. For example, in the sentence: | 输入首先会被切成小块，这些小块被称为**词元（token）**。比如下面这句话： |
| **To date, the cleverest thinker of all time was ...** | **To date, the cleverest thinker of all time was ...** |
| The tokenization of this input would be: | 这个输入的分词（tokenization）结果会是： |
| **To｜ date｜,｜ the｜ cle｜ve｜rest｜ thinker｜ of｜ all｜ time｜ was ...** | **To｜ date｜,｜ the｜ cle｜ve｜rest｜ thinker｜ of｜ all｜ time｜ was ...** |
| Each of these tokens is then associated with a vector, meaning some list of numbers. A common interpretation of these embeddings is that the coordinates of these vectors may somehow encode the meaning of each token. If you think of these vectors as giving coordinates in some high-dimensional space, words with similar meanings tend to land on vectors close to each other in that space. These steps are pre-processing steps that occur before anything enters the transformer itself. | 随后，每个词元都会关联上一个向量（vector），也就是某一串数字。对这些嵌入（embedding）的一种常见解读是：这些向量的坐标以某种方式编码了每个词元的含义。如果你把这些向量看成某个高维空间里的坐标，那么意思相近的词，往往会落在那个空间里彼此相近的向量上。这些步骤都是预处理步骤，发生在任何东西进入 transformer 本体之前。 |

> [!note]- 词汇注释 · 词元
> - **chunk** /tʃʌŋk/ —— 块、厚厚一块。chunks of text 文本块。
> - **token** /ˈtəʊkən/ —— 词元。LLM 处理文本的最小单位。
> - **tokenization** /ˌtəʊkənaɪˈzeɪʃn/ —— 分词、词元化。动词是 tokenize。
> - **embedding** /ɪmˈbedɪŋ/ —— 嵌入。把离散对象映射成向量的做法。
> - **vector** /ˈvektə(r)/ —— 向量。文中解释为 a list of numbers。
> - **high-dimensional** —— 高维的。dimension /daɪˈmenʃn/ 维度。
> - **pre-processing** /ˌpriː ˈprəʊsesɪŋ/ —— 预处理。发生在主流程之前的加工步骤。
> - 说明：表格里的分词演示行两个版本相同——作者用竖线展示同一句话"按词切"与"按碎片切"的结果，故译文列原样保留英文串。

## 注意力块（Attention Block）

| 原文 | 译文 |
|---|---|
| The encoded vectors then pass through an **Attention Block** where they communicate with each other to update their values based on context. For example, the meaning of the word _model_ in the phrase _a machine learning model_ is different from its meaning in the phrase _a fashion model_. The **Attention Block** is responsible for figuring out which words in the context are relevant to updating the meanings of other words and how exactly those meanings should be updated. | 编码后的向量接着会穿过一个**注意力块（Attention Block）**，在这里它们互相通信，依据上下文更新各自的取值。比如，_model_ 这个词在 _a machine learning model_（机器学习模型）里的意思，就和它在 _a fashion model_（时装模特）里的意思不一样。**注意力块**的职责，就是搞清楚上下文里哪些词与更新其他词的含义相关，以及这些含义究竟该如何更新。 |

> [!note]- 词汇注释 · 注意力块
> - **attention** /əˈtenʃn/ —— 注意力。Attention Block 注意力块，Transformer 的灵魂部件。
> - **context** /ˈkɒntekst/ —— 上下文、语境。
> - **be responsible for ...** —— 负责……、承担……的职责。
> - **relevant** /ˈreləvənt/ —— 相关的。反义 irrelevant。
> - *communicate with each other* —— 互相通信、彼此交流。原文用拟人手法描述向量交互。

## 多层感知机·前馈层（Multilayer Perceptron(Feed-Forward Layer)）

| 原文 | 译文 |
|---|---|
| Following the Attention Block, these vectors then pass through a Multilayer Perceptron, or Feed-Forward Layer. Here, the vectors don't talk to each other; they all go through the same operation in parallel. We'll talk later about how this step is a bit like asking a long list of questions about each vector and updating them based on the answers. | 注意力块之后，这些向量接着穿过一个多层感知机（Multilayer Perceptron），也叫前馈层（Feed-Forward Layer）。在这里，向量们互不打招呼，而是并排走完同一个运算。这一步有点像对每个向量抛出一长串问题、再根据答案更新它们——具体我们后面细说。 |
| After that, the vectors pass through another attention block, then another multilayer perceptron block, then another attention block, and so on, getting altered by many variants of these two operations interlaced with one another. A large number of layers like this is what puts the "deep" in deep learning. Computationally, all the operations in both blocks will look like a giant pile of matrix multiplications, and our goal will be to understand how to read the underlying matrices. | 再往后，向量穿过又一个注意力块、又一个多层感知机块、再一个注意力块，如此往复，被这两种运算的许多变体交替打磨。正是这种大量堆叠的层，给了"深度学习"里的"深度"二字。从计算角度看，这两个块里的所有运算看上去都是一大堆矩阵乘法，而我们的目标，就是学会读懂底下的那些矩阵。 |
| After many iterations, all the information necessary to predict the next word needs to be encoded into the last vector of the sequence, which will go through one final computation to produce a probability distribution over all the possible chunks of text that might come next. | 经过许多轮迭代之后，预测下一个词所需的全部信息，都要编码进序列的最后一个向量；它再经过最后一次计算，产生一个覆盖所有可能"下一块文本"的概率分布。 |
| A common interpretation is that the coordinates of these vectors may somehow encode the meaning of each token. If you think of these vectors as giving coordinates in some high-dimensional space, words with similar meanings tend to land on vectors close to each other in that space. | 一种常见的解读是：这些向量的坐标以某种方式编码了每个词元的含义。如果你把这些向量看成某个高维空间里的坐标，那么意思相近的词，往往会落在那个空间里彼此相近的向量上。 |
| With that as a high-level preview, in this lesson we will expand on the details of what happens both at the beginning and the end of the network. But first, it may help to review some of the background knowledge that would have been second nature to any machine learning engineer by the time transformers came around. | 有了这张宏观草图，本课接下来会展开讲网络开头与结尾两处的细节。但在此之前，先回顾一点背景知识可能有帮助——等到 transformer 问世时，这些知识对任何机器学习工程师来说都早已是家常便饭。 |

> [!note]- 词汇注释 · 多层感知机·前馈层
> - **perceptron** /pəˈseptrɒn/ —— 感知机。最早的神经网络基本单元之一。
> - **feed-forward** /ˈfiːd ˌfɔːwəd/ —— 前馈的。信息单向流动、不回头。
> - **in parallel** —— 并行地、同时进行。
> - **interlace with ...** —— 与……交织、穿插。inter-（相互）+ lace（编织）。
> - **matrix multiplication** —— 矩阵乘法。matrix /ˈmeɪtrɪks/，复数 matrices。
> - **iteration** /ˌɪtəˈreɪʃn/ —— 迭代、一轮重复。
> - *puts the "deep" in deep learning* —— 点睛句式：put the X in Y＝正是它赋予了 Y 中"X"的含义。

## 深度学习的前提（Premise of Deep Learning）

| 原文 | 译文 |
|---|---|
| Machine learning, broadly speaking, describes a body of methods where one uses _data_ to determine the behavior of a program, as opposed to relying entirely on an explicitly encoded set of rules. For example, to write a function that takes in an image and produces a label, rather than explicitly defining a procedure for doing this in code, a machine learning model will consist of flexible parameters that determine its behavior, like a bunch of knobs and dials. The job of the engineer is not to set those dials, but to determine a procedure to tune those parameters based on data. For example, an image-labeling program may be trained using a large set of images with known labels. | 大体上说，机器学习描述的是这样一类方法：用_数据_来决定程序的行为，而不是完全依赖一套显式写死的规则。比如要写一个读入图像、输出标签的函数，机器学习模型并不会在代码里显式定义一套流程，而是由一堆灵活的参数决定其行为，就像一排旋钮和刻度盘。工程师的工作不是亲手去拨这些刻度盘，而是设计一套依据数据来调节这些参数的流程。比如，一个图像打标程序可以用一大批带已知标签的图像来训练。 |
| For example, the simplest form of machine learning might be linear regression, where inputs and outputs are single numbers, such as the square footage of a house and its price. A linear regression finds the line of best fit through the data to predict future house prices. This line is determined by two parameters: the slope and the y-intercept, which are tuned to most closely match the data. Then for future houses, with unknown prices, the predicted price would be determined based on the value of this line over the given square footage. | 举个最简单的例子：机器学习最朴素的形态可能就是线性回归（linear regression）——输入和输出都是单个数字，比如房子的面积和它的价格。线性回归会找出一条穿过数据的最优拟合直线，用来预测未来的房价。这条直线由两个参数决定：斜率和 y 轴截距，两者经过调校以尽可能贴合数据。之后遇到价格未知的新房子，预测价就由这条直线在给定面积上的取值来确定。 |
| Deep learning is a subfield of Machine Learning, focused on a specific category of models known as Neural Networks. Needless to say, these can get dramatically more complicated than the simple linear regression example. GPT-3, for example, had an astounding 175 billion parameters. However, simply giving a model a huge number of parameters does not guarantee that it will perform better. Models at such scales risk being either completely intractable to train, prone to overfitting, or both. | 深度学习是机器学习的一个子领域，专注于被称为神经网络（Neural Networks）的一类特定模型。不用说，这些模型可以比简单的线性回归复杂得多。比如 GPT-3 就有多达 1750 亿个参数，规模惊人。然而，单纯往模型里塞海量参数，并不能保证它表现更好。这种尺度的模型，很可能要么训练起来完全无从下手，要么动不动就过拟合（overfitting），要么两者兼备。 |
| Some deep learning models have shown a remarkable increase in capability as they size of the model and data it's trained on scale to enormous sizes. They are trained using an algorithm called backpropagation, but in order for this algorithm to work well at scale, these models have to adhere to a specific format. Understanding this format will help explain many of the choices in how transformers process language—choices that might otherwise seem arbitrary. | 一些深度学习模型展现出一种了不起的特性：随着模型本身和训练数据的规模膨胀到巨大，能力也显著水涨船高。它们用一种叫反向传播（backpropagation）的算法来训练；但要让这个算法在大规模下运转良好，这些模型必须遵守一种特定的格式。理解这种格式，就能解释 transformer 处理语言的许多设计选择——否则那些选择看上去会显得相当任意。 |
| **First**, the input to the model has to be formatted as an array of real numbers. This could simply mean a list of numbers, a 2D array, or often higher-dimensional arrays, where the general term used here is _tensor_. The input data is progressively transformed into many different layers, always structured like some array of numbers, until it reaches the final layer as the output. For example, the final layer in our next-token-prediction model is the probability distribution over all possible next tokens. | **第一**，输入模型的数据必须格式化成实数组成的数组。它可以简单到是一列数、一个二维数组，也常常是更高维的数组——这里的通用术语叫_张量（tensor）_。输入数据在许多不同的层里被逐步变换，始终保持某种数字数组的结构，直到抵达作为输出的最后一层。比如，在我们这个"预测下一个词元"的模型里，最后一层就是覆盖所有可能下一词元的概率分布。 |
| In deep learning, the model parameters are almost always referred to as **weights**, because for the most part, the only way they interact with the data being processed is through weighted sums. | 在深度学习里，模型参数几乎总是被称为**权重（weights）**，因为大多数时候，它们与被处理数据发生互动的唯一方式，就是加权和（weighted sums）。 |
| Typically, you will find the weights packaged together in matrices, and instead of seeing weighted sums written out explicitly in the mathematics of such a model, you only see matrix-vector products. It represents the same idea, since each component in the output of a matrix-vector product looks like a weighted sum, it's just often conceptually cleaner to think about matrices filled with tunable parameters transforming vectors drawn from the data being processed. | 通常你会发现，权重被打包成矩阵；于是在这类模型的数学式子里，你看到的不是显式写出的加权和，而是矩阵-向量乘积。两者表达的是同一个意思——矩阵-向量乘积输出里的每个分量看上去都是一个加权和——只不过，用"装满可调参数的矩阵去变换来自数据的向量"来思考，在概念上往往更清爽。 |
| To prevent the entire model from being linear, there will typically also be some nonlinear functions sprinkled in between these matrix-vector products, such as the softmax operation we will see at the end of this article. | 为了防止整个模型退化成纯线性运算，这些矩阵-向量乘积之间通常还会撒上一些非线性函数，比如本文末尾会看到的 softmax 运算。 |
| For example, the **175 billion weights** in GPT-3 are organized into just under 28,000 different matrices. Those matrices fall into 8 different categories, and we will step through each type to understand what it does. As we go through, it will be fun for us to reference the numbers from GPT-3 to count up exactly where those 175 billion parameters all come from. | 比如，GPT-3 的 **1750 亿个权重**被组织成将近 28,000 个不同的矩阵。这些矩阵分成 8 大类，我们会逐类过一遍，弄清各自干什么。走这趟的过程中，拿 GPT-3 的真实数字来算一算这 1750 亿参数究竟从哪来，会是件乐事。 |
| There's a risk of getting lost in the vast amount of numbers, and in the hopes of adding clarity we'll draw a sharp distinction between the weights of the model, colored in blue or red, and the data being processed, colored in gray. The weights are the actual brains of the model, learned during training and determining how it behaves. The data being processed encodes whatever specific input was fed into the model in a given instance, like an example snippet of text. | 数字一多容易迷路。为了保持清晰，我们把两类东西严格区分开：模型的权重涂成蓝色或红色，被处理的数据涂成灰色。权重是模型真正的大脑，在训练中学得，决定模型的行为方式；而被处理的数据，编码的是某一次喂给模型的具体输入，比如一段示例文本。 |
| The model parameters are almost always referred to as weights, as the only way models interact with the data being processed is through weighted sums. | 模型参数几乎总是被称为权重，因为模型与被处理数据互动的唯一方式就是加权和。 |

> [!note]- 词汇注释 · 深度学习的前提
> - **knobs and dials** —— 旋钮与刻度盘，比喻"一排可调参数"。
> - **tune** /tjuːn/ —— 调校、调参。tune parameters＝调参数，ML 高频动词。
> - **linear regression** /rɪˈɡreʃn/ —— 线性回归。the line of best fit＝最优拟合直线。
> - **intractable** /ɪnˈtræktəbl/ —— 棘手到无从下手的。in-（不）+ tractable（可处理的）。
> - **be prone to ...** —— 容易……、动不动就……。prone to overfitting。
> - **overfitting** /ˈəʊvəfɪtɪŋ/ —— 过拟合：死记训练数据、泛化失灵。
> - **tensor** /ˈtensə(r)/ —— 张量。数字数组的高维统称。
> - **weighted sum** —— 加权和。模型参数之所以叫 weight，正源于此。

## 嵌入（Embedding）

| 原文 | 译文 |
|---|---|
| With all that as a foundation, let's dig into the text-processing example, starting with this first step of breaking up the input into little chunks and turning those chunks into vectors. We mentioned earlier how these little chunks are called tokens, which might be pieces of words or punctuation. For the sake of simplicity, we will pretend that the input is cleanly broken into words. Since we humans think in words, this will make it much easier to reference little examples to clarify each step. | 有了这些铺垫，我们来深挖文本处理的例子，从第一步开始：把输入切成小块，再把小块变成向量。前面说过，这些小块叫词元（token），可能是词的碎片，也可能是标点。为了简单起见，我们假装输入被干净利落地切成了一个个完整的词。毕竟我们人类是用词来思考的，这样后面引用小例子来讲清每一步会容易得多。 |

> [!note]- 词汇注释 · 嵌入
> - **predefined** /ˌpriːdɪˈfaɪnd/ —— 预先定义好的。（见下一节 the model has a predefined vocabulary。）
> - **vocabulary** /vəˈkæbjələri/ —— 词汇表。模型认识的全部词元的清单。
> - *for the sake of simplicity* —— 为简单起见。写作中常用的让步开场。
> - **cleanly** /ˈkliːnli/ —— 干净利落地。
> - **clarify** /ˈklærɪfaɪ/ —— 讲清楚、澄清。

## 嵌入矩阵（Embedding Matrix）

| 原文 | 译文 |
|---|---|
| The model has a predefined vocabulary, some list of all possible words, say 50,000 of them. The first matrix of the transformer, known as the **embedding matrix**, will have one column for each of these words. These columns determine what vector each word turns into in that first step. We label it as $W_E$, and like all the matrices we see, its values begin random, but they're going to be learned based on data. | 模型有一个预先定义好的词汇表（vocabulary），罗列所有可能的词，比如 50,000 个。transformer 的第一个矩阵，即所谓的**嵌入矩阵（embedding matrix）**，会为其中每个词准备一列。这些列决定了第一步里每个词被变成什么向量。我们把它记作 $W_E$；和我们见到的所有矩阵一样，它的值起始于随机，但最终会依据数据学出来。 |
| Turning words into vectors was common practice in machine learning long before transformers. This is often called _embedding the word_, which invites thinking of these vectors geometrically as points or directions in some space. Visualizing a list of three numbers as coordinates for a point in 3D space is no problem, but word embeddings tend to be very high dimensional. For GPT-3, they have 12,288 dimensions, and as you will see, it matters to work in a space with lots of distinct directions. | 把词变成向量，早在 transformer 出现之前就是机器学习的惯用做法。这常被称为_词嵌入（embedding the word）_，这个说法邀请你用几何的眼光，把这些向量想成某个空间中的点或方向。把三个数组成的列表可视化为 3D 空间里一个点的坐标毫无难度，但词嵌入的维度往往非常高。GPT-3 的词嵌入有 12,288 维；而且你后面会看到，在一个拥有大量不同方向的空间里工作，这一点很重要。 |
| In the same way that you can take a 2D slice through 3D space and project points onto that slice, for the sake of visualizing word embeddings, we will do something analogous by choosing a 3D _slice_ through the very high-dimensional space, projecting word vectors onto that, and displaying the result. | 就像你可以在 3D 空间里切出一个 2D 截面、把点投影上去一样，为了把词嵌入看清楚，我们做一个类似的事：在这个极高维的空间里选一个 3D _截面_，把词向量投影上去，再把结果画出来。 |

> [!note]- 词汇注释 · 嵌入矩阵
> - **invite** /ɪnˈvaɪt/ —— 邀请；引人（去做某事）。invites thinking of...＝引人去想……。
> - **geometrically** /ˌdʒiːəˈmetrɪkli/ —— 从几何角度。
> - **distinct** /dɪˈstɪŋkt/ —— 彼此有区分的、不同的。
> - **analogous** /əˈnæləɡəs/ —— 类似的。do something analogous＝做一件类似的事。
> - **project ... onto ...** —— 把……投影到……。
> - **slice** /slaɪs/ —— 切片、截面。a 3D slice 一个三维截面。

## 方向（Direction）

| 原文 | 译文 |
|---|---|
| The big idea we need to understand here is that as a model tweaks and tunes its weights to decide how exactly words get embedded as vectors during training, it tends to settle on a set of embeddings where directions in this space have meaning. Below, a simple word-to-vector model is running, and when I run a search for all words whose embeddings are closest to that of _tower_, they all generally have the same vibe. | 这里需要理解的大想法是：在训练中，模型反复微调自己的权重、决定词究竟如何被嵌入成向量，最终它往往会收敛到一组嵌入，使得这个空间里的"方向"本身有了含义。下面是一个简单的词转向量模型在跑：当我搜索所有嵌入与 _tower_ 最近的词时，它们大体上都有同一种味道。 |
| Another classic example of this is when the difference between the vectors for _woman_ and _man_ is taken, which can be visualized as a vector in this space connecting the tip of one to the tip of the other. This difference is quite similar to the difference between _king_ and _queen_. So, if the word for a female monarch was unknown, it could be found by taking _king_, adding the direction of _woman_ minus _man_, and searching for the closest word embedding. | 另一个经典例子：取 _woman_ 与 _man_ 两个向量之差——可以把它画成这个空间里从一支箭头尖端连到另一支的向量。这个差与 _king_ 和 _queen_ 之间的差相当接近。所以，假如"女性君主"对应的词是未知的，就可以拿 _king_，加上 _woman_ 减 _man_ 的方向，再搜索最近的词嵌入来找到它。 |
| At least, kind of. Despite this being the classic example, for the model I was playing with when making this video, the true embedding of _queen_ is a little farther off than the difference would suggest, presumably because the way _queen_ is used in training data is not merely a feminine version of a king. Family relations illustrate the idea better: | 至少，大致如此。尽管这是教科书级的经典例子，但在我制作本期视频时把玩的那款模型里，_queen_ 的真实嵌入比这个差值所暗示的位置要稍微远一点——大概是因为 _queen_ 在训练数据里的用法，并不只是"国王的女性版本"。亲属关系更能说明这个想法： |
| The idea here is that it seems as if, during training, the model found it advantageous to choose embeddings such that one direction in this space encodes gender information. | 这里的意思是：似乎在训练过程中，模型发现"选这样一组嵌入——让这个空间里的某个方向专门编码性别信息"是有利可图的。 |
| Another example of this would be taking the embedding of _Italy_, subtracting the embedding of _Germany_, and adding it to the embedding of _Hitler_. This results in something very close to the embedding of _Mussolini_. It's as if the model learned to associate some directions with Italian-ness and others with WWII Axis leaders. | 另一个例子：取 _Italy_ 的嵌入，减去 _Germany_ 的嵌入，再把结果加到 _Hitler_ 的嵌入上。得到的向量非常接近 _Mussolini_ 的嵌入。就好像模型学会了：把某些方向和"意大利范儿"绑在一起，把另一些方向和"二战轴心国领袖"绑在一起。 |

> [!note]- 词汇注释 · 方向
> - **tweak** /twiːk/ —— 微调、稍稍调整。
> - **settle on ...** —— 收敛到、最终敲定。
> - **vibe** /vaɪb/ —— 气质、味道（口语）。have the same vibe＝一个路数。
> - **monarch** /ˈmɒnək/ —— 君主。a female monarch 女性君主。
> - **presumably** /prɪˈzjuːməbli/ —— 大概、想必。
> - **advantageous** /ˌædvənˈteɪdʒəs/ —— 有利的、划算的。
> - **subtract** /səbˈtrækt/ —— 减去。反义是 add。

## 点积（Dot Product）

| 原文 | 译文 |
|---|---|
| One bit of mathematical intuition helpful to have in mind as we continue is how the dot product of two vectors can be thought of as measuring how well they align. Computationally, dot products involve multiplying all aligning components and adding the result. Geometrically, the dot product is positive when the vectors point in a similar direction, zero if they're _perpendicular_, and negative when they point in opposite directions. | 继续往下之前，有个数学直觉值得装进脑子：两个向量的点积（dot product），可以理解为在衡量它们对齐得有多好。从计算上看，点积是把所有对应的分量相乘再求和。从几何上看，两个向量指向相近时点积为正，_垂直_时为零，指向相反时为负。 |
| For example, suppose we wanted to test if the embedding of _cats_ minus that of _cat_ represents a kind of plurality direction in this space. To test this, you could take the dot product between this vector and various singular and plural nouns. When I did this for a simple word-to-vector model while making this video, it looked like the plural ones do indeed end up with consistently higher values than singular ones. Also, taking this dot product with the embeddings of the words _one_, _two_, _three_, and _four_, they give increasing values, as if it's quantitatively measuring how plural the model finds a given word. | 比如，假设我们想检验：_cats_ 的嵌入减去 _cat_ 的嵌入，是否代表这个空间里的一种"复数方向"。检验办法是让这个向量与各种单数、复数名词做点积。我制作本期视频时在一个简单的词转向量模型上试了试，看起来复数名词的点积确实一致地高于单数名词。另外，拿它与 _one_、_two_、_three_、_four_ 这几个词的嵌入做点积，得到的数值一路递增——就好像它在定量地测量：模型觉得某个词有多"复数"。 |
| Again, how specifically each word gets embedded is learned using data. The embedding matrix, whose columns store the embedding of each word, is the first pile of weights in our model. Using the GPT-3 numbers, the vocabulary size is 50,257, and again, technically this consists not of words, per se, but different little chunks of text called tokens. The embedding dimension is 12,288, giving us **617,558,016 weights** in total for this first step. Let's go add that to a running tally, remembering that by the end we should count up to 175 billion weights. | 再强调一次：每个词具体怎么嵌入，是依据数据学出来的。嵌入矩阵——它的每一列存着一个词的嵌入——是我们模型里的第一堆权重。按 GPT-3 的数字，词汇表大小是 50,257；同样地，严格说构成它的并不是"词"本身，而是一个个叫词元（token）的小块文本。嵌入维度是 12,288，于是第一步就有 **617,558,016 个权重**。走，把它记到累计账本上——别忘了，最后我们要数到 1750 亿。 |
| In this vector space, Embedding(Cat) - Embedding(Meow) represents a sort of sound direction. The animal that most commonly makes the bark sound is dog. | 在这个向量空间里，Embedding(Cat) − Embedding(Meow) 代表某种"叫声方向"。而最常发出 bark（吠叫）声的动物，是 dog（狗）。 |

> [!note]- 词汇注释 · 点积
> - **intuition** /ˌɪntjuˈɪʃn/ —— 直觉。a bit of mathematical intuition＝一点数学直觉。
> - **align** /əˈlaɪn/ —— 对齐、方向一致。how well they align＝对齐得有多好。
> - **perpendicular** /ˌpɜːpənˈdɪkjələ(r)/ —— 垂直的。
> - **plurality** /plʊəˈræləti/ —— 复数性。语法对子：singular（单数）/ plural（复数）。
> - **quantitatively** /ˈkwɒntɪtətɪvli/ —— 定量地。反义 qualitatively 定性地。
> - **a running tally** /ˈtæli/ —— 累计账、滚动计数。add that to a running tally＝记到总账上。

## 超越单词（Beyond words）

| 原文 | 译文 |
|---|---|
| In the case of a transformer, we also want to think of the vectors in this embedding space as not merely representing individual words. For one thing, these embeddings will also encode information about the position of the word, but more importantly, they need to have the capacity to soak in context. | 对 transformer 而言，我们还要把这个嵌入空间里的向量想成不只代表一个个孤立的词。一来，这些嵌入还会编码词的位置信息；但更重要的是，它们需要有把上下文"泡"进来的容量。 |
| For example, a vector that started its life as the embedding of the word "king" may progressively get tugged and pulled by the various blocks in the network to end up pointing in a much more nuanced direction that somehow encodes a king who lived in Scotland, who had achieved his post after murdering the previous king, who is being described in Shakespearean language, and so on. | 比如，一个以"king"的嵌入出身的向量，可能在网络里被各种块又拽又拉，最终指向一个细腻得多的方向——以某种方式编码了：一位住在苏格兰的国王、一位在谋害了前任国王之后才上位的国王、一位正被莎士比亚式语言描述着的国王，等等。 |
| Think about our understanding of a word, like quill. Its meaning is clearly informed by its surroundings and context, whether it be a hedgehog quill or a type of pen. Sometimes, we may even include context from a long distance away. When putting together a model that is able to predict the next word, the goal is to somehow empower it to do the same thing: take in context efficiently. | 想想我们自己是怎么理解一个词的，比如 quill。它的含义显然由周围的词和上下文决定——可能是刺猬的刺，也可能是一种笔。有时，我们甚至会把很远处的上下文也纳入进来。要搭一个能预测下一个词的模型，目标就是设法赋予它同样的本事：高效地吃进上下文。 |
| In that very first step, when you create the array of vectors based on the input text, each one is simply plucked out of this embedding matrix, and each one only encodes the meaning of the single word it's associated with. It's effectively a lookup table with no input from the surroundings. But as these vectors flow through the network, we should view the primary goal of this network as enabling each one of those vectors to soak up meaning that is more rich and specific than what mere individual words can represent. | 在最开始那一步，你基于输入文本造出向量数组时，每个向量都只是从嵌入矩阵里原样取出来的，每个都只编码与它关联的那一个词的含义。它实质上是一张查询表，对周围环境一无所知。但当这些向量流过网络时，我们应当把这个网络的首要目标看成：让每一个向量都泡进比"单个词"丰富、具体得多的含义里。 |
| The network can only look at a fixed number of vectors at a time, known as its _context size_. GPT-3 was trained with a context size of 2048 tokens. So the data flowing through the network will look like this array of 2048 columns, each of which has around 12k dimensions. This context size limits how much text the transformer can incorporate to make its prediction of the next word, which is why long conversations with the early versions of ChatGPT often gave the feeling of the bot losing the thread of conversation. | 网络一次只能看固定数量的向量，这个数量叫_上下文长度（context size）_。GPT-3 训练时的上下文长度是 2048 个词元。所以流过网络的数据，就像这个 2048 列的数组，每列有大约 1.2 万维。上下文长度限制了 transformer 在预测下一个词时能纳入多少文本——这也正是为什么，和早期版本的 ChatGPT 长聊时，常常感觉机器人把话头聊丢了。 |

> [!note]- 词汇注释 · 超越单词
> - **soak in / soak up** —— 吸收、泡透。soak in context＝把上下文泡进来。
> - **nuanced** /ˈnjuːɑːnst/ —— 细腻入微的、有微妙差别的。
> - **quill** /kwɪl/ —— 羽毛笔；（豪猪、刺猬的）刺。一词两义正是文中的例子。
> - **pluck out** —— 拔出、直接取出。
> - **lookup table** —— 查找表。查表即得、无需计算。
> - **lose the thread** —— 把话头聊丢、跟不上线索。thread＝（谈话的）主线。

## 反嵌入（Unembedding）

| 原文 | 译文 |
|---|---|
| We'll go into the details of the Attention Block in the next chapter, but first we'll skip ahead and talk about what happens at the very end of the Transformer. Remember, the desired output is a probability distribution over all possible chunks of text that might come next. | 注意力块的细节留到下一章，这里先跳到 transformer 的最末端，看看那里发生什么。记住，我们想要的输出，是一个覆盖所有可能"下一块文本"的概率分布。 |
| For example, if the last word is _Professor_, and the context includes words like _Harry Potter_, and the immediately preceding is _least favorite_, and if we pretend that all tokens look like full words, a well-trained network would presumably assign a high number to the word _Snape_. | 比如，如果最后一个词是 _Professor_，上下文里有 _Harry Potter_ 这样的词，紧挨着的前文是 _least favorite_，并且我们假装所有词元都长成完整的单词，那么一个训练有素的网络，多半会给 _Snape_ 这个词分一个很高的数。 |

> [!note]- 词汇注释 · 反嵌入
> - **skip ahead** —— 先跳到（后面的内容）、抢前讲。
> - **desired** /dɪˈzaɪəd/ —— 期望的、想要的。the desired output。
> - *a well-trained network* —— 训练有素的网络。well-trained 复合形容词。
> - **presumably** /prɪˈzjuːməbli/ —— 多半、想必。
> - **assign ... to ...** —— 把……分配给……。assign a high number to Snape。

## 反嵌入矩阵（Unembedding Matrix）

| 原文 | 译文 |
|---|---|
| This process involves two steps. The first is to use another matrix that maps the very last vector in the context to a list of ~50,000 values, one for each token in the vocabulary, then there's a function that normalizes this into a probability distribution, called _softmax_, which we'll talk more about in just a second. | 这个过程分两步。第一步，用另一个矩阵把上下文中的最后一个向量映射成约 50,000 个值组成的列表，词汇表里每个词元对应一个；然后有一个函数把这个列表归一化成概率分布，它叫 _softmax_，我们马上就会细讲。 |
| It might seem weird to only use the last embedding to make a prediction when there are thousands of other vectors in that last layer just sitting here with their own context-rich meanings. This has to do with how the training process turns out to be much more efficient if we use each vector in this final layer to simultaneously make a prediction for what comes immediately after it. We'll talk a lot more about the training process later. | 最后一层里明明坐着几千个各自带着丰富上下文含义的向量，却只用最后一个嵌入来做预测，这看上去有点怪。这和训练过程的效率有关：如果让最后一层里的每个向量都同时预测紧随其后出现的词，整个训练会高效得多。训练过程我们后面会讲很多。 |
| This is often called the **unembedding matrix**, and we'll give it the label | 这通常被称为**反嵌入矩阵（unembedding matrix）**，我们给它记作 |

$$W_U$$

| . Again, like all the weight matrices we'll see, its entries begin random but are tuned during the training process. | 。同样，和我们见到的所有权重矩阵一样，它的条目起始于随机，并在训练过程中被调校。 |
| Keeping score on our total number of parameters, the unembedding matrix has one row for each word in the vocabulary, giving 50,257 words, and each row has the same number of elements as the dimension of the embedding, giving 12,288 columns. It's very similar to the embedding matrix, just with the dimensions of the rows and columns swapped, so it adds another 617M parameters to the network, making our parameter count so far a little over a billion; a small but not insignificant fraction of the 175 billion that we'll end up with in total. | 继续记参数总账：反嵌入矩阵为词汇表里的每个词准备一行，共 50,257 行；每一行的元素个数与嵌入维度相同，即 12,288 列。它和嵌入矩阵非常像，只是行列维度对调，于是又给网络添了 6.17 亿（617M）参数；到目前为止参数总数刚过 10 亿——在最终的 1750 亿里，是一小块不算微不足道的份额。 |
| Since the dimension the embedding matrix exists in is 10,000, the embedding matrix must have 10,000 rows. Then the embedding matrix must have 32,000 columns, one for each token. | 假如嵌入矩阵所处的空间维度是 10,000，那么嵌入矩阵就必须有 10,000 行；于是嵌入矩阵必须有 32,000 列，每个词元一列。 |
| The unembedding matrix is similar to the embedding matrix, but the dimensions of the rows and columns are swapped, giving 32,000 rows and 10,000 columns. | 反嵌入矩阵与嵌入矩阵类似，但行列维度对调：32,000 行、10,000 列。 |

> [!note]- 词汇注释 · 反嵌入矩阵
> - **normalize** /ˈnɔːməlaɪz/ —— 归一化：调成统一尺度（如总和为 1）。
> - **entry** /ˈentri/ —— （矩阵中的）条目、元素。
> - **swap** /swɒp/ —— 对调、交换。rows and columns swapped＝行列对调。
> - **keep score** —— 记分、记账。Keeping score on...＝算一笔总账。
> - **not insignificant** —— 不算微不足道。双重否定＝相当可观。

## Softmax

| 原文 | 译文 |
|---|---|
| For the last lesson of this chapter, we will go over the softmax function, since it will appear again once we dive into the attention blocks. | 本章的最后一课，我们来过一遍 softmax 函数，因为等我们一头扎进注意力块时，它还会反复出现。 |
| The idea is that if we want a sequence of numbers to serve as a probability distribution, say a distribution over all possible next words, all the values should be between 0 and 1 and should all add up to be 1. However, in deep learning, where so much of what we do looks like a matrix-vector products, the outputs we get by default won't abide by this at all. The values are often negative or sometimes greater than 1, and they almost certainly don't all add up to 1. | 想法是这样的：如果我们想让一列数充当概率分布——比如对所有可能的下一个词的分布——那么所有值都应当落在 0 和 1 之间，而且加起来等于 1。然而在深度学习里，我们做的大量事情都长着矩阵-向量乘积的脸，默认拿到的输出根本不守这套规矩：数值经常是负的，有时大于 1，而且几乎肯定加起来不是 1。 |
| **Softmax** turns an arbitrary list of numbers into a valid distribution, in such a way that the largest values end up closest to 1, and the smaller values end up closer to 0. | **Softmax** 把一列任意的数变成一个合法的分布，并且让最大的那些值最终贴近 1，较小的值最终贴近 0。 |
| The way it works is to first raise _e_ to the power of each number, which gives a bunch of positive values. Then you take the sum of all these new terms and divide each term by that sum, which normalizes it into a list that adds up to 1. | 它的做法是：先把 _e_ 逐个取为这些数的幂，得到一堆正值；然后把这些新项全部加总，再用总和去除每一项，归一化出一个加起来等于 1 的列表。 |
| The reason for calling it _softmax_ is that instead of simply pulling out the biggest value, it produces a distribution that gives weight to all the relatively large values, commensurate with how large they are. If one entry in the input is much bigger than the rest, the corresponding output will be very close to 1, so sampling from the distribution is likely the same as just choosing the maximizing index from the input. | 它之所以叫 _softmax_（软最大），是因为它并不简单地把最大值挑出来，而是产出一个分布，让所有相对较大的值都分得权重，权重与它们的大小相称。如果输入里某一项远大于其余各项，对应的输出就会非常接近 1——这时从这个分布里抽样，多半就等于直接挑输入里最大的那个下标。 |
| In some cases, such as when ChatGPT is using this distribution to sample each next word, we can add a little extra spice into this softmax function with a constant _T_ inserted into all these exponents. We call it "temperature" since it vaguely resembles the role of temperature in certain thermodynamics equations. The effect of this constant is that when _T_ is larger, more weight is given to lower values, making the distribution more uniform. When _T_ is smaller, the larger values will dominate the distribution, and in the extreme setting when _T_ is equal to 0, all the weight goes to the maximum value. | 某些情况下——比如 ChatGPT 用这个分布来抽样每个下一个词时——我们还能给 softmax 加点佐料：往所有指数里塞进一个常数 _T_。我们管它叫"温度（temperature）"，因为它隐隐像某些热力学方程里温度扮演的角色。这个常数的效果是：_T_ 越大，较低的值分到的权重越多，分布更均匀；_T_ 越小，较大的值就会统治整个分布；而在 _T_ 等于 0 的极端设定下，所有权重都归最大值。 |
| Here's another bit of jargon: In the same way that we might call the components of the output of this function _probabilities_, people often refer to the components of the input as **logits**. So when you feed in some text, have the word embeddings flow through the network, and do this final multiplication by the unembedding matrix, machine learning people would refer to the components of that raw unnormalized output as the **logits** for the next word prediction. | 再补充一个行话：正如我们可以把这个函数输出的各个分量叫_概率_，人们也常把输入的各个分量称为 **logits（逻辑值）**。所以，当你喂进一段文本、让词嵌入流过网络、最后与反嵌入矩阵做乘法之后，机器学习圈的人会把那个未归一化的原始输出的各个分量，叫作下一词预测的 **logits**。 |

> [!note]- 词汇注释 · Softmax
> - **abide by ...** /əˈbaɪd/ —— 遵守、依从。won't abide by this＝根本不守这套。
> - **arbitrary** /ˈɑːbɪtrəri/ —— 任意的。
> - **commensurate with ...** /kəˈmenʃərət/ —— 与……相称、成比例。
> - **exponent** /ɪkˈspəʊnənt/ —— 指数。
> - **thermodynamics** /ˌθɜːməʊdaɪˈnæmɪks/ —— 热力学。
> - **uniform** /ˈjuːnɪfɔːm/ —— 均匀的。
> - **jargon** /ˈdʒɑːɡən/ —— 行话、术语。
> - **logits** /ˈləʊdʒɪts/ —— 逻辑值：未归一化的原始输出分数，LLM 高频术语。

## 整体结构尽在于此（And That's The Overall Structure）

| 原文 | 译文 |
|---|---|
| Our goal for this chapter was to lay the foundations for understanding the attention mechanism. If we have a strong intuition for _word embeddings_, _softmax_, how dot products measure similarity, and the underlying premise that most calculations look like matrix multiplication with matrices full of tunable parameters, then understanding the attention mechanism, one of the keystone pieces of the whole modern boom in AI that we will explore in the next chapter, should be relatively smooth. | 本章的目标，是为理解注意力机制（attention mechanism）打好地基。如果我们对_词嵌入_、_softmax_、点积如何度量相似度，以及"大多数计算都长着'装满可调参数的矩阵乘法'的脸"这个基本前提，都有了扎实的直觉，那么理解注意力机制——整个现代 AI 浪潮的拱心石之一，也是我们下一章要探索的主题——应当会相对顺畅。 |

> [!note]- 词汇注释 · 整体结构尽在于此
> - **mechanism** /ˈmekənɪzəm/ —— 机制。attention mechanism 注意力机制。
> - **lay the foundations for ...** —— 为……打下地基。
> - **premise** /ˈpremɪs/ —— 前提。the underlying premise 基本前提。
> - **keystone** /ˈkiːstəʊn/ —— 拱心石、关键基石。
> - *relatively smooth* —— 相对顺畅。

## 总词汇表

| 词汇 | 音标 | 释义 | 文中语境 |
|---|---|---|---|
| transformer | /trænsˈfɔːmə(r)/ | 变换器 | the tech behind LLMs |
| token | /ˈtəʊkən/ | 词元 | broken into small chunks known as tokens |
| embedding | /ɪmˈbedɪŋ/ | 嵌入 | embedding the word |
| vector | /ˈvektə(r)/ | 向量 | a vector, meaning some list of numbers |
| attention | /əˈtenʃn/ | 注意力 | Attention Block |
| context | /ˈkɒntekst/ | 上下文 | the capacity to soak in context |
| weight | /weɪt/ | 权重 | model parameters as weights |
| dot product | — | 点积 | measuring how well they align |
| softmax | — | 归一化成概率分布的函数 | normalizes this into a probability distribution |
| perceptron | /pəˈseptrɒn/ | 感知机 | Multilayer Perceptron |
| matrix | /ˈmeɪtrɪks/ | 矩阵 | matrices full of tunable parameters |
| tensor | /ˈtensə(r)/ | 张量 | higher-dimensional arrays |
| overfitting | /ˈəʊvəfɪtɪŋ/ | 过拟合 | prone to overfitting |
| backpropagation | /ˌbækprɒpəˈɡeɪʃn/ | 反向传播 | trained using an algorithm called backpropagation |
| intuition | /ˌɪntjuˈɪʃn/ | 直觉 | a bit of mathematical intuition |
| tweak | /twiːk/ | 微调 | tweaks and tunes its weights |
| logits | /ˈləʊdʒɪts/ | 逻辑值（原始输出分数） | the components of that raw unnormalized output |
| temperature | /ˈtemprətʃə(r)/ | 温度（抽样参数） | a constant T inserted into all these exponents |
| under the hood | — | 表面之下、内部机制 | what's going on under the hood |
| in broad strokes | — | 粗线条地 | preview the transformer in broad strokes |

> [!question]- 输出练习
> 用本篇生词写一段 3–5 句的英文摘要，讲清 Transformer 生成文本的大致流程（重点关注总词汇表里的词，比如 token、embedding、weight、attention、softmax）。写完展开下面的批改框，点「AI 批改」获取逐条反馈；也可以「复制批改提示词」粘贴给你常用的 AI。

## 版权说明

原文 © 3Blue1Brown LLC，本笔记为个人学习用途的对照整理，原文版权归原作者所有，请勿二次分发。

## 参考资料

- 官网课页：<https://www.3blue1brown.com/lessons/gpt>
- YouTube 视频：<https://youtu.be/wjZofJX0v4M>
- 官网源码仓库：<https://github.com/3b1b/3Blue1Brown.com>
