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

**自托管 Git 同步**: `http://47.100.85.94:3000/wuhy80/obsidian.git` (Gitea 实例)

## 目录结构与组织

知识库按多个维度组织：

### 主要文件夹

- **我的日记/** - 按年/月组织的日常日志，包含自动生成的周报/月报/年报
- **技术笔记/** - 按技术分类的笔记：C++、Golang、Kubernetes、Linux、Python、Vue、数据库、网络等
- **专项项目/** - 工作项目：AI工作台、KaiwuDB、OAMMP、光闸、协议开发、网关任务等
- **大模型/** - LLM 研究：AutoGen、Text2SQL、本地部署、模型训练、论文学习
- **个人信息/** - 个人信息：银行、证书、设备购买记录
- **任务管理/** - 任务管理，使用 TaskInbox 工作流
- **template/** - Templater 模板库（见模板系统部分）
- **Clippings/** - 网页剪藏和保存的文章
- **Excalidraw/** - 可视化图表和草图
- **读书笔记/** - 读书笔记和阅读材料
- **网址收藏/** - 精选书签和网络资源

### 关键文件

- **Home.md** - 知识库仪表板，包含 Dataview 统计、贡献图、标签云和最近文件列表
- **我的任务.md** - 主要任务跟踪文件

## Git 工作流

### 自动备份

知识库使用 obsidian-git 插件进行自动提交：
- **快捷键**: `Ctrl+Q`（Home.md 文档中配置为 `Alt+Q`）提交并推送所有更改
- 自动提交定期运行，带时间戳："自动备份: YYYY-MM-DD HH:mm:ss"
- 家庭电脑的提交带有"家-"前缀

### Git 配置

**.gitignore 排除**:
- `.obsidian/workspace.json` - 用户特定的工作区状态
- `.obsidian/plugins/recent-files-obsidian/` - 最近文件缓存
- `.smart-connections/` - 向量数据库（因大小原因不版本控制）
- `/conflict-files-obsidian-git.md` - Git 冲突解决文件

**被跟踪的内容**:
- 所有 markdown 内容
- `.obsidian/` 配置（插件、主题、快捷键、设置）
- 模板文件
- `.smart-env/` 配置（AI 设置）

### 提交实践

提交更改时：
1. 内容更改使用描述性的中文提交信息
2. 自动备份格式："自动备份: YYYY-MM-DD HH:mm:ss"
3. 家庭电脑格式："家-自动备份: YYYY-MM-DD HH:mm:ss"
4. 使用标准 git 命令或 obsidian-git 插件

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
6. **Obsidian-git** - 自动 git 同步

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

- `Ctrl+Q` / `Alt+Q` - Git 提交并推送（obsidian-git）
- `Alt+Shift+Q` - 在文件资源管理器中显示活动文件
- `Ctrl+I` - QuickAdd capture_inbox
- `Ctrl+D` - 打开每日笔记
- `Ctrl+Shift+I` - 开发者工具（Electron 调试）

## 文件命名约定

### 日记
- 格式：`YYYY-MM-DD.md`
- 位置：`我的日记/YYYY/YYYY-MM/`
- 示例：`我的日记/2025/2025-03/2025-03-25.md`

### 周报
- 格式：`第N周.md`
- 位置：`我的日记/我的周报/YYYY/第N季/`
- 示例：`我的日记/我的周报/2024/第2季/第16周.md`

### 月报
- 格式：`MM.md`
- 位置：`我的日记/我的月报/YYYY/`
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
1. 使用 Calendar 插件或 `Ctrl+D`
2. 文件从 `template/日志模板.md` 自动创建
3. 从 Hitokoto API 获取名言
4. 使用页脚链接在日期之间导航

### 添加快速笔记
1. 按 `Ctrl+I` 触发 QuickAdd 捕获
2. 内容附加到 `Inbox/待整理.md`
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
- 让自动备份处理常规提交
- 重大更改手动提交
- 提交大文件前检查 `.gitignore`
- 向量数据库（`.smart-connections/`、`.smtcmp_vector_db.tar.gz`）按设计排除

## 故障排除

### 模板未应用
- 检查 Templater 设置中的文件夹模板配置
- 验证模板文件存在于 `template/` 文件夹中
- 检查超时设置（默认：5 秒）

### Git 冲突
- 检查 `conflict-files-obsidian-git.md` 进行冲突解决
- 手动解决或使用 obsidian-git 冲突解决

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
- 工作电脑的自动 git 提交："自动备份: [timestamp]"
- 家庭电脑的自动 git 提交："家-自动备份: [timestamp]"
- 自托管 Gitea 实例以实现完全控制
- 工作区状态（`.obsidian/workspace.json`）被排除以防止冲突

### AI 上下文管理
- 向量数据库存储嵌入以进行语义搜索
- Smart blocks（最小 200 字符）自动嵌入
- 排除的文件夹：`smart-chats/`
- 文件排除："Untitled"
- 数据库以 `.ajson` 格式存储在 `.smart-env/multi/` 中

### 性能考虑
- 总知识库大小：~291 MB
- 832+ markdown 文件
- 向量数据库压缩：4.2 MB
- Dataview 查询自动缓存
- 图片上传卸载到外部服务器
