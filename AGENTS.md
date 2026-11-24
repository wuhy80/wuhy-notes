# AGENTS.md

> **本文件是本仓库唯一的 AI 协作指令。** 2026-11-24 起 `CLAUDE.md` 已删除，**不要再新建同名文件**——两份指令必然漂移，漂移的指令比没有指令更危险。
>
> 本文在 2026-11-24 按 `origin/main` 实测校正：远端/分支/用户配置、目录清单、`.gitignore`、发布流水线均已核对。标「已失效」的是历史做法，不要再照做。

## 0. 仓库定位（先读这一节）

- 本仓库是**个人知识库主库**，同时是**公开站点的内容源**。
- 站点是**自研 Markdown 阅读器**：正文以 `.md` 原样发布，浏览器按需解析渲染。**已不再使用 Quartz 或任何主题包**。
- 发布链：push → `publish-site.yml` → 脱敏导出 + 构建阅读器 → `wrangler pages deploy` → `verify-reader.mjs` 校验 → 同步国内镜像。D1 全文索引由**独立工作流** `sync-search-index.yml` 在发布成功后同步。
- 日记、公司项目、个人信息等私密内容在**另一个独立仓库**，不在本仓库。该库在本机当前位于 `E:\Obsidian`（历史文档常写作 `E:\Obsidian\wuhy80_private`，**已失效**）。**动手前先确认目录里有 `.git`，找不到就停下来问人，绝不按记忆猜路径**——猜错会覆盖别人的库。
- 本机已**没有 Obsidian 工作区**：`.obsidian/` 不存在，且被 `.gitignore` 排除。唯一真相源是 git 仓库里的 Markdown，编辑器是 ZCode / DSH。

## 1. 目录与关键文件（实测）

| 路径 | 内容 |
|---|---|
| `技术笔记/` | 按技术分类的笔记（Kubernetes、Linux、Python、数据库、网络等） |
| `大模型/` | LLM、MCP、本地部署、论文；`10-新闻/` 下是 AI 早报日报与周报归档 |
| `Ontology/` | Palantir Ontology、资源模型、Action、权限治理、Agent 应用 |
| `英语学习/` `数学学习/` | 双语精读与数学专题；生词聚合页 `英语学习/我的生词本.md` |
| `AI开发Demo/` | 交互式 Demo（含 3D/可视化组件），随站点发布 |
| `Golang编程/` `Rust编程/` `读书笔记/` `网址收藏/` | 语言专题、阅读记录、书签 |
| `附件/` | 默认附件目录 |
| `template/` | Templater 模板**存量保留、不再新增**（Obsidian 已退役） |
| `scripts/` | 导出、构建、校验脚本（见第 6 节） |
| `.github/workflows/` | `publish-site.yml`、`sync-search-index.yml`、`cloudflare-secrets-sync.yml`、`ai-daily-archive.yml`、`gitleaks.yml` |
| `.github/scripts/` | `fetch-ai-daily.mjs`、`generate-ai-weekly.mjs`、`rank-ai-daily.mjs` |
| `cloudflare/` | `_worker.js`、`embeddings.json`、`plotly.min.js`（站点 Worker 与语义搜索） |
| `docs/` | `d1-search-setup.md`（D1 搜索）、`markdown-reader-preview.md`（阅读器本地使用） |
| `_reports/` | 本地审计与临时产物，**不纳入版本控制** |

根目录关键文件：`Home.md`、`Home-分析面板.md`（Dataview 仪表盘）、`README.md`（站点与流水线概览）、`start-reader.cmd`（本地预览）、`deploy-reader.cmd`（一键提交+推送+发布）、`package.json` / `package-lock.json`（阅读器依赖与 npm scripts）。

> [!warning] 明确**不存在**的目录与文件
> `我的日记/`、`专项项目/`、`Inbox/`、`任务管理/`、`个人信息/`、`投资管理/`、`极客时间/`、`浏览剪切/`、`网络剪切/`、`网关开发/`、`网络资料/`、`Clippings/`、`Excalidraw/`、`我的任务.md` 都**已不在本库**（在私密库）。历史文档把它们列为主目录，不要再去找，也不要在本库重建。
>
> `Makefile` 仍是旧 Quartz 流程的遗留，**已不再使用**；本地预览走 `start-reader.cmd` 或 `npm run reader:preview`。

