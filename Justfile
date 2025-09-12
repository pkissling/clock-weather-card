set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Update Playwright snapshots for both macOS (local) and Linux (via Docker)
update-snapshots:
  # Cleanup old snapshots
  rm -r e2e/*-snapshots || true

  # Update local (macOS/darwin) snapshots
  yarn install --immutable
  yarn test:e2e --update-snapshots

  # Build Linux Playwright image
  docker build -t clock-weather-card-e2e -f .github/linux-snapshots-helper/Dockerfile .

  # Update Linux snapshots inside an isolated container and copy them back
  bash .github/linux-snapshots-helper/copy_snapshots.sh
