#!/usr/bin/env bash
# Pull latest dev and redeploy the DEV Idea Log on the jarvis server.
# Usage (on the server):  /opt/idea-log-dev/deploy/update-dev.sh
# Or from your Mac:        ssh dan@100.102.159.57 /opt/idea-log-dev/deploy/update-dev.sh
set -euo pipefail

cd /opt/idea-log-dev

echo "→ fetching latest dev…"
git pull --ff-only

echo "→ installing deps…"
npm ci

echo "→ building…"
npm run build

echo "→ restarting DEV service…"
sudo systemctl restart idea-log-dev

sleep 3
echo "✓ deployed $(git log -1 --pretty='%h %s') — service $(systemctl is-active idea-log-dev) on :4670"
