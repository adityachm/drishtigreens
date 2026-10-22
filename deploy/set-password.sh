#!/usr/bin/env bash
# Set or reset the admin password (asks for it; signs out every admin session):
#   ~/drishtigreens/deploy/set-password.sh
source "$(dirname "$0")/common.sh"
IMAGE_TAG="$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null | cut -d: -f2)"
export IMAGE_TAG="${IMAGE_TAG:-latest}"
compose run --rm --no-deps app node dist/manage.js set-password
