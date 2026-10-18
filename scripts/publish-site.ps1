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

$DefaultVault = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path -LiteralPath $DefaultVault)) { $DefaultVault = 'E:\Obsidian\wuhy80_new' }
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

Write-Step "0/4 前置检查：确认没有并发的 Quartz 构建/预览进程"
$serving = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'bootstrap-cli\.mjs' })
if ($serving.Count -gt 0) {
  $pids = ($serving | ForEach-Object { $_.ProcessId }) -join ', '
  throw "检测到 Quartz 构建/预览进程仍在运行（PID $pids）。两者会并发写入 public/ 导致产物损坏，请先停止本地预览服务器再发布。"
}
Write-Host "  无并发进程，可以安全构建"

Write-Step "1/4 导出公开子集（脱敏 + 审查报告；内部自带增量判断）"
$exportArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Vault 'scripts\export-public.ps1'))
if ($Force) { $exportArgs += '-Force' }
& powershell.exe @exportArgs
if ($LASTEXITCODE -ne 0) { throw "导出失败，中止发布" }
$exportSig = Get-TreeSig $Content

Write-Step "2/4 同步站点自定义样式"
$src = Join-Path $Vault 'scripts\site-custom.scss'
$dst = Join-Path $Quartz 'quartz\styles\custom.scss'
if (Test-Path -LiteralPath $src) {
  Copy-Item -LiteralPath $src -Destination $dst -Force
  Write-Host "  已应用 site-custom.scss"
} else {
  Write-Host "  未找到 site-custom.scss，保留 Quartz 现有样式" -ForegroundColor Yellow
}

# 站点自托管字体（阿里妈妈数黑体，标题字体）→ Quartz static，构建时随 public 发布
$fontSrc = Join-Path $Vault 'scripts\site-assets\AlimamaShuHeiTi-Bold.woff2'
$fontDstDir = Join-Path $Quartz 'quartz\static\font'
if (Test-Path -LiteralPath $fontSrc) {
  New-Item -ItemType Directory -Force -Path $fontDstDir | Out-Null
  Copy-Item -LiteralPath $fontSrc -Destination (Join-Path $fontDstDir 'AlimamaShuHeiTi-Bold.woff2') -Force
  Write-Host "  已部署站点字体 AlimamaShuHeiTi-Bold.woff2"
} else {
  Write-Host "  未找到站点字体文件，标题将回退到系统字体" -ForegroundColor Yellow
}

Write-Step "2.2/4 应用站点主题"
$ThemeName = 'claude-paper'    # 站点主题（@quartz-themes/core 的 theme 选项）
$CfgPath = Join-Path $Quartz 'quartz.config.yaml'
$cfgLines = @([System.IO.File]::ReadAllLines($CfgPath, [System.Text.Encoding]::UTF8))
$cfgOut = New-Object System.Collections.ArrayList
$inThemeBlock = $false
$themeFound = $false
foreach ($cl in $cfgLines) {
  if ($cl -match 'source:\s*"@quartz-themes/core"') { $inThemeBlock = $true; [void]$cfgOut.Add($cl); continue }
  if ($inThemeBlock -and $cl -match '^\s+-\s+source:') { $inThemeBlock = $false }
  if ($inThemeBlock) {
    if ($cl -match '^\s+enabled:') { [void]$cfgOut.Add('    enabled: true'); continue }
    if ($cl -match '^\s+theme:') { [void]$cfgOut.Add("      theme: $ThemeName"); $themeFound = $true; continue }
    if ($cl -match '^\s+themeFonts:') { [void]$cfgOut.Add('      themeFonts: true'); continue }
  }
  [void]$cfgOut.Add($cl)
}
[System.IO.File]::WriteAllLines($CfgPath, $cfgOut, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "  主题 = $ThemeName（配置中找到 theme 行: $themeFound）"

# ── 增量判断：导出内容与站点外观相对上次成功部署均无变化 → 跳过构建与部署 ──
# 注意：config 用仓库权威副本（scripts/quartz.config.yaml）而非站点上的活文件——
# Quartz 构建时 @quartz-themes 插件会回写活文件，若用它做信号，每次构建后哈希都变，永远无法命中增量
$siteSig = Get-StringHash (@(
  (Get-FileSig (Join-Path $Vault 'scripts\site-custom.scss')),
  (Get-FileSig (Join-Path $Vault 'scripts\site-assets\AlimamaShuHeiTi-Bold.woff2')),
  (Get-FileSig (Join-Path $Vault 'scripts\quartz.config.yaml')),
  $ThemeName
) -join '|')
if (-not $Force -and -not $Serve) {
  $pub = Load-PubState
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
Write-Step "3/4 Quartz 构建"
Push-Location $Quartz
try {
  if ($Serve) {
    Write-Host "  构建后启动本地预览：http://localhost:$PreviewPort" -ForegroundColor Green
    & $Node 'quartz/bootstrap-cli.mjs' build -d $Content --serve --port $PreviewPort
    exit 0
  }
  & $Node 'quartz/bootstrap-cli.mjs' build -d $Content
  if ($LASTEXITCODE -ne 0) { throw "构建失败，中止发布" }
} finally { Pop-Location }

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
