const fs = require('node:fs');
const path = require('node:path');
const YAML = require('E:/Obsidian/public-site/quartz/node_modules/yaml');

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