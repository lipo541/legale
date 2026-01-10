import { Playfair_Display, Noto_Serif_Georgian } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Metadata, Viewport } from "next";
import { siteConfig } from "@/lib/config";
import "./globals.css";

// Playfair Display - Elegant serif font for Latin and Cyrillic
// Supports Latin, Latin Extended, Cyrillic (Russian) characters
const playfairDisplay = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

// Noto Serif Georgian - Elegant serif font for Georgian language
// Matches Playfair Display style for consistent look across languages
const notoSerifGeorgian = Noto_Serif_Georgian({
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-noto-georgian",
});

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
        className={`${playfairDisplay.variable} ${notoSerifGeorgian.variable} antialiased flex flex-col min-h-screen overflow-x-hidden`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
