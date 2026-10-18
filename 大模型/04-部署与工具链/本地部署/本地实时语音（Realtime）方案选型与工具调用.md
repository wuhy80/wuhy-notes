---
tags:
  - 大模型/本地部署
  - 大模型/语音交互
  - Realtime
  - 选型
  - RAG
created: 2026-09-30
updated: 2026-09-30
status: 整理
aliases:
  - 本地 Realtime
  - 全双工语音模型
  - 实时语音架构
source:
  - https://docs.vllm.ai/projects/vllm-omni/en/latest/serving/full_duplex_api/
  - https://docs.vllm.ai/projects/vllm-omni/en/latest/serving/realtime_duplex_api/
  - https://www.qbitai.com/2026/04/410506.html
  - https://www.pingwest.com/w/316318
  - https://developer.aliyun.com/article/1696528
  - https://developer.aliyun.com/article/1712865
  - https://help.aliyun.com/zh/model-studio/omni-realtime-interaction-process
  - https://docs.bigmodel.cn/cn/asyncapi/realtime.md
  - https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/realtime-audio
---

# 本地实时语音（Realtime）方案选型与工具调用

> [!summary] 一句话
> 「Realtime」有两种完全不同的东西：**级联式**（ASR → LLM → TTS，中间必须落文本）和**端到端全双工**（音频进音频出）。本地部署两条路都走得通，但**要调工具、要接 RAG，级联是成本最低的选择**——因为它的中间层是一个标准文本 LLM，工具调用、MCP、RAG 编排全是现成做法。

本文资料截至 **2026 年 9 月底**。语音模型迭代很快，模型名与版本请以官方最新文档为准。

---

## 一、先分清两条路线

| 维度 | 级联式（Cascade） | 端到端全双工（Realtime） |
| --- | --- | --- |
| 数据流 | VAD → ASR → LLM → TTS | 音频进 → 音频出 |
| 中间表示 | **文本**（显式、可读、可审计） | 音频 token / 隐表示 |
| 典型延迟 | 1.5–3s，全流式优化后 ~0.8–1.2s | 0.3–0.8s |
| 打断（barge-in） | 要自己写 VAD + 状态机 + 清空 TTS 队列 | 原生能力 |
| 副语言信息 | **在 ASR 处丢失**（语气、情绪、笑声、语速） | 保留并可模仿 |
| 工具调用 / RAG | **天然支持**，就是普通 LLM 那套 | 取决于模型，多数弱 |
| 可观测性 | 每段可打日志、可插审核 | 黑盒，难审计 |
| 音色 | TTS 任意换、可克隆 | 绑定模型自带音色 |

> [!important] 别把两个问题混在一起
> 「要低延迟自然对话」和「要能查知识库、调工具」是两个需求。前者的答案是端到端全双工模型，后者的答案在**级联**里最省事。很多项目失败就是因为用全双工模型去硬做 RAG。

---

## 二、开源端到端全双工模型清单

| 模型 | 规模 | 对话中调工具 | 硬件门槛 |
| --- | --- | --- | --- |
| **MiniCPM-o 4.5**（面壁智能） | 9B | ❌ | INT4 仅 **12GB 显存** |
| **NemotronLabs VoiceChat 11B**（NVIDIA） | 11B | ✅ **首个支持** | **≥80GB 显存** |
| **Fun-Audio-Chat 8B**（阿里通义百聆） | 8B | ✅ Speech Function Call | 8B 级，消费级可期 |
| **Qwen3-Omni** | 30B-A3B | 一般 | 较大，有昇腾 NPU 教程 |
| **Moshi / Moshiko**（Kyutai） | 7B | ❌ | 低，有 INT4 ONNX 端侧包 |
| **Step-Audio-2-mini**（阶跃） | mini | 有 | 低 |
| **BayLing-Duplex** | — | — | — |

补充说明：

