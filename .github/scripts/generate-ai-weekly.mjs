#!/usr/bin/env node
// 大模型周报聚合 —— 从已归档的 AI 早报机械聚合，幂等回补
//
// 为什么有这个脚本：
//   · 周报线（大模型一周新闻）2026-07-09 前由人工整理，之后断更；
//     本脚本让它在日报归档的基础上自动延续，不再依赖人工
//   · 聚合是机械的：只汇总当周各期日报的「本期要点」，不做人工评论——
//     生成页会在开头明确标注「自动聚合」，与人工周报（status: 已整理）区分
//
// 设计要点（与 fetch-ai-daily.mjs 保持一致）：
//   · 幂等：已存在的周报直接跳过，同一天跑多次结果一致
//   · 回补：从最后一份周报的下一个周四开始，补到最近一个已过的周四；
//     只聚合当周（周五～周四）有存档日报的周，源头缺日报的周跳过、不硬造
//   · 无第三方依赖、无 API Key；先查本地，不访问网络
//   · 单次最多写 MAX_PER_RUN 期（从最早往后补），防止一次写太多
//
// 周报日期惯例（沿用 2026-04 起的人工周报）：文件名与 week_end 取周四，
// 覆盖该周四往前 7 天（周五 ～ 周四）。
//
// 用法：node .github/scripts/generate-ai-weekly.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const REPO = process.env.GITHUB_WORKSPACE || process.cwd();
const NEWS_ROOT = path.join(REPO, "大模型", "10-新闻");
const DAILY_ROOT = path.join(NEWS_ROOT, "日报");
const WEEKLY_ROOT = path.join(NEWS_ROOT, "周报");
const WEEKLY_NAME = "大模型一周新闻.md";
// 可用环境变量覆盖：MAX_PER_RUN=16
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 8);
const DRY_RUN = process.argv.includes("--dry-run");
const WEEKDAY_CN = ["日", "一", "二", "三", "四", "五", "六"];

// ---------- 工具 ----------

/** 北京时间（UTC+8）的今天，格式 YYYY-MM-DD */
function beijingToday() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function toMs(date) {
  return Date.parse(date + "T00:00:00Z");
}

function fromMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(date, n) {
  return fromMs(toMs(date) + n * 86400000);
}

function weekdayCn(date) {
  return WEEKDAY_CN[new Date(toMs(date)).getUTCDay()];
}

/** 该日期所在周的周四（YYYY-MM-DD） */
function thursdayOf(date) {
  const dow = new Date(toMs(date)).getUTCDay(); // 周日=0 … 周六=6
  const delta = (4 - dow + 7) % 7; // 距本周周四的天数
  return addDays(date, delta);
}

function dailyPath(date) {
  return path.join(DAILY_ROOT, date.slice(0, 4), date.slice(0, 7), `${date} AI 早报.md`);
}

function weeklyPath(weekEnd) {
  return path.join(WEEKLY_ROOT, weekEnd.slice(0, 4), weekEnd.slice(0, 7), `${weekEnd} ${WEEKLY_NAME}`);
}

function monthlyIndexPath(ym) {
  return path.join(WEEKLY_ROOT, ym.slice(0, 4), ym, `00-${ym} 月索引.md`);
}

function yearIndexPath(y) {
  return path.join(WEEKLY_ROOT, y, `00-${y} 年索引.md`);
}

function writeFile(p, content) {
  if (DRY_RUN) {
    console.log(`  [dry-run] 会写入 ${path.relative(REPO, p)}`);
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

// ---------- 已有周报扫描 ----------

/** 扫描周报目录，返回已有周报的 week_end（取文件名日期）升序列表 */
function existingWeekEnds() {
  const out = [];
  if (!fs.existsSync(WEEKLY_ROOT)) return out;
  const re = /^(\d{4}-\d{2}-\d{2}) 大模型一周新闻\.md$/;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const m = e.name.match(re);
        if (m) out.push(m[1]);
      }
    }
  })(WEEKLY_ROOT);
  return [...new Set(out)].sort();
}

// ---------- 日报解析 ----------

