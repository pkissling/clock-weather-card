# Use official Playwright image with browsers preinstalled.
# Pin the digest - the v1.64.0-jammy tag is mutable; without pinning, snapshots
# drift the moment Microsoft republishes the image (different fonts → ~37 px
# anti-aliasing diff).
FROM mcr.microsoft.com/playwright:v1.64.1-jammy@sha256:6075bd984554db82aee96bcdde53197f091dfe8c4b89322c61da77b86308b810

# The host's docker binary can't be mounted in from macOS (Mach-O), so ship a Linux CLI.
COPY --from=docker:29-cli /usr/local/bin/docker /usr/local/bin/docker
# Pinned, so the docs preview GIFs encode byte-identically.
COPY --from=mwader/static-ffmpeg:9.0.2@sha256:7d9bdaaf887f7e6ce6151f67325c344074b5ff1fb75316011c3376503e449a7b /ffmpeg /usr/local/bin/ffmpeg

ENV E2E_IN_DOCKER=1 PLAYWRIGHT_HTML_OPEN=never

WORKDIR /work

# Ensure Yarn (via Corepack) is available
RUN corepack enable

# Copy package manager files first to leverage Docker layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies inside the image (isolated from host)
RUN yarn install --immutable

# Copy the rest of the project
COPY . .

# Browsers are preinstalled in the base image, so skip `playwright install`.
ENTRYPOINT ["yarn", "playwright", "test"]
