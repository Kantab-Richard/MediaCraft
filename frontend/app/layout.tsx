import { ThemeProvider } from "@/components/ui/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import GoogleAnalytics from "@/components/layout/GoogleAnalytics";
import PwaProvider from "@/components/layout/pwa-provider";
import { InstallAppBanner } from "@/components/layout/install-app-banner";

export const metadata: Metadata = {
  title: "Medicraft - Universal Video Downloader",
  description:
    "Medicraft is the ultimate video downloader for YouTube, Facebook, Instagram, TikTok, Twitter, and more. Save videos and audio in high-quality formats effortlessly.",
  keywords:
    "video downloader, YouTube downloader, Facebook video downloader, TikTok video downloader, Instagram video downloader, Twitter video saver, universal video downloader, download videos online, HD video downloader, multi-format downloader",
  robots: "index, follow",
  openGraph: {
    title: "Medicraft - Universal Video Downloader",
    description:
      "Download videos and audio from all popular platforms, including YouTube, Facebook, Instagram, TikTok, and Twitter. Medicraft supports multiple formats and resolutions.",
    url: "https://www.medicraft.com",
    siteName: "Medicraft",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medicraft - Universal Video Downloader",
    description:
      "Save videos and audio from YouTube, Facebook, Instagram, TikTok, Twitter, and more with Medicraft. Fast, easy, and versatile.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/icon-180.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MediCraft",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PwaProvider />
          {children}
          <InstallAppBanner />
          <Toaster position="bottom-right" />
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
