# Stage 1 — install all dependencies
FROM node:24-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app

# Copy workspace manifests only — maximise layer cache
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# Apps
COPY apps/web/package.json ./apps/web/
# Packages
COPY packages/tokens/package.json       ./packages/tokens/
COPY packages/db/package.json           ./packages/db/
COPY packages/agent-core/package.json   ./packages/agent-core/
COPY packages/tenant-core/package.json  ./packages/tenant-core/
COPY packages/ui-glass/package.json     ./packages/ui-glass/
COPY packages/ui-bento/package.json     ./packages/ui-bento/
COPY packages/ui-charts/package.json    ./packages/ui-charts/
COPY packages/ui-auth/package.json      ./packages/ui-auth/
COPY packages/ui-agent/package.json     ./packages/ui-agent/
COPY packages/ui-shell/package.json     ./packages/ui-shell/

RUN pnpm install --frozen-lockfile

# Stage 2 — build all packages then the app
FROM node:24-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build packages first (respects workspace dependency order via turbo)
RUN pnpm build --filter "@novasphere/*"

# Build the Next.js app in standalone mode
RUN pnpm build --filter web

# Stage 3 — minimal runtime image
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output only — no source, no node_modules (except what standalone includes)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/db ./packages/db
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/node_modules ./packages/db/node_modules
COPY --chown=nextjs:nodejs ./docker/web-entrypoint.sh ./docker/web-entrypoint.sh

# pnpm workspaces keep many packages under package-local node_modules (symlinked to the pnpm store).
# Next.js standalone server resolves some dependencies from /app/node_modules, so we expose drizzle-orm there.
#
# Use an absolute symlink target so the path isn't re-interpreted relative to /app/node_modules.
RUN ln -sfn /app/packages/db/node_modules/drizzle-orm /app/node_modules/drizzle-orm

# Writable directory for SQLite database
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN chmod +x /app/docker/web-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# next.config.ts must set output: 'standalone' for this to work
CMD ["/app/docker/web-entrypoint.sh"]
