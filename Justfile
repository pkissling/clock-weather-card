set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Update Playwright snapshots for both macOS (local) and Linux (via Docker)
update-snapshots:
  # Cleanup old snapshots
  rm -r e2e/*-snapshots || true

  # Update local (macOS/darwin) snapshots
  yarn install --immutable
  yarn test:e2e --update-snapshots

  # Build Linux Playwright image
  docker build -t clock-weather-card-e2e .github/linux-snapshots-helper/

  # Update Linux snapshots inside container, writing back to repo
  docker run --rm \
    --shm-size=1g \
    -e CI=true \
    -v "$PWD:/work" \
    -w /work \
    clock-weather-card-e2e
