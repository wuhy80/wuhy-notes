# BOM 探测文件：本行含中文，用于验证写入时是否保留 UTF-8 BOM
# 若保留，则用本工具改写 .ps1 是安全的；若丢失，则 PowerShell 5.1 会按 GBK 解析导致乱码/语法错
Write-Output 'bom-probe-ok'
