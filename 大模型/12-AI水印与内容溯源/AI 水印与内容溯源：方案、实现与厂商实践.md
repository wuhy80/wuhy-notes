---
tags:
  - 大模型/水印
  - 大模型/安全
  - 内容溯源
created: 2026-10-30
updated: 2026-10-30
source:
  - https://arxiv.org/abs/2301.10226
  - https://www.nature.com/articles/s41586-024-08025-4
  - https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm
  - https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
status: done
type: 技术综述
---

# AI 水印与内容溯源：方案、实现与厂商实践

> [!summary] 一句话
> AI 水印不是「防伪」，而是在内容里埋一个**可统计检验或可密码学验证的出处信号**。它回答的是「这段内容有没有经过某个模型」，**不回答**「这段内容是谁写的、可不可信」。把它当检测器用，几乎一定会误伤。

---

## 0. 先分清三件事

日常说的「AI 标识」其实是三种完全不同的东西，混在一起讨论必然吵架：

| | 显式标识 | 隐式元数据 | 内容水印 |
|---|---|---|---|
| 形态 | 角标、文字提示、语音提示 | 文件元数据（EXIF/XMP/C2PA 清单） | 嵌在内容本身里的信号（统计式 / 像素式） |
| 能否被人看到 | 能 | 不能（但工具可读） | 不能 |
| 能否被剥离 | 裁掉即可 | 转存、截图、转码即掉 | 抗一定编辑，改写/重生成会衰减 |
| 检测需要什么 | 肉眼 | 元数据解析器 + 证书链 | 密钥（统计式）或检测模型（深度水印） |
| 证明力 | 最弱（可伪造） | 中（可签名验证，但易丢） | 中偏弱（概率性，非确定性） |
| 监管角色 | 主要合规手段 | 主要合规手段 | 「鼓励」项 / 辅助 |

> [!warning] 最常见的两个误用
> 1. **「没检出 = 人写的」**——错。短文本、被改写、被翻译、元数据被剥离、老模型，都会导致检不出。
> 2. **「检出了 = AI 写的」**——也不完全对。用户可能只是拿模型做了润色、翻译、总结，底层想法和数据仍是人的。

---

## 1. 为什么现在都在做

**监管是主要推手，不是技术成熟度。**

- **欧盟**：《AI Act》第 50 条透明度义务 **2026-08-02 起适用**，要求生成内容以机器可读方式标记。配套的 *Code of Practice on Transparency of AI-Generated Content* 已有约 190 家机构签署（Google、Meta、Microsoft、OpenAI、Anthropic 等）。签署方要在文本里嵌入水印、在文件里附 C2PA 凭证。
- **中国**：《人工智能生成合成内容标识办法》（国信办通字〔2025〕2 号，2025-03-14 发布）**2025-09-01 施行**；强制性国标 **GB 45438-2025**《网络安全技术 人工智能生成合成内容标识方法》**2025-02-28 发布、2025-09-01 实施**。这套是「**显式标识 + 文件元数据隐式标识强制，数字水印鼓励**」的组合。
- **产业侧**：C2PA（Content Credentials）成为事实上的元数据标准；平台开始做上传核验。

关键差异先记住：**中国把「元数据」当主战场（强制），把「水印」当加分项（鼓励）；欧盟把「文本水印」直接当成合规手段之一在推。** 这个差异决定了厂商的工程重心完全不同。

---

## 2. 技术全景

| 维度 | 取值 | 典型代表 |
|---|---|---|
| 载体 | 文本 / 图像 / 音频 / 视频 / 3D / 代码 | 文本最难、视频最复杂 |
| 机制 | 元数据签名 / 空域-频域隐写 / 深度编码器 / 生成过程统计偏置 / 语义层编码 | 见下 |
| 检测权限 | 需密钥（对称）/ 需私钥 / 公钥可验 / 无需密钥 | 决定能否第三方检测 |
| 鲁棒性目标 | 抗压缩转码 / 抗裁剪 / 抗改写 / 抗再生成 | 越强越贵 |

一句话选型逻辑：**元数据负责「可验证」，水印负责「抗剥离」，显式标识负责「可感知」。三者是叠加关系，不是替代关系。**

---

## 3. 文本水印：最难的一类

### 3.1 为什么文本最难

- 文本是**离散**的：图像改一个像素没人看得出，文本改一个 token 就可能改变语义；
- 文本**没有冗余**：不能像图片那样在低频分量里塞比特；
- **tokenizer 绑定**：水印信号建立在 token 序列上，换分词器/规范化就归零；
- **可改写性极强**：同义替换、重写、翻译往返都能打散信号，而且成本极低（一次 API 调用）。

### 3.2 KGW 绿名单（这一脉的祖师爷）

