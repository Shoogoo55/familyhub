import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import HouseholdProvider from "@/components/HouseholdProvider";

export const metadata: Metadata = {
  title: "FamilyHub",
  description: "Einkaufslisten, Wochenplanung & Todos für die ganze Familie",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FamilyHub",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f7d4f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <HouseholdProvider>
          <main className="min-h-screen pb-24 pt-0 max-w-2xl mx-auto">
            {children}
          </main>
          <BottomNav />
        </HouseholdProvider>
      </body>
    </html>
  );
}
