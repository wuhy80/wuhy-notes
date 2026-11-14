// 浏览器与构建器共用路径规则；正文与文件名始终保留原样。
export function cleanPath(value) {
  try { value = decodeURIComponent(value); } catch { /* 保留合法的原始文件名 */ }
  return String(value).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

export function legacyUrl(rel) {
  const parts = rel.replace(/\.md$/i, '').split('/');
  const stem = parts.at(-1);
  if (stem === 'index' && parts.length === 1) return '/';
  if (parts.length > 1 && (stem.toLowerCase() === 'index' || stem === '_index' || stem === parts.at(-2))) {
    parts.pop();
    return '/' + parts.map(p => p.toLowerCase().replace(/ /g, '-')).join('/') + '/';
  }
  return '/' + parts.map(p => p.toLowerCase().replace(/ /g, '-')).join('/') + '.html';
}

export function headingId(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '');
}

export function splitTarget(target) {
  const [path, ...hash] = target.replace(/\\\|/g, '|').split('#');
  let fragment = hash.join('#');
  try { fragment = decodeURIComponent(fragment); } catch { /* 保留含字面百分号的章节名 */ }
  return { path: path.trim(), hash: fragment };
}

export function createResolver(manifest) {
  const exact = new Map();
  const names = new Map();
  const routes = new Map();
  const files = new Set(manifest.files || []);
  const fileNames = new Map([...files].map(file => [file.toLowerCase(), file]));
  for (const note of manifest.notes) {
    exact.set(note.path.toLowerCase(), note);
    exact.set(note.path.replace(/\.md$/i, '').toLowerCase(), note);
    for (const name of [note.path.split('/').at(-1).replace(/\.md$/i, ''), ...(note.aliases || [])]) {
      const key = name.toLowerCase();
      if (!names.has(key)) names.set(key, []);
      if (!names.get(key).includes(note)) names.get(key).push(note);
    }
    for (const route of [note.url, note.url.replace(/\.html$/, ''), '/' + note.path, '/' + note.path.replace(/\.md$/i, ''), note.path === 'index.md' ? '/index.html' : '/' + note.path.replace(/\.md$/i, '.html').toLowerCase().replace(/ /g, '-')]) {
      const key = cleanPath(route).toLowerCase();
      if (!routes.has(key)) routes.set(key, note);
    }
  }
  function normalizeRelative(value, current) {
    const parts = value.startsWith('/') ? [] : current.split('/').slice(0, -1);
    for (const part of cleanPath(value).split('/')) {
      if (part === '..') parts.pop();
      else if (part && part !== '.') parts.push(part);
    }
    return parts.join('/');
  }
  function resolve(value, current = 'index.md') {
    const { path: target, hash } = splitTarget(value);
    if (!target) return { note: exact.get(current.toLowerCase()), hash };
    const key = cleanPath(target);
    const relative = normalizeRelative(target, current);
    const note = exact.get(relative.toLowerCase()) || exact.get(key.toLowerCase()) || routes.get(key.toLowerCase());
    if (note) return { note, hash };
    const candidates = names.get(key.toLowerCase()) || manifest.notes.filter(n =>
      n.path.toLowerCase().endsWith('/' + key.toLowerCase().replace(/\.md$/i, '') + '.md'));
    if (candidates.length === 1) return { note: candidates[0], hash };
    return { hash, ambiguous: candidates.length > 1, candidates };
  }
  function asset(value, current) {
    const { path: target } = splitTarget(value);
    const relative = normalizeRelative(target, current);
    const key = cleanPath(target);
    if (fileNames.has(relative.toLowerCase())) return fileNames.get(relative.toLowerCase());
    if (fileNames.has(key.toLowerCase())) return fileNames.get(key.toLowerCase());
    const matches = [...files].filter(p => p.toLowerCase().endsWith('/' + key.toLowerCase()) || p.toLowerCase() === key.toLowerCase());
    return matches.length === 1 ? matches[0] : null;
  }
  return { resolve, asset, routes };
}

export function noteHref(note, hash = '') {
  return note.url + (hash ? '#' + encodeURIComponent(hash.startsWith('^') ? hash.slice(1) : headingId(hash)) : '');
}

export function rawHref(path, hash = '') {
  return '/notes/' + path.split('/').map(encodeURIComponent).join('/') + (hash ? '?v=' + encodeURIComponent(hash) : '');
}