/** 从一篇日报里提取「本期要点」summary callout，返回按分类分组的条目 */
function parseDailySummary(text) {
  // 按 /\r?\n/ 切行：CI 写入 LF，Windows 检出后可能是 CRLF；
  // JS 正则的 . 不匹配 \r，不先归一化行尾会让所有条目解析失败
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith("> [!summary]"));
  if (start === -1) return null;

  const cats = [];
  let current = null;
  let items = 0;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith(">")) break; // callout 结束
    const cat = l.match(/^>\s*\*\*(.+?)\*\*\s*$/);
    const item = l.match(/^>\s*-\s+(.*)$/);
    if (cat) {
      current = { name: cat[1].trim(), items: [] };
      cats.push(current);
    } else if (item) {
      if (!current) {
        current = { name: "要点", items: [] };
        cats.push(current);
      }
      current.items.push(item[1].trim());
      items++;
    }
  }
  return items ? { cats, items } : null;
}

// ---------- 周报排版 ----------

function buildWeekly(weekEnd, days) {
  // days: [{date, summary}]，仅含当周有存档的日期，升序
  const y = weekEnd.slice(0, 4);
  const ym = weekEnd.slice(0, 7);
  const totalItems = days.reduce((n, d) => n + (d.summary ? d.summary.items : 0), 0);
  const firstDay = days[0].date;
  const lastDay = days[days.length - 1].date;

  const fm = [
    "---",
    "tags:",
    "  - 大模型/新闻",
    "  - 大模型/行业动态",
    "  - 大模型/周报",
    "  - AI/周报",
    "type: weekly-news",
    `week_end: ${weekEnd}`,
    `created: ${weekEnd}`,
    `updated: ${beijingToday()}`,
    "source: 大模型/10-新闻/日报",
    "status: 自动聚合",
    "---",
    "",
    `# ${weekEnd} 大模型一周新闻`,
    "",
  ].join("\n");

  const intro =
    `> [!summary] 一周结论（自动聚合）\n` +
    `> 本篇由归档脚本从当周 ${days.length} 期 [[大模型/10-新闻/日报/00-日报索引|AI 早报]] 自动聚合` +
    `（${firstDay} ~ ${lastDay}，共 ${totalItems} 条要点），只做逐日汇总，不含人工评论与观察。\n` +
    `> 覆盖日期：${days.map((d) => `[[${d.date} AI 早报|${d.date.slice(5)}（周${weekdayCn(d.date)}）]]`).join("、")}\n\n` +
    `---\n\n`;

  const body = days
    .map((d) => {
      const head = `### ${d.date.slice(5)}（周${weekdayCn(d.date)}）\n`;
      if (!d.summary) return head + "\n（该日期日报无「本期要点」小节，见原文。）\n";
      const secs = d.summary.cats
        .map((c) => `**${c.name}**\n\n${c.items.map((i) => `- ${i}`).join("\n")}`)
        .join("\n\n");
      return head + "\n" + secs + "\n";
    })
    .join("\n");

  const links = [
    "## 相关链接",
    "",
    `- 上级索引：[[大模型/10-新闻/周报/${y}/00-${y} 年索引|${y} 年索引]]`,
    `- 当月索引：[[大模型/10-新闻/周报/${y}/${ym}/00-${ym} 月索引|${ym} 月索引]]`,
    `- 逐日原文：${days.map((d) => `[[${d.date} AI 早报]]`).join("、")}`,
    "",
  ].join("\n");

  return fm + "\n" + intro + body + "\n" + links;
}

// ---------- 索引模板（沿用现有周报索引的 Dataview 结构） ----------

function monthlyIndexContent(ym) {
  const y = ym.slice(0, 4);
  const mm = Number(ym.slice(5));
  return `---
tags:
  - 大模型/新闻
  - 大模型/索引
type: weekly-news-index
level: month
month: ${ym}
created: ${beijingToday()}
updated: ${beijingToday()}
status: 持续更新
---

# ${ym} 大模型周报索引

> [!summary] 范围
> ${y} 年 ${mm} 月的大模型周报。
> 上级索引：[[大模型/10-新闻/周报/${y}/00-${y} 年索引|${y} 年索引]]

## 本月周报

\`\`\`dataview
TABLE WITHOUT ID
  file.link AS "周报",
  dateformat(week_end, "yyyy-MM-dd") AS "周末",
  status AS "状态"
FROM "大模型/10-新闻/周报/${y}/${ym}"
WHERE type = "weekly-news"
SORT week_end DESC
\`\`\`
`;
}

