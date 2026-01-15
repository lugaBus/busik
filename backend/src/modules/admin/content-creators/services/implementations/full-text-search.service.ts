import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { IContentCreatorSearchService } from '../interfaces/content-creator-search.interface';

@Injectable()
export class FullTextSearchService implements IContentCreatorSearchService {
  constructor(private prisma: PrismaService) {}

  async searchByName(searchTerm: string): Promise<string[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const searchPattern = `%${normalizedSearchTerm}%`;

    try {
      // Use raw SQL to search across all language variants of the name JSON field
      const results = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id 
        FROM content_creators
        WHERE
          LOWER(name->>'en') LIKE ${searchPattern}
          OR LOWER(name->>'ua') LIKE ${searchPattern}
          OR LOWER(name->>'ru') LIKE ${searchPattern}
          OR LOWER(id) LIKE ${searchPattern}
      `;

      return results.map((row) => row.id);
    } catch (error) {
      console.error('Full-text search error:', error);
      // Return empty array on error to prevent breaking the application
      return [];
    }
  }
}
