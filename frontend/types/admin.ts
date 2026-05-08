export type AdminDashboardMetricSet = {
  totalDownloads: number;
  downloadChange: number;
  activeApiKeys: number;
  storageSavedGb: number;
  totalUsers: number;
  blockedUsers: number;
};

export type AdminPlatformBreakdown = {
  platform: string;
  count: number;
  percentage: number;
};

export type AdminWeeklyVolume = {
  label: string;
  value: number;
};

export type AdminRecentDownload = {
  id: string;
  fileName: string;
  platform: string;
  status: string;
  timestamp: string;
  duration: string;
};

export type AdminDashboard = {
  metrics: AdminDashboardMetricSet;
  platformBreakdown: AdminPlatformBreakdown[];
  weeklyVolume: AdminWeeklyVolume[];
  recentDownloads: AdminRecentDownload[];
  statusCounts: Record<string, number>;
};

export type AdminApiKey = {
  id: string;
  key: string;
  name: string;
  userId: string;
  rateLimit: number;
  maxDuration: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  apiKeys?: AdminApiKey[];
};
