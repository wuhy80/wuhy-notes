#!/usr/bin/env node
/**
 * build-section-nav.cjs —— 把「一级目录」搬到顶栏，左栏改成「当前一级的章节 + 条目」
 *
 * 为什么放在构建后（与 enhance-content.cjs 同一层）：
 *   Quartz 的左栏是客户端用 contentIndex.json 渲染的一整棵树，CSS 没法只显示
 *   「当前一级」这一支；顶部也没有 navbar 组件。改 quartz.layout.ts 要维护 fork，
 *   所以按现有先例，在产物 HTML 上直接生成静态导航。
 *
 * 产物里做的事：
 *   1) 在 <h2 class="page-title">…</h2> 之后插入 <nav class="top-nav">（各一级；回首页点站名）
 *   2) 在 <div class="explorer …"> 之前插入 <nav class="side-nav">：
 *        卷（二级目录，罗马数字 + 名称 + 篇数）→ 条目（两位序号 + 标题）
 *        默认只展开当前页所在卷；大卷（>40 篇）只列子目录
 *   3) Quartz 自己的 .explorer 由 site-custom.scss 隐藏
 *
 * 用法：node scripts/build-section-nav.cjs <public 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2]
const DRY = process.argv.includes('--dry')
const BIG_GROUP = 40 // 超过这个篇数的卷只列子目录

if (!PUB || !fs.existsSync(PUB)) {
  console.error('[section-nav] 用法: node build-section-nav.cjs <public 目录> [--dry]')
  process.exit(2)
}

// 一级目录的固定顺序（其余目录按名称追加在末尾）
const SECTION_ORDER = [
  '大模型', '技术笔记', '读书笔记', '数学学习', '英语学习',
  '专项学习', '编程语言', 'Golang编程', 'Rust编程', 'Ontology', '网址收藏',
]

const ROMAN = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ',
  'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ']

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// 自然排序：01 < 02 < 10 < Agent < 中文
function natCompare(a, b) {
  const re = /(\d+)|(\D+)/g
  const ax = String(a).match(re) || []
  const bx = String(b).match(re) || []
  for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
    const x = ax[i], y = bx[i]
    const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y)
    if (nx && ny) {
      const d = Number(x) - Number(y)
      if (d !== 0) return d
      if (x.length !== y.length) return x.length - y.length
    } else if (nx !== ny) {
      return nx ? -1 : 1
    } else {
      const d = x.localeCompare(y, 'zh-CN')
      if (d !== 0) return d
    }
  }
  return ax.length - bx.length
}

const stripNum = (name) => name.replace(/^\d+[-_.\s]+/, '')

// ── 读内容索引（slug → 标题）─────────────────────────────────────────────
const indexPath = path.join(PUB, 'static', 'contentIndex.json')
if (!fs.existsSync(indexPath)) {
  console.error('[section-nav] 找不到 static/contentIndex.json，先跑一次 Quartz 构建')
  process.exit(1)
}
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))

// 收集页面：slug 里排除 tags / static / 404
const pages = []
for (const [slug, v] of Object.entries(index)) {
  // index 是「首页 + 导出脚本为每个目录生成的目录页」，不进侧栏条目与篇数
  // （否则 MOE / Transformer / 01-基础原理 这些目录名会混进编号列表，篇数也虚高）
  // index 结尾的 slug 有两种：① 导出脚本为目录生成的 index.md（应排除）；
  // ② Quartz 把「文件名与目录同名」的笔记（如 幻觉与可靠性/幻觉与可靠性.md）映射成
  //    目录首页 slug —— 这种是正经笔记，必须保留。用 filePath 是否 index.md 区分。
  if (slug === 'index') continue
  const fp = (v && v.filePath) || ''
  if (/(^|\/)index$/.test(slug) && /(^|[\\/])index\.md$/i.test(fp)) continue
  if (/^(tags|static|404)\b/.test(slug)) continue
  pages.push({ slug, title: (v && v.title) || slug.split('/').pop(), filePath: (v && v.filePath) || '' })
}
pages.sort((a, b) => natCompare(a.slug, b.slug))

// ── 组织成 一级 → 二级 → 条目 ────────────────────────────────────────────
// 二级目录按「去掉编号后的名字」合并：库里存在 大模型/01-基础原理 与 大模型/基础原理
// 这种重复目录时，侧栏不应该出现两个同名卷——合并成一卷，篇数相加。
const sections = new Map() // 一级 → { groups: Map(卷名 → { items[], sortKey }), total }
for (const p of pages) {
  const seg = p.slug.split('/')
  const fpSeg = (p.filePath || '').split(/[\\/]/)
  const sec = seg.length > 1 ? seg[0] : '首页'
  const rawGroup = seg.length > 2 ? (fpSeg[1] || seg[1]) : '（顶层）'
  const label = rawGroup === '（顶层）' ? '未归档' : stripNum(rawGroup)

  if (!sections.has(sec)) sections.set(sec, { groups: new Map(), total: 0 })
  const s = sections.get(sec)
  if (!s.groups.has(label)) s.groups.set(label, { items: [], sortKey: rawGroup })
  s.groups.get(label).items.push(p)
  s.total++
}

// Quartz 的 slug 会把目录名小写（Golang编程 → golang编程），排序与显示名都要按小写对表
const SECTION_ORDER_LC = SECTION_ORDER.map((s) => s.toLowerCase())
const DISPLAY_NAME = new Map(SECTION_ORDER.map((s) => [s.toLowerCase(), s]))
const sectionNames = [...sections.keys()].filter((s) => s !== '首页')
sectionNames.sort((a, b) => {
  const ia = SECTION_ORDER_LC.indexOf(a), ib = SECTION_ORDER_LC.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return natCompare(a, b)
})
const sectionLabel = (s) => {
  if (DISPLAY_NAME.has(s)) return DISPLAY_NAME.get(s)
  const st = sections.get(s)
  const any = st && [...st.groups.values()].flat()[0]
  const seg = any && any.filePath ? any.filePath.split(/[\\/]/) : []
  return seg[0] || s
}

const relHref = (fromSlug, toSlug) => {
  // 「文件名与目录同名」的笔记会被 Quartz 映射成 .../index；直接链到目录 URL（带尾斜杠），
  // 省掉一次 308 跳转
  const target = /(^|\/)index$/.test(toSlug) ? path.posix.dirname(toSlug) + '/' : toSlug
  const dir = path.posix.dirname(fromSlug)
  const rel = path.posix.relative(dir === '.' ? '' : dir, target)
  return rel === '' ? path.posix.basename(target) : rel
}

// ── 生成顶栏 ────────────────────────────────────────────────────────────
const pageBySlug = new Map(pages.map((p) => [p.slug, p]))

const firstPageOfSection = (sec) => {
  const st = sections.get(sec)
  if (!st) return null
  const all = [...st.groups.values()].flatMap((g) => g.items)
  all.sort((a, b) => natCompare(a.slug, b.slug))
  return all[0] || null
}

// ── 生成顶栏 ────────────────────────────────────────────────────────────
function renderTopNav(currentSlug) {
  const cur = currentSlug.split('/')[0]
  // 不放「首页」项：站点标题 h2.page-title 本身就是链接（各页均指向站点根），
  // 点击站名即回首页
  const links = []
  for (const s of sectionNames) {
    const first = firstPageOfSection(s)
    const href = first ? relHref(currentSlug, first.slug) : '#'
    links.push('<a' + (cur === s ? ' class="on"' : '') + ' href="' + esc(href) + '">' + esc(sectionLabel(s)) + '</a>')
  }
  return '<nav class="top-nav" aria-label="分区导航">' + links.join('') + '</nav>'
}

// ── 生成侧栏 ────────────────────────────────────────────────────────────
function renderSideNav(currentSlug) {
  const seg = currentSlug.split('/')
  const sec = seg.length > 1 ? seg[0] : null

  // 首页 / 根级页面：列出所有一级，当作站点地图
  if (!sec) {
    const rows = sectionNames.map((s) => {
      const first = firstPageOfSection(s)
      const href = first ? relHref(currentSlug, first.slug) : '#'
      return '<li><a href="' + esc(href) + '">' + esc(sectionLabel(s)) +
        '<span class="cnt">' + sections.get(s).total + '</span></a></li>'
    })
    return '<nav class="side-nav" aria-label="全站分区"><div class="side-nav-head"><b>全部笔记</b>' +
      '<span>' + pages.length + ' 篇</span></div><ul class="items">' + rows.join('') + '</ul></nav>'
  }

  const st = sections.get(sec)
  if (!st) return ''

  // 当前页所属的卷名（与分组时同一套规则：filePath 的原始目录名 → 去掉编号）
  const curPage = pageBySlug.get(currentSlug)
  const curFp = (curPage && curPage.filePath ? curPage.filePath : '').split(/[\\/]/)
  const curLabel = seg.length > 2 ? stripNum(curFp[1] || seg[1]) : '未归档'

  const groupKeys = [...st.groups.keys()].sort((a, b) => natCompare(st.groups.get(a).sortKey, st.groups.get(b).sortKey))
  const blocks = groupKeys.map((gname, gi) => {
    const g = st.groups.get(gname)
    const items = g.items.slice().sort((a, b) => natCompare(a.slug, b.slug))
    const isCur = gname === curLabel
    const roman = ROMAN[gi] || String(gi + 1)

    let body = ''
    if (items.length > BIG_GROUP) {
      // 大卷：只列子目录（filePath 第三段），每个子目录链到它的第一篇
      const subs = new Map()
      for (const it of items) {
        const fp = (it.filePath || '').split(/[\\/]/)
        const key = fp.length > 3 ? fp[2] : '（散篇）'
        if (!subs.has(key)) subs.set(key, [])
        subs.get(key).push(it)
      }
      const subRows = [...subs.keys()].sort(natCompare).map((k) => {
        const list = subs.get(k)
        const active = list.some((x) => x.slug === currentSlug) ? ' class="active"' : ''
        const href = relHref(currentSlug, list[0].slug)
        const label = k === '（散篇）' ? k : stripNum(k)
        return '<li><a' + active + ' href="' + esc(href) + '">' + esc(label) +
          '<span class="cnt">' + list.length + '</span></a></li>'
      })
      body = '<ul class="items subdirs">' + subRows.join('') + '</ul>'
    } else {
      const rows = items.map((it, i) => {
        const active = it.slug === currentSlug ? ' class="active"' : ''
        return '<li><a' + active + ' href="' + esc(relHref(currentSlug, it.slug)) + '">' +
          '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>' + esc(it.title) + '</a></li>'
      })
      body = '<ul class="items">' + rows.join('') + '</ul>'
    }

    return '<details class="vol' + (isCur ? ' on' : '') + '"' + (isCur ? ' open' : '') + '>' +
      '<summary><span class="badge">' + roman + '</span><span class="vol-name">' + esc(gname) + '</span>' +
      '<span class="cnt">' + items.length + '</span></summary>' + body + '</details>'
  })

  return '<nav class="side-nav" aria-label="本区目录"><div class="side-nav-head"><b>' + esc(sectionLabel(sec)) +
    '</b><span>' + st.total + ' 篇</span></div>' + blocks.join('') + '</nav>'
}

// ── 首页卡片链接：统一指向该分区的第一篇笔记 ────────────────────────────
// 为什么不用 <section>/index：Quartz 的目录页是构建时合成的，Markdown 里的绝对链接
// 命不中它，会退化成「按名字模糊匹配」，把 /数学学习/index 解析到 网址收藏/数学学习。
// 顶栏用的是 firstPageOfSection，这里跟它保持一致。
function rewriteHomeLinks(html, currentSlug) {
  const start = html.indexOf('<div class="markdown-preview-view')
  if (start < 0) return html
  const end = html.indexOf('</article>', start)
  if (end < 0) return html
  const seg = html.slice(start, end)
  const fixed = seg.replace(/(<a\b[^>]*?href=")([^"]*)("[^>]*>)([\s\S]*?)(<\/a>)/g,
    (m, p1, href, p3, inner, p5) => {
      const text = inner.replace(/<[^>]+>/g, '').trim()
      const sec = sectionNames.find((s) => text.startsWith(sectionLabel(s)))
      if (!sec) return m
      // 目录 URL（/数学学习/ 这类）在站点上是稳的；Ontology 没有目录页，退回第一篇
      const dir = path.posix.dirname(currentSlug)
      let newHref
      if (sec === 'ontology') {
        const first = firstPageOfSection(sec)
        newHref = first ? relHref(currentSlug, first.slug) : sec + '/'
      } else {
        newHref = path.posix.relative(dir === '.' ? '' : dir, sec + '/') || './'
        if (!newHref.endsWith('/')) newHref += '/'
      }
      return p1 + newHref + p3 + inner + p5
    })
  return html.slice(0, start) + fixed + html.slice(end)
}

// ── 改写页面 ────────────────────────────────────────────────────────────
const stats = { files: 0, changed: 0, sections: 0 }

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { walk(p); continue }
    if (!ent.name.endsWith('.html')) continue
    const rel = path.relative(PUB, p).split(path.sep).join('/')
    const slug = rel.slice(0, -'.html'.length)
    if (/^(static|plugins|assets)\//.test(slug) || slug === '404') continue

    stats.files++
    const src = fs.readFileSync(p, 'utf8')
    // 「首页」形态：站点首页与 00-index 这类合集落地页 —— 给 body 打标记，由 CSS 切成
    // 单栏通栏（顶栏 + 一整块导航），不再有左中右三栏
    const isLanding = slug === 'index' || /(^|\/)00-index$/i.test(slug)
    // 幂等：先清掉上一次生成的导航，避免重复构建时叠加
    let out = src
      .replace(/<nav class="top-nav"[\s\S]*?<\/nav>/g, '')
      .replace(/<nav class="side-nav"[\s\S]*?<\/nav>/g, '')

    const topNav = renderTopNav(slug)
    out = out.replace(/(<h2 class="page-title">[\s\S]*?<\/h2>)/, '$1' + topNav)

    const sideNav = renderSideNav(slug)
    if (sideNav) {
      if (out.includes('<div class="explorer')) {
        out = out.replace('<div class="explorer', sideNav + '<div class="explorer')
      } else {
        out = out.replace(/(<h2 class="page-title">[\s\S]*?<\/h2>)/, '$1' + sideNav)
      }
    }

    if (slug === 'index') {
      out = rewriteHomeLinks(out, slug)
    }

    if (isLanding) {
      out = out.replace(/ class="landing"/g, '')      // 幂等：先去掉旧标记
      out = out.replace(/<body\b/, '<body class="landing"')
    }

    if (out !== src) {
      stats.changed++
      if (!DRY) fs.writeFileSync(p, out, 'utf8')
    }
  }
}

walk(PUB)
stats.sections = sectionNames.length
console.log(`[section-nav] 页面 ${stats.files} 个；改写 ${stats.changed} 个；一级分区 ${stats.sections} 个` + (DRY ? '（干跑）' : ''))
