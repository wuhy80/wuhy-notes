#!/usr/bin/env node
// check-bilingual.mjs —— 双语精读笔记格式校验器
//
// 校验对象：英语学习/ 下所有含「原文|译文」对照表的笔记（外刊精读、及时雨等）。
// 硬错误（退出码 1，发布管线中止）：
//   E1 对照表表头漂移：首列表头是「原文」但第二列不是「译文」
//   E2 对照表存在空单元格（原文或译文缺一边）
//   E3 词汇注释 callout 的条目缺少 **单词** 加粗格式
// 警告（不中止，提示人工处理）：
//   W1 词条缺 IPA 音标
//   W2 整篇没有「总词汇表」（词汇|音标|释义|文中语境 四列表）
// 用法：node scripts/check-bilingual.mjs [英语学习目录]（缺省= <vault>/英语学习）
'use strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = process.argv[2] || path.join(ROOT, '英语学习')
if (!fs.existsSync(path.join(DIR, '.'))) {
  console.error(`目录不存在: ${DIR}`)
  process.exit(1)
}

const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.toLowerCase().endsWith('.md')) files.push(p)
  }
})(DIR)

let hardErrors = 0
let notesWithPairs = 0
const warnLines = []
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/')
  let raw = fs.readFileSync(f, 'utf8')
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const body = fm ? raw.slice(fm[0].length) : raw
  const lines = body.split(/\r?\n/)

  // 找出所有表格块与其表头
  const tables = [] // {line, header:[], rows:[{line, cells:[]}]}
  let i = 0
  while (i < lines.length) {
    if (/^\s*\|.*\|\s*$/.test(lines[i]) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const header = lines[i].split('|').slice(1, -1).map((s) => s.trim())
      const start = i
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push({ line: i + 1, cells: lines[i].split('|').slice(1, -1).map((s) => s.trim()) })
        i++
      }
      tables.push({ line: start + 1, header, rows })
      continue
    }
    i++
  }

  const pairTables = tables.filter((t) => t.header.length >= 2 && t.header[0] === '原文')
  const glossaries = tables.filter((t) => t.header.join('|') === '词汇|音标|释义|文中语境')
  if (!pairTables.length) continue
  notesWithPairs++

  const errs = []
  const warns = []

  for (const t of pairTables) {
    if (t.header[1] !== '译文') errs.push(`L${t.line}: E1 对照表表头漂移（第二列是「${t.header[1]}」，应为「译文」）`)
    for (const r of t.rows) {
      const empty = r.cells.filter((c) => !c)
      if (r.cells.length < 2 || empty.length) errs.push(`L${r.line}: E2 对照表存在空单元格（原文/译文必须成对）`)
    }
  }

  let glossEntries = 0
  let noIpa = 0
  const noIpaSample = []
  // 词汇注释 callout：[!note]- 词汇注释 …，其列表行有三种合法形态：
  //   ① - **word** /IPA/ —— 释义。要点。   （词条，IPA 缺失计 W1）
  //   ② - *phrase* —— 说明。               （短语条目，无 IPA 要求）
  //   ③ - 纯文本说明行（如「本节不引入新重点词…」）
  // 只漏写加粗的词条（英文词 + /IPA/ + —— 开头但没有 **）算 E3。
  let inVocabCallout = false
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]
    if (/^>\s*\[!note\]-?\s*词汇注释/.test(line)) { inVocabCallout = true; continue }
    if (/^>/.test(line)) {
      if (!inVocabCallout) continue
      const li = line.match(/^>\s*-\s+(.*)$/)
      if (!li) continue // callout 的非列表行（标题、空行）
      const inner = li[1].trim()
      if (!inner) continue
      const strong = inner.match(/^\*\*(.+?)\*\*/)
      if (strong) {
        glossEntries++
        if (!/\s/.test(strong[1]) && !/\/[^/]+\//.test(inner)) {
          // 只对单个单词要求 IPA；词组/搭配短语不要求
          noIpa++
          if (noIpaSample.length < 3) noIpaSample.push(strong[1])
        }
        continue
      }
      if (/^\*[^*]+\*/.test(inner)) { glossEntries++; continue } // 短语条目
      if (/[A-Za-z][A-Za-z'’-]*\s+\/[^/]+\/\s*——/.test(inner)) {
        errs.push(`L${n + 1}: E3 词汇注释词条缺少 **单词** 加粗格式：${inner.slice(0, 40)}`)
        continue
      }
      continue // 纯中文说明行
    }
    inVocabCallout = false // callout 结束（脱离引用符）
  }
  if (noIpa) warns.push(`W1 ${noIpa} 个词条缺 IPA 音标（如：${noIpaSample.join('、')}）`)
  if (!glossaries.length) warns.push('W2 全篇没有「总词汇表」（词汇|音标|释义|文中语境 四列表）')
  for (const w of warns) warnLines.push(`${rel}: ${w}`)

  if (errs.length) {
    hardErrors += errs.length
    console.log(`✗ ${rel}`)
    errs.forEach((e) => console.log(`    ${e}`))
  } else {
    console.log(`✓ ${rel}（对照表 ${pairTables.length} 张 / 词条 ${glossEntries} 个）`)
  }
}

if (warnLines.length) {
  console.log(`\n== 警告（不中止）==`)
  warnLines.forEach((w) => console.log('  ⚠ ' + w))
}
console.log(`\n检查 ${files.length} 篇（其中 ${notesWithPairs} 篇含对照表），硬错误 ${hardErrors} 处`)
process.exit(hardErrors ? 1 : 0)
