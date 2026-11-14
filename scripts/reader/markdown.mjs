import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { headingId, noteHref, rawHref } from './shared.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const stripFrontmatter = raw => raw.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');

// 在 token 层识别 WikiLink，不改写代码块、行内代码或公式中的内容。
export function createMarkdown(resolver) {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: false })
    .use(footnote).use(taskLists, { enabled: false });

  md.inline.ruler.before('image', 'wikilink', (state, silent) => {
    const start = state.pos;
    const embedded = state.src.startsWith('![[', start);
    if (!embedded && !state.src.startsWith('[[', start)) return false;
    const end = state.src.indexOf(']]', start + (embedded ? 3 : 2));
    if (end < 0) return false;
    if (!silent) {
      const token = state.push('wikilink', '', 0);
      token.meta = { value: state.src.slice(start + (embedded ? 3 : 2), end).replace(/\\\|/g, '|'), embedded };
    }
    state.pos = end + 2;
    return true;
  });
  md.renderer.rules.wikilink = (tokens, idx, options, env) => {
    const { value, embedded } = tokens[idx].meta;
    const [target, alias] = value.split('|');
    const result = resolver.resolve(target, env.path);
    const label = alias || target.split('/').at(-1).replace(/\.md$/i, '') || target;
    if (result.note) {
      if (embedded) return '<div class="note-embed" data-embed="' + escape(target) + '"><a href="' + escape(noteHref(result.note, result.hash)) + '">' + escape(label) + '</a></div>';
      return '<a class="internal" href="' + escape(noteHref(result.note, result.hash)) + '">' + escape(label) + '</a>';
    }
    const asset = resolver.asset(target, env.path);
    if (asset) {
      const src = rawHref(asset);
      const dims = /^(\d+)(?:x(\d+))?$/.exec(alias || '');
      if (embedded && /\.(png|jpe?g|gif|webp|svg)$/i.test(asset)) {
        return '<img loading="lazy" src="' + src + '" alt="' + escape(dims ? '' : alias || '') + '"' +
          (dims ? ' width="' + dims[1] + '"' + (dims[2] ? ' height="' + dims[2] + '"' : '') : '') + '>';
      }
      return '<a href="' + src + '">' + escape(label) + '</a>';
    }
    return '<span class="unresolved" title="' + (result.ambiguous ? '存在同名笔记，请使用完整路径' : '此内容未随站点发布') + '">' + escape(label) + '</span>';
  };

  md.inline.ruler.before('escape', 'obsidian_comment', (state, silent) => {
    if (!state.src.startsWith('%%', state.pos)) return false;
    const end = state.src.indexOf('%%', state.pos + 2);
    if (end < 0) return false;
    state.pos = end + 2;
    return true;
  });
  md.inline.ruler.before('escape', 'math_inline', (state, silent) => {
    if (state.src[state.pos] !== '$' || /\s|\$/.test(state.src[state.pos + 1] || ' ')) return false;
    let end = state.pos + 1;
    while ((end = state.src.indexOf('$', end)) >= 0) {
      if (state.src[end - 1] !== '\\') break;
      end++;
    }
    // 金额之间的美元符号（如 $20 与 $30）不能充当公式结束符。
    if (end < 0 || /\s/.test(state.src[end - 1]) || /\d/.test(state.src[end + 1] || '')) return false;
    if (!silent) {
      const token = state.push('math_inline', '', 0);
      token.content = state.src.slice(state.pos + 1, end);
    }
    state.pos = end + 1;
    return true;
  });
  md.renderer.rules.math_inline = (tokens, i) => '<span class="math-pending" data-math="inline">' + escape(tokens[i].content) + '</span>';
  md.block.ruler.before('fence', 'math_block', (state, start, end, silent) => {
    const line = state.src.slice(state.bMarks[start] + state.tShift[start], state.eMarks[start]).trimEnd();
    if (state.sCount[start] - state.blkIndent >= 4 || !line.startsWith('$$')) return false;
    const body = [];
    let next = start + 1;
    let closed = false;
    if (line.length > 3 && line.endsWith('$$')) body.push(line.slice(2, -2));
    else {
      body.push(line.slice(2));
      for (; next < end; next++) {
        if (state.sCount[next] < state.blkIndent && state.src.slice(state.bMarks[next], state.eMarks[next]).trim()) break;
        const text = state.src.slice(state.bMarks[next] + state.tShift[next], state.eMarks[next]);
        if (text.trim().endsWith('$$')) { body.push(text.trim().slice(0, -2)); next++; closed = true; break; }
        body.push(text);
      }
      if (!closed) return false;
    }
    if (silent) return true;
    const token = state.push('math_block', 'div', 0);
    token.content = body.join('\n').trim();
    token.map = [start, next];
    state.line = next;
    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.renderer.rules.math_block = (tokens, i) => '<div class="math-pending" data-math="block">' + escape(tokens[i].content) + '</div>\n';

  md.core.ruler.after('inline', 'note_structure', state => {
    const ids = new Map();
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type === 'heading_open') {
        const text = state.tokens[i + 1].content.replace(/[*_\x60]/g, '');
        const base = headingId(text) || 'section';
        const count = ids.get(base) || 0;
        ids.set(base, count + 1);
        token.attrSet('id', base + (count ? '-' + count : ''));
      }
      if (token.type === 'inline' && /\s\^[\w-]+\s*$/.test(token.content)) {
        const id = token.content.match(/\^([\w-]+)\s*$/)[1];
        const last = token.children.at(-1);
        if (last?.type === 'text') last.content = last.content.replace(/\s*\^[\w-]+\s*$/, '');
        if (state.tokens[i - 1]?.type === 'paragraph_open') state.tokens[i - 1].attrSet('id', id);
      }
      if (token.type === 'blockquote_open') {
        const inline = state.tokens[i + 2];
        const match = inline?.type === 'inline' && inline.content.match(/^\[!([\w-]+)\]([+-])?\s*([^\n]*)(?:\n|$)/);
        if (!match) continue;
        token.attrSet('class', 'callout ' + match[1]);
        token.attrSet('data-callout', match[1]);
        token.meta = { callout: true, fold: match[2], title: match[3] || match[1] };
        let depth = 1;
        for (let j = i + 1; j < state.tokens.length; j++) {
          if (state.tokens[j].type === 'blockquote_open') depth++;
          if (state.tokens[j].type === 'blockquote_close' && --depth === 0) { state.tokens[j].meta = token.meta; break; }
        }
        inline.content = inline.content.slice(match[0].length);
        inline.children = [];
        state.md.inline.parse(inline.content, state.md, state.env, inline.children);
      }
    }
  });
  md.renderer.rules.blockquote_open = (tokens, i) => {
    const token = tokens[i];
    if (!token.meta?.callout) return '<blockquote>';
    const meta = token.meta;
    const title = '<div class="callout-title"><span class="callout-title-inner">' + escape(meta.title) + '</span></div>';
    const type = escape(token.attrGet('data-callout'));
    const opening = '<blockquote class="callout ' + type + '" data-callout="' + type + '">';
    if (meta.fold) return opening + '<details' + (meta.fold === '+' ? ' open' : '') + '><summary>' + title + '</summary><div class="callout-content">';
    return opening + title + '<div class="callout-content">';
  };
  md.renderer.rules.blockquote_close = (tokens, i) => tokens[i].meta?.callout
    ? '</div>' + (tokens[i].meta.fold ? '</details>' : '') + '</blockquote>\n' : '</blockquote>\n';
  md.renderer.rules.fence = (tokens, i) => {
    const token = tokens[i];
    const lang = token.info.trim().split(/\s/)[0].toLowerCase();
    if (lang === 'mermaid') return '<pre class="mermaid-pending">' + escape(token.content) + '</pre>';
    const code = hljs.getLanguage(lang) ? hljs.highlight(token.content, { language: lang, ignoreIllegals: true }).value : escape(token.content);
    return '<figure data-rehype-pretty-code-figure><pre data-language="' + escape(lang) + '"><code class="language-' + escape(lang) + '">' + code + '</code></pre></figure>\n';
  };
  const defaultLink = md.renderer.rules.link_open || ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.link_open = (tokens, i, options, env, self) => {
    const token = tokens[i];
    const href = token.attrGet('href') || '';
    if (!/^(?:[a-z][\w+.-]*:|\/\/)/i.test(href) && !href.startsWith('#')) {
      const result = resolver.resolve(href, env.path);
      if (result.note) token.attrSet('href', noteHref(result.note, result.hash));
      else { const asset = resolver.asset(href, env.path); if (asset) token.attrSet('href', rawHref(asset)); }
    }
    if (/^https?:\/\//i.test(href)) token.attrSet('rel', 'noopener noreferrer');
    return defaultLink(tokens, i, options, env, self);
  };
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, i, options, env, self) => {
    const token = tokens[i];
    const src = token.attrGet('src');
    if (src && !/^(?:[a-z][\w+.-]*:|\/\/)/i.test(src)) {
      const asset = resolver.asset(src, env.path);
      if (asset) token.attrSet('src', rawHref(asset));
    }
    token.attrSet('loading', 'lazy');
    return defaultImage(tokens, i, options, env, self);
  };
  return {
    render(raw, path) {
      const html = md.render(stripFrontmatter(raw), { path });
      const safe = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'loading', 'sandbox'],
        FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form'],
        RETURN_DOM_FRAGMENT: true,
      });
      // 导出器为 Quartz 生成的小写 HTML 图片路径需要还原成附件真实路径。
      for (const img of safe.querySelectorAll('img[src]')) {
        const src = img.getAttribute('src');
        if (!/^(?:[a-z][\w+.-]*:|\/\/|\/notes\/)/i.test(src)) {
          const asset = resolver.asset(src, path);
          if (asset) img.setAttribute('src', rawHref(asset));
        }
        img.loading = 'lazy';
      }
      for (const a of safe.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href');
        if (!/^(?:[a-z][\w+.-]*:|\/\/|#|\/notes\/)/i.test(href)) {
          const target = resolver.resolve(href, path);
          if (target.note) a.setAttribute('href', noteHref(target.note, target.hash));
        }
      }
      const container = document.createElement('div');
      container.append(safe);
      return container.innerHTML;
    },
  };
}

