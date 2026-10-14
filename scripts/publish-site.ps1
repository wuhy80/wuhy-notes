# publish-site.ps1 — 一键发布技术笔记展示站
# 流程：导出公开子集（含脱敏与审查报告）→ 同步站点自定义样式 → Quartz 构建 → 部署到 Cloudflare Pages
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File E:\Obsidian\wuhy80_new\scripts\publish-site.ps1
#       加 -SkipDeploy 只本地构建不部署；加 -Serve 构建后启动本地预览（端口 8765）
param(
  [switch]$SkipDeploy,
  [switch]$Serve
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
$Vault    = Get-EnvOr 'VAULT_DIR'   (if (Test-Path -LiteralPath $DefaultVault) { $DefaultVault } else { 'E:\Obsidian\wuhy80_new' })
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

Write-Step "0/4 前置检查：确认没有并发的 Quartz 构建/预览进程"
$serving = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match 'bootstrap-cli\.mjs' })
if ($serving.Count -gt 0) {
  $pids = ($serving | ForEach-Object { $_.ProcessId }) -join ', '
  throw "检测到 Quartz 构建/预览进程仍在运行（PID $pids）。两者会并发写入 public/ 导致产物损坏，请先停止本地预览服务器再发布。"
}
Write-Host "  无并发进程，可以安全构建"

Write-Step "1/4 导出公开子集（脱敏 + 审查报告）"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Vault 'scripts\export-public.ps1')
if ($LASTEXITCODE -ne 0) { throw "导出失败，中止发布" }

Write-Step "2/4 同步站点自定义样式"
$src = Join-Path $Vault 'scripts\site-custom.scss'
$dst = Join-Path $Quartz 'quartz\styles\custom.scss'
if (Test-Path -LiteralPath $src) {
  Copy-Item -LiteralPath $src -Destination $dst -Force
  Write-Host "  已应用 site-custom.scss"
} else {
  Write-Host "  未找到 site-custom.scss，保留 Quartz 现有样式" -ForegroundColor Yellow
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

Write-Host ""
Write-Host "✅ 发布完成：https://$ProjectName.pages.dev" -ForegroundColor Green
