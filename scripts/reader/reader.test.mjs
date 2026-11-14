import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolver, legacyUrl, noteHref, rawHref, headingId } from './shared.mjs';
import { parseNote } from '../build-md-reader.mjs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const manifest = {
  notes: [
    { path: 'index.md', url: '/', aliases: [] },
    { path: '技术笔记/index.md', url: '/技术笔记/', aliases: [] },
    { path: '技术笔记/网络/采样.md', url: '/技术笔记/网络/采样.html', aliases: ['采样定理'] },
    { path: '技术笔记/数据库/入门.md', url: '/技术笔记/数据库/入门.html', aliases: [] },
    { path: '大模型/入门.md', url: '/大模型/入门.html', aliases: [] },
    { path: '大模型/Hello World.md', url: '/大模型/hello-world.html', aliases: [] },
  ],
  files: ['技术笔记/网络/图.png', '技术笔记/数据库/同名.svg', '大模型/同名.svg'],
};
const { resolve, asset } = createResolver(manifest);
test('旧 URL、中文路径、目录首页与别名均可解析', () => {
  assert.equal(legacyUrl('技术笔记/index.md'), '/技术笔记/');
  assert.equal(legacyUrl('大模型/Hello World.md'), '/大模型/hello-world.html');
  for (const route of ['/技术笔记/', '/技术笔记/index.html', '/技术笔记/index', '/技术笔记/index.md']) assert.equal(resolve(route).note.path, '技术笔记/index.md');
  assert.equal(resolve('/index.html').note.path, 'index.md');
  assert.equal(resolve('/%E5%A4%A7%E6%A8%A1%E5%9E%8B/hello-world').note.path, '大模型/Hello World.md');
  assert.equal(resolve('采样定理').note.path, '技术笔记/网络/采样.md');
});
test('同名笔记不随机选取，当前目录与完整路径优先', () => {
  assert.equal(resolve('入门').ambiguous, true);
  assert.equal(resolve('入门', '大模型/Hello World.md').note.path, '大模型/入门.md');
  assert.equal(resolve('../数据库/入门', '技术笔记/网络/采样.md').note.path, '技术笔记/数据库/入门.md');
  assert.equal(resolve('技术笔记/数据库/入门').note.path, '技术笔记/数据库/入门.md');
});
test('章节、块引用与附件保留参数并正确转义', () => {
  assert.equal(resolve('#^sample', '技术笔记/网络/采样.md').hash, '^sample');
  assert.equal(noteHref(manifest.notes[2], '^sample'), '/技术笔记/网络/采样.html#sample');
  assert.equal(headingId('采样 A：边界？'), '采样-a边界');
  assert.equal(asset('图.png', '技术笔记/网络/采样.md'), '技术笔记/网络/图.png');
  assert.equal(asset('同名.svg', 'index.md'), null);
  assert.equal(rawHref('技术笔记/图 #1.png'), '/notes/%E6%8A%80%E6%9C%AF%E7%AC%94%E8%AE%B0/%E5%9B%BE%20%231.png');
});

test('中文章节链接经过解析和净化后不会把百分号编码当成标题', () => {
  const target = '技术笔记/网络/采样';
  const hash = '采样 A：边界？';
  const first = resolve(target + '#' + hash);
  const href = noteHref(first.note, first.hash);
  const again = resolve(href);
  assert.equal(again.hash, headingId(hash));
  assert.equal(noteHref(again.note, again.hash), href);
  assert.equal(resolve(target + '#完成50%').hash, '完成50%');
  assert.equal(resolve(target + '#%5Esample').hash, '^sample');
});
test('YAML 保持标签列表、日期、布尔和嵌套字段的类型', () => {
  const note = parseNote('---\ntags: [技术/网络, 数学]\ncreated: 2026-11-14\ndraft: false\naliases:\n  - 采样\nnested:\n  enabled: true\n---\n# 正文\n');
  assert.deepEqual(note.fm.tags, ['技术/网络', '数学']);
  assert.equal(note.fm.created, '2026-11-14');
  assert.equal(note.fm.draft, false);
  assert.equal(note.fm.nested.enabled, true);
  assert.equal(note.body, '# 正文\n');
});

test('Pages Worker 保留 API 与静态资源，已知文章返回阅读器，未知地址返回 404', async () => {
  const bundled = await build({ entryPoints: [fileURLToPath(new URL('./worker.mjs', import.meta.url))], bundle: true, format: 'esm', write: false });
  const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].contents).toString('base64'));
  const env = {
    ASSETS: { async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      if (pathname === '/index.json') return Response.json(manifest);
      if (pathname === '/index.html') return Response.redirect('https://preview.local/', 301);
      if (pathname === '/') {
        if (request.headers.has('If-None-Match')) return new Response(null, { status: 304 });
        return new Response('<html>阅读器</html>');
      }
      if (pathname === '/notes/技术笔记/网络/采样.md') return new Response('# 采样', { headers: { 'Content-Type': 'text/markdown' } });
      return new Response('missing', { status: 404 });
    } },
  };
  const request = (url, options) => worker.fetch(new Request('https://preview.local' + url, options), env, {});
  assert.equal((await request('/技术笔记/网络/采样.html')).status, 200);
  assert.equal(await (await request('/技术笔记/网络/采样.html')).text(), '<html>阅读器</html>');
  assert.equal(await (await request('/index.html')).text(), '<html>阅读器</html>');
  assert.equal(await (await request('/', { headers: { 'If-None-Match': 'old-shell' } })).text(), '<html>阅读器</html>');
  assert.equal(await (await request('/', { method: 'HEAD' })).text(), '');
  assert.equal((await request('/不存在.html')).status, 404);
  assert.equal(await (await request('/notes/技术笔记/网络/采样.md')).text(), '# 采样');
  assert.equal((await request('/notes/missing.md')).status, 404);
  assert.equal((await request('/技术笔记/', { method: 'POST' })).status, 405);
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/')).headers.get('Cache-Control'), 'no-cache');
});
