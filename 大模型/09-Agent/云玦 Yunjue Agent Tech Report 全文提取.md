---
tags:
  - 大模型/Agent
  - 大模型/论文
created: 2026-10-26
updated: 2026-10-26
source: Yunjue Agent Tech Report（公开发布的技术报告）
type: 报告全文提取
status: 已完成
---

# Yunjue Agent（云玦）Tech Report 全文提取

> [!info] 全文提取说明
> - **原 PDF**：`附件/大模型/Agent/Yunjue Agent Tech Report.pdf`（本笔记由其全文自动提取生成，作为移除原 PDF 后的存档）
> - **提取方式**：PyMuPDF (pymupdf4llm)，共 27 页；自动转换对复杂表格与矢量图表的还原可能有失真，关键图表以嵌入 PNG 为准
> - **公开来源**：Yunjue Agent Tech Report（公开发布的技术报告）
> - **配图存档**：`附件/大模型/报告全文图片/yunjue/`，共 47 张

Yunjue tech 


![[yunjue-p0001-02.png]]


# **Yunjue Agent Tech Report: A Fully Reproducible, Zero-Start In-Situ Self-Evolving Agent System for Open-Ended Tasks** 

**Haotian Li**<sup>*</sup><sup>_†_1 2</sup> **Shijun Yang**<sup>*</sup><sup>_†_3 1</sup> **Weizhen Qi**<sup>1</sup> **Silei Zhao**<sup>1</sup> **Rui Hua**<sup>1</sup> **Mingzhu Song**<sup>1</sup> **Xiaojian Yang**<sup>1</sup> **Chao Peng**<sup>1</sup> 

**Links:** [GitHub Repository] [System Traces] 

## **Abstract** 

Conventional agent systems often struggle in open-ended environments where task distributions continuously drift and external supervision is scarce. Their reliance on static toolsets or offline training renders capability boundaries rigid, preventing adaptation to evolving dynamics. To address this, we propose the _In-situ Self-Evolving_ paradigm. This approach treats sequential task interactions as a continuous stream of experience, enabling the system to distill short-term execution feedback into long-term, reusable capabilities without ground-truth labels. We identify tool evolution as the critical pathway for this capability expansion. Accordingly, we develop the _Yunjue Agent_ , a system that iteratively synthesizes, optimizes, and reuses tools to navigate emerging challenges. To optimize evolutionary efficiency, we introduce a _Parallel Batch Evolution_ strategy. Furthermore, we propose a novel metric to monitor evolutionary convergence, serving as a function analogous to training loss in conventional optimization. Empirical evaluations across five diverse benchmarks under a zero-start setting demonstrate significant performance gains over proprietary baselines and validate the effectiveness of our proposed convergence metric. Additionally, complementary warm-start evaluations confirm that the accumulated general knowledge can be seamlessly transferred to novel domains. We open-source our codebase, system traces, and evolved tools to facilitate future research in resilient, self-evolving intelligence. 

*Equal contribution _†_ During Internship at Yunjue Technology 1Yunjue Technology 2Harbin Institute of Technology 3University of Science and Technology of China. Correspondence to: Weizhen Qi, Tech Lead. _<_ qiweizhen@yunjuetech.com _>_ . 

## **1. Introduction** 

The rapid advancement of Large Language Models (LLMs) has catalyzed a paradigm shift in the pursuit of Artificial General Intelligence (AGI) (Guo et al., 2024), fundamentally expanding the AI frontier across diverse daily and scientific domains. While these developments have birthed versatile agents, a critical limitation persists: most contemporary systems remain confined within predefined operational envelopes. This reliance on static functional boundaries renders agents inherently fragile when confronted with the stochasticity of open-world environments. We posit that true AGI demands not merely broad-domain competence, but the capacity for self-adaptive evolution—dynamically reshaping capabilities to surmount novel challenges within open-ended contexts. Consequently, architecting a system capable of both cross-domain execution and recursive selfevolution has emerged as a paramount challenge in the quest for resilient intelligence. 

Within the framework of LLM-based agents, such adaptive capability typically rests on three pillars: _workflow, context, and tool_ . Recently, the field has witnessed a surge in _self-evolving agents_ (Tao et al., 2024; Gao et al., 2025), designed to autonomously enhance capabilities without human intervention, achieving progress in workflow adaptation (Zhang et al., 2025b), context management (Tang et al., 2025), and tool utilization (Wang et al., 2023). However, existing paradigms often rely on offline supervision (Acikgoz et al., 2025) or remain confined to narrow domains (Wang et al., 2023; Jin et al., 2025). In supervision-scarce, openended environments, a more autonomous paradigm is imperative. We argue that among the three pillars of agent systems, while workflows refine expertise and context aligns preference, the toolset constitutes the fundamental prerequisite for novel environments. Without requisite functional tools, even sophisticated planning or memory becomes computationally paralyzed. Furthermore, tool functionality is verifiable via rigorous execution: a program either succeeds or throws an exception. This robust binary signal enables autonomous 

Copyright 2026 by Yunjue Technology. 

1 

Yunjue tech 


![[yunjue-p0002-01.png]]


self-correction even absent human intervention, positioning tools as the optimal starting point for in-situ evolution. 

To address the open-ended challenges, we propose the **Insitu Self-Evolving (ISE)** framework. This paradigm treats task interactions as a continuous stream for accumulating generalized knowledge, initiating with a _zero-start_ phase. We develop the **Yunjue Agent** , utilizing a multi-agent architecture (Manager, Tool Developer, Executor, etc.) (Qian et al., 2024) to synthesize bespoke Python primitives onthe-fly when existing capabilities are insufficient. To further optimize efficiency, we introduce a _Parallel Batch Evolution_ strategy, which distills high-quality tools from concurrent executions to accelerate convergence. Furthermore, we propose a novel metric to monitor evolutionary convergence, functioning analogously to training loss. We open-source our codebase, complete interaction traces, and the library of evolved tools to provide a transparent foundation for future research in resilient, self-evolving intelligence. 

Comprehensive empirical evaluations across five benchmarks validate the Yunjue Agent’s efficacy. Results demonstrate: (i) **State-of-the-art performance** : In zero-start settings, autonomous tool evolution outperforms proprietary baselines; (ii) **Cross-domain transferability** : Additional warm-start evaluations show that accumulated general knowledge adapts effectively to novel domains; (iii) **Robust convergence monitoring** : Our proposed metric effectively serves as a stability proxy for evolution; and (iv) **Costeffectiveness** : The lightweight design ensures economical operation. 

## **2. In-situ self-evolving agents** 

**An agent system** can be formally defined as a tuple _M_ = _⟨W, C, T ⟩_ of workflow, context and tools (Gao et al., 2025). In this system, the workflow _W_ is typically structured as a directed graph _G_ = ( _V, E_ ), where nodes _V_ represent LLMbased agents and edges _E_ denote the flow of information. _C_ is the set of contexts, where each context element can be a prompt template or a memory buffer encompassing dynamic conversation history. Finally, _T_ denotes the set of tools available for the agents to execute specific tasks. 

To enable agents to adapt to new environments like humans, recent work focuses on self-evolving methods (Tao et al., 2024; Gao et al., 2025). However, these methods typically require an iterative training process to update certain components (He et al., 2025; Chen et al., 2025a) or are confined in specific areas (Xia et al., 2025; Jin et al., 2025), such as generating query-specific workflows (Zhang et al., 2025b; Ye et al., 2025), refining context _C_ (e.g., prompt and memory) (Zhang et al., 2025b; Tang et al., 2025) or adjusting toolset (Wang et al., 2024; 2023). In contrast, we aim to explore whether an agent system can adapt to 

the environment by continuously updating its components in-situ, where there is no access to external supervision signals. This motivation leads to a new paradigm of agentic evolution. 

**In-situ self-evolving of an agent system** . Given a sequence of queries _{x_ 1 _, x_ 2 _, . . . , xT }_ , the agent evolves dynamically from _M_ 0 to _MT_ as it processes each. Specifically, after completing the _t_ -th query _xt_ , the system updates its configuration for the next query, which can be formalized as a transition from _Mt−_ 1 = _⟨Wt−_ 1 _, Ct−_ 1 _, Tt−_ 1 _⟩_ to _Mt_ = _⟨Wt, Ct, Tt⟩_ , where any component of the tuple—the workflow structure, context, or toolset—may be modified based on internal feedback or experience gained from the previous interaction. Unlike self-evolving agents that maximize a specific objective function through a series of training steps (Gao et al., 2025), _in-situ self evolving_ operates during the inference phase where ground truth information is unavailable. 

To ensure a focused scope, we fix the workflow _W_ . Furthermore, given that Agent KB (Tang et al., 2025) has attempted to optimize memory through cross-domain experience to enhance agent performance, we also treat the context _C_ as a fixed component<sup>1</sup> , reducing the evolving system state to _Mt_ = _⟨W_ 0 _, C_ 0 _, Tt⟩_ . We posit that the variability of the toolset is the most decisive factor for a general-purpose agent system. While memory enhances performance by recalling experience, the ability to effectively solve problems in novel domains is fundamentally limited by the availability of appropriate tools (Wang et al., 2023; Qin et al., 2024). 

## **3. Methodology** 

### **3.1. In-situ self-evolving via tool accumulation** 

We posit that the fundamental prerequisite for a generalist agent lies in the continuous, dynamic evolution of its toolset. To address this, we introduce an agentic workflow for _in-situ self-evolving_ via tool accumulation. 

Upon receiving a query _xt_ , the agent first attempts to retrieve relevant utilities from its existing repository, denoted as _Tsub ⊆Tt−_ 1. In the absence of requisite capabilities, the agent synthesizes novel tools _Pt_ tailored to the specific task constraints. Subsequently, empowered by the augmented toolset _Tsub ∪Pt_ , the agent executes the task through a sequence of tool invocations. To ensure that generated tools are not merely functional but also robust and reusable, the agent engages in a self-reflection mechanism post-execution, refining the tools based on the error reports and execution traces. The process concludes with the integration of these 

> 1Although the execution flow can be dynamic during inference due to branch control and model inputs are populated at runtime, the underlying workflow structure and prompt templates are predefined. Thus, we consider these configurations fixed. 

2 

Yunjue tech 


![[yunjue-p0003-01.png]]



![[yunjue-p0003-02.png]]


<!-- Start of picture text -->
Batch of  Queries<br>Parallel Batch Evolution<br>Tool<br>Devp New Tools<br>Local Tool<br>Tools Request<br>Pool ( )<br>Intermediate<br>Manager Provisioned Tools & Task ReAct Loop Results Response<br>Exec Integrator<br>Global Tool<br>Pool (  ) Missing Capability<br>Environment<br>Local Tool Pools<br>Absorbing Mechanism Consolidated<br>Aggregator Merger Global Tool Pool
(      )<br><!-- End of picture text -->

_Figure 1._ An architecture overview of Yunjue Agent. 

newly synthesized tools into the global repository, updating the state to _Tt_ = _Pt ∪Tt−_ 1. 

As the agent processes an expanding stream of queries, existing tools undergo iterative refinement while new ones are concurrently synthesized. This dual mechanism propels the system’s evolution along two dimensions: _breadth_ (expanding functional coverage) and _depth_ (optimizing tool robustness). Consequently, upon exposure to a sufficient volume of tasks, the tool repository is expected to reach a state of convergence, where incremental synthesis is necessitated only by outlier queries with idiosyncratic requirements. 

### **3.2. Parallel batch evolution** 

To balance processing efficiency with shared knowledge accumulation, we propose a _Parallel Batch Evolution_ strategy. While sequential processing maximizes reuse, it lacks scalability; conversely, independent parallelization sacrifices shared learning. Our approach reconciles these by parallelizing execution while maintaining a cohesive evolutionary trajectory. 

Formally, let _Qt_ = _{qt,_ 1 _, qt,_ 2 _, . . . , qt,B}_ denote a batch of _B_ user queries input to the agent _Mt−_ 1 at step _t_ . For each query _qt,i ∈Qt_ , the system synthesizes a set of local tools _Pt,i_ that augments the global toolset _Tt−_ 1 specifically for that instance. However, independent generation often yields functionally redundant tools across different queries—particularly for general-purpose utilities like web searching. This redundancy expands the tool search space, increasing the cognitive load on the agent. To mitigate this, 

we introduce a _tool absorbing mechanism_ designed to cluster and consolidate utilities post-generation. Specifically, upon completion of batch _Qt_ , the system aggregates all tools _{Tt−_ 1 _, Pt,_ 1 _, . . . , Pt,B}_ and clusters them into disjoint groups _{Gj}_ based on functional semantic similarity. Subsequently, a merging function Φ consolidates these groups, filtering for quality and redundancy to produce a compact updated pool _Tt_ = Φ( _{Gj}_ ). This process ensures the tool space remains streamlined, preventing retrieval ambiguity while updating the system state to _Mt_ . 

Processing queries in batches offers distinct advantages. Primarily, it significantly enhances system throughput. Furthermore, analogous to mini-batch gradient descent in model optimization (Bottou, 2010; Goodfellow et al., 2016)—which mitigates gradient variance by averaging over samples—our absorbing mechanism reduces evolutionary stochasticity by merging similar tool instances. Simultaneously, this acts as a form of _Best-of-N_ test-time scaling (Cobbe et al., 2021; Beirami et al., 2024), effectively performing multiple parallel rollouts for tool creation and selecting the optimal synthesis results for the permanent library. 

### **3.3. The Yunjue Agent system** 

By decoupling tool management, synthesis, and task execution, we establish a multi-agent system (Park et al., 2023) optimized for _in-situ self-evolving_ . As illustrated in Figure 1, the architecture comprises distinct functional roles: **Manager** , **Executor** , **Tool Developer** , and **Integrator** , supported by the **Aggregator** and **Merger** for batch-level syn- 

3 

Yunjue tech 


![[yunjue-p0004-01.png]]


