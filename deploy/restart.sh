#!/usr/bin/env bash
# Restart the site so it reads ~/drishtigreens-secrets/.env again (e.g. after adding Turnstile keys).
source "$(dirname "$0")/common.sh"
IMAGE_TAG="$(docker inspect -f '{{.Config.Image}}' "$CONTAINER" 2>/dev/null | cut -d: -f2)"
export IMAGE_TAG="${IMAGE_TAG:-latest}"
compose up -d --force-recreate app
wait_healthy && echo "$CONTAINER is up on port $PORT." || { echo "$CONTAINER did not come up — docker logs $CONTAINER"; exit 1; }
