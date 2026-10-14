const fs = require('node:fs');
const path = require('node:path');

// yaml 模块随 Quartz 安装，本仓库自身不带 node_modules。
// 解析顺序：常规 node_modules → SITE_ROOT 环境变量指向的站点（CI 场景）→ 旧机器硬编码路径（兼容遗留本地用法）。
const tryLoad = (p) => { try { return require(p); } catch { return null; } };
const YAML = tryLoad('yaml')
  || (process.env.SITE_ROOT ? tryLoad(path.join(process.env.SITE_ROOT, 'quartz', 'node_modules', 'yaml')) : null)
  || tryLoad('E:/Obsidian/public-site/quartz/node_modules/yaml');
if (!YAML) {
  throw new Error('无法加载 yaml 模块：请设置 SITE_ROOT 指向站点根目录（内含 quartz/node_modules/yaml）');
}

const root = process.argv[2];
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith('.md')) files.push(p);
  }
})(root);

let ok = 0, noFm = 0;
const bad = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  if (!txt.startsWith('---')) { noFm++; continue; }
  const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { bad.push([f, 'frontmatter 未闭合']); continue; }
  try { YAML.parse(m[1]); ok++; }
  catch (e) { bad.push([f, String(e.message).split('\n')[0]]); }
}

console.log('文件总数        = ' + files.length);
console.log('无 frontmatter  = ' + noFm);
console.log('frontmatter 正常 = ' + ok);
console.log('frontmatter 出错 = ' + bad.length);
for (const [f, e] of bad) console.log('   ' + path.relative(root, f) + '   ||   ' + e);