#!/usr/bin/env node
// economist-digest.mjs — 从 GitHub 杂志归档取《经济学人》某一期，抽出指定文章，
// 生成与本库「外刊精读」版式一致的 Markdown 骨架（左原文 / 右译文 + 词汇注释 + 总词汇表）。
//
// 背景：economist.com 在本机 / CI 均不可直连（DNS 污染），archive.ph 也不通。
// 可用通道是 GitHub 上的周更归档仓库（EPUB/MOBI/PDF），本脚本走 gh-proxy 拉单期，
// 只做「取原文 + 搭骨架」；译文、音节、词表释义由人或模型补。
//
// 用法（在知识库根目录执行）：
//   node scripts/economist-digest.mjs list  --issue 2024-05-18
//   node scripts/economist-digest.mjs text  --issue 2024-05-18 --article Taiwan
//   node scripts/economist-digest.mjs new   --issue 2024-05-18 --article Taiwan [--out <目录>] [--force]
//   node scripts/economist-digest.mjs new   --issue 2024-05-18 --article Politics --name "The world this week 政治.md"
//
// 参数：
//   --issue   必填，YYYY-MM-DD（印刷版日期）
//   --article 文章标题的片段（大小写不敏感），或章节序号 1..N；不填则列出清单
//   --out     输出目录，默认 英语学习/经济学人/<YYYYMMDD>/
//   --name    输出文件名，默认 <标题>.md（去掉不允许的字符）
//   --zh      中文标题，填进 H1 与「文章信息」
//   --force   覆盖已存在的文件（默认拒绝，避免冲掉已翻译的笔记）
//   --group   每节放几段，默认 3
//   --cache   归档克隆的缓存目录，默认系统临时目录下的 economist-archive
//   --repo    覆盖归档仓库，默认 AICoupon/awesome-english-ebooks
//   --proxy   覆盖 GitHub 代理前缀（默认依次试 gh-proxy.com / ghproxy.net / ghfast.top）
//   --offline 只用缓存，不联网
//
// 扩展点（后续要加东西就改这几处，不必动主流程）：
//   1. SOURCES       —— 归档仓库清单与目录模板（多源回退）
//   2. buildFrontmatter / buildInfoCallout / buildSection / buildGlossary
//                    —— 版式片段，想加「音频」「出处注释」改这里
//   3. parseArticle  —— EPUB 章节 → { title, section, deck, date, body[], url }
//   4. 词表与注释留 TODO，由人/模型填；--json 可把抽取结果交给外部流程

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT = process.env.VAULT_DIR || path.resolve(__dirname, '..');

// ── 1. 归档源 ───────────────────────────────────────────────────────────────
// 每个源给：仓库、分支、目录模板、代理前缀。按顺序尝试，第一个找到 epub 的胜出。
const SOURCES = [
  {
    name: 'awesome-english-ebooks',
    repo: 'AICoupon/awesome-english-ebooks',
    branch: 'master',
    issueDir: (d) => `01_economist/te_${d.yyyy}.${d.mm}.${d.dd}`,
  },
  {
    name: 'blleng/The-Economist',
    repo: 'blleng/The-Economist',
    branch: 'main',
    issueDir: (d) => `TE-${d.yyyy}-${d.mm}-${d.dd}`, // 只保留最近 12 期
  },
];
const PROXIES = ['https://gh-proxy.com/', 'https://ghproxy.net/', 'https://ghfast.top/'];

// 正文里混进来的版头模板行（栏目、日期、页脚），抽取时过滤
const SECTION_RE = /^[A-Z][A-Za-z&'’\- ]{1,40} \| .+$/;
// 不能用 \b：版头里标题、副题、日期常被粘成一段（...peaceMay 16th 2024）
const DATE_LINE_RE = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}\s*$/;
const FOOTER_RE = /^\s*This article was downloaded by/i;

// ── 2. 参数 ─────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { group: 3, force: false, offline: false, json: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (key === 'force' || key === 'offline' || key === 'json') args[key] = true;
      else args[key] = argv[++i];
    } else rest.push(a);
  }
  args.command = rest[0] || 'help';
  return args;
}

function usage() {
  const lines = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
  const head = lines.slice(0, 30).join('\n').replace(/^\/\/ ?/gm, '');
  console.log(head);
}

