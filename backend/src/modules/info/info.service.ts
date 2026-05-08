import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { audioExtensionLabel, audioQualityLabel, videoExtensionLabel } from 'src/lib/config';
import { YtdlpService } from '../ytdlp/ytdlp.service';
import { getPlatform } from 'src/validate/url';
import { VideoInfoResponse } from 'src/types/youtube';
import { FacebookVideoQuality } from 'src/types/facebook';
import { getVideoFormats } from 'src/lib/helper';

@Injectable()
export class InfoService {
  constructor(private ytdlp: YtdlpService) {}

  async getVideoInfo(url: string): Promise<VideoInfoResponse> {
    const platform = getPlatform(url);
    if (!platform) {
      throw new BadRequestException('Unsupported platform or invalid URL');
    }

    try {
      const info = await this.ytdlp.getYtdlpVideoInfo(url);
      fs.writeFileSync('info.json', JSON.stringify(info, null, 2));

      const { allFormats, allExtensions } = this.getPlatformFormats(info, platform);
      const previewMedia = this.getPreviewMedia(info);

      const videoInfo: VideoInfoResponse = {
        id: info.id,
        title: this.getTitle(info, platform),
        thumbnail: info.thumbnail,
        description: info.description || '',
        duration: info.duration,
        viewCount: info.view_count,
        uploader: info.uploader,
        uploaderUrl: info.uploader_url,
        timestamp: info.timestamp,
        categories: info.categories || [],
        qualities: allFormats,
        extensions: allExtensions,
        tags: info.tags || [],
        likeCount: info.like_count,
        commentCount: info.comment_count,
        previewUrl: previewMedia?.url,
        previewMimeType: previewMedia?.mimeType,
      };

      return videoInfo;
    } catch (error) {
      const errorMessage = this.handleError(error, platform);
      throw new BadRequestException(errorMessage);
    }
  }

  private getPlatformFormats(info: any, platform: string) {
    const audioFormats = Object.keys(audioQualityLabel);
    const allExtensions = {
      video: Object.keys(videoExtensionLabel),
      audio: Object.keys(audioExtensionLabel),
    };

    let videoFormats: string[];
    switch (platform) {
      case 'facebook':
        videoFormats = [FacebookVideoQuality.hd, FacebookVideoQuality.sd];
        break;
      default:
        videoFormats = getVideoFormats(info);
    }

    const allFormats = {
      video: [...new Set(videoFormats)],
      audio: [...new Set(audioFormats)],
    };

    return { allFormats, allExtensions };
  }

  private getTitle(info: any, platform: string): string {
    switch (platform) {
      case 'instagram':
        return info.title || 'Instagram Video';
      case 'pinterest':
        return info.title || 'Pinterest Video';
      case 'tiktok':
        return info.title || 'TikTok Video';
      case 'twitter':
        return info.title || 'Twitter Video';
      default:
        return info.title;
    }
  }

  private getPreviewMedia(info: any): { url: string; mimeType: string } | null {
    if (!Array.isArray(info?.formats)) {
      return null;
    }

    const candidates = info.formats
      .filter((format: any) => {
        if (!format?.url || !format?.ext || !format?.vcodec || !format?.protocol) {
          return false;
        }

        const ext = String(format.ext).toLowerCase();
        const protocol = String(format.protocol).toLowerCase();
        const hasVideo = format.vcodec !== 'none';
        const hasAudio = format.acodec && format.acodec !== 'none';
        const isPlayableExt = ['mp4', 'webm', 'mov', 'm4v'].includes(ext);
        const isPlayableProtocol = protocol.includes('http') || protocol.includes('https');

        return hasVideo && hasAudio && isPlayableExt && isPlayableProtocol;
      })
      .sort((a: any, b: any) => {
        const preferredHeight = 720;
        const aHeightScore = Math.abs((a.height || preferredHeight) - preferredHeight);
        const bHeightScore = Math.abs((b.height || preferredHeight) - preferredHeight);

        if (aHeightScore !== bHeightScore) {
          return aHeightScore - bHeightScore;
        }

        return (b.tbr || 0) - (a.tbr || 0);
      });

    const previewFormat = candidates[0];
    if (!previewFormat?.url) {
      return null;
    }

    const mimeType =
      String(previewFormat.ext).toLowerCase() === 'webm' ? 'video/webm' : 'video/mp4';

    return {
      url: previewFormat.url,
      mimeType,
    };
  }

  private handleError(error: unknown, platform: string): string {
    let errorMessage = `Invalid ${platform || ''} URL`;
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (errorMessage.includes('ERROR:')) {
      errorMessage = errorMessage.split(':').pop()?.trim() || errorMessage;
    }

    return errorMessage;
  }
}
