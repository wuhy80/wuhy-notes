# export-public.ps1 — 导出公开子集 + 自动脱敏 + 生成审查报告
# 产物：E:\Obsidian\public-site\content\    （只含 .md 与被引用附件，且已脱敏）
# 报告：E:\Obsidian\public-site\_reports\   （SUMMARY / dead-links / sensitive / masked）
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts\export-public.ps1
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$Vault    = 'E:\Obsidian\wuhy80_new'
$SiteRoot = 'E:\Obsidian\public-site'
$Content  = Join-Path $SiteRoot 'content'
$Reports  = Join-Path $SiteRoot '_reports'

# ── 发布范围 ──
# 原则：只发布技术学习类内容。以下类别不发布（判断记录见运维笔记「展示层」一节）：
#   · 家庭与个人资料（孩子的学业规划：姓名、学校、录取情况、成绩、家校沟通）
#   · 公司工作内容（专项项目、网关开发、我的任务）
#   · 付费课程笔记与第三方文章剪藏（版权）
#   · 非技术个人兴趣清单
#   · AI 协作指令文件（CLAUDE.md / AGENTS.md，含内部路径与架构）
#   · Dataview 仪表盘（Home*.md，静态站不执行 Dataview，会显示成代码）
$PublicDirs = @(
  '技术笔记', '大模型', 'Ontology',
  'Golang编程', 'Rust编程', '编程语言',
  '读书笔记', '英语学习', '数学学习',
  '网址收藏', '专项学习'
)
# 文件名级排除（任何层级）
$ExcludeFileNames = @('CLAUDE.md', 'AGENTS.md')
# 根目录散装笔记一律不发布
$PublicRootFiles = @()
# 附件白名单：只发布图片类（自己画的图）。
# 不发布 PDF / 压缩包 / 安装包 / 音视频：多为第三方版权资料、体积大
# （实测曾有 8 个行业报告 PDF 共 101 MB，其中 36 MB 那个超过 Cloudflare 单文件 25 MiB 上限）
$AttachExt   = @('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')
$AttachMaxMB = 10   # 单个附件体积上限，超过则跳过并记入报告
$ExcludeDirs = @(
  '技术笔记\虚拟机', '技术笔记\安全',                          # 2026-10-01/02 迁至私密库
  '专项学习\孩子学业学习规划',                            # 孩子的个人学业资料（姓名/学校/成绩/家校沟通）
  '专项项目', '极客时间', '浏览剪切', '网络剪切', '网关开发', '网络资料'   # 2026-10-02 迁至私密库
  '技术笔记\版本管理\知识库双仓库拆分与多机同步.md'                # 内部运维文档：含内部路径、备份架构、家庭信息，绝不发布
)

# ── 脱敏规则 ──
$privIpRe   = '\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b'
$credRe     = '(?i)\b(password|passwd|secret|token|api[_-]?key|apikey|access[_-]?key)\b(\s*[:=]\s*)([^\s`"'',;]+)'
$ownMailRe  = '(?i)[A-Za-z0-9._%+\-]*wuhy[A-Za-z0-9._%+\-]*@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}'
$fqdnRe     = '(?i)\b[\w\-]+\.(ts\.net|mshome\.net)\b'
$localHostRe= '(?i)\b[\w\-]+\.local\b'
# 文档保留网段（RFC 5737），用于替换私网 IP
$DocNet     = '192.0.2.'

function Write-Utf8([string]$path, [string]$text) { [System.IO.File]::WriteAllText($path, $text, $utf8) }

Write-Host "=== 1. 重建导出目录 ===" -ForegroundColor Cyan
if (Test-Path -LiteralPath $Content) {
  if ($Content -ne (Join-Path $SiteRoot 'content')) { throw "拒绝删除非预期路径：$Content" }
  Remove-Item -LiteralPath $Content -Recurse -Force
}
New-Item -ItemType Directory -Path $Content -Force | Out-Null
New-Item -ItemType Directory -Path $Reports -Force | Out-Null
Write-Host "  已清空并重建 $Content"

