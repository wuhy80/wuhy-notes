---
tags:
  - 大模型/行业报告
  - 大模型/论文
created: 2026-10-26
updated: 2026-10-26
source: https://metr.org
type: 报告全文提取
status: 已完成
---

# METR：Task-Completion Time Horizons of Frontier AI Models 全文提取

> [!info] 全文提取说明
> - **原 PDF**：`附件/大模型/行业报告/2026重点AI报告/Task-Completion Time Horizons of Frontier AI Models.pdf`（本笔记由其全文自动提取生成，作为移除原 PDF 后的存档）
> - **提取方式**：PyMuPDF (pymupdf4llm)，共 45 页；自动转换对复杂表格与矢量图表的还原可能有失真，关键图表以嵌入 PNG 为准
> - **公开来源**：https://metr.org
> - **配图存档**：`附件/报告全文图片/metr26/`，共 31 张

# **Measuring AI Ability to Complete Long Software Tasks** 

**Thomas Kwa**<sup>_∗†_</sup> **, Ben West**<sup>_∗_</sup> **, Joel Becker, Amy Deng, Katharyn Garcia, Max Hasin** , **Sami Jawhar** , **Megan Kinniment** , **Nate Rush** , **Sydney Von Arx** 

**Ryan Bloom** , **Thomas Broadley** , **Haoxing Du** , **Brian Goodrich** , **Nikola Jurkovic** , **Luke Harold Miles**<sup>_‡_</sup> , **Seraphina Nix** , **Tao Lin** , **Chris Painter** , **Neev Parikh** , **David Rein** , **Lucas Jun Koba Sato** , **Hjalmar Wijk** , **Daniel M. Ziegler**<sup>_§_</sup> 

**Elizabeth Barnes** , **Lawrence Chan** 

```
ModelEvaluation&ThreatResearch(METR)
```

## **Abstract** 

Despite rapid progress on AI benchmarks, the real-world meaning of benchmark performance remains unclear. To quantify the capabilities of AI systems in terms of human capabilities, we propose a new metric: _50%-task-completion time horizon_ , the time humans typically take to complete tasks that AI models can complete with 50% success rate. We first timed humans with relevant domain expertise on a combination of RE-Bench, HCAST, and 66 novel shorter tasks. On these tasks, current frontier AI models such as o3 have a 50% time horizon of around 110 minutes. Furthermore, frontier AI time horizon has doubled approximately every seven months since 2019, though the trend may have accelerated since 2024. The increase in AI models’ time horizons seems to be primarily driven by greater reliability, ability to adapt to mistakes, logical reasoning, and capacity for tool use. We discuss the limitations of our results—including their degree of external validity—and the implications of increased autonomy for dangerous capabilities. If these results generalize to real-world software tasks, extrapolation of this trend predicts that within 5 years, AI systems will be capable of automating many software tasks that currently take humans a month. 

## **1 Introduction** 

In the last five years, frontier AI systems have undergone a dramatic transformation in capabilities, evolving from basic text generation [1] to autonomously executing complex multi-hour machine learning research projects [2]. Sufficiently capable AIs could perform dangerous, highly complex actions like autonomous development of chemical, biological, radiological or nuclear weapons (CBRN) and self-replication and adaptation outside human control [3]. Understanding AI capabilities helps inform the development of safety guardrails as systems become increasingly powerful. In particular, many frontier AI developers have committed to using measures of specific AI capabilities to determine the necessary risk mitigations for their frontier AI systems. Robust benchmarks that can accurately track and forecast AI capabilities thus form the foundation for responsible AI governance and risk mitigation. 

> _∗_ Equal contribution. 

> _†_ Corresponding author, `thomas.kwa@metr.org` . 

> _‡_ Ohm Chip. Work done at METR. 

> _§_ Anthropic. Work done at METR. 

Preprint. Under review. 


![[metr26-p0002-00.png]]


Figure 1: The length of tasks (measured by how long they take human professionals) that generalist autonomous frontier model agents can complete with 50% reliability has been doubling approximately every 7 months for the last 6 years (Section 3). The shaded region represents 95% CI calculated by hierarchical bootstrap over task families, tasks, and task attempts. Even if the absolute measurements are off by a factor of 10, the trend predicts that in under a decade we will see AI agents that can independently complete a large fraction of software tasks that currently take humans days or weeks (Section 5). 

However, existing benchmarks face several key limitations. First, they often consist of artificial rather than economically valuable tasks. Second, benchmarks are often adversarially selected for tasks that current models struggle with compared to humans,<sup>1</sup> biasing the comparison to human performance. Most critically, individual benchmarks saturate increasingly quickly [6], and we lack a more general, intuitive, and quantitative way to compare between different benchmarks,<sup>2</sup> which prevents meaningful comparison between models of vastly different capabilities (e.g., GPT-2 versus Claude 3.7 ). As a consequence, while the last few years have seen dramatic increases in AI performance on many individual benchmarks, understanding the progress of AI capabilities in general has required estimating the _qualitative difficulty_ of the latest benchmarks AI systems can pass. 

We propose tracking AI progress over time using the **task completion time horizon** : the duration of tasks that models can complete at a certain success probability, providing an intuitive measure of real-world capability compared to humans. As models may not reliably complete _all_ tasks of a given length, we operationalize this by measuring the **X%-(task completion) time horizon** –the length of tasks that models can complete approximately X% of the time. 

We prototype this methodology using three datasets designed to capture skills required for research or software engineering (Section 2.1), totaling 170 tasks with a wide range of difficulty: HCAST [8], RE-Bench [2], and Software Atomic Actions (SWAA), a new suite of shorter software tasks that can measure pre-2023 models (Appendix B.1.3). Using skilled human baseliners, we estimate the duration that a domain knowledgeable human (without task-specific context) takes to complete these tasks (Section 2.2). We evaluate the performance of 12 frontier models from 2019 to 2025 on these tasks (Section 2.3). Using methodology inspired by human psychometric studies, we then estimate the duration of tasks that models can complete with 50% success rate—the 50% time horizon (Section 3.1). 

We find that the 50% time horizon has been growing exponentially from 2019–2025 on these tasks, with a doubling time of approximately seven months (Figure 1). We compare our main result with our exploratory results on non-SWAA tasks, finding that the 2023–2025 horizon growth rate is about 20% faster than the 2019–2025 rate (Section F.1). We also measure the 80% time horizon of models 

1For example, HellaSwag [4] and Humanity’s Last Exam [5] were both generated by adversarially filtering problems against the best performing language models available at the time. 

> 2SWE-bench Verified [7] does come with human-estimated task completion times. We use SWE-bench Verified tasks and accompanying time estimates to validate our main result in Section 4.1. 

2 


![[metr26-p0003-00.png]]


Figure 2: Our methodology for measuring AI agent time horizon. First, we create a diverse task suite of 170 tasks. Second, we have both humans and AI agents (consisting of an AI model and a scaffold) attempt these tasks, recording the time taken by successful humans and the success rate for AI agents. Third, we fit a logistic model to find the time horizon at which each AI agent has a 50% chance of success, and plot this against the release date of the model. 

(Figure 17) and find a similar trend, though horizons are roughly 5x shorter. This progress appears to be driven by several key factors: improved logical reasoning, better tool use, and greater reliability and self-awareness in task execution (Section 3.3). We also note several limitations of current systems—notably, performance is much lower on less structured, “messier” tasks (Section F.2). 

Since our tasks do not perfectly represent the average segment of intellectual labor by researchers and software engineers, this raises the question of external validity (Section 4): whether the exponential trend holds on real-world tasks. We include three supplementary external validity experiments, which find little evidence of performance trends being slower on the somewhat more realistic tasks we tested, but do not rule out the possibility that trends are meaningfully slower on the distribution of tasks required to automate software engineer jobs. We also find evidence that AI agent time horizons can differ by a large factor depending on the task domain and reference human population. 

We conclude by discussing implications for AI capabilities forecasting (Section 5). Naively extrapolating the trend in horizon length implies that AI will reach a time horizon of _>_ 1 month (167 work hours) between mid-2028 and mid-2031 (Figure 6). However, extrapolation is affected by both external validity concerns and future changes in the trend. 

### **1.1 Related Work** 

Here, we briefly discuss related work. See Appendix A for an expanded discussion. 

**Agentic AI capability benchmarks** Many recent benchmarks aim to measure the capability of AI systems to act as agents in general, including AgentBench [9], ToolBench [10], GAIA [11], TheAgentCompany [12], the Berkeley Function Calling Leaderboard [13]. In this work, we study AI agent performance on RE-Bench[2], HCAST [8], and SWE-Bench Verified [7], which focus on machine learning and software engineering tasks. Other similar benchmarks include MLAgentBench [14], MLEBench [15], and DSBench [16]. In concurrent work, Miserendino et al. [17] create the SWE-Lancer benchmark, consisting of 1400 freelance software engineering tasks gathered from Upwork with real-world payouts totalling above $1 million. 

**AI capability forecasting** This work builds on previous efforts to forecast the capabilities of AI systems over time, including efforts to contextualize benchmark performance using human experts Phuong et al. [3]; Murray et al. [18] and efforts to forecast performance on particular benchmarks Owen [19]; Pimpale et al. [20]. Contextualizing AI capabilities using human time horizon was proposed by Ngo [21], and similar concepts were discussed in Carlsmith [22] and Cotra [23]. 

3 

|**Family**|**Length**|**Description**|
|---|---|---|
|find<br>~~s~~hell<br>~~s~~cript|3 seconds|Multiple choice: “Which file is a shell script?” Choices:<br>“run.sh”,“run.txt”,“run.py”,“run.md”|
|wikipedia<br>~~r~~esearch|1 minute|Research simple factual information from Wikipedia and pro-<br>vide accurate answers to straightforwardquestions.|
|oxdna<br>~~s~~imple|9 minutes|Detect and fix a bug in the input files for a molecular dynam-<br>ics simulation usingthe oxDNApackage.|
|munge<br>~~d~~ata|56 minutes|Write a Python script to transform JSON data from one for-<br>mat to another by inferring the conversion rules from pro-<br>vided example files.|
|cuda<br>~~b~~acktesting|8 hours|Speed up a Python backtesting tool for trade executions by<br>implementing custom CUDA kernels while preserving all<br>functionality,aimingfor a 30xperformance improvement.|



Table 1: Example tasks for different durations; see Rein et al. [8] and Wijk et al. [2] for more examples. 

**Human psychometric methods** Our methodology draws inspiration from human psychometric testing, especially Item Response Theory [24; 25; 26]. 

## **2 Measuring AI agent performance on realistic tasks** 

### **2.1 Task suite / dataset** 

Our tasks comprise three distinct task suites: 

1. A subset of HCAST [8]: 97 diverse software tasks ranging from 1 minute to 30 hours.<sup>3</sup> 

2. RE-Bench [2]: 7 difficult ML research engineering tasks, all eight hours long. 

3. Software atomic actions (SWAA): 66 single-step tasks representing short segments of work by software developers, ranging from 1 second to 30 seconds. 

All tasks are automatically scored with a continuous score or binary threshold; details of how we normalize and process scores are given in Section 3.1, and other task suite details in Appendix B. 

**Example tasks** See Table 1 for five example tasks. Tasks under 1 minute measure knowledge relevant to professional software engineering. At 10 minutes, tasks can include the easiest meaningful step of a real software project (e.g. configuring a common open-source package). The shortest tasks that could be standalone economically relevant projects take around one hour; by eight hours tasks represent valuable software projects. Many more examples of these tasks are available in Wijk et al. [2] and Rein et al. [8]. 

### **2.2 Baselining** 

In order to ground AI agent performance, we also measure the performance of multiple human “baseliners” on most tasks and recorded the duration of their attempts. In total, we use over 800 baselines totaling 2,529 hours, of which 558 baselines (286 successful) come from HCAST and REBench, and 249 (236 successful) from the shorter SWAA tasks. 148 of the 169 tasks have human baselines, but we rely on researcher estimates for 21 tasks in HCAST. 

Our baseliners are skilled professionals in software engineering, machine learning, and cybersecurity, with the majority having attended world top-100 universities. They have an average of about 5 years of relevant experience, with software engineering baseliners having more experience than ML or cybersecurity baseliners. For more details about baselines, see Appendix C.1. 

3Our results also include one task from GAIA [11], and five tasks involving writing code that is robust to an adversary. 

4 


![[metr26-p0005-00.png]]



![[metr26-p0005-01.png]]


Figure 3: Left: Average task success rate across the entire combined suite, for each model. As with all of the results reported in the main body of this work, to reduce the influence of large task families, we weight each task by the inverse square root of the number of tasks in the family it belongs to. Right: Model success rates are negatively correlated with how much time it takes a human to complete the task. ( _y_ = _−_ 0 _._ 07 _x_ + 0 _._ 66, _R_<sup>2</sup> : 0 _._ 83) 

### **2.3 Results** 

We measure 12 frontier (and 4 near-frontier) models released between 2019 and 2025; full information on the models and scaffolds used can be found in Appendix C.3. We perform 8 runs<sup>4</sup> per agent/task pair and report the average results in Figure 3. There is a strong upwards trend over time, with recent models completing approximately 50% of all tasks, while earlier models perform substantially worse. We find substantial correlation between the tasks that models can complete (Figure 22), with average correlation of approximately 0.73. 

There is a negative correlation between the time it takes a human baseliner to complete a task and the average success rate (across all models) on the task. This decrease in success rate over length (Figure 3) is well-fit by an exponential model ( _R_<sup>2</sup> _≈_ 0 _._ 80 when regressing model success rate against the logarithm of human time-to-complete). As expected, more recent models can complete longer tasks, with Claude 3.7 Sonnet and o3 completing some tasks that take human baseliners _>_ 4 hours (Figure 4). 

## **3 Time horizon** 

### **3.1 Computing time horizon** 

To convert agent run data to task completion time horizon, we first convert the agent performance on each task to a binary value (success or failure). Many tasks are naturally binary, including all SWAA tasks. Continuously scored tasks are binarized via a task-specific threshold chosen to represent human performance. For HCAST, the task-specific threshold is the same “target score” the human baseliner tries to achieve, which we also use to filter for successful runs. RE-Bench tasks have a fixed time rating of 8 hours, so the task-specific threshold is the average score of 7-9–hour human runs. 

Once we have agent success rates and time ratings for each task, we fit time horizons by performing the following logistic regression:<sup>5</sup> 

_p_ success(agent _,_ task) = _σ_ ((log _h_ agent _−_ log _t_ task) _· β_ agent) 

> 4This number is approximate, because a small number of runs failed due to internal infrastructure issues. 

