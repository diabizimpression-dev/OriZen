import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/OriZen',
  assetPrefix: '/OriZen',
  images: {
    unoptimized: true, // Required for static export
  },
  // If you have any trailing slash preferences:
  trailingSlash: true,
};

export default nextConfig;
