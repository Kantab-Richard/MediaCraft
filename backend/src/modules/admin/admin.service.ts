import { Injectable } from '@nestjs/common';
import { DownloadStatus, Downloaders } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PlatformKey = Lowercase<keyof typeof Downloaders>;

const PLATFORM_ORDER: PlatformKey[] = ['youtube', 'instagram', 'pinterest', 'tiktok', 'twitter', 'facebook'];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 29);

    const previous30Days = new Date(last30Days);
    previous30Days.setDate(last30Days.getDate() - 30);

    const [
      totalDownloads,
      previousDownloads,
      activeApiKeys,
      totalUsers,
      blockedUsers,
      downloadsByPlatformRaw,
      recentDownloadsRaw,
      allDownloadsInWindow,
    ] = await Promise.all([
      this.prisma.download.count(),
      this.prisma.download.count({
        where: {
          createdAt: {
            gte: previous30Days,
            lt: last30Days,
          },
        },
      }),
      this.prisma.apiKey.count({
        where: {
          isBlocked: false,
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          isBlocked: true,
        },
      }),
      this.prisma.download.groupBy({
        by: ['downloader'],
        _count: {
          _all: true,
        },
      }),
      this.prisma.download.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          filename: true,
          downloader: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.download.findMany({
        where: {
          createdAt: {
            gte: last30Days,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    const totalPlatformDownloads = downloadsByPlatformRaw.reduce((sum, item) => sum + item._count._all, 0);

    const platformCounts = new Map<PlatformKey, number>(PLATFORM_ORDER.map((platform) => [platform, 0]));

    for (const item of downloadsByPlatformRaw) {
      platformCounts.set(item.downloader.toLowerCase() as PlatformKey, item._count._all);
    }

    const platformBreakdown = PLATFORM_ORDER.map((platform) => {
      const count = platformCounts.get(platform) ?? 0;
      const percentage = totalPlatformDownloads === 0 ? 0 : Math.round((count / totalPlatformDownloads) * 100);

      return {
        platform,
        count,
        percentage,
      };
    });

    const weeklyBuckets = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(last30Days);
      start.setDate(last30Days.getDate() + index * 7);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return {
        label: `W${index + 1}`,
        start,
        end,
        value: 0,
      };
    });

    for (const item of allDownloadsInWindow) {
      const createdAt = item.createdAt.getTime();
      const bucket = weeklyBuckets.find(
        (entry) => createdAt >= entry.start.getTime() && createdAt <= entry.end.getTime(),
      );

      if (bucket) {
        bucket.value += 1;
      }
    }

    const weeklyVolume = weeklyBuckets.map(({ label, value }) => ({
      label,
      value,
    }));

    const previousSafeValue = previousDownloads || 1;
    const downloadChange = Math.round(((totalDownloads - previousDownloads) / previousSafeValue) * 100);

    const storageSavedGb = Math.round(totalDownloads * 0.12 * 10) / 10;

    const recentDownloads = recentDownloadsRaw.map((download) => ({
      id: download.id,
      fileName: download.filename,
      platform: download.downloader.toLowerCase(),
      status: download.status,
      timestamp: download.createdAt,
      duration: this.extractDuration(download.filename),
    }));

    return {
      metrics: {
        totalDownloads,
        downloadChange,
        activeApiKeys,
        storageSavedGb,
        totalUsers,
        blockedUsers,
      },
      platformBreakdown,
      weeklyVolume,
      recentDownloads,
      statusCounts: this.countStatuses(recentDownloadsRaw.map((item) => item.status)),
    };
  }

  private countStatuses(statuses: DownloadStatus[]) {
    return statuses.reduce(
      (acc, status) => {
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {} as Record<DownloadStatus, number>,
    );
  }

  private extractDuration(filename: string) {
    const match = filename.match(/(\d{1,2})m[_-](\d{1,2})s/i);

    if (!match) {
      return '--:--';
    }

    return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
  }
}