// ── 3. 极简 ZIP 读取（EPUB 就是 zip；避免引入依赖） ─────────────────────────
function openZip(buf) {
  let eocd = -1;
  const floor = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= floor; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 epub（找不到 zip 目录尾）');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('zip 中央目录损坏');
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    entries.set(buf.toString('utf8', off + 46, off + 46 + nameLen), {
      method: buf.readUInt16LE(off + 10),
      size: buf.readUInt32LE(off + 20),
      local: buf.readUInt32LE(off + 42),
    });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return { buf, entries };
}

function readZipEntry(zip, name) {
  const e = zip.entries.get(name);
  if (!e) return null;
  const b = zip.buf;
  if (b.readUInt32LE(e.local) !== 0x04034b50) throw new Error('zip 本地头损坏: ' + name);
  const nameLen = b.readUInt16LE(e.local + 26);
  const extraLen = b.readUInt16LE(e.local + 28);
  const start = e.local + 30 + nameLen + extraLen;
  const raw = b.subarray(start, start + e.size);
  if (e.method === 0) return Buffer.from(raw);
  if (e.method === 8) return inflateRawSync(raw);
  throw new Error('不支持的压缩方式 ' + e.method + '（' + name + '）');
}

// ── 4. HTML → 文本 ──────────────────────────────────────────────────────────
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', times: '×', middot: '·', copy: '©',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}

function htmlToText(html) {
  let s = html.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<(i|em)>([\s\S]*?)<\/\1>/gi, '*$2*');
  s = s.replace(/<(b|strong)>([\s\S]*?)<\/\1>/gi, '**$2**');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
}

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i'));
  return m ? m[1] : null;
}

// ── 5. EPUB → 章节 ─────────────────────────────────────────────────────────
function parseEpub(buf) {
  const zip = openZip(buf);
  const opfPath = [...zip.entries.keys()].find((n) => n.toLowerCase().endsWith('.opf'));
  if (!opfPath) throw new Error('epub 里没有 opf 清单');
  const opf = readZipEntry(zip, opfPath).toString('utf8');
  const base = path.posix.dirname(opfPath);

  const manifest = new Map();
  for (const tag of opf.match(/<item\b[^>]*>/g) || []) {
    const id = attr(tag, 'id');
    const href = attr(tag, 'href');
    if (id && href) manifest.set(id, href);
  }
  const spine = [...opf.matchAll(/<itemref\b[^>]*idref\s*=\s*"([^"]+)"/g)].map((m) => m[1]);

  const chapters = [];
  for (const idref of spine) {
    const href = manifest.get(idref);
    if (!href) continue;
    const p = path.posix.normalize(path.posix.join(base, href));
    const file = readZipEntry(zip, p);
    if (!file) continue;
    const raw = file.toString('utf8').replace(/<p\s*\/>/gi, ''); // 自闭合 <p/> 会吞掉后面整块版头
    const h1 = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = h1 ? htmlToText(h1[1]) : '';
    // 这一套 EPUB 的版头有固定 class，能直接取到栏目/副题/日期，比猜行靠谱
    const pick = (re) => { const m = raw.match(re); return m ? htmlToText(m[1]) : ''; };
    const meta = {
      sectionTitle: pick(/<span[^>]*class="te_section_title"[^>]*>([\s\S]*?)<\/span>/i),
      fly: pick(/<span[^>]*class="te_fly_span"[^>]*>([\s\S]*?)<\/span>/i).replace(/^\s*\|\s*/, ''),
      rubric: pick(/<h3[^>]*te_article_rubric[^>]*>([\s\S]*?)<\/h3>/i),
      date: pick(/<h3[^>]*te_article_datePublished[^>]*>([\s\S]*?)<\/h3>/i),
    };
    const paras = [];
    for (const m of raw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const t = htmlToText(m[1]);
      if (t) paras.push(t);
    }
    chapters.push({ path: p, title, paras, meta });
  }
  return chapters;
}

