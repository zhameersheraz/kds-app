#!/bin/bash
# One-shot script: start the KDS server + open a public Cloudflare tunnel.
# Run this on Kali and share the printed URL.
#
# Usage:
#   chmod +x deploy-tunnel.sh
#   ./deploy-tunnel.sh
#
# Stop with Ctrl+C (kills both processes cleanly).

set -e

KDS_DIR="$HOME/projects/kds-app"
PORT=4000

if [ ! -d "$KDS_DIR" ]; then
  echo "[!] $KDS_DIR not found. Extract the tarball first:"
  echo "    cd /media/sf_downloads && tar -xzf kds-app.tar.gz -C ~/projects"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "[*] installing cloudflared..."
  sudo apt update -qq && sudo apt install -y cloudflared
fi

cleanup() {
  echo
  echo "[*] stopping..."
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "[*] starting KDS server..."
(cd "$KDS_DIR/server" && npm start) &
SERVER_PID=$!

# Give the server a moment to bind.
sleep 3

echo "[*] opening public tunnel..."
echo
cloudflared tunnel --url "http://localhost:$PORT"