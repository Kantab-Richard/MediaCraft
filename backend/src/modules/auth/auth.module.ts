import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyController } from './api-key.controller';
import { AuthController } from './auth.controller';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RateLimitService } from './rate-limit.service';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, ApiKeyController, UserController],
  providers: [
    AuthService,
    ApiKeyService,
    UserService,
    RateLimitService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [AuthService, ApiKeyService, UserService],
})
export class AuthModule {}