chronization. The workflow proceeds via a collaborative mechanism designed to handle complex queries flexibly: 

Upon receiving a user query _qt_ , the _Manager_ orchestrates the workflow by first aligning tool capabilities with task requirements. It analyzes the system state to retrieve a relevant subset of tools _T_ sub _⊆Tt−_ 1 from the global repository. Should capability gaps arise, the _Manager_ directs the _Tool Developer_ to synthesize bespoke tools (implemented as Python primitives), which are immediately instantiated in the local context. Subsequently, the _Executor_ addresses the query using the provisioned toolset, adhering to the ReAct paradigm (Yao et al., 2023). Crucially, the system supports dynamic runtime adaptation: if the _Executor_ encounters unforeseen capability deficits during reasoning (e.g., identifying the need for a specific file parser), it suspends execution and signals the _Manager_ . The _Manager_ then provisions the requisite tools on-the-fly, allowing the _Executor_ to resume seamlessly. 

Upon task completion, the _Integrator_ consolidates the execution history and intermediate outputs to formulate a comprehensive response _at_ . Through this iterative process, the Yunjue Agent evolves from state _Mt−_ 1 to _Mt_ , effectively updating the tool pool to _Tt_ for future evolution. 

**Parallel evolution with batch processing.** To optimize evolutionary throughput, we implement the _parallel batch evolution_ strategy. Given a query batch _Qt_ = _{qt,_ 1 _, qt,_ 2 _, . . . , qt,B}_ , the system processes each instance concurrently, granting all agents shared access to the global tool repository _Tt−_ 1. This parallel execution allows each query _qt,i_ to independently synthesize a local toolset _Pt,i_ tailored to its specific execution context. 

Upon the completion of the batch, the _tool absorbing mechanism_ is invoked to consolidate the dispersed local pools with the global state. Specifically, the system aggregates the union of all toolsets _{Tt−_ 1 _, Pt,_ 1 _, Pt,_ 2 _, . . . , Pt,B}_ . The LLM-based _Aggregator_ then groups utilities based on functional semantic similarity. Subsequently, another LLMbased _Merger_ is applied to each cluster to synthesize a unified, canonical tool that encapsulates collective capabilities while eliminating redundancy. The resulting consolidated repository _Tt_ serves as the initialized state for the subsequent queries. The pseudo-code of the overall process is provided in Appendix B. 

## **4. Experiment setup** 

**Datasets** . To demonstrate the generalizability of our approach across diverse domains and task complexities, we conduct comprehensive evaluations on five complementary benchmarks, each targeting distinct professional scenarios: (i) _HLE_ (Humanity’s Last Exam) (Phan et al., 2025), a frontier multi-modal benchmark featuring expert-level questions 

across mathematics, humanities, and natural sciences, designed to assess advanced reasoning at the boundary of human knowledge; (ii) _DeepSearchQA_ (DSQA) (Gupta et al., 2025), which challenges agents’ ability to synthesize comprehensive answers through deep web search, iterative information gathering, and multi-source evidence aggregation; (iii) _xBench_ (Chen et al., 2025b), a Chinese professionaligned evaluation suite where we focus on the _ScienceQA_ (xSciQA) subset (spanning natural, social, and language sciences) and _DeepSearch_ (xDS, 2025.10 version) subset to evaluate real-world productivity in scientific research and complex retrieval workflows, allowing us to assess crosslingual adaptation capabilities; and (iv) _FinSearchComp_ (FSC) (Hu et al., 2025), a bilingual (English and Chinese) benchmark targeting financial analysis through its _T2_ (Simple Historical Lookup) and _T3_ (Complex Historical Investigation) tasks, which require precise time-sensitive data retrieval and multi-step quantitative reasoning over financial documents. 

**Baselines.** We benchmark our agent system against a comprehensive suite of proprietary and open-source systems, spanning both static and self-evolving agent paradigms. Unless otherwise noted, reported performance metrics are derived directly from original publications, technical reports, or authoritative disclosures (detailed provenance is provided in the Appendix C). 

## **5. Evaluation on open-ended evolution** 

### **5.1. Zero-start performance on cross-domain tasks** 

We evaluate our Yunjue Agent, initialized with an empty toolset, across all five benchmarks against state-of-the-art baselines. Results are presented in Figure 2. For datasets excluding xSciQA, foundation model baselines (e.g., GPT-5, Gemini 3 Pro) are augmented with web search and Python interpreters. Conversely, on xSciQA, where standard leaderboards prohibit external tools, we explicitly equip our backend model with a Python interpreter to ensure a fair parity comparison. We provide more detailed results in Appendix D, including the standard deviation of accuracy, token consumption and cost. 

On the heterogeneous HLE benchmark, our agent yields a significant improvement over the backend (48.0 vs. 45.8), ranking second only to GPT-5.2 Pro. Most notably, Yunjue Agent achieves state-of-the-art performance on DSQA, FSC, and xSciQA. We observe substantial absolute gains over the Gemini 3 Pro baseline, with increases of **+16.9** points on DSQA (73.5 vs. 56.6) and **+15.1** points on FSC (65.0 vs. 49.9), alongside a record-setting score of 76.5 on xSciQA. Finally, on xDS, our method maintains competitive performance (59.7), surpassed only by GPT-5 Pro while outperforming all other models by a significant margin. These 

4 

Yunjue tech 


![[yunjue-p0005-01.png]]



![[yunjue-p0005-02.png]]


<!-- Start of picture text -->
HLE DeepSearchQA FinSearchComp (T2&T3)<br>75<br>50 50.0 73.5 65 64.5 65.0<br>45 46.4 45.8 48.0 70 60 62.8<br>43.2 65 66.1 65.2 58.6<br>40 40.9<br>60 55<br>37.7 59.4<br>35 35.5 55 56.6<br>32.9 50<br>49.9<br>30<br>50<br>45<br>25 45<br>20 40 40<br>xbench-ScienceQA xbench-DeepSearch<br>75 76.5 70 75.0<br>74.0<br>60<br>70 71.6 59.7<br>50 51.0 53.8<br>65 64.4 40 40.0 41.0<br>35.0 35.0<br>30<br>60<br>20<br>55 55.2<br>10<br>50 0<br>Deep ResearchMiroThinker-v1.0-72B   GeminiTongyi DeepResearchGPT-5.2 ProSeed-1.8Co-SightClaude 4.5 OpusGemini 3 ProYunjue Agent Deep Research   Gemini GPT-5 Pro GPT-5 Gemini 3 Pro Yunjue Agent GPT-5 Seed-1.8Claude 4.5 Sonnet Gemini 3 Pro Yunjue Agent<br>vanilla GPT-5vanilla Claude 4.5 Opusvanilla Gemini 3 Pro *Gemini 3 Pro Yunjue Agent GPT-5 ProSuperGrok ExpertMinimax AgentManus AgentM-GRPO AWorld*Gemini 3 ProYunjue Agent<br>Accuracy Accuracy Accuracy<br>Accuracy Accuracy<br><!-- End of picture text -->

_Figure 2._ Performance comparison of Yunjue Agent against state-of-the-art agents and agentic foundation models. Our method is highlighted in cyan, and the backend model (Gemini 3 Pro) appears in orange. _*Gemini 3 Pro_ denotes our implementation with a Python interpreter. 

exceptional results demonstrate our method’s **superior performance across a wide spectrum of tasks, laying a solid foundation for generalized knowledge accumulation and transfer.** 

Complementing the performance analysis, we aggregated toolsets across all five benchmarks to examine functional utilization patterns. Figure 3 presents the invocation frequency of the top 50 tools. The distribution reveals the **spontaneous emergence** of high-utility fundamental functions, most notably web ~~s~~ earch, fetch ~~t~~ ext ~~u~~ rl and evaluate ~~e~~ xpression ~~m~~ ath. The dominance of these foundational tools confirms that the system has effectively **distilled generalized knowledge into versatile primitives** , ensuring broad applicability across diverse task semantics. 

Although the Yunjue Agent integrates modules such as the _Manager_ and _Tool Developer_ around the _Executor_ , the _Executor_ acts as the primary entity for execution and token consumption. In Appendix D, we show that across five datasets, the _Executor_ accounts for approximately 95% of the total token consumption. Additionally, since tools do not need to be repeatedly created, a significant amount of token consumption is also saved. Consequently, our system’s 

overall overhead is comparable to that of a standard ReAct agent equipped with a Python interpreter, a finding further corroborated in Table 2. 

### **5.2. Warm-start evolution in shifting domains** 

We validate the transferability of accumulated knowledge to novel domains by initializing the system on DSQA, all the way to FSC, xSciQA and xDS, using the toolset derived from the HLE benchmark. HLE is selected as the foundational domain due to its substantial scale (2,500 queries) and extensive disciplinary coverage. Table 1 shows consistent performance across domains, with xSciQA scores improving from 76.5 to 80.2. Crucially, new tool synthesis drops by 55% on FSC and 100% on xSciQA and xDS, demonstrating effective transfer with minimal marginal cost. 

Figure 5 illustrates the evolution of the tool library size relative to the cumulative number of processed queries. The overall trajectory demonstrates **a global trend toward convergence** . A localized surge in tool synthesis during the late phase of HLE (queries 2,000–2,400) is driven by intrabenchmark domain shifts: as query semantics transition from predominantly mathematical to social sciences and other disciplines, a targeted expansion of the toolset is ne- 

5 

Yunjue tech 


![[yunjue-p0006-01.png]]



![[yunjue-p0006-02.png]]


<!-- Start of picture text -->
105<br>104<br>103<br>102<br>evaluate_expression_mathsearch_webfetch_text_urlacademic_papers_searchimage_query_textexpression_process_symbolicdownload_fileexecute_javascriptnumerical_run_simulationbrowser_interaction_performextract_pdf_textdata_get_historical_stockdata_query_statisticalcsv_file_readexecute_logic_mathbooks_searchcsv_file_querydata_fetch_fundamentalexcel_file_readdata_fetch_historical_marketconvert_images_pdf_topdf_searchcheck_primalityfinancial_get_metricsalgebraic_equations_solvemath_solve_symbolicdata_financial_get_marketnonlinear_optimization_solvepacking_shape_solvefile_local_readexcel_file_inspectcrop_imageimage_reverse_searcharchive_extractcapture_screenshot_webcensus_data_retrieve_usfile_search_textexpansion_generate_mathode_solve_systemnumerical_run_scriptanalyze_matrixrun_scientific_scriptfetch_html_renderedinteger_linear_program_solveexcel_file_querycompute_integral_numericaldata_read_tabularcompute_linear_recurrencecompute_reachability_subset_sumcompute_matrix_rotation<br>#Tool invocations (log scale)<br><!-- End of picture text -->

_Figure 3._ Invocation frequency distribution of the toolset evolved across five benchmarks. We report the top 50 tools, illustrating the emergence of high-generalizability primitives. 

|_able 1._Performance <br>cross different initializ<br>etting, and WS denot<br>volved toolset as initia|comparison <br>ation strate<br>es warm sta<br>lization.|and tool syn<br>gies. ZS stand<br>rt, which leve|thesis statistics<br>s for a zero start<br>rages the HLE-|Exact Match<br>read_excel|fetch_api_data|
|---|---|---|---|---|---|
|**Dataset**|**Strategy**|**Accuracy**|**# New tools**|||
|HLE|ZS|48.0|97|||
|DShQA|ZS|73.5|34|||
|eepearc|WS|74.6_↑_1_._1|23_↓_32%|||
|FinSearchComp|ZS<br>WS|65.0<br>65.4_↑_0_._4|18<br>8_↓_55%|semantically equivalent||
|bhSiA|ZS|76.5|13|||
|xenc-cenceQ|WS|80.2_↑_3_._7|0_↓_100%|send_http_request||
|xbench-DeepSearch|ZS<br>WS|59.7<br>60.6_↑_0_._9|16<br>0_↓_100%|Reference<br>Specific<br>Semantic<br>Intersection|Generated<br>Novelty|



_Table 1._ Performance comparison and tool synthesis statistics across different initialization strategies. ZS stands for a zero start setting, and WS denotes warm start, which leverages the HLEevolved toolset as initialization. 

_Figure 4._ Venn diagram comparing unique zero-start tools ( _T_ DSQA _\ T_ HLE, left) and incremental warm-start tools ( _T_ HLE _→_ DSQA _\ T_ HLE, right) on DeepSearchQA. Points represent semantically clustered tools. The intersection (71%) denotes functional overlap, with dashed lines marking exact matches, while the difference set accounts for 29%. 

cessitated. Notably, despite this semantic heterogeneity, **only 97 tools were generated across the entire 2,500-HLE query corpus, evidencing the effective consolidation of acquired knowledge** . Subsequently, tool growth trajectories across secondary datasets exhibit near-zero slopes, indicating that HLE-evolved capabilities facilitate **robust adaptation to novel domains with negligible marginal synthesis** . 

### **5.3. Evolutionary generality loss** 

To quantify knowledge acquisition, we introduce _Evolutionary Generality Loss_ (EGL), a real-time convergence indicator analogous to training loss. EGL is defined as the cumulative ratio of synthesized tools to invocations: 

To substantiate tools as vehicles for knowledge crystallization and domain adaptation, Figure 4 visualizes the intersection between zero-start and warm-start toolsets. The recurrence of exact matches (e.g., read ~~e~~ xcel) validates the capacity to **deterministically recover essential utilities** . Furthermore, semantically aligned variants (e.g., seed ~~h~~ ttp ~~r~~ equest vs. fetch ~~a~~ pi ~~d~~ ata, see Appendix E) highlight adaptive functional equivalence. This convergence confirms the agent gravitates toward an **invariant core of capabilities independent of initialization** . 


![[yunjue-p0006-11.png]]


<!-- Start of picture text -->
= � ti =1 ci<br>EGL( t ) ≜ Lt = Ct (1)<br>Ut � ti =1 ui<br><!-- End of picture text -->

