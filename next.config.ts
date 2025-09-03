import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {},
  // Fix the workspace root warning
  outputFileTracingRoot: process.cwd(),
  // Disable type checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    // unoptimized: true, // This disables Next.js Image Optimization. Remove if not explicitly needed.
  },
  // Enable compression
  compress: true,
  // Headers configuration
  async headers() {
    return [
      {
        // Matching all static files in public directory
        source: "/avatars/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Accept-Encoding",
            value: "br, gzip",
          },
        ],
      },
    ];
  },
  // Optimize performance
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "date-fns",
    ],
  },
  // Bundle analyzer and optimization
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Optimize bundle splitting
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: "ui-components",
            chunks: "all",
            priority: 20,
          },
        },
      };
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
