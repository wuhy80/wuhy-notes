#!/usr/bin/env node
/**
 * enhance-content.cjs —— 构建后的内容增强（不改 Quartz 内部，只改写产物 HTML）
 *
 * 为什么放在这一层：Quartz 没有"测验"和"上一课/下一课"这两个插槽；改
 * quartz.layout.ts / components/*.tsx 要维护 fork，每次升级都要回归。
 * 而产物里链接已经解析成相对 href、锚点已经生成，在这一层做结构改写既精确又零维护。
 * （同一层的先例：scripts/fix-html-emphasis.cjs）
 *
 * 做四件事：
 *   1) 测验：<blockquote class="callout example"> 里的「Q1/Q2 + A~D 选项 + ✅ 正解 + 讲解」
 *      → <section class="quiz"> + 单选框 + 纯 CSS 判分（选中即时对错、讲解自动展开，无 JS）
 *   2) 文末导航：<h2 id="相关笔记"> 后的 <ul>（所属卷/上一课/下一课/课程总览）
 *      → <nav class="lesson-nav"> 两张箭头卡 + 一行小字
 *   3) 探索树滚动护栏：每页 <head> 最前注入 12 行补丁，拦住探索树渲染完后
 *      对当前项调用 scrollIntoView 把整个窗口拖走（实测 scrollY 0 → 462）
 *   4) 探索树标题瘦身：树里的链接文字若重复了父文件夹名（「5分钟手把手」下的
 *      「5分钟手把手系列(八)：…」），只缩短**侧栏里的显示**，序号提成小徽标，
 *      完整标题留在 title 属性里；笔记自身的 title / H1 / URL 一律不动
 *
 * 用法：node scripts/enhance-content.cjs <public 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const DRY = process.argv.includes('--dry')

const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'])

/** 从 openIdx（指向 '<tag' 的 '<'）开始，返回同名闭合标签 '</tag>' 的起始下标 */
function matchingClose(html, openIdx, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi')
  re.lastIndex = openIdx
  let depth = 0
  let m
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      depth--
      if (depth === 0) return m.index
    } else {
      const tagEnd = html.indexOf('>', m.index)
      if (tagEnd < 0) return -1
      if (html[tagEnd - 1] === '/') continue // 自闭合
      depth++
    }
  }
  return -1
}

/** 把一段 HTML 的顶层元素切成 [{tag, html}]（不深入子元素） */
function topLevelBlocks(html) {
  const blocks = []
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g
  let depth = 0
  let start = -1
  let name = null
  let m
  while ((m = tagRe.exec(html))) {
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const selfClose = /\/\s*$/.test(m[3]) || VOID.has(tag)
    if (!closing) {
      if (depth === 0) {
        start = m.index
        name = tag
      }
      if (selfClose) {
        if (depth === 0) {
          blocks.push({ tag, html: m[0] })
          start = -1
        }
      } else {
        depth++
      }
    } else {
      depth--
      if (depth === 0 && start >= 0) {
        blocks.push({ tag: name, html: html.slice(start, tagRe.lastIndex) })
        start = -1
      }
      if (depth < 0) depth = 0
    }
  }
  return blocks
}

const textOf = (h) =>
  h
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

