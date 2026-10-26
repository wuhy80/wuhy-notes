// 知识库站点 API（Cloudflare Pages 高级模式 _worker.js）
//
// 部署时由 publish-site.ps1 拷进产物根目录，Pages 以「高级模式」运行：
//   · /api/* 由本文件处理：/api/search 查 D1 全文索引，/api/semantic-search
//     查向量索引（embeddings.json 静态资产 + Workers AI 向量化问题）
//   · 其余路径回源到静态资源（env.ASSETS），站点行为不变
//
// 接口：
//   GET /api/health                → { ok, db, vectors }
//   GET /api/search?q=关键词&limit=20 → FTS5 全文搜索（带高亮摘要）
//   GET /api/semantic-search?q=短句&limit=8 → 语义搜索（余弦相似度，向量来自
//     /embeddings.json，问题文本经 Workers AI @cf/baai/bge-m3 向量化）
//   GET /api/note?path=相对路径     → 取单篇全文
//
// 绑定要求：D1（变量名 DB）、Workers AI（变量名 AI）
//
// 本地/联调：
//   wrangler pages dev <产物目录> --d1 DB=<数据库名或id> --ai AI
//   （本文件无第三方依赖，不需要构建）

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const EMBED_MODEL = "@cf/baai/bge-m3";

// 向量索引的 isolate 级缓存：5~6MB JSON，首次请求载入，之后常驻内存
let vecCache = null;
let vecCachePromise = null;

async function loadVectors(env) {
  if (vecCache) return vecCache;
  if (!vecCachePromise) {
    vecCachePromise = (async () => {
      const res = await env.ASSETS.fetch(new Request("https://assets.local/embeddings.json"));
      if (!res.ok) throw new Error("embeddings.json 不存在（尚未生成向量索引）");
      const data = JSON.parse(await res.text());
      if (!data.model || data.model !== EMBED_MODEL) {
        throw new Error(`向量模型不匹配：索引是 ${data.model}，查询用 ${EMBED_MODEL}`);
      }
      vecCache = data;
      return data;
    })();
  }
  try {
    return await vecCachePromise;
  } catch (e) {
    vecCachePromise = null; // 允许下次重试（如先部署 worker 后补 embeddings.json）
    throw e;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health") {
        return json({ ok: true, db: Boolean(env.DB), ai: Boolean(env.AI), vectors: vecCache ? vecCache.docs.length : null, time: new Date().toISOString() });
      }
      if (url.pathname === "/api/search") return handleSearch(url, env);
      if (url.pathname === "/api/semantic-search") return handleSemanticSearch(url, env);
      if (url.pathname === "/api/note") return handleNote(url, env);
      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: String(e && e.message ? e.message : e) }, 500);
    }
  },
};

async function handleSemanticSearch(url, env) {
  if (!env.AI) return json({ error: "Workers AI 未绑定：需要在 Pages 项目设置里绑定名为 AI 的 AI binding" }, 500);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 8, 1), 25);
  if (!q) return json({ query: q, count: 0, results: [] });

  const index = await loadVectors(env);
  const qRes = await env.AI.run(EMBED_MODEL, { text: [q] });
  const qv = qRes?.data?.[0];
  if (!qv || !qv.length) return json({ error: "问题向量化失败" }, 502);

  // 向量在生成端已归一化，余弦相似度 = 点积；单遍扫描，千篇量级毫秒级
  const scored = [];
  for (const d of index.docs) {
    let dot = 0;
    const v = d.v;
    for (let i = 0; i < v.length; i++) dot += v[i] * qv[i];
    scored.push([d, dot]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  return json({
    query: q,
    model: EMBED_MODEL,
    count: Math.min(limit, scored.length),
    results: scored.slice(0, limit).map(([d, score]) => ({
      path: d.p,
      title: d.t,
      score: Math.round(score * 1000) / 1000,
    })),
  });
}

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
