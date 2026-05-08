"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminDashboard } from "@/components/admin/use-admin-data";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-300",
  FAILED: "bg-red-500/10 text-red-300",
  DOWNLOADING: "bg-sky-500/10 text-sky-300",
  CONVERTING: "bg-amber-500/10 text-amber-300",
  PENDING: "bg-slate-500/20 text-slate-300",
  EXPIRED: "bg-orange-500/10 text-orange-300",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminDownloadsPage() {
  const { data, loading } = useAdminDashboard();
  const maxVolume = Math.max(
    ...(data?.weeklyVolume ?? [{ value: 1 }]).map((item) => item.value),
    1
  );

  return (
    <AdminShell
      title="Downloads & Stats"
      description="Volume trends, recent activity, and completion health across the downloader."
    >
      {loading ? (
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
          <div className="h-96 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
        </div>
      ) : (
        <>
          <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-xl backdrop-blur sm:p-6">
            <p className="text-sm text-slate-400">Download volume vs time</p>
            <h3 className="mt-1 text-xl font-semibold">Rolling 4-week activity</h3>
            <div className="mt-8 grid h-[240px] grid-cols-4 items-end gap-2 sm:h-[300px] sm:gap-4">
              {(data?.weeklyVolume ?? []).map((entry) => (
                <div key={entry.label} className="flex flex-col items-center gap-3">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 to-cyan-300"
                    style={{ height: `${Math.max((entry.value / maxVolume) * 210, 16)}px` }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-200 sm:text-sm">
                      {entry.value}
                    </p>
                    <span className="text-[11px] text-slate-500 sm:text-xs">
                      {entry.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Recent activity</p>
                <h3 className="mt-1 text-xl font-semibold">Latest downloads</h3>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                {data?.recentDownloads.length ?? 0} rows
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(data?.recentDownloads ?? []).map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{item.fileName}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize text-slate-400">
                          {item.platform}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-xs uppercase tracking-[0.2em] text-slate-500">
                        {item.id} • duration {item.duration}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                          statusColors[item.status] ?? "bg-white/10 text-slate-200"
                        )}
                      >
                        {item.status}
                      </span>
                      <p className="text-xs text-slate-500 sm:mt-2">
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}
