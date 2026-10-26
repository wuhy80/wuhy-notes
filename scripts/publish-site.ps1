# publish-site.ps1 — 一键发布技术笔记展示站
# 流程：导出公开子集（含脱敏与审查报告）→ 同步站点自定义样式 → Quartz 构建 → 部署到 Cloudflare Pages
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts\publish-site.ps1
#       加 -SkipDeploy 只本地构建不部署；加 -Serve 构建后启动本地预览（端口 8765）
#       增量：导出内容+样式+字体+主题相对上次成功部署均无变化时，自动跳过构建与部署；-Force 强制全量
param(
  [switch]$SkipDeploy,
  [switch]$Serve,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$env:WRANGLER_SEND_METRICS = 'false'
$env:GIT_TERMINAL_PROMPT   = '0'

# 路径可用环境变量覆盖（供 CI 使用）；未设置时与本地默认值完全一致
function Get-EnvOr([string]$name, [string]$default) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($v)) { return $default }
  return $v
}

# 知识库根目录 = 本脚本所在 scripts/ 的上一级。不再回退到任何写死的旧路径：
# 猜错目录比直接报错危险得多（会把别人的库导出/覆盖），所以找不到就直接失败。
$DefaultVault = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path -LiteralPath $DefaultVault)) {
  throw "无法确定知识库根目录（$DefaultVault 不存在）。请把脚本放在 <知识库>\scripts\ 下，或用环境变量 VAULT_DIR 指定。"
}
$Vault    = Get-EnvOr 'VAULT_DIR'   $DefaultVault
$SiteRoot = Get-EnvOr 'SITE_ROOT'   'E:\Obsidian\public-site'
$Quartz   = Join-Path $SiteRoot 'quartz'
$Content  = Join-Path $SiteRoot 'content'
$Node     = Get-EnvOr 'NODE_EXE'    'C:\nvm4w\nodejs\node.exe'
$Wrangler = Get-EnvOr 'WRANGLER_JS' 'C:\nvm4w\nodejs\node_modules\wrangler\bin\wrangler.js'

# Cloudflare Pages 项目名（决定网址 https://<项目名>.pages.dev）
$ProjectName = 'wuhy-notes'
$PreviewPort = 8765   # 注意：不要用 8080，它落在 Windows 保留端口范围，会 EACCES

function Write-Step([string]$t) {
  Write-Host ""
  Write-Host "=== $t ===" -ForegroundColor Cyan
}

# ── 增量发布：指纹与状态 ──
function Get-StringHash([string]$text) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text))) -replace '-', '').ToLower() }
  finally { $sha.Dispose() }
}
function Get-FileSig([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return '-' }
  return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower()
}
# 内容树指纹：相对路径 + SHA256（与导出脚本的算法一致）
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
$PubStatePath = Join-Path $SiteRoot '.publish-state.json'
function Load-PubState {
  if (-not (Test-Path -LiteralPath $PubStatePath)) { return $null }
  try { return Get-Content -LiteralPath $PubStatePath -Raw -Encoding UTF8 | ConvertFrom-Json } catch { return $null }
}
function Save-PubState([string]$exportSig, [string]$siteSig) {
  @{ exportSig = $exportSig; siteSig = $siteSig; deployedAt = (Get-Date -Format 'o') } |
    ConvertTo-Json | Set-Content -LiteralPath $PubStatePath -Encoding UTF8
}

Write-Step "0/4 前置检查：脚本 BOM、常驻 watch 工作进程与并发进程"

# PowerShell 脚本必须带 UTF-8 BOM：PS 5.1 在无 BOM 时按 GBK 解码，中文注释会让
# 整个脚本解析失败（实测踩过两次）。这里先查一遍，避免带病发布/带病提交。
$bomCheck = Join-Path $Vault 'scripts\check-bom.mjs'
# CI 里 NODE_EXE=node（裸命令名），Test-Path 认不出来，会让 BOM 检查悄悄跳过。
$nodeReady = (Test-Path -LiteralPath $Node) -or [bool](Get-Command $Node -ErrorAction SilentlyContinue)
if ((Test-Path -LiteralPath $bomCheck) -and $nodeReady) {
  $bomOut = (& $Node $bomCheck 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) { throw "PowerShell 脚本缺少 UTF-8 BOM，请先补齐再发布：`n$bomOut" }
  ($bomOut -split "`r?`n") | Where-Object { $_.Trim() } | ForEach-Object { Write-Host "  $($_.Trim())" -ForegroundColor Green }
}

