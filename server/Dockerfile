# syntax=docker/dockerfile:1

# ---------- Stage 1: install deps + compile TypeScript ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Same as `npm run build` in server/package.json: tsc, src -> dist.
RUN npm run build

# ---------- Stage 2: production runtime ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies (no tsx / ts-node-dev / typescript).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Uses the app's own health-check route, which only reports 200 once
# both MongoDB and Redis are actually connected.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3001}/api/v1/health-check || exit 1

CMD ["node", "dist/server.js"]