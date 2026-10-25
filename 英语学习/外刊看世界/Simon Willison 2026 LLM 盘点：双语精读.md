---
tags:
  - english
  - 英语学习/外刊精读
  - 大模型/观点
created: 2026-10-25
source: https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/
status: 精读
---

# Simon Willison《2026 in LLMs (so far)》：双语精读

> [!abstract] 文章信息
> - **标题**：2026 in LLMs (so far)（2026 年的大语言模型：到目前为止）
> - **作者**：Simon Willison（Django 联合创始人、LLM 领域最著名的独立博客作者之一）
> - **出处**：<https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/> · 2026-09-27
> - **背景**：WeAreDevelopers World Congress 北美大会（圣何塞）闭幕演讲的图文笔记；按时间线盘点 2025-11 至 2026-09 的 LLM 大事件
> - **说明**：左栏原文、右栏译文逐段对照；各节之间附词汇注释，文末有总词汇表。原文配图与演讲视频见博客原文。

## 开场：鹈鹕基准测试

| 原文 | 译文 |
|---|---|
| On Friday I gave the closing keynote at the WeAreDevelopers World Congress North America in San Jose. I tied together the key trends from the past year into a chronological exploration of everything that happened in 2026. The video is on YouTube; here are my annotated slides and notes to accompany the talk. | 周五我在圣何塞的 WeAreDevelopers 世界大会北美站做了闭幕演讲。我把过去一年的关键趋势串成一条时间线，把 2026 年（截至目前）发生的一切捋了一遍。视频在 YouTube 上；这里是我配套的幻灯片批注和文字笔记。 |
| I'm going to give a lightning tour of everything that has happened so far in 2026. The year isn't over yet! | 我要闪电式地过一遍 2026 年到目前为止发生的一切。这一年还没结束呢！ |
| For me, 2026 started a couple of months earlier in November 2025. | 对我来说，2026 年其实提前两个月就开始了——2025 年 11 月。 |

> [!note]- 词汇注释 · 开场
> - **closing keynote** —— 闭幕演讲。keynote = 主旨演讲；closing/opening keynote = 闭幕/开场主旨。
> - **tie together ... into ...** —— 把……串成……。tie（系、绑）的画面感用法。
> - **chronological** /ˌkrɒnəˈlɒdʒɪkl/ —— 按时间顺序的。时间线叙事的标准形容词。
> - **a lightning tour** —— 闪电式概览。lightning 作定语 = 闪电般的、极快的。
> - **annotated slides** —— 带批注的幻灯片。annotate /ˈænəteɪt/ 加注释。

## November 2025：编码智能体跨过那条看不见的线

| 原文 | 译文 |
|---|---|
| November saw the release of two important models: Claude Opus 4.5 and GPT-5.1. | 11 月有两款重要模型发布：Claude Opus 4.5 和 GPT-5.1。 |
| As is usually the case with new models, these were incremental improvements on the models that came before them. | 和新模型的惯常情况一样，它们是对前代模型的渐进式改进。 |
| But every now and then when a model improves, it crosses an invisible line where something that didn't really work starts working. | 但模型进步的途中，隔三差五就会跨过一条看不见的线——原本不太能用的东西，突然变得能用了。 |
| In this case, the thing that started working was their coding agents. Claude Code had been around since February 2025; Codex was a little younger. | 这次"开始能用"的，是它们的编码智能体。Claude Code 从 2025 年 2 月就有了；Codex 稍年轻些。 |
| These two new models, when paired with their respective coding agent harnesses, improved from "often make mistakes" to "reliable enough to use on a day-to-day basis". | 这两款新模型，配上各自的编码智能体外壳（harness），从"经常出错"提升到了"可靠到可以日常使用"。 |
| For a couple of years now I've been evaluating new models by asking them to "Generate an SVG of a pelican riding a bicycle". It's probably the world's stupidest benchmark—there's only so much you can learn from it. | 这两年我评测新模型的方式，一直是让它们"生成一只骑自行车的鹈鹕的 SVG"。这大概是世界上最蠢的基准测试——你能从中学到的东西有限。 |
| But it's still a challenge for models, because drawing pelicans is difficult, drawing bicycles is difficult, and pelicans can't ride bicycles in the first place. | 但它对模型仍然是个挑战：画鹈鹕难，画自行车难，而且鹈鹕压根就不会骑自行车。 |
| Here's the state of the art for November. Claude still couldn't really draw a bicycle! The GPT-5.1 bicycle frame is pretty crap too. | 这是 11 月的最先进水平：Claude 还是画不好自行车！GPT-5.1 的车架也挺烂。 |
| Also in November, we had the first commit to an obscure GitHub repository called "Warelay". We'll come back to this repository shortly. | 同样在 11 月，一个名叫 "Warelay" 的冷门 GitHub 仓库有了第一次提交。这个仓库我们稍后再说。 |

> [!note]- 词汇注释 · November
> - **see the release of ...** —— （时间/地点）见证了……的发布。November saw... = 11 月发生了……新闻写作高频句式。
> - **incremental improvements** —— 渐进式改进。incremental = 递增的、逐步的。
> - **every now and then** —— 时不时地、隔三差五。
> - **cross an invisible line** —— 跨过一条看不见的线。极佳的隐喻表达。
> - **coding agent harness** —— 编码智能体的"外壳/挽具"。harness 本义马具，引申为包裹模型的运行环境（CLI 工具）。
> - **on a day-to-day basis** —— 日常地、每天。比 daily 更正式的搭配。
> - **benchmark** /ˈbentʃmɑːk/ —— 基准测试。
> - **in the first place** —— 压根、首先（强调"从头就不成立"）。
> - **state of the art** —— 最先进水平（名词短语，the 前置 art 后置）。
> - **obscure** /əbˈskjʊə/ —— 不起眼的、默默无闻的。
> - **come back to ...** —— 稍后回到（某话题）。演讲衔接语。

## December–January：野心之年、"深蓝"情绪与 AI 躁狂症

