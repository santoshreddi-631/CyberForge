# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install ALL deps (including devDeps needed to compile TypeScript)
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

# Prune dev dependencies
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

LABEL org.opencontainers.image.title="community-scam-map-backend"
LABEL org.opencontainers.image.description=" API server"

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Switch to non-root
USER appuser

EXPOSE 3001

# Health check so container orchestrators know when we're ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]

