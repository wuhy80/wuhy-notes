# check-links.ps1 — 批量检测 URL 存活
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check-links.ps1 -UrlFile <文件> -OutFile <csv>
# 说明：先用 HEAD(k- L 跟随跳转)，非 2xx/3xx 再用 GET 取前 2KB 复测，
#       避免把「不支持 HEAD」误判为失效。
param(
  [Parameter(Mandatory = $true)][string]$UrlFile,
  [Parameter(Mandatory = $true)][string]$OutFile
)

$urls = @(Get-Content -LiteralPath $UrlFile -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$total = $urls.Count
Write-Host "待检测 $total 个 URL"

$results = New-Object System.Collections.ArrayList
$i = 0
foreach ($u in $urls) {
  $i++
  $head = (curl.exe -s -I -o NUL -w "%{http_code}" -L --max-time 12 $u 2>&1 | Out-String).Trim()
  $code = $head
  $method = 'HEAD'
  if ($head -notmatch '^[23]') {
    $get = (curl.exe -s -o NUL -w "%{http_code}" -L --max-time 15 -r 0-2048 $u 2>&1 | Out-String).Trim()
    if ($get -match '^[23]') { $code = $get; $method = 'GET' }
    else { $code = $get; $method = 'GET(also-failed)' }
  }
  [void]$results.Add([pscustomobject]@{ Code = $code; Method = $method; Url = $u })
  Write-Host ("[{0,3}/{1}] {2,-12} {3}" -f $i, $total, $code, $u)
}

$results | Export-Csv -LiteralPath $OutFile -NoTypeInformation -Encoding UTF8
$ok = @($results | Where-Object { $_.Code -match '^[23]' }).Count
Write-Host ""
Write-Host "可用 $ok / $total"
Write-Host "结果已写入 $OutFile"
