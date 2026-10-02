# AGENTS.md

本文件为 Codex 在此 Obsidian 知识库中工作时提供指导。

## 语言与风格

- 默认使用中文进行对话、说明和文档编写。
- 技术术语可保留英文，例如 Dataview、Templater、QuickAdd、Git、Ollama。
- 修改 Markdown 内容时保持原有写作风格、标题层级和链接格式。
- 文件名可以使用中文或英文；优先遵循所在目录已有命名方式。

## 仓库概览

这是一个中英双语的 Obsidian 个人知识管理库，主要包含技术文档、项目资料、日常记录、任务管理和 LLM 研究内容。

主要目录：

- `我的日记/`：按年/月组织的日记、周报、月报、年报。
- `技术笔记/`：按技术分类的笔记，如 Kubernetes、Linux、Python、数据库、网络等。
- `专项项目/`：工作项目资料，如 AI 工作台、KaiwuDB、OAMMP、光闸、协议开发、网关任务等。
- `大模型/`：LLM、AutoGen、MCP、本地部署、模型训练、论文学习等资料。
- `Ontology/`：Palantir Ontology、资源模型、Action、权限治理和 Agent 应用资料。
- `个人信息/`：个人设备、证书、账户、购买记录等私密资料。
- `任务管理/`：任务管理与 TaskInbox 工作流。
- `template/`：Templater 模板。
- `Golang编程/`、`Rust编程/`、`编程语言/`：编程语言专题资料。
- `读书笔记/`、`网址收藏/`、`Clippings/`、`浏览剪切/`、`网络剪切/`：阅读、书签和网页剪藏。
- `附件/`：Obsidian 当前配置的默认附件目录。

关键文件：

- `Home.md`：知识库仪表板，包含 Dataview 统计、贡献图、标签云和最近文件。
- `我的任务.md`：主要任务跟踪文件。
- `CLAUDE.md`：更完整的历史协作说明，可作为本文件的补充参考。

## Git 与工作区约束

- 当前仓库由计划任务 `ObsidianVaultBackup` 配合 `scripts/backup-vaults.ps1` 自动同步到 GitHub 私有仓库（每 30 分钟 + 登录时）；提交信息多为中文时间戳格式。原自托管 Gitea 与 obsidian-git 插件均已停用。
- 不要回滚、删除或覆盖用户已有改动，尤其是大量 `.smart-env/`、日记、附件和个人信息变更。
- 执行修改前先确认目标文件内容，避免误改自动生成文件。
- 当前 `.gitignore` 已排除整个 `.obsidian/`、recent-files 相关路径和 `.smart-connections`；`.smart-env`、`.smtcmp_json_db` 等状态目录未必被排除，且历史上可能已有文件被跟踪，处理前必须以 `git check-ignore` / `git status` 和实际文件为准。
- 当前 `.gitignore` 实际排除了整个 `.obsidian/`；不要依据 `CLAUDE.md` 中“跟踪 `.obsidian/`”的历史描述修改 Git 规则。
- 如需提交，内容变更使用描述性的中文提交信息；除非用户明确要求，不主动提交或推送。

## Obsidian 内容规范

