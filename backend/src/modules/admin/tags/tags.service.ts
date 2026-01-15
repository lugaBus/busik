import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

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
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.prisma.tag.findFirst({
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

  async create(createDto: CreateTagDto) {
    const baseSlug = createDto.slug || slugify(createDto.name);
    const slug = await this.generateUniqueSlug(baseSlug);
    return this.prisma.tag.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
        slug,
        description: createDto.description ? (createDto.description as unknown as Prisma.InputJsonValue) : null,
      },
    });
  }

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return tags.map((tag: any) => ({
      ...tag,
      name: tag.name as any,
      description: tag.description as any,
    }));
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return {
      ...tag,
      name: tag.name as any,
      description: tag.description as any,
    };
  }

  async update(id: string, updateDto: UpdateTagDto) {
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
    return this.prisma.tag.update({
      where: { id },
      data,
    }).then((tag: any) => ({
      ...tag,
      name: tag.name as any,
      description: tag.description as any,
    }));
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