$allBoot = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'bootstrap-cli\.mjs' })
# 历史遗留的 --watch 常驻进程：--watch 且指向**本次的**内容目录
# ⚠️ 不能写死 'public-site' 字面量：watch 进程命令行里带的是 $Content
#    （如 SITE_ROOT=D:\...\_site 时是 `_site\content`，CI 里是 `<workspace>\_site\content`），
#    写死会导致残留进程永远匹配不到，既停不掉也绕不开。
#    （2026-10-18 实测：CI 与本机 _site 路径都命中这个坑）。
$workerProc = $allBoot | Where-Object { $_.CommandLine -match '--watch' -and $_.CommandLine -match [regex]::Escape($Content) } | Select-Object -First 1
$others = @($allBoot | Where-Object { -not $workerProc -or $_.ProcessId -ne $workerProc.ProcessId })
if ($others.Count -gt 0) {
  $pids = ($others | ForEach-Object { $_.ProcessId }) -join ', '
  throw "检测到其它 Quartz 构建/预览进程（PID $pids）。它们会并发写入 public/ 导致产物损坏，请先停止后再发布。"
}
if ($workerProc) { Write-Host "  发现残留 watch 进程（PID $($workerProc.ProcessId)），构建前会停止它" }

# ── 残留 watch 进程清理 ──
# 2026-10-25 起弃用「常驻 worker + --watch 增量」构建模式，原因（探针实验两度复现）：
#   1. chokidar 对 content 新增 .md 的 add 事件不可靠——新文件写入后 90 秒内
#      watcher 连一次 rebuild 都不触发，新页面自然不进产物；
#   2. 「日志出现 Done 行」≠「产物覆盖最新内容」：Done 可由其他变更触发，
#      曾导致缺新页面的残缺产物被判定为构建完成并部署上线（2026-10-25 事故）；
#   3. changesSinceLastBuild 只增不清，增量 rebuild 退化成全量 parse
#      （909 文件 / 40s + emit 3-4 分钟），速度上也不再优于前台全量。
# 因此 needBuild 时一律前台全量构建（确定性优先），watch 进程只做发现与清理。
function Find-WorkerPid {
  # 同上面：按「本次的 $Content」匹配，不写死 'public-site'
  $w = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match '--watch' -and $_.CommandLine -match [regex]::Escape($Content) })
  return ($w | Select-Object -First 1).ProcessId
}
function Stop-Worker([int]$id) {
  try { Stop-Process -Id $id -Force -ErrorAction Stop } catch {}
  Start-Sleep -Seconds 1
  Write-Host "  已停止 watch 进程（PID $id）"
}

Write-Step "1/4 导出公开子集（脱敏 + 审查报告；内部自带增量判断）"
$contentSigBefore = Get-TreeSig $Content
$exportArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Vault 'scripts\export-public.ps1'))
if ($Force) { $exportArgs += '-Force' }
$exportOut = & powershell.exe @exportArgs
$exportOut | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { throw "导出失败，中止发布" }
$exportRan = -not ($exportOut -match '跳过导出')
$exportSig = Get-TreeSig $Content
# 内容相对「导出前」是否真的变了（导出被跳过 → 内容未动 → 无需重建）
$contentChanged = $exportRan -and ($contentSigBefore -ne $exportSig)

Write-Step "2/4 同步站点自定义样式"
$src = Join-Path $Vault 'scripts\site-custom.scss'
$dst = Join-Path $Quartz 'quartz\styles\custom.scss'
# 只在内容变化时才覆盖：mtime 无谓变化会触发 worker 的源码监视，导致 hard rebuild 失败退出
if (Test-Path -LiteralPath $src) {
  if (-not (Test-Path -LiteralPath $dst) -or (Get-FileHash -LiteralPath $src).Hash -ne (Get-FileHash -LiteralPath $dst).Hash) {
    Copy-Item -LiteralPath $src -Destination $dst -Force
    Write-Host "  已应用 site-custom.scss（内容有变化）"
  } else {
    Write-Host "  site-custom.scss 无变化，跳过覆盖"
  }
} else {
  Write-Host "  未找到 site-custom.scss，保留 Quartz 现有样式" -ForegroundColor Yellow
}

