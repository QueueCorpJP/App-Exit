import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Placeholder images
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Placeholder images
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash images for mock data
      },
    ],
    // 画像読み込みエラー時の動作を設定
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