> 5Compare to Item Response Theory (IRT) [24]. Like in IRT, we use logistic regression to find the task difficulty at which the agent has a 50% chance of success, but unlike IRT, we use difficulty ratings directly based on human baseline time rather than ratings learned from agent performance. Further details and comparison to standard IRT methods are provided in Appendix C.4. 

5 


![[metr26-p0006-00.jpg]]


Figure 4: Success rates of all models on the test suite, showing the computation of time horizon as predicted 50% success rate time. The logistic fit is fairly good, though there is a jump in success rate between _<_ 1 minute SWAA tasks and _>_ 1 minute HCAST tasks. 

where _t_ task is the geometric mean time of successful human baselines, and _h_ agent and _β_ agent are learned parameters, with _h_ agent representing the 50% time horizon. 

### **3.2 Time horizon vs. release date** 

In Figure 1, we plot the time horizons of each model against their release date—the date at which the lab first publicly announced the frontier model.<sup>6</sup> In addition, we linearly regress<sup>7</sup> log(time horizon) against release date, finding that time horizon has doubled every 207 days with a 95% bootstrapped confidence interval 166-240 days (roughly _±_ 19%). Error bars are calculated via 10,000 samples from a three-level hierarchical bootstrap over task families, then tasks, then runs. 

While there are wide error bars on each individual models’ horizon lengths, these errors are highly correlated between models. This is because tasks at the same human time rating vary widely in difficulty for models, and sampling easy (or hard) tasks will result in a higher (or lower) horizon estimate for all models. Therefore, we are more confident in the slope of the time horizon trend than in the time horizon of any particular model. The fit is not sensitive to various hyperparameters such as regularization, weighting of tasks, and WLS vs. OLS (see Figure 6). 

Horizon length increases substantially over the entire time period from 2019 to early 2025. GPT-2 has a 50% time horizon of only 2 seconds, while o3 has a 110-minute time horizon and succeeds at several tasks over 4 hours. Also, o3 lies above the long-run trend (p = 0.006); this is robust to methodological ablations like using continuous scoring (Appendix H), which may imply the trend in 2024 and early 2025 is faster. 

> 6In most cases, the release date is for each frontier AI model is the same model as the one we evaluated. However, GPT-3 (davinci) and GPT-3.5 (code-davinci-002 and text-davinci-002) are closed-source and no longer available through API access, but we use their release dates for the closest available models, which OpenAI advertises as having equivalent performance: GPT-3’s release date for davinci-002, and GPT-3.5’s date for gpt3.5-turbo-instruct. 

> 7Specifically, we perform Ordinary Least Squares regression on log(model ~~h~~ orizon) = _α_ + _β ·_ release ~~d~~ ate. In Appendix H we discuss other curve-fitting methods, and conclude that the fit is not sensitive to various hyperparameters such as regularization, weighting of tasks, or WLS vs. OLS. 

6 

|Table 2:<br>Categorization of 31 failed|_Failure type_|GPT-4 1106|o1|
|---|---|---|---|
|runs by GPT-4 1106 and 32 failed runs|Poor planning/tool choice|4|6|
|by o1 (Section3.3). Note that as o1 suc-|Incorrect mental math/reasoning<br>|6<br>|7<br>|
|ceeds at more tasks, its failures corre-|Premature task abandonment<br>|8<br>|16<br>|
|spond to more challenging tasks com-<br>pared to GPT-4’s failures.|Repeating failed actions<br>Other|12<br>1|2<br>1|
||Total|31|32|



### **3.2.1 Time horizons at 50% success rate vs 80% success rate** 

To check whether our choice of 50% success rate affects the long-run trend, we also compute the time horizon at which AI agents succeed at tasks with 80% success rate, shown in Figure 17. The doubling time in 80% time horizon (204 days) is similar to the doubling time of 50% time horizon (207 days), within margin of error. However, models’ 80% time horizons are 4-6x shorter, suggesting that even models that sometimes succeed on difficult and diverse tasks cannot reliably perform tasks of moderate length. Due to the limited dataset, we cannot confidently measure time horizons at very high success rates (e.g. 95%)– see Section E.3. 

### **3.3 Qualitative analysis** 

By examining transcripts from 31 randomly sampled unsuccessful GPT-4 1106 agent runs and 32 o1 runs, we observe that models seem to have improved greatly in terms of tool use capabilities, demonstrate a markedly greater ability to adapt to mistakes (as opposed to repeating unsuccessful actions), and perform much better at parts of tasks requiring logical reasoning or code generation. However, we noticed that AI agents still seem to struggle in intuitively “messier” environments— specifically, environments without clear feedback loops, or where the agent needs to proactively seek out relevant information. 

Table 3.3 shows the categorized failures by model. We provide definitions of these categories, as well as examples of qualitative improvements and continuing limitations in Appendix D. 

## **4 External validity and robustness** 

We check whether the 2023–2025 trend without the SWAA dataset retrodicts the trend since 2019, and find that the trends agree. We also perform three experiments to check external validity. 

First, we replicate our methods on SWE-bench Verified. We find that the exponential trend still holds (Figure 4.1), albeit with an even shorter doubling time, possibly because SWE-bench Verified difficulty annotations, meant to represent high-context maintainer time, may differentially underestimate how long human contractors take to perform easier SWE-bench tasks. 

Second, we score the HCAST and RE-Bench tasks against a list of 16 “messiness” factors that aim to capture some systematic differences between the tasks studied here and hard“real-world” tasks. Some examples include whether the task is resource limited, novel, or involves a dynamic environment (Section H.6). Controlling for task length, we find models perform worse on tasks that have higher messiness scores. Notably, _trends_ in AI agent performance over time are similar for the lower and higher messiness subsets of these tasks (see Figure 12). In particular, we find no evidence of plateaus in performance trends specific to the higher messiness subset. 

Third, we measure AI agent performance on a small, uncontaminated set of our internal pull requests (PRs) (Section C.2). We find large differences in the speed at which different human groups complete the internal PR tasks, with contractors taking 5-18x longer to fix issues than repo maintainers. We also find that AI agent performance is worse than would be predicted by maintainer time-to-complete as a measure of task length, but is consistent with contractor time-to-complete, 

SWE-bench Verified information is provided below. Details of the retrodiction and messiness analysis can be found in Appendix F, and details of the internal PRs experiment in C.2. 

7 

Figure 5: 

Performance of frontier AI models using reported SWE-bench Verified results (Section 4.1). We observe a similar exponential trend to Figure 1, albeit with a steeper slope. 


![[metr26-p0008-02.png]]


### **4.1 SWE-bench Verified** 

To check whether we observe similar performance trends on other benchmarks, we apply our methodology to SWE-bench Verified, an industry standard benchmark for evaluating language model performance on software engineering tasks [27]. All tasks in the SWE-bench Verified dataset were harvested from large open source repositories, like matplotlib or django, and then filtered to ensure they are automatically checkable and well-specified [28]. 

Model time horizon computed from SWE-bench Verified tasks seem to follow an exponential trend from late 2023 through 2024. However, while the doubling time predicted by HCAST + SWAA + RE-bench using 2024 models is 143 days, the doubling time on SWE-bench Verified results is shorter—around 70 days. 

SWE-bench Verified time annotations were based on the expected time it would take an “engineer who has had a few hours to familiarize themselves with the codebase” to solve the issue [28]. We found that annotator time estimates differentially underestimate how long our contract baseliners take to complete the easiest SWE-bench verified tasks. As a result, our time horizon estimates for SWE-bench Verified (which use annotator times) are likely to underestimate the time horizon of less capable models relative to contractor times, in turn shortening doubling times. For more details see Appendix H.5. 

## **5 Extrapolation** 

**Extrapolating towards one-month-horizon AI** To forecast when AI systems may be capable of autonomously producing large economic value and potential catastrophic actions, we chose one month (approximately 167 working hours for a fair comparison with humans, since humans cannot work 24/7) for two reasons. First, Ngo [21] writes that a 1-month AGI (defined as an AI that outperforms most knowledgeable humans who are given 1 month of work hours, i.e. 167 hours, to perform the task) would necessarily exceed human performance at economically valuable endeavors like writing large software applications, founding startups, and making novel scientific discoveries.<sup>8</sup> Second, one month is around the period when new hires at a company begin to complete onboarding and generate economic value,<sup>9</sup> and so an AI with a horizon of 1 month could be capable of acquiring context like a human employee, allowing it to complete high-context as well as low-context tasks. We cannot rule out that a system capable of 1-month tasks, even at 50% reliability, could be transformative for our society, potentially including the ability for catastrophic harm. 

**Sensitivity analysis** Figure 6 shows a sensitivity analysis of our results over various sources of noise. “Bootstrap (tasks)”, “Bootstrap (runs)” and “Bootstrap (models)” represents the limited number of tasks, run-to-run variance, and limited models respectively. “Weighting/regularization” repre- 

> 8Note that our forecasts concern AI with a 1-month horizon on software tasks, not 1-month AGI, because we evaluate models only on software and research tasks. Nevertheless, given past correlations in different areas of AI performance, 1-month (167 hours) time horizon AI may be significantly generally capable. 

> 9Onboarding “can last from a few weeks to more than a year” [29], and employees often start generating economic value midway through the onboarding process. 

8 


![[metr26-p0009-00.png]]


Figure 6: A sensitivity analysis of the extrapolated date at which frontier AI systems will have a horizon of 1 month. In each row, we apply 10,000 random perturbations to our data and find the distribution over the date of 1-month AI implied by the perturbed data. Box endpoints represent the 25th and 75th percentiles, and whiskers the 10th and 90th percentiles, with outliers not displayed. Note that this plot does not account for future changes in the trend or external validity concerns, which are responsible for the majority of our uncertainty. 

sents methodological choices; this perturbation includes 10 hyperparameter combinations with and without task diversity weighting, and with a logistic regression regularization parameter between 0.01 and 0.2. “IID Baseline Noise” multiplies every task duration by a random factor based on the empirical distribution of baseline times. Note our confidence in the 2024–2025 only trend is low because there are only seven frontier models in this time span. 

Because our analysis puts low probability on the growth rate of time horizon on our tasks being much slower than one doubling every 8 months, the uncertainty in the extrapolated date of 1-month AI is fairly small (80% CI width about 2 years, central estimate mid-2029). If future progress instead follows the 2024–2025 trend, 1-month AI would arrive sooner, with half the probability in 2027 and even late 2026. 

It is possible that systematic biases and alternate methodologies have a greater impact on forecasts, and we discuss these in Appendix H. In addition, due to the inherent difficulty of predicting the future, real forecasts will have larger error than this naive extrapolation, which we discuss below. 

**Task distribution limitations** We note several differences between this task suite and realistic tasks in Appendix B.2: in short, realistic tasks rarely have automatic scoring, and often require dealing with other agents, resource constraints, dynamic environments, and high reliability requirements. Such differences cast doubt on whether the rapid performance improvements seen on this task suite (and other benchmarks) will generalize. It may be that benchmarks like HCAST and SWEBench Verified are insufficient for forecasting real-world AI capabilities, and accurate forecasting will require deliberate construction of more realistic benchmarks without these limitations. 

**Future changes in time horizon trends** The time horizon trend may significantly change in the future due to factors including agency training, compute scaling, and automation of AI research and development. Agency training and eventual automation of AI R&D are more likely to speed up the trend, whereas compute scaling could slow it (but be partially offset by algorithmic improvements); a future artificial general intelligence (AGI) could technically have an infinite time horizon. See Appendix E for details. 

9 

## **6 Discussion** 

**Summary** In this paper, we proposed an intuitive, quantitative metric for AI capabilities: the task completion time horizon, which relates AI performance on tasks to the typical length of time human experts require to complete the tasks. We constructed a dataset of 66 shorter SWAA tasks, combined these with existing benchmarks, and conducted baselines to estimate their difficulty. To measure the trend in time horizon, we benchmarked 11 frontier AI models released between 2019 and 2025 on this dataset, and found (Section 3) that the 50% task completion time horizon on these tasks has been growing exponentially from 2019–2025 with a doubling time of approximately seven months (Figure 1). We also noted important limitations of current systems, particularly their lower performance on less structured, “messier” tasks (Appendix F.2). Finally, we attempt to extrapolate the trend on these tasks to one-month (167 hours) AI (Section 5), finding that if the trend continues and observed performance trends generalize to real-world tasks, an 80% confidence interval for the release date of AI that can complete 1-month long software tasks spans from mid-2028 to mid-2030 (Section 5)– or even as soon as early 2027 if the 2024–2025 trend continues. 

**Limitations and future work** Even though we believe the exponential trend to be robust, we caution that time horizon is always measured relative to a domain, task distribution, and human baseliners’ level of skill and context, and can be difficult to measure in practice, especially for longer horizons or success rates near 100%. We discuss nuances with interpreting time horizon in Appendix E.3. Finally, in Appendix E.4, we discuss ways of extending or improving our results, such as by studying multiple domains, more models, better elicitation, inference scaling, or other statistical methods. 

## **Acknowledgments and Disclosure of Funding** 

The authors thank the following reviewers for feedback on draft versions of this paper. Ryan Greenblatt, Aaron Scher, Romeo Dean, Mike Knoop, Jeff Wu, Steve Newman, Rohit Krishnan, Taren Stinebrickner-Kauffman, JS Denain, Jacob Pfau, Seb Krier, Anton Troynikov, Max Henderson, Ajeya Cotra, Max Nadeau, Tamay Besiroglu, Nate Thomas. The authors thank Charles Foster and Michael Chen for their support with the publication. 

We especially thank the following reviewers for substantial feedback: Sara Fish, David Duvenaud, Eli Lifland, Holden Karnofsky, and Rif A. Saurous. We also thank Stephanie He for her graphic design work on Figure 2, and Ryan Greenblatt for input on the scoring methodology. 

10 

## **References** 

- [1] Alec Radford, Jeffrey Wu, Rewon Child, David Luan, Dario Amodei, Ilya Sutskever, et al. Language models are unsupervised multitask learners. _OpenAI blog_ , 1(8):9, 2019. 

- [2] Hjalmar Wijk, Tao Lin, Joel Becker, Sami Jawhar, Neev Parikh, Thomas Broadley, Lawrence Chan, Michael Chen, Josh Clymer, Jai Dhyani, et al. RE-Bench: Evaluating frontier AI R&D capabilities of language model agents against human experts. _arXiv preprint arXiv:2411.15114_ , 2024. 

