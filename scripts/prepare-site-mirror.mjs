#!/usr/bin/env node
// 为普通静态服务器复制统一入口；不解析 Markdown，也不输出文章正文 HTML。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const vault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(vault, '_site/md-reader'));
const output = path.resolve(process.argv[3] || path.join(vault, '_site/mirror'));
if (source === output || source.startsWith(output + path.sep) || output.startsWith(source + path.sep) || output === vault || vault.startsWith(output + path.sep)) throw new Error('镜像目录必须独立于源码与输入目录');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'index.json'), 'utf8'));
const shell = fs.readFileSync(path.join(source, 'index.html'), 'utf8').replace('<head>', '<head>\n<meta name="reader-api-origin" content="https://wuhy-notes.pages.dev">');
fs.mkdirSync(output, { recursive: true });
fs.cpSync(source, output, { recursive: true, filter: file => !['.md-reader-build.json', '_worker.js', '_routes.json', '_headers'].includes(path.basename(file)) });
fs.writeFileSync(path.join(output, 'index.html'), shell);
for (const note of manifest.notes) {
  const relative = note.url.replace(/^\//, '') + (note.url.endsWith('/') ? 'index.html' : '');
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error('镜像路由越界：' + note.url);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, shell);
}
console.log('静态镜像已生成：' + manifest.notes.length + ' 个入口 → ' + output);
