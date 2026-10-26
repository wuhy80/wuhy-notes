#!/bin/bash
# export-local.sh - 导出笔记到 Quartz content 目录（macOS 简化版）
set -e

VAULT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_DIR="$VAULT_DIR/_site/content"

# 发布范围
PUBLIC_DIRS=(
  "技术笔记" "大模型" "Ontology"
  "Golang编程" "Rust编程"
  "读书笔记" "英语学习" "数学学习"
  "网址收藏"
)

# 排除目录
EXCLUDE_PATTERNS=(
  "技术笔记/虚拟机"
  "技术笔记/安全"
  "专项学习/*学习规划"
  "专项项目"
  "极客时间"
  "浏览剪切"
  "网络剪切"
  "网关开发"
  "网络资料"
)

echo "=== 1. 重建导出目录 ==="
rm -rf "$CONTENT_DIR"
mkdir -p "$CONTENT_DIR"
echo "  已清空并重建 $CONTENT_DIR"

echo "=== 2. 复制白名单目录（只复制 .md）==="
copied=0
for dir in "${PUBLIC_DIRS[@]}"; do
  src="$VAULT_DIR/$dir"
  if [ ! -d "$src" ]; then
    echo "  跳过（不存在）：$dir"
    continue
  fi

  dst="$CONTENT_DIR/$dir"
  mkdir -p "$dst"

  # 复制所有 .md 文件
  find "$src" -name "*.md" -type f | while read -r file; do
    rel_path="${file#$src/}"
    target="$dst/$rel_path"

    # 检查是否在排除列表中
    skip=false
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
      if [[ "$dir/$rel_path" == "$pattern"* ]]; then
        skip=true
        break
      fi
    done

    if [ "$skip" = false ]; then
      mkdir -p "$(dirname "$target")"
      cp "$file" "$target"
      copied=$((copied + 1))
    fi
  done

  count=$(find "$dst" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  echo "  $(printf '%-12s' "$dir") $count 篇"
done

echo "  合计 $copied 篇"

echo "=== 3. 生成首页 index.md ==="
cat > "$CONTENT_DIR/index.md" << 'EOF'
---
title: 技术笔记
---

# 技术笔记

这里是我的技术学习笔记：后端开发、云原生、数据库、算法与编程语言。

## 分区导航

| 分区 | 内容 |
|---|---|
| [技术笔记](/技术笔记/) | Kubernetes、Docker、Linux、数据库、网络、编辑器等 |
| [Golang 编程](/golang编程/) | Go 语言、Gin、GORM、并发与性能 |
| [读书笔记](/读书笔记/) | 技术书与科普书的阅读记录 |
| [Rust 编程](/rust编程/) | Rust 学习笔记 |

## 怎么用这个站

- 左上角 **搜索**（Ctrl+K）可全文检索
- 右上角 **Graph** 看笔记之间的链接关系
- 每篇笔记右侧有目录与反向链接
- 暗色/亮色可切换
EOF

echo "  已生成 $CONTENT_DIR/index.md"
echo ""
echo "✅ 导出完成！"
