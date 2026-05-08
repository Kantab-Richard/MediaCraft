"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  cn,
  downloadFile,
  extractErrorMessage,
  formatDuration,
} from "@/lib/utils";
import { VideoInfo } from "@/types/youtube";
import { WorkspaceProject } from "@/types/workspace";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Download,
  Eye,
  FileVideo,
  Loader2,
  Music,
  PlayCircle,
  User2,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

interface VideoInfoSectionProps {
  videoInfo: VideoInfo;
  url: string;
}

type FormatType = "video" | "audio";

interface DownloadState {
  id?: number;
  status: "idle" | "downloading" | "complete" | "error";
  progress: number;
  downloadUrl?: string;
  error?: string;
  isConverting: boolean;
  isDownloading: boolean;
}

export const VideoInfoSection = ({ videoInfo, url }: VideoInfoSectionProps) => {
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [lastDownloadedQuality, setLastDownloadedQuality] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<FormatType>("video");
  const [selectedExtension, setSelectedExtension] = useState<string>("mp4");
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: "idle",
    progress: 0,
    isConverting: false,
    isDownloading: false,
  });
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const pathname = usePathname();
  const nextPath = useMemo(
    () => `${pathname}?url=${encodeURIComponent(url)}`,
    [pathname, url]
  );

  // Function to trigger file download

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let eventSource: EventSource | undefined;

    if (downloadState.id && downloadState.status === "downloading") {
      cleanup = api.subscribeToProgress(downloadState.id.toString(), {
        onProgress: (progress) => {
          setDownloadState((prev) => ({
            ...prev,
            progress: progress.percentage,
            isConverting: progress.isConverting || false,
          }));
        },
        onComplete: (downloadUrl) => {
          console.log("Download completed with URL:", downloadUrl); // Add logging
          // Close the connection before updating state
          if (eventSource) {
            eventSource.close();
          }
          setDownloadState((prev) => ({
            ...prev,
            status: "complete",
            downloadUrl,
            isConverting: false,
            isDownloading: true,
          }));
          toast.success("Download completed!");
          // Start the file download automatically
          if (downloadUrl) {
            downloadFile(downloadUrl);
          } else {
            toast.error("Download URL not received");
          }
        },
        onError: (error) => {
          // Only show error if it's not a connection close after completion
          if (downloadState.status !== "complete") {
            setDownloadState((prev) => ({
              ...prev,
              status: "error",
              error,
              isConverting: false,
              isDownloading: false,
            }));
            toast.error(error);
          }
        },
        onInit: (es) => {
          eventSource = es;
        },
      });
    }

    return () => {
      if (cleanup) cleanup();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [downloadState.id, downloadState.status]);

  useEffect(() => {
    const syncProjects = () => {
      if (!getAuthSession()) {
        setProjects([]);
        setSelectedProjectId("none");
        return;
      }

      api
        .getWorkspaceProjects()
        .then((data) => {
          setProjects(data);
          if (typeof window === "undefined") {
            return;
          }

          const lastProjectId = window.localStorage.getItem(
            "medicraft_workspace_last_project"
          );

          if (
            lastProjectId &&
            data.some((project) => project.id === lastProjectId)
          ) {
            setSelectedProjectId(lastProjectId);
            return;
          }

          if (data.length === 1) {
            setSelectedProjectId(data[0].id);
          }
        })
        .catch(() => {
          setProjects([]);
        });
    };

    syncProjects();
    window.addEventListener("medicraft-auth-changed", syncProjects);

    return () => {
      window.removeEventListener("medicraft-auth-changed", syncProjects);
    };
  }, []);

  const handleDownload = async () => {
    if (!getAuthSession()) {
      setShowAuthPrompt(true);
      return;
    }

    if (!selectedQuality) {
      toast.error("Please select a quality");
      return;
    }

    setDownloadState({
      status: "downloading",
      progress: 0,
      isConverting: false,
      isDownloading: false,
    });

    try {
      const response =
        activeTab === "video"
          ? await api.downloadVideo(
              url,
              selectedQuality,
              selectedExtension,
              selectedProjectId !== "none" ? selectedProjectId : undefined
            )
          : await api.downloadAudio(
              url,
              selectedQuality,
              selectedExtension,
              selectedProjectId !== "none" ? selectedProjectId : undefined
            );

      setDownloadState((prev) => ({
        ...prev,
        id: response.downloadId,
      }));
      setLastDownloadedQuality(selectedQuality);

      toast.success("Download started!");
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = extractErrorMessage(error);

      setDownloadState({
        status: "error",
        progress: 0,
        error: errorMessage,
        isConverting: false,
        isDownloading: false,
      });
      toast.error(errorMessage);
    }
  };

  const handleDownloadAgain = () => {
    if (downloadState.downloadUrl) {
      downloadFile(downloadState.downloadUrl);
    }
  };

  const handleActiveTab = (tab: FormatType) => {
    setActiveTab(tab);
    setSelectedQuality(null);
    setLastDownloadedQuality(null);
    setSelectedExtension(
      tab === "video"
        ? videoInfo.extensions.video[0] ?? "mp4"
        : videoInfo.extensions.audio[0]
    );
  };

  const isNewDownload =
    selectedQuality !== lastDownloadedQuality ||
    (downloadState.status === "complete" && !lastDownloadedQuality);

  return (
    <div className="flex min-h-screen items-center bg-gradient-to-br from-background via-background/95 to-background py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-4xl px-4 w-full"
      >
        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Video Preview Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[1.75rem] border border-white/5 bg-[#121212] text-white shadow-[0_24px_90px_rgba(0,0,0,0.25)]"
          >
            <div className="border-b border-white/5 px-6 py-4 text-center">
              <p className="text-sm font-medium tracking-wide text-white/90">
                Information
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-black"
              >
                <div className="relative aspect-video bg-[#0c0c0c]">
                  {videoInfo.previewUrl ? (
                    <>
                      <video
                        key={videoInfo.previewUrl}
                        className="h-full w-full object-contain"
                        controls
                        playsInline
                        preload="metadata"
                        poster={videoInfo.thumbnail}
                      >
                        <source
                          src={videoInfo.previewUrl}
                          type={videoInfo.previewMimeType || "video/mp4"}
                        />
                      </video>
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
                    </>
                  ) : (
                    <>
                      <Image
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        fill
                        className="object-contain"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl">
                          <PlayCircle className="h-10 w-10 fill-current" />
                        </div>
                      </div>
                    </>
                  )}

                  {!videoInfo.previewUrl && (
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="px-3 pb-2 text-xs text-white/90 sm:px-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span>0:00</span>
                          <span>{formatDuration(videoInfo.duration)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/15">
                          <div className="h-1.5 w-[8%] rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-lg font-semibold leading-tight text-white md:text-2xl">
                    {videoInfo.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-white/65">
                    {videoInfo.uploader && (
                      <span className="inline-flex items-center gap-2">
                        <User2 className="h-4 w-4 text-primary" />
                        {videoInfo.uploader}
                      </span>
                    )}
                    {!!videoInfo.viewCount && (
                      <span className="inline-flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        {videoInfo.viewCount.toLocaleString()} views
                      </span>
                    )}
                    {!!videoInfo.timestamp && (
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {new Date(videoInfo.timestamp * 1000).toLocaleDateString()}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {formatDuration(videoInfo.duration)}
                    </span>
                  </div>
                </div>

                {videoInfo.description && (
                  <p className="text-sm leading-7 text-white/72 line-clamp-3">
                    {videoInfo.description}
                  </p>
                )}

                {videoInfo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {videoInfo.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Download Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/10 bg-card/30 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-6 ">
              {showAuthPrompt && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm uppercase tracking-[0.2em] text-primary/70">
                        Login required
                      </p>
                      <h3 className="text-lg font-semibold">
                        Register or login before downloading
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Create an account to unlock downloads. Google sign-in is
                        also listed below and will be available soon.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/register?next=${encodeURIComponent(nextPath)}`}
                        className={cn(buttonVariants({ size: "lg" }))}
                      >
                        Register
                      </Link>
                      <Link
                        href={`/login?next=${encodeURIComponent(nextPath)}`}
                        className={cn(
                          buttonVariants({ size: "lg", variant: "outline" })
                        )}
                      >
                        Login
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => toast("Google sign-in is coming soon")}
                      >
                        Continue with Google
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Format Selection */}
              <div className="flex items-center flex-col md:flex-row md:justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap w-full">
                  <div className="flex gap-3">
                    {["video", "audio"].map((tab) => (
                      <Button
                        key={tab}
                        size="lg"
                        onClick={() => handleActiveTab(tab as FormatType)}
                        className={`relative ${
                          activeTab === tab
                            ? "bg-primary hover:bg-primary/90"
                            : "bg-muted/50 hover:bg-muted/80"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Video
                            className={`h-5 w-5 ${
                              activeTab === tab
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`font-semibold capitalize ${
                              activeTab === tab
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {tab}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Select
                      value={selectedExtension}
                      onValueChange={setSelectedExtension}
                    >
                      <SelectTrigger className="h-12 w-[120px] border-none bg-muted/50 px-6 text-base font-medium hover:bg-muted/80">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        {(activeTab === "video"
                          ? videoInfo.extensions.video
                          : videoInfo.extensions.audio
                        ).map((extension) => (
                          <SelectItem
                            key={extension}
                            value={extension}
                            className="text-base"
                          >
                            {extension.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {projects.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Select
                        value={selectedProjectId}
                        onValueChange={setSelectedProjectId}
                      >
                        <SelectTrigger className="h-12 min-w-[180px] border-none bg-muted/50 px-4 text-sm font-medium hover:bg-muted/80">
                          <SelectValue placeholder="Project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </div>

                {selectedQuality && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/20 whitespace-nowrap"
                  >
                    Selected: {selectedQuality}
                  </motion.div>
                )}
              </div>

              {/* Quality Grid */}
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                {(activeTab === "video"
                  ? videoInfo.qualities.video
                  : videoInfo.qualities.audio
                ).map((quality, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={quality}
                  >
                    <Button
                      variant={
                        selectedQuality === quality ? "default" : "outline"
                      }
                      onClick={() => setSelectedQuality(quality)}
                      className="group relative h-auto w-full py-6 transition-all hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex flex-col items-center gap-2">
                        {activeTab === "video" ? (
                          <FileVideo className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                        ) : (
                          <Music className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                        )}
                        <span className="font-medium">{quality}</span>
                      </div>
                      {selectedQuality === quality && (
                        <motion.div
                          layoutId="quality-highlight"
                          className="absolute inset-0 -z-10 rounded-md bg-primary/10 ring-1 ring-primary/20"
                          transition={{ type: "spring", bounce: 0.2 }}
                        />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Progress & Actions */}
              <div className="space-y-4">
                {downloadState.status === "downloading" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-lg bg-muted/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {downloadState.isConverting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Converting
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3" />
                            Downloading
                          </>
                        )}
                      </span>
                      <motion.span
                        key={downloadState.progress}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-medium text-primary"
                      >
                        {downloadState.progress.toFixed(1)}%
                      </motion.span>
                    </div>
                    <div className="relative h-1 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${downloadState.progress}%` }}
                        transition={{ type: "spring", bounce: 0 }}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  {downloadState.status === "complete" &&
                    downloadState.downloadUrl &&
                    !isNewDownload && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        size="lg"
                        onClick={handleDownloadAgain}
                      >
                        <Download className="h-4 w-4" />
                        Download Again
                      </Button>
                    )}

                  {downloadState.status !== "downloading" && isNewDownload && (
                    <Button
                      onClick={handleDownload}
                      disabled={!selectedQuality}
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      <Download className="h-4 w-4" />
                      Start Download
                    </Button>
                  )}

                  {downloadState.status === "downloading" && (
                    <Button disabled className="flex-1 gap-2" size="lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {downloadState.isConverting
                        ? "Converting..."
                        : "Downloading..."}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