/** 去掉最外层标签，返回内部 HTML */
function innerOf(blockHtml) {
  const open = blockHtml.indexOf('>')
  const close = blockHtml.lastIndexOf('</')
  return open >= 0 && close > open ? blockHtml.slice(open + 1, close) : blockHtml
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ───────────────────────────────────────────────────────────────────────────
// 1) 测验
// ───────────────────────────────────────────────────────────────────────────
const QUIZ_OPEN = '<blockquote class="callout example"'
const MARK_OK = /[✅✓✔]/

let quizSeq = 0

/** 解析单个 example callout；不是测验就返回 null（原样保留） */
function convertQuiz(block, stats) {
  const contentM = block.match(/<div class="callout-content">([\s\S]*)<\/div>\s*<\/blockquote>\s*$/)
  if (!contentM) return null
  const inner = contentM[1]

  // 按顶层块聚合成题
  const items = []
  let cur = null
  for (const b of topLevelBlocks(inner)) {
    if (b.tag === 'p') {
      const t = textOf(b.html)
      if (/^Q\s*\d+\s*[.．、:：]/.test(t)) {
        cur = { q: b.html, opts: null, why: null, whyLabel: '' }
        items.push(cur)
        continue
      }
    }
    if (!cur) continue
    if ((b.tag === 'ul' || b.tag === 'ol') && !cur.opts) cur.opts = b.html
    else if (b.tag === 'blockquote' && !cur.why) {
      cur.why = b.html
      const tm = b.html.match(/<div class="callout-title-inner"><p>([\s\S]*?)<\/p><\/div>/)
      cur.whyLabel = tm ? textOf(tm[1]) : '讲解'
    }
  }

  // 只认「有选项且恰好标了一个正解」的题
  const questions = items.filter((x) => x.opts && MARK_OK.test(x.opts))
  if (!questions.length) return null

  quizSeq++
  const qid = quizSeq
  const parts = questions.map((it, qi) => {
    const lis = topLevelBlocks(innerOf(it.opts)).filter((b) => b.tag === 'li')
    const opts = []
    let answer = ''
    lis.forEach((li) => {
      const raw = textOf(li.html)
      const ok = MARK_OK.test(li.html)
      const letterM = raw.match(/^([A-Za-z])\s*[.．、:：)]?\s*/)
      const letter = letterM ? letterM[1].toUpperCase() : ''
      const label = letterM ? raw.slice(letterM[0].length) : raw
      const clean = label.replace(/[✅✓✔]/g, '').replace(/\s+/g, ' ').trim()
      if (!opts.length && !letter) return
      if (ok && !answer) answer = letter
      const name = `quiz-${qid}-${qi + 1}`
      opts.push(
        `<label class="quiz-opt${ok ? ' is-answer' : ''}">` +
          `<input type="radio" name="${name}" value="${esc(letter)}">` +
          `<span class="quiz-key">${esc(letter)}</span>` +
          `<span class="quiz-txt">${esc(clean)}</span>` +
          `</label>`
      )
    })
    if (opts.length < 2) return ''
    let why = ''
    if (it.why) {
      const wm = it.why.match(/<div class="callout-content">([\s\S]*)<\/div>/)
      const body = wm ? wm[1] : ''
      why =
        `<div class="quiz-why"><div class="quiz-why-inner">` +
        `<span class="quiz-why-label">${esc(it.whyLabel)}</span>${body}` +
        `</div></div>`
    }
    return (
      `<div class="quiz-item" data-answer="${esc(answer)}">` +
      `<p class="quiz-q">${innerOf(it.q)}</p>` +
      `<div class="quiz-opts" role="radiogroup">${opts.join('')}</div>` +
      why +
      `</div>`
    )
  })
  const body = parts.filter(Boolean).join('')
  if (!body) return null
  stats.quizQuestions += questions.length
  return (
    `<section class="quiz" data-quiz>` +
    `<div class="quiz-head"><span class="quiz-badge">学习小测验</span>` +
    `<span class="quiz-hint">选一个答案，立刻判对错</span></div>` +
    body +
    `</section>`
  )
}

function transformQuizzes(html, stats) {
  let out = ''
  let i = 0
  for (;;) {
    const idx = html.indexOf(QUIZ_OPEN, i)
    if (idx < 0) break
    const close = matchingClose(html, idx, 'blockquote')
    if (close < 0) break
    const end = html.indexOf('>', close) + 1
    const block = html.slice(idx, end)
    const conv = convertQuiz(block, stats)
    out += html.slice(i, idx) + (conv || block)
    if (conv) stats.quizBlocks++
    i = end
  }
  return out + html.slice(i)
}

// ───────────────────────────────────────────────────────────────────────────
// 2) 文末上一课 / 下一课
// ───────────────────────────────────────────────────────────────────────────
function transformLessonNav(html, stats) {
  const anchor = 'id="相关笔记"'
  const at = html.indexOf(anchor)
  if (at < 0) return html

  const h2Start = html.lastIndexOf('<h2', at)
  const h2Close = html.indexOf('</h2>', at)
  if (h2Start < 0 || h2Close < 0) return html
  const h2End = h2Close + 5

  const ulStart = html.indexOf('<ul>', h2End)
  if (ulStart < 0) return html
  if (html.slice(h2End, ulStart).replace(/\s+/g, '') !== '') return html // h2 与列表之间还有别的内容
  const ulClose = matchingClose(html, ulStart, 'ul')
  if (ulClose < 0) return html
  const ulEnd = html.indexOf('>', ulClose) + 1
  const ul = html.slice(ulStart, ulEnd)

  const lis = topLevelBlocks(innerOf(ul)).filter((b) => b.tag === 'li')
  const pick = (prefix) => {
    for (const li of lis) {
      const t = textOf(li.html)
      if (!t.startsWith(prefix)) continue
      const m = li.html.match(/<a\b[\s\S]*?<\/a>/)
      if (!m) continue
      return { a: m[0], label: textOf(m[0]) }
    }
    return null
  }
  const prev = pick('上一课')
  const next = pick('下一课')
  if (!prev && !next) return html

  const vol = pick('所属卷')
  const toc = pick('课程总览')

  const card = (item, dir) =>
    item
      ? `<a class="internal lesson-nav-card ${dir}" href="${(item.a.match(/href="([^"]*)"/) || [, ''])[1]}" ` +
        `data-slug="${((item.a.match(/data-slug="([^"]*)"/) || [, ''])[1])}">` +
        `<span class="lesson-nav-label">${dir === 'prev' ? '← 上一课' : '下一课 →'}</span>` +
        `<span class="lesson-nav-title">${esc(item.label)}</span></a>`
      : `<span class="lesson-nav-card ${dir} is-empty"></span>`

  const nav = `<nav class="lesson-nav" aria-label="课程导航">${card(prev, 'prev')}${card(next, 'next')}</nav>`

  const metaBits = []
  if (vol) metaBits.push(`所属卷 ${vol.a}`)
  if (toc) metaBits.push(toc.a)
  const meta = metaBits.length ? `<p class="lesson-nav-meta">${metaBits.join(' · ')}</p>` : ''

  const heading = `<h2 class="lesson-nav-heading" id="相关笔记">相关笔记</h2>`
  stats.navs++
  return html.slice(0, h2Start) + heading + nav + meta + html.slice(ulEnd)
}

