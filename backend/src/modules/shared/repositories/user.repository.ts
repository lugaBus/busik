import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { User, Role, Permission } from '@prisma/client';

export interface UserWithRoles extends User {
  userRoles: Array<{
    role: Role & {
      rolePermissions: Array<{
        permission: Permission;
      }>;
    };
  }>;
}

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<Omit<User, 'password'>[]> {
    return this.prisma.user.findMany({
      ...params,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        blockReason: true,
        deleteReason: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password
      },
    }) as Promise<Omit<User, 'password'>[]>;
  }

  async count(where?: any): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async update(id: string, data: {
    isActive?: boolean;
    blockReason?: string | null;
    deleteReason?: string | null;
  }): Promise<Omit<User, 'password'>> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        blockReason: true,
        deleteReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<Omit<User, 'password'>>;
  }

  async delete(id: string): Promise<Omit<User, 'password'>> {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        blockReason: true,
        deleteReason: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<Omit<User, 'password'>>;
  }
}
