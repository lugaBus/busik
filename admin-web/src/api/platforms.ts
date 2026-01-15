import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface Platform {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformDto {
  name: I18nText;
  slug?: string;
  description?: I18nText;
}

export interface UpdatePlatformDto extends Partial<CreatePlatformDto> {}

export interface ContentCreatorPlatform {
  id: string;
  contentCreatorId: string;
  platform: Platform;
  url: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentCreatorPlatformDto {
  platformId: string;
  url: string;
  description?: I18nText;
}

export interface UpdateContentCreatorPlatformDto extends Partial<CreateContentCreatorPlatformDto> {}

export const platformsApi = {
  async getAll(): Promise<Platform[]> {
    const response = await apiClient.get('/admin/platforms');
    return response.data;
  },

  async getById(id: string): Promise<Platform> {
    const response = await apiClient.get(`/admin/platforms/${id}`);
    return response.data;
  },

  async create(data: CreatePlatformDto): Promise<Platform> {
    const response = await apiClient.post('/admin/platforms', data);
    return response.data;
  },

  async update(id: string, data: UpdatePlatformDto): Promise<Platform> {
    const response = await apiClient.patch(`/admin/platforms/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/platforms/${id}`);
  },
};

export const contentCreatorPlatformsApi = {
  async getByCreator(contentCreatorId: string): Promise<ContentCreatorPlatform[]> {
    const response = await apiClient.get(`/admin/content-creators/${contentCreatorId}/platforms`);
    return response.data;
  },

  async add(contentCreatorId: string, data: CreateContentCreatorPlatformDto): Promise<ContentCreatorPlatform> {
    const response = await apiClient.post(`/admin/content-creators/${contentCreatorId}/platforms`, data);
    return response.data;
  },

  async update(platformId: string, data: UpdateContentCreatorPlatformDto): Promise<ContentCreatorPlatform> {
    const response = await apiClient.patch(`/admin/content-creators/platforms/${platformId}`, data);
    return response.data;
  },

  async delete(platformId: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/platforms/${platformId}`);
  },
};
