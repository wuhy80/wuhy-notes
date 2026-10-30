#!/usr/bin/env node
/**
 * inject-mobile-nav.cjs —— 所有页面注入移动端抽屉脚本
 *
 * 移动端布局问题（<1200px 左栏整块堆在正文上方）是站点级的，不限于精读页，
 * 所以这里不做页面筛选，每页 <head> 末尾注入一次：
 *   <script defer src="/static/mobile-nav.js"></script>
 *
 * 幂等；--dry 只统计。用法：node scripts/inject-mobile-nav.cjs <public> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const DRY = process.argv.includes('--dry')
const TAG = '<script defer src="/static/mobile-nav.js"></script>'

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function main() {
  if (!fs.existsSync(PUB)) throw new Error('目录不存在：' + PUB)
  const files = walk(PUB, [])
  let hit = 0
  let skipped = 0
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8')
    if (html.includes('mobile-nav.js')) { skipped++; continue }
    const idx = html.lastIndexOf('</head>')
    if (idx < 0) continue
    hit++
    if (DRY) continue
    fs.writeFileSync(file, html.slice(0, idx) + TAG + html.slice(idx), 'utf8')
  }
  console.log(`inject-mobile-nav: ${hit} 页已注入，${skipped} 页已存在，共扫描 ${files.length} 个 HTML`)
}

main()