where _ci_ and _ui_ denote tool synthesis and invocations at step _i_ . EGL is inversely correlated with repository generality. As shown in Figure 6 (HLE dataset), initial high values reflect rapid accumulation, which stabilizes asymptotically after 

6 

Yunjue tech 


![[yunjue-p0007-01.png]]



![[yunjue-p0007-02.png]]


<!-- Start of picture text -->
140 HLE DSQA FSC xBench<br>120<br>100 Domain shift<br>(new tools required)<br>80<br>60<br>40<br>20<br>0<br>0 800 1600 2400 3200 4000<br>Evolution step<br>Tool library size<br><!-- End of picture text -->

_Figure 5._ Evolution of the tool library size relative to the cumulative number of processed queries. The experimental sequence follows the curriculum HLE _→_ DeepSearchQA _→_ FinSearchComp _→_ xbench-ScienceQA _→_ xbench-DeepSearch, highlighting the convergence of tool synthesis. 


![[yunjue-p0007-04.png]]


<!-- Start of picture text -->
100<br>EGL<br>25<br>Accuracy<br>80<br>20<br>60<br>15 47.0 51.0 52.0<br>40<br>10<br>17.0 20<br>5<br>0<br>0 500 1000 1500 2000 2500<br>Evolution step<br>EGL<br>Accuracy (%)<br><!-- End of picture text -->

_Figure 6._ EGL dynamics on HLE and accuracy on selected datasets vs. evolution step. The orange curve shows the EGL trend (left axis, scaled by 1000). Blue bars indicate the accuracy (right axis) of agents using HLE toolsets frozen at 10%, 40%, 70%, and 100% of evolution. 

### _∼_ 1,000 queries (40% of the stream). 

Appendix A provides the complete formal proofs. We first derive the sufficient condition for the monotonic decrease of EGL: 

**Theorem 5.1** (Descent Condition) **.** _If the marginal synthesis ratio is strictly lower than the cumulative ratio (i.e., u_<sup>_ct_</sup> _t_<sup><u>+</u></sup> +1<sup>1</sup><sup>_<_</sup> _<u>CUtt</u>_<sup>_), the EGL metric decreases (Lt_+1</sup><sup>_< Lt)._</sup> 

Thus, EGL declines whenever the marginal creation rate falls below the historical average. Empirically (Figure 6), the trajectory is consistently downward, with transient spikes reflecting domain-specific bursts. 

Second, the convergence rate: 

**Theorem 5.2** (Convergence Rate) **.** _If cumulative tools stabilize (Ct → Cmax) and invocations grow linearly (Ut ∝ t), EGL converges to zero (Lt →_ 0 _) at a rate of O_ (1 _/t_ ) _._ 

_Table 2._ Ablation results on 200 queries across varying batch sizes (BS). Metrics include Accuracy (Acc, %), total inference time in minutes (Time), Tool Success Rate (TSR, %), Average Tokens per Tool (ATT), and cost per query (Cost, $). The condition “ _∞_ ” denotes a Python-interpreter baseline processing queries independently without tool accumulation. 

|**BS**|**Acc**|**Time**|**TSR**|**ATT**|**Cost**|
|---|---|---|---|---|---|
|2|48.0|2_,_006_÷_1|99.6|109.9|0.59|
|4|50.0|965_÷_2_._1|99.9|130.3|0.74|
|8|47.5|326_÷_6_._2|99.6|188.4|0.71|
|16|51.5|220_÷_9_._1|99.1|108.4|0.65|
|_∞_|40.0|41_÷_48_._9|81.8|518.2|0.71|



Figures 5 and 7(c) empirically validate the stabilization of _Ct_ and linear growth of _Ut_ , respectively. 

To further validate convergence, we evaluated toolset snapshots (frozen at 10%, 40%, 70%, 100% of the timeline) on 200 stratified queries with further tool synthesis disabled. Figure 6 bar chart reveals a sharp performance inflection between 10%–40%, followed by diminishing returns from 40% to 100%. This saturation confirms the system successfully converges to a high-generality state. 

### **5.4. Ablation study** 

To investigate the efficacy of tool evolution, we conduct ablation studies using the 200-query EGL subset. 

**Mechanisms of tool evolution efficacy.** We benchmark our approach against a Python-interpreter with the same baseline (GPT-5), representing the asymptotic limit of an infinite batch size ( _B →∞_ ) where queries are processed independently without tool accumulation. As detailed in Table 2, this baseline demonstrates markedly inferior performance (40.0) compared to our method (47.5–51.5). Analysis sug- 

7 

Yunjue tech 


![[yunjue-p0008-01.png]]



![[yunjue-p0008-02.png]]


<!-- Start of picture text -->
7000<br>14 500<br>6000<br>12<br>400 5000<br>10<br>4000<br>8<br>300 3000<br>6<br>4 w/ py exec (518) 2000<br>bs=2 200<br>2 bs=4 1000<br>bs=8<br>0 bs=16 100 0<br>0 20 40 60 80 100 120 140 160 180 200 0 20 40 60 80 100 120 140 160 180 200 0 20 40 60 80 100 120 140 160 180 200<br>Evolution step Evolution step Evolution step<br>(a) (b) (c)<br>Tool library size<br>Cumulative #tool invocations<br>Average token consumption per tool use<br><!-- End of picture text -->

_Figure 7._ Evolutionary dynamics across varying batch sizes. (a) Cumulative tool synthesis relative. (b) Mean token consumption per invocation. (c) Aggregate count of tool invocations. 

_Table 3._ Performance comparison and tool library size of different backend models on DeepSearchQA and FinSearchComp. 

|**Backend**|**DeepSear**<br>**Accuracy**|**chQA**<br>**# Tools**|**FinSearc**<br>**Accuracy**|**hComp**<br>**# Tools**|
|---|---|---|---|---|
|Gemini 3 Pro|73.5|16|65.0|18|
|GPT-5|70.6|75|65.2|25|
|GPT-5-mini|42.5|47|45.5|13|



gests this performance gap stems from the baseline’s lower execution success rate (81.8% vs. _>_ 99%) and significantly higher token consumption (518 tokens per invocation). We posit that the resulting verbosity and frequent execution failures induce **contextual contamination** , which subsequently degrades reasoning capabilities (see Appendix E). 

**Impact of batch size on parallel evolution.** We investigate the influence of batch size _B_ on evolutionary dynamics, evaluating configurations where _B ∈{_ 2 _,_ 4 _,_ 8 _,_ 16 _}_ against a Python interpreter baseline ( _B →∞_ ). As detailed in Table 2, all batch-evolved agents surpass the baseline, reinforcing the efficacy of tool accumulation. Furthermore, the results indicate that increasing _B_ proportionally reduces processing latency and marginally enhances accuracy without incurring substantial overhead, thereby validating the _Parallel Batch Evolution_ strategy. 

The impact of batch size on evolutionary trajectories is further analyzed in Figure 7(a). While larger batches accelerate initial tool crystallization, terminal library sizes remain comparable, suggesting the system **converges toward a consistent capability equilibrium** independent of _B_ . Regarding computational efficiency, Figure 7(b) demonstrates that token expenditures consistently remain below the baseline, decaying toward an asymptotic minimum as the system transitions from costly _ab initio_ tool generation to efficient reuse. A minor anomaly observed for _B_ = 8 in Table 2—characterized by higher token consumption—is attributed to maximal tool generation and invocation counts (Figure 7(a,c)) resulting from LLM stochasticity. Future research will explore methods to align convergence states across varying batch sizes. 

**Influence of backend model selection.** We evaluate the impact of the underlying foundation model on system performance across the DSQA and FinSearchComp datasets (see Table 3). The results indicate that when instantiated with _GPT-5_ , our agent surpasses the majority of established baselines. Notably, the lightweight _GPT-5-mini_ variant achieves competitive performance, demonstrating significant utility despite its reduced parameter scale. These findings underscore the model-agnostic nature and generalization capabilities of the proposed framework, confirming its robustness across diverse backend architectures and scales. 

## **6. Related work** 

**Self-evolving agents** . To transcend the limitations of static designs, general-purpose agent systems must adapt to openended, interactive environments in real-time (Gao et al., 2025). Self-evolving agents achieve this by autonomously refining internal components, categorized into workflow optimization, model parameter updates, context management, and tool synthesis. Specifically, MAS-GPT (Ye et al., 2025) and AFlow (Zhang et al., 2025b) generate query-specific workflows, while TT-SI (Acikgoz et al., 2025) and SCA (Zhou et al., 2025) update parameters by generating challenging training problems. Furthermore, ELL (Cai et al., 2025) and Zhang et al. (2025c) evolve by accumulating environmental interaction experience as context. Regarding tool synthesis, LIVE-SWE-agent (Xia et al., 2025) and STELLA (Jin et al., 2025) enable on-the-fly tool creation for software engineering and biomedical research, respectively. Nevertheless, most self-evolving methods necessitate explicit training. Crucially, even approaches closest to our work—those autonomously creating tools at testtime—remain confined to specific domains and lack tool reuse mechanisms, hindering their general applicability. 

**Tool evolution agents.** The paradigm of autonomous tool synthesis has garnered significant attention in recent literature. Pioneering systems such as Voyager (Wang et al., 2023), STELLA (Jin et al., 2025), and LIVE-SWEagent (Xia et al., 2025) empower agents to generate exe- 

8 

Yunjue tech 


![[yunjue-p0009-01.png]]


cutable tools for embodied control or software engineering tasks. Notably, analyses of the tool embedding space in LIVE-SWE-agent (Xia et al., 2025) reveal distinct clustering patterns among functional equivalents; this observation directly informed the design of our _absorbing mechanism_ , which utilizes clustering to consolidate redundant utilities. Regarding tool reuse, Alita-G (Qiu et al., 2025) facilitates the persistence of successful tools, though its optimization trajectory is predicated on ground-truth supervision. In the context of inference-time adaptation, Lu et al. (2026) proposed a test-time tool evolution framework governed by a cost-sensitive objective function, yet its application remains narrowly scoped to scientific reasoning. Collectively, these approaches prioritize the optimization of existing assets or domain-specific synthesis, distinguishing them from our framework’s focus on _self-evolution in open-ended environments_ . 

**Agent systems for open-ended tasks** . Recent research has sought to construct general-purpose agents capable of crossdomain operation. DeepAgent (Li et al., 2025) utilizes a scalable toolset to address diverse tasks but lacks the capacity for autonomous environmental adaptation, leading to performance limitations. Agent KB (Tang et al., 2025) attempts to solve cross-domain problems by summarizing execution experiences from other agents; however, its performance is constrained by a deficiency in necessary tools. In contrast, our approach achieves generality by continuously creating, reusing, and optimizing tools in-situ, effectively overcoming the limitations of static toolsets and experiencebased adaptation. 

eralizable primitives—before deployment. Consequently, such pre-trained agents would possess intrinsic generalization capabilities, enabling them to tackle novel downstream tasks largely through the composition of existing reliable tools, thereby minimizing or even eliminating the need for expensive test-time evolution. Formalizing the methodologies for this “agentic pre-training” is a critical priority for future research. 

**Co-evolution of memory and workflow.** Currently, our framework validates the self-evolving paradigm primarily through tool generation. However, tools constitute a necessary but insufficient condition for scenarios demanding high personalization or complex process management. For instance, personalized assistants require persistent, evolving memory structures to align with user preferences, while intricate tasks (e.g., deep research) necessitate structured workflow evolution—such as generating bespoke planning protocols for multi-agent coordination. A critical direction is extending the evolutionary mechanism to encompass the co-evolution of memory architectures and workflow policies, enabling the system to adapt its internal state and execution logic alongside its functional capabilities. 

**Evolutionary stability and regularization.** The stability of tool evolution warrants further investigation. Due to the inherent stochasticity of LLM generation, toolsets can exhibit variance across experimental runs, as evidenced by our batch size ablation. Ensuring the consistent convergence of the tool library is vital for system reliability. Future work will focus on developing regularization strategies to guarantee the determinism of the evolutionary process in open-ended environments. 

## **7. Discussion and future work** 

While this study establishes the efficacy of in-situ selfevolution through tool synthesis, several avenues for future research merit rigorous inquiry to fully realize the potential of autonomous agents. 

**Paradigm parallels: towards system-level pre-training for agentic systems.** The seamless transition and performance consistency observed between our _zero-start_ and _warm-start_ settings offer more than just empirical validation; they suggest a fundamental paradigm shift. The clear convergence curves of the tool library indicate that “tasksolving capability” is not merely a collection of ad-hoc heuristics, but a generalizable pattern that can be learned and distilled. 

This implies that the field is approaching a “pre-training and post-training” era for agentic systems, mirroring the trajectory of LLMs. We envision a future where multi-agent systems undergo _system-level pre-training_ on massive, broadspectrum task datasets. This process would allow agents to distill a “foundation toolset”—a set of converged, gen- 

**Optimization of parallel batch evolution.** Finally, the nuances of the batch evolution strategy present rich opportunities for optimization: 

- _Curriculum learning effects:_ As shown in Figure 5, the sequence of incoming queries significantly influences the convergence trajectory; delaying queries that require foundational primitives can impede system maturation. Investigating optimal query ordering is a key direction. 

- _Intra-batch diversity trade-offs:_ Intra-batch diversity presents a complex dynamic. Low diversity allows the _absorbing mechanism_ to function as a form of _Best-ofN test-time scaling_ , leveraging redundancy to select the optimal implementation—a contrast to traditional gradient training where high batch diversity is preferred. Balancing this quality-assurance benefit against the efficiency of capability evolution is crucial. 

- _Adaptive scheduling:_ Dynamic batch sizing offers a promising avenue for optimization. Smaller batch sizes in early stages could foster the robust consolidation of general knowledge via redundancy, while larger 

9 

Yunjue tech 


![[yunjue-p0010-01.png]]


