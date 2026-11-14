# D1 知识库索引与 /api/search 配置指南

> 目标：让 wuhy-notes.pages.dev 在静态站点之外多出一组查询接口——
> 全库全文搜索（FTS5）、单篇取回、健康检查。数据随每次发布自动重建，
> 真相源仍然是本仓库的 Markdown，D1 只是「构建产物」。

## 架构

```
Markdown（真相源） ──push──▶ publish-site.yml
                              └─ Markdown 阅读器 + MD + API Worker → Pages
                          发布成功后 → sync-search-index.yml
                              └─ build-d1-index.mjs → D1（程序/AI 查）
```

## 一次性配置步骤（约 10 分钟，全部在 Cloudflare / GitHub 网页上）

1. **创建 D1 数据库**
   Cloudflare Dashboard → Storage & Databases → D1 → Create：
   - 数据库名：`wuhy-notes-kb`（必须一致，workflow 里写死了这个名字）
   - 地区选离用户近的（APAC）

2. **把 D1 绑定到 Pages 项目**
   Dashboard → Workers & Pages → `wuhy-notes` → Settings → Bindings → Add：
   - 类型：D1 database
   - Variable name：**`DB`**（必须一致，_worker.js 里用 env.DB 访问）
   - D1 database：选 `wuhy-notes-kb`
   - 环境选 Production（和 Preview 一起配更好）

3. **给仓库加一个 secret**
   GitHub → wuhy80/wuhy-notes → Settings → Secrets and variables → Actions：
   - Name：`D1_DATABASE_ID`
   - Value：D1 数据库详情页里的 Database ID（一串 UUID）
   - 该 token 需有 D1 写权限：如果现有 `CLOUDFLARE_API_TOKEN` 只授了 Pages Edit，
     到 Cloudflare → My Profile → API Tokens 给它追加 **D1 Edit** 权限

4. **触发一轮验证**
   手动运行「Sync search index」，或等待正式发布成功后自动触发，检查
   「同步全文索引到 D1」步骤；全文索引同步不阻塞阅读器上线。

5. **验收**
   ```bash
   curl "https://wuhy-notes.pages.dev/api/health"
   # 期望 {"ok":true,"db":true,...}
   curl "https://wuhy-notes.pages.dev/api/search?q=Transformer&limit=5"
   # 期望返回带 excerpt 高亮的搜索结果
   ```

## 日常

- 每次正式发布成功后，从该次公开产物同步索引；D1 同步失败可单独重跑，不影响站点阅读。
- 本地生成 SQL（不连远端）：`node scripts/build-d1-index.mjs --content <目录> --out d1-index.sql`
- 本地联调 API：`wrangler pages dev <产物目录> --d1 DB=wuhy-notes-kb`

## 接口一览

| 接口 | 说明 |
|---|---|
| `GET /api/health` | 健康检查，`db:true` 表示 D1 绑定正常，`ai:true` 表示 Workers AI 绑定正常 |
| `GET /api/search?q=词&limit=20` | FTS5 全文搜索，返回标题/标签/高亮摘要，limit ≤ 50 |
| `GET /api/semantic-search?q=短句&limit=8` | 语义搜索（向量余弦），适合「意思相近」的模糊提问，limit ≤ 25 |
| `GET /api/note?path=相对路径` | 取单篇笔记全文（含 frontmatter 字段） |

## 语义搜索（/api/semantic-search）

- 组件：`scripts/build-embeddings.mjs`（Workers AI `@cf/baai/bge-m3`，1024 维）+ `cloudflare/embeddings.json`（向量索引，随站点部署、isolate 内常驻内存）+ `_worker.js` 的余弦检索
- 为什么不用 Vectorize：千篇量级暴力余弦就是毫秒级，零费用零依赖；文档过万再迁移，届时只改 `_worker.js` 的检索函数
- 手动运行「Sync search index」并启用 refresh_vectors 才更新向量，正文发布复用已有向量；未变化的正文按哈希复用，修改、删除会更新索引。更新后自动提交向量并触发正式发布。
- CI 依赖：Token 需追加 **Workers AI → Edit** 权限；权限不足时手动向量刷新会明确失败，已部署的阅读器与全文搜索继续可用
- Pages 项目需绑定 Workers AI：变量名 **`AI`**（已通过 API 配置过；手工路径：Settings → Bindings → Add → AI → 变量名 AI）
- 验收：`curl "https://wuhy-notes.pages.dev/api/semantic-search?q=怎么发布新笔记"` → 返回最相关笔记与相似度分数
