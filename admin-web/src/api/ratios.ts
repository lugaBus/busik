import apiClient from './client';
import { I18nText } from '@/utils/i18n';

export interface Ratio {
  id: string;
  name: I18nText;
  slug: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatioDto {
  name: I18nText;
  slug?: string;
  description?: I18nText;
}

export interface UpdateRatioDto extends Partial<CreateRatioDto> {}

export const ratiosApi = {
  async getAll(): Promise<Ratio[]> {
    const response = await apiClient.get('/admin/ratios');
    return response.data;
  },

  async getById(id: string): Promise<Ratio> {
    const response = await apiClient.get(`/admin/ratios/${id}`);
    return response.data;
  },

  async create(data: CreateRatioDto): Promise<Ratio> {
    const response = await apiClient.post('/admin/ratios', data);
    return response.data;
  },

  async update(id: string, data: UpdateRatioDto): Promise<Ratio> {
    const response = await apiClient.patch(`/admin/ratios/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/ratios/${id}`);
  },
};
