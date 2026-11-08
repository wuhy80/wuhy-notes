#!/usr/bin/env node
// 知识库索引 → D1 导入 SQL 生成器
//
// 作用：把知识库的 Markdown 全量转成一份可被 `wrangler d1 execute --remote`
// 直接执行的 SQL 文件。发布流水线用它把全库灌进 Cloudflare D1（含 FTS5 全文
// 索引），供站点的 /api/search 查询。
//
// 设计要点：
//   · 零第三方依赖：frontmatter 用轻量解析器（只支持本库用到的形态：
//     `key: value` 与 `key:` + `- item` 列表），不引 YAML 库
//   · 全量重建式导入：SQL 里先 DROP 再建表再插入，天然幂等，跑几次结果一致
//   · 单条 INSERT 一篇笔记，正文截断到 50000 字符，保证每条语句远小于
//     D1 远程执行的单语句大小限制
//   · tags 统一折算成逗号分隔字符串，便于前端直接展示与 SQL LIKE
//
// 用法：
//   node scripts/build-d1-index.mjs [--content <目录>] [--out <sql文件>] [--exclude <目录名>]...
// 默认：--content = 当前目录，--out = d1-index.sql
// 默认排除：.git _site node_modules .github .trash template

import fs from "node:fs";
import path from "node:path";

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const ROOT = path.resolve(argValue("--content", process.cwd()));
const OUT = path.resolve(argValue("--out", path.join(process.cwd(), "d1-index.sql")));
const DEFAULT_EXCLUDES = new Set([".git", "_site", "node_modules", ".github", ".trash", "template"]);
const excludes = new Set(DEFAULT_EXCLUDES);
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "--exclude" && process.argv[i + 1]) excludes.add(process.argv[i + 1]);
}
const BODY_CAP = 50000;
const DRY_RUN = process.argv.includes("--dry-run");

// ---------- frontmatter 轻量解析 ----------

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let lastKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && lastKey) {
      if (!Array.isArray(meta[lastKey])) meta[lastKey] = [];
      meta[lastKey].push(stripQuotes(item[1].trim()));
      continue;
    }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      const v = kv[2].trim();
      meta[lastKey] = v === "" ? "" : stripQuotes(v);
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

function stripQuotes(v) {
  return /^".*"$/.test(v) || /^'.*'$/.test(v) ? v.slice(1, -1) : v;
}

function normalizeTags(meta) {
  const t = meta.tags;
  if (Array.isArray(t)) return t.join(",");
  return typeof t === "string" && t ? t : "";
}

// ---------- 摘要抽取（L0：先读摘要再读全文） ----------
//
// 优先取正文开头的 [!abstract] callout（本库概述惯例）；没有的退回首个
// 散文段落。统一剥离 Markdown 结构后截断到 300 字符，供 /api/search 结果
// 直接展示，免点开即可判断要不要读。

const ABSTRACT_CAP = 300;

function stripMarkdown(s) {
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [t](url) → t
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2") // [[a|b]] → b
    .replace(/[*_`~]/g, "")
    .replace(/(^|\s)#[\w/\-\u4e00-\u9fff]+/g, "$1") // 标签（含中文标签）
    .replace(/\s+/g, " ")
    .trim();
}

function extractAbstract(body) {
  const lines = body.split("\n");
  const abs = [];
  let inAbs = false;
  for (const l of lines) {
    if (/^>\s*\[!abstract\]/i.test(l)) {
      inAbs = true;
      // 去掉 marker 与纯标题词（如「概述」），保留同行的实质内容
      abs.push(
        l.replace(/^>\s*\[!abstract\]\s*/i, "").replace(/^(概述|概要|summary|说明)\s*[:：]?\s*/i, "")
      );
      continue;
    }
    if (inAbs) {
      if (!l.startsWith(">")) break;
      abs.push(l.replace(/^>\s?/, ""));
    }
  }
  let src = stripMarkdown(abs.join(" "));
  if (!src) {
    // 回退：跳过标题/callout/代码块/表格/嵌入行，取第一段散文
    const para = [];
    let inCode = false;
    for (const l of lines) {
      if (/^```/.test(l)) {
        inCode = !inCode;
        continue;
      }
      if (inCode) continue;
      if (/^(#{1,6}\s|>|!|\||---)/.test(l) || !l.trim()) {
        if (para.length) break;
        continue;
      }
      para.push(l.trim());
    }
    src = stripMarkdown(para.join(" "));
  }
  return src.length > ABSTRACT_CAP ? src.slice(0, ABSTRACT_CAP) + "…" : src;
}

