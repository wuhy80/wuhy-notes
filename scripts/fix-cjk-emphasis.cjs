#!/usr/bin/env node
/**
 * fix-cjk-emphasis.cjs — 修复「中文标点紧贴 ** ** 导致加粗不生效」
 *
 * 背景：CommonMark 的强调规则要求闭合分隔符是 right-flanking：
 *   right-flanking = 前面不是空白 且（前面不是标点 或 后面是空白/标点）
 * 中文写作习惯是「**重点。**下一句」，闭合的 ** 前面是句号（标点）、后面是汉字
 * （既非空白也非标点），于是判定不合格，原样输出成字面 **，页面上看到星号。
 * Obsidian 自己的解析器更宽松，所以本地笔记里是正常的，只有静态站会暴露。
 *
 * 做法：把**判定会失效**的那一对分隔符改写成行内 HTML <strong>/<em>。
 * 行内 HTML 不阻止内部继续按 Markdown 解析，因此 `<strong>重点</strong>` 效果
 * 与正常的 `**重点**` 完全一致；判定偏保守时也不会改变观感。
 *
 * 只动导出副本（publish 流水线的第 4.7 步），源笔记保持不变。
 *
 * 用法：node scripts/fix-cjk-emphasis.cjs <contentDir> [--dry]
 */
const fs = require('fs')
const path = require('path')

const ROOT = process.argv[2]
const DRY = process.argv.includes('--dry')
if (!ROOT || !fs.existsSync(ROOT)) {
  console.error('用法: node fix-cjk-emphasis.cjs <contentDir> [--dry]')
  process.exit(2)
}

const isWs = (ch) => ch === undefined || /\s/u.test(ch)
const isPunct = (ch) => ch !== undefined && /[\p{P}\p{S}]/u.test(ch)

function flank(text, start, len) {
  const before = start > 0 ? text[start - 1] : undefined
  const after = text[start + len]
  return {
    left: !isWs(after) && (!isPunct(after) || isWs(before) || isPunct(before)),
    right: !isWs(before) && (!isPunct(before) || isWs(after) || isPunct(after)),
  }
}

/** 行内不可改区域：行内代码 `...`、数学 $...$ / $$...$$、自动链接 <...> */
function protectedRanges(line) {
  const ranges = []
  const push = (s, e) => { if (e > s) ranges.push([s, e]) }
  // 行内代码
  for (const m of line.matchAll(/`+/g)) {
    const open = m.index
    const ticks = m[0]
    if (ranges.some(([s, e]) => open >= s && open < e)) continue
    const close = line.indexOf(ticks, open + ticks.length)
    if (close >= 0) push(open, close + ticks.length)
    else push(open, open + ticks.length)
  }
  // 数学
  for (const m of line.matchAll(/\$\$?/g)) {
    const open = m.index
    if (ranges.some(([s, e]) => open >= s && open < e)) continue
    const close = line.indexOf(m[0], open + m[0].length)
    if (close >= 0) push(open, close + m[0].length)
  }
  // 行内 HTML / 自动链接
  for (const m of line.matchAll(/<[^<>]{1,200}>/g)) push(m.index, m.index + m[0].length)
  return ranges
}

const inRanges = (ranges, i) => ranges.some(([s, e]) => i >= s && i < e)

/** 用同长度的占位符遮罩「不可动区域」：配对只看遮罩串，取值/替换回原文（偏移一致） */
const MASK = '\u0001'
function maskRanges(line, ranges) {
  if (!ranges.length) return line
  const chars = [...line]
  for (const [s, e] of ranges) for (let i = s; i < e && i < chars.length; i++) chars[i] = MASK
  return chars.join('')
}

/**
 * 成对匹配：遮罩后的行里匹配 `**…**` / `__…__`。
 * 内部允许出现 `*` `_` 与行内代码（遮罩后本就看不见），长度有限。
 * ⚠️ 不要写成 (...|...)* 那种嵌套量词：在含大量 * 的行上会回溯爆炸（实测卡死几分钟）。
 */
const PAIR_RE = /(\*\*|__)([^\n]{1,120}?)\1/g

function fixLine(line, stats) {
  const ranges = protectedRanges(line)
  const masked = maskRanges(line, ranges)
  const edits = []
  PAIR_RE.lastIndex = 0
  let m
  while ((m = PAIR_RE.exec(masked))) {
    const openAt = m.index
    const delim = m[1]
    const innerLen = m[2].length
    const closeAt = openAt + delim.length + innerLen
    // 取值用原文（遮罩串里是占位符）
    const inner = line.slice(openAt + delim.length, closeAt)
    // 内部首尾必须是可见字符，否则多半不是强调（如 `** a **`）
    if (!inner || isWs(inner[0]) || isWs(inner[inner.length - 1])) {
      PAIR_RE.lastIndex = openAt + delim.length // 把这次的开符号当作普通文本，继续往后找
      continue
    }
    const fo = flank(line, openAt, delim.length)
    const fc = flank(line, closeAt, delim.length)
    // 下划线还有「词内不强调」限制：foo_bar_baz / 汉_字_汉 都不算强调
    const intraword =
      delim[0] === '_' &&
      !isWs(line[openAt - 1]) && !isPunct(line[openAt - 1]) &&
      !isWs(line[closeAt + delim.length]) && !isPunct(line[closeAt + delim.length])
    if (fo.left && fc.right && !intraword) continue
    stats.found++
    const tag = delim.length >= 2 ? 'strong' : 'em'
    edits.push([openAt, closeAt + delim.length, '<' + tag + '>' + inner + '</' + tag + '>'])
  }
  if (!edits.length) return line
  let out = line
  for (const [s, e, rep] of edits.reverse()) out = out.slice(0, s) + rep + out.slice(e)
  return out
}

const stats = { files: 0, changed: 0, found: 0 }
const samples = []

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { walk(p); continue }
    if (!ent.name.endsWith('.md')) continue
    stats.files++
    const src = fs.readFileSync(p, 'utf8')
    const lines = src.split('\n')
    let inFence = false
    let inFrontmatter = false
    let changedHere = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (i === 0 && line.trim() === '---') { inFrontmatter = true; continue }
      if (inFrontmatter) { if (line.trim() === '---') inFrontmatter = false; continue }
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
      if (inFence) continue
      const out = fixLine(line, stats)
      if (out !== line) {
        if (samples.length < 40) samples.push({ f: path.relative(ROOT, p), before: line.trim(), after: out.trim() })
        lines[i] = out
        changedHere++
      }
    }
    if (changedHere) {
      stats.changed++
      if (!DRY) fs.writeFileSync(p, lines.join('\n'), 'utf8')
    }
  }
}
walk(ROOT)

console.log(`扫描 ${stats.files} 篇；改写 ${stats.changed} 篇；共修复 ${stats.found} 处强调`)
for (const s of samples) {
  console.log('  ·', s.f)
  console.log('      前:', s.before)
  console.log('      后:', s.after)
}
