# Build context is the repo root: docker build -f server/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY server/package.json server/
COPY app/package.json app/
COPY backoffice/package.json backoffice/
COPY design/package.json design/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter "@fakturcho/server..."
COPY packages/shared-types/tsconfig.json packages/shared-types/tsconfig.json
COPY packages/shared-types/src packages/shared-types/src
COPY server/tsconfig.json server/nest-cli.json server/
COPY server/prisma server/prisma
COPY server/src server/src
RUN pnpm --filter @fakturcho/shared-types build \
  && pnpm --filter @fakturcho/server exec prisma generate \
  && pnpm --filter @fakturcho/server build

FROM base AS proddeps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY app/package.json app/
COPY backoffice/package.json backoffice/
COPY design/package.json design/
COPY packages/shared-types/package.json packages/shared-types/
# --ignore-scripts: the root prepare script needs husky (a devDependency); the
# only prod dep with a build script is @prisma/client, generated below instead.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --filter "@fakturcho/server..."

FROM base AS runtime
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# openssl lets prisma detect the right engine platform (debian-openssl-3.0.x)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=proddeps /repo /repo
RUN cd server \
  && pnpm exec playwright install --with-deps chromium \
  && rm -rf /var/lib/apt/lists/*
COPY server/prisma server/prisma
# The prisma CLI is a devDependency, but migrate deploy runs at every boot and
# generate must target this stage's node_modules; a global install pinned to the
# locked @prisma/client version keeps the runtime tree production-only.
RUN npm install -g "prisma@$(node -p "require('/repo/server/node_modules/@prisma/client/package.json').version")" \
  && npm cache clean --force \
  && cd server \
  && prisma generate
COPY --from=build /repo/packages/shared-types/dist packages/shared-types/dist
COPY --from=build /repo/server/dist server/dist
COPY server/assets server/assets
COPY server/docker-entrypoint.sh server/docker-entrypoint.sh
USER node
WORKDIR /repo/server
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