// ---------- 收集与生成 ----------

function sqlEscape(s) {
  return "'" + String(s ?? "").replace(/'/g, "''") + "'";
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

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`内容目录不存在: ${ROOT}`);
    process.exit(1);
  }
  const files = walk(ROOT, []).sort();
  const rows = [];
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const { meta, body } = parseFrontmatter(text);
    let clean = body.replace(/\r\n/g, "\n").trim();
    if (clean.length > BODY_CAP) clean = clean.slice(0, BODY_CAP) + "\n\n<!-- 索引截断：超出 50000 字符 -->";
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    const titleMatch = clean.match(/^#\s+(.+)$/m);
    rows.push({
      path: rel,
      title: (meta.title || (titleMatch ? titleMatch[1].trim() : "") || path.basename(f, ".md")).trim(),
      tags: normalizeTags(meta),
      type: meta.type || "",
      status: meta.status || "",
      source: meta.source || "",
      created: meta.created || "",
      updated: meta.updated || "",
      abstract: extractAbstract(clean),
      body: clean,
    });
  }

  const parts = [
    "-- 由 scripts/build-d1-index.mjs 生成：全量重建式导入，可直接重复执行",
    "-- 注意：D1 远程执行不允许 BEGIN/COMMIT 语句，这里不用显式事务；",
    "-- 中途失败会留下半新半旧的数据，重跑本脚本即可自愈",
    "DROP TABLE IF EXISTS notes_fts;",
    "DROP TABLE IF EXISTS notes;",
    `CREATE TABLE notes (
  id       INTEGER PRIMARY KEY,
  path     TEXT UNIQUE,
  title    TEXT,
  tags     TEXT,
  type     TEXT,
  status   TEXT,
  source   TEXT,
  created  TEXT,
  updated  TEXT,
  abstract TEXT,
  body     TEXT);`,
    "CREATE VIRTUAL TABLE notes_fts USING fts5(title, tags, body);",
  ];

  // D1 单语句上限 100KB（UTF-8 字节），超长正文（如数小时访谈全文）分段写入：
  // 第一段随 INSERT 落库，后续段用 UPDATE ... || 逐段追加，全文照常可搜
  const STMT_LIMIT = 90_000;

  function utf8Chunks(s, maxBytes) {
    const chunks = [];
    let start = 0;
    while (start < s.length) {
      let end = s.length;
      let bytes = Buffer.byteLength(s.slice(start, end), "utf8");
      while (end > start && bytes > maxBytes) {
        end = start + Math.max(1, Math.floor(((end - start) * maxBytes) / bytes));
        bytes = Buffer.byteLength(s.slice(start, end), "utf8");
      }
      chunks.push(s.slice(start, end));
      start = end;
    }
    return chunks;
  }

  for (const r of rows) {
    const fields = [r.path, r.title, r.tags, r.type, r.status, r.source, r.created, r.updated, r.abstract]
      .map(sqlEscape)
      .join(",");
    // 固定开销（列名清单 + 逗号括号）+ 当前字段 + 正文，全部按转义后的 UTF-8 字节计
    const overhead =
      Buffer.byteLength(
        "INSERT INTO notes (path,title,tags,type,status,source,created,updated,abstract,body) VALUES (",
        "utf8"
      ) +
      Buffer.byteLength(fields, "utf8") +
      8;
    const chunks = utf8Chunks(r.body, STMT_LIMIT - overhead);
    parts.push(
      `INSERT INTO notes (path,title,tags,type,status,source,created,updated,abstract,body) VALUES (${fields},${sqlEscape(chunks[0])});`
    );
    for (let i = 1; i < chunks.length; i++) {
      parts.push(
        `UPDATE notes SET body = body || ${sqlEscape(chunks[i])} WHERE path = ${sqlEscape(r.path)};`
      );
    }
  }
  parts.push("INSERT INTO notes_fts(rowid,title,tags,body) SELECT id,title,tags,body FROM notes;");
  const sql = parts.join("\n") + "\n";

  if (DRY_RUN) {
    console.log(`[dry-run] 会生成 ${OUT}（${rows.length} 篇，SQL ${sql.length} 字节）`);
    return;
  }
  fs.writeFileSync(OUT, sql, "utf8");
  console.log(`索引完成：${rows.length} 篇笔记 → ${OUT}（SQL ${(sql.length / 1048576).toFixed(2)} MB）`);
}

main();