- **MiniCPM-o 4.5**：首个端到端全双工**全模态**模型，Mac M 系列建议内存 >16GB
- **Nemotron VoiceChat 11B**：许可宽松但**仅限研究用途**，暂无托管 API
- **Fun-Audio-Chat 8B**：权重、推理代码、Function Call 示例全部开源
- 其他可关注：GLM-4-Voice、Kimi-Audio、Freeze-Omni、Baichuan-Omni、PersonaPlex（vLLM-Omni 中仍为 turn-based）

### 2.1 MiniCPM-o 4.5：端侧首选

2026 年 2 月发布，4 月公开技术报告（Omni-Flow 流式全模态框架）。四个模块拼成 9B：

```
0.4B SigLIP-ViT（视觉） + 0.3B Whisper-Medium（音频编码）
+ 8B Qwen3-8B（LLM 基座） + 0.3B 轻量语音 Token 解码器
```

关键特性：

- **Omni-Flow 统一时间轴**：把视觉、音频、文本流时分复用地对齐重组，以 **1Hz 持续刷新**环境认知，**不依赖外部 VAD**，原生支持持续感知与自由打断
- **端侧可跑**：已基于 llama.cpp 完成量化，实测 **最低 12GB 显存的 RTX 5070 即可流畅运行全双工模式（RTF 0.4）**，INT4 解码 212 tokens/s
- **Mac 可用**：M1–M5 Max（含 M5 Pro）建议内存 >16GB
- 中英双语实时对话，中文 CER / 英文 WER 低于 CosyVoice2 一类基线；支持参考音频做声音克隆
- **原生兼容"轮次对话"和"全双工流式"两种模式**，可无缝切换
- 官方提供 Windows / macOS 桌面端一键安装包 Comni，以及完整 Demo 前后端代码

> [!warning] 全双工通道下 MiniCPM-o 4.5 的工具调用为「不支持」
> vLLM-Omni 的能力表里明确标注其 `tool calls = no`。要用工具就得走第六节的旁路方案。

### 2.2 NemotronLabs VoiceChat 11B：唯一能"边聊边调工具"的开源全双工

2026 年 8 月发布，混合 Mamba/Transformer 架构，在统一网络内完成流式语音理解与生成：

- Full-Duplex-Bench 1.0：**平滑轮换延迟 448ms**，用户打断接管率 **1.00**
- **首个支持对话过程中实时工具调用的开源全双工模型**，调用 API 时可播**预置话术**避免冷场
- 权重与容器已公开，采用宽松许可协议，但**仅限研究用途**，暂无托管 API
- 部署需 **≥80GB 显存**的 GPU

在 vLLM-Omni 的能力表中：`tool calls = yes`、`supports_session_resume = yes`，但 `supports_barge_in = no`、不支持音频截断。音频参数为 16kHz float32 输入 / 22.05kHz PCM16 输出，按 **1280 样本（80ms）** 帧追加。

### 2.3 Fun-Audio-Chat 8B：中文开源、带 Function Call 示例

阿里通义百聆于 2025 年 12 月开源（继 Fun-ASR-Nano、Fun-CosyVoice3 之后）：

- **端到端 S2S 架构**，无需 ASR + LLM + TTS 拼接
- **双分辨率设计**：Shared LLM 层以 5Hz 处理，SRH 以 25Hz 生成语音，**GPU 计算开销降低近 50%**
- 百万小时多任务数据训练，覆盖音频理解、语音问答、**情感识别**、工具调用
- **Speech Function Call**：自然语音下达指令即自动调用函数，**Function Call 接入示例已开源**

---

## 三、本地级联：工具调用与 RAG 最省事的路线

```
麦克风 → 流式 ASR → 本地 LLM → 流式 TTS → 扬声器
                        ↑
              工具调用 / MCP / RAG / 编排 全在这里
```

