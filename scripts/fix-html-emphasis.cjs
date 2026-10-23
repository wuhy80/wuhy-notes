#!/usr/bin/env node
/**
 * fix-html-emphasis.cjs — 兜底修复：把构建产物里残留的字面 **X** 改成 <strong>X</strong>
 *
 * 为什么要在 HTML 层面再修一次：
 *   导出层的 fix-cjk-emphasis.cjs 只按「分隔符 flanking」判定，能覆盖绝大多数中文标点
 *   贴 ** 的情况；但 CommonMark 的强调还受「分隔符栈 / rule of three」影响——
 *   例如一行里多个 ** 相邻、或外层 *斜体* 里嵌 **加粗** 且中间夹着 $公式$ 时，
 *   单看一对分隔符是"合格"的，实际渲染仍然吐字面星号（micromark 实测复现过）。
 *   与其在提交前模拟整个解析器，不如在构建产物上收口：
 *   产物里还能看到的字面 ** 就是坏的，直接换掉，100% 准。
 *
 * 只动文本节点：跳过标签内部（属性）、<pre>/<code>/<script>/<style>。
 *
 * 用法：node scripts/fix-html-emphasis.cjs <publicDir> [--dry]
 */
const fs = require('fs')
const path = require('path')

const PUB = process.argv[2]
const DRY = process.argv.includes('--dry')
if (!PUB || !fs.existsSync(PUB)) {
  console.error('用法: node fix-html-emphasis.cjs <publicDir> [--dry]')
  process.exit(2)
}

const SKIP_TAGS = new Set(['pre', 'code', 'script', 'style', 'textarea', 'samp', 'kbd'])
// 内部不许出现 < >（免得跨标签），不许出现 *（避免和相邻强调纠缠），两端非空白
const SPAN = /\*\*([^\s<>*][^<>*]{0,200}?)\*\*/g
// 单星号斜体：同样要求两端非空白、内部无 * / < >，并加两条防误伤约束——
//   ① 开头的 * 前面不能是 ASCII 字母数字或 *：挡住 `A*搜索`、`2*3*4`、`a*b*c`
//   ② 结尾的 * 后面不能是 *（相邻强调交给上一轮）
// 注：`SELECT * FROM`、`@ 和 * 的区别` 因为 * 后面紧跟空格，天然不会被匹配。
// 上限放宽到 300：教程里有些图注（含 emoji、整句描述）超过 80 字。
const EM = /(?<![A-Za-z0-9*])\*([^\s*<>][^*<>]{0,300}?)\*(?!\*)/g

function fixText(text, stats) {
  // 多趟替换：相邻的强调（`**微信****WeLM**`，中间只隔一个 ****）第一趟只能配对前一半，
  // 替换后剩下的那一对还能再配上。最多三趟，避免任何意外循环。
  let cur = text
  for (let pass = 0; pass < 3; pass++) {
    const next = cur
      .replace(SPAN, (all, inner) => {
        stats.spans++
        return '<strong>' + inner + '</strong>'
      })
      .replace(EM, (all, inner) => {
        // 已经被上面换成 <strong> 的内容不会再进来（里面没有 *）
        stats.ems++
        return '<em>' + inner + '</em>'
      })
    if (next === cur) break
    cur = next
  }
  return cur
}

/**
 * 相邻强调的特殊形态：`**微信****WeLM**`（两条加粗紧挨着）。
 * CommonMark 的「rule of three」会拒绝把中间那串 **** 拆开，于是渲染成
 * <strong>微信****WeLM</strong> —— 四个星号原样留在页面上。
 * 这是作者意图明确的两条加粗，直接在 HTML 层按意图拆开。
 */
const ADJACENT = /<(strong|em)>([^<]*?)\*\*\*\*([^<]*?)<\/\1>/g

function fixAdjacent(html, stats) {
  return html.replace(ADJACENT, (all, tag, before, after) => {
    stats.adjacent++
    return `<${tag}>${before}</${tag}><${tag}>${after}</${tag}>`
  })
}