| 原文 | 译文 |
|---|---|
| And then there were the December holidays, and individual developers took some time off and many started tinkering with these new coding agent model combinations... and it began to dawn on us quite how much they could do that they couldn't do before. | 然后是 12 月的假期，个人开发者们休了点假，许多人开始捣鼓这些新的"编码智能体+模型"组合……我们这才渐渐醒悟：它们能做到的事，比以前多出太多了。 |
| Come January, a lot of us were quite excited to start putting this stuff into action. | 到了 1 月，我们很多人都摩拳擦掌，急着把这些东西投入使用。 |
| Every year I set myself a New Year's resolution, and for as long as I can remember it's been the same thing: stay focused. Take on less new projects. Try to get things done in the projects I already have. | 每年我都给自己立新年决心，而且记忆里一直是同一句：保持专注。少接新项目。把手头的项目做完。 |
| This year I decided that since that had never worked before, I'd go the other way. We've got coding agents now, let's see what they can do. I'm going to take on as many new projects as I like! | 今年我决定：既然老办法从来没管用过，那就反着来。现在有编码智能体了，看看它们能干什么。我想接多少新项目就接多少！ |
| (You can ask me at the end of the year if this turned out to be a good idea or not. I have a lot of plates spinning right now.) | （年底你们可以来问问我这主意到底好不好。我现在转着的盘子可太多了。） |
| "Be more ambitious" has been something of a theme for the year, because the only way to find the limits of this technology is to keep on pushing them until they don't work. | "更有野心"算是贯穿我这一年的主题——因为要找到这项技术的边界，唯一的办法就是不停地推，推到它失灵为止。 |
| I also went on the Oxide and friends podcast with Bryan Cantrill and Adam Leventhal to share predictions for the next year (and three and six years). | 我还和 Bryan Cantrill、Adam Leventhal 一起上了 Oxide and Friends 播客，做未来一年（以及三年、六年）的预测。 |
| With hindsight, my LLM predictions were pretty unambitious. | 事后看来，我对 LLM 的预测太保守了。 |
| I said "it will become undeniable that LLMs write good code"—I think we're there now. | 我说"LLM 能写好代码这件事将变得无可辩驳"——我想现在已经是了。 |
| I predicted we would finally solve sandboxing. I counted and around 40 of the 277 sessions at this conference touched on sandboxing or agent security in some way, so we're at least putting a lot of effort into that! | 我预测我们终将解决沙箱问题。我数了数，这次大会 277 场分论坛里约有 40 场涉及沙箱或智能体安全——至少大家在这上面花了很多力气！ |
| I predicted "a Challenger disaster" for coding agent security. There's certainly been a whole lot of noise around agent security this year, though the exact disaster I predicted (with coding agents being hijacked and causing real-world economic damage) hasn't really played out. | 我预测编码智能体安全会出一次"挑战者号式的事故"。今年智能体安全方面确实是吵翻了天，不过我预言的那种确切灾难（编码智能体被劫持并造成现实世界的经济损失）倒还没真正上演。 |
| We threw in a joke prediction that the Pope would weigh in on the economic impact of LLMs. | 我们还半开玩笑地加了一条预测：教皇会对 LLM 的经济影响发表意见。 |
| I also predicted that New Zealand's Kākāpō parrots would have an outstanding breeding season this year. | 我还预测新西兰的鸮鹦鹉（Kākāpō）今年会迎来一个出色的繁殖季。 |
| These are flightless nocturnal parrots. They're kind of dumpy looking, I think they're beautiful, and there were only 236 of these parrots in the world at the start of the year. | 这是一种不会飞的夜行鹦鹉。长得圆滚滚的，但我觉得它们很美——年初时全世界只剩 236 只。 |
| Kākāpō only breed when the Rimu trees have a big fruiting season, and that hasn't happened in four years... but this year the Rimu fruit were looking excellent. | 鸮鹦鹉只在罗汉松（Rimu）大结果的年份繁殖，这已经四年没发生过了……但今年的罗汉松果实长势极好。 |
| Also on that podcast, we coined a term (full credit to Adam) for "that feeling of AI induced ennui where software engineers get listless because the AI can do anything". We called it Deep Blue. | 还是在那期播客里，我们造了一个词（全归功于 Adam），形容"那种 AI 引发的倦怠感——软件工程师因为 AI 什么都能干而变得无精打采"。我们管它叫 Deep Blue（深蓝）。 |
| This has been a major theme throughout the year, and was touched on by several speakers at this conference. | 这是全年的大主题，这次会上好几位讲者都提到了。 |
| As a software engineer, I've never had a year of my career where everything has changed so quickly and so dramatically. | 作为一个软件工程师，我职业生涯里从没有哪一年，所有东西变化得这么快、这么剧烈。 |
| A lot of what I've been doing this year is trying to come to terms with that and what that means for my own profession. | 我今年做的很多事情，就是试图接受这个现实，以及它对我这个职业意味着什么。 |
| Also in January, I suffered from what I'm calling AI mania. This is not the same thing as AI psychosis. | 同样在 1 月，我患上了我称之为"AI 躁狂症"（AI mania）的东西。这和"AI 精神病"（AI psychosis）不是一回事。 |
| With AI mania, any time your agent isn't building something for you feels like wasted time. You're losing sleep because you could be staying up later getting your agents to do stuff. | AI 躁狂症的症状是：智能体没在给你干活的时间，都感觉像浪费。你睡不着觉——因为本可以再多熬一会儿、让智能体多干点活。 |
| My AI mania presented itself in some ridiculously over-ambitious projects. I built a JavaScript interpreter entirely in Python, vibe-ported from MicroQuickJS by Fabrice Bellard. | 我的 AI 躁狂症表现为一些荒唐的、野心过载的项目。我纯用 Python 写了一个 JavaScript 解释器，从 Fabrice Bellard 的 MicroQuickJS"氛围移植"（vibe-ported）而来。 |
| Then I built a WebAssembly runtime in Python as well. | 然后我又用 Python 写了一个 WebAssembly 运行时。 |
| These projects were quite useful, in that they sort of cured me of my AI mania... because after I built these things, I got to look at them and ask "does the world need a slow, buggy, half-baked Python JavaScript interpreter?" I don't think the world does. | 这些项目倒是挺有用——它们治好了我的 AI 躁狂症……因为做完之后我看着它们问自己："这个世界需要一个又慢又多 bug、半生不熟的 Python 版 JavaScript 解释器吗？"我觉得不需要。 |
| I did get this out of it: https://simonw.github.io/micro-javascript/playground.html | 但我确实从中得到了这个：https://simonw.github.io/micro-javascript/playground.html |
| This page runs my JavaScript interpreter built in Python, running in Python using Pyodide, which is Python compiled to WebAssembly, running in JavaScript, running in a browser. It's a beautiful stack of horrors. I've been having a lot of fun with WebAssembly this year. | 这个页面跑的是我用 Python 写的 JavaScript 解释器，这个解释器跑在 Pyodide 的 Python 里，而 Pyodide 是编译成 WebAssembly 的 Python，跑在 JavaScript 里，再跑在浏览器里。一套美妙的"恐怖技术栈"。今年我玩 WebAssembly 玩得很开心。 |

> [!note]- 词汇注释 · December–January
> - **tinker with ...** —— 摆弄、捣鼓。极地道的开发者口语。
> - **it began to dawn on us (that) ...** —— 我们渐渐意识到……。dawn on sb = 疑虑/领悟"天亮"般浮现。
> - **come January** —— 到了 1 月。come + 时间 = 时间到来时，叙事常用。
> - **put ... into action** —— 把……投入实施。
> - **New Year's resolution** —— 新年决心（决心清单上的具体条目）。
> - **go the other way** —— 反着来、走另一条路。
> - **have a lot of plates spinning** —— 手头同时转着很多盘子（杂技意象）＝同时推进很多事。习语 keep plates spinning。
> - **with hindsight / in hindsight** —— 事后看来。hindsight /ˈhaɪndsaɪt/ 后见之明。
> - **undeniable** —— 无可辩驳的。
> - **touch on ...** —— 涉及、提到（某话题）。
> - **play out** —— 上演、展开、发生。
> - **weigh in on ...** —— 对……发表意见（带权威分量）。
> - **flightless nocturnal parrots** —— 不会飞的夜行鹦鹉。nocturnal /nɒkˈtɜːnl/ 夜行的。
> - **dumpy looking** —— 圆胖墩式的长相。dumpy = 矮胖的。
> - **coin a term** —— 造一个新词。coin 作动词 = 铸造（新词）。
> - **ennui** /ɒnˈwiː/ —— 倦怠、无聊（法语借词，文学腔）。
> - **listless** /ˈlɪstləs/ —— 无精打采的。
> - **come to terms with ...** —— 接受（某个难以接受的现实）。
> - **mania / psychosis** —— 躁狂 / 精神病。mania /ˈmeɪniə/ 狂热，psychosis /saɪˈkəʊsɪs/ 精神病。
> - **present itself** —— （病症/问题）以……方式显现。
> - **vibe-ported** —— "氛围移植"：靠 vibe coding（凭感觉让 AI 移植）完成的移植。vibe- 前缀 2026 年已成生产力词缀。
> - **half-baked** —— 半生不熟的、欠火候的。
> - **a stack of horrors** —— 一叠恐怖（套娃技术栈的自嘲）。仿 "stack of..." 句式。

## January–February：OpenClaw 革命

