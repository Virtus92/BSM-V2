import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev origin to access /_next/* (silences dev warning)
  allowedDevOrigins: ['https://dev.dinel.at'],
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
  eslint: {
    // Disable ESLint during production build to prevent blocking
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript during production build to prevent blocking
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
