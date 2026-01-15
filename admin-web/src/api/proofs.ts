import apiClient from './client';

import { I18nText } from '@/utils/i18n';

export interface Proof {
  id: string;
  contentCreatorId: string;
  url?: string;
  imageUrl?: string;
  description?: I18nText;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProofDto {
  url?: string;
  imageUrl?: string;
  description?: I18nText;
}

export interface UpdateProofDto extends Partial<CreateProofDto> {}

export const proofsApi = {
  async getByCreator(contentCreatorId: string): Promise<Proof[]> {
    const response = await apiClient.get(`/admin/content-creators/${contentCreatorId}/proofs`);
    return response.data;
  },

  async getById(proofId: string): Promise<Proof> {
    const response = await apiClient.get(`/admin/content-creators/proofs/${proofId}`);
    return response.data;
  },

  async create(contentCreatorId: string, data: CreateProofDto): Promise<Proof> {
    const response = await apiClient.post(`/admin/content-creators/${contentCreatorId}/proofs`, data);
    return response.data;
  },

  async update(proofId: string, data: UpdateProofDto): Promise<Proof> {
    const response = await apiClient.patch(`/admin/content-creators/proofs/${proofId}`, data);
    return response.data;
  },

  async delete(proofId: string): Promise<void> {
    await apiClient.delete(`/admin/content-creators/proofs/${proofId}`);
  },

  async uploadImage(proofId: string, file: File): Promise<Proof> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      `/admin/content-creators/proofs/${proofId}/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
