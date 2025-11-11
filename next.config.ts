import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 90, 100],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fbxooowagcadiqpppniy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // TODO: Add 301 redirects from old URLs to new ones.
      // This is crucial for SEO migration.
      // Example:
      // {
      //   source: '/old-path/:slug',
      //   destination: '/new-path/:slug',
      //   permanent: true,
      // },
      {
        source: '/ka-ge/services/intellectual-property-strategy-and-portfolio-management',
        destination: '/services/intellectual-property-strategy-and-portfolio-management',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