batches in the post-convergence phase could maximize throughput for corner cases. Developing autonomous agents capable of dynamic batch scheduling based on convergence signals remains a worthy research direction. 

- work and benchmark. _arXiv preprint arXiv:2508.19005_ , 2025. 

- Chen, J., Yang, Z., Shi, J., Wo, T., and Tang, J. Mathse: Improving multimodal mathematical reasoning via selfevolving iterative reflection and reward-guided finetuning. _arXiv preprint arXiv:2511.06805_ , 2025a. 

## **8. Conclusion** 

- Chen, K., Ren, Y., Liu, Y., Hu, X., Tian, H., Xie, T., Liu, F., Zhang, H., Liu, H., Gong, Y., Sun, C., Hou, H., Yang, H., Pan, J., Lou, J., Mao, J., Liu, J., Li, J., Liu, K., Liu, K., Wang, R., Li, R., Niu, T., Zhang, W., Yan, W., et al. xbench: Tracking agents productivity scaling with profession-aligned real-world evaluations. _arXiv preprint arXiv:2506.13651_ , 2025b. Available at https://xbench.org/. 

In this work, we presented the In-Situ Self-Evolving framework, enabling LLM-based agents to autonomously adapt and evolve within open-ended environments. Through the Yunjue Agent and the proposed Parallel Batch Evolution strategy, we demonstrated that treating tools as dynamic vehicles for knowledge crystallization allows for robust zero-start learning and the emergence of generalized, transferable capabilities. Our empirical results validate that this approach achieves state-of-the-art performance across heterogeneous benchmarks. Furthermore, warm-start experiments confirm that the accumulated generalized knowledge can be seamlessly transferred to novel domains, enabling the agent to adapt to shifting environments. We release our codebase, evaluation and system traces to the open-source community to facilitate further research. Broadly, future work will aim to unify tool evolution with memory and workflow adaptation, advancing toward more autonomous and general-purpose agentic systems. 

- Cobbe, K., Kosaraju, V., Bavarian, M., Chen, M., Jun, H., Kaiser, L., Plappert, M., Tworek, J., Hilton, J., Nakano, R., et al. Training verifiers to solve math word problems. _arXiv preprint arXiv:2110.14168_ , 2021. 

- Gao, H.-a., Geng, J., Hua, W., Hu, M., Juan, X., Liu, H., Liu, S., Qiu, J., Qi, X., Wu, Y., et al. A survey of self-evolving agents: On path to artificial super intelligence. _arXiv preprint arXiv:2507.21046_ , 2025. 

- Goodfellow, I., Bengio, Y., and Courville, A. _Deep learning_ . MIT press, 2016. 

## **References** 

   - Google. Deep research agent & gemini api. https: 

   - //blog.google/innovation-and-ai/ technology/developers-tools/ deep-research-agent-gemini-api/, 2025. Accessed: 2026-01-23. 

- Acikgoz, E. C., Qian, C., Ji, H., Hakkani-Tur, D., and Tur,¨ G. Self-improving llm agents at test-time. _arXiv preprint arXiv:2510.07841_ , 2025. 

- Anthropic. Claude 4.5 opus system card. https://www-cdn.anthropic.com/ bf10f64990cfda0ba858290be7b8cc6317685f47. pdf, 2025. Accessed: 2026-01-23. 

   - Guo, T., Chen, X., Wang, Y., Chang, R., Pei, S., Chawla, N. V., Wiest, O., and Zhang, X. Large language model based multi-agents: a survey of progress and challenges. In _Proceedings of the Thirty-Third International Joint Conference on Artificial Intelligence_ , IJCAI ’24, 2024. ISBN 978-1-956792-04-1. doi: 10.24963/ijcai.2024/ 890. URL https://doi.org/10.24963/ijcai. 2024/890. 

- Beirami, A., Agarwal, A., Berant, J., D’Amour, A., Eisenstein, J., Nagpal, C., and Suresh, A. T. Theoretical guarantees on the best-of-n alignment policy. _arXiv preprint arXiv:2401.01879_ , 2024. 

   - Gupta, N., Chatterjee, R., Haas, L., Tao, C., Wang, A., Liu, C., Oiwa, H., Gribovskaya, E., Ackermann, J., Blitzer, J., Goldshtein, S., and Das, D. Deepsearchqa: Bridging the comprehensiveness gap for deep research agents. https://storage.googleapis. com/deepmind-media/DeepSearchQA/ DeepSearchQA_benchmark_paper.pdf, 2025. Google DeepMind, Google Search, Kaggle, and Google Research. 

- Bottou, L. Large-scale machine learning with stochastic gradient descent. In _Proceedings of COMPSTAT’2010_ , pp. 177–186. Springer, 2010. 

- ByteDance. Seed-1.8 model card. https: //github.com/ByteDance-Seed/Seed-1. 8/blob/main/Seed-1.8-Modelcard.pdf, 2025. Accessed: 2026-01-23. 

- Cai, Y., Hao, Y., Zhou, J., Yan, H., Lei, Z., Zhen, R., Han, Z., Yang, Y., Li, J., Pan, Q., et al. Building self-evolving agents via experience-driven lifelong learning: A frame- 

- He, Y., Huang, C., Li, Z., Huang, J., and Yang, Y. Visplay: Self-evolving vision-language models from images. _arXiv preprint arXiv:2511.15661_ , 2025. 

10 

Yunjue tech 


![[yunjue-p0011-01.png]]


- Hong, H., Yin, J., Wang, Y., Liu, J., Chen, Z., Yu, A., Li, J., Ye, Z., Xiao, H., Chen, Y., et al. Multi-agent deep research: Training multi-agent systems with m-grpo. _arXiv preprint arXiv:2511.13288_ , 2025. 

- Hu, L., Jiao, J., Liu, J., Ren, Y., Wen, Z., Zhang, K., Zhang, X., Gao, X., He, T., Wu, Y., et al. Finsearchcomp: Towards a realistic, expert-level evaluation of financial search and reasoning. _arXiv preprint arXiv:2509.13160_ , 2025. 

- Jin, R., Zhang, Z., Wang, M., and Cong, L. Stella: Self-evolving llm agent for biomedical research. _arXiv preprint arXiv:2507.02004_ , 2025. 

- LangChain. Langgraph, 2024. URL https:// github.com/langchain-ai/langgraph. Accessed: 2026-01-25. 

- Li, X., Jiao, W., Jin, J., Dong, G., Jin, J., Wang, Y., Wang, H., Zhu, Y., Wen, J.-R., Lu, Y., et al. Deepagent: A general reasoning agent with scalable toolsets. _arXiv preprint arXiv:2510.21618_ , 2025. 

- Lu, J., Kong, Z., Wang, Y., Fu, R., Wan, H., Yang, C., Lou, W., Sun, H., Wang, L., Jiang, Y., Wang, X., Sun, X., and Zhou, D. Beyond static tools: Test-time tool evolution for scientific reasoning, 2026. URL https: //arxiv.org/abs/2601.07641. 

- OpenAI. Introducing gpt-5.2. https://openai.com/ index/introducing-gpt-5-2/, 2025. Accessed: 2026-01-23. 

- Park, J. S., O’Brien, J., Cai, C. J., Morris, M. R., Liang, P., and Bernstein, M. S. Generative agents: Interactive simulacra of human behavior. In _Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology_ , UIST ’23, New York, NY, USA, 2023. Association for Computing Machinery. ISBN 9798400701320. doi: 10.1145/3586183.3606763. URL https://doi. org/10.1145/3586183.3606763. 

- Phan, L., Gatti, A., Han, Z., Li, N., Hu, J., Zhang, H., Zhang, C. B. C., Shaaban, M., Ling, J., McCauley, S., et al. Humanity’s last exam. _arXiv preprint arXiv:2501.14249_ , 2025. Available at https://lastexam.ai/. 

- Qian, C., Xie, Z., Wang, Y., Liu, W., Zhu, K., Xia, H., Dang, Y., Du, Z., Chen, W., Yang, C., et al. Scaling large language model-based multi-agent collaboration. _arXiv preprint arXiv:2406.07155_ , 2024. 

- Qin, Y., Hu, S., Lin, Y., Chen, W., Ding, N., Cui, G., Zeng, Z., Huang, Y., Xiao, C., Han, C., et al. Tool learning with foundation models. In _Advances in Neural Information Processing Systems_ , volume 37, 2024. 

- Qiu, J., Qi, X., Wang, H., Juan, X., Wang, Y., Zhao, Z., Geng, J., Guo, J., Li, P., Shi, J., et al. Alita-g: Selfevolving generative agent for agent generation. _arXiv preprint arXiv:2510.23601_ , 2025. 

- Tang, X., Qin, T., Peng, T., Zhou, Z., Shao, D., Du, T., Wei, X., Zhu, H., Zhang, G., Liu, J., Wang, X., Hong, S., Wu, C., and Zhou, W. AGENT KB: A hierarchical memory framework for cross-domain agentic problem solving. In _ICML 2025 Workshop on Collaborative and Federated Agentic Workflows_ , 2025. URL https:// openreview.net/forum?id=ohXoWHlrn8. 

- Tao, Z., Lin, T.-E., Chen, X., Li, H., Wu, Y., Li, Y., Jin, Z., Li, F., Li, D., and Zhou, K. A survey on self-evolution of large language models. _arXiv preprint arXiv:2404.14387_ , 2024. 

- Team, M., Bai, S., Bing, L., Chen, C., Chen, G., Chen, Y., Chen, Z., Chen, Z., Dai, J., Dong, X., et al. Mirothinker: Pushing the performance boundaries of open-source research agents via model, context, and interactive scaling. _arXiv preprint arXiv:2511.11793_ , 2025. 

- The Pallets Projects. Jinja2, 2007. URL https:// jinja.palletsprojects.com/. Accessed: 202601-25. 

- Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., and Anandkumar, A. Voyager: An openended embodied agent with large language models. _arXiv preprint arXiv:2305.16291_ , 2023. 

- Wang, Z. Z., Mao, J., Fried, D., and Neubig, G. Agent workflow memory. _arXiv preprint arXiv:2409.07429_ , 2024. 

- xBench Team. xbench: Deepsearch leaderboard. https: //xbench.org/agi/aisearch, 2025a. Accessed: 2026-01-23. 

- xBench Team. xbench: Scienceqa leaderboard. https:// xbench.org/agi/scienceqa, 2025b. Accessed: 2026-01-23. 

- Xia, C. S., Wang, Z., Yang, Y., Wei, Y., and Zhang, L. Liveswe-agent: Can software engineering agents self-evolve on the fly? _arXiv preprint arXiv:2511.13646_ , 2025. 

- Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., and Cao, Y. React: Synergizing reasoning and acting in language models. In _Proceedings of the International Conference on Learning Representations (ICLR)_ , 2023. 

- Ye, R., Tang, S., Ge, R., Du, Y., Yin, Z., Chen, S., and Shao, J. MAS-GPT: Training LLMs to build LLMbased multi-agent systems. In _Forty-second International Conference on Machine Learning_ , 2025. URL https: //openreview.net/forum?id=3CiSpY3QdZ. 

11 

Yunjue tech 


![[yunjue-p0012-01.png]]


- Yu, C., Lu, S., Zhuang, C., Wang, D., Wu, Q., Li, Z., Gan, R., Wang, C., Hou, S., Huang, G., Yan, W., Hong, L., Xue, A., Wang, Y., Gu, J., Tsai, D., and Lin, T. Aworld: Orchestrating the training recipe for agentic ai, 2025. URL https://arxiv.org/abs/2508.20404. 

- Zaremba, W., Brockman, G., and OpenAI. OpenAI Codex. https://openai.com/index/ openai-codex/, August 2021. Accessed: 2025-0119. 

- Zhang, H., Lu, J., Jiang, S., Zhu, C., Xie, L., Zhong, C., Chen, H., Zhu, Y., Du, Y., Gao, Y., et al. Co-sight: Enhancing llm-based agents via conflict-aware metaverification and trustworthy reasoning with structured facts. _arXiv preprint arXiv:2510.21557_ , 2025a. 

- Zhang, J., Xiang, J., Yu, Z., Teng, F., Chen, X.-H., Chen, J., Zhuge, M., Cheng, X., Hong, S., Wang, J., Zheng, B., Liu, B., Luo, Y., and Wu, C. AFlow: Automating agentic workflow generation. In _The Thirteenth International Conference on Learning Representations_ , 2025b. URL https://openreview.net/forum? id=z5uVAKwmjf. 

- Zhang, K., Chen, X., Liu, B., Xue, T., Liao, Z., Liu, Z., Wang, X., Ning, Y., Chen, Z., Fu, X., et al. Agent learning via early experience. _arXiv preprint arXiv:2510.08558_ , 2025c. 

- Zhou, Y., Levine, S., Weston, J. E., Li, X., and Sukhbaatar, S. Self-challenging language model agents. In _The Thirtyninth Annual Conference on Neural Information Processing Systems_ , 2025. URL https://openreview. net/forum?id=9yusqX9DpR. 

12 

Yunjue tech 


![[yunjue-p0013-01.png]]


## **A. Mathematical proof** 

This section details the formal proofs for Theorems 5.1 and 5.2, originally presented in Section 5.3. 

### **A.1. Proof of theorem 5.1** 

We begin by establishing the sufficient condition for the monotonic decrease of the EGL metric at step _t_ +1 (i.e., _Lt_ +1 _< Lt_ ). By definition: 


![[yunjue-p0013-06.png]]


<!-- Start of picture text -->
Lt +1 = Ct  +  ct +1 < Ct =  Lt (2)<br>Ut  +  ut +1 Ut<br><!-- End of picture text -->

Since the total invocation count _Ut_ is strictly positive, we cross-multiply without reversing the inequality: 


![[yunjue-p0013-08.png]]


<!-- Start of picture text -->
( Ct  +  ct +1)  · Ut < Ct ·  ( Ut  +  ut +1) (3)<br><!-- End of picture text -->

