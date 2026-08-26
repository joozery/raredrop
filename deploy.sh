#!/usr/bin/env bash
# Deploy: pull latest main, rebuild, restart the service.
# ต้องรันด้วยสิทธิ์ที่ restart systemd service ได้ (root หรือ sudo)
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "==> Fetching origin/main"
git fetch origin main

STASHED=0
if [ -n "$(git status --porcelain)" ]; then
  echo "==> Local changes found, stashing before pull"
  git stash push -u -m "deploy.sh autostash $(date +%Y-%m-%dT%H:%M:%S)"
  STASHED=1
fi

echo "==> Pulling main"
if ! git pull origin main; then
  echo "!! Pull failed (likely a merge conflict). Resolve manually, then re-run deploy.sh." >&2
  exit 1
fi

if [ "$STASHED" -eq 1 ]; then
  echo "==> Restoring stashed local changes"
  if ! git stash pop; then
    echo "!! Stash pop conflicted — left in the stash list. Resolve manually with 'git stash list' / 'git stash pop'." >&2
  fi
fi

echo "==> Installing dependencies"
npm install

echo "==> Building"
npm run build

echo "==> Restarting service"
systemctl restart raredrop

sleep 2
systemctl status raredrop --no-pager
