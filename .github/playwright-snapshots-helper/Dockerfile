# Use official Playwright image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

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
