# ----- deps -----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# install with dev deps (zenstack runs in postinstall to generate Prisma schema)
RUN npm ci --no-audit --no-fund

# ----- builder -----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# regenerate (in case prisma folder differs from cached)
RUN npx zenstack generate --schema ./prisma/schema.zmodel && npx prisma generate
# zenstack may write to node_modules/zenstack/node_modules/.zenstack due to hoisting;
# ensure top-level .zenstack exists so @zenstackhq/runtime can resolve its enhance.js
RUN if [ -d node_modules/zenstack/node_modules/.zenstack ] && [ ! -d node_modules/.zenstack ]; then \
      cp -r node_modules/zenstack/node_modules/.zenstack node_modules/.zenstack; \
    fi && ls -la node_modules/.zenstack | head -20
RUN npm run build

# ----- runner -----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# non-root user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma engine + schema needed for migrate at runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.zenstack ./node_modules/.zenstack
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@zenstackhq ./node_modules/@zenstackhq
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
# install linux-native esbuild binary for tsx (host may be Windows/macOS)
RUN npm install --no-save --no-audit --no-fund --ignore-scripts @esbuild/linux-x64@0.28.0 && chown -R nextjs:nodejs node_modules/@esbuild

# entrypoint
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh && mkdir -p public/uploads/cv && chown -R nextjs:nodejs public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
