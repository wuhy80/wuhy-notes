// 知识库站点 API（Cloudflare Pages 高级模式 _worker.js）
//
// 部署时由 publish-site.ps1 拷进产物根目录，Pages 以「高级模式」运行：
//   · /api/* 由本文件处理：/api/search 查 D1 全文索引，/api/semantic-search
//     查向量索引（embeddings.json 静态资产 + Workers AI 向量化问题）
//   · 其余路径回源到静态资源（env.ASSETS），站点行为不变
//
// 接口：
//   GET /api/health                → { ok, db, vectors }
//   GET /api/search?q=关键词&limit=20 → FTS5 全文搜索（带高亮摘要 + L0 概述
//     abstract：优先笔记的 [!abstract]，否则首段散文，由 build-d1-index.mjs 生成）
//   GET /api/semantic-search?q=短句&limit=8 → 语义搜索（余弦相似度，向量来自
//     /embeddings.json，问题文本经 Workers AI @cf/baai/bge-m3 向量化）
//   GET /api/note?path=相对路径     → 取单篇全文
//   GET /ask                       → 可视问答输入页
//   GET /api/visual-answer?q=问题  → 可视化回答页（卡片墙/时间线/标签图/类型环）。
//     LLM 分层：OPENCODE_API_KEY（opencode Go，deepseek-v4.1-flash）优先，
//     回退 Workers AI（需绑定 AI），都没有则纯检索渲染——每层只影响
//     「AI 答案区」的生成质量，四视图本身永远可用。LLM 调用有每 IP 限频。
//   POST /api/write-grade { text, words[] } → 英语写作批改（Workers AI LLM，
//     双语精读页的「输出练习」组件调用；AI 未绑定时客户端降级为复制提示词）
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
      if (url.pathname === "/api/write-grade") return handleWriteGrade(request, env);
      if (url.pathname === "/ask") return new Response(askPageHtml(), { headers: { "content-type": "text/html; charset=utf-8" } });
      if (url.pathname === "/api/visual-answer") return handleVisualAnswer(request, url, env);
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
    `SELECT n.path, n.title, n.tags, n.updated, n.abstract,
            snippet(notes_fts, 2, '<mark>', '</mark>', '…', 16) AS excerpt
       FROM notes_fts f JOIN notes n ON n.id = f.rowid
      WHERE notes_fts MATCH ?1
      ORDER BY (n.title LIKE '%' || ?3 || '%') DESC,
               bm25(notes_fts, 10.0, 5.0, 1.0)
      LIMIT ?2`,
  )
    .bind(match, limit, q)
    .all();
  return json({ query: q, count: results.length, results });
}

async function handleNote(url, env) {
  if (!env.DB) return json({ error: "D1 未绑定：需要在 Pages 项目设置里绑定名为 DB 的 D1 数据库" }, 500);
  const p = (url.searchParams.get("path") || "").trim();
  if (!p) return json({ error: "缺少 path 参数" }, 400);
  const row = await env.DB.prepare(
    "SELECT path, title, tags, type, status, source, created, updated, abstract, body FROM notes WHERE path = ?1",
  )
    .bind(p)
    .first();
  if (!row) return json({ error: "未找到该笔记", path: p }, 404);
  return json(row);
}

// /api/write-grade：英语写作批改（Workers AI LLM）。
// 模型可按需更换——Workers AI 上可用的 instruct 模型均可。
const GRADE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

async function handleWriteGrade(request, env) {
  if (!env.AI) return json({ error: "Workers AI 未绑定：需要在 Pages 项目设置里绑定名为 AI 的 AI binding" }, 500);
  if (request.method !== "POST") return json({ error: "仅支持 POST" }, 405);
  let body;
  try { body = await request.json(); } catch { return json({ error: "请求体必须是 JSON" }, 400); }
  const text = String(body.text || "").trim();
  const words = Array.isArray(body.words) ? body.words.map((w) => String(w)).slice(0, 12) : [];
  if (!text) return json({ error: "缺少 text（要批改的英文段落）" }, 400);
  if (text.length > 4000) return json({ error: "文本过长（上限 4000 字符）" }, 400);
  const sys =
    "You are a patient English writing coach for a Chinese learner (B2 level). " +
    "Grade the learner's short English paragraph. Reply in Chinese. " +
    "Structure: 1) 一句话总评；2) 逐条列出语法/搭配/用词问题并给出母语者改写；" +
    "3) 检查目标词汇是否用对；4) 一句鼓励结尾。Be specific and concrete; " +
    "never invent content the learner did not write.";
  const user =
    "目标词汇：" + (words.length ? words.join("、") : "（无）") + "\n\n学习者段落：\n" + text;
  const res = await env.AI.run(GRADE_MODEL, {
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    max_tokens: 1024,
  });
  const feedback = res && res.response ? String(res.response) : "";
  if (!feedback) return json({ error: "模型未返回内容" }, 502);
  return json({ feedback, model: GRADE_MODEL });
}

