# Use official Playwright image with browsers preinstalled.
# Pin the digest — the v1.59.1-jammy tag is mutable; without pinning, snapshots
# drift the moment Microsoft republishes the image (different fonts → ~37 px
# anti-aliasing diff). The CI workflow pins the same digest.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy@sha256:8a0360d39d1973be506dd59002904a774f6d697d4946c94063b3fd006461c8ff

WORKDIR /work

# Ensure Yarn (via Corepack) is available
RUN corepack enable

# Copy package manager files first to leverage Docker layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies inside the image (isolated from host)
RUN yarn install --immutable

# Copy the rest of the project
COPY . .

# Run tests that update snapshots (skip playwright install — browsers are preinstalled in the base image)
ENTRYPOINT ["bash", "-lc", "PLAYWRIGHT_HTML_OPEN=never yarn playwright test --update-snapshots"]