const diagramSources = new WeakMap();
const diagramJobs = new WeakMap();
let diagramSequence = 0;
export async function enhanceDiagrams(root, isActive = () => true) {
  const job = {};
  diagramJobs.set(root, job);
  const active = () => isActive() && diagramJobs.get(root) === job;
  const math = [...root.querySelectorAll('.math-pending[data-math]')];
  if (math.length) {
    const { default: katex } = await import('katex');
    if (!active()) return;
    for (const el of math) {
      try {
        katex.render(el.textContent, el, { displayMode: el.dataset.math === 'block', throwOnError: false, trust: false });
        el.classList.remove('math-pending');
      }
      catch { /* 原始公式仍可读 */ }
    }
  }
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';
  const diagrams = [...root.querySelectorAll('.mermaid-pending, .mermaid')].filter(el =>
    el.matches('.mermaid-pending') || (diagramSources.has(el) && diagramSources.get(el).theme !== theme));
  if (diagrams.length) {
    const { default: mermaid } = await import('mermaid');
    if (!active()) return;
    mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict',
      theme,
      // 窄屏保留时间轴的可读宽度，由图内滚动承载，避免日期挤在一起。
      gantt: { useWidth: Math.max(640, root.clientWidth) },
    });
    for (const el of diagrams) {
      if (!active()) return;
      // 在文章内测量图宽，避免甘特图按整个视口布局后再缩小文字。
      const box = document.createElement('div');
      box.className = 'mermaid';
      el.before(box);
      try {
        const source = diagramSources.get(el)?.source ?? el.textContent;
        const result = await mermaid.render('diagram-' + ++diagramSequence, source, box);
        if (!active()) { box.remove(); return; }
        // Mermaid 默认用 foreignObject + HTML 绘制标签，纯 SVG profile 会删掉节点文字。
        box.innerHTML = DOMPurify.sanitize(result.svg, {
          USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
          ADD_TAGS: ['foreignObject'],
          HTML_INTEGRATION_POINTS: { foreignobject: true },
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
        });
        diagramSources.set(box, { source, theme });
        el.remove();
      } catch {
        box.remove();
        el.classList.add('diagram-error');
      }
    }
  }
}