# 站点自托管字体（阿里妈妈数黑体，标题字体）→ Quartz static，构建时随 public 发布
$fontSrc = Join-Path $Vault 'scripts\site-assets\AlimamaShuHeiTi-Bold.woff2'
$fontDstDir = Join-Path $Quartz 'quartz\static\font'
if (Test-Path -LiteralPath $fontSrc) {
  New-Item -ItemType Directory -Force -Path $fontDstDir | Out-Null
  $fontDst = Join-Path $fontDstDir 'AlimamaShuHeiTi-Bold.woff2'
  if (-not (Test-Path -LiteralPath $fontDst) -or (Get-FileHash -LiteralPath $fontSrc).Hash -ne (Get-FileHash -LiteralPath $fontDst).Hash) {
    Copy-Item -LiteralPath $fontSrc -Destination $fontDst -Force
    Write-Host "  已部署站点字体 AlimamaShuHeiTi-Bold.woff2（内容有变化）"
  } else {
    Write-Host "  站点字体无变化，跳过覆盖"
  }
} else {
  Write-Host "  未找到站点字体文件，标题将回退到系统字体" -ForegroundColor Yellow
}

# 站点自托管正文西文字体（Source Sans Pro latin 子集，site-custom.scss 的
# @font-face 按 static/font/source-sans-pro/<文件名> 引用）→ Quartz static
$sspSrcDir = Join-Path $Vault 'scripts\site-assets\source-sans-pro'
$sspDstDir = Join-Path $Quartz 'quartz\static\font\source-sans-pro'
if (Test-Path -LiteralPath $sspSrcDir) {
  New-Item -ItemType Directory -Force -Path $sspDstDir | Out-Null
  $sspCopied = $false
  foreach ($f in (Get-ChildItem -LiteralPath $sspSrcDir -Filter '*.woff2' -File)) {
    $dst = Join-Path $sspDstDir $f.Name
    if (-not (Test-Path -LiteralPath $dst) -or (Get-FileHash -LiteralPath $dst).Hash -ne (Get-FileHash -LiteralPath $f.FullName).Hash) {
      Copy-Item -LiteralPath $f.FullName -Destination $dst -Force
      $sspCopied = $true
    }
  }
  if ($sspCopied) { Write-Host "  已部署正文西文字体 Source Sans Pro（latin 子集 ×4）" }
  else { Write-Host "  Source Sans Pro 字体无变化，跳过覆盖" }
} else {
  Write-Host "  未找到 source-sans-pro 字体目录，正文西文将回退系统字体" -ForegroundColor Yellow
}