## 2. 文档地图（想深挖看这些，不要写进本文）

| 主题 | 去哪看 |
|---|---|
| 阅读器本地预览、保存后自动刷新 | `docs/markdown-reader-preview.md` |
| 站点视觉契约（改样式/颜色/字体/布局**前必读**） | `scripts/DESIGN.md`；token 源 `scripts/site-custom.scss`，阅读器布局适配 `scripts/reader/layout.css` |
| D1 全文搜索 | `docs/d1-search-setup.md` |
| 双仓库拆分、多机同步、Git 故障处理 | [[技术笔记/版本管理/知识库双仓库拆分与多机同步]] |
| 流水线概览 | `README.md` |

**本文只放「必须每次都遵守的约束」**。背景、原理、历史决策写进对应笔记，本文用链接指过去——指令文件越长，模型遵从度越低。

## 3. 语言与风格

- 默认中文对话、说明与文档；技术术语保留英文（Dataview、Ontology、Git、Reader 等）。
- 修改 Markdown 时保持原有写作风格、标题层级和链接格式；不要顺手「优化」措辞。
- 文件名可用中文或英文，优先遵循所在目录的既有命名。

## 4. Git 与路径约束（按实测配置写）

- **远端只有一个 `origin`**；本地分支 `main`，远端 `origin/main`。历史文档里的 `remote.github.push` refspec、`master → main` 映射**均已失效**。
- **没有定时备份**（2026-10-03 起计划任务与看板卡定时全部停用）：DSH 完成一批改动后**顺手提交并推送**，提交信息用描述性中文。不要指望兜底任务。
- 推送前 `git fetch` + `git pull --ff-only`；一旦分叉用 `git pull --rebase origin main` 再 push；**绝不 force push**（仅首次建仓例外）。
- 提交身份：本机 `user.email` 当前为 `haiyan.wu@zw.com`。若推送被 `GH007` 拒绝（GitHub 禁止命令行暴露隐私邮箱），临时改用 `384918+wuhy80@users.noreply.github.com`，**不要反过来先改全局配置**。
- 单文件不得超过 100 MB（GitHub 硬限制）。附件默认只发布图片类；PDF/压缩包/音视频不发布。
- `.gitignore` 实际排除：`_site/quartz/`、`_site/_reports/`、`.obsidian/`、`.smart-connections/`、`.smart-env/`、`.smtcmp_json_db/`、`.smtcmp_vector_db.tar.gz`、`.trash/`、`.claude/`、`.wrangler/`、`/temp_api_data.json`、`/openrouter_state_of_ai.html`。**不要假定私密目录被 `.gitignore` 保护**——它们已迁出，不是靠忽略规则兜底。
- **路径一律按脚本自身位置推导**（`scripts/` 的上一级），可用 `VAULT_DIR` / `SITE_ROOT` 覆盖；找不到就直接报错，**不回退到任何写死的旧路径**（猜错目录比报错危险）。
- 不要回滚、删除或覆盖用户已有改动，尤其是附件、大段新建内容和他人并发修改。
- 改动前先读目标文件；不要改自动生成产物与 `_reports/`。

## 5. 内容规范

### 5.1 存量保护（改旧文件时不许弄坏）

- 内部链接用 WikiLinks：`[[页面]]`、`[[页面|别名]]`、`[[页面#标题]]`、`[[页面#^块ID]]`、`![[附件名]]`；不要把内部链接改写成 URL 编码的 Markdown 路径。
- 保持 Callout（`> [!type]`，可折叠用 `+`/`-`）、块 ID `^id`、`%%注释%%`、脚注、数学公式、HTML 块、Mermaid、Tasks 行尾 metadata 原样。
- 保持 Dataview / DataviewJS / Templater / Charts 代码块语法，不按普通代码格式化。
- 重名或歧义时用 vault 相对路径（不含 `.md`，分隔符 `/`），例如 `[[大模型/11-知识管理/GBrain|GBrain]]`。
- 外部链接用标准 Markdown；不要把外部 URL 写成 WikiLink。
- `.canvas`、`.loom`、Excalidraw、插件生成的 JSON/Markdown **只读不改**，除非用户明确要求并理解格式。
- `Home.md` 与 `Home-分析面板.md` 的 Dataview、贡献图、标签云配置是仪表盘逻辑，改动要保住 fenced block、查询路径和插件字段。
- **表格单元格里的 WikiLink 别名必须写成 `\|`**：`| 列 | [[笔记\|别名]] |`。未转义会把链接切成两格，`scripts/export-public.ps1` 第 5.5 步校验不过会**直接中止构建**。图片嵌入同理（`![[图.png\|300]]`）。