Write-Host "=== 2. 复制白名单目录（只复制 .md）===" -ForegroundColor Cyan
$copied = 0
foreach ($d in $PublicDirs) {
  $src = Join-Path $Vault $d
  if (-not (Test-Path -LiteralPath $src)) { Write-Host "  跳过（不存在）：$d" -ForegroundColor Yellow; continue }
  $dst = Join-Path $Content $d
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
  $files = @(Get-ChildItem -LiteralPath $src -Recurse -File -Filter *.md -Force -ErrorAction SilentlyContinue)
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($src.Length).TrimStart('\')
    $vaultRel = "$d\$rel"
    $skip = $false
    foreach ($x in $ExcludeDirs) { if ($vaultRel -like "$x*") { $skip = $true } }
    if ($skip) { continue }
    $target = Join-Path $dst $rel
    $tdir = Split-Path $target -Parent
    if (-not (Test-Path -LiteralPath $tdir)) { New-Item -ItemType Directory -Path $tdir -Force | Out-Null }
    Copy-Item -LiteralPath $f.FullName -Destination $target -Force
    $copied++
  }
  Write-Host ("  {0,-12} {1} 篇" -f $d, $files.Count)
}
Write-Host "  合计 $copied 篇" -ForegroundColor Green
$expFiles = @(Get-ChildItem -LiteralPath $Content -Recurse -File -Filter *.md -Force)
$nameIndex = @{}
foreach ($f in $expFiles) { if (-not $nameIndex.ContainsKey($f.BaseName)) { $nameIndex[$f.BaseName] = $f.FullName } }

Write-Host "=== 3. 收集并复制被引用的附件 ===" -ForegroundColor Cyan
$embedRe = '!\[\[([^\]]+)\]\]'
$attachWanted = @{}
foreach ($f in $expFiles) {
  foreach ($m in [regex]::Matches((Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8), $embedRe)) {
    $t = ($m.Groups[1].Value -split '\|')[0].Trim()
    if ($AttachExt -contains ([System.IO.Path]::GetExtension($t).ToLower())) { $attachWanted[[System.IO.Path]::GetFileName($t)] = $true }
  }
}
$attachOk = 0; $attachMiss = @()
$attachSkip = @()
foreach ($name in $attachWanted.Keys) {
  $found = Get-ChildItem -LiteralPath $Vault -Recurse -File -Filter $name -Force -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $found) { $attachMiss += $name; continue }
  if ($found.Length -gt ($AttachMaxMB * 1MB)) { $attachSkip += "$name ($([math]::Round($found.Length/1MB,1)) MB)"; continue }
  $dstDir = Join-Path $Content '附件'
  if (-not (Test-Path -LiteralPath $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  Copy-Item -LiteralPath $found.FullName -Destination (Join-Path $dstDir $name) -Force
  $attachOk++
}
Write-Host "  已复制 $attachOk 个；缺失 $($attachMiss.Count) 个；因过大跳过 $($attachSkip.Count) 个" -ForegroundColor Green
if ($attachMiss.Count) { $attachMiss | ForEach-Object { Write-Host "      缺失：$_" -ForegroundColor Yellow } }
if ($attachSkip.Count) { $attachSkip | ForEach-Object { Write-Host "      过大跳过：$_" -ForegroundColor Yellow } }

Write-Host "=== 4. 脱敏 ===" -ForegroundColor Cyan
# 4.1 建立确定性的私网 IP 映射（同一地址每次都映射到同一示例地址）
$allIps = @{}
foreach ($f in $expFiles) {
  foreach ($m in [regex]::Matches((Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8), $privIpRe)) { $allIps[$m.Value] = $true }
}
$ipMap = @{}; $n = 1
foreach ($ip in ($allIps.Keys | Sort-Object)) { $ipMap[$ip] = "$DocNet$n"; $n++ }
Write-Host "  私网地址 $($ipMap.Count) 个 -> 映射到 $DocNet"1.."$($ipMap.Count)"

$ipEval   = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $ipMap[$m.Value] }
$credEval = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) "$($m.Groups[1].Value)$($m.Groups[2].Value)***" }
$mailEval = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) '***@***' }
$fqdnEval = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) "host.$($m.Groups[1].Value)" }
$locEval  = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) 'host.local' }

$maskLog = New-Object System.Collections.ArrayList
foreach ($f in $expFiles) {
  $rel = $f.FullName.Substring($Content.Length + 1)
  $lines = Get-Content -LiteralPath $f.FullName -Encoding UTF8
  $touched = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $ln = $lines[$i]; $new = $ln
    if ([regex]::IsMatch($new, $privIpRe)) {
      foreach ($m in [regex]::Matches($new, $privIpRe)) { [void]$maskLog.Add("私网IP|$rel|$($i+1)|$($m.Value)|$($ipMap[$m.Value])") }
      $new = [regex]::Replace($new, $privIpRe, $ipEval)
    }
    if ([regex]::IsMatch($new, $credRe)) {
      foreach ($m in [regex]::Matches($new, $credRe)) { [void]$maskLog.Add("凭据|$rel|$($i+1)|$($m.Groups[1].Value)（原值 $($m.Groups[3].Value.Length) 字符，已隐藏）|***") }
      $new = [regex]::Replace($new, $credRe, $credEval)
    }
    if ([regex]::IsMatch($new, $ownMailRe)) {
      foreach ($m in [regex]::Matches($new, $ownMailRe)) { [void]$maskLog.Add("本人邮箱|$rel|$($i+1)|已隐藏|***@***") }
      $new = [regex]::Replace($new, $ownMailRe, $mailEval)
    }
    if ([regex]::IsMatch($new, $fqdnRe))  { $new = [regex]::Replace($new, $fqdnRe, $fqdnEval); [void]$maskLog.Add("内网域名|$rel|$($i+1)|已隐藏|host.x") }
    if ([regex]::IsMatch($new, $localHostRe)) { $new = [regex]::Replace($new, $localHostRe, $locEval); [void]$maskLog.Add("主机名|$rel|$($i+1)|已隐藏|host.local") }
    if ($new -ne $ln) { $lines[$i] = $new; $touched = $true }
  }
  if ($touched) { Write-Utf8 $f.FullName (($lines -join "`n") + "`n") }
}
Write-Host "  共脱敏 $($maskLog.Count) 处，涉及文件 $(($maskLog | ForEach-Object { ($_ -split '\|')[1] } | Sort-Object -Unique).Count) 篇" -ForegroundColor Green

