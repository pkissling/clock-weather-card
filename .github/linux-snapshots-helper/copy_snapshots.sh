#!/usr/bin/env bash
set -euo pipefail

# Create container and ensure cleanup
cid=$(docker create --shm-size=1g -e CI=true clock-weather-card-e2e)
trap 'docker rm -f "$cid" >/dev/null 2>&1 || true' EXIT

# Run tests that update snapshots; don't fail on test failures mid-run
docker start -a "$cid" || true

# Copy updated snapshots back to the host
tmpdir=$(mktemp -d)
docker cp "$cid":/work/e2e "$tmpdir" >/dev/null

shopt -s nullglob
for d in "$tmpdir"/e2e/*-snapshots; do
  rm -rf "e2e/$(basename "$d")"
  cp -a "$d" e2e/
done
shopt -u nullglob

rm -rf "$tmpdir"
