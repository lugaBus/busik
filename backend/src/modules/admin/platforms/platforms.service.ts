import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

function slugify(text: string | { en?: string; ua?: string; ru?: string }): string {
  const textStr = typeof text === 'string' ? text : (text.ua || text.en || text.ru || '');
  return textStr
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class PlatformsService {
  constructor(private prisma: PrismaService) {}

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.prisma.platform.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      
      if (!existing) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createDto: CreatePlatformDto) {
    const baseSlug = createDto.slug || slugify(createDto.name);
    const slug = await this.generateUniqueSlug(baseSlug);
    return this.prisma.platform.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
        slug,
        description: createDto.description ? (createDto.description as unknown as Prisma.InputJsonValue) : null,
      },
    });
  }

  async findAll() {
    const platforms = await this.prisma.platform.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return platforms.map((platform: any) => ({
      ...platform,
      name: platform.name as any,
      description: platform.description as any,
    }));
  }

  async findOne(id: string) {
    const platform = await this.prisma.platform.findUnique({
      where: { id },
    });
    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
    return {
      ...platform,
      name: platform.name as any,
      description: platform.description as any,
    };
  }

  async update(id: string, updateDto: UpdatePlatformDto) {
    await this.findOne(id);
    const data: any = {};
    if (updateDto.name) {
      data.name = updateDto.name as unknown as Prisma.InputJsonValue;
      if (!updateDto.slug) {
        const baseSlug = slugify(updateDto.name);
        data.slug = await this.generateUniqueSlug(baseSlug, id);
      }
    }
    if (updateDto.slug !== undefined) {
      const baseSlug = updateDto.slug;
      data.slug = await this.generateUniqueSlug(baseSlug, id);
    }
    if (updateDto.description !== undefined) {
      data.description = updateDto.description ? (updateDto.description as unknown as Prisma.InputJsonValue) : null;
    }
    return this.prisma.platform.update({
      where: { id },
      data,
    }).then((platform: any) => ({
      ...platform,
      name: platform.name as any,
      description: platform.description as any,
    }));
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.platform.delete({
      where: { id },
    });
  }
}
