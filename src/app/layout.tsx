import { GeistSans } from "geist/font/sans";
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
      <body
        className={`${geistSans.variable} antialiased flex flex-col min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
