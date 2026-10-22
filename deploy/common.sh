# Shared settings for the home-server scripts (sourced, not run directly).
# Layout on the server (192.168.1.40), all under $HOME:
#   drishtigreens/           this repository, branch main (only ever moved to a verified commit)
#   drishtigreens-data/      drishtigreens.sqlite + media/ (photos). Deploys never touch it.
#   drishtigreens-backups/   nightly database copies (14 days) + a copy of media/
#   drishtigreens-secrets/   .env (Turnstile keys) and allowed_signers (who may deploy)
set -euo pipefail
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
export DG_HOME="${DG_HOME:-$HOME}"
DATA_DIR="$DG_HOME/drishtigreens-data"
BACKUP_DIR="$DG_HOME/drishtigreens-backups"
SECRETS_DIR="$DG_HOME/drishtigreens-secrets"
ALLOWED_SIGNERS="$SECRETS_DIR/allowed_signers"
DB_FILE="$DATA_DIR/drishtigreens.sqlite"
CONTAINER=drishtigreens
PORT=8790
mkdir -p "$DATA_DIR" "$BACKUP_DIR" "$SECRETS_DIR"
# Compose would create a folder in place of a missing file it has to mount.
[ -f "$SECRETS_DIR/.env" ] || touch "$SECRETS_DIR/.env"

compose() { docker compose -f "$DEPLOY_DIR/docker-compose.yml" "$@"; }

# dist/manage.js inside the app image (same Node and SQLite as the site)
manage() { compose run --rm --no-deps -T -v "$BACKUP_DIR:/backups" app node dist/manage.js "$@"; }

# Succeeds only for a commit signed by a key listed in $ALLOWED_SIGNERS (kept on this server,
# outside the repository). Unsigned commits and commits signed by any other key fail.
verify_commit() {
  local out
  if [ ! -s "$ALLOWED_SIGNERS" ]; then
    echo "No trusted signers in $ALLOWED_SIGNERS — refusing to deploy."
    return 1
  fi
  if out="$(git -C "$REPO_DIR" -c gpg.ssh.allowedSignersFile="$ALLOWED_SIGNERS" verify-commit "$1" 2>&1)" \
    && grep -q 'Good "git" signature for ' <<<"$out"; then
    return 0
  fi
  echo "Commit $(git -C "$REPO_DIR" rev-parse --short "$1" 2>/dev/null || echo "$1") is not signed by a trusted key — refusing to deploy."
  [ -n "$out" ] && echo "$out"
  return 1
}

# Wait until the site answers its health check (up to ~90 s; the server is slow to build and start)
wait_healthy() {
  for _ in $(seq 1 45); do
    [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = healthy ] && return 0
    sleep 2
  done
  return 1
}
