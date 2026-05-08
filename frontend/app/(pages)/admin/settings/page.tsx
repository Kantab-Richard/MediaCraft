"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminDashboard } from "@/components/admin/use-admin-data";

export default function AdminSettingsPage() {
  const { data, loading } = useAdminDashboard();

  return (
    <AdminShell
      title="System Settings"
      description="Operational notes and high-level limits for the current admin environment."
    >
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-lg backdrop-blur sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Auth model</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              API-key protected backend with admin-only routes and browser-stored user session metadata.
            </p>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-lg backdrop-blur sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operational load</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {data?.metrics.totalDownloads ?? 0} lifetime downloads across {data?.metrics.totalUsers ?? 0} registered users.
            </p>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-lg backdrop-blur sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Risk posture</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {data?.metrics.blockedUsers ?? 0} blocked users currently flagged, with {data?.metrics.activeApiKeys ?? 0} active API keys in circulation.
            </p>
          </article>
        </section>
      )}
    </AdminShell>
  );
}