/**
 * 跨节点的强调：`**第一步 · 打分 $QK^T$。**` 这类「加粗里嵌行内公式」的写法，
 * 渲染后 HTML 是 `**…<span class="katex">…</span>…**`，一对 `**` 被标签隔开，
 * 上面按文本节点处理的逻辑配不上，页面上就留下字面星号。
 * 这里只处理「同一个块里、含 katex 且 `**` 个数为偶数」的情况：把第 1、3、5… 个
 * 换成 <strong>，第 2、4、6… 个换成 </strong>。范围刻意收窄，避免误伤普通文本里的星号。
 */
const BLOCK_RE = /<(p|li|td|figcaption)\b[^>]*>[\s\S]*?<\/\1>/g

function fixCrossNodeEmphasis(html, stats) {
  return html.replace(BLOCK_RE, (block) => {
    if (!/class="katex"/.test(block)) return block
    const parts = block.split(/(<[^>]*>)/)
    const positions = []
    let skip = 0
    let offset = 0
    for (const seg of parts) {
      if (seg.startsWith('<')) {
        const m = /^<\s*(\/?)\s*([a-zA-Z][\w-]*)/.exec(seg)
        if (m) {
          const name = m[2].toLowerCase()
          if (SKIP_TAGS.has(name)) {
            if (m[1] === '/') skip = Math.max(0, skip - 1)
            else if (!/\/>$/.test(seg)) skip++
          }
        }
        offset += seg.length
        continue
      }
      if (!skip) {
        let i = -1
        while ((i = seg.indexOf('**', i + 1)) !== -1) positions.push(offset + i)
      }
      offset += seg.length
    }
    if (positions.length < 2 || positions.length % 2 !== 0) return block
    let out = block
    for (let k = positions.length - 1; k >= 0; k--) {
      out = out.slice(0, positions[k]) + (k % 2 ? '</strong>' : '<strong>') + out.slice(positions[k] + 2)
    }
    stats.crossNode += positions.length / 2
    return out
  })
}

function fixHtml(html, stats) {
  const parts = html.split(/(<[^>]*>)/)
  let skipDepth = 0
  let out = ''
  for (const seg of parts) {
    if (seg.startsWith('<')) {
      const m = /^<\s*(\/?)\s*([a-zA-Z][\w-]*)/.exec(seg)
      if (m) {
        const closing = m[1] === '/'
        const name = m[2].toLowerCase()
        if (SKIP_TAGS.has(name)) {
          if (closing) skipDepth = Math.max(0, skipDepth - 1)
          else if (!/\/>$/.test(seg)) skipDepth++ // 自闭合标签不入栈
        }
      }
      out += seg
      continue
    }
    out += skipDepth > 0 ? seg : fixText(seg, stats)
  }
  // 最后再处理「相邻加粗」这种跨标签的形态（必须在标签切分之后整体做）
  return fixCrossNodeEmphasis(fixAdjacent(out, stats), stats)
}

const stats = { files: 0, changed: 0, spans: 0, ems: 0, adjacent: 0, crossNode: 0 }
const samples = []

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) { walk(p); continue }
    if (!ent.name.endsWith('.html')) continue
    stats.files++
    const before = stats.spans
    const src = fs.readFileSync(p, 'utf8')
    const out = fixHtml(src, stats)
    if (out !== src) {
      stats.changed++
      if (samples.length < 5) {
        const i = src.indexOf('**')
        samples.push([path.relative(PUB, p), src.slice(Math.max(0, i - 60), i + 100).replace(/\s+/g, ' ')])
      }
      if (!DRY) fs.writeFileSync(p, out, 'utf8')
    }
    void before
  }
}
walk(PUB)

console.log(`扫描 HTML ${stats.files} 个；改写 ${stats.changed} 个；替换字面强调 ${stats.spans} 处 + 斜体 ${stats.ems} 处 + 相邻加粗 ${stats.adjacent} 处 + 跨节点加粗 ${stats.crossNode} 处`)
for (const [f, s] of samples) console.log('  ·', f, '::', s)
