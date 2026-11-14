#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
export async function verifyReader(url, expected) {
  const get = async pathname => {
    const response = await fetch(new URL(pathname, url), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(pathname + ' 返回 HTTP ' + response.status);
    return response;
  };
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      if (!(await (await get('/')).text()).includes('<article')) throw new Error('入口未返回阅读器页面');
      const manifest = await (await get('/index.json')).json();
      if (!manifest.notes?.length) throw new Error('线上目录为空');
      if (expected && manifest.revision !== expected.revision) throw new Error('线上目录尚未更新到本次内容');
      const note = manifest.notes[0];
      const raw = await get('/notes/' + note.path.split('/').map(encodeURIComponent).join('/'));
      if (!raw.headers.get('Content-Type')?.includes('text/markdown') || !(await raw.text()).trim()) throw new Error('线上 MD 正文不可用');
      console.log('线上访问校验通过：阅读器入口、' + manifest.notes.length + ' 篇笔记目录与 MD 正文。');
      return;
    } catch (error) {
      if (attempt === 6) throw new Error('线上访问校验失败：' + error.message);
      console.log('等待站点更新：' + error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyReader(process.argv[2] || 'https://wuhy-notes.pages.dev/', process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : undefined);
}
