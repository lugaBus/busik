import apiClient from './client';
import { I18nText } from './contentCreators';

export interface Tag {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagDto {
  name: I18nText;
  slug?: string;
  description?: I18nText;
}

export interface UpdateTagDto extends Partial<CreateTagDto> {}

export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    const response = await apiClient.get('/admin/tags');
    return response.data;
  },

  async getById(id: string): Promise<Tag> {
    const response = await apiClient.get(`/admin/tags/${id}`);
    return response.data;
  },

  async create(data: CreateTagDto): Promise<Tag> {
    const response = await apiClient.post('/admin/tags', data);
    return response.data;
  },

  async update(id: string, data: UpdateTagDto): Promise<Tag> {
    const response = await apiClient.patch(`/admin/tags/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/tags/${id}`);
  },
};
