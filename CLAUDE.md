# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 语言说明

**本知识库主要使用中文进行交互和文档编写**。Claude Code 在处理此仓库时应：
- 使用中文进行所有对话和说明
- 技术术语可保留英文（如 Dataview、Templater、Git 等）
- 代码注释优先使用中文
- 文件名可以是中文或英文

## 仓库概述

这是一个**中英双语的 Obsidian 个人知识管理库**，专注于技术文档、项目管理和日常记录。知识库通过 Templater、Dataview 和 QuickAdd 插件实现了复杂的自动化，并通过 Smart Composer 和本地 LLM (Ollama) 集成了 AI 功能。

> [!important] 本库已于 2026-10-01 拆分为两个 Git 仓库，2026-10-02 退用原自托管 Gitea
> - **本目录（主库）** → `https://github.com/wuhy80/obsidian-vault.git`（私有）
> - **私密库** `E:\Obsidian\wuhy80_private` → `https://github.com/wuhy80/obsidian-private.git`（私有）
> - 私密库内含：`我的日记/`、`个人信息/`、`投资管理/`、`专项项目/客户档案信息/`、`任务管理/`、`Inbox/`、`网址收藏/账号信息.md`
> - 完整背景、多机同步与故障处理见 [[技术笔记/版本管理/知识库双仓库拆分与多机同步]]

## 目录结构与组织

知识库按多个维度组织：

### 主要文件夹

