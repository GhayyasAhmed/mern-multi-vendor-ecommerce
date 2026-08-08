import type { NextConfig } from "next";
const backendOrigin = process.env.NEXT_PUBLIC_API_URL;
const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    if (!backendOrigin) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;