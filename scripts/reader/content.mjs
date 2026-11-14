// Markdown 渲染后的课程增强；只处理明确的测验和上下课标记。
let sequence = 0;
function node(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text != null) el.textContent = text;
  return el;
}
export function enhanceContent(root) {
  for (const callout of root.querySelectorAll('.callout[data-callout="example"]')) {
    const content = callout.querySelector(':scope > .callout-content, :scope > details > .callout-content');
    if (!content) continue;
    const questions = [];
    let current;
    for (const child of content.children) {
      if (child.matches('p') && /^Q\s*\d+\s*[.．、:：]/.test(child.textContent.trim())) {
        current = { question: child };
        questions.push(current);
      } else if (current && child.matches('ul,ol') && !current.options) current.options = child;
      else if (current && child.matches('.callout') && !current.explanation) current.explanation = child.querySelector('.callout-content');
    }
    if (!questions.length || questions.some(q => {
      const options = [...(q.options?.children || [])];
      return options.length < 2 || options.filter(li => /[✅✓✔]/.test(li.textContent)).length !== 1 || options.some(li => !/^[A-Za-z]\s*[.．、:：)]/.test(li.textContent.trim()));
    })) continue;
    const quiz = node('section', 'quiz');
    quiz.dataset.quiz = '';
    const head = node('div', 'quiz-head');
    head.append(node('span', 'quiz-badge', '学习小测验'), node('span', 'quiz-hint', '选一个答案，立刻判对错'));
    quiz.append(head);
    for (const q of questions) {
      const item = node('div', 'quiz-item');
      const question = q.question.cloneNode(true);
      question.className = 'quiz-q';
      const options = node('div', 'quiz-opts');
      options.setAttribute('role', 'radiogroup');
      options.setAttribute('aria-label', q.question.textContent);
      const name = 'quiz-' + ++sequence;
      for (const option of q.options.children) {
        const text = option.textContent.trim();
        const correct = /[✅✓✔]/.test(text);
        const letter = text.match(/^([A-Za-z])/)[1].toUpperCase();
        const label = node('label', 'quiz-opt' + (correct ? ' is-answer' : ''));
        const input = document.createElement('input');
        input.type = 'radio'; input.name = name; input.value = letter;
        label.append(input, node('span', 'quiz-key', letter), node('span', 'quiz-txt', text.replace(/^[A-Za-z]\s*[.．、:：)]\s*/, '').replace(/[✅✓✔]/g, '').trim()));
        options.append(label);
        if (correct) item.dataset.answer = letter;
      }
      item.append(question, options);
      if (q.explanation) {
        const why = node('div', 'quiz-why');
        const inner = node('div', 'quiz-why-inner');
        inner.append(node('span', 'quiz-why-label', '讲解'), ...[...q.explanation.childNodes].map(n => n.cloneNode(true)));
        why.append(inner); item.append(why);
      }
      quiz.append(item);
    }
    callout.replaceWith(quiz);
  }
  for (const heading of root.querySelectorAll('h2')) {
    if (heading.textContent.trim() !== '相关笔记') continue;
    const list = heading.nextElementSibling;
    if (!list?.matches('ul')) continue;
    const entries = [...list.children];
    const pick = prefix => entries.find(li => li.textContent.trim().startsWith(prefix))?.querySelector('a[href]');
    const prev = pick('上一课'), next = pick('下一课');
    if (!prev && !next) continue;
    const nav = node('nav', 'lesson-nav');
    nav.setAttribute('aria-label', '课程导航');
    for (const [link, direction, label] of [[prev, 'prev', '← 上一课'], [next, 'next', '下一课 →']]) {
      const card = node(link ? 'a' : 'span', 'lesson-nav-card ' + direction + (link ? '' : ' is-empty'));
      if (link) { card.href = link.getAttribute('href'); card.append(node('span', 'lesson-nav-label', label), node('span', 'lesson-nav-title', link.textContent)); }
      nav.append(card);
    }
    heading.classList.add('lesson-nav-heading');
    list.before(nav);
    for (const li of entries) if (/^(上一课|下一课)/.test(li.textContent.trim())) li.remove();
    if (!list.children.length) list.remove();
  }
}
