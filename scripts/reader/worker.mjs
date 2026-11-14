// Pages 高级模式：旧文章 URL 返回统一阅读器，API 继续复用现有实现。
import knowledgeApi from '../../cloudflare/_worker.js';
import { createResolver } from './shared.mjs';

let manifestPromise;
async function getResolver(env) {
  if (!manifestPromise) {
    manifestPromise = env.ASSETS.fetch(new Request('https://assets.local/index.json'))
      .then(async response => {
        if (!response.ok) throw new Error('目录索引暂不可用');
        return createResolver(await response.json());
      }).catch(error => { manifestPromise = null; throw error; });
  }
  return manifestPromise;
}
export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') || url.pathname === '/ask') return knowledgeApi.fetch(request, env, context);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    if (/^\/(?:assets|static|notes)\//.test(url.pathname) || ['/index.json', '/plotly.min.js', '/embeddings.json', '/favicon.ico', '/robots.txt'].includes(url.pathname)) return env.ASSETS.fetch(request);
    try {
      const resolver = await getResolver(env);
      const known = url.pathname === '/' || url.pathname === '/index.html' || resolver.resolve(url.pathname).note;
      const shellUrl = new URL('/index.html', url);
      const shell = await env.ASSETS.fetch(new Request(shellUrl, request));
      const headers = new Headers(shell.headers);
      headers.set('Cache-Control', 'no-cache');
      headers.set('Content-Type', 'text/html; charset=utf-8');
      return new Response(request.method === 'HEAD' ? null : shell.body, { status: known ? 200 : 404, headers });
    } catch {
      return new Response('目录索引暂不可用，请稍后重试。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
  },
};
