import { Body, Controller, Get, Headers, Param, Post, Req, Res, Sse, UseGuards } from '@nestjs/common';
import { interval, Observable, switchMap, takeWhile } from 'rxjs';
import { DownloadService } from './download.service';
import { DownloadAudioDto, DownloadVideoDto } from './dto/download.dto';
import { ValidUrlGuard } from '../auth/platform.guard';
import { Public } from '../auth/public.decorator';
import { Request, Response } from 'express';

@Controller('download')
@Public()
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @Post('video')
  @UseGuards(ValidUrlGuard)
  downloadVideo(@Body() body: DownloadVideoDto, @Req() req: Request) {
    return this.downloadService.downloadVideo(body.url, body.quality, body.extension, body.projectId, req);
  }

  @Post('audio')
  @UseGuards(ValidUrlGuard)
  downloadAudio(@Body() body: DownloadAudioDto, @Req() req: Request) {
    return this.downloadService.downloadAudio(body.url, body.quality, body.extension, body.projectId, req);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.downloadService.getDownloadStatus(id);
  }

  @Get(':filename')
  async getFileByName(
    @Param('filename') filename: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    const { stream, headers } = await this.downloadService.getFile(filename, range);

    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, String(value)));
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    if (range) {
      res.status(206);
    }

    stream.pipe(res);
  }

  @Sse(':id/progress')
  subscribeToProgress(@Param('id') id: string): Observable<any> {
    return interval(1000).pipe(
      switchMap(async () => {
        const status = await this.downloadService.getDownloadStatus(id);
        const progress = await this.downloadService.getProgress(id);

        if (status.status === 'COMPLETED' && status.downloadUrl) {
          return {
            data: {
              type: 'complete',
              fileName: status.downloadUrl.split('/').pop() ?? status.downloadUrl,
            },
          };
        }

        if (status.status === 'FAILED') {
          return {
            data: {
              type: 'error',
              message: 'Download failed',
            },
          };
        }

        return {
          data: {
            type: 'progress',
            ...(progress ?? { percentage: 0, status: 'starting' }),
          },
        };
      }),
      takeWhile((event) => event.data.type !== 'complete' && event.data.type !== 'error', true),
    );
  }
}
