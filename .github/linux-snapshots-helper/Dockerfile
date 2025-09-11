# Use official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

WORKDIR /work

# Ensure Yarn (via Corepack) is available
RUN corepack enable

ENTRYPOINT ["bash", "-lc", "yarn install --immutable && yarn test:e2e --update-snapshots"]
