import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface Category {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
}

export interface Tag {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
}

export interface Ratio {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
}

export interface ContentCreator {
  id: string;
  name: I18nText;
  quote?: I18nText;
  description?: I18nText;
  locale: string;
  mainLink?: string;
  photoUrl?: string;
  photoUrls?: string[];
  position?: number;
  categories: Category[];
  tags: Tag[];
  ratios?: Ratio[];
  contentFormats: string[];
  tone: number;
  platforms?: {
    youtube?: { url: string; followers: number };
    telegram?: { url: string; followers: number };
    instagram?: { url: string; followers: number };
    twitter?: { url: string; followers: number };
  };
  audience?: {
    age?: number[];
    geo?: string[];
    level?: string[];
  };
  rating?: number;
  metrics?: {
    engagementRate?: number;
    postingFrequency?: string;
  };
  piterTest?: {
    irony?: number;
    depth?: number;
    controversy?: number;
    intellectualDensity?: number;
  };
  status: 'active' | 'inactive' | 'pending';
  proofs?: Proof[];
  createdAt: string;
  updatedAt: string;
}

export interface Proof {
  id: string;
  contentCreatorId: string;
  url?: string;
  imageUrl?: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const contentCreatorsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    ratio?: string;
    sortBy?: 'name' | 'rating' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ContentCreator>> {
    const response = await apiClient.get('/public/content/creators', { params });
    return response.data;
  },

  async getById(id: string): Promise<ContentCreator> {
    const response = await apiClient.get(`/public/content/creators/${id}`);
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get('/public/content/categories');
    return response.data;
  },

  async getRatios(): Promise<Ratio[]> {
    const response = await apiClient.get('/public/content/ratios');
    return response.data;
  },

  async getTags(): Promise<Tag[]> {
    // Note: Tags endpoint may not exist yet, returning empty array for now
    try {
      const response = await apiClient.get('/public/content/tags');
      return response.data;
    } catch {
      return [];
    }
  },

  async getPlatforms(): Promise<any[]> {
    // Note: Platforms endpoint may not exist yet, returning empty array for now
    try {
      const response = await apiClient.get('/public/content/platforms');
      return response.data;
    } catch {
      return [];
    }
  },
};