- 本仓库是 Obsidian vault，生成或整理文档时优先使用 Obsidian 友好的 Markdown，而不是通用网页文章格式。
- 内部笔记优先使用 WikiLinks：`[[页面]]`、`[[页面|别名]]`；不要把内部链接改写成 URL 编码的 Markdown 路径。
- 保持标题、块和嵌入链接：`[[页面#标题]]`、`[[页面#^块ID]]`、`![[页面#标题]]`、`![[附件名]]`。修改标题、块 ID 或文件名之前必须搜索引用方。
- WikiLink 目标存在重名或歧义时使用 vault 相对路径，例如 `[[大模型/11-知识管理/GBrain|GBrain]]`；路径不包含 `.md`，统一使用 `/`。
- 外部链接使用标准 Markdown 链接：`[标题](https://example.com)`。不要把外部 URL 写成 WikiLink。
- 保持 Obsidian Callout 格式：`> [!type] 标题`，后续内容继续使用 `>`；可折叠 Callout 使用 `> [!type]+` 或 `> [!type]-`。修改现有 Callout 时保持原文件的空格和嵌套风格。
- 保持 Dataview、DataviewJS、Templater、Tasks、Query、Charts 等插件代码块语法，不随意改写查询或把插件代码块当普通代码格式化。
- 保持 Obsidian 注释 `%% ... %%`、块 ID `^block-id`、脚注、数学公式、HTML 块和 Mermaid 代码块，不因通用 Markdown 格式化而破坏它们。
- 新建较完整的主题笔记时，优先添加简洁 frontmatter，例如 `tags`、`created`、`updated`、`source`、`status`；字段名保持英文小写，便于 Dataview 查询。
- Frontmatter 必须位于文件首行并由成对的 `---` 包围；使用合法 YAML，日期优先写成 `YYYY-MM-DD`，多值 `tags`、`aliases`、`source` 优先使用 YAML 列表。
- 不要随意改变既有 frontmatter 字段的类型，例如把列表改成字符串、把日期改成自由文本；新增字段前先检查同目录笔记和 `.obsidian/types.json` 中的属性约定。
- 标签使用 Obsidian 标签语法，如 `#技术/数据库`、`#大模型/论文`；避免在同一篇笔记中混用大量近义标签。
- Frontmatter 中的标签写作 `技术/数据库`，正文标签才写作 `#技术/数据库`；不要在 YAML `tags` 中混入不必要的 `#`。
- 适合沉淀为长期知识的概念、人物、项目、工具和主题，应优先使用 `[[内部链接]]` 连接到已有或潜在笔记；首次出现可使用 `[[页面|显示文本]]`。
- 引用外部资料时保留原始链接，优先使用 Markdown 链接；需要集中列出处时使用 `## 参考资料` 或 `## 延伸阅读`。
- 对重要判断、注意事项、风险和总结，优先使用 Obsidian callout，例如 `>[!summary]`、`>[!note]`、`>[!warning]`、`>[!question]`。
- 插入附件或图片时使用 Obsidian 嵌入语法 `![[附件名]]`；附件默认放入 `附件/` 或所在主题已有附件目录。
- 新增附件前检查是否存在同名文件，避免 `![[附件名]]` 解析到错误目标；不要仅凭文件名覆盖已有附件。
- 任务使用 Obsidian 任务语法 `- [ ]` / `- [x]`；不要把普通列表误写成任务列表。
- 已有 Tasks 插件任务中的日期、重复规则、优先级符号、块 ID和行尾 metadata 必须原样保留，除非任务本身就是修改目标。
- 表格可用于对比信息，但避免制作过宽表格；移动端或阅读视图不友好的内容优先改为分节列表。
- 代码、命令、配置和查询使用带语言标识的 fenced code block，例如 ```bash、```sql、```dataview。
- 新建日记遵循 `我的日记/YYYY/YYYY-MM/YYYY-MM-DD.md`。
- 新建技术笔记优先放入 `技术笔记/[技术]/[子主题]/`。
- 新建项目文档优先放入 `专项项目/[项目名称]/`。
- 新建跨学科、暂不明确分类的知识文档，可暂放 `技术笔记/无法归类/`，但应通过标签和内部链接增强可发现性。
- 不要随意改写已有笔记的标题层级、块引用、块 ID、脚注、嵌入链接或别名链接，避免破坏 Obsidian 反向链接和引用关系。

## 链接、重命名与附件

- 当前 Obsidian 配置启用了 `alwaysUpdateLinks`，但它只保证在 Obsidian 应用内重命名时更新链接；通过终端或补丁移动/重命名文件后，必须使用 `rg` 搜索旧文件名和旧路径并手动修复引用。
- 除非用户明确要求，不批量移动或重命名已有笔记。确需移动时，同时检查 WikiLinks、Markdown 链接、嵌入、Dataview 路径条件、Templater 脚本和 Canvas/Excalidraw 引用。
- 新建笔记前先搜索同名文件；Obsidian 允许不同目录同名，但裸 `[[页面]]` 可能产生歧义。
- 链接显示文本与目标分离：重命名显示文案时优先改别名部分，例如 `[[稳定目标|新的显示文本]]`，不要无意改变目标。
- 引用具体章节时使用真实标题文本；修改被引用标题后搜索 `#旧标题`。
- 附件链接可使用 `![[文件.pdf#page=3]]`、`![[图片.png|400]]` 等 Obsidian 语法，整理时保持页码、尺寸等参数。

