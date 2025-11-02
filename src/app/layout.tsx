import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Header from "@/components/header/Header";
import { Providers } from "@/components/providers/Providers";

const geistSans = GeistSans;

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
        className={`${geistSans.variable} antialiased`}
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
