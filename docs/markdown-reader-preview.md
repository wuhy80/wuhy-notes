---
tags:
  - 技术/知识管理
created: 2026-11-14
updated: 2026-11-14
status: active
type: guide
---

# Markdown 阅读站点

正式入口：https://wuhy-notes.pages.dev/

站点发布公开导出后的 Markdown，浏览器打开文章时才下载、解析当前正文并按需加载 JS 组件。构建阶段复制公开文件、生成目录索引并打包阅读器，不预渲染整站正文。Quartz 构建、主题包、OG 图生成和构建后 HTML 注入已移除。

## Windows 双击入口

- **start-reader.cmd**：首次安装依赖，导出公开笔记，启动 http://127.0.0.1:8790 并打开浏览器。保存笔记后自动更新与刷新；关闭窗口或按 Ctrl+C 停止服务。
- **deploy-reader.cmd**：快进同步 Git，校验并构建，提交公开笔记、已引用且无重名歧义的图片及阅读器代码，推送 main，等待正式发布并检查线上入口、目录和 MD 正文。

需要 Node.js 24、Git 和 GitHub CLI（gh），Git 推送凭据与 gh 登录需可用。脚本不混入已有暂存内容，不暂存编辑器、插件和缓存目录。本地预览与部署各用独立导出目录，可以同时运行。

```powershell
# 指定端口
start-reader.cmd --port 8793

# 自定义提交说明
deploy-reader.cmd --message "补充技术笔记"

# 只校验构建和预计提交范围，不同步、提交、推送或部署
deploy-reader.cmd --check
```

## 本地构建与验证

```powershell
npm ci
npm run reader:preview

# 只构建
npm run reader:build

# 完整重新导出
npm run reader:build -- --force-export

# 已有产物，只启动服务器
npm run reader:preview -- --skip-build

# 路由单测、浏览器回归与 Dataview 校验
npm test
npm run reader:test
node scripts/test-dataview-lite.mjs
```

浏览器测试使用已安装的 Playwright Chromium，也可用 READER_BROWSER 指定可执行文件。READER_TEST_URL 可指向本地服务或正式站点。

| 目录 | 用途 |
|---|---|
| _site/md-reader-export/content | 公开导出内容 |
| _site/md-reader-export/deploy | Windows 一键部署独用的导出与校验产物 |
| _site/md-reader | Pages 可部署产物 |
| _site/mirror | 国内静态镜像产物 |
| scripts/reader | 阅读器源码与测试 |

路径均从脚本位置推导，支持 VAULT_DIR / SITE_ROOT；构建器支持 --content / --out。输入必须是经过原公开导出规则筛选、脱敏的目录，不直接使用知识库根目录。

## 样式与功能

scripts/site-custom.scss 是颜色、字体、排版和四套皮肤的实现源；scripts/reader/layout.css 适配阅读器结构。scripts/reader/skin.html 在 CSS 加载前恢复皮肤偏好，沿用 gz-skin 与 theme 存储键。系统浅色默认瓷白，深色默认曜夜，也可选择纸墨、玄墨。

保留三栏布局、分区与卷导航、章节编号、移动目录、反向链接、关系图谱、阅读/源码切换和 MD 下载。兼容 WikiLinks、别名、章节与块嵌入、图片、折叠 Callout、代码高亮、任务、脚注、表格、KaTeX、Mermaid、Dataview、双语精读、生词本、课程测验、上下课卡片及动手实验。

旧文章 URL 继续解析到同一个阅读器；重名裸链接提示使用完整路径。正文按内容哈希请求，内存最多缓存 24 篇，不预下载全库。

> [!note] JavaScript 增强
> 普通 HTML 经过净化，笔记内的 script 不直接执行。交互演示通过独立 HTML 的 iframe 加载；可复用组件由阅读器按需加载。DataviewJS 沿用可信库内查询执行方式。

## 正式发布与搜索

唯一发布工作流为 publish-site.yml：main 的站点内容 push、日报归档完成、每日兜底或手动触发，导出并构建后部署到 Pages 的 main 分支。Windows 脚本优先等待 push 触发的运行，未触发时才补一次手动发布，避免重复部署。

sync-search-index.yml 在发布成功后独立同步 D1 全文索引，不阻塞阅读器上线。语义搜索使用已有 embeddings.json；需要更新时手动运行 Sync search index 并启用 refresh_vectors，按内容哈希复用未变向量，处理修改和删除，再提交向量并触发正式发布。D1、AI 和凭据配置见 [[docs/d1-search-setup|D1 配置说明]]。

国内镜像使用同一批 MD 与阅读器资源，为已知文章 URL 复制统一入口 HTML，不生成正文 HTML。镜像不上传 Pages Worker 和构建清单；搜索 API 指向正式站点，原有服务器认证继续生效。

本地预览代理公开只读搜索，接口暂不可用时降级为标题、路径和标签筛选；写作批改可降级为复制提示词。Canvas、Excalidraw、任意内联脚本不属于兼容范围。浏览器渲染依赖 JavaScript，搜索引擎和社交分享不再提供逐篇预渲染正文与 OG 图。
