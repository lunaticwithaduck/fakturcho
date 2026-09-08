# Build context is the repo root: docker build -f backoffice/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backoffice/package.json backoffice/
COPY app/package.json app/
COPY server/package.json server/
COPY design/package.json design/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter "@fakturcho/backoffice..."
COPY packages/shared-types/tsconfig.json packages/shared-types/tsconfig.json
COPY packages/shared-types/src packages/shared-types/src
COPY backoffice/tsconfig.json backoffice/vite.config.ts backoffice/index.html backoffice/
COPY backoffice/src backoffice/src
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @fakturcho/shared-types build \
  && pnpm --filter @fakturcho/backoffice build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /srv
COPY --from=build --chown=node:node /repo/backoffice/dist ./dist
COPY backoffice/server.mjs ./server.mjs
USER node
CMD ["node", "server.mjs"]