## 特殊文件与插件内容

- `.canvas`、`.loom`、Excalidraw 文件和插件生成的 JSON/Markdown 属于结构化或半结构化数据，不按普通 Markdown 重排；除非用户明确要求并理解其格式，否则只读不改。
- Excalidraw Markdown 中的 frontmatter、压缩场景数据、`excalidraw-plugin` 字段和嵌入引用不可随意编辑。
- `Home.md` 中的 Dataview、贡献图、标签云和 Charts 配置属于仪表盘逻辑，修改时需保持 fenced code block、查询路径和插件字段。
- `template/` 中的 Templater 表达式和 JavaScript 执行块必须逐字符保留；不要自动转义 `<% ... %>`、改变 trim 标记 `<%*` / `-%>` 或格式化模板代码。
- `.smart-env/`、`.smart-connections/`、`.smtcmp_json_db/`、`.smtcmp_vector_db.tar.gz`、`.trash/` 和插件状态属于缓存、向量、运行状态或回收内容，默认不读取、不索引、不编辑。

## Markdown 编辑与校验

- 不对整库或整篇旧笔记运行通用 Markdown formatter；它可能改坏 WikiLinks、Callout、Tasks、Dataview、嵌入和硬换行。
- 编辑前后保持原文件换行风格和字符集；本库 Markdown 默认按 UTF-8 读取和写入。
- 新建或修改笔记后至少检查：frontmatter 分隔符成对、fenced code block 成对、WikiLink 括号完整、Callout 引用符连续、文件末尾有换行。
- 对新建的内部链接，优先用 `rg --files` 或文件搜索确认目标存在；有意创建的“未来链接”应在内容上明确，而不是由拼写错误产生。
- 涉及重命名、标题修改或附件移动时，使用 `rg` 检查旧名称、目标名称、`![[...]]` 和 `[[...]]` 的引用。
- 不把 Markdown 检查工具的通用规范凌驾于 Obsidian 语法；只修复确实影响 Obsidian 解析或阅读的错误。

## 模板与自动化

- 默认模板目录是 `template/`。
- 常用模板包括 `日志模板.md`、`周报模板.md`、`月报模板.md`、`年报模板.md`、`默认模板.md`、`豆瓣图书.md`。
- Templater 语法示例：
  - `<% tp.file.creation_date("YYYY-MM-DD") %>`
  - `<% tp.date.now("YYYY-MM-DD", -1) %>`
  - `<%* ... -%>`
- 日记 frontmatter 可能使用表情符号字段，如 `🌻日期🌻`、`🌙星期🌙`、`⌚️时间⌚️`。

## 操作原则

- 优先做最小必要修改，避免批量格式化整个笔记库。
- 普通常规操作由 Codex 自行处理，不需要反复人工确认，包括工作区内的文件读取、搜索、少量 Markdown 编辑、内容整理、格式校验和差异检查。
- 仅在高风险或平台强制授权场景再向用户确认，例如网络访问、安装依赖、删除或批量移动文件、改动个人敏感信息、执行破坏性 Git 操作、提交/推送代码，或沙箱限制导致必须请求提升权限。
- 对个人信息、账户、证书、财务记录等内容保持谨慎，不在最终回复中暴露敏感细节。
- 搜索文件时优先使用 `rg` / `rg --files`；Windows PowerShell 环境下注意中文路径编码。
- 如果 PowerShell 输出乱码，使用 `Get-Content -Encoding UTF8` 重新读取。
- PowerShell 输出中文文件名乱码时，同时设置 `$OutputEncoding` 和 `[Console]::OutputEncoding` 为 UTF-8 后再读取。
- 对自动生成缓存、向量数据、插件状态文件的修改需谨慎，除非用户明确要求。
