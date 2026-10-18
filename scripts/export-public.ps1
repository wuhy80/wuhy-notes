# export-public.ps1 — 导出公开子集 + 自动脱敏 + 生成审查报告
# 产物：E:\Obsidian\public-site\content\    （只含 .md 与被引用附件，且已脱敏）
# 报告：E:\Obsidian\public-site\_reports\   （SUMMARY / dead-links / sensitive / masked）
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts\export-public.ps1
#       加 -Force 强制完整重新导出（默认增量：公开子集源内容与导出脚本均未变化时直接跳过）
param(
  [switch]$Force
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# 路径可用环境变量覆盖（供 CI 使用）；未设置时与本地默认值完全一致
function Get-EnvOr([string]$name, [string]$default) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $default }
  return $v
}

$DefaultVault = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path -LiteralPath $DefaultVault)) { $DefaultVault = 'E:\Obsidian\wuhy80_new' }
$Vault    = Get-EnvOr 'VAULT_DIR' $DefaultVault
$SiteRoot = Get-EnvOr 'SITE_ROOT' 'E:\Obsidian\public-site'
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
# 附件白名单：只发布图片类。
# 不发布 PDF / 压缩包 / 安装包 / 音视频：多为第三方版权资料、体积大
# （实测曾有 8 个行业报告 PDF 共 101 MB，其中 36 MB 那个超过 Cloudflare 单文件 25 MiB 上限）
# 2026-10-18：放行 .svg——《AI 大模型原理教程-轩辕》的 94 张插图是 SVG，
# 不放行的话教程页面上只会留下一行行「附件未随站点发布」的文字占位。
$AttachExt   = @('.svg')
$AttachMaxMB = 10   # 单个附件体积上限，超过则跳过并记入报告
$ExcludeDirs = @(
  '技术笔记\虚拟机', '技术笔记\安全',                          # 2026-10-01/02 迁至私密库
  '专项学习\*学习规划',                                        # 孩子的个人学业资料（姓名/学校/成绩/家校沟通），通配排除
  '专项项目', '极客时间', '浏览剪切', '网络剪切', '网关开发', '网络资料'   # 2026-10-02 迁至私密库
  '技术笔记\版本管理\知识库双仓库拆分与多机同步.md'                 # 内部运维文档：含内部路径、备份架构、家庭信息，绝不发布
  # 2026-10-18 该目录曾因「第三方教程全文（轩辕），版权归原作者」被列入本清单；
  # 2026-10-18 晚按用户要求解除排除，教程随站点发布（正文 38 篇 + 94 张 SVG）。
  # 需要回退时：把 '大模型\07-教程与课程\AI大模型原理教程-轩辕' 加回本数组末尾即可。
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

# ── 增量导出：指纹计算 ──
function Get-StringHash([string]$text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text))) -replace '-', '').ToLower() }
  finally { $sha.Dispose() }
}
# 内容树指纹：所有文件的 相对路径 + SHA256（内容变了才算变，mtime 无关）
function Get-TreeSig([string]$root) {
  if (-not (Test-Path -LiteralPath $root)) { return '' }
  $parts = New-Object System.Collections.ArrayList
  $prefixLen = $root.Length + 1
  foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File -Force)) {
    $h = Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256
    [void]$parts.Add($f.FullName.Substring($prefixLen) + '|' + $h.Hash.ToLower())
  }
  return Get-StringHash (($parts | Sort-Object) -join "`n")
}
# 输入指纹：公开子集源 .md 的 路径|大小|mtimeUtc + 本导出脚本自身（规则改动也会触发重导）
function Get-InputSig {
  $parts = New-Object System.Collections.ArrayList
  foreach ($d in $PublicDirs) {
    $src = Join-Path $Vault $d
    if (-not (Test-Path -LiteralPath $src)) { continue }
    $prefixLen = $src.Length + 1
    foreach ($f in (Get-ChildItem -LiteralPath $src -Recurse -File -Filter *.md -Force -ErrorAction SilentlyContinue)) {
      $vaultRel = "$d\$($f.FullName.Substring($prefixLen))"
      $skip = $false
      foreach ($x in $ExcludeDirs) { if ($vaultRel -like "$x*") { $skip = $true; break } }
      if (-not $skip -and ($ExcludeFileNames -contains $f.Name)) { $skip = $true }
      if ($skip) { continue }
      [void]$parts.Add($vaultRel + '|' + $f.Length + '|' + $f.LastWriteTimeUtc.Ticks)
    }
  }
  $scriptSig = Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256
  [void]$parts.Add('export-public.ps1|' + $scriptSig.Hash.ToLower())
  return Get-StringHash (($parts | Sort-Object) -join "`n")
}
$ExportStatePath = Join-Path $Reports 'export-state.json'
$inputSig = Get-InputSig
$prevExportState = $null
if (Test-Path -LiteralPath $ExportStatePath) {
  try { $prevExportState = Get-Content -LiteralPath $ExportStatePath -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $prevExportState = $null }
}
if (-not $Force -and $prevExportState -and $prevExportState.inputSig -eq $inputSig -and (Test-Path -LiteralPath $Content) -and $prevExportState.exportSig -eq (Get-TreeSig $Content)) {
  Write-Host "=== 公开子集无变化，跳过导出（-Force 可强制重导）===" -ForegroundColor Green
  exit 0
}
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
# ⚠️ 附件必须放在【引用它的那篇笔记旁边】，不能只丢进 content/附件/。
# 原因（2026-10-18 实测）：Quartz 转换 Obsidian 嵌入时只做 `url = slugifyFilePath(嵌入目标)`——
# ![[L01-fig1.svg]] 会原样写成相对「当前页面目录」的 <object data="l01-fig1.svg">，
# 不解析、也不指向统一附件目录。所以 SVG 只有与笔记同目录（或按 `附件/xx/x.svg`
# 这种带路径写法在笔记目录下镜像出来）才加载得到；放统一附件目录会让整站图片 404。
$embedRe = '!\[\[([^\]]+)\]\]'
$attachOk = 0; $attachMiss = @()
$attachSkip = @()
# 整库文件按文件名索引一次（重名取先枚举到的那个）。放行 .svg 后有 110 个附件，
# 逐个 `Get-ChildItem -Recurse` 扫全库会慢到不可接受。
$vaultFileIndex = @{}
foreach ($vf in (Get-ChildItem -LiteralPath $Vault -Recurse -File -Force -ErrorAction SilentlyContinue)) {
  if (-not $vaultFileIndex.ContainsKey($vf.Name)) { $vaultFileIndex[$vf.Name] = $vf }
}
foreach ($f in $expFiles) {
  $noteDir = Split-Path $f.FullName -Parent
  $txt = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  foreach ($m in [regex]::Matches($txt, $embedRe)) {
    $t = ($m.Groups[1].Value -split '\|')[0].Trim()
    if ([string]::IsNullOrWhiteSpace($t)) { continue }
    if ($AttachExt -notcontains ([System.IO.Path]::GetExtension($t).ToLower())) { continue }
    $name = [System.IO.Path]::GetFileName($t)
    $found = $vaultFileIndex[$name]
    if (-not $found) { if ($attachMiss -notcontains $name) { $attachMiss += $name }; continue }
    if ($found.Length -gt ($AttachMaxMB * 1MB)) {
      $tooBig = "$name ($([math]::Round($found.Length/1MB,1)) MB)"
      if ($attachSkip -notcontains $tooBig) { $attachSkip += $tooBig }
      continue
    }
    # 镜像嵌入目标里的相对路径（丢掉 . 与 ..），落点 = 笔记所在目录
    $relParts = @(($t -replace '\\', '/') -split '/' | Where-Object { $_ -and $_ -ne '.' -and $_ -ne '..' })
    $dest = Join-Path $noteDir ($relParts -join '\')
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    if (-not (Test-Path -LiteralPath $dest)) {
      Copy-Item -LiteralPath $found.FullName -Destination $dest -Force
      $attachOk++
    }
  }
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
$internalMap = @{ '私密库：' = ''; '私密库（' = '（'; '私密库' = '内部库'; 'wuhy80_private' = '内部库'; 'zhanwan' = 'internal'; '知识库双仓库拆分与多机同步' = '知识库运维' }
$phraseFiles = 0
foreach ($f in $expFiles) {
  $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $orig = $txt
  foreach ($k in $internalMap.Keys) { $txt = $txt.Replace($k, $internalMap[$k]) }
  if ($txt -ne $orig) { Write-Utf8 $f.FullName $txt; $phraseFiles++ }
}
Write-Host "  清理内部用语 $phraseFiles 篇" -ForegroundColor Green
# 未发布的附件类型：把嵌入改写成文字提示，避免页面上出现断图/坏链。
# ⚠️ 已放行的类型（$AttachExt，目前是 .svg）必须从这张表里排除，
# 否则图片仍会被改写成「附件未随站点发布」，放行白名单等于白设。
$allEmbedExt = @('png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'pdf', 'mp4', 'mp3', 'zip', 'crx', 'xlsx', 'drawio', 'csv', 'docx', 'pptx')
$unpublishedExt = @($allEmbedExt | Where-Object { $AttachExt -notcontains ".$_" })
$embedFiles = 0
if ($unpublishedExt.Count -gt 0) {
  $embedFileRe = '!\[\[([^\]]+\.(?:' + (($unpublishedExt | ForEach-Object { [regex]::Escape($_) }) -join '|') + '))(?:\|[^\]]*)?\]\]'
  $embedTextEval = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) '（附件 ' + (($m.Groups[1].Value -split '/')[-1]) + ' 未随站点发布）' }
  foreach ($f in $expFiles) {
    $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    if ($txt -match $embedFileRe) {
      $txt = [regex]::Replace($txt, $embedFileRe, $embedTextEval)
      Write-Utf8 $f.FullName $txt
      $embedFiles++
    }
  }
}
Write-Host "  附件嵌入改文字 $embedFiles 篇（已放行类型：$($AttachExt -join ' ')）" -ForegroundColor Green
# cardlink → callout：Quartz 不认识 ```cardlink，会裸露成代码块（url:/title: 全显出来）
# 只在导出副本里转换，源笔记保持 cardlink，Obsidian 里的 auto-card-link 卡片不受影响
$cardFiles = 0
foreach ($f in $expFiles) {
  $lines = @(Get-Content -LiteralPath $f.FullName -Encoding UTF8)
  if (-not ($lines -match '^```cardlink')) { continue }
  $newLines = New-Object System.Collections.ArrayList
  $i = 0
  while ($i -lt $lines.Count) {
    if ($lines[$i].Trim() -eq '```cardlink') {
      $body = @()
      $i++
      while ($i -lt $lines.Count -and $lines[$i].Trim() -ne '```') { $body += $lines[$i]; $i++ }
      $i++
      $url = ''; $title = ''; $desc = ''
      foreach ($b in $body) {
        if ($b -match '^url:\s*(.+)$') { $url = $Matches[1].Trim().Trim('"') }
        elseif ($b -match '^title:\s*(.+)$') { $title = $Matches[1].Trim().Trim('"') }
        elseif ($b -match '^description:\s*(.+)$') { $desc = $Matches[1].Trim().Trim('"') }
      }
      if (-not $title) { $title = $url }
      $title = $title -replace '\]', '\]'
      [void]$newLines.Add("> [!note] [$title]($url)")
      if ($desc) { [void]$newLines.Add("> $desc") }
      continue
    }
    [void]$newLines.Add($lines[$i])
    $i++
  }
  Write-Utf8 $f.FullName (($newLines -join "`n") + "`n")
  $cardFiles++
}
Write-Host "  cardlink 转为 callout $cardFiles 篇" -ForegroundColor Green
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
Write-Host "=== 4.6 生成首页 index.md 与静态早报索引 ===" -ForegroundColor Cyan

# 1. 扫描最近早报（供首页和索引页静态使用）
$dailyDir = Join-Path $Content '大模型\10-新闻\日报'
$recentDailies = @()
if (Test-Path -LiteralPath $dailyDir) {
  $dailyFiles = @(Get-ChildItem -LiteralPath $dailyDir -Recurse -File -Filter "*AI 早报.md" -Force | Sort-Object Name -Descending)
  $recentDailies = $dailyFiles | Select-Object -First 10
}

# 2. 为 00-日报索引.md 注入静态直达列表
$dailyIndexFile = Join-Path $dailyDir '00-日报索引.md'
if (Test-Path -LiteralPath $dailyIndexFile) {
  $dContent = Get-Content -LiteralPath $dailyIndexFile -Raw -Encoding UTF8
  $staticNav = @(
    '',
    '## 📰 静态归档直达（网页端）',
    '',
    '> [!tip] 网页端直达说明',
    '> 静态站点不运行 Obsidian Dataview 插件，下方为构建时生成的直达归档列表。',
    '',
    '### 📅 月度索引',
    '- [[00-2026 年索引|2026 年早报总索引]]'
  )
  $monthIndexFiles = @(Get-ChildItem -LiteralPath $dailyDir -Recurse -File -Filter "*月索引.md" -Force | Sort-Object Name -Descending)
  foreach ($mf in $monthIndexFiles) {
    $staticNav += "  - [[$($mf.BaseName)]]"
  }
  if ($recentDailies.Count -gt 0) {
    $staticNav += ''
    $staticNav += '### ⚡ 最近 10 期早报'
    $staticNav += '| 日期 | 早报期号 |'
    $staticNav += '|---|---|'
    foreach ($df in $recentDailies) {
      $base = $df.BaseName
      $dateStr = if ($base -match '^(\d{4}-\d{2}-\d{2})') { $Matches[1] } else { '' }
      $staticNav += "| $dateStr | [[$base]] |"
    }
  }
  $dContent = $dContent + "`n" + ($staticNav -join "`n") + "`n"
  Write-Utf8 $dailyIndexFile $dContent
  Write-Host "  已为 00-日报索引.md 附加静态归档直达"
}

# 3. 为各个 月索引.md 注入当月早报列表
$monthDirs = @(Get-ChildItem -LiteralPath $dailyDir -Recurse -Directory -Force | Where-Object { $_.Name -match '^\d{4}-\d{2}$' })
foreach ($md in $monthDirs) {
  $mIndexFile = Join-Path $md.FullName "00-$($md.Name) 月索引.md"
  if (Test-Path -LiteralPath $mIndexFile) {
    $mFiles = @(Get-ChildItem -LiteralPath $md.FullName -File -Filter "*AI 早报.md" -Force | Sort-Object Name -Descending)
    if ($mFiles.Count -gt 0) {
      $mContent = Get-Content -LiteralPath $mIndexFile -Raw -Encoding UTF8
      $mNav = @(
        '',
        '## 📰 当月早报列表（网页端直达）',
        '',
        '| 日期 | 早报期号 |',
        '|---|---|'
      )
      foreach ($mf in $mFiles) {
        $base = $mf.BaseName
        $dateStr = if ($base -match '^(\d{4}-\d{2}-\d{2})') { $Matches[1] } else { '' }
        $mNav += "| $dateStr | [[$base]] |"
      }
      $mContent = $mContent + "`n" + ($mNav -join "`n") + "`n"
      Write-Utf8 $mIndexFile $mContent
    }
  }
}
Write-Host "  已为月索引页附加当月早报直达列表"

# 4. 生成公开站首页 index.md
$dailySection = @()
if ($recentDailies.Count -gt 0) {
  $dailySection += ''
  $dailySection += '## 📰 最近 AI 早报'
  $dailySection += ''
  $dailySection += '> 来源：[橘鸦 AI 早报](https://daily.juya.uk/) · 查看完整归档：[[00-日报索引|AI 早报日报索引]]'
  $dailySection += ''
  $dailySection += '| 日期 | 早报期号 |'
  $dailySection += '|---|---|'
  foreach ($df in $recentDailies) {
    $base = $df.BaseName
    $dateStr = if ($base -match '^(\d{4}-\d{2}-\d{2})') { $Matches[1] } else { '' }
    $dailySection += "| $dateStr | [[$base]] |"
  }
}

$homePageLines = @(
  '---',
  'title: 技术笔记',
  '---',
  '',
  '# 技术笔记',
  '',
  '这里是我的技术学习笔记与知识库：涵盖大模型、云原生、后端架构、数据库与系统运维。',
  '',
  '## 分区导航',
  '',
  '| 分区 | 内容 |',
  '|---|---|',
  '| [大模型与 AI 早报](/大模型/00-大模型学习导航) | 基础原理、应用开发、Agent、[AI 早报](/大模型/10-新闻/日报/00-日报索引) 与周报 |',
  '| [技术笔记](/技术笔记/) | Kubernetes、Docker、Linux、数据库、网络、编辑器等 |',
  '| [Ontology 知识模型](/Ontology/README) | Palantir 核心模型、概念与开发指南 |',
  '| [Golang 编程](/golang编程/) | Go 语言、Gin、GORM、并发与性能 |',
  '| [Rust 编程](/rust编程/) | Rust 学习笔记 |',
  '| [编程语言](/编程语言/) | 语言特性与对比 |',
  '| [读书笔记](/读书笔记/) | 技术书与科普书的阅读记录 |',
  '| [网址收藏](/网址收藏/网址收藏) | 常用工具、技术社区与优质博客 |'
) + $dailySection + @(
  '',
  '## 怎么用这个站',
  '',
  '- 左上角 **搜索**（Ctrl+K）可全文检索',
  '- 右上角 **Graph** 看笔记之间的链接关系',
  '- 每篇笔记右侧有目录与反向链接',
  '- 暗色/亮色可切换',
  ''
)

$homePageContent = $homePageLines -join "`n"
$indexPath = Join-Path $Content 'index.md'
Write-Utf8 $indexPath $homePageContent
Write-Host "  已生成 content/index.md（含导航与最近 $($recentDailies.Count) 期早报）"

# 刷新 expFiles 与 nameIndex，确保新生成的 index.md 参与后续脱敏与死链校验
$expFiles = @(Get-ChildItem -LiteralPath $Content -Recurse -File -Filter *.md -Force)
foreach ($f in $expFiles) { if (-not $nameIndex.ContainsKey($f.BaseName)) { $nameIndex[$f.BaseName] = $f.FullName } }

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

# 记录增量状态：输入指纹 + 本次导出结果指纹（供下次运行短路）
$exportSig = Get-TreeSig $Content
@{ inputSig = $inputSig; exportSig = $exportSig; exportedAt = (Get-Date -Format 'o') } |
  ConvertTo-Json | Set-Content -LiteralPath $ExportStatePath -Encoding UTF8
Write-Host "  增量状态已更新（inputSig/exportSig）"

Write-Host ""
Write-Host "=== 完成 ===" -ForegroundColor Green