- [3] Mary Phuong, Matthew Aitchison, Elliot Catt, Sarah Cogan, Alexandre Kaskasoli, Victoria Krakovna, David Lindner, Matthew Rahtz, Yannis Assael, Sarah Hodkinson, et al. Evaluating frontier models for dangerous capabilities. _arXiv preprint arXiv:2403.13793_ , 2024. 

- [4] Rowan Zellers, Ari Holtzman, Yonatan Bisk, Ali Farhadi, and Yejin Choi. HellaSwag: Can a machine really finish your sentence? In _Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics_ , pages 4791–4800, 2019. 

- [5] Long Phan, Alice Gatti, Ziwen Han, Nathaniel Li, Josephina Hu, Hugh Zhang, Sean Shi, Michael Choi, Anish Agrawal, Arnav Chopra, et al. Humanity’s last exam. _arXiv preprint arXiv:2501.14249_ , 2025. 

- [6] Nestor Maslej, Loredana Fattorini, Raymond Perrault, Vanessa Parli, Anka Reuel, Erik Brynjolfsson, John Etchemendy, Katrina Ligett, Terah Lyons, James Manyika, Juan Carlos Niebles, Yoav Shoham, Russell Wald, and Jack Clark. Artificial intelligence index report 2024, 2024. URL `https://arxiv.org/abs/2405.19522` . 

- [7] Neil Chowdhury, James Aung, Chan Jun Shern, Oliver Jaffe, Dane Sherburn, Giulio Starace, Evan Mays, Rachel Dias, Marwan Aljubeh, Mia Glaese, Carlos E. Jimenez, John Yang, Leyton Ho, Tejal Patwardhan, Kevin Liu, and Aleksander Madry. Introducing SWE-bench verified. `https://openai.com/index/introducing-swe-bench-verified/` , 2024. Accessed: 2025-02-26. 

- [8] David Rein, Joel Becker, Amy Deng, Seraphina Nix, Chris Canal, Daniel O’Connell, Pip Arnott, Ryan Bloom, Thomas Broadley, Katharyn Garcia, Brian Goodrich, Max Hasin, Sami Jawhar, Megan Kinniment, Thomas Kwa, Aron Lajko, Nate Rush, Lucas Jun Koba Sato, Sydney Von Arx, Ben West, Lawrence Chan, and Elizabeth Barnes. HCAST: Human-Calibrated Autonomy Software Tasks. Forthcoming, 2025. 

- [9] Xiao Liu, Hao Yu, Hanchen Zhang, Yifan Xu, Xuanyu Lei, Hanyu Lai, Yu Gu, Hangliang Ding, Kaiwen Men, Kejuan Yang, Shudan Zhang, Xiang Deng, Aohan Zeng, Zhengxiao Du, Chenhui Zhang, Sheng Shen, Tianjun Zhang, Yu Su, Huan Sun, Minlie Huang, Yuxiao Dong, and Jie Tang. Agentbench: Evaluating llms as agents. _arXiv preprint arXiv:2308.03688_ , 2023. URL `https://arxiv.org/abs/2308.03688` . 

- [10] Zhicheng Guo, Sijie Cheng, Hao Wang, Shihao Liang, Yujia Qin, Peng Li, Zhiyuan Liu, Maosong Sun, and Yang Liu. StableToolBench: Towards stable large-scale benchmarking on tool learning of large language models, 2024. 

- [11] Gr´egoire Mialon, Cl´ementine Fourrier, Thomas Wolf, Yann LeCun, and Thomas Scialom. GAIA: a benchmark for general AI assistants. In _The Twelfth International Conference on Learning Representations_ , 2024. URL `https://openreview.net/forum?id= fibxvahvs3` . 

- [12] Frank F Xu, Yufan Song, Boxuan Li, Yuxuan Tang, Kritanjali Jain, Mengxue Bao, Zora Z Wang, Xuhui Zhou, Zhitong Guo, Murong Cao, et al. Theagentcompany: benchmarking llm agents on consequential real world tasks. _arXiv preprint arXiv:2412.14161_ , 2024. 

- [13] Fanjia Yan, Huanzhi Mao, Charlie Cheng-Jie Ji, Tianjun Zhang, Shishir G. Patil, Ion Stoica, and Joseph E. Gonzalez. Berkeley function calling leaderboard. `https://gorilla.cs. berkeley.edu/blogs/8_berkeley_function_calling_leaderboard.html` , 2024. 

11 

- [14] Qian Huang, Jian Vora, Percy Liang, and Jure Leskovec. MLAgentBench: evaluating language agents on machine learning experimentation. In _Proceedings of the 41st International Conference on Machine Learning_ , ICML’24. JMLR.org, 2024. 

- [15] Jun Shern Chan, Neil Chowdhury, Oliver Jaffe, James Aung, Dane Sherburn, Evan Mays, Giulio Starace, Kevin Liu, Leon Maksin, Tejal Patwardhan, Lilian Weng, and Aleksander Madry. MLE-bench: Evaluating machine learning agents on machine learning engineering, 2024. URL `https://arxiv.org/abs/2410.07095` . 

- [16] Liqiang Jing, Zhehui Huang, Xiaoyang Wang, Wenlin Yao, Wenhao Yu, Kaixin Ma, Hongming Zhang, Xinya Du, and Dong Yu. DSBench: How far are data science agents to becoming data science experts? _arXiv preprint arXiv:2409.07703_ , 2024. 

- [17] Samuel Miserendino, Michele Wang, Tejal Patwardhan, and Johannes Heidecke. Swe-lancer: Can frontier llms earn $1 million from real-world freelance software engineering?, 2025. URL `https://arxiv.org/abs/2502.12115` . 

- [18] Malcolm Murray, Henry Papadatos, Otter Quarks, Pierre-Franc¸ois Gimenez, and Simeon Campos. Mapping ai benchmark data to quantitative risk estimates through expert elicitation. _arXiv preprint arXiv:2503.04299_ , 2025. 

- [19] David Owen. How predictable is language model benchmark performance?, 2024. 

- [20] Govind Pimpale, Axel Højmark, J´er´emy Scheurer, and Marius Hobbhahn. Forecasting frontier language model agent capabilities, 2025. URL `https://arxiv.org/abs/2502.15850` . 

- [21] Richard Ngo. Clarifying and predicting AGI. `https://www.lesswrong.com/posts/ BoA3agdkAzL6HQtQP/clarifying-and-predicting-agi` , 2023. Accessed: 2024-03-21. 

- [22] Joseph Carlsmith. How much computational power does it take to match the human brain?, 2020. URL `https://www.openphilanthropy.org/research/ how-much-computational-power-does-it-take-to-match-the-human-brain/` . Open Philanthropy report, August 14, 2020. 

- [23] Ajeya Cotra. Draft report on ai timelines, 2020. URL `https://www.alignmentforum. org/posts/KrJfoZzpSDpnrv9va/draft-report-on-ai-timelines` . Draft report on AI timelines; technical report. 

- [24] Frank B Baker. _The basics of item response theory_ . ERIC, 2001. 

- [25] R. J. de Ayala. _Handbook of Item Response Theory: Models, Applications, and Issues_ . Guilford Press, 2017. 

- [26] Fernando Mart´ınez-Plumed, Ricardo B.C. Prudˆencio, Adolfo Mart´ınez-Us´o, and Jos´e Hern´andez-Orallo. Item response theory in ai: Analysing machine learning classifiers at the instance level. _Artificial Intelligence_ , 271:18–42, 2019. ISSN 0004-3702. doi: https://doi.org/10. 1016/j.artint.2018.09.004. URL `https://www.sciencedirect.com/science/article/ pii/S0004370219300220` . 

- [27] OpenAI. Openai o3-mini. `https://openai.com/index/openai-o3-mini` , 2025. [Accessed 18-03-2025]. 

- [28] Carlos E Jimenez, John Yang, Alexander Wettig, Shunyu Yao, Kexin Pei, Ofir Press, and Karthik R Narasimhan. SWE-bench: Can language models resolve real-world github issues? In _The Twelfth International Conference on Learning Representations_ , 2024. URL `https: //openreview.net/forum?id=VTF8yNQM66` . 

- [29] Dave Zielinski. How to optimize onboarding, June 2019. URL `https://www.shrm. org/topics-tools/news/hr-magazine/how-to-optimize-onboarding` . Accessed on March 17, 2025. 

- [30] Alex Wang, Amanpreet Singh, Julian Michael, Felix Hill, Omer Levy, and Samuel R. Bowman. GLUE: A multi-task benchmark and analysis platform for natural language understanding. In _International Conference on Learning Representations (ICLR)_ , 2018. URL `https://gluebenchmark.com/` . 

12 

- [31] Alex Wang, Yada Pruksachatkun, Naman Nangia, Amanpreet Singh, Julian Michael, and Samuel R. Bowman. SuperGLUE: A stickier benchmark for general-purpose language understanding systems. In _Advances in Neural Information Processing Systems (NeurIPS) Workshop_ , 2019. URL `https://super.gluebenchmark.com/` . 

- [32] Dan Hendrycks, Collin Burns, Steven Basart, Andy Zou, Mantas Mazeika, Dawn Song, and Jacob Steinhardt. Measuring massive multitask language understanding. _CoRR_ , abs/2009.03300, 2020. URL `https://arxiv.org/abs/2009.03300` . 

- [33] Yujia Qin, Shihao Liang, Yining Ye, Kunlun Zhu, Lan Yan, Yaxi Lu, Yankai Lin, Xin Cong, Xiangru Tang, Bill Qian, Sihan Zhao, Lauren Hong, Runchu Tian, Ruobing Xie, Jie Zhou, Mark Gerstein, Dahai Li, Zhiyuan Liu, and Maosong Sun. Toolllm: Facilitating large language models to master 16000+ real-world apis, 2023. URL `https://arxiv.org/abs/2307.16789` . 

- [34] Jonathan Roberts, Mohammad Reza Taesiri, Ansh Sharma, Akash Gupta, Samuel Roberts, Ioana Croitoru, Simion-Vlad Bogolin, Jialu Tang, Florian Langer, Vyas Raina, Vatsal Raina, Hanyi Xiong, Vishaal Udandarao, Jingyi Lu, Shiyang Chen, Sam Purkis, Tianshuo Yan, Wenye Lin, Gyungin Shin, Qiaochu Yang, Anh Totti Nguyen, David I. Atkinson, Aaditya Baranwal, Alexandru Coca, Mikah Dang, Sebastian Dziadzio, Jakob D. Kunz, Kaiqu Liang, Alexander Lo, Brian Pulfer, Steven Walton, Charig Yang, Kai Han, and Samuel Albanie. ZeroBench: An impossible visual benchmark for contemporary large multimodal models, 2025. URL `https: //arxiv.org/abs/2502.09696` . 

- [35] [Author] Srivastava et al. Beyond the imitation game: Quantifying and extrapolating the capabilities of language models. _arXiv preprint arXiv:2206.04615_ , 2022. 

- [36] Mark Chen, Jerry Tworek, Heewoo Jun, Qiming Yuan, Henrique Ponde de Oliveira Pinto, Jared Kaplan, Harri Edwards, Yuri Burda, Nicholas Joseph, Greg Brockman, et al. Evaluating large language models trained on code, 2021. URL `https://arxiv.org/abs/2107.03374` . arXiv preprint, arXiv:2107.03374. 

- [37] Jeremy Austin, Augustus Odena, et al. Program synthesis with large language models, 2021. URL `https://arxiv.org/abs/2108.07732` . arXiv preprint, arXiv:2108.07732. 

- [38] Dan Hendrycks, Steven Basart, Saurav Kadavath, Mantas Mazeika, Akul Arora, Ethan Guo, Collin Burns, Samir Puranik, Horace He, Dawn Song, et al. Measuring coding challenge competence with apps. In _Advances in Neural Information Processing Systems (NeurIPS) Datasets and Benchmarks Track_ , 2021. URL `https://arxiv.org/abs/2105.09938` . 

- [39] Dario Amodei and Danny Hernandez. Ai and compute, 2018. URL `https://openai.com/ blog/ai-and-compute/` . OpenAI blog post, May 16, 2018. 

- [40] Epoch AI. Data on notable AI models, 2024. URL `https://epoch.ai/data/ notable-ai-models` . Accessed: 2025-03-04. 

- [41] Jaime Sevilla, Lennart Heim, Anson Ho, Tamay Besiroglu, Marius Hobbhahn, and Pablo Villalobos. Compute trends across three eras of machine learning. In _2022 International Joint Conference on Neural Networks (IJCNN)_ , pages 1–8. IEEE, 2022. 

- [42] Andy K Zhang, Neil Perry, Riya Dulepet, Joey Ji, Celeste Menders, Justin W Lin, Eliot Jones, Gashon Hussein, Samantha Liu, Donovan Jasper, et al. Cybench: A framework for evaluating cybersecurity capabilities and risks of language models. _arXiv preprint arXiv:2408.08926_ , 2024. 

- [43] Hao Song and Peter Flach. Efficient and robust model benchmarks with item response theory and adaptive testing. _International Journal of Interactive Multimedia and Artificial Intelligence_ , 2021. 

- [44] Denis Paperno, Germ´an Kruszewski, Angeliki Lazaridou, Ngoc-Quan Pham, Raffaella Bernardi, Sandro Pezzelle, Marco Baroni, Gemma Boleda, and Raquel Fern´andez. The LAMBADA dataset: Word prediction requiring a broad discourse context. In _Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)_ , pages 1525–1534, 2016. 

13 

- [45] Karl Cobbe, Vineet Kosaraju, Mohammad Bavarian, Mark Chen, Heewoo Jun, Lukasz Kaiser, Matthias Plappert, Jerry Tworek, Jacob Hilton, Reiichiro Nakano, et al. Training verifiers to solve math word problems. _arXiv preprint arXiv:2110.14168_ , 2021. 

- [46] Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, and Yuan Cao. React: Synergizing reasoning and acting in language models, 2023. URL `https:// arxiv.org/abs/2210.03629` . 

- [47] Alex Kipnis, Konstantinos Voudouris, Luca M. Schulze Buschoff, and Eric Schulz. metabench – a sparse benchmark of reasoning and knowledge in large language models, 2025. URL `https://arxiv.org/abs/2407.12844` . 

- [48] Ege Erdil and Tamay Besiroglu. Algorithmic progress in computer vision, 2023. URL `https: //arxiv.org/abs/2212.05153` . 

- [49] Anson Ho, Tamay Besiroglu, Ege Erdil, David Owen, Robi Rahman, Zifan Carl Guo, David Atkinson, Neil Thompson, and Jaime Sevilla. Algorithmic progress in language models, 2024. URL `https://arxiv.org/abs/2403.05812` . 

