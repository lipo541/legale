import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Header from "@/components/header/Header";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LegalGE - იურიდიული სერვისების პლატფორმა",
  description: "იპოვეთ საუკეთესო იურიდიული სპეციალისტები და კომპანიები საქართველოში",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>
          <Header />
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
