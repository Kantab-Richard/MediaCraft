import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { PrismaModule } from '../prisma/prisma.module';
import { YtdlpService } from '../ytdlp/ytdlp.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DownloadController],
  providers: [DownloadService, YtdlpService],
  exports: [DownloadService],
})
export class DownloadModule {}
