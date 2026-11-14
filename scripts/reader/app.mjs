import { createResolver, noteHref, rawHref, headingId } from './shared.mjs';
import { createMarkdown, enhanceDiagrams } from './markdown.mjs';
import { renderNavigation } from './navigation.mjs';

const $ = selector => document.querySelector(selector);
const article = $('#article');
const status = $('#status');
const source = $('#source');
let manifest, resolver, markdown, current, currentRaw = '', sourceMode = false;
let navigation = 0;
let loadController;
let loading = false;
const rawCache = new Map();
const scriptLoads = new Map();

function message(text) { status.textContent = text; status.hidden = !text; }
function makeLink(note, label = note.title) {
  const a = document.createElement('a');
  a.href = noteHref(note);
  a.textContent = label;
  return a;
}
async function fetchRaw(note, signal) {
  if (rawCache.has(note.path)) return rawCache.get(note.path);
  const response = await fetch(rawHref(note.path, note.hash), { signal });
  if (!response.ok || /text\/html/.test(response.headers.get('content-type') || '')) throw new Error('正文读取失败（HTTP ' + response.status + '）');
  const raw = await response.text();
  rawCache.set(note.path, raw);
  if (rawCache.size > 24) rawCache.delete(rawCache.keys().next().value);
  return raw;
}
function loadScript(url) {
  if (!scriptLoads.has(url)) {
    scriptLoads.set(url, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => { scriptLoads.delete(url); script.remove(); reject(new Error('阅读工具加载失败')); };
      document.head.appendChild(script);
    }));
  }
  return scriptLoads.get(url);
}
function activateTree() {
  for (const a of $('#tree').querySelectorAll('a')) {
    const active = a.dataset.path === current?.path || a.dataset.groupActive === 'true';
    a.toggleAttribute('aria-current', active);
    a.classList.toggle('active', active);
    if (active) {
      a.setAttribute('aria-current', 'page');
      for (let parent = a.parentElement; parent && parent !== $('#tree'); parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
    }
  }
}
function renderTree(filter = '') {
  renderNavigation(manifest, current, filter);
  activateTree();
}
function renderToc() {
  const links = [...article.querySelectorAll('h2[id], h3[id]')].map(h => {
    const a = document.createElement('a');
    a.href = '#' + encodeURIComponent(h.id);
    a.textContent = h.textContent;
    a.classList.toggle('subheading', h.tagName === 'H3');
    return a;
  });
  $('#toc').replaceChildren(...links);
}
function renderBacklinks() {
  const refs = manifest.notes.filter(note => note.links.some(target => resolver.resolve(target, note.path).note?.path === current.path));
  $('#backlinks').replaceChildren(...refs.map(note => makeLink(note)));
  if (!refs.length) $('#backlinks').textContent = '暂无其他笔记链接到本文';
  const outgoing = current.links.map(target => resolver.resolve(target, current.path).note).filter(Boolean);
  const related = [...new Map([...outgoing, ...refs].filter(note => note.path !== current.path).map(note => [note.path, note])).values()].slice(0, 10);
  const svg = $('#local-graph');
  svg.replaceChildren();
  const make = (tag, attributes) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
    return el;
  };
  related.forEach((note, i) => {
    const angle = 2 * Math.PI * i / related.length - Math.PI / 2;
    const x = 120 + 80 * Math.cos(angle), y = 87 + 62 * Math.sin(angle);
    svg.append(make('line', { x1: 120, y1: 87, x2: x, y2: y, stroke: 'var(--line)' }));
    const a = make('a', { href: note.url, 'aria-label': note.title });
    const title = make('title', {});
    title.textContent = note.title;
    a.append(title, make('circle', { cx: x, cy: y, r: 4, fill: 'var(--ink-faint)' }));
    svg.append(a);
  });
  svg.append(make('circle', { cx: 120, cy: 87, r: 6, fill: 'var(--accent)' }));
}
async function expandEmbeds(root, note, chain, signal) {
  for (const element of root.querySelectorAll('[data-embed]')) {
    const target = resolver.resolve(element.dataset.embed, note.path);
    if (!target.note || chain.includes(target.note.path) || chain.length >= 3) continue;
    const raw = await fetchRaw(target.note, signal);
    const box = document.createElement('div');
    box.className = 'embedded-content';
    box.innerHTML = markdown.render(raw, target.note.path);
    if (target.hash) {
      const id = target.hash.startsWith('^') ? target.hash.slice(1) : headingId(target.hash);
      const anchor = [...box.querySelectorAll('[id]')].find(node => node.id === id);
      if (!anchor) continue;
      const fragment = document.createDocumentFragment();
      fragment.append(anchor.cloneNode(true));
      if (/^H[1-6]$/.test(anchor.tagName)) {
        for (let next = anchor.nextElementSibling; next; next = next.nextElementSibling) {
          if (/^H[1-6]$/.test(next.tagName) && Number(next.tagName[1]) <= Number(anchor.tagName[1])) break;
          fragment.append(next.cloneNode(true));
        }
      }
      box.replaceChildren(fragment);
    }
    await expandEmbeds(box, target.note, [...chain, target.note.path], signal);
    element.append(box);
  }
}
function normalizeFrames(root) {
  for (const frame of root.querySelectorAll('iframe')) {
    const url = new URL(frame.getAttribute('src') || '', location.href);
    if (!['http:', 'https:'].includes(url.protocol)) { frame.remove(); continue; }
    if (url.hostname === 'wuhy-notes.pages.dev' && url.pathname.startsWith('/static/')) frame.src = url.pathname;
    frame.loading = 'lazy';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    frame.referrerPolicy = 'no-referrer';
  }
}
async function renderArticle(id) {
  article.innerHTML = '<div class="markdown-preview-view">' + markdown.render(currentRaw, current.path) + '</div>';
  if (!article.querySelector('h1')) {
    const h1 = document.createElement('h1');
    h1.textContent = current.title;
    article.firstElementChild.prepend(h1);
  }
  article.querySelector('h1')?.classList.add('article-title');
  await expandEmbeds(article, current, [current.path], loadController.signal);
  if (id !== navigation) return;
  normalizeFrames(article);
  renderToc();
  renderBacklinks();
  const loads = [];
  if (article.querySelector('[data-language="dataview"], [data-language="dataviewjs"], [data-language="tagcloud"], [data-language="vocab-notebook"]')) {
    loads.push(loadScript('/static/dataview-lite.js'));
  }
  if ([...article.querySelectorAll('table')].some(table => [...table.querySelectorAll('thead th')].map(th => th.textContent.trim()).join('|') === '原文|译文')) {
    loads.push(loadScript('/static/bilingual-reader.js'));
  }
  await Promise.all(loads);
  if (id !== navigation) return;
  document.dispatchEvent(new CustomEvent('nav', { detail: { url: location.pathname } }));
  enhanceDiagrams(article, () => id === navigation && !sourceMode).catch(error => console.warn(error));
  scrollToHash();
}
function scrollToHash() {
  if (!location.hash) return;
  let hash;
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(hash) || document.getElementById(headingId(hash));
  target?.scrollIntoView({ block: 'start' });
}
async function navigate() {
  const id = ++navigation;
  loadController?.abort();
  loadController = new AbortController();
  const result = resolver.resolve(location.pathname);
  const note = result.note || (location.pathname === '/' ? manifest.notes.find(n => n.path === 'index.md') : null);
  if (!note) {
    current = null;
    article.replaceChildren();
    source.hidden = true;
    message('未找到这篇公开笔记。请从左侧目录选择文章。');
    document.title = '未找到笔记 · 格物志';
    return;
  }
  current = note;
  document.body.classList.toggle('landing', note.path === 'index.md');
  loading = true;
  currentRaw = '';
  source.querySelector('code').textContent = '';
  document.title = note.title + ' · 格物志';
  document.body.dataset.slug = note.path.replace(/\.md$/i, '');
  $('#breadcrumb').textContent = 'Home  ›  ' + note.path.replace(/\.md$/i, '').split('/').join('  ›  ');
  $('#metadata').textContent = (note.updated || '').slice(0, 10);
  $('#download').href = rawHref(note.path);
  $('#download').download = note.path.split('/').at(-1);
  renderTree($('#filter').value);
  message('正在读取笔记…');
  article.replaceChildren();
  try {
    currentRaw = await fetchRaw(note, loadController.signal);
    if (id !== navigation) return;
    loading = false;
    $('#metadata').textContent = (note.updated || '').slice(0, 10) + '，' + Math.max(1, Math.ceil(currentRaw.length / 700)) + ' 分钟阅读';
    source.querySelector('code').textContent = currentRaw;
    article.hidden = sourceMode;
    source.hidden = !sourceMode;
    if (!sourceMode) await renderArticle(id);
    else document.dispatchEvent(new CustomEvent('nav'));
    if (id === navigation) message('');
  } catch (error) {
    if (id === navigation) loading = false;
    if (error.name !== 'AbortError' && id === navigation) message(error.message + '，可以刷新重试或下载 MD。');
  }
}
function changeMode(value) {
  if (!current || sourceMode === value) return;
  sourceMode = value;
  $('#read-mode').setAttribute('aria-pressed', String(!value));
  $('#source-mode').setAttribute('aria-pressed', String(value));
  if (loading) {
    article.hidden = value;
    source.hidden = !value;
    return;
  }
  if (value) {
    navigation++;
    article.replaceChildren();
    article.hidden = true;
    source.hidden = false;
    $('#toc').replaceChildren();
    document.dispatchEvent(new CustomEvent('nav'));
  } else {
    article.hidden = false;
    source.hidden = true;
    renderArticle(navigation).catch(error => message(error.message));
  }
}
let searchController, searchTimer;
async function search() {
  searchController?.abort();
  searchController = new AbortController();
  const query = $('#query').value.trim();
  const results = $('#results');
  results.replaceChildren();
  if (!query) { $('#search-status').textContent = '按标题、路径和标签即时检索；全文搜索使用站点索引。'; return; }
  const local = manifest.notes.filter(note => (note.title + ' ' + note.path + ' ' + note.tags.join(' ')).toLowerCase().includes(query.toLowerCase())).slice(0, 40);
  function append(note, excerpt) {
    const a = makeLink(note);
    const p = document.createElement('small');
    p.textContent = excerpt || note.path;
    a.append(p);
    results.append(a);
  }
  local.forEach(note => append(note));
  $('#search-status').textContent = '本地匹配 ' + local.length + ' 篇，正在查询全文…';
  try {
    const response = await fetch('/api/search?q=' + encodeURIComponent(query) + '&limit=20', { signal: searchController.signal });
    if (!response.ok) throw new Error('全文索引暂不可用');
    const data = await response.json();
    const rows = data.results || data.notes || [];
    const seen = new Set(local.map(n => n.path));
    for (const row of rows) {
      const note = resolver.resolve(row.path).note;
      if (note && !seen.has(note.path)) {
        seen.add(note.path);
        append(note, String(row.abstract || row.excerpt || '').replace(/<[^>]*>/g, ''));
      }
    }
    $('#search-status').textContent = '找到 ' + seen.size + ' 篇笔记';
  } catch (error) {
    if (error.name !== 'AbortError') $('#search-status').textContent = '本地匹配 ' + local.length + ' 篇；全文索引暂不可用。';
  }
}
function openSearch() { $('#search-dialog').showModal(); $('#query').focus(); search(); }
document.addEventListener('click', event => {
  const a = event.target.closest('a[href]');
  if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.hasAttribute('download') || a.target) return;
  const url = new URL(a.getAttribute('href'), location.href);
  if (url.origin !== location.origin || !resolver || !resolver.resolve(url.pathname).note || url.pathname.startsWith('/notes/')) return;
  event.preventDefault();
  $('#search-dialog').close();
  $('#sidebar').classList.remove('is-open');
  $('#menu').setAttribute('aria-expanded', 'false');
  if (url.pathname === location.pathname && url.hash) {
    history.pushState(null, '', url);
    scrollToHash();
  } else {
    history.pushState(null, '', url);
    window.scrollTo(0, 0);
    navigate();
  }
});
window.addEventListener('popstate', navigate);
$('#read-mode').addEventListener('click', () => changeMode(false));
$('#source-mode').addEventListener('click', () => changeMode(true));
$('#filter').addEventListener('input', () => renderTree($('#filter').value));
$('#search-toggle').addEventListener('click', openSearch);
$('#query').addEventListener('input', () => { clearTimeout(searchTimer); searchController?.abort(); searchTimer = setTimeout(search, 180); });
$('#search-dialog').addEventListener('close', () => searchController?.abort());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#search-dialog').open) {
    event.preventDefault();
    $('#search-dialog').close();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
});
$('#menu').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('is-open');
  $('#menu').setAttribute('aria-expanded', String(open));
});
document.documentElement.dataset.theme = document.documentElement.getAttribute('saved-theme') || 'light';
document.addEventListener('themechange', event => { document.documentElement.dataset.theme = event.detail.theme; });
$('#focus-mode').addEventListener('click', () => {
  const focused = document.body.classList.toggle('reader-focus');
  $('#focus-mode').setAttribute('aria-pressed', String(focused));
});

async function boot() {
  try {
    const response = await fetch('/index.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('目录索引读取失败');
    manifest = await response.json();
    resolver = createResolver(manifest);
    markdown = createMarkdown(resolver);
    $('#note-count').textContent = manifest.notes.length + ' 篇';
    renderTree();
    await navigate();
  } catch (error) { message(error.message + '，请刷新重试。'); }
}
boot();
if (['127.0.0.1', 'localhost'].includes(location.hostname)) {
  const updates = new EventSource('/_reader/events');
  updates.addEventListener('reload', () => location.reload());
  updates.onerror = () => updates.close();
}
