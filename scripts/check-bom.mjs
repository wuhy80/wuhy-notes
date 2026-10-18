#!/usr/bin/env node
/**
 * check-bom.mjs — 校验仓库里的 PowerShell 脚本是否带 UTF-8 BOM
 *
 * 为什么必须带：Windows PowerShell 5.1 读取 .ps1 时，若文件没有 BOM，会按系统
 * ANSI 代码页（本机为 GBK）解码。仓库里的脚本含大量中文注释/字符串，一旦按 GBK
 * 解码就变成乱码，整个脚本解析失败（实测：`Unexpected token '鍚堣' ...`）。
 * 很多编辑器、补丁工具、甚至 agent 的写文件动作都会顺手把 BOM 吞掉，所以需要自动检查。
 *
 * 用法：node scripts/check-bom.mjs     # 有缺失则以退出码 1 结束，并打印文件名
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '..')
const BOM = Buffer.from([0xef, 0xbb, 0xbf])

const bad = []
let checked = 0

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { walk(p); continue }
    if (!/\.(ps1|psm1)$/i.test(ent.name)) continue
    checked++
    const head = Buffer.alloc(3)
    const fd = fs.openSync(p, 'r')
    fs.readSync(fd, head, 0, 3, 0)
    fs.closeSync(fd)
    if (!head.equals(BOM)) bad.push(path.relative(ROOT, p))
  }
}
walk(SCRIPT_DIR)

if (bad.length) {
  console.error(`[check-bom] ${bad.length}/${checked} 个 PowerShell 脚本缺少 UTF-8 BOM（PS 5.1 会按 GBK 解码导致解析失败）：`)
  for (const f of bad) console.error('  - ' + f)
  console.error('[check-bom] 修法：把文件重写为 UTF-8 with BOM（首字节 EF BB BF），内容不变。')
  process.exit(1)
}
console.log(`[check-bom] OK：${checked} 个 PowerShell 脚本均带 UTF-8 BOM`)
