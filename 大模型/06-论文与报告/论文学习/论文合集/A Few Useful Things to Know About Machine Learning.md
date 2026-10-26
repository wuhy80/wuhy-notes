---
🌻日期🌻: 2025-05-19
🌙星期🌙: 星期一
⌚️时间⌚️: 20:33:23
tags:
  - 大模型/论文
  - 技术/机器学习
created: 2025-05-19
updated: 2026-10-26
source: https://homes.cs.washington.edu/~pedrod/papers/cacm12.pdf
type: 论文精读
status: 已完成
---

# A Few Useful Things to Know About Machine Learning（机器学习实践中的若干要点）

> [!info] 论文信息
> - **作者**：Pedro Domingos（华盛顿大学计算机科学与工程系教授）
> - **发表**：Communications of the ACM，2012 年 10 月，Vol. 55，No. 10，pp. 78–87
> - **DOI**：[10.1145/2347736.2347755](https://doi.org/10.1145/2347736.2347755)
> - **原文 PDF**：![[A Few Useful Things to Know About Machine Learning.pdf]]
> - **一句话总结**：把机器学习研究者与从业者积累了多年的"民间知识"（folk knowledge）整理成 12 条可操作的经验，帮你避开实践中的坑。
> - **学习路径中的位置**：这是 [[从浅入生的推荐一系列的论文学习|从浅入深论文学习清单]] 的第 1 篇，适合在啃任何具体算法论文之前先读。

> [!abstract] 12 条经验速览
>
> | # | 英文标题 | 中文 | 一句话要点 |
> | --- | --- | --- | --- |
> | 1 | Learning = Representation + Evaluation + Optimization | 学习 = 表示 + 评估 + 优化 | 一切学习器都是这三个组件的组合 |
> | 2 | It's Generalization that Counts | 泛化才是关键 | 目标是对未见样本表现好，别在训练集上自欺欺人 |
> | 3 | Data Alone Is Not Enough | 只有数据不够 | 学习必须内嵌数据之外的先验知识（没有免费午餐） |
> | 4 | Overfitting Has Many Faces | 过拟合有多副面孔 | 数据里的随机怪癖被当成了规律；用偏差-方差分解理解 |
> | 5 | Intuition Fails in High Dimensions | 高维直觉会失灵 | 维度灾难让相似性推理崩溃 |
> | 6 | Theoretical Guarantees Are Not What They Seem | 理论保证名不副实 | 界通常极松，理论的价值在理解而非选型 |
> | 7 | Feature Engineering Is the Key | 特征工程是关键 | 决定项目成败的第一要素 |
> | 8 | More Data Beats a Cleverer Algorithm | 更多数据胜过更聪明的算法 | 笨算法 + 海量数据 > 聪明算法 + 少量数据 |
> | 9 | Learn Many Models, Not Just One | 学多个模型而非一个 | 模型集成几乎免费涨点 |
> | 10 | Simplicity Does Not Imply Accuracy | 简单不意味着准确 | 奥卡姆剃刀与准确率没有必然联系 |
> | 11 | Representable Does Not Imply Learnable | 可表示不等于可学习 | 关键问题是"学不学得到"，不是"能不能表示" |
> | 12 | Correlation Does Not Imply Causation | 相关不等于因果 | 观测数据只给相关性，能做实验就做实验 |

## 阅读说明

本笔记按论文原文逐段整理，每一段包含三个部分：

- **原文**：英文原段（保留作者的黑体/斜体强调）。
- **重点词汇**：该段出现的关键术语，给出中文含义与简要解释。
- **译文 / 备注**：中文翻译；标注"备注"的地方是补充说明，帮助理解段落含义或联系当今实践。

论文中的表 1、算法 1 和图 1–3 在对应位置给出 Markdown 版本或文字说明。

---

## 引言（Introduction）

**P1 原文**

> Machine learning systems automatically learn programs from data. This is often a very attractive alternative to manually constructing them, and in the last decade the use of machine learning has spread rapidly throughout computer science and beyond. Machine learning is used in Web search, spam filters, recommender systems, ad placement, credit scoring, fraud detection, stock trading, drug design, and many other applications. A recent report from the McKinsey Global Institute asserts that machine learning (a.k.a. data mining or predictive analytics) will be the driver of the next big wave of innovation. Several fine textbooks are available to interested practitioners and researchers (for example, Mitchell and Witten et al.). However, much of the "folk knowledge" that is needed to successfully develop machine learning applications is not readily available in them. As a result, many machine learning projects take much longer than necessary or wind up producing less-than-ideal results. Yet much of this folk knowledge is fairly easy to communicate. This is the purpose of this article.

**重点词汇**

- **automatically learn**（自动学习）：与"手工构造程序"相对，是机器学习的定义性特征。
- **spam filters**（垃圾邮件过滤器）：本文反复使用的示例任务。
- **recommender systems**（推荐系统）、**ad placement**（广告投放）、**credit scoring**（信用评分）、**fraud detection**（欺诈检测）、**stock trading**（股票交易）、**drug design**（药物设计）：2012 年时机器学习的主力应用领域。
- **a.k.a.**（also known as，又称）：机器学习 ≈ 数据挖掘 ≈ 预测分析，同一件事的不同名字。
- **folk knowledge**（民间知识 / 经验知识）：全篇核心词，指教科书不写、但实践中人人都得会的经验法则。
- **wind up**（最终落得……下场）、**less-than-ideal**（不够理想的）。

**译文**

机器学习系统能自动地从数据中学出程序。与手工编写程序相比，这往往是一种非常有吸引力的替代方案；过去十年，机器学习的应用在计算机科学内外迅速铺开：网页搜索、垃圾邮件过滤、推荐系统、广告投放、信用评分、欺诈检测、股票交易、药物设计……麦肯锡全球研究院的一份报告断言，机器学习（又称数据挖掘或预测分析）将驱动下一波创新浪潮。面向从业者和研究者的优秀教科书已有不少（例如 Mitchell、Witten 等），但成功开发机器学习应用所需的许多"民间知识"并不见于其中。结果是许多机器学习项目耗时远超必要，或最终结果不够理想。而这些经验知识其实并不难讲清楚——这正是本文的目的。

> [!tip] Key Insights（原文首页要点框）
> - 机器学习算法能通过从样本中**泛化**来学会完成重要任务；在手工编程不可行的场景，这条路往往可行且划算。数据越多，能啃的问题越有野心。
> - 机器学习已广泛应用于计算机科学和其他领域，但开发成功的应用需要大量教科书里难觅的"黑魔法"经验。
> - 本文总结了 12 条关键经验：要避开的坑、要关注的问题、常见问题的答案。

---

## 1. 学习 = 表示 + 评估 + 优化（Learning = Representation + Evaluation + Optimization）

**P1 原文**

> Many different types of machine learning exist, but for illustration purposes I will focus on the most mature and widely used one: *classification*. Nevertheless, the issues I will discuss apply across all of machine learning. A *classifier* is a system that inputs (typically) a vector of discrete and/or continuous *feature values* and outputs a single discrete value, the *class*. For example, a spam filter classifies email messages into "spam" or "not spam," and its input may be a Boolean vector **x** = (x₁, …, x_j, …, x_d), where x_j = 1 if the j-th word in the dictionary appears in the email and x_j = 0 otherwise. A *learner* inputs a *training set* of examples (x_i, y_i), where x_i = (x_i,1, …, x_i,d) is an observed input and y_i is the corresponding output, and outputs a classifier. The test of the learner is whether this classifier produces the correct output y_t for future examples x_t (for example, whether the spam filter correctly classifies previously unseen email messages as spam or not spam).

**重点词汇**

- **classification**（分类）：最成熟、应用最广的机器学习任务；本文所有讨论都以它为例。
- **classifier**（分类器）：输入特征向量、输出类别的系统。
- **feature values**（特征值）：描述样本的属性，离散或连续。
- **class**（类别）：分类器的输出。
- **learner**（学习器）：吃训练集、产出分类器的算法。
- **training set**（训练集）：形如 (x_i, y_i) 的样本对集合。
- **previously unseen**（未见过的）：衡量学习器好坏的唯一标准是对新样本的表现。

**译文**

机器学习有多种类型，为便于说明，本文聚焦最成熟、应用最广的一类：分类。不过下文讨论的问题适用于机器学习的所有分支。分类器是一个系统，输入通常是离散和/或连续特征值组成的向量，输出一个离散值——类别。例如垃圾邮件过滤器把邮件分为"垃圾"或"非垃圾"，其输入可以是布尔向量 **x** = (x₁, …, x_d)：字典里第 j 个词出现在邮件中则 x_j = 1，否则为 0。学习器以训练集 (x_i, y_i) 为输入（x_i 是观测输入，y_i 是对应输出），产出分类器。学习器的考验在于：它产出的分类器能否对未来样本 x_t 给出正确输出 y_t（比如把没见过的邮件正确判为垃圾 / 非垃圾）。

**P2 原文（组件一：表示）**

> **Representation.** A classifier must be represented in some formal language that the computer can handle. Conversely, choosing a representation for a learner is tantamount to choosing the set of classifiers that it can possibly learn. This set is called the *hypothesis space* of the learner. If a classifier is not in the hypothesis space, it cannot be learned. A related question, that I address later, is how to represent the input, in other words, what features to use.

**重点词汇**

- **representation**（表示）：计算机能处理的形式语言，如决策树、神经网络、规则集。
- **tantamount to**（等价于）：选表示 = 选假设空间。
- **hypothesis space**（假设空间）：一个学习器所有"可能学到的分类器"构成的集合；不在其中的分类器永远学不出来。

**译文**

**表示**：分类器必须用计算机能处理的某种形式语言来表示。反过来，为学习器选择一种表示，就等价于选定了它可能学到的分类器集合——这个集合叫作学习器的**假设空间**。不在假设空间里的分类器是学不出来的。与之相关的一个问题（后文讨论）是如何表示输入，也就是选用哪些特征。

**P3 原文（组件二：评估）**

> **Evaluation.** An evaluation function (also called *objective function* or *scoring function*) is needed to distinguish good classifiers from bad ones. The evaluation function used internally by the algorithm may differ from the external one that we want the classifier to optimize, for ease of optimization and due to the issues I will discuss.

**重点词汇**

- **evaluation function**（评估函数）：判断分类器好坏的标准。
- **objective function**（目标函数）、**scoring function**（评分函数）：同一件事的另外两个名字。
- **internal vs external**（内部 vs 外部）：算法内部优化的指标（如平方误差）未必等于我们真正关心的指标（如准确率）——这是后文"泛化"一节伏笔。

**译文**

**评估**：需要一个评估函数（也称目标函数或评分函数）来区分分类器的好坏。算法内部实际使用的评估函数，可能与我们真正想让分类器优化的外部指标不同——为了优化起来更方便，也由于后文会讨论的一些问题。

**P4 原文（组件三：优化）**

> **Optimization.** Finally, we need a method to search among the classifiers in the language for the highest-scoring one. The choice of optimization technique is key to the efficiency of the learner, and also helps determine the classifier produced if the evaluation function has more than one optimum. It is common for new learners to start out using off-the-shelf optimizers, which are later replaced by custom-designed ones.

**重点词汇**

- **optimization**（优化）：在假设空间中搜索得分最高的分类器。
- **off-the-shelf**（现成的）：新学习器常用现成优化器起步。
- **optimum**（最优值）：评估函数可能有多个最优，优化方法的选择会影响最后学到哪个。

**译文**

**优化**：最后，还需要一种方法，在该语言所能表示的所有分类器中搜索得分最高者。优化技术的选择是学习器效率的关键；当评估函数有多个最优值时，它还会影响最终学到哪个分类器。新的学习器常用现成的优化器起步，之后往往换成专门定制的。

**P5 原文**

> The accompanying table shows common examples of each of these three components. For example, *k*-nearest neighbor classifies a test example by finding the *k* most similar training examples and predicting the majority class among them. Hyperplane-based methods form a linear combination of the features per class and predict the class with the highest-valued combination. Decision trees test one feature at each internal node, with one branch for each feature value, and have class predictions at the leaves. Algorithm 1 (above) shows a bare-bones decision tree learner for Boolean domains, using information gain and greedy search. InfoGain(x_j, y) is the mutual information between feature x_j and the class y. MakeNode(x, c₀, c₁) returns a node that tests feature x and has c₀ as the child for x = 0 and c₁ as the child for x = 1.

**重点词汇**

- **k-nearest neighbor（kNN）**（k 近邻）：找最相似的 k 个训练样本，取多数类。
- **majority class**（多数类）。
- **hyperplane**（超平面）：线性分类器的决策边界。
- **linear combination**（线性组合）。
- **internal node / leaf**（内部节点 / 叶子）：决策树结构。
- **information gain**（信息增益）、**mutual information**（互信息）：选择分裂特征的标准。
- **greedy search**（贪心搜索）：每步只取当前最优，不保证全局最优。
- **bare-bones**（极简的、只有骨架的）。

**译文**

表 1 给出三个组件各自的常见例子。例如 k 近邻这样分类测试样本：找出与它最相似的 k 个训练样本，预测其中的多数类。基于超平面的方法为每个类别构造特征的一个线性组合，取组合值最高的类别。决策树在每个内部节点测试一个特征，每个特征值引出一个分支，叶子节点给出类别预测。算法 1 是一个用于布尔域的极简决策树学习器，使用信息增益和贪心搜索：InfoGain(x_j, y) 是特征 x_j 与类别 y 之间的互信息；MakeNode(x, c₀, c₁) 返回一个测试特征 x 的节点，c₀ 是 x = 0 时的子节点，c₁ 是 x = 1 时的子节点。

**Table 1. 学习算法三组件（中英对照）**

| 表示（Representation） | 评估（Evaluation） | 优化（Optimization） |
| --- | --- | --- |
| 实例（Instances） | 准确率 / 错误率 | 组合优化（Combinatorial optimization） |
| 　k 近邻 | 精确率与召回率 | 　贪心搜索 |
| 　支持向量机 | 平方误差 | 　束搜索（Beam search） |
| 超平面（Hyperplanes） | 似然（Likelihood） | 　分支限界（Branch-and-bound） |
| 　朴素贝叶斯 | 后验概率 | 连续优化（Continuous optimization） |
| 　逻辑回归 | 信息增益 | 　无约束 |
| 决策树 | KL 散度 | 　梯度下降 |
| 规则集（Sets of rules） | 代价 / 效用 | 　共轭梯度 |
| 　命题规则 | 间隔（Margin） | 　拟牛顿方法 |
| 　逻辑程序 |  | 　有约束 |
| 神经网络 |  | 　线性规划 |
| 图模型（Graphical models） |  | 　二次规划 |
| 　贝叶斯网络 |  |  |
| 　条件随机场 |  |  |

**Algorithm 1. 决策树归纳（Decision tree induction）**

```text
LearnDT(TrainSet)
  if TrainSet 中所有样本类别相同 y* then
    return MakeLeaf(y*)
  if 没有任何特征 x_j 满足 InfoGain(x_j, y) > 0 then
    y* ← TrainSet 中最频繁的类别
    return MakeLeaf(y*)
  x* ← argmax_{x_j} InfoGain(x_j, y)
  TS0 ← TrainSet 中 x* = 0 的样本
  TS1 ← TrainSet 中 x* = 1 的样本
  return MakeNode(x*, LearnDT(TS0), LearnDT(TS1))
```

**P6 原文**

> Of course, not all combinations of one component from each column of the table make equal sense. For example, discrete representations naturally go with combinatorial optimization, and continuous ones with continuous optimization. Nevertheless, many learners have both discrete and continuous components, and in fact the day may not be far when every single possible combination has appeared in some learner!

**重点词汇**

- **make (equal) sense**（合理 / 同样说得通）。
- **combinatorial optimization**（组合优化）vs **continuous optimization**（连续优化）：离散表示配前者、连续表示配后者，是最自然的搭配。

**译文**

当然，从表中每一列各取一个组件，并非所有组合都同样合理。例如离散表示天然搭配组合优化，连续表示搭配连续优化。尽管如此，许多学习器同时含有离散和连续组件，而且说不定用不了多久，每一种可能的组合都会在某个学习器里出现过！

**P7 原文**

> Most textbooks are organized by representation, and it is easy to overlook the fact that the other components are equally important. There is no simple recipe for choosing each component, but I will touch on some of the key issues here. As we will see, some choices in a machine learning project may be even more important than the choice of learner.

**重点词汇**

- **recipe**（配方、成法）：选择组件没有万能配方。
- **touch on**（触及、略微谈到）。

**译文**

大多数教科书按"表示"来组织内容，很容易因此忽视另外两个组件同样重要。选择组件没有简单配方，下文会触及一些关键问题。我们将会看到：机器学习项目里的某些选择，甚至可能比选哪个学习器更重要。

**备注**：这一段是全篇的方法论预告——后续章节（特征工程、数据量等）讲的大多是"表示之外"的选择。

---

## 2. 泛化才是关键（It's Generalization that Counts）

**P1 原文**

> The fundamental goal of machine learning is to generalize beyond the examples in the training set. This is because, no matter how much data we have, it is very unlikely that we will see those exact examples again at test time. (Notice that, if there are 100,000 words in the dictionary, the spam filter described above has $2^{100000}$ possible different inputs.) Doing well on the training set is easy (just memorize the examples). The most common mistake among machine learning beginners is to test on the training data and have the illusion of success. If the chosen classifier is then tested on new data, it is often no better than random guessing. So, if you hire someone to build a classifier, be sure to keep some of the data to yourself and test the classifier they give you on it. Conversely, if you have been hired to build a classifier, set some of the data aside from the beginning, and only use it to test your chosen classifier at the very end, followed by learning your final classifier on the whole data.

**重点词汇**

- **generalize**（泛化）：把训练集上学到的规律用到没见过的样本上——机器学习的根本目标。
- **illusion of success**（成功的假象）：在训练数据上自测的陷阱。
- **no better than random guessing**（与随机猜测无异）。
- **set aside**（留出、扣下）：数据集划分的标准操作。

**译文**

机器学习的根本目标是泛化——在训练集之外的样本上也表现良好。因为无论数据多少，测试时几乎不可能再遇到一模一样的样本（注意：如果字典有 10 万个词，上述垃圾邮件过滤器就有 $2^{100000}$ 种可能的不同输入）。在训练集上表现好很容易——把样本背下来就行。初学者最常犯的错误就是在训练数据上做测试，然后沉浸在成功的假象里；选出的分类器一旦放到新数据上，往往跟随机瞎猜差不多。所以：如果你雇人开发分类器，务必自己扣下一部分数据，用它检验对方交付的分类器；反过来，如果你是受雇方，从一开始就留出一部分数据不碰，只在最后用它测试选定的分类器，然后再用全部数据学习最终分类器。

**P2 原文**

> Contamination of your classifier by test data can occur in insidious ways, for example, if you use test data to tune parameters and do a lot of tuning. (Machine learning algorithms have lots of knobs, and success often comes from twiddling them a lot, so this is a real concern.) Of course, holding out data reduces the amount available for training. This can be mitigated by doing cross-validation: randomly dividing your training data into (say) 10 subsets, holding out each one while training on the rest, testing each learned classifier on the examples it did not see, and averaging the results to see how well the particular parameter setting does.

**重点词汇**

- **contamination**（污染）：测试信息泄露进训练过程。
- **insidious**（隐蔽的、暗中为害的）。
- **knob**（旋钮）：比喻超参数；**twiddle**（拧来拧去）：反复调参。
- **cross-validation**（交叉验证）：缓解"留出浪费数据"的标准手段。

**译文**

测试数据对分类器的"污染"可能以隐蔽的方式发生——比如你用测试数据调参数，而且调了很多轮。（机器学习算法旋钮很多，成功常常来自反复拧它们，所以这是实实在在的风险。）当然，留出数据会减少可用于训练的数据量。这可以用交叉验证来缓解：把训练数据随机切成（比如）10 份，每次留出 1 份、在其余 9 份上训练，再用各次学到的分类器测试它没见过的那份，最后把结果取平均，以评估某个参数设置的好坏。

**P3 原文**

> In the early days of machine learning, the need to keep training and test data separate was not widely appreciated. This was partly because, if the learner has a very limited representation (for example, hyperplanes), the difference between training and test error may not be large. But with very flexible classifiers (for example, decision trees), or even with linear classifiers with a lot of features, strict separation is mandatory.

**重点词汇**

- **appreciated**（被认识到、被重视）。
- **flexible classifier**（灵活的分类器）：表示能力强的模型更容易过拟合。
- **mandatory**（强制性的）。

**译文**

在机器学习早期，"训练与测试数据必须分开"这一点并没有被广泛认识。部分原因是：如果学习器的表示能力很有限（例如超平面），训练误差和测试误差的差距可能不大。但对于非常灵活的分类器（例如决策树），甚至特征很多的线性分类器，严格分离就是硬性要求。

**P4 原文**

> Notice that generalization being the goal has an interesting consequence for machine learning. Unlike in most other optimization problems, we do not have access to the function we want to optimize! We have to use training error as a surrogate for test error, and this is fraught with danger. (How to deal with it is addressed later.) On the positive side, since the objective function is only a proxy for the true goal, we may not need to fully optimize it; in fact, a local optimum returned by simple greedy search may be better than the global optimum.

**重点词汇**

- **have access to**（能拿到、接触到）。
- **surrogate**（替身、代理）：训练误差只是测试误差的替身。
- **fraught with danger**（险象环生）。
- **proxy**（代理指标）。
- **local optimum / global optimum**（局部最优 / 全局最优）。

**译文**

注意，"泛化是目标"给机器学习带来一个有趣的后果：与大多数其他优化问题不同，我们拿不到想要优化的那个函数！只能用训练误差作为测试误差的替身，而这是险象环生的（如何应对后文讨论）。往好处想：既然目标函数只是真实目标的代理，我们未必需要把它优化到底——事实上，简单贪心搜索返回的局部最优，可能比全局最优还要好。

**备注**：这是全篇最有"反直觉"色彩的观点之一。过度优化训练集 = 过度拟合训练集的怪癖；停在局部最优反而是一种隐式正则化。

---

## 3. 只有数据是不够的（Data Alone Is Not Enough）

**P1 原文**

> Generalization being the goal has another major consequence: Data alone is not enough, no matter how much of it you have. Consider learning a Boolean function of (say) 100 variables from a million examples. There are $2^{100} - 10^6$ examples whose classes you do not know. How do you figure out what those classes are? In the absence of further information, there is just no way to do this that beats flipping a coin. This observation was first made (in somewhat different form) by the philosopher David Hume over 200 years ago, but even today many mistakes in machine learning stem from failing to appreciate it. Every learner must embody some knowledge or assumptions beyond the data it is given in order to generalize beyond it. This notion was formalized by Wolpert in his famous "no free lunch" theorems, according to which no learner can beat random guessing over all possible functions to be learned.

**重点词汇**

- **in the absence of**（在没有……的情况下）。
- **flip a coin**（抛硬币）：纯瞎猜。
- **embody**（体现、内嵌）。
- **"no free lunch" theorems**（没有免费午餐定理）：Wolpert 证明，对所有可能的目标函数取平均，任何学习器都不比随机猜测强。

**译文**

"泛化是目标"还带来另一个重大推论：无论数据有多少，只有数据是不够的。考虑从 100 万个样本中学习一个 100 变量的布尔函数：还有 $2^{100} - 10^6$ 个样本的类别你不知道。在没有进一步信息的情况下，除了抛硬币，没有任何办法猜出它们的类别。这个观察最早由哲学家休谟（David Hume）在 200 多年前提出（形式略有不同），但直到今天，机器学习中的许多错误仍源于没有领会它。每个学习器都必须在数据之外内嵌某些知识或假设，才能泛化到数据之外。这一思想由 Wolpert 的著名"没有免费午餐"定理形式化：对所有可能要学的函数而言，没有任何学习器能击败随机猜测。

**P2 原文**

> This seems like rather depressing news. How then can we ever hope to learn anything? Luckily, the functions we want to learn in the real world are not drawn uniformly from the set of all mathematically possible functions! In fact, very general assumptions—like smoothness, similar examples having similar classes, limited dependences, or limited complexity—are often enough to do very well, and this is a large part of why machine learning has been so successful. Like deduction, induction (what learners do) is a knowledge lever: it turns a small amount of input knowledge into a large amount of output knowledge. Induction is a vastly more powerful lever than deduction, requiring much less input knowledge to produce useful results, but it still needs more than zero input knowledge to work. And, as with any lever, the more we put in, the more we can get out.

**重点词汇**

- **be drawn uniformly from**（从……中均匀抽取）。
- **smoothness**（平滑性）、**limited dependences**（依赖有限）、**limited complexity**（复杂度有限）：常见的先验假设。
- **induction / deduction**（归纳 / 演绎）：归纳 = 从样本到规律（学习器做的事）；演绎 = 从公理到结论。
- **lever**（杠杆）：知识的放大器。

**译文**

这听起来挺令人沮丧：那我们还能学到东西吗？幸运的是，现实世界中我们要学的函数并不是从"所有数学上可能的函数"里均匀抽出来的！事实上，一些非常一般的假设——平滑性、相似样本具有相似类别、依赖关系有限、复杂度有限——往往就足以做得很好，这也是机器学习如此成功的重要原因。与演绎一样，归纳（学习器所做的）是一根知识杠杆：它把少量的输入知识放大成大量的输出知识。归纳是比演绎强大得多的杠杆——用少得多的输入知识就能产出有用的结果——但它仍然需要大于零的输入知识才能工作。而且，和任何杠杆一样，投入越多，产出越多。

**P3 原文**

> A corollary of this is that one of the key criteria for choosing a representation is which kinds of knowledge are easily expressed in it. For example, if we have a lot of knowledge about what makes examples similar in our domain, instance-based methods may be a good choice. If we have knowledge about probabilistic dependencies, graphical models are a good fit. And if we have knowledge about what kinds of preconditions are required by each class, "IF . . . THEN . . ." rules may be the best option. The most useful learners in this regard are those that do not just have assumptions hardwired into them, but allow us to state them explicitly, vary them widely, and incorporate them automatically into the learning (for example, using first-order logic or grammars).

**重点词汇**

- **corollary**（推论）。
- **instance-based methods**（基于实例的方法）：如 kNN，适合表达"相似性"知识。
- **graphical models**（图模型）：适合表达概率依赖。
- **"IF…THEN…" rules**（规则）：适合表达前提条件。
- **hardwired**（写死的）：对比"可显式声明的先验"。
- **first-order logic**（一阶逻辑）、**grammars**（文法）。

**译文**

由此得到一个推论：选择表示的关键标准之一，是哪类知识在它里面容易表达。例如，如果我们对领域中"什么让样本相似"有很多知识，基于实例的方法可能是好选择；如果拥有概率依赖方面的知识，图模型很合适；如果知道每个类别需要什么前提条件，"IF…THEN…"规则可能是最佳选项。在这方面最有用的学习器，是那些不只把假设写死在内部，还允许我们显式声明、大幅调整并自动把它们融入学习过程的学习器（例如使用一阶逻辑或文法）。

**P4 原文**

> In retrospect, the need for knowledge in learning should not be surprising. Machine learning is not magic; it cannot get something from nothing. What it does is get more from less. Programming, like all engineering, is a lot of work: we have to build everything from scratch. Learning is more like farming, which lets nature do most of the work. Farmers combine seeds with nutrients to grow crops. Learners combine knowledge with data to grow programs.

**重点词汇**

- **in retrospect**（回过头看）。
- **get something from nothing**（无中生有）；**get more from less**（从少变多）。
- **from scratch**（从零开始）；**farming**（耕作）。

**译文**

回过头看，学习中需要知识并不奇怪。机器学习不是魔法，不能无中生有；它做的是"从少变多"。编程（像一切工程一样）是大量劳作：一切都要从零搭建。学习更像农业：让自然替你干大部分活。农民把种子和养料结合，长出庄稼；学习器把知识和数据结合，长出程序。

**备注**："编程 vs 耕作"是全文最著名的比喻之一——学习不是替代工程，而是换一种杠杆效率更高的生产方式。

---

## 4. 过拟合有多副面孔（Overfitting Has Many Faces）

**P1 原文**

> What if the knowledge and data we have are not sufficient to completely determine the correct classifier? Then we run the risk of just hallucinating a classifier (or parts of it) that is not grounded in reality, and is simply encoding random quirks in the data. This problem is called overfitting, and is the bugbear of machine learning. When your learner outputs a classifier that is 100% accurate on the training data but only 50% accurate on test data, when in fact it could have output one that is 75% accurate on both, it has overfit.

**重点词汇**

- **hallucinate**（凭空造出、产生幻觉）：注意这个词 2012 年就出现了，如今 LLM 时代成了高频词。
- **grounded in reality**（有现实根基）。
- **quirk**（怪癖）：数据里的随机波动。
- **bugbear**（心腹大患）。
- **overfit**（过拟合）。

**译文**

如果我们拥有的知识和数据不足以完全确定正确的分类器呢？那就有风险凭空"幻觉"出一个（或部分）没有现实根基的分类器——它只是在编码数据中的随机怪癖。这个问题叫作过拟合（overfitting），是机器学习的心腹大患。当你的学习器输出的分类器在训练数据上 100% 准确、在测试数据上只有 50% 准确，而它本可以输出一个两边都 75% 准确的分类器时，它就过拟合了。

**P2 原文**

> Everyone in machine learning knows about overfitting, but it comes in many forms that are not immediately obvious. One way to understand overfitting is by decomposing generalization error into bias and variance. Bias is a learner's tendency to consistently learn the same wrong thing. Variance is the tendency to learn random things irrespective of the real signal. Figure 1 illustrates this by an analogy with throwing darts at a board. A linear learner has high bias, because when the frontier between two classes is not a hyperplane the learner is unable to induce it. Decision trees do not have this problem because they can represent any Boolean function, but on the other hand they can suffer from high variance: decision trees learned on different training sets generated by the same phenomenon are often very different, when in fact they should be the same.

**重点词汇**

- **decompose**（分解）：泛化误差 = 偏差 + 方差（+ 噪声）。
- **bias**（偏差）：一贯学错同一个东西的倾向——系统性错误。
- **variance**（方差）：无视真实信号、学到随机东西的倾向——对训练集的敏感度。
- **dart-throwing**（掷飞镖）：理解偏差-方差的经典类比。
- **frontier**（边界、分界面）：即决策边界。
- **induce**（归纳出）。

**译文**

机器学习人人都知道过拟合，但它有许多并不一眼可见的形态。理解过拟合的一种方式，是把泛化误差分解为偏差（bias）和方差（variance）。偏差是学习器"一贯学错同一个东西"的倾向；方差是学习器"无视真实信号、学到随机东西"的倾向。图 1 用掷飞镖作类比说明这一点。线性学习器偏差高：当两类之间的边界不是超平面时，它归纳不出来；但它的方差低。决策树没有这个偏差问题（能表示任何布尔函数），但方差可能很高：由同一现象生成的不同训练集学出的决策树往往差异巨大——而理论上它们本应相同。

**配图说明（Figure 1）**：四张飞镖靶。高偏差 = 镖整体偏离靶心（系统性偏）；高方差 = 镖散布很开（随机性大）；理想是低偏差 + 低方差（又准又稳）。左上：低方差高偏差（扎得很紧但整体偏了）；右上：高方差高偏差（又偏又散）；左下：低偏差高方差（围绕靶心但散开）；右下：低偏差低方差（全部命中靶心附近）。

**P3 原文**

> Similar reasoning applies to the choice of optimization method: beam search has lower bias than greedy search, but higher variance, because it tries more hypotheses. Thus, contrary to intuition, a more powerful learner is not necessarily better than a less powerful one.

**重点词汇**

- **beam search**（束搜索）：保留多条候选路径，比贪心（只走当前最优）探索更多。
- **contrary to intuition**（与直觉相反）：更强的学习器不一定更好。

**译文**

类似的推理也适用于优化方法的选择：束搜索比贪心搜索偏差更低，但方差更高，因为它尝试更多假设。因此，与直觉相反，更强大的学习器不一定优于更弱的学习器。

**P4 原文**

> Figure 2 illustrates this. Even though the true classifier is a set of rules, with up to 1,000 examples naive Bayes is more accurate than a rule learner. This happens despite naive Bayes's false assumption that the frontier is linear! Situations like this are common in machine learning: strong false assumptions can be better than weak true ones, because a learner with the latter needs more data to avoid overfitting.

**重点词汇**

- **naive Bayes**（朴素贝叶斯）：假设特征相互独立（"强而假"的假设）。
- **strong false assumptions vs weak true ones**（强而假的假设 vs 弱而真的假设）：小数据时前者常胜。

**译文**

图 2 说明了这一点：即使真实分类器就是一组规则，在样本量不超过 1000 时，朴素贝叶斯也比规则学习器（C4.5rules）更准——尽管朴素贝叶斯"边界是线性"的假设是错的！这种情形在机器学习里很常见：强而假的假设可以胜过弱而真的假设，因为后者需要更多数据才能避免过拟合。

**配图说明（Figure 2）**：横轴为样本数（10 → 10000，对数刻度），纵轴为测试集准确率。朴素贝叶斯（红线）小样本时起点高、快速上升，约 70% 处趋平；C4.5rules（黄线）小样本时更低，约 1000 个样本后反超。脚注说明：实验用 64 个布尔特征、按一组 IF…THEN 规则生成类别，曲线为 100 次随机实验的平均。

**P5 原文**

> Cross-validation can help to combat overfitting, for example by using it to choose the best size of decision tree to learn. But it is no panacea, since if we use it to make too many parameter choices it can itself start to overfit. Besides cross-validation, there are many methods to combat overfitting. The most popular one is adding a regularization term to the evaluation function. This can, for example, penalize classifiers with more structure, thereby favoring smaller ones with less room to overfit. Another option is to perform a statistical significance test like chi-square before adding new structure, to decide whether the distribution of the class really is different with and without this structure. These techniques are particularly useful when data is very scarce. Nevertheless, you should be skeptical of claims that a particular technique "solves" the overfitting problem. It is easy to avoid overfitting (variance) by falling into the opposite error of underfitting (bias). Simultaneously avoiding both requires learning a perfect classifier, and short of knowing it in advance there is no single technique that will always do best (no free lunch).

**重点词汇**

- **panacea**（万灵药）：交叉验证也不是。
- **regularization term**（正则化项）：惩罚复杂模型。
- **penalize**（惩罚）。
- **statistical significance test**（统计显著性检验）、**chi-square**（卡方检验）。
- **scarce**（稀缺的）。
- **underfitting**（欠拟合）：过拟合的反面，偏差过大。

**译文**

交叉验证可以帮助对抗过拟合，例如用它来选择决策树的最佳规模。但它不是万灵药：如果用它做太多参数选择，它自己也会开始过拟合。除了交叉验证，对抗过拟合的方法还有很多。最流行的是在评估函数中加入正则化项，例如惩罚结构更多的分类器，从而偏向更小、更没有过拟合余地的分类器。另一个选项是在添加新结构之前先做统计显著性检验（如卡方检验），判断加上与不加这个结构时类别分布是否真的不同。这些技术在数据非常稀缺时特别有用。尽管如此，对"某项技术彻底解决了过拟合"的说法应保持怀疑：避开过拟合（方差）很容易掉进相反的错误——欠拟合（偏差）。同时避开两者需要学出完美分类器，而在无法预知它的前提下，没有任何一种技术总能做到最好（没有免费午餐）。

**P6 原文**

> A common misconception about overfitting is that it is caused by noise, like training examples labeled with the wrong class. This can indeed aggravate overfitting, by making the learner draw a capricious frontier to keep those examples on what it thinks is the right side. But severe overfitting can occur even in the absence of noise. For instance, suppose we learn a Boolean classifier that is just the disjunction of the examples labeled "true" in the training set. (In other words, the classifier is a Boolean formula in disjunctive normal form, where each term is the conjunction of the feature values of one specific training example.) This classifier gets all the training examples right and every positive test example wrong, regardless of whether the training data is noisy or not.

**重点词汇**

- **misconception**（误解）：过拟合 ≠ 噪声的产物。
- **aggravate**（加剧）。
- **capricious**（反复无常的）：为迁就噪声样本画出的任意边界。
- **disjunction / conjunction**（析取 / 合取）：或 / 与。
- **disjunctive normal form（DNF）**（析取范式）。

**译文**

关于过拟合的一个常见误解是：它由噪声引起，比如训练样本被标错类。这确实会加剧过拟合——学习器会画出一条反复无常的边界，把这些样本圈到它认为正确的一侧。但即使没有噪声，严重的过拟合也会发生。例如，假设我们学习一个布尔分类器，它就是训练集中被标为"真"的样本的析取（换句话说，这个分类器是一个析取范式的布尔公式，其中每一项是一个具体训练样本特征值的合取）。这个分类器在训练样本上全对，但在每一个"真"的测试样本上都错——无论训练数据有没有噪声。

**P7 原文**

> The problem of multiple testing is closely related to overfitting. Standard statistical tests assume that only one hypothesis is being tested, but modern learners can easily test millions before they are done. As a result what looks significant may in fact not be. For example, a mutual fund that beats the market 10 years in a row looks very impressive, until you realize that, if there are 1,000 funds and each has a 50% chance of beating the market on any given year, it is quite likely that one will succeed all 10 times just by luck. This problem can be combatted by correcting the significance tests to take the number of hypotheses into account, but this can also lead to underfitting. A better approach is to control the fraction of falsely accepted non-null hypotheses, known as the false discovery rate.

**重点词汇**

- **multiple testing**（多重检验）：检验次数越多，纯靠运气"显著"的越多。
- **mutual fund**（共同基金）；**10 years in a row**（连续 10 年）。
- **false discovery rate（FDR）**（错误发现率）：Benjamini–Hochberg 提出，控制"被错判为显著"的比例。

**译文**

多重检验问题与过拟合密切相关。标准统计检验假设只检验一个假设，但现代学习器完工之前轻松检验数百万个。结果，看似显著的结论可能其实不显著。例如，一只连续 10 年跑赢市场的共同基金看起来非常厉害——但一旦意识到：如果有 1000 只基金、每只每年各有 50% 的概率跑赢市场，那么某只基金纯属运气连赢 10 次的概率其实相当大，印象就打折扣了。这个问题可以通过校正显著性检验、把假设数量考虑进来加以对抗，但这又可能导致欠拟合。更好的做法是控制"被错误接受的非空假设"的比例，即所谓的**错误发现率**（false discovery rate）。

---

## 5. 直觉在高维会失灵（Intuition Fails in High Dimensions）

**P1 原文**

> After overfitting, the biggest problem in machine learning is the curse of dimensionality. This expression was coined by Bellman in 1961 to refer to the fact that many algorithms that work fine in low dimensions become intractable when the input is high-dimensional. But in machine learning it refers to much more. Generalizing correctly becomes exponentially harder as the dimensionality (number of features) of the examples grows, because a fixed-size training set covers a dwindling fraction of the input space. Even with a moderate dimension of 100 and a huge training set of a trillion examples, the latter covers only a fraction of about $10^{-18}$ of the input space. This is what makes machine learning both necessary and hard.

**重点词汇**

- **curse of dimensionality**（维度灾难）：本文第二大主题。
- **coin**（创造新词，动词）。
- **intractable**（难以为继、不可解）。
- **dwindling**（日益缩水的）。
- **a trillion**（一万亿）。

**译文**

过拟合之后，机器学习最大的问题就是维度灾难（curse of dimensionality）。这个说法由 Bellman 在 1961 年创造，指许多在低维工作良好的算法在高维输入下变得难以为继。但在机器学习里它的含义远不止于此：随着样本维度（特征数量）增长，正确泛化呈指数级变难，因为固定大小的训练集覆盖的输入空间比例日渐缩水。即使维度只有 100、训练集多达一万亿样本，后者也只覆盖输入空间的约 $10^{-18}$。这正是机器学习"既必要又困难"的原因。

**P2 原文**

> More seriously, the similarity-based reasoning that machine learning algorithms depend on (explicitly or implicitly) breaks down in high dimensions. Consider a nearest neighbor classifier with Hamming distance as the similarity measure, and suppose the class is just x₁ ∧ x₂. If there are no other features, this is an easy problem. But if there are 98 irrelevant features x₃, …, x₁₀₀, the noise from them completely swamps the signal in x₁ and x₂, and nearest neighbor effectively makes random predictions.

**重点词汇**

- **similarity-based reasoning**（基于相似性的推理）：kNN 等算法的根基。
- **break down**（崩溃、失灵）。
- **Hamming distance**（汉明距离）。
- **irrelevant features**（无关特征）。
- **swamp**（淹没）。

**译文**

更严重的是，机器学习算法赖以工作的相似性推理（无论显式还是隐式）在高维下会崩溃。考虑以汉明距离为相似度的最近邻分类器，假设类别就是 $x_1 \land x_2$。如果没有其他特征，这是道容易的题。但如果有 98 个无关特征 $x_3, \dots, x_{100}$，来自它们的噪声会彻底淹没 $x_1$ 和 $x_2$ 中的信号，最近邻实际上在做随机预测。

**P3 原文**

> Even more disturbing is that nearest neighbor still has a problem even if all 100 features are relevant! This is because in high dimensions all examples look alike. Suppose, for instance, that examples are laid out on a regular grid, and consider a test example x_t. If the grid is d-dimensional, x_t's 2d nearest examples are all at the same distance from it. So as the dimensionality increases, more and more examples become nearest neighbors of x_t, until the choice of nearest neighbor (and therefore of class) is effectively random.

**重点词汇**

- **look alike**（看起来都一样）。
- **regular grid**（规则网格）。
- **2d nearest examples**（2d 个最近样本）：d 维网格中每个点有 2d 个等距"最近邻"。

**译文**

更令人不安的是，即使 100 个特征全部相关，最近邻照样有问题！原因是高维中所有样本都彼此相像。设想样本铺在一个规则网格上，考察测试样本 x_t：如果网格是 d 维的，x_t 有 2d 个最近样本与它等距。于是维度越高，"并列最近邻"的样本越多，直到最近邻（以及类别）的选择实际上变成随机。

**P4 原文**

> This is only one instance of a more general problem with high dimensions: our intuitions, which come from a three-dimensional world, often do not apply in high-dimensional ones. In high dimensions, most of the mass of a multivariate Gaussian distribution is not near the mean, but in an increasingly distant "shell" around it; and most of the volume of a high-dimensional orange is in the skin, not the pulp. If a constant number of examples is distributed uniformly in a high-dimensional hypercube, beyond some dimensionality most examples are closer to a face of the hypercube than to their nearest neighbor. And if we approximate a hypersphere by inscribing it in a hypercube, in high dimensions almost all the volume of the hypercube is outside the hypersphere. This is bad news for machine learning, where shapes of one type are often approximated by shapes of another.

**重点词汇**

- **multivariate Gaussian distribution**（多元高斯分布）。
- **shell**（壳）：高斯质量集中到远离均值的壳层。
- **hypercube / hypersphere**（超立方体 / 超球面）。
- **inscribe**（内接）。
- **pulp**（果肉）。

**译文**

这只是高维更普遍问题的一个例子：来自三维世界的直觉，在高维常常不适用。高维中，多元高斯分布的大部分质量不在均值附近，而在越来越远的"壳"里；高维橙子的体积大部分在皮上而不是果肉里。如果把恒定数量的样本均匀撒在高维超立方体中，超过某个维度后，大多数样本离超立方体的某个面比离自己的最近邻更近。如果把超球内接于超立方体来近似，高维下超立方体几乎全部体积都在超球之外。这对机器学习是坏消息——因为我们经常用一类形状去近似另一类形状。

**P5 原文**

> Building a classifier in two or three dimensions is easy; we can find a reasonable frontier between examples of different classes just by visual inspection. (It has even been said that if people could see in high dimensions machine learning would not be necessary.) But in high dimensions it is difficult to understand what is happening. This in turn makes it difficult to design a good classifier. Naively, one might think that gathering more features never hurts, since at worst they provide no new information about the class. But in fact their benefits may be outweighed by the curse of dimensionality.

**重点词汇**

- **visual inspection**（目测）。
- **naively**（天真地）："特征越多越好"的常见错觉。
- **outweigh**（超过、压过）。

**译文**

在二维或三维空间构建分类器很容易：光靠目测就能找到不同类别样本之间像样的边界。（甚至有人说，如果人能看见高维，机器学习就没必要存在了。）但在高维中很难看清正在发生什么，这又使设计好分类器变得困难。天真地想，收集更多特征永远不会吃亏——最坏也不过是提供不了关于类别的新信息。但实际上，特征带来的好处可能被维度灾难反噬。

**P6 原文**

> Fortunately, there is an effect that partly counteracts the curse, which might be called the "blessing of nonuniformity." In most applications examples are not spread uniformly throughout the instance space, but are concentrated on or near a lower-dimensional manifold. For example, k-nearest neighbor works quite well for handwritten digit recognition even though images of digits have one dimension per pixel, because the space of digit images is much smaller than the space of all possible images. Learners can implicitly take advantage of this lower effective dimension, or algorithms for explicitly reducing the dimensionality can be used (for example, Tenenbaum).

**重点词汇**

- **counteract**（抵消）。
- **blessing of nonuniformity**（非均匀性之福）：与"灾难"相对的作者式命名。
- **lower-dimensional manifold**（低维流形）：数据实际集中在低维结构附近。
- **dimensionality reduction**（降维）：如 Tenenbaum 的 Isomap。

**译文**

幸运的是，有一种效应能部分抵消维度灾难，可以称之为"非均匀性之福"（blessing of nonuniformity）。在大多数应用中，样本并非均匀铺满整个实例空间，而是集中在一个低维流形上或其附近。例如 k 近邻在手写数字识别上效果相当好，尽管数字图像每个像素是一维——因为数字图像空间远小于所有可能图像的空间。学习器可以隐式利用这个更低的有效维度，也可以使用显式降维算法（例如 Tenenbaum 的 Isomap）。

**备注**：这一段是后来"流形学习"与深度表征学习思想的先声——数据内在维度远低于表面维度，是高维学习可行的根本原因。

---

## 6. 理论保证并非看上去那样（Theoretical Guarantees Are Not What They Seem）

**P1 原文**

> Machine learning papers are full of theoretical guarantees. The most common type is a bound on the number of examples needed to ensure good generalization. What should you make of these guarantees? First of all, it is remarkable that they are even possible. Induction is traditionally contrasted with deduction: in deduction you can guarantee that the conclusions are correct; in induction all bets are off. Or such was the conventional wisdom for many centuries. One of the major developments of recent decades has been the realization that in fact we can have guarantees on the results of induction, particularly if we are willing to settle for probabilistic guarantees.

**重点词汇**

- **theoretical guarantee**（理论保证）、**bound**（界）。
- **all bets are off**（一切都无法保证）。
- **conventional wisdom**（传统看法）。
- **settle for**（退而求其次、满足于）：接受概率性保证。

**译文**

机器学习论文里满是理论保证。最常见的一类是"确保良好泛化所需样本数"的界。该怎么看待这些保证？首先，它们竟然可能存在，本身就了不起。归纳传统上与演绎相对：演绎能保证结论正确，归纳则一切皆无保证——许多世纪以来人们一直这么认为。近几十年的重大进展之一，就是意识到我们其实可以对归纳的结果给出保证——尤其是当我们愿意接受概率性保证时。

> [!quote] 原文侧栏引语
> One of the major developments of recent decades has been the realization that we can have guarantees on the results of induction, particularly if we are willing to settle for probabilistic guarantees.
> （近几十年的一大进展是：我们意识到可以对归纳的结果给出保证——尤其是当我们愿意接受概率性保证时。）

**P2 原文**

> The basic argument is remarkably simple. Let's say a classifier is bad if its true error rate is greater than ε. Then the probability that a bad classifier is consistent with n random, independent training examples is less than (1 − ε)ⁿ. Let b be the number of bad classifiers in the learner's hypothesis space H. The probability that at least one of them is consistent is less than b(1 − ε)ⁿ, by the union bound. Assuming the learner always returns a consistent classifier, the probability that this classifier is bad is then less than |H|(1 − ε)ⁿ, where we have used the fact that b ≤ |H|. So if we want this probability to be less than δ, it suffices to make n > ln(δ/|H|)/ ln(1 − ε) ≥ 1/ε (ln |H| + ln 1/δ).

**重点词汇**

- **error rate**（错误率）：真实错误率 > ε 即为"坏"分类器。
- **consistent**（一致的）：与所有训练样本零冲突。
- **union bound**（联合界 / 并集界）：多个事件至少一个发生的概率 ≤ 各概率之和。

**译文**

基本论证异常简单。称一个分类器为"坏"的，如果它的真实错误率大于 ε。那么一个坏分类器与 n 个随机独立训练样本都一致的概率小于 $(1-\varepsilon)^n$。设 b 是学习器假设空间 H 中坏分类器的个数，由联合界，其中至少一个与全部样本一致的概率小于 $b(1-\varepsilon)^n$。假设学习器总是返回一致的分类器，那么该分类器是坏分类器的概率小于 $|H|(1-\varepsilon)^n$（用到 b ≤ |H|）。要让这个概率小于 δ，只需 $n > \ln(\delta/|H|) / \ln(1-\varepsilon) \geq \frac{1}{\varepsilon}\left(\ln|H| + \ln\frac{1}{\delta}\right)$。

**P3 原文**

> Unfortunately, guarantees of this type have to be taken with a large grain of salt. This is because the bounds obtained in this way are usually extremely loose. The wonderful feature of the bound above is that the required number of examples only grows logarithmically with |H| and 1/δ. Unfortunately, most interesting hypothesis spaces are doubly exponential in the number of features d, which still leaves us needing a number of examples exponential in d. For example, consider the space of Boolean functions of d Boolean variables. If there are e possible different examples, there are 2ᵉ possible different functions, so since there are 2ᵈ possible examples, the total number of functions is $2^{2^d}$. And even for hypothesis spaces that are "merely" exponential, the bound is still very loose, because the union bound is very pessimistic. For example, if there are 100 Boolean features and the hypothesis space is decision trees with up to 10 levels, to guarantee δ = ε = 1% in the bound above we need half a million examples. But in practice a small fraction of this suffices for accurate learning.

**重点词汇**

- **take with a (large) grain of salt**（对……大打折扣地听）。
- **loose**（松）：界远大于实际需求。
- **doubly exponential**（双重指数）：$2^{2^d}$。
- **pessimistic**（悲观）：联合界把所有坏分类器当独立事件，高估了概率。

**译文**

不幸的是，这类保证得打个大折扣来听，因为这样得到的界通常极其松。上面这个界的迷人之处在于：所需样本数只随 |H| 和 1/δ 对数增长。糟糕的是，最有意思的那些假设空间关于特征数 d 是双重指数的——于是仍然需要关于 d 指数级的样本数。例如，d 个布尔变量的布尔函数空间：如果有 e 个可能的样本，就有 2ᵉ 个可能的函数；由于有 2ᵈ 个可能样本，函数总数是 $2^{2^d}$。而且即使对"只"是指数级的假设空间，界依然很松，因为联合界非常悲观。比如：100 个布尔特征、假设空间是至多 10 层的决策树，要按上面的界保证 δ = ε = 1%，需要 50 万个样本；但实际上，其中一小部分就足以学得很准。

**P4 原文**

> Further, we have to be careful about what a bound like this means. For instance, it does not say that, if your learner returned a hypothesis consistent with a particular training set, then this hypothesis probably generalizes well. What it says is that, given a large enough training set, with high probability your learner will either return a hypothesis that generalizes well or be unable to find a consistent hypothesis. The bound also says nothing about how to select a good hypothesis space. It only tells us that, if the hypothesis space contains the true classifier, then the probability that the learner outputs a bad classifier decreases with training set size.

**重点词汇**

- **hypothesis**（假设）：即候选分类器。
- **says nothing about**（对……只字未提）。

**译文**

此外，必须小心理解这种界的含义。例如它并没有说：如果你的学习器返回了与某个具体训练集一致的假设，这个假设大概率泛化良好。它说的是：给定足够大的训练集，学习器大概率要么返回泛化良好的假设，要么根本找不到一致的假设。这个界对"如何选择好的假设空间"也只字未提：它只告诉我们，如果假设空间包含真实分类器，学习器输出坏分类器的概率会随训练集增大而下降。

**P5 原文**

> If we shrink the hypothesis space, the bound improves, but the chances that it contains the true classifier shrink also. (There are bounds for the case where the true classifier is not in the hypothesis space, but similar considerations apply to them.)

**重点词汇**

- **shrink**（收缩）：空间越小界越好，但"包含真解"的机会也越小——典型的权衡。

**译文**

收缩假设空间，界会变好，但空间包含真实分类器的机会也变小。（真实分类器不在假设空间中的情形也有相应的界，但类似的考量同样适用。）

**P6 原文**

> Another common type of theoretical guarantee is asymptotic: given infinite data, the learner is guaranteed to output the correct classifier. This is reassuring, but it would be rash to choose one learner over another because of its asymptotic guarantees. In practice, we are seldom in the asymptotic regime (also known as "asymptopia"). And, because of the bias-variance trade-off I discussed earlier, if learner A is better than learner B given infinite data, B is often better than A given finite data.

**重点词汇**

- **asymptotic**（渐近的）。
- **asymptopia**（"渐近乌托邦"）：作者生造的幽默词，指"数据无穷多"的理想国。
- **trade-off**（权衡）：偏差-方差权衡。

**译文**

另一类常见的理论保证是渐近性的：给定无限数据，学习器保证输出正确分类器。这听着安心，但仅凭渐近保证就在学习器之间做取舍是轻率的：实践中我们很少处于渐近状态（有人戏称"渐近乌托邦"）。而且由于前面讨论的偏差-方差权衡，如果学习器 A 在无限数据下优于 B，有限数据下 B 往往反而优于 A。

**P7 原文**

> The main role of theoretical guarantees in machine learning is not as a criterion for practical decisions, but as a source of understanding and driving force for algorithm design. In this capacity, they are quite useful; indeed, the close interplay of theory and practice is one of the main reasons machine learning has made so much progress over the years. But caveat emptor: learning is a complex phenomenon, and just because a learner has a theoretical justification and works in practice does not mean the former is the reason for the latter.

**重点词汇**

- **in this capacity**（以这个身份、就这点而言）。
- **interplay**（互动、相互作用）。
- **caveat emptor**（买者自慎，拉丁语）：文中的意思是"读者须自我警惕"。

**译文**

理论保证在机器学习中的主要角色，不是作为实践决策的准则，而是理解的源泉和算法设计的驱动力。就后者而言它们相当有用；事实上，理论与实践的紧密互动，正是机器学习这些年进步巨大的主要原因之一。但买者自慎（caveat emptor）：学习是复杂现象，一个学习器既有理论依据又在实践中管用，并不意味着前者就是后者起效的原因。

---

## 7. 特征工程是关键（Feature Engineering Is the Key）

**P1 原文**

> At the end of the day, some machine learning projects succeed and some fail. What makes the difference? Easily the most important factor is the features used. Learning is easy if you have many independent features that each correlate well with the class. On the other hand, if the class is a very complex function of the features, you may not be able to learn it. Often, the raw data is not in a form that is amenable to learning, but you can construct features from it that are. This is typically where most of the effort in a machine learning project goes. It is often also one of the most interesting parts, where intuition, creativity and "black art" are as important as the technical stuff.

**重点词汇**

- **at the end of the day**（归根结底）。
- **amenable to**（适合于、易于……的）。
- **correlate well with**（与……高度相关）。
- **black art**（黑魔法、经验玄学）：文中指难以言传的工程经验。

**译文**

归根结底，机器学习项目有的成功有的失败，差别在哪？最重要的因素显然是所用的特征。如果有很多相互独立、且各自与类别相关性好的特征，学习很容易；反之，如果类别是特征的非常复杂的函数，你可能根本学不出来。原始数据往往不适合直接学习，但你可以从中构造适合的特征——机器学习项目的大部分精力通常就花在这里。这往往也是最有意思的部分之一：直觉、创造力和"黑魔法"与硬核技术同等重要。

**P2 原文**

> First-timers are often surprised by how little time in a machine learning project is spent actually doing machine learning. But it makes sense if you consider how time-consuming it is to gather data, integrate it, clean it and preprocess it, and how much trial and error can go into feature design. Also, machine learning is not a one-shot process of building a dataset and running a learner, but rather an iterative process of running the learner, analyzing the results, modifying the data and/or the learner, and repeating. Learning is often the quickest part of this, but that is because we have already mastered it pretty well!

**重点词汇**

- **first-timer**（新手）。
- **trial and error**（试错）。
- **one-shot**（一次性的）vs **iterative**（迭代的）：机器学习项目是循环往复的。

**译文**

新手常常惊讶：机器学习项目里真正"做机器学习"的时间是多么少。但想想就合理了：收集数据、整合、清洗、预处理非常耗时，特征设计的试错也可能没完没了。而且机器学习不是"建一个数据集、跑一次学习器"的一锤子买卖，而是"跑学习器 → 分析结果 → 修改数据和/或学习器 → 再来"的迭代过程。学习往往是其中最快的环节——只是因为我们已经把它掌握得足够好！

**P3 原文**

> Feature engineering is more difficult because it is domain-specific, while learners can be largely general purpose. However, there is no sharp frontier between the two, and this is another reason the most useful learners are those that facilitate incorporating knowledge. Of course, one of the holy grails of machine learning is to automate more and more of the feature engineering process. One way this is often done today is by automatically generating large numbers of candidate features and selecting the best by (say) their information gain with respect to the class. But bear in mind that features that look irrelevant in isolation may be relevant in combination. For example, if the class is an XOR of k input features, each of them by itself carries no information about the class. (If you want to annoy machine learners, bring up XOR.) On the other hand, running a learner with a very large number of features to find out which ones are useful in combination may be too time-consuming, or cause overfitting. So there is ultimately no replacement for the smarts you put into feature engineering.

**重点词汇**

- **domain-specific**（领域特定的）vs **general purpose**（通用的）。
- **holy grail**（圣杯）：终极目标。
- **XOR（异或）**：单个特征与类别零相关、组合后完全决定类别的经典反例。
- **annoy**（惹恼）："跟机器学习研究者提 XOR"是圈内玩笑。
- **smarts**（巧思、脑子）。

**译文**

特征工程之所以更难，是因为它高度依赖领域，而学习器大体上是通用的。不过两者之间没有清晰边界——这也是"最有用的学习器是便于融入知识的学习器"的另一个原因。当然，机器学习的圣杯之一就是把越来越多的特征工程自动化。如今常见的做法是自动生成大量候选特征，再按（比如说）与类别的信息增益选出最好的。但请记住：孤立看毫不相干的特征，组合起来可能至关重要。例如类别是 k 个输入特征的 XOR（异或）时，每个特征单独都不携带任何类别信息。（想惹恼机器学习研究者，就跟他们聊 XOR。）反过来，带着海量特征跑学习器去找哪些组合有用，可能太耗时，也可能导致过拟合。所以归根到底，你在特征工程里倾注的巧思无可替代。

**备注**：2012 年写下"自动化特征工程是圣杯"；今天表示学习/深度学习在一定程度上兑现了它——但表格数据领域的手工特征工程依然是性价比之王。

---

## 8. 更多数据胜过更聪明的算法（More Data Beats a Cleverer Algorithm）

**P1 原文**

> Suppose you have constructed the best set of features you can, but the classifiers you receive are still not accurate enough. What can you do now? There are two main choices: design a better learning algorithm, or gather more data (more examples, and possibly more raw features, subject to the curse of dimensionality). Machine learning researchers are mainly concerned with the former, but pragmatically the quickest path to success is often to just get more data. As a rule of thumb, a dumb algorithm with lots and lots of data beats a clever one with modest amounts of it. (After all, machine learning is all about letting data do the heavy lifting.)

**重点词汇**

- **pragmatically**（务实地）。
- **rule of thumb**（经验法则）。
- **dumb**（笨的）。
- **heavy lifting**（重活、苦力）。

**译文**

假设你已经构造出能力范围内最好的特征，但拿到的分类器仍然不够准。现在能做什么？两个主要选择：设计更好的学习算法，或收集更多数据（更多样本，可能还有更多原始特征——但受维度灾难制约）。机器学习研究者主要关心前者，但务实地讲，通往成功的最短路径常常就是搞更多数据。经验法则是：**笨算法 + 海量数据 > 聪明算法 + 少量数据**。（毕竟，机器学习的本义就是让数据干重活。）

> [!quote] 原文侧栏引语
> A dumb algorithm with lots and lots of data beats a clever one with modest amounts of it.
> （笨算法 + 大量数据，胜过聪明算法 + 少量数据。）

**P2 原文**

> This does bring up another problem, however: scalability. In most of computer science, the two main limited resources are time and memory. In machine learning, there is a third one: training data. Which one is the bottleneck has changed from decade to decade. In the 1980s it tended to be data. Today it is often time. Enormous mountains of data are available, but there is not enough time to process it, so it goes unused. This leads to a paradox: even though in principle more data means that more complex classifiers can be learned, in practice simpler classifiers wind up being used, because complex ones take too long to learn. Part of the answer is to come up with fast ways to learn complex classifiers, and indeed there has been remarkable progress in this direction (for example, Hulten and Domingos).

**重点词汇**

- **scalability**（可扩展性）。
- **bottleneck**（瓶颈）：数据 / 时间 / 内存，三十年河东河西。
- **paradox**（悖论）：数据够多但时间不够 → 只好用简单模型。

**译文**

不过这带出另一个问题：可扩展性。计算机科学的大多数领域有两种主要受限资源：时间和内存。机器学习还有第三种：训练数据。哪种是瓶颈，十年一变：1980 年代通常是数据；今天往往是时间——数据堆积如山却来不及处理，只能闲置。于是产生悖论：原则上数据越多能学越复杂的分类器，实际上被使用的却是更简单的分类器，因为复杂的学起来太慢。部分答案是找到学复杂分类器的快速办法，这个方向确实进步惊人（例如 Hulten 与 Domingos 的流式学习工作）。

**P3 原文**

> Part of the reason using cleverer algorithms has a smaller payoff than you might expect is that, to a first approximation, they all do the same. This is surprising when you consider representations as different as, say, sets of rules and neural networks. But in fact propositional rules are readily encoded as neural networks, and similar relationships hold between other representations. All learners essentially work by grouping nearby examples into the same class; the key difference is in the meaning of "nearby." With nonuniformly distributed data, learners can produce widely different frontiers while still making the same predictions in the regions that matter (those with a substantial number of training examples, and therefore also where most test examples are likely to appear). This also helps explain why powerful learners can be unstable but still accurate. Figure 3 illustrates this in 2D; the effect is much stronger in high dimensions.

**重点词汇**

- **payoff**（回报）。
- **to a first approximation**（粗略地说、一阶近似地）。
- **nearby**（邻近）：所有学习器的本质都是"把邻近样本归为一类"，差别只在"邻近"的定义。
- **frontier**（决策边界）。
- **unstable but still accurate**（不稳定但依然准确）。

**译文**

更聪明的算法回报比预期小的部分原因在于：粗略地说，它们干的都是同一件事。考虑到规则集与神经网络这类迥异的表示，这令人意外。但事实上命题规则可以轻易编码为神经网络，其他表示之间也存在类似关系。**所有学习器本质上都做同一件事：把邻近的样本归入同一类——关键差别只在"邻近"的含义。**数据非均匀分布时，学习器可以画出迥异的边界，同时在关键区域（有大量训练样本、因此也大概率是测试样本出现的地方）做出相同预测。这也有助于解释为什么强大的学习器可以不稳定却仍然准确。图 3 在二维平面展示了这一点；高维下这种效应强得多。

**配图说明（Figure 3）**：同一批二维正负样本上，朴素贝叶斯、kNN、SVM、决策树画出的决策边界形状迥异（直线、阶梯、曲线各不相同），但在训练样本密集的区域，它们对绝大多数点的预测一致。

**P4 原文**

> As a rule, it pays to try the simplest learners first (for example, naïve Bayes before logistic regression, k-nearest neighbor before support vector machines). More sophisticated learners are seductive, but they are usually harder to use, because they have more knobs you need to turn to get good results, and because their internals are more opaque.

**重点词汇**

- **it pays to**（……是划算的）。
- **sophisticated**（复杂的、精巧的）。
- **seductive**（诱人的）。
- **opaque**（不透明的）：内部难解释。

**译文**

一般来说，先试最简单的学习器是划算的（例如朴素贝叶斯先于逻辑回归，k 近邻先于支持向量机）。更复杂的学习器很诱人，但通常更难用：要让它们出好结果，要拧的旋钮更多，内部也更不透明。

**P5 原文**

> Learners can be divided into two major types: those whose representation has a fixed size, like linear classifiers, and those whose representation can grow with the data, like decision trees. (The latter are sometimes called nonparametric learners, but this is somewhat unfortunate, since they usually wind up learning many more parameters than parametric ones.) Fixed-size learners can only take advantage of so much data. (Notice how the accuracy of naive Bayes asymptotes at around 70% in Figure 2.) Variable-size learners can in principle learn any function given sufficient data, but in practice they may not, because of limitations of the algorithm (for example, greedy search falls into local optima) or computational cost. Also, because of the curse of dimensionality, no existing amount of data may be enough. For these reasons, clever algorithms—those that make the most of the data and computing resources available—often pay off in the end, provided you are willing to put in the effort. There is no sharp frontier between designing learners and learning classifiers; rather, any given piece of knowledge could be encoded in the learner or learned from data. So machine learning projects often wind up having a significant component of learner design, and practitioners need to have some expertise in it.

**重点词汇**

- **fixed-size vs variable-size**（固定尺寸 vs 可变尺寸）：参数量是否随数据增长。
- **nonparametric**（非参数的）：作者吐槽这个词名不副实。
- **asymptote**（渐近于）：朴素贝叶斯准确率封顶在 70% 左右。
- **fall into local optima**（落入局部最优）。

**译文**

学习器可分两大类：表示尺寸固定的（如线性分类器），和表示可随数据生长的（如决策树）。（后者有时被称为"非参数"学习器，但这个叫法有点不幸——它们最终学出的参数往往比"参数化的"还多。）固定尺寸学习器能利用的数据有限（注意图 2 中朴素贝叶斯的准确率渐近于 70% 左右）；可变尺寸学习器原则上给定足够数据能学任意函数，但实践中未必——受算法局限（例如贪心搜索落入局部最优）或计算成本所限。而且由于维度灾难，再多数据可能都不够。因此，聪明的算法——榨干手头数据和算力的算法——只要你愿意投入精力，往往终有回报。设计学习器与学习分类器之间没有清晰边界：任何一块知识既可以编码进学习器，也可以从数据中学出。所以机器学习项目常常最后都带着不小的"学习器设计"成分，从业者也需要一些这方面的专业能力。

**P6 原文**

> In the end, the biggest bottleneck is not data or CPU cycles, but human cycles. In research papers, learners are typically compared on measures of accuracy and computational cost. But human effort saved and insight gained, although harder to measure, are often more important. This favors learners that produce human-understandable output (for example, rule sets). And the organizations that make the most of machine learning are those that have in place an infrastructure that makes experimenting with many different learners, data sources, and learning problems easy and efficient, and where there is a close collaboration between machine learning experts and application domain ones.

**重点词汇**

- **CPU cycles**（CPU 时间）；**human cycles**（人的时间）：作者的双关。
- **insight**（洞察）。
- **in place**（就位的、建好的）。
- **infrastructure**（基础设施）：能快速实验多学习器/多数据源的平台。

**译文**

最后，最大的瓶颈不是数据也不是 CPU 时间，而是人的时间。研究论文里，学习器通常按准确率和计算成本来比较；但省下的人力与获得的洞察，虽然更难度量，往往更重要。这有利于那些产出人类可理解结果的学习器（例如规则集）。而把机器学习用得最好的组织，是那些建有基础设施、能轻松高效地试验多种学习器/数据源/学习问题、并且机器学习专家与应用领域专家紧密协作的组织。

---

## 9. 学多个模型，而不只是一个（Learn Many Models, Not Just One）

**P1 原文**

> In the early days of machine learning, everyone had a favorite learner, together with some a priori reasons to believe in its superiority. Most effort went into trying many variations of it and selecting the best one. Then systematic empirical comparisons showed that the best learner varies from application to application, and systems containing many different learners started to appear. Effort now went into trying many variations of many learners, and still selecting just the best one. But then researchers noticed that, if instead of selecting the best variation found, we combine many variations, the results are better—often much better—and at little extra effort for the user.

**重点词汇**

- **a priori**（先验的）：凭直觉认定某个学习器最好。
- **systematic empirical comparisons**（系统性实证比较）：如后来的 MNIST/ImageNet 基准文化。
- **combine**（组合）：集成的萌芽。

**译文**

机器学习早期，人人都有自己偏爱的学习器，外加一些相信它优越性的先验理由。大部分精力花在尝试它的许多变体并选出最好的那个。后来，系统性的实证比较表明：最好的学习器因应用而异，包含多种学习器的系统开始出现。精力转向尝试许多学习器的许多变体，但仍然只选最好的那一个。再后来研究者注意到：与其选出最好的变体，不如把许多变体组合起来——结果更好，常常好得多，而用户几乎不用费额外的力气。

**P2 原文**

> Creating such model ensembles is now standard. In the simplest technique, called bagging, we simply generate random variations of the training set by resampling, learn a classifier on each, and combine the results by voting. This works because it greatly reduces variance while only slightly increasing bias. In boosting, training examples have weights, and these are varied so that each new classifier focuses on the examples the previous ones tended to get wrong. In stacking, the outputs of individual classifiers become the inputs of a "higher-level" learner that figures out how best to combine them.

**重点词汇**

- **model ensemble**（模型集成）。
- **bagging（装袋法）**：重采样 → 各学一个 → 投票；降方差不升偏差多少。
- **boosting（提升法）**：样本带权重，新分类器专攻前面学错的样本。
- **stacking（堆叠法）**：各分类器的输出作为更高层学习器的输入。
- **resampling**（重采样）、**voting**（投票）。

**译文**

创建这种模型集成如今已是标准做法。最简单的技术叫 bagging（装袋法）：对训练集重采样生成随机变体，每个变体学一个分类器，结果投票合并。它有效是因为大幅降低方差、只略微增加偏差。boosting（提升法）中训练样本带权重，权重的变化让每个新分类器聚焦于此前分类器经常弄错的样本。stacking（堆叠法）中，各分类器的输出成为一个"更高层"学习器的输入，由它学出最佳组合方式。

**P3 原文**

> Many other techniques exist, and the trend is toward larger and larger ensembles. In the Netflix prize, teams from all over the world competed to build the best video recommender system (http://netflixprize.com). As the competition progressed, teams found they obtained the best results by combining their learners with other teams', and merged into larger and larger teams. The winner and runner-up were both stacked ensembles of over 100 learners, and combining the two ensembles further improved the results. Doubtless we will see even larger ones in the future.

**重点词汇**

- **Netflix Prize**（奈飞百万美元推荐算法大奖赛，2006–2009）。
- **runner-up**（亚军）。
- **stacked ensembles of over 100 learners**（100 多个学习器堆叠的集成）。

**译文**

还有许多其他技术，趋势是集成越来越大。在 Netflix Prize 大奖赛中，世界各地比拼谁能做出最好的视频推荐系统。随着赛程推进，各队发现把自己的学习器与其他队的合并能得到最好结果，队伍随之越并越大。冠军和亚军都是 100 多个学习器堆叠而成的集成，而把两个集成再合并，结果又进一步改善。毫无疑问，未来还会出现更大的集成。

**P4 原文**

> Model ensembles should not be confused with Bayesian model averaging (BMA)—the theoretically optimal approach to learning. In BMA, predictions on new examples are made by averaging the individual predictions of all classifiers in the hypothesis space, weighted by how well the classifiers explain the training data and how much we believe in them a priori. Despite their superficial similarities, ensembles and BMA are very different. Ensembles change the hypothesis space (for example, from single decision trees to linear combinations of them), and can take a wide variety of forms. BMA assigns weights to the hypotheses in the original space according to a fixed formula. BMA weights are extremely different from those produced by (say) bagging or boosting: the latter are fairly even, while the former are extremely skewed, to the point where the single highest-weight classifier usually dominates, making BMA effectively equivalent to just selecting it. A practical consequence of this is that, while model ensembles are a key part of the machine learning toolkit, BMA is seldom worth the trouble.

**重点词汇**

- **Bayesian model averaging（BMA）**（贝叶斯模型平均）：理论最优但实践中不好使。
- **superficial similarities**（表面相似）。
- **skewed**（偏斜的）：BMA 权重极端集中于一个分类器。
- **seldom worth the trouble**（很少值得折腾）。

**译文**

模型集成不应与贝叶斯模型平均（BMA）混淆——后者才是理论最优的学习方式。BMA 对新样本的预测，是把假设空间中所有分类器的预测，按"对训练数据的解释程度 + 先验信念"加权平均得到。尽管表面相似，集成与 BMA 非常不同：集成改变假设空间（例如从单棵决策树变为它们的线性组合），可以采取五花八门的形式；BMA 按固定公式给原空间中的假设赋权。BMA 的权重与 bagging/boosting 产生的权重截然不同：后者相当均匀，前者极端偏斜——通常单个最高权分类器就占绝对主导，使 BMA 实际上等价于直接选中它。一个实际结论是：模型集成是机器学习工具箱的关键部件，而 BMA 很少值得折腾。

**备注**：本节是 2012 年的"集成学习万岁"。十年后它以另一种面目统治了业界——大模型推理时的 self-consistency、多模型路由、LLM ensemble，都是同一思想的延续。

---

## 10. 简单不意味着准确（Simplicity Does Not Imply Accuracy）

**P1 原文**

> Occam's razor famously states that entities should not be multiplied beyond necessity. In machine learning, this is often taken to mean that, given two classifiers with the same training error, the simpler of the two will likely have the lowest test error. Purported proofs of this claim appear regularly in the literature, but in fact there are many counterexamples to it, and the "no free lunch" theorems imply it cannot be true.

**重点词汇**

- **Occam's razor**（奥卡姆剃刀）："如无必要，勿增实体"。
- **purported**（自称的、所谓的）。
- **counterexample**（反例）。

**译文**

奥卡姆剃刀名言：如无必要，勿增实体。在机器学习里这常被解读为：给定两个训练误差相同的分类器，更简单的那个测试误差大概率更低。文献里不时出现这一论断的"证明"，但实际上反例很多，而且"没有免费午餐"定理蕴含它不可能成立。

**P2 原文**

> We saw one counterexample previously: model ensembles. The generalization error of a boosted ensemble continues to improve by adding classifiers even after the training error has reached zero. Another counterexample is support vector machines, which can effectively have an infinite number of parameters without overfitting. Conversely, the function sign(sin(ax)) can discriminate an arbitrarily large, arbitrarily labeled set of points on the x axis, even though it has only one parameter. Thus, contrary to intuition, there is no necessary connection between the number of parameters of a model and its tendency to overfit.

**重点词汇**

- **boosted ensemble**（提升集成）：训练误差为零后继续加分类器，测试误差仍降。
- **support vector machines**（支持向量机）：参数可视为无穷却不过拟合。
- **sign(sin(ax))**（单参数函数）：一个参数就能拟合 x 轴上任意标注的点集。

**译文**

前面已经见过一个反例：模型集成。boosting 集成在训练误差降到零之后继续添加分类器，泛化误差仍继续改善。另一个反例是支持向量机：它可以有效拥有无限多参数而不过拟合。反过来，函数 sign(sin(ax)) 只有一个参数，却能区分 x 轴上任意大、任意标注的点集。因此与直觉相反：**模型参数量与过拟合倾向之间没有必然联系。**

**P3 原文**

> A more sophisticated view instead equates complexity with the size of the hypothesis space, on the basis that smaller spaces allow hypotheses to be represented by shorter codes. Bounds like the one in the section on theoretical guarantees might then be viewed as implying that shorter hypotheses generalize better. This can be further refined by assigning shorter codes to the hypotheses in the space we have some a priori preference for. But viewing this as "proof" of a trade-off between accuracy and simplicity is circular reasoning: we made the hypotheses we prefer simpler by design, and if they are accurate it is because our preferences are accurate, not because the hypotheses are "simple" in the representation we chose.

**重点词汇**

- **equate A with B**（把 A 等同于 B）。
- **shorter codes**（更短的编码）：MDL（最小描述长度）思想的影子。
- **circular reasoning**（循环论证）。

**译文**

一种更精细的观点把复杂度等同于假设空间的大小，依据是更小的空间允许用更短的编码表示假设。于是，理论保证一节里那类界可被看作蕴含"更短的假设泛化更好"。还能再进一步：给我们先验偏好的假设分配更短的编码。但把这看作"准确率-简单性权衡"的证明是循环论证：是我们按偏好把假设设计得更"简单"，如果它们准确，那是因为我们的偏好本身准确，而不是假设在我们选的表示下"简单"。

**P4 原文**

> A further complication arises from the fact that few learners search their hypothesis space exhaustively. A learner with a larger hypothesis space that tries fewer hypotheses from it is less likely to overfit than one that tries more hypotheses from a smaller space. As Pearl points out, the size of the hypothesis space is only a rough guide to what really matters for relating training and test error: the procedure by which a hypothesis is chosen.

**重点词汇**

- **exhaustively**（穷尽地）。
- **procedure by which a hypothesis is chosen**（选出假设的过程）：真正决定过拟合的是搜索过程，不是空间大小。

**译文**

更复杂的因素来自：很少有学习器穷尽搜索自己的假设空间。一个假设空间更大、但只从中尝试较少假设的学习器，可能比一个在较小空间里尝试更多假设的学习器更不容易过拟合。正如 Pearl 指出的：假设空间大小只是真正要紧之事的粗略代理——真正联系训练误差与测试误差的，是"假设被选出来的过程"。

**P5 原文**

> Domingos surveys the main arguments and evidence on the issue of Occam's razor in machine learning. The conclusion is that simpler hypotheses should be preferred because simplicity is a virtue in its own right, not because of a hypothetical connection with accuracy. This is probably what Occam meant in the first place.

**重点词汇**

- **in its own right**（凭其本身、就其本身而言）。
- **hypothetical**（假想的）。

**译文**

Domingos 综述了机器学习中奥卡姆剃刀问题的主要论证与证据。结论是：更简单的假设值得偏爱，是因为简单性本身是一种美德（易于理解、检验和维护），而不是因为它与准确率有什么假想的联系。这大概才是奥卡姆的本意。

---

## 11. 可表示不等于可学习（Representable Does Not Imply Learnable）

**P1 原文**

> Essentially all representations used in variable-size learners have associated theorems of the form "Every function can be represented, or approximated arbitrarily closely, using this representation." Reassured by this, fans of the representation often proceed to ignore all others. However, just because a function can be represented does not mean it can be learned. For example, standard decision tree learners cannot learn trees with more leaves than there are training examples. In continuous spaces, representing even simple functions using a fixed set of primitives often requires an infinite number of components. Further, if the hypothesis space has many local optima of the evaluation function, as is often the case, the learner may not find the true function even if it is representable. Given finite data, time and memory, standard learners can learn only a tiny subset of all possible functions, and these subsets are different for learners with different representations. Therefore the key question is not "Can it be represented?" to which the answer is often trivial, but "Can it be learned?" And it pays to try different learners (and possibly combine them).

**重点词汇**

- **approximated arbitrarily closely**（被任意逼近）。
- **reassured**（感到安心）。
- **primitives**（基本组件）。
- **trivial**（显而易见、不值一问）。

**译文**

可变尺寸学习器使用的表示，几乎都配有"任何函数都能用这种表示表示或任意逼近"式的定理。受到鼓舞，这种表示的拥趸常常就此无视其他一切表示。然而，函数能被表示不等于能被学到。例如，标准决策树学习器学不出叶子数超过训练样本数的树；连续空间中，用固定的一组基本组件表示哪怕简单的函数都可能需要无穷多个组件。此外，如果假设空间中评估函数有很多局部最优——这很常见——即使真实函数可表示，学习器也可能找不到它。给定有限的数据、时间和内存，标准学习器只能学到全部可能函数中极小的一个子集，而且不同表示的学习器学到的子集各不相同。所以关键问题不是"能不能表示"（答案常常显而易见是能），而是"能不能学到"。尝试不同的学习器（并可能组合它们）是值得的。

> [!quote] 原文侧栏引语
> Just because a function can be represented does not mean it can be learned.
> （一个函数能被表示，不意味着它能被学到。）

**P2 原文**

> Some representations are exponentially more compact than others for some functions. As a result, they may also require exponentially less data to learn those functions. Many learners work by forming linear combinations of simple basis functions. For example, support vector machines form combinations of kernels centered at some of the training examples (the support vectors). Representing parity of n bits in this way requires 2ⁿ basis functions. But using a representation with more layers (that is, more steps between input and output), parity can be encoded in a linear-size classifier. Finding methods to learn these deeper representations is one of the major research frontiers in machine learning.

**重点词汇**

- **exponentially more compact**（指数级更紧凑）。
- **basis functions**（基函数）。
- **kernel**（核函数）、**support vectors**（支持向量）。
- **parity**（奇偶性）：n 位的奇偶函数用核方法需要 2ⁿ 个基函数。
- **more layers**（更多层）：深度结构。

**译文**

对某些函数，一些表示比另一些紧凑指数倍，因此学习这些函数也可能只需要指数级更少的数据。许多学习器通过简单基函数的线性组合来工作。例如支持向量机构造以某些训练样本为中心的核函数的组合（即支持向量）。用这种方式表示 n 位的奇偶性需要 2ⁿ 个基函数；但换用层数更多（即输入到输出之间步数更多）的表示，奇偶性可以编码进线性尺寸的分类器。**寻找学习这类更深表示的方法，是机器学习的主要研究前沿之一。**

**备注**：这一段就是深度学习的预言——2012 年这篇文章发表的同一年，AlexNet 赢下 ImageNet；"deeper representations"由研究前沿变成了整个领域的默认范式。可对照学习清单中的 AlexNet 与 ResNet 论文。

---

## 12. 相关不等于因果（Correlation Does Not Imply Causation）

**P1 原文**

> The point that correlation does not imply causation is made so often that it is perhaps not worth belaboring. But, even though learners of the kind we have been discussing can only learn correlations, their results are often treated as representing causal relations. Isn't this wrong? If so, then why do people do it?

**重点词汇**

- **belabor**（喋喋不休地强调）。
- **correlation / causation**（相关 / 因果）。

**译文**

"相关不蕴含因果"这话被说得太多，几乎不值得再唠叨。但我们讨论的这类学习器只能学到相关性，其结果却常被当作因果关系来用。这错了吗？如果错了，人们为什么还这么做？

**P2 原文**

> More often than not, the goal of learning predictive models is to use them as guides to action. If we find that beer and diapers are often bought together at the supermarket, then perhaps putting beer next to the diaper section will increase sales. (This is a famous example in the world of data mining.) But short of actually doing the experiment it is difficult to tell. Machine learning is usually applied to observational data, where the predictive variables are not under the control of the learner, as opposed to experimental data, where they are. Some learning algorithms can potentially extract causal information from observational data, but their applicability is rather restricted. On the other hand, correlation is a sign of a potential causal connection, and we can use it as a guide to further investigation (for example, trying to understand what the causal chain might be).

**重点词汇**

- **guide to action**（行动指南）：模型的用途是指导干预。
- **beer and diapers**（啤酒与尿布）：数据挖掘最著名的都市传说级案例。
- **observational data**（观测数据）vs **experimental data**（实验数据）：变量是否受控。
- **causal chain**（因果链）。

**译文**

多数时候，学习预测模型是为了指导行动。如果发现超市里啤酒和尿布常被一起购买，那么把啤酒挪到尿布区旁边也许能提高销量。（这是数据挖掘世界的著名案例。）但不真做实验，很难断言。机器学习通常用于观测数据——预测变量不受学习器控制；与之相对的是实验数据——变量受控。有些学习算法原则上能从观测数据中抽取因果信息，但适用面相当受限。另一方面，相关性是潜在因果联系的信号，可以用它指导进一步的调查——比如设法搞清因果链条可能是什么。

**P3 原文**

> Many researchers believe that causality is only a convenient fiction. For example, there is no notion of causality in physical laws. Whether or not causality really exists is a deep philosophical question with no definitive answer in sight, but there are two practical points for machine learners. First, whether or not we call them "causal," we would like to predict the effects of our actions, not just correlations between observable variables. Second, if you can obtain experimental data (for example by randomly assigning visitors to different versions of a Web site), then by all means do so.

**重点词汇**

- **convenient fiction**（方便的虚构）：物理学定律中并没有"因果"这个概念。
- **randomly assigning visitors**（随机分配访客）：即 A/B 测试。
- **by all means**（务必、尽管去做）。

**译文**

许多研究者认为因果只是一种方便的虚构——例如物理定律里就没有因果的概念。因果是否真实存在是个深刻的哲学问题，短期内不会有定论，但对机器学习者有两点实用建议：第一，不管我们叫不叫它"因果"，我们想要的是预测自己行动的效果，而不仅仅是可观测变量之间的相关。第二，如果能拿到实验数据（例如把网站访客随机分配到不同版本——也就是 A/B 测试），那就尽管去做。

---

## 结论（Conclusion）

**原文**

> Like any discipline, machine learning has a lot of "folk wisdom" that can be difficult to come by, but is crucial for success. This article summarized some of the most salient items. Of course, it is only a complement to the more conventional study of machine learning. Check out http://www.cs.washington.edu/homes/pedrod/class for a complete online machine learning course that combines formal and informal aspects. There is also a treasure trove of machine learning lectures at http://www.videolectures.net. A good open source machine learning toolkit is Weka. Happy learning!

**重点词汇**

- **discipline**（学科）。
- **salient**（突出的、显著的）。
- **complement**（补充）。
- **treasure trove**（宝库）。
- **Weka**：Waikato 大学出品的开源 Java 机器学习工具箱，本文参考文献 24。

**译文**

和任何学科一样，机器学习有许多难以获得、却对成功至关重要的"民间智慧"。本文总结了其中最突出的一些条目。当然，它只是对更常规的机器学习学习的补充。作者配套的完整在线课程见 http://www.cs.washington.edu/homes/pedrod/class （兼顾形式与非形式两面）；http://www.videolectures.net 是机器学习讲座的宝库；好的开源机器学习工具箱是 Weka。祝学习愉快！

---

## 全文备注：为什么这篇值得放在清单第 1 篇

- **它不教算法，教"手感"**：12 条经验全部是元知识（meta-knowledge），读任何具体算法论文之前先建立这些判断框架，读论文时会不断"对上号"。
- **多个预言已应验**：第 11 节的 "deeper representations"（深度学习）、第 7 节的"自动化特征工程圣杯"（表示学习）、第 9 节的"更大集成"（LLM 时代的模型合并与多模型系统），都指向了今天。
- **偏差-方差权衡、交叉验证、正则化、集成学习、A/B 测试**：文中点到为止的概念，每一个都值得再展开成独立笔记。

## 学习自检（读完自问）

1. 学习器的三组件是什么？各举两个例子（对照 Table 1）。
2. 为什么"在训练集上表现好"毫无意义？训练误差和测试误差的关系是什么？
3. 用自己的话解释偏差与方差的区别，以及为什么"更强的学习器不一定更好"。
4. "没有免费午餐"定理说了什么？它为什么不阻止机器学习成功？
5. 维度灾难如何摧毁最近邻分类器？"非均匀性之福"为什么能部分挽救它？
6. 为什么说参数数量与过拟合没有必然联系？举出文中的两个反例。
7. bagging、boosting、stacking 分别怎么工作？BMA 与集成的本质区别是什么？
8. 观测数据与实验数据的区别是什么？A/B 测试为什么能支持因果结论？

## 参考资料

- 原文（作者主页 PDF）：[A Few Useful Things to Know About Machine Learning](https://homes.cs.washington.edu/~pedrod/papers/cacm12.pdf)
- DOI：[10.1145/2347736.2347755](https://doi.org/10.1145/2347736.2347755)
- 本库 PDF：![[A Few Useful Things to Know About Machine Learning.pdf]]
- 学习清单：[[从浅入生的推荐一系列的论文学习]]

<details>
<summary>论文原始参考文献（References，25 条）</summary>

1. Bauer, E. and Kohavi, R. An empirical comparison of voting classification algorithms: Bagging, boosting and variants. *Machine Learning* 36 (1999), 105–142.
2. Bengio, Y. Learning deep architectures for AI. *Foundations and Trends in Machine Learning* 2, 1 (2009), 1–127.
3. Benjamini, Y. and Hochberg, Y. Controlling the false discovery rate: A practical and powerful approach to multiple testing. *Journal of the Royal Statistical Society, Series B* 57 (1995), 289–300.
4. Bernardo, J.M. and Smith, A.F.M. *Bayesian Theory*. Wiley, NY, 1994.
5. Blumer, A., Ehrenfeucht, A., Haussler, D. and Warmuth, M.K. Occam's razor. *Information Processing Letters* 24 (1987), 377–380.
6. Cohen, W.W. Grammatically biased learning: Learning logic programs using an explicit antecedent description language. *Artificial Intelligence* 68 (1994), 303–366.
7. Domingos, P. The role of Occam's razor in knowledge discovery. *Data Mining and Knowledge Discovery* 3 (1999), 409–425.
8. Domingos, P. Bayesian averaging of classifiers and the overfitting problem. In *Proceedings of the 17th International Conference on Machine Learning* (Stanford, CA, 2000), Morgan Kaufmann, 223–230.
9. Domingos, P. A unified bias-variance decomposition and its applications. In *Proceedings of the 17th International Conference on Machine Learning* (Stanford, CA, 2000), Morgan Kaufmann, 231–238.
10. Domingos, P. and Pazzani, M. On the optimality of the simple Bayesian classifier under zero-one loss. *Machine Learning* 29 (1997), 103–130.
11. Hulten, G. and Domingos, P. Mining complex models from arbitrarily large databases in constant time. In *Proceedings of the 8th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (Edmonton, Canada, 2002). ACM Press, 525–531.
12. Kibler, D. and Langley, P. Machine learning as an experimental science. In *Proceedings of the 3rd European Working Session on Learning* (London, UK, 1988). Pitman.
13. Klockars, A.J. and Sax, G. *Multiple Comparisons*. Sage, Beverly Hills, CA, 1986.
14. Kohavi, R., Longbotham, R., Sommerfield, D. and Henne, R. Controlled experiments on the Web: Survey and practical guide. *Data Mining and Knowledge Discovery* 18 (2009), 140–181.
15. Manyika, J., Chui, M., Brown, B., Bughin, J., Dobbs, R., Roxburgh, C. and Byers, A. Big data: The next frontier for innovation, competition, and productivity. Technical report, McKinsey Global Institute, 2011.
16. Mitchell, T.M. *Machine Learning*. McGraw-Hill, NY, 1997.
17. Ng, A.Y. Preventing "overfitting" of cross-validation data. In *Proceedings of the 14th International Conference on Machine Learning* (Nashville, TN, 1997). Morgan Kaufmann, 245–253.
18. Pearl, J. On the connection between the complexity and credibility of inferred models. *International Journal of General Systems* 4 (1978), 255–264.
19. Pearl, J. *Causality: Models, Reasoning, and Inference*. Cambridge University Press, Cambridge, UK, 2000.
20. Quinlan, J.R. *C4.5: Programs for Machine Learning*. Morgan Kaufmann, San Mateo, CA, 1993.
21. Richardson, M. and Domingos, P. Markov logic networks. *Machine Learning* 62 (2006), 107–136.
22. Tenenbaum, J., Silva, V. and Langford, J. A global geometric framework for nonlinear dimensionality reduction. *Science* 290 (2000), 2319–2323.
23. Vapnik, V.N. *The Nature of Statistical Learning Theory*. Springer, NY, 1995.
24. Witten, I., Frank, E. and Hall, M. *Data Mining: Practical Machine Learning Tools and Techniques*, 3rd Edition. Morgan Kaufmann, San Mateo, CA, 2011.
25. Wolpert, D. The lack of a priori distinctions between learning algorithms. *Neural Computation* 8 (1996), 1341–1390.

</details>
