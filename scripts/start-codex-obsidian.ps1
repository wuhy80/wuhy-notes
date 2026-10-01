# Starts Codex in this Obsidian vault with fewer approval prompts.
$ErrorActionPreference = "Stop"

$VaultPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $VaultPath

codex -C $VaultPath --sandbox workspace-write --ask-for-approval never @args
