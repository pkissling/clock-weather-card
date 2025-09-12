# Use official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.55.0-jammy

WORKDIR /work

# Ensure Yarn (via Corepack) is available
RUN corepack enable

# Install a broad set of fonts to stabilize rendering across locales
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      fonts-noto \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      fonts-dejavu-core \
      fonts-roboto && \
    rm -rf /var/lib/apt/lists/*

# Copy package manager files first to leverage Docker layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies inside the image (isolated from host)
RUN yarn install --immutable

# Copy the rest of the project
COPY . .

# Run tests that update snapshots (no bind mount, host remains untouched)
ENTRYPOINT ["bash", "-lc", "yarn test:e2e --update-snapshots"]
