#!/usr/bin/env node
/**
 * inject-dataview.cjs —— 给站点页面注入 dataview-lite 渲染器脚本
 *
 *库里残留的 ```dataview / ```dataviewjs / ```tagcloud 代码块在 Quartz 产物里是
 * <code class="language-dataview…">，本脚本把 /static/dataview-lite.js 注入
 * <head>，浏览器端现场渲染（元数据 /static/vault-meta.json 由
 * build-vault-meta.mjs 在构建期生成，按需懒加载）。
 *
 * 注入所有页面而非仅含块的页面：Quartz 是 SPA，用户可能从无块页面导航到
 * 索引页，头脚本必须在首次加载就位（与 inject-mobile-nav 同理）。
 * 脚本体很小（<20KB），无块页面只多一次解析，不发元数据请求。
 *
 * 幂等：已包含 dataview-lite.js 的页面跳过；--dry 只统计不写。
 *
 * 用法：node scripts/inject-dataview.cjs <public 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const DRY = process.argv.includes('--dry')

const TAG = '<script defer src="/static/dataview-lite.js"></script>'
// Quartz 的 rehype-pretty-code 输出 data-language 属性；language-* class 只在
// 命中高亮语言时才有，两种形态都认
const HAS_BLOCK = /data-language="(?:dataview(?:js)?|tagcloud)"|language-(?:dataview|tagcloud)[\s"']/

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
    if (html.includes('dataview-lite.js')) { skipped++; continue }
    // 脚本标签注入所有页面（SPA 导航安全）；含查询块的页面才计入统计
    if (!DRY) {
      const idx = html.lastIndexOf('</head>')
      if (idx < 0) continue
      fs.writeFileSync(file, html.slice(0, idx) + TAG + html.slice(idx), 'utf8')
    }
    if (HAS_BLOCK.test(html)) hit++
  }
  console.log(`inject-dataview: ${files.length} 个 HTML 已注入渲染器（其中含 Dataview 块的 ${hit} 个会现场渲染），${skipped} 个已存在`)
}

main()
