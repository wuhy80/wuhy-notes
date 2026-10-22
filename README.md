# wuhy-notes

个人 Obsidian 知识库的**公开镜像**（仓库名与在线阅读站点同名）：技术笔记、大模型资料、项目文档与 AI 新闻归档。站点由 [Quartz](https://github.com/jackyzha0/quartz) 构建并发布到 Cloudflare Pages。

[![站点发布](https://github.com/wuhy80/wuhy-notes/actions/workflows/publish-site.yml/badge.svg)](https://github.com/wuhy80/wuhy-notes/actions/workflows/publish-site.yml)
[![AI 早报归档](https://github.com/wuhy80/wuhy-notes/actions/workflows/ai-daily-archive.yml/badge.svg)](https://github.com/wuhy80/wuhy-notes/actions/workflows/ai-daily-archive.yml)
[![在线阅读](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E9%98%85%E8%AF%BB-wuhy--notes.pages.dev-2ea44f?logo=cloudflarepages&logoColor=white)](https://wuhy-notes.pages.dev/)

**[👉 在线阅读：https://wuhy-notes.pages.dev/](https://wuhy-notes.pages.dev/)**

## 内容速览

- **技术笔记**：Kubernetes、Linux、Python、数据库、网络、Golang、Rust 等
- **大模型**：LLM 应用开发、MCP、本地部署、论文学习，以及 [AI 早报日报](大模型/10-新闻/日报/00-日报索引.md)与[周报](大模型/10-新闻/周报/00-周报索引.md)归档
- **专项项目**：AI 工作台、Ontology、网关任务等工作资料
- **读书笔记 / 网址收藏**：阅读记录与常用站点

## 全自动化流水线

| Workflow | 作用 | 频率 |
|---|---|---|
| `ai-daily-archive.yml` | 抓取橘鸦 AI 早报 → 归档日报 → 从日报聚合周报 | 每天 4 次 |
| `publish-site.yml` | 导出公开子集（含脱敏）→ Quartz 构建 → 部署 Cloudflare Pages | 每天 1 次 |
| `gitleaks.yml` | 密钥泄露扫描 | 每次 push |

## 说明

- 日记、个人信息、任务管理等私密内容已迁出至独立的私有库，本仓库仅含可公开内容。
- 仓库为个人知识管理用途，内容版权归作者所有，未经许可请勿转载。
