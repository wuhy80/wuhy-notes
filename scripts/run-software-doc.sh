#!/bin/bash

# 软著说明书生成脚本
# 使用方法：./run-software-doc.sh

echo "=========================================="
echo "   软著说明书自动生成工具"
echo "=========================================="
echo ""
echo "此脚本将自动登录系统、截图并生成Word文档"
echo ""

# 配置信息：从环境变量读取（SOFTDOC_URL / SOFTDOC_USER / SOFTDOC_PASS），凭据勿写入仓库
URL="${SOFTDOC_URL:-}"
USERNAME="${SOFTDOC_USER:-}"
PASSWORD="${SOFTDOC_PASS:-}"
if [ -z "$URL" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "缺少配置：请先设置环境变量 SOFTDOC_URL、SOFTDOC_USER、SOFTDOC_PASS"
  exit 1
fi

echo "配置信息："
echo "  系统地址: $URL"
echo "  用户名: $USERNAME"
echo ""
read -p "按Enter键继续..."

cd "$(dirname "$0")/.."
node scripts/generate-software-doc-safe.js "$URL" "$USERNAME" "$PASSWORD"
