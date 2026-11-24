#!/usr/bin/env bash
# 国内镜像同步（拉取模式）：由 systemd timer 定时执行，也可手动运行。
# 数据流：GitHub Actions 把构建产物推到 site-mirror 分支 → 本机 git fetch →
#         git archive 解到临时目录 → 校验 → 原子替换 /var/www/wuhy-notes → reload nginx。
# 不依赖 GitHub Runner 主动 SSH 进来，因此不需要在安全组放行 Runner 的 IP。
set -euo pipefail

REPO=/opt/wuhy-notes/repo
TARGET=/var/www/wuhy-notes
BRANCH=site-mirror
LOCK=/var/lock/wuhy-site-sync.lock

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "另一个同步进程正在运行，跳过"
  exit 0
fi

log() { echo "[$(date '+%F %T')] $*"; }

if [ ! -d "$REPO/.git" ]; then
  log "初始化仓库 $REPO"
  mkdir -p "$(dirname "$REPO")"
  git clone --depth 1 https://github.com/wuhy80/wuhy-notes.git "$REPO"
fi

cd "$REPO"
git fetch --depth 1 origin main >/dev/null 2>&1 || { log "fetch main 失败"; exit 1; }
git fetch --depth 1 origin "$BRANCH" >/dev/null 2>&1 || { log "fetch $BRANCH 失败"; exit 1; }

NEW="$TARGET.new-$(date +%s)"
rm -rf "$NEW"
mkdir -p "$NEW"
git archive FETCH_HEAD | tar -x -C "$NEW"

for f in index.html index.json BUILD.json; do
  [ -s "$NEW/$f" ] || { log "产物缺少 $f，放弃本次同步"; rm -rf "$NEW"; exit 1; }
done

# 安装站点 Nginx 配置（来自 main 分支，保证扩展名缺失的文章入口按 text/html 返回）
git show origin/main:deploy/nginx-wuhy-notes.conf > /etc/nginx/sites-available/wuhy-notes
ln -sf /etc/nginx/sites-available/wuhy-notes /etc/nginx/sites-enabled/wuhy-notes
rm -f /etc/nginx/sites-enabled/default
nginx -t || { log "nginx 配置校验失败"; rm -rf "$NEW"; exit 1; }

rm -rf "$TARGET.old"
if [ -d "$TARGET" ]; then mv "$TARGET" "$TARGET.old"; fi
mv "$NEW" "$TARGET"
rm -rf "$TARGET.old"
systemctl reload nginx

CODE="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/ || true)"
TYPE="$(curl -sI http://127.0.0.1:8080/ | grep -i '^content-type:' | tr -d '\r' || true)"
RUN_ID="$(grep -o '"runId"[^,]*' "$TARGET/BUILD.json" | head -1 || true)"

if [ "$CODE" != "200" ] || ! echo "$TYPE" | grep -qi 'text/html'; then
  log "自测失败：code=$CODE type=$TYPE"
  exit 1
fi

log "同步完成：$RUN_ID，首页 $CODE，$TYPE"