- [50] Zhengyao Jiang, Dominik Schmidt, Dhruv Srikanth, Dixing Xu, Ian Kaplan, Deniss Jacenko, and Yuxiang Wu. AIDE: Ai-driven exploration in the space of code. _arXiv preprint arXiv:2502.13138_ , 2025. 

- [51] METR. Measuring automated kernel engineering. `https://metr.org/blog/ 2025-02-14-measuring-automated-kernel-engineering/` , 02 2025. 

- [52] David Malin Roodman. On the probability distribution of long-term changes in the growth rate of the global economy: An outside view, 2020. URL `https://api.semanticscholar. org/CorpusID:221641799` . 

14 

## **A Expanded Related work** 

Below, we expand on our discussion of related work in Section 1.1. 

### **A.1 Agent and capability benchmarks** 

The evaluation of AI capabilities has evolved significantly from single-task benchmarks to complex, multi-step evaluations designed to assess agent-like behavior. While traditional benchmarks such as GLUE [30], SuperGLUE [31], and MMLU [32] have provided valuable insights into language model performance, they primarily measure static knowledge rather than the dynamic problemsolving capabilities essential for real-world applications. Recent work has developed more complex agent benchmarks. AgentBench [9] evaluates agents across diverse environments including web browsing, coding, and game playing. MLAgentBench [14] and MLEBench [15] focus specifically on machine learning research tasks, while ToolBench [33; 10] assesses tool use capabilities. The recent ZeroBench [34] involve difficult reasoning, but in the context of visual puzzles rather than economically valuable tasks. Other noteworthy benchmarks include GAIA [11], which evaluates reasoning across multiple modalities, and BIG-bench [35], which contains hundreds of diverse tasks including many requiring multi-step reasoning. 

Software engineering has emerged as a particularly informative domain for evaluating AI capabilities. HumanEval [36] and MBPP [37] provide programming challenges of varying complexity, while more complex benchmarks like SWE-bench [28] and APPS [38] test more sophisticated programming abilities. We use SWE-bench Verified [7]’s human time estimates for task completion in our work. RE-Bench [2], which we use in this work, evaluates models on complex research engineering tasks that may require hours of human effort and compares AI performance to human machine learning engineers. SWE-Lancer [17] generates tasks 

While these benchmarks provide valuable insights into specific capabilities, they often lack a unified metric that allows for tracking progress over time and comparing models of vastly different capabilities. Our time horizon approach aims to address this gap by providing a continuous metric that can be used to measure progress across different capability levels. 

### **A.2 Forecasting AI progress** 

Quantitative forecasting of AI progress has employed various approaches, often starting with the observation that the compute used in AI training has increased dramatically over time. Amodei and Hernandez [39] observed that AI training compute usage has been increasing exponentially, doubling approximately every 3.4 months between 2012 and 2018; Epoch AI [40] included more recent data as well as trends in training dataset size and energy usage. 

Other work has studied how AI performance has increased over time, relating benchmark performance to release date, compute usage, and other inputs. Sevilla et al. [41] found that compute usage growth rate increased at the start of the “deep learning era” in 2010, coinciding with increases in performance. More recently, Owen [19] and Pimpale et al. [20] use compute and other metrics to forecast future benchmark performance. 

Several recent efforts have been made to contextualize AI benchmark performance. One such effort is the annual AI Index Report [6], which tracks performance across various benchmarks, including the date at which models achieved human-level performance. Murray et al. [18] had cybersecurity experts relate AI performance on Cybench [42] to the ability to autonomously develop malware. Phuong et al. [3] commissioned professional forecasters to predict whether AI ranks amongst top public concerns by 2030, conditioned on benchmark performance. These efforts generally lack a unified, quantitative metric for cross-benchmark comparison. 

Carlsmith [22] and Cotra [23] developed the “bio-anchors” framework, in which they related the compute involved in training AI models to the “effective horizon length” of tasks required for AI to have transformative impacts. Ngo [21] proposed using the time horizon for which AI systems outperform most human experts at most tasks to measure general AI capabilities. In our work, we empirically evaluate the relationship between task duration and AI agent success rate, which we convert into a quantitative metric of AI agent performance. 

15 

### **A.3 Psychometric methods and Item Response Theory** 

Our methodological approach draws inspiration from psychometric testing, particularly Item Response Theory (IRT) [24], which models the relationship between latent traits (such as ability) and observed responses to test items. In traditional IRT, item difficulty is a parameter in a logistic model predicting response correctness based on respondent ability. Our approach inverts this, using task completion time (a proxy for difficulty) to predict AI performance. Our methodology also relates to difficulty estimation techniques in educational testing [25], where multiple metrics including completion time are used to estimate the difficulty of tasks. IRT has been applied to machine learning classifiers by Mart´ınez-Plumed et al. [26], and was used to design efficient benchmarks in Song and Flach [43]. 

## **B Task suite details** 

As with most benchmarks, the three task suites we study were designed to isolate a specific unit of work that can be reliably accomplished within a time limit. This usually means that the tasks require much less context than the average task in the middle of a larger project.<sup>10</sup> We confirmed that all tasks were possible given the instructions provided by having humans successfully complete each task at least once.<sup>11</sup> 

### **B.1 Task subsuites** 

The HCAST and SWAA suites are divided into _task families_ , which are groups of tasks that are similar. For example, the “crossword” task family consists of tasks such as creating a 3x3 crossword puzzle, or a 5x5 crossword puzzle, etc. We segment tasks into families because performance within families is correlated and we down-weight families with many tasks for diversity. 

### **B.1.1 HCAST suite** 

We use 97 tasks from 46 task families in HCAST, a diverse set of challenges in cybersecurity, machine learning, software engineering, and general reasoning. 

Tasks in this suite range from easy tasks that take humans a couple of minutes (e.g. looking up a basic factual question on Wikipedia) to tasks that take expert humans multiple hours (e.g. writing CUDA kernels, or fixing a subtle bug in PyTorch). Because modern frontier AI systems are relatively more proficient at text-based tasks, the majority of these tasks do not require visual/multimodal capabilities, and all tasks are solvable by text editing via a bash shell. 

Compared to many recent benchmarks, tasks in HCAST are not designed to be as difficult as possible for either human domain professionals or current AI systems. Instead, most tasks are designed to be realistic, such that doing well on the task requires skills we expect to be economically useful. As a result, we expect that most of these tasks are solvable by humans with a few years of professional experience in the relevant domain. 

Tasks are defined by their instructions, starter resources, and an algorithmic scoring function. Task instructions are strings, typically between 1-2 sentences and a few paragraphs, although they can refer to other sources of information included as starter resources, or externally available via the internet. Starter resources typically consist of code, data, and documentation. 

Each task is automatically scored between 0 and 1, with higher scores indicating better performance. Many tasks only return scores of 0 or 1, but for tasks with continuous scoring, we manually define a success threshold score, which we use in some of our analysis to binarize agent scores.<sup>12</sup> 

> 10We define context as information that experienced employees use to complete a task which is _not_ explicitly in the task description or possessed by most external experts. For example, when fixing a bug in a software package, the package’s maintainer may use their experience with past bugs in the same package to guess at the bug’s cause, fluency with the codebase to find the bug, and knowledge of their organization’s priorities to decide whether to apply a quick patch or a more thorough fix. We discuss possible effects of context in Section 4. 

> 11As many of these attempts were done by in-house staff or were done using different methodology, we exclude these attempts from our human baseline numbers. 

> 12A small subset of these tasks is available on request. (We do not share the content of most tasks to reduce the likelihood of AI systems accidentally or intentionally being trained on them.) 

16 


![[metr26-p0017-00.png]]


Figure 7: Stacked histogram of tasks by difficulty rating. HCAST mainly includes tasks longer than 4 minutes, while we focused on tasks in the 2-second to 15-second range with SWAA in order to measure GPT-2 and GPT-3. There is a gap between the two which limits our ability to measure time horizons in this range. 

More details about HCAST tasks are provided in Rein et al. [8]. 

### **B.1.2 RE-Bench suite** 

RE-Bench consists of 7 challenging open-ended ML research engineering environments, each of which are intended to take a human expert approximately 8 hours to complete. See Wijk et al. [2] for more details. 

### **B.1.3 Software atomic actions (SWAA) suite** 

HCAST is designed to be a diverse set of tasks, but the shortest tasks are around 1 minute long, limiting both the representativeness and the achievable resolution in measuring AI agent performance on shorter tasks. To fill this gap, we observed that real-world intellectual labor consists in part of measurable, single-step actions shorter than 1 minute. We created the SWAA task suite, which comprises 66 small tasks corresponding to _<_ 1 minute atomic actions commonly performed in software engineering work. The SWAA subset includes both multiple-choice and completion questions. 

|**Exampl   i**|**e SWAA task (file selection)**||
|---|---|---|
|`Which`<br>|`file is most`<br>`likely to have `|`a password in it?`|
|`1. `|`credentials.txt`||
|`2. `|`installation_notes .txt`||
|`3. `|`main.py`||
|`4. `|`launcher_win.exe`||



In contrast to other simple benchmarks like LAMBADA [44] or GSM8K [45], which test skills not directly applicable to software engineering, the SWAA set represents actions that are needed in both software engineering work and the longer tasks we study. SWAA consists of 5 task families, three representing common decisions, one for code completion, and one for math; see Appendix B.1.3 for more details. 

Development of SWAA tasks was blind to AI agent performance; that is, all tasks were written before seeing AI attempts, and elicitation (development of the few-shot prompt used for evaluation) was carried out on a separate development task suite. 

SWAA consists of five task families: three representing common decisions, one for code completion, and one for math. 

### **Decisions (multiple choice)** 

17 


![[metr26-p0018-00.png]]


Figure 8: The 7 original RE-Bench tasks. 

- File selection: Which file has a certain property, or is appropriate to read in a situation? 

- Alert triage: Which team at a company should investigate an alert? 

- Request routing: Which action needs to be taken in response to some request? 

### **Fill-in-the-blank** 

- Code completion: Complete a single word of code. 

- Math: Solve simple arithmetic problems, either standalone or software engineering-themed word problems. 

When developing SWAA tasks, we attempted to avoid biasing the results by blinding task authors to model performance, so the preliminary set of 71 tasks was written without running any models on them during development. These were filtered down to the final set of 66 by excluding tasks that more than one baseliner failed. 

**RE-Bench** See Figure 8 for a description of the RE-Bench tasks.<sup>13</sup> 

### **B.2 Limitations of the task suite** 

The tasks we use to benchmark AI capabilities are systematically different from real tasks. These differences could result in the trends we observe on these tasks not generalizing to real world tasks. For instance, all SWAA, HCAST, and RE-Bench differ from real-world tasks in the following ways: 

> 13The `Restricted MLM` task involves ML engineering while prohibiting certain PyTorch methods; current models sometimes use these prohibited methods in an indirect way such that the cheating can’t be automatically detected, but model cheating does not meaningfully affect our results. 

18 

- **Automatic scoring** All tasks we use are automatically scorable, meaning a piece of code running in the task environment determines the final score. This imposes constraints on e.g. the format of solutions, that tend to reduce task open-endedness, and the need for sensible value judgments. 

- **No interaction with other agents** No tasks involve interacting with other autonomous agents. Coordinating with, or competing with, other agents seems likely to increase task difficulty. For instance, by increasing the importance of strategic decision-making, realtime coordination, and predicting the actions of other complex agents. 

- **Lax resource constraints** No SWAA tasks, and few HCAST tasks saliently involve making efficient use of a limited resource—a common constraint in real-world tasks. 

- **Unpunishing** Similarly, very few tasks are punishing of single mistakes.<sup>14</sup> This is in part to reduce the expected cost of collecting human baselines. Real world tasks can often be more punishing, for instance, when they involve competing against other agents. For instance, a single blunder in a chess game can greatly reduce the chance of winning the game. 

- **Static environments** Tasks in this suite typically use environments that do not significantly change unless directly acted upon by the agent. In contrast, real tasks often occur in the context of a changing environment. 

We attempted to measure how these systematic differences might affect AI agent performance in Section F.2, by including the above properties as “messiness” factors. We found that though the absolute performance on “messier” tasks was lower, the trends in performance were similar to less messy tasks. 

## **C Methodological details** 

### **C.1 Human baselines** 

### **C.1.1 HCAST tasks** 

We use existing baselines collected as part of HCAST. These baselines are collected from domain professionals with relevant experience in software engineering, ML, and cybersecurity. Baseliners work in the same environment as agents, using Vivaria (an open source platform for language model agent evals) with their screens and audio recorded for manual review, to prevent cheating. They are incentivized with bonuses for successful completion and for completing tasks faster than other baseliners. After screening out attempts on tasks other than our subset of HCAST, failed attempts, and those with issues (such as using disallowed AI tools), we include 286 successful baselines from approximately 460 total attempts. Task durations are calculated using the geometric mean of successful baselines, with manual estimates for tasks lacking successful baselines.<sup>15</sup> 

For further information about HCAST baselines, see Rein et al. [8]. 

### **C.1.2 RE-Bench baselines** 

For RE-Bench, we used the baselines from [2]. As baseliners were instructed to achieve the best performance for each task, we consider the task duration of each of these 6 tasks as 8 hours, and instead use the mean score achieved by baseliners who spent between 7 and 9 hours to convert raw score into success threshold. 

Baselines for RE-Bench were conducted with the same baseliner pool and incentives as with HCAST, but with a few differences. Rather than being told to achieve a threshold score, baseliners were given a fixed time limit of 8 hours and instructed to maximize their score; the threshold was set based on average baseliner performance. RE-Bench baseliners had access to AI tools, so the human scores on these tasks may be biased upwards. 

> 14With the exception of submitting an answer too early on HCAST tasks. 

> 15Non-baseline estimates were based on information including the length of QA runs that did not follow strict baseline conditions, and the length of similar tasks with successful baselines. 

19 

### **C.1.3 SWAA baselines** 

Unlike HCAST and RE-Bench, which were baselined by external contractors, SWAA is baselined by internal employees with relevant expertise using a custom webapp that enables more accurate timing. Because these tasks are intended to be a single step and exclude context acquisition, the timer for SWAA tasks ends as soon as the user chooses a response. For decision based tasks, only one selection is allowed to avoid random guessing; for fill in the blank tasks, baseliners can try multiple times until getting the answer correctly or opting to skip. We baselined each decisionbased task 4 times and each fill-in-the-blank style task 3 times. 

Unlike the HCAST and RE-Bench sets, SWAA is baselined by internal employees with relevant expertise using a custom webapp that enables more accurate timing. Because these tasks are intended to be a single step and exclude context acquisition, the timer for SWAA tasks starts after reading general instructions and ends as soon as the user chooses a response, so that baseline time only includes reading the question itself and choosing an answer. Baselines done with our usual setup have timing overhead of seconds to tens of seconds, which would be unacceptably high for single-step tasks with duration shorter than 2 seconds. 