// ───────────────────────────────────────────────────────────────────────────
// 3) 探索树滚动护栏
//
// 问题（2026-10-22 线上实测）：探索树用 contentIndex 异步建树，建完会对当前文件
// 调用 scrollIntoView；侧栏没有自己的滚动容器时，浏览器把这个"滚进视野"一路
// 冒泡到文档，打开的笔记直接落在正文中段（同一页 window.scrollY：0 → 462）。
//
// 护栏把 .explorer 内的 scrollIntoView 改成"只滚 .explorer-content"，
// 其余元素行为不变。必须放在 <head> 最前：探索树的模块脚本晚于它执行。
// ───────────────────────────────────────────────────────────────────────────
const GUARD_MARK = 'data-explorer-scroll-guard'
const GUARD =
  `<script ${GUARD_MARK}>(function(){` +
  `var orig=Element.prototype.scrollIntoView;` +
  `Element.prototype.scrollIntoView=function(){` +
  `if(this.closest&&this.closest('.explorer')){` +
  `var box=this.closest('.explorer-content');` +
  `if(box){var top=this.getBoundingClientRect().top-box.getBoundingClientRect().top+box.scrollTop;` +
  `box.scrollTop=Math.max(0,top-Math.round(box.clientHeight/3));}` +
  `return;}` +
  `return orig.apply(this,arguments);` +
  `};})();</script>`

function injectScrollGuard(html, stats) {
  if (html.indexOf(GUARD_MARK) >= 0) return html
  const head = html.match(/<head[^>]*>/i)
  if (!head) return html
  const at = head.index + head[0].length
  stats.guards++
  return html.slice(0, at) + GUARD + html.slice(at)
}

// ───────────────────────────────────────────────────────────────────────────
// 4) 探索树标题瘦身
//
// 场景：大模型/07-教程与课程/5分钟手把手 下的 9 篇，title 都是
// 「5分钟手把手系列(八)：本地通过Browser Use…」。侧栏里父文件夹已经写着
// 「5分钟手把手」，每行再重复一遍，宽度全被吃掉、换行后更难扫。
//
// 做法：只改**侧栏里的显示文本**——去掉与父文件夹重复的前缀，把「(八)」提成
// 小徽标；完整标题写进 title 属性（悬停可见）。笔记自身的 frontmatter title、
// H1、URL、搜索索引一律不动，所以不会影响反向链接和站外引用。
//
// 触发条件保守：必须是「父文件夹名 + 系列?(序号) + 分隔符……」，且序号带括号
// （（八）/ (8) / 【三】）。不带括号的写法一律不动——日期目录里
// 「2026-06-18 AI 早报」的剩余部分是「-18 AI 早报」，按分隔符削会变成「18 AI 早报」，
// 把月份信息弄丢（2026-10-22 实测踩过，156 条被误伤）。
// ───────────────────────────────────────────────────────────────────────────
const TITLES_MARK = 'data-explorer-titles'
const TITLES = `<script ${TITLES_MARK}>(function(){
if(window.__qzExplorerTitles)return;window.__qzExplorerTitles=1;
var IDX=/^[（(【\\[]\\s*([0-9]{1,3}|[一二三四五六七八九十百]{1,3})\\s*[）)】\\]]/;
var SEP=/^[\\s:：\\-—–、,，.。]+/;
function folderOf(a){
  var li=a.closest('li'),ul=li&&li.parentElement,outer=ul&&ul.closest('.folder-outer');
  var box=outer&&outer.previousElementSibling,ft=box&&box.querySelector('.folder-title');
  return ft?ft.textContent.trim():'';
}
function shorten(a){
  if(a.hasAttribute('data-ex-short'))return;
  var full=(a.textContent||'').trim(),folder=folderOf(a),body='',idx='';
  if(folder&&full.length>folder.length&&full.indexOf(folder)===0){
    var rest=full.slice(folder.length).replace(/^系列/,'');
    var m=rest.match(IDX);
    if(m){idx=m[1];body=rest.slice(m[0].length).replace(SEP,'');}
  }
  if(!body||body.length>full.length-2){a.setAttribute('data-ex-short','');return;}
  a.setAttribute('data-ex-short','1');
  a.setAttribute('title',full);
  a.textContent='';
  var line=document.createElement('span');line.className='ex-line';
  if(idx){var sp=document.createElement('span');sp.className='ex-idx';sp.textContent='（'+idx+'）';line.appendChild(sp);}
  line.appendChild(document.createTextNode(body));
  a.appendChild(line);
}
function sweep(){
  var links=document.querySelectorAll('.explorer a.nav-file-title');
  for(var i=0;i<links.length;i++)shorten(links[i]);
}
var queued=false;
function schedule(){if(queued)return;queued=true;setTimeout(function(){queued=false;sweep();},120);}
function start(){
  if(!document.body){document.addEventListener('DOMContentLoaded',start,{once:true});return;}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('nav',schedule);
  schedule();
}
start();
})();</script>`