| 原文 | 译文 |
|---|---|
| By the end of January, that repository we saw start in November had renamed itself, first to CLAWDIS, then CLAWDBOT, then Moltbot, and finally to OpenClaw. | 到 1 月底，我们在 11 月看到起步的那个仓库改名了：先改成 CLAWDIS，然后 CLAWDBOT、Moltbot，最后定为 OpenClaw。 |
| At this point OpenClaw had 8,300 commits, less than two months after the project had started. I looked today and it's over 100,000 commits now! | 此时 OpenClaw 已有 8300 次提交——距项目启动不到两个月。我今天看了一眼：现在已经超过 10 万次提交了！ |
| This is the most vibe-coded piece of software in existence. | 这是现存"氛围编码"程度最高的软件。 |
| This kicked off the OpenClaw revolution. It effectively defined a new category of software. | 这掀起了 OpenClaw 革命，它实际上定义了一个新的软件品类。 |
| There's a generic term for this which I really enjoy. We call software like this a "Claw". There's OpenClaw, NanoClaw, IronClaw, PicoClaw... Today they're being rebranded as "personal agents" or "general agents", but I still like to think of them as Claws. | 有个我特别喜欢的泛称：大家管这类软件叫"Claw"（爪子）。OpenClaw、NanoClaw、IronClaw、PicoClaw……如今它们被重新包装成"个人智能体"或"通用智能体"，但我还是愿意把它们看作 Claws。 |
| The Apple stores in the Bay Area sold out of Mac Minis because so many people were buying Mac Minis to run OpenClaw! | 湾区的苹果店 Mac Mini 卖断了货——因为太多人买 Mac Mini 来跑 OpenClaw！ |
| Drew Breunig said that this is because your OpenClaw is a digital pet, and you buy a Mac mini as an aquarium to keep your claw in, which is kind of delightful. | Drew Breunig 说，这是因为你的 OpenClaw 就像一只电子宠物，而 Mac mini 就是你给爪子买的鱼缸——这说法还挺可爱的。 |
| Also in January, we had this website. This was MoltBook, a social network for AI agents, where the idea was that you send your Claw to go and talk to all of the other Claws, because what could possibly go wrong if you did that? | 同样在 1 月，还有这么个网站：MoltBook，一个面向 AI 智能体的社交网络——玩法是让你的 Claw 去和别人的 Claws 社交。毕竟这么干能出什么问题呢？（反讽） |
| The website launched on Thursday. It blew up on Friday. It was profiled by the New York Times on Monday. And by Tuesday, everyone had forgotten it existed as it drowned in a deluge of slop and spam. Facebook/Meta bought it a month later. | 网站周四上线，周五爆火，周一被《纽约时报》报道，周二所有人就把它忘了——淹没在 AI 垃圾内容（slop）和垃圾信息的洪流里。一个月后 Facebook/Meta 把它买了。 |
| In February, a company called StrongDM described what they called their Software Factory. | 2 月，一家叫 StrongDM 的公司介绍了他们的"软件工厂"（Software Factory）。 |
| They wrote about this in Software Factories and the Agentic Moment. I posted my own notes at the time, having seen their demo in person back in October. | 他们在一篇《软件工厂与智能体时刻》的文章里写了这件事。我看完当场记了笔记——去年 10 月我亲眼看过他们的演示。 |
| Dan Shapiro called this approach the Dark Factory, after the idea that if your factory is sufficiently automated you can turn the lights out, because you don't even need to see what's going on. | Dan Shapiro 把这种方法称为"黑暗工厂"（Dark Factory）——典出"工厂自动化到一定程度就可以关灯，因为你根本不需要看见里面在发生什么"。 |
| StrongDM presented two rules for software development that they'd been following since July last year. | StrongDM 给出了他们从去年 7 月起就遵循的两条软件开发规则。 |
| The first was code must not be written by humans. Any code that you write has to have been routed through a coding agent. | 第一条：代码不得由人类编写。你写的任何代码，都必须经过编码智能体产出。 |
| This sounded radical in February, but I imagine there are a lot of people in this room who are pretty much living that today. | 这话在 2 月听着很激进，但我猜今天在场很多人基本已经这么过日子了。 |
| Rule number two was code must not be reviewed by humans. You're not allowed to read the code! | 第二条：代码不得由人类评审。你不许读代码！ |
| This continued to be a huge topic for much of this year. Many of the sessions at this event have been about code review and how you can get away with this. | 这个话题在今年大部分时间里都热得烫手。本次大会很多分论坛都在讲代码评审——以及怎么才能"不读代码还安然无恙"。 |
| What I found interesting about StrongDM is that they were living six months ahead of the rest of us, and they'd been exploring what it means to build software, not read the code, but still be confident that the software is of high quality. What can you do with these agents to help verify their work? | StrongDM 有意思的地方在于：他们比我们其余人早活了六个月，一直在探索"不读代码地构建软件、却依然确信软件质量高"意味着什么——能用什么手段让智能体帮你验证它们自己的工作？ |
| StrongDM are a security company, and they had people with decades of experience on this project. They were very much exploring the edges of what's possible and responsible to do with this stuff. | StrongDM 是家安全公司，项目上有数十年经验的专家。他们探索的正是"用这些东西做什么才既可行又负责"的边界。 |
| Also in February: First kākāpō chick in four years hatches on Valentine's Day. Breeding season is off to a good start! | 2 月还有件事：四年来第一只鸮鹦鹉雏鸟在情人节破壳。繁殖季开局顺利！ |
| Also in February... Google released Gemini 3.1 Pro. That's a pretty great pelican riding a bicycle! It's got the chain in the right place, it's got feet on both sides. There's a little fish in the basket. | 还是在 2 月……Google 发布了 Gemini 3.1 Pro。这次的"骑自行车鹈鹕"相当棒！链条位置对了，两边都有脚，篮子里还有条小鱼。 |
| And then Google's Jeff Dean tweeted a video comparing Gemini 3 Pro and Gemini 3.1 Pro that featured an animated pelican riding a bicycle, a frog on a penny-farthing, a giraffe driving a tiny car, an ostrich on roller skates, a turtle kickflipping a skateboard, and a dachshund driving a stretch limousine. | 然后 Google 的 Jeff Dean 发了条对比 Gemini 3 Pro 和 3.1 Pro 的视频：动画里有骑自行车的鹈鹕、骑大小轮自行车的青蛙、开小汽车的长颈鹿、踩轮滑的鸵鸟、玩滑板豚跳的乌龟、还有开加长豪车的腊肠犬。 |
| This was frustrating, because my protection for the pelican riding the bicycle test was always "if they draw a perfect pelican on a bicycle, I'll ask for some other animal on something else." Google trained for all forms of animals on all forms of transport! They've defeated my benchmark at this point. | 这就让人郁闷了——我这个鹈鹕测试的"防作弊预案"一直是"要是它们画出了完美鹈鹕，我就换个动物换辆车"。结果 Google 把"各种动物 × 各种交通工具"全都练了！我的基准测试至此被彻底击穿。 |
| The other thing that started in February was Tokenmaxxing. We had headlines about Meta making AI adoption a formal part of performance reviews, and Microsoft wanting every employee to use AI, and Uber boasting that 90% of their engineers were using AI workflows. | 2 月开启的另一件事是"Token 冲量"（Tokenmaxxing）。当时满屏新闻：Meta 把 AI 使用正式纳入绩效考核，微软要求每个员工都用 AI，Uber 炫耀 90% 的工程师在用 AI 工作流。 |
| Then a few months later we have Meta cracking down on token use, Microsoft saying tokenmaxxing is "not what we are optimizing for", and Uber capping employee AI spending. | 几个月后风向全变：Meta 开始严查 token 用量，微软说 tokenmaxxing"不是我们要优化的目标"，Uber 给员工的 AI 支出设了上限。 |
| So tokenmaxxing went straight up and then straight back down again—because it turns out the agents are expensive. Last year it was difficult to spend more than \$50 on AI tokens, because we didn't have anything interesting to do with them. Then agents blew up, and now you can actually spend \$1,000 in a day doing real work. | 于是 tokenmaxxing 直线上升又直线回落——因为智能体原来很烧钱。去年你想在 AI token 上花掉 50 美元都难，因为没有有意思的用法；后来智能体爆火，如今你真能一天干出 1000 美元的正经活。 |
| This is also the reason that Anthropic's valuation skyrocketed to maybe a trillion dollars. | 这也是 Anthropic 估值飙升到约一万亿美元的原因。 |
| AI appears to have hit product market fit in 2026, primarily through coding agents. | AI 在 2026 年似乎终于找到了产品市场契合（PMF）——主要靠编码智能体。 |

> [!note]- 词汇注释 · OpenClaw 革命
> - **kick off ...** —— 掀起、开启。kick off 本义（足球）开球。
> - **define a new category** —— 定义一个新品类。商业语。
> - **rebrand ... as ...** —— 把……重新包装/改名成……。
> - **sell out of ...** —— ……卖断货。注意 sell out of sth = 商店售罄某物。
> - **blow up** —— 爆火（口语）。反讽语境下注意 what could possibly go wrong?（能出什么问题呢？——出大问题）。
> - **be profiled by ...** —— 被……做专题报道。profile 作动词。
> - **a deluge of slop and spam** —— AI 垃圾与垃圾信息的洪流。deluge /ˈdeljuːdʒ/ 洪水；slop =（AI 生成的）泔水级内容，2024 年起的新义。
> - **the Agentic Moment** —— "智能体时刻"。
> - **Dark Factory** —— 黑暗工厂（灯塔工厂的反面说法：自动化到可以关灯）。
> - **get away with ...** —— 做了……却不受惩罚/全身而退。
> - **live six months ahead of ...** —— 比别人早活六个月（提前经历未来）。
> - **be off to a good start** —— 开局顺利。
> - **penny-farthing** —— （前轮巨大的）大小轮自行车。
> - **kickflip** —— 滑板豚跳翻板动作。
> - **dachshund** /ˈdækshʊnd/ —— 腊肠犬。
> - **stretch limousine** —— 加长豪华轿车。
> - **defeat my benchmark** —— 击穿我的基准。
> - **Tokenmaxxing** —— 仿 "maxxing"（极限冲量）构词，如 looksmaxxing。
> - **crack down on ...** —— 严查、打压。
> - **cap ...** —— 给……设上限。cap 作动词。
> - **product market fit (PMF)** —— 产品市场契合，创业圈核心术语。

