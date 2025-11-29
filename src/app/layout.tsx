import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
// Leaflet CSS moved to MapPicker component only (not needed globally)

const geistSans = GeistSans;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link
          rel="preconnect"
          href="https://fbxooowagcadiqpppniy.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://fbxooowagcadiqpppniy.supabase.co"
        />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
        {/* Preload critical hero image for LCP */}
        <link
          rel="preload"
          href="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=60&w=1920&auto=format&fit=crop&fm=webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        {/* Preload logo */}
        <link
          rel="preload"
          href="/asset/Legal.ge.webp"
          as="image"
          type="image/webp"
        />
        {/* Preload Geist font for faster text rendering */}
        <link
          rel="preload"
          href="/_next/static/media/a34f9d1faa5f3315-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