# 清理内部用语：链接修复留下的「私密库：」前缀会暴露库结构
$internalMap = @{ '私密库：' = ''; '私密库（' = '（'; '私密库' = '内部库'; 'zhanwan_tool' = 'internal_tool'; 'zhanwan_backup' = 'db_backup' }
$phraseFiles = 0
foreach ($f in $expFiles) {
  $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $orig = $txt
  foreach ($k in $internalMap.Keys) { $txt = $txt.Replace($k, $internalMap[$k]) }
  if ($txt -ne $orig) { Write-Utf8 $f.FullName $txt; $phraseFiles++ }
}
Write-Host "  清理内部用语 $phraseFiles 篇" -ForegroundColor Green
Write-Host "=== 4.5 frontmatter 规范化（YAML 不合法会让 Quartz 整体构建失败）===" -ForegroundColor Cyan
$fmKeyRe = '^(?!(?:https?|ftp|file)$)([A-Za-z_][A-Za-z0-9_\-]*):(\S.*)$'
$fmLog = New-Object System.Collections.ArrayList
$fmBad = New-Object System.Collections.ArrayList
foreach ($f in $expFiles) {
  $lines = @(Get-Content -LiteralPath $f.FullName -Encoding UTF8)
  if ($lines.Count -lt 3 -or $lines[0].Trim() -ne '---') { continue }
  $end = -1
  for ($i = 1; $i -lt $lines.Count; $i++) { if ($lines[$i].Trim() -eq '---') { $end = $i; break } }
  $rel = $f.FullName.Substring($Content.Length + 1)
  if ($end -lt 0) { [void]$fmBad.Add("$rel   frontmatter 未闭合"); continue }
  $changed = $false
  for ($i = 1; $i -lt $end; $i++) {
    if ($lines[$i] -match $fmKeyRe) {
      [void]$fmLog.Add("$rel`:$($i+1)  原: $($lines[$i].Trim())")
      $lines[$i] = $lines[$i] -replace $fmKeyRe, '$1: $2'
      $changed = $true
    }
  }
  if ($changed) { Write-Utf8 $f.FullName (($lines -join "`n") + "`n") }
}
Write-Host "  规范化 $($fmLog.Count) 处；未闭合 $($fmBad.Count) 篇" -ForegroundColor Green
Write-Host "=== 4.6 生成首页 index.md ===" -ForegroundColor Cyan
$homePageContent = @(
  '---',
  'title: 技术笔记',
  '---',
  '',
  '# 技术笔记',
  '',
  '这里是我的技术学习笔记：后端开发、云原生、数据库、算法与编程语言。',
  '',
  '## 分区导航',
  '',
  '| 分区 | 内容 |',
  '|---|---|',
  '| [技术笔记](/技术笔记/) | Kubernetes、Docker、Linux、数据库、网络、编辑器等 |',
  '| [Golang 编程](/golang编程/) | Go 语言、Gin、GORM、并发与性能 |',
  '| [读书笔记](/读书笔记/) | 技术书与科普书的阅读记录 |',
  '| [编程语言](/编程语言/) | 语言特性与对比 |',
  '| [Rust 编程](/rust编程/) | Rust 学习笔记 |',
  '',
  '## 怎么用这个站',
  '',
  '- 左上角 **搜索**（Ctrl+K）可全文检索',
  '- 右上角 **Graph** 看笔记之间的链接关系',
  '- 每篇笔记右侧有目录与反向链接',
  '- 暗色/亮色可切换',
  ''
) -join "`n"
Write-Utf8 (Join-Path $Content 'index.md') $homePageContent
Write-Host "  已生成 content/index.md"
Write-Host "=== 5. 死链扫描 ===" -ForegroundColor Cyan
$linkRe = '(?<!!)\[\[([^\]]+)\]\]'
$dead = New-Object System.Collections.ArrayList
foreach ($f in $expFiles) {
  $rel = $f.FullName.Substring($Content.Length + 1)
  $lines = Get-Content -LiteralPath $f.FullName -Encoding UTF8
  for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($m in [regex]::Matches($lines[$i], $linkRe)) {
      $t = (($m.Groups[1].Value -split '\|')[0] -split '#')[0].Trim()
      if (-not $t) { continue }
      if (-not $nameIndex.ContainsKey(($t -split '/')[-1])) { [void]$dead.Add("$rel`:$($i+1)  ->  [[$t]]") }
    }
  }
}
Write-Host "  死链 $($dead.Count) 处" -ForegroundColor Green

