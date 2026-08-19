#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Building Playwright image..."
# Unique per-process tag so concurrent sessions (e.g. in different worktrees)
# can't re-tag the image out from under each other. Untagged again after the
# run — the Docker build cache keeps rebuilds fast.
IMAGE_TAG="clock-weather-card-e2e-$$"
trap 'docker rmi "$IMAGE_TAG" >/dev/null 2>&1 || true' EXIT
docker build -t "$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_DIR"

echo "Running Playwright tests in Docker to update snapshots..."
docker run --rm \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(which docker):/usr/bin/docker:ro" \
  -v /tmp:/tmp \
  -v "$PROJECT_DIR/e2e:/work/e2e" \
  "$IMAGE_TAG"
