import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ContentCreatorRepository } from '../repositories/content-creator.repository';
import { CreateContentCreatorDto } from '../dto/create-content-creator.dto';
import { UpdateContentCreatorDto } from '../dto/update-content-creator.dto';
import { IContentCreatorSearchService } from './interfaces/content-creator-search.interface';

@Injectable()
export class ContentCreatorService {
  constructor(
    private contentCreatorRepository: ContentCreatorRepository,
    private prisma: PrismaService,
    @Inject('IContentCreatorSearchService')
    private searchService: IContentCreatorSearchService,
  ) {}

  async create(createDto: CreateContentCreatorDto, userId?: string) {
    const { categoryIds, tagIds, ratioId, ...data } = createDto;

    // Если статус user_added, значит добавлено юзером с фронта
    const status = data.status || 'active';
    const isUserAdded = status === 'user_added';

    const creator = await this.contentCreatorRepository.create({
      name: (data.name as unknown as Prisma.InputJsonValue),
      quote: data.quote ? (data.quote as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      description: data.description ? (data.description as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      locale: data.locale || 'uk-UA',
      mainLink: data.mainLink || null,
      photoUrls: data.photoUrls ? (data.photoUrls as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      position: data.position || 0,
      rating: data.rating || null,
      contentFormats: data.contentFormats || [],
      tone: data.tone ?? 0,
      audience: (data.audience as Prisma.InputJsonValue) || Prisma.JsonNull,
      metrics: (data.metrics as Prisma.InputJsonValue) || Prisma.JsonNull,
      piterTest: data.piterTest || null,
      status,
      createdBy: userId ? { connect: { id: userId } } : undefined,
      categories: categoryIds && categoryIds.length > 0
        ? {
            create: categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          }
        : undefined,
      tags: tagIds && tagIds.length > 0
        ? {
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
      ratio: ratioId
        ? {
            create: {
              ratio: { connect: { id: ratioId } },
            },
          }
        : undefined,
    });

    // Record initial status in history
    await this.prisma.contentCreatorStatusHistory.create({
      data: {
        contentCreatorId: creator.id,
        previousStatus: null,
        newStatus: status,
        changedById: userId || null,
      },
    });

    return this.findOne(creator.id);
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    tag?: string;
    ratio?: string;
    sortBy?: 'name' | 'rating' | 'status' | 'position' | 'createdAt' | 'updatedAt' | 'categories' | 'ratios';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.search) {
      // Use full-text search service to find matching IDs
      const matchingIds = await this.searchService.searchByName(params.search);
      if (matchingIds.length > 0) {
        where.id = { in: matchingIds };
      } else {
        // If no matches found, return empty result
        where.id = { in: [] };
      }
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.category) {
      where.categories = {
        some: {
          category: {
            OR: [
              { id: params.category },
              { slug: params.category },
            ],
          },
        },
      };
    }
    if (params?.tag) {
      where.tags = {
        some: {
          tag: {
            OR: [
              { id: params.tag },
              { slug: params.tag },
            ],
          },
        },
      };
    }
    if (params?.ratio) {
      where.ratio = {
        ratio: {
          OR: [
            { id: params.ratio },
            { slug: params.ratio },
          ],
        },
      };
    }

    // Build orderBy based on sortBy parameter - ONLY the selected field, no default sorting
    let orderBy: any[] = [];
    if (params?.sortBy) {
      const sortOrder = params.sortOrder || 'asc';
      console.log('Sorting by:', params.sortBy, 'order:', sortOrder);
      switch (params.sortBy) {
        case 'name':
          // Sort by name JSON (en) with specified direction
          orderBy = [{ name: { path: ['en'], sort: sortOrder, mode: 'insensitive' } as any }];
          break;
        case 'rating':
          // Null ratings go last
          orderBy = [{ rating: { sort: sortOrder, nulls: 'last' } }];
          break;
        case 'status':
          orderBy = [{ status: sortOrder }];
          break;
        case 'categories':
          orderBy = [{ categories: { _count: sortOrder } }];
          break;
        case 'ratios':
          // Sort by ratio name (en) since we now have only one ratio
          orderBy = [{ ratio: { ratio: { name: { path: ['en'], sort: sortOrder, mode: 'insensitive' } as any } } }];
          break;
        case 'createdAt':
        case 'updatedAt':
          // Direct field sorting
          orderBy = [{ [params.sortBy]: sortOrder }];
          break;
        default:
          orderBy = [{ [params.sortBy]: sortOrder }];
      }
      console.log('OrderBy:', JSON.stringify(orderBy, null, 2));
    } else {
      // Default sorting only when no sortBy is specified
      orderBy = [
        { position: 'asc' },
        { createdAt: 'desc' },
      ];
    }

    const [data, total] = await Promise.all([
      this.contentCreatorRepository.findAllWithRelations({
        where,
        skip,
        take: limit,
        orderBy: orderBy as any,
      }),
      this.contentCreatorRepository.count(where),
    ]);

    // Transform data to match API response format
    const transformedData = data.map((creator: any) => ({
      ...creator,
      name: creator.name as any,
      quote: creator.quote as any,
      description: creator.description as any,
      rating: creator.rating,
      categories: creator.categories?.map((cc: any) => ({
        ...cc.category,
        name: cc.category.name as any,
        description: cc.category.description as any,
      })) || [],
      tags: creator.tags?.map((ct: any) => ({
        ...ct.tag,
        name: ct.tag.name as any,
        description: ct.tag.description as any,
      })) || [],
      ratios: creator.ratio
        ? [{
            ...creator.ratio.ratio,
            name: creator.ratio.ratio.name as any,
            description: creator.ratio.ratio.description as any,
          }]
        : [],
      proofs: creator.proofs || [],
    }));

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const creator = await this.contentCreatorRepository.findById(id);
    if (!creator) {
      throw new NotFoundException(`Content creator with ID ${id} not found`);
    }
    // Transform to match API response format
    const result: any = {
      ...creator,
      name: creator.name as any, // Already JSON
      quote: creator.quote as any, // Already JSON
      description: creator.description as any, // Already JSON
      photoUrls: creator.photoUrls ? (creator.photoUrls as any) : [],
      rating: creator.rating,
      categories: (creator as any).categories?.map((cc: any) => ({
        ...cc.category,
        name: cc.category.name as any,
        description: cc.category.description as any,
      })) || [],
      tags: (creator as any).tags?.map((ct: any) => ({
        ...ct.tag,
        name: ct.tag.name as any,
        description: ct.tag.description as any,
      })) || [],
      ratios: (creator as any).ratio
        ? [{
            ...(creator as any).ratio.ratio,
            name: (creator as any).ratio.ratio.name as any,
            description: (creator as any).ratio.ratio.description as any,
          }]
        : [],
      platforms: (creator as any).platforms?.map((cp: any) => ({
        id: cp.id,
        platform: {
          ...cp.platform,
          name: cp.platform.name as any,
          description: cp.platform.description as any,
        },
        url: cp.url,
        description: cp.description as any,
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
      })) || [],
      piterTest: creator.piterTest,
      piterTestProofs: (creator as any).piterTestProofs?.map((proof: any) => ({
        ...proof,
        imageUrl: this.getFullImageUrl(proof.imageUrl),
        description: proof.description as any,
      })) || [],
      proofs: (creator as any).proofs || [],
    };
    // Remove nested relations from response
    delete result.contentCreatorCategory;
    delete result.contentCreatorTag;
    delete result.contentCreatorRatio;
    delete result.contentCreatorPlatform;
    return result;
  }

  async update(id: string, updateDto: UpdateContentCreatorDto, userId?: string) {
    const existingCreator = await this.contentCreatorRepository.findById(id);
    if (!existingCreator) {
      throw new NotFoundException(`Content creator with ID ${id} not found`);
    }

    const { categoryIds, tagIds, ratioId, ...data } = updateDto;

    const updateData: Prisma.ContentCreatorUpdateInput = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = (data.name as unknown as Prisma.InputJsonValue);
    if (data.quote !== undefined) {
      updateData.quote = data.quote ? (data.quote as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ? (data.description as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.mainLink !== undefined) updateData.mainLink = data.mainLink;
    if (data.photoUrls !== undefined) {
      updateData.photoUrls = data.photoUrls ? (data.photoUrls as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
    }
    if (data.position !== undefined) updateData.position = data.position;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.contentFormats !== undefined) updateData.contentFormats = data.contentFormats;
    if (data.tone !== undefined) updateData.tone = data.tone ?? 0;
    
    // Если статус меняется с 'user_added' на другой, устанавливаем publishedBy
    if (data.status !== undefined && data.status !== existingCreator.status) {
      updateData.status = data.status;
      if (existingCreator.status === 'user_added' && data.status !== 'user_added' && userId) {
        updateData.publishedBy = { connect: { id: userId } };
      }
      
      // Record status change in history
      await this.prisma.contentCreatorStatusHistory.create({
        data: {
          contentCreatorId: id,
          previousStatus: existingCreator.status,
          newStatus: data.status,
          changedById: userId || null,
        },
      });
    }

    // Handle JSON fields
    if (data.audience !== undefined) {
      updateData.audience = (data.audience as Prisma.InputJsonValue) || Prisma.JsonNull;
    }
    if (data.metrics !== undefined) {
      updateData.metrics = (data.metrics as Prisma.InputJsonValue) || Prisma.JsonNull;
    }
    if (data.piterTest !== undefined) {
      updateData.piterTest = data.piterTest || null;
    }

    // Handle categories
    if (categoryIds !== undefined) {
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.length > 0
          ? categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            }))
          : [],
      };
    }

    // Handle tags
    if (tagIds !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tagIds.length > 0
          ? tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            }))
          : [],
      };
    }

    // Handle ratio (single value)
    if (ratioId !== undefined) {
      if (ratioId) {
        // Connect or update the ratio
        updateData.ratio = {
          upsert: {
            create: {
              ratio: { connect: { id: ratioId } },
            },
            update: {
              ratio: { connect: { id: ratioId } },
            },
          },
        };
      } else {
        // Remove the ratio if ratioId is empty/null
        updateData.ratio = {
          delete: true,
        };
      }
    }

    await this.contentCreatorRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updatePositions(positions: Array<{ id: string; position: number }>) {
    try {
      const updates = positions.map(({ id, position }) =>
        this.contentCreatorRepository.update(id, { position }),
      );
      await Promise.all(updates);
      return { success: true, updated: positions.length };
    } catch (error) {
      console.error('Error updating positions:', error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    return this.contentCreatorRepository.delete(id);
  }

  async addPlatform(contentCreatorId: string, platformId: string, url: string, description?: any) {
    await this.findOne(contentCreatorId); // Check if content creator exists
    
    // Check if platform exists
    const platform = await this.prisma.platform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      throw new NotFoundException(`Platform with ID ${platformId} not found`);
    }

    return this.prisma.contentCreatorPlatform.create({
      data: {
        contentCreatorId,
        platformId,
        url,
        description: description ? (description as unknown as Prisma.InputJsonValue) : null,
      },
      include: {
        platform: true,
      },
    });
  }

  async updatePlatform(id: string, updateDto: { url?: string; description?: any }) {
    const platform = await this.prisma.contentCreatorPlatform.findUnique({
      where: { id },
      include: { platform: true },
    });
    if (!platform) {
      throw new NotFoundException(`Content creator platform with ID ${id} not found`);
    }

    const updateData: Prisma.ContentCreatorPlatformUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateDto.url !== undefined) updateData.url = updateDto.url;
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description 
        ? (updateDto.description as unknown as Prisma.InputJsonValue) 
        : null;
    }

    return this.prisma.contentCreatorPlatform.update({
      where: { id },
      data: updateData,
      include: {
        platform: true,
      },
    });
  }

  async removePlatform(id: string) {
    const platform = await this.prisma.contentCreatorPlatform.findUnique({
      where: { id },
    });
    if (!platform) {
      throw new NotFoundException(`Content creator platform with ID ${id} not found`);
    }
    return this.prisma.contentCreatorPlatform.delete({
      where: { id },
    });
  }

  async addPiterTestProof(contentCreatorId: string, url?: string, imageUrl?: string, description?: any) {
    await this.findOne(contentCreatorId); // Check if content creator exists

    const proof = await this.prisma.piterTestProof.create({
      data: {
        contentCreatorId,
        url: url || null,
        imageUrl: imageUrl || null,
        description: description ? (description as unknown as Prisma.InputJsonValue) : null,
      },
    });
    return {
      ...proof,
      imageUrl: this.getFullImageUrl(proof.imageUrl),
      description: proof.description as any,
    };
  }

  private getFullImageUrl(imageUrl: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${baseUrl}${imageUrl}`;
  }

  async updatePiterTestProof(id: string, updateDto: { url?: string; imageUrl?: string; description?: any }) {
    const proof = await this.prisma.piterTestProof.findUnique({
      where: { id },
    });
    if (!proof) {
      throw new NotFoundException(`Piter test proof with ID ${id} not found`);
    }

    const updateData: Prisma.PiterTestProofUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateDto.url !== undefined) updateData.url = updateDto.url || null;
    if (updateDto.imageUrl !== undefined) updateData.imageUrl = updateDto.imageUrl || null;
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description 
        ? (updateDto.description as unknown as Prisma.InputJsonValue) 
        : null;
    }

    const updated = await this.prisma.piterTestProof.update({
      where: { id },
      data: updateData,
    });
    return {
      ...updated,
      imageUrl: this.getFullImageUrl(updated.imageUrl),
      description: updated.description as any,
    };
  }

  async removePiterTestProof(id: string) {
    const proof = await this.prisma.piterTestProof.findUnique({
      where: { id },
    });
    if (!proof) {
      throw new NotFoundException(`Piter test proof with ID ${id} not found`);
    }
    return this.prisma.piterTestProof.delete({
      where: { id },
    });
  }

  async getStatusHistory(contentCreatorId: string) {
    await this.findOne(contentCreatorId); // Check if exists
    
    try {
      const history = await this.prisma.contentCreatorStatusHistory.findMany({
        where: { contentCreatorId },
        include: {
          changedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // Order by creation time (oldest first) to show full history from creation
        },
      });

      // If no history found, throw an error instead of returning empty array
      if (history.length === 0) {
        throw new NotFoundException(`No status history found for content creator with ID ${contentCreatorId}. This should not happen - every creator must have at least one status history entry from creation.`);
      }

      return history.map((item) => ({
        id: item.id,
        time: item.createdAt,
        who: item.changedBy 
          ? `${item.changedBy.firstName || ''} ${item.changedBy.lastName || ''}`.trim() || item.changedBy.email || 'Unknown'
          : 'Anonymous',
        previousStatus: item.previousStatus || '-',
        newStatus: item.newStatus,
        changedBy: item.changedBy ? {
          id: item.changedBy.id,
          email: item.changedBy.email,
          firstName: item.changedBy.firstName,
          lastName: item.changedBy.lastName,
        } : null,
      }));
    } catch (error) {
      console.error('Error fetching status history:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch status history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
