---
tags:
  - 大模型/开源调研
  - 大模型/新闻
  - SEO
  - 信息源
created: 2026-11-08
updated: 2026-11-08
source: https://github.com/zhuyansen/new-term-radar
status: 已完成
type: 调研报告
---

# new-term-radar：深度调研

> [!abstract] 概述
> new-term-radar（新词雷达）是一个每日运行的 AI 新术语雷达：从 X、Hugging Face、GitHub 与竞品 sitemap 中捕捉「刚开始冒头的名字」（新模型、新产品、新仓库），赶在关键词工具收录之前列出它们。Python 2.1k★（2026-10-12 建仓，一个月达成）/ MIT / 纯标准库零依赖。调研日期 2026-11-08；源码版本 `fe67ff1`（2026-11-03 提交，对应 PyPI 0.6.1），本报告全部代码证据来自本地克隆 `C:\Users\Administrator\AppData\Local\Temp\repos\new-term-radar`，引用为仓库内真实路径。

## 项目定位与背景

作者在 README「为什么做这个」里把问题讲得很透：一个新名字会按固定顺序留下痕迹——① 实验室和大号在 X 上先说出来、模型进入 HF 热门榜；② GitHub 某个仓库自己涨起来；③ 导航站给它加页面、有人注册域名；④ 你自己的站第一次因它有了搜索曝光；⑤ Google Trends 上出现曲线。**关键词工具读的是第 5 步，这已经是几天到几周之后**；雷达每天读第 1 到 4 步，第 5 步只用来复盘自己准不准。

它的原型案例是 Strata（Niko1221/Strata）：仓库 2026-09-24 创建、九天 7.7k★，9 月 26 日起就有人在搜「niko strata」，当时没有任何关键词工具能查到。与 Google Trends / 新闻聚合的差异因此有三层：**时效**（发布当天 vs 滞后数天到数周）、**对象**（它是「名词层」——什么名字开始冒头；新闻是「事件层」——发生了什么）、**可校验**（每条线索 14 天后回到 Trends 核对，按信号统计命中率和提前天数，这是 Trend 类工具不给的）。作者也坦白边界：报告里没有搜索量，雷达只告诉你名字是新的，建页面前请自己查量。

## 架构拆解

**信源采集**。CLI 只有两条节奏（`radar/__main__.py`）：`sources` 每 8 小时跑会按小时变化的信源，`daily` 每天跑一次其余全部；每个信号独立 `run()`，单个失败只留下 error 字段不拖垮整份报告。

- **X**（`radar/sources.py`，付费走 AIsa）：拉取配置账号（labs + bloggers）最近推文，`novel_names()` 只报词表中没有的名字；两个账号都说过直接算数，只有一个账号说的需要「明显是名字 + 100 赞」（`X_MIN_LIKES`），单条病毒帖最多贡献 3 个名字（`PER_POST`）。
- **Hugging Face**（同文件）：公开 API 取 trending 前 50，与上次运行的前 100 快照（`snap.py`，gzip JSON）做差；`_HF_NOISE` 正则循环剥离 `-GGUF`、`-27B-Instruct` 等后缀，把量化版/微调版归并到同一个基础名下（`base_name()`），Spaces 再滤掉 demo/playground 等词。
- **GitHub 爆发**（`radar/breakout.py`）：搜索创建 ≤14 天且 ≥300 星的仓库（两页），命中 `velocity ≥ 200 星/天` 或「比上次快照多 400 星」即爆发；新爆发只报一次（`gh_flagged.json.gz` 记 30 天），并顺手生成搜索变体「owner 句柄 + 仓库名」「owner 显示名 + 仓库名」——因为人们搜的是 `niko strata` 不是 `niko1221 strata`。
- **竞品 sitemap**（`radar/sitemaps.py`）：逐站抓 sitemap（可配索引 + shards 正则选子图），与上次 URL 快照做 diff，`slug_text()` 从新增 URL 路径提词；`pause` 配置要求不低于对方 robots.txt 的 crawl-delay，单站失败跳过并保留旧快照——否则它缺的 URL 明天会假报「新增」。

**「新」的判定逻辑**分四道闸。第一道是词表与快照去重：X 的 60 天词表（`VOCAB_DAYS`）、HF/GitHub/sitemap 各自的上次快照构成「首见时间」——每条线索入库时记 `first_seen`/`last_seen`。第二道是计数防刷：`radar/terms.py` 的 `surges()` 按**去重来源数**计数（一个词出现在多少个不同 URL/账号），与该站自己的基线按窗口比例折算后比 lift，一个长 URL 或一个 prolific 账号造不出假信号；`_drop_nested()` 把同时爆发的嵌套词（`opus 5.5` 与 `5.5`）去重。第三道是模型置信度：`radar/judge.py` 每 25 个词一次小模型调用（默认 gpt-4.1-mini，`judge.min_score` 默认 0.5），每个词附最多 3 处出现原文，打 0–1 分；调用失败报告照发、只是失去排序——judge 只排序、永不阻塞。第四道是**复盘闭环**：`radar/store.py` 的 SQLite `leads` 表（term 主键）存下每条线索，`radar/review.py` 对 14 天前的线索逐个变体查 DataForSEO Trends，「涨了」判定为其峰值超过自身基线的 `max(2×base, base+10)`；`settled()` 显式丢弃 Trends 未结算的最后两天（不相关的词会依次返回 0 和 100，像一个假尖峰——作者第一版自己被骗过）。结论 hit/miss/no_data 加提前天数写回，`store.summary()` 按 60 天窗口输出各信号命中率。

