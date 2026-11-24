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
  // 非目录入口统一落成 .html：普通静态服务器（nginx）用 try_files $uri.html 命中，
  // 能正确返回 text/html；写成无扩展名文件会被当成 text/plain，页面直接变成源码。
  const relative = note.url.endsWith('/')
    ? note.url.replace(/^\//, '') + 'index.html'
    : note.url.replace(/^\//, '') + '.html';
  const target = path.resolve(output, relative);
  if (!target.startsWith(output + path.sep)) throw new Error('镜像路由越界：' + note.url);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, shell);
}
// 版本标记：国内同步后用它校验“线上确实是本次构建”，而不是上一版残留。
const buildInfo = {
  runId: process.env.GITHUB_RUN_ID || 'local',
  sha: process.env.GITHUB_SHA || '',
  builtAt: new Date().toISOString(),
  notes: manifest.notes.length,
};
fs.writeFileSync(path.join(output, 'BUILD.json'), JSON.stringify(buildInfo, null, 2) + '\n');
console.log('静态镜像已生成：' + manifest.notes.length + ' 个入口 → ' + output);