| 环节 | 可选组件 |
| --- | --- |
| ASR | FunASR、Fun-ASR-Nano、Whisper 系 |
| LLM | vLLM / Ollama 起 Qwen 系；**函数调用、MCP、RAG 全部现成** |
| TTS | Fun-CosyVoice3、GPT-SoVITS（可克隆音色） |
| 轮次检测 | VAD（silero / webrtcvad）、smart-turn 一类语义端点检测 |
| 编排 | LiveKit Agents、Pipecat、TEN、Unmute（YAML 定义，编译到 Pipecat/LiveKit） |

**延迟优化要点**（四段串行，要重叠执行）：

1. 流式 ASR：不等整句，出 partial 就往下喂
2. LLM 按句切分（标点或语义边界）就送去合成，不等整段生成完
3. TTS 流式合成 + 分块播放
4. 语义端点检测：用模型判断"话说完没"，而不只靠静音时长

> [!note] 级联的天花板
> 即使全部流式化，文本这一层必须"成型"才能过桥，所以延迟压不到端到端模型的水平。但换来的是**完全可控、可审计、可换音色、可插审核**。

---

## 四、vLLM-Omni：本地 Realtime 的服务端

vLLM-Omni 提供全双工运行时（文档 2026-09-28 更新），是本地实时语音目前最完整的开源服务端。

### 4.1 端点

| 端点 | 协议 | 用途 |
| --- | --- | --- |
| `WS /v1/realtime?duplex=1` | OpenAI Realtime 风格事件（规范契约） | 应用与浏览器客户端 |
| `WS /v1/duplex` | 同一 handler 的别名 | 偏爱专用路径的客户端 |
| `DuplexOmni` / `InlineDuplexClient` | 进程内类型化命令与事件 | 免服务端嵌入模型 |

启用条件：模型的 pipeline 声明了 `duplex_plugin`，且部署配置设置 `session_mode: duplex`。

### 4.2 部署命令

```bash
vllm serve openbmb/MiniCPM-o-4_5 --omni \
  --deploy-config vllm_omni/deploy/minicpmo_4_5.yaml \
  --trust-remote-code \
  --port 8091
# 全双工端点：ws://localhost:8091/v1/realtime?duplex=1
```

MiniCPM-o 4.5 的部署配置声明 `session_mode: duplex` 与 `duplex_session.max_sessions: 16`；其客户端预设还设置了 `overlap_policy="listen_only"`、`playback_commit_policy="ack_only"`，并且 **`ref_audio` 必填**（否则会话被拒，报 `ref_audio_required`）。

### 4.3 能力协商表

服务端在 `session.created` 返回 `capabilities`，**客户端必须按 flag 分支，不要按模型名硬编码**：

| 能力 | MiniCPM-o 4.5 | PersonaPlex | Nemotron VoiceChat |
| --- | --- | --- | --- |
| `chunk_period_ms` | 1000 | 80 | 80 |
| `supports_barge_in` | ✅ | ❌ | ❌ |
| `supports_session_resume` | ✅ | ❌ | ✅ |
| `supports_audio_truncate` | ✅ | ❌ | ❌ |
| 视频帧输入 | ✅（Stage 0 消费） | ❌ | ❌ |
| **tool calls** | ❌ | ❌ | ✅ |

### 4.4 会话生命周期

```
session.update（模型/模态/音频格式/会话选项）
  → session.created（读 capabilities）
  → input_audio_buffer.append × N（麦克风音频持续追加）
  → input_audio_buffer.commit（按模型策略在轮次边界提交）
  → response.created / transcript deltas / response.output_audio.delta
  → response.done 或 response.listen
  → playback.ack（播完回报，历史才不说谎）
  → session.close
```

与轮次式 Realtime 的关键差异：**响应进行中输入可以继续**，服务端通过 `overlap.decision` 事件说明这段输入是被延后、当作短应答、还是用于打断输出。

### 4.5 客户端与断线恢复

`vllm_omni.clients.duplex.DuplexClient` 是异步上下文管理器，只依赖标准库 + `pybase64` + `websockets`：

