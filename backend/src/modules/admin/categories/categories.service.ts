import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.prisma.category.findFirst({
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

  async create(createDto: CreateCategoryDto) {
    const baseSlug = createDto.slug || slugify(createDto.name);
    const slug = await this.generateUniqueSlug(baseSlug);
    return this.prisma.category.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
        slug,
        description: createDto.description ? (createDto.description as unknown as Prisma.InputJsonValue) : null,
      },
    });
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return categories.map((cat: any) => ({
      ...cat,
      name: cat.name as any,
      description: cat.description as any,
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return {
      ...category,
      name: category.name as any,
      description: category.description as any,
    };
  }

  async update(id: string, updateDto: UpdateCategoryDto) {
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
    return this.prisma.category.update({
      where: { id },
      data,
    }).then((cat: any) => ({
      ...cat,
      name: cat.name as any,
      description: cat.description as any,
    }));
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