### 5.2 新增内容约定

- **不再新建日记**（日记在私密库）；**不再新增 Templater 模板**、不再按模板建笔记——新笔记直接写正文 + frontmatter。
- frontmatter 是**入库元数据**：`tags / created / updated / source / status / type`，字段名英文小写。发布成功后由独立工作流灌入 Cloudflare D1（`scripts/build-d1-index.mjs`），缺字段或类型混乱会直接拉低 `/api/search` 质量。
- frontmatter 必须在首行、成对 `---`，合法 YAML；日期 `YYYY-MM-DD`；多值字段用 YAML 列表。
- frontmatter 里标签写 `技术/数据库`，正文标签才写 `#技术/数据库`；不要混入多余 `#`。
- 不要改变既有 frontmatter 字段的类型（列表↔字符串、日期↔自由文本）。
- 新笔记落位：技术类 `技术笔记/[技术]/[子主题]/`；跨学科且暂不分类 `技术笔记/无法归类/`（靠标签与内部链接补可发现性）。项目类内容属于私密库，不要在本库建 `专项项目/`。
- 适合长期沉淀的概念、人物、工具、主题，优先建 `[[内部链接]]`；引外部资料保留原始链接，集中列在 `## 参考资料` / `## 延伸阅读`。
- `网址收藏/` 条目统一 `- [名称](URL)：说明`，说明要讲清「是什么 + 特点/适用场景」，不要只写站名；新增前按 URL 与域名双重去重（`scripts/check-links.ps1`）。
- 重要判断、风险、结论用 Callout（`>[!summary]`、`>[!warning]`、`>[!note]`）。
- 附件用 `![[附件名]]`，默认放 `附件/`；新增前检查同名文件，不要凭文件名覆盖；保持 `#page=`、尺寸等参数。
- 任务用 `- [ ]` / `- [x]`；不要把普通列表写成任务列表。
- 避免过宽表格；代码/命令/查询用带语言标识的 fenced block。
- 不批量移动或重命名已有笔记；确需移动时先 `rg` 查旧名、`![[...]]`、`[[...]]`、Dataview 路径条件与 Canvas 引用。

## 6. 站点与发布流水线

| 组件 | 作用 |
|---|---|
| `.github/workflows/publish-site.yml` | 主链：`npm ci` → `check-bom` + `npm test` → `npm run reader:build` → 双语/Dataview 校验 → `wrangler pages deploy` → `verify-reader.mjs` → `prepare-site-mirror.mjs` 同步国内镜像（47.100.85.94） |
| `.github/workflows/sync-search-index.yml` | 发布成功后独立同步 D1 全文索引，可手动刷新语义向量 |
| `.github/workflows/cloudflare-secrets-sync.yml` | 同步 Cloudflare 密钥配置 |
| `.github/workflows/ai-daily-archive.yml` | 抓取 AI 早报 → 归档日报 → 聚合周报（每天 4 次） |
| `.github/workflows/gitleaks.yml` | 每次 push 扫密钥泄露 |
| `scripts/export-public.ps1` | 导出公开子集 + 脱敏 + 报表；`$PublicDirs` 定范围，`$ExcludeDirs` 是护栏 |
| `scripts/build-md-reader.mjs` / `preview-md-reader.mjs` | 构建阅读器站点；生成 `/static/vault-meta.json` 供 Dataview 渲染器用 |
| `scripts/reader/*` | 阅读器前端（`app.mjs`、`markdown.mjs`、`navigation.mjs`、`worker.mjs`、`layout.css`、`reader.css` 等） |
| `scripts/prepare-site-mirror.mjs` / `verify-reader.mjs` | 生成国内镜像产物；发布后校验线上站点 |
| `scripts/site-assets/*` | 阅读器注入件与内嵌 Demo（`dataview-lite.cjs`、`bilingual-reader.cjs`、`mobile-nav.cjs`） |
| `scripts/build-vocab.mjs` | 生成 `/static/vocab.json`（生词聚合页数据源） |
| `scripts/build-d1-index.mjs` / `build-embeddings.mjs` | D1 索引与语义搜索向量 |
| `scripts/check-bilingual.mjs` / `check-bom.mjs` / `check-links.ps1` | 双语格式、BOM、书签去重校验 |
| npm scripts | `test`（reader + indexing 单测）、`reader:build`、`reader:preview`、`reader:test`（Playwright） |