// 把一章拆成 { title, section, deck, date, body[], url }
function parseArticle(chapter) {
  const paras = chapter.paras.slice();

  // 页脚（下载者留下的来源链接）先摘出来
  let url = '';
  const kept = [];
  for (const p of paras) {
    const u = p.match(/https?:\/\/www\.economist\.com\/\S+/);
    if (FOOTER_RE.test(p) || (u && p.length < 200 && /downloaded by/i.test(p))) {
      if (u) url = u[0].replace(/[.,)]$/, '');
      continue;
    }
    kept.push(p);
  }

  const m = chapter.meta || {};
  const cleanSection = (s) => {
    const t = (s || '').replace(/^[\u25A0-\u25FF\s|]+/, '').trim();
    return /[A-Za-z\u4e00-\u9fa5]/.test(t) ? t : '';
  };
  const metaSection = cleanSection(m.sectionTitle ? m.sectionTitle + (m.fly ? ' | ' + m.fly : '') : '');

  // 这一套 EPUB 的版头有固定 class：直接采用，正文里只去掉重复的栏目段
  if (metaSection || m.rubric || m.date) {
    const body = kept.filter((p) => p !== metaSection && !(SECTION_RE.test(p) && p.length < 80));
    return { title: chapter.title, section: metaSection, deck: m.rubric || '', date: m.date || '', body, url };
  }

  // 回退：按日期行切版头（别的 epub 源可能没有这些 class）
  const dateIdx = kept.slice(0, 4).findIndex((p) => DATE_LINE_RE.test(p));
  const bodyStart = dateIdx >= 0 ? dateIdx + 1 : 0;
  const head = kept.slice(0, bodyStart);
  const body = kept.slice(bodyStart);

  const section = head.find((p) => SECTION_RE.test(p)) || '';
  const dateLine = dateIdx >= 0 ? kept[dateIdx] : '';
  const date = (dateLine.match(DATE_LINE_RE) || [''])[0].trim();

  // 版头里常把「标题 + 副题 + 日期」粘成一段：掐掉已知标题和日期，剩下的就是副题
  let deck = '';
  if (dateLine) {
    let rest = dateLine;
    if (rest.startsWith(chapter.title)) rest = rest.slice(chapter.title.length);
    rest = rest.replace(DATE_LINE_RE, '').trim();
    if (rest && rest !== chapter.title) deck = rest;
  }

  return { title: chapter.title, section, deck, date, body, url };
}

// ── 6. 骨架版式 ─────────────────────────────────────────────────────────────
function escapeCell(s) {
  // 表格单元格里不能有换行；残留的 <br> 会破坏整张表
  return s.replace(/\s+/g, ' ').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\$/g, '\\$').trim();
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// "May 16th 2024" → "2024-05-16"（EPUB 里是英文日期）
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
function isoDate(s) {
  const m = /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/.exec(s || '');
  if (!m) return s || '';
  const idx = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (idx < 0) return s;
  return `${m[3]}-${String(idx + 1).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

function buildFrontmatter({ source, created }) {
  return [
    '---',
    'tags:',
    '  - english',
    '  - 英语学习/经济学人',
    '  - 英语学习/外刊精读',
    `created: ${created}`,
    `updated: ${today()}`,
    `source: ${source}`,
    'status: 待译',
    'type: 外刊精读',
    '---',
  ].join('\n');
}

function buildInfoCallout(a, { issueDate, zh }) {
  const lines = [
    '> [!abstract] 文章信息',
    `> - **标题**：${a.title}${zh ? '（' + zh + '）' : '（中文标题待定）'}`,
    a.deck ? `> - **副题**：${a.deck}` : null,
    `> - **出处**：The Economist · ${a.section || '（栏目待补）'} · ${isoDate(a.date) || issueDate}（印刷版 ${issueDate}）`,
    '> - **主题**：（一句话概括，待补）',
    '> - **说明**：左栏原文、右栏译文逐段对照；各节之间附词汇注释，文末有总词汇表。原文按《经济学人》电子版整理，正文无删节。',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildSection({ index, paragraphs, group }) {
  const chunk = paragraphs.slice(index * group, index * group + group);
  const rows = chunk.map((p) => `| ${escapeCell(p)} | （待译） |`);
  return [
    `## 第 ${index + 1} 节 · 待命名`,
    '',
    '| 原文 | 译文 |',
    '|---|---|',
    ...rows,
    '',
    `> [!note]- 词汇注释 · 第 ${index + 1} 节`,
    '> - **word** /ipa/ —— 释义。',
    '> - （待补，每节 4–8 个）',
  ].join('\n');
}

