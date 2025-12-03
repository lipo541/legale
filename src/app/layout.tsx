import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const geistSans = GeistSans;

// Next.js 14+ metadataBase - ავტომატური URL resolution SEO-სთვის
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
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
        {/* Preload LCP hero image */}
        <link
          rel="preload"
          as="image"
          type="image/webp"
          href="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=30&w=1200&auto=format&fit=crop&fm=webp"
          fetchPriority="high"
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
