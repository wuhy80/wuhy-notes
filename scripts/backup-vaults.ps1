# backup-vaults.ps1 — 双仓库自动同步（不依赖 Obsidian）
# 流程：提交本地改动 → fetch → pull --ff-only（只允许快进）→ push 到所有远程
# 由计划任务 ObsidianVaultBackup 在「每 30 分钟」与「每次登录」时触发
# 日志：E:\Obsidian\_backup\backup.log
$ErrorActionPreference = 'Continue'

# 禁止 git 弹出凭据提示；并给 HTTP 传输加强保护，避免无人值守时长时间挂起
$env:GIT_TERMINAL_PROMPT      = '0'
$env:GCM_INTERACTIVE          = 'never'
$env:GIT_ASKPASS              = 'echo'
$env:GIT_HTTP_LOW_SPEED_LIMIT = '1000'
$env:GIT_HTTP_LOW_SPEED_TIME  = '25'

$log = 'E:\Obsidian\_backup\backup.log'
$logDir = Split-Path $log -Parent
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
if ((Test-Path -LiteralPath $log) -and ((Get-Item -LiteralPath $log).Length -gt 1MB)) {
  Move-Item -LiteralPath $log -Destination "$log.1" -Force
}
function Write-Log([string]$m) {
  Add-Content -LiteralPath $log -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" -Encoding utf8
}
function First-KeyLine([string]$text, [string]$pattern) {
  $lines = @(($text -split "`r?`n") | Where-Object { $_.Trim() })
  $key = $lines | Where-Object { $_ -match $pattern } | Select-Object -First 1
  if (-not $key) { $key = $lines | Select-Object -First 1 }
  return (($key -replace '^(git|git\.exe)\s*:\s*', '').Trim())
}

# 主库 = 本脚本所在 scripts/ 的上一级；不再回退到写死的旧路径（猜错库比报错危险）
$DefaultMain = Split-Path $PSScriptRoot -Parent
if (-not $env:VAULT_DIR -and -not (Test-Path -LiteralPath $DefaultMain)) {
  throw "无法确定主库目录（$DefaultMain 不存在）。请把脚本放在 <知识库>\scripts\ 下，或用 VAULT_DIR 指定。"
}
$MainPath = if ($env:VAULT_DIR) { $env:VAULT_DIR } else { $DefaultMain }
$PrivatePath = if ($env:PRIVATE_VAULT_DIR) { $env:PRIVATE_VAULT_DIR } else { 'E:\Obsidian\wuhy80_private' }

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
# Sync = 用于拉取的远程（优先检测 origin 或 github）
$repos = @(
  @{ Path = $MainPath;    Name = '主库';   Msg = "自动备份: $stamp"; Sync = 'origin'; Branch = 'main' },
  @{ Path = $PrivatePath; Name = '私密库'; Msg = "私密备份: $stamp"; Sync = 'github'; Branch = 'main' }
)

foreach ($r in $repos) {
  if (-not (Test-Path -LiteralPath $r.Path)) { Write-Log "$($r.Name): 路径不存在，跳过"; continue }
  Push-Location $r.Path
  try {
    if ((Test-Path -LiteralPath (Join-Path $r.Path '.git\MERGE_HEAD')) -or
        (Test-Path -LiteralPath (Join-Path $r.Path '.git\rebase-merge'))) {
      Write-Log "$($r.Name): 检测到未完成的合并/变基，跳过"; continue
    }

    # 1) 提交本地改动，保证拉取时工作区干净
    git add -A 2>&1 | Out-Null
    $pending = @(git status --porcelain 2>$null)
    if ($pending.Count -gt 0) {
      git commit -m $r.Msg 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { Write-Log "$($r.Name): 已提交 $($pending.Count) 项改动" }
      else { Write-Log "$($r.Name): 提交失败" }
    } else { Write-Log "$($r.Name): 无改动" }

    # 2) 探测可用远程并 fetch + pull --ff-only
    $remotes = @(git remote 2>$null)
    $syncRemote = if ($remotes -contains $r.Sync) { $r.Sync } elseif ($remotes -contains 'origin') { 'origin' } elseif ($remotes -contains 'github') { 'github' } else { $remotes | Select-Object -First 1 }
    if (-not $syncRemote) { Write-Log "$($r.Name): 未配置任何远程仓库，跳过"; continue }

    $fetchOut = (git fetch $syncRemote 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
      Write-Log "$($r.Name): fetch 失败 -> $(First-KeyLine $fetchOut 'fatal|error|denied')"
    } else {
      $pullOut = (git pull --ff-only $syncRemote $r.Branch 2>&1 | Out-String)
      if ($LASTEXITCODE -ne 0) {
        $pulled = First-KeyLine $pullOut 'fatal|error|diverg|reject|unable to access'
        if ($pulled -match 'unable to access|Failed to connect|Could not resolve|timed out|too slow|Connection') {
          Write-Log "$($r.Name): 拉取失败（网络问题），仍尝试推送 -> $pulled"
        } else {
          Write-Log "$($r.Name): 无法快进（与其他机器分叉），本次跳过推送，需人工处理 -> $pulled"
          continue
        }
      } else {
        Write-Log "$($r.Name): 已从 $($syncRemote)/$($r.Branch) 同步"
      }
    }

    # 3) 推送到所有远程（不做 force）
    foreach ($remote in @(git remote 2>$null)) {
      $ok = $false; $err = ''
      for ($i = 1; $i -le 2; $i++) {
        $out = (git push $remote 2>&1 | Out-String)
        if ($LASTEXITCODE -eq 0) { $ok = $true; break }
        $err = First-KeyLine $out 'Permission denied|Authentication failed|fatal:|error:|rejected|non-fast-forward|would be overwritten'
        Start-Sleep -Seconds 3
      }
      Write-Log "$($r.Name): push $remote -> $(if ($ok) { '成功' } else { "失败: $err" })"
    }
  } finally { Pop-Location }
}