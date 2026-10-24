import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
