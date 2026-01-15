import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ContentCreator, Prisma } from '@prisma/client';

@Injectable()
export class ContentCreatorRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ContentCreatorWhereInput;
    orderBy?: Prisma.ContentCreatorOrderByWithRelationInput;
  }): Promise<ContentCreator[]> {
    return this.prisma.contentCreator.findMany({
      ...params,
    });
  }

  async count(where?: Prisma.ContentCreatorWhereInput): Promise<number> {
    return this.prisma.contentCreator.count({ where });
  }

  async findById(id: string): Promise<ContentCreator | null> {
    return this.prisma.contentCreator.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        ratio: {
          include: {
            ratio: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        piterTestProofs: true,
        proofs: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        publishedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAllWithRelations(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ContentCreatorWhereInput;
    orderBy?: Prisma.ContentCreatorOrderByWithRelationInput | Prisma.ContentCreatorOrderByWithRelationInput[];
  }): Promise<any[]> {
    return this.prisma.contentCreator.findMany({
      ...params,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        ratio: {
          include: {
            ratio: true,
          },
        },
        platforms: {
          include: {
            platform: true,
          },
        },
        piterTestProofs: true,
        proofs: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        publishedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.ContentCreatorCreateInput): Promise<ContentCreator> {
    return this.prisma.contentCreator.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.ContentCreatorUpdateInput,
  ): Promise<ContentCreator> {
    return this.prisma.contentCreator.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ContentCreator> {
    return this.prisma.contentCreator.delete({
      where: { id },
    });
  }
}
