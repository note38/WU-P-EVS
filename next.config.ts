import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // This will allow Vercel to build even with type errors
  },
  images: {
    domains: ["api.dicebear.com", "ui-avatars.com"],
  },
};

export default nextConfig;
