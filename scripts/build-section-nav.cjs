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
 *   1) 在 <h2 class="page-title">…</h2> 之后插入 <nav class="top-nav">（首页 + 各一级）
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
  if (slug === 'index') continue
  if (/^(tags|static|404)\b/.test(slug)) continue
  pages.push({ slug, title: (v && v.title) || slug.split('/').pop(), filePath: (v && v.filePath) || '' })
}
pages.sort((a, b) => natCompare(a.slug, b.slug))

// ── 组织成 一级 → 二级 → 条目 ────────────────────────────────────────────
const sections = new Map() // 一级 → { groups: Map(二级 → items[]), total }
for (const p of pages) {
  const seg = p.slug.split('/')
  const sec = seg.length > 1 ? seg[0] : '首页'
  const grp = seg.length > 2 ? seg[1] : '（顶层）'
  if (!sections.has(sec)) sections.set(sec, { groups: new Map(), total: 0 })
  const s = sections.get(sec)
  if (!s.groups.has(grp)) s.groups.set(grp, [])
  s.groups.get(grp).push(p)
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
  const dir = path.posix.dirname(fromSlug)
  const rel = path.posix.relative(dir === '.' ? '' : dir, toSlug)
  return rel === '' ? path.posix.basename(toSlug) : rel
}

// 首页是 /index.html，用「退到根目录」的写法，别写 index（会被当成 /index 而 404）
const homeHref = (fromSlug) => {
  const dir = path.posix.dirname(fromSlug)
  if (dir === '.') return './'
  return '../'.repeat(dir.split('/').length)
}

// ── 生成顶栏 ────────────────────────────────────────────────────────────
function renderTopNav(currentSlug) {
  const cur = currentSlug.split('/')[0]
  const links = ['<a' + (currentSlug === 'index' ? ' class="on"' : '') + ' href="' + esc(homeHref(currentSlug)) + '">首页</a>']
  for (const s of sectionNames) {
    const first = [...sections.get(s).groups.values()].flat().sort((a, b) => natCompare(a.slug, b.slug))[0]
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
      const st = sections.get(s)
      const first = [...st.groups.values()].flat().sort((a, b) => natCompare(a.slug, b.slug))[0]
      return '<li><a href="' + esc(relHref(currentSlug, first.slug)) + '">' + esc(sectionLabel(s)) +
        '<span class="cnt">' + st.total + '</span></a></li>'
    })
    return '<nav class="side-nav" aria-label="全站分区"><div class="side-nav-head"><b>全部笔记</b>' +
      '<span>' + pages.length + ' 篇</span></div><ul class="items">' + rows.join('') + '</ul></nav>'
  }

  const st = sections.get(sec)
  if (!st) return ''
  const curGroup = seg.length > 2 ? seg[1] : '（顶层）'

  const groups = [...st.groups.keys()].sort(natCompare)
  const blocks = groups.map((gname, gi) => {
    const items = st.groups.get(gname).slice().sort((a, b) => natCompare(a.slug, b.slug))
    const isCur = gname === curGroup
    const roman = ROMAN[gi] || String(gi + 1)
    // 卷名也回退到 filePath 的原始大小写（Agent / Transformer 这类英文目录 slug 会变全小写）
    const fpSeg = (items[0].filePath || '').split(/[\\/]/)
    const label = gname === '（顶层）' ? '未归档' : stripNum(fpSeg[1] || gname)

    let body = ''
    if (items.length > BIG_GROUP) {
      // 大卷：只列子目录（取第三段），每个子目录链到它的第一篇
      const subs = new Map()
      for (const it of items) {
        const s = it.slug.split('/')
        const key = s.length > 3 ? s[2] : '（散篇）'
        if (!subs.has(key)) subs.set(key, [])
        subs.get(key).push(it)
      }
      const subRows = [...subs.keys()].sort(natCompare).map((k) => {
        const list = subs.get(k)
        const active = list.some((x) => x.slug === currentSlug) ? ' class="active"' : ''
        const href = relHref(currentSlug, list[0].slug)
        // 子目录名同样回退到 filePath 的原始大小写（slug 是小写的）
        const fp = (list[0].filePath || '').split(/[\\/]/)
        const label = k === '（散篇）' ? k : stripNum(fp[2] || k)
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
      '<summary><span class="badge">' + roman + '</span><span class="vol-name">' + esc(label) + '</span>' +
      '<span class="cnt">' + items.length + '</span></summary>' + body + '</details>'
  })

  return '<nav class="side-nav" aria-label="本区目录"><div class="side-nav-head"><b>' + esc(sectionLabel(sec)) +
    '</b><span>' + st.total + ' 篇</span></div>' + blocks.join('') + '</nav>'
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

    if (out !== src) {
      stats.changed++
      if (!DRY) fs.writeFileSync(p, out, 'utf8')
    }
  }
}

walk(PUB)
stats.sections = sectionNames.length
console.log(`[section-nav] 页面 ${stats.files} 个；改写 ${stats.changed} 个；一级分区 ${stats.sections} 个` + (DRY ? '（干跑）' : ''))
