#!/usr/bin/env node
// 知识库向量生成器 —— 调 Cloudflare Workers AI (@cf/baai/bge-m3, 1024 维) 把
// 每篇笔记向量化，输出 embeddings.json 供 _worker.js 做语义搜索。
//
// 为什么不用 Vectorize：知识库量级在千篇以内，Worker 启动时把全部向量载入
// 内存、查询时暴力算余弦（向量已归一化，余弦=点积）就是毫秒级，零费用零依赖；
// 量级上万再迁移 Vectorize，届时只改 _worker.js 的检索函数。
//
// 设计要点：
//   · 零第三方依赖：直接 fetch Workers AI REST API
//   · 凭据优先级：--token 参数 / 环境变量 CF_API_TOKEN / wrangler 登录的
//     OAuth token（scope 含 ai:write）
//   · 批量调用（默认 16 篇/次），429 退避重试
//   · 正文截断到 6000 字符（bge-m3 上下文 8192 token 的保守值）
//   · 输出向量归一化 + 保留 3 位小数（JSON 体积减半，余弦精度不受影响）
//
// 用法：
//   node scripts/build-embeddings.mjs --content <目录> --out <json文件> [--batch 16]
// 环境变量：CF_API_TOKEN / CF_ACCOUNT_ID（不设则回退 wrangler 配置）

import fs from "node:fs";
import path from "node:path";

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const ROOT = path.resolve(argValue("--content", process.cwd()));
const OUT = path.resolve(argValue("--out", path.join(process.cwd(), "embeddings.json")));
const MODEL = argValue("--model", "@cf/baai/bge-m3");
// 批次按「字符预算」组：模型单请求上下文 60k token，中文约 1 字符≈1 token，
// 留一倍安全余量；单批文档数同时封顶，避免单篇超长占满预算。
const BATCH_CHARS = Math.min(Math.max(Number(argValue("--batch-chars", 30000)), 4000), 50000);
const BATCH_MAX_DOCS = 32;
const BODY_CAP = 6000;
const DRY_RUN = process.argv.includes("--dry-run");

const ACCOUNT_ID =
  process.env.CF_ACCOUNT_ID || "1ff939df6fe444fa1fe21ed7d1b8caac";
let TOKEN = process.env.CF_API_TOKEN || "";
if (!TOKEN) {
  const cfg =
    process.env.CF_WRANGLER_CONFIG ||
    path.join(
      process.env.USERPROFILE || process.env.HOME || "",
      "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml",
    );
  try {
    const t = fs.readFileSync(cfg, "utf8").match(/^oauth_token\s*=\s*"([^"]+)"/m);
    if (t) TOKEN = t[1];
  } catch {}
}
if (!TOKEN && !DRY_RUN) {
  console.error("没有可用凭据：请设置 CF_API_TOKEN，或先 wrangler login");
  process.exit(1);
}

// ---------- 收集笔记（与 build-d1-index.mjs 同一套排除规则） ----------

const DEFAULT_EXCLUDES = new Set([".git", "_site", "node_modules", ".github", ".trash", "template"]);
const excludes = new Set(DEFAULT_EXCLUDES);
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "--exclude" && process.argv[i + 1]) excludes.add(process.argv[i + 1]);
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludes.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.toLowerCase().endsWith(".md")) out.push(p);
  }
  return out;
}

function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? text.slice(m[0].length) : text;
}

function normalize(v) {
  let sum = 0;
  for (const x of v) sum += x * x;
  const n = Math.sqrt(sum) || 1;
  return v.map((x) => Math.round((x / n) * 1000) / 1000);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: texts }),
      },
    );
    if (res.status === 429) {
      await sleep(5000 * attempt);
      continue;
    }
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Workers AI 失败 HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return data.result.data; // [[float...], ...]
  }
  throw new Error("429 重试次数用尽");
}

// 超限自适应：对半拆批递归重试；单篇仍超限则截断到 1500 字符兜底，再不行跳过
async function embedSafe(batch, warnings) {
  if (!batch.length) return [];
  try {
    return await embedBatch(batch.map((d) => d.text));
  } catch (e) {
    const retryable = /3030|Max context/i.test(e.message) && batch.length > 1;
    if (retryable) {
      const mid = Math.floor(batch.length / 2);
      const [a, b] = await Promise.all([
        embedSafe(batch.slice(0, mid), warnings),
        embedSafe(batch.slice(mid), warnings),
      ]);
      return [...a, ...b];
    }
    if (/3030|Max context/i.test(e.message)) {
      warnings.push(`跳过超限单篇：${batch[0].p}`);
      return batch.map(() => null);
    }
    throw e;
  }
}

async function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`内容目录不存在: ${ROOT}`);
    process.exit(1);
  }
  const files = walk(ROOT, []).sort();
  console.log(`待向量化 ${files.length} 篇（模型 ${MODEL}，字符预算 ${BATCH_CHARS}/批）`);
  if (DRY_RUN) return;

  // 断点续跑：输出文件已存在的路径直接跳过
  const out = fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : { model: MODEL, dim: null, generated: new Date().toISOString(), docs: [] };
  const doneSet = new Set(out.docs.map((d) => d.p));

  const docs = [];
  for (const f of files) {
    let text;
    try {
      text = stripFrontmatter(fs.readFileSync(f, "utf8")).replace(/\r\n/g, "\n").trim();
    } catch {
      continue;
    }
    if (!text) continue;
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    if (doneSet.has(rel)) continue;
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = (titleMatch ? titleMatch[1].trim() : "") || path.basename(f, ".md");
    docs.push({ p: rel, t: title, text: text.slice(0, BODY_CAP) });
  }
  if (out.docs.length) console.log(`断点续跑：已有 ${out.docs.length} 条，本次还需 ${docs.length} 篇`);

  // 按字符预算组批（中文 ≈1 字符 1 token，30000 字符远低于单请求 60k 上限）
  const batches = [];
  let cur = [], curChars = 0;
  for (const d of docs) {
    if (cur.length && (curChars + d.text.length > BATCH_CHARS || cur.length >= BATCH_MAX_DOCS)) {
      batches.push(cur);
      cur = []; curChars = 0;
    }
    cur.push(d);
    curChars += d.text.length;
  }
  if (cur.length) batches.push(cur);

  let done = out.docs.length;
  const warnings = [];
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const vectors = await embedSafe(batch, warnings);
    batch.forEach((d, j) => {
      if (!vectors[j]) return; // 超限被跳过的单篇
      const v = normalize(vectors[j] || []);
      if (!out.dim) out.dim = v.length;
      out.docs.push({ p: d.p, t: d.t, v });
    });
    done += batch.length;
    process.stdout.write(`  ${done}/${out.docs.length + docs.length}（批 ${bi + 1}/${batches.length}）\n`);
    // 每 10 批落盘一次：中断后可断点续跑（跳过的单篇重跑时还会再试）
    if ((bi + 1) % 10 === 0) fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
    if (bi + 1 < batches.length) await sleep(300);
  }
  for (const w of warnings) console.log("  ⚠ " + w);

  fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
  console.log(`完成：${out.docs.length} 条向量（${out.dim} 维）→ ${OUT}（${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB）`);
}

main().catch((e) => {
  console.error("失败:", e.message);
  process.exit(1);
});