### **C.1.4 Baseline success rate** 

We aggregate human baseline times into a task length rating by taking the geometric mean time of successful baseline runs, which is more predictive of model performance than mean time because baseline times are roughly log-normally distributed. 

We chose to filter successful runs for two main reasons - one practical and one principled. Firstly, collecting enough baselines to estimate the time-versus-success curve for each task would be practically difficult. Secondly, we wanted to exclude cases where the baseline failed for reasons that are not applicable to models. A substantial fraction of human failures appeared to fall in this category - including humans having insufficient expertise for the task, or giving up on a task for unclear reasons (possibly due to getting interrupted, or getting bored). In particular, because we were optimizing for obtaining successful baselines, our payment scheme incentivized contractors to make a quick guess or give up early, in order to move on to other tasks where their expected earnings were higher. 

However, conditioning on success biases towards shorter task length ratings, thereby underestimating model performance. This is especially the case if many of the human failures are due to problems that are also relevant for models - for example, if some of the tasks require guessing. This bias is most significant on longer tasks, which often have a baseliner success rate below 50%; therefore, we have lower confidence in the difficulty ratings of these longer tasks, and expect they may be underestimates. If this is the case, we may be underestimating the pace of model improvement. 

**Human time horizon** An alternative approach would be to calculate the human time horizon using the same methodology as we do for models. One natural interpretation of time horizon would imply that the time horizon of “a human given x hours” is x hours. Since our baseliners were paid for spending up to 8 hours per task, we would expect their time horizon to be around 8 hours. However, in practice it’s much lower, at around 1.5 hours (which would imply that the best models will surpass humans in under 7 months). As discussed above, we think this is artificially low, given that many human failures seemed to be artifacts of our incentive scheme. 

Figure 9 shows a graph of baseliner success rate by task length. 

### **C.1.5 Baseline time analysis** 

We manually watched and annotated the recordings of 50 baselines to get a sense of how our baseliners spent their time. Based on this small survey of baselines: 

1. On short (5-15 minute) tasks, a substantial fraction of the time (between 25–75%) is spent reading instructions or understanding how to submit correctly. Particularly for short tasks, our time estimates may be hard to interpret as there is some fixed overhead for reading the instructions, independent of the difficulty of actually performing the task per se. 

2. Our tasks are designed to require relatively low amounts of context but base liners still spend over 25% of their time reminding themselves of relevant information (e.g. how to do port forwarding). 

20 


![[metr26-p0021-00.png]]


Figure 9: Success rates and time horizon of human baseliners. Note that the time horizon is not directly comparable to the time horizon of ML models (see Section C.1.4) 

### **C.2 Internal PR tasks** 

**Summary** We ran GPT-4o, Claude 3.5 Sonnet (New), and o1 on five uncontaminated issues from an internal repository. Resolving these issues was real work performed by internal staff, so we might expect results on these tasks to better represent performance on real economically valuable tasks than a typical benchmark task. 

We find that our contract baseliners take 5x-18x longer to resolve issues than repository maintainers. Additionally, AI agent performance on these issues is not inconsistent with AI agent success rate curves derived from HCAST, SWAA, and RE-Bench performance if _contractor_ time-to-complete is used to measure the tasks length. However, it takes much longer for our contract baseliners to complete these tasks than repository maintainers. This suggests that time horizons may have better correspondence to the labor of a low-context human, rather than a high-context human. 

**Methodology** We collected five real, recent, uncontaminated issues from an internal repository. We then ran GPT-4o, Claude 3.5 Sonnet (New), and o1 on these issues. We recorded how long it took repository maintainers to solve these issues, and also had external baseliners attempt to fix these issues. Unlike SWE-bench Verified, we did no filtering to require these issues to be automatically verifiable. Instead, maintainers of the relevant repository scored model and baseliner solutions manually, as if they were reviewing PRs: 

1. 0 if the PR was incorrect and required a fundamental refactor. 

2. 0.25 if there were minor changes that must be made before merging. 

3. 0.75 if there were nits but the PR could still be merged. 

4. 1.0 if the PR could be merged as is. 

**Example issues** We include two example issues - one easy (Issue 1), and the other (Issue 8) more challenging. Issue 8 demonstrates how context on the codebase may provide a dramatic speedup in human time to complete between baseliners and repository maintainers. Results of these baselines can be seen in table 3. 

21 

|**Issue**|**Agent**|**Time taken**|**Score**|
|---|---|---|---|
|1|Repository Maintainer|5 minutes|1.0|
||Baseliner|81 minutes|1.0|
|8|Repository Maintainer|20 minutes|1.0|
||Baseliner|113 minutes|0.25|
|Table|3: Results of baselines on|selected intern|al PRs|



### **Issue 1** 

```
Thestageplot_logistic_individualwiththeerrormessage:
‘‘‘
FileNotFoundError :[Errno2]Nosuchfileordirectory:
’plots/ logistic_individual /invsqrt_task_weight -0.01. png ’
ERROR:failedtoreproduce’
plot_logistic_individual@invsqrt_task_weight -0.01 ’:
failedtorun:python-msrc.plot. logistic_individual--input -
filedata/wrangled/ logistic_regression_invsqrt_task_weight_0 .01
_ftr.csv
--output -fileplots/ logistic_individual /invsqrt_task_weight -0.01.
png
--plot -formatpng--log -levelINFO ,exitedwith1
‘‘‘
```

### **Issue 8** 

```
Reweightinginbootstrapping
Currentlythehierarchicalbootstrappingdoesnotreweightruns.
```

|**Task ID**|**GPT-4o**|**Claude 3.5 Sonne**|**t**<br>**o1**|
|---|---|---|---|
|Issue 1|0.35 (5)|0.45 (5)|0.875 (6)|
|Issue 8|0.0 (5)|0.0 (5)|0.0 (5)|
|Issue 9-1|0.0 (5)|0.0 (5)|0.0 (5)|
|Issue 9-2|0.0 (5)|1.0 (5)|0.85 (5)|
|Issue 10|0.0 (5)|0.0 (5)|0.0 (5)|
|Issue 11|0.02(12)|0.0(11)|0.0(8)|



Table 4: Internal PR Per-Task Average Scores (number of trials in parentheses). Note that we did minimal processing on Issue 9 to turn it into two issues, as in practice the issue description contained two entirely separate pieces of work. 

**Repo maintainer time vs. baseliner time** There was a dramatic difference in how long it took baseliners to complete issues, compared to how long it took repository maintainers to complete issues (Table C.2). In practice, repo maintainers were 5-18x faster at completing the given issues. 

|**Task ID**|**Maintainer Time(min)**|**Baseliner Time(min)**|**Slowdown**|
|---|---|---|---|
|eval-analysis-public-1|5|81 (score 1)|16x|
|eval-analysis-public-8|20|113 (score .25)|_∼_5.5x|
|eval-analysis-public-9-1|235|-|-|
|eval-analysis-public-9-2|5|69 (score 1)*|14x|
|eval-analysis-public-10|20|-|-|
|eval-analysis-public-11|5|93(score .75)|18.6x|



*Note: This was run on a slight variant 

Table 5: Comparison of time to fix issues by repo maintainers and baseliners 

22 

|**Model**|**Agent**|
|---|---|
|Claude 3.5 Sonnet (Old)|modular-public|
|Claude 3.5 Sonnet (New)|modular-public|
|Claude 3 Opus|modular-public|
|davinci-002|modular-public|
|gpt-3.5-turbo-instruct|modular-public|
|GPT-4 0314|modular-public|
|GPT-4 0125|modular-public|
|GPT-4 1106|modular-public|
|GPT-4 Turbo|modular-public|
|GPT-4o|modular-public|
|o1|triframe|
|o1-preview|duet|



Table 6: Scaffolding used for or each model in this report 

**Manual scoring methods and results** Maintainer, baseliner, and model solutions were manually scored as if they were pull requests. We experimented with both contractors scoring PRs, as well as different repository maintainers scoring PRs. In practice, repo maintainers scored results much more consistently than contractors. Contractor correlations were between 50–60%. Repo maintainer correlations were between 88–91% . 

**Time to score** For models to be cost competitive on real work, their total cost to complete a PR must be less than the cost for a repository maintainer to implement this PR themselves (plus ancilliary costs, e.g. the time of a code reviewer). As such, we kept track of the time that it took to score model solutions, to better understand the net cost of using a model to fix a real issue. Repo maintainers scored submissions much faster than contractors, although the ratio was less dramatic than time to complete—contractors took an average of 8 minutes per run, while repo maintainers took an average of 3.5 minutes per run. Different issues had different average times to score, with easier issues generally being much quicker to score, and all issues being faster to score than to complete. In the future, we plan to create an approximate cost metric that takes into account scoring effort, model cost, and model success rate. We expect that this will be a useful framing in understanding how the ratio of model / maintainer work may shift in the future, as the cost of agent usage continues to fall. 

**Contract baseliners vs repository maintainers** Model success rates were reasonably consistent with those predicted by contract baseliner times. In practice, baseliners also did much worse on easy tasks than experienced maintainers. Issue 11, for example, took a baseliner upwards of 1.5 hours to complete, and so we would not expect models to consistently complete this task. 

**Qualitative impressions** Naively comparing to per-time bucket success rates on HCAST + SWAA + RE-bench tasks, repository maintainer time-to-complete is not a good predictor of model performance on these tasks. For example, Issue 11 was the simplest task for maintainers. It requires writing simple comments across 10 Python files, and it took maintainers less than five minutes to complete. However, models did not successfully complete the task successfully once in 30 runs. There were also tasks where models did succeed, as we would expect from per-time bucket success rates on other tasks. For example, models were consistently able to add a missing folder creation step to a single stage in a data pipeline. While baseliners and models both struggle compared to repository maintainers, they struggle in different ways. Baseliners often lacked knowledge about the tools and techniques used in the codebase: e.g. “what is DVC?” or “what is bootstrapping again?”. Current AI models, on the other hand, consistently demonstrate knowledge of tools and techniques, but appear to struggle with the larger context required for working in a real codebase. 

### **C.3 How models were run** 

All models were run using agent scaffolds using the Anthropic or OpenAI APIs. 

23 

We used the same agent scaffolds across the evaluation suite, with no task-specific prompting or scaffolding, except for the SWAA tasks, which used a simple prompting scaffold. All agents were provided with the same affordances provided to human baseliners. 

GPT-2 is incompatible with our scaffolding due to low context length, so we imputed a score of zero for GPT-2 on all tasks in RE-Bench and HCAST. We think this is reasonable because the far more capable davinci-002 (GPT-3) scores zero on this set. Removing these imputed GPT-2 zero scores has a negligible effect on all subsequent results in this paper. 

### **C.3.1 Scaffold and platform details** 

Most AI models were evaluated with modular-public—a basic agent scaffold. This scaffold provides the model with Python and Bash commands and some very simple context management to keep the input within the context window length of the LM. We used a slightly different scaffold for o1-preview and o1, because they seemed to struggle with tool use, responding to environmental feedback, and generally acting as an agent. 

For both human baselines and AI agent runs, our experiments use the open-source platform Vivaria. CPU and GPU resources are provided inside the secure VMs based on the resource specifications of tasks. Table 6 displays the scaffolding used for each model. Both modular-public and triframe/duet incorporate principles from the ReAct framework [46], which interleaves reasoning traces with actions. These agents are developed on a held-out dev set of tasks, not included in HCAST, to reduce the likelihood of overfitting to these tasks. See the respective repositories for implementation details about these scaffolds. 

Both scaffolds allow agents to plan via chain-of-thought reasoning, before calling a selection of tools. The agents interact with their task environment primarily through running Python code and Bash commands. 

In Modular, the model generates a single command for execution, then the scaffold executes the function call, returning relevant information from the environment (e.g. `STDOUT/STDERR` ). This process repeats until either the model determines that the answer is ready for submission or the system reaches its predefined usage threshold. 

In Triframe, to decide on a command to execute, the model generates one suggested plan, then generates three possible commands to execute based on the plan, as well as three suggested commands that ignore the plan (to diversify the ideas it generates). Then, the model generates two scores between -2 and 2 for each of the six proposed actions, and the scaffold executes the top scoring function call averaged across the two scores. 

### **C.3.2 Compute usage** 

The total amount of compute used included about 2,000 H100-hours for RE-Bench environments and 50,000 CPU hours for other environments on a combination of cloud and internal machines, plus roughly 50,000 H100-hour equivalents of compute used internally or from API providers for inference. This includes compute used for preliminary experiments. Compute used for data analysis is minimal. 

### **C.4 Comparison to Item Response Theory** 

Item response theory (IRT) is a collection of statistical techniques used to predict the probability that a person will answer a question correctly, based on their ability level. The standard IRT twoparameter logistic (2PL) model is (simplified from Cai et al.): 

_Ti_ (1 _|ηagent_ ) = _σ_ (( _ηagent − αtask_ ) _· βtask_ ) 

Where _Ti_ (1 _|ηagent_ ) indicates the probability that a person with ability level _ηagent_ answers a task correctly. 16 IRT is usually used to regress on both the question difficulty and the ability level 

> 16In the three-parameter logistic model, a parameter _γtask_ is added representing the probability of correctly guessing the task. In the 2PL model and our method, _γtask_ = 0. This is effectively true for most tasks, but some SWAA tasks are multiple-choice with a 25% chance of guessing correctly. This choice only affects the time horizon of GPT-2 and GPT-3 and does not meaningfully affect our results. 

24 

simultaneously; in contrast, we define the question difficulty as the logarithm of human baseline time, and therefore only regress on ability level. In particular, our model is as follows. 


![[metr26-p0025-01.png]]


<!-- Start of picture text -->
Ti (1 |hagent ) =  σ ((log  hagent − log  ttask )  · βagent ) (1)<br><!-- End of picture text -->

Note the following changes from the 2PL model: 

1. _αtask_ = log _ttask_ where _ttask_ is the geometric mean of successful human baseline times. 

2. _ηagent_ can now be interpreted as log _hagent_ where _hagent_ is the 50% time horizon of the agent rather than an abstract ability parameter. This is because when _hagent_ = _ttask_ , our model predicts a success probability of _σ_ (0 _· βagent_ ) = _σ_ (0) = 0 _._ 5. 

3. _βagent_ is an agent-dependent learned parameter, rather than being task-dependent. 

