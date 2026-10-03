#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
# Same hash as createContainerName in e2e/utils/ha-state.ts, so runner and HA container pair up by name.
WORKTREE_ID="$(printf '%s' "$PROJECT_DIR" | shasum -a 256 | cut -c1-12)"
RUNNER_NAME="clock-weather-card-e2e-$WORKTREE_ID-playwright"

if [ -n "$(docker ps -aq --filter "name=^${RUNNER_NAME}$")" ]; then
  echo "An e2e run is already active in this worktree (container $RUNNER_NAME). If it isn't, remove it with \`docker rm -f $RUNNER_NAME\`." >&2
  exit 1
fi

echo "Building Playwright image..."
# Unique per-process tag so concurrent sessions in different worktrees
# can't re-tag the image out from under each other. Untagged again after the
# run — the Docker build cache keeps rebuilds fast.
IMAGE_TAG="clock-weather-card-e2e-$$"
trap 'docker rmi "$IMAGE_TAG" >/dev/null 2>&1 || true' EXIT
docker build -t "$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_DIR"

mkdir -p "$PROJECT_DIR/playwright-report" "$PROJECT_DIR/test-results"

echo "Running Playwright tests in Docker..."
# Host network: the HA container started via the socket is published on 127.0.0.1 only.
docker run --rm \
  --name "$RUNNER_NAME" \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e E2E_PROJECT_DIR="$PROJECT_DIR" \
  -v /tmp:/tmp \
  -v "$PROJECT_DIR/e2e:/work/e2e" \
  -v "$PROJECT_DIR/playwright-report:/work/playwright-report" \
  -v "$PROJECT_DIR/test-results:/work/test-results" \
  "$IMAGE_TAG" "$@"