Write-Step "2.2/4 应用站点主题"
$ThemeName = 'claude-paper'    # 站点主题（@quartz-themes/core 的 theme 选项）
$CfgPath = Join-Path $Quartz 'quartz.config.yaml'
$cfgLines = @([System.IO.File]::ReadAllLines($CfgPath, [System.Text.Encoding]::UTF8))
# 检查主题块是否已正确：Quartz 构建时插件会往 config 回写自己的状态（无害漂移），
# 若只是字节差异就回写，mtime 变化会触发 worker 源码监视 → hard rebuild 失败退出。
# 因此只有主题字段真正缺失/错误时才写。
$inThemeBlock = $false
$hasEnabled = $false; $hasTheme = $false; $hasFonts = $false
foreach ($cl in $cfgLines) {
  if ($cl -match 'source:\s*"@quartz-themes/core"') { $inThemeBlock = $true; continue }
  if ($inThemeBlock -and $cl -match '^\s+-\s+source:') { $inThemeBlock = $false }
  if ($inThemeBlock) {
    if ($cl -match '^\s+enabled:\s*true\s*$') { $hasEnabled = $true }
    if ($cl -match "^\s+theme:\s*$ThemeName\s*$") { $hasTheme = $true }
    if ($cl -match '^\s+themeFonts:\s*true\s*$') { $hasFonts = $true }
  }
}
if ($hasEnabled -and $hasTheme -and $hasFonts) {
  Write-Host "  主题 = $ThemeName（配置已正确，跳过写入）"
} else {
  $cfgOut = New-Object System.Collections.ArrayList
  $inThemeBlock = $false
  foreach ($cl in $cfgLines) {
    if ($cl -match 'source:\s*"@quartz-themes/core"') { $inThemeBlock = $true; [void]$cfgOut.Add($cl); continue }
    if ($inThemeBlock -and $cl -match '^\s+-\s+source:') { $inThemeBlock = $false }
    if ($inThemeBlock) {
      if ($cl -match '^\s+enabled:') { [void]$cfgOut.Add('    enabled: true'); continue }
      if ($cl -match '^\s+theme:') { [void]$cfgOut.Add("      theme: $ThemeName"); continue }
      if ($cl -match '^\s+themeFonts:') { [void]$cfgOut.Add('      themeFonts: true'); continue }
    }
    [void]$cfgOut.Add($cl)
  }
  [System.IO.File]::WriteAllLines($CfgPath, $cfgOut, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "  主题 = $ThemeName（配置已修正写入）"
}

# ── 增量判断：导出内容与站点外观相对上次成功部署均无变化 → 跳过构建与部署 ──
# 注意：config 用仓库权威副本（scripts/quartz.config.yaml）而非站点上的活文件——
# Quartz 构建时 @quartz-themes 插件会回写活文件，若用它做信号，每次构建后哈希都变，永远无法命中增量
# 正文西文字体按目录聚合指纹（4 个 latin 子集 woff2，与 AlimamaShuHeiTi 同理要进信号）
$sspSig = ''
if (Test-Path -LiteralPath (Join-Path $Vault 'scripts\site-assets\source-sans-pro')) {
  $sspSig = ((Get-ChildItem -LiteralPath (Join-Path $Vault 'scripts\site-assets\source-sans-pro') -Filter '*.woff2' -File |
    Sort-Object Name | ForEach-Object { Get-FileSig $_.FullName }) -join ',')
}
$siteSig = Get-StringHash (@(
  (Get-FileSig (Join-Path $Vault 'scripts\site-custom.scss')),
  # 构建后改写脚本也会改变产物：不进指纹的话「只改脚本」会被增量判断当成无变化
  (Get-FileSig (Join-Path $Vault 'scripts\build-section-nav.cjs')),
  (Get-FileSig (Join-Path $Vault 'scripts\enhance-content.cjs')),
  (Get-FileSig (Join-Path $Vault 'scripts\fix-html-emphasis.cjs')),
  (Get-FileSig (Join-Path $Vault 'scripts\site-assets\AlimamaShuHeiTi-Bold.woff2')),
  $sspSig,
  (Get-FileSig (Join-Path $Vault 'scripts\quartz.config.yaml')),
  $ThemeName
) -join '|')
$pub = Load-PubState
$siteSigChanged = (-not $pub) -or ($pub.siteSig -ne $siteSig)
if (-not $Force -and -not $Serve) {
  if ($pub) {
    Write-Host ("  增量比对：exportSig {0}，siteSig {1}" -f ($(if ($pub.exportSig -eq $exportSig) { '一致' } else { '变化' })), ($(if ($pub.siteSig -eq $siteSig) { '一致' } else { '变化' })))
  }
  if ($pub -and $pub.exportSig -eq $exportSig -and $pub.siteSig -eq $siteSig) {
    Write-Host ""
    Write-Host "✅ 导出内容与站点样式相对上次发布（$($pub.deployedAt)）均无变化，跳过构建与部署" -ForegroundColor Green
    Write-Host "   如需强制重新发布，请加 -Force"
    exit 0
  }
}

Write-Step "2.5/4 校验 frontmatter（YAML 不合法会让构建整体失败）"
$checker = Join-Path $Vault 'scripts\check-yaml.cjs'
if (Test-Path -LiteralPath $checker) {
  $out = (& $Node $checker $Content 2>&1 | Out-String)
  ($out -split "`r?`n") | Where-Object { $_ -match '文件总数|frontmatter' } | ForEach-Object { Write-Host "  $($_.Trim())" }
  if ($out -match 'frontmatter 出错\s*=\s*[1-9]') { throw "导出内容存在 frontmatter 错误，中止构建" }
} else {
  Write-Host "  未找到 check-yaml.cjs，跳过校验" -ForegroundColor Yellow
}
Write-Step "3/4 Quartz 构建（前台全量，确定性优先）"
Push-Location $Quartz
try {
  if ($Serve) {
    $wid = Find-WorkerPid
    if ($wid) { Stop-Worker $wid }
    Write-Host "  构建后启动本地预览：http://localhost:$PreviewPort" -ForegroundColor Green
    & $Node 'quartz/bootstrap-cli.mjs' build -d $Content --serve --port $PreviewPort
    exit 0
  }
  # 构建指纹：public 是否对应「当前 content」以此为准——
  # 只看本次导出是否有变是不够的（如上次导出失败、构建用的是旧内容）
  $BuildSigPath = Join-Path $SiteRoot '.build-sig'
  $buildSig = if (Test-Path -LiteralPath $BuildSigPath) { (Get-Content -LiteralPath $BuildSigPath -Raw -Encoding UTF8).Trim() } else { '' }
  $publicIndex = Join-Path $Quartz 'public\index.html'
  $needBuild = $Force -or $siteSigChanged -or ($exportSig -ne $buildSig) -or (-not (Test-Path -LiteralPath $publicIndex))
  if (-not $needBuild) {
    Write-Host "  public/ 与 content 指纹一致，跳过构建"
  } else {
    # 2026-10-25 起一律前台全量构建，不再走「常驻 worker + --watch 增量」：
    # 探针实验两度复现 chokidar 对 content 新增 .md 的 add 事件不可靠（写入 90s
    # 内不触发任何 rebuild，新页面不进产物），且 watch 增量因 changesSinceLastBuild
    # 只增不清而退化成全量 parse（909 文件/40s + emit 3-4 分钟），速度也不再占优。
    # 前台全量约 4 分钟，结果确定；新鲜度/尾随重建的竞态也随之消失。
    $wid = Find-WorkerPid
    if ($wid) { Stop-Worker $wid }
    Write-Host "  前台全量构建（约 4 分钟）..."
    & $Node 'quartz/bootstrap-cli.mjs' build -d $Content
    if ($LASTEXITCODE -ne 0) { throw "构建失败，中止发布" }
    Set-Content -LiteralPath $BuildSigPath -Value $exportSig -Encoding UTF8
  }
  # 产物完整性校验：绝不允许把残缺构建部署上线
  $PublicDir = Join-Path $Quartz 'public'
  if (-not (Test-Path -LiteralPath (Join-Path $PublicDir 'index.html'))) {
    throw "构建产物缺少 index.html，中止发布（检查是否有其它进程并发写入 public）"
  }
  $built = @(Get-ChildItem -LiteralPath $PublicDir -Recurse -File -Force)
  if ($built.Count -lt 1000) {
    throw "构建产物仅 $($built.Count) 个文件，明显不完整，中止发布"
  }
  Write-Host "  产物校验通过：$($built.Count) 个文件 / $([math]::Round((($built | Measure-Object Length -Sum).Sum)/1MB,2)) MB"

  # 覆盖校验（2026-10-25 漏页事故后新增的确定性闸门）：content 里每个 .md 都必须在
  # public 有对应页面。slug 规则（实测与站点 URL 一致）：路径逐段小写化、空格转 '-'、
  # 其余字符原样保留；_index.md 与「与父目录同名的 .md」产出父目录的 index.html。
  # 缺失任何一个页面都按残缺产物中止——宁可误报（人工排查一次），不可漏报（残缺上线）。
  $contentMd = @(Get-ChildItem -LiteralPath $Content -Recurse -File -Filter *.md -Force)
  $missingPages = @()
  foreach ($f in $contentMd) {
    $rel = $f.FullName.Substring($Content.Length + 1)
    $parts = @($rel -split '[\\/]' | ForEach-Object { $_.ToLower() -replace ' ', '-' })
    $stem = [IO.Path]::GetFileNameWithoutExtension($parts[-1])
    if ($parts.Count -ge 2 -and ($stem -eq '_index' -or $stem -eq $parts[-2])) {
      $expected = Join-Path $PublicDir ((($parts[0..($parts.Count-2)]) -join '\') + '\index.html')
    } else {
      $parts[-1] = $stem
      $expected = Join-Path $PublicDir ((($parts -join '\') + '.html'))
    }
    if (-not (Test-Path -LiteralPath $expected)) { $missingPages += $rel }
  }
  if ($missingPages.Count -gt 0) {
    $sample = ($missingPages | Select-Object -First 5) -join '；'
    throw "产物缺少 $($missingPages.Count)/$($contentMd.Count) 个页面（如 $sample），中止部署。构建不完整——请检查上方构建日志，或用 -Force 重试"
  }
  Write-Host "  覆盖校验通过：content 的 $($contentMd.Count) 个 .md 均有对应页面"

  # 强调兜底：中文标点紧贴 ** 时 CommonMark 会吐字面星号；导出层只按 flanking 判定，
  # 覆盖不到「分隔符栈 / rule of three / 与 $公式$ 交互」这类解析器层面的失效。
  # 所以再在构建产物上收口一次：产物里还能看到的字面 ** 就是坏的，直接换成 <strong>。
  $emphHtmlFixer = Join-Path $Vault 'scripts\fix-html-emphasis.cjs'
  if (Test-Path -LiteralPath $emphHtmlFixer) {
    $o = (& $Node $emphHtmlFixer $PublicDir 2>&1 | Out-String)
    ($o -split "`r?`n") | Where-Object { $_ -match '扫描|Error' } | ForEach-Object { Write-Host "  $($_.Trim())" }
  } else {
    Write-Host "  未找到 fix-html-emphasis.cjs，跳过强调兜底" -ForegroundColor Yellow
  }

  # 内容增强：测验（callout → 可点选、纯 CSS 判分）与文末上一课/下一课导航卡。
  # 放在强调兜底之后：它依赖 <strong>Q1.…</strong> 已经正确生成。
  # Quartz 没有这两个插槽，改 layout/components 要维护 fork；在产物上改写零维护。
  $enhancer = Join-Path $Vault 'scripts\enhance-content.cjs'
  if (Test-Path -LiteralPath $enhancer) {
    $o = (& $Node $enhancer $PublicDir 2>&1 | Out-String)
    ($o -split "`r?`n") | Where-Object { $_ -match 'enhance|Error' } | ForEach-Object { Write-Host "  $($_.Trim())" }
  } else {
    Write-Host "  未找到 enhance-content.cjs，跳过内容增强" -ForegroundColor Yellow
  }

  # 分区导航：顶栏放一级目录，左栏只显示当前一级的「卷 + 条目」。
  # Quartz 的探索树是客户端渲染的一整棵树，样式层没法过滤出当前分支，所以同样在产物上生成。
  $sectionNav = Join-Path $Vault 'scripts\build-section-nav.cjs'
  if (Test-Path -LiteralPath $sectionNav) {
    $o = (& $Node $sectionNav $PublicDir 2>&1 | Out-String)
    ($o -split "`r?`n") | Where-Object { $_ -match 'section-nav|Error' } | ForEach-Object { Write-Host "  $($_.Trim())" }
  } else {
    Write-Host "  未找到 build-section-nav.cjs，跳过分区导航" -ForegroundColor Yellow
  }
} finally { Pop-Location }

Write-Step "4/4 部署到 Cloudflare Pages"
if ($SkipDeploy) {
  Write-Host "  已跳过部署（-SkipDeploy）" -ForegroundColor Yellow
  Write-Host "  产物：$(Join-Path $Quartz 'public')"
  exit 0
}
& $Node $Wrangler pages deploy (Join-Path $Quartz 'public') --project-name $ProjectName --branch main --commit-dirty=true
if ($LASTEXITCODE -ne 0) { throw "部署失败" }

# 记录发布状态（仅在部署成功后写入，作为下次增量判断的基准）
Save-PubState $exportSig $siteSig

Write-Host ""
Write-Host "✅ 发布完成：https://$ProjectName.pages.dev" -ForegroundColor Green
