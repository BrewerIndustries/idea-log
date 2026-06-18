#!/usr/bin/env bash
# Pull latest main and redeploy the PROD Idea Log on the jarvis server.
# Usage (on the server):  /opt/idea-log/deploy/update.sh
# Or from your Mac:        ssh dan@100.102.159.57 /opt/idea-log/deploy/update.sh
set -euo pipefail

cd /opt/idea-log

echo "→ fetching latest main…"
git pull --ff-only

echo "→ installing deps…"
npm ci

echo "→ building…"
npm run build

echo "→ restarting service…"
sudo systemctl restart idea-log

sleep 3
echo "✓ deployed $(git log -1 --pretty='%h %s') — service $(systemctl is-active idea-log) on :4660"
