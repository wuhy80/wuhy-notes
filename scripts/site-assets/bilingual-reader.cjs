/**
 * bilingual-reader.js —— 外刊精读页的阅读器（纯前端，零依赖）
 *
 * 背景：笔记里用「原文 | 译文」两列表格维护，Obsidian/git 里好改；但站点上
 * 表格读起来割裂（一行英文一行中文并排、宽度被切半、词注折叠在 callout 里）。
 * 这里在浏览器里把表格重排成「一段英文 + 一段中文」，并补上阅读工具：
 *   · 对照 / 原文 / 译文 三档切换（localStorage 记忆）
 *   · 字号调节（记忆）
 *   · 行内词卡：文中的生词加虚线下划线，点击/回车弹出音标、释义、朗读
 *   · 右侧「本篇生词」栏：点击滚到首次出现、标记已掌握（记忆）
 *   · 段落朗读（Web Speech API，无需后端）
 *   · 文末总词汇表 → 卡片网格
 *
 * 数据来源全部来自页面本身：词汇取自「词汇注释」callout 与「总词汇表」表格，
 * 不额外维护 JSON；JS 不跑时表格仍是可读的。
 *
 * Quartz 开了 SPA（enableSPA），切页不会重新执行 <script>，所以这里监听
 * Quartz 的 nav 事件重新初始化；每轮初始化用 AbortController 摘掉上一轮的
 * 事件监听，避免叠加。
 *
 * 由 scripts/inject-reader.cjs 在构建后注入；样式见 scripts/site-custom.scss
 * 的「13/13 双语精读阅读器」段。
 */
