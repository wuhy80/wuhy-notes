# try-themes.ps1 — 把若干候选主题各构建一次，部署到独立预览分支，方便对比挑选
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts\try-themes.ps1
#       预览地址：https://theme-<主题名>.wuhy-notes.pages.dev
#       跑完后会把主题插件恢复为禁用状态，不影响线上正式站点
param(
  [string[]]$Themes = @('minimal', 'github-theme', 'notion-style', 'claude-paper', 'catppuccin')
)

$ErrorActionPreference = 'Continue'   # 构建时的 LaTeX/stderr 警告不应终止脚本，改用退出码判断成败
$env:WRANGLER_SEND_METRICS = 'false'

# 知识库根目录 = 本脚本所在 scripts/ 的上一级（不再写死任何绝对路径）
$Vault    = Split-Path $PSScriptRoot -Parent
$SiteRoot = 'E:\Obsidian\public-site'
$Quartz   = Join-Path $SiteRoot 'quartz'
$Content  = Join-Path $SiteRoot 'content'
$Node     = 'C:\nvm4w\nodejs\node.exe'
$Wrangler = 'C:\nvm4w\nodejs\node_modules\wrangler\bin\wrangler.js'
$ProjectName = 'wuhy-notes'
$Cfg = Join-Path $Quartz 'quartz.config.yaml'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# 只在 @quartz-themes/core 这一块内改 enabled / theme，避免误伤 syntax-highlighting 的 theme 选项
function Set-ThemeConfig([string]$name, [bool]$enable) {
  $lines = @([System.IO.File]::ReadAllLines($Cfg, [System.Text.Encoding]::UTF8))
  $out = New-Object System.Collections.ArrayList
  $inBlock = $false
  $themeFound = $false
  foreach ($l in $lines) {
    if ($l -match 'source:\s*"@quartz-themes/core"') { $inBlock = $true; [void]$out.Add($l); continue }
    if ($inBlock -and $l -match '^\s+-\s+source:') { $inBlock = $false }
    if ($inBlock) {
      if ($l -match '^\s+enabled:') { [void]$out.Add("    enabled: $(if ($enable) { 'true' } else { 'false' })"); continue }
      if ($l -match '^\s+theme:') {
        [void]$out.Add("      theme: $name")
        $themeFound = $true
        continue
      }
      if ($l -match '^\s+themeFonts:') { [void]$out.Add('      themeFonts: true'); continue }
    }
    [void]$out.Add($l)
  }
  [System.IO.File]::WriteAllLines($Cfg, $out, $utf8)
  return $themeFound
}

function Get-SafeBranch([string]$theme) { return ('theme-' + ($theme -replace '[^a-zA-Z0-9\-]', '-')) }

[void](Set-ThemeConfig 'tokyo-night' $false)   # 先复位，避免上次中断留下脏配置

Write-Host "=== 1. 导出内容（含脱敏）+ 同步自定义样式 ===" -ForegroundColor Cyan
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Vault 'scripts\export-public.ps1')
if ($LASTEXITCODE -ne 0) { throw "导出失败" }
Copy-Item -LiteralPath (Join-Path $Vault 'scripts\site-custom.scss') -Destination (Join-Path $Quartz 'quartz\styles\custom.scss') -Force

$results = @()
foreach ($t in $Themes) {
  Write-Host ""
  Write-Host "=== 主题：$t ===" -ForegroundColor Cyan
  $found = Set-ThemeConfig $t $true
  if (-not $found) { Write-Host "  ⚠️ 配置里没找到 theme 行，跳过" -ForegroundColor Yellow; continue }

  Push-Location $Quartz
  try {
    & $Node 'quartz/bootstrap-cli.mjs' build -d $Content 2>&1 | Select-String -Pattern 'Emitted|Done processing|error|Error' | ForEach-Object { "  $($_.Line.Trim())" }
    $buildOk = ($LASTEXITCODE -eq 0)
  } finally { Pop-Location }

  if (-not $buildOk) { Write-Host "  ❌ 构建失败，跳过该主题" -ForegroundColor Red; continue }

  $pub = Join-Path $Quartz 'public'
  $files = @(Get-ChildItem -LiteralPath $pub -Recurse -File -Force)
  $mb = [math]::Round((($files | Measure-Object Length -Sum).Sum) / 1MB, 2)
  Write-Host "  产物 $($files.Count) 个文件 / $mb MB"

  $branch = Get-SafeBranch $t
  & $Node $Wrangler pages deploy $pub --project-name $ProjectName --branch $branch --commit-dirty=true 2>&1 |
    Select-String -Pattern 'Uploaded|Deployment complete|error' | ForEach-Object { "  $($_.Line.Trim())" }

  $url = "https://$branch.$ProjectName.pages.dev"
  Write-Host "  预览：$url" -ForegroundColor Green
  $results += [pscustomobject]@{ Theme = $t; Url = $url; Files = $files.Count; MB = $mb }
}

Write-Host ""
Write-Host "=== 恢复：主题插件改回禁用（不影响正式站）===" -ForegroundColor Cyan
[void](Set-ThemeConfig 'tokyo-night' $false)

Write-Host ""
Write-Host "=== 预览地址汇总 ===" -ForegroundColor Green
$results | ForEach-Object { "  {0,-16} {1}" -f $_.Theme, $_.Url }
Write-Host ""
Write-Host "选定后告诉我主题名，我把它设为正式样式。" -ForegroundColor Green
