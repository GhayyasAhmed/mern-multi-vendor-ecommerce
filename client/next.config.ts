import type { NextConfig } from "next";

// Server-only: the real backend origin (incl. its /api/v1 base path).
// Never exposed to the browser bundle — the browser always calls the
// relative /api/v1 path so Set-Cookie responses are first-party.
const backendOrigin =
  process.env.BACKEND_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined);

const nextConfig: NextConfig = {
  // "standalone" produces a minimal, self-contained server.js under
  // .next/standalone that client/Dockerfile copies into the runtime
  // image. Only enabled inside the Docker build (DOCKER_BUILD is set as
  // a build ARG in client/Dockerfile) — Vercel's build never sets this,
  // so the existing Vercel deployment is completely unaffected.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    if (!backendOrigin) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;