#!/usr/bin/env node
/**
 * inject-reader.cjs —— 给「外刊精读」页注入阅读器脚本
 *
 * 只认一种页面：正文里存在表头为「原文 | 译文」的两列表格（由笔记里的对照表生成）。
 * 这类页面在浏览器里跑 scripts/site-assets/bilingual-reader.js：
 * 表格 → 段落对、行内词卡、右侧生词栏、朗读、对照/字号切换。
 *
 * 注入内容（<head> 末尾）：
 *   · 一段 boot 脚本：先给 <html> 加 bil-pending，CSS 里让对照表先隐形，
 *     避免「表格闪一下再变段落」；1.5s 兜底移除（脚本没跑起来也能看原文）。
 *   · <script defer src="/bilingual-reader.js">
 *
 * 幂等：已包含 bilingual-reader.js 的页面跳过；--dry 只统计不写。
 *
 * 用法：node scripts/inject-reader.cjs <public 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const DRY = process.argv.includes('--dry')

const BOOT = '<script>(function(){var h=document.documentElement;h.classList.add("bil-pending");'
  + 'setTimeout(function(){h.classList.remove("bil-pending")},1500)})();</script>'
const TAG = '<script defer src="/bilingual-reader.js"></script>'

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function isBilingual(html) {
  return /<th[^>]*>\s*原文\s*<\/th>/i.test(html) && /<th[^>]*>\s*译文\s*<\/th>/i.test(html)
}

function main() {
  if (!fs.existsSync(PUB)) throw new Error('目录不存在：' + PUB)
  const files = walk(PUB, [])
  let hit = 0
  let skipped = 0
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8')
    if (!isBilingual(html)) continue
    if (html.includes('bilingual-reader.js')) { skipped++; continue }
    hit++
    if (DRY) continue
    const idx = html.lastIndexOf('</head>')
    if (idx < 0) continue
    const next = html.slice(0, idx) + BOOT + TAG + html.slice(idx)
    fs.writeFileSync(file, next, 'utf8')
  }
  console.log(`inject-reader: 双语页 ${hit} 个已注入，${skipped} 个已存在，扫描 ${files.length} 个 HTML`)
}

main()
