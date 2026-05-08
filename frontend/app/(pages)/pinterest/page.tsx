import { Suspense } from "react";
import { Metadata } from "next";
import Page from "@/components/common/Page";

export const metadata: Metadata = {
  title: "Medicraft - Download Pinterest Videos",
  description:
    "Download Pinterest videos and idea pins in high quality. Fast, simple, and easy to use on any device.",
  keywords:
    "Pinterest video downloader, Pinterest downloader, idea pin downloader, download Pinterest videos, save Pinterest videos",
  robots: "index, follow",
  openGraph: {
    title: "Medicraft - Download Pinterest Videos",
    description:
      "Download Pinterest videos and idea pins in high quality. Fast, simple, and easy to use on any device.",
    url: "https://www.medicraft.com/pinterest",
    siteName: "Medicraft",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medicraft - Download Pinterest Videos",
    description:
      "Download Pinterest videos and idea pins in high quality. Fast, simple, and easy to use on any device.",
  },
  alternates: {
    canonical: "https://www.medicraft.com/pinterest",
  },
};

export default function page() {
  return (
    <Suspense fallback={null}>
      <Page
        platform="pinterest"
        news="Now with Pinterest video support"
        title={["Download Pinterest", "Videos & Pins"]}
        description="Download Pinterest videos and idea pins in high quality formats. Fast, free, and easy to use."
        placeholder="Paste Pinterest URL here..."
      />
    </Suspense>
  );
}
