---
tags:
  - 技术/知识管理
created: 2026-11-14
updated: 2026-11-14
status: preview
type: guide
---

# Markdown 阅读器预览

正文以公开导出后的 Markdown 文件发布，浏览器打开文章时才下载和解析当前 MD。构建阶段只复制文件、生成目录索引和打包阅读器，不生成整站正文 HTML。现有 Quartz 正式站点继续使用原发布流程，新阅读器先通过独立入口验证。

## Windows 双击入口

- **start-reader.cmd**：双击后安装首次运行所需依赖，导出公开笔记，启动 http://127.0.0.1:8790 并打开浏览器。保存笔记后自动重新导出、构建和刷新。关闭该窗口或按 Ctrl+C 即停止服务。
- **deploy-reader.cmd**：先快进同步 Git，运行校验与独立构建，再提交公开笔记、被引用且无重名歧义的图片和阅读器相关代码，推送当前 upstream，并触发预览部署。窗口会等待部署结果并显示访问链接。

部署入口要求已安装 Git、GitHub CLI（gh）和 Node.js，且 Git 推送凭据与 gh auth login 已配置。它不会暂存 .obsidian、.smart-env、.vscode、.zcode 等状态或配置目录，也不会混入原本已暂存的其他改动；若暂存区非空，会明确报错。未被公开笔记引用的附件保持原样，不自动提交。

端口占用时可以在终端运行 start-reader.cmd --port 8793。部署提交说明可以通过 deploy-reader.cmd --message "本次更新说明" 指定。

只校验与查看预计提交范围，可运行 deploy-reader.cmd --check；该模式不进行 Git 同步、提交、推送或部署。

## 与原站保持一致的样式

阅读器直接编译现有 scripts/site-custom.scss，复用原字体文件和 scripts/skin-switcher.cjs 的皮肤切换逻辑。保留原来的三栏布局、分区与卷导航、标题字号、章节编号、Callout、代码块、双语精读排版和手机端布局；scripts/reader/layout.css 仅适配新阅读器的页面结构。

四套皮肤继续使用「瓷白」「纸墨」「玄墨」「曜夜」，沿用 gz-skin 与 theme 浏览器偏好。系统浅色默认瓷白，深色默认曜夜。无需重新维护另一套配色或正文样式。

## 本地使用

在仓库根目录安装依赖并启动：

```powershell
npm ci
npm run reader:preview
```

打开终端输出的地址，默认是 http://127.0.0.1:8790 。脚本先调用原有公开导出器执行目录白名单、排除规则、脱敏和校验，然后生成阅读器并启动本地 HTTP 服务。

常用命令：

```powershell
# 只导出和构建，不启动服务
npm run reader:build

# 已构建后，只启动阅读器
npm run reader:preview -- --skip-build

# 复用已经检查过的公开导出目录，跳过导出
node scripts/build-md-reader.mjs --content _site/md-reader-export/content

# 单元测试与浏览器兼容性验证
npm test
npm run reader:test
```

浏览器测试需要本机已安装 Playwright Chromium，也可以通过 READER_BROWSER 环境变量指定 Chromium 可执行文件。若已有预览服务，可以设置 READER_TEST_URL，复用该服务执行测试。

默认目录按脚本所在位置推导：

| 目录 | 用途 |
|---|---|
| _site/md-reader-export/content | 沿用现有规则导出的公开内容 |
| _site/md-reader | 可部署的阅读器、MD、附件和索引 |
| scripts/reader | 阅读器源码、路径规则与测试 |

支持通过 VAULT_DIR、SITE_ROOT 传递导出器路径；阅读器构建器也接受 --content 和 --out。输入必须是公开导出的目录，不能直接传知识库根目录。不要使用未经筛选的目录替代公开导出。

## 已接入的能力

- 目录树、标题/路径/标签筛选、章节目录、反向链接、明暗主题和移动端目录。
- 阅读/源码切换，以及完整 MD 下载；源码取自脱敏后的发布副本。
- WikiLinks、别名、章节和块引用、笔记与章节嵌入、图片嵌入、可折叠与嵌套 Callout。
- 代码高亮、任务列表、脚注、表格；公式和 Mermaid 按文章需要加载。
- 复用现有 Dataview、双语精读、词卡、朗读、生词本和交互演示文件。
- 旧 Quartz 文章 URL、无扩展名地址及原始笔记路径映射。重名裸链接有歧义时显示提示，不随机选取目标。
- 全文搜索继续调用 /api/search；接口不可用时仍可查询本地标题、路径和标签。

> [!note] JavaScript 增强方式
> 内容中的普通 HTML 会经过净化，正文里的 script 不直接执行。交互演示使用 scripts/site-assets 下的独立 HTML 文件，通过 iframe 嵌入；可复用的增强功能由阅读器按需加载。DataviewJS 沿用现有的可信库内查询执行方式。

## 预览发布

GitHub Actions 新增手动工作流 **Publish Markdown reader preview**。它使用现有 Cloudflare 凭据，发布到同一 Pages 项目的 **markdown-preview** 分支，预期入口：

https://markdown-preview.wuhy-notes.pages.dev/

这条流程不构建 Quartz，不生成语义向量，不重建 D1，也不同步国内正式镜像。现有正式站点的 main 发布不受该工作流切换。

Pages 的 Preview 环境需要单独配置 DB 和 AI 绑定，才能在预览中使用现有全文搜索与 AI 接口；未配置时阅读、本地筛选、Dataview 和双语阅读仍可使用。本地预览只代理公开的只读搜索接口，写作批改降级为复制提示词。

## 构建与缓存

目录索引保存每篇笔记的内容哈希，正文请求携带版本号，避免文章更新后读取旧内容。读取过的正文保存在浏览器内存中，最多缓存 24 篇，不预下载全库。MD、目录索引和入口页面要求重新验证缓存，带内容哈希的 JS 模块允许长期缓存。

构建器只清理自己上一次清单中的过期文件，不清空用户目录；不移动或改写原始笔记。旧 URL 由 Pages Worker 解析后返回同一个阅读器，原始 MD 从 /notes/ 路径提供。

## 后续切换

预览通过后，再把正文发布入口切到阅读器，并将 D1、向量索引拆成独立工作流，按内容哈希处理新增、修改和删除。当前预览只复用现有搜索数据，不能据此声称已经完成索引增量更新。

浏览器渲染对无 JavaScript 的访问、搜索引擎收录和社交分享预览支持有限。若需要保留这些能力，可以只为首页、分区页和重点文章预渲染。Canvas、Excalidraw、Obsidian 未支持的插件块及任意内联脚本也不属于本轮兼容范围。
