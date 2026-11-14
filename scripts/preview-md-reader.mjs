#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { VAULT, buildReader } from './build-md-reader.mjs';
import { createResolver } from './reader/shared.mjs';

const args = process.argv.slice(2);
function option(flag, fallback) { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; }
const out = path.resolve(option('--out', path.join(VAULT, '_site/md-reader')));
const siteRoot = process.env.SITE_ROOT || path.join(VAULT, '_site/md-reader-export');
const content = option('--content', path.join(siteRoot, 'content'));
if (!args.includes('--skip-build')) {
  if (!args.includes('--skip-export')) {
    const env = { ...process.env, VAULT_DIR: VAULT, SITE_ROOT: siteRoot, NODE_EXE: process.execPath };
    const count = Number(env.GIT_CONFIG_COUNT || 0);
    env.GIT_CONFIG_COUNT = String(count + 1);
    env['GIT_CONFIG_KEY_' + count] = 'safe.directory';
    env['GIT_CONFIG_VALUE_' + count] = VAULT.split(path.sep).join('/');
    const shell = process.platform === 'win32' ? path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe') : 'pwsh';
    const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(VAULT, 'scripts/export-public.ps1')], { env, cwd: VAULT, stdio: 'inherit', windowsHide: true });
    if (result.error || result.status !== 0) throw result.error || new Error('公开导出失败，停止构建');
  }
  await buildReader({ content, out });
}
if (!args.includes('--build-only')) {
  if (!fs.existsSync(path.join(out, 'index.json'))) throw new Error('阅读器未构建，请先运行 npm run reader:build');
  const manifest = JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8'));
  const resolver = createResolver(manifest);
  const port = Number(option('--port', '8790'));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
  const server = http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const url = new URL(request.url, 'http://127.0.0.1:' + port);
    if (url.pathname.startsWith('/api/')) {
      // 仅代理公开只读搜索；本地预览不调用 AI、不写远端。
      if (!['/api/search', '/api/health'].includes(url.pathname)) { response.writeHead(404); response.end(); return; }
      try {
        const remote = await fetch('https://wuhy-notes.pages.dev' + url.pathname + url.search, { signal: AbortSignal.timeout(5000) });
        response.writeHead(remote.status, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(await remote.text());
      } catch { response.writeHead(503, { 'Content-Type': 'application/json' }); response.end('{"error":"搜索索引暂不可用"}'); }
      return;
    }
    let relative;
    try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, ''); }
    catch { response.writeHead(400); response.end(); return; }
    if (relative.split('/').some(part => part.startsWith('.') || part === '_worker.js' || part === '_headers' || part === '_routes.json') || relative.includes('\\')) {
      response.writeHead(404); response.end(); return;
    }
    let file = path.resolve(out, relative);
    if (file !== out && !file.startsWith(out + path.sep)) { response.writeHead(403); response.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      if (resolver.resolve(url.pathname).note || url.pathname === '/') file = path.join(out, 'index.html');
      else { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('未找到公开文件'); return; }
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).pipe(response);
  });
  server.listen(port, '127.0.0.1', () => console.log('Markdown 阅读预览：http://127.0.0.1:' + port + '（Ctrl+C 停止）'));
}
