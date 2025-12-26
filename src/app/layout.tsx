import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const geistSans = GeistSans;

// Next.js 14+ metadataBase - ავტომატური URL resolution SEO-სთვის
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
};

// Viewport configuration - prevents iOS auto-zoom on input focus
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins with crossorigin for CORS */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fbxooowagcadiqpppniy.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://fbxooowagcadiqpppniy.supabase.co" />
        {/* Hero images are now loaded via SSR data - no static preload needed */}
      </head>
      <body
        className={`${geistSans.variable} antialiased flex flex-col min-h-screen overflow-x-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
