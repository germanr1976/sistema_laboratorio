import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;