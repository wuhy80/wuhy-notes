import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

test('向量刷新复用未变化正文，重新生成修改项并移除删除项', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-index-'));
  try {
    const content = path.join(temporary, 'notes');
    fs.mkdirSync(content);
    const output = path.join(temporary, 'vectors.json');
    const calls = path.join(temporary, 'calls.json');
    const mock = path.join(temporary, 'mock.mjs');
    fs.writeFileSync(mock, `import fs from 'node:fs';
globalThis.fetch = async (url, options) => {
  const {text} = JSON.parse(options.body);
  fs.writeFileSync(process.env.READER_EMBED_CALLS, JSON.stringify(text));
  return Response.json({success:true,result:{data:text.map(() => [1,2,3])}});
};`);
    const run = () => {
      if (fs.existsSync(calls)) fs.unlinkSync(calls);
      execFileSync(process.execPath, ['--import', pathToFileURL(mock).href, fileURLToPath(new URL('../build-embeddings.mjs', import.meta.url)), '--content', content, '--out', output], {
        env: { ...process.env, CF_API_TOKEN: 'test-token', READER_EMBED_CALLS: calls }, windowsHide: true,
      });
      return { data: JSON.parse(fs.readFileSync(output)), count: fs.existsSync(calls) ? JSON.parse(fs.readFileSync(calls)).length : 0 };
    };
    fs.writeFileSync(path.join(content, 'a.md'), '# A\n\n正文 A');
    fs.writeFileSync(path.join(content, 'b.md'), '# B\n\n正文 B');
    const first = run();
    assert.equal(first.count, 2);
    fs.writeFileSync(path.join(content, 'b.md'), '# B\n\n更新正文 B');
    const updated = run();
    assert.equal(updated.count, 1);
    assert.equal(updated.data.docs.find(d => d.p === 'a.md').h, first.data.docs.find(d => d.p === 'a.md').h);
    assert.notEqual(updated.data.docs.find(d => d.p === 'b.md').h, first.data.docs.find(d => d.p === 'b.md').h);
    fs.unlinkSync(path.join(content, 'b.md'));
    fs.writeFileSync(path.join(content, 'c.md'), '# C\n\n新正文 C');
    const deleted = run();
    assert.equal(deleted.count, 1);
    assert.deepEqual(deleted.data.docs.map(d => d.p), ['a.md', 'c.md']);
    const bytes = fs.readFileSync(output, 'utf8');
    assert.equal(run().count, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), bytes);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});

test('国内镜像保留旧文章直达入口，排除 Pages Worker 和内部构建文件', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-mirror-'));
  try {
    const source = path.join(temporary, 'site'), output = path.join(temporary, 'mirror');
    fs.mkdirSync(path.join(source, 'notes'), { recursive: true });
    fs.writeFileSync(path.join(source, 'index.html'), '<html><head></head><article></article></html>');
    fs.writeFileSync(path.join(source, 'index.json'), JSON.stringify({ notes: [{url:'/'}, {url:'/技术笔记/文章.html'}, {url:'/大模型/'}] }));
    fs.writeFileSync(path.join(source, 'notes/a.md'), '# 正文');
    for (const name of ['_worker.js', '_routes.json', '_headers', '.md-reader-build.json']) fs.writeFileSync(path.join(source, name), 'internal');
    execFileSync(process.execPath, [fileURLToPath(new URL('../prepare-site-mirror.mjs', import.meta.url)), source, output], { windowsHide: true });
    for (const route of ['index.html','技术笔记/文章.html','大模型/index.html']) assert.match(fs.readFileSync(path.join(output, route), 'utf8'), /reader-api-origin/);
    assert.equal(fs.readFileSync(path.join(output, 'notes/a.md'), 'utf8'), '# 正文');
    for (const name of ['_worker.js', '_routes.json', '_headers', '.md-reader-build.json']) assert.equal(fs.existsSync(path.join(output, name)), false);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
