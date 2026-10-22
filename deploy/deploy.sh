#!/usr/bin/env bash
# Deploy the commit checked out in this repository:
# verify signature → build → backup → migrate → restart → health check (rolls back if unhealthy).
source "$(dirname "$0")/common.sh"
cd "$REPO_DIR"
verify_commit HEAD
TAG="$(git rev-parse --short=12 HEAD)"
PREV="$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)"
[ -f "$DB_FILE" ] || { echo "No database at $DB_FILE — copy in the starting data first (see README)."; exit 1; }

# Build first, so the backup and migration use this version's code
export IMAGE_TAG="$TAG"
compose build --quiet app
"$DEPLOY_DIR/backup.sh"
manage migrate
compose up -d app
if wait_healthy; then
  docker tag "$CONTAINER:$TAG" "$CONTAINER:latest"
  echo "Deployed $TAG."
  # keep the 3 newest images for rollback
  docker images "$CONTAINER" --format '{{.Tag}} {{.CreatedAt}}' | grep -v '^latest ' | sort -k2 -r | tail -n +4 \
    | awk '{print $1}' | xargs -r -I{} docker rmi "$CONTAINER:{}" >/dev/null 2>&1 || true
else
  echo "New version $TAG is not healthy — rolling back to ${PREV:-nothing}"
  docker logs --tail 30 "$CONTAINER" || true
  if [ -n "$PREV" ]; then IMAGE_TAG="${PREV#*:}" compose up -d app; fi
  exit 1
fi
