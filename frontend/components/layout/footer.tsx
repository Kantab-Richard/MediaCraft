"use client";

import { LogoIcon } from "@/components/ui/icons";
import { Apple, Monitor, Play } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/youtube", label: "YouTube" },
  { href: "/facebook", label: "Facebook" },
  { href: "/instagram", label: "Instagram" },
  { href: "/tiktok", label: "TikTok" },
  { href: "/twitter", label: "Twitter/X" },
];

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-border/50 bg-background/95 px-4 py-12 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <LogoIcon size={34} />
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">
                MediCraftAI
              </p>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Media Tools
              </p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            MediCraftAI builds practical media tools that help creators and teams
            save, convert, and manage video downloads across major platforms with
            a clean, reliable workflow.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Platform</p>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Company</p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Professional media workflow tools for modern web teams.</p>
            <p>Brand: MediCraftAI</p>
            <p>Access: Secure accounts with email or Google sign-in.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl rounded-[28px] border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Download to device</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use MediCraftAI across Android, iPhone, iPad, and Windows devices.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Built for every screen
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Android
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Google Play Store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/10 text-slate-900 dark:bg-white/10 dark:text-white">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                iPhone and iPad
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Apple App Store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Desktop
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Windows App
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} MediCraftAI. All rights reserved.</p>
        <p>Built for reliable video and audio management across the web.</p>
      </div>
    </footer>
  );
}
