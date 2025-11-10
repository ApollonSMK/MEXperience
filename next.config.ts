
import type {NextConfig} from 'next';

// Carrega as variáveis de ambiente do .env.local
require('dotenv').config({ path: './.env.local' });

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.me-experience.lu',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  devIndicators: {
    allowedDevOrigins: [
      '*.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