```python
from vllm_omni.clients.duplex import DuplexClient, audio_data_url
from vllm_omni.clients.minicpmo_4_5 import create_duplex_session_config

config = create_duplex_session_config(ref_audio=audio_data_url(Path("reference_voice.wav")))

async with DuplexClient("ws://127.0.0.1:8091/v1/realtime",
                        model="openbmb/MiniCPM-o-4_5", config=config) as client:
    await client.stream_pcm(question, chunk_ms=100)
    await client.commit(create_response=False)
    async for response in client.responses():
        if response.decision == "listen":
            continue
        async for chunk in response.audio():
            play(chunk)
            await client.ack_playback(response.played_ms, response_id=response.response_id)
        await response.wait()
```

- 断线自动重连（默认 5 次、0.25–4s 抖动退避）后发 `session.resume`，从最后确认的 `server_event_seq` 重放并去重
- 服务端保留断开会话 **30 秒**（`disconnect_grace_s`），超时后 resume 失败
- 兼容性分三层：Tier 1 与 OpenAI Realtime **同名同语义**、Tier 2 OpenAI 事件名带 vLLM-Omni 扩展、Tier 3 vLLM-Omni 独有。**存量 Realtime 客户端基本可直接接入**

---

## 五、Realtime 调工具的三种形态

| 形态 | 谁执行工具 | 事件流 | 适合 |
| --- | --- | --- | --- |
| **客户端 Function Calling** | 你的客户端 | `response.function_call_arguments.delta/.done` → 本地执行 → `conversation.item.create` 回传 → `response.create` 续答 | 需要访问内网、要日志、要复用现有工具层 |
| **服务端 MCP** | 平台 | session 里配远程 MCP server URL，平台自动发现 + 执行 + 续答 | 工具已封装成 MCP，想少写胶水代码 |
| **平台内置检索** | 平台 | 联网搜索、向量库 `file_search` | 通用问答，不想自建 RAG |

### 5.1 云端平台的能力对照（作为参照）

| 平台 | 工具能力要点 |
| --- | --- |
| **OpenAI gpt-realtime 系列** | Function Calling + 远程 MCP（session 里配 `"type":"mcp"`，支持 `require_approval`）+ 图片输入。Azure 列出 `gpt-realtime-2.1` / `2.1-mini`，另有 `translate` / `whisper` / `live-transcribe`。连接方式 WebRTC ~100ms / WebSocket ~200ms / **SIP**（可接电话）。**会话上限 60 分钟** |
| **阿里 Qwen-Omni-Realtime** | **FC（客户端执行）与 MCP（服务端执行）可同时配**在 `session.tools`；MCP 带审批流（`mcp_approval_request` / `mcp_approval_response`，审批超时 60s）。默认限制：8 个 MCP server、128 个工具、发现超时 30s、执行超时 30s、累计调用 256 次。**MCP 与 `enable_search` 互斥** |
| **智谱 GLM-Realtime** | `session.tools` 函数调用（**仅 audio 模式**）、`auto_search` 内置联网、支持视频理解。`glm-realtime-flash` / `air`，`server_vad` 与 `client_vad` 可切 |
| **豆包实时语音 3.0** | 支持自定义工具（火山引擎） |

详见 [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]。

### 5.2 out-of-band response：不污染主对话的旁路

`response.create` 时把 `response.conversation` 设为 `"none"`，可以在不影响主对话状态的前提下单独跑一次响应。适合做：后台意图分类、内容审核、结果预取。配合 `response.metadata` 区分回调。

---

## 六、RAG 接入方案

> [!important] Realtime 没有专门的 RAG 接口
> RAG 就是一个注册好的 `search_knowledge_base(query)` 工具。别去找什么「Realtime RAG API」，它不存在。

### 6.1 三种接法

**① 包装成客户端 Function Calling（最推荐）**