Expanding the terms yields: 


![[yunjue-p0013-10.png]]


<!-- Start of picture text -->
CtUt  +  ct +1 Ut < CtUt  +  Ctut +1 (4)<br><!-- End of picture text -->

Subtracting the common term _CtUt_ and rearranging results in the _Descent Condition_ : 


![[yunjue-p0013-12.png]]


<!-- Start of picture text -->
ct +1 < Ct (5)<br>ut +1 Ut<br><!-- End of picture text -->

This derivation demonstrates that _Lt_ decreases if and only if the marginal ratio of synthesis to invocation at the current step ( _ct_ +1 _/ut_ +1) is strictly lower than the historical cumulative ratio ( _Ct/Ut_ ). During early evolutionary stages, extensive exploration ( _ct_ +1 _>_ 0) may induce fluctuations. However, as the agent transitions to an exploitation phase ( _ct_ +1 _→_ 0 while _ut_ +1 _≥_ 1), the marginal ratio vanishes, guaranteeing satisfaction of the inequality and ensuring the strict decrease of the metric. 

### **A.2. Proof of theorem 5.2** 

To establish the asymptotic dynamics of _Lt_ , we introduce the following assumptions governing the evolutionary process: **Assumption A.1** (Knowledge Boundedness) **.** The task domain admits a finite set of optimal primitives sufficient to resolve all potential queries. As the agent evolves, the cumulative count of synthesized tools _Ct_ converges to a finite upper bound _C_ max. Consequently, marginal tool generation vanishes asymptotically: 


![[yunjue-p0013-16.png]]


<!-- Start of picture text -->
t lim →∞ Ct =  C max = ⇒ t lim →∞ ct = 0 (6)<br><!-- End of picture text -->

We posit this as a mild condition. Empirically, as validated in Figure 6, the marginal growth of synthesized tools diminishes toward zero once the agent consolidates sufficient generalized knowledge. 

**Assumption A.2** (Continuous Activity) **.** We assume every newly synthesized tool is immediately invoked at least once, ensuring 0 _≤ ct ≤ ut_ and 0 _≤ uctt_<sup>_≤_1.Operationally,ifasynthesizedtoolremainsuninvoked,itisdiscardedpost-</sup> processing to satisfy this constraint. Additionally, we assume every query necessitates at least one tool invocation ( _ut ≥_ 1), with the invocation count fluctuating around a stationary mean _µ ≥_ 1. This implies that cumulative invocations _Ut_ grow linearly with respect to _t_ : 


![[yunjue-p0013-19.png]]


<!-- Start of picture text -->
Ut ≈ µ · t as  t →∞ (7)<br><!-- End of picture text -->

Note that for the boundary condition _ut_ = 0, we define _ct/ut_ = 0 to avoid singularity. Figure 7(c) provides empirical evidence supporting the linear growth of _Ut_ throughout the evolutionary steps. 

Based on Assumptions A.1 and A.2, we analyze the limit of _Lt_ as _t →∞_ : 


![[yunjue-p0013-22.png]]


<!-- Start of picture text -->
C max<br>lim ≈ lim (8)<br>t→∞ Lt = lim lim t t →∞ →∞ C Ut t t→∞ µ · t<br><!-- End of picture text -->

13 

Yunjue tech 


![[yunjue-p0014-01.png]]


Since _C_ max and _µ_ are positive constants: 


![[yunjue-p0014-03.png]]


<!-- Start of picture text -->
t lim →∞ Lt = 0 (9)<br><!-- End of picture text -->

This confirms that EGL functions mathematically as a loss metric, converging to zero at a rate of _O_ (1 _/t_ ) as system stability is achieved. 

## **B. Algorithm** 

**Algorithm 1** Yunjue Agent Execution and Evolution Pipeline 

- 1: **Input:** Query Batch _Qt_ = _{qt,_ 1 _, . . . , qt,B}_ , Global Tool Library _Tt−_ 1 2: **Output:** Answers _At_ , Updated Library _Tt_ 3: _At ←∅_ , _Tnew ←∅_ 

- 4: **for each** query _qt,i ∈Qt_ **in parallel do** 5: _Rmiss ←∅_ , done _←_ **false** 6: **while not** done **do** 7: _ωreq ←_ **Manager** ( _qt,i, Tt−_ 1 _, Rmiss_ ) _{_ Analysis required tools _}_ 8: **if** new tool required **then** 9: _Pt,i ←_ **ToolDeveloper** ( _qt,i, ωreq_ ) _{_ Synthesize new tools _}_ 

- 10: _Tlocal ←Tt−_ 1 _∪Pt,i_ 11: _Tnew ←Tnew ∪Pt,i_ 12: **else** 13: _Tlocal ←Tt−_ 1 14: **end if** 15: _rt,i, Rmiss ←_ **Executor** ( _qt,i, Tlocal_ ) _{_ Execute and update capability missing report _}_ 16: **if** _Rmiss_ = _∅_ **then** 17: done _←_ **true** 18: **end if** 19: **end while** 

- 20: _at,i ←_ **Integrator** ( _qt,i, rt,i_ ) _{_ Integrate final answer _}_ 21: _At ←At ∪{at,i}_ 

22: **end for** 

23: _Cclusters ←_ **Aggregator** ( _Tt−_ 1 _, Tnew_ ) _{_ Cluster and absorb analogous tools _}_ 

24: _Tt ←_ **Merger** ( _Cclusters_ ) _{_ Merge and update global repository _}_ 25: **return** _At_ , _Tt_ 

## **C. Experiment setup** 

_<u>Table 4.</u>_ <u>Statistics of the datasets.</u> 

|**Dataset**|**Domain**|**Language**|**# Queries**|
|---|---|---|---|
|HLE|General reasoning|EN|2,500|
|DeepSearchQA|General QA|EN|900|
|FinSearchComp (T1 & T2)|Financial search|EN & CH|391|
|xBench-ScienceQA|General science|CH|100|
|xBench-DeepSearch|General research|CH|100|



Data statistics are summarized in Table 4. 

**Evaluation protocols.** We follow the standard evaluation protocols released with each dataset: 

- HLE: Official evaluation script 

- DeepSearchQA: Official evaluation script 

14 

Yunjue tech 


![[yunjue-p0015-01.png]]



![[yunjue-p0015-02.png]]


<!-- Start of picture text -->
DeepSearchQA FinSearchComp<br>8<br>2.5<br>7<br>2.0 6<br>5<br>1.5<br>4<br>1.0 3<br>2<br>0.5<br>1<br>0.0 0<br>0 200 400 600 800 0 50 100 150 200 250 300 350<br>Evolution step Evolution step<br>EGL EGL<br><!-- End of picture text -->

_Figure 8._ EGL dynamics on the DSQA and FSC datasets. 

_Table 5._ Experimental results across five benchmarks of the Yunjue Agent in the zero-start setting. “Token” denotes the average token consumption per query, “Exec. Ratio” indicates the proportion of tokens consumed by the Executor, and “Cost” denotes the monetary expense based on token usage. 

|**Dataset**|**Accuracy**(%)|**Token**|**Exec. Ratio**(%)|**Cost**($)|
|---|---|---|---|---|
|HLE|48_._0_±_0_._2|421k|95.1|1.48|
|DeepSearchQA|73_._5_±_0_._4|718k|95.6|1.78|
|FinSearchComp|65_._0_±_0_._1|474k|94.5|1.30|
|xbench-ScienceQA|76_._5_±_0_._6|207k|94.2|0.73|
|xbench-DeepSearch|59_._7_±_0_._2|569k|94.7|1.48|



- FinSearchComp: Judging prompts 

- xBench: Official evaluation script 

**Baselines sources.** We collect baseline results from their official reports or leaderboards. For HLE, results for Gemini Deep Research and Gemini 3 Pro are from (Google, 2025); MiroThinker-v1.0-72B and Tongyi DeepResearch are from (Team et al., 2025); GPT-5.2 Pro is from (OpenAI, 2025); Seed-1.8 is from (ByteDance, 2025); Claude 4.5 Opus is from (Anthropic, 2025); and Co-Sight is from (Zhang et al., 2025a). DeepSearchQA results are from (Gupta et al., 2025). FinSearchComp results are from (ByteDance, 2025). For xBench, results on ScienceQA and DeepSearch are retrieved from (xBench Team, 2025b) and (xBench Team, 2025a), respectively. Additionally, for xBench-DeepSearch, we include M-GRPO (Hong et al., 2025) and AWorld (Yu et al., 2025). 

**Implementation details.** To ensure experimental consistency, all nodes in our system are instantiated using the same _backend LLM_ : Gemini 3 Pro. The batch size is set to _B_ = 16 for all datasets. The _Tool Developer_ module is explicitly powered by Codex (Zaremba et al., 2021) to facilitate robust code generation. We main a fixed temperature of 0.7 across all LLM invocations. To simplify the use of multimodal capabilities, we encapsulate image processing functionality into a dedicated tool, ensuring utilization of the same backend LLM. Our agent system is built based on LangGraph (LangChain, 2024). All prompts in our system adopt the Markdown template format supported by Jinja (The Pallets Projects, 2007). 

## **D. More evaluation results** 

**Detailed results on five benchmarks.** Table 5 summarizes the detailed performance of the Yunjue Agent in the zero-start setting across five datasets, where accuracy is calculated as the mean and standard deviation over three runs using the LLM-as-judge. 

**More results on evolutionary generality loss (EGL).** Figure 8 tracks the EGL trajectories across the DSQA and FSC benchmarks, while Figure 9 dissects the impact of batch size on optimization behavior. Collectively, these visualizations validate the asymptotic stability of our approach across varying experimental conditions. 

**Technical insights.** We observed that Gemini 3 Pro possesses strong reasoning capabilities and internal knowledge, often 

15 

Yunjue tech 


![[yunjue-p0016-01.png]]



![[yunjue-p0016-02.png]]


<!-- Start of picture text -->
Batch size = 2 Batch size = 4 Batch size = 8 Batch size = 16<br>16 10 14 30<br>14 8 12 25<br>12<br>10 20<br>10 6<br>8<br>8 15<br>6 4 6 10<br>4 4<br>2 2 2 5<br>0 0 0 0<br>0 25 50 75 100 125 150 175 200 0 25 50 75 100 125 150 175 200 0 25 50 75 100 125 150 175 200 0 25 50 75 100 125 150 175 200<br>Evolution step Evolution step Evolution step Evolution step<br>EGL EGL EGL EGL<br><!-- End of picture text -->


![[yunjue-p0016-03.png]]


<!-- Start of picture text -->
Figure 9. EGL dynamics under different batch sizes.<br>Input: "Determine states..
 Decomposes task<br>Task Assignment<br>Part ≥ 50%...Score   ≥ 20 …" →Assigns to Tool Developer.<br>Manager<br>Instantitates web_search.<br>Tool Generation<br>Instantitates fetch_web_text.<br>Tool  Developer<br>Attempt 1:  Attempt 2(Recovery):<br>→ web_search
 → Parses search result snippets directly.<br>(Success:Found ACT.org PDF)<br>Refinement(The 'read_pdf'):<br>Exec → fetch_web_text
 System detects PDF  failure.
 Data Reasoning:<br>(Target:PDF) Self - Correction: Marks  tool
 Utah (90%,19.9)→ Excluded.<br>Execution Loop for  enhancement; Switches  to<br>read_pdf FAILURE: "No  "Snippet Analysis"mode. Minnesota(68%,20.8)→Selected.<br>extractable text" (PDF format<br>error). South Dakota(59%,21.1)→Selected.<br>Report: "Minnesota and South Dakota are the only states meeting criteria.<br>Final Output<br>Science Benchmark：41% for both."<br><!-- End of picture text -->

_Figure 10._ Yunjue Agent execution pipeline. Upon receiving a query, the agent autonomously synthesizes, deploys, and iteratively refines tools to derive the final response, seamlessly integrating generation and execution. 

exhibiting a sense of “confidence”, which is manifested by its tendency to rely on fewer tools to complete tasks. However, it frequently suffers from hallucinations and often exhibits weaker instruction-following capabilities, necessitating iterative prompt engineering. In contrast, GPT-5 and GPT-5-mini often appear more “cautious”, typically requiring the invocation of more tools, planning, and reasoning steps to iteratively verify task results. This leads to increased tool creation and longer execution histories. This phenomenon is particularly pronounced in GPT-5 (as shown in Table 3, the GPT-5 series clearly creates more tools). Nevertheless, the GPT-5 series demonstrates exceptional instruction-following abilities; adding constraints to their prompts generally yields behavior consistent with expectations. 

## **E. Case study** 

**Tool evolution.** Figure 10 illustrates the end-to-end execution pipeline of the Yunjue Agent. When presented with a query, the _Manager_ delegates tool creation to the _Tool Developer_ . The agent effectively instantiates necessary tools and, crucially, demonstrates self-correction capabilities. When an initial tool fails (e.g., a PDF reader failure), the system detects the error, refines its strategy, and successfully derives the final answer, highlighting the seamless integration of tool generation, execution, and refinement. 

16 


![[yunjue-p0017-00.png]]


<!-- Start of picture text -->
Yunjue tech<br><!-- End of picture text -->


![[yunjue-p0017-01.png]]


<!-- Start of picture text -->
Initial Tool Pool
 Merged Tools<br>Tool Clustering & Merging<br>(Before absorbing) (After absorbing)<br>Cluster: evaluate_math_expression<br>evaluate_expression<br>calculate_math  download_file_from_urf calculate_math  evaluate_expression  eval_math_expression.py<br>Cluster: download_file<br>fetch_file<br>get_web_content download_file.py<br>retrieve_url_text download_file_from_url  fetch_file<br>scrape_web_page Cluster: fetch_web_content<br>perform_web_search fetch_web_content.py<br>search_the_web<br>execule_web_query get_web_content  retrieve_ur_text  scrape_web_page<br>Cluster: search_web search_web.py<br>find online_info web_serch_tool<br>perform_web_search search_the_web  execute_web_query<br>Final optimized toolset reduced from<br>12 initial tools to 4 merged tools.<br>find_online_info web_search_tool<br><!-- End of picture text -->