// ====== /ask 可视问答 ======
// 检索驱动的可视化回答。LLM 分层可用：
//   1) OPENCODE_API_KEY（Pages 环境变量，opencode Go 的 deepseek-v4.1-flash，中文最佳）
//   2) Workers AI 绑定（变量名 AI）
//   3) 都没有 → 纯检索渲染（四视图照常）
// LLM 输出 JSON 布局规格：{takeaway, bullets, featured, layout_hint}，
// 解析失败降级为纯文本结论。LLM 调用按 IP 限频 20 次/分钟。

const OPENCODE_BASE = "https://opencode.ai/inference/go/openai/v1";
const OPENCODE_MODEL = "deepseek-v4.1-flash";
const LLM_LIMIT_PER_MIN = 20;
const llmHits = new Map(); // isolate 级：ip -> [timestamp]

function llmAllowed(ip) {
  const now = Date.now();
  const arr = (llmHits.get(ip) || []).filter((t) => now - t < 60_000);
  if (arr.length >= LLM_LIMIT_PER_MIN) {
    llmHits.set(ip, arr);
    return false;
  }
  arr.push(now);
  llmHits.set(ip, arr);
  return true;
}

/** 分层 LLM：opencode 优先（失败自动重试一次），Workers AI 回退；都不可用返回 null */
async function llmComplete(env, messages, maxTokens) {
  if (env.OPENCODE_API_KEY) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(OPENCODE_BASE + "/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + env.OPENCODE_API_KEY,
            "User-Agent": "wuhy-notes-site/1.0 (visual-answer)",
            "x-opencode-session": "wuhy-notes-site-ask",
          },
          body: JSON.stringify({ model: OPENCODE_MODEL, temperature: 0.3, messages, max_tokens: maxTokens }),
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return { text: text.trim(), model: OPENCODE_MODEL };
        }
      } catch (e) {
        /* 重试或回退 */
      }
    }
  }
  if (env.AI) {
    try {
      const res = await env.AI.run(GRADE_MODEL, { messages, max_tokens: maxTokens });
      const text = res && res.response ? String(res.response).trim() : "";
      if (text) return { text, model: GRADE_MODEL };
    } catch (e) {
      /* 都不可用 */
    }
  }
  return null;
}

// 同问题的 LLM 布局规格缓存（isolate 级，30 分钟）：重复访问不再调用 LLM，
// 也让「偶发失败」只影响第一次
const specCache = new Map(); // key: q.toLowerCase() -> {spec, model, ts}
const SPEC_TTL = 30 * 60_000;

