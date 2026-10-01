# first-push-to-github.ps1 — 首次把两个仓库推送到 GitHub（分段推送 + 重试）
# 前提：1) 公钥已加到 GitHub   2) 私有仓库 wuhy80/obsidian-private 已创建
$ErrorActionPreference = 'Continue'
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE     = 'never'

$main = 'E:\Obsidian\wuhy80_new'
$priv = 'E:\Obsidian\wuhy80_private'

function Push-WithRetry([string]$repo, [string]$remote, [string]$refspec, [int]$tries = 5) {
  for ($i = 1; $i -le $tries; $i++) {
    $out = (git -C $repo push --force $remote $refspec 2>&1 | Out-String)
    if ($LASTEXITCODE -eq 0) { Write-Host "  成功（第 $i 次尝试）" -ForegroundColor Green; return $true }
    $lines = @(($out -split "`r?`n") | Where-Object { $_.Trim() })
    $key = $lines | Where-Object { $_ -match 'Permission denied|Authentication failed|fatal:|error:|rejected' } | Select-Object -First 1
    Write-Host "  第 $i 次失败：$(if ($key) { $key.Trim() } else { ($lines | Select-Object -First 1) })" -ForegroundColor Yellow
    Start-Sleep -Seconds 10
  }
  return $false
}

Write-Host "=== 0. 前置检查 ===" -ForegroundColor Cyan
$sshOut = (ssh -T -o BatchMode=yes -o ConnectTimeout=20 git@github.com 2>&1 | Out-String)
if ($sshOut -match 'successfully authenticated|Hi ') {
  Write-Host "SSH 认证：可用" -ForegroundColor Green
} else {
  Write-Host "SSH 认证：不可用 —— 请先把公钥加到 GitHub" -ForegroundColor Red
  exit 1
}

Write-Host "=== 1. 私密库（1.7 MB，先推它验证链路）===" -ForegroundColor Cyan
Push-WithRetry $priv 'github' 'master:main' | Out-Null

Write-Host "=== 2. 主库（243 MB，分段推送降低单次传输量）===" -ForegroundColor Cyan
$list = @(git -C $main rev-list --reverse master)
$count = $list.Count
$mid = $list[[int]($count / 2)]
Write-Host "  历史共 $count 个提交，先推中间点 $mid"
Push-WithRetry $main 'github' "$($mid):main" | Out-Null
Push-WithRetry $main 'github' 'master:main' | Out-Null

Write-Host "=== 3. 结果核对 ===" -ForegroundColor Cyan
Write-Host "-- 主库远程分支 --"
git -C $main ls-remote --heads github 2>&1 | Select-Object -First 3
Write-Host "-- 私密库远程分支 --"
git -C $priv ls-remote --heads github 2>&1 | Select-Object -First 3
Write-Host "完成。之后由计划任务 ObsidianVaultBackup 自动推送。" -ForegroundColor Green