"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminUsers } from "@/components/admin/use-admin-data";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AdminUser } from "@/types/admin";
import { LoaderCircle, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Something went wrong";
}

export default function AdminUsersPage() {
  const { data, loading, setData } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [saving, startSaving] = useTransition();
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setEditName(editingUser?.name ?? "");
    setEditPassword("");
    setEditIsAdmin(Boolean(editingUser?.isAdmin));
  }, [editingUser]);

  const filteredUsers = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    if (!term) return data;
    return data.filter((user) =>
      [user.id, user.email, user.name ?? "", `${user.apiKeys?.length ?? 0}`]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data, deferredSearch]);

  const updateUserInState = (updated: AdminUser) => {
    setData((current) =>
      current.map((user) => (user.id === updated.id ? { ...user, ...updated } : user))
    );
  };

  const handleToggleBlock = () => {
    if (!confirmUser) return;

    startSaving(async () => {
      try {
        const updated = await api.updateAdminUser(confirmUser.id, {
          isBlocked: !confirmUser.isBlocked,
        });
        updateUserInState(updated);
        setConfirmUser(null);
        toast.success(updated.isBlocked ? "User blocked" : "User unblocked");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    startSaving(async () => {
      try {
        const updated = await api.updateAdminUser(editingUser.id, {
          name: editName.trim() || undefined,
          password: editPassword.trim() || undefined,
          isAdmin: editIsAdmin,
        });
        updateUserInState(updated);
        setEditingUser(null);
        toast.success("User updated");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    });
  };

  return (
    <>
      <AdminShell
        title="User Management"
        description="Search accounts, block or unblock access, and update names or admin roles."
      >
        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">User directory</p>
              <h3 className="mt-1 text-xl font-semibold">Searchable user grid</h3>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email, name, id, or key count"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-sky-400/50"
            />
          </div>

          {loading ? (
            <div className="mt-6 h-96 animate-pulse rounded-[24px] border border-white/10 bg-white/5" />
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
              <div className="space-y-3 p-3 lg:hidden">
                {filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-100">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-400">{user.email}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                          user.isAdmin
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-sky-500/10 text-sky-300"
                        )}
                      >
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                          user.isBlocked
                            ? "bg-red-500/10 text-red-300"
                            : "bg-emerald-500/10 text-emerald-300"
                        )}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                      <span className="inline-flex rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                        Created {formatDate(user.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-red-400/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                        onClick={() => setConfirmUser(user)}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit user
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr_1fr] gap-4 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 lg:grid">
                <span>Name / Email</span>
                <span>Status</span>
                <span>Role</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              <div className="hidden divide-y divide-white/5 lg:block">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid gap-4 px-4 py-4 text-sm lg:grid-cols-[1.6fr_0.8fr_0.7fr_0.9fr_1fr]"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{user.name || "Unnamed user"}</p>
                      <p className="text-slate-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 lg:hidden">Status</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                          user.isBlocked
                            ? "bg-red-500/10 text-red-300"
                            : "bg-emerald-500/10 text-emerald-300"
                        )}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 lg:hidden">Role</span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                          user.isAdmin
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-sky-500/10 text-sky-300"
                        )}
                      >
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 lg:block">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 lg:hidden">Created</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
                        onClick={() => setConfirmUser(user)}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </AdminShell>

      {confirmUser && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Confirm action</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              {confirmUser.isBlocked ? "Unblock this user?" : "Block this user?"}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {confirmUser.isBlocked
                ? `Restore access for ${confirmUser.email}.`
                : `This will stop ${confirmUser.email} from using the platform until restored.`}
            </p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                className="rounded-xl px-4 py-2 text-sm text-slate-300"
                onClick={() => setConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white"
                onClick={handleToggleBlock}
                disabled={saving}
              >
                {saving ? "Saving..." : confirmUser.isBlocked ? "Unblock user" : "Block user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-y-0 right-0 z-[75] w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Edit user</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{editingUser.email}</h3>
            </div>
            <button
              className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              onClick={() => setEditingUser(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Display name</span>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-sky-400/50"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Reset password</span>
              <input
                type="password"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-sky-400/50"
                placeholder="Leave blank to keep current password"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-100">Administrator role</p>
                <p className="text-xs text-slate-500">Allow access to admin controls.</p>
              </div>
              <input
                type="checkbox"
                checked={editIsAdmin}
                onChange={(event) => setEditIsAdmin(event.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              className="rounded-xl px-4 py-2 text-sm text-slate-300"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950"
              onClick={handleSaveUser}
              disabled={saving}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