Write-Host "=== 6. 脱敏校验（以下应全部为 0）===" -ForegroundColor Cyan
$verify = [ordered]@{
  '残留私网IP'   = $privIpRe
    '残留凭据值'   = '(?i)\b(password|passwd|secret|token|api[_-]?key|apikey|access[_-]?key)\b(\s*[:=]\s*)(?!\*\*\*)([^\s`"'',;]+)'
  '残留本人邮箱' = $ownMailRe
}
$verifyFiles = @(Get-ChildItem -LiteralPath $Content -Recurse -File -Filter *.md -Force)
$verifyResult = @{}
foreach ($k in $verify.Keys) {
  $c = 0
  foreach ($f in $verifyFiles) { foreach ($ln in (Get-Content -LiteralPath $f.FullName -Encoding UTF8)) { $c += ([regex]::Matches($ln, $verify[$k])).Count } }
  $verifyResult[$k] = $c
  $color = if ($c -eq 0) { 'Green' } else { 'Red' }
  Write-Host ("  {0,-12} {1}" -f $k, $c) -ForegroundColor $color
}

Write-Host "=== 7. 写报告 ===" -ForegroundColor Cyan
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# 公开导出报告'); [void]$sb.AppendLine('')
[void]$sb.AppendLine("生成时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"); [void]$sb.AppendLine('')
[void]$sb.AppendLine('| 项目 | 数量 |'); [void]$sb.AppendLine('|---|---|')
[void]$sb.AppendLine("| 导出笔记 | $copied 篇 |")
[void]$sb.AppendLine("| 死链（指向未公开笔记）| $($dead.Count) 处 |")
[void]$sb.AppendLine("| 复制附件 | $attachOk 个（缺失 $($attachMiss.Count) 个）|")
[void]$sb.AppendLine("| 脱敏处理 | $($maskLog.Count) 处 |")
[void]$sb.AppendLine("| 私网地址映射 | $($ipMap.Count) 个 -> $DocNet |")
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## 脱敏校验'); [void]$sb.AppendLine('')
[void]$sb.AppendLine('| 检查项 | 残留数（应为 0）|'); [void]$sb.AppendLine('|---|---|')
foreach ($k in $verifyResult.Keys) { [void]$sb.AppendLine("| $k | $($verifyResult[$k]) |") }
Write-Utf8 (Join-Path $Reports 'SUMMARY.md') $sb.ToString()

$dl = New-Object System.Text.StringBuilder
[void]$dl.AppendLine('# 死链清单（指向未公开笔记）'); [void]$dl.AppendLine('')
[void]$dl.AppendLine("共 $($dead.Count) 处"); [void]$dl.AppendLine('')
foreach ($d in $dead) { [void]$dl.AppendLine("- $d") }
Write-Utf8 (Join-Path $Reports 'dead-links.md') $dl.ToString()

$mk = New-Object System.Text.StringBuilder
[void]$mk.AppendLine('# 脱敏清单（导出副本里改了什么）'); [void]$mk.AppendLine('')
[void]$mk.AppendLine('> 源笔记未被修改；以下只发生在导出副本中。')
[void]$mk.AppendLine('')
[void]$mk.AppendLine("## 私网地址映射表（$($ipMap.Count) 个）"); [void]$mk.AppendLine('')
[void]$mk.AppendLine('| 原地址 | 导出中的地址 |'); [void]$mk.AppendLine('|---|---|')
foreach ($k in ($ipMap.Keys | Sort-Object)) { [void]$mk.AppendLine("| $k | $($ipMap[$k]) |") }
[void]$mk.AppendLine('')
[void]$mk.AppendLine('## 逐处改动'); [void]$mk.AppendLine('')
[void]$mk.AppendLine('| 类型 | 文件:行 | 原值 | 脱敏后 |'); [void]$mk.AppendLine('|---|---|---|---|')
foreach ($x in $maskLog) { $p = $x -split '\|'; [void]$mk.AppendLine("| $($p[0]) | $($p[1]):$($p[2]) | $($p[3]) | $($p[4]) |") }
Write-Utf8 (Join-Path $Reports 'masked.md') $mk.ToString()

Write-Host "  报告已写入 $Reports" -ForegroundColor Green
Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Green