To fit equation 1, we weight tasks by diversity, such that a task from a family of size _n_ gets weight 1 _/_<sup>_~~√~~_</sup> _<u>n</u>_ <u>.</u> We then use logistic regression to fit the time horizon _hagent_ and slope _βagent_ for each model. For example, following this methodology o1 has a time horizon of about 39 minutes (see Figure 4). 

These changes allow us to compute an interpretable time horizon without several complexities of IRT. First, IRT has an initial calibration/joint optimization stage in which the task difficulty is estimated from all agent scores, so the ability score of one agent may depend on other agents’ performance; in our method each agent’s time horizon is computed individually. Second, IRT outputs ”ability scores” which then need to be converted to a time horizon estimate; our method eliminates that step by estimating horizon directly. Third, the 2PL model uses one slope parameter per task, whereas we use one slope parameter per agent. In our setting with many fewer agents than tasks, this reduces the overall number of parameters. 

In exchange, we forego the ability to use IRT metrics designed for test design, such as Fisher information functions for individual tasks (used in e.g. Kipnis et al. [47]). Future improved methodologies could include these metrics to design sample-efficient benchmarks and evaluations grounded in human data. 

## **D Qualitative analysis** 

### **D.1 Failure categories** 

To better understand the differences between current and older AI agent failures, we separately sampled 31 unsuccessful agent runs from our GPT-4 1106 agent and 32 unsuccessful runs from our o1 agent, and manually labeled them for the following exclusive categories of failures: 

- **Poor planning and tool choice** : the agent generates a high level plan that seems unworkable on its own merits, or picks tools for the plan that would not accomplish the desired purpose. 

- **Incorrect mental math or reasoning** : the agent performs incorrect mental math or logical reasoning at a crucial step, causing the run to fail. 

- **Premature task abandonment** : The agent abandons the task in the middle of the attempt and either submits a nonsensical answer or submits a solution without checking for correctness. These failures often result from the agent submitting their answer before looking at all the pieces of code or information required to arrive at the correct solution. 

- **Repeating failed actions** : The agent repeats the same behavior that doesn’t make progress toward the problem, such as running a command that leads to an error over and over again, without trying other approaches. 

We report the results in Table 3.3. We find that over a third of the GPT-4 failures resulted from repeating failed actions, compared to 2 out of 32 for o1, which we see as quantitative evidence for our claim that models seem to have improved in their ability to adapt to mistakes. Half of the o1 failures resulted from abandoning the task prematurely, while only a quarter of the GPT-4 failures resulted from the same—this may result from o1 failures occurring on qualitatively more difficult tasks, or may reflect idiosyncrasies of o1. 

25 

### **D.2 Specific skills of newer models** 

To better contextualize the observed trend of improved model performance, we examined the transcripts for the tasks where earlier models (e.g. GPT-4) do substantially worse than current models. Specifically, we categorized all task families based on the type of expertise required, and noticed that current models tend to outperform earlier models for tasks that involved ML training, reverse engineering compiled software binaries, and cybersecurity CTFs. In addition, we noticed that agents improved greatly on tasks requiring situational awareness of the AI agent’s limitations or defeating an opposing strategy. This gave us five sets of task families to examine. 

For each of these task family sets, we then used contractors to manually read through all runs from all models for all tasks in each of these five task families, and identified possible explanations for the improvement in AI agent performance on those tasks, as well as potential limitations. 

We provide examples of both ways that models have improved, as well as their major limitations, as described in Section 3.3. 

### **D.2.1 What do newer models do better?** 

We start by discussing some of the ways in which current models have improved compared to pre2023 models. For some of our public tasks, we also provide links to the transcripts of the full runs. 

**Greater robustness to mistakes** Models have become increasingly robust over time, and especially seem to be able to avoid repeating failed actions. Early models typically fail to correct even trivial mistakes, instead engaging in looping behavior or introducing additional errors. However, starting with GPT-4o, models demonstrate improved ability to recover from mistakes and coursecorrect, an ability that is especially valuable in the harder variants of the pico ~~c~~ tf tasks, or other coding related tasks that require iteration. Consider examples from a task where models need to debug a small amount of Python code: 

1. In one run gpt-4-turbo-2024-04-09 introduced syntax errors related to having a misplaced backslash character in a Python file, and despite copious attempts is unable to understand or fix the issue until it gives up. 

2. Claude 3.5 Sonnet (New) first adds code at the wrong place, and then attempts several times to add the code to the correct file using the CLI tool _sed_ . However, when doing so it encounters IndentationErrors and duplicated methods. Finally it successfully pivots to writing the entire file from scratch. 

### **Agent output** 

```
Iapologizefortheconfusion.Itseemsthat
ourpreviousattemptdidn ’tfullyremovethe
old‘save ‘method.Let ’stryonemoretimeto
fixthe‘base_model.py ‘file.We ’llremove
both‘save ‘methodsandaddthecorrectone
...
```

### **Agent output** 

```
Iapologizeforthepersistentissue.It
seemsthatourpreviousattemptsdidn ’tfully
resolvetheproblem.Let ’stryonemoretime
tofixthe‘base_model.py ‘fileby
completelyrewritingthecontentofthefile:
...
```

**Tool use** Early models like davinci-002 (GPT-3) struggle with syntactically correct tool use, while later models improved with clear explanations and examples in their prompt. Current frontier models generally use the tools afforded in our scaffolding without issue. For example, we noticed that when tasks required editing Python scripts, GPT-3 struggled with formatting even when provided explicit 

26 

instructions, and GPT-4o would sometimes write scripts line-by-line using `echo` commands in bash, while o1-preview would consistently edit files efficiently. 

1. Despite the reminder in the user message about the expected format, davinci-002 fails to use the correct syntax with angle brackets. 


![[metr26-p0027-02.png]]


<!-- Start of picture text -->
User<br>No function call was included in the<br>last message. Please include a<br>function call in the next message<br>using the <[tool_name]> [args] </[<br>tool_name]> syntax.<br><!-- End of picture text -->


![[metr26-p0027-03.png]]


<!-- Start of picture text -->
Agent output<br>bash > touch test.txt<br>python > import time<br>python > time.sleep (10)<br>python > exit ()<br>submit > python main.py<br><!-- End of picture text -->

2. GPT-4o sometimes struggles to write the Python script effectively. In a run on the same task, it ineffectively writes each line of the script with a separate command. 


![[metr26-p0027-05.png]]


<!-- Start of picture text -->
Agent ouptut<br>I will write the script content directly into the<br>script file using echo commands , one line at a<br>time.<br>bash: {" command ":<br>"echo ‘def read_nth_line (file_path , n):’ >><br>update_test_txt .py"}<br>bash: {" command ":<br>"echo ‘ with open(file_path , "r") as file:’<br>>> update_test_txt .py"}<br><!-- End of picture text -->

3. o1-preview consistently edits files on this task without any issue. 

**Improved logical and programmatic problem solving** Consistent with increasing performance on coding and reasoning benchmarks, we saw models’ ability to write syntactically and semantically correct code gradually increase. This allowed models to more reliably interpret task instructions correctly and use code to find correct answers. 

1. For example, on the interpret ~~d~~ ata task, GPT-4o fails in one run due to an incorrect interpretation of the request to find “the tallest building in the world in 1972” as finding “the tallest building in the world built in 1972”, as opposed to the common sense interpretation that the task is to find the tallest building in the world in 1972. For example, it writes code like: 

### **Agent Output** 

```
tallest_building_1972=data[data[’
completion_year ’]==1972][ ’ height_m ’]. max()
tallest_building_1972
```

2. In contrast, o1-preview correctly interprets the request as finding the tallest building in the world built in or before 1972. 

27 

### **D.2.2 What do they still do poorly?** 

Despite improvements, even current frontier models still struggle in substantial ways. In general, our observerations indicate that agents tend to do worse on tasks that are qualitatively “messier”. We investigate this claim further in Section F.2. 

**AI agents struggle without clear feedback** Without clear feedback or cheap ways of verification, such as unit tests or answer checking scripts, all models we tested often have difficulty understanding whether their solution is correct. For example, two of the tasks hardest for models in their respective time buckets are ‘blackbox’ and ‘symbolic regression’. Both of these tasks involve guessing a hidden function under the constraint that probing for information is costly. 

**AI agents often fail to proactively seek out relevant information** We also observe that all models still exhibit deficiencies in understanding their own limitations or proactively seeking out helpful information; instead, models tend to assume that they already know how to complete the tasks and then only reevaluate after they fail to do so. 

For example, in a task about experimenting with an API interface the agents are informed that they can read more about the API in a locally present markdown doc. Even if agents succeed, they typically start off hallucinating or guessing the API endpoints, and only when they encounter an error from the task environment do they read the API. 

In a capture the flag task, agents have to open a file with unknown encoding in python, and often fail on the first try because they specify an incorrect encoding. Even the best models respond by trying out different encodings in the python script, which is inefficient and wastes tokens. We never saw an agent running the bash _file_ command that would identify the necessary encoding directly. 

## **E Further discussion** 

### **E.1 Constant factors versus slope changes** 

Although extrapolation is always imperfect, forecasting AI time horizons far into the future is much more sensitive to changes in doubling rate than to constant factors in time horizon. For example, a naive extrapolation based on o1’s time horizon of 39 minutes and a past doubling time of 218 days (3.2x/year) predicts that AIs will reach a 1-month 50% time horizon (roughly 8 doublings over o1) about 4.8 years after the release date of o1. A 2x increase in doubling time would delay the 1 month point by a further 4.8 years, but a 2x constant factor decrease in time horizon would only delay it by 0.6 years. 

### **E.2 Important factors that could change time horizon slope** 

**Agency training** Horizon growth since 2024, which may be faster than the long-term trend, could be explained by researchers post-training models to be more agentic (that is, capable of taking many sequential actions towards completing a task) using outcome-based RL. Research into making models capable and agentic is likely to continue. Future agency training could be faster than the long-run trend (since post-training may be more compute-efficient than pretraining at increasing horizon length). But 2024–2025 agency training could also be a one-time boost from picking lowhanging fruit, in which case horizon growth will slow once these gains are exhausted. Overall, we think agency training is more likely to increase the time horizon growth rate compared to the 2019–2024 trend. 

**Compute scaling** Between the release of GPT-2 and today, the compute used to train the most impressive frontier language models has increased by at least a factor of 10,000x [40], with training compute usage doubling every 6–10 months [41]. More recently, models like o1 and o3 have began to use more compute at inference time. It is unclear whether there is sufficient capacity to expand either training or inference compute by many more orders of magnitude in the next 5 years. However, algorithmic improvements, which have historically decreased the compute requirements for a fixed performance level [48] [49], can substitute for compute limitations. We think that limits to compute scaling will slow the growth of AI agent time horizons somewhat, but be partially compensated by more investment into algorithmic improvement. 

28 

**Automation of AI R&D** The main inputs to AI research and development are compute and researcher time. If future AI systems are capable of substituting for human research engineers and/or increasing the compute-efficiency of training, the rate of AI progress will increase. We think it is likely that there will be substantial AI R&D automation once frontier AI time horizon reaches tens of hours, shortening the time from then until one-month-horizon AI. 

**AGI will have “infinite” time horizon** An infinite time horizon does not mean an arbitrarily capable AI, merely the ability to complete tasks that take humans an arbitrarily long length of time. If an artificial general intelligence (AGI) is capable of completing _all_ tasks expert humans can with a success rate of at least X%, its X% time horizon will necessarily be infinite. Therefore, if such systems are ever developed, the long-term trend in time horizon will be faster than exponential, with an asymptote at the date of AGI deployment. 

### **E.3 Interpreting time horizon** 

Although time horizon is an intuitive measure of AI agent capability, measuring it requires a large dataset annotated with human time, and time horizon is always measured relative to a task distribution and baseliners’ levels of context and skill. 

**Context and skill effects** At real companies, junior software engineer hires often take weeks of onboarding to begin contributing economic value. The human baseliners that determine the length of most tasks have much less context than average employees, potentially _increasing_ measured task length. Our tasks are designed to require minimal context, which somewhat mitigates this problem; our internal PRs (Section C.2) were not designed this way, and so baseliners took many times longer than employees. However, highly skilled baseliners can also complete tasks far faster than average employees. Our expert baseliners are likely much more skilled than the average software engineer, potentially _decreasing_ our measured task length. 

**Task distribution effects** Figure 3 shows that AI agent success rate is imperfectly predicted by human time-to-complete, meaning that other factors also substantially influence the difficulty of tasks. When models are measured in different domains of intellectual labor like research mathematics, computational biology, or law, we expect their time horizons to differ. 

**Measuring extreme time horizons** Accurately measuring that the X%–time horizon of an AI agent is about _t_ minutes requires many tasks of human length _t_ that the AI agent completes with a success rate of about X%. This has two implications. First, accurately measuring very long time horizons requires a dataset of difficult tasks with long human baseline runs, which can be impractical to construct, especially because success criteria for realistic difficult tasks are often complex enough to require manual grading. Second, measuring time horizons at extremely high success levels– 95%, 98%, or higher– requires very large task datasets with near-zero label noise that cover the population of tasks they are meant to represent. 

**Human time horizon measurements** In theory, one could also measure the time horizon of a human or population of humans. However, there are both theoretical and practical difficulties to doing so. We discuss this more in Appendix C.1.4. 

### **E.4 Limitations and future work** 

We believe that there are several ways in which our work could be improved. 

**More models with better elicitation** In general, we find that properly eliciting models can make a very large difference in their performance.<sup>17</sup> We have put a limited amount of effort into eliciting models to get good performance on our tasks, so while our results are a reasonable lower bound, some models may have somewhat greater capabilities than we demonstrate. The most work was done to elicit o1 and the original Claude 3.5 Sonnet, each of which had around 2-3 engineer weeks of iterative development. All other models use the same scaffolding with at most minor changes. 

> 17This is a common obervation; see e.g. the improvements to software development capabilities from AIDE [50] or recent work on KernelBench: [51] 

29 

Future work could replicate our results with more effort spent on eliciting the full capabilities of frontier models. 

**More rigorous human baselining** Our per-task human time estimates are likely noisy due to relatively small sample size, and potentially also systematically skewed in various ways. Most notably, we select only successful completions of a task, and encourage baseliners to give up on tasks they may not complete in a reasonable amount of time. Our baseliners’ skills also vary significantly, and a wide variety of skills are relevant to these tasks. Though we attempt to match baseliners with appropriate tasks, this process is unlikely to be perfect. From manual reviews of baseline attempts, we also observe that humans sometimes simply give up even when the task seems within their capabilities, and it is unclear what selection effects are produced on the distribution of success times as a result. See See Appendix C.1.4 for further discussion of how bias in human baseline times could affect our results. Future work could replicate our results with more rigorous human baseliner selection or explore how sensitive the results are to methodological choices around human baselining. 