_Figure 11._ Illustration of tool absorbing mechanism. Following batch execution, functionally analogous tools are identified via clustering and consolidated into a generalized, compact toolset, effectively pruning redundancy. 


![[yunjue-p0017-03.png]]


<!-- Start of picture text -->
Task Assignment<br>Input: "Patient symptoms: transient monocular vision loss, headache,  python_executor<br>hearing  loss. What  is  the  diagnosis  and  imaging  finding?"<br>Manager Manager checks toolbox. Only generic "python_executor"<br>available. Assigns task to Agent.<br>Execution Loop (High Friction & Iterative Debugging)<br>Attempts 1 - 6(Failures &Debugging)<br>python_executor ( code:'from  crawl4ai.config  python_executor(code:<br>import BrowserConfig...')
 'import  asyncio,io,re,json<br>→ Error:  ImportError Attribute not found. from  crawl4ai  import  AsyncWebCrawler<br>urls  =  ["https://en.wikipedia.org...",…]<br>async   def   fetch(url):<br>python_executor(code:'import   crawl4ai;  
 Exec    async with AsyncWebCrawler(...) as crawler:<br>print(dir(cra wl4ai))...')
        result  = await crawler.arun(url)...')<br>→ Debugging: Inspecting library structure.<br>Executer<br>Output Snippet: "...Susac's syndrome...triad of encephalopathy,<br>python_executor(code:'import inspect;<br>branch retinal artery occlusions,hearing loss.MRI hallmark...<br>print(inspect.getsource(config))...')<br>corpus  callosum  "snowball"lesions..."<br>→ Debugging: Reading module source code.<br>Executor spends cycles debugging libraries instead of performing the task. Success requires writing verbose,complex async scripts.<br>Final Output<br>Report: "Diagnosis is Susac's syndrome.Characteristic imaging finding is leptomeningeal<br>enhancement with °snowball"hyperintensities visualized by MRI."<br><!-- End of picture text -->

_Figure 12._ Python-only baseline failure mode. Unlike our approach, the baseline indiscriminately accumulates raw execution traces—including erroneous attempts—within the context window, leading to severe contextual contamination and reasoning degradation. 

17 

Yunjue tech 


![[yunjue-p0018-01.png]]


**Knowledge consolidation via absorbing.** Figure 11 depicts the tool absorbing mechanism. Following batch execution, the initial tool pool often contains redundant or highly specific tools. The system employs clustering to identify functionally analogous tools and merges them into a compact, generalized toolset (e.g., consolidating multiple web scrapers into a single robust tool). This process effectively prunes redundancy, ensuring the long-term efficiency and generalizability of the tool library. 

**Comparison with Python-only baseline.** Figure 12 contrasts our approach with a typical Python-only baseline failure mode. In complex tasks like medical diagnosis, the baseline often struggles with library dependencies and engages in high-friction debugging loops. Unlike our approach, the baseline accumulates raw, erroneous execution traces within its context window, leading to severe context contamination and reasoning degradation. 

**Tool similarity and clustering** To verify the semantic alignment of tools between independent evolutionary runs (as visualized in Figure 4), we present a direct code comparison. We contrast send ~~h~~ ttp ~~r~~ equest, under a zero-start setting, with fetch ~~a~~ pi ~~d~~ ata, under a warm-start setting, evolved for DeepSearchQA. Despite distinct origins, both converge on core HTTP functionality, necessitating similar dependencies and logic structures. 

## **Tool: send** **~~h~~ ttp** **~~r~~ equest** 

- __TOOL_META__ = { 

"name": "send_http_request", 

- "description": "Sends customizable HTTP GET or POST requests to a specified URL with optional form or JSON payloads, allowing the inclusion of custom headers and returning the response status code plus textbased body content or a saved-file notice for binary responses.", 

"dependencies": ["requests", "beautifulsoup4"], } **try** : 

response = session.request(method= **input** .method, url= **input** .url, **request_kwargs) **except** requests.RequestException **as** exc: **return** OutputModel(status_code=-1, response_text=f"Request failed: {exc}") 

content_type = response.headers.get("Content-Type", "").lower() **if** content_type **and** _is_textual_content(content_type): body_text = response.text **elif not** content_type **and** response.encoding: body_text = response.text 

## **Tool: fetch** **~~a~~ pi** **~~d~~ ata** 

__TOOL_META__ = { 

"name": "fetch_api_data", 

- "description": "Performs an HTTP GET request to a specified API endpoint with optional query parameters and headers, then returns the raw response body (typically JSON) for downstream programmatic consumption.", 

- "dependencies": ["httpx"], 

} 

**with** httpx.Client(timeout=timeout) **as** client: 

response = client.get( **input** .url, params=params, headers=headers) response.raise_for_status() content_type = response.headers.get("content-type", "").lower() **if** "application/json" **in** content_type: body = response.text **elif** "text/" **in** content_type: body = response.text **else** : body = response.text OutputModel(response_data=body) 

18 

Yunjue tech 


![[yunjue-p0019-01.png]]


## **F. Prompts** 

## **Manager** 

- You are a Task Orchestrator. Your mission is to analyze the task, determine the exact set of tools needed-selecting from available ones or defining new ones if absolutely necessary, and provide a strategic outline for how these tools can be used to complete the task. 

- # Core Principle **<sup>Yourabsolutepriorityistoenabletheexecutortocompletethe‘Task‘throughclearguidanceandtheright</sup> tools.** You must prioritize the combination of available, atomic tools. Only request new tools if this task can not be achieved using the available tools (even by chaining them). **NEVER create a composite tool that merely combines two or more available atomic tool capabilities.** 

# Task Information ## Task {{ user_query }} 

{% if failure_report %} ## Failure Report For Previous Execution {{ failure_report }} {% endif %} 

{% if additional_tool_requests %} ## Tool Request from Executor {{ additional_tool_requests }} {% endif %} 

# Available Tools 

The following tools are currently available: 

{% for tool in available_tools %} 

- **{{ tool.name }}**: {{ tool.description }}. The input args is {{ tool.input_schema }} 

- {% endfor %} 

# Analysis Instructions 

1. **Analyze the task requirements**: You must carefully think through which tools are needed to complete this task. {% if failure_report %} **You need to pay close attention to the content of suggestions and consider whether there are new tools that can help the executor complete the task.** 

{% endif %} 

