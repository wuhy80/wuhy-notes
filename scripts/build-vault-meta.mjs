#!/usr/bin/env node
// build-vault-meta.mjs —— 导出全库元数据 JSON，供站点端 dataview-lite.js 渲染
// Dataview/dataviewjs 代码块用（Quartz 上无 Obsidian 宿主，改为浏览器端现场查询）。
//
// 用法：node scripts/build-vault-meta.mjs <content 目录> <输出 JSON 路径>
//   content 目录 = 发布用的公开子集（export-public.ps1 的产物），
//   路径口径与站点 URL 一致；找不到直接报错，不猜目录。
//
// 产物字段（尽量短名省体积）：
//   pages[]: p 路径(无 .md) / fo 文件夹 / na 文件名 / fm 完整 frontmatter /
//            mt 修改时间 ISO / tg frontmatter 标签 / et 行内标签 / tk 未完成任务
'use strict'
import fs from 'fs'
import path from 'path'

const [, , CONTENT_DIR, OUT_PATH] = process.argv
if (!CONTENT_DIR || !OUT_PATH) {
  console.error('用法: node build-vault-meta.mjs <content 目录> <输出 JSON>')
  process.exit(1)
}
if (!fs.existsSync(path.join(CONTENT_DIR, '.'))) {
  console.error(`content 目录不存在: ${CONTENT_DIR}`)
  process.exit(1)
}

// —— frontmatter 轻量解析：标量 / 列表 / 一层嵌套 map / 注释行（与 render-model-compare 同款）——
function scalar(s) {
  s = s.trim().replace(/^["']|["']$/g, '')
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  return s
}
function parseFM(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { fm: null, body: raw }
  const fm = {}
  let mode = 'root'
  let curKey = null
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue
    if (!line.startsWith(' ') && !line.startsWith('-')) {
      const kv = line.match(/^([^#:\s][^:]*):\s*(.*)$/)
      if (kv) {
        const k = kv[1].trim()
        const v = kv[2].trim()
        if (v === '') { mode = 'pending'; curKey = k; fm[k] = null; continue }
        fm[k] = scalar(v)
        mode = 'root'
        curKey = null
        continue
      }
    }
    if (mode === 'pending' && curKey) {
      const li = line.match(/^\s+-\s?(.*)$/)
      const kv = line.match(/^\s+([^#:\s][^:]*):\s*(.*)$/)
      if (li) { fm[curKey] = []; mode = 'list'; fm[curKey].push(scalar(li[1])); continue }
      if (kv) { fm[curKey] = {}; mode = 'map'; fm[curKey][kv[1].trim()] = scalar(kv[2]); continue }
    }
    if (mode === 'list' && curKey) {
      const li = line.match(/^\s+-\s?(.*)$/)
      if (li) { fm[curKey].push(scalar(li[1])); continue }
    }
    if (mode === 'map' && curKey) {
      const kv = line.match(/^\s+([^#:\s][^:]*):\s*(.*)$/)
      if (kv) { fm[curKey][kv[1].trim()] = scalar(kv[2]); continue }
    }
  }
  return { fm, body: raw.slice(m[0].length) }
}

// 行内标签：跳过围栏代码与行内代码；行首 # 是标题不是标签
function extractEtags(body) {
  const lines = body.split(/\r?\n/)
  let fence = false
  const tags = new Set()
  for (const ln of lines) {
    if (/^\s*(```|~~~)/.test(ln)) { fence = !fence; continue }
    if (fence) continue
    const cleaned = ln.replace(/`[^`]*`/g, ' ')
    const re = /(^|[\s(（【])#([\p{L}\p{N}][\p{L}\p{N}/_-]*)/gu
    let m
    while ((m = re.exec(cleaned))) {
      if (m[2]) tags.add('#' + m[2])
    }
  }
  return [...tags]
}

function extractOpenTasks(body) {
  const tasks = []
  const lines = body.split(/\r?\n/)
  let fence = false
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (/^\s*(```|~~~)/.test(ln)) { fence = !fence; continue }
    if (fence) continue
    const m = ln.match(/^\s*[-*]\s+\[ \]\s+(.*)$/)
    if (m) tasks.push({ t: m[1].trim().replace(/\s+\^[a-zA-Z0-9-]+$/, ''), l: i + 1 })
  }
  return tasks
}

function normalizeTagList(v) {
  if (!v) return []
  const arr = Array.isArray(v) ? v : String(v).split(/[,，]/)
  return arr.map((t) => String(t).trim().replace(/^#/, '')).filter(Boolean)
}

const pages = []
;(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) { walk(full); continue }
    if (!e.name.toLowerCase().endsWith('.md')) continue
    const rel = path.relative(CONTENT_DIR, full).split(path.sep).join('/')
    const dirName = path.dirname(rel).split(path.sep).join('/')
    let raw = fs.readFileSync(full, 'utf8')
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
    const { fm, body } = parseFM(raw)
    const etags = extractEtags(body)
    const tg = fm ? normalizeTagList(fm.tags) : []
    pages.push({
      p: rel.replace(/\.md$/i, ''),
      fo: dirName === '.' ? '' : dirName,
      na: path.basename(rel).replace(/\.md$/i, ''),
      fm: fm || {},
      mt: fs.statSync(full).mtime.toISOString(),
      tg,
      et: etags,
      tk: extractOpenTasks(body),
    })
  }
})(CONTENT_DIR)

pages.sort((a, b) => (a.p < b.p ? -1 : 1))
const json = JSON.stringify({ generated: new Date().toISOString(), pages })
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, json)
console.log(
  `build-vault-meta: ${pages.length} 篇笔记 → ${OUT_PATH}（${(json.length / 1024).toFixed(0)} KB，含行内标签 ${pages.reduce((n, p) => n + p.et.length, 0)} 个、未完成任务 ${pages.reduce((n, p) => n + p.tk.length, 0)} 条）`
)