## 7. 平台与操作约束

- **`scripts/*.ps1` 必须保留 UTF-8 BOM**：Windows PowerShell 5.1 在无 BOM 时按 GBK 解码，脚本里的中文注释会让整个脚本解析失败（`Unexpected token '<乱码>'`）。改过 `.ps1` 后必须 `node scripts/check-bom.mjs` 复验——很多编辑器会把 BOM 悄悄吞掉。
- 本机 pwsh 为 **Windows PowerShell 5.1**；profile 补丁 `desktop\cordis.patch.yml` 把 shell 指向 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`，**这是承重墙，删掉会完全没有 shell 通道**。
- 本机在受限沙箱下 `pwsh` / `git` 会以 `0xC0000142`（DLL 初始化失败）启动失败，而 `cmd`、`node` 正常——这是环境限制，不是命令写错，需以 `danger-full-access` 运行。已排除 360 拦截、.NET 与原生之别、配置文件访问权三种假设。
- 编码：Markdown 一律 UTF-8；PowerShell 输出中文乱码时，`Get-Content -Encoding UTF8` 重读，并把 `$OutputEncoding` 与 `[Console]::OutputEncoding` 设为 UTF-8。
- 搜索优先 `rg` / `rg --files`；Windows 下注意中文路径编码。
- 最小必要修改；**不要对整库或整篇旧笔记跑通用 Markdown formatter**——它会改坏 WikiLinks、Callout、Dataview、嵌入和硬换行。

## 8. 操作原则

- 常规操作自行处理，不必反复确认：读文件、搜索、少量 Markdown 编辑、内容整理、格式校验、差异检查。
- 需要先问的高风险场景：删除或批量移动文件、改个人敏感信息、破坏性 Git 操作（`reset --hard`、`filter-repo`、force push）、安装依赖、越界网络访问。
- 对个人信息、账户、证书、财务记录保持谨慎，不在回复中暴露细节；涉及脱敏先看 `scripts/export-public.ps1` 的排除规则。
- Dataview 渲染器只支持本库现有方言（TABLE/LIST/TASK + FROM/WHERE/GROUP BY/SORT/LIMIT + `dateformat`/`date`/`length`/`max`/`min`；dataviewjs 支持 `pages`/`where`/`sort`/`groupBy`/`table`/`paragraph`/`header`）。**新增查询前先确认方言在支持范围内**，能用脚本生成纯 Markdown 列表就优先脚本。Obsidian 教学笔记（`技术笔记/编辑器/Obsidian/`）的查询块豁免渲染、保留原文。

## 9. 提交前自检

1. `node scripts/check-bom.mjs` —— 动过 `.ps1` 必跑。
2. `npm test` —— 改过 `scripts/reader/`、导出或索引逻辑必跑。
3. `node scripts/test-dataview-lite.mjs _site/md-reader/static/vault-meta.json _site/md-reader/notes` —— 改过 Dataview 查询或渲染器时跑（需先 `npm run reader:build`）。
4. `node scripts/check-bilingual.mjs _site/md-reader/notes/英语学习` —— 改过双语精读必跑。
5. 人工检查：frontmatter 分隔符成对、fenced block 成对、WikiLink 括号完整、Callout 引用符连续、表格内别名已转义、文件末尾有换行。
6. 最后再提交推送（见第 4 节）。