function buildGlossary() {
  return [
    '## 总词汇表',
    '',
    '| 词汇 | 音标 | 释义 | 文中语境 |',
    '|---|---|---|---|',
    '| （待补） | — | — | — |',
    '',
    '## 相关笔记',
    '',
    '- [[00 首页]]',
    '- [[Terry Tao 与 AI 之战：NYT 双语精读|NYT 双语精读（版式参考）]]',
  ].join('\n');
}

function buildSkeleton(article, opts) {
  const { issueDate, group, zh } = opts;
  const title = article.title;
  const h1 = zh ? `${zh}：经济学人双语精读` : `${title}：经济学人双语精读`;
  const sections = [];
  for (let i = 0; i * group < article.body.length; i++) {
    sections.push(buildSection({ index: i, paragraphs: article.body, group }));
  }
  return [
    buildFrontmatter({ source: article.url || '（待补）', created: today() }),
    '',
    `# ${h1}`,
    '',
    buildInfoCallout(article, { issueDate, zh }),
    '',
    ...sections.flatMap((s) => [s, '']),
    buildGlossary(),
    '',
    '## 参考资料',
    '',
    `- 原文：<${article.url || '（待补）'}>（The Economist, ${isoDate(article.date) || issueDate}）`,
    `- 印刷版：${issueDate} 期${article.section ? '，' + article.section : ''}`,
    '',
    '> [!warning] 版权说明',
    '> 本文为 The Economist 付费内容，本笔记仅供个人英语学习与资料留存，版权归原作者及出版方所有，请勿二次分发。',
    '',
  ].join('\n');
}

// ── 7. 取归档（代理 + sparse checkout，只下这一期） ─────────────────────────
function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', ...opts });
}

function dateParts(issue) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(issue);
  if (!m) throw new Error('--issue 需要 YYYY-MM-DD，收到：' + issue);
  return { yyyy: m[1], mm: m[2], dd: m[3] };
}

function gitUrl(repo, proxy) {
  return (proxy || PROXIES[0]) + `https://github.com/${repo}.git`;
}

