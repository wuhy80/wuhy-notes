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

$Vault    = 'E:\Obsidian\wuhy80_new'
$SiteRoot = 'E:\Obsidian\public-site'
$Quartz   = Join-Path $SiteRoot 'quartz'
$Content  = Join-Path $SiteRoot 'content'
$Node     = 'C:\nvm4w\nodejs\node.exe'
$Wrangler = 'C:\nvm4w\nodejs\node_modules\wrangler\bin\wrangler.js'

# Cloudflare Pages 项目名（决定网址 https://<项目名>.pages.dev）
$ProjectName = 'wuhy-notes'
$PreviewPort = 8765   # 注意：不要用 8080，它落在 Windows 保留端口范围，会 EACCES

function Write-Step([string]$t) {
  Write-Host ""
  Write-Host "=== $t ===" -ForegroundColor Cyan
}

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
