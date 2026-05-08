import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DownloadStatus } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Login required');
    }

    return userId;
  }

  async createProject(
    userId: string | undefined,
    data: { name: string; description?: string; color?: string },
  ) {
    const ownerId = this.requireUserId(userId);
    const name = data.name.trim();

    if (!name) {
      throw new BadRequestException('Project name is required');
    }

    return this.prisma.project.create({
      data: {
        userId: ownerId,
        name,
        description: data.description?.trim() || null,
        color: data.color?.trim() || '#f97316',
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    });
  }

  async listProjects(userId: string | undefined) {
    const ownerId = this.requireUserId(userId);

    return this.prisma.project.findMany({
      where: { userId: ownerId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    });
  }

  async getProject(userId: string | undefined, projectId: string) {
    const ownerId = this.requireUserId(userId);

    const [project, unassignedDownloadsCount] = await Promise.all([
      this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId: ownerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: true,
          },
        },
        downloads: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            filename: true,
            originalUrl: true,
            downloader: true,
            status: true,
            downloadUrl: true,
            createdAt: true,
          },
        },
      },
      }),
      this.prisma.download.count({
        where: {
          userId: ownerId,
          projectId: null,
        },
      }),
    ]);

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    return {
      ...project,
      unassignedDownloadsCount,
    };
  }

  async attachUnassignedDownloads(userId: string | undefined, projectId: string) {
    const ownerId = this.requireUserId(userId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId: ownerId,
      },
      select: { id: true },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const result = await this.prisma.download.updateMany({
      where: {
        userId: ownerId,
        projectId: null,
      },
      data: {
        projectId,
      },
    });

    return {
      attachedCount: result.count,
    };
  }

  async updateProject(
    userId: string | undefined,
    projectId: string,
    data: { name?: string; description?: string; color?: string },
  ) {
    const ownerId = this.requireUserId(userId);

    const existing = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId: ownerId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new BadRequestException('Project not found');
    }

    const updateData: {
      name?: string;
      description?: string | null;
      color?: string;
    } = {};

    if (typeof data.name === 'string') {
      const name = data.name.trim();
      if (!name) {
        throw new BadRequestException('Project name is required');
      }
      updateData.name = name;
    }

    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null;
    }

    if (typeof data.color === 'string' && data.color.trim()) {
      updateData.color = data.color.trim();
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    });
  }

  async deleteProject(userId: string | undefined, projectId: string) {
    const ownerId = this.requireUserId(userId);

    const existing = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId: ownerId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new BadRequestException('Project not found');
    }

    await this.prisma.download.updateMany({
      where: {
        projectId,
        userId: ownerId,
      },
      data: {
        projectId: null,
      },
    });

    return this.prisma.project.delete({
      where: { id: projectId },
      select: { id: true, name: true },
    });
  }

  async getWorkspaceSummary(userId: string | undefined) {
    const ownerId = this.requireUserId(userId);

    const [projects, recentDownloads, totalProjects, totalDownloads, completedDownloads] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId: ownerId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              downloads: true,
            },
          },
        },
      }),
      this.prisma.download.findMany({
        where: { userId: ownerId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          filename: true,
          originalUrl: true,
          downloader: true,
          status: true,
          downloadUrl: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      }),
      this.prisma.project.count({
        where: { userId: ownerId },
      }),
      this.prisma.download.count({
        where: { userId: ownerId },
      }),
      this.prisma.download.count({
        where: {
          userId: ownerId,
          status: DownloadStatus.COMPLETED,
        },
      }),
    ]);

    return {
      metrics: {
        totalProjects,
        totalDownloads,
        completedDownloads,
        activeProjects: projects.length,
      },
      projects,
      recentDownloads,
    };
  }
}
