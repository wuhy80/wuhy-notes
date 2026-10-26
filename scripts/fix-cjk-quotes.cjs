#!/usr/bin/env node
// fix-cjk-quotes.cjs — 全库修正中文语境的引号问题
//
// 病灶（2026-10-26 确诊）：笔记源文件里的引号是直引号 "…"，站点构建管线
// （remark smartypants 类的 smart-quote 转换）按英文启发式判断开/闭方向——
// 英文语境猜得对（"often make mistakes" → “often make mistakes”），
// 中文语境猜错：开引号前面是汉字（词字符），被判定为闭引号，于是
// 从"经常出错" 渲染成 从”经常出错”（首尾都是右引号）。
//
// 修法（内容级，让构建阶段无需猜测；引号方向属于内容语义）：
//   逐行扫描（跳过 frontmatter / fenced code block；行内代码 `…` 与
//   HTML 标签 <…> 内的引号不参与也不改写）：
//   1. 已是弯引号的：每个 “ 与其后最近未被占用的 ” 配对（合法，不动）；
//      剩余未配对的 ”（如历史误用）按两两一组把组内第 1 个改写为 “；
//      落单时整行不动（宁漏修不误改）。
//   2. 直引号 "：按行内出现顺序两两配对（奇数个则整行不动）；
//      仅当「引号内容含 CJK」或「开引号前最近的非空白字符是 CJK/中文标点」
//      时改写为 “…”——纯英文的直引号保持原样（smartypants 处理得很好）。
//
// 用法：node scripts/fix-cjk-quotes.cjs [--dry] [根目录]
//   --dry  只报告不写盘；根目录默认为脚本所在目录的上一级（知识库根）。
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const rootArg = args.find((a) => !a.startsWith('--'));
const root = rootArg ? path.resolve(rootArg) : path.resolve(__dirname, '..');

