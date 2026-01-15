import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateRatioDto } from './dto/create-ratio.dto';
import { UpdateRatioDto } from './dto/update-ratio.dto';

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
export class RatiosService {
  constructor(private prisma: PrismaService) {}

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.prisma.ratio.findFirst({
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

  async create(createDto: CreateRatioDto) {
    const baseSlug = createDto.slug || slugify(createDto.name);
    const slug = await this.generateUniqueSlug(baseSlug);
    return this.prisma.ratio.create({
      data: {
        name: createDto.name as unknown as Prisma.InputJsonValue,
        slug,
        description: createDto.description ? (createDto.description as unknown as Prisma.InputJsonValue) : null,
      },
    });
  }

  async findAll() {
    const ratios = await this.prisma.ratio.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return ratios.map((ratio: any) => ({
      ...ratio,
      name: ratio.name as any,
      description: ratio.description as any,
    }));
  }

  async findOne(id: string) {
    const ratio = await this.prisma.ratio.findUnique({
      where: { id },
    });
    if (!ratio) {
      throw new NotFoundException(`Ratio with ID ${id} not found`);
    }
    return {
      ...ratio,
      name: ratio.name as any,
      description: ratio.description as any,
    };
  }

  async update(id: string, updateDto: UpdateRatioDto) {
    await this.findOne(id); // Check if exists

    const updateData: Prisma.RatioUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateDto.name !== undefined) {
      updateData.name = updateDto.name as unknown as Prisma.InputJsonValue;
      if (!updateDto.slug) {
        const baseSlug = slugify(updateDto.name);
        updateData.slug = await this.generateUniqueSlug(baseSlug, id);
      }
    }
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description 
        ? (updateDto.description as unknown as Prisma.InputJsonValue) 
        : null;
    }
    if (updateDto.slug !== undefined) {
      const baseSlug = updateDto.slug;
      updateData.slug = await this.generateUniqueSlug(baseSlug, id);
    }

    return this.prisma.ratio.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    return this.prisma.ratio.delete({
      where: { id },
    });
  }
}