function yearIndexContent(y) {
  return `---
tags:
  - 大模型/新闻
  - 大模型/索引
type: weekly-news-index
level: year
year: ${y}
created: ${beijingToday()}
updated: ${beijingToday()}
status: 持续更新
---

# ${y} 年大模型周报索引

> [!summary] 范围
> ${y} 年的大模型周报，按月归档，每月最多 4–5 篇。
> 上级索引：[[大模型/10-新闻/周报/00-周报索引|周报索引]]

## 月份汇总

\`\`\`dataview
TABLE WITHOUT ID
  key AS "月份",
  length(rows) AS "期数",
  dateformat(min(rows.week_end), "MM-dd") AS "首期",
  dateformat(max(rows.week_end), "MM-dd") AS "最新"
FROM "大模型/10-新闻/周报/${y}"
WHERE type = "weekly-news"
GROUP BY dateformat(week_end, "yyyy-MM")
SORT key DESC
\`\`\`

## 月索引页

\`\`\`dataview
LIST
FROM "大模型/10-新闻/周报/${y}"
WHERE type = "weekly-news-index" AND level = "month"
SORT file.name DESC
\`\`\`
`;
}

// ---------- 主流程 ----------

function main() {
  const today = beijingToday();
  const have = existingWeekEnds();
  console.log(`已有周报 ${have.length} 期${have.length ? `（最新 ${have[have.length - 1]}）` : ""}`);
  if (DRY_RUN) console.log("模式: dry-run（不写盘）");

  // 待补的周四：最后一份周报的下一个周四 ～ 最近一个已完整结束的周四。
  // 只认严格早于今天的周四：周四当天的周报由次日起的运行生成，保证覆盖整周 7 期日报。
  const last = have.length ? have[have.length - 1] : addDays(today, -7);
  let latestDone = thursdayOf(addDays(today, -1));
  if (toMs(latestDone) >= toMs(today)) latestDone = addDays(latestDone, -7);
  const candidates = [];
  for (let t = addDays(last, 7); toMs(t) <= toMs(latestDone) && candidates.length < 60; t = addDays(t, 7)) {
    candidates.push(t);
  }
  console.log(`待补周四 ${candidates.length} 期：${candidates.join(", ")}`);
  console.log("");

  const written = [];
  const skippedNoDaily = [];

  for (const weekEnd of candidates) {
    if (written.length >= MAX_PER_RUN) break;

    // 当周（周五～周四）有存档的日报，升序
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(weekEnd, -i);
      const p = dailyPath(date);
      if (fs.existsSync(p)) {
        days.push({ date, summary: parseDailySummary(fs.readFileSync(p, "utf8")) });
      }
    }
    if (!days.length) {
      skippedNoDaily.push(weekEnd);
      console.log(`  ${weekEnd}  当周无已归档日报，跳过`);
      continue;
    }

    writeFile(weeklyPath(weekEnd), buildWeekly(weekEnd, days));

    const ym = weekEnd.slice(0, 7);
    const y = weekEnd.slice(0, 4);
    if (!fs.existsSync(monthlyIndexPath(ym))) {
      writeFile(monthlyIndexPath(ym), monthlyIndexContent(ym));
      console.log(`  + 新建月索引 00-${ym} 月索引.md`);
    }
    if (!fs.existsSync(yearIndexPath(y))) {
      writeFile(yearIndexPath(y), yearIndexContent(y));
      console.log(`  + 新建年索引 00-${y} 年索引.md`);
    }

    written.push(weekEnd);
    console.log(`  ✓ ${weekEnd}  写入 ${path.relative(REPO, weeklyPath(weekEnd))}（${days.length} 期日报）`);
  }

  console.log("");
  console.log("── 汇总 ──");
  console.log(`本次新增: ${written.length} 期${written.length ? "（" + written.join(", ") + "）" : ""}`);
  console.log(`无日报跳过: ${skippedNoDaily.length} 周${skippedNoDaily.length ? "（" + skippedNoDaily.join(", ") + "）" : ""}`);
  if (written.length) process.exitCode = 0;
}

main();