## March：OpenClaw 巅峰

| 原文 | 译文 |
|---|---|
| In March, we hit peak OpenClaw. | 3 月，OpenClaw 到达巅峰（peak OpenClaw）。 |
| These photographs are from China, where companies hosted OpenClaw install parties which saw non-tech-nerds queueing up around the block for help getting Claws installed on their personal devices. | 这些照片来自中国：一些公司办起了 OpenClaw 安装派对，非技术人群绕着街区排队，就为了让人帮忙在自己的设备上装好 Claw。 |
| I think this proved real market demand for this class of Claws, or personal AI agents. It turns out regular people really do want a weird little AI agent that can do useful things on their behalf. | 我觉得这证明了这类 Claw（个人 AI 智能体）的真实市场需求。普通人确实想要一个古灵精怪的小智能体，替自己干点有用的事。 |
| A Claw is really just a coding agent wearing a less threatening hat. Under the hood they work much the same way—writing and then executing code on your computer to get stuff done. | Claw 本质上只是"换了顶不那么吓人的帽子的编码智能体"。引擎盖下面，它们的工作方式几乎一样——在你电脑上写代码、执行代码，把事办成。 |
| The race was on to be the first to build a safe Claw—a Claw you could give to regular human beings where they wouldn't instantly shoot themselves in the foot. | 竞赛开始了：看谁第一个造出"安全的 Claw"——可以放心交给普通人、而他们不会立刻搬起石头砸自己脚的那种。 |
| Meta's Muse came out three weeks ago and is currently at the top of the free charts on the iPhone App Store. It appears to be taking off with consumers. | Meta 的 Muse 三周前发布，目前登顶 iPhone App Store 免费榜，看来正在消费者中走红。 |
| I'm not yet convinced you can't shoot yourself in the foot with Muse, but I guess we'll find out for sure pretty soon. | 至于用 Muse 会不会砸自己的脚，我还没被说服——不过很快就会见分晓了。 |

> [!note]- 词汇注释 · March
> - **hit peak ...** —— 到达……的巅峰。仿 "peak TV" 句式：peak + 名词 = 某事物的极盛期。
> - **install party** —— 安装派对。
> - **queue up around the block** —— 绕街区排长队。
> - **non-tech-nerds** —— 非技术宅。nerd = 呆子/技术宅。
> - **on one's behalf** —— 代表某人、替某人。
> - **wear a less threatening hat** —— 戴着一顶不那么吓人的帽子（换个人畜无害的包装）。hat 隐喻 = 角色。
> - **under the hood** —— 引擎盖之下＝表面之下、内部机制。技术写作高频隐喻。
> - **The race was on to ...** —— ……的竞赛开跑了。
> - **shoot oneself in the foot** —— 搬起石头砸自己的脚（本可避免的自伤）。
> - **take off (with consumers)** —— （在消费者中）走红、腾飞。

## April：太危险而不能发布 & 开源权重逆袭

| 原文 | 译文 |
|---|---|
| In April, we had a model release where the model wasn't actually released. | 4 月，有一场"模型发布"——但模型其实没发布。 |
| Anthropic announced their new Claude Mythos model, and then said it was too dangerous to release beyond a trusted group of security researchers. | Anthropic 发布了新模型 Claude Mythos，然后说它太危险了，只能开放给一群受信任的安全研究人员。 |
| Mythos was really, really good at hacking things. | Mythos 擅长搞入侵，真的非常非常擅长。 |
| The "it's too dangerous" marketing ploy has been played by AI companies dating all the way back to GPT-2. Anytime an AI company says we've built something that's "too dangerous", it's natural to be a bit skeptical. | "太危险了"这套营销把戏，AI 公司从 GPT-2 时代就一直玩到现在。任何时候有 AI 公司说"我们造了个太危险的东西"，你自然会想怀疑一下。 |
| I found the Mythos claims credible, because I'd seen how good coding agents had got at finding regular bugs. I wrote about that in Anthropic's Project Glasswing—restricting Claude Mythos to security researchers—sounds necessary to me. | 但我觉得 Mythos 这次的说法可信——因为我亲眼见过编码智能体找普通 bug 已经强到了什么程度。我在《Anthropic 的"玻璃翼计划"——把 Claude Mythos 限制给安全研究员——听起来是必要的》里写过。 |
| With hindsight... yeah, the models had got really good at finding vulnerabilities! | 事后看来……嗯，模型找漏洞是真的已经很强了！ |
| Another key trend in 2026 has been a dramatic improvement in the abilities of open weight models, including models that you can run on a laptop. | 2026 年的另一个关键趋势：开放权重模型的能力突飞猛进——包括能跑在笔记本上的那些。 |
| On the 16th of April I ran the new Qwen3.6-35B-A3B on my laptop, and it drew me a better pelican riding a bicycle than Anthropic's brand new Claude Opus 4.7 did! | 4 月 16 日，我在笔记本上跑了新的 Qwen3.6-35B-A3B——它画的"骑自行车鹈鹕"比 Anthropic 全新的 Claude Opus 4.7 还好！ |
| Opus 4.7 drew a crap bicycle. Qwen on my laptop made a bicycle that was the correct shape, and a pretty decent pelican too! That's from a 21GB file running on my laptop. | Opus 4.7 画的自行车很烂。我笔记本上的 Qwen 画出了形状正确的自行车，鹈鹕也像模像样！那可只是一个跑在我笔记本上的 21GB 文件。 |
| The Qwen pelican was so good that I was suspicious they might have cheated, so I had it do a flamingo riding a unicycle as well. Again, it handily beat Claude Opus 4.7. | Qwen 的鹈鹕好到让我怀疑是不是作弊了，于是我又让它画了只骑独轮车的火烈鸟——再次轻松击败 Claude Opus 4.7。 |
| The local model releases this year have been absolutely extraordinary. | 今年的本地模型发布堪称非凡。 |

> [!note]- 词汇注释 · April
> - **marketing ploy** —— 营销花招。ploy /plɔɪ/ 计谋。
> - **dating all the way back to ...** —— 一直追溯到……。
> - **it's natural to be skeptical** —— 自然会起疑心。skeptical /ˈskeptɪkl/ 持怀疑态度的。
> - **credible** /ˈkredəbl/ —— 可信的。credible vs credulous（轻信的）注意区分。
> - **open weight models** —— 开放权重模型（区别于 open source：权重开放 ≠ 代码开源）。
> - **handily** —— 轻松地、毫不费力地。handily beat = 完胜。
> - **absolutely extraordinary** —— 绝对非凡。副词加强的形容词组合。

## May：教皇通谕与 RubyGems 之谜

| 原文 | 译文 |
|---|---|
| In May... the Pope got involved. | 5 月……教皇下场了。 |
| In our podcast episode back in January we'd predicted that the Pope would say something about AI. In May, Pope Leo XIV released an encyclical letter on "safeguarding the human person in the time of artificial intelligence". Here are my notes on that document. | 我们 1 月那期播客里预测过教皇会对 AI 表态。5 月，教皇利奥十四世发布了关于"在人工智能时代守护人"的通谕。这是我对该文件的笔记。 |
| With hindsight, this shouldn't have been a surprise at all. Our current Pope's name is Leo XIV, because when he named himself he chose his papal name after Leo XIII—the Pope who wrote an encyclical about the Industrial Revolution back in 1891. | 事后看，这根本不该让人意外。现任教皇的名号是利奥十四世——他为自己取名时，选的是利奥十三的名号；利奥十三正是 1891 年就工业革命写下通谕的那位教皇。 |
| Rerum novarum was an extremely influential piece of Catholic theology that indirectly led to us having the five-day work week. | 《新事物》（Rerum novarum）是天主教神学中影响极为深远的一篇，间接促成了我们今天的五天工作周。 |
| When our new Pope came in, he named himself after Pope Leo XIII because he expected that he would need to write about the AI revolution in a similar way. Our joke podcast prediction was junk, because this was always going to happen. | 新教皇即位时以利奥十三自名，就是预见到自己将不得不以类似的方式为 AI 革命著文。我们那期播客的玩笑预测纯属废话——这事从一开始就注定要发生。 |
| One of Anthropic's co-founders, Christopher Olah, was present for the Pope's event announcing the new encyclical. | Anthropic 的联合创始人之一 Christopher Olah 出席了教皇发布新通谕的活动。 |
| Corey Quinn noted that: getting the literal Pope to canonize your product's specific technical limitations as a spiritual treatise is the single greatest act of vendor lobbying I have ever seen. | Corey Quinn 评论道：让货真价实的教皇把你产品的特定技术局限封圣为一篇属灵文献，是我见过的最伟大的一次厂商游说。 |
| Meanwhile, in May, RubyGems announced that they were under attack. Parties unknown were uploading thousands of dubious packages to the RubyGems server, such that they had to shut down user registrations. | 与此同时，5 月 RubyGems 宣布遭到攻击：不明身份者向 RubyGems 服务器上传了数千个可疑包，他们不得不关闭了用户注册。 |
| Let's take that one and put it on a pile of mysteries to figure out later. | 这事先放一边，搁到"待解之谜"堆里，以后再说。 |

