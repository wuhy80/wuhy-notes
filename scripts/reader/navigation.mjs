// 分区顺序、卷编号和大卷折叠方式与既有站点保持一致。
const order = ['大模型', '技术笔记', '读书笔记', '数学学习', '英语学习', 'Golang编程', 'Rust编程', 'Ontology', '网址收藏'];
const roman = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ','ⅩⅢ','ⅩⅣ','ⅩⅤ','ⅩⅥ','ⅩⅦ','ⅩⅧ','ⅩⅨ','ⅩⅩ'];
const compare = (a, b) => a.localeCompare(b, 'zh-CN', { numeric: true });
const stripNum = name => name.replace(/^\d+[-_.\s]+/, '');
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function link(note, label, current, number) {
  const a = element('a', current?.path === note.path ? 'active' : '');
  a.href = note.url;
  a.dataset.path = note.path;
  if (number) a.append(element('span', 'num', number));
  a.append(document.createTextNode(label || note.title));
  a.title = note.path;
  return a;
}
export function renderNavigation(manifest, current, filter = '') {
  const pages = manifest.notes.filter(note => !/(?:^|\/)(?:_?index)\.md$/i.test(note.path) && note.path.includes('/')).sort((a, b) => compare(a.path, b.path));
  const sections = [...new Set(pages.map(note => note.path.split('/')[0]))].sort((a, b) => {
    const left = order.indexOf(a), right = order.indexOf(b);
    return (left < 0 ? 99 : left) - (right < 0 ? 99 : right) || compare(a, b);
  });
  const selectedSection = current?.path.includes('/') ? current.path.split('/')[0] : null;
  document.querySelector('#sections').replaceChildren(...sections.map(section => {
    const a = link(pages.find(note => note.path.startsWith(section + '/')), section);
    a.classList.toggle('on', section === selectedSection);
    return a;
  }));
  const tree = document.querySelector('#tree');
  const header = element('div', 'side-nav-head');
  const scoped = selectedSection ? pages.filter(note => note.path.startsWith(selectedSection + '/')) : pages;
  header.append(element('b', '', filter ? '搜索结果' : selectedSection || '全部笔记'), element('span', '', scoped.length + ' 篇'));
  const fragment = document.createDocumentFragment();
  fragment.append(header);
  function items(notes) {
    const ul = element('ul', 'items');
    notes.forEach((note, i) => {
      const li = document.createElement('li');
      li.append(link(note, null, current, String(i + 1).padStart(2, '0')));
      ul.append(li);
    });
    return ul;
  }
  if (filter.trim()) {
    const query = filter.trim().toLowerCase();
    fragment.append(items(manifest.notes.filter(note => (note.title + ' ' + note.path + ' ' + note.tags.join(' ')).toLowerCase().includes(query))));
  } else if (!selectedSection) {
    const ul = element('ul', 'items');
    for (const section of sections) {
      const notes = pages.filter(note => note.path.startsWith(section + '/'));
      const li = document.createElement('li');
      const a = link(notes[0], section);
      a.append(element('span', 'cnt', notes.length));
      li.append(a);
      ul.append(li);
    }
    fragment.append(ul);
  } else {
    const groups = new Map();
    for (const note of scoped) {
      const raw = note.path.split('/').length > 2 ? note.path.split('/')[1] : '未归档';
      const name = stripNum(raw);
      if (!groups.has(name)) groups.set(name, { raw, notes: [] });
      groups.get(name).notes.push(note);
    }
    [...groups].sort(([,a],[,b]) => compare(a.raw, b.raw)).forEach(([name, group], i) => {
      const active = group.notes.some(note => note.path === current?.path);
      const details = element('details', 'vol' + (active ? ' on' : ''));
      details.open = active;
      const summary = document.createElement('summary');
      summary.append(element('span', 'badge', roman[i] || i + 1), element('span', 'vol-name', name), element('span', 'cnt', group.notes.length));
      details.append(summary);
      if (group.notes.length > 40) {
        const subs = new Map();
        for (const note of group.notes) {
          const label = note.path.split('/').length > 3 ? note.path.split('/')[2] : '散篇';
          if (!subs.has(label)) subs.set(label, []);
          subs.get(label).push(note);
        }
        const ul = element('ul', 'items subdirs');
        for (const [label, notes] of [...subs].sort(([a],[b]) => compare(a,b))) {
          const li = document.createElement('li');
          const a = link(notes[0], stripNum(label));
          a.classList.toggle('active', notes.some(note => note.path === current?.path));
          if (a.classList.contains('active')) a.dataset.groupActive = 'true';
          a.append(element('span', 'cnt', notes.length));
          li.append(a);
          ul.append(li);
        }
        details.append(ul);
      } else details.append(items(group.notes));
      fragment.append(details);
    });
  }
  tree.replaceChildren(fragment);
}
