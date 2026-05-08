import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { createReadStream, statSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { Request, Response } from 'express';
import { VideoDownload } from '../../classes/VideoDownload';
import { DownloadStatus, Downloaders } from '@prisma/client';
import {
  AudioFormat,
  DownloadFormatOptions,
  DownloadQualityOptions,
  Platform,
  VideoFormat,
  ProgressType,
  VideoQuality,
} from 'src/types';
import { YtdlpService } from '../ytdlp/ytdlp.service';
import { getFileName } from 'src/lib/utils';

type DownloadRequest = Request & {
  apiKeyConfig?: { maxDuration?: number } | null;
  platform?: Platform;
  user?: { id: string } | null;
};

@Injectable()
export class DownloadService {
  private readonly downloadPath: string;
  private readonly progressMap: Map<string, ProgressType> = new Map();
  private readonly defaultMaxDuration = Number(process.env.PUBLIC_MAX_DURATION ?? 18000);

  constructor(
    private prisma: PrismaService, // Inject PrismaService
    private ytdlp: YtdlpService, // Inject YtdlpService
  ) {
    // Move the downloads folder outside of the project root to prevent dev server watcher loops
    this.downloadPath = join(process.cwd(), '..', 'medicraft_downloads');
    // Ensure downloads directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  // New method to get current progress
  async getProgress(downloadId: string): Promise<ProgressType | null> {
    return this.progressMap.get(downloadId) || null;
  }

  private async checkDurationLimit(url: string, apiKey?: { maxDuration?: number } | null) {
    const info = await this.ytdlp.getYtdlpVideoInfo(url);
    const maxDuration = apiKey?.maxDuration && apiKey.maxDuration > 0 ? apiKey.maxDuration : this.defaultMaxDuration;

    if (info.duration > maxDuration) {
      throw new BadRequestException(
        `Video duration (${Math.round(info.duration / 60)} minutes) exceeds the allowed limit (${Math.round(maxDuration / 60)} minutes)`,
      );
    }

    return info;
  }

  private getDownloader(platform?: string): Downloaders {
    switch (platform) {
      case 'facebook':
        return Downloaders.FACEBOOK;
      case 'instagram':
        return Downloaders.INSTAGRAM;
      case 'pinterest':
        return Downloaders.PINTEREST;
      case 'tiktok':
        return Downloaders.TIKTOK;
      case 'twitter':
        return Downloaders.TWITTER;
      case 'youtube':
      default:
        return Downloaders.YOUTUBE;
    }
  }

  private mapProgress(progress: Record<string, unknown>, status: ProgressType['status']): ProgressType {
    const percentage =
      typeof progress.percentage === 'number'
        ? progress.percentage
        : parseFloat(String(progress.percentage_str || '0'));

    return {
      percentage: Number.isFinite(percentage) ? percentage : 0,
      percentage_str: typeof progress.percentage_str === 'string' ? progress.percentage_str : undefined,
      status,
      downloaded:
        typeof progress.downloaded === 'number'
          ? progress.downloaded
          : typeof progress.downloaded_bytes === 'number'
            ? progress.downloaded_bytes
            : undefined,
      downloaded_str: typeof progress.downloaded_str === 'string' ? progress.downloaded_str : undefined,
      total:
        typeof progress.total === 'number'
          ? progress.total
          : typeof progress.total_bytes === 'number'
            ? progress.total_bytes
            : undefined,
      total_str: typeof progress.total_str === 'string' ? progress.total_str : undefined,
      speed: typeof progress.speed === 'number' ? progress.speed : undefined,
      speed_str: typeof progress.speed_str === 'string' ? progress.speed_str : undefined,
      eta: typeof progress.eta === 'number' ? progress.eta : undefined,
      eta_str: typeof progress.eta_str === 'string' ? progress.eta_str : undefined,
      isConverting: status === 'converting',
    };
  }

  private markFailed(downloadId: string) {
    this.progressMap.set(downloadId, {
      percentage: 0,
      status: 'failed',
      isConverting: false,
    });
  }

  private isFormatUnavailableError(error: unknown) {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('requested format is not available') ||
      msg.includes('format is not available') ||
      msg.includes('unable to find a format')
    );
  }

  private async resolveProjectId(projectId?: string, userId?: string) {
    if (!projectId || !userId) {
      return undefined;
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: { id: true },
    });

    return project?.id;
  }

  private isNetworkTimeoutError(error: unknown) {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('read timed out') || msg.includes('timed out') || msg.includes('connectionpool');
  }

  async getFile(filename: string, range?: string): Promise<{ stream: fs.ReadStream; headers: any }> {
    const filePath = join(this.downloadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(filePath, { start, end });
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'application/octet-stream',
      };

      return { stream, headers };
    }

    const stream = createReadStream(filePath);
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
      'Accept-Ranges': 'bytes',
    };

    return { stream, headers };
  }

  async getFileMetadata(filename: string) {
    const filePath = join(this.downloadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stat = statSync(filePath);
    return {
      size: stat.size,
      created: stat.birthtime,
      modified: stat.mtime,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
    };
  }

  async createDownload(data: {
    originalUrl: string;
    downloader: Downloaders;
    filename: string;
    userId?: string;
    projectId?: string;
  }) {
    return this.prisma.download.create({
      data: {
        originalUrl: data.originalUrl,
        status: DownloadStatus.PENDING,
        downloader: data.downloader,
        filename: data.filename,
        userId: data.userId,
        projectId: data.projectId,
      },
    });
  }

  async updateDownloadStatus(id: string, data: { status: DownloadStatus; downloadUrl?: string | null }) {
    return this.prisma.download.update({
      where: { id },
      data,
    });
  }

  async getDownloadStatus(downloadId: string) {
    try {
      const download = await this.prisma.download.findUnique({
        where: { id: downloadId },
      });

      if (!download) {
        throw new BadRequestException('Download not found');
      }

      return {
        status: download.status,
        downloadUrl: download.downloadUrl,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to get download status');
    }
  }

  async subscribeToProgress(downloadId: string, res: Response) {
    // Check download status first
    const download = await this.prisma.download.findUnique({
      where: { id: downloadId },
    });

    if (!download) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Download not found' })}\n\n`);
      res.end();
      return;
    }

    // If download is already completed or failed, send the final status and end connection
    if (download.status === DownloadStatus.COMPLETED || download.status === DownloadStatus.FAILED) {
      const data = {
        type: download.status === DownloadStatus.COMPLETED ? 'complete' : 'error',
        ...(download.status === DownloadStatus.COMPLETED
          ? { downloadUrl: download.downloadUrl }
          : { message: 'Download failed' }),
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.end();
      return;
    }

    // For in-progress downloads, set up SSE connection
    VideoDownload.subscribeToProgress(downloadId, res);
  }

  createProgressSubject(downloadId: string, extension: string, filename: string) {
    return VideoDownload.createProgressSubject(downloadId, extension, filename);
  }

  ensureDownloadDirectory() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
    return this.downloadPath;
  }

  private async startVideoDownload(args: {
    url: string;
    platform: Platform;
    quality: DownloadQualityOptions['mergevideo'];
    format?: VideoFormat;
    downloadDir: string;
    tempFileName: string;
  }) {
    // Define a robust format selector.
    const height = parseInt(args.quality);
    const hasSpecificQuality = !isNaN(height) && !['highest', 'best', 'lowest'].includes(args.quality);

    // Safer selector: try to get video up to requested height + best audio,
    // or the best available single file if merging is not possible.
    const formatSelector = hasSpecificQuality ? `bv*[height<=${height}]+ba/b[height<=${height}]/best` : 'bv*+ba/b';

    // Derive the merge format from the temporary filename extension
    const mergeOutputFormat = args.tempFileName.split('.').pop() || 'mp4';

    if (args.platform === 'pinterest') {
      return this.ytdlp.download(args.url, args.platform, {
        filter: 'mergevideo',
        command: [
          '--user-agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--no-check-certificate',
          '--geo-bypass',
          '--retries',
          '3',
          '--fragment-retries',
          '3',
          '--merge-output-format',
          mergeOutputFormat,
        ],
        output: {
          outDir: args.downloadDir,
          fileName: args.tempFileName,
        },
      });
    }

    try {
      return await this.ytdlp.download(args.url, args.platform, {
        filter: 'mergevideo',
        quality: args.quality,
        command: [
          '--user-agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--no-check-certificate',
          '--geo-bypass',
          '-f',
          formatSelector,
          '--merge-output-format',
          mergeOutputFormat,
        ],
        output: {
          outDir: args.downloadDir,
          fileName: args.tempFileName,
        },
      });
    } catch (error) {
      if (!this.isFormatUnavailableError(error)) {
        throw error;
      }

      console.warn(`Requested quality ${args.quality} is unavailable. Retrying with the best available stream.`);

      return this.ytdlp.download(args.url, args.platform, {
        filter: 'mergevideo',
        quality: VideoQuality.best,
        command: [
          '--user-agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--no-check-certificate',
          '--geo-bypass',
          '-f',
          'bv*+ba/b',
          '--merge-output-format',
          mergeOutputFormat,
        ],
        output: {
          outDir: args.downloadDir,
          fileName: args.tempFileName,
        },
      });
    }
  }

  async downloadVideo(
    url: string,
    quality: DownloadQualityOptions['mergevideo'],
    extension?: DownloadFormatOptions['mergevideo'],
    projectId?: string,
    req?: DownloadRequest,
  ) {
    try {
      const info = await this.checkDurationLimit(url, req?.apiKeyConfig);
      const resolvedProjectId = await this.resolveProjectId(projectId, req?.user?.id);

      const downloadDir = this.ensureDownloadDirectory();

      // Normalize extension: default to mp4 if not provided
      const effectiveExtension = extension || VideoFormat.mp4; // Ensure effectiveExtension is always a string

      // Use the final extension directly. yt-dlp handles merging into mp4
      // natively. Forced webm intermediate was a major failure point.
      const tempExt = effectiveExtension;

      // Truncate title to 50 chars and remove special chars to avoid Windows path limits (Traceback fix)
      const sanitizedTitle = info.title.slice(0, 50).replace(/[^a-z0-9]/gi, '_');
      const tempFileName = getFileName(sanitizedTitle, quality, tempExt);
      const finalFileName = getFileName(sanitizedTitle, quality, effectiveExtension);

      // Create download record in database with the final intended filename
      const download = await this.createDownload({
        originalUrl: url,
        downloader: this.getDownloader(req?.platform),
        filename: finalFileName,
        userId: req?.user?.id,
        projectId: resolvedProjectId,
      });

      // Create progress subject
      const progressSubject = this.createProgressSubject(download.id, effectiveExtension, finalFileName);

      const initialProgress: ProgressType = { percentage: 0, status: 'starting' };
      this.progressMap.set(download.id, initialProgress);
      progressSubject.next(initialProgress);

      console.log('start download', {
        quality,
        extension: tempExt,
        fileName: tempFileName,
      });

      // Update status to DOWNLOADING
      await this.updateDownloadStatus(download.id, {
        status: DownloadStatus.DOWNLOADING,
      });

      // Start video download
      this.startVideoDownload({
        url,
        platform: req?.platform ?? 'youtube',
        quality,
        downloadDir, // Pass downloadDir
        tempFileName,
      })
        .then((progress$) => {
          progress$.subscribe({
            next: async (progress) => {
              if (progress instanceof Error) {
                console.error('Error:', progress);

                let errorMessage = 'Download failed';
                const rawError = progress.message || '';

                if (this.isFormatUnavailableError(progress) || rawError.includes('Requested format is not available')) {
                  errorMessage = `The quality '${quality}' is not available for this specific video. Try a different quality like '360p' or '720p'.`;
                } else if (this.isNetworkTimeoutError(progress)) {
                  errorMessage = 'Pinterest took too long to respond. Please try the link again in a moment.';
                } else if (rawError.includes('ERROR:')) {
                  // Extract cleaner error from yt-dlp output
                  errorMessage = rawError.split('ERROR:')[1]?.trim() || 'Download failed';
                }

                await this.updateDownloadStatus(download.id, {
                  status: DownloadStatus.FAILED,
                  downloadUrl: null,
                });
                this.markFailed(download.id);
                progressSubject.error(new Error(errorMessage));
              } else {
                const currentProgress = this.mapProgress(progress as Record<string, unknown>, 'downloading');
                this.progressMap.set(download.id, currentProgress);
                progressSubject.next(currentProgress);
              }
            },
            error: async (err) => {
              console.error('Error:', err);
              await this.updateDownloadStatus(download.id, {
                status: DownloadStatus.FAILED,
                downloadUrl: null,
              });
              this.markFailed(download.id);
              progressSubject.error(err);
            },
            complete: async () => {
              console.log('Download complete');

              // Immediately update progress map to 100% so frontend polling reflects it
              const completedProgress: ProgressType = {
                percentage: 100,
                status: 'downloading',
                isConverting: tempExt !== effectiveExtension,
              };
              this.progressMap.set(download.id, completedProgress);
              progressSubject.next(completedProgress);

              // Check if the downloaded file actually exists
              const downloadedFilePath = join(downloadDir, tempFileName);
              if (!fs.existsSync(downloadedFilePath)) {
                console.error(`Error: Downloaded file ${tempFileName} does not exist in ${downloadDir}`);
                await this.updateDownloadStatus(download.id, {
                  status: DownloadStatus.FAILED,
                  downloadUrl: null,
                });
                this.markFailed(download.id);
                progressSubject.error(new Error('Download failed: File not found after download process.'));
                return; // Stop further processing
              }
              // Convert if the downloaded file extension (tempExt)
              // doesn't match the final desired extension.
              if (tempExt !== effectiveExtension) {
                console.log('Converting video to', effectiveExtension);
                const inputPath = join(downloadDir, tempFileName);
                const outputPath = join(downloadDir, finalFileName);

                await this.updateDownloadStatus(download.id, {
                  status: DownloadStatus.CONVERTING,
                });
                const convertingProgress: ProgressType = {
                  percentage: 100,
                  status: 'converting',
                  isConverting: true,
                };
                this.progressMap.set(download.id, convertingProgress);
                progressSubject.next(convertingProgress);

                try {
                  // Catch conversion errors
                  const convertProgress$ = await this.ytdlp.convertVideo(inputPath, effectiveExtension, outputPath);
                  convertProgress$.subscribe({
                    next: (progress) => {
                      if (!(progress instanceof Error)) {
                        // Check if progress is not an Error object
                        const currentProgress = this.mapProgress(progress, 'converting');
                        this.progressMap.set(download.id, currentProgress);
                        progressSubject.next(currentProgress);
                      }
                    },
                    error: async (err: unknown) => {
                      // Type 'unknown' for error
                      console.error('Conversion error:', err);
                      await this.updateDownloadStatus(download.id, {
                        status: DownloadStatus.FAILED,
                        downloadUrl: null,
                      });
                      this.markFailed(download.id);
                      progressSubject.error(err);
                    },
                    complete: async () => {
                      console.log('Conversion complete');
                      fs.unlinkSync(inputPath);

                      await this.updateDownloadStatus(download.id, {
                        status: DownloadStatus.COMPLETED,
                        downloadUrl: `/downloads/${finalFileName}`,
                      });
                      progressSubject.complete();
                    },
                  });
                } catch (error: unknown) {
                  // Type 'unknown' for error
                  console.error('Conversion error:', error);
                  await this.updateDownloadStatus(download.id, {
                    status: DownloadStatus.FAILED,
                    downloadUrl: null,
                  });
                  this.markFailed(download.id);
                  progressSubject.error(error);
                }
              } else {
                await this.updateDownloadStatus(download.id, {
                  status: DownloadStatus.COMPLETED,
                  downloadUrl: `/downloads/${tempFileName}`,
                });
                progressSubject.complete();
              }
            },
          });
        })
        .catch(async (error: unknown) => {
          // Type 'unknown' for error
          console.error('Failed to start download:', error);
          await this.updateDownloadStatus(download.id, {
            status: DownloadStatus.FAILED,
            downloadUrl: null,
          });
          this.markFailed(download.id);
          progressSubject.error(error);
        });

      return {
        message: 'Download started',
        downloadId: download.id,
        fileName: finalFileName, // Return the final filename
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException((error as Error).message || 'Failed to start download');
    }
  }

  async downloadAudio(
    url: string,
    quality: DownloadQualityOptions['audioonly'],
    extension?: DownloadFormatOptions['audioonly'],
    projectId?: string,
    req?: DownloadRequest,
  ) {
    try {
      const info = await this.checkDurationLimit(url, req?.apiKeyConfig);
      const resolvedProjectId = await this.resolveProjectId(projectId, req?.user?.id);

      const downloadDir = this.ensureDownloadDirectory();
      const effectiveExtension = extension || AudioFormat.mp3;
      // Truncate and sanitize title for audio downloads
      const sanitizedTitle = info.title.slice(0, 50).replace(/[^a-z0-9]/gi, '_');
      const fileName = getFileName(sanitizedTitle, quality, effectiveExtension);

      // Create download record in database
      const download = await this.createDownload({
        originalUrl: url,
        downloader: this.getDownloader(req?.platform),
        filename: fileName,
        userId: req?.user?.id,
        projectId: resolvedProjectId,
      });

      // Create progress subject
      const progressSubject = this.createProgressSubject(download.id, effectiveExtension, fileName);

      const initialAudioProgress: ProgressType = { percentage: 0, status: 'starting' };
      this.progressMap.set(download.id, initialAudioProgress);
      progressSubject.next(initialAudioProgress);

      console.log('start download', {
        quality,
        extension: effectiveExtension, // Log the effective extension
        fileName,
      });

      // Update status to DOWNLOADING
      await this.updateDownloadStatus(download.id, {
        status: DownloadStatus.DOWNLOADING,
      });

      // Audio download
      const progress$ = await this.ytdlp.download(url, req?.platform ?? 'youtube', {
        filter: 'audioonly',
        quality: quality,
        format: effectiveExtension,
        command: [
          '--user-agent',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--no-check-certificate',
          '--geo-bypass',
        ],
        output: {
          outDir: downloadDir,
          fileName: fileName,
        },
      });

      progress$.subscribe({
        next: async (progress) => {
          // Progress can be Error or ProgressType
          if (progress instanceof Error) {
            console.error('Error:', progress);

            let errorMessage = 'Download failed';
            const rawError = progress.message || '';

            if (this.isFormatUnavailableError(progress) || rawError.includes('Requested format is not available')) {
              errorMessage = `The requested audio quality is not available. Try a different quality.`;
            } else if (this.isNetworkTimeoutError(progress)) {
              errorMessage = 'The source platform took too long to respond. Please try again in a moment.';
            } else if (rawError.includes('ERROR:')) {
              errorMessage = rawError.split('ERROR:')[1]?.trim() || 'Download failed';
            }

            await this.updateDownloadStatus(download.id, {
              status: DownloadStatus.FAILED,
              downloadUrl: null,
            });
            this.markFailed(download.id);
            progressSubject.error(new Error(errorMessage));
          } else {
            const currentProgress = this.mapProgress(progress as Record<string, unknown>, 'downloading');
            this.progressMap.set(download.id, currentProgress);
            progressSubject.next(currentProgress);
          }
        },
        error: async (err: unknown) => {
          // Type 'unknown' for error
          console.error('Error:', err);
          await this.updateDownloadStatus(download.id, {
            status: DownloadStatus.FAILED,
            downloadUrl: null,
          });
          this.markFailed(download.id);
          progressSubject.error(err);
        },
        complete: async () => {
          console.log('Download complete');

          // Ensure progress reflects 100% for audio as well
          const completedAudioProgress: ProgressType = {
            percentage: 100,
            status: 'downloading',
            isConverting: false,
          };
          this.progressMap.set(download.id, completedAudioProgress);
          progressSubject.next(completedAudioProgress);

          // Check if the downloaded file actually exists for audio
          // Check if the downloaded file actually exists for audio
          const downloadedFilePath = join(downloadDir, fileName);
          if (!fs.existsSync(downloadedFilePath)) {
            console.error('Error: Downloaded audio file does not exist after completion signal.');
            await this.updateDownloadStatus(download.id, {
              status: DownloadStatus.FAILED,
              downloadUrl: null,
            });
            this.markFailed(download.id);
            progressSubject.error(new Error('Download failed: Audio file not found after download process.'));
            return; // Stop further processing if file doesn't exist
          }
          await this.updateDownloadStatus(download.id, {
            status: DownloadStatus.COMPLETED,
            downloadUrl: `/downloads/${fileName}`,
          });
          progressSubject.complete();
        },
      });

      return {
        message: 'Download started',
        downloadId: download.id,
        fileName: fileName,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Re-throw BadRequestException
        throw error;
      }
      throw new BadRequestException('Failed to download audio');
    }
  }
}
