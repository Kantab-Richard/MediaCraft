export interface WorkspaceProject {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    downloads: number;
  };
}

export interface WorkspaceDownload {
  id: string;
  filename: string;
  originalUrl: string;
  downloader: string;
  status: "PENDING" | "DOWNLOADING" | "CONVERTING" | "COMPLETED" | "FAILED" | "EXPIRED";
  downloadUrl?: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

export interface WorkspaceSummary {
  metrics: {
    totalProjects: number;
    totalDownloads: number;
    completedDownloads: number;
    activeProjects: number;
  };
  projects: WorkspaceProject[];
  recentDownloads: WorkspaceDownload[];
}

export interface WorkspaceProjectDetail extends WorkspaceProject {
  unassignedDownloadsCount?: number;
  downloads: Array<{
    id: string;
    filename: string;
    originalUrl: string;
    downloader: string;
    status: "PENDING" | "DOWNLOADING" | "CONVERTING" | "COMPLETED" | "FAILED" | "EXPIRED";
    downloadUrl?: string | null;
    createdAt: string;
  }>;
}