**数据存储与输出形态**：状态就是 `state/` 目录里一个 SQLite + 几个 gzip 快照，「文件很小、可安全放进 CI 缓存或提交」。输出是双语 Markdown（`lang: "zh"` 原生支持）+ 旁路 `report.json`（全部底层数据）；另有邮件（Resend）、MCP 服务器（`recent_leads` 免费读历史线索、`keyword_table`、`run_radar`）和三个 Agent Skill。官方 GitHub Actions（`.github/workflows/radar.yml`）每 8 小时 `sources`、每天 `daily`，状态存 Actions cache，`RADAR_ENABLED` 变量 opt-in。

## 代码质量与成熟度

**4 分（5 分制）**。理由：

- **工程自洽度罕见地高**：`radar/` 约 6200 行 Python、40 个模块，`pyproject.toml` 的 `dependencies = []`——全标准库，装它不会带进任何供应链；每个文件头部的 docstring 把设计动机、成本、失败模式都写清（如 `aisa.py` 注明「失败的批不重试，一个坏日子最多烧一个批」）。
- **测试**：`tests/test_radar.py` 2175 行、152 个测试函数，覆盖名字提取、打分、存储、复盘判定，全部离线（网络调用不打）；CI（`test.yml`）跑 Python 3.10/3.12 双矩阵。
- **诚实的自评**：README「实测过什么，没测过什么」一节给出名字判断的真实数字（拿 170 个词重判，同意 149 个，拒掉的 21 个多为真噪音、真漏约 3 个），并明确说「各信号命中率还没有，唯一手工核验的 Strata 是命中、提前 3 天」——把不确定性写在脸上的开源项目很少见。
- 扣分点：项目仅一个月大（2026-10-12 建仓，0.6.x 高速迭代，近 10 次提交全在 26 天内）；强绑定 AIsa/GoAnyAPI 两个新生意（GoAnyAPI 2026-08 才发布，README 自述实测约十次一次失败）；单维护者，无 issue 社区沉淀（仅 2 个 open issues）。

## 对本知识库的落地方案

先对齐现状：vault 的早报体系是「事件层」——`ai-daily-archive.yml` 定时抓橘鸦日报归档为 `大模型/10-新闻/日报/2026/YYYY-MM/YYYY-MM-DD AI 早报.md`（`type: ai-daily`），`generate-ai-weekly.mjs` 机械聚合成周报；全流程幂等回补、不调 AI、无 secrets、跑在 GitHub Actions 上（工作日不依赖本机开机）。new-term-radar 补的恰好是缺的「名词层」，且其官方 Actions 模式与 vault 现有流水线同构（定时 + 状态外置 + 报告写摘要页），接入成本低。分三档：

**可直接采用（不改代码，当天可跑）**

1. **免费信号档**：README 明确「没有 AIsa key 时，免费信号照常运行，只是不排序」。HF 热门榜、GitHub 爆发、竞品 sitemap、Product Hunt/Show HN/OpenRouter 等都是零成本。本机直接：
   ```bash
   uvx new-term-radar daily --skip x --out report.md
   ```
   建议先手动试跑 3–5 天，观察 `report.json` 里各信号的信噪比，再决定是否接 CI——这是整个方案的第一步，也是单独一步就能完成的事。
2. **机器可读输出直接复用**：`report.json` 与 `python -m radar leads --json`（含复盘结论和各信号命中率）不需要解析 Markdown，适合任何下游脚本消费。
3. **官方 Actions 模板照搬**：`radar.yml` 的 Actions cache 状态管理（restore-keys 前缀恢复、`if: always()` 保存）、`RADAR_ENABLED` opt-in、报告写入 Step Summary——这套模式可直接复制进 vault 仓库，无需自己设计状态持久化。

**需改造（具体到脚本与环节）**

