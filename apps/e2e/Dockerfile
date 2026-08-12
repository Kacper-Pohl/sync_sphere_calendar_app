FROM mcr.microsoft.com/playwright:v1.62.1-noble

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/e2e/package.json ./apps/e2e/
RUN pnpm install

CMD ["pnpm", "--filter", "e2e", "test"]