- **技术笔记/** - 按技术分类的笔记：C++、Golang、Kubernetes、Linux、Python、Vue、数据库、网络等
- **专项项目/** - 工作项目：AI工作台、KaiwuDB、OAMMP、光闸、协议开发、网关任务等
- **大模型/** - LLM 研究：AutoGen、Text2SQL、本地部署、模型训练、论文学习
- **（已迁出本库）我的日记/、个人信息/、投资管理/、任务管理/、Inbox/** - 全部位于私密库 `E:\Obsidian\wuhy80_private`，本目录不再包含
- **template/** - Templater 模板库（见模板系统部分）
- **Clippings/** - 网页剪藏和保存的文章
- **Excalidraw/** - 可视化图表和草图
- **读书笔记/** - 读书笔记和阅读材料
- **网址收藏/** - 精选书签和网络资源

### 关键文件

- **Home.md** - 知识库仪表板，包含 Dataview 统计、贡献图、标签云和最近文件列表
- **我的任务.md** - 主要任务跟踪文件

## Git 工作流

### 自动同步（已不再使用 obsidian-git）

> [!warning] obsidian-git 插件已卸载
> 旧的 obsidian-git 自动备份自 2025-04 起就已失效（插件被卸载），现改用**独立脚本 + Windows 计划任务**。

- **脚本**：`scripts/backup-vaults.ps1`（一次运行同时处理主库与私密库）
- **计划任务**：`ObsidianVaultBackup`，每 30 分钟 + 每次登录触发
- **流程**：提交本地改动 → `git fetch` → `git pull --ff-only`（只接受快进）→ 推送到远程
- **日志**：`E:\Obsidian\_backup\backup.log`（超 1 MB 自动轮转）
- **手动执行**：`powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup-vaults.ps1`
- 提交信息格式沿用历史：主库 `自动备份: YYYY-MM-DD HH:mm:ss`，私密库 `私密备份: ...`

### Git 配置

- **提交邮箱统一为** `384918+wuhy80@users.noreply.github.com`
  原因：GitHub 账号开启了「阻止命令行推送暴露隐私邮箱」，用真实邮箱推送会被 `GH007` **确定性**拒绝
- **分支映射**：本地 `master` → 远端 `main`（由 `remote.github.push` 的 refspec 配置）+ `push.default=upstream`
- **禁止 force push**（仅首次建立仓库时例外）
- **改写历史前必须先禁用计划任务**：`Disable-ScheduledTask -TaskName ObsidianVaultBackup`，否则并发提交会打断 `filter-repo`

**.gitignore 排除**:
- `.obsidian/`（整个目录，避免插件内的密钥进入仓库）
- `.smart-connections/`、`.smart-env/`、`.smtcmp_json_db/`、`.smtcmp_vector_db.tar.gz`
- `.trash/`、`.claude/`
- 原有的私密路径规则仍保留作保险（目录已迁出）

### 提交实践

1. 内容更改使用描述性的中文提交信息
2. 自动备份格式：`自动备份: YYYY-MM-DD HH:mm:ss`
3. 使用 `scripts/backup-vaults.ps1` 或标准 git 命令；**不要**再依赖 obsidian-git

## 模板系统 (Templater)

### 配置

- **触发器**: 在配置的文件夹中创建文件时自动应用模板
- **默认模板**: `template/默认模板.md`
- **模板文件夹**: `template/`
- **超时**: 模板命令 5 秒超时

### 可用模板

1. **日志模板.md**（每日日记模板）
   - 从 Hitokoto API 获取随机名言（`https://v1.hitokoto.cn/?c=d&c=h&c=i&c=j`）
   - 自动填充 frontmatter 的日期、星期、时间
   - 包含任务跟踪部分（通过 tasks 插件）
   - Dataview 查询用于每周日记聚合和今日文章
   - 导航页脚：`<< [[昨天]] | [[明天]] >>`
   - 结构化部分：待办任务、今日处理事务记录、今日完成、本周日志

2. **周报模板.md**
   - 每周聚合结构

3. **月报模板.md**
   - 每月摘要结构

4. **年报模板.md**
   - 年度回顾结构

5. **默认模板.md**
   - 带日期/时间元数据的最小模板

6. **豆瓣图书.md**
   - 豆瓣（中国图书平台）内容的书评结构

### 创建新模板

模板使用 Templater 语法：
- `<% tp.file.creation_date("YYYY-MM-DD") %>` - 文件创建日期
- `<% tp.date.now("YYYY-MM-DD", -1) %>` - 相对日期
- `<%* ... -%>` - JavaScript 执行块，用于 API 调用
- Frontmatter 使用表情符号标记：`🌻日期🌻:`、`🌙星期🌙:`、`⌚️时间⌚️:`

## QuickAdd 宏系统

**主要捕获命令**: `Ctrl+I` 触发 `capture_inbox` → 捕获到 `Inbox/待整理.md`
（⚠️ `Inbox/` 已迁至私密库 `E:\Obsidian\wuhy80_private`。在主库触发会把内容写进已被 `.gitignore` 排除的目录，**不会进入备份**，请改用私密库）

### 可用的 Callout 宏（40+ 种类型）

快速插入标注块：
- 状态：`todo`、`doing`、`done`、`backlog`
- 重要性：`abstract`、`important`、`hint`、`idea`
- 上下文：`bug`、`danger`、`example`、`resources`、`note`
- 自定义：`BTC`、`money`、`coffee`、`world`、`translate`、`summary`、`TLDR`
- 结果：`info`、`success`、`conflict`

格式：`>[!callout-type] 标题`

## Dataview 查询

知识库广泛使用 Dataview 进行动态内容聚合。常见模式：

### 文件过滤
```javascript
dv.pages(`"我的日记"`) // 日记文件夹中的所有页面
dv.pages().filter(p => p.file.folder != "") // 排除根目录
```

### 基于日期的查询
```javascript
const pageDate = new Date(page.file.frontmatter["🌻日期🌻"]);
return pageDate >= startOfWeek && pageDate <= endOfWeek;
```

### 聚合
```javascript
dv.pages().groupBy(p => p.file.folder.split("/")[0]) // 按顶级文件夹分组
dv.pages().file.etags.distinct().length // 唯一标签计数
```

## 插件生态系统

### 核心插件（核心功能所需）

1. **Templater** - 带 JavaScript 执行的模板自动化
2. **Dataview** - 动态查询和数据可视化
3. **QuickAdd** - 快速捕获系统
4. **Calendar** - 日历导航
5. **Periodic Notes** - 日记/周报/月报自动化
6. ~~Obsidian-git~~（**已卸载**）— 自动同步改由 `scripts/backup-vaults.ps1` + 计划任务 `ObsidianVaultBackup` 负责

### AI 集成

- **Smart Composer** - AI 写作助手，使用 Ollama 后端
- **嵌入模型**: TaylorAI/bge-micro-v2（备用：Xenova/bge-small-en-v1.5）
- **Smart blocks**: 已启用（最小 200 字符用于嵌入）
- **向量数据库**: 存储在 `.smart-env/multi/`（不进行版本控制）

### 可视化插件

- **Contribution-graph** - Home.md 上的活动跟踪
- **Obsidian-charts** - 数据可视化
- **Tag-word-cloud** - Home.md 上的标签云
- **Obsidian-timeline** - 时间线视图
- **Obsidian-mind-map** - 思维导图
- **Excalidraw** - 矢量绘图

### 中文语言支持

- **Easy-typing** - 中文输入优化
- **Fuzzy-chinese-pinyin** - 基于拼音的模糊搜索
- **字体**: 霞鹜文楷（优雅的中文衬线字体）+ JetBrains Mono

## 快捷键

- （已移除）`Ctrl+Q` / `Alt+Q` — 原 obsidian-git 提交快捷键，插件已卸载
- `Alt+Shift+Q` - 在文件资源管理器中显示活动文件
- `Ctrl+I` - QuickAdd capture_inbox
- `Ctrl+D` - 打开每日笔记
- `Ctrl+Shift+I` - 开发者工具（Electron 调试）

## 文件命名约定

### 日记
- 格式：`YYYY-MM-DD.md`
- 位置：`我的日记/YYYY/YYYY-MM/`（**已迁至私密库** `E:\Obsidian\wuhy80_private`）
- 示例：`我的日记/2025/2025-03/2025-03-25.md`

### 周报
- 格式：`第N周.md`
- 位置：`我的日记/我的周报/YYYY/第N季/`（已迁至私密库）
- 示例：`我的日记/我的周报/2024/第2季/第16周.md`

### 月报
- 格式：`MM.md`
- 位置：`我的日记/我的月报/YYYY/`（已迁至私密库）
- 示例：`我的日记/我的月报/2024/03.md`

### 技术笔记
- 使用描述性的中文或英文名称
- 位置：`技术笔记/[技术]/[子主题]/`
- 示例：`技术笔记/Golang/GORM/如何重置数据库.md`

### 项目文档
- 位置：`专项项目/[项目名称]/`
- 使用带上下文的描述性名称
- 示例：`专项项目/OAMMP/告警中心/OMP告警设计.md`

## 常见任务

### 创建每日日记
> [!warning] 日记已在私密库
> 本库不再包含 `我的日记/`。请在私密库 `E:\Obsidian\wuhy80_private` 中创建日记（那边有完整的 `.obsidian/` 配置与模板），本库按 `Ctrl+D` 会生成到已被 `.gitignore` 排除的目录。

1. 在**私密库**中使用 Calendar 插件或 `Ctrl+D`
2. 文件从 `template/日志模板.md` 自动创建
3. 从 Hitokoto API 获取名言
4. 使用页脚链接在日期之间导航

### 添加快速笔记
1. 按 `Ctrl+I` 触发 QuickAdd 捕获
2. 内容附加到 `Inbox/待整理.md`（该目录在私密库中）
3. 定期处理收件箱到适当的文件夹

### 创建技术文档
1. 导航到 `技术笔记/[技术]/`
2. 使用描述性名称创建新文件
3. 使用带标签和元数据的 frontmatter
4. 使用 `[[WikiLinks]]` 链接到相关笔记

### 使用模板
1. 在配置了模板的文件夹中创建文件
2. 创建时模板自动应用
3. 填写模板部分
4. 对于自定义模板，添加到 `template/` 文件夹

## API 集成

### Hitokoto 名言 API
- 端点：`https://v1.hitokoto.cn/?c=d&c=h&c=i&c=j`
- 用于：每日日记模板
- 类别：诗词 (d)、哲学 (h)、影视 (i)、歌词 (j)
- 字段：`hitokoto`（名言）、`from`（来源）、`from_who`（作者）

### 图片上传
- 插件：obsidian-image-auto-upload
- 上传到自定义服务器
- 附件文件夹：`附件/`

## 主题

- **活动主题**: "moonstone"
- **CSS 主题**: "Border"
- **自定义代码片段**: `sidenote-callout`、`table-set`、`callout`
- **字体**:
  - 界面：霞鹜文楷, JetBrains Mono
  - 文本：霞鹜文楷
  - 等宽：JetBrains Mono

## 知识库统计与监控

**Home.md** 仪表板提供：
- 总文件数、日记条目、技术笔记
- 唯一标签计数
- 贡献图（最近 360 天）
- 标签云
- 按文件夹分布的饼图
- 最近文件（最近创建的 20 个）
- 按顶级文件夹的标签聚合

## 搜索与导航

### 文件资源管理器
- 自动显示当前文件：已启用
- 排序顺序：字母顺序

### 搜索策略
1. **拼音模糊搜索**: 使用 `Ctrl+O` 进行中文拼音模糊搜索
2. **标签搜索**: 在标签面板中点击标签或在搜索中使用 `#标签名`
3. **Dataview**: 使用 Dataview 查询进行复杂过滤
4. **关系图谱**: 可视化笔记之间的连接
5. **反向链接**: 检查反向链接面板查看相关笔记

## 最佳实践

### 内容组织
- **时间维度**: 使用日记记录时间绑定的信息
- **项目维度**: 将项目文档保存在 `专项项目/[项目名称]/`
- **主题维度**: 使用 `技术笔记/[技术]/` 进行学习和参考
- **专题维度**: 使用专用文件夹进行研究兴趣（如 `大模型/`）

### 链接策略
- 使用 `[[WikiLinks]]` 进行内部连接
- 使用别名添加上下文：`[[文件|显示文本]]`
- 引用特定标题：`[[文件#标题]]`
- 嵌入内容：`![[文件]]`

### 标签使用
- 使用层级标签：`#技术/Golang/并发`
- 组合时间标签：`#日记`、`#todo`
- 项目标签：`#OAMMP`、`#光闸`
- 状态标签：`#todo`、`#doing`、`#done`

### Git 卫生
- 常规提交交给计划任务 `ObsidianVaultBackup`（每 30 分钟），无需手动
- 重大更改可手动提交，提交信息用描述性中文
- 提交大文件前检查 `.gitignore`；单文件不得超过 100 MB（GitHub 硬限制）
- 向量数据库（`.smart-connections/`、`.smtcmp_vector_db.tar.gz`）按设计排除
- **绝不** `git push --force`（首次建立仓库除外）；分叉时按 `pull --rebase` 处理

## 故障排除

### 模板未应用
- 检查 Templater 设置中的文件夹模板配置
- 验证模板文件存在于 `template/` 文件夹中
- 检查超时设置（默认：5 秒）

### Git 分叉 / 冲突
- 自动脚本只接受快进（`pull --ff-only`）；一旦与其他机器分叉，它会在日志中写明「需人工处理」并**跳过推送**（不会自动合并）
- 手动处理：`git pull --rebase github main`，再 `git push`
- 详见 [[技术笔记/版本管理/知识库双仓库拆分与多机同步]]

### Dataview 查询不工作
- 验证 Dataview 插件已启用
- 在 Dataview 文档中检查查询语法
- 使用 frontmatter 表情符号标记：`🌻日期🌻`、`🌙星期🌙`、`⌚️时间⌚️`

### API 获取失败（Hitokoto）
- 检查互联网连接
- 验证 API 端点：`https://v1.hitokoto.cn`
- 如果 API 失败，模板将继续使用空名言

### Smart Composer 不工作
- 验证 Ollama 在本地运行
- 检查 `.smart-env/` 配置
- 确保嵌入模型已下载
- 如果需要，重建向量数据库

## 架构说明

### 多设备同步策略
- 统一使用 GitHub 私有仓库（原自托管 Gitea 已于 2026-10-02 退用）
- 每台机器各自运行同一份 `scripts/backup-vaults.ps1` + `ObsidianVaultBackup` 计划任务
- 换机器前先让当前机器同步一次；新机器先 `git clone`，并把 `user.email` 设为 noreply 地址
- 工作区状态（整个 `.obsidian/`）被排除以防止冲突

### AI 上下文管理
- 向量数据库存储嵌入以进行语义搜索
- Smart blocks（最小 200 字符）自动嵌入
- 排除的文件夹：`smart-chats/`
- 文件排除："Untitled"
- 数据库以 `.ajson` 格式存储在 `.smart-env/multi/` 中

### 性能考虑
- 主库工作区大小：约 416 MB（另有一个独立的私密库）
- git 跟踪文件：841 个（私密库另计）
- 向量数据库压缩：4.2 MB
- Dataview 查询自动缓存
- 图片上传卸载到外部服务器
