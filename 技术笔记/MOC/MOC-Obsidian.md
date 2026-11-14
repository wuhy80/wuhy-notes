---
tags:
  - MOC
  - Obsidian
  - 知识管理
created: 2026-11-08
updated: 2026-11-08
type: MOC
---

# MOC-Obsidian

> [!abstract] 概述
> Obsidian 是本库的宿主工具，也是知识管理方法论的核心实体：`技术笔记/编辑器/Obsidian/` 15 篇技巧笔记、`template/` 8 个 Templater 模板、`大模型/11-知识管理/` 的工具对比、`大模型/08-个体重构/03-知识系统与第二大脑/` 的方法论，以及根目录 `Home.md` 仪表板与发布流水线（Quartz + Cloudflare，维护手册在 `docs/`）。注意：`技术笔记/Kubernetes/` 多篇笔记里的 "obsidian" 是腾讯云图床路径，属匹配噪声。

## 笔记索引

### 编辑器技巧（`技术笔记/编辑器/Obsidian/`）

- [[一些小技巧]]、[[一些的模板样式]]、[[如何调试遇到的Obsidian错误]]
- [[Obsidian callout使用]]、[[Mermaid图]]、[[图床使用]]
- [[结合豆瓣使用]] —— 书影数据入库
- `dataview使用/`：[[00 基础使用]]、[[01 一些查询的例子]]、[[02 metadata - 元数据]]
- `数学公式/`：[[如何使用数学公式]]；`绘图相关/`：[[00 Obsidian有哪些绘图功能]]

### 模板体系（`template/`，Templater 表达式须逐字符保留）

- `日志模板`、`周报模板`、`月报模板`、`年报模板`、`默认模板`、`豆瓣图书`、`软著说明书模板`、`templater_functions.js`（本地模板，未发布）

### 知识管理方法论（`大模型/11-知识管理/`、`08-个体重构/`）

- [[知识库方案对比]]、[[GBrain]]、[[LLMWiki]]、[[知识管理]]、[[深度研究与问题分析方法]]
- [[AI时代的第二大脑设计原则]]
- [[Claude Code + Obsidian 第二大脑实践]] —— AI 编辑器与 Obsidian 的结合（2026-10 起 ZCode 成为唯一编辑器）

### 发布站与双仓库（`docs/`、`技术笔记/版本管理/`）

- `docs/d1-search-setup.md` —— 发布站 D1 全文搜索搭建（仓库内维护文档，未发布）
- `技术笔记/版本管理/`：[[GIT使用]]、[[SVN使用]]

### 跨库关联

- `大模型/10-新闻/周报/` 与 `日报/` 的索引页使用 Dataview 语法的渲染方言（见库根 `AGENTS.md` 的维护模式说明）
- `Home.md` —— 本地仪表板（Dataview/贡献图/标签云配置，未发布）

## 待补链建议

> [!note] 口径说明
> 以下文件有 Obsidian/知识管理实质内容，但没有出链指向编辑器技巧或方法论笔记。仅建议，不代改。

- 技术笔记/版本管理/知识库双仓库拆分与多机同步.md —— 未链 [[知识库方案对比]] 或 [[GBrain]]
- 大模型/11-知识管理/GBrain.md、LLMWiki.md —— 未链 [[知识库方案对比]]
- 技术笔记/算法/算法学习导航.md —— 使用 Mermaid/Callout 但未链 [[Obsidian callout使用]] 或 [[Mermaid图]]
- 技术笔记/C++/Windows XP.md —— 提及笔记工具演进，可链 [[一些小技巧]]
- 网址收藏/软件类.md —— Obsidian 相关软件收藏未链 [[一些小技巧]]
- 读书笔记/人工智能 相关笔记 —— 第二大脑主题可链 [[AI时代的第二大脑设计原则]]
- docs/d1-search-setup.md —— 未链 [[知识库方案对比]]（搜索方案选型背景）

## 相关实体

- [[MOC-大模型]]（第二大脑与 AI 编辑器工作流）、[[MOC-Python]]（无直接关联，经 dataview 脚本间接）、[[MOC-算法与LeetCode]]（算法目录的 Obsidian 写作规范）
- Quartz/Cloudflare 发布站是 Obsidian 工作流的延伸，实体散布在 `scripts/`（非笔记）与 `docs/`，笔记量不足以单列 MOC
