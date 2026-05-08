import { ApiError, DownloadResponse } from "@/types/api";
import { AdminApiKey, AdminDashboard, AdminUser } from "@/types/admin";
import {
  WorkspaceProject,
  WorkspaceProjectDetail,
  WorkspaceSummary,
} from "@/types/workspace";
import { VideoInfo } from "@/types/youtube";
import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthSession } from "./auth";

interface ProgressCallbacks {
  onProgress: (progress: ProgressData) => void;
  onComplete: (downloadUrl: string) => void;
  onError: (error: string) => void;
  onInit?: (eventSource: EventSource) => void;
}

interface ProgressData {
  percentage: number;
  isConverting?: boolean;
  status?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Automatically attach API Key from localStorage
    this.client.interceptors.request.use((config) => {
      const apiKey = localStorage.getItem("medicraft_api_key");
      if (apiKey) {
        config.headers["X-API-Key"] = apiKey;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          throw {
            message: error.response.data.message || "An error occurred",
            statusCode: error.response.status,
          };
        }
        throw {
          message: "Network error",
          statusCode: 500,
        };
      }
    );
  }

  async signup(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthSession> {
    try {
      const response = await this.client.post<AuthSession>("/auth/signup", {
        email,
        password,
        name,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(email: string, password: string): Promise<AuthSession> {
    try {
      const response = await this.client.post<AuthSession>("/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      // const platform = detectPlatform(url)!;
      const response = await this.client.post<VideoInfo>(`/info`, {
        url,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async downloadVideo(
    url: string,
    quality: string,
    extension: string,
    projectId?: string
  ): Promise<DownloadResponse> {
    try {
      const response = await this.client.post<DownloadResponse>(
        "/download/video",
        {
          url,
          quality,
          extension,
          projectId,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async downloadAudio(
    url: string,
    quality: string,
    extension: string,
    projectId?: string
  ): Promise<DownloadResponse> {
    try {
      const response = await this.client.post<DownloadResponse>(
        "/download/audio",
        {
          url,
          quality,
          extension,
          projectId,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  subscribeToProgress(
    downloadId: string,
    callbacks: ProgressCallbacks
  ): () => void {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/download/${downloadId}/progress`,
      { withCredentials: true }
    );

    if (callbacks.onInit) {
      callbacks.onInit(eventSource);
    }

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progress") {
        callbacks.onProgress(data);
      } else if (data.type === "complete") {
        callbacks.onComplete(data.fileName);
      } else if (data.type === "error") {
        callbacks.onError(data.message);
      }
    };

    eventSource.onerror = () => {
      callbacks.onError("Connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }

  async getDownloadStatus(downloadId: number) {
    try {
      const response = await this.client.get(`/download/${downloadId}/status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async googleLogin(idToken: string): Promise<AuthSession> {
    try {
      const response = await this.client.post<AuthSession>("/auth/google", {
        idToken,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAdminDashboard(): Promise<AdminDashboard> {
    try {
      const response = await this.client.get<AdminDashboard>("/admin/dashboard");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const response = await this.client.get<AdminUser[]>("/users", {
        params: { includeApiKeys: true },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAdminUser(
    userId: string,
    data: {
      name?: string;
      isBlocked?: boolean;
      isAdmin?: boolean;
      password?: string;
    }
  ): Promise<AdminUser> {
    try {
      const response = await this.client.put<AdminUser>(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllApiKeys(): Promise<AdminApiKey[]> {
    try {
      const response = await this.client.get<AdminApiKey[]>("/api-keys/all");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWorkspaceSummary(): Promise<WorkspaceSummary> {
    try {
      const response = await this.client.get<WorkspaceSummary>("/workspace/summary");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWorkspaceProjects(): Promise<WorkspaceProject[]> {
    try {
      const response = await this.client.get<WorkspaceProject[]>("/workspace/projects");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createWorkspaceProject(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<WorkspaceProject> {
    try {
      const response = await this.client.post<WorkspaceProject>("/workspace/projects", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWorkspaceProject(projectId: string): Promise<WorkspaceProjectDetail> {
    try {
      const response = await this.client.get<WorkspaceProjectDetail>(
        `/workspace/projects/${projectId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async attachUnassignedDownloadsToProject(
    projectId: string
  ): Promise<{ attachedCount: number }> {
    try {
      const response = await this.client.post<{ attachedCount: number }>(
        `/workspace/projects/${projectId}/attach-unassigned`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateWorkspaceProject(
    projectId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
    }
  ): Promise<WorkspaceProject> {
    try {
      const response = await this.client.put<WorkspaceProject>(
        `/workspace/projects/${projectId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteWorkspaceProject(projectId: string): Promise<{ id: string; name: string }> {
    try {
      const response = await this.client.delete<{ id: string; name: string }>(
        `/workspace/projects/${projectId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    if (error && typeof error === "object" && "statusCode" in error) {
      return error as ApiError;
    }
    return {
      message: "An unexpected error occurred",
      statusCode: 500,
    };
  }
}

export const api = new ApiClient();
export default ApiClient;
