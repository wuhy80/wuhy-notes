/**
 * dataview-lite.cjs —— 站点端 Dataview 渲染器（发布后注入，浏览器里现场渲染）
 *
 * Obsidian 退役后库里残留的 ```dataview / ```dataviewjs 代码块在 Quartz 上没有
 * 宿主，只会显示原始查询文本。本脚本在浏览器里把它们渲染出来：
 *   · 元数据来自构建期生成的 /static/vault-meta.json（scripts/build-vault-meta.mjs）
 *   · ```dataview     → 迷你 DQL 引擎（TABLE/LIST/TASK + FROM/WHERE/GROUP BY/SORT/LIMIT，
 *                       dateformat/date/length/max/min，本库用到的方言）
 *   · ```dataviewjs   → 用 dv 垫片直接执行原代码（pages/where/filter/sort/groupBy/
 *                       table/paragraph/header/luxon.DateTime）
 *   · ```tagcloud     → 按行内标签频次渲染简易标签云
 *
 * 与 bilingual-reader 同款约定：SPA 切页监听 nav 事件重入；幂等；失败静默降级
 * （保留原始代码块显示，console.warn 记录原因）。
 */
;(function () {
  'use strict'

  var META = null
  var PAGES = null
  var TASKS = null
  var metaPromise = null

  // ---------- 小工具 ----------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  function fmtDate(d, fmt) {
    var p2 = function (n) { return (n < 10 ? '0' : '') + n }
    var out = fmt
    out = out.replace(/yyyy/g, String(d.getFullYear()))
    out = out.replace(/yy/g, String(d.getFullYear() % 100).padStart(2, '0'))
    out = out.replace(/MMMM/g, '@4@').replace(/MMM/g, '@3@')
    out = out.replace(/@4@/g, MONTHS[d.getMonth()]).replace(/@3@/g, MONTHS[d.getMonth()].slice(0, 3))
    out = out.replace(/MM/g, p2(d.getMonth() + 1))
    out = out.replace(/dd/g, p2(d.getDate()))
    out = out.replace(/HH/g, p2(d.getHours()))
    out = out.replace(/mm/g, p2(d.getMinutes()))
    out = out.replace(/ss/g, p2(d.getSeconds()))
    return out
  }
  function toDT(v) {
    if (v instanceof DT) return v
    if (v instanceof Date) return new DT(v.getTime())
    if (typeof v === 'string') { var t = Date.parse(v); return isNaN(t) ? null : new DT(t) }
    return null
  }
  // 与 publish-site.ps1 覆盖校验一致的 slug 规则：逐段小写、空格转 '-'；
  // _index.md 或「与父目录同名的 .md」产出父目录页面
  function pathToUrl(rel) {
    var parts = rel.split('/')
    var stem = parts[parts.length - 1].replace(/\.md$/i, '')
    if (parts.length >= 2 && (stem === '_index' || stem === parts[parts.length - 2])) {
      return '/' + parts.slice(0, parts.length - 1).map(function (s) { return s.toLowerCase().replace(/ /g, '-') }).join('/') + '/'
    }
    parts[parts.length - 1] = stem
    return '/' + parts.map(function (s) { return s.toLowerCase().replace(/ /g, '-') }).join('/') + '.html'
  }

  // ---------- Luxon 形状的日期垫片 ----------
  function DT(ms) { this.d = new Date(ms) }
  DT.now = function () { return new DT(Date.now()) }
  DT.fromISO = function (s) { var t = Date.parse(s); return isNaN(t) ? null : new DT(t) }
  DT.prototype.valueOf = function () { return this.d.getTime() }
  DT.prototype.toFormat = function (fmt) { return fmtDate(this.d, fmt) }
  DT.prototype.startOf = function (u) {
    var d = new Date(this.d)
    if (u === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0) }
    else if (u === 'year') { d.setMonth(0, 1); d.setHours(0, 0, 0, 0) }
    else { d.setHours(0, 0, 0, 0) }
    return new DT(d.getTime())
  }
  DT.prototype.endOf = function (u) {
    var d = new Date(this.d)
    if (u === 'month') { d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999) }
    else if (u === 'year') { d.setMonth(11, 31); d.setHours(23, 59, 59, 999) }
    else { d.setHours(23, 59, 59, 999) }
    return new DT(d.getTime())
  }
  DT.prototype.minus = function (o) {
    var d = new Date(this.d)
    if (o) {
      if (o.months) d.setMonth(d.getMonth() - o.months)
      if (o.days) d.setDate(d.getDate() - o.days)
      if (o.hours) d.setHours(d.getHours() - o.hours)
    }
    return new DT(d.getTime())
  }

  // ---------- 页面对象 ----------
  function DA(arr) {
    arr.where = function (fn) { return DA(arr.filter(fn)) }
    // 链式调用保持 DataArray 语义（dataviewjs 里 .filter().groupBy() 这类组合）
    arr.filter = function (fn, that) { return DA(Array.prototype.filter.call(arr, fn, that)) }
    arr.map = function (fn, that) { return DA(Array.prototype.map.call(arr, fn, that)) }
    arr.sort = function (fn) { Array.prototype.sort.call(arr, fn); return arr }
    arr.groupBy = function (fn) {
      var m = new Map()
      arr.forEach(function (p) {
        var k = fn(p)
        if (k && k.__link) k = k.__link
        if (!m.has(k)) m.set(k, [])
        m.get(k).push(p)
      })
      return DA(Array.from(m, function (e) { return { key: e[0], rows: DA(e[1]) } }))
    }
    arr.array = function () { return arr.slice() }
    return arr
  }

  function buildPages(meta) {
    TASKS = []
    PAGES = DA(meta.pages.map(function (r) {
      var page = {}
      for (var k in r.fm) page[k] = r.fm[k]
      var etags = r.et || []
      var ftags = r.tg || []
      page.file = {
        path: r.p,
        folder: r.fo,
        name: r.na,
        link: { __link: r.p, name: r.na },
        mtime: DT.fromISO(r.mt),
        etags: etags,
        tags: ftags.concat(etags),
      }
      ;(r.tk || []).forEach(function (t) { TASKS.push({ text: t.t, line: t.l, page: page }) })
      return page
    }))
  }

  // ---------- mini-DQL ----------
  function tokenize(src) {
    var toks = []
    var re = /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-z_\u4e00-\u9fff][A-Za-z0-9_\u4e00-\u9fff.\u00b7-]*)|(==|!=|<=|>=|[()+\-,=<>!])|(\s+)/g
    var m
    while ((m = re.exec(src))) {
      if (m[1] || m[2]) toks.push({ t: 'str', v: m[1] || m[2] })
      else if (m[3]) toks.push({ t: 'num', v: Number(m[3]) })
      else if (m[4]) toks.push({ t: 'id', v: m[4] })
      else if (m[5]) toks.push({ t: 'op', v: m[5] })
    }
    return toks
  }
  function Parser(toks) {
    this.toks = toks; this.i = 0
  }
  Parser.prototype = {
    peek: function () { return this.toks[this.i] },
    next: function () { return this.toks[this.i++] },
    isKw: function (kw) { var t = this.peek(); return t && t.t === 'id' && t.v.toUpperCase() === kw },
    eatKw: function (kw) { if (this.isKw(kw)) { this.i++; return true } return false },
    expectOp: function (op) { var t = this.next(); if (!t || t.v !== op) throw new Error('期望 ' + op + '，得到 ' + (t && t.v)) },
    // 表达式：OR > AND > NOT > 比较 > 原子
    expr: function () { return this.orExpr() },
    orExpr: function () {
      var l = this.andExpr()
      while (this.isKw('OR')) { this.i++; l = { k: 'or', a: l, b: this.andExpr() } }
      return l
    },
    andExpr: function () {
      var l = this.notExpr()
      while (this.isKw('AND')) { this.i++; l = { k: 'and', a: l, b: this.notExpr() } }
      return l
    },
    notExpr: function () {
      if (this.isKw('NOT')) { this.i++; return { k: 'not', a: this.notExpr() } }
      var t = this.peek()
      if (t && t.t === 'op' && t.v === '!') { this.i++; return { k: 'not', a: this.notExpr() } }
      return this.cmp()
    },
    cmp: function () {
      var l = this.addExpr()
      var t = this.peek()
      if (t && t.t === 'op' && ['=', '==', '!=', '<', '>', '<=', '>='].indexOf(t.v) >= 0) {
        this.i++
        var r = this.addExpr()
        return { k: 'cmp', op: t.v === '==' ? '=' : t.v, a: l, b: r }
      }
      return l
    },
    // 字符串拼接 / 数值加减（如 ("![封面|50](" + image_url + ")")）
    addExpr: function () {
      var l = this.primary()
      while (true) {
        var t = this.peek()
        if (t && t.t === 'op' && (t.v === '+' || t.v === '-')) {
          this.i++
          l = { k: 'add', op: t.v, a: l, b: this.primary() }
        } else break
      }
      return l
    },
    primary: function () {
      var t = this.peek()
      if (!t) throw new Error('表达式意外结束')
      if (t.t === 'str') { this.i++; return { k: 'lit', v: t.v.slice(1, -1).replace(/\\(.)/g, '$1') } }
      if (t.t === 'num') { this.i++; return { k: 'lit', v: t.v } }
      if (t.t === 'op' && t.v === '(') { this.i++; var e = this.expr(); this.expectOp(')'); return e }
      if (t.t === 'id') {
        var name = t.v; this.i++
        var nt = this.peek()
        if (nt && nt.t === 'op' && nt.v === '(') { // 函数
          this.i++
          var args = []
          if (!(this.peek() && this.peek().t === 'op' && this.peek().v === ')')) {
            args.push(this.expr())
            while (this.peek() && this.peek().t === 'op' && this.peek().v === ',') { this.i++; args.push(this.expr()) }
          }
          this.expectOp(')')
          return { k: 'fn', name: name.toLowerCase(), args: args, raw: name }
        }
        return { k: 'id', path: name.toLowerCase().split('.'), raw: name }
      }
      throw new Error('无法解析的表达式 token: ' + t.v)
    },
  }

  function parseQuery(src) {
    var p = new Parser(tokenize(src))
    var q = { kind: 'table', withoutId: false, cols: [], from: null, where: null, group: null, sort: [], limit: null }
    if (p.eatKw('TABLE')) {
      q.kind = 'table'
      if (p.eatKw('WITHOUT')) { p.eatKw('ID'); q.withoutId = true }
      do { q.cols.push(parseCol(p)) } while (p.eatOpComma(p))
    } else if (p.eatKw('LIST')) { q.kind = 'list' }
    else if (p.eatKw('TASK')) { q.kind = 'task' }
    else throw new Error('只支持 TABLE/LIST/TASK')
    if (p.eatKw('FROM')) q.from = parseFrom(p)
    if (p.eatKw('WHERE')) q.where = p.expr()
    if (p.eatKw('GROUP')) { p.eatKw('BY'); q.group = p.expr() }
    if (p.eatKw('SORT')) {
      do {
        var e = p.expr()
        var dir = 'ASC'
        if (p.eatKw('DESC')) dir = 'DESC'; else p.eatKw('ASC')
        q.sort.push({ e: e, dir: dir })
      } while (p.eatOpComma(p))
    }
    if (p.eatKw('LIMIT')) { var n = p.next(); q.limit = n.v }
    return q
  }
  Parser.prototype.eatOpComma = function () {
    var t = this.peek()
    if (t && t.t === 'op' && t.v === ',') { this.i++; return true }
    return false
  }
  function parseCol(p) {
    var startTok = p.i
    var e = p.expr()
    var alias = null
    if (p.eatKw('AS')) { var t = p.next(); alias = t.v.replace(/^"|"$/g, '') }
    var raw = p.toks.slice(startTok, p.i).map(function (t) { return t.v }).join(' ')
    return { e: e, alias: alias, raw: raw }
  }
  function parseFrom(p) {
    var pos = [], neg = []
    while (true) {
      var t = p.peek()
      var isNeg = false
      if (t && t.t === 'op' && t.v === '!') { isNeg = true; p.i++; t = p.peek() }
      if (!t || t.t !== 'str') throw new Error('FROM 只支持 "文件夹" 形式')
      p.i++
      ;(isNeg ? neg : pos).push(t.v.slice(1, -1))
      if (p.isKw('OR') || p.isKw('AND')) { p.i++; continue }
      break
    }
    return { pos: pos, neg: neg }
  }

  function resolveId(ctx, path) {
    var cur = ctx
    for (var i = 0; i < path.length; i++) {
      if (cur == null) return null
      if (Array.isArray(cur)) {
        // dataview 聚合语义：rows.created → 数组每行取该字段
        var key = path[i]
        cur = cur.map(function (x) { return x == null ? null : x[key] })
        continue
      }
      cur = cur[path[i]]
    }
    return cur === undefined ? null : cur
  }
  function evalAst(ast, ctx) {
    switch (ast.k) {
      case 'lit': return ast.v
      case 'id': return resolveId(ctx, ast.path)
      case 'not': return !truthy(evalAst(ast.a, ctx))
      case 'and': return truthy(evalAst(ast.a, ctx)) && truthy(evalAst(ast.b, ctx))
      case 'or': return truthy(evalAst(ast.a, ctx)) || truthy(evalAst(ast.b, ctx))
      case 'cmp': {
        var a = evalAst(ast.a, ctx), b = evalAst(ast.b, ctx)
        var av = a && a.valueOf ? a.valueOf() : a
        var bv = b && b.valueOf ? b.valueOf() : b
        switch (ast.op) {
          case '=': return av === bv
          case '!=': return av !== bv
          case '<': return av < bv
          case '>': return av > bv
          case '<=': return av <= bv
          case '>=': return av >= bv
        }
        return false
      }
      case 'fn': return evalFn(ast, ctx)
      case 'add': {
        var aa = evalAst(ast.a, ctx)
        var bb = evalAst(ast.b, ctx)
        if (typeof aa === 'string' || typeof bb === 'string') {
          if (ast.op === '-') throw new Error('字符串不支持减法')
          return String(aa == null ? '' : aa) + String(bb == null ? '' : bb)
        }
        return (aa == null ? 0 : aa) + (ast.op === '-' ? -1 : 1) * (bb == null ? 0 : bb)
      }
    }
    return null
  }
  function truthy(v) { return !!v }
  function evalFn(ast, ctx) {
    var name = ast.name
    if (name === 'dateformat') {
      var v = evalAst(ast.args[0], ctx)
      var fmt = evalAst(ast.args[1], ctx)
      var d = toDT(v)
      return d ? fmtDate(d.d, fmt) : null
    }
    if (name === 'date') { var v2 = evalAst(ast.args[0], ctx); return toDT(v2) }
    if (name === 'length') {
      var v3 = evalAst(ast.args[0], ctx)
      return v3 == null ? 0 : v3.length
    }
    if (name === 'max' || name === 'min') {
      var vals = []
      ast.args.forEach(function (a) {
        var v4 = evalAst(a, ctx)
        if (Array.isArray(v4)) vals = vals.concat(v4)
        else vals.push(v4)
      })
      var nums = vals.filter(function (x) { return x != null })
      if (!nums.length) return null
      // 类型感知比较：日期字符串按字典序（ISO 格式可比），数字按大小
      var best = nums[0]
      for (var i = 1; i < nums.length; i++) {
        var c = sortCmp(nums[i], best)
        if (name === 'max' ? c > 0 : c < 0) best = nums[i]
      }
      return best
    }
    if (name === 'contains') {
      var hay = evalAst(ast.args[0], ctx)
      var needle = evalAst(ast.args[1], ctx)
      if (Array.isArray(hay)) return hay.some(function (x) { return String(x).toLowerCase() === String(needle).toLowerCase() })
      return String(hay || '').toLowerCase().indexOf(String(needle).toLowerCase()) >= 0
    }
    throw new Error('不支持的函数: ' + ast.raw)
  }

  function matchFrom(from, page) {
    if (!from) return true
    var fo = page.file.folder
    var inPos = !from.pos.length || from.pos.some(function (s) { return fo === s || fo.startsWith(s + '/') })
    var inNeg = from.neg.some(function (s) { return fo === s || fo.startsWith(s + '/') })
    return inPos && !inNeg
  }
  function sortCmp(a, b) {
    var av = a == null ? -Infinity : (a.valueOf ? a.valueOf() : a)
    var bv = b == null ? -Infinity : (b.valueOf ? b.valueOf() : b)
    if (typeof av === 'string' || typeof bv === 'string') { av = String(av); bv = String(bv) }
    return av < bv ? -1 : av > bv ? 1 : 0
  }

  function runQuery(q) {
    var items = PAGES.filter(function (p) { return matchFrom(q.from, p) })
    if (q.where) items = items.filter(function (p) { return truthy(evalAst(q.where, p)) })
    if (q.group) {
      var m = new Map()
      items.forEach(function (p) {
        var k = evalAst(q.group, p)
        if (k && k.__link) k = k.__link
        if (!m.has(k)) m.set(k, [])
        m.get(k).push(p)
      })
      items = Array.from(m, function (e) { return { key: e[0], rows: e[1] } })
    }
    if (q.sort.length) {
      items = items.slice().sort(function (a, b) {
        for (var i = 0; i < q.sort.length; i++) {
          var s = q.sort[i]
          var c = sortCmp(evalAst(s.e, a), evalAst(s.e, b))
          if (s.dir === 'DESC') c = -c
          if (c !== 0) return c
        }
        return 0
      })
    }
    if (q.limit != null) items = items.slice(0, q.limit)
    return items
  }

  // ---------- 渲染 ----------
  function renderInlineMd(s) {
    var out = esc(s)
    out = out.replace(/!\[([^\]]*?)(?:\|(\d+))?\]\(([^)]*)\)/g, function (_, alt, w, url) {
      // 空链接的图片（如无封面的书）不渲染，留空单元格
      if (!url.trim()) return ''
      var style = w ? ' style="max-height:' + w + 'px;width:auto"' : ''
      return '<img src="' + url + '" alt="' + alt + '"' + style + ' loading="lazy">'
    })
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
    return out
  }
  function renderCell(v) {
    if (v == null || v === '') return '<span class="dvl-nil">—</span>'
    if (v && v.__link) return '<a href="' + esc(pathToUrl(v.__link)) + '">' + esc(v.name || v.__link) + '</a>'
    if (v instanceof DT) return esc(fmtDate(v.d, 'yyyy-MM-dd'))
    if (Array.isArray(v)) return esc(v.join('、'))
    if (typeof v === 'string') {
      if (/!\[[^\]]*\]\(/.test(v) || /\[[^\]]+\]\(/.test(v) || /`/.test(v) || /\*\*/.test(v)) return renderInlineMd(v)
      return esc(v)
    }
    if (typeof v === 'boolean') return v ? '✅' : '❌'
    return esc(String(v))
  }
  function buildTable(headers, rows) {
    var t = document.createElement('table')
    var thead = t.createTHead()
    var hr = thead.insertRow()
    headers.forEach(function (h) {
      var th = document.createElement('th')
      th.innerHTML = typeof h === 'string' ? renderInlineMd(h) : renderCell(h)
      hr.appendChild(th)
    })
    var tb = t.createTBody()
    rows.forEach(function (r) {
      var tr = tb.insertRow()
      r.forEach(function (c) { var td = tr.insertCell(); td.innerHTML = renderCell(c) })
    })
    return t
  }

  function renderDql(code, container) {
    var q = parseQuery(code)
    var items = runQuery(q)
    if (q.kind === 'table') {
      var headers = q.cols.map(function (c) { return c.alias || c.raw })
      var rows = items.map(function (it) { return q.cols.map(function (c) { return evalAst(c.e, it) }) })
      container.appendChild(buildTable(headers, rows))
      if (!items.length) container.appendChild(emptyNote())
    } else if (q.kind === 'list') {
      var ul = document.createElement('ul')
      ul.className = 'dvl-list'
      items.forEach(function (p) {
        var li = document.createElement('li')
        li.innerHTML = '<a href="' + esc(pathToUrl(p.file.path)) + '">' + esc(p.title || p.file.name) + '</a>'
        ul.appendChild(li)
      })
      container.appendChild(ul)
      if (!items.length) container.appendChild(emptyNote())
    } else if (q.kind === 'task') {
      var tasks = TASKS.filter(function (t) { return matchFrom(q.from, t.page) })
      if (q.where) tasks = tasks.filter(function (t) { return truthy(evalAst(q.where, t.page)) })
      var ul2 = document.createElement('ul')
      ul2.className = 'dvl-tasks'
      tasks.slice(0, q.limit != null ? q.limit : Infinity).forEach(function (t) {
        var li = document.createElement('li')
        li.innerHTML = '<input type="checkbox" disabled> <span>' + renderInlineMd(t.text) + '</span> <a class="dvl-task-src" href="' + esc(pathToUrl(t.page.file.path)) + '">↗</a>'
        ul2.appendChild(li)
      })
      container.appendChild(ul2)
      if (!tasks.length) container.appendChild(emptyNote())
    }
  }
  function emptyNote() {
    var el = document.createElement('p')
    el.className = 'dvl-empty'
    el.textContent = '（无匹配结果）'
    return el
  }

  // ---------- dataviewjs 垫片 ----------
  function makeDv(container) {
    return {
      luxon: { DateTime: DT },
      pages: function (src) {
        if (src === undefined || src === null || src === '') return PAGES
        var s = String(src).trim().replace(/^"+|"+$/g, '')
        if (!s) return PAGES
        return DA(PAGES.filter(function (p) { return p.file.folder === s || p.file.folder.startsWith(s + '/') }))
      },
      table: function (headers, rows) { container.appendChild(buildTable(headers, rows)) },
      paragraph: function (t) {
        var el = document.createElement('p')
        el.className = 'dvl-para'
        el.innerHTML = renderInlineMd(String(t))
        container.appendChild(el)
      },
      header: function (lvl, t) {
        var h = document.createElement('h' + Math.min(6, Math.max(1, lvl)))
        h.textContent = String(t)
        container.appendChild(h)
      },
      list: function (items) {
        var ul = document.createElement('ul')
        ul.className = 'dvl-list'
        items.forEach(function (it) {
          var li = document.createElement('li')
          li.innerHTML = renderCell(it)
          ul.appendChild(li)
        })
        container.appendChild(ul)
      },
    }
  }

  function renderTagcloud(code, container) {
    var counts = {}
    PAGES.forEach(function (p) { p.file.etags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1 }) })
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] }).slice(0, 40)
    var span = document.createElement('p')
    span.className = 'dvl-tagcloud'
    top.forEach(function (t) {
      var a = document.createElement('a')
      a.className = 'dvl-tag'
      var size = Math.round(11 + Math.min(16, Math.sqrt(counts[t]) * 3))
      a.style.fontSize = size + 'px'
      a.textContent = t
      span.appendChild(a)
      span.appendChild(document.createTextNode(' '))
    })
    container.appendChild(span)
  }

  // ---------- 主流程 ----------
  function ensureMeta() {
    if (!metaPromise) {
      metaPromise = fetch('/static/vault-meta.json')
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
        .then(function (meta) { buildPages(meta); return meta })
        .catch(function (e) { console.warn('[dataview-lite] 元数据加载失败，查询块保持原样:', e); metaPromise = null; return null })
    }
    return metaPromise
  }

  function renderAll() {
    // 教学豁免：Obsidian/dataview 教学笔记的查询块本身就是教学内容，
    // 渲染成（多半为空的）结果表反而丢掉示例原文
    var here = (typeof window !== 'undefined' && window.location) ? decodeURIComponent(window.location.pathname).toLowerCase() : ''
    if (here.indexOf('/技术笔记/编辑器/obsidian/') === 0) return
    // Quartz 的 rehype-pretty-code 输出 <figure data-rehype-pretty-code-figure>
    //   > <pre data-language="dataview"> <code data-language="dataview">
    // data-language 恒存在；language-* class 只在命中高亮语言时才有，两者都认
    var blocks = document.querySelectorAll(
      'pre[data-language="dataview"], pre[data-language="dataviewjs"], pre[data-language="tagcloud"], ' +
      'pre > code[class*="language-dataview"], pre > code[class*="language-tagcloud"]'
    )
    if (!blocks.length) return
    ensureMeta().then(function (meta) {
      if (!meta) return
      blocks.forEach(function (pre) {
        if (pre.dataset.dvl) return
        // 目标统一收敛到 <pre>（选择器也可能命中 <code>）
        if (pre.tagName === 'CODE') { if (!pre.parentElement || pre.parentElement.tagName !== 'PRE') return; pre = pre.parentElement }
        var lang = (pre.getAttribute('data-language') || '').toLowerCase()
        if (!lang) {
          var codeEl0 = pre.querySelector('code')
          var cls = codeEl0 ? codeEl0.className : pre.className
          lang = /language-(\w+)/.test(cls) ? RegExp.$1.toLowerCase() : ''
        }
        if (lang !== 'dataview' && lang !== 'dataviewjs' && lang !== 'tagcloud') return
        var codeEl = pre.querySelector('code') || pre
        var src = codeEl.textContent
        var container = document.createElement('div')
        container.className = 'dvl-block'
        try {
          if (lang === 'dataviewjs') { new Function('dv', src)(makeDv(container)) }
          else if (lang === 'tagcloud') { renderTagcloud(src, container) }
          else { renderDql(src, container) }
          pre.dataset.dvl = 'done'
          // rehype-pretty-code 的 figure 卡壳一并替换，避免留下空白卡
          var target = pre.parentElement && pre.parentElement.tagName === 'FIGURE' && pre.parentElement.hasAttribute('data-rehype-pretty-code-figure')
            ? pre.parentElement : pre
          target.replaceWith(container)
        } catch (e) {
          console.warn('[dataview-lite] 渲染失败（保留原代码块）:', e, src.slice(0, 120))
        }
      })
    })
  }

  var started = false
  function boot() {
    if (started) { renderAll(); return }
    started = true
    renderAll()
  }
  boot()
  document.addEventListener('nav', function () { setTimeout(boot, 0) })

  // Node 单测钩子（浏览器里无害）：暴露无 DOM 依赖的纯函数供脚本测试
  if (typeof globalThis !== 'undefined') {
    globalThis.__dataviewLite = {
      parseQuery: parseQuery,
      setPages: function (pages) { PAGES = DA(pages); TASKS = [] },
      runQuery: runQuery,
      pathToUrl: pathToUrl,
      fmtDate: fmtDate,
      DT: DT,
      evalAst: evalAst,
      makeDv: makeDv,
      getPages: function () { return PAGES },
    }
  }
})()
