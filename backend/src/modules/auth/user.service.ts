import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    isAdmin: true,
    isBlocked: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async createUser(data: { email: string; password?: string; name?: string; isAdmin?: boolean }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password || '', // Password is required by the Prisma schema
        name: data.name,
        isAdmin: data.isAdmin || false,
      },
      select: this.userSelect,
    });
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.userSelect,
        apiKeys: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      isBlocked?: boolean;
      isAdmin?: boolean;
      password?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData = {
      ...data,
      ...(data.password
        ? { password: await bcrypt.hash(data.password, 10) }
        : {}),
    };

    if (!data.password) {
      delete (updateData as { password?: string }).password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: this.userSelect,
    });
  }

  async listUsers(includeApiKeys = false) {
    if (includeApiKeys) {
      return this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          ...this.userSelect,
          apiKeys: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete all API keys first
    await this.prisma.apiKey.deleteMany({
      where: { userId: id },
    });

    // Then delete the user
    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }
}
