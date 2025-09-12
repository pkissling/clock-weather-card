# List available recipes
default:
  @just --list

# Update Playwright snapshots
update-playwright-snapshots: update-playwright-macos-snapshots update-playwright-linux-snapshots

# Update macOS snapshots
update-playwright-macos-snapshots:
  # Update macOS snapshots
  yarn install --immutable
  yarn test:e2e --update-snapshots

# Update Linux snapshots using Docker
update-playwright-linux-snapshots:
  # Build Linux Playwright image
  docker build -t clock-weather-card-e2e -f .github/linux-snapshots-helper/Dockerfile .

  # Run Playwright tests in Docker against Linux
  # Mount only the snapshots/test folder so the container's own dependencies are used
  # and only snapshots are written back to the host.
  docker run --rm \
    -e PLAYWRIGHT_HTML_OPEN=never \
    -v ${PWD}/e2e:/work/e2e \
    clock-weather-card-e2e

# Remove all Playwright snapshots
clean-snapshots:
  rm -rf e2e/*-snapshots

# Delete all existing snapshots and recreate them from scratch
recreate-playwright-snapshots: clean-snapshots update-playwright-snapshots
