"use client";

import { buttonVariants } from "@/components/ui/button";
import { getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronRight,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/downloads", label: "Downloads & Stats", icon: Activity },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/api-keys", label: "API Key Control", icon: KeyRound },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
] as const;

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setAdminUser(getStoredUser());
  }, []);

  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  if (!adminUser?.isAdmin) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-slate-900/40 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <Settings className="h-8 w-8" />
          </div>
          <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
            Access Denied
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Restricted Area
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            This management console requires administrative privileges. Please authenticate with an authorized account.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login?next=/admin"
              className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}
            >
              Identify as Admin
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-screen bg-[#020617] bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.08),_transparent_40%)] px-4 pb-4 pt-20 text-slate-100">
      <div className="mx-auto grid h-full max-w-[1800px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-white/5 bg-slate-900/20 p-4 shadow-2xl backdrop-blur-md">
          <div className="mb-8 px-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-400">
                Platform Core
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
                MediCraft <span className="text-slate-500">CMS</span>
              </h1>
            </div>
          </div>

          <nav className="space-y-1 lg:min-h-0 lg:overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-sky-500/10 text-sky-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/5 pt-6">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                System Administrator
              </p>
              <p className="mt-2 truncate text-sm font-medium text-white">{adminUser.name || "Administrator"}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{adminUser.email}</p>
            </div>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 w-full rounded-xl border-white/10 bg-transparent text-xs text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Return to Portal
            </Link>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col gap-6">
          <header className="rounded-[24px] border border-white/5 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="hover:text-slate-300 cursor-default">Admin</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-sky-400">{title}</span>
                </nav>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-400 xl:text-[15px]">
                  {description}
                </p>
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  placeholder="Search repository..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:bg-white/10 focus:border-sky-400/40"
                />
              </div>
            </div>
          </header>

          <div className="min-h-0 overflow-y-auto pr-1 pb-2">
            <div className="space-y-6 xl:space-y-7">{children}</div>
          </div>
        </main>
      </div>
    </section>
  );
}
