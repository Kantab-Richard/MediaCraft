"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminDashboard } from "@/components/admin/use-admin-data";
import { cn } from "@/lib/utils";
import { KeyRound, ShieldCheck, Video } from "lucide-react";

const platformColors: Record<string, string> = {
  youtube: "bg-red-500",
  instagram: "bg-pink-500",
  tiktok: "bg-cyan-400",
  twitter: "bg-sky-500",
  facebook: "bg-blue-500",
};

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function AdminOverviewPage() {
  const { data, loading } = useAdminDashboard();

  return (
    <AdminShell
      title="Overview"
      description="Top-level platform health, download volume, and cross-platform trends."
    >
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-white/5"
              />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
            <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
            <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Total Downloads",
                value: formatCompact(data?.metrics.totalDownloads ?? 0),
                note: `${data?.metrics.downloadChange ?? 0}% vs previous 30 days`,
                icon: Video,
              },
              {
                label: "Active API Keys",
                value: formatCompact(data?.metrics.activeApiKeys ?? 0),
                note: `${data?.metrics.totalUsers ?? 0} users in system`,
                icon: KeyRound,
              },
              {
                label: "Storage Saved",
                value: `${data?.metrics.storageSavedGb ?? 0} GB`,
                note: `${data?.metrics.blockedUsers ?? 0} blocked accounts`,
                icon: ShieldCheck,
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-lg backdrop-blur sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{metric.label}</p>
                      <p className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                        {metric.value}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-6 text-sm leading-6 text-slate-500">{metric.note}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
            <article className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-xl backdrop-blur sm:p-6">
              <p className="text-sm text-slate-400">Downloads by platform</p>
              <h3 className="mt-1 text-xl font-semibold">Social Media Breakdown</h3>
              <div className="mt-8 space-y-4">
                {(data?.platformBreakdown ?? []).map((item) => (
                  <div key={item.platform} className="space-y-2">
                    <div className="flex items-center justify-between text-sm capitalize">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            platformColors[item.platform] ?? "bg-slate-400"
                          )}
                        />
                        <span>{item.platform}</span>
                      </div>
                      <span className="text-slate-400">{item.count} downloads</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          platformColors[item.platform] ?? "bg-slate-400"
                        )}
                        style={{ width: `${Math.max(item.percentage, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-xl backdrop-blur sm:p-6">
              <p className="text-sm text-slate-400">Status mix</p>
              <h3 className="mt-1 text-xl font-semibold">Current pipeline balance</h3>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {Object.entries(data?.statusCounts ?? {}).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {status}
                    </p>
                    <p className="mt-4 text-2xl font-semibold sm:text-3xl">{count}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
