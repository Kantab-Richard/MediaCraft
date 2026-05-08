"use client";

import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";
import { WorkspaceProjectDetail } from "@/types/workspace";
import { motion } from "framer-motion";
import { ArrowLeft, FolderKanban, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<WorkspaceProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await api.getWorkspaceProject(projectId);
        setProject(data);
        setName(data.name);
        setDescription(data.description || "");
        if (typeof window !== "undefined") {
          window.localStorage.setItem("medicraft_workspace_last_project", data.id);
        }
      } catch (error) {
        toast.error(extractErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setSaving(true);
      await api.updateWorkspaceProject(projectId, {
        name: name.trim(),
        description: description.trim(),
        color: project?.color || undefined,
      });
      toast.success("Project updated");
      setEditing(false);
      setLoading(true);
      const refreshed = await api.getWorkspaceProject(projectId);
      setProject(refreshed);
      setName(refreshed.name);
      setDescription(refreshed.description || "");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this project? Downloads will stay in history but be removed from this project.");

    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.deleteWorkspaceProject(projectId);
      toast.success("Project deleted");
      router.push("/workspace");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setDeleting(false);
    }
  };

  const handleAttachUnassignedDownloads = async () => {
    try {
      setAttaching(true);
      const result = await api.attachUnassignedDownloadsToProject(projectId);

      if (result.attachedCount === 0) {
        toast("No unassigned downloads were available to attach");
      } else {
        toast.success(
          `${result.attachedCount} download${result.attachedCount === 1 ? "" : "s"} attached to this project`
        );
      }

      const refreshed = await api.getWorkspaceProject(projectId);
      setProject(refreshed);
      setName(refreshed.name);
      setDescription(refreshed.description || "");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setAttaching(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="container flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold">Project not found.</p>
          <Link href="/workspace" className={buttonVariants({ variant: "outline" })}>
            Back to Workspace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <section className="container space-y-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Link>
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: project.color || "#f97316" }}
              />
              <h1 className="text-4xl font-semibold tracking-tight">
                {project.name}
              </h1>
            </div>
            <p className="max-w-2xl text-base leading-7 text-foreground/66">
              {project.description || "This project is ready for downloads, transcripts, clips, and future workspace actions."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!!project.unassignedDownloadsCount && (
              <button
                type="button"
                onClick={handleAttachUnassignedDownloads}
                disabled={attaching}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/5 px-5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-60"
              >
                {attaching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Attach {project.unassignedDownloadsCount} unassigned download
                {project.unassignedDownloadsCount === 1 ? "" : "s"}
              </button>
            )}
            <div className="rounded-3xl border border-border/60 bg-card/70 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">
                Stored downloads
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {project._count.downloads}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border/60 bg-card/70 px-5 text-sm font-medium transition-colors hover:bg-card"
            >
              <Pencil className="h-4 w-4" />
              {editing ? "Close editor" : "Edit project"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-red-200 bg-red-500/5 px-5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete project
            </button>
          </div>
        </div>

        {editing && (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="grid gap-4 rounded-[2rem] border border-border/60 bg-card/65 p-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)]"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-foreground/45">
                Project settings
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Update workspace details
              </h2>
            </div>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary/60"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Project description"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/60"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(project.name);
                  setDescription(project.description || "");
                }}
                className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-border/60 bg-card/65 p-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)]"
        >
          <div className="mb-6 flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">
              Project history
            </h2>
          </div>

          <div className="space-y-4">
            {project.downloads.length ? (
              project.downloads.map((download) => (
                <div
                  key={download.id}
                  className="grid gap-2 rounded-2xl border border-border/60 bg-background/75 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {download.filename}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-foreground/45">
                        {download.downloader} | {download.status}
                      </p>
                    </div>
                  </div>
                  <p className="line-clamp-1 text-sm text-foreground/60">
                    {download.originalUrl}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-5 text-sm leading-6 text-foreground/60">
                No downloads are attached to this project yet. Use the project
                picker during download to save items here.
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
