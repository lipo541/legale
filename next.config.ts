import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // SWC compiler options for modern browsers (removes unnecessary polyfills)
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  
  // Modern JavaScript optimizations
  experimental: {
    // Enable modern JS output (ES2020+)
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react', 'date-fns'],
  },
  
  // Transpile only for modern browsers (ES2020+)
  transpilePackages: [],
  
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
      // WWW to non-WWW redirect (308 permanent)
      // Primary domain: legal.ge
      // www.legal.ge redirects to legal.ge
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.legal.ge',
          },
        ],
        destination: 'https://legal.ge/:path*',
        permanent: true, // 308 status code
      },
      // Redirect non-locale paths to /ka/ (default locale)
      // This catches paths like /practices/... /specialists/... /companies/... etc.
      {
        source: '/practices/:path*',
        destination: '/ka/practices/:path*',
        permanent: false, // 307 - temporary, so users can change language
      },
      {
        source: '/specialists/:path*',
        destination: '/ka/specialists/:path*',
        permanent: false,
      },
      {
        source: '/companies/:path*',
        destination: '/ka/companies/:path*',
        permanent: false,
      },
      {
        source: '/news/:path*',
        destination: '/ka/news/:path*',
        permanent: false,
      },
      {
        source: '/contact',
        destination: '/ka/contact',
        permanent: false,
      },
      {
        source: '/privacy',
        destination: '/ka/privacy',
        permanent: false,
      },
      {
        source: '/terms',
        destination: '/ka/terms',
        permanent: false,
      },
      {
        source: '/cookies',
        destination: '/ka/cookies',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/ka/login',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/ka/register',
        permanent: false,
      },
      // Legacy redirects
      {
        source: '/ka-ge/services/intellectual-property-strategy-and-portfolio-management',
        destination: '/services/intellectual-property-strategy-and-portfolio-management',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
