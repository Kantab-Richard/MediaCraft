"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { cn, extractErrorMessage } from "@/lib/utils";
import { WorkspaceSummary } from "@/types/workspace";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Layers3,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Star,
  PlayCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const roadmapLanes = [
  {
    title: "Projects",
    text: "Organize work by campaign, creator, or client instead of tracking loose downloads.",
    icon: FolderKanban,
  },
  {
    title: "History",
    text: "Recent download activity now has a backend home and can grow into a proper job timeline.",
    icon: Layers3,
  },
  {
    title: "Operations",
    text: "This workspace is ready for future AI transforms, automations, and reporting layers.",
    icon: BarChart3,
  },
];

const projectColors = ["#f97316", "#fb7185", "#14b8a6", "#3b82f6", "#a855f7"];
const FAVORITE_PROJECTS_KEY = "medicraft_workspace_favorites";
const LAST_PROJECT_KEY = "medicraft_workspace_last_project";

export function MediaCommandCenter() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [summary, setSummary] = useState<WorkspaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [search, setSearch] = useState("");
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>([]);
  const [lastOpenedProjectId, setLastOpenedProjectId] = useState<string | null>(null);

  const refreshWorkspace = async () => {
    if (!getAuthSession()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getWorkspaceSummary();
      setSummary(data);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedFavorites = window.localStorage.getItem(FAVORITE_PROJECTS_KEY);
      const storedLastProject = window.localStorage.getItem(LAST_PROJECT_KEY);

      if (storedFavorites) {
        setFavoriteProjectIds(JSON.parse(storedFavorites) as string[]);
      }

      if (storedLastProject) {
        setLastOpenedProjectId(storedLastProject);
      }
    } catch {
      setFavoriteProjectIds([]);
      setLastOpenedProjectId(null);
    }
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const session = getAuthSession();
      const authenticated = Boolean(session);

      setIsAuthed(authenticated);

      if (!authenticated) {
        setSummary(null);
        setLoading(false);
        return;
      }

      refreshWorkspace();
    };

    syncAuth();
    window.addEventListener("medicraft-auth-changed", syncAuth);

    return () => {
      window.removeEventListener("medicraft-auth-changed", syncAuth);
    };
  }, []);

  const toggleFavoriteProject = (projectId: string) => {
    setFavoriteProjectIds((current) => {
      const next = current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(FAVORITE_PROJECTS_KEY, JSON.stringify(next));
      }

      return next;
    });
  };

  const markProjectAsOpened = (projectId: string) => {
    setLastOpenedProjectId(projectId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Projects",
        value: String(summary?.metrics.totalProjects ?? 0).padStart(2, "0"),
        detail: "Named workspaces you can keep building on.",
      },
      {
        label: "Saved downloads",
        value: String(summary?.metrics.totalDownloads ?? 0).padStart(2, "0"),
        detail: "User-linked download history captured by the backend.",
      },
      {
        label: "Completed",
        value: String(summary?.metrics.completedDownloads ?? 0).padStart(2, "0"),
        detail: "Finished items ready for later transforms and exports.",
      },
      {
        label: "Stage",
        value: isAuthed ? "Live" : "Auth",
        detail: isAuthed
          ? "Workspace foundation is now connected to your account."
          : "Log in to turn the command center into your personal workspace.",
      },
    ],
    [isAuthed, summary]
  );

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();

    if (!isAuthed) {
      toast.error("Login to create projects");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setCreating(true);
      await api.createWorkspaceProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        color:
          projectColors[
            (summary?.projects.length ?? 0) % projectColors.length
          ],
      });
      setProjectName("");
      setProjectDescription("");
      toast.success("Project created");
      await refreshWorkspace();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const projects = summary?.projects ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    return [...projects].sort((a, b) => {
      const aFav = favoriteProjectIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteProjectIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    }).filter((project) => {
      if (!normalizedSearch) return true;
      return [project.name, project.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [favoriteProjectIds, search, summary?.projects]);

  const continueProject =
    summary?.projects.find((project) => project.id === lastOpenedProjectId) ?? null;

  return (
    <section className="workspace-shell relative overflow-hidden border-t border-border/50 py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
      <div className="container relative space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-600 shadow-sm backdrop-blur dark:border-orange-400/20 dark:bg-white/5 dark:text-orange-200">
              <Sparkles className="h-3.5 w-3.5" />
              Workspace Foundation
            </div>
            <div className="space-y-4">
              <h2 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Projects, saved history, and workspace state are now the next
                real layer of MediCraft.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-foreground/68 sm:text-lg">
                This is the operational base for the bigger product: one place
                to group downloads, keep activity attached to a user, and grow
                into AI transforms, automations, and analytics.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAuthed ? (
                <Button
                  onClick={refreshWorkspace}
                  className="h-12 rounded-full bg-orange-500 px-6 text-white hover:bg-orange-500/90"
                >
                  Refresh Workspace
                </Button>
              ) : (
                <>
                  <Link
                    href="/login?next=/workspace"
                    className={buttonVariants({
                      className:
                        "h-12 rounded-full bg-orange-500 px-6 text-white hover:bg-orange-500/90",
                    })}
                  >
                    Login For Workspace
                  </Link>
                  <Link
                    href="/register?next=/workspace"
                    className={buttonVariants({
                      variant: "ghost",
                      className:
                        "h-12 rounded-full border border-border/70 bg-background/70 px-6",
                    })}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {(loading ? stats : stats).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="grid gap-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-end justify-between gap-4">
                  <span className="text-sm uppercase tracking-[0.2em] text-foreground/45">
                    {stat.label}
                  </span>
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                  </span>
                </div>
                <p className="max-w-md text-sm leading-6 text-foreground/62">
                  {stat.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-[2rem] border border-border/60 bg-zinc-950 text-white shadow-[0_30px_80px_-40px_rgba(20,20,20,0.65)]"
          >
            <div className="border-b border-white/10 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Projects
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Workspace collections
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                  <Rocket className="h-4 w-4 text-orange-300" />
                  Foundation phase live
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-6 py-6 sm:px-8 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-orange-300/75">
                    Create project
                  </p>
                  <p className="text-sm leading-6 text-white/68">
                    Give your downloads a home so later transcript, clip, and
                    export work can stack on top of them.
                  </p>
                </div>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Campaign launch"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/35"
                />
                <textarea
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
                <Button
                  type="submit"
                  disabled={!isAuthed || creating}
                  className="h-11 rounded-full bg-orange-500 px-5 text-white hover:bg-orange-500/90"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      New Project
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Recent projects
                  </p>
                  <span className="text-sm text-white/45">
                    {(summary?.projects.length ?? 0).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="space-y-3">
                  {summary?.projects.length ? (
                    summary.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/workspace/${project.id}`}
                        className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.08]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: project.color || "#f97316",
                                }}
                              />
                              <h4 className="text-base font-semibold text-white">
                                {project.name}
                              </h4>
                            </div>
                            <p className="text-sm leading-6 text-white/65">
                              {project.description || "No description yet."}
                            </p>
                          </div>
                          <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/60">
                            {project._count.downloads} files
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-white/60">
                      {isAuthed
                        ? "Create your first project to start organizing downloads into reusable workspaces."
                        : "Sign in to create projects and keep workspace state attached to your account."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="workspace-panel space-y-6 rounded-[2rem] border border-border/60 p-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-foreground/45">
                Saved history
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Recent download activity
              </h3>
              <p className="text-sm leading-6 text-foreground/62">
                Logged-in downloads now belong to a user and can be surfaced in
                the workspace for future transforms.
              </p>
            </div>

            <div className="space-y-4">
              {summary?.recentDownloads.length ? (
                summary.recentDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="grid gap-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
                          {download.filename}
                        </h4>
                        <p className="text-xs uppercase tracking-[0.16em] text-foreground/45">
                          {download.downloader}
                          {download.project ? ` • ${download.project.name}` : ""}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          download.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-orange-500/10 text-orange-600"
                        )}
                      >
                        {download.status}
                      </div>
                    </div>
                    <p className="line-clamp-1 text-sm text-foreground/58">
                      {download.originalUrl}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-5 text-sm leading-6 text-foreground/60">
                  {isAuthed
                    ? "Start a download while logged in and it will appear here as workspace history."
                    : "Log in before downloading to store history in the workspace."}
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-border/60 pt-6">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/86">
                  Next build layers
                </h4>
              </div>
              {roadmapLanes.map((lane) => (
                <div key={lane.title} className="grid gap-1">
                  <div className="flex items-center gap-3">
                    <lane.icon className="h-4.5 w-4.5 text-orange-500" />
                    <p className="text-sm font-semibold text-foreground">
                      {lane.title}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-foreground/62">
                    {lane.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.08 }}
            className="workspace-browser-panel space-y-6 rounded-[2rem] border border-border/60 p-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)] sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">
                Project browser
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Continue, search, and manage workspaces
              </h3>
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                className="h-12 w-full rounded-full border border-border/60 bg-background px-11 text-sm outline-none transition focus:border-primary/60"
              />
            </div>
          </div>

          {continueProject && (
            <Link
              href={`/workspace/${continueProject.id}`}
              onClick={() => markProjectAsOpened(continueProject.id)}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-orange-300/40 bg-orange-500/5 px-5 py-4 transition-colors hover:bg-orange-500/10"
            >
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-orange-600">
                  Continue where you left off
                </p>
                <h4 className="text-lg font-semibold text-foreground">
                  {continueProject.name}
                </h4>
                <p className="text-sm text-foreground/62">
                  {continueProject._count.downloads} saved downloads in this project
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white">
                <PlayCircle className="h-4 w-4" />
                Resume project
              </div>
            </Link>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.length ? (
              filteredProjects.map((project) => {
                const isFavorite = favoriteProjectIds.includes(project.id);

                return (
                  <Link
                    key={project.id}
                    href={`/workspace/${project.id}`}
                    onClick={() => markProjectAsOpened(project.id)}
                    className="group rounded-[1.5rem] border border-border/60 bg-background/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: project.color || "#f97316" }}
                          />
                          <h4 className="text-base font-semibold text-foreground">
                            {project.name}
                          </h4>
                        </div>
                        <p className="line-clamp-2 text-sm leading-6 text-foreground/60">
                          {project.description || "No description yet."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavoriteProject(project.id);
                        }}
                        className={cn(
                          "rounded-full border p-2 transition-colors",
                          isFavorite
                            ? "border-amber-300/60 bg-amber-400/15 text-amber-500"
                            : "border-border/60 text-foreground/45 hover:text-amber-500"
                        )}
                        aria-label={
                          isFavorite
                            ? `Remove ${project.name} from favorites`
                            : `Add ${project.name} to favorites`
                        }
                      >
                        <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                      </button>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                      <span className="text-foreground/50">
                        {project._count.downloads} downloads
                      </span>
                      <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Open project
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-5 text-sm leading-6 text-foreground/60 md:col-span-2 xl:col-span-3">
                {summary?.projects.length
                  ? "No projects match your search yet."
                  : "Create a project above to start building your workspace library."}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
