#!/usr/bin/env node
// 渲染《2026-10 四家 Flash 级模型对比》的总对比表。
// Obsidian 退役后 Dataview/dataviewjs 无宿主，改为从各 model-card 笔记的
// frontmatter 生成静态 Markdown 表，替换笔记中的生成块（幂等，可反复重跑）。
// 用法：node scripts/render-model-compare.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = path.join(ROOT, '大模型/05-评测与选型/模型体验');
const NOTE = path.join(ROOT, '大模型/05-评测与选型/模型体验/2026-10 四家 Flash 级模型对比.md');
const BEGIN = '<!-- BEGIN: render-model-compare（由 scripts/render-model-compare.mjs 生成，勿手改；改卡片后重跑脚本） -->';
const END = '<!-- END: render-model-compare -->';

// —— 迷你 YAML frontmatter 解析：标量 / 列表 / 一层嵌套 map / 注释行 ——
function scalar(s) {
  s = s.trim().replace(/^["']|["']$/g, '');
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function parseFM(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  let mode = 'root'; // root | list | map
  let curKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (!/\s/.test(line) || !/^\s/.test(line)) {
      const kv = line.match(/^([^#:\s][^:]*):\s*(.*)$/);
      if (kv && !line.startsWith(' ') && !line.startsWith('-')) {
        const k = kv[1].trim(), v = kv[2].trim();
        if (v === '') { mode = 'pending'; curKey = k; fm[k] = null; continue; }
        fm[k] = scalar(v); mode = 'root'; curKey = null;
        continue;
      }
    }
    if (mode === 'pending' && curKey) {
      const li = line.match(/^\s+-\s?(.*)$/);
      const kv = line.match(/^\s+([^#:\s][^:]*):\s*(.*)$/);
      if (li) { if (!Array.isArray(fm[curKey])) fm[curKey] = []; mode = 'list'; fm[curKey].push(scalar(li[1])); continue; }
      if (kv) { fm[curKey] = {}; mode = 'map'; fm[curKey][kv[1].trim()] = scalar(kv[2]); continue; }
    }
    if (mode === 'list' && curKey) {
      const li = line.match(/^\s+-\s?(.*)$/);
      if (li) { fm[curKey].push(scalar(li[1])); continue; }
    }
    if (mode === 'map' && curKey) {
      const kv = line.match(/^\s+([^#:\s][^:]*):\s*(.*)$/);
      if (kv) { fm[curKey][kv[1].trim()] = scalar(kv[2]); continue; }
    }
  }
  return fm;
}

// ===== 与原 dataviewjs 一致的渲染逻辑 =====
const order = ['GLM-5.3-Flash', 'Qwen3.8-Flash', 'deepseek-flash', 'Gemini 3.8 Flash'];
const rank = (m) => { const i = order.indexOf(m); return i === -1 ? 99 : i; };
const MIN_REPORTERS = 2;

const models = fs.readdirSync(DIR)
  .filter((f) => f.toLowerCase().endsWith('.md'))
  .map((f) => ({ file: f, fm: parseFM(fs.readFileSync(path.join(DIR, f), 'utf8')) }))
  .filter((p) => p.fm && p.fm.type === 'model-card')
  .sort((a, b) => rank(a.fm.model) - rank(b.fm.model));
if (models.length === 0) throw new Error('未找到 model-card');

const raw = (p, k) => {
  const b = p.fm.bench;
  if (b && b[k] !== undefined && b[k] !== null) return b[k];
  const v = p.fm[k];
  return v === undefined || v === null || v === '' ? null : v;
};
const txt = (p, k, fb = '—') => {
  const v = raw(p, k);
  if (v === null) return fb;
  return Array.isArray(v) ? v.join('、') : String(v);
};
const money = (p, k) => {
  const v = raw(p, k);
  return v === null ? '—' : p.fm.currency === 'USD' ? '$' + v : v + ' 元';
};
const cell = (s) => String(s).replace(/\|/g, '\\|');

// [分组, 键, 显示名, 方向]  方向：1 = 越大越好，-1 = 越小越好，0 = 不标最优
const METRICS = [
  ['聚合指数', 'aa_intelligence', 'AA 智能指数 v4.3.2', 1],
  ['聚合指数', 'eci', 'Epoch ECI', 1],
  ['聚合指数', 'vals_index', 'Vals Index（旧版）', 1],
  ['聚合指数', 'vals_index_v21', 'Vals Index v2.1', 1],
  ['聚合指数', 'gdpval_aa_v2', 'GDPval-AA v2（厂商口径 Elo）', 1],

  ['AA 同 harness', 'aa_briefcase', 'AA-Briefcase v1.1', 1],
  ['AA 同 harness', 'aa_gdpval_v21', 'GDPval-AA v2.1', 1],
  ['AA 同 harness', 'aa_automationbench', 'AutomationBench-AA (%)', 1],
  ['AA 同 harness', 'aa_terminal_bench_40', 'Terminal-Bench 4.0 (%)', 1],
  ['AA 同 harness', 'aa_scicode', 'SciCode (%)', 1],
  ['AA 同 harness', 'aa_hle', 'HLE (% 无工具)', 1],
  ['AA 同 harness', 'aa_gdp_pdf', 'GDP.pdf (%)', 1],
  ['AA 同 harness', 'aa_critpt', 'CritPt (%)', 1],
  ['AA 同 harness', 'aa_omniscience', 'AA-Omniscience（幻觉惩罚项）', 1],
  ['AA 同 harness', 'aa_lcr', 'AA-LCR v1.1 (%)', 1],

  ['知识与推理', 'hle_tools', 'HLE（厂商带工具口径）', 1],
  ['知识与推理', 'hle_verified', 'HLE-Verified（厂商）', 1],
  ['知识与推理', 'gpqa_diamond', 'GPQA Diamond', 1],
  ['知识与推理', 'simplebench', 'SimpleBench', 1],
  ['知识与推理', 'arc_agi_1', 'ARC-AGI-1', 1],
  ['知识与推理', 'arc_agi_2', 'ARC-AGI-2', 1],
  ['知识与推理', 'arc_agi_3', 'ARC-AGI-3', 1],
  ['知识与推理', 'creative_writing', 'Creative Writing (Elo)', 1],
  ['知识与推理', 'mysterymechanism', 'MysteryMechanism', 1],
  ['知识与推理', 'frontier_math_v2', 'FrontierMath v2', 1],
  ['知识与推理', 'matharena_apex', 'MathArena Apex', 1],
  ['知识与推理', 'proofbench', 'ProofBench v1.1 (Lean 4)', 1],
  ['知识与推理', 'codeforces', 'CodeForces (Elo)', 1],

  ['编程与终端', 'terminal_bench_21', 'Terminal-Bench 2.1', 1],
  ['编程与终端', 'terminal_bench_30', 'Terminal-Bench 3.0', 1],
  ['编程与终端', 'deepswe', 'DeepSWE v1.1', 1],
  ['编程与终端', 'swe_bench_pro', 'SWE-bench Pro', 1],
  ['编程与终端', 'swe_bench_pro_v2', 'SWE-Bench Pro V2', 1],
  ['编程与终端', 'swe_bench_multilingual', 'SWE-bench Multilingual', 1],
  ['编程与终端', 'swe_atlas', 'SWE-Atlas', 1],
  ['编程与终端', 'nl2repo', 'NL2Repo-Bench', 1],
  ['编程与终端', 'livecodebench', 'LiveCodeBench v6', 1],
  ['编程与终端', 'cursorbench_40', 'CursorBench 4.0', 1],
  ['编程与终端', 'program_bench', 'ProgramBench', 1],
  ['编程与终端', 'ioi_vals_v2', 'IOI (Vals v2)', 1],
  ['编程与终端', 'vals_code_migration', 'Code Migration（Vals）', 1],
  ['编程与终端', 'vals_vibe_code_bench', 'Vibe Code Bench v1.1（Vals）', 1],
  ['编程与终端', 'vals_terminal_bench_science', 'Terminal-Bench Science（Vals）', 1],

  ['Agent 与办公', 'toolathlon', 'Toolathlon Verified', 1],
  ['Agent 与办公', 'agents_last_exam', "Agents' Last Exam", 1],
  ['Agent 与办公', 'automationbench', 'AutomationBench（厂商版）', 1],
  ['Agent 与办公', 'osworld_2', 'OSWorld 2.0', 1],
  ['Agent 与办公', 'androidworld', 'AndroidWorld', 1],
  ['Agent 与办公', 'tau3_banking', 'τ³-Banking', 1],
  ['Agent 与办公', 'tau2_banking', 'τ²-Banking', 1],
  ['Agent 与办公', 'ifbench', 'IFBench（指令遵循）', 1],
  ['Agent 与办公', 'officeqa_pro', 'OfficeQA Pro', 1],
  ['Agent 与办公', 'finance_agent_v2', 'Finance Agent v2（Vals）', 1],
  ['Agent 与办公', 'emb_excel', 'EMB（Excel 建模，Vals）', 1],
  ['Agent 与办公', 'legal_research', 'Legal Research Bench（Vals）', 1],
  ['Agent 与办公', 'hlab', 'HLAB（法律 Agent，Vals）', 1],
  ['Agent 与办公', 'vals_tax_agent', 'Tax Agent Bench（Vals）', 1],
  ['Agent 与办公', 'itbench_sre', 'ITBench SRE', 1],
  ['Agent 与办公', 'cybergym', 'CyberGym', 1],
  ['Agent 与办公', 'sec_bench_pro', 'SEC-Bench Pro', 1],
  ['Agent 与办公', 'exploitgym', 'ExploitGym', 1],
  ['Agent 与办公', 'coworkbench', 'CoWorkBench（厂商自建）', 1],
  ['Agent 与办公', 'jobbench', 'JobBench', 1],

  ['多模态与长文本', 'mmmu_pro', 'MMMU-Pro', 1],
  ['多模态与长文本', 'charxiv_rq', 'CharXiv RQ', 1],
  ['多模态与长文本', 'mathvision', 'MathVision', 1],
  ['多模态与长文本', 'realworldqa', 'RealWorldQA', 1],
  ['多模态与长文本', 'babyvision', 'BabyVision', 1],
  ['多模态与长文本', 'chartography', 'Chartography', 1],
  ['多模态与长文本', 'lvbench', 'LVBench（长视频）', 1],
  ['多模态与长文本', 'mmvu', 'MMVU（视频）', 1],
  ['多模态与长文本', 'mvvbench', 'MVBench（视频）', 1],
  ['多模态与长文本', 'erqa', 'ERQA（具身）', 1],
  ['多模态与长文本', 'context_arena', 'Context Arena', 1],
  ['多模态与长文本', 'zerobench_main', 'ZeroBench Main', 1],

  ['速度与成本', 'aa_speed_tps', '输出速度 (tok/s)', 1],
  ['速度与成本', 'aa_ttft', '首 token 延迟 (s)', -1],
  ['速度与成本', 'aa_time_first_answer', '首个答案 token 延迟 (s)', -1],
  ['速度与成本', 'aa_e2e', '端到端响应 (s)', -1],
  ['速度与成本', 'aa_time_per_task', '每任务耗时 (s)', -1],
  ['速度与成本', 'aa_output_tokens_per_task', '每任务输出 token (k)', 0],
  ['速度与成本', 'aa_reasoning_tokens_per_task', '每任务推理 token (k)', 0],
  ['速度与成本', 'aa_index_output_tokens', '跑完指数总输出 (M token)', 0],
  ['速度与成本', 'aa_input_price_usd', '输入价 ($/百万)', -1],
  ['速度与成本', 'aa_output_price_usd', '输出价 ($/百万)', -1],
  ['速度与成本', 'aa_cache_hit_usd', '缓存命中价 ($/百万)', -1],
  ['速度与成本', 'aa_price_blended', '混合价 ($/百万)', -1],
  ['速度与成本', 'aa_cost_per_task_usd', '每任务成本 ($)', -1],
  ['速度与成本', 'aa_cost_index_total', '跑完指数总成本 ($)', -1],
  ['速度与成本', 'aa_cache_discount_pct', '缓存折扣 (%)', 1],
];

const rows = [
  ['厂商', ...models.map((p) => txt(p, 'vendor'))],
  ['发布', ...models.map((p) => { const v = raw(p, 'release_date'); return v && v.toFormat ? v.toFormat('yyyy-MM-dd') : String(v ?? '—'); })],
  ['价格（输入 / 输出）', ...models.map((p) => txt(p, 'price_display'))],
  ['缓存命中输入', ...models.map((p) => money(p, 'price_cache_hit'))],
  ['参数（总 / 激活）', ...models.map((p) => txt(p, 'params_display'))],
  ['上下文 / 最大输出', ...models.map((p) => txt(p, 'context_display'))],
  ['输入模态', ...models.map((p) => txt(p, 'input_modalities'))],
  ['开放权重 / 许可', ...models.map((p) => (p.fm.open_weights ? '✅ 开源 · ' : '❌ 闭源 · ') + txt(p, 'license'))],
  ['本地部署', ...models.map((p) => (p.fm.local_deploy === true ? '✅ 可本地' : '❌ 仅云'))],
  ['接 Agent', ...models.map((p) => (p.fm.agent_ready === true ? '✅ 可接' : '⚠️ 慎接'))],
];

let skipped = 0;
for (const [group, key, label, dir] of METRICS) {
  const vals = models.map((p) => raw(p, key));
  const present = vals.filter((v) => v !== null);
  if (present.length < MIN_REPORTERS) { skipped++; continue; }
  const best = dir === 0 ? null : dir > 0 ? Math.max(...present) : Math.min(...present);
  const cells = vals.map((v) => (v === null ? '—' : v === best ? v + ' ★' : String(v)));
  const cov = present.length < models.length ? `（${present.length}/${models.length}）` : '';
  rows.push([`${group} · ${label}${cov}`, ...cells]);
}
rows.push(['定位', ...models.map((p) => txt(p, 'verdict'))]);

const header = `| 维度 | ${models.map((p) => `[[${p.fm.model}]]`).join(' | ')} |`;
const table = [header, `|:---|${models.map(() => ':---:').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
const block = `${BEGIN}\n${table}\n${END}`;

let note = fs.readFileSync(NOTE, 'utf8');
const dvBlock = note.match(/```dataviewjs[\s\S]*?\n```/);
const marked = note.includes(BEGIN);
if (dvBlock && !marked) {
  note = note.replace(dvBlock[0], block);
} else if (marked) {
  const re = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  note = note.replace(re, block);
} else {
  throw new Error('未找到 dataviewjs 块，也未找到已生成的标记块');
}
// 说明文字改为脚本流程
note = note.replace(
  '全表由 [[#模型卡片]] 的 frontmatter 自动生成：**一列一个模型，一行一个对比维度**。改卡片即改表，不需要维护第二张表。',
  '全表由 [[#模型卡片]] 的 frontmatter 经 `scripts/render-model-compare.mjs` 生成：**一列一个模型，一行一个对比维度**。改卡片后重跑 `node scripts/render-model-compare.mjs` 即可更新本表，不需要手工维护第二张表。'
);
note = note.replace('总对比表会自动多出一行', '重跑 `node scripts/render-model-compare.mjs` 总对比表即多出一行');
fs.writeFileSync(NOTE, note);

console.log(`模型 ${models.length} 个：${models.map((p) => p.fm.model).join('、')}`);
console.log(`指标行 ${rows.length}（基础 10 + 指标 ${rows.length - 11} + 定位 1），因单家数据跳过 ${skipped} 项`);
console.log(`抽样校验：AA 指数行 = ${rows[10].slice(1).join(' / ')}；每任务耗时行 = ${rows.find((r) => r[0].includes('每任务耗时')).slice(1).join(' / ')}`);
console.log('表格已写入笔记');
