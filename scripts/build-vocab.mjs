#!/usr/bin/env node
// build-vocab.mjs —— 聚合全库双语精读的词汇注释，生成站点端生词本数据
//
// 扫描导出内容（与站点同口径）里所有「词汇注释」callout 与「总词汇表」，
// 输出 /static/vocab.json，由 dataview-lite.js 的 vocab-notebook 块渲染成
// 「我的生词本」页面（浏览/发音/已掌握标记/导出 CSV 与 Anki）。
//
// 用法：node scripts/build-vocab.mjs <content 目录> <输出 JSON 路径>
'use strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const [, , CONTENT_DIR, OUT_PATH] = process.argv
if (!CONTENT_DIR || !OUT_PATH) {
  console.error('用法: node build-vocab.mjs <content 目录> <输出 JSON>')
  process.exit(1)
}
if (!fs.existsSync(path.join(CONTENT_DIR, '.'))) {
  console.error(`content 目录不存在: ${CONTENT_DIR}`)
  process.exit(1)
}

// —— 词频表：Google Trillion Word Corpus 前 1 万词（github.com/first20hours/
//    google-10000-english，MIT License；经 fastly.jsdelivr 镜像取得）——
// 用于生词频段分级（band）与阅读器的「难词提示」。表随仓库入库，构建期不联网。
const FREQ_FILE = fileURLToPath(new URL('./data/english-top10k.txt', import.meta.url))
const freqRank = new Map()
if (fs.existsSync(FREQ_FILE)) {
  fs.readFileSync(FREQ_FILE, 'utf8').split(/\r?\n/).forEach((w, i) => {
    const k = w.trim().toLowerCase()
    if (k && !freqRank.has(k)) freqRank.set(k, i + 1)
  })
}
function bandOf(word) {
  if (/\s/.test(word)) return 0 // 短语/搭配不参与频段
  let w = word.toLowerCase()
  if (freqRank.has(w)) return rankBand(freqRank.get(w))
  // 粗略还原词形：-s / -es / -ed / -ing / -d / -ly
  for (const suf of ['s', 'es', 'ed', 'd', 'ing']) {
    if (w.endsWith(suf) && w.length > suf.length + 2) {
      const base = w.slice(0, -suf.length)
      if (freqRank.has(base)) return rankBand(freqRank.get(base))
      if (suf === 'ing' && freqRank.has(base + 'e')) return rankBand(freqRank.get(base + 'e'))
      if (suf === 'ed' && freqRank.has(base + 'e')) return rankBand(freqRank.get(base + 'e'))
    }
  }
  return 5 // 表外低频词
}
function rankBand(rank) {
  if (rank <= 1000) return 1
  if (rank <= 3000) return 2
  if (rank <= 6000) return 3
  if (rank <= 10000) return 4
  return 5
}

function stripMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

const pages = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const full = path.join(d, e.name)
    if (e.isDirectory()) { walk(full); continue }
    if (!e.name.toLowerCase().endsWith('.md')) continue
    const rel = path.relative(CONTENT_DIR, full).split(path.sep).join('/')
    let raw = fs.readFileSync(full, 'utf8')
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const titleM = fm ? fm[1].match(/^title:\s*(.+)$/m) : null
    const body = fm ? raw.slice(fm[0].length) : raw
    const lines = body.split(/\r?\n/)

    const entries = [] // {w, ipa, def}
    const seen = new Map() // 同页去重：小写词 -> 下标
    function add(word, ipa, def) {
      word = stripMd(word || '')
      if (!word || word.length < 2) return
      const k = word.toLowerCase()
      const e = { w: word, band: bandOf(word), ipa: stripMd(ipa || ''), def: stripMd(def || '') }
      if (seen.has(k)) {
        const prev = entries[seen.get(k)]
        if (e.ipa && !prev.ipa) prev.ipa = e.ipa
        if (e.def.length > prev.def.length) prev.def = e.def
        return
      }
      seen.set(k, entries.length)
      entries.push(e)
    }

    let inVocabCallout = false
    let inGlossary = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^>\s*\[!note\]-?\s*词汇注释/.test(line)) { inVocabCallout = true; continue }
      if (/^>/.test(line)) {
        if (!inVocabCallout) continue
        const li = line.match(/^>\s*-\s+(.*)$/)
        if (!li) continue
        const inner = li[1].trim()
        const strong = inner.match(/^\*\*(.+?)\*\*\s*(.*)$/)
        if (strong) {
          // 形态① - **word** /IPA/ —— 释义。要点。  （IPA 必须紧跟加粗词，释义里
          // 的普通斜杠不算——如 closing/opening）
          const rest = strong[2]
          const m = rest.match(/^\s*(\/[^/]+\/)\s*——\s*([\s\S]*)$/)
          const ipa = m ? m[1] : ''
          const def = m ? m[2] : rest.replace(/^\s*——\s*/, '')
          add(strong[1], ipa, def)
        } else if (/^\*[^*]+\*/.test(inner)) {
          // 形态② - *phrase* —— 说明。
          const phrase = inner.match(/^\*([^*]+)\*/)[1]
          const def = inner.replace(/^\*[^*]+\*/, '').split('——').slice(1).join('——').trim()
          add(phrase, '', def || inner.replace(/^\*[^*]+\*/, '').replace(/^——/, '').trim())
        }
        continue
      }
      inVocabCallout = false
      // 总词汇表：| 词汇 | 音标 | 释义 | 文中语境 |
      if (/^\s*\|/.test(line)) {
        const header = line.split('|').slice(1, -1).map((s) => s.trim())
        if (header.join('|') === '词汇|音标|释义|文中语境') {
          inGlossary = true
          continue
        }
      }
      if (inGlossary) {
        if (!/^\s*\|/.test(line)) { inGlossary = false; continue }
        if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue // 分隔行
        const cells = line.split('|').slice(1, -1).map((s) => s.trim())
        if (cells.length >= 3) add(cells[0], cells[1] === '—' ? '' : cells[1], cells[2])
      }
    }
    if (entries.length) {
      pages.push({
        p: rel.replace(/\.md$/i, ''),
        t: (titleM ? titleM[1].trim().replace(/^["']|["']$/g, '') : path.basename(rel).replace(/\.md$/i, '')),
        n: entries.length,
        entries,
      })
    }
  }
})(CONTENT_DIR)

pages.sort((a, b) => (a.p < b.p ? -1 : 1))
const words = new Set()
pages.forEach((p) => p.entries.forEach((e) => words.add(e.w.toLowerCase())))
const json = JSON.stringify({
  generated: new Date().toISOString(),
  pages,
  words: words.size,
  top: [...freqRank.keys()], // 阅读器「难词提示」用的高频表
})
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, json)
console.log(
  `build-vocab: ${pages.length} 篇精读 → ${OUT_PATH}（词条 ${pages.reduce((n, p) => n + p.n, 0)} 个，去重后 ${words.size} 词，${(json.length / 1024).toFixed(0)} KB）`
)
