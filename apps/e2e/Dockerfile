FROM mcr.microsoft.com/playwright:v1.62.1-noble

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_HOME="/corepack"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# The browsers are already in the base image — do not download them again.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# uid 1000 in this image is `pwuser`; see `user:` in compose.
ENV HOME="/home/pwuser"

RUN mkdir -p /pnpm /corepack && corepack enable

WORKDIR /app

# No install here: node_modules arrive via the bind mount, prepared by the `deps`
# service. This COPY only pins the pnpm version from the packageManager field so
# that `pnpm --filter e2e test` can run.
COPY package.json ./
RUN corepack install

RUN chown -R 1000:1000 /pnpm /corepack /app