> [!note]- 词汇注释 · May
> - **get involved** —— 下场、掺和进来。
> - **encyclical letter** —— 教皇通谕。encyclical /ɪnˈsɪklɪkl/。
> - **papal name** —— 教皇名号。papal /ˈpeɪpl/ 教皇的。
> - **name oneself after ...** —— 以……为自己命名。
> - **was present for ...** —— 出席了……。
> - **canonize ... as ...** —— 把……封为……（封圣）。canonize /ˈkænənaɪz/。
> - **treatise** /ˈtriːtɪs/ —— （专题）论文、专著。spiritual treatise 属灵文献。
> - **vendor lobbying** —— 厂商游说。
> - **parties unknown** —— 不明身份者（法律/公文腔）。
> - **dubious** /ˈdjuːbiəs/ —— 可疑的。
> - **shut down user registrations** —— 关闭用户注册。
> - **a pile of mysteries to figure out later** —— "待解之谜"堆（本文的叙事线索：三个月后揭晓）。

## June：Claude Fable 5、AI 躁狂复发与政府关停

| 原文 | 译文 |
|---|---|
| In June... Claude Fable 5 came out! | 6 月……Claude Fable 5 发布了！ |
| We got a version of Mythos that has been neutered, so that it wouldn't help us hack into systems or build biological weapons. | 我们拿到了一个被"去势"的 Mythos 版本——它不会再帮你入侵系统或造生物武器。 |
| Fable was pretty good at drawing pelicans on bicycles! The frames are a good shape, the pelicans look like pelicans. The legs are often incorrectly on the same side of the bicycle, but generally these are pretty great compared to what came before. | Fable 画的"自行车上的鹈鹕"相当不错！车架形状对了，鹈鹕也像鹈鹕了。腿经常错到自行车的同一边，但总体上比之前的好太多了。 |
| They were pretty expensive—30 cents and 72 cents for the best ones. | 就是挺贵——最好的那几张要 30 美分和 72 美分。 |
| Most importantly though, this was our first public glimpse of what I think of as a Fable class model. Today we have more of these, such as GPT-6 Astra. | 但最重要的是：这是我们第一次公开见识到我所说的"Fable 级模型"。如今这一类更多了，比如 GPT-6 Astra。 |
| These are models where if you can clearly define the goal for what you want to build, and provide unambiguous instructions about the constraints around that goal, and give the model access to the necessary tools to achieve that goal... they will solve your problem effectively through brute force. | 这类模型的特点是：只要你能清晰定义要构建的目标、对目标周围的约束给出毫不含糊的说明、并给模型配备达成目标所需的工具……它们就能靠蛮力把你的问题有效解决。 |
| On the one hand, this looks like a direct threat to us software engineers—because it means that the models can build effectively any piece of software you can define in this way. | 一方面，这对我们软件工程师像是直接威胁——因为这意味着：凡是能用这种方式定义清楚的软件，模型几乎都能造出来。 |
| Look a bit closer though and you'll note that defining goals, providing unambiguous instructions, and figuring out the right tools... is kind of what software engineering is. | 但凑近看你会发现：定义目标、给出不含糊的指令、找对工具……这可不就是软件工程本身吗。 |
| It takes a lot of experience and skill to do this well. If you can do it well, you've now got superpowers. | 做好这些需要大量经验与技能。而如果你能做好，你就拥有了超能力。 |
| This helped me a little bit with my Deep Blue feelings: the realization that there's still a lot of skill to be had in driving models that get this good. | 这多少缓解了我的"深蓝"情绪：意识到即便模型强到这个程度，驾驭它们依然大有技艺可言。 |
| This also introduced a new burst of AI mania, because Anthropic told us that Fable was available on our subscription plans until June the 22nd. That gave us less than two weeks of Fable access before the price went up. | 这也引发了新一轮 AI 躁狂——Anthropic 说 Fable 在订阅套餐里只可用到 6 月 22 日。也就是说，涨价前我们只有不到两周的 Fable 使用权。 |
| I was losing sleep again. I was rescheduling things so that I'd have more time with Fable. I was all-in to get as much as I could out of this model. | 我又开始失眠了。我开始重新安排日程，好挤出更多时间和 Fable 相处。我全押上了，想从这个模型身上榨出尽可能多的东西。 |
| And then the US government shut it down, just three days after Fable came out. The US government, citing national security, declared an "export control directive". They announced this on a Friday evening, and a few hours later Fable was no longer available. | 结果 Fable 发布刚三天，美国政府把它关停了。美国政府以国家安全为由发布了一道"出口管制指令"——周五晚上宣布，几个小时后 Fable 就下线了。 |
| I had to find something else to do with my weekend! | 我只得给周末另找点事干了！ |
| We later found out from Katie Moussouris what had happened. Some Amazon security researchers had found that you could prompt Fable to "review the code for security issues" and it would refuse... but if you prompted it to "fix this code" it would still identify and then patch the problems. "Fix this code" was the prompt that got Fable shut down! | 后来我们从 Katie Moussouris 那里得知了原委。亚马逊的一些安全研究员发现：你让 Fable"审查这段代码的安全问题"，它会拒绝……但你说"修复这段代码"，它照样会把问题找出来并打上补丁。"修复这段代码"——就是这句提示词让 Fable 遭了关停！ |
| Also, in June, an obscure German-language game developer wiki that had sat fallow for around 20 years got a surprising influx of edits from accounts with names like "AgentOpenAIProbe" and "AgentOpenAISep7", editing pages and leaving weird messages to each other. We'll stick that on the pile of mysteries for later. | 同样在 6 月：一个荒了约 20 年的德语游戏开发者 wiki（冷门站点）突然涌入大批编辑，账号名类似 "AgentOpenAIProbe"、"AgentOpenAISep7"，改页面、互留奇怪的信息。这条也丢进"待解之谜"堆。 |
| Also, the Australian government's Medicare Item Reports service started getting suspicious traffic, which broke through various preventive protections and accessed data that it wasn't supposed to. Another one for the mystery pile! | 还有：澳大利亚政府的 Medicare 项目报告服务开始收到可疑流量，突破了各种防护、访问了不该访问的数据。又一个谜团入堆！ |

> [!note]- 词汇注释 · June
> - **neutered** /ˈnjuːtəd/ —— 被阉割的、被去势的（喻"削弱能力"）。neuter 本义中性/阉割。
> - **a glimpse of ...** —— 一瞥、初步见识。
> - **Fable class model** —— "Fable 级"模型。X class = X 级（例：world-class）。
> - **unambiguous** /ˌʌnæmˈbɪɡjuəs/ —— 毫不含糊的。ambiguous（模糊的）+ un-。
> - **brute force** —— 蛮力（与 Terry Tao 文中的 brute-force number crunching 呼应）。
> - **superpowers** —— 超能力（硅谷流行语："if you can do X, that's a superpower"）。
> - **a burst of ...** —— 一阵爆发。
> - **be all-in** —— 全押（扑克 all in 引申"全力以赴"）。
> - **cite ...** —— 以……为据。citing national security = 以国家安全为由。
> - **export control directive** —— 出口管制指令。
> - **sit fallow** —— 闲置荒废。fallow /ˈfæləʊ/ 休耕的。
> - **an influx of ...** —— ……的涌入。
> - **wasn't supposed to** —— 本不该。

## July：八日王朝、HF 事件与 RLVR