(function () {
  'use strict';
  var PREF = 'gzb-bil-prefs';
  var KNOWN = 'gzb-bil-known';
  var DEFAULTS = { mode: 'pair', scale: 1, vocab: true };

  function read(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 隐私模式忽略 */ } }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function stripTags(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  var prefs = read(PREF, DEFAULTS);
  var known = {};
  read(KNOWN, []).forEach(function (w) { known[w] = 1; });

  var ac = null;      // 本轮初始化的事件控制器
  var pop = null;     // 词卡弹层（每轮重建）
  var active = null;  // 当前打开弹层的词

  // ── 词汇收集 ────────────────────────────────────────────────────────────
  // ── 未闭合行内标签兜底 ──────────────────────────────────────────────
  // 行内格式标签（u/em/strong 等）里不该出现块级子元素。笔记里若混入未闭合的
  // 行内标签（例如 callout 里写字面量 <u>），经本脚本的重构后可能被放大成
  // 包住整个内容区的巨型标签：text-decoration 不是继承属性但会沿盒树向下
  // 「绘制」，于是整页每行都带下划线。这里把「含块级子元素的行内标签」
  // 原地拆开（保留子节点），词级小标签不受影响。幂等，可多次调用。
  function sanitizeInlineWrappers(root) {
    var INLINE = 'u,em,strong,b,i,s,mark,small,sub,sup';
    var BLOCK = 'div,p,table,thead,tbody,tr,td,th,ul,ol,li,h1,h2,h3,h4,h5,h6,section,article,blockquote,pre,figure,hr,dl,dt,dd';
    [].slice.call(root.querySelectorAll(INLINE)).forEach(function (el) {
      if (!el.querySelector(BLOCK)) return;
      var parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });
  }

  function collectVocab(root) {
    var vocab = {};
    var order = 0;
    function add(word, ipa, def) {
      word = (word || '').trim();
      if (!word) return;
      var k = word.toLowerCase();
      var cur = vocab[k] || { word: word, ipa: '', def: '', order: order++ };
      if (ipa && (!cur.ipa || cur.ipa === '—')) cur.ipa = ipa;
      if (def && def.length > cur.def.length) cur.def = def;
      vocab[k] = cur;
    }

    [].slice.call(root.querySelectorAll('blockquote.callout')).forEach(function (c) {
      var title = c.querySelector('.callout-title-inner');
      if (!title || title.textContent.indexOf('词汇注释') < 0) return;
      c.classList.add('bil-vocab-src');
      [].slice.call(c.querySelectorAll('li')).forEach(function (li) {
        var strong = li.querySelector('strong');
        if (!strong) return;
        var word = strong.textContent.trim();
        var rest = li.textContent.replace(strong.textContent, '');
        var ipa = (rest.match(/\/[^\/]+\//) || [''])[0];
        var def = rest.split('——').slice(1).join('——').replace(ipa, '').replace(/\s+/g, ' ').trim();
        add(word, ipa, def);
      });
    });

    var glossary = null;
    [].slice.call(root.querySelectorAll('table')).forEach(function (t) {
      var th = [].slice.call(t.querySelectorAll('thead th')).map(function (x) { return x.textContent.trim(); });
      if (th.join('|') === '词汇|音标|释义|文中语境') glossary = t;
    });
    if (glossary) {
      rowsOf(glossary).forEach(function (r) {
        var ipa = stripTags(r[1] || '');
        add(stripTags(r[0]), ipa === '—' ? '' : ipa, stripTags(r[2] || ''));
      });
    }
    return { vocab: vocab, order: order, glossary: glossary };
  }

  function rowsOf(table) {
    return [].slice.call(table.querySelectorAll('tbody tr')).map(function (tr) {
      return [].slice.call(tr.children).map(function (td) { return td.innerHTML.trim(); });
    }).filter(function (r) { return r.length; });
  }

  // ── 表格 → 段落对 ──────────────────────────────────────────────────────
  function transformPairs(tables) {
    tables.forEach(function (table) {
      var host = table.closest('.table-container') || table;
      var box = document.createElement('div');
      box.className = 'bil';
      rowsOf(table).forEach(function (cells) {
        if (cells.length < 2) return;
        var pair = document.createElement('div');
        pair.className = 'bil-pair';
        var en = document.createElement('p');
        en.className = 'bil-en';
        en.innerHTML = cells[0];
        var zh = document.createElement('p');
        zh.className = 'bil-zh';
        zh.innerHTML = cells[1];
        var play = document.createElement('button');
        play.type = 'button';
        play.className = 'bil-play';
        play.setAttribute('aria-label', '朗读本段');
        play.title = '朗读本段';
        play.textContent = '▶';
        pair.appendChild(en);
        pair.appendChild(zh);
        pair.appendChild(play);
        box.appendChild(pair);
      });
      host.replaceWith(box);
    });
  }

  // ── 总词汇表 → 卡片 ────────────────────────────────────────────────────
  function transformGlossary(glossary) {
    if (!glossary) return;
    var host = glossary.closest('.table-container') || glossary;
    var grid = document.createElement('div');
    grid.className = 'bil-cards';
    rowsOf(glossary).forEach(function (r) {
      if (r.length < 3) return;
      var card = document.createElement('div');
      card.className = 'bil-card';
      card.innerHTML = '<div class="bil-card-h"><b>' + stripTags(r[0]) + '</b><span>' + stripTags(r[1] || '') + '</span></div>'
        + '<div class="bil-card-d">' + r[2] + '</div>'
        + (r[3] ? '<div class="bil-card-c">' + r[3] + '</div>' : '');
      grid.appendChild(card);
    });
    host.replaceWith(grid);
  }

  // ── 行内标注 ────────────────────────────────────────────────────────────
  function annotateAll(root, vocab) {
    var words = Object.keys(vocab).map(function (k) { return vocab[k]; })
      .filter(function (v) { return v.word.length >= 3; })
      .sort(function (a, b) { return a.order - b.order; });
    var hit = {};

    function annotate(paragraph, entry) {
      var re = new RegExp('\\b' + esc(entry.word) + '\\b', 'i');
      var walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue || !/\S/.test(node.nodeValue)) continue;
        var m = re.exec(node.nodeValue);
        if (!m) continue;
        var before = node.nodeValue.slice(0, m.index);
        var word = m[0];
        var after = node.nodeValue.slice(m.index + word.length);
        var span = document.createElement('span');
        span.className = 'bil-w';
        span.tabIndex = 0;
        span.setAttribute('role', 'button');
        span.dataset.w = entry.word.toLowerCase();
        span.textContent = word;
        var frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        node.parentNode.replaceChild(frag, node);
        return true;
      }
      return false;
    }

    words.forEach(function (entry) {
      var max = 2;
      [].slice.call(root.querySelectorAll('.bil-en')).forEach(function (p) {
        if ((hit[entry.word.toLowerCase()] || 0) >= max) return;
        if (annotate(p, entry)) hit[entry.word.toLowerCase()] = (hit[entry.word.toLowerCase()] || 0) + 1;
      });
    });
    return words;
  }

  // ── 弹层 ────────────────────────────────────────────────────────────────
  function closePop() {
    if (pop) pop.hidden = true;
    if (active) active.classList.remove('is-open');
    active = null;
  }

  function openPop(el, vocab) {
    var key = el.dataset.w;
    var v = vocab[key];
    if (!v || !pop) return;
    active = el;
    pop.innerHTML = '<div class="bil-pop-h"><b>' + v.word + '</b><span>' + (v.ipa || '') + '</span></div>'
      + '<div class="bil-pop-d">' + (v.def || '（暂无释义）') + '</div>'
      + '<div class="bil-pop-a">'
      + '<button type="button" data-say>朗读</button>'
      + '<button type="button" data-know aria-pressed="' + (known[key] ? 'true' : 'false') + '">'
      + (known[key] ? '已掌握' : '标为已掌握') + '</button></div>';
    pop.hidden = false;
    var r = el.getBoundingClientRect();
    var w = Math.min(320, window.innerWidth - 24);
    var left = Math.min(Math.max(12, r.left - 8), window.innerWidth - w - 12);
    pop.style.width = w + 'px';
    pop.style.left = left + 'px';
    // 一律挂在词下方；贴到视口底部时向上收，而不是翻到上方压住工具栏
    var h = pop.offsetHeight || 150;
    var top = r.bottom + 10;
    if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - h - 8);
    pop.style.top = top + 'px';
    el.classList.add('is-open');
  }

  function jumpToWord(key) {
    var target = document.querySelector('.bil-w[data-w="' + key + '"]');
    if (!target) return;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.classList.add('is-flash');
    setTimeout(function () { target.classList.remove('is-flash'); }, 1400);
  }

  // ── 朗读 ────────────────────────────────────────────────────────────────
  var speaking = null;
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.onend = u.onerror = function () {
      if (speaking) { speaking.classList.remove('is-speaking'); speaking = null; }
    };
    window.speechSynthesis.speak(u);
  }
  function speakPair(pair) {
    if (!pair) return;
    var text = (pair.querySelector('.bil-en') || {}).textContent || '';
    if (!text) return;
    if (speaking === pair) {
      window.speechSynthesis.cancel();
      pair.classList.remove('is-speaking');
      speaking = null;
      return;
    }
    if (speaking) speaking.classList.remove('is-speaking');
    speaking = pair;
    pair.classList.add('is-speaking');
    speak(text);
  }

  // ── 每轮初始化 ──────────────────────────────────────────────────────────
  function init() {
    var doc = document.documentElement;   // 主题脚本会重写 body.className，状态一律挂 <html>
    doc.classList.remove('bil-pending');

    var article = document.querySelector('article');
    if (!article) return;
    var root = article.querySelector('.markdown-preview-view') || article;
    sanitizeInlineWrappers(root); // 重构前先拆一次：笔记侧混入的未闭合行内标签不能留到后面

    var pairTables = [].slice.call(root.querySelectorAll('table')).filter(function (t) {
      var th = [].slice.call(t.querySelectorAll('thead th')).map(function (x) { return x.textContent.trim(); });
      return th.length === 2 && th[0] === '原文' && th[1] === '译文';
    });

    if (!pairTables.length) {
      // 同一页被重复初始化（首次加载后 Quartz 还会再发一次 nav）：保持现状，别把类名和生词栏清掉
      if (root.querySelector('.bil')) return;
      doc.classList.remove('bil-page', 'bil-mode-pair', 'bil-mode-en', 'bil-mode-zh', 'bil-vocab-off');
      return;
    }

    // 只有真的要重排时才换监听器；同一页的重复 init 在上面就 return 了，
    // 否则会把上一轮挂好的 click/keydown 监听 abort 掉，词卡点了没反应。
    if (ac) ac.abort();
    ac = new AbortController();
    var signal = ac.signal;

    // SPA 切页后上一轮的弹层/生词栏可能还在，先清掉
    [].slice.call(document.querySelectorAll('.bil-pop, .bil-rail')).forEach(function (n) { n.remove(); });
    doc.classList.add('bil-page');

    var collected = collectVocab(root);
    var vocab = collected.vocab;

    transformPairs(pairTables);
    transformGlossary(collected.glossary);

    var words = annotateAll(root, vocab);
    sanitizeInlineWrappers(root); // 重构后再兜一次底

    // 工具栏
    var first = root.querySelector('.bil');
    var bar = document.createElement('div');
    bar.className = 'bil-toolbar';
    bar.innerHTML =
      '<div class="bil-seg" role="group" aria-label="显示模式">' +
      '<button type="button" data-mode="pair">对照</button>' +
      '<button type="button" data-mode="en">原文</button>' +
      '<button type="button" data-mode="zh">译文</button></div>' +
      '<div class="bil-tools">' +
      '<span class="bil-size-label">字号</span>' +
      '<button type="button" data-scale="-1" aria-label="缩小字号">A−</button>' +
      '<button type="button" data-scale="1" aria-label="放大字号">A＋</button>' +
      '<button type="button" class="bil-vocab-btn" aria-pressed="true">词汇提示 开</button>' +
      '</div>';
    if (first) first.parentNode.insertBefore(bar, first);

    // 右侧生词栏
    var rail = document.querySelector('.right.sidebar');
    if (rail && words.length) {
      var panel = document.createElement('div');
      panel.className = 'bil-rail';
      var html = '<h3>本篇生词 <span>' + words.length + '</span></h3><div class="bil-rail-list">';
      words.forEach(function (v) {
        var k = v.word.toLowerCase();
        html += '<button type="button" class="bil-rail-item" data-w="' + k + '">'
          + '<i class="dot' + (known[k] ? ' known' : '') + '"></i>'
          + '<b>' + v.word + '</b><em>' + v.ipa + '</em>'
          + '<span>' + v.def.split('。')[0] + '</span></button>';
      });
      panel.innerHTML = html + '</div>';
      rail.insertBefore(panel, rail.firstChild);
    }

    // 弹层（挂进 quartz-root 才能继承主题变量）
    pop = document.createElement('div');
    pop.className = 'bil-pop';
    pop.hidden = true;
    (document.getElementById('quartz-root') || document.body).appendChild(pop);

    // 事件
    root.addEventListener('click', function (e) {
      var w = e.target.closest && e.target.closest('.bil-w');
      if (w) {
        e.preventDefault();
        (active === w) ? closePop() : openPop(w, vocab);
        return;
      }
      var play = e.target.closest && e.target.closest('.bil-play');
      if (play) { speakPair(play.closest('.bil-pair')); return; }
      if (!e.target.closest('.bil-pop')) closePop();
    }, { signal: signal });

    root.addEventListener('keydown', function (e) {
      var w = e.target.closest && e.target.closest('.bil-w');
      if (w && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPop(w, vocab); }
    }, { signal: signal });

    pop.addEventListener('click', function (e) {
      if (!active) return;
      if (e.target.hasAttribute('data-say')) { speak(active.textContent); return; }
      if (e.target.hasAttribute('data-know')) {
        var k = active.dataset.w;
        known[k] = !known[k];
        write(KNOWN, Object.keys(known).filter(function (x) { return known[x]; }));
        openPop(active, vocab);
        syncRail();
      }
    }, { signal: signal });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); }, { signal: signal });
    document.addEventListener('scroll', closePop, { capture: true, signal: signal });

    // 生词栏在 article 之外，单独委托
    document.addEventListener('click', function (e) {
      var item = e.target.closest && e.target.closest('.bil-rail-item');
      if (item) jumpToWord(item.dataset.w);
    }, { signal: signal });

    // 偏好
    function applyMode(mode) {
      if (['pair', 'en', 'zh'].indexOf(mode) < 0) mode = 'pair';
      prefs.mode = mode;
      doc.classList.remove('bil-mode-pair', 'bil-mode-en', 'bil-mode-zh');
      doc.classList.add('bil-mode-' + mode);
      [].slice.call(bar.querySelectorAll('[data-mode]')).forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
      });
      write(PREF, prefs);
    }
    function applyScale(scale) {
      prefs.scale = Math.min(1.35, Math.max(0.85, Math.round(scale * 100) / 100));
      document.body.style.setProperty('--bil-scale', prefs.scale);
      write(PREF, prefs);
    }
    function applyVocab(on) {
      prefs.vocab = !!on;
      doc.classList.toggle('bil-vocab-off', !prefs.vocab);
      var btn = bar.querySelector('.bil-vocab-btn');
      if (btn) {
        btn.setAttribute('aria-pressed', prefs.vocab ? 'true' : 'false');
        btn.textContent = '词汇提示 ' + (prefs.vocab ? '开' : '关');
      }
      write(PREF, prefs);
    }

    bar.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]');
      if (m) return applyMode(m.dataset.mode);
      var s = e.target.closest('[data-scale]');
      if (s) return applyScale(prefs.scale + Number(s.dataset.scale) * 0.05);
      if (e.target.closest('.bil-vocab-btn')) return applyVocab(!prefs.vocab);
    }, { signal: signal });

    applyMode(prefs.mode);
    applyScale(prefs.scale);
    applyVocab(prefs.vocab);

    function syncRail() {
      [].slice.call(document.querySelectorAll('.bil-rail-item')).forEach(function (b) {
        var dot = b.querySelector('.dot');
        if (dot) dot.classList.toggle('known', !!known[b.dataset.w]);
      });
    }
  }

  // 首次加载 + SPA 切页后都跑一遍
  init();
  document.addEventListener('nav', function () { setTimeout(init, 0); });
})();

