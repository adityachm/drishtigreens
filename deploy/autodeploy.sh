#!/usr/bin/env bash
# Auto-deploy: every 5 seconds ask GitHub for the latest commit on main. When it changes,
# fetch it, check it is signed by a trusted key, and only then check it out and run deploy.sh.
# Unsigned or untrusted commits are never checked out; the site keeps running the last good one.
#
# Started by cron every minute (`* * * * *`): if it's already running the lock makes the new copy
# exit at once, so cron only restarts it after a reboot or crash.
# Log: ~/drishtigreens-deploy.log
set -uo pipefail
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "$REPO_DIR/deploy/common.sh"
set +e
BRANCH="${DEPLOY_BRANCH:-main}"
INTERVAL="${DEPLOY_INTERVAL:-5}"
LOG="$DG_HOME/drishtigreens-deploy.log"

exec 9>"$DG_HOME/.drishtigreens-autodeploy.lock"
flock -n 9 || exit 0   # already running

log() { echo "$(date -u '+%F %T') $*" >> "$LOG"; }
# Keep the log small (last 2000 lines)
[ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 4000 ] && { tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; }

cd "$REPO_DIR"
rejected=""    # a commit that failed verification or deploy — not retried until a newer one arrives
offline=0
while true; do
  remote="$(timeout 20 git ls-remote origin "refs/heads/$BRANCH" 2>/dev/null | cut -f1)"
  if [ -z "$remote" ]; then
    [ "$offline" = 0 ] && log "can't reach GitHub — will keep trying"
    offline=1
  else
    [ "$offline" = 1 ] && log "GitHub reachable again"
    offline=0
    if [ "$remote" != "$(git rev-parse HEAD)" ] && [ "$remote" != "$rejected" ]; then
      log "new commit ${remote:0:7} on $BRANCH"
      if ! timeout 120 git fetch -q origin "$BRANCH" >> "$LOG" 2>&1; then
        log "fetch failed — will retry"
      elif ! verify_commit "$remote" >> "$LOG" 2>&1; then
        log "REFUSED ${remote:0:7}: not signed by a trusted key — still running $(git rev-parse --short HEAD)"
        rejected="$remote"
      elif { git reset -q --hard "$remote" && ./deploy/deploy.sh; } >> "$LOG" 2>&1; then
        log "deployed ${remote:0:7}"
        exec 9>&-
        exec "$REPO_DIR/deploy/autodeploy.sh"   # continue with the new (verified) version of this script
      else
        log "deploy of ${remote:0:7} FAILED — the site keeps running the previous version"
        rejected="$remote"
      fi
    fi
  fi
  sleep "$INTERVAL"
done
