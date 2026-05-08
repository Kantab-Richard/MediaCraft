import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest();

    let key: string | undefined = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    if (!key && authHeader?.startsWith('Bearer ')) {
      key = authHeader.split(' ')[1];
    }

    // Add check for API key in query parameter
    if (!key && request.query['api_key'] && typeof request.query['api_key'] === 'string') {
      key = request.query['api_key'];
    }

    // Add check for API key in request body (for POST requests)
    if (!key && request.body?.api_key && typeof request.body.api_key === 'string') {
      key = request.body.api_key;
    }

    if (!key) {
      if (isPublic) {
        return true;
      }

      throw new UnauthorizedException('API Key missing');
    }

    const apiKeyRecord = await this.authService.validateKey(key);
    if (!apiKeyRecord) throw new UnauthorizedException('Invalid or blocked API Key');

    // Attach user and key config to request for rate limiting or logging
    request.user = apiKeyRecord.user;
    request.apiKeyConfig = apiKeyRecord;

    return true;
  }
}
