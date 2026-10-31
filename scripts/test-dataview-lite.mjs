// Node 单测：用真实元数据执行库内全部 ```dataview 查询块，验证 mini-DQL 引擎
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// 最小 document stub，让 IIFE 顺利加载
global.document = { addEventListener() {}, querySelectorAll() { return [] } }
require('D:/code/obsidian-vault/scripts/site-assets/dataview-lite.cjs')
const dvl = globalThis.__dataviewLite
const meta = JSON.parse(fs.readFileSync(process.argv[2] || 'C:/Users/Administrator/AppData/Local/Temp/vault-meta.json', 'utf8'))

const pages = meta.pages.map((r) => {
  const page = {}
  for (const k in r.fm) page[k] = r.fm[k]
  page.file = {
    path: r.p, folder: r.fo, name: r.na,
    link: { __link: r.p, name: r.na },
    mtime: new dvl.DT(Date.parse(r.mt)),
    etags: r.et || [],
    tags: (r.tg || []).concat(r.et || []),
  }
  return page
})
dvl.setPages(pages)
console.log(`元数据 ${pages.length} 页`)

// 抽取全部 dataview 块（含 callout 内 > 前缀）
const ROOT = 'D:/code/obsidian-vault'
const blocks = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || ['_site', 'node_modules', 'browser-screenshots', 'cloudflare', 'template'].includes(e.name)) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) {
      const relDir = path.relative(ROOT, p).split(path.sep).join('/')
      // 与渲染器豁免一致：dataview 教学笔记的查询块不是要渲染的对象
      if (relDir.toLowerCase().startsWith('技术笔记/编辑器/obsidian/')) continue
      walk(p)
    } else if (e.name.toLowerCase().endsWith('.md')) {
      const raw = fs.readFileSync(p, 'utf8')
      const lines = raw.split(/\r?\n/)
      let fence = false, cur = null
      for (let i = 0; i < lines.length; i++) {
        const lm = lines[i].match(/^\s*>?\s*```(\S*)/)
        if (lm) {
          if (!fence) { fence = true; cur = { lang: lm[1].toLowerCase(), start: i + 1, buf: [] } }
          else { fence = false; if (/^dataview$/.test(cur.lang)) blocks.push({ file: path.relative(ROOT, p).split(path.sep).join('/'), line: cur.start, code: cur.buf.join('\n') }); cur = null }
          continue
        }
        if (fence && cur) cur.buf.push(lines[i].replace(/^\s*>\s?/, ''))
      }
    }
  }
})(ROOT)

console.log(`抽到 ${blocks.length} 个 dataview 查询块\n`)
let fail = 0
for (const b of blocks) {
  try {
    const q = dvl.parseQuery(b.code)
    const rows = dvl.runQuery(q)
    const sample = rows.slice(0, 2).map((r) => JSON.stringify(q.cols ? q.cols.map((c) => c.alias || c.raw) : []).slice(0, 0).concat('')).join('')
    console.log(`✓ ${b.file}:${b.line} [${q.kind}] ${rows.length} 行  cols=[${(q.cols || []).map((c) => c.alias || c.raw).join(' | ')}]  first=${rows[0] ? firstCell(q, rows[0]) : '∅'}`)
  } catch (e) {
    fail++
    console.log(`✗ ${b.file}:${b.line}\n    ${String(e.message || e)}\n    ${b.code.split('\n')[0]}`)
  }
}
function firstCell(q, item) {
  if (q.kind === 'list') return item.file.path
  if (q.kind === 'task') return item.file.path
  return q.cols.map((c) => {
    try { const v = dvl.evalAst(c.e, item); return v && v.valueOf && !(v instanceof dvl.DT) ? v : String(v).slice(0, 30) } catch (e) { return 'ERR:' + e.message }
  }).join(' | ')
}
console.log(fail ? `\n${fail} 个块执行失败` : `\n全部 ${blocks.length} 个块执行成功`)
process.exit(fail ? 1 : 0)
