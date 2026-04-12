#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Building Playwright image..."
docker build -t clock-weather-card-e2e -f "$SCRIPT_DIR/Dockerfile" "$PROJECT_DIR"

echo "Running Playwright tests in Docker to update snapshots..."
docker run --rm \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(which docker):/usr/bin/docker:ro" \
  -v /tmp:/tmp \
  -v "$PROJECT_DIR/e2e:/work/e2e" \
  clock-weather-card-e2e
