#!/usr/bin/env bash
# 一次性安装：把拉取式国内镜像同步装成 systemd timer。
# 用法（在阿里云 Workbench，root）：
#   cd /tmp && rm -rf wuhy-bootstrap && git clone --depth 1 https://github.com/wuhy80/wuhy-notes.git wuhy-bootstrap && bash wuhy-bootstrap/deploy/bootstrap-site-sync.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/wuhy-site-sync.sh"
[ -f "$SRC" ] || { echo "缺少 $SRC"; exit 1; }

install -m 755 "$SRC" /usr/local/bin/wuhy-site-sync
install -d /opt/wuhy-notes

cat > /etc/systemd/system/wuhy-site-sync.service <<'EOF'
[Unit]
Description=Sync wuhy-notes static mirror from GitHub (site-mirror branch)
After=network-online.target nginx.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/wuhy-site-sync
TimeoutStartSec=600
Nice=10
EOF

cat > /etc/systemd/system/wuhy-site-sync.timer <<'EOF'
[Unit]
Description=Run wuhy-notes mirror sync every 10 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now wuhy-site-sync.timer
/usr/local/bin/wuhy-site-sync || true
systemctl status wuhy-site-sync.timer --no-pager | head -5
