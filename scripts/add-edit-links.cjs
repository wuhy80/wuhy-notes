#!/usr/bin/env node
/**
 * add-edit-links.cjs —— 往每篇文章的页脚空槽注入「✎ 编辑此页」链接
 *
 * 为什么放在这一层：与 enhance-content.cjs 同理，Quartz 没有可用的页脚插槽
 * （div.page-footer 默认渲染为空 div），改 layout 要维护 fork；在产物上注入零维护。
 *
 * 做法：
 *   · 从每页 <body data-slug="..."> 取 slug（Quartz 的 slug = 内容相对路径去 .md），
 *     拼出 GitHub 编辑地址 github.com/wuhy80/wuhy-notes/edit/main/<slug>.md。
 *     在线编辑保存的 commit 落到 main 会触发 publish-site.yml，站点一两分钟后自动更新。
 *   · 只在 vault 原件存在时注入：导出流程生成的 index / 最近更新 等页面在仓库里
 *     没有对应源文件，编辑链接会指向「新建文件」，所以跳过。
 *   · 注入位置是 <div class="page-footer">（main 内部，SPA 导航必刷新），
 *     替换为包着链接的同名 div；链接样式在 site-custom.scss 的 .edit-page-link。
 *
 * 幂等：已含 .edit-page-link 的页面直接跳过，可安全重复执行。
 *
 * 用法：node scripts/add-edit-links.cjs <public 目录> <vault 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const VAULT = process.argv[3] || '.'
const DRY = process.argv.includes('--dry')

const EDIT_BASE = 'https://github.com/wuhy80/wuhy-notes/edit/main/'
const SLOT = '<div class="page-footer"></div>'

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

/** 每个路径段单独编码：encodeURI 会放行 ? 和 #，文件名里出现时 GitHub 路径会断 */
function editUrl(slug) {
  return EDIT_BASE + (slug + '.md').split('/').map(encodeURIComponent).join('/')
}

// Quartz 的 slug 会把 ASCII 字母转成小写（机器学习-谦行AIing → 谦行aiing），而 GitHub
// 路径大小写敏感，直接拿 slug 拼编辑地址会 404。发布机是 Windows（文件系统大小写
// 不敏感），existsSync 也拦不住这种偏差，所以对 vault 建一张「全小写相对路径 →
// 真实路径」索引，编辑链接一律用 vault 里的真实大小写。
const vaultFiles = new Map()
function indexVault(dir, rel = '') {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const relName = rel ? rel + '/' + name : name
    if (fs.statSync(p).isDirectory()) indexVault(p, relName)
    else if (name.endsWith('.md')) vaultFiles.set(relName.toLowerCase(), relName)
  }
}
indexVault(path.resolve(VAULT))

/** slug → vault 真实相对路径（.md 结尾，/ 分隔）；找不到返回 null */
function resolveRealPath(slug) {
  const hit = vaultFiles.get(slug.toLowerCase() + '.md')
  if (hit) return hit
  if (vaultFiles.has(slug + '.md')) return slug + '.md'
  return null
}

const files = walk(PUB, [])
let injected = 0
let noSource = 0
let noSlot = 0
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  if (html.includes('edit-page-link')) continue
  const sm = html.match(/<body data-slug="([^"]*)"/)
  if (!sm) { noSlot++; continue }
  const realPath = resolveRealPath(sm[1])
  if (!realPath) { noSource++; continue }
  const realSlug = realPath.replace(/\.md$/i, '')
  if (!html.includes(SLOT)) { noSlot++; continue }
  const link = SLOT.replace('></div>',
    `><a class="edit-page-link" href="${editUrl(realSlug)}" target="_blank" rel="noopener"` +
    ' title="在 GitHub 上编辑这一页：保存提交后站点会自动重新发布">✎ 编辑此页</a></div>')
  if (!DRY) fs.writeFileSync(file, html.replace(SLOT, link), 'utf8')
  injected++
}

console.log(`edit-link: 注入 ${injected}/${files.length} 页` +
  (noSource ? `，跳过 ${noSource} 页（仓库无对应源文件）` : '') +
  (noSlot ? `，跳过 ${noSlot} 页（无 slug 或槽位）` : '') +
  (DRY ? '（--dry 未写盘）' : ''))