/** 解析 LLM 的 JSON 布局规格；失败则把整段文本当 takeaway */
function parseAnswerSpec(text) {
  let t = String(text).replace(/```(?:json)?/gi, "").trim();
  try {
    const obj = JSON.parse(t);
    if (obj && typeof obj.takeaway === "string") {
      return {
        takeaway: obj.takeaway,
        bullets: Array.isArray(obj.bullets) ? obj.bullets.filter((b) => typeof b === "string").slice(0, 4) : [],
        featured: Array.isArray(obj.featured) ? obj.featured.filter((p) => typeof p === "string").slice(0, 3) : [],
        layout: ["cards", "timeline", "graph", "donut"].includes(obj.layout_hint) ? obj.layout_hint : "cards",
      };
    }
  } catch {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try { return parseAnswerSpec(t.slice(s, e + 1)); } catch { /* fallthrough */ }
    }
  }
  return { takeaway: t, bullets: [], featured: [], layout: "cards" };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function askPageHtml() {
  const chips = ["KaiwuDB", "注意力评分", "双语精读", "DSH", "工人日报告诫我们", "OpenViking"].map(
    (c) => '<a class="chip" href="/api/visual-answer?q=' + encodeURIComponent(c) + '">' + escapeHtml(c) + "</a>"
  ).join("");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>问我的知识库 · wuhy-notes</title>
<style>
  body { background:#0f1115; color:#e6e6e6; font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
         display:flex; min-height:100vh; align-items:center; justify-content:center; margin:0; }
  .box { text-align:center; max-width:640px; padding:24px; }
  h1 { font-size:28px; margin:0 0 6px; } h1 span { color:#7aa2f7; }
  p.muted { color:#9aa0aa; margin:0 0 22px; }
  form { display:flex; gap:8px; }
  input { flex:1; background:#171a21; border:1px solid #2a2f3a; color:#e6e6e6; border-radius:10px;
          padding:13px 16px; font-size:16px; outline:none; }
  input:focus { border-color:#7aa2f7; }
  button { background:#7aa2f7; color:#0f1115; border:0; border-radius:10px; padding:0 22px;
           font-size:16px; font-weight:600; cursor:pointer; }
  .chips { margin-top:18px; display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
  a.chip { color:#9ab7ff; background:#171a21; border:1px solid #2a2f3a; border-radius:999px;
           padding:6px 14px; text-decoration:none; font-size:13px; }
  a.chip:hover { border-color:#7aa2f7; }
</style></head><body><div class="box">
<h1>问我的<span>知识库</span></h1>
<p class="muted">输入一个问题，得到一张可交互的回答页：卡片墙 · 时间线 · 标签图 · 类型分布</p>
<form action="/api/visual-answer" method="get">
  <input name="q" placeholder="比如：我记过哪些 KaiwuDB 的东西？" autofocus>
  <button>提问</button>
</form>
<div class="chips">${chips}</div>
</div></body></html>`;
}

async function handleVisualAnswer(request, url, env) {
  if (!env.DB) return json({ error: "D1 未绑定" }, 500);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return Response.redirect(new URL("/ask", url).toString(), 302);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 18, 1), 40);

  // ① FTS 全文召回（主通道，永远可用）。
  //    排序分层：标题命中 > 摘要命中 > 其余按 bm25（标题加权）——
  //    避免「索引页正文词频高反而压过真正的笔记」
  const match = `"${q.replace(/"/g, '""')}"`;
  const { results } = await env.DB.prepare(
    `SELECT n.path, n.title, n.tags, n.type, n.updated, n.abstract,
            snippet(notes_fts, 2, '『', '』', '…', 12) AS excerpt
       FROM notes_fts f JOIN notes n ON n.id = f.rowid
      WHERE notes_fts MATCH ?1
      ORDER BY (n.title LIKE '%' || ?3 || '%') DESC,
               (n.abstract LIKE '%' || ?3 || '%') DESC,
               bm25(notes_fts, 10.0, 5.0, 1.0)
      LIMIT ?2`,
  )
    .bind(match, limit, q)
    .all();

  let notes = (results || []).map((r, i) => ({
    p: r.path,
    t: r.title,
    tags: (r.tags || "").split(",").filter(Boolean),
    type: r.type || "",
    u: r.updated || "",
    abs: r.abstract || "",
    ex: (r.excerpt || "").replace(/\[\[|\]\]/g, ""),
    score: Math.max(0.05, 1 - i / Math.max(results.length, 1)),
  }));

  // ② 语义召回补充（Workers AI 绑定时；失败静默降级）
  let mode = "FTS 全文检索";
  if (env.AI) {
    try {
      const index = await loadVectors(env);
      const qRes = await env.AI.run(EMBED_MODEL, { text: [q] });
      const qv = qRes && qRes.data && qRes.data[0];
      if (qv && qv.length) {
        mode = "FTS + 语义向量";
        const have = new Set(notes.map((n) => n.p));
        const scored = [];
        for (const d of index.docs) {
          if (have.has(d.p)) continue;
          let dot = 0;
          const v = d.v;
          for (let i = 0; i < v.length; i++) dot += v[i] * qv[i];
          scored.push([d, dot]);
        }
        scored.sort((a, b) => b[1] - a[1]);
        const extra = scored.slice(0, 8).map(([d, cos]) => ({
          p: d.p, t: d.t, tags: [], type: "", u: "", abs: "", ex: "",
          score: Math.max(0.05, Math.min(1, (cos - 0.3) / 0.7)) * 0.85, sem: true,
        }));
        if (extra.length) {
          const ph = extra.map((_, i) => "?" + (i + 2)).join(",");
          const rows2 = await env.DB.prepare(
            `SELECT path, title, tags, type, updated, abstract FROM notes WHERE path IN (${ph})`
          )
            .bind(...extra.map((n) => n.p))
            .all();
          const byP = new Map((rows2.results || []).map((r) => [r.path, r]));
          for (const n of extra) {
            const r = byP.get(n.p);
            if (r) {
              n.tags = (r.tags || "").split(",").filter(Boolean);
              n.type = r.type || "";
              n.u = r.updated || "";
              n.abs = r.abstract || "";
            }
          }
          notes = notes.concat(extra.filter((n) => n.t));
          notes.sort((a, b) => b.score - a.score);
        }
      }
    } catch (e) {
      /* 语义召回失败不影响主流程 */
    }
  }

  // ③ LLM 答案设计（分层可用；每 IP 限频；无命中不调用；同问题 30 分钟内复用缓存）
  const ip = request.headers.get("CF-Connecting-IP") || "anon";
  const cacheKey = q.toLowerCase();
  const cachedSpec = specCache.get(cacheKey);
  let spec = null;
  let llmModel = "";
  if (cachedSpec && Date.now() - cachedSpec.ts < SPEC_TTL) {
    spec = cachedSpec.spec;
    llmModel = cachedSpec.model + "（缓存）";
  } else if (notes.length && llmAllowed(ip)) {
    const mat = notes
      .slice(0, 12)
      .map((n) => "path: " + n.p + "\n标题: " + n.t + "\n日期: " + (n.u || "无") + "\n摘要: " + (n.abs || n.ex || "无").slice(0, 150))
      .join("\n---\n");
    const res = await llmComplete(
      env,
      [
        {
          role: "system",
          content:
            "你是个人知识库的问答设计师。基于检索材料，输出 JSON（只输出 JSON，不要 Markdown）：\n" +
            '{"takeaway":"≤80字，直接回答问题","bullets":["≤40字的要点，0-4条"],"featured":["最值得先读的笔记path，最多3个，必须来自材料里的path"],"layout_hint":"cards|timeline|graph 之一"}\n' +
            "规则：只用材料中的信息，不编造；材料回答不了问题就如实说（takeaway 里说明），featured 给空数组。layout_hint 按问题性质选：问演化/时间选 timeline，问概念关联选 graph，其余 cards。",
        },
        { role: "user", content: "问题：" + q + "\n\n检索材料：\n" + mat },
      ],
      500
    );
    if (res) {
      spec = parseAnswerSpec(res.text);
      llmModel = res.model;
      specCache.set(cacheKey, { spec, model: res.model, ts: Date.now() });
      if (specCache.size > 200) {
        const oldest = [...specCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
        if (oldest) specCache.delete(oldest[0]);
      }
    }
  }

  // featured 置顶（保持组内分数序）
  const featSet = new Set(spec ? spec.featured : []);
  notes.sort((a, b) => (featSet.has(a.p) === featSet.has(b.p) ? b.score - a.score : featSet.has(a.p) ? -1 : 1));

  const dates = notes.map((n) => n.u).filter(Boolean).sort();
  const data = { q, mode, ai: Boolean(spec), layout: spec ? spec.layout : "cards", feat: spec ? spec.featured : [], notes };
  return new Response(buildAnswerHtml(q, data, spec, llmModel, mode, dates), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function buildAnswerHtml(q, data, spec, llmModel, mode, dates) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const esc = escapeHtml;
  const aiBlock = spec
    ? '<div class="ai"><div class="ai-t">✦ AI 答案 <span class="muted">(' + esc(llmModel) + ")</span></div>" +
      esc(spec.takeaway) +
      (spec.bullets.length ? "<ul>" + spec.bullets.map((b) => "<li>" + esc(b) + "</li>").join("") + "</ul>" : "") +
      "</div>"
    : "";
  const coverage = dates.length
    ? "命中 <b>" + data.notes.length + "</b> 篇 · 时间跨度 " + dates[0] + " ~ " + dates[dates.length - 1] + " · " + esc(mode)
    : "命中 <b>0</b> 篇 · " + esc(mode);

  const examples = data.notes.length ? "" : '<div class="none">没有命中的笔记——换个更短的关键词试试，比如「KaiwuDB」「注意力评分」。</div>';

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(q)} · 知识库可视问答</title>
<style>
  body { background:#0f1115; color:#e6e6e6; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; margin:0; }
  .wrap { max-width:960px; margin:0 auto; padding:28px 18px 60px; }
  .qbar { display:flex; gap:10px; margin-bottom:10px; }
  .qbar input { flex:1; background:#171a21; border:1px solid #2a2f3a; color:#e6e6e6; border-radius:10px; padding:11px 14px; font-size:15px; }
  .qbar button { background:#7aa2f7; border:0; color:#0f1115; border-radius:10px; padding:0 18px; font-weight:600; cursor:pointer; }
  .meta { color:#9aa0aa; font-size:13px; margin-bottom:16px; }
  .ai { background:#141a26; border:1px solid #2a3550; border-radius:12px; padding:14px 16px; margin-bottom:16px; line-height:1.7; }
  .ai-t { color:#7aa2f7; font-weight:700; margin-bottom:4px; font-size:13px; }
  .tabs { display:flex; gap:6px; border-bottom:1px solid #2a2f3a; margin-bottom:16px; flex-wrap:wrap; }
  .tab { padding:8px 14px; cursor:pointer; color:#9aa0aa; border-radius:8px 8px 0 0; font-size:14px; user-select:none; }
  .tab.on { color:#e6e6e6; background:#171a21; border:1px solid #2a2f3a; border-bottom-color:#171a21; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
  .card { background:#171a21; border:1px solid #2a2f3a; border-radius:12px; padding:13px 15px; cursor:pointer; }
  .card:hover { border-color:#7aa2f7; }
  .card-t { font-weight:600; margin-bottom:6px; line-height:1.45; }
  .score { color:#7aa2f7; font-size:12px; }
  .card-a { color:#b8bdc7; font-size:13px; line-height:1.6; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .card-m { color:#7d828c; font-size:12px; }
  .toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; align-items:center; }
  .toolbar input { background:#171a21; border:1px solid #2a2f3a; color:#e6e6e6; border-radius:8px; padding:7px 12px; font-size:13px; }
  .fchip { padding:4px 12px; border-radius:999px; border:1px solid #2a2f3a; color:#9ab7ff; font-size:12px; cursor:pointer; }
  .fchip.on { background:#7aa2f7; color:#0f1115; border-color:#7aa2f7; }
  .tl { border-left:2px solid #2a2f3a; margin-left:8px; padding-left:20px; }
  .tl-m { color:#7aa2f7; font-weight:700; margin:16px 0 8px; }
  .tl-i { background:#171a21; border:1px solid #2a2f3a; border-radius:10px; padding:10px 13px; margin-bottom:8px; cursor:pointer; }
  .tl-i:hover { border-color:#7aa2f7; }
  .tl-d { color:#7d828c; font-size:12px; }
  .muted { color:#7d828c; font-size:13px; }
  .none { color:#9aa0aa; padding:30px 0; text-align:center; }
  #modal { position:fixed; inset:0; background:rgba(0,0,0,.65); display:none; overflow:auto; padding:4vh 12px; z-index:9; }
  #modal .sheet { max-width:820px; margin:0 auto; background:#12151b; border:1px solid #2a2f3a; border-radius:14px; padding:22px 26px; }
  #modal h2 { margin-top:0; } #modal h3,h4 { color:#7aa2f7; }
  #modal pre { background:#0f1115; padding:10px 12px; border-radius:8px; overflow:auto; font-size:13px; }
  #modal code { background:#0f1115; padding:1px 5px; border-radius:4px; font-size:13px; }
  #modal blockquote { border-left:3px solid #2a2f3a; margin:8px 0; padding:2px 12px; color:#b8bdc7; }
  #modal li { margin:4px 0; } #modal a { color:#7aa2f7; }
  .close { float:right; cursor:pointer; color:#9aa0aa; font-size:22px; line-height:1; }
  .srclink { color:#7aa2f7; font-size:13px; text-decoration:none; margin-right:14px; }
</style></head><body><div class="wrap">
<div class="qbar"><form action="/api/visual-answer" method="get" style="display:flex;gap:10px;width:100%">
<input name="q" value="${esc(q)}"><button>再问</button></form></div>
<div class="meta">${coverage}</div>
${aiBlock}
${examples}
<div class="tabs">
  <div class="tab on" data-t="cards" onclick="showTab('cards')">📇 卡片墙</div>
  <div class="tab" data-t="timeline" onclick="showTab('timeline')">🕰 时间线</div>
  <div class="tab" data-t="graph" onclick="showTab('graph')">🕸 标签图</div>
  <div class="tab" data-t="donut" onclick="showTab('donut')">📊 类型分布</div>
</div>
<div id="cards" class="view">
  <div class="toolbar"><input id="filter" placeholder="在结果里过滤…" oninput="renderCards()">
  <span id="chips"></span></div>
  <div class="cards" id="cardlist"></div>
</div>
<div id="timeline" class="view" style="display:none"><div class="tl" id="tlbody"></div></div>
<div id="graph" class="view" style="display:none"><div id="tg-wrap"></div></div>
<div id="donut" class="view" style="display:none"><div id="donut-body"></div></div>
</div>
<div id="modal" onclick="if(event.target===this)closeModal()"><div class="sheet">
  <span class="close" onclick="closeModal()">×</span><div id="sheet-body"></div>
</div></div>
<script>
var DATA = ${json};
var state = { tag: "", type: "" };
function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function showTab(name) {
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) tabs[i].className = "tab" + (tabs[i].getAttribute("data-t") === name ? " on" : "");
  var views = document.querySelectorAll(".view");
  for (var j = 0; j < views.length; j++) views[j].style.display = views[j].id === name ? "" : "none";
  if (name === "graph") renderGraph();
  if (name === "donut") renderDonut();
}
function noteHref(p) { return "/" + encodeURIComponent(p.replace(/\\.md$/, "").toLowerCase().replace(/\\s+/g, "-")); }
function renderChips() {
  var freq = {};
  DATA.notes.forEach(function (n) { (n.tags || []).forEach(function (t) { freq[t] = (freq[t] || 0) + 1; }); });
  var names = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 8);
  var el = document.getElementById("chips");
  el.innerHTML = names.map(function (t) {
    return '<span class="fchip' + (state.tag === t ? " on" : "") + '" onclick="toggleTag(this,\\'' + esc(t).replace(/'/g, "\\\\'") + '\\')">' + esc(t) + " " + freq[t] + "</span>";
  }).join("");
}
function toggleTag(el, t) { state.tag = state.tag === t ? "" : t; renderChips(); renderCards(); }
function renderCards() {
  var f = (document.getElementById("filter").value || "").toLowerCase();
  var html = "";
  DATA.notes.forEach(function (n, i) {
    if (f && (n.t + " " + (n.tags || []).join(" ")).toLowerCase().indexOf(f) < 0) return;
    if (state.tag && (n.tags || []).indexOf(state.tag) < 0) return;
    if (state.type && (n.type || "未标注") !== state.type) return;
    html += '<div class="card" onclick="openNote(' + i + ')"><div class="card-t">' +
      ((DATA.feat || []).indexOf(n.p) >= 0 ? "★ " : "") + esc(n.t) +
      ' <span class="score">' + Math.round(n.score * 100) + "</span></div><div class=\"card-a\">" +
      esc(n.abs || n.ex || "（无摘要）") + '</div><div class="card-m">' + esc(n.u || "无日期") + " · " +
      esc((n.tags || []).slice(0, 3).join(" / ") || n.type || "未标注") + "</div></div>";
  });
  document.getElementById("cardlist").innerHTML = html || '<p class="none">没有匹配的笔记。</p>';
}
function renderTimeline() {
  var groups = {};
  DATA.notes.forEach(function (n, i) {
    var m = (n.u || "无日期").slice(0, 7) || "无日期";
    (groups[m] = groups[m] || []).push(i);
  });
  var months = Object.keys(groups).sort().reverse();
  var html = "";
  months.forEach(function (m) {
    html += '<div class="tl-m">' + (m === "无日期" ? "无日期" : m) + "</div>";
    groups[m].forEach(function (i) {
      var n = DATA.notes[i];
      html += '<div class="tl-i" onclick="openNote(' + i + ')"><div class="card-t">' + esc(n.t) +
        ' <span class="score">' + Math.round(n.score * 100) + "</span></div><div class=\"tl-d\">" +
        esc(n.u || "") + " · " + esc((n.abs || n.ex || "").slice(0, 90)) + "</div></div>";
    });
  });
  document.getElementById("tlbody").innerHTML = html || '<p class="none">无数据。</p>';
}
var graphDone = false;
function renderGraph() {
  if (graphDone) return; graphDone = true;
  var freq = {};
  DATA.notes.forEach(function (n) { (n.tags || []).forEach(function (t) { freq[t] = (freq[t] || 0) + 1; }); });
  var names = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 12);
  var wrap = document.getElementById("tg-wrap");
  if (names.length < 2) { wrap.innerHTML = '<p class="none">命中的标签太少，画不出图。</p>'; return; }
  var edges = [];
  for (var i = 0; i < names.length; i++) for (var j = i + 1; j < names.length; j++) {
    var co = 0;
    DATA.notes.forEach(function (n) { var ts = n.tags || []; if (ts.indexOf(names[i]) >= 0 && ts.indexOf(names[j]) >= 0) co++; });
    if (co > 0) edges.push([i, j, co]);
  }
  var W = 760, H = 440, cx = W / 2, cy = H / 2;
  var pos = names.map(function (t, i) { var a = 2 * Math.PI * i / names.length; return [cx + 170 * Math.cos(a), cy + 140 * Math.sin(a)]; });
  for (var it = 0; it < 200; it++) {
    for (var a = 0; a < pos.length; a++) for (var b = a + 1; b < pos.length; b++) {
      var dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1];
      var d = Math.sqrt(dx * dx + dy * dy) + 1;
      var f = Math.min(6, 2200 / (d * d));
      pos[a][0] += dx / d * f; pos[a][1] += dy / d * f;
      pos[b][0] -= dx / d * f; pos[b][1] -= dy / d * f;
    }
    pos = pos.map(function (p) { return [p[0] + (cx - p[0]) * 0.015, p[1] + (cy - p[1]) * 0.015]; });
    edges.forEach(function (e) {
      var p1 = pos[e[0]], p2 = pos[e[1]];
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      var d = Math.sqrt(dx * dx + dy * dy) + 1;
      var f = (d - 130) * 0.03;
      p1[0] += dx / d * f; p1[1] += dy / d * f;
      p2[0] -= dx / d * f; p2[1] -= dy / d * f;
    });
    pos = pos.map(function (p) { return [Math.max(56, Math.min(W - 56, p[0])), Math.max(44, Math.min(H - 44, p[1]))]; });
  }
  var svg = '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;background:#12151b;border:1px solid #2a2f3a;border-radius:12px">';
  edges.forEach(function (e) {
    svg += '<line x1="' + pos[e[0]][0] + '" y1="' + pos[e[0]][1] + '" x2="' + pos[e[1]][0] + '" y2="' + pos[e[1]][1] +
      '" stroke="#2a3550" stroke-width="' + Math.min(4, e[2]) + '" opacity="0.8"/>';
  });
  names.forEach(function (t, i) {
    var r = 7 + Math.min(14, freq[t] * 2);
    svg += '<circle cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="' + r + '" fill="#7aa2f7" opacity="0.9"/>' +
      '<text x="' + pos[i][0] + '" y="' + (pos[i][1] + r + 14) + '" text-anchor="middle" fill="#b8bdc7" font-size="12">' + esc(t) + "</text>";
  });
  wrap.innerHTML = svg + "</svg>" + '<p class="muted">节点大小 = 出现次数，连线粗细 = 共现强度（仅统计本次命中的笔记）。</p>';
}
var donutDone = false;
function renderDonut() {
  if (donutDone) return; donutDone = true;
  var counts = {};
  DATA.notes.forEach(function (n) { var t = n.type || "未标注"; counts[t] = (counts[t] || 0) + 1; });
  var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  var colors = ["#7aa2f7", "#9ece6a", "#f7768e", "#e0af68", "#bb9af7", "#4fd6be", "#c0caf5"];
  var acc = 0, segs = [], legend = [];
  keys.forEach(function (k, i) {
    var pct = (counts[k] / DATA.notes.length) * 100;
    segs.push(colors[i % colors.length] + " " + acc.toFixed(2) + "% " + (acc + pct).toFixed(2) + "%");
    acc += pct;
    legend.push('<span class="fchip" onclick="state.type=state.type===\\'' + esc(k).replace(/'/g, "\\\\'") + '\\'?\\'\\':\\'' + esc(k).replace(/'/g, "\\\\'") + '\\';renderCards();showTab(\\'cards\\')">' + esc(k) + " · " + counts[k] + "</span>");
  });
  document.getElementById("donut-body").innerHTML =
    '<div style="display:flex;gap:30px;align-items:center;flex-wrap:wrap">' +
    '<div style="width:200px;height:200px;border-radius:50%;background:conic-gradient(' + segs.join(",") + ')"></div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' + legend.join("") + "</div></div>" +
    '<p class="muted">点图例可按类型过滤卡片墙。</p>';
}
function mdLite(md) {
  var lines = String(md).split("\\n"); var out = []; var inCode = false; var buf = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (/^\`\`\`/.test(l)) {
      if (inCode) { out.push("<pre>" + esc(buf.join("\\n")) + "</pre>"); buf = []; }
      inCode = !inCode; continue;
    }
    if (inCode) { buf.push(l); continue; }
    if (/^#{1,4}\\s/.test(l)) { var lv = l.match(/^#+/)[0].length; out.push("<h" + (lv + 1) + ">" + inline(l.replace(/^#+\\s*/, "")) + "</h" + (lv + 1) + ">"); continue; }
    if (/^\\s*[-*]\\s/.test(l)) { out.push("<li>" + inline(l.replace(/^\\s*[-*]\\s*/, "")) + "</li>"); continue; }
    if (/^>\\s?/.test(l)) { out.push("<blockquote>" + inline(l.replace(/^>\\s?/, "")) + "</blockquote>"); continue; }
    if (/^\\s*$/.test(l)) continue;
    out.push("<p>" + inline(l) + "</p>");
  }
  return out.join("");
}
function inline(s) {
  s = esc(s);
  s = s.replace(/\\[([^\\]]*)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\\*\\*([^*]+)\\*\\*/g, "<b>$1</b>");
  s = s.replace(/\\*([^*]+)\\*/g, "<i>$1</i>");
  s = s.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
  s = s.replace(/\\[\\[([^\\]|]*\\|)?([^\\]]*)\\]\\]/g, "$2");
  return s;
}
function openNote(i) {
  var n = DATA.notes[i];
  document.getElementById("modal").style.display = "block";
  var body = document.getElementById("sheet-body");
  body.innerHTML = '<p class="muted">加载中…</p><h2>' + esc(n.t) + "</h2>";
  var links = '<p><a class="srclink" href="' + noteHref(n.p) + '" target="_blank" rel="noopener">在站点打开 ↗</a>' +
    '<a class="srclink" href="/api/note?path=' + encodeURIComponent(n.p) + '" target="_blank" rel="noopener">原始 JSON</a></p>';
  fetch("/api/note?path=" + encodeURIComponent(n.p))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      body.innerHTML = "<h2>" + esc(d.title || n.t) + '</h2>' + links +
        '<div class="muted">' + esc(d.updated || "") + " · " + esc(d.tags || "") + "</div>" +
        (d.body ? mdLite(d.body) : '<p class="none">未取到正文。</p>');
    })
    .catch(function () { body.innerHTML = "<p class='none'>加载失败。</p>"; });
}
function closeModal() { document.getElementById("modal").style.display = "none"; }
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
renderChips(); renderCards(); showTab(DATA.layout || "cards");
</script></body></html>`;
}