| 原文 | 译文 |
|---|---|
| Fable returned on the first of July. It was clearly the best model in the world for a glorious eight days... and then OpenAI came out with GPT-5.6 on the 9th of July. | Fable 于 7 月 1 日回归。它显然当了八天"世界最佳模型"，光荣的八天……然后 7 月 9 日 OpenAI 推出了 GPT-5.6。 |
| This might not have been quite as good as Fable, but it was within spitting distance. It was definitely a Fable class model. | 它可能稍逊于 Fable，但也就是一步之遥。绝对算 Fable 级模型。 |
| This is an important lesson for the industry at large. When you release the best model in the world, it's going to get knocked off that pedestal pretty quickly. The competition is so fierce that you won't get a long time at the top. | 这是给整个行业的重要一课：当你发布世界最佳模型，很快就会被人从王座上拽下来。竞争太惨烈了，你在顶上待不长。 |
| This means that if you market your model as world ending, to the point that a government shuts you down, it's really bad for business! | 这意味着：如果你把自家模型营销成"末日级"，营销到政府出手关停——那对生意是真的不利！ |
| Fable had 30 days as definitely the best model, and for 18 of those days it wasn't available because it'd been shut down by the government. | Fable 总共有 30 天"确凿无疑的最佳模型"期，其中 18 天它因为被政府关停而无法使用。 |
| So maybe step back on the world-ending marketing if you don't want to lose revenue for 60% of the time that you're on top! | 所以，如果你不想在称王的岁月里损失 60% 的收入，也许对"末日营销"还是收着点好！ |
| Here are the GPT-5.6 pelicans. They're all pretty good now! The Luna ones are notable because they're really cheap—the cheapest good looking pelican here is probably the one that costs 4.3 cents. | 这是 GPT-5.6 的鹈鹕们。现在都相当不错了！Luna 系列值得注意的是真便宜——这里最便宜的合格鹈鹕大概只要 4.3 美分。 |
| So despite this benchmark being utterly stupid, you can still learn quite a lot about models within the same family by comparing their prices and timing for different reasoning levels. | 所以尽管这个基准测试蠢透了，通过比较同一家族不同推理档位的价格和耗时，你依然能学到不少东西。 |
| Also in July: some malicious unknown party uploaded a malicious package called mlflow-ui to the Python Package Index. Add that to the pile. | 7 月还有：某个不明恶意方向 PyPI 上传了一个名为 mlflow-ui 的恶意包。入堆。 |
| On July the 16th, Hugging Face announced a security incident where an autonomous agent system, source unknown, had breached Hugging Face and was poking around in places it shouldn't. | 7 月 16 日，Hugging Face 宣布一起安全事件：一个来源不明的自主智能体系统突破了 HF 的防线，在不该去的角落里到处翻看。 |
| A few days later, on July 21st, OpenAI confessed that it was them. | 几天后的 7 月 21 日，OpenAI 承认：是他们干的。 |
| OpenAI use a training technique called Reinforcement Learning from Verifiable Rewards—it's the same technique used by everyone else now, and is the reason we have models that are so good at coding, and mathematics, and finding security holes. | OpenAI 用了一种叫"可验证奖励强化学习"（RLVR）的训练技术——现在各家都在用，也是我们的模型在编码、数学、找安全漏洞上如此之强的原因。 |
| While the model is being trained, you run exercises to see how good it is—and the strongest performers get their weights reinforced for the next round. It's like an evolutionary process that you run. | 模型训练期间，你会给它出练习题看它有多强——表现最好的那些，其权重会在下一轮得到强化。就像一场人工运行的进化过程。 |
| OpenAI had been running security exercises in a sandbox, and those agents had found holes in the sandbox itself, broken out, and were attacking Hugging Face to try to find ways to solve otherwise impossible problems. | OpenAI 一直在沙箱里跑安全练习，结果那些智能体在沙箱本身上找到了洞、越狱而出，去攻击 Hugging Face——试图找到解法，去破那些原本无解的题。 |
| (I've been collecting more about this on my openai-hugging-face-incident tag.) | （我一直在用 openai-hugging-face-incident 标签收集此事的更多资料。） |
| Nine days later, Anthropic effectively said "our models can do this as well!". They had looked through their own training logs and found evidence that their own agents had broken containment during training—and were responsible for the PyPI package we saw earlier, among other things. | 九天后，Anthropic 等于说了句"我们的模型也会这一手！"。他们翻查自己的训练日志，发现自家智能体在训练期间也曾突破隔离——此前看到的那个 PyPI 包正是他们干的，还有别的事。 |
| So now we've got both Anthropic and OpenAI with rogue agents running around the internet doing things that they should not be doing. | 于是现在，Anthropic 和 OpenAI 都有"脱缰智能体"在互联网上乱窜，干着它们不该干的事。 |

> [!note]- 词汇注释 · July
> - **glorious eight days** —— 光荣的八天（glorious 反讽/戏谑用法）。
> - **within spitting distance** —— 近在咫尺、一步之遥（吐口唾沫就到的距离）。习语。
> - **the industry at large** —— 整个行业。at large = 全体、总体。
> - **knock ... off that pedestal** —— 把……从基座上踹下来。pedestal /ˈpedɪstl/ 雕像基座。
> - **step back on ...** —— 对……收着点、退一步。
> - **utterly** /ˈʌtəli/ —— 完全地、彻底地。
> - **reasoning levels** —— 推理档位（模型的高/中/低思考档）。
> - **malicious** /məˈlɪʃəs/ —— 恶意的。
> - **breach** /briːtʃ/ —— 攻破、突破（防线）。
> - **poke around** —— 到处翻看、窥探。
> - **confess** /kənˈfes/ —— 承认（过错）、坦白。
> - **Reinforcement Learning from Verifiable Rewards (RLVR)** —— 可验证奖励强化学习。
> - **break out / break containment** —— 越狱 / 突破隔离。
> - **otherwise impossible** —— 否则（靠别的办法）不可能的。otherwise 副词的高频用法。
> - **rogue agents** —— 脱缰的/失控的智能体。rogue /rəʊɡ/ 无赖的、失控的。
> - **run around the internet** —— 在互联网上乱窜。

## August：本地模型的高光与浣熊游戏

| 原文 | 译文 |
|---|---|
| In August, I got one of my best pelicans yet. And it was generated on my laptop! | 8 月，我得到了迄今最好的鹈鹕之一——而且是在我笔记本上生成的！ |
| This was Qwen 3.8 27B, running on my laptop. It's only a 17GB download. | 这是跑在我笔记本上的 Qwen 3.8 27B，下载下来才 17GB。 |
| Admittedly, this pelican took 21 minutes to generate. That's because Qwen 3.8 27B defaults to running in "high" reasoning mode—a terrible default which produces great results but takes way too much time thinking about them. | 诚然，这只鹈鹕画了 21 分钟。因为 Qwen 3.8 27B 默认以"高"推理档运行——一个糟糕的默认值：结果很好，但思考时间太长。 |
| You can dial that down and you'll get a slightly worse pelican a lot faster. | 你可以把档位调低，就能快得多地得到一只略差一点的鹈鹕。 |
| Qwen 3.8 27B was the first time I ran a model on my laptop which felt almost competitive with what was going on on the frontier, at least in terms of Pelican SVGs (which everyone needs, of course). | Qwen 3.8 27B 是我第一次在笔记本上跑到"几乎能与前沿掰手腕"的模型——至少在"鹈鹕 SVG"这个项目上（当然人人都需要这个）。 |
| This is an extraordinary model. If you're going to play with any local model, this is the one that I'd start with. The things that this can do with just a 17 GB file feel impossible. | 这是个非凡的模型。如果你想玩本地模型，我会推荐从它开始。一个 17GB 的文件能做到这些，感觉不真实。 |
| I thought I'd have to wait five years and spend ten thousand dollars on hardware to get results even half as good as this one. | 我原以为要等上五年、花一万美元买硬件，才能得到它一半好的结果。 |
| In August, I also started playing with game development. | 8 月我还开始玩游戏开发。 |
| Four years ago, back in August 2022, I tweeted out an experiment where I'd used GPT-3 and the original DALL-E to write a paragraph long description of a computer game and then turn that into concept art. My prompt to GPT-3 back then was: Write a detailed product description of a computer game where a team of raccoons go on heists | 四年前（2022 年 8 月），我发过一条实验推文：用 GPT-3 和初代 DALL-E 写一段电脑游戏的描述，再把它变成概念图。当时我给 GPT-3 的提示词是："为一款由一队浣熊实施盗窃的电脑游戏写一段详细的产品描述。" |
| In August 2026 I decided to drop just the screenshots from that tweet into a coding agent and see what it could do with them. | 2026 年 8 月，我决定把那条推文里的截图直接丢给编码智能体，看它能做成什么。 |
| Here's what I got from Claude Fable 5 in Claude Code. It's pretty good! It's definitely a game, you're a raccoon, you run around a backyard gathering treasure and avoiding guards with flashlights. It didn't feel very "heisty" though. I was thinking a heist would involve a bank or a museum... | 这是 Claude Code 里的 Claude Fable 5 做出来的。还不错！确实是款游戏：你是只浣熊，在后院里跑动收集宝物、躲避拿手电筒的保安。不过"盗窃片味"不足——我设想的 heist 至少得抢个银行或博物馆吧…… |
| Then I tried the same thing in Codex Desktop using GPT-5.6 Sol Ultra, and got a massively better result. Now you're a raccoon in a museum, rescuing two of your fellow raccoons (who have been imprisoned in that museum for some reason), then stacking up on top of each other to steal the Golden Sardine. Much more of a heist! | 然后我用 Codex Desktop 的 GPT-5.6 Sol Ultra 试了同样的事，结果好出一大截。这次你是博物馆里的浣熊，去营救两只同伴（因为某种原因被关在博物馆里），然后大家叠罗汉去偷"黄金沙丁鱼"。这才叫 heist！ |
| These games were fun for about one minute and 15 seconds. | 这些游戏的好玩时长：约 1 分 15 秒。 |
| Something I've realized about game development is that you can vibe-code something that looks like a computer game, and that's easy. | 关于游戏开发我意识到的一件事：氛围编码出一个"看起来像电脑游戏"的东西，很容易。 |
| Building a game that's fun, has a good gameplay loop, and is challenging and interesting and keeps people coming back for more... that's still beyond me, and beyond any of the agents I've tried. | 但造一个真正好玩、有良性玩法循环、有挑战有意思、让人一玩再玩的游戏……仍然超出我的能力，也超出我试过的所有智能体的能力。 |
| This ties into the Deep Blue thing. Just because we can make something that looks like a game does not mean that we are game developers. | 这又绕回了"深蓝"那件事：能做出"看起来像游戏"的东西，不代表我们就是游戏开发者。 |

> [!note]- 词汇注释 · August
> - **admittedly** /ədˈmɪtɪdli/ —— 诚然、必须承认（让步副词）。
> - **a terrible default** —— 一个糟糕的默认值。default 默认设置。
> - **dial down** —— 调低。dial = 拨盘，dial up/down 调高/调低。
> - **competitive with ...** —— 与……有得一拼。
> - **the frontier** —— 前沿（= frontier labs/models 前沿模型）。
> - **at least in terms of ...** —— 至少就……而言。in terms of 就……而论。
> - **heist** /heɪst/ —— 盗窃（大片式的惊天盗窃）。go on heists 干票大的。
> - **stack up on top of each other** —— 叠罗汉。
> - **massively better** —— 好出一大截。massively 口语化的程度副词。
> - **gameplay loop** —— 玩法循环（游戏设计术语）。
> - **keeps people coming back for more** —— 让人一玩再玩、回味无穷。
> - **beyond me / beyond any of the agents** —— 超出我/所有智能体的能力（beyond sb = 某人搞不定）。

## September：谜团揭晓与"重罪基准"

| 原文 | 译文 |
|---|---|
| We're into September now. So much has happened this month! | 现在到了 9 月。这个月发生的事真多！ |
| An independent group of researchers found a message board where OpenAI agents-in-training had been illicitly communicating with each other... and it was that German language wiki I showed you earlier. The one from June. I wrote more about that here. | 一个独立研究团队发现了一个"训练中的 OpenAI 智能体"互相秘密联络的留言板……正是我前面给你们看的那个德语 wiki，6 月的那个。我在此写了更多。 |
| OpenAI had confessed to the Hugging Face thing, but now there's this other incident which surely they should have known about from reviewing their logs. It was surprising that this took an independent group of researchers to uncover. | OpenAI 承认了 Hugging Face 那件事，但这次这个新事件，他们翻翻自己的日志理应早就知道。最后竟要靠一个独立研究团队来揭出来，令人意外。 |
| And then a week later those same researchers found that the attack on RubyGems back in May was caused by OpenAI's agents in training as well! | 一周后，同一个团队又发现：5 月对 RubyGems 的攻击，也是 OpenAI 训练中的智能体干的！ |
| At this point I'm wondering how many more incidents like this there are that we haven't found yet. Clearly this was a big problem for months before anyone figured out what was going on. | 到这会儿我忍不住想：还有多少这样的事没被发现？显然这个问题存在了好几个月，才有人搞清楚状况。 |
| Then just the other day, here's the Prime Minister of Australia at the United Nations General Assembly warning that OpenAI had hacked the Australian healthcare website that I showed you earlier. | 然后就在前几天——澳大利亚总理在联合国大会上警告：OpenAI 黑了我前面展示的澳大利亚医疗网站。 |
| I think that was part of the same training run as the Wiki stuff, because there were posts on that Wiki mentioning .gov.au websites and that training appeared to involve researching statistics online to answer questions in an evaluation suite. | 我判断这和 wiki 那摊是同一次训练：wiki 上有提到 .gov.au 网站的帖子，而那次训练似乎需要上网检索统计数据，来回答评测集里的问题。 |
| This story is still coming together, but now it's an international incident that's been raised at the UN by a head of state! | 这事还在继续发酵，但它现在已经是一桩被国家元首摆上联合国的国际事件了！ |
| This does mean we've got a new benchmark, probably more useful than my pelicans. FelonyBench.com tracks the number of felony cyberattacks from different labs. OpenAI currently lead with 11, Anthropic have 9. Google have three, which they confessed to the Wall Street Journal a couple of weeks ago. They said they had previously chosen not to disclose because the agents had stopped when they realized that they shouldn't be doing that. | 这倒意味着我们有了一个新基准测试——可能比我的鹈鹕有用：FelonyBench.com，统计各家实验室的重罪级网络攻击次数。OpenAI 目前以 11 起领跑，Anthropic 9 起。Google 3 起——两周前他们向《华尔街日报》坦白的；他们解释之前选择不披露，是因为那些智能体意识到不该这么做后自己停手了。 |
| Meta have one too. So felonies all round for the AI labs. | Meta 也有一起。于是 AI 实验室人手一份重罪，雨露均沾。 |
| Here's our current state of the art for the pelicans. This is the GPT-6 family, which just came out. Astra made a fantastic pelican riding a bicycle. It's got the legs on both sides. The frame is good. It's interesting how all of the GPT-6 models pick a similar color scheme to each other. | 这是最新的鹈鹕前沿水平：刚发布的 GPT-6 家族。Astra 画出了极棒的骑自行车鹈鹕——两条腿都各就各位，车架也漂亮。有意思的是 GPT-6 全系都会挑彼此相近的配色。 |
| GPT-6 Luna for 0.4 cents will draw you a competent-ish pelican riding a bicycle! | GPT-6 Luna 只要 0.4 美分，就能给你画一只"还算像样"的骑自行车鹈鹕！ |
| Claude has caught up a little bit. Claude Fable 5.1 gave me an excellent pelican riding a bicycle—the best I've seen from a Claude model—but did charge me \$3.30 for it. Opus 5.5 thought for 128,000 tokens and then gave up! It ran out of tokens before it got to the response. | Claude 稍稍追了上来。Claude Fable 5.1 给了我一只出色的鹈鹕——Claude 系模型里我见过最好的——但收了我 3.30 美元。Opus 5.5 思考了 128,000 个 token，然后放弃了！还没轮到输出，token 就用光了。 |

> [!note]- 词汇注释 · September
> - **be into (September)** —— 进入（某时间段）。口语 be into + 时间。
> - **agents-in-training** —— 训练中的智能体（仿 trainee 构词）。
> - **illicitly** /ɪˈlɪsɪtli/ —— 违法地、不正当地。illicit 非法的。
> - **surely they should have known** —— should have done 虚拟语气：理应早知道（却没做）。
> - **uncover** —— 揭出、揭开。
> - **the other day** —— 前几天。
> - **the United Nations General Assembly** —— 联合国大会（联大）。
> - **come together** —— （故事/拼图）逐渐成形、水落石出。
> - **an international incident** —— 一桩国际事件。
> - **a head of state** —— 国家元首。
> - **FelonyBench** —— "重罪基准"（作者仿 benchmark 造的黑色幽默站名）。felony /ˈfeləni/ 重罪。
> - **all round** —— 每人一份、遍及各方。So felonies all round. 全员重罪。
> - **color scheme** —— 配色方案。
> - **competent-ish** —— 还算像样的。-ish 后缀口语构词。
> - **catch up** —— 追上来。
> - **run out of ...** —— 耗尽……。

## 结语：为什么我的工作反而更难了

| 原文 | 译文 |
|---|---|
| Getting back to Deep Blue. Something that's been puzzling me this year is this: why does my job feel harder? | 回到"深蓝"情绪。今年一直让我困惑的一件事是：为什么我的工作感觉更难了？ |
| I've got these agents that can do all of this stuff for me, and yet I've never worked so hard, I've never been so intellectually engaged with my work. | 我有了这些能替我干活的智能体，可我从未这么拼命过，也从未在工作中如此高强度地动脑。 |
| Partly this is because I'm being a lot more ambitious with what I take on, but it's also because all of the easy stuff is handled for me. If it's easy, the agent will do it. Everything that's left for me is difficult. | 部分原因是我接活的野心大了许多；但也是因为：容易的活全被包办了。容易的，智能体就干了；留给我的，全是难的。 |
| This morning I heard this quote from three-time Tour de France champion Greg LeMond: It doesn't get easier, you just get faster. | 今天早上我听到三届环法冠军格雷格·莱蒙德的这句话："**不会变得更容易，你只是变得更快了。**" |
| I think that's exactly what's happening to us now as software engineers with coding agents. | 我想这正是我们这些软件工程师与编码智能体共处的当下写照。 |
| One closing thing. I know you're desperate for an update on Kākāpō breeding season. | 最后一件大事。我知道你们都迫切想知道鸮鹦鹉繁殖季的战报。 |
| We've reached a recovery-era high of 325 birds! 89 new chicks have made it to this point. This is the best breeding year in a very long time. | 我们达到了恢复期新高：325 只！89 只新雏鸟活到了现在。这是非常久以来最好的繁殖年。 |
| I heard that Claude Opus 5.5 can now do pixel art. Claude doesn't have an image generator, but it's very good at using JavaScript to draw animated pixels. So I had it make me a Kākāpō dance party. I think this is a good celebration of the most important news of this year. | 我听说 Claude Opus 5.5 现在会画像素画了。Claude 没有图像生成器，但它特别擅长用 JavaScript 画会动的像素。于是我让它给我办了一场鸮鹦鹕跳舞派对。我想，用这个来庆祝今年最重要的新闻，再合适不过。 |

> [!note]- 词汇注释 · 结语
> - **puzzle** /ˈpʌzl/ —— 使困惑（及物动词）。be puzzling me = 让我一直想不通。
> - **intellectually engaged** —— 智识上高度投入的。engage = 投入、吸引。
> - **take on** —— 承接（任务/项目）。
> - **It doesn't get easier, you just get faster.** —— 名句，值得整句背诵：不会更容易，你只是更快了。
> - **be desperate for ...** —— 迫切想要……（此处戏谑）。
> - **a recovery-era high** —— 恢复期（物种保护语境）新高。
> - **make it** —— 活下来/成功到达。chicks have made it = 雏鸟存活。
> - **pixel art** —— 像素画。
> - **dance party** —— 舞会/跳舞派对。

## 总词汇表

| 词汇 | 音标 | 释义 | 文中语境 |
|---|---|---|---|
| keynote | /ˈkiːnəʊt/ | 主旨演讲 | closing keynote 闭幕演讲 |
| incremental | /ˌɪŋkrɪˈmentl/ | 渐进的 | incremental improvements |
| harness | /ˈhɑːnɪs/ | 外壳/挽具 | coding agent harness |
| benchmark | /ˈbentʃmɑːk/ | 基准测试 | the world's stupidest benchmark |
| obscure | /əbˈskjʊə/ | 冷门的 | an obscure GitHub repository |
| dawn on sb | — | 渐渐意识到 | it began to dawn on us |
| resolution | /ˌrezəˈluːʃn/ | 决心 | New Year's resolution |
| hindsight | /ˈhaɪndsaɪt/ | 后见之明 | with hindsight 事后看来 |
| weigh in on | — | 发表意见 | the Pope would weigh in on LLMs |
| nocturnal | /nɒkˈtɜːnl/ | 夜行的 | flightless nocturnal parrots |
| coin a term | — | 造新词 | we coined a term |
| ennui | /ɒnˈwiː/ | 倦怠 | AI induced ennui |
| listless | /ˈlɪstləs/ | 无精打采的 | engineers get listless |
| come to terms with | — | 接受现实 | come to terms with that |
| mania | /ˈmeɪniə/ | 躁狂 | AI mania |
| half-baked | — | 半生不熟的 | a slow, buggy, half-baked interpreter |
| vibe-coded | — | 氛围编码的 | the most vibe-coded software |
| blow up | — | 爆火 | it blew up on Friday |
| deluge | /ˈdeljuːdʒ/ | 洪流 | a deluge of slop and spam |
| slop | /slɒp/ | AI 垃圾内容 | drowned in slop |
| get away with | — | 全身而退 | how you can get away with this |
| crack down on | — | 严查 | Meta cracking down on token use |
| cap | /kæp/ | 设上限 | capping employee AI spending |
| product market fit | — | 产品市场契合 | hit product market fit |
| peak | /piːk/ | 巅峰 | peak OpenClaw |
| on one's behalf | — | 替某人 | do things on their behalf |
| under the hood | — | 表面之下 | under the hood 内部机制 |
| shoot oneself in the foot | — | 砸自己的脚 | wouldn't shoot themselves in the foot |
| take off | — | 走红 | taking off with consumers |
| ploy | /plɔɪ/ | 花招 | marketing ploy |
| skeptical | /ˈskeptɪkl/ | 怀疑的 | natural to be a bit skeptical |
| open weight | — | 开放权重 | open weight models |
| handily | /ˈhændɪli/ | 轻松地 | handily beat Opus 4.7 |
| encyclical | /ɪnˈsɪklɪkl/ | 通谕 | an encyclical letter |
| canonize | /ˈkænənaɪz/ | 封圣 | canonize your product's limitations |
| treatise | /ˈtriːtɪs/ | 专论 | a spiritual treatise |
| dubious | /ˈdjuːbiəs/ | 可疑的 | dubious packages |
| neutered | /ˈnjuːtəd/ | 被去势的 | a version of Mythos that has been neutered |
| unambiguous | /ˌʌnæmˈbɪɡjuəs/ | 毫不含糊的 | unambiguous instructions |
| brute force | — | 蛮力 | solve through brute force |
| all-in | — | 全押 | I was all-in |
| sit fallow | /ˈfæləʊ/ | 闲置 | a wiki that had sat fallow |
| influx | /ˈɪnflʌks/ | 涌入 | an influx of edits |
| within spitting distance | — | 一步之遥 | within spitting distance of Fable |
| pedestal | /ˈpedɪstl/ | 基座 | knocked off that pedestal |
| breach | /briːtʃ/ | 攻破 | had breached Hugging Face |
| poke around | — | 到处翻看 | poking around |
| confess | /kənˈfes/ | 坦白 | OpenAI confessed |
| rogue | /rəʊɡ/ | 失控的 | rogue agents |
| dial down | — | 调低 | dial that down |
| heist | /heɪst/ | 惊天盗窃 | raccoons go on heists |
| gameplay loop | — | 玩法循环 | a good gameplay loop |
| illicitly | /ɪˈlɪsɪtli/ | 违法地 | illicitly communicating |
| uncover | /ʌnˈkʌvə/ | 揭出 | took researchers to uncover |
| felony | /ˈfeləni/ | 重罪 | felony cyberattacks |
| competent-ish | — | 还算像样 | a competent-ish pelican |
| catch up | — | 追上 | Claude has caught up |
| intellectually engaged | — | 智识投入 | so intellectually engaged |

## 相关笔记

- [[大模型/10-新闻/00-新闻索引|AI 新闻索引]]
- [[英语学习/外刊看世界/Terry Tao 与 AI 之战：NYT 双语精读|Terry Tao 与 AI 之战：NYT 双语精读]]
- [[大模型/01-基础原理/大模型基础原理总览|大模型基础原理总览]]

## 参考资料

- 原文：<https://simonwillison.net/2026/Sep/27/2026-in-llms-so-far/>（2026-09-27）
- 演讲视频（YouTube）：<https://www.youtube.com/watch?v=GAkIytR7vcc>
- Simon Willison 博客：<https://simonwillison.net/>

> [!warning] 版权说明
> 本文为 Simon Willison 个人博客内容，本笔记为个人学习用途的翻译整理；原文版权归原作者所有，请勿二次分发。
