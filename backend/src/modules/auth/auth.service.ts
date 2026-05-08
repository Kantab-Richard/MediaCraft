import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

type AuthSession = {
  user: {
    email: string;
    name: string | null;
    id: string;
    isAdmin: boolean;
    avatarUrl?: string | null;
  };
  apiKey: string;
};

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  iss?: string;
};

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private get db(): PrismaClient {
    return this.prisma as unknown as PrismaClient;
  }

  async signup(email: string, password: string, name?: string) {
    const existing = await this.db.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, name },
      });

      const apiKey = await this.createApiKeyForUser(tx as PrismaClient, user.id);

      return this.buildAuthSession(user, apiKey.key);
    });
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      include: {
        apiKeys: {
          where: {
            isBlocked: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.isBlocked) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const apiKey =
      user.apiKeys[0] ??
      (await this.db.apiKey.create({
        data: {
          userId: user.id,
          key: `dk_${crypto.randomBytes(32).toString('hex')}`,
        },
      }));

    return this.buildAuthSession(user, apiKey.key);
  }

  async loginWithGoogle(idToken: string): Promise<AuthSession> {
    const tokenInfo = await this.verifyGoogleIdToken(idToken);
    const email = tokenInfo.email?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException('Google account email is missing');
    }

    if (
      tokenInfo.email_verified !== true &&
      tokenInfo.email_verified !== 'true'
    ) {
      throw new UnauthorizedException('Google email is not verified');
    }

    const user = await this.db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email },
        include: {
          apiKeys: {
            where: {
              isBlocked: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (existingUser?.isBlocked) {
        throw new UnauthorizedException('This account is blocked');
      }

      const account = existingUser
        ? !existingUser.name && tokenInfo.name
          ? await tx.user.update({
              where: { id: existingUser.id },
              data: { name: tokenInfo.name },
              include: {
                apiKeys: {
                  where: {
                    isBlocked: false,
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            })
          : existingUser
        : await tx.user.create({
            data: {
              email,
              name: tokenInfo.name ?? email.split('@')[0],
              password: await bcrypt.hash(
                `google:${crypto.randomBytes(32).toString('hex')}`,
                10,
              ),
            },
            include: {
              apiKeys: {
                where: {
                  isBlocked: false,
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          });

      const apiKey =
        account.apiKeys[0] ??
        (await this.createApiKeyForUser(tx as PrismaClient, account.id));

      return this.buildAuthSession(account, apiKey.key, tokenInfo.picture);
    });

    return user;
  }

  async validateKey(key: string) {
    return this.db.apiKey.findFirst({
      where: { key, isBlocked: false },
      include: { user: true },
    });
  }

  private buildAuthSession(
    user: {
      email: string;
      name: string | null;
      id: string;
      isAdmin: boolean;
    },
    apiKey: string,
    avatarUrl?: string | null,
  ): AuthSession {
    return {
      user: {
        email: user.email,
        name: user.name,
        id: user.id,
        isAdmin: user.isAdmin,
        avatarUrl,
      },
      apiKey,
    };
  }

  private async createApiKeyForUser(tx: PrismaClient, userId: string) {
    return tx.apiKey.create({
      data: {
        userId,
        key: `dk_${crypto.randomBytes(32).toString('hex')}`,
      },
    });
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Google token verification failed');
    }

    const tokenInfo = (await response.json()) as GoogleTokenInfo;
    const expectedAudience = process.env.GOOGLE_CLIENT_ID;

    if (!tokenInfo.aud || (expectedAudience && tokenInfo.aud !== expectedAudience)) {
      throw new UnauthorizedException('Google token audience is invalid');
    }

    if (
      tokenInfo.iss &&
      tokenInfo.iss !== 'https://accounts.google.com' &&
      tokenInfo.iss !== 'accounts.google.com'
    ) {
      throw new UnauthorizedException('Google token issuer is invalid');
    }

    return tokenInfo;
  }
}