```
用户语音提问 → 模型判断需要知识 → 发 function_call
  → 你检索（权限、多路召回、重排、审计全在你这层）
  → 回传"精炼后的片段" → response.create → 模型用语音作答
```

优点：检索层完全可控。代价：多一个 RTT。

**② 封成 MCP server**
平台支持服务端 MCP 时挂上去即可，省掉客户端事件循环。阿里还明确**不额外收 MCP 工具调用费**。

**③ 平台内置向量库 / 联网搜索**
最省事，但召回策略不可控，不适合严肃知识库。

### 6.2 旁路 RAG：给不支持工具调用的全双工模型用

MiniCPM-o 4.5 这类模型不发 function call，但它**会输出文本 token 流**。可以在文本侧挂一个旁路：

```
监听 response.output_text.delta
  → 命中意图（"查一下 / 是多少 / 帮我找"）
  → 后端 RAG 检索（可完全独立，稍慢无妨）
  → conversation.item.create 注入一条 system 消息（检索结果）
  → response.create 让它用语音念出来
```

本质是「模型不主动调工具，我替它调」。这条路在 vLLM-Omni 的 `conversation.item.create` + `session.resume` 之上是可落地的。

---

## 七、工程坑清单

> [!warning] 工具调用会「哑火」，这是体验杀手
> 检索要 800ms，模型就干等着不出声。OpenAI 在 gpt-realtime-2 上专门加了**开场语填充**（先说"让我查一下"）和**并行工具调用 + 语音播报进度**。用别的平台得自己实现：**发出 tool call 的同时让 TTS 播一句占位话术**。Nemotron VoiceChat 也自带"预置话术避免冷场"。

其余必须提前设计的点：

1. **打断与工具调用的竞态**：工具执行中用户插话，`response.cancel` 之后结果回来还续不续答？语义要自己定，平台不会替你决定
2. **回传结果必须精炼**：音频 token 极贵（gpt-realtime-2 音频输入约 \$32 / 输出约 \$64 每 1M token）。**别把整篇文档塞回去**，先二次摘要到几百字
3. **会话时长上限**：云端 Realtime session 最长 60 分钟，到期要重建 session 并恢复上下文
4. **幻觉窗口**：模型可能在工具结果返回前"抢答"。要么用填充话术压住，要么在 prompt 里强约束
5. **审核卡点消失**：级联里文本是天然审核点，Realtime 里没有。可用 `turn_detection.create_response: false`（检测到说话但不自动生成）+ 自己审核后再 `response.create` 补回
6. **许可陷阱**：Nemotron VoiceChat「宽松许可但仅限研究用途」，商用直接出局
7. **显存跨度 6 倍**：12GB（MiniCPM-o INT4）vs 80GB（Nemotron），先算清能不能跑
8. **本地小模型的工具调用可靠性**远低于云端，必须有兜底（参数校验失败就降级为直接回答）
9. **音频帧全进 context**：长会话 KV cache 涨得飞快。vLLM-Omni 对 Qwen3-Omni 有硬预算——最多 4 段音频、8MiB 编码音频、8 张提示图、最近 16 条消息
10. **端侧 RTF 0.4** 意味着延迟余量只有 2.5 倍，别指望多路并发（MiniCPM-o 默认 `max_sessions: 16`，但那是服务端上限，不是端侧能力）

---

## 八、选型决策树

```plaintext
你的核心需求是什么？
  │
  ├─ 语音能查知识库 / 调工具，可控性优先
  │     └─→ 【本地级联】FunASR + vLLM/Qwen + CosyVoice
  │           中间是标准 LLM，工具/RAG/MCP 零改造
  │
  ├─ 要真全双工 + 对话中调工具
  │     ├─ 有 80GB 显存且可接受研究许可 ─→ NemotronLabs VoiceChat 11B
  │     └─ 想要宽松开源许可 ────────────→ Fun-Audio-Chat 8B
  │
  ├─ 端侧 / 消费级显卡 / 要视频理解
  │     └─→ MiniCPM-o 4.5（12GB 可跑）+ 旁路 RAG
  │
  ├─ 中文生产环境、想省心
  │     └─→ Qwen3-Omni + vLLM-Omni
  │
  └─ 数据必须出内网但算力有限
        └─→ 级联全本地化，别碰端到端大模型
```

