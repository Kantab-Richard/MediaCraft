"use client";

import dynamic from "next/dynamic";
import React from "react";

const Navbar = dynamic(
  () => import("@/components/layout/navbar").then((mod) => mod.Navbar),
  { ssr: false }
);

const Footer = dynamic(
  () => import("@/components/layout/footer").then((mod) => mod.Footer),
  { ssr: false }
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