// 不碰的目录：缓存/插件状态/模板/脚本自身/附件
const SKIP_DIRS = new Set([
  '.git', '.obsidian', '.trash', '.smart-env', '.smart-connections',
  'node_modules', 'template', 'scripts', '附件',
]);
const OPEN = '\u201C'; // “
const CLOSE = '\u201D'; // ”
const STRAIGHT = '"';
const HAS_CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
// 开引号前的「中文语境」字符：汉字或全角标点（含常见括号/引号类）
const CJK_CTX = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF「」『』]/;
const INLINE_CODE_RE = /`[^`]*`/g;
const HTML_TAG_RE = /<[^<>]*>/g;
// Markdown 链接/图片的 (url "title") 部分与 WikiLink：标题、别名里的直引号有语法意义
const MD_LINK_RE = /\]\([^()]*\)/g;
const WIKILINK_RE = /\[\[[^\[\]]*\]\]/g;
// 围栏行：允许 callout 前缀（> ```dataview 这类代码块也算围栏）
const FENCE_RE = /^\s*(?:>\s*)?(```|~~~)/;

// 布尔数组：字符是否位于行内代码、HTML 标签、链接目标或 WikiLink 内（不可参与、不可改写），按码点计
function protectedMask(line) {
  const chars = [...line];
  const mask = new Array(chars.length).fill(false);
  // 「字符串下标 → 码点序号」映射
  const map = new Array(line.length + 1);
  let cp = 0;
  for (let i = 0; i < line.length; i++) {
    map[i] = cp;
    if (line.codePointAt(i) > 0xffff) i++; // 代理对占两个下标一个码点
    cp++;
  }
  map[line.length] = cp;
  for (const re of [INLINE_CODE_RE, HTML_TAG_RE, MD_LINK_RE, WIKILINK_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      for (let i = m.index; i < m.index + m[0].length; i++) mask[map[i]] = true;
    }
  }
  return mask;
}

// 直引号对是否落在中文语境：内容含 CJK，或开引号前最近的非空白字符是 CJK/中文标点
function inCjkContext(chars, openIdx, closeIdx) {
  const between = chars.slice(openIdx + 1, closeIdx).join('');
  if (HAS_CJK.test(between)) return true;
  for (let i = openIdx - 1; i >= 0; i--) {
    if (/\s/.test(chars[i])) continue;
    return CJK_CTX.test(chars[i]);
  }
  return false;
}

// 整行修正；返回 [新文本, 改写数]。受保护位置只参与配对、永不变更。
function fixLine(line) {
  if (!line.includes(CLOSE) && !line.includes(STRAIGHT)) return [line, 0];
  const chars = [...line];
  const masked = protectedMask(line);
  const consumed = new Array(chars.length).fill(false);
  let changes = 0;

  // —— 1. 弯引号：每个（掩码外）“ 与其后最近未被占用的（掩码外）”配对 ——
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] !== OPEN || masked[i]) continue;
    for (let j = i + 1; j < chars.length; j++) {
      if (masked[j]) continue;
      if (chars[j] === OPEN) break; // 又一个开引号：前一个 “ 未闭合，放弃为它配对
      if (chars[j] === CLOSE && !consumed[j]) {
        consumed[i] = true;
        consumed[j] = true;
        break;
      }
    }
  }
  // 剩余未配对的 ”：偶数个才动，两两一组，组内第 1 个改写为 “
  const curlyLeft = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === CLOSE && !consumed[i] && !masked[i]) curlyLeft.push(i);
  }
  if (curlyLeft.length % 2 === 0) {
    for (let k = 0; k < curlyLeft.length; k += 2) {
      chars[curlyLeft[k]] = OPEN;
      changes++;
    }
  }

  // —— 2. 直引号：按出现顺序两两配对，仅中文语境的改写为 “…” ——
  const straight = [];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === STRAIGHT && !masked[i]) straight.push(i);
  }
  if (straight.length % 2 === 0) {
    for (let k = 0; k + 1 < straight.length; k += 2) {
      const a = straight[k];
      const b = straight[k + 1];
      if (inCjkContext(chars, a, b)) {
        chars[a] = OPEN;
        chars[b] = CLOSE;
        changes++;
      }
    }
  }

  return [chars.join(''), changes];
}

function* walkMd(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkMd(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      yield path.join(dir, entry.name);
    }
  }
}

let filesScanned = 0;
let filesChanged = 0;
let quotesFixed = 0;
const samples = [];

for (const file of walkMd(root)) {
  filesScanned++;
  const raw = fs.readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r\n|\n/);
  let inFrontmatter = false;
  let frontmatterDone = false;
  let inFence = false;
  let changed = 0;
  const lineSamples = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!frontmatterDone) {
      if (i === 0 && line.trim() === '---') { inFrontmatter = true; continue; }
      if (inFrontmatter) {
        if (line.trim() === '---') { inFrontmatter = false; frontmatterDone = true; }
        continue;
      }
      frontmatterDone = true;
    }
    if (FENCE_RE.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;

    const [fixed, n] = fixLine(line);
    if (n > 0) {
      lines[i] = fixed;
      changed += n;
      if (lineSamples.length < 2) {
        lineSamples.push(`    L${i + 1}: ${line.trim().slice(0, 80)}\n      → ${fixed.trim().slice(0, 80)}`);
      }
    }
  }

  if (changed > 0) {
    filesChanged++;
    quotesFixed += changed;
    samples.push(`  ${path.relative(root, file)}（${changed} 处）\n${lineSamples.join('\n')}`);
    if (!dry) fs.writeFileSync(file, lines.join(eol), 'utf8');
  }
}

console.log(`扫描 ${filesScanned} 个 Markdown 文件：${filesChanged} 个文件需要修正，共 ${quotesFixed} 对引号${dry ? '（dry-run，未写盘）' : '，已修正'}`);
if (samples.length) {
  console.log('示例（前 10 个文件）：');
  console.log(samples.slice(0, 10).join('\n'));
}