**场景推荐速查**

| 场景 | 推荐 |
| --- | --- |
| 客服 / IVR / 要审计和 RAG | 级联（或云端 SIP 接入） |
| 口语陪练 / 情感陪伴 / 打断频繁 | 端到端全双工（Nemotron / Fun-Audio-Chat） |
| 个人电脑上的 AI 助手（能看能听能说） | MiniCPM-o 4.5 |
| 电话场景 | 云端 SIP，或级联 + 电话网关 |

---

## 九、推荐的落地姿势：混合架构

**让全双工模型只当"耳朵和嘴"，把重活交给后端普通 LLM。**

```
全双工模型（对话节奏、打断、情绪感知）
        │  function call 或文本旁路
        ↓
后端 orchestrator（普通 LLM + RAG + 工具 + MCP）
        │  返回精炼答案
        ↓
全双工模型播报
```

守住一条线：**往返超过 500ms 的环节都必须配填充话术**，否则省下的钱会变成用户感知到的卡顿。

---

## 十、参考资源

### 官方文档

- [vLLM-Omni 全双工 WebSocket API](https://docs.vllm.ai/projects/vllm-omni/en/latest/serving/full_duplex_api/)
- [vLLM-Omni Realtime Duplex 完整线协议](https://docs.vllm.ai/projects/vllm-omni/en/latest/serving/realtime_duplex_api/)
- [阿里云 Qwen-Omni-Realtime 交互流程（VAD / Manual / Function Calling / MCP）](https://help.aliyun.com/zh/model-studio/omni-realtime-interaction-process)
- [智谱 GLM-Realtime AsyncAPI](https://docs.bigmodel.cn/cn/asyncapi/realtime.md)
- [Azure OpenAI GPT Realtime API](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/realtime-audio)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)

### 模型与项目

- [MiniCPM-o 4.5 技术报告解读（量子位）](https://www.qbitai.com/2026/04/410506.html)
- [MiniCPM-o Demo（含本地安装包）](https://github.com/OpenBMB/MiniCPM-o-Demo)
- [NVIDIA 开源全双工语音模型 VoiceChat 11B（品玩）](https://www.pingwest.com/w/316318)
- [Fun-Audio-Chat 8B 发布说明（阿里云开发者社区）](https://developer.aliyun.com/article/1696528)
- [Fun-Audio-Chat GitHub](https://github.com/FunAudioLLM/Fun-Audio-Chat)
- [Kyutai Moshiko（全双工）](https://huggingface.co/kyutai/moshiko-pytorch-bf16)
- [BayLing-Duplex](https://github.com/BayLing-Models/BayLing-Duplex)
- [Unmute：YAML 定义语音 Agent，编译到 Pipecat / LiveKit](https://github.com/slng-ai/unmute)

### 相关笔记

- [[大模型/04-部署与工具链/本地部署/M3 ULTRA部署|M3 ULTRA部署]] — Apple Silicon 本地部署与 MLX/Ollama 对比
- [[大模型/02-应用开发/MCP/MCP概览|MCP 概览]]
- [[大模型/11-知识管理/知识库方案对比|知识库方案对比]]
- [[大模型/02-应用开发/RAG/18种RAG技术对比测试|18 种 RAG 技术对比测试]]
- [[大模型/05-评测与选型/性能测试/11款英伟达显卡vllm吞吐性能大测试|11 款英伟达显卡 vLLM 吞吐性能大测试]]

---

## 更新日志

### 2026-09-30
- 初始版本：级联 vs 端到端对比、本地模型清单、vLLM-Omni 部署、工具调用三种形态、RAG 接法与旁路方案、坑清单、选型决策树