function ensureRepo(source, cacheRoot, offline, proxies = PROXIES) {
  const dir = path.join(cacheRoot, source.name.replace(/[\\/:*?"<>|]/g, '_'));
  if (fs.existsSync(path.join(dir, '.git'))) return dir;
  if (offline) throw new Error(`缓存里没有 ${source.repo}，去掉 --offline 先联网克隆一次`);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const errors = [];
  for (const proxy of proxies) {
    try {
      process.stderr.write(`克隆 ${source.repo}（经 ${new URL(proxy).host}，只取目录树）…\n`);
      sh('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', gitUrl(source.repo, proxy), dir], {
        stdio: 'inherit',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      });
      return dir;
    } catch (e) {
      errors.push(`${new URL(proxy).host}: ${e.message.split('\n')[0]}`);
      fs.rmSync(dir, { recursive: true, force: true }); // 半截目录会挡住下一次尝试
    }
  }
  throw new Error('所有代理都失败：\n  ' + errors.join('\n  '));
}

function locateIssue(source, dir, issue, offline) {
  const d = dateParts(issue);
  const rel = source.issueDir(d);
  const abs = path.join(dir, ...rel.split('/'));
  if (!fs.existsSync(abs)) {
    if (offline) throw new Error(`缓存里没有 ${rel}`);
    sh('git', ['-C', dir, 'fetch', '--depth', '1', 'origin', source.branch], { stdio: 'ignore' });
    sh('git', ['-C', dir, 'reset', '--hard', 'FETCH_HEAD'], { stdio: 'ignore' });
    sh('git', ['-C', dir, 'sparse-checkout', 'set', rel], { stdio: 'inherit' });
  }
  if (!fs.existsSync(abs)) return null;
  const epub = fs.readdirSync(abs).find((f) => f.toLowerCase().endsWith('.epub'));
  return epub ? path.join(abs, epub) : null;
}

function loadIssue(issue, args) {
  const cacheRoot = args.cache || path.join(os.tmpdir(), 'economist-archive');
  const sources = args.repo
    ? [{
        ...(SOURCES.find((s) => s.repo === args.repo) || { name: args.repo, branch: 'main', issueDir: SOURCES[0].issueDir }),
        repo: args.repo,
      }]
    : SOURCES;
  const proxies = args.proxy
    ? [String(args.proxy).replace(/\/?$/, '/')]
    : PROXIES;
  const errors = [];
  for (const source of sources) {
    try {
      const dir = ensureRepo(source, cacheRoot, args.offline, proxies);
      const epub = locateIssue(source, dir, issue, args.offline);
      if (!epub) { errors.push(`${source.repo}: 没有 ${issue} 这期（可能未收录或已过期）`); continue; }
      return { epub, source };
    } catch (e) {
      errors.push(`${source.repo}: ${e.message}`);
    }
  }
  throw new Error('取不到这一期：\n  ' + errors.join('\n  '));
}

// ── 8. 选文章 ───────────────────────────────────────────────────────────────
function pickArticle(chapters, query) {
  const candidates = chapters.filter((c) => c.paras.length >= 1 && c.title);
  if (!query) return null;
  if (/^\d+$/.test(query)) {
    return candidates[Number(query) - 1] || null;
  }
  const q = query.toLowerCase();
  const exact = candidates.find((c) => c.title.toLowerCase() === q);
  if (exact) return exact;
  const hits = candidates.filter((c) => c.title.toLowerCase().includes(q) || c.path.toLowerCase().includes(q));
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    throw new Error(`“${query}” 匹配到 ${hits.length} 篇，请给更精确的片段：\n` +
      hits.map((c) => '  - ' + c.title).join('\n'));
  }
  return null;
}

// ── 9. 主流程 ───────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'help' || args.command === '--help') { usage(); return; }
  if (!args.issue) throw new Error('缺少 --issue YYYY-MM-DD');

  const { epub } = loadIssue(args.issue, args);
  const chapters = parseEpub(fs.readFileSync(epub));
  // 过滤掉广告页/版权页这类没版的短章：真文章版头必有日期行
  const useful = chapters.filter((c) =>
    c.paras.length &&
    c.title &&
    (c.paras.slice(0, 4).some((p) => DATE_LINE_RE.test(p)) || c.paras.length >= 5));

  if (args.command === 'list') {
    useful.forEach((c, i) => console.log(`${String(i + 1).padStart(2, ' ')}. ${c.title}  (${c.paras.length} 段)`));
    return;
  }

  const chapter = pickArticle(useful, args.article);
  if (!chapter) {
    throw new Error('没有匹配的文章。先跑 `list` 看清单：\n' +
      useful.map((c, i) => `  ${i + 1}. ${c.title}`).join('\n'));
  }
  const article = parseArticle(chapter);

  if (args.command === 'text') {
    console.log(`# ${article.title}\n${article.section}\n${article.deck}\n${article.date}\nURL: ${article.url}\n`);
    article.body.forEach((p, i) => console.log(`[${i + 1}] ${p}\n`));
    return;
  }

  // new：写骨架
  const outDir = args.out || path.join(VAULT, '英语学习', '经济学人', args.issue.replace(/-/g, ''));
  const fileName = (args.name || article.title.replace(/[\\/:*?"<>|]/g, '_')).replace(/\.md$/i, '') + '.md';
  const outFile = path.join(outDir, fileName);
  if (fs.existsSync(outFile) && !args.force) {
    throw new Error(`已存在，未覆盖：${outFile}\n（确认要重来就加 --force）`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const md = buildSkeleton(article, { issueDate: args.issue, group: Number(args.group) || 3, zh: args.zh });
  fs.writeFileSync(outFile, md, 'utf8');
  console.log(`已生成骨架：${outFile}`);
  console.log(`段落 ${article.body.length} 个，分 ${Math.ceil(article.body.length / (Number(args.group) || 3))} 节；来源 ${epub}`);
  console.log('下一步：译右栏 → 补节标题 → 填两处词汇注释与总词汇表 → 更新 00 首页链接');
}

try {
  main();
} catch (e) {
  console.error('✗ ' + e.message);
  process.exit(1);
}