**More natural, varied tasks** There are reasons to believe that our task distribution is systematically different from the distribution of economically valuable work (and perhaps systematically different than the distribution of risk-model relevant tasks). We explored some of these reasons in Sections 4, but there remain many differences that we did not explore. For example, the modality of interaction in these tasks is also relatively narrow—for example, no tasks require the use of a mouse. No tasks require cooperating or competing with humans or other agents,<sup>18</sup> while real software engineering or ML research involves communicating and coordinating with managers and other engineers or researchers. Many real-world tasks require very high reliability, and these are underrepresented in our dataset due to the difficulty of measuring models on these tasks. Most importantly, the tasks we study are heavily skewed toward software engineering and ML research. Future work could explore how the capabilities of AI agents are progressing in other domains. 

**More use of inference compute** Our scaffolds made relatively limited use of inference-time compute. When assuming that the human expert is compensated at $143.61/hour (average L4 Engineer salary at Google divided by 2,000 hours), more than 80% of successful runs cost less than 10% of what it would cost for a human to perform the same task. (Figure 14). This implies that if inferencetime computation could be used to improve performance, there is substantial room to do so while still remaining economically competitive with human experts. Previous research has found that techniques such as best-of-k can substantially improve performance on a subset of these tasks,[2] and better use of inference-time compute may lead to substantially different scores. 

**Data analysis** The 2024–2025 trend appears faster than the 2019–2025 trend, but due to the small number of models it is unclear if this is noise. Future work should include hypothesis testing to detect a possible 2024 slope change, and more sophisticated statistical methods to create credible intervals for an overall forecast. We also lose some information in the multiple stages of estimation— conversion of baseline data to task difficulty ratings, time horizon computation, and linear regression to find the trend—and end-to-end methods could be more data-efficient. 

## **F External validity details** 

### **F.1 Retrodiction from 2023–2025 data** 

As part of exploratory work for this paper, we measured the time horizon of 9 frontier and nearfrontier models released in 2023 and 2024, using only our HCAST and RE-Bench suites. This trend (with Claude 3.7 Sonnet and o3 added) is shown in Figure 10: time horizon doubles about every six months. Since we only had two 2023 models (GPT-4 0314 and GPT-4 1106) and a small data range (release date spanning 2 years and time horizon spanning 5 doublings), error bars were very wide. In addition, restricting our data further to 2024-only models produced a different trend with time horizon doubling about every three months, so any extrapolation into the future would not be robust. 

18See Xu et al. [12] for an example of a recent benchmark that requires multi-agent interaction in a relatively realistic setting. 

30 

To address these issues, we collected more data to extend the trendline into the past, developing the Software Atomic Actions (SWAA) suite to decrease the minimum human time of the task suite from 1 minute to under 2 seconds, and enabling us to measure GPT-2, davinci-002 (GPT-3) and GPT-3.5-turbo-instruct on the combined suite. 

The 2023–2025 trend may be faster than the longer-term trend (Figure 11). The measured doubling time over the whole 6 year period 2019–2025 inclusive was 207 days, which is less steep than the 172-day trend based on data from non-SWAA tasks and 2023–2025 models. However, this difference is still within margin of error. 

### **F.2 Messiness factors** 

Real-world intellectual labor often involves messy details that benchmarks usually don’t include, such as being under-specified or poorly scoped, having unclear feedback loops or success criteria, or requiring coordination between multiple streams of work in real-time. We generally observed that agents struggle more on tasks that have these “messy” details (Section 3.3). A natural question is therefore whether agents showed similar rates of improvement on “less messy” and “more messy” tasks. 

We rated HCAST and RE-Bench tasks on 16 properties that we expected to be 1) **representative** of how real world tasks might be systematically harder than tasks we study and 2) **relevant** to AI agent performance. Some example factors include whether the task involved a novel situation, was constrained by a finite resource, involved real-time coordination, or was sourced from a real-world context. We labeled RE-bench and HCAST tasks on the presence or absence of these 16 messiness factors, then summed these to obtain a “messiness score” ranging from 0 to 16. Factor definitions can be found in Appendix H.6. 

The mean messiness score amongst HCAST and RE-Bench tasks is 3.2/16. None of these tasks have a messiness score above 8/16. For comparison, a task like ’write a good research paper’ would score between 9/16 and 15/16, depending on the specifics of the task. 

On HCAST tasks, AI agents do perform worse on messier tasks than would be predicted from the task’s length alone (b=-0.081, _R_<sup>2</sup> = 0.251), see Figure 13. An increase in task messiness by 1 point reduces mean success rates by roughly 8.1%<sup>19</sup> . 

However, trends in AI agent performance over time are similar for lower and higher messiness subsets of the task suite. For example, on sub hour tasks, success rates increased by 40 percentage points between Jan. 2023 and May 2025 in both high and low messiness splits (Figure 12). In particular, we find no evidence of either much slower performance trends, or a plateau, specific to our higher messiness subset. 

## **G Miscellaneous tables and figures** 

The following are several figures not included in the main body, from external validity and other sections. 

## **H More ablations and robustness checks** 

There are many ways to measure “time to complete” a “well-defined task”, so our analysis involved many somewhat arbitrary choices. To ensure our results are robust, we’ve reproduced our results with alterations to our methodology and find the results are largely robust to these changes. 

Because we used these analyses to inform our methodology choices, these ablations were performed relative to a slightly different version of the pipeline than the one in the final report. In particular, they include a slightly different set of baselines and different filtering for task success. 

1. Alternative curve-fits (H.1) 

2. Re-normalizing the task suite to other distributions than log-uniform 

19A linear approximation of this relationship is used for the purpose of roughly quantifying the size of this effect in an intuitive way. 

31 


![[metr26-p0032-00.png]]


Figure 10: Time horizons on HCAST + RE-bench, for models starting with GPT-4 0314. 


![[metr26-p0032-02.png]]


Figure 11: The full time series for the time horizon of models, by release date. We plot in blue the regression from only 2023+ data on HCAST + RE-Bench tasks, extended into the past, and in gray the regression with all tasks (including SWAA) on the whole 6 year period. Points on the graph are models’ time horizons on all data including SWAA. 

32 

Table 7: Average Success Rate by Model and Task Source 

|Task Source|HCAST|RE-Bench|SWAA|
|---|---|---|---|
|**Claude 3 Opus**|0.25|0.00|0.98|
|**Claude 3.5 Sonnet (New)**|0.46|0.11|0.99|
|**Claude 3.5 Sonnet (Old)**|0.38|0.05|1.00|
|**Claude 3.7 Sonnet**|0.58|0.04|1.00|
|**GPT-2**|-|-|0.40|
|**GPT-4 0314**|0.23|0.00|0.98|
|**GPT-4 1106**|0.30|0.02|0.97|
|**GPT-4 Turbo**|0.23|0.00|1.00|
|**GPT-4o**|0.30|0.00|0.98|
|**davinci-002 (GPT-3)**|0.00|0.00|0.65|
|**gpt-3.5-turbo-instruct**|0.01|0.00|0.95|
|**o1**|0.54|0.07|1.00|
|**o1-preview**|0.44|0.02|1.00|
|**o3**|0.65|0.40|-|
|**o4-mini**|0.61|0.27|-|




![[metr26-p0033-02.png]]


Figure 12: Performance trends over time for HCAST and RE-Bench tasks by length and messiness (Section F.2). The data spans only 2023–2025 as pre-2023 models score 0 on non-SWAA tasks. Whilst our messier tasks have lower average success rates, trends in model performance improvements are not obviously slower on the high messiness split. 

33 


![[metr26-p0034-00.png]]


Figure 13: We plot the excess success rate (the observed empirical task success rate, minus success rate we would predict using the task’s length, see Section 3.1) against messiness score for each task. As discussed in Section F.2, there is a negative relationship between excess success rates and messiness. 


![[metr26-p0034-02.png]]


Figure 14: Cost of a successful run using an LLM agent as a fraction of the cost of the salary of a human expert performing the same task. 

34 


![[metr26-p0035-00.png]]


Figure 15: Linear, hyperbolic, and exponential fits for model time horizon since 2019. 

3. Alternative means of estimating task difficulty 

4. Sensitivity to baseliner ability: 

   - Baseliners whose abilities we are subjectively very confident in 

   - Restricting the task suite to tasks with at least 2 baselines and using the best baseline time on each task as our difficulty estimate 

   - Restricting the task suite to tasks with at least 2 baselines and using the worst baseline time on each task as our difficulty estimate 

   - Adding noise to baseline times (included in Figure 6) 

5. Task choice: Removing RE-Bench tasks 

6. Different weightings of task families: _~~√~~_ family size1<sup>vsuniform(includedinFigure6);also</sup> 

<u>1</u> family size 

7. Estimated training date vs estimates of release date 

8. Continuous scoring: Figure 16 

### **H.1 Alternative curve fits** 

In our main result, we fit an exponential curve (linear with a log y axis) because the fit is very good ( _R_<sup>2</sup> _≥_ 0 _._ 96, depending on the exact data and methodology). Linear and hyperbolic curves have poor fits (Figure 15). Because there are only 12 frontier models in the time span we studied, and the exponential fit has such high _R_<sup>2</sup> with only two parameters, we think applying fits with more parameters would be more likely to overfit than to give accurate predictions. In particular, we considered: 

- A double exponential function log(horizon) _∼ a_ + _b_ exp( _c ·_ (release ~~d~~ ate + _d_ )) is strictly more expressive than an exponential (because exp( _x_ ) _≈ x_ for small _x_ , they are equivalent when _c_ is small) 

- Likewise, the initial part of any saturating logistic function horizon _∼ a · σ_ (release ~~d~~ ate+ _d_ ) looks very similar to an exponential, and without any evidence that AI horizon is leveling off (on our metric), it is essentially impossible to predict when or if it will plateau, or for how long. 

- Sophisticated stochastic models that asymptote to infinity often have large uncertainties; see Roodman [52], which applied a superexponential diffusion model to economic data. As we discuss in Section 5, large uncertainty may be appropriate when constructing a prediction interval for a long-term forecast, but quantitatively modeling the potential impact of the factors we mentioned is out of scope of this paper, so we prefer to discuss these qualitatively. 

35 


![[metr26-p0036-00.png]]


Figure 16: Time horizon with continuous (non-binarized) scoring. Claude 3.7 Sonnet has a 50% time horizon of nearly 2 hours. We think this methodology captures more signal from 8-hour REBench tasks, but overstates the time horizon of recent models, since it is easier to achieve an average score of 0.5 on most tasks than to match human performance 50% of the time. The slope is also likely an overestimate, because longer tasks tend to be continuously scored. 


![[metr26-p0036-02.png]]


Figure 17: Trend in 80% success rate time horizon. The doubling time is similar to the 50% plot, but horizons are substantially lower. 50% horizon trend shown in grey. 

### **H.2 Horizons at 80% success rate** 

In Figure 17, we show the trend for the 80% time horizon for models over time. The doubling time is similar to the 50% plot, but horizons are substantially lower. 

### **H.3 Success rate versus inference cost** 

In Figure 18, we plot the success rate of models across our tasks as a function of token costs. All of the models studied perform better with larger token budgets, but the majority of models show clear evidence of plateaus far below the maximum number of tokens allocated to each model. 

36 


![[metr26-p0037-00.png]]


Figure 18: Success rate by cost. Models were given sufficiently high token limits to reach a plateau in success rate. Cost information is not included for o3 and o4-mini. 


![[metr26-p0037-02.png]]


Figure 19: 2024–2025 and 2019–2025 exponential fits for 50% time horizon. 

### **H.4 2024–2025 Horizon growth trend** 

If the 2024–2025 horizon growth trend continues to exceed the 2019–2023 slope, future work should apply change point analysis to determine whether the difference in slope is statistically significant. 

### **H.5 SWE-bench Verified** 

**Data Collection** We collected per-model, per-task results from the official SWE-bench evaluation results repository for frontier models: Claude 3 Opus, Claude 3.5 Sonnet (Old), Claude 3.5 Sonnet (New), GPT-4 1106, GPT-4o, and o1. Note that this is only 6 of the 11 models we include in the main result. 

**Time estimates** SWE-bench Verified contains time estimates created by contractors that split tasks into four buckets: _<_ 15 min fix, 15 minutes–1 hour, 1 hour–4 hours, or _>_ 4 hours. These estimates were based on the expected time it would take an “engineer who has had a few hours to familiarize themselves with the codebase” to solve the issue. 

We verified annotator time buckets by running seven baselines across 6 SWE-bench Verified tasks. We baselined four tasks in the “ _<_ 15 min fix” bucket, and found that they took our baseliners 8, 26, 67, and 84 minutes respectively. We baselined two tasks in the “1 hour–4 hours” bucket, and both baseliners took between 2–3 hours. 

37 

|**Task Time Bucket**|**Task Time Estimate**|**Average Baseline Time**|
|---|---|---|
|_<_15min fix|3.9 min|32.9 min|
|15 min–1 hour|30.0 min|–|
|1–4 hours|120.0 min|131.6 min|
|_>_4hours|480.0 min|–|



Table 8: We convert the SWE-bench Verified time annotations into task estimates, by taking the geometric mean of the time annotation. We caution that this likely underestimates the time each issue takes to resolve by a human baseliner without context—notably, we observe that the geometric mean of baseliner time for four randomly sampled tasks in the “ _<_ 15 minute fix” bucket is 32.9 minutes. 

|**Model**|**Model Time**<br>**Horizon**<br>**(Our Tasks)**|**Model Time**<br>**Horizon**<br>**(SWE-bench Verified)**|**Model**<br>**Time Horizon Ratio**|
|---|---|---|---|
|Claude 3 Opus|6.42 min|0.83 min|7.8x|
|GPT-4 1106|8.56 min|1.18 min|7.2x|
|GPT-4o|9.17 min|5.96 min|1.5x|
|Claude 3.5 Sonnet (Old)|18.22 min|5.91 min|3.1x|
|Claude 3.5 Sonnet (New)|28.98 min|16.88 min|1.7x|
|o1|39.21 min|51.21 min|0.8x|



Table 9: The time horizon of less capable models is substantially longer on our tasks than on SWEbench Verified. 