function injectExplorerTitles(html, stats) {
  if (html.indexOf(TITLES_MARK) >= 0) return html
  const head = html.match(/<head[^>]*>/i)
  if (!head) return html
  const at = head.index + head[0].length
  stats.titles++
  return html.slice(0, at) + TITLES + html.slice(at)
}

// ───────────────────────────────────────────────────────────────────────────
// 5) 动手实验组件（lab-widgets.js）
//
// 源站的 .lab 是 React 交互组件（拖动物点、滑块割线、点词看注意力），
// 导入时只能降级成「请去原站体验」的占位。这里把 scripts/lab-widgets.js
// 拷进 public/static/js/ 并在 <head> 挂一个 defer 脚本；笔记里只留
// <div class="lab" data-lab="animal-map"></div> 这样的占位。
// ───────────────────────────────────────────────────────────────────────────
const LAB_MARK = 'data-lab-widgets'
const LAB_SRC = path.join(__dirname, 'lab-widgets.js')

function copyLabWidgets(publicDir) {
  if (!fs.existsSync(LAB_SRC)) {
    console.warn('[enhance] 未找到 lab-widgets.js，跳过动手实验')
    return false
  }
  const dir = path.join(publicDir, 'static', 'js')
  fs.mkdirSync(dir, { recursive: true })
  fs.copyFileSync(LAB_SRC, path.join(dir, 'lab-widgets.js'))
  return true
}

function injectLabWidgets(html, stats) {
  if (html.indexOf(LAB_MARK) >= 0) return html
  const at = html.toLowerCase().lastIndexOf('</head>')
  if (at < 0) return html
  stats.labs++
  const tag = `<script ${LAB_MARK} defer src="/static/js/lab-widgets.js"></script>`
  return html.slice(0, at) + tag + html.slice(at)
}

// ───────────────────────────────────────────────────────────────────────────
// 主流程
// ───────────────────────────────────────────────────────────────────────────
const stats = { files: 0, changed: 0, quizBlocks: 0, quizQuestions: 0, navs: 0, guards: 0, titles: 0, labs: 0 }

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      walk(p)
      continue
    }
    if (!ent.name.endsWith('.html')) continue
    stats.files++
    const src = fs.readFileSync(p, 'utf8')
    let out = src
    const before = { ...stats }
    out = transformQuizzes(out, stats)
    out = transformLessonNav(out, stats)
    out = injectScrollGuard(out, stats)
    out = injectExplorerTitles(out, stats)
    out = injectLabWidgets(out, stats)
    if (out !== src) {
      stats.changed++
      if (!DRY) fs.writeFileSync(p, out, 'utf8')
    } else if (before.quizBlocks !== stats.quizBlocks) {
      stats.changed++
    }
  }
}

if (!fs.existsSync(PUB)) {
  console.error(`[enhance] 目录不存在：${PUB}`)
  process.exit(1)
}
if (!DRY) copyLabWidgets(PUB)
walk(PUB)
console.log(
  `[enhance] 扫描 HTML ${stats.files} 个；改写 ${stats.changed} 个；` +
    `测验 ${stats.quizBlocks} 块 / ${stats.quizQuestions} 题；课程导航 ${stats.navs} 处；` +
    `滚动护栏 ${stats.guards} 页；标题瘦身 ${stats.titles} 页；动手实验 ${stats.labs} 页` +
    (DRY ? '（干跑，未写入）' : '')
)
