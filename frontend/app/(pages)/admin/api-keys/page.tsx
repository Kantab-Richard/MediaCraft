"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminApiKeys } from "@/components/admin/use-admin-data";
import { cn } from "@/lib/utils";

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminApiKeysPage() {
  const { data, loading } = useAdminApiKeys();

  return (
    <AdminShell
      title="API Key Control"
      description="Inspect active keys, rate limits, durations, and usage posture across the platform."
    >
      <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Key inventory</p>
            <h3 className="mt-1 text-xl font-semibold">All API keys</h3>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {data.length} keys
          </div>
        </div>

        {loading ? (
          <div className="mt-6 h-96 animate-pulse rounded-[24px] border border-white/10 bg-white/5" />
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {data.map((key) => (
              <article
                key={key.id}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{key.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-500">
                      {key.key}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                      key.isBlocked
                        ? "bg-red-500/10 text-red-300"
                        : "bg-emerald-500/10 text-emerald-300"
                    )}
                  >
                    {key.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Rate limit
                    </p>
                    <p className="mt-2">{key.rateLimit}/hr</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Max duration
                    </p>
                    <p className="mt-2">{key.maxDuration}s</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Last used
                    </p>
                    <p className="mt-2">{formatDateTime(key.lastUsedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Expires
                    </p>
                    <p className="mt-2">{formatDateTime(key.expiresAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
