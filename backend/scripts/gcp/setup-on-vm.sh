#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo BASE_DOMAIN="yourdomain.com" PUBLIC_DOMAIN="yourdomain.com" /tmp/setup-on-vm.sh
#
# Notes:
# - BASE_DOMAIN controls backend host mapping (api.BASE_DOMAIN, auth.BASE_DOMAIN, etc.).
# - PUBLIC_DOMAIN controls Caddy virtual hosts and TLS cert issuance.
# - If PUBLIC_DOMAIN is unset, Caddy serves plain HTTP on :80 for testing.

BASE_DOMAIN="${BASE_DOMAIN:-rec.net}"
PUBLIC_DOMAIN="${PUBLIC_DOMAIN:-}"
SERVICE_USER="${SERVICE_USER:-$SUDO_USER}"
if [[ -z "${SERVICE_USER:-}" ]]; then
  SERVICE_USER="$(id -un)"
fi

APP_DIR="/opt/restoroom/backend"
SUBDOMAINS=(
  api api-test apim apim-test auth auth-test accounts rooms match match-test
  chat lists leaderboard clubs econ commerce cards cards-test discovery
  playersettings notify platformnotifications datacollection ns ns-fd ai img
  cdn strings-cdn strings-cdn-test studiocdn cms cms-test email forum www
  www-test test devportal webservice-go webservice-sso-dev
)

echo "[1/7] Installing system packages..."
apt-get update -y
apt-get install -y curl gnupg ca-certificates software-properties-common rsync

echo "[2/7] Installing Node.js 20..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "[3/7] Installing Caddy..."
if ! command -v caddy >/dev/null 2>&1; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y
  apt-get install -y caddy
fi

echo "[4/7] Preparing app directory..."
mkdir -p /opt/restoroom
if [[ ! -d "$APP_DIR" ]]; then
  mkdir -p "$APP_DIR"
fi
chown -R "$SERVICE_USER:$SERVICE_USER" /opt/restoroom

echo "[5/7] Writing systemd service..."
cat >/etc/systemd/system/restoroom-backend.service <<EOF
[Unit]
Description=RestoRoom RecNet Compatibility Backend
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node services/recnet/server.js
Restart=always
RestartSec=3
Environment=PORT=7000
Environment=BASE_DOMAIN=$BASE_DOMAIN
Environment=ENABLE_TEST_SUBDOMAINS=true
Environment=ENABLE_REC_NET_COMPAT=true
Environment=API_FALLBACK_200=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable restoroom-backend

if [[ -f "$APP_DIR/services/recnet/server.js" ]]; then
  systemctl restart restoroom-backend
fi

echo "[6/7] Writing Caddy config..."
if [[ -n "$PUBLIC_DOMAIN" ]]; then
  {
    echo "{"
    echo "  auto_https on"
    echo "}"
    echo
    HOST_LINE=""
    for sub in "${SUBDOMAINS[@]}"; do
      HOST_LINE+="${sub}.${PUBLIC_DOMAIN}, "
    done
    HOST_LINE+="${PUBLIC_DOMAIN}"
    echo "${HOST_LINE} {"
    echo "  reverse_proxy 127.0.0.1:7000"
    echo "}"
  } >/etc/caddy/Caddyfile
else
  cat >/etc/caddy/Caddyfile <<'EOF'
:80 {
  reverse_proxy 127.0.0.1:7000
}
EOF
fi

systemctl enable caddy
systemctl restart caddy

echo "[7/7] Done."
echo "Backend status:"
systemctl --no-pager --full status restoroom-backend | sed -n '1,12p'
echo
echo "Caddy status:"
systemctl --no-pager --full status caddy | sed -n '1,12p'
