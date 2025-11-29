import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = GeistSans;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fbxooowagcadiqpppniy.supabase.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://fbxooowagcadiqpppniy.supabase.co" />
        {/* Preload LCP hero image - Night (dark mode) */}
        <link
          rel="preload"
          as="image"
          type="image/webp"
          href="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=50&w=1200&auto=format&fit=crop&fm=webp"
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
