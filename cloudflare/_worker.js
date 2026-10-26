// 知识库站点 API（Cloudflare Pages 高级模式 _worker.js）
//
// 部署时由 publish-site.ps1 拷进产物根目录，Pages 以「高级模式」运行：
//   · /api/* 由本文件处理，直接查 D1（绑定名必须是 DB）
//   · 其余路径回源到静态资源（env.ASSETS），站点行为不变
//
// 接口：
//   GET /api/health              → { ok, db }（健康检查，验证 D1 绑定）
//   GET /api/search?q=关键词&limit=20 → 全文搜索（FTS5，带高亮摘要）
//   GET /api/note?path=相对路径       → 取单篇全文
//
// 本地/联调：
//   wrangler pages dev <产物目录> --d1 DB=<数据库名或id>
//   （本文件无第三方依赖，不需要构建）

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, db: Boolean(env.DB), time: new Date().toISOString() });
      }
      if (url.pathname === "/api/search") return handleSearch(url, env);
      if (url.pathname === "/api/note") return handleNote(url, env);
      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 500);
    }
  },
};

async function handleSearch(url, env) {
  if (!env.DB) return json({ error: "D1 未绑定：需要在 Pages 项目设置里绑定名为 DB 的 D1 数据库" }, 500);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 50);
  if (!q) return json({ query: q, count: 0, results: [] });

  // 用户输入整体按短语处理，内部双引号翻倍转义，避免 FTS5 语法报错
  const match = `"${q.replace(/"/g, '""')}"`;
  const { results } = await env.DB.prepare(
    `SELECT n.path, n.title, n.tags, n.updated,
            snippet(notes_fts, 2, '<mark>', '</mark>', '…', 16) AS excerpt
       FROM notes_fts f JOIN notes n ON n.id = f.rowid
      WHERE notes_fts MATCH ?1
      ORDER BY rank
      LIMIT ?2`,
  )
    .bind(match, limit)
    .all();
  return json({ query: q, count: results.length, results });
}

async function handleNote(url, env) {
  if (!env.DB) return json({ error: "D1 未绑定：需要在 Pages 项目设置里绑定名为 DB 的 D1 数据库" }, 500);
  const p = (url.searchParams.get("path") || "").trim();
  if (!p) return json({ error: "缺少 path 参数" }, 400);
  const row = await env.DB.prepare(
    "SELECT path, title, tags, type, status, source, created, updated, body FROM notes WHERE path = ?1",
  )
    .bind(p)
    .first();
  if (!row) return json({ error: "未找到该笔记", path: p }, 404);
  return json(row);
}
