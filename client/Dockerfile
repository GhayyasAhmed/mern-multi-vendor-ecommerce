# syntax=docker/dockerfile:1

# ---------- Stage 1: install full dependency tree (incl. devDeps) ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build the production Next.js app ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Forces next.config.ts to emit the "standalone" output this Dockerfile
# needs. Vercel's build never sets this, so it is completely unaffected.
ARG DOCKER_BUILD=1
ENV DOCKER_BUILD=${DOCKER_BUILD}

# Server-side proxy target used by next.config.ts's rewrites() function,
# baked into the build's routes manifest — how the Next.js server reaches
# the "server" container over the Docker network.
ARG BACKEND_API_URL
ENV BACKEND_API_URL=${BACKEND_API_URL}

# Public (browser-bundled) variables — must be URLs the BROWSER can
# reach, not internal Docker service names.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

# ---------- Stage 3: minimal production runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]