**Analysis methodology** We converted annotator time range estimates into per-task time estimates. We do this by taking the geometric mean of the starting and ending times of the time buckets. We select 16 hours as the upper limit for SWE-bench Verified tasks, but there are only 3 tasks in this time bucket, and they do not meaningfully affect the results. We then applied the same methods as used in Section 3 to convert per-model, per-task results and task time estimates into a model time horizon. To reduce the influence of similar tasks, we consider tasks that involve issues belonging to the same repository as part of the same task family, and down-weight the contribution of tasks by the square-root of the number of tasks in the same family. 

**Annotator vs contract baseliner times** As shown in Table 8, we found that annotator time estimates are likely more inaccurate on the “ _<_ 15 min fix” time bucket, as in practice baseliners often take much longer than this to complete tasks. This results in easier tasks’ difficulty being underestimated, meaning that the SWE-bench Verified time horizon estimates likely underestimate true model performance for less capable models, which in turn leads to a steeper exponential trend. 

### **H.6 Messiness factors** 

Messiness factor labels were collected from 2 internal contractors and one researcher. 

The full list of messiness factors and definitions used are shown in Tables 10 and 11. 

In Figure 20, we plot the messiness scores of HCAST tasks against log human time-to-complete. We find that messiness is correlated with task length, and that we have very few short tasks with a high messiness score. We also color each point by the performance of the model. Tasks with high messiness and which take humans a long time to complete tend to have low success rates, and vice versa for shorter, lower messiness tasks. 

A limitation of our messiness factors is that they are at least somewhat adversarially selected against current models. This is due to the combination of selecting for perceiving the factor to be relevant to model performance, and all of these factors being expected to make tasks more difficult. As a result, we might expect model performance to be more negatively correlated with our task messiness measure than it ought to be—and for predictive adjustments based on messiness to work less well for models released long before, or after, the time of this analysis. 

38 

Table 10: Messiness Factor Definitions 1-8 

|**Factor**<br>|**Definition**<br>|
|---|---|
|Real life source|Is this task: EITHER 1. Intended to be representative of some real world end-to-end task (if<br>uncertain, is more likely than not) OR 2. Sourced from a real-life problem<br>AND<br>3. Has NOT been intentionallysimplified to an easier and smaller subtask.|
|Resource|i<br>Does this task:|
|limited|Require the use of a limited and one-time consumable resource where BOTH<br>1. Using the resource wisely is more relevant to task failure / success than using the default<br>resource limits wisely (time, tokens, cost)<br>2. The resource is not easily replenishable within the task (e.g. limited number of queries to a<br>verifier,or apermanent counter onguesses made that counts against the agent’s score)|
|Not easily reset-<br>table|i<br>Is it difficult for the agent to reset the (task success relevant) state back to the initial starting<br>state if desired, given no very obvious poor actions were taken? (e.g. rm -rf ing the env is too<br>obviously poor) To be easily resettable, this should be able to be done without prior planning,<br>but can involve back trackingbased on the historyof actions upto thatpoint.|
|Irreversible<br>mistake|Do you think it would be somewhat likely (_>_20%) that a 20th percentile human (from the<br>distribution of people with background in the domain of the task but not prior context on this|
|availability|specific task) would make a mistake during the first 50% of their time spent on the task that<br>wouldpermanentlyand irreversiblyreduce the score theycould achieve?|
|Dynamic<br>environment|Does the task involve interacting with a changing environment in ways significant to task<br>success, even if the agent takes no actions? This is true if this is the case for a significant part<br>of the task,even if it isn’t true over the whole duration of the task.|
|Difficult<br>counterfactuals|Are there significant success-relevant parts of the task where it is difficult for the agent to<br>figure out whether a given effect should be attributed to its own actions (or lack of actions), or<br>to something else?<br>An example might be a task where the agent was optimizing a distributed computing system’s<br>performance. In this task the system occasionally experiences cascading slowdown and failures<br>but this isn’t mentioned in the task prompt. If the agent is making some seemingly unrelated<br>optimization it might be difficult to determine if the cause of these failures is downstream of<br>the agent’s direct changes, differences in load over time, random variation e.t.c<br>Another example might be a case where adding debugging behavior like logging would change<br>the behavior of the system being logged, which would make it harder to observe the system<br>and tease apart the causal effects of different interventions.|
|Not purely auto-<br>matic scoring|Does this task NOT have an entirely automatic scoring function?<br>Specifically, for tasks implemented in the task standard:<br>1. There are no branches in which the scoring function returns None AND 2. The task provides<br>manual scoring instructions in those cases AND 3. There are no clauses about obeying rules<br>that are not actually checked in the automatic scoring. (e.g A family which had the instruction<br>”you may not attempt to reverse engineer X’” but this is not checked in the automatic scoring<br>function)|
|Implicit<br>generalizability<br>required|Is it saliently possible to satisfy the stated success conditions in the prompt in such a way that<br>the spirit of task is not actually fulfilled, or the product would not be useful for the implied<br>purpose?<br>For example, a task asking the agent to train a good small model may have various explicitly<br>stated conditions for scoring well, like loss achieved, or accuracy. But meeting the word of<br>these requirements may not actually be enough for a solution to be useful for the implied<br>purpose (in this case, something like ’make a good model). For example, a model that takes<br>a minute to produce a single token doesn’t seem very useful. This could be thought of as an<br>implicit requirement that the solution generalizes to the implied use case.<br>The spirit of this column is basically ’does the agent have to make sensible judgement calls on<br>soft constraints that are not necessarily explicitly stated by the task prompt in order to produce<br>an output that would be useful for the implied purpose of the task’?<br>For toy tasks where there is not a strong reason to think that there is an implied purpose, this<br>is false.<br>AND|
||Are these implicit generalizability requirements checked during scoring, either by the scoring<br>function or by manual judgement / review?<br>(For example, some tasks have an additional manual review stage to check for exploit solutions,<br>this counts. Other tasks use manual scorerjudgement to check that the output is useful.)|



39 

Table 11: Messiness Factor Definitions 9-16 

|**Factor**|**Definition**|
|---|---|
|Non explicit<br>scoring<br>description|Both must be true:<br>Firstly: a. The constraints on which the agent is scored are NOT all explicitly stated OR b.<br>the scoring is described in a way such that there remains significant hidden information in the<br>scoring)<br>AND secondly:<br>This lack of information about scoring produces task-relevant uncertainty about the best course<br>of action within the task. (For example, managing tradeoffs between two different factors being<br>optimize, but whose exact weightings in scoring are uncertain)<br>For example, a task that just says to return the number of days there were in March 2022 would<br>not count as having non explicit scoring. This is because there is no task-relevant uncertainty<br>introduced bythis lack of information.|
|Is<br>suboptimal<br>behavior<br>exploited|Does this task involve competing against other agents or programs that will actively exploit<br>weakness or suboptimal behavior of the agent (or outputs of the agent)? Tasks which have<br>some adversarytypeprogram or behavior are typical examples.|
|No<br>provided<br>verification<br>mechanisms|The task does not provide a way for the agent to check its answer or score midrun. Requires<br>the agent to do some non-trivial amount of work to check its answer.|
|Real-time<br>coordination|Does this task require real-time coordination with other agents, or services, or require compe-<br>tently orchestrating multiple real-time processes in parallel? For this, monitoring an ongoing<br>training run would NOT count unless it was expected / required by the task that the agent per-<br>form multiple trainingruns(or similar)inparallel.|
|Self<br>modification<br>required|Does this task require the agent to modify a portion of itself, or the code that is being used to<br>interact with the environment, or to create a new tool for itself, or to create data that could be<br>used to do this?|
|Self<br>improvement<br>required|Does this task require the agent to improve itself in some that permanently increase its per-<br>formance on a wide distribution of tasks? For example, for AI agents, this could be creating<br>finetuning data that works to improve the agents own general agency performance would sat-<br>isfy this. However, creating finetuning data that improves performance on some narrow task<br>would not satisfythis(and would instead satisfyself modification).|
|Information<br>seekingrequired|i<br>The task requires gathering information that the agent would not be expected to know ahead<br>of time. For example, probingthe behavior of a novel system.|
|Novel situation|The task has some kind of unusual constraint, or unusual property, without which the task<br>would be significantly easier or more rote, and which is a significant source of the tasks diffi-<br>culty.|



### **H.7 Randomizing file names** 

To better understand the effect of messiness on agent and human performance, we modified an existing HCAST task, which involved looking through local LaTeX and PDF files to find a specific piece of information, by randomizing file names, folder names, and providing less information on what to search for. 

### **H.7.1 Methods** 

The specific HCAST task modified is called `Local Research TeX` . The unmodified version of this task initializes the agent environment to have a collection of nested folders and content, and then prompts the user to find some specific information, for example, with the prompt “According to the AR report, how many tasks did the best-performing agent complete?” Agents (or humans) must then search the local folders and content to find the specific answer to this question (in this case, “four”). We modified this task in a variety of ways, but the most notable variant involved: 

1. Modifying the prompt from “According to the AR report” to “Find the answer to the following question in one of the resources in /home/agent/resources/”: 

2. Modifying the all folder names to random integers, and all file names to meaningless names like “final” or “my ~~f~~ ile.” 

We then ran agents for about a hundred runs across the original variant of this task and the modified version of this task, and compared the respective success rates. We also calculated the human time to complete using our standard baseline methodology. 

40 


![[metr26-p0041-00.png]]


Figure 20: Messier tasks tend to be longer. 

### **H.7.2 Results** 

Surprisingly, o1’s performance is on average better on the messier variant of the report, and human baseliners performed much worse. Qualitatively, o1 appears to do much better on the scrambled- 

|**Task Variant**<br>local<br>~~r~~esearch<br>~~t~~ex/ar<br>~~r~~eport|**Success Rate**<br>34%|**Baseliner Time**<br>24 minutes|
|---|---|---|
|local<br>~~r~~esearch<br>~~t~~ex/ar<br>~~r~~eport<br>~~s~~crambled<br>~~f~~iles|50%|53 minutes|



filename variant of this task because it is not given the term “AR report” in its prompt. In practice, o1 often decides to grep for the term “AR report” and fails to find it (as the actual report is named “ARA report”), and then makes a guess. On the other hand, when told to look in one of the resources, o1 performs a more general search, and finds the report it’s looking for (more often). While this is only one limited example, we believe this further illustrates the challenges of quantifying and predicting how aspects of any task may effect agent performance - indeed, factors that make humans worse at some tasks may indeed improve agent performance. 

### **H.8 Correlation in performance between agents** 

In Figure 22, we report the correlation matrix of per-task success rates between each pair of models. 

**Excess success rates** Excess success rates (<sup>_Sobserved−Spredicted_</sup> ) are a metric for how much better _Spredicted_ (or worse) an AI agent performed compared to what we would expect, given a task’s length and that model’s ability (expected success can be seen in Figure 4). 

In Figure 23, we report the correlation matrix for the excess success rate ( _Sobserved − Spredicted_ ) _/Spredicted_ (where _Spredicted_ is the success rate predicted from the model’s time horizon). While the correlations for excess success rate are lower than the correlation of raw task success rate (0.38 instead of 0.71), the fact that it is positive suggests additional factors that explain model success rates across tasks which are common across models. 

41 


![[metr26-p0042-00.png]]


Figure 21: Model success rates on HCAST + RE-Bench tasks, split by task messiness rating. Models have higher success rates on the less messy tasks, but the rate of improvement over time is similar for both subsets. Both davinci-002 and gpt-3.5-turbo instruct score 0 on the subset of HCAST + RE-Bench with higher messiness. 

## **I Code** 

Code and data to reproduce some of the core figures in this paper will be provided in the supplementary material; the full codebase is infeasible to publicize and anonymize but the authors can provide code for individual additional figures on reviewer request. 

## **J Author contributions** 

## **Acknowledgments and Disclosure of Funding** 

**Thomas Kwa** led the development of SWAA tasks, wrote most of the data analysis code, and wrote the plurality of the final draft including generating about half of the figures. **Ben West** performed the initial analysis, and co-led the project. **Joel Becker** led human baselining processes and data collection for RE-Bench and HCAST tasks, and contributed to early data analysis code. **Amy Deng** created most of the SWAA tasks, collected human baselines and AI agent results on the SWAA tasks. She also investigated agent and task failures and assisted with obtaining agent results on HCAST tasks. **Katharyn Garcia** wrote evaluation and data analysis code. **Max Hasin** led the qualitative 

42 


![[metr26-p0043-00.png]]


Figure 22: Correlation matrix of observed success rates across all models and tasks. 


![[metr26-p0043-02.png]]


Figure 23: Correlation matrix of excess success rates (defined by<sup>_Sobserved−Spredicted_</sup> ) across all _Spredicted_ models and tasks. 

43 


![[metr26-p0044-00.png]]


Figure 24: Change in time horizon of frontier models over time. Note: the data displayed is the same as in Figure 1, but with a linear axis. 


![[metr26-p0044-02.png]]


Figure 25: Time horizon of all models we measured, including non-frontier models. 

44 


![[metr26-p0045-00.png]]


Figure 26: Length in human expert clock-time of tasks that frontier models can perform competently over time. See Section 3 for details on time horizon length calculation. The line represents the linear regression fit, with a confidence region calculated via hierarchical bootstrapping. In this plot, davinci-002 and gpt-3.5-turbo-instruct are placed at the release dates of GPT-3 and GPT-3.5 respectively, and GPT-2’s score is imputed as zero for longer tasks for which our scaffolds are incompatible. Note: this is the same as Figure 1 but presented differently. 

impressions work and wrote key sections, gathered internal PRs, and contributed to data analysis code and baselining collection. **Sami Jawhar** contributed to the task-running and data analysis infrastructure. **Megan Kinniment** performed the messiness experiments, excess success rate and initial reliability analyses, oversaw the creation of many HCAST tasks, and contributed to figures and writing. **Nate Rush** led the SWE-Bench and Internal PR experiments and drafted those sections of the paper. **Sydney Von Arx** oversaw internal validity analysis. 

**Brian Goodrich** contributed to the development of the modular-public agent, and created the flock and duet agents. **Nikola Jurkovic** baselined SWAA and RE-Bench tasks and tested RE-Bench tasks. **Seraphina Nix** contributed to writing and revising the paper and figures. **David Rein** managed the development and collection of HCAST tasks and oversaw the human baselining process for those tasks. **Lucas Jun Koba Sato** led the development of the AI agents and collection of agent results on HCAST tasks. **Chris Painter** suggested substantial framing and presentation changes. **Neev Parikh** contributed to running external validity experiments. 

**Elizabeth Barnes** helped develop the basic concept, suggested experiments/analyses, gave feedback, and assisted with writing/early task development/analysis code. **Lawrence Chan** co-led this project, including setting the overall direction, helping decide what experiments to run, and contributing much of the writing for our paper. 

45 

