#!/usr/bin/env node
// 只打包阅读器、复制公开 MD 与附件、生成目录；不预渲染任何正文。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';
import { parse as parseYaml } from 'yaml';
import { legacyUrl } from './reader/shared.mjs';

export const VAULT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20);
const slash = value => value.split(path.sep).join('/');
function option(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
export function parseNote(raw) {
  raw = raw.replace(/^\uFEFF/, '');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const fm = match ? parseYaml(match[1], { maxAliasCount: 50 }) || {} : {};
  return { fm, body: match ? raw.slice(match[0].length) : raw };
}
function list(value) { return (Array.isArray(value) ? value : value ? [value] : []).map(String); }
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error('公开导出目录不能包含符号链接：' + full);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}
function references(body) {
  // 代码和注释中的示例链接不进入反向链接索引。
  const prose = body.replace(/^\s*(\x60{3,}|~{3,})[\s\S]*?^\s*(?:\x60{3,}|~{3,})\s*$/gm, '').replace(/\x60[^\x60]*\x60/g, '').replace(/%%[\s\S]*?%%/g, '');
  return [...new Set([...prose.matchAll(/!?\[\[([^\]|]+)(?:\\?\|[^\]]*)?\]\]/g)].map(match => match[1].replace(/\\$/, '')))];
}
export async function buildReader({ content, out }) {
  const started = performance.now();
  content = path.resolve(content);
  out = path.resolve(out);
  if (content === VAULT || out === VAULT || VAULT.startsWith(out + path.sep) || content === out || out.startsWith(content + path.sep) || content.startsWith(out + path.sep)) throw new Error('输入必须是独立的公开导出目录，产物不能与知识库根目录或输入目录重叠');
  if (!fs.existsSync(path.join(content, 'index.md'))) throw new Error('找不到公开导出目录 index.md：' + content);
  const files = walk(content);
  const notes = [];
  const publicFiles = [];
  const meta = [];
  const stamp = hash(files.map(full => slash(path.relative(content, full)) + ':' + hash(fs.readFileSync(full))).join('\n'));
  fs.mkdirSync(out, { recursive: true });
  const generated = new Set();
  const previousPath = path.join(out, '.md-reader-build.json');
  const previousFiles = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')).files : [];
  function removeManaged(rel) {
    const full = path.resolve(out, rel);
    if (!full.startsWith(out + path.sep)) throw new Error('构建清单包含越界路径');
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  function write(rel, data) {
    generated.add(rel);
    const destination = path.join(out, rel);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(bytes)) fs.writeFileSync(destination, bytes);
  }
  function copyTree(from, to) {
    for (const full of walk(from)) write(to + '/' + slash(path.relative(from, full)), fs.readFileSync(full));
  }
  const commitDates = new Map();
  const log = spawnSync('git', ['-c', 'safe.directory=' + slash(VAULT), '-C', VAULT, '-c', 'core.quotepath=false', 'log', '--name-only', '--format=__T__%cI'], { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (log.status === 0) {
    let date;
    for (const line of log.stdout.split(/\r?\n/)) {
      if (line.startsWith('__T__')) date = line.slice(5);
      else if (line && date && !commitDates.has(line)) commitDates.set(line, date);
    }
  }
  for (const full of files) {
    const rel = slash(path.relative(content, full));
    if (!/\.(md|svg|png|jpe?g|gif|webp)$/i.test(rel)) continue;
    const bytes = fs.readFileSync(full);
    if (/\.md$/i.test(rel)) {
      const { fm, body } = parseNote(bytes.toString('utf8'));
      if (fm.draft === true) continue;
      const title = String(fm.title || body.match(/^#\s+(.+)$/m)?.[1] || path.basename(rel, '.md'));
      const tags = list(fm.tags).map(tag => tag.replace(/^#/, ''));
      const updated = String(fm.updated || commitDates.get(rel) || fs.statSync(full).mtime.toISOString());
      notes.push({ path: rel, title, tags, aliases: list(fm.aliases), updated, hash: hash(bytes), url: legacyUrl(rel), links: references(body) });
      const prose = body.replace(/^\s*(?:\x60{3,}|~{3,})[\s\S]*?^\s*(?:\x60{3,}|~{3,})\s*$/gm, '');
      const et = [...new Set([...prose.matchAll(/(?:^|\s)#([\p{L}\p{N}][\p{L}\p{N}/_-]*)/gu)].map(m => '#' + m[1]))];
      const tk = [...prose.matchAll(/^\s*[-*]\s+\[ \]\s+(.+)$/gm)].map(m => ({ t: m[1], l: body.slice(0, body.indexOf(m[0])).split('\n').length }));
      meta.push({ p: rel.replace(/\.md$/i, ''), fo: path.posix.dirname(rel) === '.' ? '' : path.posix.dirname(rel), na: path.basename(rel, '.md'), fm, mt: updated, tg: tags, et, tk });
    } else publicFiles.push(rel);
    write('notes/' + rel, bytes);
  }
  write('index.json', JSON.stringify({ version: 1, revision: stamp, notes, files: publicFiles }));
  write('static/vault-meta.json', JSON.stringify({ generated: stamp, pages: meta }));
  // 生词聚合前移除旧正文，避免已删除文章继续进入词汇索引。
  for (const rel of previousFiles) {
    if (rel.startsWith('notes/') && !generated.has(rel)) removeManaged(rel);
  }
  const vocab = spawnSync(process.execPath, [path.join(VAULT, 'scripts/build-vocab.mjs'), path.join(out, 'notes'), path.join(out, 'static/vocab.json')], { encoding: 'utf8', windowsHide: true });
  if (vocab.status !== 0) throw new Error(vocab.stderr || '生词本生成失败');
  generated.add('static/vocab.json');
  write('index.html', fs.readFileSync(path.join(VAULT, 'scripts/reader/index.html')));
  write('assets/reader.css', fs.readFileSync(path.join(VAULT, 'scripts/reader/reader.css')));
  write('static/dataview-lite.js', fs.readFileSync(path.join(VAULT, 'scripts/site-assets/dataview-lite.cjs')));
  write('static/bilingual-reader.js', fs.readFileSync(path.join(VAULT, 'scripts/site-assets/bilingual-reader.cjs')));
  write('static/font/AlimamaShuHeiTi-Bold.woff2', fs.readFileSync(path.join(VAULT, 'scripts/site-assets/AlimamaShuHeiTi-Bold.woff2')));
  copyTree(path.join(VAULT, 'scripts/site-assets/source-sans-pro'), 'static/font/source-sans-pro');
  for (const name of ['nyquist-demo.html', 'pv-digital-twin.html']) write('static/' + name, fs.readFileSync(path.join(VAULT, 'scripts/site-assets', name)));
  copyTree(path.join(VAULT, 'scripts/site-assets/pv-factory-3d'), 'static/pv-factory-3d');
  write('plotly.min.js', fs.readFileSync(path.join(VAULT, 'cloudflare/plotly.min.js')));
  const bundle = await build({
    absWorkingDir: VAULT, entryPoints: { app: 'scripts/reader/app.mjs' },
    outdir: path.join(out, 'assets'), bundle: true, splitting: true, format: 'esm', platform: 'browser',
    target: ['es2022'], minify: true, metafile: true, write: false,
    chunkNames: 'chunks/[name]-[hash]', legalComments: 'none',
  });
  for (const file of bundle.outputFiles) write(slash(path.relative(out, file.path)), file.contents);
  copyTree(path.join(VAULT, 'node_modules/katex/dist/fonts'), 'assets/katex/fonts');
  write('assets/katex/katex.min.css', fs.readFileSync(path.join(VAULT, 'node_modules/katex/dist/katex.min.css')));
  // 复用原站阅读工具样式；浏览器原生 CSS nesting，无 Sass / Quartz 编译。
  const custom = fs.readFileSync(path.join(VAULT, 'scripts/site-custom.scss'), 'utf8');
  const readingSections = custom.slice(custom.indexOf('// ── 13/13 双语精读阅读器'), custom.indexOf('// ── 14/14 移动端：')) +
    custom.slice(custom.indexOf('// 14 Dataview 站点端渲染'));
  const tools = readingSections.split(/\r?\n/).map(line => line.replace(/^\s*\/\/.*$/, '').replace(/\s+\/\/.*$/, '').replace(/\$codeFontStack/g, 'var(--code)')).join('\n');
  write('assets/reading-tools.css', tools);
  const worker = await build({ absWorkingDir: VAULT, entryPoints: ['scripts/reader/worker.mjs'], bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], write: false, minify: true });
  write('_worker.js', worker.outputFiles[0].contents);
  write('404.html', '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>未找到文件</title><p>此文件未随站点发布。</p><a href="/">返回知识库</a></html>\n');
  const vectors = path.join(VAULT, 'cloudflare/embeddings.json');
  if (fs.existsSync(vectors)) write('embeddings.json', fs.readFileSync(vectors));
  write('_headers', '/index.html\n  Cache-Control: no-cache\n/index.json\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=3600\n/assets/chunks/*\n  Cache-Control: public, max-age=31536000, immutable\n/notes/*\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Content-Type-Options: nosniff\n/static/*.json\n  Cache-Control: no-cache\n');
  write('_routes.json', JSON.stringify({ version: 1, include: ['/*'], exclude: ['/assets/*', '/static/*', '/notes/*', '/index.json', '/plotly.min.js'] }));
  for (const rel of previousFiles) if (!generated.has(rel)) removeManaged(rel);
  fs.writeFileSync(previousPath, JSON.stringify({ revision: stamp, files: [...generated].sort() }));
  console.log('Markdown 阅读器：' + notes.length + ' 篇笔记，' + publicFiles.length + ' 个附件；构建 ' + ((performance.now() - started) / 1000).toFixed(2) + ' 秒 → ' + out);
  return { notes: notes.length, out, revision: stamp };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const siteRoot = process.env.SITE_ROOT || path.join(VAULT, '_site/md-reader-export');
  await buildReader({ content: option('--content', path.join(siteRoot, 'content')), out: option('--out', path.join(VAULT, '_site/md-reader')) });
}
