# unify-bookmarks.ps1 — 把 网址收藏/ 的三种写法统一为列表项
#   1) callout 书签条目  `> [!note] [标题](URL)` + 说明   →  `- [标题](URL)：说明`
#   2) cardlink 代码块                                    →  `- [标题](URL)：说明`
#   3) 已是列表项的保持不变，但会做紧凑化（去掉条目之间的空行）
# 注意：只转换「首行含 Markdown 链接」的 callout；`> [!summary] 使用说明` 这类正文 callout 不动。
param(
  [switch]$WhatIf   # 只预览不写入
)

$root = 'E:\Obsidian\wuhy80_new'
$dir = Join-Path $root '网址收藏'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Clean-Title([string]$t) {
  $t = ($t -replace '\s+', ' ').Trim().Trim('"')
  # GitHub 抓来的冗长标题： "GitHub - owner/repo: 描述" → "owner/repo"
  if ($t -match '^GitHub\s*-\s*([^:]+):') { $t = $Matches[1].Trim() }
  # 去掉结尾重复的空括号
  $t = $t -replace '\(\s*\)$', ''
  return $t.Trim()
}

function Trim-Desc([string]$d) {
  $d = ($d -replace '\s+', ' ').Trim().Trim('"')
  if ($d.Length -le 100) { return $d }
  # 优先在句末标点处截断
  $head = $d.Substring(0, 100)
  $m = [regex]::Match($head, '^.*[。\.!？?]')
  if ($m.Success -and $m.Value.Length -ge 30) { return $m.Value.Trim() }
  return $head.Trim() + '…'
}

function Format-Entry([string]$title, [string]$url, [string]$desc) {
  $t = Clean-Title $title
  if (-not $t) { $t = $url }
  $d = Trim-Desc $desc
  if ($d) { return "- [$t]($url)：$d" }
  return "- [$t]($url)"
}

$summary = @()
foreach ($f in @(Get-ChildItem -LiteralPath $dir -Recurse -File -Filter *.md -Force | Sort-Object Name)) {
  $lines = @(Get-Content -LiteralPath $f.FullName -Encoding UTF8)
  $out = New-Object System.Collections.ArrayList
  $card = 0; $callout = 0
  $i = 0
  while ($i -lt $lines.Count) {
    $l = $lines[$i]

    # ── cardlink 代码块 ──
    if ($l.Trim() -eq '```cardlink') {
      $body = @()
      $i++
      while ($i -lt $lines.Count -and $lines[$i].Trim() -ne '```') { $body += $lines[$i]; $i++ }
      $i++   # 跳过结束围栏
      $url = ''; $title = ''; $desc = ''
      foreach ($b in $body) {
        if ($b -match '^url:\s*(.+)$') { $url = $Matches[1].Trim().Trim('"') }
        elseif ($b -match '^title:\s*(.+)$') { $title = $Matches[1].Trim().Trim('"') }
        elseif ($b -match '^description:\s*(.+)$') { $desc = $Matches[1].Trim().Trim('"') }
      }
      if ($url) { [void]$out.Add((Format-Entry $title $url $desc)); $card++ }
      continue
    }

    # ── callout 书签条目（首行必须含 Markdown 链接）──
    if ($l -match '^\s*>\s*\[!\w+\]\s+\[(.+?)\]\((https?://[^)\s]+)\)\s*$') {
      $title = $Matches[1]
      $url = $Matches[2]
      $descs = @()
      $i++
      while ($i -lt $lines.Count -and $lines[$i] -match '^\s*>' -and $lines[$i] -notmatch '^\s*>\s*\[!') {
        $descs += ($lines[$i] -replace '^\s*>\s?', '')
        $i++
      }
      [void]$out.Add((Format-Entry $title $url ($descs -join ' ')))
      $callout++
      continue
    }

    [void]$out.Add($l)
    $i++
  }

  if ($card -eq 0 -and $callout -eq 0) { continue }

  $text = ($out -join "`n")
  # 紧凑化：删除夹在两个列表项之间的空行（反复执行直到稳定）
  do {
    $before = $text
    $text = [regex]::Replace($text, "(?m)^(- .*)\r?\n\r?\n(- )", "`$1`n`$2")
  } while ($text -ne $before)
  $text = [regex]::Replace($text, '(\r?\n){3,}', "`n`n")
  if (-not $text.EndsWith("`n")) { $text += "`n" }

  if (-not $WhatIf) { [System.IO.File]::WriteAllText($f.FullName, $text, $utf8) }
  $summary += [pscustomobject]@{ File = $f.Name; Callout = $callout; Cardlink = $card; Total = $callout + $card }
}

Write-Host "=== 转换统计 ==="
$summary | ForEach-Object { "  {0,-24} callout {1,3} -> 列表项；cardlink {2,3} -> 列表项" -f $_.File, $_.Callout, $_.Cardlink }
Write-Host ""
Write-Host ("  合计转换 {0} 条（callout {1} + cardlink {2}）" -f (($summary | Measure-Object Total -Sum).Sum), (($summary | Measure-Object Callout -Sum).Sum), (($summary | Measure-Object Cardlink -Sum).Sum))
if ($WhatIf) { Write-Host "  （-WhatIf 预览模式，未写入）" -ForegroundColor Yellow }