1. **新增 workflow + 归档脚本**：仿 `ai-daily-archive.yml` 新建 `term-radar.yml`（每天 UTC 23:30 一次即可），步骤 2 用 `astral-sh/setup-uv` 跑 `uvx new-term-radar daily --skip x --state state --out report.md`；新增 `.github/scripts/generate-term-radar.mjs`，读取 `report.json` 转写为 `大模型/10-新闻/新词雷达/YYYY-MM/YYYY-MM-DD 新词雷达.md`。脚本沿用 fetch-ai-daily 的三条纪律：幂等（已存在跳过）、先查本地再动网络（这里无网络，改为先查 state 快照）、单次限量。frontmatter 照库规范：`type: term-radar`、`status: 已归档`、`source` 指向 Actions run；注意 `00-新闻索引.md` 的 Dataview 只需加一个 `WHERE type = "term-radar"` 的 TABLE 块——方言在 `dataview-lite.cjs` 支持范围内。
2. **config 定制**：`lang: "zh"` 出中文报告；`sitemaps` 精简为 2–3 个中文导航站（示例配置里 `ai-bot.cn` 现成）；`x_accounts` 保留中文圈博主（`dotey`、`op7418` 已在示例里）。若要 X 信号，加 `AISA_API_KEY` secret，示例配置约 $10/月——**可以先不买**，免费档先验证价值。
3. **与日报板块的接缝**：不建议把雷达内容合进橘鸦日报正文（那是对第三方原文的归档，`status: 已归档` 应保持纯净），独立目录 + 独立索引更干净；若某天有强名字（如新旗舰模型代号），由 DSH 在当日早报手动加一条 WikiLink 指向雷达笔记即可。
4. **MCP 接入 DSH**：README 专门写了 DeepSeek Harness 的 `cordis.patch.yml` 配置片段（`toolCallTimeoutMs: 900000`、`!!js process.env.AISA_API_KEY ?? ''`）。对 vault 场景最有价值的工具是 `recent_leads`（免费、立刻返回）：把 `RADAR_STATE` 指向定时任务写的同一目录，日常对话里问「最近有什么新名字」就有现成答案——这条与 AGENTS.md「维护模式」下 DSH 是唯一编辑器的现状天然契合。
5. **发布侧注意**：站点会公开雷达笔记。数据里混有 DataForSEO/TrustMRR 等来源，README 明确其条款禁止转载发布——归档笔记应只保留**名字、信号类型、首见日期**这类事实字段（这些来自公开信息），不照搬付费数据表。

**仅借鉴思路（不动 radar 本体）**

1. **surges() 的基线判定**（`radar/terms.py`）：「近期去重来源数 ÷ 基线按窗口折算」可以从 vault 自己的日报语料复刻——用 Node 脚本扫 `日报/**/*.md` 提取专名，比对 30 天基线，产出「本库语料首次出现的名词」，完全不依赖外部 API。
2. **复盘闭环**：`review.py` 的「报出 14 天后回到 Trends 核对、按信号算命中率」是一个通用方法论，vault 的早报板块（橘鸦、周报）同样适用——定期回看哪些「要点」真的成了事，比只记不验强。
3. **小算法**：`base_name()` 的模型名后缀清洗、`settled()` 的未结算尾部丢弃、`_drop_nested()` 嵌套去重，任何做词表处理的脚本都值得抄。
4. **「只读 agent」原则**（0.6.1 的全部改动）：线索只做输入，任何对外发布动作前必须有人确认——与 vault 发布流水线的人工卡点一致。

## 风险与边界

- **许可证**：MIT，商用/改造/并入自己流水线均无障碍。
- **信源合规与稳定性**：X 数据走 AIsa 商业 API（合规通道，$0.003/账号次）；sitemap 抓取明确要求尊重 robots.txt crawl-delay（`pause` 配置），README 明确拒绝硬闯 Cloudflare 挑战（「There's An AI For That」一节）——合规姿态良好。但 AIsa/GoAnyAPI 都是新生意，价格与可用性有变数（README 已记录 2026-10-15 AIsa schema 拒绝 DataForSEO filters 的事故与绕过）；免费档不受影响。
- **误报与覆盖盲区**：名字判断实测约 88% 同意率（149/170），且 README 直说「各信号命中率尚未验证，任何信号都应视为未经验证」；X 信号完全取决于账号名单——你的圈子看不到的名字它看不到；内置停用词按 AI 工具领域调，换领域要自己补 `stop_words`；英文圈偏差明显（中文圈名字要靠中文博主账号与中文导航站 sitemap 补）。免费档无模型排序，噪音词会混在报告里。
- **本项目特有**：单维护者、一个月龄、0.6.x 快速迭代，接口和输出结构可能变（好在 `report.json` 结构稳定且 MIT 允许锁版本 `uvx new-term-radar==0.6.1`）；复盘机制要求状态连续（Actions cache 丢失 = 历史线索重置），长期跑要按官方提醒定期下载 `radar-state` artifact。

## 参考资料

- 仓库：https://github.com/zhuyansen/new-term-radar
- PyPI：https://pypi.org/project/new-term-radar/
- 本地克隆源码（`fe67ff1`）：`radar/sources.py`、`radar/terms.py`、`radar/breakout.py`、`radar/sitemaps.py`、`radar/judge.py`、`radar/store.py`、`radar/review.py`、`radar/__main__.py`、`.github/workflows/radar.yml`
- 本库关联：`大模型/10-新闻/00-新闻索引.md`、`.github/workflows/ai-daily-archive.yml`、`.github/scripts/fetch-ai-daily.mjs`、`scripts/DESIGN.md`
- 关联调研：[[大模型/06-论文与报告/开源项目调研/OpenViking：深度调研|OpenViking：深度调研]]