论文：*A Watermark for Large Language Models*，Kirchenbauer, Geiping, Wen, Katz, Miers, Goldstein（University of Maryland），ICML 2023，[arXiv:2301.10226](https://arxiv.org/abs/2301.10226)。

**生成端**

1. 用 `hash(密钥 k, 前一个 token)` 做种子（上下文宽度 h，默认 1）；
2. 用种子驱动 PRNG，把词表随机切成 **绿名单 G**（比例 γ）和红名单 R；
3. 采样前给绿名单 token 的 logit 加 δ：

```
logits'[w] = logits[w] + δ   if w ∈ G_t
           = logits[w]         otherwise
```

默认 **γ = 0.25、δ = 2.0**。硬水印版本直接把红名单置 −∞，但那会明显伤质量，实际都用软水印。

**检测端**（需要同一密钥与同款 tokenizer）

```
z = (|s|_G − γ·T) / sqrt(T·γ·(1−γ))
```

零假设（无水印）下 z ~ N(0,1)。**z > 4 对应单侧误报率约 3×10⁻⁵**。

**定量性质**（原论文）

- 高熵文本 **25 token 起**可测；
- 要「洗掉」需要改动**约 1/4 的 token**（1000 token 改 200 个，z 仍约 6.3）；
- γ↑ 检出率↑但困惑度↑；δ↑ 抗编辑↑但质量↓。

**弱点**：依赖 tokenizer 与序列边界；低熵内容（代码、公式、JSON、专名）容量趋零；语义改写与翻译往返即失效；可被「水印窃取」逆向。

### 3.3 家族对比

| 方案 | 出处 | 机制 | 检测依赖 | 强项 | 短板 |
|---|---|---|---|---|---|
| **KGW 绿名单** | ICML 2023，[2301.10226](https://arxiv.org/abs/2301.10226) | 哈希上文→绿/红名单→logit 偏置 | 词表 + 密钥（**不需模型**） | 简单、快、可离线第三方检测 | 怕改写/翻译；低熵无容量 |
| **Unigram** | Zhao et al., ICLR 2024，[2306.17439](https://arxiv.org/abs/2306.17439) | 全序列**固定**绿/红划分 | 词表 + 密钥 | 抗局部编辑、有可证检测 | 划分泄露即可全文伪造；语义改写无效 |
| **EXP / Gumbel** | Aaronson 博客 2022；形式化 [2404.01245](https://arxiv.org/abs/2404.01245) | 每位用 (key, 上文) 生成 Gumbel 噪声，等价指数最小值采样 | 需**模型 logits** | 无偏、无质量损失 | 对位置极敏感，改动一个 token 即错位；检测要重放 PRG |
| **ITS（逆变换采样）** | Kuditipudi et al. 2023，[2307.15593](https://arxiv.org/abs/2307.15593) | 密钥生成 u~U(0,1)，按 CDF 反变换取 token | 需**模型 CDF** | 分布严格不变（无损） | 同上，且需对齐搜索 |
| **SWEET** | Lee et al., ACL 2024，[2305.15060](https://arxiv.org/abs/2305.15060) | 只在高熵位置（熵 > τ）加水印，检测也只统计这些位置 | 需**每 token 熵** | 质量损失最小，适合代码 | 检测端要熵，黑盒第三方不可用 |
| **SynthID-Text** | Google DeepMind，*Nature* 2024，[DOI](https://www.nature.com/articles/s41586-024-08025-4) | **锦标赛采样**：每步用密钥给候选打分 g，两两比较取优，重复多轮消除偏置 | 需模型内部（密钥+采样） | 无失真、**唯一大规模生产部署**（Gemini） | 对改写/回译仍脆弱；开源版不含生产密钥体系 |
| **SemStamp** | JHU，NAACL 2024，[2310.03991](https://arxiv.org/abs/2310.03991) | 句级：句向量 + LSH 划分语义空间，拒绝采样直到落入 green 语义区 | 检测端需 embedding 模型 | **抗改写**（语义层） | 生成延迟高、语义漂移、依赖 embedding 质量 |
| **SIR** | 清华，ICLR 2024，[2310.06356](https://arxiv.org/abs/2310.06356) | 用 embedding 编码**全部前文**得语义向量 → 映射为 watermark logits 叠加 | 需 embedding 模型 | 对同义替换鲁棒 | 多一个模型开销；对抗改写仍可破 |
| **X-SIR** | ACL 2024，[2402.14007](https://arxiv.org/abs/2402.14007) | SIR 的跨语言加强版 | 同上 | 提升翻译场景一致性 | 仍非无损 |
| **不可检测（UGZ）** | Christ/Gunn/Zamir，COLT 2024，[2306.09194](https://arxiv.org/abs/2306.09194) | PRF(key,prefix) 生成随机性，使有无水印**计算不可区分** | 密钥 + 模型 | 理论 baseline：无质量损失且不可检出 | 只保证「不可检测」，**不保证鲁棒**；吞吐差 |
| **公钥可验证** | Fairoze et al., CRYPTO 2024，[2310.18491](https://arxiv.org/abs/2310.18491) | 拒绝采样 + 数字签名（ECC 纠错），**公钥即可验、不可伪造** | 公钥（无需秘密） | 解决「第三方检测」与「诬陷」问题 | 生成极慢；payload 小；鲁棒性与可公开验证难兼得（[2502.04901](https://arxiv.org/abs/2502.04901)） |

> [!note] 四个常见引用错误
> - SynthID-Text **没有 arXiv 版**，正式出处是 Nature，DOI `10.1038/s41586-024-08025-4`（不是 2410.03717）；
> - 「Maryland 水印」就是 KGW（马里兰大学），和 Kuditipudi 的无失真水印是两个工作；
> - EXP 与 Gumbel 水印是**同一个**方案，时间应为 2022（博客）；
> - ITS 首现于 Kuditipudi 2023 的论文，没有独立的「2024 ITS 论文」。

### 3.4 检测与评估

- **主指标 TPR@FPR**（常用 FPR=1%，严格用 0.1%），不要只看 TPR；
- **z-score / p-value** 只有 KGW 一脉有校准良好的统计量，不是所有方案都给；
- **质量代价**：困惑度变化（需 oracle 模型）、任务指标、LLM 评审；
- **鲁棒性曲线**（随替换率/编辑距离/翻译次数变化），而不是单点数字；
- **对齐强度再比**：不同方案默认超参不同，直接比 TPR 是无效对比。

公认基准：

- **MarkMyWords**（UC Berkeley，[2312.00273](https://arxiv.org/abs/2312.00273)）：多方案统一评测，结论之一是**代码生成场景水印普遍失效**；
- **WaterBench**（清华，ACL 2024，[2311.07138](https://arxiv.org/abs/2311.07138)）：9 任务 × 5 长度的系统性评测，结论是**现有方法很难同时保住指令遵循能力**；
- **MarkLLM**（清华，EMNLP 2024 Demo，[2405.10051](https://arxiv.org/abs/2405.10051)）：9 种算法 + 统一流水线，复现首选。

### 3.5 攻击面（按威胁强度排序）

| 攻击 | 效果 | 成本 |
|---|---|---|
| **改写（paraphrase）** | 最致命：DIPPER 把 DetectGPT 检出从 **70.3% → 4.6%**（FPR=1%），语义几乎不变 | 一次 API 调用 |
| **翻译往返** | KGW 类 AUC 掉到随机水平（[2402.14007](https://arxiv.org/abs/2402.14007)） | 两次 API 调用 |
| **同义词替换** | 对 token 级方案有效，对语义级（SIR/SemStamp）基本无效 | 低 |
| **截断** | z 随 T 单调下降，只搬短片段即可逃逸 | 无 |
| **水印窃取** | ETH 的工作：**<$50 预算**即可实现 spoofing 与 scrubbing，成功率均 **>80%**（[2402.19361](https://arxiv.org/abs/2402.19361)） | 低，且此前被严重低估 |
| **微调去除** | 继续训练可显著削弱（SoK，[2411.18479](https://arxiv.org/abs/2411.18479)） | 中 |
| **伪造/诬陷** | 对称密钥方案被逆向即可给人类文本「打水印」反咬一口 | 中 |

> [!important] 一句话结论
> **文本水印挡的是「顺手复制粘贴」，挡不住「有意洗稿」。** 而现实中有动机洗稿的人，成本比做水印的人低得多。

### 3.6 工程坑（按踩坑频率）

1. **tokenizer 绑定**：密钥由 token id 驱动，换分词器、重分词、空格规范化、Unicode NFKC 差异都会让检测归零——**跨模型复用几乎不可能**。
2. **检测是否需要模型**：KGW 只要词表 + 哈希，可做离线第三方检测；ITS/EXP/SWEET/SynthID 需要 logits 或熵，**只能模型方自检**。这条直接决定产品架构。
3. **流式生成**：KGW 能流式，但检测需要**连续 span**，多段拼接会破坏对齐。
4. **batch/padding**：批内各行要有独立密钥子流，padding 平移位置会导致密钥错位。
5. **采样参数**：top-p 可能把绿名单全裁掉使 δ 失效；greedy 时强度取决于并列最优里是否选了绿词；温度升高会稀释 δ。**必须在真实采样参数下重新标定 γ/δ**。
6. **低熵文本**：代码、公式、JSON、专名，容量趋零，硬加只会伤质量。
7. **多语言**：中日文的 token 熵分布与英文差别很大，英文调好的参数直接搬，既伤质量又掉检出。

### 3.7 开源实现

| 仓库 | 语言 | ★（2026-10） | 说明 |
|---|---|---|---|
| [google-deepmind/synthid-text](https://github.com/google-deepmind/synthid-text) | Python | 1216 | SynthID-Text，Apache-2.0 |
| [THU-BPM/MarkLLM](https://github.com/THU-BPM/MarkLLM) | Python | 1088 | 统一工具箱：KGW/EXP/ITS/SIR/SWEET/X-SIR + 评测 |
| [jwkirchenbauer/lm-watermarking](https://github.com/jwkirchenbauer/lm-watermarking) | Python | 707 | KGW 官方实现 |
| [facebookresearch/three_bricks](https://github.com/facebookresearch/three_bricks) | Python | 53 | KGW + 严格检验（FPR<10⁻⁶）、多比特；**非商用许可** |
| [XuandongZhao/Unigram-Watermark](https://github.com/XuandongZhao/Unigram-Watermark) | Python | 39 | Unigram，MIT |
| [hongcheki/sweet-watermark](https://github.com/hongcheki/sweet-watermark) | Python | 41 | SWEET 官方 |
| [THU-BPM/Robust_Watermark](https://github.com/THU-BPM/Robust_Watermark) | Python | 39 | SIR 官方 |

> [!warning] 两个易混仓库
> `microsoft/InvisMark` 是**图像**溯源，不是文本；`facebookresearch/watermark-anything` 是图像局部水印且**已归档**，与文本无关。

---

## 4. 图像水印

图像比文本好做：像素有冗余、可以容忍微小扰动、也天然适配频域方法。

### 4.1 三条技术路线

| 路线 | 代表 | 优点 | 缺点 |
|---|---|---|---|
| **空域/频域隐写** | LSB、DCT、DWT、Spread-spectrum | 简单、可解释、计算便宜 | 抗 JPEG/裁剪差；LSB 一压缩就没了 |
| **深度编码器** | HiDDeN → StegaStamp → Stable Signature | 容量大、抗压缩强 | 依赖训练分布；再生成会丢 |
| **元数据（C2PA）** | Content Credentials | 可签名、可验证、语义清晰 | 转存/截图即剥离；不是「水印」 |

### 4.2 深度学习水印的几个关键节点

- **Stable Signature**（Meta，[2303.15435](https://arxiv.org/abs/2303.15435)）：微调扩散模型的 VAE 解码器，让**生成即带水印**，无需后处理；
- **Tree-Ring / Gaussian Shading**（2023-2024）：在扩散初始噪声里编码，抗再生成能力更强；
- **Watermark Anything**（Meta，2024，已归档）：支持局部区域多消息；
- **不可见水印的可证明移除**（[2306.01953](https://arxiv.org/abs/2306.01953)）：用生成模型重绘一遍即可**证明性移除**水印——这是图像水印最硬的一条负面结论；
- **Stable Signature is Unstable**（[2405.07145](https://arxiv.org/abs/2405.07145)）：进一步说明微调即可去除；
- **WAVES 基准**（[2401.08573](https://arxiv.org/abs/2401.08573)）：系统评测图像水印在各类扰动下的鲁棒性。

### 4.3 工程要点

- 水印强度与画质是直接 trade-off，通常按 PSNR/SSIM 定预算；
- 必须经受**一次社交平台转码**（JPEG 质量 70–85、缩放、二次压缩），否则线上等于没加；
- 检测端要能处理**裁剪/拼接/局部编辑**（局部水印方案才有意义）；
- 别把「元数据」当水印：**C2PA 是防篡改的出处声明，不是抗剥离的像素信号**。

---

## 5. 音频与视频

| 载体 | 代表方案 | 特点 |
|---|---|---|
| 音频 | **AudioSeal**（Meta，[2401.17264](https://arxiv.org/abs/2401.17264)） | 局部化水印，可定位到片段；开源 |
| 音频 | Google **SynthID-Audio**（Lyria） | 商用部署，检测不开放 |
| 视频 | **Video Seal**（Meta，[2412.09492](https://arxiv.org/abs/2412.09492)） | 开源、轻量、抗压缩与时间裁剪 |
| 视频 | Google **SynthID-Video**（Veo） | 商用部署 |

视频的核心难点是**时序一致性**：逐帧打水印会被抽帧/变速/转码打散，所以要么在时序冗余上做编码，要么在生成阶段就注入。

---

## 6. 厂商实践

> [!note] 读法
> 下面区分「**已公开的技术细节**」和「**只有产品声明**」。厂商大多不公开算法，能确认的是**做了什么、覆盖哪些产品、检测开放给谁**。

### 6.1 Google：SynthID 全家桶

- **文本**：SynthID-Text（*Nature* 2024），锦标赛采样，**已在 Gemini 生产环境部署**，论文称对数百万级回复做过验证且不损质量；开源研究实现 [synthid-text](https://github.com/google-deepmind/synthid-text)。
- **图像/音频/视频**：SynthID 分别覆盖 Imagen、Lyria、Veo 等；图像侧对外提供水印校验 API（Google Cloud 样例 `verify_image_watermark.py`）。
- **元数据**：图像同时附 C2PA Content Credentials。
- **定位**：唯一一家把「文本水印」真正推上大规模生产、并且**公开了算法论文**的厂商。

### 6.2 OpenAI：文本水印 2026 年 10 月才在欧盟上线

- **图像/视频**：DALL·E、Sora 生成物附 **C2PA** 元数据 + 可见水印。
- **文本**：长期「有技术但不上线」，2026-10-05 宣布为满足欧盟 AI Act，在**欧盟区**给 ChatGPT / Codex 的输出加不可见文本水印；同期公布方法 **textGrain**（与宾夕法尼亚大学、耶鲁的研究者合著），并称其效果「达到或超过」SynthID-Text。
- **技术路线**：不是插入符号，而是**用密钥微妙地塑形下一个词的选择**（对 next-token 预测做排序/偏置），大量这种「轻推」累积起来，检测端只要**文本 + 密钥**就能判断——本质仍是 KGW 那一脉的「密钥化词表偏置」。
- **覆盖面**：欧盟区全套餐用户分批推送；**API 全球可选开启、默认关闭**；暂无全球默认开启计划，官方说法是「先在一个区域学真实反馈」。
- **公开的效果数据**：未编辑文本检出率 **92%**；替换 10% 同义词降到 **66%**；替换 25% 降到 **17%**。
- **公开的限制**：短文本、数学答案、翻译文本难检出；**不保证可靠检测**；不验证准确性、不判定版权、不度量人类贡献。
- **检测开放度**：初期只给**审核通过的研究者与专家机构**，理由是「限制条件太多，需要专业机构评估可靠性」。
- **一个值得注意的背景**：OpenAI 早就有文本水印方案，之前压着不发，部分原因是担心**用户流向不加水印的竞品**。

> [!note] 行业互相引用
> The Verge 的报道称，Anthropic 的文本水印「也以 SynthID 为基础」。这一点目前只有媒体表述，Anthropic 官方文档只说「模型级嵌入水印」，未披露算法来源——引用时建议标注为「据媒体报道」。

### 6.3 Anthropic：2026 年 8 月起，全球范围

一手说明：[How Claude marks AI-generated content](https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content)。

- 签署欧盟 AI Act **第 50(2) 条 Code of Practice**；**2026-08-02 及之后发布的模型**从第一天就带标记，老模型在补。
- **两条腿**：
  1. **文本水印**：模型级、嵌在文本里，复制粘贴会带走，能扛「一定程度的编辑」；
  2. **C2PA**：生成 PNG/JPEG 等文件时附签名出处元数据。
- **覆盖面**：Claude API、Claude 应用、Claude Code、Cowork、Tag，以及 AWS / Google Cloud / Microsoft Foundry 上的 Claude；**全球生效，不限于欧盟**。
- **检测**：私有预览，开放给监管、执法、媒体、事实核查、独立研究、教育机构与欧盟公民社会；后续扩大。
- **限制声明**（写得很直白）：检出只说明「可能经过 Claude 处理」，不能确认原创性；未检出也不代表不是 AI（老模型、重度改写、翻译、片段过短、元数据被剥离都会导致漏检）。

### 6.4 Meta：开源最多的一家

- **Stable Signature**（图像，微调 VAE 解码器）、**AudioSeal**（音频，局部化）、**Video Seal**（视频）——三个都开源，是学术界最常用的基线。
- 产品侧在 2024 年起给 AI 生成内容加「AI info」标签，图像附 C2PA。
- Llama 本身**不带文本水印**（开源权重也没法强制）。

### 6.5 Microsoft：元数据为主

- Bing Image Creator / Designer 生成图附 **C2PA Content Credentials**；
- 研究侧有 **InvisMark**（图像不可见水印）；
- **没有公开的 LLM 文本水印方案**，也没有对应开源仓库。

### 6.6 Adobe：C2PA 的发起者

- **Content Credentials** 是 C2PA 规范的主要落地形态，Photoshop、Firefly 全线支持；
- 定位是「**可验证的出处**」，而不是「抗剥离的水印」——这是最容易被误解的一点。

### 6.7 AWS：Titan 图像默认带不可见水印

- Amazon Titan Image Generator 生成的图**默认嵌入不可见水印**，并在 Bedrock 提供**水印检测 API**（`DetectGeneratedContent` 一类接口）；
- 属于「平台级默认开启」，用户无需自己接。

### 6.8 中国厂商：法规驱动，元数据优先

- 合规基线是《标识办法》+ GB 45438-2025：**显式标识 + 文件元数据隐式标识是硬要求，数字水印是「鼓励」**（第五条明确写了「鼓励…添加数字水印等形式的隐式标识」）。
- 典型形态是「**可见角标 + 元数据字段 +（部分厂商）数字水印**」，再加平台侧核验。

| 厂商/产品 | 显式标识 | 隐式标识 | 公开依据 |
|---|---|---|---|
| 字节·豆包 | 图片右下角「豆包AI生成」 | 元数据隐式标识 | 用户协议 6.4 条 |
| 字节·即梦 | 图片右下角、视频**全程**标识 | 元数据隐式标识 | 用户协议 4.2 条 |
| 字节·火山剧创 | 默认「AI生成」明水印，可申请去除 | 未在公开页说明 | 火山引擎文档 |
| 阿里·千问 | 右下角「千问AI生成」，**文字高度 ≥ 最短边 5%**；对话界面「内容由AI生成」 | 元数据；**移除显式标识后隐式仍保留** | 用户协议第八条 |
| 阿里·通义万相 | 图片/视频显式标识 | 元数据字段完整 + **自研数字水印**；首批通过中国电子技术标准化研究院 AIGC 标识能力测评 | 阿里云开发者社区（2025-07-17） |
| 百度·文心 | 界面提示；用户对外发布须显著标明 | 下载/分享文件写入元数据 | 用户协议 4.1 / 劳动报实测 |
| 腾讯·元宝 | 显式标识 | 隐式标识 | 平台公告（2025-08-31） |
| 腾讯·混元生图 | 支持自定义「水印脚注」（≤16 字符，右下角） | 未在公开页说明 | 腾讯云 TokenHub 文档 |
| 快手·可灵 | 品牌水印 + 法定 AI 标识（**两者不同**：品牌水印会员可去，法定标识不可删） | **不可见水印 + 元数据**，声明与 **C2PA** 对齐，并提供公开检测页 | Kling AI《AI Content Detection》文档 |
| MiniMax·海螺 | 水印/文字说明 | 元数据嵌入 | 平台公告（2025-08-30） |
| 商汤·如影 | 显式标识 | 隐式标识 | 商汤公告（2025-09-02） |

> [!note] 国内的可信度分层
> - **元数据**是唯一被强制且被平台核验的载体，所以「合规」看的是元数据字段是否齐全；
> - **数字水印**只有部分厂商公开承认（阿里万相、快手可灵），且都配套了「检测/溯源」能力；
> - **文本水印**在国内几乎不作为合规手段，文本侧主要靠**界面提示**（因为文本文件没有统一容器，元数据无处安放，落盘即丢）。

### 6.9 一张表看差异

| 厂商 | 文本水印 | 图像 | 音频/视频 | 元数据（C2PA） | 检测开放度 |
|---|---|---|---|---|---|
| Google | ✅ SynthID-Text（Gemini） | ✅ SynthID + C2PA | ✅ SynthID Audio/Video | ✅ | 部分公开 API |
| OpenAI | ⚠️ 2026-10 起仅欧盟，textGrain | ✅ C2PA + 可见水印 | ✅ Sora C2PA | ✅ | 仅审核机构 |
| Anthropic | ✅ 2026-08 起全球 | ✅ C2PA | — | ✅ | 私有预览 |
| Meta | ❌（Llama 不带） | ✅ Stable Signature（开源） | ✅ AudioSeal / Video Seal（开源） | ✅ | 开源模型自带 |
| Microsoft | ❌ | ✅ C2PA + InvisMark（研究） | — | ✅ | 产品内 |
| Adobe | — | ✅ Content Credentials | — | ✅（标准发起方） | 公开校验工具 |
| AWS | ❌ | ✅ Titan 默认水印 + 检测 API | — | 部分 | 平台 API |
| 中国厂商 | 少见（文本以显式提示为主） | ✅ 角标 + 元数据（水印为辅） | ✅ 视频角标 | ✅ 强制 | 平台侧核验 |

---

## 7. 监管要点（可直接对照实现）

### 7.1 中国

《人工智能生成合成内容标识办法》（2025-09-01 施行）关键条款：

| 条款 | 要求 |
|---|---|
| 第三条 | 标识分**显式**（用户可明显感知：文字/声音/图形）与**隐式**（文件数据中、不易感知） |
| 第四条 | 文本在起始/末尾/中间加提示或在界面加显著提示；音频加语音/节奏提示；图片加显著标识；视频在起始画面与播放周边加显著标识；虚拟场景在起始画面加标识 |
| 第四条（末款） | 提供**下载、复制、导出**时，必须确保文件含符合要求的显式标识 |
| 第五条 | 文件**元数据**中加隐式标识，包含生成合成属性、服务提供者名称或编码、内容编号；**鼓励**加数字水印 |
| 第六条 | 传播平台要核验元数据：标明了就加提示；未核验到但用户声明、或检测到痕迹，也要加「疑似」提示；并回写传播要素信息 |
| 第七条 | 应用商店上架时核验标识材料 |
| 第十条 | 任何组织个人不得恶意删除、篡改、伪造、隐匿标识，不得提供此类工具或服务 |

配套 **GB 45438-2025**（强制性国标，2025-02-28 发布 / 2025-09-01 实施，TC260 归口）规定了具体标识方法与元数据字段。据公开解读，隐式标识以**文件元数据中的 AIGC 扩展字段**承载，按 JSON 录入，核心字段 7 个：

| 字段 | 含义 |
|---|---|
| `AIGC` | 生成合成属性：**1 = 属于 AI 生成，2 = 可能为 AI 生成，3 = 疑似 AI 生成** |
| `ContentProducer` | 生成合成服务提供者名称或编码 |
| `ProduceID` | 制作内容编号 |
| `ReservedCode1` / `ReservedCode2` | 预留字段 |
| `ContentPropagator` | 传播服务提供者名称或编码 |
| `PropagateID` | 传播内容编号 |

配套还有《网络安全标准实践指南——人工智能生成合成内容标识 服务提供者编码规则》（2025-03-14 发布），用于给「服务提供者编码」分配取值。

**平台侧已经在执行**：

- 抖音（2025-09-01 起）：上线 AI 内容标识 + **元数据标识读写**；对未主动标识的内容做检测并补标，同时写入传播要素。
- 微信（2025-08-31 公告）：平台添加显式 + 隐式标识，用户须主动声明，不得删除/篡改/隐匿。
- 应用商店：上架审核时须核验标识材料（办法第七条）。
- 执法数据（2026-09 通报口径）：主要制作平台累计为 **1500 亿+** 条生成内容添加标识，向用户提供 **10 亿+** 个带标识文件；「清朗」专项行动第二阶段清理信息 561 万余条、处置账号 4.9 万余个。

> [!tip] 工程含义
> 国内合规的最小可用实现是：**元数据写入 + 显式角标 + 导出链路保真**。数字水印是加分项，但如果你的元数据在转存/截图后就丢了（现实里一定会丢），水印就是唯一还能留下的信号——所以两者都要做，只是优先级不同。

### 7.2 欧盟

- **AI Act 第 50 条**：2026-08-02 起适用，要求 AI 生成/操纵的内容以**机器可读**方式标记，深度伪造需披露。
- **Code of Practice on Transparency**：自愿签署但事实上成为合规路径，约 190 家签署；签署方承诺文本水印 + 文件 C2PA。
- 实际执行差异很大：OpenAI 只在欧盟开文本水印且 API 默认关；Anthropic 全球开；Google 早就默认开。

### 7.3 国际标准

- **C2PA**：目前最成熟的出处元数据规范（Adobe 发起，Google/Meta/Microsoft/OpenAI 等支持），配套开源校验工具；
- C2PA 解决「**这份文件是不是由某工具生成、之后有没有被改**」，不解决「**像素里有没有水印**」——两者经常被混为一谈。

---

## 8. 选型与落地建议

| 你的角色 | 建议组合 |
|---|---|
| **模型/API 提供方** | 生成端嵌统计水印（KGW 类够用；要抗改写上语义水印）+ 输出文件附 C2PA；检测接口先内部用 |
| **内容平台** | 上传核验元数据（强制）+ 可见标识 + 对「疑似」内容做检测兜底；保留日志满足监管 |
| **企业内容团队** | 不指望水印防泄露；用 C2PA 做内部流转溯源；对外发布走显式标识 |
| **取证/媒体** | 只用「有密钥且经过校准」的检测器，报告必须给出 FPR 与置信区间；单条结论不可作为唯一证据 |
| **开发者自测** | 先用 MarkLLM 跑通，再对齐强度做 A/B，最后在**真实采样参数**下标定 |

**成本参考**（量级，非精确报价）：

- 统计水印：生成侧几乎零成本（一次哈希 + 一次划分）；
- 深度图像水印：编码器推理，通常 < 5% 生成耗时；
- 公钥可验证水印：拒绝采样导致**数十倍**生成开销，目前只适合离线场景。

---

## 9. 争议与结论

> [!warning] 五个必须写进认知的前提
> 1. **水印 ≠ AI 检测器**：它只能证明「用了这份密钥对应的模型」，第三方模型、人类文本一律检不出。
> 2. **改写是降维打击**：DIPPER 把检出率从 70.3% 打到 4.6%，成本一次 API 调用。
> 3. **窃取让攻击平民化**：<$50 预算、>80% 成功率，说明「对抗性攻击者」这个假设必须成立。
> 4. **开源模型基本失效**：权重在手，重跑一遍或微调即可去水印，没有可执行的强制手段。
> 5. **误伤是真实风险**：短文本、非母语写作、模板化写作都可能被判为「疑似 AI」，这会伤到真人。

**我的判断**：

- 短期（1–2 年）真正落地的会是「**元数据 + 显式标识**」这套组合，因为可执行、可审计、成本低；水印作为**抗剥离的补充信号**存在，但不会被当成唯一证据。
- 文本水印的技术天花板已经比较清楚：**能防顺手复制，防不住有意洗稿**。它的价值更多是「提高作恶成本 + 给平台一个可用的默认信号」，而不是「终结 AI 内容滥用」。
- 真正值得关注的方向是**语义层水印**（抗改写）和**公钥可验证**（解决第三方检测与诬陷），但这两条目前都还在「有论文、没产品」的阶段。

---

## 10. 参考资料

**论文**

- Kirchenbauer et al., *A Watermark for Large Language Models*, ICML 2023 — [arXiv:2301.10226](https://arxiv.org/abs/2301.10226)
- Zhao et al., *Provable Robust Watermarking for AI-Generated Text*, ICLR 2024 — [arXiv:2306.17439](https://arxiv.org/abs/2306.17439)
- Kuditipudi et al., *Robust Distortion-free Watermarks for Language Models*, TMLR 2024 — [arXiv:2307.15593](https://arxiv.org/abs/2307.15593)
- Dathathri et al., *Scalable watermarking for identifying large language model outputs*, Nature 2024 — [DOI](https://www.nature.com/articles/s41586-024-08025-4)
- Christ/Gunn/Zamir, *Undetectable Watermarks for Language Models*, COLT 2024 — [arXiv:2306.09194](https://arxiv.org/abs/2306.09194)
- Fairoze et al., *Publicly-Detectable Watermarking for Language Models*, CRYPTO 2024 — [arXiv:2310.18491](https://arxiv.org/abs/2310.18491)
- Hou et al., *SemStamp*, NAACL 2024 — [arXiv:2310.03991](https://arxiv.org/abs/2310.03991)
- Liu et al., *A Semantic Invariant Robust Watermark for LLMs* (SIR), ICLR 2024 — [arXiv:2310.06356](https://arxiv.org/abs/2310.06356)
- He et al., *Can Watermarks Survive Translation?* (X-SIR), ACL 2024 — [arXiv:2402.14007](https://arxiv.org/abs/2402.14007)
- Lee et al., *Who Wrote this Code? Watermarking for Code Generation* (SWEET), ACL 2024 — [arXiv:2305.15060](https://arxiv.org/abs/2305.15060)
- Jovanović et al., *Watermark Stealing in Large Language Models*, ICML 2024 — [arXiv:2402.19361](https://arxiv.org/abs/2402.19361)
- Zhao et al., *Invisible Image Watermarks Are Provably Removable Using Generative AI*, NeurIPS 2024 — [arXiv:2306.01953](https://arxiv.org/abs/2306.01953)
- Fernandez et al., *The Stable Signature*, ICCV 2023 — [arXiv:2303.15435](https://arxiv.org/abs/2303.15435)
- San Roman et al., *Proactive Detection of Voice Cloning with Localized Watermarking* (AudioSeal), ICML 2024 — [arXiv:2401.17264](https://arxiv.org/abs/2401.17264)
- Fernandez et al., *Video Seal*, 2024 — [arXiv:2412.09492](https://arxiv.org/abs/2412.09492)
- An et al., *WAVES: Benchmarking the Robustness of Image Watermarks*, 2024 — [arXiv:2401.08573](https://arxiv.org/abs/2401.08573)
- Zhao et al., *SoK: Watermarking for AI-Generated Content*, IEEE S&P 2025 — [arXiv:2411.18479](https://arxiv.org/abs/2411.18479)

**监管与厂商**

- 国家网信办等，《人工智能生成合成内容标识办法》，2025-03-14 — [原文](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- GB 45438-2025《网络安全技术 人工智能生成合成内容标识方法》，2025-02-28 发布 / 2025-09-01 实施 — [标准信息](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=F32EA2A561F1886CD8D606513512D547)
- 《网络安全标准实践指南——人工智能生成合成内容标识 服务提供者编码规则》，2025-03-14
- 豆包用户协议（第 6.4 条，AI 标识） — [原文](https://www.doubao.com/legal/terms)
- 千问用户服务协议（第八条，显式/隐式标识与 5% 水印高度） — [原文](https://terms.alicdn.com/legal-agreement/terms/c_end_product_protocol/20231011201348415/20231011201348415.html)
- 阿里云，《通义万相首批通过 AIGC 标识能力测评》，2025-07-17 — [文章](https://developer.aliyun.com/article/1672039)
- Kling AI, *AI Content Detection*（数字水印 + C2PA + 公开检测页） — [文档](https://kling.ai/docs/ai-content-detection)
- 抖音 AI 内容标识公告（2025-09-01 起） — [报道](https://www.ithome.com/0/879/586.htm)
- 微信《关于进一步规范人工智能生成合成内容标识的公告》，2025-08-31 — [报道](https://bianews.com/news/flash?id=220093)
- 《杭州日报》实测：各平台 AI 标识位置，2025-09-09 — [报道](https://mdaily.hangzhou.com.cn/hzrb/2025/09/09/article_detail_1_20250909A1010.html)
- 21 世纪经济报道：AI 标识落实一周年与执法数据，2026-09-02 — [报道](https://m.21jingji.com/article/20260902/herald/188de40e8bcdafe97dbb0a0bc90ab5c9.html)
- Anthropic, *How Claude marks AI-generated content* — [帮助中心](https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content)
- OpenAI, *Our approach to EU text provenance rules*, 2026-10-05 — [原文](https://openai.com/index/eu-text-provenance/)
- Google DeepMind, *SynthID* — [产品页](https://deepmind.google/technologies/synthid/)
- TechCrunch, *OpenAI will start watermarking ChatGPT's text in the EU*, 2026-10-05 — [报道](https://techcrunch.com/2026/10/05/openai-will-start-watermarking-chatgpts-text-in-the-eu/)
- 量子位 / 36Kr，*Claude 上线「隐形水印」*，2026-08-11 — [报道](https://eu.36kr.com/en/p/3934568746073221)

**工具**

- [MarkLLM](https://github.com/THU-BPM/MarkLLM)：文本水印统一工具箱与评测
- [synthid-text](https://github.com/google-deepmind/synthid-text)：Google 开源实现
- [lm-watermarking](https://github.com/jwkirchenbauer/lm-watermarking)：KGW 官方实现