2. **Exhaustive available Tool Check (Priority #1)**: 

- **Ask yourself:** "Can I accomplish this task by using available tools?" 

- **Ask yourself:** "If multiple similar tools exist that can accomplish a specific objective, which tool is the best for this scenario based on their descriptions?" 

- **Example:** If you need "weather for Paris", and you have a tool for web searching, USE this one. DO NOT create ‘get_weather‘. 

- **Tool name fidelity (MUST, case-sensitive)**: 

- You MUST treat tool names as **exact identifiers**. In your final JSON, every entry in ‘ required_tool_names‘ MUST be copied **verbatim** (character-for-character) from the provided ‘Available Tools‘ list. 

- **Image Capabilities Priority:** If the task requires OCR, image understanding, or other image processing capabilities, **prioritize using the ‘image_text_query‘ tool**. 

- - **Data Access Strategy:** Prefer **search/filter**, **metadata/summary inspection**, and **bounded previews / range reads** (with explicit limits, e.g., a small row/line window) to narrow scope before reading 

- data files--whether local or downloaded from remote sources. 

- **Example:** Before analyzing a CSV, first inspect the file metadata (e.g., size), then preview only the header + first few rows to confirm schema/format, and finally read only a specific row range/window as needed instead of loading the whole file. 

- If the task requires accessing network resources, you MUST bind both: 

- A discovery tool (e.g., ‘web_search‘) to find/identify relevant sources/URLs, and 

- A URL page text retrieval tool (e.g., ‘fetch_web_text‘) to fetch the minimal necessary details from the chosen URLs. This tool **is only responsible for fetching page text from a url.** 

- If you need to **download external resources/files** (e.g., PDFs, images, archives, binaries), you MUST also bind a **dedicated URL download tool**. **Downloading is NOT the same as retrieval**: retrieval is for reading/ scraping content; downloading is for saving the raw file from a URL. 

- Avoid using URL content retrieval tool alone without first discovering/justifying the target URLs via web search tool. 

3. **Restrictions on Selecting Required Tools (Priority #2)**. When selecting ‘required_tools‘ from available tools, you MUST observe these restrictions: 

- **If the task requires a sequence of actions or a multi-step process, you MUST decompose it into its smallest atomic components.** 

- For any required capability, if it can be achieved by chaining two or more available atomic tools (or proposed new atomic tools), you MUST use the atomic combination, rather than creating a tool that simply 

19 


![[yunjue-p0020-00.png]]


#### Yunjue tech 

##### combines two atomic ones. 

- **Goal:** The final required tools (in ‘required_tool_names‘ and ‘tool_requests‘) should represent the simplest, single-purpose functions possible. 

4. **Strict Criteria for New Tools (Priority #3)**: 

New tools can be requested only if existing available tools is not sufficient for the task. 

- Request new tools ONLY when it is necessary to access, process, or parse external resources such as local files or URLs, or when complex mathematical calculations are required. 

- If the task requires logic reasoning efforts, **DO NOT create tools**. 

- When a task hinges on complex, high-precision math (e.g., computing means, variances, or matrix operations), you MUST create or reuse a dedicated tool for those calculations instead of handling them manually. 

- {% if failure_report %} 

- New Tool Requirements Based on Failure Report: 

- **Ask yourself:** "According to ‘Failure Report For Previous Execution‘, were previous errors caused or amplified by missing, insufficient, or mis-specified tools?" 

- **Goal:** Decide, based on the failure report, whether **additional or revised tools** are needed (and specify them in ‘required_tool_names‘ or ‘tool_requests‘), or whether available tools are sufficient but should be used differently. 

- {% endif %} 

{% if additional_tool_requests %} 

- Tool Requests from Executor: 

- **Pay close attention to the ‘Tool Request from Executor‘ section above.** The executor has identified gaps in the available toolset based on hands-on execution experience. 

- **Validation:** If the executor’s request is valid and the tool doesn’t exist in the available tools, include it in ‘tool_requests‘. If the requested capability already exists in available tools, add those existing tool names to ‘required_tool_names‘ instead and **clearly explain in ‘tool_usage_guidance‘ which existing tool(s) can fulfill the executor’s request and how**. 

- - **Refinement:** If the executor’s tool request is too specific or composite, break it down into atomic components following the guidelines below. 

- **Generality Compliance:** When you decide to create a new tool based on the executor’s request, you MUST follow the **Tool Request Protocol** rules (especially the Topic-Agnostic Rule, Naming & Description Guardrails). Ensure the new tool is general-purpose and not overly specific to the current task context. 

- - **CRITICAL - Complete Tool Set:** When responding to executor tool requests, you MUST include in ‘ required_tool_names‘ ALL tools necessary to complete the entire task, not just the executor-requested tool(s). For example, if the executor requests a PDF extraction tool for a task that also requires downloading and searching, ‘required_tool_names‘ must include download, search, AND extraction tools. 

- {% endif %} 

- # Tool Request Protocol 

If you determine that new tools are needed, you **MUST** follow these rules: 

## Topic-Agnostic Rule (MUST) 

- **Strive to create tools with explicit generality**. If the task is solvable by a **general primitive** such as ‘web_search‘, you should prioritize creating the general one, and put the topic keywords into the query parameter, not in the tool name or description. For example, create "get_weather" with a city name as 

- argument, rather than "get_weather_beijing". 

- **<sup>Preference:</sup> ** 

- **Prioritize general tools**: e.g., use ‘eval_math_expression‘ to do arithmetics, rather than creating separate tools like ‘multiply_two_numbers‘ or ‘divide_two_numbers‘. 

- **<sup>Avoid:</sup> ** 

- Oversized tools with >5 params 

- Over-engineering for rare edge cases. 

- Do not create any Code executor related code, such as "Execute arbitrary Python code" or "Execute program" tools. 

## Naming & Description Guardrails 

- Name: verb_target (e.g., download_resource, fetch_weather) 

- No topic words (no wine / crypto / medical) 

- Description: Explains what it does, not what it’s about 

- Scope: Use only for functional distinctions (e.g., current vs forecast), not for topics 

##### ## Output Schema Requirements 

When defining new tools in ‘tool_requests‘, ensure the tool’s output is LLM-friendly: 

- **No raw HTML**: Tools MUST NOT return raw HTML content. Instead, return parsed/extracted text or structured data. 

- **No large binary data**: Avoid returning base64-encoded images, binary blobs, or other formats that are verbose and unsuitable for LLM processing. 

- **Structured & Concise**: Output should be well-structured (JSON objects, plain text, lists) and concise enough for the LLM to consume efficiently. 

- - **Example**: For web rendering, return cleaned text or specific data fields, not the entire HTML document. 

# Output Format 

You MUST output a valid JSON object with the following structure: 

20 

Yunjue tech 


![[yunjue-p0021-01.png]]


‘‘‘json 

{ "required_tool_names": ["tool_name_1", "tool_name_2"], "tool_usage_guidance": "tool_name_1: Sketch of how this tool supports the task within 20 words;\ntool_name_2: Another high-level usage hint", "tool_requests": [ { "name": "tool_name", "description": "Tool description", "input_schema": { "type": "object", "properties": { "param1": { "type": "string", "description": "Parameter description" } }, "required": ["param1"] }, "output_schema": { "type": "object", "properties": { "result": { "type": "string" } }, "required": ["result"] } } ] } ‘‘‘ **<sup>Rules:</sup> ** - ‘required_tool_names‘: List of tool names from available tools that are needed. Can be empty if no available tools are suitable. **Never** include a tool that does not exist. **MUST include ALL tools necessary to complete the task**, not just the ones specifically requested by the executor. - **Tool name fidelity (repeat, MUST)**: Do not output aliases/synonyms/renamed tools. Tool names in ‘ required_tool_names‘ MUST exactly match an entry in ‘Available Tools‘ (case-sensitive), or else you must put that tool under ‘tool_requests‘ instead. - ‘tool_usage_guidance‘: Provide a concise and very brief ‘tool: relation-to-task‘ sketch for each selected tool, showing at a glance how it will be applied without diving into execution details. This guidance must include every tool listed in ‘required_tool_names‘ and each tool defined in ‘tool_requests‘ so nothing is left undocumented. **If a executor-requested tool can be fulfilled by existing tool(s), explicitly state the mapping here** (e.g., "Executor requested X, using existing tool Y because..."). - ‘tool_requests‘: **List of TOOL_REQUEST objects** (can contain **multiple tools**). If available tools are sufficient, ‘tool_requests‘ should be an empty array ‘[]‘. - If new tools are needed, include **all required tools** in the ‘tool_requests‘ array - **IMPORTANT**: ‘tool_requests‘ can contain **one or more** tool requests. If the task requires multiple new tools, add all of them to this list. For example, if you need both a PDF parser and an image extractor, include both in the array. # Examples ## Example 1: Fetch web page task **<sup>Task:</sup> **<sup>"Searchforandfetchcontentfromawebpageaboutclimatechange,thensaveandreaditlocally."</sup> **<sup>AvailableTools:</sup> **<sup>web_search,fetch_url_text,read_text_file</sup> **<sup>Output:</sup> ** ‘‘‘json { "required_tool_names": ["web_search", "fetch_url_text", "read_text_file"], "tool_usage_guidance": "web_search: Discover relevant web pages about climate change; fetch_url_text: Download the page content to local storage; read_text_file: Read the saved content from local file with chunk-based reading.", "tool_requests": [] } ‘‘‘ ## Example 2: New tools needed **<sup>Task:</sup> **<sup>"FetchaPDFdocumentfromaurl,extracttextfromthedocument."</sup> **<sup>AvailableTools:</sup> **<sup>download_file</sup> **<sup>Output:</sup> ** 

21 

Yunjue tech 


![[yunjue-p0022-01.png]]


‘‘‘json { "required_tool_names": ["download_file"], "tool_usage_guidance": "download_file: Store the PDF locally; extract_pdf_text: Convert the stored PDF into text.", "tool_requests": [ { "name": "extract_pdf_text", "description": "Extract text content from PDF documents", "input_schema": { "type": "object", "properties": { "pdf_path": { "type": "string", "description": "Path to the PDF file" } }, "required": ["pdf_path"] }, "output_schema": { "type": "object", "properties": { "text": {"type": "string"} }, "required": ["text"] } } ] } ‘‘‘ 

Now analyze the Task and provide your response as a JSON object following the format above. 

## **Tool Developer** 

- You are Tool Developer, a precise coding assistant. Your task: from the provided **TOOL_REQUEST**, generate a **<sup>COMPLETEPythontool</sup> **<sup>thatcanruninasandbox.Youhave</sup> **<sup>fullprivileges</sup> **<sup>inthissandbox:youmay</sup> use **any third-party packages**. 

- **<sup>Yourprimarygoalistobuildthemosteffectivetoolpossible.</sup> ** 

# CODE CONTENT (INSIDE A SINGLE BLOCK) 

1. ‘__TOOL_META__ = {‘ 

- <sup>‘"name":"<snake_case_name>"‘#usesamenamewithTOOL_REQUEST.name</sup> 

- <sup>‘"description":"<oneparagraph>"‘#asingleparagraphdescribingthetool’scapabilities/usage(whatit</sup> does, for what, and what it returns) 

- *<sup>‘"dependencies":["pkg1","pkg2",...]‘#derivefromneedsorTOOL_REQUEST.dependencies.</sup> ‘}‘ 

2. **Pydantic model**: ‘‘‘python from pydantic import BaseModel, Field, field_validator class InputModel(BaseModel): 

# fields derived from input_schema (exact same names & inferred types) 

- # Use @field_validator for field-level validation (Pydantic v2 syntax), the mode of field_validator must be ’before’. 

- # DO NOT use @root_validator or @validator (deprecated) 

- class OutputModel(BaseModel): 

# fields derived from output_schema (exact same names & inferred types) 

- # Use @field_validator for field-level validation (Pydantic v2 syntax), the mode of field_validator must be ’before’. 

# DO NOT use @root_validator or @validator (deprecated) 

# IMPORTANT: All output fields MUST be LLM-friendly (no raw HTML, no large binary data, only structured/ parsed content) ‘‘‘ 3. **Entrypoint**: ‘‘‘python def run(input: InputModel) -> OutputModel: # validate inputs -> validate API keys from os.environ (per policy) # do work (local, file I/O, subprocess, and/or networking) # normalize -> return OutputModel ‘‘‘ 

# DERIVATION RULES (from TOOL_REQUEST): 

22 

Yunjue tech 


![[yunjue-p0023-01.png]]


- <sup>Use‘TOOL_REQUEST.description‘toset‘__TOOL_META__[’description’]‘andderivebehaviorfocus.</sup> 

   - <sup>Remoteresourcedownloadingtoolsshould</sup> **<sup>NOT</sup> **<sup>fetchbinary/media-onlycontent(e.g.PDFs,images,</sup> videos) since the returned result is meant to be read by an LLM Instead, save binary content to local file and return only the saved file path. 

   - <sup>Ifthe‘description‘relatesto</sup> **<sup>downloadingcontentfromaURLtolocalfiles</sup> **<sup>,youshoulduseanti-bot</sup> / anti-scraping techniques (e.g., realistic headers, randomized delays, retries/backoff, cookie/ 

   - session handling where appropriate). After downloading, the tool MUST **verify the download succeeded** by checking local file metadata (at minimum: file exists + non-zero size; preferably also: content- 

   - type/extension match, and/or a small signature check). If the download appears blocked by anti-bot measures or is incomplete, the tool MUST return/raise a **clear, explicit error** describing the failure and including the URL + relevant response/file metadata for debugging. 

- <sup>Build‘InputModel‘fieldsfrom‘TOOL_REQUEST.input_schema‘and‘OutputModel‘fieldsfrom‘TOOL_REQUEST.</sup> output_schema‘: 

   - <sup>Keepfieldnames</sup> **<sup>identical</sup> **<sup>tokeysin‘input_schema‘for‘InputModel‘and‘output_schema‘for‘</sup> OutputModel‘. 

   - <sup>Infertypesfromexamplevalues:string->‘str‘,integer->‘int‘,boolean->‘bool‘,null->‘Optional[type]‘</sup> with default ‘None‘. 

   - <sup>Everyfieldmusthave‘Field(...,description="...")‘;givesafedefaultsforoptionalfields.</sup> 

*<sup>Thefunctionmustbe:</sup> ‘‘‘python def run(input: InputModel) -> OutputModel: ‘‘‘ 

- <sup>TheinputmustbeaninstanceofInputModelandtheoutputmustbeaninstanceofOutputModel.</sup> 

- # Dependencies & Capabilities (ALL ALLOWED) 

*<sup>Youmay</sup> **<sup>importanypackage</sup> **<sup>,butdo</sup> **<sup>not</sup> **<sup>installdependenciesinsidethescript.Forclarity,codelike</sup> the following is forbidden: ‘‘‘python def _pip_install(package: str, retries: int = 2) -> None: # Keep timeouts short and quiet output cmd = [sys.executable, "-m", "pip", "install", "--quiet", package] last_err = None for i in range(retries): try: subprocess.run(cmd, check=True, env=env, timeout=120) return except Exception as e: last_err = e time.sleep(1.5 * (i + 1)) if last_err: raise last_err def _ensure_python_docx(): try: import docx # noqa: F401 except Exception: _pip_install("python-docx") import docx # noqa: F401 ‘‘‘ 

##### # Network Issues 

- **<sup>Networking</sup> **<sup>isallowed.Implementretries/backoffand</sup> **<sup>shorttimeouts</sup> **<sup>(e.g.,10s).</sup> 

##### # Pydantic v2 Compatibility 

Use ‘@field_validator‘ for field validation. NEVER use ‘@root_validator‘ or ‘@validator‘ (deprecated). Import: ‘from pydantic import BaseModel, Field, field_validator‘. 

## Implementation Instructions (MANDATORY) 

- <sup>EnsuretheimplementedscriptisavalidPythonmodulethatdefines‘__TOOL_META__‘,‘InputModel‘,‘</sup> OutputModel‘, and ‘run‘. 

- **<sup>Prioritize</sup> **<sup>ensuringthecorrectnessofthetool,ratherthanitsexecutionperformance.</sup> 

- <sup>ForanyintegrationwithexternalplatformAPIs,consultthelatestofficialdocumentationtoconfirmthe</sup> supported request formats and adjust the tool accordingly. 

- **<sup>OutputFormatRequirements(CRITICAL):</sup> ** 

- **<sup>NorawHTML</sup> **<sup>:ThetoolMUSTNOTreturnrawHTMLcontentin‘OutputModel‘fields.ParseHTMLandreturn</sup> cleaned text or structured data instead (e.g., using BeautifulSoup, html2text, lxml, or similar). 

- **<sup>Nolargebinarydata</sup> **<sup>:Neverreturnbase64-encodedimages,binaryblobs,orverboseunsuitableformats</sup> in ‘OutputModel‘. For binary content, save to a local file and return only the file path. 

- **<sup>Structured&Concise</sup> **<sup>:All‘OutputModel‘fieldsmustcontainLLM-friendlydata(plaintext,JSONobjects,</sup> lists, numbers) that is concise and directly consumable. 

- **<sup>Example</sup> **<sup>:Forwebscrapingtools,returnparsed/extractedtextorspecificdatafields,nottherawHTML</sup> document. 

- *<sup>Outputonlythetool’sPythoncode---noexplanations,comments,oradditionaltextoutsidetherequired</sup> fenced block. 

- <sup>Output</sup> **<sup>oneandonlyone</sup> **<sup>codeblockstartingwith‘‘‘‘python‘andendingwith‘‘‘‘‘.</sup> 

23 

Yunjue tech 


![[yunjue-p0024-01.png]]


- **<sup>Noprose</sup> **<sup>before/after.</sup> **<sup>Noextrablocks</sup> **<sup>.Everythingmustbeinsidethissingleblock.</sup> 

- **<sup>DONOT</sup> **<sup>savethegeneratedcodetoanyfile,rather,justwriteitinthestdout.</sup> 

- **<sup>ErrorHandling:</sup> **<sup>Whentheprogramencountersanexceptionorfailstoexecute,the‘OutputModel‘must</sup> specify the specific reason. Do not return empty results. 

TOOL_REQUEST (JSON): 

{{ tool_request_json }} 

## **Executor** 

You are Executor, an intelligent agent within a high-precision multi-agent system. You are required to accomplish the task described in ‘Task‘. 

- **<sup>Criticalrule:</sup> **<sup>Neverassumeatoolexists.Onlycalltoolsthatareexplicitlylistedinthecurrentbound</sup> tool list. 

# Behavior & Quality Bar 

1. **Think Before Acting:** * **<sup>ForTool-Use:</sup> **<sup>Beforecallinganytool,brieflyanalyze:WhatspecificallydoIneed?Whatisthebest</sup> tool for this task? 

* **<sup>ToolUsageGuidanceCompliance:</sup> **<sup>The</sup> **<sup>ToolUsageGuidance</sup> **<sup>blockinthe‘Task‘sectionsketcheshow</sup> each required tool supports the task. 

   - {% if context_summary %}* **Context Summary** is a curated, high-signal digest of information extracted from prior tool execution history. The format of the content in ‘Context Summary‘ is ‘<tool name> ( 

   - arguments) | tool execution results‘. **You must first reflect on the results already obtained in the Context Summary to determine whether the task has already been done, if not, what still needs to be done.** 

{% endif %} 

   - {% if failure_report %}* Carefully review the ‘Previous Failure Report‘ and follow its suggestions to complete the task and avoid repeating previous mistakes.{% endif %} 

2. **Iterative Refinement:** 

- <sup>Ifatoolerrorsorproducesabnormalresults,analyzetheerrormessagestrictly.Trytofixthe</sup> parameter and retry. 

- 3. **Fact-Based Execution:** 

   - <sup>Youroutputmustbestrictlyderivedfrom{%ifcontext_summary%}</sup> **<sup>ContextSummary,ToolOutputs,</sup> Reasoning Results** {% else %}**Tool Outputs or Reasoning Results**{% endif %}. 

# Notes & Constraints 

- **<sup>CitationisMandatory:</sup> **<sup>Everyfactualclaiminthe‘FinalConclusion‘mustbebackedbyevidencein‘Key</sup> Findings‘ from tool outputs{% if context_summary %} and Context Summary{% endif %}. 

- **<sup>DeadURLHandling:</sup> **<sup>IfyoufailtoaccessaURLorremoteresources(e.g.PDF)multipletimesdueto</sup> network issue (e.g., anti-robot policy), prioritize trying alternative URL (e.g., wikipedia) or resources to find the answer. Only search for it on the Wayback Machine (https://web.archive.org/{url-to-fetch}) with a url fetching tool as a last resort. 

- <sup>Prefer</sup> **<sup>search/filter</sup> **<sup>,</sup> **<sup>metadata/summaryinspection</sup> **<sup>,and</sup> **<sup>boundedpreviews/rangereads</sup> **<sup>(with</sup> explicit limits, e.g., a small row/line window) to narrow scope before reading local data files. 

- **<sup>Example:</sup> **<sup>BeforeanalyzingaCSV,firstpreviewonlytheheader+firstfewrowstoconfirmschema/</sup> format, then read only a specific row range/window as needed instead of loading the whole file. 

- * **<sup>RemoteResourceAccess:</sup> **<sup>Ifyouneedtoaccessremotemultimediaresources(e.g.,PDF,image,video),you</sup> **<sup>MUST</sup> **<sup>firstusedownloadingtoolstosavethemtolocalpath.</sup> 

- **<sup>High-PrecisionMath:</sup> **<sup>Whenthetaskdependsoncomplex,high-accuracymath(e.g.,means,variances,matrix</sup> ops), rely on the provided math-focused tool rather than hand-calculating inside the response. 

- **<sup>MultimodalTaskHandling:</sup> **<sup>Formultimodaltasksinvolvinginformationextractionandunderstanding(e.g.,</sup> determining if an object is present in an image or if a topic is mentioned in audio), you **MUST** first call the relevant image or audio tools to extract the raw content (e.g., captions, transcriptions), and then make the judgment yourself based on the tool’s output. **Do not** rely on the tool to perform the judgment or reasoning for you. 

* **<sup>Non-InteractivePrinciple(CRITICAL):</sup> **<sup>Youare</sup> **<sup>absolutelynotallowed</sup> **<sup>toincludeanytextinany</sup> output (including Analysis, Plan, or Key Findings, Final Conclusion) that requires or implies **user interaction** (e.g., "Please confirm," "Awaiting user selection," "Seeking clarification from user"). If a tool fails to achieve the desired outcome, try alternative methods. * **<sup>ConflictDataJudgment:</sup> **<sup>Iftherearemultipleconflictinginformationsources,choosetheonethatis</sup> logically most correct or closest to follow the ‘Description‘. 

# Output Format Your output MUST be follow the Markdown format: 

‘‘‘markdown ## Reasoning & Plan {% if context_summary %} 

- **<sup>Reflection:</sup> **<sup>Resultsalreadyrevealedin‘ContextSummary‘andwhatstillneedstocomplete.</sup> 

- {% else %} 

- **<sup>Analysis:</sup> **<sup>Brieflyexplainyouranalysisofhowtoaccomplishthetask.</sup> 

24 

Yunjue tech 


![[yunjue-p0025-01.png]]


{% endif %} 

* **<sup>Plan:</sup> **<sup>Step-by-stepplanofwhichtoolsyouwilluseandwhy.</sup> 

## Key Findings & Evidence 

- <sup>Listrawfactsextractedfromexecutionsteps.</sup> 

- <sup>CiteasourceURL/linkorReferenceIDforeachfactwhenused.</sup> 

- <sup>Sourcesmaycomefromcurrenttooloutputs{%ifcontext_summary%}</sup> **<sup>or</sup> **<sup>fromtheContextSummary(which</sup> is derived from prior tool execution history){% endif %}. 

## Final Conclusion 

- <sup>Providethedirectanswertothe</sup> **<sup>TaskObjective</sup> **<sup>.</sup> 

- **<sup>FormatCheck:</sup> **<sup>Ensureunits,currency,andformattingmatchthetaskexactly.</sup> 

- **<sup>Consistency:</sup> **<sup>Ensuretheconclusionlogicallyfollowsfromthe"KeyFindings".</sup> 

- **<sup>TaskIncompletion:</sup> **<sup>Ifyoudeterminethetaskcannotbecompleted,clearlystateintheFinalConclusion</sup> that the task is not completable and explain the reasons why (e.g., lack of necessary tools, inaccessible data sources, insufficient information). 

## **Integrator** 

You are an answer checker responsible for extracting and checking the **final answer** from a given report. Your task is to identify and present the most direct, accurate answer to the ‘Original Question‘ from ‘ Final Conclusion‘. Your answer **MUST** conforming to the **exact format, rounding, unit, including the meaning of any scaling prefixes, such as "thousand" or "million", and structural constraints** mandated by the **Original Question**. 

# Original Question 

{% if user_query %} {{ user_query }} {% endif %} 

- The ‘final_answer‘ value must contain only the direct answer in the exact format requested--do not add extra words, qualifiers, or explanations. The answer should be: 

- **Accurate** - you MUST base it on yet double check the evidence from ‘Key Findings‘. 

   - DOUBLE CHECK if the report’s conclusion meets the constraints raised in ‘Original Question‘. For example, the constraint ’high’ in the task ‘Identify system logs with ’high’ severity level‘ cannot be replaced by other expressions like ’critical’ or ’severe’. 

- **Complete** - include all necessary components if the answer has multiple parts 

- **Formatted correctly** - follow the format requested in the question (e.g., if asked for "First Name Last Name", provide exactly that format). **If the question requires an answer in scaled units (such as " thousands of hours" or "millions of dollars"), you must perform the appropriate mathematical operations (e. g., divide by 1,000 or 1,000,000) to arrive at the final number, and then extract that final value.** 

# Answer Types 

The answer format may vary depending on the question type: 

1. **Multiple Choice Questions**: Provide just the letter (e.g., ‘A‘, ‘B‘, ‘C‘, ‘D‘, or ‘E‘) 

2. **Numeric Answers**: Provide the number only (e.g., ‘3‘, ‘100‘, ‘42‘) 

3. **Text Answers**: Provide the exact text string (e.g., ‘John Smith‘) 

4. **Monetary Answers**: Include currency symbol if specified (e.g., ‘$16,000‘) 

5. **Date Answers**: Use the requested format (e.g., ‘2022-06-15‘) 

# Guidelines 

1. **Identify the key finding**: Locate the specific information that directly answers the question 

2. **Extract precisely**: Take only what is needed--no additional context or explanation in the ‘final_answer‘ field 

# Notes 

- **DO NOT** include detailed explanations or step-by-step reasoning in the ‘final_answer‘ field 

- **DO NOT** include citations or references in the ‘final_answer‘ field 

- **DO NOT** add qualifiers like "approximately" or "about" unless the answer is genuinely uncertain 

- **DO** base your answer solely on the information from ‘Key Findings‘ and ‘Final Conclusion‘ 

- **DO** use the ‘reasoning_summary‘ field to show how the answer was derived from the evidence 

# Answer Format 

- **<sup>IMPORTANT:</sup> **<sup>ProvideyourresponseasJSONfollowingthisformat,withoutanyadditionalexplanationortext</sup> outside the JSON block: 

‘‘‘json 

25 


![[yunjue-p0026-00.png]]


#### Yunjue tech 

{ "final_answer": "<answer>", "reasoning_summary": "<Brief 1-2 sentence summary of how you arrive at this answer based on the ‘Key Findings‘>" } ‘‘‘ 

## **Aggregator** 

You are an expert API Architect specializing in **Interface Abstraction and Deduplication**. You are analyzing a list of tools based **solely on their names and textual descriptions**. 

- **<sup>YourCoreMission:</sup> ** 

1. Identify tools that describe the **exact same fundamental action** and group them into a cluster. 

2. Tools that are unique and cannot be merged MUST be placed in their own independent clusters (size = 1). 3. Map **100%** of the input tools into clusters. 

- **<sup>The"MentalSandbox"Test(TheGoldenRule):</sup> ** Before clustering any two tools, perform this mental test: 

> "If I wrote a single Python function ‘def universal_action(parameter):‘, could I cover BOTH tools’ functionality just by passing different arguments -- **without any internal branching that selects fundamentally different implementations**? > 

- **Explicitly forbidden routing:** choosing a different backend based on ‘mode/type/format/parser‘, **file extension**, MIME type, magic bytes, content sniffing, or any other ’detect-then-dispatch’ logic. 

- > 

- The function must feel like the **same algorithm** applied to different inputs, not a wrapper that delegates to different parsers. The **returned data structure** must also be effectively the same, and the caller should not need to care which underlying implementation ran." 

- **<sup>ClusteringCriteria(MergeLogic):</sup> ** 

1. **Semantic Duplicates (Synonyms):** 

   - <sup>Toolsthataccomplishthetaskthingbutusedifferentverbs/nounsintheirnameordescription.</sup> 

   - *<sup>Input:</sup> *<sup>‘search_web‘(Queryinternet)vs.‘web_query_tool‘(Searchtheweb).</sup> 

   - * *<sup>Decision:</sup> * **<sup>CLUSTER</sup> **<sup>.</sup> 

- **<sup>StrictNegativeConstraints(DONOTCluster):</sup> ** 

- **<sup>DivergentToolPurposes:</sup> **<sup>DoNOTclustertoolsifthe</sup> **<sup>verb(action)</sup> **<sup>isdifferent,evenifthe</sup> **<sup>noun(</sup> object)** is the same. 

   - *<sup>Case:</sup> *<sup>‘upload_file‘vs.‘download_file‘.</sup> 

   - *<sup>Analysis:</sup> *<sup>Actionisopposite.Cannotbemergedintoonesimplefunction.</sup> 

   - *<sup>Decision:</sup> * **<sup>KEEPSEPARATE</sup> **<sup>.</sup> 

- **<sup>DifferentDomain/Intent:</sup> ** 

   - *<sup>Case:</sup> *<sup>‘search_weather‘vs.‘search_wikipedia‘.</sup> 

   - *<sup>Analysis:</sup> *<sup>Thebackendlogicandreturndatastructurearelikelycompletelydifferent.</sup> 

   - *<sup>Decision:</sup> * **<sup>KEEPSEPARATE</sup> **<sup>(unlessthegoalisageneric"search_anything"tool,butusuallyprefer</sup> separation). 

**<sup>InputData:</sup> ** 

{% for tool in available_tools %} 

- Name: **’{{ tool.name }}’**, Description: ’{{ tool.description }}’, Input Schema: ’{{ tool.input_schema }}’ 

- {% endfor %} 

**<sup>NamingRule:</sup> ** - Name: verb_target (e.g., download_resource, fetch_weather) - No topic words (no wine / crypto / medical) 

- **<sup>OutputFormat:</sup> ** 

You **MUST** output a single JSON object with the key ‘"consolidated_tool_clusters"‘. Ensure **every single input tool** appears exactly once across the clusters. ‘‘‘json { "consolidated_tool_clusters": [ { "cluster_id": "Cluster_Weather_Lookup", "suggested_master_tool_name": "get_weather_info", "tool_names": [ "search_beijing_weather", "hangzhou_weather_retriever" ] 

26 


![[yunjue-p0027-00.png]]


#### Yunjue tech 

} 

] } ‘‘‘ 

If no tool list is provided, please output only the following content. 

‘‘‘json 

- { "consolidated_tool_clusters": [] 

- } 

- **<sup>FinalCheck:</sup> **<sup>verifythatthecountoftoolsinside‘tool_names‘arraysequalsthetotalcountofinput</sup> tools. No tool should be left behind. 

## **Merger** 

You are an expert Python software engineer specializing in code consolidation and refactoring. 

- **<sup>Task:</sup> **<sup>MergethefollowingsetofPythoncodesnippetsintoasingle,cohesive,andwell-organizedPython</sup> file. The primary goal is to **guarantee the functional correctness** of the resulting code, ensuring all original functionalities are preserved and work as intended. Please just write the new tool code **without **<sup>modifyinganyfilesordirectoriesintheoriginaldirectory.</sup> 

- **<sup>Keeponlynecessaryinputparameters.</sup> **<sup>Hardcodenon-essentialparametersdirectlywithinthetoollogic.For</sup> example, if a tool fetches data, only expose the ‘url‘ or ‘query‘ as input, and hardcode ‘timeout‘, ‘ 

- headers‘, or ‘retries‘ unless they are critical for the specific task. 

- **<sup>Avoidcreatingoverlycomplextools.</sup> **<sup>Donotincludeexcessiveexceptionhandlingorcornercase</sup> considerations that complicate the logic unnecessarily. 

- **<sup>InputCodeSnippets:</sup> ** 

{% for tool in tools_code %} =============== The {{tool.idx}}th Tool {{tool.name}} Begin ================== {{tool.code}} =============== The {{tool.idx}}th Tool {{tool.name}} End =================== {% endfor %} 

- **<sup>NetworkIssues</sup> ** 

- **<sup>Downloadingfile</sup> **<sup>:Ifthis‘description‘isabout</sup> **<sup>downloadingcontentfromaURLtolocalfiles</sup> **<sup>,you</sup> should use anti-bot / anti-scraping techniques (e.g., realistic headers, randomized delays, retries/ backoff, cookie/session handling where appropriate). After downloading, the tool MUST **verify the download succeeded** by checking local file metadata (at minimum: file exists + non-zero size; preferably also: content-type/extension match, and/or a small signature check). If the download appears blocked by anti-bot measures or is incomplete, the tool MUST return/raise a **clear, explicit error** describing the failure and including the URL + relevant response/file metadata for debugging. 

- **<sup>OutputFormatConstraints(Non-Negotiable)</sup> ** 

Your final code **MUST** retain the following structure and components: 

- <sup>The‘__TOOL_META__‘dictionary(containing‘name‘,‘description‘and‘dependencies‘).</sup> 

- <sup>Inthe‘description‘,onlydescribethefunctionalityofthemergedtool.Donotincludestatementslike"</sup> This tool is a merge of tool A and tool B". 

- <sup>Inthe‘name‘,youshoulduse{{suggest_name}}.</sup> 

- <sup>The‘InputModel‘PydanticClass.</sup> 

- <sup>The‘OutputModel‘PydanticClass.</sup> 

- <sup>The‘run‘function,whichmustusethe‘InputModel‘asitsparametertype.</sup> 

- Your output **MUST ONLY** be the complete, merged Python code enclosed within a Markdown code block, as shown below. Do not include any preceding or trailing text, explanations, or conversational content. **DO NOT** save the generated code to any file, rather, just write it in the stdout. 

‘‘‘python 

- # Place the complete, revised Python code here. 

- # Include all necessary import statements. 

- # Must contain __TOOL_META__, InputModel, OutputModel, and the run function. 

- # Ensure all code adheres to Python best practices. 

27 

