# backup-vaults.ps1 — 双仓库自动备份（不依赖 Obsidian）
# 由计划任务 ObsidianVaultBackup 在「每 30 分钟」与「每次登录」时触发
# 日志：E:\Obsidian\_backup\backup.log
$ErrorActionPreference = 'Continue'

# 禁止 git 弹出凭据提示：否则脚本会永久挂起等待输入
$env:GIT_TERMINAL_PROMPT = '0'
$env:GCM_INTERACTIVE     = 'never'
$env:GIT_ASKPASS         = 'echo'

$log = 'E:\Obsidian\_backup\backup.log'
$logDir = Split-Path $log -Parent
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
if ((Test-Path -LiteralPath $log) -and ((Get-Item -LiteralPath $log).Length -gt 1MB)) {
  Move-Item -LiteralPath $log -Destination "$log.1" -Force
}
function Write-Log([string]$m) {
  Add-Content -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" -Encoding utf8
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$repos = @(
  @{ Path = 'E:\Obsidian\wuhy80_new';     Name = '主库';   Msg = "自动备份: $stamp" },
  @{ Path = 'E:\Obsidian\wuhy80_private'; Name = '私密库'; Msg = "私密备份: $stamp" }
)

foreach ($r in $repos) {
  if (-not (Test-Path -LiteralPath $r.Path)) { Write-Log "$($r.Name): 路径不存在，跳过"; continue }
  Push-Location $r.Path
  try {
    # 合并 / 变基进行中时不要提交，避免把中间状态固化
    if ((Test-Path -LiteralPath (Join-Path $r.Path '.git\MERGE_HEAD')) -or
        (Test-Path -LiteralPath (Join-Path $r.Path '.git\rebase-merge'))) {
      Write-Log "$($r.Name): 检测到未完成的合并/变基，跳过"
      continue
    }

    git add -A 2>&1 | Out-Null
    $pending = @(git status --porcelain 2>$null)
    if ($pending.Count -gt 0) {
      git commit -m $r.Msg 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { Write-Log "$($r.Name): 已提交 $($pending.Count) 项改动" }
      else { Write-Log "$($r.Name): 提交失败" }
    } else {
      Write-Log "$($r.Name): 无改动"
    }

    # 刻意不带显式 refspec：让 remote.<name>.push 里的分支映射（master -> main）生效
    foreach ($remote in @(git remote 2>$null)) {
      $ok = $false; $err = ''
      for ($i = 1; $i -le 2; $i++) {
        $out = (git push $remote 2>&1 | Out-String)
        if ($LASTEXITCODE -eq 0) { $ok = $true; break }
        $lines = @(($out -split "`r?`n") | Where-Object { $_.Trim() })
        $key = $lines | Where-Object { $_ -match 'Permission denied|Authentication failed|fatal:|error:|rejected|non-fast-forward' } | Select-Object -First 1
        $err = if ($key) { $key.Trim() } else { ($lines | Select-Object -First 1).Trim() }
        $err = $err -replace '^(git|git\.exe)\s*:\s*', ''
        Start-Sleep -Seconds 3
      }
      Write-Log "$($r.Name): push $remote -> $(if ($ok) { '成功' } else { "失败: $err" })"
    }
  } finally { Pop-Location }
}