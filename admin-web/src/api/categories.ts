import apiClient from './client';
import { I18nText } from './contentCreators';

export interface Category {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: I18nText;
  slug?: string;
  description?: I18nText;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get('/admin/categories');
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await apiClient.get(`/admin/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post('/admin/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.patch(`/admin/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
