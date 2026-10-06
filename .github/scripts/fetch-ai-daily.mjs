#!/usr/bin/env node
// 橘鸦 AI 早报归档 —— 幂等回补
//
// 设计要点：
//   · 幂等：已存在的期直接跳过，同一天跑多次结果一致
//   · 收敛型：扫描最近 WINDOW_DAYS 天，缺哪期补哪期；不假设"今天就是要抓的那天"
//   · 先查本地再发请求：已存在就不发 HTTP，追平后一次网络请求都不发
//   · 单次最多写 MAX_PER_RUN 期（从最近往前补），防止一次跑太久
//   · 不调用任何 AI：原文自带的「概览」小节提升为 summary callout，无需 API Key
//
// 用法：node .github/scripts/fetch-ai-daily.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const REPO = process.env.GITHUB_WORKSPACE || process.cwd();
const DAILY_ROOT = path.join(REPO, "大模型", "10-新闻", "日报");
const BASE = "https://daily.juya.uk";
// 可用环境变量覆盖：WINDOW_DAYS=90 MAX_PER_RUN=30
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 30);
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 14);
const DRY_RUN = process.argv.includes("--dry-run");

// ---------- 工具 ----------

/** 北京时间（UTC+8）的今天，格式 YYYY-MM-DD */
function beijingToday() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 生成 [start, end] 之间的所有日期（含两端），倒序（最近在前） */
function datesDescending(end, days) {
  const out = [];
  const endMs = Date.parse(end + "T00:00:00Z");
  for (let i = 0; i < days; i++) {
    out.push(new Date(endMs - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function notePath(date) {
  const y = date.slice(0, 4);
  const ym = date.slice(0, 7);
  return path.join(DAILY_ROOT, y, ym, `${date} AI 早报.md`);
}

function monthIndexPath(ym) {
  const y = ym.slice(0, 4);
  return path.join(DAILY_ROOT, y, ym, `00-${ym} 月索引.md`);
}

function yearIndexPath(y) {
  return path.join(DAILY_ROOT, y, `00-${y} 年索引.md`);
}

function writeFile(p, content) {
  if (DRY_RUN) {
    console.log(`  [dry-run] 会写入 ${path.relative(REPO, p)}`);
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

// ---------- 抓取 ----------

async function fetchIssue(date) {
  const url = `${BASE}/markdown/${date}.md`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return { ok: false, status: res.status };
    const text = await res.text();
    if (!text.trim()) return { ok: false, status: 200, empty: true };
    return { ok: true, text };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

// ---------- 排版 ----------

/** 把原文的「概览」小节提升为 callout，并从正文里移除，避免重复 */
function splitOverview(raw) {
  const marker = "## 概览";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { overview: null, body: raw };

  const after = raw.slice(idx + marker.length);
  // 概览小节到下一个分隔线（---）为止
  const endRel = after.search(/\n-{3,}\s*\n/);
  if (endRel === -1) return { overview: null, body: raw };

  const overview = after.slice(0, endRel).trim();
  const rest = after.slice(endRel).replace(/^\n-{3,}\s*\n/, "");
  const body = (raw.slice(0, idx) + rest).trim();
  return { overview, body };
}

/** 概览 → callout 行 */
function toCallout(overview) {
  return overview
    .split("\n")
    .map((l) => {
      const h = l.match(/^#{3,6}\s+(.*)$/);
      if (h) return "> **" + h[1].trim() + "**";
      return l.trim() ? "> " + l : ">";
    })
    .join("\n");
}

function buildNote(date, raw) {
  const { overview, body } = splitOverview(raw);
  // 去掉正文里原有的 H1（我们已经自己写了一个），并收敛多余空行
  const bodyNoH1 = body
    .replace(/^#\s+.*$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fm = [
    "---",
    "tags:",
    "  - 大模型/新闻",
    "  - AI早报",
    "  - 日报",
    "type: ai-daily",
    `created: ${date}`,
    `updated: ${date}`,
    "status: 已归档",
    `source: ${BASE}/issues/${date}/`,
    "---",
    "",
    `# ${date} AI 早报`,
    "",
  ].join("\n");

  const summary = overview
    ? `> [!summary] 本期要点（摘自原早报「概览」）\n${toCallout(overview)}\n\n---\n\n`
    : "";

  return fm + "\n" + summary + bodyNoH1 + "\n";
}

// ---------- 索引模板 ----------

function monthIndexContent(ym, count) {
  const y = ym.slice(0, 4);
  const mm = Number(ym.slice(5));
  return `---
tags:
  - 大模型/新闻
  - 大模型/索引
type: ai-daily-index
level: month
month: ${ym}
created: ${beijingToday()}
updated: ${beijingToday()}
status: 持续更新
---

# ${ym} AI 早报索引

> [!summary] 范围
> ${y} 年 ${mm} 月的每日 AI 早报。
> 上级索引：[[大模型/10-新闻/日报/${y}/00-${y} 年索引|${y} 年索引]]

## 本月日报

\`\`\`dataview
TABLE WITHOUT ID
  file.link AS "日报",
  dateformat(created, "MM-dd") AS "日期",
  status AS "状态"
FROM "大模型/10-新闻/日报/${y}/${ym}"
WHERE type = "ai-daily"
SORT created DESC
\`\`\`
`;
}

function yearIndexContent(y) {
  return `---
tags:
  - 大模型/新闻
  - 大模型/索引
type: ai-daily-index
level: year
year: ${y}
created: ${beijingToday()}
updated: ${beijingToday()}
status: 持续更新
---

# ${y} 年 AI 早报索引

> [!summary] 范围
> ${y} 年的每日 AI 早报，按月归档。
> 上级索引：[[大模型/10-新闻/日报/00-日报索引|日报索引]]

## 月份汇总

\`\`\`dataview
TABLE WITHOUT ID
  key AS "月份",
  length(rows) AS "期数",
  dateformat(min(rows.created), "MM-dd") AS "首期",
  dateformat(max(rows.created), "MM-dd") AS "最新"
FROM "大模型/10-新闻/日报/${y}"
WHERE type = "ai-daily"
GROUP BY dateformat(created, "yyyy-MM")
SORT key DESC
\`\`\`

## 月索引页

\`\`\`dataview
LIST
FROM "大模型/10-新闻/日报/${y}"
WHERE type = "ai-daily-index" AND level = "month"
SORT file.name DESC
\`\`\`

## 最近 30 期

\`\`\`dataview
TABLE WITHOUT ID
  file.link AS "日报",
  dateformat(created, "MM-dd") AS "日期",
  status AS "状态"
FROM "大模型/10-新闻/日报/${y}"
WHERE type = "ai-daily"
SORT created DESC
LIMIT 30
\`\`\`
`;
}

// ---------- 主流程 ----------

async function main() {
  const today = beijingToday();
  const dates = datesDescending(today, WINDOW_DAYS);
  console.log(`扫描窗口: ${dates[dates.length - 1]} ~ ${today}（${WINDOW_DAYS} 天，最近优先）`);
  if (DRY_RUN) console.log("模式: dry-run（不写盘）");
  console.log("");

  const missing = dates.filter((d) => !fs.existsSync(notePath(d)));
  console.log(`窗口内缺失 ${missing.length} 期，单次上限 ${MAX_PER_RUN} 期`);
  console.log("");

  const written = [];
  const skippedNoIssue = [];
  const failed = [];

  for (const date of missing) {
    if (written.length >= MAX_PER_RUN) break;

    const r = await fetchIssue(date);
    if (!r.ok) {
      if (r.status === 404) {
        skippedNoIssue.push(date);
        console.log(`  ${date}  无发布（HTTP 404），跳过`);
      } else {
        failed.push(date);
        console.log(`  ${date}  抓取失败：${r.error || "HTTP " + r.status}`);
      }
      continue;
    }

    const note = buildNote(date, r.text);
    writeFile(notePath(date), note);

    const ym = date.slice(0, 7);
    const y = date.slice(0, 4);
    if (!fs.existsSync(monthIndexPath(ym))) {
      writeFile(monthIndexPath(ym), monthIndexContent(ym, 0));
      console.log(`  + 新建月索引 00-${ym} 月索引.md`);
    }
    if (!fs.existsSync(yearIndexPath(y))) {
      writeFile(yearIndexPath(y), yearIndexContent(y));
      console.log(`  + 新建年索引 00-${y} 年索引.md`);
    }

    written.push(date);
    console.log(`  ✓ ${date}  写入 ${path.relative(REPO, notePath(date))}（${r.text.length} 字节原文）`);
  }

  const remaining = missing.length - written.length - skippedNoIssue.length;

  console.log("");
  console.log("── 汇总 ──");
  console.log(`本次新增: ${written.length} 期${written.length ? "（" + written.join(", ") + "）" : ""}`);
  console.log(`无发布跳过: ${skippedNoIssue.length} 天`);
  console.log(`抓取失败: ${failed.length} 天${failed.length ? "（" + failed.join(", ") + "）" : ""}`);
  console.log(`仍未补齐: ${remaining} 期`);

  // 有抓取失败时以非零码退出，让 Actions 标记为失败（便于发现问题）
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error("脚本异常:", e);
  process.exit(1);
});
