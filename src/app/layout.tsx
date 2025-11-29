import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = GeistSans;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        {/* Preconnect to Supabase Storage for faster image loading */}
        <link
          rel="preconnect"
          href="https://enijaqzdvzbwwjxzabgp.supabase.co"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://enijaqzdvzbwwjxzabgp.supabase.co"
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
