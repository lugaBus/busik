import apiClient from './client';
import { ContentCreatorPlatform } from './platforms';
import { PiterTestProof } from './piterTestProofs';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface I18nText {
  en: string;
  ua: string;
  ru: string;
}

export interface Ratio {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
}

export interface Proof {
  id: string;
  contentCreatorId: string;
  url?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCreator {
  id: string;
  name: I18nText;
  quote?: I18nText;
  description?: I18nText;
  locale: string;
  mainLink?: string;
  photoUrls?: string[];
  rating?: number;
  categories: Category[];
  tags: Tag[];
  ratios: Ratio[];
  platforms: ContentCreatorPlatform[];
  piterTest?: string; // True, False, Unknown
  piterTestProofs: PiterTestProof[];
  proofs: Proof[];
  contentFormats: string[];
  tone: number;
  audience?: {
    age?: number[];
    geo?: string[];
    level?: string[];
  };
  metrics?: {
    engagementRate?: number;
    postingFrequency?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'user_added';
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentCreatorDto {
  name: I18nText;
  quote?: I18nText;
  description?: I18nText;
  locale?: string;
  rating?: number;
  ratioId?: string;
  mainLink?: string;
  categoryIds?: string[];
  tagIds?: string[];
  contentFormats?: string[];
  tone?: number;
  platforms?: ContentCreator['platforms'];
  audience?: ContentCreator['audience'];
  metrics?: ContentCreator['metrics'];
  piterTest?: ContentCreator['piterTest'];
  status?: 'active' | 'inactive' | 'pending' | 'user_added';
}

export interface UpdateContentCreatorDto extends Partial<CreateContentCreatorDto> {}

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
    status?: string;
    category?: string;
    ratio?: string;
    sortBy?: 'name' | 'rating' | 'status' | 'position' | 'createdAt' | 'categories' | 'ratios';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ContentCreator>> {
    const response = await apiClient.get('/admin/content-creators', { params });
    return response.data;
  },

  async getById(id: string): Promise<ContentCreator> {
    const response = await apiClient.get(`/admin/content-creators/${id}`);
    return response.data;
  },

  async create(data: CreateContentCreatorDto): Promise<ContentCreator> {
    const response = await apiClient.post('/admin/content-creators', data);
    return response.data;
  },

  async update(id: string, data: UpdateContentCreatorDto): Promise<ContentCreator> {
    const response = await apiClient.patch(`/admin/content-creators/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/${id}`);
  },

  async addPhoto(id: string, file: File): Promise<ContentCreator> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/admin/content-creators/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async removePhoto(id: string, photoIndex: number): Promise<void> {
    await apiClient.delete(`/admin/content-creators/${id}/photo/${photoIndex}`);
  },

  async updatePositions(positions: Array<{ id: string; position: number }>): Promise<void> {
    await apiClient.patch('/admin/content-creators/positions', { positions });
  },

  async getStatusHistory(id: string): Promise<StatusHistoryItem[]> {
    const response = await apiClient.get(`/admin/content-creators/${id}/status-history`);
    return response.data;
  },
};

export interface StatusHistoryItem {
  id: string;
  time: string;
  who: string;
  previousStatus: string;
  newStatus: string;
  changedBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
}
