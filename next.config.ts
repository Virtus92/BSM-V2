import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev origin to access /_next/* (silences dev warning)
  allowedDevOrigins: ['https://dev.dinel.at'],
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
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
