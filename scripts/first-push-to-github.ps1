# first-push-to-github.ps1 — 首次把两个仓库推送到 GitHub
# 传输方式：HTTPS + GCM 中已存的 GitHub 令牌（无需 SSH 公钥）
# 策略：小库先推验证链路；大库分段推送（先推历史中点，再推增量），失败自动重试
$ErrorActionPreference = 'Continue'
$env:GIT_TERMINAL_PROMPT      = '0'
$env:GCM_INTERACTIVE          = 'never'
$env:GIT_HTTP_LOW_SPEED_LIMIT = '1000'
$env:GIT_HTTP_LOW_SPEED_TIME  = '25'

$main = 'E:\Obsidian\wuhy80_new'
$priv = 'E:\Obsidian\wuhy80_private'
$logf = 'E:\Obsidian\_backup\first-push.log'

function Write-Log([string]$m) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m"
  Write-Host $line
  Add-Content -LiteralPath $logf -Value $line -Encoding utf8
}

function Push-WithRetry([string]$repo, [string]$refspec, [int]$tries = 8) {
  for ($i = 1; $i -le $tries; $i++) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $out = (git -C $repo push --force github $refspec 2>&1 | Out-String)
    $sw.Stop()
    $secs = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    if ($LASTEXITCODE -eq 0) { Write-Log "  成功：$refspec（第 $i 次，$secs 秒）"; return $true }
    $line = (($out -split "`r?`n") | Where-Object { $_ -match 'fatal|denied|rejected|error' } | Select-Object -First 1)
    Write-Log "  失败：$refspec（第 $i 次，$secs 秒）-> $line"
    Start-Sleep -Seconds 20
  }
  return $false
}

Write-Log "=== 首次推送开始 ==="
Write-Log "私密库（1.7 MB）"
Push-WithRetry $priv 'master:main' | Out-Null

Write-Log "主库（约 243 MB，分段推送）"
$list = @(git -C $main rev-list --reverse master)
$mid  = $list[[int]($list.Count / 2)]
Write-Log "  历史共 $($list.Count) 个提交，先推中间点 $mid"
Push-WithRetry $main "$($mid):main" | Out-Null
Push-WithRetry $main 'master:main' | Out-Null

Write-Log "=== 远程分支核对 ==="
foreach ($p in @(@{P = $priv; N = '私密库' }, @{P = $main; N = '主库' })) {
  $r = (git -C $p.P ls-remote --heads github 2>&1 | Out-String)
  Write-Log "  $($p.N): $((($r -split "`r?`n") | Where-Object { $_.Trim() }) -join ' | ')"
}
Write-Log "=== 结束 ==="