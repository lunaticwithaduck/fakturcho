# Build context is the repo root: docker build -f app/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY app/package.json app/
COPY server/package.json server/
COPY backoffice/package.json backoffice/
COPY design/package.json design/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter "@fakturcho/app..."
COPY packages/shared-types/tsconfig.json packages/shared-types/tsconfig.json
COPY packages/shared-types/src packages/shared-types/src
COPY design/tsconfig.json design/tsconfig.json
COPY design/tokens design/tokens
COPY design/lib design/lib
COPY design/components design/components
COPY app/next.config.ts app/tsconfig.json app/postcss.config.mjs app/next-env.d.ts app/
COPY app/src app/src
# The /api/* rewrite bakes SERVER_URL into the build output; Railway must supply
# it as a service variable so it reaches both this ARG and the runtime env.
ARG SERVER_URL=http://localhost:3001
ENV SERVER_URL=$SERVER_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @fakturcho/shared-types build \
  && pnpm --filter @fakturcho/app build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0
WORKDIR /srv
COPY --from=build --chown=node:node /repo/app/.next/standalone ./
COPY --from=build --chown=node:node /repo/app/.next/static ./app/.next/static
USER node
WORKDIR /srv/app
CMD ["node", "server.js"]
