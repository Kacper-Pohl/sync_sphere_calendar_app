# Shared development image for the whole monorepo (services: deps, api, web).
#
# glibc base rather than Alpine: node_modules live on a bind mount, i.e. on the
# host disk, where both the IDE and the Playwright image (also glibc) read them.
# musl-built binaries would be incompatible in this setup.
#
# Deliberately does NOT install dependencies at image build time — the one-shot
# `deps` service does that on every start, so the contents of node_modules always
# match the current pnpm-lock.yaml.
FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Corepack cache on a fixed path, not under $HOME: `corepack install` below runs
# as root at build time, while the containers run as uid 1000 (see `user:` in
# compose) and could not read a cache left in root's home.
ENV COREPACK_HOME="/corepack"
# Let corepack fetch pnpm non-interactively (otherwise it prompts and fails).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm store outside the project tree so the IDE does not index it, but on the
# same host filesystem as node_modules so pnpm can hardlink instead of copying.
# Mounted from ${HOME} in compose.
ENV npm_config_store_dir="/pnpm-store"
# Playwright's browsers ship inside the base image the e2e service builds on;
# nothing here runs them, so skip the download.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# uid 1000 in the node image is the `node` user. Docker does not set HOME for a
# numeric `user:`, so without this processes would end up in /root, which they
# cannot access.
ENV HOME="/home/node"

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /pnpm /corepack && corepack enable

WORKDIR /app

# The only COPY: pins the pnpm version from the packageManager field into an
# image layer, so it is not downloaded on every container start.
COPY package.json ./
RUN corepack install

RUN chown -R 1000:1000 /pnpm /corepack /app /home/node
