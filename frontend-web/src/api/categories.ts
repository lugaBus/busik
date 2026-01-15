import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface Category {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get('/admin/categories');
    return response.data;
  },
};
