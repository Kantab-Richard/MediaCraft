import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { Request } from 'express';

type WorkspaceRequest = Request & {
  user?: {
    id: string;
  } | null;
};

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('summary')
  getSummary(@Req() req: WorkspaceRequest) {
    return this.workspaceService.getWorkspaceSummary(req.user?.id);
  }

  @Get('projects')
  listProjects(@Req() req: WorkspaceRequest) {
    return this.workspaceService.listProjects(req.user?.id);
  }

  @Get('projects/:id')
  getProject(@Req() req: WorkspaceRequest, @Param('id') id: string) {
    return this.workspaceService.getProject(req.user?.id, id);
  }

  @Post('projects/:id/attach-unassigned')
  attachUnassignedDownloads(@Req() req: WorkspaceRequest, @Param('id') id: string) {
    return this.workspaceService.attachUnassignedDownloads(req.user?.id, id);
  }

  @Post('projects')
  createProject(
    @Req() req: WorkspaceRequest,
    @Body()
    body: {
      name: string;
      description?: string;
      color?: string;
    },
  ) {
    return this.workspaceService.createProject(req.user?.id, body);
  }

  @Put('projects/:id')
  updateProject(
    @Req() req: WorkspaceRequest,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      color?: string;
    },
  ) {
    return this.workspaceService.updateProject(req.user?.id, id, body);
  }

  @Delete('projects/:id')
  deleteProject(@Req() req: WorkspaceRequest, @Param('id') id: string) {
    return this.workspaceService.deleteProject(req.user?.id, id);
  }
}
